/**
 * server.js - Express + WebSocket backend server
 * 
 * Bridges the C simulator engine to the React frontend.
 * - Express serves REST API for simulation control
 * - WebSocket streams real-time JSON events to connected clients
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const logger = require('./utils/logger');
const EngineManager = require('./services/engine');
const simulationRoutes = require('./routes/simulation');

const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:3001', 'http://127.0.0.1:5173'];

// ── Express Setup ──────────────────────────────────────────────
const app = express();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in dev; restrict in production
    }
  }
}));

// ── Serve Frontend (Production Build) ──────────────────────────
const path = require('path');
const FRONTEND_DIST = path.join(process.cwd(), 'frontend/dist');

logger.info(`Checking frontend at: ${FRONTEND_DIST}`);
if (!require('fs').existsSync(FRONTEND_DIST)) {
  logger.warn(`Warning: ${FRONTEND_DIST} not found, trying fallback...`);
}

app.use(express.static(FRONTEND_DIST));
// ───────────────────────────────────────────────────────────────


app.use(express.json());

// ── Simple rate limiter ────────────────────────────────────────
const rateLimits = new Map();
function rateLimit(key, windowMs = 2000) {
  const now = Date.now();
  const lastCall = rateLimits.get(key) || 0;
  if (now - lastCall < windowMs) return false;
  rateLimits.set(key, now);
  return true;
}

// ── Sessions Manager ───────────────────────────────────────────
const sessions = new Map(); // sessionId -> { engine, ws }

/**
 * Get or create an engine for a session.
 */
function getEngine(sessionId) {
  if (!sessionId) return null;
  if (!sessions.has(sessionId)) {
    logger.info(`Creating new engine for session: ${sessionId}`);
    const engine = new EngineManager();
    sessions.set(sessionId, { engine, ws: null });
    
    // Wire up events for this specific engine
    engine.on('data', (event) => {
      const session = sessions.get(sessionId);
      if (session?.ws && session.ws.readyState === 1) {
        session.ws.send(JSON.stringify(event));
      }
    });

    engine.on('close', (info) => {
      const session = sessions.get(sessionId);
      if (session?.ws && session.ws.readyState === 1) {
        session.ws.send(JSON.stringify({ type: 'simulation_end', ...info }));
      }
    });

    engine.on('error', (error) => {
      const session = sessions.get(sessionId);
      if (session?.ws && session.ws.readyState === 1) {
        session.ws.send(JSON.stringify({ type: 'error', ...error }));
      }
    });
  }
  return sessions.get(sessionId).engine;
}

// ── REST API Routes ────────────────────────────────────────────
// Middleware to inject the correct engine based on X-Session-ID header
app.use('/api', (req, res, next) => {
  const sessionId = req.headers['x-session-id'];
  if (!sessionId && req.path !== '/health') {
    return res.status(401).json({ error: 'Missing X-Session-ID header' });
  }
  req.engine = getEngine(sessionId);
  next();
}, simulationRoutes(null, rateLimit));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    sessions: sessions.size
  });
});

// SPA fallback — serve index.html for any non-API route
app.get('*', (req, res) => {
  const indexPath = path.join(FRONTEND_DIST, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      logger.error(`Error sending index.html: ${err.message}`);
      res.status(500).send("Frontend build not found. Please check deployment logs.");
    }
  });
});


// ── HTTP + WebSocket Server ────────────────────────────────────
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let clients = new Set();

// ── WebSocket Heartbeat ────────────────────────────────────────
const HEARTBEAT_INTERVAL = 30000;
const heartbeat = setInterval(() => {
  for (const client of clients) {
    if (client.isAlive === false) {
      logger.info('Terminating dead WebSocket connection');
      clients.delete(client);
      return client.terminate();
    }
    client.isAlive = false;
    client.ping();
  }
}, HEARTBEAT_INTERVAL);

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    logger.warn('WebSocket connection attempted without sessionId');
    return ws.terminate();
  }

  ws.isAlive = true;
  ws.sessionId = sessionId;
  
  const engine = getEngine(sessionId);
  const session = sessions.get(sessionId);
  session.ws = ws;

  logger.info(`WebSocket client connected (session: ${sessionId}, total: ${sessions.size})`);

  // Send current status on connect
  ws.send(JSON.stringify({
    type: 'status',
    ...engine.getStatus()
  }));

  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('close', () => {
    logger.info(`WebSocket client disconnected (session: ${sessionId})`);
    const session = sessions.get(sessionId);
    if (session) {
      if (session.engine.isRunning) {
        session.engine.stop();
      }
      sessions.delete(sessionId);
    }
  });

  ws.on('error', (err) => {
    logger.error(`WebSocket error for session ${sessionId}: ${err.message}`);
    sessions.delete(sessionId);
  });
});

// ── Engine Event Handlers ──────────────────────────────────────
// (Handled individually within getEngine() now)

// ── Graceful Shutdown ──────────────────────────────────────────
function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  
  clearInterval(heartbeat);
  
  // Stop all running simulations
  for (const [sessionId, session] of sessions) {
    if (session.engine.isRunning) {
      session.engine.stop();
    }
    if (session.ws) {
      session.ws.close(1001, 'Server shutting down');
    }
  }

  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ── Start Server ───────────────────────────────────────────────
server.listen(PORT, () => {
  logger.info(`Backend server running on http://localhost:${PORT}`);
  logger.info(`WebSocket server on ws://localhost:${PORT}`);
});

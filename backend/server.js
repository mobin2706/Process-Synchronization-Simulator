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

// ── Engine Manager ─────────────────────────────────────────────
const engine = new EngineManager();

// ── REST API Routes ────────────────────────────────────────────
app.use('/api', simulationRoutes(engine, rateLimit));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    connections: clients.size,
    simulationRunning: engine.isRunning
  });
});

// ── Serve Frontend (Production Build) ──────────────────────────
const path = require('path');
const FRONTEND_DIST = path.resolve(__dirname, '../frontend/dist');

logger.info(`Serving static files from: ${FRONTEND_DIST}`);
if (!require('fs').existsSync(path.join(FRONTEND_DIST, 'index.html'))) {
  logger.error(`CRITICAL: index.html not found at ${path.join(FRONTEND_DIST, 'index.html')}`);
}

app.use(express.static(FRONTEND_DIST));
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

wss.on('connection', (ws) => {
  ws.isAlive = true;
  clients.add(ws);
  logger.info(`WebSocket client connected (total: ${clients.size})`);

  // Send current status on connect
  ws.send(JSON.stringify({
    type: 'status',
    ...engine.getStatus()
  }));

  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('close', () => {
    clients.delete(ws);
    logger.info(`WebSocket client disconnected (total: ${clients.size})`);
  });

  ws.on('error', (err) => {
    logger.error(`WebSocket error: ${err.message}`);
    clients.delete(ws);
  });
});

/**
 * Broadcast a message to all connected WebSocket clients.
 */
function broadcast(data) {
  const message = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  }
}

// ── Engine Event Handlers ──────────────────────────────────────

// Stream simulation data to all WebSocket clients
engine.on('data', (event) => {
  broadcast(event);
});

// Notify clients when simulation ends
engine.on('close', (info) => {
  broadcast({ type: 'simulation_end', ...info });
});

// Notify clients on errors
engine.on('error', (error) => {
  broadcast({ type: 'error', ...error });
});

// ── Graceful Shutdown ──────────────────────────────────────────
function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  
  clearInterval(heartbeat);
  
  // Stop any running simulation
  if (engine.isRunning) {
    engine.stop();
  }

  // Close all WebSocket connections
  for (const client of clients) {
    client.close(1001, 'Server shutting down');
  }

  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  // Force exit after 5 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ── Start Server ───────────────────────────────────────────────
server.listen(PORT, () => {
  logger.info(`Backend server running on http://localhost:${PORT}`);
  logger.info(`WebSocket server on ws://localhost:${PORT}`);
});

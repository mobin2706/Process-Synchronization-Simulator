/**
 * simulation.js - REST API routes for simulation control
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

module.exports = function(engine, rateLimit) {

  /**
   * POST /api/start-simulation
   * Compiles (if needed) and starts the C simulator.
   * Body: { producers, consumers, bufferSize, iterations, delay }
   */
  router.post('/start-simulation', (req, res) => {
    const startMs = Date.now();

    if (req.engine.isRunning) {
      return res.status(409).json({ error: 'Simulation already running' });
    }

    // Rate limit: prevent rapid-fire starts
    if (rateLimit && !rateLimit('start-simulation', 2000)) {
      return res.status(429).json({ error: 'Too many requests. Please wait before starting again.' });
    }

    // Validate and sanitize input
    const producers  = parseInt(req.body.producers);
    const consumers  = parseInt(req.body.consumers);
    const bufferSize = parseInt(req.body.bufferSize);
    const iterations = parseInt(req.body.iterations);
    const delay      = parseInt(req.body.delay);

    const errors = [];
    if (isNaN(producers)  || producers  < 1 || producers  > 16) errors.push('producers must be 1-16');
    if (isNaN(consumers)  || consumers  < 1 || consumers  > 16) errors.push('consumers must be 1-16');
    if (isNaN(bufferSize) || bufferSize < 1 || bufferSize > 64) errors.push('bufferSize must be 1-64');
    if (isNaN(iterations) || iterations < 1 || iterations > 100) errors.push('iterations must be 1-100');
    if (isNaN(delay)      || delay      < 10 || delay     > 10000) errors.push('delay must be 10-10000ms');

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Invalid parameters', details: errors });
    }

    const config = { producers, consumers, bufferSize, iterations, delay };

    // Compile the C engine first
    if (!req.engine.compile()) {
      return res.status(500).json({ error: 'Failed to compile C engine' });
    }

    logger.info(`Starting simulation: ${JSON.stringify(config)} (request took ${Date.now() - startMs}ms)`);
    req.engine.start(config);
    res.json({ status: 'started', config });
  });

  /**
   * POST /api/stop-simulation
   * Stops the running simulation.
   */
  router.post('/stop-simulation', (req, res) => {
    if (!req.engine.isRunning) {
      return res.status(409).json({ error: 'No simulation running' });
    }

    req.engine.stop();
    res.json({ status: 'stopping' });
  });

  /**
   * POST /api/config
   * Validate and preview simulation parameters.
   */
  router.post('/config', (req, res) => {
    const config = {
      producers:  parseInt(req.body.producers)  || 2,
      consumers:  parseInt(req.body.consumers)  || 2,
      bufferSize: parseInt(req.body.bufferSize) || 5,
      iterations: parseInt(req.body.iterations) || 10,
      delay:      parseInt(req.body.delay)      || 500
    };

    res.json({ valid: true, config });
  });

  /**
   * GET /api/status
   * Returns current simulation status.
   */
  router.get('/status', (req, res) => {
    res.json(req.engine.getStatus());
  });

  return router;
};

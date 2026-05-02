/**
 * engine.js - C Engine Process Manager
 * 
 * Manages the lifecycle of the C simulator process:
 * - Compiles the C source via Makefile (with mtime caching)
 * - Spawns the simulator with configurable parameters
 * - Parses JSON lines from stdout and emits events
 * - Handles process cleanup and error recovery
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');
const logger = require('../utils/logger');

const CORE_DIR = path.resolve(__dirname, '../../core-c');
const SIMULATOR = path.join(CORE_DIR, 'simulator');
const SRC_DIR = path.join(CORE_DIR, 'src');
const INC_DIR = path.join(CORE_DIR, 'include');

class EngineManager extends EventEmitter {
  constructor() {
    super();
    this.process = null;
    this.isRunning = false;
    this.startTime = null;
    this.eventCount = 0;
    this.lastCompileTime = 0;
  }

  /**
   * Check if source files have been modified since last compile.
   */
  _sourcesModified() {
    try {
      if (!fs.existsSync(SIMULATOR)) return true;

      const binaryMtime = fs.statSync(SIMULATOR).mtimeMs;
      
      const checkDir = (dir) => {
        if (!fs.existsSync(dir)) return false;
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          if (fs.statSync(filePath).mtimeMs > binaryMtime) return true;
        }
        return false;
      };

      return checkDir(SRC_DIR) || checkDir(INC_DIR);
    } catch {
      return true; // Compile on error
    }
  }

  /**
   * Compile the C engine using make.
   * Only recompiles if source files changed.
   * @returns {boolean} true if compilation succeeded
   */
  compile() {
    if (!this._sourcesModified()) {
      logger.info('C engine binary is up to date — skipping compilation');
      return true;
    }

    try {
      logger.info('Compiling C engine...');
      const startMs = Date.now();
      execSync('make clean && make all', {
        cwd: CORE_DIR,
        stdio: 'pipe',
        timeout: 30000
      });
      const elapsed = Date.now() - startMs;
      logger.info(`C engine compiled successfully in ${elapsed}ms`);
      this.lastCompileTime = Date.now();
      return true;
    } catch (error) {
      logger.error(`Compilation failed: ${error.message}`);
      this.emit('error', { type: 'compilation', message: error.message });
      return false;
    }
  }

  /**
   * Start the simulator with the given configuration.
   * @param {Object} config - Simulation parameters
   */
  start(config = {}) {
    if (this.isRunning) {
      logger.warn('Simulation already running');
      return false;
    }

    const {
      producers = 2,
      consumers = 2,
      bufferSize = 5,
      iterations = 10,
      delay = 500
    } = config;

    const args = [
      '--producers', String(producers),
      '--consumers', String(consumers),
      '--buffer-size', String(bufferSize),
      '--iterations', String(iterations),
      '--delay', String(delay)
    ];

    logger.info(`Starting simulator: ${SIMULATOR} ${args.join(' ')}`);

    this.process = spawn(SIMULATOR, args, {
      cwd: CORE_DIR,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.isRunning = true;
    this.startTime = Date.now();
    this.eventCount = 0;

    let buffer = '';

    // Parse JSON lines from stdout
    this.process.stdout.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            const event = JSON.parse(line);
            this.eventCount++;
            this.emit('data', event);
          } catch (e) {
            logger.warn(`Failed to parse: ${line}`);
          }
        }
      }
    });

    this.process.stderr.on('data', (data) => {
      logger.error(`Simulator stderr: ${data.toString()}`);
    });

    this.process.on('close', (code) => {
      const duration = Date.now() - this.startTime;
      logger.info(`Simulator exited (code=${code}) after ${duration}ms, ${this.eventCount} events`);
      this.isRunning = false;
      this.process = null;
      this.emit('close', { code, duration, eventCount: this.eventCount });
    });

    this.process.on('error', (err) => {
      logger.error(`Simulator error: ${err.message}`);
      this.isRunning = false;
      this.process = null;
      this.emit('error', { type: 'process', message: err.message });
    });

    return true;
  }

  /**
   * Stop the running simulator.
   */
  stop() {
    if (!this.isRunning || !this.process) {
      logger.warn('No simulation running');
      return false;
    }

    logger.info('Stopping simulator...');
    this.process.kill('SIGTERM');

    // Force kill after 3 seconds if it doesn't stop
    setTimeout(() => {
      if (this.process) {
        logger.warn('Force killing simulator');
        this.process.kill('SIGKILL');
      }
    }, 3000);

    return true;
  }

  /**
   * Get the current status.
   */
  getStatus() {
    return {
      running: this.isRunning,
      uptime: this.isRunning ? Date.now() - this.startTime : 0,
      eventCount: this.eventCount,
      lastCompileTime: this.lastCompileTime
    };
  }
}

module.exports = EngineManager;

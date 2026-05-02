/**
 * useSimulationStore.js - Zustand store for Simulation State & Playback Engine
 * 
 * Manages backend simulation state, frontend playback engine, UI modes,
 * and derived metrics for the Process Synchronization Simulator.
 */

import { create } from 'zustand';
import { WS_URL } from '../utils/constants';

let ws = null;
let reconnectTimer = null;
let playbackInterval = null;

export const useSimulationStore = create((set, get) => ({
  // ── Connection State ─────────────────────────────────────────
  connected: false,
  connectionAttempts: 0,
  reconnecting: false,
  
  // ── Backend Simulation State ─────────────────────────────────
  simStatus: 'idle', // idle, running, ended, error
  simConfig: null,
  lastError: null,
  
  // ── Frontend Playback State ──────────────────────────────────
  playbackState: 'playing', // playing, paused
  playbackSpeed: 1, // 0.25, 0.5, 1, 1.5, 2
  eventQueue: [], // Events received from backend but not yet played
  playedEvents: [], // Events already played (for timeline)
  latestEvent: null, // Most recently played 'event' type
  threadStates: {}, // Current state of all threads
  
  // ── UI Mode State ────────────────────────────────────────────
  simulationMode: 'normal', // 'normal' | 'step'
  presentationMode: false,
  deadlockMode: false,
  
  // ── Metrics (Based on played events) ─────────────────────────
  metrics: {
    totalProduced: 0,
    totalConsumed: 0,
    startTime: null,
    throughput: 0,
    history: []
  },

  // ── Actions: WebSocket Management ────────────────────────────
  connect: () => {
    if (ws?.readyState === WebSocket.OPEN) return;
    set({ reconnecting: get().connectionAttempts > 0 });
    ws = new WebSocket(WS_URL);

    ws.onopen = () => set({
      connected: true,
      connectionAttempts: 0,
      reconnecting: false,
      lastError: null
    });

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.type === 'start') {
          set({
            simConfig: data,
            simStatus: 'running',
            eventQueue: [],
            playedEvents: [],
            threadStates: {},
            latestEvent: null,
            metrics: {
              totalProduced: 0,
              totalConsumed: 0,
              startTime: Date.now(),
              throughput: 0,
              history: []
            }
          });
        } else if (data.type === 'end' || data.type === 'simulation_end') {
          set({ simStatus: 'ended' });
        } else if (data.type === 'error') {
          set({ simStatus: 'error', lastError: data.message || 'Unknown error' });
        } else if (data.type === 'event' || data.type === 'state') {
          set((state) => ({ eventQueue: [...state.eventQueue, data] }));
        }
      } catch (e) {
        console.warn('WS Parse Error:', e);
      }
    };

    ws.onclose = () => {
      set((state) => ({
        connected: false,
        connectionAttempts: state.connectionAttempts + 1,
        reconnecting: true
      }));
      reconnectTimer = setTimeout(get().connect, 2000);
    };

    ws.onerror = () => ws.close();
  },

  disconnect: () => {
    clearTimeout(reconnectTimer);
    if (ws) ws.close();
  },

  reset: () => {
    set({
      eventQueue: [],
      playedEvents: [],
      latestEvent: null,
      threadStates: {},
      simConfig: null,
      simStatus: 'idle',
      playbackState: 'playing',
      lastError: null,
      deadlockMode: false,
      metrics: { totalProduced: 0, totalConsumed: 0, startTime: null, throughput: 0, history: [] }
    });
  },

  clearError: () => set({ lastError: null }),

  // ── Actions: Playback Control ────────────────────────────────
  setPlaybackState: (state) => set({ playbackState: state }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setSimulationMode: (mode) => {
    set({ simulationMode: mode });
    if (mode === 'step') {
      set({ playbackState: 'paused' });
    } else {
      set({ playbackState: 'playing' });
    }
  },
  setPresentationMode: (val) => set({ presentationMode: val }),
  setDeadlockMode: (val) => set({ deadlockMode: val }),

  clearTimeline: () => set({ playedEvents: [] }),

  exportLogs: () => {
    const { playedEvents } = get();
    const blob = new Blob([JSON.stringify(playedEvents, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation-events-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  stepForward: () => {
    const { eventQueue } = get();
    if (eventQueue.length > 0) {
      get()._processNextEvent();
    }
  },

  // ── Internal: Engine Loop ────────────────────────────────────
  _startEngine: () => {
    if (playbackInterval) clearInterval(playbackInterval);
    playbackInterval = setInterval(() => {
      const { playbackState, eventQueue, simulationMode, deadlockMode } = get();
      // In step mode or deadlock mode, don't auto-advance
      if (simulationMode === 'step' || deadlockMode) return;
      if (playbackState === 'playing' && eventQueue.length > 0) {
        get()._processNextEvent();
      }
    }, 100);
  },

  _processNextEvent: () => {
    const { eventQueue, playedEvents, metrics, threadStates } = get();
    if (eventQueue.length === 0) return;

    const event = eventQueue[0];
    const newQueue = eventQueue.slice(1);
    const updates = { eventQueue: newQueue };

    if (event.type === 'state') {
      updates.threadStates = { ...threadStates, [event.thread]: event.state };
    } else if (event.type === 'event') {
      updates.latestEvent = event;
      const newPlayed = [...playedEvents, event];
      updates.playedEvents = newPlayed.length > 200 ? newPlayed.slice(-200) : newPlayed;

      const m = { ...metrics };
      if (event.action === 'produce') m.totalProduced++;
      if (event.action === 'consume') m.totalConsumed++;
      
      if (m.startTime) {
        const elapsed = (Date.now() - m.startTime) / 1000;
        m.throughput = elapsed > 0 ? ((m.totalProduced + m.totalConsumed) / elapsed).toFixed(1) : 0;
        if (m.history.length === 0 || (Date.now() - m.history[m.history.length - 1].time) > 500) {
          m.history = [...m.history, {
            time: Date.now(),
            throughput: parseFloat(m.throughput),
            bufferUsed: event.buffer_count
          }].slice(-50);
        }
      }
      updates.metrics = m;
    }
    set(updates);
  }
}));

useSimulationStore.getState()._startEngine();

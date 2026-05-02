/**
 * constants.js - Application-wide constants
 */

const isDev = window.location.port === '5173';
export const API_BASE = isDev ? 'http://localhost:3001' : `${window.location.origin}`;
export const WS_URL = isDev ? 'ws://localhost:3001' : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;

export const DEFAULT_CONFIG = {
  producers: 2,
  consumers: 2,
  bufferSize: 5,
  iterations: 10,
  delay: 500
};

export const THREAD_STATES = {
  RUNNING: 'running',
  WAITING: 'waiting',
  BLOCKED: 'blocked',
  DONE: 'done'
};

export const UI_COLORS = {
  running: {
    hex: '#22c55e',
    text: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    glow: 'drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]',
    cssGlow: '0 0 15px rgba(34, 197, 94, 0.4)',
    cssBg: 'rgba(34, 197, 94, 0.1)',
    cssBorder: 'rgba(34, 197, 94, 0.3)'
  },
  waiting: {
    hex: '#f59e0b',
    text: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    glow: 'drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]',
    cssGlow: '0 0 15px rgba(245, 158, 11, 0.4)',
    cssBg: 'rgba(245, 158, 11, 0.1)',
    cssBorder: 'rgba(245, 158, 11, 0.3)'
  },
  blocked: {
    hex: '#ef4444',
    text: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    glow: 'drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]',
    cssGlow: '0 0 15px rgba(239, 68, 68, 0.4)',
    cssBg: 'rgba(239, 68, 68, 0.1)',
    cssBorder: 'rgba(239, 68, 68, 0.3)'
  },
  done: {
    hex: '#6b7280',
    text: 'text-gray-500',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
    glow: 'none',
    cssGlow: 'none',
    cssBg: 'rgba(107, 114, 128, 0.1)',
    cssBorder: 'rgba(107, 114, 128, 0.3)'
  },
  idle: {
    hex: '#3b82f6',
    text: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    glow: 'none',
    cssGlow: 'none',
    cssBg: 'rgba(59, 130, 246, 0.1)',
    cssBorder: 'rgba(59, 130, 246, 0.3)'
  },
};

export const STATE_LABELS = {
  running: 'Running',
  waiting: 'Waiting',
  blocked: 'Blocked',
  done: 'Done',
  idle: 'Idle'
};

export const ANIMATION_DURATIONS = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
  stagger: 0.06,
  spring: { type: 'spring', stiffness: 300, damping: 25 }
};

export const KEYBOARD_SHORTCUTS = {
  START_STOP: ' ',       // Space
  STEP: 'ArrowRight',
  SPEED_UP: 'ArrowUp',
  SPEED_DOWN: 'ArrowDown',
  PAUSE: 'p'
};

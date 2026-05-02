/**
 * useWebSocket.js - Custom hook for WebSocket connection
 * Manages connection, auto-reconnect, and message parsing.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { WS_URL } from '../utils/constants';

export function useWebSocket() {
  const [events, setEvents] = useState([]);
  const [threadStates, setThreadStates] = useState({});
  const [latestEvent, setLatestEvent] = useState(null);
  const [simConfig, setSimConfig] = useState(null);
  const [simStatus, setSimStatus] = useState('idle'); // idle, running, ended
  const [connected, setConnected] = useState(false);
  const [metrics, setMetrics] = useState({
    totalProduced: 0,
    totalConsumed: 0,
    startTime: null,
    throughput: 0
  });

  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const metricsRef = useRef(metrics);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        if (data.type === 'start') {
          setSimConfig(data);
          setSimStatus('running');
          setEvents([]);
          setThreadStates({});
          metricsRef.current = {
            totalProduced: 0,
            totalConsumed: 0,
            startTime: Date.now(),
            throughput: 0
          };
          setMetrics(metricsRef.current);
        } else if (data.type === 'event') {
          setLatestEvent(data);
          setEvents(prev => {
            const next = [...prev, data];
            return next.length > 200 ? next.slice(-200) : next;
          });

          // Update metrics
          const m = { ...metricsRef.current };
          if (data.action === 'produce') m.totalProduced++;
          if (data.action === 'consume') m.totalConsumed++;
          if (m.startTime) {
            const elapsed = (Date.now() - m.startTime) / 1000;
            m.throughput = elapsed > 0 ? ((m.totalProduced + m.totalConsumed) / elapsed).toFixed(1) : 0;
          }
          metricsRef.current = m;
          setMetrics(m);
        } else if (data.type === 'state') {
          setThreadStates(prev => ({
            ...prev,
            [data.thread]: data.state
          }));
        } else if (data.type === 'end' || data.type === 'simulation_end') {
          setSimStatus('ended');
        } else if (data.type === 'error') {
          setSimStatus('error');
        }
      } catch (e) {
        // Ignore parse errors
      }
    };

    ws.onclose = () => {
      setConnected(false);
      // Auto-reconnect after 2 seconds
      reconnectTimer.current = setTimeout(connect, 2000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, []);

  const reset = useCallback(() => {
    setEvents([]);
    setThreadStates({});
    setLatestEvent(null);
    setSimConfig(null);
    setSimStatus('idle');
    setMetrics({ totalProduced: 0, totalConsumed: 0, startTime: null, throughput: 0 });
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return {
    events,
    threadStates,
    latestEvent,
    simConfig,
    simStatus,
    connected,
    metrics,
    reset
  };
}

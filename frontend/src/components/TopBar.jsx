import { motion } from 'framer-motion';
import { Cpu, Wifi, Pause, Square, RotateCcw, ChevronDown, Monitor, Maximize2 } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { API_BASE } from '../utils/constants';

export default function TopBar() {
  const {
    simStatus, connected, simulationMode, playbackSpeed, playbackState, presentationMode,
    setSimulationMode, setPlaybackSpeed, setPlaybackState, setPresentationMode, reset
  } = useSimulationStore();

  const isRunning = simStatus === 'running';

  const handleStop = async () => {
    try { await fetch(`${API_BASE}/api/stop-simulation`, { method: 'POST' }); } catch {}
  };

  return (
    <header className="px-5 py-3 flex items-center justify-between" style={{
      background: 'rgba(13,16,51,0.8)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-glass)'
    }}>
      {/* Left: Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{
          background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
          boxShadow: '0 0 20px rgba(0,212,255,0.2)'
        }}>
          <Cpu size={20} color="#fff" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[16px] font-black text-white tracking-tight">Process Synchronization Simulator</h1>
            {connected && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{
                background: 'rgba(34, 197, 94, 0.1)', color: 'var(--state-running)',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                <motion.div animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-[var(--state-running)]" style={{ boxShadow: '0 0 8px var(--state-running)' }} />
                LIVE
              </span>
            )}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] font-medium">Real-time visualization of Producer-Consumer problem using Semaphores</p>
        </div>
      </div>

      {/* Center: Mode + Speed */}
      <div className="flex items-center gap-6 px-5 py-2 rounded-2xl" style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)'
      }}>
        {/* Mode */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Simulation Mode</span>
          <div className="relative">
            <select value={simulationMode} onChange={(e) => setSimulationMode(e.target.value)}
              className="appearance-none text-[11px] font-bold pl-3 pr-8 py-2 rounded-xl cursor-pointer outline-none transition-all hover:bg-white/5"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}>
              <option value="normal">Normal Mode</option>
              <option value="step">Step Mode</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </div>

        <div className="w-px h-6" style={{ background: 'var(--border-glass)' }} />

        {/* Speed */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Speed</span>
          <div className="flex items-center gap-3">
            <input type="range" min="0.5" max="3" step="0.5" value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="w-24 h-1.5 accent-[var(--accent-cyan)] cursor-pointer"
              style={{ background: `linear-gradient(to right, var(--accent-cyan) ${((playbackSpeed - 0.5) / 2.5) * 100}%, rgba(255,255,255,0.1) ${((playbackSpeed - 0.5) / 2.5) * 100}%)` }}
            />
            <span className="text-[12px] mono font-bold text-[var(--accent-cyan)] min-w-[35px]">{playbackSpeed}x</span>
          </div>
        </div>
      </div>

      {/* Right: Buttons */}
      <div className="flex items-center gap-3">
        <button onClick={() => setPlaybackState(playbackState === 'playing' ? 'paused' : 'playing')}
          disabled={!isRunning}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black transition-all hover:scale-105 active:scale-95"
          style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', opacity: isRunning ? 1 : 0.4 }}>
          <Pause size={13} fill="currentColor" /> PAUSE
        </button>
        <button onClick={handleStop} disabled={!isRunning}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black transition-all hover:scale-105 active:scale-95"
          style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', opacity: isRunning ? 1 : 0.4 }}>
          <Square size={13} fill="currentColor" /> STOP
        </button>
        <button onClick={reset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black transition-all hover:scale-105 active:scale-95"
          style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#a78bfa', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
          <RotateCcw size={13} /> RESET
        </button>

        <div className="w-px h-6 mx-2" style={{ background: 'var(--border-glass)' }} />

        {/* Presentation Mode */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)' }}>
          <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Presentation Mode</span>
          <button onClick={() => setPresentationMode(!presentationMode)}
            className="w-10 h-5 rounded-full relative transition-all duration-300"
            style={{ background: presentationMode ? 'var(--accent-purple)' : 'rgba(255,255,255,0.1)' }}>
            <motion.div animate={{ left: presentationMode ? '22px' : '2px' }} className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
          <Maximize2 size={14} className="text-[var(--text-muted)]" />
        </div>
      </div>
    </header>
  );
}

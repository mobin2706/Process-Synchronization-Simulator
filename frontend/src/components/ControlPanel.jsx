import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Settings, Users, UserCheck, Database, RefreshCw, Clock } from 'lucide-react';
import { API_BASE, DEFAULT_CONFIG } from '../utils/constants';
import { useSimulationStore } from '../store/useSimulationStore';

export default function ControlPanel() {
  const { connected, simStatus, reset, playbackState, setPlaybackState } = useSimulationStore();
  const [config, setConfig] = useState({ ...DEFAULT_CONFIG });
  const [loading, setLoading] = useState(false);
  const isRunning = simStatus === 'running';

  const handleStart = async () => {
    setLoading(true);
    reset();
    try {
      await fetch(`${API_BASE}/api/start-simulation`, {
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-ID': useSimulationStore.getState().sessionId
        },
        body: JSON.stringify(config)
      });
    } catch (err) { console.error('Start failed:', err); }
    setLoading(false);
  };

  const controls = [
    { key: 'producers', label: 'Producers', min: 1, max: 8, icon: Users, color: '#00d4ff' },
    { key: 'consumers', label: 'Consumers', min: 1, max: 8, icon: UserCheck, color: '#a855f7' },
    { key: 'bufferSize', label: 'Buffer Size', min: 1, max: 16, icon: Database, color: '#22c55e' },
    { key: 'iterations', label: 'Iterations', min: 1, max: 50, icon: RefreshCw, color: '#f59e0b' },
    { key: 'delay', label: 'Delay (ms)', min: 50, max: 2000, step: 50, icon: Clock, color: '#ef4444' }
  ];

  return (
    <div className="glass-card p-5 h-full flex flex-col shadow-2xl border border-white/[0.05]">
      {/* Compact Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-7 h-7 rounded bg-[var(--accent-cyan)]/10 flex items-center justify-center border border-[var(--accent-cyan)]/20">
          <Settings size={14} className="text-[var(--accent-cyan)]" />
        </div>
        <span className="text-[11px] font-black text-white uppercase tracking-[0.15em]">System Config</span>
      </div>

      {/* Optimized Sliders */}
      <div className="space-y-5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {controls.map(({ key, label, min, max, step, icon: Icon, color }) => (
          <div key={key} className="group">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-wider flex items-center gap-2 group-hover:text-white transition-colors">
                <Icon size={12} style={{ color }} /> {label}
              </label>
              <span className="text-[10px] font-black text-white bg-white/[0.05] px-2 py-0.5 rounded border border-white/[0.1] mono">
                {config[key]}
              </span>
            </div>
            <input
              type="range" min={min} max={max} step={step || 1}
              value={config[key]} disabled={isRunning}
              onChange={(e) => setConfig(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
              className="w-full h-1.5 rounded-full cursor-pointer appearance-none bg-white/[0.05]"
              style={{
                background: `linear-gradient(to right, ${color} 0%, ${color} ${((config[key] - min) / (max - min)) * 100}%, rgba(255,255,255,0.05) ${((config[key] - min) / (max - min)) * 100}%)`
              }}
            />
          </div>
        ))}
      </div>

      {/* User-Friendly Buttons */}
      <div className="mt-6 space-y-3">
        <motion.button 
          whileHover={!isRunning ? { scale: 1.02, filter: 'brightness(1.1)' } : {}}
          whileTap={!isRunning ? { scale: 0.98 } : {}}
          onClick={handleStart} 
          disabled={loading || !connected || isRunning}
          className={`w-full py-3.5 rounded-xl text-[12px] font-black flex items-center justify-center gap-2.5 shadow-lg transition-all ${
            isRunning 
              ? 'bg-white/[0.03] text-white/20 border border-white/10 cursor-not-allowed' 
              : 'bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-white border border-white/20'
          }`}>
          <Play size={16} fill={isRunning ? 'none' : 'currentColor'} /> 
          {isRunning ? 'RUNNING...' : loading ? 'WAIT...' : 'EXECUTE'}
        </motion.button>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setPlaybackState(playbackState === 'playing' ? 'paused' : 'playing')}
            disabled={!isRunning}
            className={`py-3 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 transition-all border ${
              playbackState === 'paused'
                ? 'bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/30'
                : 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30'
            } ${!isRunning && 'opacity-30 cursor-not-allowed'}`}>
            {playbackState === 'playing' ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            {playbackState === 'playing' ? 'PAUSE' : 'RESUME'}
          </button>
          
          <button 
            onClick={reset}
            className="py-3 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 transition-all bg-white/[0.05] text-white/60 border border-white/10 hover:bg-white/[0.1] hover:text-white">
            <RotateCcw size={14} /> RESET
          </button>
        </div>
      </div>
    </div>
  );
}

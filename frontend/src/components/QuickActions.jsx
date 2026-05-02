import { motion } from 'framer-motion';
import { 
  List, 
  MousePointer2, 
  Zap, 
  ChevronRight, 
  FileText, 
  Download, 
  Trash2 
} from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';

export default function QuickActions() {
  const { 
    simulationMode, 
    setSimulationMode, 
    playbackSpeed, 
    setPlaybackSpeed, 
    handleExport, 
    clearEvents 
  } = useSimulationStore();

  return (
    <div className="glass-card p-5 h-full flex flex-col shadow-xl">
      <div className="flex items-center gap-2.5 mb-6">
        <List size={14} className="text-[var(--accent-cyan)]" />
        <span className="text-[12px] font-black text-white uppercase tracking-[0.1em]">Quick Actions</span>
      </div>

      <div className="space-y-3.5 flex-1">
        {/* Step by Step */}
        <div className="p-3.5 rounded-2xl flex items-center justify-between group transition-all hover:bg-white/5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)' }}>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <MousePointer2 size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-white uppercase tracking-tight">Step-by-Step Mode</span>
              <span className="text-[9px] text-[var(--text-muted)] font-bold">Execute one operation at a time</span>
            </div>
          </div>
          <button onClick={() => setSimulationMode(simulationMode === 'step' ? 'normal' : 'step')} 
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${simulationMode === 'step' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-white/5 text-[var(--text-secondary)] hover:bg-white/10'}`}>
            {simulationMode === 'step' ? 'ACTIVE' : 'ACTIVATE'}
          </button>
        </div>

        {/* Increase Speed */}
        <div className="p-3.5 rounded-2xl flex items-center justify-between group transition-all hover:bg-white/5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)' }}>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <Zap size={18} fill="currentColor" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-white uppercase tracking-tight">Increase Speed</span>
              <span className="text-[9px] text-[var(--text-muted)] font-bold">Speed up the simulation</span>
            </div>
          </div>
          <button onClick={() => setPlaybackSpeed(Math.min(playbackSpeed + 0.5, 3))}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all active:scale-90">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Export Logs */}
        <div className="p-3.5 rounded-2xl flex items-center justify-between group transition-all hover:bg-white/5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)' }}>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <FileText size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-white uppercase tracking-tight">Export Logs</span>
              <span className="text-[9px] text-[var(--text-muted)] font-bold">Download event logs</span>
            </div>
          </div>
          <button onClick={handleExport}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all active:scale-90">
            <Download size={18} />
          </button>
        </div>

        {/* Clear Timeline */}
        <div className="p-3.5 rounded-2xl flex items-center justify-between group transition-all hover:bg-white/5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)' }}>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10 text-red-400 group-hover:scale-110 transition-transform">
              <Trash2 size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-white uppercase tracking-tight">Clear Timeline</span>
              <span className="text-[9px] text-[var(--text-muted)] font-bold">Clear all events</span>
            </div>
          </div>
          <button onClick={clearEvents}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90">
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

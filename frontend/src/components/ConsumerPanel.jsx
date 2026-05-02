import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';

const stateColors = {
  running: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e', border: 'rgba(34,197,94,0.3)', label: 'Running' },
  waiting: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)', label: 'Waiting' },
  blocked: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'rgba(239,68,68,0.3)', label: 'Blocked' },
  idle: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: 'rgba(59,130,246,0.3)', label: 'Idle' },
  done: { bg: 'rgba(107,114,128,0.15)', color: '#6b7280', border: 'rgba(107,114,128,0.3)', label: 'Done' }
};

export default function ConsumerPanel() {
  const { simConfig, threadStates } = useSimulationStore();
  const count = simConfig?.consumers || 2;

  return (
    <div className="glass-card p-5 h-full shadow-lg overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-purple)]" style={{ boxShadow: '0 0 10px var(--accent-purple)' }} />
          <span className="text-[12px] font-black text-white uppercase tracking-[0.1em]">Consumers ({count})</span>
        </div>
      </div>

      <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
        {Array.from({ length: count }, (_, i) => {
          const name = `Consumer-${i + 1}`;
          const state = threadStates[name] || 'idle';
          const s = stateColors[state] || stateColors.idle;

          return (
            <motion.div
              key={i}
              whileHover={{ x: 3, background: 'rgba(255,255,255,0.04)' }}
              className="flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border border-white/[0.03]"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={state === 'running' ? { scale: [1, 1.4, 1], opacity: [1, 0.7, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: s.color, boxShadow: `0 0 10px ${s.color}60` }}
                />
                <span className="text-[12px] font-black text-white">{name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider" style={{
                  background: `${s.color}15`, color: s.color, border: `1.5px solid ${s.color}30`
                }}>{s.label}</span>
                <ChevronRight size={14} className="text-[var(--text-muted)] opacity-40" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

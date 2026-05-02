import { motion } from 'framer-motion';
import { Lock, Unlock, Package, Database } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';

export default function SemaphoreDisplay() {
  const { latestEvent, simConfig } = useSimulationStore();
  const bufferSize = simConfig?.bufferSize || 6;
  const sem = latestEvent?.semaphores || { mutex: 1, empty: bufferSize, full: 0 };

  const gauges = [
    {
      name: 'Mutex', value: sem.mutex, max: 1,
      type: '(Binary)', status: sem.mutex === 1 ? 'Unlocked' : 'Locked',
      color: sem.mutex === 1 ? '#22c55e' : '#ef4444',
      icon: sem.mutex === 1 ? Unlock : Lock
    },
    {
      name: 'Empty', value: sem.empty, max: bufferSize,
      type: '(Counting)', status: `Max: ${bufferSize}`,
      color: '#22c55e',
      icon: Package
    },
    {
      name: 'Full', value: sem.full, max: bufferSize,
      type: '(Counting)', status: `Max: ${bufferSize}`,
      color: '#7c3aed',
      icon: Database
    }
  ];

  const circumference = 2 * Math.PI * 32;

  return (
    <div className="glass-card p-4 h-full shadow-lg">
      <div className="flex items-center gap-2 mb-5">
        <Lock size={14} className="text-[var(--accent-cyan)]" />
        <span className="text-[12px] font-black text-white uppercase tracking-[0.1em]">Semaphore States</span>
      </div>

      <div className="flex items-center justify-around h-[calc(100%-40px)]">
        {gauges.map((g) => {
          const pct = g.max > 0 ? g.value / g.max : 0;
          const gaugeColor = g.name === 'Mutex' ? (g.value === 1 ? 'var(--state-running)' : 'var(--state-blocked)') : 
                            g.name === 'Empty' ? 'var(--accent-cyan)' : 'var(--accent-purple)';
          
          return (
            <div key={g.name} className="flex flex-col items-center gap-2.5">
              {/* Gauge ring */}
              <div className="relative w-[80px] h-[80px]">
                <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                  <motion.circle cx="40" cy="40" r="35" fill="none"
                    stroke={gaugeColor} strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 35}
                    animate={{ strokeDashoffset: 2 * Math.PI * 35 * (1 - pct) }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ filter: `drop-shadow(0 0 8px ${gaugeColor}60)` }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.span key={g.value} initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="text-2xl mono font-black" style={{ color: gaugeColor }}>
                    {g.value}
                  </motion.span>
                </div>
              </div>
              {/* Label area */}
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-black tracking-wide" style={{ color: gaugeColor }}>{g.name}</span>
                <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-tighter opacity-70">{g.type}</span>
                <span className="text-[9px] text-[var(--text-muted)] font-black uppercase mt-0.5">{g.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

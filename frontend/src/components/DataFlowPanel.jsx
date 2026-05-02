import { motion } from 'framer-motion';
import { Wifi, Users, Database, UserCheck, Settings } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { useEffect, useState } from 'react';

function AnimatedDots({ active }) {
  const [dots, setDots] = useState([]);
  useEffect(() => {
    if (!active) { setDots([]); return; }
    const id = setInterval(() => {
      setDots(prev => {
        const now = Date.now();
        return [...prev.filter(d => now - d.born < 2000), { id: now, born: now }];
      });
    }, 400);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div className="flex-1 relative h-[4px] mx-2" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '2px' }}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      {dots.map(d => (
        <motion.div key={d.id}
          className="absolute w-3 h-3 rounded-full -top-[4px]"
          style={{ 
            background: 'var(--accent-cyan)', 
            boxShadow: '0 0 15px var(--accent-cyan), 0 0 5px var(--accent-cyan)' 
          }}
          initial={{ left: '0%', opacity: 0 }}
          animate={{ left: '100%', opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.8, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

export default function DataFlowPanel() {
  const { simStatus } = useSimulationStore();
  const isRunning = simStatus === 'running';

  const nodes = [
    { icon: Users, label: 'Producers', color: 'var(--accent-cyan)', glow: 'rgba(0, 212, 255, 0.4)' },
    { icon: Database, label: 'Buffer', color: 'var(--state-running)', glow: 'rgba(34, 197, 94, 0.4)' },
    { icon: UserCheck, label: 'Consumers', color: 'var(--accent-purple)', glow: 'rgba(157, 80, 187, 0.4)' }
  ];

  return (
    <div className="glass-card p-5 h-full flex flex-col shadow-xl">
      <div className="flex items-center gap-2.5 mb-6">
        <Settings size={14} className="text-[var(--accent-cyan)]" />
        <span className="text-[12px] font-black text-white uppercase tracking-[0.1em]">Data Flow</span>
      </div>

      <div className="flex-1 flex items-center justify-between px-4 relative">
        {nodes.map((node, i) => (
          <div key={node.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-3 relative z-10">
              <motion.div
                animate={isRunning ? { 
                  scale: [1, 1.05, 1],
                  boxShadow: [`0 0 20px ${node.glow}20`, `0 0 40px ${node.glow}60`, `0 0 20px ${node.glow}20`]
                } : {}}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                className="w-16 h-16 rounded-full flex items-center justify-center relative"
                style={{
                  background: 'rgba(15, 18, 55, 0.6)',
                  border: `2px solid ${node.color}`,
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${node.color}20, transparent 70%)` }} />
                <node.icon size={28} style={{ color: node.color, filter: `drop-shadow(0 0 8px ${node.color})` }} />
                
                {/* Rotating ring */}
                {isRunning && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    className="absolute -inset-1.5 rounded-full border border-dashed opacity-30"
                    style={{ borderColor: node.color }}
                  />
                )}
              </motion.div>
              <span className="text-[11px] font-black text-white tracking-wider">{node.label}</span>
            </div>

            {i < nodes.length - 1 && (
              <div className="flex-1 h-[2px] mx-4 relative overflow-hidden bg-white/5 rounded-full">
                {isRunning && (
                  <>
                    <motion.div
                      animate={{ left: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-[var(--accent-cyan)] to-transparent opacity-40"
                    />
                    {[0, 0.4, 0.8, 1.2, 1.6].map((delay) => (
                      <motion.div
                        key={delay}
                        initial={{ left: '-10px', opacity: 0 }}
                        animate={{ left: '100%', opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay }}
                        className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                        style={{ 
                          background: node.color, 
                          boxShadow: `0 0 12px ${node.color}` 
                        }}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

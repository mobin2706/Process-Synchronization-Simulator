import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Database } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';

export default function BufferVisualization() {
  const { latestEvent, simConfig } = useSimulationStore();
  const [flashIndex, setFlashIndex] = useState(null);
  const prevRef = useRef(null);

  const size = simConfig?.bufferSize || 6;
  const buffer = latestEvent?.buffer || Array(size).fill(null);
  const inIndex = latestEvent?.buffer_in ?? 0;
  const outIndex = latestEvent?.buffer_out ?? 0;
  const bufferCount = latestEvent?.buffer_count ?? 0;
  const mutexLocked = latestEvent?.semaphores?.mutex === 0;

  useEffect(() => {
    if (latestEvent && latestEvent !== prevRef.current && latestEvent.buffer_index != null) {
      setFlashIndex(latestEvent.buffer_index);
      prevRef.current = latestEvent;
      const t = setTimeout(() => setFlashIndex(null), 600);
      return () => clearTimeout(t);
    }
  }, [latestEvent]);

  const getSlotPosition = (index, total) => {
    const angle = (index / total) * 360 - 90;
    const radius = 80;
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;
    return { x, y, angle };
  };

  return (
    <div className="glass-card p-5 h-full flex flex-col items-center shadow-xl relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 w-full">
        <div className="flex items-center gap-2">
          <Database size={14} className="text-[var(--accent-cyan)]" />
          <span className="text-[12px] font-black text-white uppercase tracking-[0.1em]">Circular Buffer</span>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--state-running)', boxShadow: '0 0 10px var(--state-running)' }} />
            <span className="text-[10px] font-black text-[var(--text-muted)] tracking-widest">IN</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent-purple)', boxShadow: '0 0 10px var(--accent-purple)' }} />
            <span className="text-[10px] font-black text-[var(--text-muted)] tracking-widest">OUT</span>
          </div>
        </div>
      </div>

      {/* Ring area */}
      <div className="relative flex-1 w-full flex items-center justify-center mb-4">
        {/* Main Ring Path */}
        <div className="absolute w-[180px] h-[180px] rounded-full border-[1.5px] border-[var(--accent-cyan)] opacity-20" />
        
        {/* Center label */}
        <div className="absolute flex flex-col items-center z-10">
          <motion.div key={bufferCount} initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center">
            <span className="text-3xl font-black text-white leading-none mb-1">
              {bufferCount} / {size}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.3em]">used</span>
          </motion.div>
        </div>

        {/* Pointer Arrows */}
        <svg className="absolute w-full h-full pointer-events-none overflow-visible" viewBox="-120 -120 240 240">
          <defs>
            <marker id="arrowhead-in" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="var(--state-running)" />
            </marker>
            <marker id="arrowhead-out" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="10 0, 0 3.5, 10 7" fill="var(--accent-purple)" />
            </marker>
          </defs>
          
          {/* IN Arrow */}
          {(() => {
            const pos = getSlotPosition(inIndex, size);
            const dist = 125;
            const ax = Math.cos((pos.angle * Math.PI) / 180) * dist;
            const ay = Math.sin((pos.angle * Math.PI) / 180) * dist;
            const bx = Math.cos((pos.angle * Math.PI) / 180) * (dist - 30);
            const by = Math.sin((pos.angle * Math.PI) / 180) * (dist - 30);
            return (
              <motion.g animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <line x1={ax} y1={ay} x2={bx} y2={by} stroke="var(--state-running)" strokeWidth="2.5" markerEnd="url(#arrowhead-in)" />
                <text x={ax + (ax > 0 ? 8 : -22)} y={ay + (ay > 0 ? 12 : -5)} fill="var(--state-running)" fontSize="10" fontWeight="900" className="mono">IN</text>
              </motion.g>
            );
          })()}

          {/* OUT Arrow */}
          {(() => {
            const pos = getSlotPosition(outIndex, size);
            const dist = 125;
            const ax = Math.cos((pos.angle * Math.PI) / 180) * dist;
            const ay = Math.sin((pos.angle * Math.PI) / 180) * dist;
            const bx = Math.cos((pos.angle * Math.PI) / 180) * (dist - 30);
            const by = Math.sin((pos.angle * Math.PI) / 180) * (dist - 30);
            return (
              <motion.g animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.75 }}>
                <line x1={bx} y1={by} x2={ax} y2={ay} stroke="var(--accent-purple)" strokeWidth="2.5" markerEnd="url(#arrowhead-out)" />
                <text x={ax + (ax > 0 ? 8 : -30)} y={ay + (ay > 0 ? 12 : -5)} fill="var(--accent-purple)" fontSize="10" fontWeight="900" className="mono">OUT</text>
              </motion.g>
            );
          })()}
        </svg>

        {/* Slots */}
        {buffer.map((val, i) => {
          const { x, y } = getSlotPosition(i, size);
          const isEmpty = val === null || val === undefined;
          const isFlashing = flashIndex === i;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1, x, y }}
              className="absolute"
            >
              <motion.div
                animate={{
                  scale: isFlashing ? 1.15 : 1,
                  boxShadow: isFlashing ? '0 0 35px var(--accent-cyan)' : !isEmpty ? '0 0 15px rgba(0,212,255,0.15)' : 'none'
                }}
                className="w-[54px] h-[54px] -ml-[27px] -mt-[27px] rounded-full flex flex-col items-center justify-center border-[2px] transition-all relative overflow-hidden"
                style={{
                  borderColor: !isEmpty ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.08)',
                  background: isEmpty ? 'rgba(15, 18, 55, 0.6)' : 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(157,80,187,0.1))',
                  backdropFilter: 'blur(12px)'
                }}>
                <span className="text-[10px] mono text-[var(--text-muted)] font-black leading-none mb-1">{i}</span>
                <AnimatePresence mode="wait">
                  <motion.span key={val ?? 'empty'}
                    initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                    className="text-[16px] mono font-black leading-none"
                    style={{ color: isEmpty ? 'rgba(255,255,255,0.1)' : 'white' }}>
                    {isEmpty ? '-' : val}
                  </motion.span>
                </AnimatePresence>
                {!isEmpty && <div className="absolute inset-0 bg-white/5 pointer-events-none" />}
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Lock badge */}
      <div className="h-10 w-full flex items-center justify-center">
        <AnimatePresence>
          {mutexLocked && (
            <motion.div initial={{ opacity: 0, y: 15, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15, scale: 0.9 }}
              className="flex items-center gap-2.5 px-6 py-2.5 rounded-2xl shadow-lg"
              style={{ background: 'rgba(34,197,94,0.12)', border: '1.5px solid rgba(34,197,94,0.3)', boxShadow: '0 0 30px rgba(34,197,94,0.2)' }}>
              <Lock size={14} className="text-[var(--state-running)]" fill="currentColor" />
              <span className="text-[12px] font-black text-[var(--state-running)] uppercase tracking-[0.15em]">Lock Acquired (Mutex)</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

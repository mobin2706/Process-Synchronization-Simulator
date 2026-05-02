import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUp, 
  ArrowDown 
} from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';

export default function Timeline() {
  const { playedEvents } = useSimulationStore();
  const [filter, setFilter] = useState('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef(null);

  const filteredEvents = playedEvents.filter(ev => {
    if (filter === 'producers') return ev.thread_name?.startsWith('Producer');
    if (filter === 'consumers') return ev.thread_name?.startsWith('Consumer');
    return true;
  });

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredEvents.length, autoScroll]);

  return (
    <div className="glass-card flex flex-col h-full shadow-2xl overflow-hidden border border-white/[0.05]">
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between bg-white/[0.02]" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-4">
          <span className="text-[14px] font-black text-white uppercase tracking-[0.15em]">Event Timeline</span>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
            {['All', 'Producers', 'Consumers'].map(f => (
              <button key={f} onClick={() => setFilter(f.toLowerCase())}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all duration-300 ${filter === f.toLowerCase() ? 'bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] shadow-[0_0_15px_rgba(0,212,255,0.2)] border border-[var(--accent-cyan)]/30' : 'text-[var(--text-muted)] hover:text-white'}`}>
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Auto Scroll</span>
            <button onClick={() => setAutoScroll(!autoScroll)}
              className="w-10 h-5 rounded-full relative transition-all duration-300 shadow-inner"
              style={{ background: autoScroll ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)' }}>
              <motion.div animate={{ left: autoScroll ? '22px' : '2px' }} className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg" />
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-0 relative">
        {/* Vertical Continuity Line */}
        <div className="absolute left-[34px] top-0 bottom-0 w-[1px] bg-white/[0.05]" />

        <AnimatePresence initial={false}>
          {filteredEvents.map((ev, i) => {
            const isProducer = ev.thread_name?.startsWith('Producer');
            const color = isProducer ? '#00d4ff' : '#a855f7';
            const actionColor = isProducer ? '#22c55e' : '#a855f7';
            const Icon = isProducer ? ArrowUp : ArrowDown;

            return (
              <motion.div
                key={ev.id || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center py-4 px-6 relative group transition-all hover:bg-white/[0.02]"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
              >
                {/* Connector Dot */}
                <div className="absolute left-[31px] top-1/2 -translate-y-1/2 w-[7px] h-[7px] rounded-full border-2 border-[var(--bg-primary)] z-10"
                  style={{ background: color, boxShadow: `0 0 10px ${color}` }} />

                {/* Left Section: Thread Identity */}
                <div className="flex items-center gap-4 w-[160px] shrink-0 pl-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-[11px] shadow-lg" 
                    style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                    {isProducer ? 'P' : 'C'}
                  </div>
                  <span className="text-[12px] font-black text-white/90">{ev.thread_name}</span>
                </div>

                {/* Mid Section: Action & Values */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-[90px]">
                    <Icon size={12} style={{ color: actionColor }} />
                    <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: actionColor }}>
                      {ev.type === 'produce' ? 'Produced' : 'Consumed'}
                    </span>
                  </div>

                  <span className="text-[11px] font-medium text-[var(--text-secondary)] truncate">
                    {ev.type === 'produce' ? 'wrote' : 'read'} <span className="text-[var(--accent-cyan)] font-black mono">{ev.value}</span>
                    {' '}{ev.type === 'produce' ? 'at' : 'from'} <span className="text-white/80 font-black mono">{ev.buffer_index}</span>
                  </span>
                </div>

                {/* Right Section: Semaphore State Snapshot */}
                <div className="flex items-center gap-4 mono text-[10px] font-black opacity-80 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-black uppercase text-[var(--text-muted)]">empty:</span>
                    <span className="text-[#00d4ff]">{ev.semaphores?.empty ?? '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-black uppercase text-[var(--text-muted)]">full:</span>
                    <span className="text-[#a855f7]">{ev.semaphores?.full ?? '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-black uppercase text-[var(--text-muted)]">mutex:</span>
                    <span className="text-[#22c55e]">{ev.semaphores?.mutex ?? '-'}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredEvents.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-10 py-20">
            <div className="text-[12px] font-black uppercase tracking-[0.3em]">No Activity Detected</div>
          </div>
        )}
      </div>
    </div>
  );
}

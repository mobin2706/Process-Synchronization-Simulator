import { Info } from 'lucide-react';

export default function StateGlossary() {
  const states = [
    { label: 'Running', color: 'var(--state-running)', glow: '#22c55e', desc: 'Active processing' },
    { label: 'Waiting', color: 'var(--state-waiting)', glow: '#f59e0b', desc: 'Pending resource' },
    { label: 'Blocked', color: 'var(--state-blocked)', glow: '#ef4444', desc: 'Resource lock' },
    { label: 'Idle', color: '#3b82f6', glow: '#3b82f6', desc: 'Ready state' },
    { label: 'Done', color: 'var(--state-done)', glow: '#94a3b8', desc: 'Task complete' }
  ];

  return (
    <div className="glass-card p-5 h-full flex flex-col shadow-xl border border-white/[0.05]">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="p-1.5 rounded-md bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/20">
          <Info size={14} className="text-[var(--accent-cyan)]" />
        </div>
        <span className="text-[11px] font-black text-white uppercase tracking-[0.15em]">Thread State Glossary</span>
      </div>

      <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
        {states.map(({ label, color, glow, desc }) => (
          <div key={label} className="flex items-center justify-between group cursor-default">
            <div className="flex items-center gap-3.5">
              <div className="w-2 h-2 rounded-full relative" style={{ background: color, boxShadow: `0 0 10px ${glow}80` }}>
                <div className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: color, animationDuration: '3s' }} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white group-hover:text-[var(--accent-cyan)] transition-colors duration-300">{label}</span>
                <span className="text-[8px] text-[var(--text-muted)] font-black uppercase tracking-widest">{desc}</span>
              </div>
            </div>
            <div className="h-[1px] flex-1 mx-4 bg-white/[0.03]" />
            <div className="px-2 py-0.5 rounded bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[8px] font-black text-white/30 uppercase tracking-tighter">Status</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

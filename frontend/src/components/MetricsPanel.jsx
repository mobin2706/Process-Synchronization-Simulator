import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, Clock, ArrowUpCircle, ArrowDownCircle, BarChart3 } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { motion } from 'framer-motion';

function AnimNum({ value, color }) {
  return (
    <motion.span key={value} initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className="text-xl mono font-black" style={{ color }}>{value}</motion.span>
  );
}

function LiveClock({ startTime, active }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [active]);
  if (!startTime) return <span className="text-xl mono font-black text-white">00:00:00</span>;
  const sec = Math.floor(((active ? now : Date.now()) - startTime) / 1000);
  const h = String(Math.floor(sec / 3600)).padStart(2, '0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return <span className="text-xl mono font-black text-white">{h}:{m}:{s}</span>;
}

export function PerformanceStats() {
  const { metrics, simStatus } = useSimulationStore();
  return (
    <div className="glass-card p-4 h-full shadow-lg">
      <div className="flex items-center gap-2.5 mb-5">
        <Activity size={14} className="text-[var(--accent-pink)]" />
        <span className="text-[12px] font-black text-white uppercase tracking-[0.1em]">Performance Matrix</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Throughput', value: metrics.throughput, suffix: 'op/s', color: 'var(--accent-cyan)' },
          { label: 'Uptime', custom: <LiveClock startTime={metrics.startTime} active={simStatus === 'running'} />, sub: 'hh:mm:ss' },
          { label: 'Produced', value: metrics.totalProduced, suffix: 'items', color: 'var(--state-running)', icon: ArrowUpCircle },
          { label: 'Consumed', value: metrics.totalConsumed, suffix: 'items', color: 'var(--accent-purple)', icon: ArrowDownCircle }
        ].map(({ label, value, suffix, color, custom, sub, icon: Icon }) => (
          <div key={label} className="p-3 rounded-2xl transition-all hover:bg-white/5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)' }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              {Icon && <Icon size={12} style={{ color }} />}
              <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider">{label}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              {custom || <AnimNum value={value} color={color || 'white'} />}
              {suffix && <span className="text-[10px] font-bold text-[var(--text-muted)]">{suffix}</span>}
            </div>
            {sub && <span className="text-[9px] font-bold text-[var(--text-muted)] block mt-0.5">{sub}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BufferUsage() {
  const { latestEvent, simConfig } = useSimulationStore();
  const bufferSize = simConfig?.bufferSize || 5;
  const bufferUsed = latestEvent?.buffer_count ?? 0;
  const utilPct = bufferSize > 0 ? Math.round((bufferUsed / bufferSize) * 100) : 0;
  const circumference = 2 * Math.PI * 36;

  return (
    <div className="glass-card p-4 h-full flex flex-col items-center shadow-lg">
      <div className="flex items-center gap-2.5 mb-4 self-start">
        <BarChart3 size={14} className="text-[var(--state-running)]" />
        <span className="text-[12px] font-black text-white uppercase tracking-[0.1em]">Buffer Utilization</span>
      </div>
      <div className="relative w-[100px] h-[100px] mt-2 flex-1 flex items-center justify-center">
        <svg viewBox="0 0 80 80" className="w-[100px] h-[100px] -rotate-90">
          <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <motion.circle cx="40" cy="40" r="36" fill="none"
            stroke="var(--state-running)" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: circumference * (1 - utilPct / 100) }}
            transition={{ duration: 0.8, ease: 'circOut' }}
            style={{ filter: 'drop-shadow(0 0 10px rgba(34,197,94,0.3))' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span key={utilPct} initial={{ scale: 1.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-black text-[var(--state-running)]">{utilPct}%</motion.span>
          <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Used</span>
        </div>
      </div>
    </div>
  );
}

export function ThroughputGraph() {
  const { metrics } = useSimulationStore();
  return (
    <div className="glass-card p-4 h-full flex flex-col shadow-lg">
      <div className="flex items-center gap-2.5 mb-4">
        <Activity size={14} className="text-[var(--accent-cyan)]" />
        <span className="text-[12px] font-black text-white uppercase tracking-[0.1em]">Throughput Over Time</span>
      </div>
      <div className="flex-1 min-h-[120px]">
        {metrics.history.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[11px] font-bold text-[var(--text-muted)] tracking-widest uppercase">Collecting Data...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics.history} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} fontWeights="900" tickLine={false} axisLine={false} tickFormatter={(v) => v.toFixed(1)} />
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(10, 13, 36, 0.95)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '12px', 
                  fontSize: '11px', 
                  fontWeight: 'bold',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                }}
                itemStyle={{ color: '#00d4ff' }}
                labelStyle={{ display: 'none' }} 
              />
              <Area type="monotone" dataKey="throughput" stroke="#00d4ff" strokeWidth={3} fill="url(#throughputGrad)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default function MetricsPanel() {
  return (
    <div className="grid grid-cols-10 gap-3 h-full">
      <div className="col-span-4"><PerformanceStats /></div>
      <div className="col-span-2"><BufferUsage /></div>
      <div className="col-span-4"><ThroughputGraph /></div>
    </div>
  );
}

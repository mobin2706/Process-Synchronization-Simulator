import { motion } from 'framer-motion';
import BufferVisualization from './BufferVisualization';
import ProducerPanel from './ProducerPanel';
import ConsumerPanel from './ConsumerPanel';
import SemaphoreDisplay from './SemaphoreDisplay';
import Timeline from './Timeline';
import MetricsPanel from './MetricsPanel';
import DataFlowPanel from './DataFlowPanel';
import QuickActions from './QuickActions';
import DeadlockPanel from './DeadlockPanel';
import { useSimulationStore } from '../store/useSimulationStore';
import { ANIMATION_DURATIONS } from '../utils/constants';
import { Cpu, ArrowRight } from 'lucide-react';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: ANIMATION_DURATIONS.stagger } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: ANIMATION_DURATIONS.slow, ease: 'easeOut' } }
};

function SectionLabel({ children }) {
  return (
    <div className="section-label my-1">
      <span>{children}</span>
    </div>
  );
}

function IdlePrompt() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-12 flex flex-col items-center justify-center text-center"
    >
      <motion.div
        animate={{ rotate: [0, 180, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{
          background: 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(124,58,237,0.1))',
          border: '1px solid var(--border-glass)'
        }}
      >
        <Cpu size={28} className="text-[var(--accent-cyan)]" />
      </motion.div>
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Ready to Simulate</h3>
      <p className="text-xs text-[var(--text-secondary)] max-w-xs leading-relaxed">
        Configure the number of producers, consumers, and buffer size using the controls panel,
        then click <span className="text-[var(--state-running)] font-semibold">Start Simulation</span> to visualize real-time thread synchronization.
      </p>
      <div className="flex items-center gap-3 mt-6 text-[9px] mono text-[var(--text-muted)]">
        <span className="px-2 py-1 rounded border border-[var(--border-glass)] bg-[var(--bg-glass)]">sem_wait()</span>
        <ArrowRight size={10} />
        <span className="px-2 py-1 rounded border border-[var(--border-glass)] bg-[var(--bg-glass)]">critical section</span>
        <ArrowRight size={10} />
        <span className="px-2 py-1 rounded border border-[var(--border-glass)] bg-[var(--bg-glass)]">sem_post()</span>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { simStatus, deadlockMode } = useSimulationStore();
  const isIdle = simStatus === 'idle';

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex-1 space-y-3">
      {isIdle ? (
        <motion.div variants={fadeUp}>
          <IdlePrompt />
        </motion.div>
      ) : (
        <div className={deadlockMode ? 'deadlock-freeze' : ''}>
          {/* ── Data Flow Pipeline ──────────────────────────── */}
          <SectionLabel>DATA FLOW PIPELINE</SectionLabel>
          <motion.div variants={fadeUp} className="mb-3">
            <DataFlowPanel />
          </motion.div>

          {/* ── Producers → Buffer → Consumers ──────────────── */}
          <SectionLabel>THREAD VISUALIZATION</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-3 items-start mb-3">
            <motion.div variants={fadeUp}><ProducerPanel /></motion.div>
            <motion.div variants={fadeUp} className="flex flex-col items-center gap-1">
              <div className="hidden lg:flex items-center gap-3 w-full justify-center">
                <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, var(--accent-cyan), transparent)' }} />
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-[8px] mono font-bold text-[var(--text-muted)]"
                >PRODUCE → BUFFER → CONSUME</motion.span>
                <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, var(--accent-purple), transparent)' }} />
              </div>
              <BufferVisualization />
            </motion.div>
            <motion.div variants={fadeUp}><ConsumerPanel /></motion.div>
          </div>

          {/* ── Synchronization & Metrics ──────────────────── */}
          <SectionLabel>SYNCHRONIZATION & METRICS</SectionLabel>
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.5fr] gap-3 mb-3">
            <motion.div variants={fadeUp} className="h-full"><SemaphoreDisplay /></motion.div>
            <motion.div variants={fadeUp} className="h-full"><MetricsPanel /></motion.div>
          </div>

          {/* ── Timeline ──────────────────────────────────── */}
          <SectionLabel>EVENT TIMELINE</SectionLabel>
          <motion.div variants={fadeUp} className="mb-3"><Timeline /></motion.div>

          {/* ── Quick Actions & Deadlock ───────────────────── */}
          <SectionLabel>CONTROLS & SIMULATION</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <motion.div variants={fadeUp}><QuickActions /></motion.div>
            <motion.div variants={fadeUp}><DeadlockPanel /></motion.div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

import { useEffect } from 'react';
import { useSimulationStore } from './store/useSimulationStore';
import TopBar from './components/TopBar';
import ControlPanel from './components/ControlPanel';
import ProducerPanel from './components/ProducerPanel';
import BufferVisualization from './components/BufferVisualization';
import ConsumerPanel from './components/ConsumerPanel';
import DataFlowPanel from './components/DataFlowPanel';
import SemaphoreDisplay from './components/SemaphoreDisplay';
import { PerformanceStats, BufferUsage, ThroughputGraph } from './components/MetricsPanel';
import Timeline from './components/Timeline';
import QuickActions from './components/QuickActions';
import StateGlossary from './components/StateGlossary';

export default function App() {
  const { connect, disconnect, presentationMode } = useSimulationStore();

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return (
    <div className="h-screen bg-[var(--bg-primary)] overflow-hidden flex flex-col font-['JetBrains_Mono']">
      {!presentationMode && <TopBar />}
      
      <main className={`flex-1 grid grid-cols-12 ${presentationMode ? 'grid-rows-1' : 'grid-rows-12'} gap-3 p-3 overflow-hidden transition-all duration-500`}>
        {/* Top Left: System Configuration & Glossary */}
        {!presentationMode && (
          <div className="col-span-3 row-span-7 flex flex-col gap-3 min-w-0">
            <div className="flex-[3] min-h-0">
              <ControlPanel />
            </div>
            <div className="flex-[2] min-h-0">
              <StateGlossary />
            </div>
          </div>
        )}

        {/* Top Right: Main Simulation View */}
        <div className={`${presentationMode ? 'col-span-12 row-span-1' : 'col-span-9 row-span-7'} grid grid-cols-12 grid-rows-7 gap-3 transition-all duration-500`}>
          {/* Top Row: Producers, Buffer, Consumers */}
          <div className={`${presentationMode ? 'col-span-3 row-span-5' : 'col-span-3 row-span-4'}`}>
            <ProducerPanel />
          </div>
          <div className={`${presentationMode ? 'col-span-6 row-span-5' : 'col-span-6 row-span-4'}`}>
            <BufferVisualization />
          </div>
          <div className={`${presentationMode ? 'col-span-3 row-span-5' : 'col-span-3 row-span-4'}`}>
            <ConsumerPanel />
          </div>

          {/* Middle Row: Data Flow, Performance, Semaphore, Actions */}
          <div className={`${presentationMode ? 'col-span-4 row-span-2' : 'col-span-4 row-span-3'}`}>
            <DataFlowPanel />
          </div>
          <div className={`${presentationMode ? 'col-span-3 row-span-2' : 'col-span-3 row-span-3'}`}>
            <PerformanceStats />
          </div>
          <div className={`${presentationMode ? 'col-span-3 row-span-2' : 'col-span-3 row-span-3'}`}>
            <SemaphoreDisplay />
          </div>
          {!presentationMode && (
            <div className="col-span-2 row-span-3">
              <QuickActions />
            </div>
          )}
          {presentationMode && (
            <div className="col-span-2 row-span-2 flex items-center justify-center">
              <button 
                onClick={() => useSimulationStore.getState().setPresentationMode(false)}
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white transition-all text-[10px] font-black tracking-widest uppercase">
                Exit Presentation
              </button>
            </div>
          )}
        </div>

        {/* Bottom Area: Full Width Timeline & Throughput Graph */}
        {!presentationMode && (
          <div className="col-span-12 row-span-5 grid grid-cols-2 gap-3">
            <div className="min-h-0">
              <Timeline />
            </div>
            <div className="min-h-0">
              <ThroughputGraph />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

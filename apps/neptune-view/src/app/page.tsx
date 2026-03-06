'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { RealtimeProvider, useRealtime } from '@/providers/RealtimeProvider';
import { ThemeProvider, useTheme } from '@/providers/ThemeProvider';
import {
  Shield,
  Activity,
  Map as MapIcon,
  Database,
  Menu,
  X,
  Zap,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { formatTimestamp } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { UnifiedControlPanel } from '@/components/map/UnifiedControlPanel';

// Dynamic import for the Map to avoid SSR issues
const RealTimeMap = dynamic(
  () => import('@/components/map/RealTimeMap').then(mod => ({ default: mod.RealTimeMap })),
  {
    ssr: false,
    loading: () => <MapLoadingFallback />
  }
);

function MapLoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-deep-ocean">
      <LoadingSpinner size="lg" text="INITIALIZING NEPTUNE CORE..." />
    </div>
  );
}

function NeptuneDashboard() {
  const {
    vessels,
    chloroplethData,
    lastUpdate,
    isLoading,
    activeLayers,
    toggleLayer,
    error
  } = useRealtime();

  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState('MAP');

  return (
    <div className="relative w-full h-screen overflow-hidden bg-deep-ocean text-white font-space-grotesk">
      {/* Background Map Layer */}
      <div className="absolute inset-0 z-0">
        <RealTimeMap
          vessels={vessels}
          chloroplethData={chloroplethData}
          mlPredictions={[]} // To be integrated
          activeMLModels={[]} // To be integrated
          className="w-full h-full"
        />
      </div>

      {/* TOP HEADER - TACTICAL OVERLAY */}
      <header className="absolute top-0 left-0 right-0 z-20 tactical-glass border-b-neptune-blue/20 flex items-center justify-between px-6 py-3 h-16">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-neptune-blue/10 rounded-lg border border-neptune-blue/30 tactical-glow">
            <Shield className="w-6 h-6 text-neptune-blue" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-tactical">
              NEPTUNE <span className="text-neptune-cyan">TACTICAL</span>
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-neptune-cyan/70 font-mono uppercase tracking-widest">
              <span className="flex h-1.5 w-1.5 rounded-full bg-neptune-cyan animate-pulse" />
              SYSTEM STATUS: OPERATIONAL // ANGOLA EEZ MONITORING
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest">Global Timestamp</span>
            <span className="text-sm font-mono font-bold text-neptune-blue uppercase">
              {lastUpdate ? formatTimestamp(lastUpdate) : 'SYNCHRONIZING...'}
            </span>
          </div>
          <button className="p-2 hover:bg-neptune-blue/10 rounded-full transition-colors">
            <Activity className="w-5 h-5 text-neptune-blue" />
          </button>
        </div>
      </header>

      {/* LEFT SIDEBAR - COMMAND PANEL */}
      <aside className={`absolute left-0 top-16 bottom-0 z-10 transition-all duration-500 ease-in-out ${showSidebar ? 'w-80' : 'w-0 overflow-hidden'} tactical-glass border-r-neptune-blue/20`}>
        <div className="p-6 space-y-8 w-80">
          {/* Module Selector */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Command Modules</h2>
            <div className="grid gap-2">
              {[
                { id: 'MAP', label: 'Tactical View', icon: MapIcon },
                { id: 'BIO', label: 'Biodiversity Index', icon: Database },
                { id: 'THREAT', label: 'Threat Matrix', icon: Zap },
              ].map((module) => (
                <button
                  key={module.id}
                  onClick={() => setActiveTab(module.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${activeTab === module.id
                      ? 'bg-neptune-blue/20 border-neptune-blue text-white tactical-glow'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <module.icon className={`w-5 h-5 ${activeTab === module.id ? 'text-neptune-blue' : 'text-gray-500'}`} />
                    <span className="text-sm font-medium tracking-wide">{module.label}</span>
                  </div>
                  {activeTab === module.id && <div className="h-1.5 w-1.5 rounded-full bg-neptune-blue shadow-[0_0_8px_#4facfe]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Layer Control Integration */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sensor Arrays</h2>
            <div className="p-2 bg-black/30 rounded-lg border border-white/5">
              <UnifiedControlPanel
                activeLayers={activeLayers}
                toggleLayer={toggleLayer}
                theme="dark"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 h-16 w-4 tactical-glass flex items-center justify-center rounded-r-md transition-all ${showSidebar ? 'left-80' : 'left-0 hover:bg-neptune-blue/20'}`}
      >
        <ChevronRight className={`w-4 h-4 text-neptune-blue transition-transform ${showSidebar ? 'rotate-180' : ''}`} />
      </button>

      {/* BOTTOM DATA DOCK */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-full max-w-4xl px-4">
        <div className="tactical-glass p-4 rounded-xl border border-neptune-blue/30 flex items-center justify-between gap-8 tactical-glow">
          <div className="flex items-center gap-4">
            <div className="text-[10px] text-gray-400 uppercase tracking-widest border-r border-white/10 pr-4">Active Assets</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-neptune-blue leading-none">{vessels?.length || 0}</span>
              <span className="text-[10px] text-gray-500 font-bold uppercase">Platforms</span>
            </div>
          </div>

          <div className="flex-1 px-8 border-x border-white/10">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest">Stream Integrity</span>
              <span className="text-[10px] text-neptune-cyan font-bold uppercase truncate">98.4% Uplink</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-neptune-blue w-[98.4%] tactical-glow" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 bg-white/5 hover:bg-neptune-blue/20 border border-white/10 rounded-lg transition-all group">
              <Maximize2 className="w-4 h-4 text-gray-400 group-hover:text-neptune-blue" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Notifications */}
      {error && (
        <div className="absolute top-20 right-6 z-50 tactical-glass border-red-500/50 p-4 rounded-lg flex items-center gap-3 animate-pulse">
          <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_red]" />
          <span className="text-xs font-bold uppercase text-red-400 tracking-wider">Warning: Data Stream Interrupted</span>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider forcedTheme="dark">
      <RealtimeProvider>
        <NeptuneDashboard />
      </RealtimeProvider>
    </ThemeProvider>
  );
}

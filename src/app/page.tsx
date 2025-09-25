'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { RealtimeProvider, useRealtime } from '@/providers/RealtimeProvider';
import { RealtimeStats } from '@/components/dashboard/RealtimeStats';
import { RefreshCw, Settings, Layers, BarChart3 } from 'lucide-react';

// Dynamic import para evitar problemas de SSR com Leaflet
const RealTimeMap = dynamic(
  () => import('@/components/map/RealTimeMap').then(mod => ({ default: mod.RealTimeMap })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center">
        <div className="text-slate-500">Carregando mapa...</div>
      </div>
    )
  }
);

function MainDashboard() {
  const {
    marineData,
    vessels,
    chloroplethData,
    isLoading,
    error,
    lastUpdate,
    refreshData,
    activeLayers,
    toggleLayer
  } = useRealtime();

  const [showStats, setShowStats] = useState(true);
  const [showLayers, setShowLayers] = useState(false);

  const handleRefresh = async () => {
    await refreshData();
  };

  const isConnected = !error && lastUpdate !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">
                BGAPP Real-Time • Angola
              </h1>
              <div className="text-sm text-blue-100 bg-white/20 px-3 py-1 rounded-full">
                API OFICIAL COPERNICUS
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowStats(!showStats)}
                className={`p-2 rounded-lg transition-colors ${
                  showStats
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-blue-100 hover:bg-white/20'
                }`}
                title="Toggle Statistics"
              >
                <BarChart3 className="w-5 h-5" />
              </button>

              <button
                onClick={() => setShowLayers(!showLayers)}
                className={`p-2 rounded-lg transition-colors ${
                  showLayers
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-blue-100 hover:bg-white/20'
                }`}
                title="Toggle Layers"
              >
                <Layers className="w-5 h-5" />
              </button>

              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">

          {/* Painel de Estatísticas */}
          {showStats && (
            <div className="lg:col-span-1 space-y-6 overflow-y-auto">
              <RealtimeStats
                marineData={marineData}
                vessels={vessels}
                isConnected={isConnected}
                lastUpdate={lastUpdate}
              />

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <div className="text-red-800 font-medium">Erro de Conexão</div>
                  <div className="text-red-600 text-sm mt-1">{error}</div>
                </div>
              )}
            </div>
          )}

          {/* Mapa Principal */}
          <div className={`${showStats ? 'lg:col-span-2' : 'lg:col-span-3'} relative`}>
            <RealTimeMap
              vessels={vessels}
              chloroplethData={chloroplethData}
              className="w-full h-full"
            />

            {/* Layer Controls */}
            {showLayers && (
              <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-md rounded-lg p-4 shadow-lg border border-white/20 min-w-[200px]">
                <h3 className="font-semibold text-gray-900 mb-3">Layers</h3>
                <div className="space-y-2">
                  {[
                    { id: 'vessels', label: 'Embarcações', count: vessels.length },
                    { id: 'temperature', label: 'Temperatura', count: null },
                    { id: 'chloropleth', label: 'Clorofila', count: chloroplethData.length }
                  ].map(layer => (
                    <label key={layer.id} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeLayers.includes(layer.id)}
                        onChange={() => toggleLayer(layer.id)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">
                        {layer.label}
                        {layer.count !== null && (
                          <span className="text-gray-500 ml-1">({layer.count})</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <RealtimeProvider>
      <MainDashboard />
    </RealtimeProvider>
  );
}
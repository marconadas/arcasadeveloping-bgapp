'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { RealtimeProvider, useRealtime } from '@/providers/RealtimeProvider';
import { ThemeProvider, useTheme } from '@/providers/ThemeProvider';
import { Activity, Wifi, Ship, Thermometer, Droplets, Layers, Menu, X, ChevronLeft, Wind, Waves } from 'lucide-react';
import { formatTemperature, formatChlorophyll, formatTimestamp } from '@/lib/utils';
import { getThemeStyles } from '@/lib/theme-utils';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LayersPanel } from '@/components/map/LayersPanel';

// Dynamic import para evitar problemas de SSR com Leaflet
const RealTimeMap = dynamic(
  () => import('@/components/map/RealTimeMap').then(mod => ({ default: mod.RealTimeMap })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-900 animate-pulse flex items-center justify-center">
        <div className="text-slate-400">Carregando mapa...</div>
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

  const { theme } = useTheme();
  const styles = getThemeStyles(theme);

  const [showSidebar, setShowSidebar] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const isConnected = !error && lastUpdate !== null;

  useEffect(() => {
    const interval = setInterval(() => refreshData(), 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Full-Screen Map */}
      <div className="absolute inset-0">
        <RealTimeMap
          key="realtime-map"
          vessels={vessels}
          chloroplethData={chloroplethData}
          className="w-full h-full"
        />
      </div>

      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-[1001]">
        <div className={`${styles.cardBackground} border-b ${theme === 'light' ? 'border-gray-200/50' : 'border-slate-700/50'} shadow-lg`}>
          <div className="px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className={`p-2 sm:p-2 rounded-lg ${styles.buttonHover} transition-colors ${theme === 'light' ? 'bg-gray-100' : 'bg-slate-800'} flex-shrink-0`}
              >
                {showSidebar ? <X className={`w-4 h-4 sm:w-5 sm:h-5 ${styles.primaryText}`} /> : <Menu className={`w-4 h-4 sm:w-5 sm:h-5 ${styles.primaryText}`} />}
              </button>
              <h1 className={`text-sm sm:text-lg md:text-xl font-bold ${styles.primaryText} truncate hidden xs:block`}>BGAPP Real-Time Angola</h1>
              <h1 className={`text-sm font-bold ${styles.primaryText} truncate xs:hidden`}>BGAPP</h1>
              <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-full ${theme === 'light' ? 'bg-gray-100 border border-gray-200' : 'bg-slate-800 border border-slate-700'} flex-shrink-0`}>
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className={`text-xs sm:text-sm font-medium ${styles.primaryText}`}>
                  {isConnected ? 'Live' : 'Off'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <ThemeToggle size="sm" className="sm:hidden" />
              <ThemeToggle size="md" className="hidden sm:block" />
              <div className={`text-xs ${styles.secondaryText} font-medium hidden lg:block max-w-32 xl:max-w-none`}>
                {lastUpdate ? `Atualizado: ${formatTimestamp(lastUpdate)}` : 'Aguardando...'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Stats Cards - Bottom Left */}
      <div className="absolute bottom-16 sm:bottom-20 left-2 sm:left-3 md:left-6 z-[1001] space-y-2 sm:space-y-3 max-w-[280px] xs:max-w-xs md:max-w-sm">
        {/* Connection Status Card */}
        <div className={`${styles.cardBackground} ${styles.cardBorder} rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4`}>
          <div className="flex items-center gap-2 sm:gap-2 md:gap-3">
            <div className={`p-1.5 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg ${isConnected ? 'bg-green-100' : 'bg-red-100'} flex-shrink-0`}>
              <Wifi className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 ${isConnected ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-xs sm:text-xs md:text-sm ${styles.secondaryText} font-medium`}>Status da Conexão</div>
              <div className={`text-xs sm:text-sm md:text-base font-bold ${styles.primaryText} truncate`}>
                {isConnected ? 'Conectado' : 'Desconectado'}
              </div>
            </div>
          </div>
        </div>

        {/* Marine Data Card */}
        {marineData && (
          <div className={`${styles.cardBackground} ${styles.cardBorder} rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4`}>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col gap-2 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-2 md:gap-3">
                  <div className="p-1.5 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg bg-orange-100 flex-shrink-0">
                    <Thermometer className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs sm:text-xs md:text-sm ${styles.secondaryText} font-medium`}>Temperatura</div>
                    <div className={`text-xs sm:text-sm md:text-lg font-bold ${styles.primaryText} truncate`}>
                      {formatTemperature(marineData.temperature)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-2 md:gap-3">
                  <div className="p-1.5 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg bg-green-100 flex-shrink-0">
                    <Droplets className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs sm:text-xs md:text-sm ${styles.secondaryText} font-medium`}>Clorofila</div>
                    <div className={`text-xs sm:text-sm md:text-lg font-bold ${styles.primaryText} truncate`}>
                      {formatChlorophyll(marineData.chlorophyll)}
                    </div>
                  </div>
                </div>
              </div>

              {expandedCard === 'marine' && (
                <div className={`pt-2 sm:pt-3 border-t ${theme === 'light' ? 'border-gray-200/50' : 'border-slate-700/50'} space-y-1.5 sm:space-y-2`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs sm:text-sm ${styles.secondaryText} font-medium`}>Salinidade</span>
                    <span className={`text-xs sm:text-sm ${styles.primaryText} font-semibold`}>{marineData.salinity.toFixed(2)} PSU</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs sm:text-sm ${styles.secondaryText} font-medium`}>Qualidade</span>
                    <span className={`text-xs sm:text-sm font-bold ${
                      marineData.quality === 'high' ? 'text-green-600' :
                      marineData.quality === 'medium' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {marineData.quality === 'high' ? 'Alta' :
                       marineData.quality === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => setExpandedCard(expandedCard === 'marine' ? null : 'marine')}
                className={`text-xs sm:text-sm ${styles.mutedText} hover:${styles.secondaryText} transition-colors font-medium w-full text-left py-1`}
              >
                {expandedCard === 'marine' ? 'Ver menos' : 'Ver mais'}
              </button>
            </div>
          </div>
        )}

        {/* Vessel Count Card */}
        <div className={`${styles.cardBackground} ${styles.cardBorder} rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4`}>
          <div className="flex items-center gap-2 sm:gap-2 md:gap-3">
            <div className="p-1.5 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg bg-blue-100 flex-shrink-0">
              <Ship className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-xs sm:text-xs md:text-sm ${styles.secondaryText} font-medium`}>Embarcações Ativas</div>
              <div className={`text-lg sm:text-xl md:text-2xl font-bold ${styles.primaryText}`}>{vessels.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Draggable Layer Controls Panel */}
      <LayersPanel
        activeLayers={activeLayers}
        toggleLayer={toggleLayer}
        theme={theme}
      />

      {/* Sidebar for Advanced Controls */}
      <div className={`absolute top-0 left-0 h-full z-[1002] transition-transform duration-300 ${
        showSidebar ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className={`h-full w-64 sm:w-72 md:w-80 ${styles.sidebarBackground} shadow-2xl ring-1 ${theme === 'light' ? 'ring-black/5' : 'ring-white/10'}`}>
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className={`text-base sm:text-lg font-bold ${styles.primaryText}`}>Controles Avançados</h2>
              <button
                onClick={() => setShowSidebar(false)}
                className={`p-1.5 sm:p-2 rounded-lg ${styles.buttonHover} transition-colors`}
              >
                <ChevronLeft className={`w-4 h-4 sm:w-5 sm:h-5 ${styles.secondaryText}`} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Data Sources */}
              <div>
                <h3 className={`text-sm font-semibold ${styles.primaryText} mb-3`}>Fontes de Dados</h3>
                <div className="space-y-2">
                  <div className={`flex items-center justify-between p-3 rounded-lg ${theme === 'light' ? 'bg-gray-50 border border-gray-200' : 'bg-slate-800 border border-slate-700'}`}>
                    <span className={`text-sm ${styles.primaryText} font-medium`}>Global Fishing Watch</span>
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-lg ${theme === 'light' ? 'bg-gray-50 border border-gray-200' : 'bg-slate-800 border border-slate-700'}`}>
                    <span className={`text-sm ${styles.primaryText} font-medium`}>Copernicus Marine</span>
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-lg ${theme === 'light' ? 'bg-gray-50 border border-gray-200' : 'bg-slate-800 border border-slate-700'}`}>
                    <span className={`text-sm ${styles.primaryText} font-medium`}>ML Predictions</span>
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  </div>
                </div>
              </div>

              {/* Visualization Options */}
              <div>
                <h3 className={`text-sm font-semibold ${styles.primaryText} mb-3`}>Visualização</h3>
                <div className="space-y-2">
                  <button className={`w-full text-left p-3 rounded-lg ${theme === 'light' ? 'bg-gray-50 border border-gray-200 hover:bg-gray-100' : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'} transition-colors`}>
                    <span className={`text-sm ${styles.primaryText} font-medium`}>Modo 3D Ocean</span>
                  </button>
                  <button className={`w-full text-left p-3 rounded-lg ${theme === 'light' ? 'bg-gray-50 border border-gray-200 hover:bg-gray-100' : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'} transition-colors`}>
                    <span className={`text-sm ${styles.primaryText} font-medium`}>Animação de Vento</span>
                  </button>
                  <button className={`w-full text-left p-3 rounded-lg ${theme === 'light' ? 'bg-gray-50 border border-gray-200 hover:bg-gray-100' : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'} transition-colors`}>
                    <span className={`text-sm ${styles.primaryText} font-medium`}>Batimetria</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Notification */}
      {error && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className={`${styles.errorBackground} backdrop-blur-xl rounded-xl px-6 py-3`}>
            <div className={`${styles.errorText} text-sm`}>{error}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <RealtimeProvider>
        <MainDashboard />
      </RealtimeProvider>
    </ThemeProvider>
  );
}
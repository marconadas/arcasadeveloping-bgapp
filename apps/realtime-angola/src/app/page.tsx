'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { RealtimeProvider, useRealtime } from '@/providers/RealtimeProvider';
import { ThemeProvider, useTheme } from '@/providers/ThemeProvider';
import { Wifi, Thermometer, Droplets, Menu, X } from 'lucide-react';
import { formatTemperature, formatChlorophyll, formatTimestamp } from '@/lib/utils';
import { getThemeStyles } from '@/lib/theme-utils';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { UnifiedControlPanel } from '@/components/map/UnifiedControlPanel';
import { MobileLayersPanel } from '@/components/map/MobileLayersPanel';
import { ApiErrorToast } from '@/components/ui/DataLoadingState';
import { isMobileDevice } from '@/utils/mapPerformance';
import { useMLModelStore } from '@/stores/mlModelStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Dynamic import para evitar problemas de SSR com Leaflet
const RealTimeMap = dynamic(
  () => import('@/components/map/RealTimeMap').then(mod => ({ default: mod.RealTimeMap })),
  {
    ssr: false,
    loading: () => <MapLoadingFallback />
  }
);

// Theme-aware map loading fallback
function MapLoadingFallback() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <LoadingSpinner 
        size="lg" 
        text="Carregando mapa..." 
      />
    </div>
  );
}

function MainDashboard() {
  const {
    marineData,
    vessels,
    chloroplethData,
    error,
    lastUpdate,
    refreshData,
    isLoading,
    activeLayers,
    toggleLayer
  } = useRealtime();

  const { theme } = useTheme();
  const styles = getThemeStyles(theme);

  // ML Store integration
  const {
    predictions,
    filteredPredictions,
    activeModels,
    minConfidence,
    initializeModels,
    setPredictions
  } = useMLModelStore();

  const [showSidebar, setShowSidebar] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(true);
  const isConnected = !error && lastUpdate !== null;

  // Detect mobile device
  useEffect(() => {
    setIsMobile(isMobileDevice());

    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Use ref to avoid recreating interval when refreshData changes
  const refreshDataRef = useRef(refreshData);
  useEffect(() => {
    refreshDataRef.current = refreshData;
  }, [refreshData]);

  useEffect(() => {
    const interval = setInterval(() => refreshDataRef.current(), 30000);
    return () => clearInterval(interval);
  }, []); // Empty deps - interval only created once

  // Initialize ML models on mount
  useEffect(() => {
    initializeModels();
  }, [initializeModels]);

  // Fetch ML predictions
  useEffect(() => {
    const fetchMLPredictionsData = async () => {
      try {
        // Angola EEZ bounding box with geographic bounds filtering
        const params = new URLSearchParams({
          limit: '2000',
          minLat: '-18.02',
          maxLat: '-5.55',
          minLon: '8.9',
          maxLon: '13.35',
          _t: Date.now().toString() // Cache-busting timestamp
        });

        console.log('🔵 [ML PREDICTIONS FIX] Fetching with geographic bounds from /api/realtime/ml-predictions');
        const response = await fetch(`/api/realtime/ml-predictions?${params.toString()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const result = await response.json();

        // Handle different response formats from API
        if (result.data) {
          // Format from /api/realtime/ml-predictions route
          setPredictions(result.data);
          console.log('✅ [ML PREDICTIONS FIX] Successfully loaded from D1:', result.data.length, 'predictions');
        } else if (result.success && result.data) {
          // Legacy format with success flag
          setPredictions(result.data);
          console.log('✅ [ML PREDICTIONS FIX] Successfully loaded from D1:', result.data.length, 'predictions');
        } else if (result.predictions) {
          // Alternative format
          setPredictions(result.predictions);
          console.log('✅ [ML PREDICTIONS FIX] Loaded from D1:', result.predictions.length, 'predictions');
        } else {
          console.warn('⚠️ [ML PREDICTIONS FIX] Unexpected API response format:', result);
        }
      } catch (error) {
        console.error('❌ [ML PREDICTIONS FIX] Failed to fetch ML predictions:', error);
      }
    };

    fetchMLPredictionsData();
    const mlInterval = setInterval(fetchMLPredictionsData, 60000); // Update every minute
    return () => clearInterval(mlInterval);
  }, [setPredictions]);

  // Debug logs for ML data filtering (using store data)
  useEffect(() => {
    console.log(`📊 [ML Data] Total: ${predictions.length}, Filtered: ${filteredPredictions.length}`);
    console.log(`🎯 [ML Data] Active models:`, activeModels);
    console.log(`📈 [ML Data] Min confidence:`, minConfidence);
    if (predictions.length > 0) {
      const types = Array.from(new Set(predictions.map(p => p.prediction_type)));
      console.log(`🏷️ [ML Data] Available types:`, types);
    }
  }, [predictions, filteredPredictions, activeModels, minConfidence]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Full-Screen Map */}
      <div className="absolute inset-0">
        <RealTimeMap
          key="realtime-map"
          vessels={vessels}
          chloroplethData={chloroplethData}
          mlPredictions={filteredPredictions}
          activeMLModels={activeModels}
          mlMinConfidence={minConfidence}
          className="w-full h-full"
        />
      </div>

      {/* Top Header Bar - Lowered z-index to allow map interaction */}
      <div className="absolute top-0 left-0 right-0 z-[500] pointer-events-none">
        <div className={`${styles.cardBackground} border-b ${theme === 'light' ? 'border-gray-200/50' : 'border-slate-700/50'} shadow-lg pointer-events-auto`}>
          <div className="px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className={`p-2 sm:p-2 rounded-lg ${styles.buttonHover} transition-colors ${theme === 'light' ? 'bg-gray-100' : 'bg-slate-800'} flex-shrink-0`}
              >
                {showSidebar ? <X className={`w-4 h-4 sm:w-5 sm:h-5 ${styles.primaryText}`} /> : <Menu className={`w-4 h-4 sm:w-5 sm:h-5 ${styles.primaryText}`} />}
              </button>
              <h1 className={`text-sm sm:text-lg md:text-xl font-bold ${styles.primaryText} truncate hidden xs:block`}>Neptune(ANG) Real-Time Angola</h1>
              <h1 className={`text-sm font-bold ${styles.primaryText} truncate xs:hidden`}>Neptune(ANG)</h1>
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
      <div className="absolute bottom-16 sm:bottom-20 left-2 sm:left-3 md:left-6 z-[400] space-y-2 sm:space-y-3 max-w-[280px] xs:max-w-xs md:max-w-sm">
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
          {isLoading && (
            <div className="mt-2 flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <span className={`text-xs ${styles.mutedText}`}>Atualizando dados...</span>
            </div>
          )}
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

      </div>

      {/* Unified Control Panel for desktop, Mobile panel for mobile */}
      {isMobile ? (
        <MobileLayersPanel
          activeLayers={activeLayers}
          toggleLayer={toggleLayer}
          theme={theme}
        />
      ) : (
        <UnifiedControlPanel
          activeLayers={activeLayers}
          toggleLayer={toggleLayer}
          theme={theme}
        />
      )}

      {/* API Error Toast */}
      <ApiErrorToast 
        error={showErrorToast ? error : null} 
        onDismiss={() => setShowErrorToast(false)} 
      />
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

'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Circle, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { ANGOLA_COORDINATES, MAP_CONFIG } from '@/lib/constants';
import { VesselData, ChloroplethData, MapViewState } from '@/lib/types';
import { MarineDataLayer } from './MarineDataLayer';
import { TemperatureHeatmapLayer } from './TemperatureHeatmapLayer';
import { OptimizedTemperatureLayer, OptimizedTemperatureLegend } from './OptimizedTemperatureLayer';
import { ChlorophyllCircleLayer } from './ChlorophyllCircleLayer';
import { OptimizedChlorophyllLayer, OptimizedChlorophyllLegend } from './OptimizedChlorophyllLayer';
import { MLPredictionsLayer } from './MLPredictionsLayer';
import { OptimizedMLPredictionsLayer, OptimizedMLPredictionsLegend } from './OptimizedMLPredictionsLayer';
import { TemperatureLegend } from './TemperatureLegend';
import { AngolaCoastline } from './AngolaCoastline';
import { ImprovedBaseMapSelector } from './ImprovedBaseMapSelector';
import { useRealtime } from '@/providers/RealtimeProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { getThemeStyles } from '@/lib/theme-utils';
import { isMobileDevice, getPerformanceConfig } from '@/utils/mapPerformance';
import { Plus, Minus, RotateCcw, MapPin } from 'lucide-react';
import { NASAOceanColorLayer } from './NASAOceanColorLayer';
import { NASASSTLayer } from './NASASSTLayer';
import { NASAVesselLightsLayer } from './NASAVesselLightsLayer';
import { SalinityLayer, SalinityLegend } from './SalinityLayer';
import { OptimizedSalinityLayer, OptimizedSalinityLegend } from './OptimizedSalinityLayer';
import { VesselLayer } from './VesselLayer';
import { LeafletWeatherLayer, WeatherLegend } from './LeafletWeatherLayer';

// Fix para ícones do Leaflet no Next.js
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RealTimeMapProps {
  vessels: VesselData[];
  chloroplethData: ChloroplethData[];
  mlPredictions?: any[];
  onMapViewChange?: (viewState: MapViewState) => void;
  className?: string;
}

export function RealTimeMap({
  vessels,
  chloroplethData,
  mlPredictions = [],
  onMapViewChange,
  className = ''
}: RealTimeMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset map on critical errors
  const resetMap = () => {
    setMapKey(prev => prev + 1);
  };

  const { activeLayers, marineData, toggleLayer, salinityData, sstData, oceanColorData, vesselLightsData, weatherGrid, currentWeather } = useRealtime();
  const { theme } = useTheme();
  const styles = getThemeStyles(theme);

  // Debug: Log activeLayers changes
  useEffect(() => {
    console.log('[RealTimeMap DEBUG] activeLayers updated:', activeLayers);
    console.log('[RealTimeMap DEBUG] vessels in activeLayers?:', activeLayers.includes('vessels'));
    console.log('[RealTimeMap DEBUG] chloropleth in activeLayers?:', activeLayers.includes('chloropleth'));
  }, [activeLayers]);

  // Performance optimization flags
  const isMobile = isMobileDevice();
  const perfConfig = getPerformanceConfig();
  const useOptimizedLayers = isMobile || process.env.NEXT_PUBLIC_USE_OPTIMIZED_LAYERS === 'true';

  // Temperature data state
  const [temperatureData, setTemperatureData] = useState<Array<{lat: number, lon: number, temperature: number}>>([]);
  const [temperatureMetadata, setTemperatureMetadata] = useState<{
    minTemp?: number;
    maxTemp?: number;
    avgTemp?: number;
  }>({});

  // EEZ boundary state
  const [eezBoundary, setEezBoundary] = useState<GeoJSON.Feature | null>(null);

  // Vessel data state - independent fetch to bypass RealtimeProvider redirect issues
  const [localVessels, setLocalVessels] = useState<VesselData[]>([]);

  // Salinity data state - independent fetch to bypass RealtimeProvider redirect issues
  const [localSalinityData, setLocalSalinityData] = useState<any[]>([]);

  // Chlorophyll data state - independent fetch to bypass RealtimeProvider redirect issues
  const [localChlorophyllData, setLocalChlorophyllData] = useState<any[]>([]);

  // ML predictions data state - independent fetch to bypass RealtimeProvider redirect issues
  const [localMLPredictions, setLocalMLPredictions] = useState<any[]>([]);

  // Generate heatmap data for chloropleth
  const heatmapData = useMemo(() => {
    if (!chloroplethData || chloroplethData.length === 0) return [];

    return chloroplethData.map(point => ({
      lat: point.lat,
      lng: point.lng || point.lng,
      intensity: point.value
    }));
  }, [chloroplethData]);

  // Transform chloropleth data to chlorophyll format
  const chlorophyllData = useMemo(() => {
    console.log('[RealTimeMap] Chloropleth Data:', {
      hasData: !!chloroplethData,
      length: chloroplethData?.length || 0,
      firstItem: chloroplethData?.[0]
    });

    if (!chloroplethData || chloroplethData.length === 0) return [];

    // Use the chloroplethData prop that contains actual chlorophyll data from the API
    const transformed = chloroplethData.map(point => ({
      lat: point.lat,
      lng: point.lng || point.lon,
      value: point.value,
      chlorophyll: point.value,
      quality: point.quality || 'high',
      timestamp: point.timestamp,
      source: point.source
    }));

    console.log('[RealTimeMap] Transformed Chlorophyll Data:', {
      length: transformed.length,
      firstItem: transformed[0]
    });

    return transformed;
  }, [chloroplethData]);

  // Transform SST data to temperature format, or use fetched data if SST is empty
  const sstTemperatureData = useMemo(() => {
    if (!sstData || sstData.length === 0) return temperatureData;

    return sstData.map(point => ({
      lat: point.latitude,
      lon: point.longitude,
      temperature: point.temperature,
      timestamp: point.timestamp,
      data_source: point.data_source
    }));
  }, [sstData, temperatureData]);

  // Fetch temperature data
  const fetchTemperatureData = useCallback(async () => {
    try {
      const response = await fetch('/api/realtime/data?layer=temperature', {
        cache: 'no-store',
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch temperature data');

      const data = await response.json();
      if (data.temperature && Array.isArray(data.temperature)) {
        setTemperatureData(data.temperature);
        setTemperatureMetadata(data.metadata || {});
      }
    } catch (error) {
      console.error('Error fetching temperature data:', error);
    }
  }, []);

  // Fetch vessel data independently (bypasses RealtimeProvider redirects)
  const fetchVesselDataDirect = useCallback(async () => {
    try {
      console.log('[RealTimeMap] Fetching vessel data directly...');
      const response = await fetch('/api/gfw/vessel-presence', {
        cache: 'no-store',
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch vessel data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[RealTimeMap] Vessel API response:', data);

      if (data.vessels && Array.isArray(data.vessels)) {
        console.log(`[RealTimeMap] Setting ${data.vessels.length} vessels to local state`);
        setLocalVessels(data.vessels);
      } else {
        console.warn('[RealTimeMap] No vessels array in response:', data);
      }
    } catch (error) {
      console.error('[RealTimeMap] Error fetching vessel data:', error);
    }
  }, []);

  // Load temperature data when temperature layer is active
  useEffect(() => {
    if (activeLayers.includes('temperature')) {
      fetchTemperatureData();
    }
  }, [activeLayers, fetchTemperatureData]);

  // Load vessel data when vessel layer is active
  useEffect(() => {
    if (activeLayers.includes('vessels')) {
      console.log('[RealTimeMap] Vessel layer activated, fetching data...');
      fetchVesselDataDirect();
    }
  }, [activeLayers, fetchVesselDataDirect]);

  // Fetch salinity data independently (bypasses RealtimeProvider redirects)
  const fetchSalinityDataDirect = useCallback(async () => {
    try {
      console.log('[RealTimeMap] Fetching salinity data directly...');
      const angolaEEZ = '-18.02,8.9,-5.55,13.35';
      const response = await fetch(
        `/api/environmental/salinity?limit=1000&bbox=${angolaEEZ}`,
        {
          cache: 'no-store',
          headers: { 'Accept': 'application/json' }
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch salinity data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[RealTimeMap] Salinity API response:', data);

      // API returns {data: Array} format, not {salinity: Array}
      if (data.data && Array.isArray(data.data)) {
        console.log(`[RealTimeMap] Setting ${data.data.length} salinity points to local state`);
        setLocalSalinityData(data.data);
      } else if (data.salinity && Array.isArray(data.salinity)) {
        console.log(`[RealTimeMap] Setting ${data.salinity.length} salinity points to local state`);
        setLocalSalinityData(data.salinity);
      } else {
        console.warn('[RealTimeMap] No salinity array in response:', data);
      }
    } catch (error) {
      console.error('[RealTimeMap] Error fetching salinity data:', error);
    }
  }, []);

  // Load salinity data when salinity layer is active
  useEffect(() => {
    if (activeLayers.includes('salinity')) {
      console.log('[RealTimeMap] Salinity layer activated, fetching data...');
      fetchSalinityDataDirect();
    }
  }, [activeLayers, fetchSalinityDataDirect]);

  // Fetch chlorophyll data independently (bypasses RealtimeProvider redirects)
  const fetchChlorophyllDataDirect = useCallback(async () => {
    try {
      console.log('[RealTimeMap] Fetching chlorophyll data directly...');
      const angolaEEZ = '-18.02,8.9,-5.55,13.35';
      const response = await fetch(
        `/api/environmental/ocean-color?limit=2000&bbox=${angolaEEZ}`,
        {
          cache: 'no-store',
          headers: { 'Accept': 'application/json' }
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch ocean color data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[RealTimeMap] Ocean color API response:', data);

      // API returns {data: Array} or {oceanColor: Array}
      let oceanColorArray = null;
      if (data.data && Array.isArray(data.data)) {
        oceanColorArray = data.data;
      } else if (data.oceanColor && Array.isArray(data.oceanColor)) {
        oceanColorArray = data.oceanColor;
      }

      if (oceanColorArray) {
        console.log('[RealTimeMap] Ocean color array sample:', oceanColorArray[0]);
        // Transform to chlorophyll format
        const transformed = oceanColorArray.map((point: any) => ({
          lat: point.latitude,
          lng: point.longitude,
          value: point.chlorophyll_a,
          chlorophyll: point.chlorophyll_a,
          quality: point.quality_flag || point.quality || 'high', // Fix: API returns quality_flag
          timestamp: point.timestamp,
          source: point.data_source
        }));
        console.log(`[RealTimeMap] Setting ${transformed.length} chlorophyll points to local state`);
        console.log('[RealTimeMap] Transformed sample:', transformed[0]);
        setLocalChlorophyllData(transformed);
      } else {
        console.warn('[RealTimeMap] No ocean color array in response:', data);
      }
    } catch (error) {
      console.error('[RealTimeMap] Error fetching chlorophyll data:', error);
    }
  }, []);

  // Load chlorophyll data when chloropleth layer is active
  useEffect(() => {
    if (activeLayers.includes('chloropleth')) {
      console.log('[RealTimeMap] Chlorophyll layer activated, fetching data...');
      fetchChlorophyllDataDirect();
    }
  }, [activeLayers, fetchChlorophyllDataDirect]);

  // Fetch ML predictions data independently
  const fetchMLPredictionsDirect = useCallback(async () => {
    try {
      console.log('[RealTimeMap] Fetching ML predictions directly from D1...');

      // Angola EEZ bounds
      const angolaEEZ = {
        minLat: -18.02,
        maxLat: -5.55,
        minLon: 8.9,
        maxLon: 13.35
      };

      const response = await fetch(
        `/api/realtime/ml-predictions?limit=1000&minLat=${angolaEEZ.minLat}&maxLat=${angolaEEZ.maxLat}&minLon=${angolaEEZ.minLon}&maxLon=${angolaEEZ.maxLon}`,
        {
          cache: 'no-store',
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ML predictions: ${response.status}`);
      }

      const data = await response.json();
      console.log('[RealTimeMap] ML API response:', {
        hasData: !!data.data,
        count: data.data?.length || 0,
        metadata: data.metadata
      });

      if (data.data && Array.isArray(data.data)) {
        console.log(`[RealTimeMap] Setting ${data.data.length} ML predictions from D1 to local state`);
        console.log('[RealTimeMap] ML predictions sample:', data.data[0]);
        setLocalMLPredictions(data.data);
      } else {
        console.warn('[RealTimeMap] No data array in response:', data);
      }
    } catch (error) {
      console.error('[RealTimeMap] Error fetching ML predictions:', error);
    }
  }, []);

  // Load ML predictions data when ML layer is active
  useEffect(() => {
    if (activeLayers.includes('ml-predictions')) {
      console.log('[RealTimeMap] ML predictions layer activated, fetching data...');
      fetchMLPredictionsDirect();
    }
  }, [activeLayers, fetchMLPredictionsDirect]);

  // Load EEZ boundary data
  useEffect(() => {
    const loadEezBoundary = async () => {
      try {
        const response = await fetch('/angola_eez.json');
        const data = await response.json();
        setEezBoundary(data.features ? data.features[0] : data);
      } catch (error) {
        console.warn('Failed to load EEZ boundary:', error);
      }
    };
    loadEezBoundary();
  }, []);

  if (!isClient) {
    return (
      <div className={`w-full h-full bg-slate-100 animate-pulse rounded-lg ${className}`}>
        <div className="flex items-center justify-center h-full text-slate-500">
          Carregando mapa...
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full rounded-lg overflow-hidden ${className}`}>
      <MapContainer
        key={mapKey}
        center={ANGOLA_COORDINATES.center}
        zoom={MAP_CONFIG.defaultZoom}
        minZoom={MAP_CONFIG.minZoom}
        maxZoom={MAP_CONFIG.maxZoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        preferCanvas={true}
        zoomControl={false}
        attributionControl={true}
        whenReady={() => {
          if (mapRef.current && onMapViewChange) {
            const map = mapRef.current;

            // Disable auto-centering behavior
            map.options.bounceAtZoomLimits = false;

            const updateViewState = () => {
              const center = map.getCenter();
              const zoom = map.getZoom();
              onMapViewChange({
                latitude: center.lat,
                longitude: center.lng,
                zoom,
                bearing: 0,
                pitch: 0
              });
            };

            map.on('moveend', updateViewState);
            map.on('zoomend', updateViewState);

            // Prevent map from centering on marker clicks
            map.on('popupopen', (e) => {
              // Store current view to prevent auto-centering
              const currentCenter = map.getCenter();
              const currentZoom = map.getZoom();

              // Small delay to ensure popup is positioned correctly
              setTimeout(() => {
                if (map.getCenter().distanceTo(currentCenter) > 100) {
                  map.setView(currentCenter, currentZoom, { animate: false });
                }
              }, 50);
            });
          }
        }}
      >
        {/* Base Map Selector manages tile layers */}
        <ImprovedBaseMapSelector />

        {/* Ocean depth contours (bathymetry simulation) */}
        {activeLayers.includes('bathymetry') && (
          <>
            <Polygon
              positions={[
                [-5, 11.5],
                [-5, 14],
                [-10, 14],
                [-10, 11.5]
              ]}
              fillColor="#1e3a8a"
              fillOpacity={0.2}
              stroke={false}
            />
            <Polygon
              positions={[
                [-10, 11.5],
                [-10, 14],
                [-15, 14],
                [-15, 11.5]
              ]}
              fillColor="#1e40af"
              fillOpacity={0.15}
              stroke={false}
            />
          </>
        )}

        {/* Chlorophyll Circle Markers Layer - Use local data with fallback to props */}
        {(() => {
          const shouldShow = activeLayers.includes('chloropleth');
          if (!shouldShow) {
            return null;
          }

          const chlorophyllDataToUse = localChlorophyllData.length > 0 ? localChlorophyllData : chlorophyllData;
          console.log(`[RealTimeMap] Rendering ChlorophyllLayer with ${chlorophyllDataToUse.length} points (source: ${localChlorophyllData.length > 0 ? 'local fetch' : 'props'})`);

          return useOptimizedLayers ? (
            <OptimizedChlorophyllLayer
              data={chlorophyllDataToUse}
              visible={shouldShow}
              opacity={0.8}
              eezBoundary={eezBoundary}  // Now using simple bounding box filter in the component
              showPerformanceMetrics={process.env.NODE_ENV === 'development'}
            />
          ) : (
            <ChlorophyllCircleLayer
              data={chlorophyllDataToUse}
              visible={shouldShow}
              opacity={0.8}
              eezBoundary={eezBoundary}  // Now using simple bounding box filter in the component
            />
          );
        })()}

        {/* ML Predictions Layer - Use local data with fallback to props */}
        {(() => {
          const shouldShow = activeLayers.includes('ml-predictions');
          if (!shouldShow) {
            return null;
          }

          const mlDataToUse = localMLPredictions.length > 0 ? localMLPredictions : mlPredictions;
          console.log(`[RealTimeMap] Rendering MLPredictionsLayer with ${mlDataToUse.length} predictions (source: ${localMLPredictions.length > 0 ? 'local fetch' : 'props'})`);

          return useOptimizedLayers ? (
            <OptimizedMLPredictionsLayer
              data={mlDataToUse}
              visible={shouldShow}
              opacity={0.8}
              eezBoundary={eezBoundary}
              showPerformanceMetrics={process.env.NODE_ENV === 'development'}
            />
          ) : (
            <MLPredictionsLayer
              data={mlDataToUse}
              visible={shouldShow}
              opacity={0.8}
              eezBoundary={eezBoundary}
            />
          );
        })()}

        {/* Enhanced Temperature Heatmap Layer - Use optimized version on mobile */}
        {activeLayers.includes('temperature') && (
          useOptimizedLayers ? (
            <OptimizedTemperatureLayer
              data={sstTemperatureData}
              visible={activeLayers.includes('temperature')}
              opacity={0.6}
              showContours={false}
              eezBoundary={eezBoundary}
              showPerformanceMetrics={process.env.NODE_ENV === 'development'}
            />
          ) : (
            <TemperatureHeatmapLayer
              data={sstTemperatureData}
              visible={activeLayers.includes('temperature')}
              opacity={0.6}
              showContours={false}
              eezBoundary={eezBoundary}
            />
          )
        )}

        {/* Salinity Data Layer - Use optimized version on mobile */}
        {activeLayers.includes('salinity') && (() => {
          const salinityDataToUse = localSalinityData.length > 0 ? localSalinityData : salinityData;
          console.log(`[RealTimeMap] Rendering SalinityLayer with ${salinityDataToUse.length} points (source: ${localSalinityData.length > 0 ? 'local fetch' : 'props'})`);

          return useOptimizedLayers ? (
            <OptimizedSalinityLayer
              data={salinityDataToUse}
              visible={activeLayers.includes('salinity')}
              opacity={0.7}
              showPerformanceMetrics={process.env.NODE_ENV === 'development'}
            />
          ) : (
            <SalinityLayer
              data={salinityDataToUse}
              visible={activeLayers.includes('salinity')}
              opacity={0.7}
            />
          );
        })()}

        {/* Angola Coastline and EEZ Boundaries */}
        <AngolaCoastline
          visible={true}
          showZEE={true}
          showMainland={true}
          showCabinda={true}
        />


        {/* NASA Ocean Color Layer */}
        {activeLayers.includes('nasa-ocean-color') && (
          <NASAOceanColorLayer
            visible={activeLayers.includes('nasa-ocean-color')}
            opacity={0.7}
            showContours={false}
            onDataLoad={(data) => console.log('NASA Ocean Color data loaded:', data)}
          />
        )}

        {/* NASA SST Layer */}
        {activeLayers.includes('nasa-sst') && (
          <NASASSTLayer
            visible={activeLayers.includes('nasa-sst')}
            opacity={0.8}
            showContours={true}
            showAnomalies={false}
            onDataLoad={(data) => console.log('NASA SST data loaded:', data)}
            onFeatureDetected={(features) => console.log('Oceanographic features detected:', features)}
          />
        )}

        {/* NASA Vessel Lights Layer */}
        {activeLayers.includes('nasa-vessel-lights') && (
          <NASAVesselLightsLayer
            visible={activeLayers.includes('nasa-vessel-lights')}
            opacity={0.9}
            minRadiance={0.5}
            showClusters={true}
            showRiskZones={false}
            onDataLoad={(data) => console.log('NASA Vessel data loaded:', data)}
            onAlertDetected={(alerts) => console.log('Vessel alerts:', alerts)}
          />
        )}

        {/* Vessel Layer - AIS Vessel Tracking - Uses local fetch data with fallback to props */}
        {activeLayers.includes('vessels') && (() => {
          const vesselDataToUse = localVessels.length > 0 ? localVessels : vessels;
          console.log('[RealTimeMap] Rendering VesselLayer with', vesselDataToUse.length, 'vessels');
          return vesselDataToUse && vesselDataToUse.length > 0 ? (
            <VesselLayer
              vessels={vesselDataToUse}
              showTooltips={true}
            />
          ) : null;
        })()}

        {/* Weather Layer - Temperature and Wind Vectors from Open-Meteo */}
        {activeLayers.includes('weather') && weatherGrid && weatherGrid.length > 0 && (
          <LeafletWeatherLayer
            data={weatherGrid}
            visible={activeLayers.includes('weather')}
            opacity={0.7}
            showWindVectors={activeLayers.includes('weather-wind')}
            temperatureColorScale="turbo"
          />
        )}
      </MapContainer>

      {/* Salinity Legend - Use optimized version on mobile */}
      {activeLayers.includes('salinity') && (
        useOptimizedLayers ? (
          <OptimizedSalinityLegend visible={true} isMobile={isMobile} />
        ) : (
          <SalinityLegend visible={true} />
        )
      )}

      {/* ML Predictions Legend - Only show optimized version when available */}
      {activeLayers.includes('ml-predictions') && useOptimizedLayers && (
        <OptimizedMLPredictionsLegend visible={true} isMobile={isMobile} />
      )}

      {/* Weather Legend */}
      {activeLayers.includes('weather') && (
        <WeatherLegend visible={true} temperatureColorScale="turbo" />
      )}

      {/* Custom Zoom Controls */}
      <div className="absolute top-2 sm:top-4 right-2 sm:right-3 md:right-4 z-[1000] flex flex-col gap-1 sm:gap-1">
        <button
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.zoomIn();
            }
          }}
          className={`w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 ${styles.zoomButton} backdrop-blur-xl rounded-md sm:rounded-lg flex items-center justify-center shadow-lg touch-manipulation`}
          title="Zoom In"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
        </button>
        <button
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.zoomOut();
            }
          }}
          className={`w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 ${styles.zoomButton} backdrop-blur-xl rounded-md sm:rounded-lg flex items-center justify-center shadow-lg touch-manipulation`}
          title="Zoom Out"
        >
          <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
        </button>
        <button
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.setView(ANGOLA_COORDINATES.center, MAP_CONFIG.defaultZoom, {
                animate: true,
                duration: 0.5
              });
            }
          }}
          className={`w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 ${styles.zoomButton} backdrop-blur-xl rounded-md sm:rounded-lg flex items-center justify-center shadow-lg touch-manipulation`}
          title="Reset View"
        >
          <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" />
        </button>
        <button
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.setView(ANGOLA_COORDINATES.center, MAP_CONFIG.defaultZoom, {
                animate: true,
                duration: 1.0
              });
            }
          }}
          className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-600/90 backdrop-blur-xl rounded-md sm:rounded-lg border border-blue-500/50 hover:bg-blue-700/90 transition-colors flex items-center justify-center shadow-lg touch-manipulation"
          title="Focus Angola"
        >
          <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" />
        </button>
      </div>

      {/* Overlay de informações */}
      <div className={`absolute top-16 sm:top-20 left-2 sm:left-3 md:left-4 z-[1000] ${styles.mapOverlay} rounded-lg sm:rounded-xl p-1.5 sm:p-2 md:p-3 max-w-[160px] sm:max-w-none`}>
        {chloroplethData.length > 0 && (
          <div className={`text-xs sm:text-xs md:text-sm ${styles.secondaryText} flex items-center gap-1 sm:gap-1 md:gap-2 font-medium`}>
            <span className="text-xs sm:text-sm">📊</span>
            <span className="truncate">{chloroplethData.length} dados</span>
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className={`absolute bottom-4 sm:bottom-6 md:bottom-8 right-2 sm:right-3 md:right-4 z-[999] ${styles.mapOverlay} rounded-lg sm:rounded-xl p-1.5 sm:p-2 md:p-3 max-w-[140px] sm:max-w-[180px] md:max-w-none`}>
        <div className={`text-xs sm:text-xs md:text-sm ${styles.labelWeight || 'font-bold'} ${styles.primaryText} mb-1.5 sm:mb-2`}>Legenda</div>
        <div className="space-y-1 sm:space-y-1.5 md:space-y-2 text-xs sm:text-xs md:text-sm">
          {activeLayers.includes('temperature') && (
            <div className={`flex items-center gap-1.5 sm:gap-2 md:gap-3 mt-2 sm:mt-3 pt-1.5 sm:pt-2 border-t ${theme === 'light' ? 'border-gray-200/50' : 'border-slate-700/50'}`}>
              <div className="w-12 sm:w-16 md:w-20 h-2 sm:h-2.5 md:h-3 bg-gradient-to-r from-blue-500 via-amber-500 to-red-500 rounded shadow-sm flex-shrink-0"/>
              <span className={`${styles.secondaryText} ${styles.labelWeight || 'font-medium'} text-xs`}>24-27°C</span>
            </div>
          )}
          {activeLayers.includes('chloropleth') && (
            <div className="mt-2 sm:mt-3 pt-1.5 sm:pt-2 border-t ${theme === 'light' ? 'border-gray-200/50' : 'border-slate-700/50'}">
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                {/* NASA Ocean Color gradient for chlorophyll */}
                <div className="flex flex-col gap-0.5">
                  <div
                    className="w-16 sm:w-20 md:w-24 h-2 sm:h-2.5 md:h-3 rounded shadow-sm flex-shrink-0"
                    style={{
                      background: 'linear-gradient(to right, #000033 0%, #000055 6%, #0000aa 12%, #0000ff 19%, #0055ff 25%, #00aaff 31%, #00ffaa 38%, #00ff00 44%, #55ff00 50%, #aaff00 56%, #ffff00 62%, #ffaa00 69%, #ff5500 75%, #ff0000 81%, #aa0000 88%, #550000 100%)'
                    }}
                  />
                  <div className="flex justify-between text-[9px] sm:text-[10px] md:text-xs ${styles.mutedText}">
                    <span>0.01</span>
                    <span>0.1</span>
                    <span>1.0</span>
                    <span>10</span>
                  </div>
                </div>
                <span className={`${styles.secondaryText} ${styles.labelWeight || 'font-medium'} text-xs`}>mg/m³</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Temperature Legend - Use optimized version on mobile */}
      {useOptimizedLayers ? (
        <OptimizedTemperatureLegend
          visible={activeLayers.includes('temperature')}
          minTemp={temperatureMetadata.minTemp}
          maxTemp={temperatureMetadata.maxTemp}
          currentTemp={temperatureMetadata.avgTemp}
          isMobile={isMobile}
        />
      ) : (
        <TemperatureLegend
          visible={activeLayers.includes('temperature')}
          minTemp={temperatureMetadata.minTemp}
          maxTemp={temperatureMetadata.maxTemp}
          currentTemp={temperatureMetadata.avgTemp}
          onToggle={() => toggleLayer('temperature')}
        />
      )}
    </div>
  );
}
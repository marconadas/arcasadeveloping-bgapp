'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Circle, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { ANGOLA_COORDINATES, MAP_CONFIG } from '@/lib/constants';
import { VesselData, ChloroplethData, MapViewState } from '@/lib/types';
import { VesselLayer } from './VesselLayer';
import { MarineDataLayer } from './MarineDataLayer';
import { TemperatureHeatmapLayer } from './TemperatureHeatmapLayer';
import { ChlorophyllHeatmapLayer } from './ChlorophyllHeatmapLayer';
import { TemperatureLegend } from './TemperatureLegend';
import { AngolaCoastline } from './AngolaCoastline';
import { BaseMapSelector } from './BaseMapSelector';
import { useRealtime } from '@/providers/RealtimeProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { getThemeStyles } from '@/lib/theme-utils';
import { Plus, Minus, RotateCcw, MapPin } from 'lucide-react';

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
  onMapViewChange?: (viewState: MapViewState) => void;
  className?: string;
}

export function RealTimeMap({
  vessels,
  chloroplethData,
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

  const { activeLayers, marineData, toggleLayer } = useRealtime();
  const { theme } = useTheme();
  const styles = getThemeStyles(theme);
  const [selectedVessel, setSelectedVessel] = useState<VesselData | null>(null);

  // Temperature data state
  const [temperatureData, setTemperatureData] = useState<Array<{lat: number, lon: number, temperature: number}>>([]);
  const [temperatureMetadata, setTemperatureMetadata] = useState<{
    minTemp?: number;
    maxTemp?: number;
    avgTemp?: number;
  }>({});

  // EEZ boundary state
  const [eezBoundary, setEezBoundary] = useState<GeoJSON.Feature | null>(null);

  // Generate heatmap data for chloropleth
  const heatmapData = useMemo(() => {
    if (!chloroplethData || chloroplethData.length === 0) return [];

    return chloroplethData.map(point => ({
      lat: point.lat,
      lng: point.lng || point.lng,
      intensity: point.value
    }));
  }, [chloroplethData]);

  // Fetch temperature data
  const fetchTemperatureData = useCallback(async () => {
    try {
      const response = await fetch('/api/realtime/data?layer=temperature');
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

  // Load temperature data when temperature layer is active
  useEffect(() => {
    if (activeLayers.includes('temperature') || activeLayers.includes('sst')) {
      fetchTemperatureData();
    }
  }, [activeLayers, fetchTemperatureData]);

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
        <BaseMapSelector />

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

        {/* Enhanced Chlorophyll Heatmap Layer */}
        {activeLayers.includes('chloropleth') && (
          <ChlorophyllHeatmapLayer
            data={chloroplethData}
            visible={true}
            opacity={0.65}
            showContours={false}
            eezBoundary={eezBoundary}
          />
        )}

        {/* Enhanced Temperature Heatmap Layer */}
        {activeLayers.includes('temperature') && (
          <TemperatureHeatmapLayer
            data={temperatureData}
            visible={true}
            opacity={0.6}
            showContours={false}
            eezBoundary={eezBoundary}
          />
        )}

        {/* Angola Coastline and EEZ Boundaries */}
        <AngolaCoastline
          visible={true}
          showZEE={true}
          showMainland={true}
          showCabinda={true}
        />

        {/* Marine Data Layers */}
        {activeLayers.includes('sst') && (
          <MarineDataLayer
            type="sst"
            data={marineData}
            visible={true}
          />
        )}

        {activeLayers.includes('currents') && (
          <MarineDataLayer
            type="currents"
            data={marineData}
            visible={true}
          />
        )}

        {activeLayers.includes('waves') && (
          <MarineDataLayer
            type="waves"
            data={marineData}
            visible={true}
          />
        )}

        {activeLayers.includes('salinity') && (
          <MarineDataLayer
            type="salinity"
            data={marineData}
            visible={true}
          />
        )}

        {/* Vessel Layer with Clustering */}
        {activeLayers.includes('vessels') && (
          <VesselLayer
            vessels={vessels}
            onVesselSelect={setSelectedVessel}
            showTooltips={true}
          />
        )}
      </MapContainer>

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
        <div className={`text-xs sm:text-xs md:text-sm font-bold ${styles.primaryText} flex items-center gap-1 sm:gap-1 md:gap-2`}>
          <span className="text-xs sm:text-sm">🚢</span>
          <span className="truncate">{vessels.length} embarcações</span>
        </div>
        {chloroplethData.length > 0 && (
          <div className={`text-xs sm:text-xs md:text-sm ${styles.secondaryText} mt-0.5 sm:mt-1 flex items-center gap-1 sm:gap-1 md:gap-2 font-medium`}>
            <span className="text-xs sm:text-sm">📊</span>
            <span className="truncate">{chloroplethData.length} dados</span>
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className={`absolute bottom-4 sm:bottom-6 md:bottom-8 right-2 sm:right-3 md:right-4 z-[999] ${styles.mapOverlay} rounded-lg sm:rounded-xl p-1.5 sm:p-2 md:p-3 max-w-[140px] sm:max-w-[180px] md:max-w-none`}>
        <div className={`text-xs sm:text-xs md:text-sm ${styles.labelWeight || 'font-bold'} ${styles.primaryText} mb-1.5 sm:mb-2`}>Legenda</div>
        <div className="space-y-1 sm:space-y-1.5 md:space-y-2 text-xs sm:text-xs md:text-sm">
          {activeLayers.includes('vessels') && (
            <>
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full bg-green-500 border ${theme === 'light' ? 'border-gray-300' : 'border-slate-600'} shadow-sm flex-shrink-0`}/>
                <span className={`${styles.secondaryText} ${styles.labelWeight || 'font-medium'} truncate`}>Fishing</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full bg-blue-500 border ${theme === 'light' ? 'border-gray-300' : 'border-slate-600'} shadow-sm flex-shrink-0`}/>
                <span className={`${styles.secondaryText} ${styles.labelWeight || 'font-medium'} truncate`}>Cargo</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full bg-amber-500 border ${theme === 'light' ? 'border-gray-300' : 'border-slate-600'} shadow-sm flex-shrink-0`}/>
                <span className={`${styles.secondaryText} ${styles.labelWeight || 'font-medium'} truncate`}>Tanker</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full bg-purple-500 border ${theme === 'light' ? 'border-gray-300' : 'border-slate-600'} shadow-sm flex-shrink-0`}/>
                <span className={`${styles.secondaryText} ${styles.labelWeight || 'font-medium'} truncate`}>Supply</span>
              </div>
            </>
          )}
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

      {/* Selected Vessel Info */}
      {selectedVessel && (
        <div className={`absolute top-16 sm:top-20 md:top-24 right-2 sm:right-4 md:right-64 z-[1000] ${styles.mapOverlay} rounded-lg sm:rounded-xl p-3 sm:p-4 max-w-[280px] sm:max-w-sm`}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h3 className={`font-bold ${styles.primaryText} text-sm sm:text-base truncate pr-2`}>{selectedVessel.name}</h3>
            <button
              onClick={() => setSelectedVessel(null)}
              className={`${styles.mutedText} hover:${styles.primaryText} text-lg sm:text-xl leading-none transition-colors flex-shrink-0 w-6 h-6 flex items-center justify-center`}
            >
              ×
            </button>
          </div>
          <div className={`text-xs sm:text-sm ${styles.secondaryText} space-y-1.5 sm:space-y-2 font-medium`}>
            <div className="flex justify-between items-center">
              <span>Tipo:</span>
              <span className={`${styles.primaryText} truncate pl-2`}>{selectedVessel.type}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Velocidade:</span>
              <span className={`${styles.primaryText} truncate pl-2`}>{selectedVessel.speed} kts</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Destino:</span>
              <span className={`${styles.primaryText} truncate pl-2`}>{selectedVessel.destination || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Temperature Legend */}
      <TemperatureLegend
        visible={activeLayers.includes('temperature')}
        minTemp={temperatureMetadata.minTemp}
        maxTemp={temperatureMetadata.maxTemp}
        currentTemp={temperatureMetadata.avgTemp}
        onToggle={() => toggleLayer('temperature')}
      />
    </div>
  );
}
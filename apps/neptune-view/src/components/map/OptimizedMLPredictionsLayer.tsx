/**
 * Optimized ML Predictions Layer Component
 *
 * Mobile-optimized version of MLPredictionsLayer with:
 * - Viewport-based data filtering
 * - Zoom-level data reduction
 * - Prediction type clustering
 * - Debounced rendering
 * - Adaptive marker sizes based on confidence
 * - Performance monitoring
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import chroma from 'chroma-js';
import * as turf from '@turf/turf';
import {
  filterByViewport,
  reduceByZoom,
  useDebounce,
  getPerformanceConfig,
  isMobileDevice,
  useMapPerformance,
  calculateOptimalGridSize
} from '@/utils/mapPerformance';

interface MLPredictionData {
  lat: number;
  lon?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  prediction_type: string;
  confidence: number;
  model_name?: string;
  prediction_value?: string;
  timestamp?: string;
}

interface OptimizedMLPredictionsLayerProps {
  data: MLPredictionData[];
  visible: boolean;
  opacity?: number;
  eezBoundary?: GeoJSON.Feature | null;
  showPerformanceMetrics?: boolean;
}

export function OptimizedMLPredictionsLayer({
  data,
  visible,
  opacity = 0.8,
  eezBoundary = null,
  showPerformanceMetrics = false
}: OptimizedMLPredictionsLayerProps) {
  const map = useMap();
  const [layerGroup, setLayerGroup] = useState<L.LayerGroup | null>(null);
  const [viewport, setViewport] = useState(map.getBounds());
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());

  // Performance configuration and monitoring
  const config = getPerformanceConfig();
  const { fps, renderTime } = useMapPerformance({ current: map });
  const isMobile = isMobileDevice();

  // Debounced viewport for performance
  const debouncedViewport = useDebounce(viewport, config.debounceDelay);

  // Color scale for ML prediction confidence
  const confidenceScale = useMemo(() => chroma.scale([
    '#8b0000', // 0.0: Dark red (low confidence)
    '#ff4500', // 0.3: Orange-red
    '#ffa500', // 0.5: Orange
    '#ffd700', // 0.7: Gold
    '#00ff00'  // 1.0: Bright green (high confidence)
  ]).mode('lab').domain([0.0, 0.3, 0.5, 0.7, 1.0]), []);

  // Update viewport and zoom on map changes
  useEffect(() => {
    const updateMapState = () => {
      setViewport(map.getBounds());
      setCurrentZoom(map.getZoom());
    };

    map.on('moveend', updateMapState);
    map.on('zoomend', updateMapState);

    return () => {
      map.off('moveend', updateMapState);
      map.off('zoomend', updateMapState);
    };
  }, [map]);

  // Normalize data format for optimization functions
  const normalizedData = useMemo(() => {
    return data.map(point => ({
      ...point,
      latitude: point.latitude || point.lat,
      longitude: point.longitude || point.lon || point.lng || 0
    }));
  }, [data]);

  // Cluster ML predictions by type and location
  const clusterMLPredictions = useCallback((points: any[], zoom: number): any[] => {
    const viewportArea = calculateViewportArea(debouncedViewport);
    const gridSize = calculateOptimalGridSize(zoom, points.length, viewportArea);

    // Group by prediction type first
    const typeGroups = new Map<string, any[]>();
    points.forEach(point => {
      const type = point.prediction_type || 'unknown';
      if (!typeGroups.has(type)) {
        typeGroups.set(type, []);
      }
      typeGroups.get(type)!.push(point);
    });

    // Cluster within each type
    const clustered: any[] = [];
    typeGroups.forEach((typePoints, type) => {
      const gridData = new Map<string, any[]>();

      typePoints.forEach(point => {
        const gridKey = `${Math.floor(point.latitude / gridSize)},${Math.floor(point.longitude / gridSize)}`;
        if (!gridData.has(gridKey)) {
          gridData.set(gridKey, []);
        }
        gridData.get(gridKey)!.push(point);
      });

      // Create cluster representatives
      gridData.forEach((clusterPoints) => {
        if (clusterPoints.length === 1) {
          clustered.push(clusterPoints[0]);
        } else {
          // Create averaged cluster
          const avgLat = clusterPoints.reduce((sum, p) => sum + p.latitude, 0) / clusterPoints.length;
          const avgLon = clusterPoints.reduce((sum, p) => sum + p.longitude, 0) / clusterPoints.length;
          const avgConfidence = clusterPoints.reduce((sum, p) => sum + p.confidence, 0) / clusterPoints.length;
          const maxConfidence = Math.max(...clusterPoints.map(p => p.confidence));
          const minConfidence = Math.min(...clusterPoints.map(p => p.confidence));

          // Find most recent prediction
          const latestPrediction = clusterPoints.reduce((latest, p) => {
            if (!p.timestamp || !latest.timestamp) return latest;
            return new Date(p.timestamp) > new Date(latest.timestamp) ? p : latest;
          });

          clustered.push({
            ...latestPrediction,
            latitude: avgLat,
            longitude: avgLon,
            lat: avgLat,
            lon: avgLon,
            confidence: avgConfidence,
            maxConfidence,
            minConfidence,
            clusterSize: clusterPoints.length,
            prediction_type: type
          });
        }
      });
    });

    return clustered;
  }, [debouncedViewport]);

  // Optimize ML predictions data based on viewport and device
  const optimizedData = useMemo(() => {
    if (!normalizedData || normalizedData.length === 0 || !visible) return [];

    // Step 1: Filter by viewport with padding
    const viewportFiltered = filterByViewport(normalizedData, debouncedViewport, 0.12);

    // Step 2: Apply EEZ boundary filter if provided
    let eezFiltered = viewportFiltered;
    if (eezBoundary && eezBoundary.geometry) {
      eezFiltered = viewportFiltered.filter(point => {
        const pointFeature = turf.point([point.longitude, point.latitude]);
        try {
          return turf.booleanPointInPolygon(pointFeature, eezBoundary as any);
        } catch (e) {
          return false;
        }
      });
    }

    // Step 3: Reduce based on zoom level
    const maxPoints = isMobile
      ? config.maxDataPoints / 5  // Fewer points for ML predictions on mobile
      : config.maxDataPoints / 3;
    const zoomReduced = reduceByZoom(eezFiltered, currentZoom, maxPoints);

    // Step 4: Apply clustering by prediction type for low zoom levels
    if (currentZoom < config.clusteringThreshold) {
      return clusterMLPredictions(zoomReduced, currentZoom);
    }

    return zoomReduced;
  }, [normalizedData, debouncedViewport, currentZoom, visible, eezBoundary, isMobile, config, clusterMLPredictions]);

  // Adaptive radius calculation based on confidence and performance
  const getAdaptiveRadius = useCallback((confidence: number, zoom: number, isCluster: boolean = false) => {
    // Base radius calculation
    let baseRadius = isMobile
      ? Math.max(3, Math.min(9, zoom - 3))
      : Math.max(4, Math.min(14, zoom - 2));

    // Adjust for performance
    if (fps < 30 && fps > 0) {
      baseRadius *= 0.75;
    }

    // Confidence multiplier (higher confidence = larger marker)
    const confidenceMultiplier = 0.7 + (confidence * 0.6); // Range: 0.7-1.3

    // Cluster size multiplier
    const clusterMultiplier = isCluster ? 1.4 : 1.0;

    return baseRadius * confidenceMultiplier * clusterMultiplier;
  }, [isMobile, fps]);

  // Render optimized ML prediction markers
  useEffect(() => {
    if (!map || !optimizedData || optimizedData.length === 0 || !visible) {
      if (layerGroup) {
        map.removeLayer(layerGroup);
        setLayerGroup(null);
      }
      return;
    }

    // Remove existing layer
    if (layerGroup) {
      map.removeLayer(layerGroup);
    }

    // Create new layer group
    const newLayerGroup = L.layerGroup();

    // Add optimized markers
    optimizedData.forEach(point => {
      const confidence = point.confidence || 0;
      const isCluster = point.clusterSize && point.clusterSize > 1;
      const radius = getAdaptiveRadius(
        isCluster ? point.maxConfidence : confidence,
        currentZoom,
        isCluster
      );

      // Get color based on confidence
      const color = confidenceScale(Math.max(0, Math.min(1, confidence))).hex();
      const symbol = getPredictionSymbol(point.prediction_type);

      // Create circle marker with performance optimizations
      const circle = L.circleMarker([point.lat || point.latitude, point.lon || point.longitude], {
        radius: radius,
        fillColor: color,
        color: isCluster ? '#ffffff' : chroma(color).darken(0.5).hex(),
        weight: isCluster ? 2 : (currentZoom > 10 && !isMobile ? 2 : 1),
        opacity: opacity * 0.9,
        fillOpacity: isCluster ? opacity * 0.7 : opacity * 0.6,
        className: 'ml-prediction-marker'
      });

      // Add popup with reduced content on mobile
      if (!isMobile || currentZoom > 8) {
        const popupContent = isCluster
          ? `
            <div class="p-2">
              <h3 class="font-bold text-sm mb-1">${symbol} ML Predictions Cluster</h3>
              <div class="text-xs space-y-1">
                <div><span class="font-semibold">Type:</span> ${getPredictionTypeLabel(point.prediction_type)}</div>
                <div><span class="font-semibold">Points:</span> ${point.clusterSize}</div>
                <div><span class="font-semibold">Avg Confidence:</span> ${(confidence * 100).toFixed(1)}%</div>
                <div><span class="font-semibold">Range:</span> ${(point.minConfidence * 100).toFixed(0)}% - ${(point.maxConfidence * 100).toFixed(0)}%</div>
                <div><span class="font-semibold">Category:</span> ${getConfidenceCategory(confidence)}</div>
              </div>
            </div>
          `
          : `
            <div class="p-2">
              <h3 class="font-bold text-sm mb-1">${symbol} ${getPredictionTypeLabel(point.prediction_type)}</h3>
              <div class="text-xs space-y-1">
                <div><span class="font-semibold">Confidence:</span> ${(confidence * 100).toFixed(1)}%</div>
                ${!isMobile && point.prediction_value ? `<div><span class="font-semibold">Value:</span> ${point.prediction_value}</div>` : ''}
                ${!isMobile && point.model_name ? `<div><span class="font-semibold">Model:</span> ${point.model_name}</div>` : ''}
                <div><span class="font-semibold">Category:</span> ${getConfidenceCategory(confidence)}</div>
                ${!isMobile && point.timestamp ? `<div><span class="font-semibold">Time:</span> ${new Date(point.timestamp).toLocaleString('pt-AO')}</div>` : ''}
              </div>
            </div>
          `;

        circle.bindPopup(popupContent, {
          maxWidth: isMobile ? 150 : 200,
          autoPan: !isMobile
        });

        // Add tooltip only on desktop
        if (!isMobile && currentZoom > 7) {
          const tooltipText = isCluster
            ? `${symbol} ${point.clusterSize} predictions`
            : `${symbol} ${(confidence * 100).toFixed(0)}%`;

          circle.bindTooltip(tooltipText, {
            permanent: false,
            direction: 'top',
            className: 'ml-prediction-tooltip'
          });
        }
      }

      newLayerGroup.addLayer(circle);
    });

    // Add layer to map
    newLayerGroup.addTo(map);
    setLayerGroup(newLayerGroup);

    // Cleanup
    return () => {
      if (newLayerGroup) {
        map.removeLayer(newLayerGroup);
      }
    };
  }, [map, optimizedData, visible, opacity, currentZoom, isMobile, confidenceScale, getAdaptiveRadius]);

  // Performance metrics display (development only)
  if (showPerformanceMetrics && process.env.NODE_ENV === 'development') {
    return (
      <div className="absolute top-60 left-4 z-[1000] bg-black/80 text-white p-2 rounded text-xs space-y-1">
        <div className="font-bold text-purple-400">ML Predictions Layer</div>
        <div>FPS: <span className={fps < 30 ? 'text-red-400' : 'text-green-400'}>{fps}</span></div>
        <div>Render: {renderTime}ms</div>
        <div>Points: {optimizedData.length}/{data.length}</div>
        <div>Zoom: {currentZoom}</div>
        <div>Device: {isMobile ? 'Mobile' : 'Desktop'}</div>
        <div>Clusters: {optimizedData.filter(p => p.clusterSize > 1).length}</div>
        <div>Types: {new Set(optimizedData.map(p => p.prediction_type)).size}</div>
      </div>
    );
  }

  return null;
}

// Helper function to calculate viewport area
function calculateViewportArea(bounds: L.LatLngBounds): number {
  const north = bounds.getNorth();
  const south = bounds.getSouth();
  const east = bounds.getEast();
  const west = bounds.getWest();

  const latDiff = Math.abs(north - south);
  const lonDiff = Math.abs(east - west);

  return latDiff * lonDiff;
}

// Get symbol/emoji for prediction type
function getPredictionSymbol(type: string): string {
  switch (type) {
    case 'fishing_activity':
      return '🎣';
    case 'vessel_behavior':
      return '🚢';
    case 'environmental_anomaly':
      return '⚠️';
    case 'species_distribution':
      return '🐋';
    case 'illegal_fishing_risk':
      return '🚫';
    case 'marine_habitat_quality':
      return '🌊';
    default:
      return '🔮';
  }
}

// Get Portuguese label for prediction type
function getPredictionTypeLabel(type: string): string {
  switch (type) {
    case 'fishing_activity':
      return 'Atividade de Pesca';
    case 'vessel_behavior':
      return 'Comportamento de Embarcações';
    case 'environmental_anomaly':
      return 'Anomalias Ambientais';
    case 'species_distribution':
      return 'Distribuição de Espécies';
    case 'illegal_fishing_risk':
      return 'Risco de Pesca Ilegal';
    case 'marine_habitat_quality':
      return 'Qualidade do Habitat Marinho';
    default:
      return type;
  }
}

// Get category name for confidence value
function getConfidenceCategory(confidence: number): string {
  if (confidence < 0.3) return 'Confiança muito baixa';
  if (confidence < 0.5) return 'Confiança baixa';
  if (confidence < 0.7) return 'Confiança moderada';
  if (confidence < 0.85) return 'Confiança alta';
  return 'Confiança muito alta';
}

/**
 * Optimized ML Predictions Legend Component
 * Mobile-responsive legend for ML predictions confidence scale
 */
export function OptimizedMLPredictionsLegend({
  visible = true,
  isMobile = false
}: {
  visible?: boolean;
  isMobile?: boolean;
}) {
  if (!visible) return null;

  const scale = isMobile ? [
    { confidence: '< 30%', color: '#8b0000', label: 'Very Low' },
    { confidence: '30-50%', color: '#ffa500', label: 'Low' },
    { confidence: '50-70%', color: '#ffd700', label: 'Moderate' },
    { confidence: '> 70%', color: '#00ff00', label: 'High' },
  ] : [
    { confidence: '0-30%', color: '#8b0000', label: 'Very Low' },
    { confidence: '30-50%', color: '#ff4500', label: 'Low' },
    { confidence: '50-70%', color: '#ffa500', label: 'Moderate' },
    { confidence: '70-85%', color: '#ffd700', label: 'High' },
    { confidence: '85-100%', color: '#00ff00', label: 'Very High' },
  ];

  const predictionTypes = [
    { symbol: '🪸', label: 'Coral' },
    { symbol: '🐟', label: 'Fish' },
    { symbol: '⚠️', label: 'Pollution' },
    { symbol: '🐠', label: 'Species' },
    { symbol: '🚢', label: 'Vessel' }
  ];

  return (
    <div className={`absolute ${isMobile ? 'top-32 right-2' : 'top-20 right-4'}
      bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg
      ${isMobile ? 'p-2' : 'p-3'} shadow-lg z-[999]`}>
      <h4 className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold mb-2
        text-gray-800 dark:text-gray-200`}>
        ML Predictions
      </h4>

      {/* Confidence Scale */}
      <div className={`${isMobile ? 'space-y-0.5' : 'space-y-1'} mb-2`}>
        <div className={`${isMobile ? 'text-[10px]' : 'text-xs'}
          text-gray-600 dark:text-gray-400 font-medium`}>
          Confidence:
        </div>
        {scale.map((item) => (
          <div key={item.confidence} className="flex items-center gap-2">
            <div
              className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} rounded-full
                border border-gray-300 dark:border-gray-600`}
              style={{ backgroundColor: item.color }}
            />
            <span className={`${isMobile ? 'text-[10px]' : 'text-xs'}
              text-gray-700 dark:text-gray-300`}>
              {item.confidence} - {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Prediction Types */}
      {!isMobile && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
            Types:
          </div>
          <div className="grid grid-cols-2 gap-1">
            {predictionTypes.map((type) => (
              <div key={type.symbol} className="flex items-center gap-1">
                <span className="text-sm">{type.symbol}</span>
                <span className="text-[10px] text-gray-700 dark:text-gray-300">
                  {type.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
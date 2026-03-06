/**
 * Optimized Chlorophyll Layer Component
 *
 * Mobile-optimized version of ChlorophyllCircleLayer with:
 * - Viewport-based data filtering
 * - Zoom-level data reduction
 * - Clustering for low zoom levels
 * - Debounced rendering
 * - Adaptive marker sizes
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

interface ChlorophyllData {
  lat: number;
  lon?: number;
  lng?: number;
  value?: number;
  chlorophyll?: number;
  quality?: 'high' | 'medium' | 'low';
  depth?: number;
  timestamp?: string;
}

interface OptimizedChlorophyllLayerProps {
  data: ChlorophyllData[];
  visible: boolean;
  opacity?: number;
  eezBoundary?: GeoJSON.Feature | null;
  showPerformanceMetrics?: boolean;
}

export function OptimizedChlorophyllLayer({
  data,
  visible,
  opacity = 0.8,
  eezBoundary = null,
  showPerformanceMetrics = false
}: OptimizedChlorophyllLayerProps) {
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

  // NASA/ESA Ocean Color palette for chlorophyll-a
  const chlorophyllScale = useMemo(() => chroma.scale([
    '#000033', // 0.01 mg/m³: Deep purple (ultra-oligotrophic)
    '#0000aa', // 0.05 mg/m³: Navy blue
    '#0000ff', // 0.1 mg/m³: Blue (oligotrophic open ocean)
    '#00aaff', // 0.3 mg/m³: Cyan (mesotrophic)
    '#00ff00', // 0.5 mg/m³: Green (productive waters)
    '#ffff00', // 1.0 mg/m³: Yellow (eutrophic)
    '#ff5500', // 3.0 mg/m³: Deep orange
    '#ff0000', // 5.0 mg/m³: Red (high productivity)
    '#550000'  // 10+ mg/m³: Deep red (hyper-eutrophic/bloom)
  ]).mode('lab').domain([0.01, 0.05, 0.1, 0.3, 0.5, 1.0, 3.0, 5.0, 10]), []);

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

  // Convert data format for optimization functions
  const normalizedData = useMemo(() => {
    return data.map(point => ({
      ...point,
      latitude: point.lat,
      longitude: point.lon || point.lng || 0,
      value: point.chlorophyll || point.value || 0
    }));
  }, [data]);

  // Optimize data based on viewport and device
  const optimizedData = useMemo(() => {
    if (!normalizedData || normalizedData.length === 0 || !visible) return [];

    // Step 1: Filter by viewport with padding
    const viewportFiltered = filterByViewport(normalizedData, debouncedViewport, 0.15);

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
    const maxPoints = isMobile ? config.maxDataPoints / 3 : config.maxDataPoints;
    const zoomReduced = reduceByZoom(eezFiltered, currentZoom, maxPoints);

    // Step 4: Apply clustering for low zoom levels
    if (currentZoom < config.clusteringThreshold) {
      return clusterChlorophyllData(zoomReduced, currentZoom);
    }

    return zoomReduced;
  }, [normalizedData, debouncedViewport, currentZoom, visible, eezBoundary, isMobile, config]);

  // Cluster chlorophyll data points
  const clusterChlorophyllData = useCallback((points: any[], zoom: number): any[] => {
    const viewportArea = calculateViewportArea(debouncedViewport);
    const gridSize = calculateOptimalGridSize(zoom, points.length, viewportArea);

    const clusters = new Map<string, any[]>();

    points.forEach(point => {
      const gridKey = `${Math.floor(point.latitude / gridSize)},${Math.floor(point.longitude / gridSize)}`;

      if (!clusters.has(gridKey)) {
        clusters.set(gridKey, []);
      }
      clusters.get(gridKey)!.push(point);
    });

    // Create cluster representatives
    const clustered: any[] = [];
    clusters.forEach((clusterPoints) => {
      if (clusterPoints.length === 1) {
        clustered.push(clusterPoints[0]);
      } else {
        // Create a cluster representative with averaged values
        const avgLat = clusterPoints.reduce((sum, p) => sum + p.latitude, 0) / clusterPoints.length;
        const avgLon = clusterPoints.reduce((sum, p) => sum + p.longitude, 0) / clusterPoints.length;
        const avgValue = clusterPoints.reduce((sum, p) => sum + p.value, 0) / clusterPoints.length;
        const maxValue = Math.max(...clusterPoints.map(p => p.value));

        clustered.push({
          ...clusterPoints[0],
          latitude: avgLat,
          longitude: avgLon,
          lat: avgLat,
          lon: avgLon,
          value: avgValue,
          chlorophyll: avgValue,
          maxValue: maxValue,
          clusterSize: clusterPoints.length
        });
      }
    });

    return clustered;
  }, [debouncedViewport]);

  // Adaptive marker configuration based on performance
  const getAdaptiveRadius = useCallback((value: number, zoom: number, isCluster: boolean = false) => {
    // Base radius calculation
    let baseRadius = isMobile
      ? Math.max(2, Math.min(8, zoom - 4))
      : Math.max(3, Math.min(12, zoom - 3));

    // Adjust for performance
    if (fps < 30 && fps > 0) {
      baseRadius *= 0.8;
    }

    // Value multiplier for chlorophyll concentration
    const valueMultiplier = Math.min(1.5, 1 + Math.log10(value + 0.1) * 0.2);

    // Cluster size multiplier
    const clusterMultiplier = isCluster ? 1.3 : 1.0;

    return baseRadius * valueMultiplier * clusterMultiplier;
  }, [isMobile, fps]);

  // Render optimized chlorophyll markers
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

    // Add optimized circle markers
    optimizedData.forEach(point => {
      const chlorophyllValue = point.chlorophyll || point.value || 0;
      const color = chlorophyllScale(Math.max(0.01, Math.min(10, chlorophyllValue))).hex();
      const isCluster = point.clusterSize && point.clusterSize > 1;

      // Get adaptive radius
      const radius = getAdaptiveRadius(
        isCluster ? point.maxValue : chlorophyllValue,
        currentZoom,
        isCluster
      );

      // Create circle marker with performance optimizations
      const circle = L.circleMarker([point.lat || point.latitude, point.lon || point.longitude], {
        radius: radius,
        fillColor: color,
        color: isCluster ? '#ffffff' : color,
        weight: isCluster ? 2 : (currentZoom > 10 && !isMobile ? 1 : 0),
        opacity: opacity * 0.9,
        fillOpacity: isCluster ? opacity * 0.85 : opacity * 0.7
      });

      // Add popup with reduced content on mobile
      if (!isMobile || currentZoom > 8) {
        const popupContent = isCluster
          ? `
            <div style="font-family: system-ui; font-size: 12px;">
              <strong style="color: ${color};">Chlorophyll Cluster</strong><br/>
              <strong>${point.clusterSize} points</strong><br/>
              <strong>Avg: ${chlorophyllValue.toFixed(2)} mg/m³</strong><br/>
              <strong>Max: ${(point.maxValue || chlorophyllValue).toFixed(2)} mg/m³</strong><br/>
              <small style="color: #666;">
                ${getChlorophyllCategory(chlorophyllValue)}
              </small>
            </div>
          `
          : `
            <div style="font-family: system-ui; font-size: 12px;">
              <strong style="color: ${color};">Clorofila-a</strong><br/>
              <strong>${chlorophyllValue.toFixed(3)} mg/m³</strong><br/>
              <small style="color: #666;">
                ${getChlorophyllCategory(chlorophyllValue)}
                ${!isMobile && point.quality ? `<br/>Quality: ${point.quality}` : ''}
                ${!isMobile && point.timestamp ? `<br/>${new Date(point.timestamp).toLocaleString('pt-AO')}` : ''}
              </small>
            </div>
          `;

        circle.bindPopup(popupContent, {
          maxWidth: isMobile ? 150 : 200,
          autoPan: !isMobile
        });

        // Add tooltip only on desktop or high zoom
        if (!isMobile && currentZoom > 7) {
          const tooltipText = isCluster
            ? `Cluster: ${point.clusterSize} points`
            : `${chlorophyllValue.toFixed(2)} mg/m³`;

          circle.bindTooltip(tooltipText, {
            permanent: false,
            direction: 'top',
            className: 'chlorophyll-tooltip'
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
  }, [map, optimizedData, visible, opacity, currentZoom, isMobile, chlorophyllScale, getAdaptiveRadius]);

  // Performance metrics display (development only)
  if (showPerformanceMetrics && process.env.NODE_ENV === 'development') {
    return (
      <div className="absolute top-36 left-4 z-[1000] bg-black/80 text-white p-2 rounded text-xs space-y-1">
        <div className="font-bold text-green-400">Chlorophyll Layer</div>
        <div>FPS: <span className={fps < 30 ? 'text-red-400' : 'text-green-400'}>{fps}</span></div>
        <div>Render: {renderTime}ms</div>
        <div>Points: {optimizedData.length}/{data.length}</div>
        <div>Zoom: {currentZoom}</div>
        <div>Device: {isMobile ? 'Mobile' : 'Desktop'}</div>
        <div>Clusters: {optimizedData.filter(p => p.clusterSize > 1).length}</div>
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

// Get category name for chlorophyll value
function getChlorophyllCategory(value: number): string {
  if (value < 0.05) return 'Ultra-oligotrophic';
  if (value < 0.1) return 'Oligotrophic (low)';
  if (value < 0.3) return 'Oligotrophic (moderate)';
  if (value < 0.5) return 'Mesotrophic';
  if (value < 1.0) return 'Eutrophic';
  if (value < 3.0) return 'Highly eutrophic';
  if (value < 5.0) return 'Hyper-eutrophic';
  return 'Extreme bloom';
}

/**
 * Optimized Chlorophyll Legend Component
 */
interface OptimizedChlorophyllLegendProps {
  visible?: boolean;
  minValue?: number;
  maxValue?: number;
  currentValue?: number;
  isMobile?: boolean;
}

export function OptimizedChlorophyllLegend({
  visible = true,
  minValue = 0.01,
  maxValue = 10,
  currentValue,
  isMobile = false
}: OptimizedChlorophyllLegendProps) {
  if (!visible) return null;

  const scale = isMobile ? [
    { value: '0.01', color: '#000033', label: 'Ultra-low' },
    { value: '0.1', color: '#0000ff', label: 'Low' },
    { value: '0.5', color: '#00ff00', label: 'Moderate' },
    { value: '1.0', color: '#ffff00', label: 'High' },
    { value: '5.0', color: '#ff0000', label: 'Bloom' }
  ] : [
    { value: '0.01', color: '#000033', label: 'Ultra-oligotrophic' },
    { value: '0.05', color: '#0000aa', label: 'Very low' },
    { value: '0.1', color: '#0000ff', label: 'Oligotrophic' },
    { value: '0.3', color: '#00aaff', label: 'Mesotrophic' },
    { value: '0.5', color: '#00ff00', label: 'Productive' },
    { value: '1.0', color: '#ffff00', label: 'Eutrophic' },
    { value: '3.0', color: '#ff5500', label: 'High' },
    { value: '5.0', color: '#ff0000', label: 'Bloom' }
  ];

  return (
    <div className={`absolute ${isMobile ? 'bottom-2 left-2' : 'bottom-4 left-4'}
      bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg
      ${isMobile ? 'p-2' : 'p-3'} shadow-lg z-[999]`}>
      <h4 className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold mb-2
        text-gray-800 dark:text-gray-200`}>
        Chlorophyll-a (mg/m³)
      </h4>

      <div className={`${isMobile ? 'space-y-0.5' : 'space-y-1'}`}>
        {scale.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div
              className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} rounded
                border border-gray-300 dark:border-gray-600`}
              style={{ backgroundColor: item.color }}
            />
            <span className={`${isMobile ? 'text-[10px]' : 'text-xs'}
              text-gray-700 dark:text-gray-300`}>
              {item.value} - {item.label}
            </span>
          </div>
        ))}
      </div>

      {currentValue !== undefined && (
        <div className={`${isMobile ? 'mt-1 pt-1' : 'mt-2 pt-2'}
          border-t border-gray-200 dark:border-gray-700`}>
          <div className={`${isMobile ? 'text-[10px]' : 'text-xs'}
            text-gray-600 dark:text-gray-400`}>
            Current: <span className="font-semibold">{currentValue.toFixed(3)} mg/m³</span>
          </div>
        </div>
      )}
    </div>
  );
}
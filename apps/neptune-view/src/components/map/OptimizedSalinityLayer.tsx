/**
 * Optimized Salinity Layer Component
 *
 * Mobile-optimized version of SalinityLayer with:
 * - Viewport-based data filtering
 * - Zoom-level data reduction
 * - Debounced rendering
 * - Adaptive clustering
 * - Performance monitoring
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { EnhancedSalinityData } from '@/services/enhancedDataService';
import {
  filterByViewport,
  reduceByZoom,
  useDebounce,
  getPerformanceConfig,
  isMobileDevice,
  useMapPerformance,
  calculateOptimalGridSize
} from '@/utils/mapPerformance';

interface OptimizedSalinityLayerProps {
  data: EnhancedSalinityData[];
  visible?: boolean;
  opacity?: number;
  showPerformanceMetrics?: boolean;
}

export function OptimizedSalinityLayer({
  data,
  visible = true,
  opacity = 0.6,
  showPerformanceMetrics = false
}: OptimizedSalinityLayerProps) {
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

  // PSU color scale function
  const getSalinityColor = useCallback((salinity: number): string => {
    if (salinity < 30) return '#2166ac'; // Very low salinity (blue)
    if (salinity < 32) return '#4393c3'; // Low salinity
    if (salinity < 34) return '#92c5de'; // Below average
    if (salinity < 35) return '#d1e5f0'; // Average ocean salinity
    if (salinity < 36) return '#fddbc7'; // Above average
    if (salinity < 37) return '#f4a582'; // High salinity
    if (salinity < 38) return '#d6604d'; // Very high
    return '#b2182b'; // Extremely high (red)
  }, []);

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

  // Optimize salinity data based on viewport and device
  const optimizedData = useMemo(() => {
    if (!data || data.length === 0 || !visible) return [];

    // Step 1: Filter by viewport with padding
    const viewportFiltered = filterByViewport(data, debouncedViewport, 0.1);

    // Step 2: Reduce based on zoom level
    const maxPoints = isMobile
      ? config.maxDataPoints / 4  // Fewer points for salinity on mobile
      : config.maxDataPoints / 2;
    const zoomReduced = reduceByZoom(viewportFiltered, currentZoom, maxPoints);

    // Step 3: Apply grid-based clustering for performance
    const gridSize = currentZoom < 8
      ? config.gridSize.low
      : currentZoom < 10
        ? config.gridSize.medium
        : config.gridSize.high;

    const gridData = new Map<string, typeof zoomReduced>();

    zoomReduced.forEach(point => {
      const gridKey = `${Math.floor(point.latitude / gridSize)},${Math.floor(point.longitude / gridSize)}`;
      if (!gridData.has(gridKey)) {
        gridData.set(gridKey, []);
      }
      gridData.get(gridKey)!.push(point);
    });

    // Create averaged data points per grid cell
    const clustered: any[] = [];
    gridData.forEach((points) => {
      if (points.length === 0) return;

      const avgLat = points.reduce((sum, p) => sum + p.latitude, 0) / points.length;
      const avgLon = points.reduce((sum, p) => sum + p.longitude, 0) / points.length;
      const avgSalinity = points.reduce((sum, p) => sum + p.salinity, 0) / points.length;
      const avgDepth = points.reduce((sum, p) => sum + (p.depth || 0), 0) / points.length;
      const minSalinity = Math.min(...points.map(p => p.salinity));
      const maxSalinity = Math.max(...points.map(p => p.salinity));

      // Find most recent timestamp
      const latestPoint = points.reduce((latest, p) =>
        new Date(p.timestamp) > new Date(latest.timestamp) ? p : latest
      );

      clustered.push({
        ...latestPoint,
        latitude: avgLat,
        longitude: avgLon,
        salinity: avgSalinity,
        depth: avgDepth,
        minSalinity,
        maxSalinity,
        clusterSize: points.length
      });
    });

    return clustered;
  }, [data, debouncedViewport, currentZoom, visible, isMobile, config]);

  // Adaptive radius calculation
  const getAdaptiveRadius = useCallback((zoom: number, clusterSize: number = 1) => {
    let baseRadius = isMobile
      ? Math.max(4, Math.min(10, zoom - 2))
      : Math.max(6, Math.min(14, zoom - 1));

    // Adjust for performance
    if (fps < 30 && fps > 0) {
      baseRadius *= 0.8;
    }

    // Cluster size adjustment
    const clusterMultiplier = Math.min(1.5, 1 + Math.log10(clusterSize) * 0.3);

    return baseRadius * clusterMultiplier;
  }, [isMobile, fps]);

  // Render optimized salinity markers
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
      const isCluster = point.clusterSize > 1;
      const radius = getAdaptiveRadius(currentZoom, point.clusterSize);
      const color = getSalinityColor(point.salinity);

      // Create circle marker with performance optimizations
      const circle = L.circleMarker([point.latitude, point.longitude], {
        radius: radius,
        fillColor: color,
        color: isCluster ? '#ffffff' : '#ffffff',
        weight: isCluster ? 2 : (currentZoom > 10 && !isMobile ? 1 : 0.5),
        opacity: isCluster ? 0.9 : 0.8,
        fillOpacity: opacity,
        className: 'salinity-marker'
      });

      // Add popup with reduced content on mobile
      if (!isMobile || currentZoom > 8) {
        const popupContent = isCluster
          ? `
            <div class="p-2">
              <h3 class="font-bold text-sm mb-1">Salinity Cluster</h3>
              <div class="text-xs space-y-1">
                <div><span class="font-semibold">Points:</span> ${point.clusterSize}</div>
                <div><span class="font-semibold">Avg Salinity:</span> ${point.salinity.toFixed(2)} PSU</div>
                <div><span class="font-semibold">Range:</span> ${point.minSalinity.toFixed(2)} - ${point.maxSalinity.toFixed(2)} PSU</div>
                ${point.depth > 0 ? `<div><span class="font-semibold">Avg Depth:</span> ${point.depth.toFixed(1)}m</div>` : ''}
                <div><span class="font-semibold">Location:</span> ${point.latitude.toFixed(3)}°, ${point.longitude.toFixed(3)}°</div>
                <div><span class="font-semibold">Source:</span> ${point.data_source}</div>
              </div>
            </div>
          `
          : `
            <div class="p-2">
              <h3 class="font-bold text-sm mb-1">Salinity Data</h3>
              <div class="text-xs space-y-1">
                <div><span class="font-semibold">Salinity:</span> ${point.salinity.toFixed(2)} PSU</div>
                ${!isMobile && point.depth > 0 ? `<div><span class="font-semibold">Depth:</span> ${point.depth.toFixed(1)}m</div>` : ''}
                ${!isMobile ? `<div><span class="font-semibold">Location:</span> ${point.latitude.toFixed(3)}°, ${point.longitude.toFixed(3)}°</div>` : ''}
                ${!isMobile ? `<div><span class="font-semibold">Source:</span> ${point.data_source}</div>` : ''}
                ${!isMobile ? `<div><span class="font-semibold">Updated:</span> ${new Date(point.timestamp).toLocaleString()}</div>` : ''}
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
            ? `${point.clusterSize} points: ${point.salinity.toFixed(1)} PSU`
            : `${point.salinity.toFixed(1)} PSU`;

          circle.bindTooltip(tooltipText, {
            permanent: false,
            direction: 'top',
            className: 'salinity-tooltip'
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
  }, [map, optimizedData, visible, opacity, currentZoom, isMobile, getSalinityColor, getAdaptiveRadius]);

  // Performance metrics display (development only)
  if (showPerformanceMetrics && process.env.NODE_ENV === 'development') {
    return (
      <div className="absolute top-48 left-4 z-[1000] bg-black/80 text-white p-2 rounded text-xs space-y-1">
        <div className="font-bold text-cyan-400">Salinity Layer</div>
        <div>FPS: <span className={fps < 30 ? 'text-red-400' : 'text-green-400'}>{fps}</span></div>
        <div>Render: {renderTime}ms</div>
        <div>Points: {optimizedData.length}/{data.length}</div>
        <div>Zoom: {currentZoom}</div>
        <div>Device: {isMobile ? 'Mobile' : 'Desktop'}</div>
        <div>Grid Cells: {optimizedData.filter(p => p.clusterSize > 1).length}</div>
      </div>
    );
  }

  return null;
}

/**
 * Optimized Salinity Legend Component
 * Mobile-responsive version of the salinity legend
 */
export function OptimizedSalinityLegend({
  visible = true,
  isMobile = false
}: {
  visible?: boolean;
  isMobile?: boolean;
}) {
  if (!visible) return null;

  const scale = isMobile ? [
    { value: '< 32', color: '#4393c3', label: 'Low' },
    { value: '32-35', color: '#92c5de', label: 'Normal' },
    { value: '35-37', color: '#f4a582', label: 'High' },
    { value: '> 37', color: '#d6604d', label: 'Very High' },
  ] : [
    { value: '< 30', color: '#2166ac', label: 'Very Low' },
    { value: '30-32', color: '#4393c3', label: 'Low' },
    { value: '32-34', color: '#92c5de', label: 'Below Avg' },
    { value: '34-35', color: '#d1e5f0', label: 'Average' },
    { value: '35-36', color: '#fddbc7', label: 'Above Avg' },
    { value: '36-37', color: '#f4a582', label: 'High' },
    { value: '37-38', color: '#d6604d', label: 'Very High' },
    { value: '> 38', color: '#b2182b', label: 'Extreme' },
  ];

  return (
    <div className={`absolute ${isMobile ? 'top-20 right-2' : 'bottom-20 right-4'}
      bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg
      ${isMobile ? 'p-2' : 'p-3'} shadow-lg z-[999]`}>
      <h4 className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold mb-2
        text-gray-800 dark:text-gray-200`}>
        Salinity (PSU)
      </h4>
      <div className={`${isMobile ? 'space-y-0.5' : 'space-y-1'}`}>
        {scale.map((item) => (
          <div key={item.value} className="flex items-center gap-2">
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
    </div>
  );
}
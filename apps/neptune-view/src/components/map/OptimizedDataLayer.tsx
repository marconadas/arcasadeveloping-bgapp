/**
 * Optimized Data Layer Component
 *
 * A performance-optimized layer component that implements:
 * - Viewport-based data filtering
 * - Zoom-level data reduction
 * - Debounced rendering
 * - Mobile-specific optimizations
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  filterByViewport,
  reduceByZoom,
  useDebounce,
  useMapPerformance,
  getPerformanceConfig,
  calculateOptimalGridSize
} from '@/utils/mapPerformance';

interface DataPoint {
  latitude: number;
  longitude: number;
  value: number;
  [key: string]: any;
}

interface OptimizedDataLayerProps<T extends DataPoint> {
  data: T[];
  visible?: boolean;
  opacity?: number;
  renderPoint: (point: T, map: L.Map) => L.Layer;
  getColor?: (value: number) => string;
  getRadius?: (value: number, zoom: number) => number;
  clusteringEnabled?: boolean;
  showPerformanceMetrics?: boolean;
}

export function OptimizedDataLayer<T extends DataPoint>({
  data,
  visible = true,
  opacity = 0.7,
  renderPoint,
  getColor,
  getRadius = (value, zoom) => Math.max(3, Math.min(10, zoom * 0.8)),
  clusteringEnabled = true,
  showPerformanceMetrics = false
}: OptimizedDataLayerProps<T>) {
  const map = useMap();
  const config = getPerformanceConfig();
  const [layerGroup, setLayerGroup] = useState<L.LayerGroup | null>(null);
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());
  const [viewport, setViewport] = useState(map.getBounds());

  // Performance monitoring
  const { fps, renderTime } = useMapPerformance({ current: map });

  // Debounced viewport for performance
  const debouncedViewport = useDebounce(viewport, config.debounceDelay);

  // Update viewport and zoom on map changes
  useEffect(() => {
    const updateMapState = () => {
      setCurrentZoom(map.getZoom());
      setViewport(map.getBounds());
    };

    map.on('moveend', updateMapState);
    map.on('zoomend', updateMapState);

    return () => {
      map.off('moveend', updateMapState);
      map.off('zoomend', updateMapState);
    };
  }, [map]);

  // Optimize data based on viewport and zoom
  const optimizedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (!visible) return [];

    // Step 1: Filter by viewport
    const viewportFiltered = filterByViewport(data, debouncedViewport);

    // Step 2: Reduce based on zoom level
    const zoomReduced = reduceByZoom(viewportFiltered, currentZoom);

    // Step 3: Apply clustering if enabled and zoom level is appropriate
    if (clusteringEnabled && currentZoom < config.clusteringThreshold) {
      return clusterDataPoints(zoomReduced, currentZoom);
    }

    return zoomReduced;
  }, [data, debouncedViewport, currentZoom, visible, clusteringEnabled, config.clusteringThreshold]);

  // Cluster data points for better performance
  const clusterDataPoints = useCallback((points: T[], zoom: number): T[] => {
    const viewportArea = calculateViewportArea(debouncedViewport);
    const gridSize = calculateOptimalGridSize(zoom, points.length, viewportArea);

    const clusters = new Map<string, T[]>();

    points.forEach(point => {
      const gridKey = `${Math.floor(point.latitude / gridSize)},${Math.floor(point.longitude / gridSize)}`;

      if (!clusters.has(gridKey)) {
        clusters.set(gridKey, []);
      }
      clusters.get(gridKey)!.push(point);
    });

    // Create cluster representatives
    const clustered: T[] = [];
    clusters.forEach((clusterPoints) => {
      if (clusterPoints.length === 1) {
        clustered.push(clusterPoints[0]);
      } else {
        // Create a cluster representative (average position and value)
        const avgLat = clusterPoints.reduce((sum, p) => sum + p.latitude, 0) / clusterPoints.length;
        const avgLon = clusterPoints.reduce((sum, p) => sum + p.longitude, 0) / clusterPoints.length;
        const avgValue = clusterPoints.reduce((sum, p) => sum + p.value, 0) / clusterPoints.length;

        const clusterRep = {
          ...clusterPoints[0],
          latitude: avgLat,
          longitude: avgLon,
          value: avgValue,
          clusterSize: clusterPoints.length
        } as T;

        clustered.push(clusterRep);
      }
    });

    return clustered;
  }, [debouncedViewport]);

  // Render optimized data
  useEffect(() => {
    if (!map || !visible || optimizedData.length === 0) {
      if (layerGroup) {
        map.removeLayer(layerGroup);
        setLayerGroup(null);
      }
      return;
    }

    // Clear previous layer
    if (layerGroup) {
      map.removeLayer(layerGroup);
    }

    // Create new layer group
    const newLayerGroup = L.layerGroup();

    // Render each data point
    optimizedData.forEach(point => {
      const layer = renderPoint(point, map);

      if (layer instanceof L.CircleMarker) {
        // Apply optimizations to circle markers
        layer.setStyle({
          fillOpacity: opacity,
          weight: currentZoom > 10 ? 1 : 0, // Hide borders at low zoom
          radius: getRadius ? getRadius(point.value, currentZoom) : 5
        });

        // Add reduced popup content on mobile
        if (config.maxDataPoints < 1000) { // Mobile device
          layer.bindPopup(`
            <div class="text-xs">
              <strong>Value:</strong> ${point.value.toFixed(2)}<br/>
              ${point.clusterSize ? `<strong>Points:</strong> ${point.clusterSize}` : ''}
            </div>
          `, { maxWidth: 150 });
        }
      }

      newLayerGroup.addLayer(layer);
    });

    newLayerGroup.addTo(map);
    setLayerGroup(newLayerGroup);

    // Cleanup
    return () => {
      if (newLayerGroup) {
        map.removeLayer(newLayerGroup);
      }
    };
  }, [map, optimizedData, visible, opacity, currentZoom, renderPoint, getRadius, config.maxDataPoints]);

  // Performance metrics display
  if (showPerformanceMetrics && process.env.NODE_ENV === 'development') {
    return (
      <>
        <div className="absolute top-20 left-4 z-[1000] bg-black/70 text-white p-2 rounded text-xs">
          <div>FPS: {fps}</div>
          <div>Render: {renderTime}ms</div>
          <div>Points: {optimizedData.length}/{data.length}</div>
          <div>Zoom: {currentZoom}</div>
        </div>
      </>
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
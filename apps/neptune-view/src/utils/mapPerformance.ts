/**
 * Map Performance Optimization Utilities
 *
 * Provides performance optimizations for mobile devices including:
 * - Viewport-based data filtering
 * - Zoom level data reduction
 * - Debounced rendering
 * - Performance monitoring
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';

// Device detection
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768;
};

// Performance configuration based on device type
export const getPerformanceConfig = () => {
  const isMobile = isMobileDevice();

  return {
    // Data point limits
    maxDataPoints: isMobile ? 500 : 2000,
    maxVessels: isMobile ? 50 : 200,
    maxMLPredictions: isMobile ? 100 : 500,

    // Clustering thresholds
    clusteringThreshold: isMobile ? 8 : 10, // Zoom level at which to start clustering

    // Render optimization
    debounceDelay: isMobile ? 300 : 100, // ms
    updateInterval: isMobile ? 2000 : 1000, // ms

    // Map interaction
    preferCanvas: true, // Always use canvas for better performance
    markerZoomAnimation: !isMobile, // Disable animations on mobile
    zoomAnimation: !isMobile,
    fadeAnimation: !isMobile,

    // Data aggregation grid size (degrees)
    gridSize: {
      high: 0.05, // Zoom 10+
      medium: 0.1, // Zoom 7-9
      low: 0.25   // Zoom < 7
    }
  };
};

/**
 * Filter data points based on viewport bounds
 */
export function filterByViewport<T extends { latitude: number; longitude: number }>(
  data: T[],
  bounds: L.LatLngBounds,
  padding: number = 0.1 // Add padding to prevent edge clipping
): T[] {
  const north = bounds.getNorth() + padding;
  const south = bounds.getSouth() - padding;
  const east = bounds.getEast() + padding;
  const west = bounds.getWest() - padding;

  return data.filter(point =>
    point.latitude >= south &&
    point.latitude <= north &&
    point.longitude >= west &&
    point.longitude <= east
  );
}

/**
 * Reduce data points based on zoom level
 */
export function reduceByZoom<T extends { latitude: number; longitude: number }>(
  data: T[],
  zoom: number,
  maxPoints?: number
): T[] {
  const config = getPerformanceConfig();
  const limit = maxPoints || config.maxDataPoints;

  if (data.length <= limit) return data;

  // Determine grid size based on zoom
  let gridSize: number;
  if (zoom >= 10) {
    gridSize = config.gridSize.high;
  } else if (zoom >= 7) {
    gridSize = config.gridSize.medium;
  } else {
    gridSize = config.gridSize.low;
  }

  // Grid-based aggregation
  const grid = new Map<string, T>();

  data.forEach(point => {
    const gridKey = `${Math.floor(point.latitude / gridSize)},${Math.floor(point.longitude / gridSize)}`;

    // Keep only one point per grid cell (could be enhanced to average)
    if (!grid.has(gridKey)) {
      grid.set(gridKey, point);
    }
  });

  const reduced = Array.from(grid.values());

  // If still too many points, sample evenly
  if (reduced.length > limit) {
    const step = Math.ceil(reduced.length / limit);
    return reduced.filter((_, index) => index % step === 0);
  }

  return reduced;
}

/**
 * Debounce hook for expensive operations
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Performance monitoring hook
 */
export function useMapPerformance(mapRef: React.MutableRefObject<L.Map | null>) {
  const frameTimesRef = useRef<number[]>([]);
  const renderStartRef = useRef<number>(0);
  const [fps, setFps] = useState<number>(60);
  const [renderTime, setRenderTime] = useState<number>(0);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    let animationFrameId: number;

    // FPS monitoring
    const measureFps = () => {
      const now = performance.now();
      frameTimesRef.current.push(now);

      // Keep only last 60 frames
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift();
      }

      // Calculate FPS from last 60 frames
      if (frameTimesRef.current.length >= 2) {
        const elapsed = frameTimesRef.current[frameTimesRef.current.length - 1] - frameTimesRef.current[0];
        const currentFps = Math.round((frameTimesRef.current.length - 1) / (elapsed / 1000));
        setFps(currentFps);
      }

      animationFrameId = requestAnimationFrame(measureFps);
    };

    // Start FPS monitoring
    if (process.env.NODE_ENV === 'development') {
      measureFps();
    }

    // Render time monitoring
    const handleMoveStart = () => {
      renderStartRef.current = performance.now();
    };

    const handleMoveEnd = () => {
      if (renderStartRef.current) {
        const elapsed = performance.now() - renderStartRef.current;
        setRenderTime(Math.round(elapsed));
        renderStartRef.current = 0;
      }
    };

    map.on('movestart', handleMoveStart);
    map.on('moveend', handleMoveEnd);
    map.on('zoomstart', handleMoveStart);
    map.on('zoomend', handleMoveEnd);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      map.off('movestart', handleMoveStart);
      map.off('moveend', handleMoveEnd);
      map.off('zoomstart', handleMoveStart);
      map.off('zoomend', handleMoveEnd);
    };
  }, [mapRef]);

  return { fps, renderTime };
}

/**
 * Optimized data fetching hook with caching
 */
export function useOptimizedDataFetch<T>(
  fetchFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: {
    cacheTime?: number; // Cache duration in ms
    viewport?: L.LatLngBounds | null;
    zoom?: number;
  } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef<{ data: T; timestamp: number } | null>(null);

  const config = getPerformanceConfig();
  const debouncedDeps = useDebounce(dependencies, config.debounceDelay);

  const fetchData = useCallback(async () => {
    // Check cache
    if (cacheRef.current && options.cacheTime) {
      const cacheAge = Date.now() - cacheRef.current.timestamp;
      if (cacheAge < options.cacheTime) {
        setData(cacheRef.current.data);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction();

      // Cache the result
      cacheRef.current = {
        data: result,
        timestamp: Date.now()
      };

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, options.cacheTime]);

  useEffect(() => {
    fetchData();
  }, [...debouncedDeps, fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Calculate optimal grid size based on zoom and data density
 */
export function calculateOptimalGridSize(
  zoom: number,
  dataPointCount: number,
  viewportArea: number // in square degrees
): number {
  const density = dataPointCount / viewportArea;
  const config = getPerformanceConfig();

  // Base grid size on zoom
  let baseGridSize = config.gridSize.low;
  if (zoom >= 10) baseGridSize = config.gridSize.high;
  else if (zoom >= 7) baseGridSize = config.gridSize.medium;

  // Adjust based on density
  if (density > 1000) {
    // High density - use larger grid
    return baseGridSize * 2;
  } else if (density > 500) {
    // Medium density
    return baseGridSize * 1.5;
  }

  return baseGridSize;
}

/**
 * Performance metrics display component props
 */
export interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  dataPoints: number;
  viewportDataPoints: number;
  cacheHitRate: number;
}

/**
 * Get performance recommendations based on metrics
 */
export function getPerformanceRecommendations(metrics: PerformanceMetrics): string[] {
  const recommendations: string[] = [];

  if (metrics.fps < 30) {
    recommendations.push('Low FPS detected. Consider reducing data points or disabling some layers.');
  }

  if (metrics.renderTime > 500) {
    recommendations.push('Slow render times. Try zooming in to reduce visible data.');
  }

  if (metrics.viewportDataPoints > 1000) {
    recommendations.push('Too many data points in viewport. Enable clustering or reduce detail.');
  }

  if (metrics.cacheHitRate < 0.5) {
    recommendations.push('Low cache hit rate. Consider increasing cache duration.');
  }

  return recommendations;
}
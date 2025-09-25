'use client';

import { useEffect, useState, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import chroma from 'chroma-js';
import * as turf from '@turf/turf';
// Import regular leaflet heat for now until OptimizedHeatLayer is fully compatible
// import { OptimizedHeatLayer } from '@/lib/leaflet-heat-optimized';
import 'leaflet.heat';
import { useAnimationFrame, easingFunctions, useAnimationPerformance } from '@/hooks/useAnimationFrame';

// Type definitions for leaflet.heat
declare module 'leaflet' {
  namespace L {
    function heatLayer(latlngs: any[], options?: any): any;
  }
}

interface TemperatureData {
  lat: number;
  lon: number;
  temperature: number;
}

interface TemperatureHeatmapLayerProps {
  data: TemperatureData[];
  visible: boolean;
  opacity?: number;
  showContours?: boolean;
  eezBoundary?: GeoJSON.Feature | null;
}

export function TemperatureHeatmapLayer({
  data,
  visible,
  opacity = 0.7,
  showContours = false,
  eezBoundary = null
}: TemperatureHeatmapLayerProps) {
  const map = useMap();
  const [heatLayer, setHeatLayer] = useState<any | null>(null);

  // Performance monitoring
  const performance = useAnimationPerformance();

  // Temperature color scale based on NOAA standards - optimized for Angola waters
  // Updated range based on actual data analysis: 18.0°C to 24.82°C
  const temperatureScale = chroma.scale([
    '#001f3f', // 18°C: Deep Navy (coldest)
    '#003d7a', // 19°C: Navy Blue
    '#0074D9', // 20°C: Blue
    '#39CCCC', // 21°C: Cyan
    '#3D9970', // 22°C: Sea Green
    '#2ECC40', // 23°C: Green
    '#01FF70', // 24°C: Spring Green
    '#FFDC00', // 25°C: Yellow (warmest in our range)
    '#FF851B'  // Reserve warmer colors for future data expansion
  ]).domain([18, 25]);

  useEffect(() => {
    if (!map || !data || data.length === 0 || !visible) {
      // Remove existing layer using safe removal
      if (heatLayer) {
        heatLayer.remove();
      }
      setHeatLayer(null);
      return;
    }

    // Remove existing layer before creating new one
    if (heatLayer) {
      heatLayer.remove();
      setHeatLayer(null);
    }

    // Filter data to only include points within EEZ if boundary is provided
    // This handles both Polygon and MultiPolygon (including Cabinda)
    let filteredData = data;
    if (eezBoundary && eezBoundary.geometry) {
      filteredData = data.filter(point => {
        const pointFeature = turf.point([point.lon, point.lat]);
        try {
          // turf.booleanPointInPolygon handles both Polygon and MultiPolygon
          return turf.booleanPointInPolygon(pointFeature, eezBoundary as any);
        } catch (e) {
          console.warn('Point-in-polygon check failed for point:', point, e);
          return false; // Exclude point if check fails
        }
      });
    }

    // Prepare data for heatmap - [lat, lng, intensity]
    const heatPoints: [number, number, number][] = filteredData.map(point => [
      point.lat,
      point.lon,
      normalizeTemperature(point.temperature)
    ]);

    // Create heatmap layer with smoother, more continuous visualization
    let newHeatLayer: any = null;

    try {
      // Check if we have valid data points
      if (heatPoints.length === 0) {
        console.warn('No temperature data points to display');
        return;
      }

      newHeatLayer = L.heatLayer(heatPoints, {
        radius: 50,     // Larger radius for better coverage
        blur: 35,       // More blur for seamless transitions
        maxZoom: 18,
        max: 1.0,
        minOpacity: opacity * 0.2,
        gradient: {
          0.0:  'rgba(0, 31, 63, 0.4)',    // Deep Navy - 18°C (more visible)
          0.15: 'rgba(0, 116, 217, 0.6)',  // Blue - 19°C
          0.3:  'rgba(57, 204, 204, 0.7)', // Cyan - 20°C
          0.45: 'rgba(61, 153, 112, 0.8)', // Sea Green - 21°C
          0.6:  'rgba(46, 204, 64, 0.85)', // Green - 22°C
          0.75: 'rgba(1, 255, 112, 0.9)',  // Spring Green - 23°C
          0.85: 'rgba(255, 220, 0, 0.95)', // Yellow - 24°C
          0.95: 'rgba(255, 133, 27, 1)',   // Orange - 24.5°C
          1.0:  'rgba(255, 65, 54, 1)'     // Red-Orange - 25°C (hottest)
        }
      });

      // Add to map only if creation was successful
      if (newHeatLayer && map) {
        newHeatLayer.addTo(map);
        setHeatLayer(newHeatLayer);
      }
    } catch (error) {
      console.error('Error creating heatmap layer:', error);
      return;
    }

    // Cleanup function
    return () => {
      // Remove layer using safe removal
      if (newHeatLayer) {
        newHeatLayer.remove();
      }
    };
  }, [map, data, visible, opacity, eezBoundary]);

  // Separate animation effect using the optimized hook
  useAnimationFrame(
    ({ progress, deltaTime, actualFPS }) => {
      // Check if layer and map are still valid
      if (!heatLayer || !map || !visible) {
        return false; // Stop animation
      }

      // Monitor performance and track frame drops
      performance.monitor(actualFPS, deltaTime);

      // Check if the map has a valid size (not detached from DOM)
      try {
        const size = map.getSize();
        if (!size || size.x === 0 || size.y === 0) {
          return true; // Continue animation but skip this frame
        }
      } catch (e) {
        return false; // Stop animation if map is destroyed
      }

      // Use breathing easing function for smooth pulsing effect
      const breathingProgress = easingFunctions.breathing(progress);
      const pulseOpacity = opacity + breathingProgress * 0.08; // Slightly larger pulse range

      // Update layer opacity with smooth transitions
      try {
        if (heatLayer && heatLayer.setOptions) {
          heatLayer.setOptions({
            minOpacity: Math.max(0.15, Math.min(0.9, pulseOpacity * 0.4))
          });
        }
      } catch (e) {
        // Silently continue if layer update fails
      }

      return true; // Continue animation
    },
    {
      fps: 30, // Smooth but efficient 30fps
      enabled: visible && !!heatLayer && !!map,
      autoStart: true
    }
  );

  return null;
}

// Normalize temperature to 0-1 range for heatmap intensity
// Based on actual data analysis: 18.00°C to 24.82°C range
function normalizeTemperature(temp: number): number {
  const minTemp = 18.0;  // Actual minimum from data analysis
  const maxTemp = 25.0;  // Slightly above actual maximum (24.82°C) for better spread
  return Math.max(0, Math.min(1, (temp - minTemp) / (maxTemp - minTemp)));
}
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

    // Calculate min/max from actual data for better normalization
    const temperatures = filteredData.map(p => p.temperature);
    const actualMin = Math.min(...temperatures);
    const actualMax = Math.max(...temperatures);

    // Use wider range for better color distribution
    const rangeMin = Math.min(actualMin, 18.0);
    const rangeMax = Math.max(actualMax, 30.0);

    console.log(`Temperature range: ${actualMin.toFixed(2)}°C - ${actualMax.toFixed(2)}°C, normalized to ${rangeMin}°C - ${rangeMax}°C`);

    // Prepare data for heatmap - [lat, lng, intensity] with improved normalization
    const heatPoints: [number, number, number][] = filteredData.map(point => {
      const normalized = Math.max(0.1, Math.min(1.0, (point.temperature - rangeMin) / (rangeMax - rangeMin)));
      return [point.lat, point.lon, normalized];
    });

    // Create heatmap layer with smoother, more continuous visualization
    let newHeatLayer: any = null;

    try {
      // Check if we have valid data points
      if (heatPoints.length === 0) {
        console.warn('No temperature data points to display');
        return;
      }

      newHeatLayer = L.heatLayer(heatPoints, {
        radius: 60,     // Larger radius for better coverage
        blur: 40,       // More blur for seamless transitions
        maxZoom: 18,
        max: 1.0,
        minOpacity: opacity * 0.3,
        gradient: {
          0.0:  '#000080',  // Navy blue - coldest
          0.1:  '#0040FF',  // Blue
          0.2:  '#0080FF',  // Light blue
          0.3:  '#00C0FF',  // Cyan
          0.4:  '#00FFFF',  // Pure cyan
          0.5:  '#40FF80',  // Cyan-green
          0.6:  '#80FF40',  // Green-yellow
          0.7:  '#FFFF00',  // Yellow
          0.8:  '#FF8000',  // Orange
          0.9:  '#FF4000',  // Red-orange
          1.0:  '#FF0000'   // Red - hottest
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
      const pulseOpacity = opacity + breathingProgress * 0.12; // Increased pulse range for visibility

      // Update layer opacity and trigger redraw
      try {
        if (heatLayer && heatLayer.setOptions) {
          const newMinOpacity = Math.max(0.2, Math.min(0.8, pulseOpacity * 0.5));

          // Update options and force redraw
          heatLayer.setOptions({
            minOpacity: newMinOpacity
          });

          // Force canvas redraw by calling redraw if available
          if (heatLayer.redraw && typeof heatLayer.redraw === 'function') {
            heatLayer.redraw();
          }

          // Alternative: trigger map invalidation to force layer redraw
          if (map.invalidateSize && actualFPS > 20) { // Only if performance is good
            setTimeout(() => map.invalidateSize({ animate: false }), 0);
          }
        }
      } catch (e) {
        console.warn('Animation frame update failed:', e);
      }

      return true; // Continue animation
    },
    {
      fps: 24, // Reduced to 24fps for better performance while maintaining smoothness
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
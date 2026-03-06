'use client';

import { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import chroma from 'chroma-js';
import * as turf from '@turf/turf';

// Extend Leaflet type for heatLayer from leaflet.heat plugin
declare module 'leaflet' {
  function heatLayer(latlngs: [number, number, number][], options?: any): Layer;
}

// Safe wrapper for chlorophyll heat layer
class SafeChlorophyllHeatLayer {
  private layer: L.Layer | null = null;
  private isDestroyed = false;

  constructor(latlngs: [number, number, number][], options?: any) {
    try {
      this.layer = L.heatLayer(latlngs, options);
      // Override internal methods to check if destroyed
      const originalRedraw = (this.layer as any)._redraw;
      if (originalRedraw) {
        (this.layer as any)._redraw = () => {
          if (!this.isDestroyed && (this.layer as any)._map) {
            try {
              originalRedraw.call(this.layer);
            } catch (e) {
              console.warn('Chlorophyll heat layer redraw error caught:', e);
            }
          }
        };
      }
    } catch (e) {
      console.error('Failed to create chlorophyll heat layer:', e);
    }
  }

  addTo(map: L.Map): SafeChlorophyllHeatLayer {
    if (this.layer && !this.isDestroyed) {
      this.layer.addTo(map);
    }
    return this;
  }

  remove(): void {
    if (this.layer) {
      this.isDestroyed = true;
      // Clear all internal references
      if ((this.layer as any)._map) {
        try {
          (this.layer as any)._map.removeLayer(this.layer);
        } catch (e) {
          // Ignore
        }
        (this.layer as any)._map = null;
      }
      if ((this.layer as any)._heat) {
        (this.layer as any)._heat = null;
      }
      if ((this.layer as any)._frame) {
        (this.layer as any)._frame = null;
      }
      this.layer = null;
    }
  }

  getLayer(): L.Layer | null {
    return this.isDestroyed ? null : this.layer;
  }
}

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

interface ChlorophyllHeatmapLayerProps {
  data: ChlorophyllData[];
  visible: boolean;
  opacity?: number;
  showContours?: boolean;
  eezBoundary?: GeoJSON.Feature | null;
}

export function ChlorophyllHeatmapLayer({
  data,
  visible,
  opacity = 0.65,
  showContours = false,
  eezBoundary = null
}: ChlorophyllHeatmapLayerProps) {
  const map = useMap();
  const [heatLayer, setHeatLayer] = useState<SafeChlorophyllHeatLayer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // NASA/ESA Ocean Color standard palette for chlorophyll-a concentration
  // Following Copernicus Marine Service visualization standards
  const chlorophyllScale = chroma.scale([
    '#000033', // 0.01 mg/m³: Deep purple (ultra-oligotrophic)
    '#000055', // 0.03 mg/m³: Dark blue
    '#0000aa', // 0.05 mg/m³: Navy blue
    '#0000ff', // 0.1 mg/m³: Blue (oligotrophic open ocean)
    '#0055ff', // 0.2 mg/m³: Blue-cyan transition
    '#00aaff', // 0.3 mg/m³: Cyan (mesotrophic)
    '#00ffaa', // 0.4 mg/m³: Cyan-green
    '#00ff00', // 0.5 mg/m³: Green (productive waters)
    '#55ff00', // 0.7 mg/m³: Yellow-green
    '#aaff00', // 0.9 mg/m³: Light yellow-green
    '#ffff00', // 1.0 mg/m³: Yellow (eutrophic)
    '#ffaa00', // 2.0 mg/m³: Orange
    '#ff5500', // 3.0 mg/m³: Deep orange
    '#ff0000', // 5.0 mg/m³: Red (high productivity)
    '#aa0000', // 7.0 mg/m³: Dark red
    '#550000'  // 10+ mg/m³: Deep red (hyper-eutrophic/bloom)
  ]).mode('lab').domain([0.01, 0.03, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.7, 0.9, 1.0, 2.0, 3.0, 5.0, 7.0, 10]); // Logarithmic scale

  useEffect(() => {
    if (!map || !data || data.length === 0 || !visible) {
      // Cancel animation first
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

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
    let filteredData = data;
    if (eezBoundary && eezBoundary.geometry) {
      filteredData = data.filter(point => {
        const lon = point.lon || point.lng || 0;
        const pointFeature = turf.point([lon, point.lat]);
        try {
          return turf.booleanPointInPolygon(pointFeature, eezBoundary as any);
        } catch (e) {
          console.warn('Point-in-polygon check failed for chlorophyll point:', point, e);
          return false;
        }
      });
    }

    // Prepare data for heatmap - [lat, lng, intensity]
    const heatPoints: [number, number, number][] = filteredData.map(point => {
      const lon = point.lon || point.lng || 0;
      const chlorophyllValue = point.chlorophyll || point.value || 0;
      return [
        point.lat,
        lon,
        normalizeChlorophyll(chlorophyllValue)
      ];
    });

    // Create heatmap layer with chlorophyll-specific visualization
    let newHeatLayer: SafeChlorophyllHeatLayer | null = null;

    try {
      // Check if we have valid data points
      if (heatPoints.length === 0) {
        console.warn('No chlorophyll data points to display');
        return;
      }

      // Adjust visualization parameters based on data density
      const dataPointDensity = heatPoints.length / 1000; // Normalize by expected max points
      const adaptiveRadius = Math.max(25, Math.min(60, 40 + dataPointDensity * 10));
      const adaptiveBlur = Math.max(20, Math.min(40, 25 + dataPointDensity * 5));

      newHeatLayer = new SafeChlorophyllHeatLayer(heatPoints, {
        radius: adaptiveRadius,  // Adaptive radius based on data density
        blur: adaptiveBlur,      // Adaptive blur for smooth transitions
        maxZoom: 18,
        max: 1.0,
        minOpacity: opacity * 0.1,
        gradient: {
          // NASA Ocean Color gradient (logarithmic scale)
          0.0:   'rgba(0, 0, 51, 0)',        // Transparent at edges
          0.02:  'rgba(0, 0, 51, 0.15)',     // Deep purple - ultra-oligotrophic
          0.05:  'rgba(0, 0, 85, 0.25)',     // Dark blue
          0.1:   'rgba(0, 0, 170, 0.35)',    // Navy blue
          0.15:  'rgba(0, 0, 255, 0.45)',    // Blue - oligotrophic
          0.2:   'rgba(0, 85, 255, 0.5)',    // Blue-cyan
          0.25:  'rgba(0, 170, 255, 0.55)',  // Cyan - mesotrophic
          0.3:   'rgba(0, 255, 170, 0.6)',   // Cyan-green
          0.35:  'rgba(0, 255, 85, 0.65)',   // Green-cyan
          0.4:   'rgba(0, 255, 0, 0.7)',     // Green - productive
          0.45:  'rgba(85, 255, 0, 0.72)',   // Yellow-green
          0.5:   'rgba(170, 255, 0, 0.75)',  // Light yellow-green
          0.55:  'rgba(255, 255, 0, 0.78)',  // Yellow - eutrophic
          0.65:  'rgba(255, 200, 0, 0.82)',  // Yellow-orange
          0.75:  'rgba(255, 170, 0, 0.85)',  // Orange
          0.85:  'rgba(255, 85, 0, 0.88)',   // Deep orange
          0.92:  'rgba(255, 0, 0, 0.92)',    // Red - high productivity
          0.96:  'rgba(170, 0, 0, 0.95)',    // Dark red
          1.0:   'rgba(85, 0, 0, 1)'         // Deep red - bloom conditions
        }
      });

      // Add to map only if creation was successful
      if (newHeatLayer && map) {
        newHeatLayer.addTo(map);
        setHeatLayer(newHeatLayer);
      }
    } catch (error) {
      console.error('Error creating chlorophyll heatmap layer:', error);
      return;
    }

    // If no layer was created, exit early
    if (!newHeatLayer) {
      return;
    }

    // Animate chlorophyll changes with subtle pulsing
    let animationStep = 0;
    const animateChlorophyll = () => {
      // Check if layer and map are still valid
      const layer = newHeatLayer?.getLayer();
      if (!layer || !map) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }

      // Check if the map has a valid size (not detached from DOM)
      try {
        const size = map.getSize();
        if (!size || size.x === 0 || size.y === 0) {
          // Map is not ready or hidden, skip animation
          animationFrameRef.current = requestAnimationFrame(animateChlorophyll);
          return;
        }
      } catch (e) {
        // Map is likely destroyed or not ready
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }

      animationStep += 0.005; // Very slow animation for chlorophyll (natural ocean dynamics)
      // Extremely subtle pulsing to simulate natural variability
      const pulseOpacity = opacity + Math.sin(animationStep) * 0.02;

      // Update layer if possible
      try {
        if ((layer as any).setOptions) {
          (layer as any).setOptions({
            minOpacity: Math.max(0.15, Math.min(1, pulseOpacity * 0.35))
          });
        }
      } catch (e) {
        // Silently ignore if layer update fails
      }

      animationFrameRef.current = requestAnimationFrame(animateChlorophyll);
    };

    // Start animation after a small delay to ensure map is ready
    setTimeout(() => {
      if (map && newHeatLayer) {
        animateChlorophyll();
      }
    }, 100);

    // Cleanup function
    return () => {
      // Cancel animation first
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Remove layer using safe removal
      if (newHeatLayer) {
        newHeatLayer.remove();
      }
    };
  }, [map, data, visible, opacity, eezBoundary]);

  return null;
}

// Normalize chlorophyll concentration to 0-1 range for heatmap intensity
// Using logarithmic scale as chlorophyll varies exponentially (0.01 to 10 mg/m³)
function normalizeChlorophyll(chloro: number): number {
  const minChlorophyll = 0.01; // Minimum chlorophyll concentration (mg/m³)
  const maxChlorophyll = 10;   // Maximum chlorophyll concentration (mg/m³)

  // Clamp value to valid range
  const clampedValue = Math.max(minChlorophyll, Math.min(maxChlorophyll, chloro));

  // Use logarithmic scale for better distribution
  // This matches the NASA Ocean Color standard scale
  const logMin = Math.log10(minChlorophyll); // -2
  const logMax = Math.log10(maxChlorophyll); // 1
  const logValue = Math.log10(clampedValue);

  // Normalize to 0-1 range
  const normalized = (logValue - logMin) / (logMax - logMin);

  // Apply slight power curve to enhance mid-range values (0.3-1.0 mg/m³)
  // This makes productive coastal waters more visible
  return Math.pow(normalized, 0.85);
}
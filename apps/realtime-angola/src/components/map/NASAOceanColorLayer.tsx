'use client';

import React, { useEffect, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { nasaDataService } from '@/services/nasaDataService';

interface NASAOceanColorLayerProps {
  visible: boolean;
  opacity?: number;
  showContours?: boolean;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  onDataLoad?: (data: any) => void;
}

declare module 'leaflet' {
  function heatLayer(latlngs: any[], options?: any): any;
}

export function NASAOceanColorLayer({
  visible,
  opacity = 0.7,
  showContours = false,
  dateRange,
  onDataLoad
}: NASAOceanColorLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!visible || !map) return;

    let heatLayer: any = null;

    const loadOceanColorData = async () => {
      try {
        // Fetch NASA ocean color data
        const response = await nasaDataService.getOceanColorData({
          startDate: dateRange?.startDate || new Date().toISOString().split('T')[0],
          endDate: dateRange?.endDate || new Date().toISOString().split('T')[0]
        });

        if (response.data && response.data.length > 0) {
          // Process data for heatmap
          const heatData = response.data.map((point: any) => [
            point.lat,
            point.lon,
            point.chlorophyll_a || 0
          ]);

          // Create heat layer
          heatLayer = (L as any).heatLayer(heatData, {
            radius: 25,
            blur: 15,
            maxZoom: 10,
            max: 10, // Max chlorophyll value in mg/m³
            gradient: {
              0.0: '#000033',
              0.1: '#000055',
              0.2: '#0000aa',
              0.3: '#0055ff',
              0.4: '#00ffaa',
              0.5: '#00ff00',
              0.6: '#aaff00',
              0.7: '#ffff00',
              0.8: '#ff5500',
              0.9: '#ff0000',
              1.0: '#550000'
            }
          });

          heatLayer.setOptions({ opacity });
          heatLayer.addTo(map);

          // Add contour lines if requested
          if (showContours && response.data.length > 0) {
            const contourLevels = [0.1, 0.5, 1.0, 2.0, 5.0, 10.0];

            contourLevels.forEach(level => {
              const contourPoints = response.data
                .filter((p: any) => Math.abs(p.chlorophyll_a - level) < 0.1)
                .map((p: any) => [p.lat, p.lon]);

              if (contourPoints.length > 2) {
                L.polyline(contourPoints as L.LatLngExpression[], {
                  color: `rgba(255, 255, 255, ${0.3 + level/20})`,
                  weight: 1,
                  opacity: 0.6,
                  dashArray: '5, 5'
                }).addTo(map);
              }
            });
          }

          // Callback with loaded data
          if (onDataLoad) {
            onDataLoad({
              data: response.data,
              metadata: response.metadata,
              visualization: response.visualization
            });
          }
        }
      } catch (error) {
        console.error('Error loading NASA ocean color data:', error);
      }
    };

    loadOceanColorData();

    return () => {
      if (heatLayer) {
        map.removeLayer(heatLayer);
      }
    };
  }, [visible, map, opacity, showContours, dateRange, onDataLoad]);

  return null;
}
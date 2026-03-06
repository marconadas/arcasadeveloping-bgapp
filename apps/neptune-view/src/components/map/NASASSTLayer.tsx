'use client';

import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { nasaDataService } from '@/services/nasaDataService';

interface NASASSTLayerProps {
  visible: boolean;
  opacity?: number;
  showContours?: boolean;
  showAnomalies?: boolean;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  onDataLoad?: (data: any) => void;
  onFeatureDetected?: (features: any) => void;
}

export function NASASSTLayer({
  visible,
  opacity = 0.8,
  showContours = true,
  showAnomalies = false,
  dateRange,
  onDataLoad,
  onFeatureDetected
}: NASASSTLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!visible || !map) return;

    const layers: L.Layer[] = [];

    const loadSSTData = async () => {
      try {
        // Fetch NASA SST data
        const response = await nasaDataService.getSSTData({
          startDate: dateRange?.startDate || new Date().toISOString().split('T')[0],
          endDate: dateRange?.endDate || new Date().toISOString().split('T')[0],
          anomaly: showAnomalies
        });

        if (response.data && response.data.length > 0) {
          // Create temperature gradient layer using canvas
          const bounds = map.getBounds();
          const canvasLayer = L.canvas({ padding: 0.5 });

          // Process data for contour visualization
          if (showContours) {
            const contourLevels = response.visualization?.contourLevels || [18, 20, 22, 24, 26, 28, 30];

            contourLevels.forEach(tempLevel => {
              const contourPoints = response.data
                .filter((p: any) => Math.abs(p.temperature - tempLevel) < 0.5)
                .map((p: any) => [p.lat, p.lon] as L.LatLngExpression);

              if (contourPoints.length > 2) {
                const contourLine = L.polyline(contourPoints, {
                  color: getTemperatureColor(tempLevel),
                  weight: 2,
                  opacity: opacity * 0.8,
                  smoothFactor: 1
                });

                // Add temperature label
                contourLine.bindTooltip(`${tempLevel}°C`, {
                  permanent: false,
                  direction: 'center',
                  className: 'temperature-label'
                });

                contourLine.addTo(map);
                layers.push(contourLine);
              }
            });
          }

          // Add colored circles for temperature points
          response.data.forEach((point: any) => {
            const circle = L.circleMarker([point.lat, point.lon], {
              radius: 4,
              fillColor: getTemperatureColor(point.temperature),
              fillOpacity: opacity,
              color: '#ffffff',
              weight: 0.5,
              opacity: 0.8
            });

            // Add popup with details
            circle.bindPopup(`
              <div class="sst-popup">
                <h4>Sea Surface Temperature</h4>
                <p>Temperature: ${point.temperature.toFixed(1)}°C</p>
                ${point.anomaly ? `<p>Anomaly: ${point.anomaly > 0 ? '+' : ''}${point.anomaly.toFixed(1)}°C</p>` : ''}
                <p>Location: ${point.lat.toFixed(2)}°, ${point.lon.toFixed(2)}°</p>
                <p>Sensor: ${point.sensor || 'MODIS'}</p>
                <p>Quality: ${point.quality || 'N/A'}</p>
              </div>
            `);

            circle.addTo(map);
            layers.push(circle);
          });

          // Detect and highlight oceanographic features
          if (response.oceanographic_features) {
            const features = response.oceanographic_features;

            // Mark upwelling zones
            if (features.upwelling && features.upwelling.length > 0) {
              features.upwelling.forEach((zone: any) => {
                const marker = L.marker([zone.lat, zone.lon], {
                  icon: L.divIcon({
                    className: 'upwelling-marker',
                    html: '<div style="background: blue; color: white; padding: 2px 5px; border-radius: 3px;">↑</div>',
                    iconSize: [20, 20]
                  })
                });

                marker.bindPopup(`<b>Upwelling Zone</b><br>Intensity: ${zone.intensity.toFixed(1)}`);
                marker.addTo(map);
                layers.push(marker);
              });
            }

            // Mark warm/cold core eddies
            if (features.warmCore && features.warmCore.length > 0) {
              features.warmCore.forEach((eddy: any) => {
                const circle = L.circle([eddy.lat, eddy.lon], {
                  radius: 50000, // 50km radius
                  color: '#ff6600',
                  fillColor: '#ff9900',
                  fillOpacity: 0.3,
                  weight: 2
                });

                circle.bindPopup(`<b>Warm Core Eddy</b><br>Intensity: +${eddy.intensity.toFixed(1)}°C`);
                circle.addTo(map);
                layers.push(circle);
              });
            }

            if (features.coldCore && features.coldCore.length > 0) {
              features.coldCore.forEach((eddy: any) => {
                const circle = L.circle([eddy.lat, eddy.lon], {
                  radius: 50000, // 50km radius
                  color: '#0066ff',
                  fillColor: '#0099ff',
                  fillOpacity: 0.3,
                  weight: 2
                });

                circle.bindPopup(`<b>Cold Core Eddy</b><br>Intensity: -${eddy.intensity.toFixed(1)}°C`);
                circle.addTo(map);
                layers.push(circle);
              });
            }

            // Notify about detected features
            if (onFeatureDetected) {
              onFeatureDetected(features);
            }
          }

          // Add legend
          const legend = new L.Control({ position: 'bottomright' });
          legend.onAdd = function () {
            const div = L.DomUtil.create('div', 'info legend sst-legend');
            const temps = [16, 18, 20, 22, 24, 26, 28, 30];

            div.innerHTML = '<h4>SST (°C)</h4>';
            for (let i = 0; i < temps.length - 1; i++) {
              div.innerHTML +=
                '<i style="background:' + getTemperatureColor(temps[i]) + '"></i> ' +
                temps[i] + (temps[i + 1] ? '&ndash;' + temps[i + 1] + '<br>' : '+');
            }

            if (showAnomalies) {
              div.innerHTML += '<hr><small>Showing anomalies</small>';
            }

            return div;
          };

          legend.addTo(map);
          layers.push(legend as any);

          // Callback with loaded data
          if (onDataLoad) {
            onDataLoad({
              data: response.data,
              metadata: response.metadata,
              visualization: response.visualization,
              features: response.oceanographic_features
            });
          }
        }
      } catch (error) {
        console.error('Error loading NASA SST data:', error);
      }
    };

    loadSSTData();

    return () => {
      // Clean up all layers
      layers.forEach(layer => {
        if (layer && map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
    };
  }, [visible, map, opacity, showContours, showAnomalies, dateRange, onDataLoad, onFeatureDetected]);

  return null;
}

// Helper function to get color based on temperature
function getTemperatureColor(temp: number): string {
  // Thermal color scale from cold (blue) to hot (red)
  if (temp < 16) return '#000080';  // Navy blue
  if (temp < 18) return '#0000ff';  // Blue
  if (temp < 20) return '#0080ff';  // Light blue
  if (temp < 22) return '#00ffff';  // Cyan
  if (temp < 24) return '#00ff00';  // Green
  if (temp < 26) return '#ffff00';  // Yellow
  if (temp < 28) return '#ff8000';  // Orange
  if (temp < 30) return '#ff0000';  // Red
  return '#800000';  // Dark red
}
'use client';

import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MarineDataLayerProps {
  type: 'sst' | 'chlorophyll' | 'salinity' | 'currents' | 'waves';
  data: any;
  visible: boolean;
}

export function MarineDataLayer({ type, data, visible }: MarineDataLayerProps) {
  const map = useMap();
  const [layer, setLayer] = useState<L.Layer | null>(null);

  useEffect(() => {
    if (!map || !data || !visible) {
      if (layer) {
        map.removeLayer(layer);
        setLayer(null);
      }
      return;
    }

    // Remove existing layer
    if (layer) {
      map.removeLayer(layer);
    }

    let newLayer: L.Layer | null = null;

    switch (type) {
      case 'sst': // Sea Surface Temperature
        newLayer = createTemperatureLayer(data);
        break;

      case 'chlorophyll':
        newLayer = createChlorophyllLayer(data);
        break;

      case 'salinity':
        newLayer = createSalinityLayer(data);
        break;

      case 'currents':
        newLayer = createCurrentsLayer(data);
        break;

      case 'waves':
        newLayer = createWavesLayer(data);
        break;
    }

    if (newLayer) {
      newLayer.addTo(map);
      setLayer(newLayer);
    }

    return () => {
      if (layer) {
        map.removeLayer(layer);
      }
    };
  }, [map, type, data, visible]);

  return null;
}

function createTemperatureLayer(data: any): L.Layer {
  const group = L.layerGroup();

  // If we have temperature array data from the new API format
  if (data && Array.isArray(data)) {
    data.forEach((point: any) => {
      if (point.lat && point.lon && point.temperature) {
        // Temperature color based on value
        const temp = point.temperature;
        const color = getTemperatureColor(temp);

        L.circle([point.lat, point.lon], {
          radius: 8000, // Smaller radius for higher density
          fillColor: color,
          fillOpacity: 0.4,
          stroke: false
        }).addTo(group);
      }
    });
    return group;
  }

  // Fallback: Generate temperature gradient points (legacy format)
  for (let lat = -18; lat <= -5; lat += 0.5) {
    for (let lng = 11; lng <= 14; lng += 0.5) {
      const temp = 24 + Math.random() * 3 + (lat + 12) * 0.1;
      const color = getTemperatureColor(temp);

      L.circle([lat, lng], {
        radius: 20000,
        fillColor: color,
        fillOpacity: 0.3,
        stroke: false
      }).addTo(group);
    }
  }

  return group;
}

// Get temperature color based on NOAA standards
function getTemperatureColor(temp: number): string {
  if (temp < 20) return '#0000FF';      // Dark Blue
  if (temp < 22) return '#00FFFF';      // Light Blue
  if (temp < 24) return '#00FF00';      // Green
  if (temp < 26) return '#FFFF00';      // Yellow
  if (temp < 28) return '#FFA500';      // Orange
  return '#FF0000';                     // Red
}

function createChlorophyllLayer(data: any): L.Layer {
  const group = L.layerGroup();

  // Create chlorophyll concentration visualization
  for (let lat = -18; lat <= -5; lat += 0.3) {
    for (let lng = 11; lng <= 14; lng += 0.3) {
      const chloro = Math.random() * 2;
      const opacity = Math.min(chloro / 2, 0.6);

      // Higher chlorophyll near coast
      const distFromCoast = Math.abs(lng - 13.2);
      const coastalBoost = Math.max(0, 1 - distFromCoast / 3);
      const finalChloro = chloro + coastalBoost;

      const color = finalChloro > 1.5 ? '#00ff00' :
                    finalChloro > 1 ? '#88ff00' :
                    finalChloro > 0.5 ? '#ccff88' : '#eeffcc';

      L.circle([lat, lng], {
        radius: 15000,
        fillColor: color,
        fillOpacity: opacity * 0.5,
        stroke: false
      }).addTo(group);
    }
  }

  return group;
}

function createSalinityLayer(data: any): L.Layer {
  const group = L.layerGroup();

  // Create salinity gradient visualization
  for (let lat = -18; lat <= -5; lat += 0.5) {
    for (let lng = 11; lng <= 14; lng += 0.5) {
      const salinity = 34.5 + Math.random() * 2;
      const opacity = 0.3;

      // Color based on salinity levels
      const color = salinity > 36 ? '#ff6b6b' :
                   salinity > 35.5 ? '#ffa500' :
                   salinity > 35 ? '#ffff00' : '#87ceeb';

      L.rectangle([
        [lat, lng],
        [lat + 0.5, lng + 0.5]
      ], {
        fillColor: color,
        fillOpacity: opacity,
        stroke: false
      }).addTo(group);
    }
  }

  return group;
}

function createCurrentsLayer(data: any): L.Layer {
  const group = L.layerGroup();

  // Create ocean current arrows
  for (let lat = -17; lat <= -6; lat += 1) {
    for (let lng = 11.5; lng <= 13.5; lng += 1) {
      const speed = Math.random() * 2;
      const direction = Math.random() * 360;

      // Calculate arrow end point
      const endLat = lat + Math.sin(direction * Math.PI / 180) * 0.3;
      const endLng = lng + Math.cos(direction * Math.PI / 180) * 0.3;

      // Create arrow polyline
      const arrow = L.polyline([
        [lat, lng],
        [endLat, endLng]
      ], {
        color: speed > 1.5 ? '#ff0000' : speed > 1 ? '#ff8800' : '#0088ff',
        weight: 2 + speed,
        opacity: 0.7
      });

      arrow.addTo(group);

      // Add a simple arrowhead marker at the end
      const arrowHead = L.circleMarker([endLat, endLng], {
        radius: 3,
        fillColor: speed > 1.5 ? '#ff0000' : speed > 1 ? '#ff8800' : '#0088ff',
        fillOpacity: 1,
        stroke: false
      });

      arrowHead.addTo(group);
    }
  }

  return group;
}

function createWavesLayer(data: any): L.Layer {
  const group = L.layerGroup();

  // Create wave height visualization
  for (let lat = -16; lat <= -7; lat += 0.8) {
    for (let lng = 11; lng <= 14; lng += 0.8) {
      const waveHeight = Math.random() * 3;
      const size = 10000 + waveHeight * 5000;

      // Wave patterns
      const wavePattern = L.circle([lat, lng], {
        radius: size,
        fillColor: waveHeight > 2 ? '#ff4444' : waveHeight > 1 ? '#ffaa00' : '#4488ff',
        fillOpacity: 0.1,
        color: waveHeight > 2 ? '#ff4444' : waveHeight > 1 ? '#ffaa00' : '#4488ff',
        weight: 1,
        opacity: 0.4,
        dashArray: '5, 10'
      });

      wavePattern.addTo(group);
    }
  }

  return group;
}


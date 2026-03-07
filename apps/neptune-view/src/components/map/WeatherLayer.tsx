'use client';

import { useMemo } from 'react';
import { ScatterplotLayer, IconLayer } from '@deck.gl/layers';
import { WeatherGrid } from '@/services/enhancedDataService';

interface WeatherLayerProps {
  data: WeatherGrid[];
  visible: boolean;
  opacity?: number;
  showWindVectors?: boolean;
  temperatureColorScale?: 'viridis' | 'plasma' | 'turbo';
}

/**
 * WeatherLayer - Visualizes meteorological data on the map
 *
 * Features:
 * - Temperature heatmap with customizable color scales
 * - Wind vector arrows showing direction and speed
 * - Grid-based rendering for performance
 * - Optimized for Angola EEZ coverage
 *
 * Data source: Open-Meteo API via D1 database with KV caching
 */
export function WeatherLayer({
  data,
  visible = true,
  opacity = 0.7,
  showWindVectors = true,
  temperatureColorScale = 'turbo'
}: WeatherLayerProps) {

  // Color scale functions for temperature visualization
  const getTemperatureColor = useMemo(() => {
    return (temperature: number): [number, number, number, number] => {
      // Temperature range for Angola: 24-32°C typically
      const minTemp = 20;
      const maxTemp = 35;
      const normalizedTemp = Math.max(0, Math.min(1, (temperature - minTemp) / (maxTemp - minTemp)));

      switch (temperatureColorScale) {
        case 'viridis':
          // Purple → Blue → Green → Yellow
          if (normalizedTemp < 0.25) {
            const t = normalizedTemp * 4;
            return [68 + (58 - 68) * t, 1 + (82 - 1) * t, 84 + (139 - 84) * t, opacity * 255];
          } else if (normalizedTemp < 0.5) {
            const t = (normalizedTemp - 0.25) * 4;
            return [58 + (33 - 58) * t, 82 + (145 - 82) * t, 139 + (140 - 139) * t, opacity * 255];
          } else if (normalizedTemp < 0.75) {
            const t = (normalizedTemp - 0.5) * 4;
            return [33 + (94 - 33) * t, 145 + (201 - 145) * t, 140 + (98 - 140) * t, opacity * 255];
          } else {
            const t = (normalizedTemp - 0.75) * 4;
            return [94 + (253 - 94) * t, 201 + (231 - 201) * t, 98 + (37 - 98) * t, opacity * 255];
          }

        case 'plasma':
          // Purple → Red → Orange → Yellow
          if (normalizedTemp < 0.33) {
            const t = normalizedTemp * 3;
            return [13 + (128 - 13) * t, 8 + (3 - 8) * t, 135 + (91 - 135) * t, opacity * 255];
          } else if (normalizedTemp < 0.67) {
            const t = (normalizedTemp - 0.33) * 3;
            return [128 + (240 - 128) * t, 3 + (99 - 3) * t, 91 + (20 - 91) * t, opacity * 255];
          } else {
            const t = (normalizedTemp - 0.67) * 3;
            return [240 + (252 - 240) * t, 99 + (222 - 99) * t, 20 + (59 - 20) * t, opacity * 255];
          }

        case 'turbo':
        default:
          // Blue → Cyan → Green → Yellow → Red
          if (normalizedTemp < 0.2) {
            const t = normalizedTemp * 5;
            return [48 + (57 - 48) * t, 18 + (146 - 18) * t, 59 + (223 - 59) * t, opacity * 255];
          } else if (normalizedTemp < 0.4) {
            const t = (normalizedTemp - 0.2) * 5;
            return [57 + (34 - 57) * t, 146 + (198 - 146) * t, 223 + (122 - 223) * t, opacity * 255];
          } else if (normalizedTemp < 0.6) {
            const t = (normalizedTemp - 0.4) * 5;
            return [34 + (122 - 34) * t, 198 + (209 - 198) * t, 122 + (58 - 122) * t, opacity * 255];
          } else if (normalizedTemp < 0.8) {
            const t = (normalizedTemp - 0.6) * 5;
            return [122 + (240 - 122) * t, 209 + (150 - 209) * t, 58 + (40 - 58) * t, opacity * 255];
          } else {
            const t = (normalizedTemp - 0.8) * 5;
            return [240 + (220 - 240) * t, 150 + (20 - 150) * t, 40 + (60 - 40) * t, opacity * 255];
          }
      }
    };
  }, [opacity, temperatureColorScale]);

  // Temperature heatmap layer using grid cells
  const temperatureLayer = useMemo(() => {
    if (!data || data.length === 0 || !visible) return null;

    return new ScatterplotLayer({
      id: 'weather-temperature-layer',
      data,
      pickable: true,
      opacity,
      stroked: false,
      filled: true,
      radiusScale: 1,
      radiusMinPixels: 15,
      radiusMaxPixels: 50,
      getPosition: (d: any) => [d.center_lon, d.center_lat] as [number, number],
      getRadius: () => 25000, // 25km radius for 0.5° grid cells
      getFillColor: (d: any) => getTemperatureColor(d.avg_temperature || 25),
      updateTriggers: {
        getFillColor: [temperatureColorScale, opacity]
      },
      transitions: {
        getPosition: 300,
        getFillColor: 300
      } as any
    });
  }, [data, visible, opacity, getTemperatureColor, temperatureColorScale]);

  // Wind vector arrows layer
  const windVectorLayer = useMemo(() => {
    if (!data || data.length === 0 || !visible || !showWindVectors) return null;

    // Filter out grid cells with no wind data
    const windData = data.filter(d => d.avg_wind_speed && d.avg_wind_speed > 0);

    return new IconLayer({
      id: 'weather-wind-vectors-layer',
      data: windData,
      pickable: true,
      iconAtlas: createWindArrowAtlas(),
      iconMapping: {
        arrow: { x: 0, y: 0, width: 128, height: 128, mask: true }
      },
      getIcon: () => 'arrow',
      getPosition: (d: any) => [d.center_lon, d.center_lat] as [number, number],
      getSize: (d: any) => {
        // Scale arrow size based on wind speed (0-30 km/h typical)
        const speed = d.avg_wind_speed || 0;
        const sizeScale = Math.min(speed / 30, 1);
        return 20 + sizeScale * 20; // 20-40 pixels
      },
      getAngle: (d: any) => {
        // Convert wind direction (degrees) to rotation angle
        // Wind direction is "from" direction, we want arrow pointing "to" direction
        return (d.dominant_wind_direction || 0) + 180;
      },
      getColor: (d: any) => {
        // Color based on wind speed: Light blue → Dark blue
        const speed = d.avg_wind_speed || 0;
        const intensity = Math.min(speed / 30, 1);
        return [
          100 + (20 - 100) * intensity,
          150 + (50 - 150) * intensity,
          255,
          opacity * 200
        ];
      },
      updateTriggers: {
        getColor: [opacity],
        getSize: data,
        getAngle: data
      },
      transitions: {
        getPosition: 300,
        getAngle: 300,
        getSize: 300
      } as any
    });
  }, [data, visible, showWindVectors, opacity]);

  return [temperatureLayer, windVectorLayer].filter(Boolean);
}

/**
 * Create a simple wind arrow icon atlas as a data URL
 * Uses canvas to draw an arrow pointing upward
 */
function createWindArrowAtlas(): string {
  if (typeof window === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  // Draw arrow
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Arrow shaft
  ctx.beginPath();
  ctx.moveTo(64, 100);
  ctx.lineTo(64, 28);
  ctx.stroke();

  // Arrow head
  ctx.beginPath();
  ctx.moveTo(64, 28);
  ctx.lineTo(44, 48);
  ctx.lineTo(64, 40);
  ctx.lineTo(84, 48);
  ctx.closePath();
  ctx.fill();

  return canvas.toDataURL();
}

/**
 * Helper function to format weather data for tooltip display
 */
export function formatWeatherTooltip(weatherData: WeatherGrid): string {
  const {
    avg_temperature,
    avg_wind_speed,
    dominant_wind_direction,
    total_precipitation,
    avg_cloud_cover,
    avg_pressure,
    data_points,
    last_update
  } = weatherData;

  return `
    <div style="padding: 8px;">
      <strong>Condições Meteorológicas</strong><br/>
      <strong>Temperatura:</strong> ${avg_temperature?.toFixed(1)}°C<br/>
      <strong>Vento:</strong> ${avg_wind_speed?.toFixed(1)} km/h @ ${dominant_wind_direction}°<br/>
      ${total_precipitation ? `<strong>Precipitação:</strong> ${total_precipitation.toFixed(1)} mm<br/>` : ''}
      ${avg_cloud_cover ? `<strong>Cobertura de Nuvens:</strong> ${avg_cloud_cover.toFixed(0)}%<br/>` : ''}
      ${avg_pressure ? `<strong>Pressão:</strong> ${avg_pressure.toFixed(0)} hPa<br/>` : ''}
      <small>${data_points} pontos de dados | ${new Date(last_update).toLocaleString('pt-AO')}</small>
    </div>
  `.trim();
}

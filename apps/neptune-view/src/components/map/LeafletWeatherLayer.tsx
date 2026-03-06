'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { WeatherGrid, WeatherData } from '@/services/enhancedDataService';

interface LeafletWeatherLayerProps {
  data: WeatherGrid[];
  visible: boolean;
  opacity?: number;
  showWindVectors?: boolean;
  temperatureColorScale?: 'viridis' | 'plasma' | 'turbo';
}

/**
 * Angola EEZ Geographic Boundaries (Two Separate Polygons)
 * Used for client-side filtering to ensure weather data only appears within EEZ
 */
const ANGOLA_EEZ_BOUNDS = {
  continental: {
    minLat: -18.02,
    maxLat: -5.55,  // Northern boundary of Continental Angola
    minLon: 8.3,
    maxLon: 13.84
  },
  cabinda: {
    minLat: -5.8,   // Southern boundary of Cabinda exclave
    maxLat: -4.3,   // Northern boundary of Cabinda
    minLon: 12.0,
    maxLon: 13.5
  }
};

/**
 * Check if a point is within Angola's EEZ boundaries
 * Angola has TWO separate regions:
 * 1. Continental Angola: -18.02° to -5.55° latitude
 * 2. Cabinda exclave: -5.8° to -4.3° latitude
 * Ocean gap between -5.55° and -5.8° is NOT part of Angola EEZ
 */
function isWithinAngolaEEZ(lat: number, lon: number): boolean {
  // Check Continental Angola
  const inContinental =
    lat >= ANGOLA_EEZ_BOUNDS.continental.minLat &&
    lat <= ANGOLA_EEZ_BOUNDS.continental.maxLat &&
    lon >= ANGOLA_EEZ_BOUNDS.continental.minLon &&
    lon <= ANGOLA_EEZ_BOUNDS.continental.maxLon;

  // Check Cabinda exclave
  const inCabinda =
    lat >= ANGOLA_EEZ_BOUNDS.cabinda.minLat &&
    lat <= ANGOLA_EEZ_BOUNDS.cabinda.maxLat &&
    lon >= ANGOLA_EEZ_BOUNDS.cabinda.minLon &&
    lon <= ANGOLA_EEZ_BOUNDS.cabinda.maxLon;

  return inContinental || inCabinda;
}

/**
 * LeafletWeatherLayer - Visualizes meteorological data using Leaflet
 *
 * Features:
 * - Temperature heatmap with customizable color scales
 * - Wind vector arrows showing direction and speed
 * - Grid-based rendering for performance
 * - Optimized for Angola EEZ coverage
 * - Client-side geographic filtering for two-polygon EEZ boundaries
 *
 * Data source: Open-Meteo API via D1 database with KV caching
 *
 * IMPORTANT: Applies client-side filtering to ensure weather points only
 * appear within Angola's two-polygon EEZ (Continental + Cabinda), excluding
 * the ocean gap region between -5.55° and -5.8° latitude.
 */
export function LeafletWeatherLayer({
  data,
  visible = true,
  opacity = 0.7,
  showWindVectors = true,
  temperatureColorScale = 'turbo'
}: LeafletWeatherLayerProps) {
  const map = useMap();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map || !visible || !data || data.length === 0) {
      // Remove layers if not visible
      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers();
      }
      return;
    }

    // CLIENT-SIDE FILTERING: Filter data to only include points within Angola EEZ
    const filteredData = data.filter(point =>
      isWithinAngolaEEZ(point.center_lat, point.center_lon)
    );

    console.log(`[LeafletWeatherLayer] Filtered ${data.length} points to ${filteredData.length} points within Angola EEZ`);
    if (data.length !== filteredData.length) {
      console.log(`[LeafletWeatherLayer] Removed ${data.length - filteredData.length} points outside EEZ boundaries`);
    }

    // Create or get layer group
    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    } else {
      layerGroupRef.current.clearLayers();
    }

    // Render temperature circles (using filtered data)
    filteredData.forEach(point => {
      if (!point.avg_temperature) return;

      const color = getTemperatureColor(point.avg_temperature, temperatureColorScale, opacity);
      const radius = 25000; // 25km radius for 0.5° grid cells

      const circle = L.circle([point.center_lat, point.center_lon], {
        radius,
        fillColor: color,
        fillOpacity: opacity,
        color: color,
        weight: 0,
        interactive: true
      });

      // Add popup with weather info
      circle.bindPopup(`
        <div style="padding: 8px;">
          <strong>Condições Meteorológicas</strong><br/>
          <strong>Temperatura:</strong> ${point.avg_temperature?.toFixed(1)}°C<br/>
          <strong>Vento:</strong> ${point.avg_wind_speed?.toFixed(1)} km/h @ ${point.dominant_wind_direction}°<br/>
          ${point.total_precipitation ? `<strong>Precipitação:</strong> ${point.total_precipitation.toFixed(1)} mm<br/>` : ''}
          ${point.avg_cloud_cover ? `<strong>Cobertura de Nuvens:</strong> ${point.avg_cloud_cover.toFixed(0)}%<br/>` : ''}
          ${point.avg_pressure ? `<strong>Pressão:</strong> ${point.avg_pressure.toFixed(0)} hPa<br/>` : ''}
          <small>${point.data_points} pontos de dados | ${new Date(point.last_update).toLocaleString('pt-AO')}</small>
        </div>
      `);

      layerGroupRef.current?.addLayer(circle);
    });

    // Render wind vectors if enabled
    if (showWindVectors) {
      data.forEach(point => {
        if (!point.avg_wind_speed || point.avg_wind_speed < 1) return;

        const windSpeed = point.avg_wind_speed;
        const windDirection = point.dominant_wind_direction || 0;

        // Create arrow icon with rotation
        const arrowIcon = L.divIcon({
          html: createArrowSVG(windSpeed, windDirection, opacity),
          className: 'wind-arrow-icon',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker([point.center_lat, point.center_lon], {
          icon: arrowIcon,
          interactive: false
        });

        layerGroupRef.current?.addLayer(marker);
      });
    }

    // Cleanup function
    return () => {
      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers();
      }
    };
  }, [map, data, visible, opacity, showWindVectors, temperatureColorScale]);

  // Remove layer group on unmount
  useEffect(() => {
    return () => {
      if (layerGroupRef.current) {
        layerGroupRef.current.remove();
        layerGroupRef.current = null;
      }
    };
  }, []);

  return null;
}

/**
 * Get temperature color based on color scale
 */
function getTemperatureColor(
  temperature: number,
  colorScale: 'viridis' | 'plasma' | 'turbo',
  opacity: number
): string {
  // Temperature range for Angola: 24-32°C typically
  const minTemp = 20;
  const maxTemp = 35;
  const normalizedTemp = Math.max(0, Math.min(1, (temperature - minTemp) / (maxTemp - minTemp)));

  let r: number, g: number, b: number;

  switch (colorScale) {
    case 'viridis':
      // Purple → Blue → Green → Yellow
      if (normalizedTemp < 0.25) {
        const t = normalizedTemp * 4;
        r = 68 + (58 - 68) * t;
        g = 1 + (82 - 1) * t;
        b = 84 + (139 - 84) * t;
      } else if (normalizedTemp < 0.5) {
        const t = (normalizedTemp - 0.25) * 4;
        r = 58 + (33 - 58) * t;
        g = 82 + (145 - 82) * t;
        b = 139 + (140 - 139) * t;
      } else if (normalizedTemp < 0.75) {
        const t = (normalizedTemp - 0.5) * 4;
        r = 33 + (94 - 33) * t;
        g = 145 + (201 - 145) * t;
        b = 140 + (98 - 140) * t;
      } else {
        const t = (normalizedTemp - 0.75) * 4;
        r = 94 + (253 - 94) * t;
        g = 201 + (231 - 201) * t;
        b = 98 + (37 - 98) * t;
      }
      break;

    case 'plasma':
      // Purple → Red → Orange → Yellow
      if (normalizedTemp < 0.33) {
        const t = normalizedTemp * 3;
        r = 13 + (128 - 13) * t;
        g = 8 + (3 - 8) * t;
        b = 135 + (91 - 135) * t;
      } else if (normalizedTemp < 0.67) {
        const t = (normalizedTemp - 0.33) * 3;
        r = 128 + (240 - 128) * t;
        g = 3 + (99 - 3) * t;
        b = 91 + (20 - 91) * t;
      } else {
        const t = (normalizedTemp - 0.67) * 3;
        r = 240 + (252 - 240) * t;
        g = 99 + (222 - 99) * t;
        b = 20 + (59 - 20) * t;
      }
      break;

    case 'turbo':
    default:
      // Blue → Cyan → Green → Yellow → Red
      if (normalizedTemp < 0.2) {
        const t = normalizedTemp * 5;
        r = 48 + (57 - 48) * t;
        g = 18 + (146 - 18) * t;
        b = 59 + (223 - 59) * t;
      } else if (normalizedTemp < 0.4) {
        const t = (normalizedTemp - 0.2) * 5;
        r = 57 + (34 - 57) * t;
        g = 146 + (198 - 146) * t;
        b = 223 + (122 - 223) * t;
      } else if (normalizedTemp < 0.6) {
        const t = (normalizedTemp - 0.4) * 5;
        r = 34 + (122 - 34) * t;
        g = 198 + (209 - 198) * t;
        b = 122 + (58 - 122) * t;
      } else if (normalizedTemp < 0.8) {
        const t = (normalizedTemp - 0.6) * 5;
        r = 122 + (240 - 122) * t;
        g = 209 + (150 - 209) * t;
        b = 58 + (40 - 58) * t;
      } else {
        const t = (normalizedTemp - 0.8) * 5;
        r = 240 + (220 - 240) * t;
        g = 150 + (20 - 150) * t;
        b = 40 + (60 - 40) * t;
      }
  }

  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${opacity})`;
}

/**
 * Create SVG arrow for wind vectors
 */
function createArrowSVG(windSpeed: number, windDirection: number, opacity: number): string {
  // Scale arrow size based on wind speed (0-30 km/h typical)
  const sizeScale = Math.min(windSpeed / 30, 1);
  const size = 20 + sizeScale * 10; // 20-30 pixels

  // Color based on wind speed: Light blue → Dark blue
  const intensity = Math.min(windSpeed / 30, 1);
  const r = Math.round(100 + (20 - 100) * intensity);
  const g = Math.round(150 + (50 - 150) * intensity);
  const b = 255;
  const color = `rgba(${r}, ${g}, ${b}, ${opacity * 0.8})`;

  // Rotate arrow based on wind direction (arrows point "to" direction)
  const rotation = windDirection + 180;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" style="transform: rotate(${rotation}deg);">
      <path
        d="M12 2 L16 10 L13 10 L13 22 L11 22 L11 10 L8 10 Z"
        fill="${color}"
        stroke="rgba(0, 0, 0, 0.3)"
        stroke-width="0.5"
      />
    </svg>
  `;
}

/**
 * WeatherLegend - Display legend for weather layer
 */
export function WeatherLegend({
  visible = true,
  temperatureColorScale = 'turbo'
}: {
  visible?: boolean;
  temperatureColorScale?: 'viridis' | 'plasma' | 'turbo';
}) {
  if (!visible) return null;

  return (
    <div className="absolute bottom-24 left-4 z-[999] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg shadow-lg p-3 max-w-[200px]">
      <div className="text-sm font-bold text-gray-900 dark:text-white mb-2">
        Meteorologia
      </div>
      <div className="space-y-2 text-xs">
        {/* Temperature gradient */}
        <div className="flex items-center gap-2">
          <div
            className="w-16 h-3 rounded shadow-sm"
            style={{
              background: getTemperatureGradient(temperatureColorScale)
            }}
          />
          <span className="text-gray-700 dark:text-gray-300 font-medium">20-35°C</span>
        </div>

        {/* Wind vector legend */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              d="M12 2 L16 10 L13 10 L13 22 L11 22 L11 10 L8 10 Z"
              fill="rgba(100, 150, 255, 0.8)"
              stroke="rgba(0, 0, 0, 0.3)"
              stroke-width="0.5"
            />
          </svg>
          <span className="text-gray-700 dark:text-gray-300 font-medium">Vento</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Get CSS gradient for temperature legend
 */
function getTemperatureGradient(colorScale: 'viridis' | 'plasma' | 'turbo'): string {
  const stops: string[] = [];
  const numStops = 10;

  for (let i = 0; i <= numStops; i++) {
    const position = (i / numStops) * 100;
    const color = getTemperatureColor(20 + (35 - 20) * (i / numStops), colorScale, 1);
    stops.push(`${color} ${position}%`);
  }

  return `linear-gradient(to right, ${stops.join(', ')})`;
}

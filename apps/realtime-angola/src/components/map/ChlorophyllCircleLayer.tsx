'use client';

import { useEffect, useState, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import chroma from 'chroma-js';
import * as turf from '@turf/turf';
import { filterPointsInEEZ, ANGOLA_EEZ_BOUNDS } from '@/utils/eezFilter';

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

interface ChlorophyllCircleLayerProps {
  data: ChlorophyllData[];
  visible: boolean;
  opacity?: number;
  eezBoundary?: GeoJSON.Feature | null;
}

export function ChlorophyllCircleLayer({
  data,
  visible,
  opacity = 0.8,
  eezBoundary = null
}: ChlorophyllCircleLayerProps) {
  const map = useMap();
  const [layerGroup, setLayerGroup] = useState<L.LayerGroup | null>(null);
  const [localChlorophyllData, setLocalChlorophyllData] = useState<ChlorophyllData[]>([]);
  const [filteredData, setFilteredData] = useState<ChlorophyllData[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);

  // Fetch chlorophyll data directly from API (bypasses RealtimeProvider redirect issues)
  const fetchChlorophyllData = useCallback(async () => {
    if (!visible) return;

    try {
      console.log('[ChlorophyllCircleLayer] Fetching chlorophyll data directly from API...');
      const angolaEEZ = '-18.02,8.9,-5.55,13.35';
      const response = await fetch(
        `/api/environmental/ocean-color?limit=2000&bbox=${angolaEEZ}`,
        {
          cache: 'no-store',
          headers: { 'Accept': 'application/json' }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ocean color data: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('[ChlorophyllCircleLayer] API response:', responseData);

      // API returns {data: Array} or {oceanColor: Array}
      let oceanColorArray = null;
      if (responseData.data && Array.isArray(responseData.data)) {
        oceanColorArray = responseData.data;
      } else if (responseData.oceanColor && Array.isArray(responseData.oceanColor)) {
        oceanColorArray = responseData.oceanColor;
      }

      if (oceanColorArray && oceanColorArray.length > 0) {
        // Transform to chlorophyll format
        const transformed = oceanColorArray.map((point: any) => ({
          lat: point.latitude,
          lon: point.longitude,
          lng: point.longitude,
          value: point.chlorophyll_a,
          chlorophyll: point.chlorophyll_a,
          quality: point.quality_flag || point.quality || 'high',
          timestamp: point.timestamp,
          source: point.data_source
        }));

        console.log(`[ChlorophyllCircleLayer] Successfully fetched and transformed ${transformed.length} chlorophyll points`);
        console.log('[ChlorophyllCircleLayer] Sample transformed point:', transformed[0]);
        setLocalChlorophyllData(transformed);
      } else {
        console.warn('[ChlorophyllCircleLayer] No ocean color data in API response');
        setLocalChlorophyllData([]);
      }
    } catch (error) {
      console.error('[ChlorophyllCircleLayer] Error fetching chlorophyll data:', error);
      setLocalChlorophyllData([]);
    }
  }, [visible]);

  // Trigger fetch when layer becomes visible
  useEffect(() => {
    if (visible) {
      console.log('[ChlorophyllCircleLayer] Layer activated, triggering fetch...');
      fetchChlorophyllData();
    } else {
      console.log('[ChlorophyllCircleLayer] Layer deactivated, clearing local data');
      setLocalChlorophyllData([]);
    }
  }, [visible, fetchChlorophyllData]);

  // NASA/ESA Ocean Color palette for chlorophyll-a (logarithmic scale)
  const chlorophyllScale = chroma.scale([
    '#000033', // 0.01 mg/m³: Deep purple (ultra-oligotrophic)
    '#0000aa', // 0.05 mg/m³: Navy blue
    '#0000ff', // 0.1 mg/m³: Blue (oligotrophic open ocean)
    '#00aaff', // 0.3 mg/m³: Cyan (mesotrophic)
    '#00ff00', // 0.5 mg/m³: Green (productive waters)
    '#ffff00', // 1.0 mg/m³: Yellow (eutrophic)
    '#ff5500', // 3.0 mg/m³: Deep orange
    '#ff0000', // 5.0 mg/m³: Red (high productivity)
    '#550000'  // 10+ mg/m³: Deep red (hyper-eutrophic/bloom)
  ]).mode('lab').domain([0.01, 0.05, 0.1, 0.3, 0.5, 1.0, 3.0, 5.0, 10]);

  // Filter data by Angola EEZ polygons
  useEffect(() => {
    // Use local fetched data if available, otherwise fall back to props data
    const dataToUse = localChlorophyllData.length > 0 ? localChlorophyllData : data;

    if (!dataToUse || dataToUse.length === 0) {
      setFilteredData([]);
      return;
    }

    const filterDataAsync = async () => {
      setIsFiltering(true);
      console.log('[ChlorophyllCircleLayer] Filtering', dataToUse.length, 'points by EEZ polygons...');

      try {
        // Transform data to match filter interface
        const pointsToFilter = dataToUse.map(point => ({
          ...point,
          lat: point.lat,
          lng: point.lon || point.lng || 0
        }));

        const filtered = await filterPointsInEEZ(pointsToFilter);

        // Transform back to original interface
        const filteredChlorophyllData = filtered.map(point => ({
          ...point,
          lon: point.lng,
          lng: point.lng
        })) as ChlorophyllData[];

        setFilteredData(filteredChlorophyllData);
        console.log('[ChlorophyllCircleLayer] Polygon filtering complete:', {
          input: dataToUse.length,
          output: filteredChlorophyllData.length,
          removed: dataToUse.length - filteredChlorophyllData.length
        });
      } catch (error) {
        console.error('[ChlorophyllCircleLayer] Error filtering by polygons:', error);
        // Fallback to using all data if filtering fails
        setFilteredData(dataToUse);
      } finally {
        setIsFiltering(false);
      }
    };

    filterDataAsync();
  }, [data, localChlorophyllData]);

  useEffect(() => {
    // Use filtered data for rendering
    const dataToRender = filteredData;

    console.log('[ChlorophyllCircleLayer] Rendering with:', {
      hasMap: !!map,
      filteredDataLength: dataToRender?.length || 0,
      isFiltering,
      visible,
      opacity,
      firstDataPoint: dataToRender[0],
      lastDataPoint: dataToRender[dataToRender.length - 1]
    });

    if (!map || !dataToRender || dataToRender.length === 0 || !visible || isFiltering) {
      console.log('[ChlorophyllCircleLayer] Early exit - missing requirements:', {
        hasMap: !!map,
        hasDataToRender: !!dataToRender,
        dataToRenderLength: dataToRender?.length || 0,
        visible,
        isFiltering
      });
      if (layerGroup) {
        map.removeLayer(layerGroup);
        setLayerGroup(null);
      }
      return;
    }

    // Remove existing layer
    if (layerGroup) {
      map.removeLayer(layerGroup);
    }

    // Data is now filtered by Angola EEZ POLYGONS (not just bounding box)
    // Uses real geometry from angola_eez.json (Continental + Cabinda polygons)
    console.log('[ChlorophyllCircleLayer] Creating layer group with', dataToRender.length, 'polygon-validated points');

    // Create new layer group
    const newLayerGroup = L.layerGroup();

    // Add circle markers for each data point
    dataToRender.forEach(point => {
      const lon = point.lon || point.lng || 0;
      const chlorophyllValue = point.chlorophyll || point.value || 0;

      // Get color based on chlorophyll value
      const color = getChlorophyllColor(chlorophyllValue);

      // Calculate radius based on zoom level and chlorophyll value
      const currentZoom = map.getZoom();
      const baseRadius = Math.max(3, Math.min(12, currentZoom - 3));

      // Slightly increase radius for higher chlorophyll values (more visible blooms)
      const valueMultiplier = Math.min(1.5, 1 + Math.log10(chlorophyllValue + 0.1) * 0.2);
      const radius = baseRadius * valueMultiplier;

      // Create circle marker
      const circle = L.circleMarker([point.lat, lon], {
        radius: radius,
        fillColor: color,
        color: color,
        weight: 1,
        opacity: opacity * 0.9,
        fillOpacity: opacity * 0.7
      });

      // Add popup with detailed information
      const popupContent = `
        <div style="font-family: system-ui; font-size: 12px;">
          <strong style="color: ${color};">Clorofila-a</strong><br/>
          <strong>${chlorophyllValue.toFixed(3)} mg/m³</strong><br/>
          <small style="color: #666;">
            ${getChlorophyllCategory(chlorophyllValue)}<br/>
            ${point.quality ? `Qualidade: ${point.quality}` : ''}<br/>
            ${point.timestamp ? new Date(point.timestamp).toLocaleString('pt-AO') : ''}
          </small>
        </div>
      `;

      circle.bindPopup(popupContent);

      // Add tooltip on hover
      circle.bindTooltip(`${chlorophyllValue.toFixed(2)} mg/m³`, {
        permanent: false,
        direction: 'top',
        className: 'chlorophyll-tooltip'
      });

      newLayerGroup.addLayer(circle);
    });

    // Add layer to map
    newLayerGroup.addTo(map);
    setLayerGroup(newLayerGroup);

    // Cleanup
    return () => {
      if (newLayerGroup) {
        map.removeLayer(newLayerGroup);
      }
    };
  }, [map, filteredData, visible, opacity, isFiltering]);

  return null;
}

// Get color for chlorophyll value using logarithmic scale
function getChlorophyllColor(value: number): string {
  const chlorophyllScale = chroma.scale([
    '#000033', // 0.01 mg/m³: Deep purple
    '#0000aa', // 0.05 mg/m³: Navy blue
    '#0000ff', // 0.1 mg/m³: Blue
    '#00aaff', // 0.3 mg/m³: Cyan
    '#00ff00', // 0.5 mg/m³: Green
    '#ffff00', // 1.0 mg/m³: Yellow
    '#ff5500', // 3.0 mg/m³: Deep orange
    '#ff0000', // 5.0 mg/m³: Red
    '#550000'  // 10+ mg/m³: Deep red
  ]).mode('lab').domain([0.01, 0.05, 0.1, 0.3, 0.5, 1.0, 3.0, 5.0, 10]);

  const clampedValue = Math.max(0.01, Math.min(10, value));
  return chlorophyllScale(clampedValue).hex();
}

// Get category name for chlorophyll value
function getChlorophyllCategory(value: number): string {
  if (value < 0.05) return 'Ultra-oligotrófico (muito baixo)';
  if (value < 0.1) return 'Oligotrófico (baixo)';
  if (value < 0.3) return 'Oligotrófico (moderado)';
  if (value < 0.5) return 'Mesotrófico (produtivo)';
  if (value < 1.0) return 'Eutrófico (alto)';
  if (value < 3.0) return 'Eutrófico (muito alto)';
  if (value < 5.0) return 'Hiper-eutrófico (bloom)';
  return 'Bloom extremo';
}

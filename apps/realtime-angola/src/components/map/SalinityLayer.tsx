/**
 * Salinity Data Layer Component
 *
 * Visualizes salinity measurements from the enhanced D1 database
 * using gradient circles with color mapping based on PSU values.
 * Now includes accurate polygon-based EEZ filtering.
 */

'use client';

import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { EnhancedSalinityData } from '@/services/enhancedDataService';
import { filterPointsInEEZ } from '@/utils/eezFilter';

interface SalinityLayerProps {
  data: EnhancedSalinityData[];
  visible?: boolean;
  opacity?: number;
}

export function SalinityLayer({
  data,
  visible = true,
  opacity = 0.6
}: SalinityLayerProps) {
  const map = useMap();
  const [filteredData, setFilteredData] = useState<EnhancedSalinityData[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);

  // Filter data by Angola EEZ polygons
  useEffect(() => {
    if (!data || data.length === 0) {
      setFilteredData([]);
      return;
    }

    const filterData = async () => {
      setIsFiltering(true);
      console.log('[SalinityLayer] Filtering', data.length, 'points by EEZ polygons...');

      try {
        // Transform data to match filter interface
        const pointsToFilter = data.map(point => ({
          ...point,
          lat: point.latitude,
          lng: point.longitude
        }));

        const filtered = await filterPointsInEEZ(pointsToFilter);

        // Transform back to original interface
        const filteredSalinityData = filtered.map(point => ({
          ...point,
          latitude: point.lat,
          longitude: point.lng
        })) as EnhancedSalinityData[];

        setFilteredData(filteredSalinityData);
        console.log('[SalinityLayer] Polygon filtering complete:', {
          input: data.length,
          output: filteredSalinityData.length,
          removed: data.length - filteredSalinityData.length
        });
      } catch (error) {
        console.error('[SalinityLayer] Error filtering by polygons:', error);
        // Fallback to using all data if filtering fails
        setFilteredData(data);
      } finally {
        setIsFiltering(false);
      }
    };

    filterData();
  }, [data]);

  useEffect(() => {
    console.log('[SalinityLayer] Rendering with:', {
      hasMap: !!map,
      visible,
      originalDataLength: data?.length || 0,
      filteredDataLength: filteredData?.length || 0,
      isFiltering,
      opacity
    });

    if (!map || !visible || !filteredData || filteredData.length === 0 || isFiltering) {
      console.log('[SalinityLayer] Early exit - missing requirements:', {
        hasMap: !!map,
        visible,
        hasFilteredData: !!filteredData,
        filteredDataLength: filteredData?.length || 0,
        isFiltering
      });
      return;
    }

    // Data is now filtered by Angola EEZ POLYGONS (not just bounding box)
    // Uses real geometry from angola_eez.json (Continental + Cabinda polygons)
    const salinityGroup = L.layerGroup();
    console.log('[SalinityLayer] Creating layer group with', filteredData.length, 'polygon-validated points');

    // PSU (Practical Salinity Units) color scale
    // Typical ocean salinity ranges from 33-37 PSU
    const getSalinityColor = (salinity: number): string => {
      if (salinity < 30) return '#2166ac'; // Very low salinity (blue)
      if (salinity < 32) return '#4393c3'; // Low salinity
      if (salinity < 34) return '#92c5de'; // Below average
      if (salinity < 35) return '#d1e5f0'; // Average ocean salinity
      if (salinity < 36) return '#fddbc7'; // Above average
      if (salinity < 37) return '#f4a582'; // High salinity
      if (salinity < 38) return '#d6604d'; // Very high
      return '#b2182b'; // Extremely high (red)
    };

    // Group data by grid cells for performance
    const gridSize = 0.1; // degrees
    const gridData = new Map<string, EnhancedSalinityData[]>();

    filteredData.forEach(point => {
      const gridKey = `${Math.floor(point.latitude / gridSize)},${Math.floor(point.longitude / gridSize)}`;
      if (!gridData.has(gridKey)) {
        gridData.set(gridKey, []);
      }
      gridData.get(gridKey)!.push(point);
    });

    // Create circles for each grid cell average
    gridData.forEach((points) => {
      if (points.length === 0) return;

      // Calculate average for grid cell
      const avgLat = points.reduce((sum, p) => sum + p.latitude, 0) / points.length;
      const avgLon = points.reduce((sum, p) => sum + p.longitude, 0) / points.length;
      const avgSalinity = points.reduce((sum, p) => sum + p.salinity, 0) / points.length;
      const avgDepth = points.reduce((sum, p) => sum + (p.depth || 0), 0) / points.length;

      // Most recent timestamp
      const latestPoint = points.reduce((latest, p) =>
        new Date(p.timestamp) > new Date(latest.timestamp) ? p : latest
      );

      const circle = L.circleMarker([avgLat, avgLon], {
        radius: 8,
        fillColor: getSalinityColor(avgSalinity),
        color: '#ffffff',
        weight: 1,
        opacity: 0.8,
        fillOpacity: opacity,
        className: 'salinity-marker'
      });

      // Add popup with details
      const popupContent = `
        <div class="p-2">
          <h3 class="font-bold text-sm mb-1">Salinity Data</h3>
          <div class="text-xs space-y-1">
            <div><span class="font-semibold">Salinity:</span> ${avgSalinity.toFixed(2)} PSU</div>
            ${avgDepth > 0 ? `<div><span class="font-semibold">Depth:</span> ${avgDepth.toFixed(1)}m</div>` : ''}
            <div><span class="font-semibold">Location:</span> ${avgLat.toFixed(3)}°, ${avgLon.toFixed(3)}°</div>
            <div><span class="font-semibold">Data Points:</span> ${points.length}</div>
            <div><span class="font-semibold">Source:</span> ${latestPoint.data_source}</div>
            <div><span class="font-semibold">Updated:</span> ${new Date(latestPoint.timestamp).toLocaleString()}</div>
          </div>
        </div>
      `;

      circle.bindPopup(popupContent);
      salinityGroup.addLayer(circle);
    });

    // Add the layer group to map
    salinityGroup.addTo(map);

    // Cleanup function
    return () => {
      map.removeLayer(salinityGroup);
    };
  }, [map, filteredData, visible, opacity, isFiltering]);

  return null;
}

/**
 * Salinity Legend Component
 * Displays the color scale for salinity values
 */
export function SalinityLegend({ visible = true }: { visible?: boolean }) {
  if (!visible) return null;

  const scale = [
    { value: '< 30', color: '#2166ac', label: 'Very Low' },
    { value: '30-32', color: '#4393c3', label: 'Low' },
    { value: '32-34', color: '#92c5de', label: 'Below Avg' },
    { value: '34-35', color: '#d1e5f0', label: 'Average' },
    { value: '35-36', color: '#fddbc7', label: 'Above Avg' },
    { value: '36-37', color: '#f4a582', label: 'High' },
    { value: '37-38', color: '#d6604d', label: 'Very High' },
    { value: '> 38', color: '#b2182b', label: 'Extreme' },
  ];

  return (
    <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
      <h4 className="text-xs font-semibold mb-2 text-gray-800 dark:text-gray-200">
        Salinity (PSU)
      </h4>
      <div className="space-y-1">
        {scale.map((item) => (
          <div key={item.value} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-700 dark:text-gray-300">
              {item.value} - {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
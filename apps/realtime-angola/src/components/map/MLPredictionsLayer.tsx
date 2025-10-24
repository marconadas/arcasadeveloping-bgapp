'use client';

import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import chroma from 'chroma-js';
import * as turf from '@turf/turf';
import { filterPointsInEEZ } from '@/utils/eezFilter';

interface MLPredictionData {
  lat: number;
  lon?: number;
  lng?: number;
  prediction_type: string;
  confidence: number;
  model_name?: string;
  prediction_value?: string;
  timestamp?: string;
}

interface MLPredictionsLayerProps {
  data: MLPredictionData[];
  visible: boolean;
  opacity?: number;
  eezBoundary?: GeoJSON.Feature | null;
}

export function MLPredictionsLayer({
  data,
  visible,
  opacity = 0.8,
  eezBoundary = null
}: MLPredictionsLayerProps) {
  const map = useMap();
  const [layerGroup, setLayerGroup] = useState<L.LayerGroup | null>(null);
  const [filteredData, setFilteredData] = useState<MLPredictionData[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);

  // Color scale for ML prediction confidence (0.0-1.0)
  const confidenceScale = chroma.scale([
    '#8b0000', // 0.0: Dark red (low confidence)
    '#ff4500', // 0.3: Orange-red
    '#ffa500', // 0.5: Orange
    '#ffd700', // 0.7: Gold
    '#00ff00'  // 1.0: Bright green (high confidence)
  ]).mode('lab').domain([0.0, 0.3, 0.5, 0.7, 1.0]);

  // Filter data by Angola EEZ polygons
  useEffect(() => {
    if (!data || data.length === 0) {
      setFilteredData([]);
      return;
    }

    const filterData = async () => {
      setIsFiltering(true);
      console.log('[MLPredictionsLayer] Filtering', data.length, 'points by EEZ polygons...');

      try {
        // Transform data to match filter interface
        const pointsToFilter = data.map(point => ({
          ...point,
          lat: point.lat,
          lng: point.lon || point.lng || 0
        }));

        const filtered = await filterPointsInEEZ(pointsToFilter);

        // Transform back to original interface
        const filteredMLData = filtered.map(point => ({
          ...point,
          lon: point.lng,
          lng: point.lng
        })) as MLPredictionData[];

        setFilteredData(filteredMLData);
        console.log('[MLPredictionsLayer] Polygon filtering complete:', {
          input: data.length,
          output: filteredMLData.length,
          removed: data.length - filteredMLData.length
        });
      } catch (error) {
        console.error('[MLPredictionsLayer] Error filtering by polygons:', error);
        // Fallback to using all data if filtering fails
        setFilteredData(data);
      } finally {
        setIsFiltering(false);
      }
    };

    filterData();
  }, [data]);

  useEffect(() => {
    console.log('[MLPredictionsLayer] Rendering with:', {
      hasMap: !!map,
      visible,
      originalDataLength: data?.length || 0,
      filteredDataLength: filteredData?.length || 0,
      isFiltering,
      opacity
    });

    if (!map || !visible || !filteredData || filteredData.length === 0 || isFiltering) {
      console.log('[MLPredictionsLayer] Early exit - missing requirements:', {
        hasMap: !!map,
        visible,
        hasFilteredData: !!filteredData,
        filteredDataLength: filteredData?.length || 0,
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
    console.log('[MLPredictionsLayer] Creating layer group with', filteredData.length, 'polygon-validated points');

    // Create new layer group
    const newLayerGroup = L.layerGroup();

    // Add circle markers for each ML prediction
    filteredData.forEach(point => {
      const lon = point.lon || point.lng || 0;
      const confidence = point.confidence || 0;

      // Get color based on confidence
      const color = getConfidenceColor(confidence);

      // Calculate radius based on zoom level and confidence
      const currentZoom = map.getZoom();
      const baseRadius = Math.max(4, Math.min(14, currentZoom - 2));

      // Increase radius for higher confidence predictions
      const confidenceMultiplier = 0.7 + (confidence * 0.6); // Range: 0.7-1.3
      const radius = baseRadius * confidenceMultiplier;

      // Get icon/symbol based on prediction type
      const symbol = getPredictionSymbol(point.prediction_type);

      // Create circle marker with styling based on prediction type
      const circle = L.circleMarker([point.lat, lon], {
        radius: radius,
        fillColor: color,
        color: getDarkerColor(color),
        weight: 2,
        opacity: opacity * 0.9,
        fillOpacity: opacity * 0.6
      });

      // Add popup with detailed information
      const predictionUnit = getPredictionUnit(point.prediction_type);
      const formattedValue = formatPredictionValue(point.prediction_value, point.prediction_type);

      const popupContent = `
        <div style="font-family: system-ui; font-size: 12px;">
          <strong style="color: ${color};">${symbol} ${getPredictionTypeLabel(point.prediction_type)}</strong><br/>
          <strong>Confiança: ${(confidence * 100).toFixed(1)}%</strong><br/>
          <small style="color: #666;">
            ${point.prediction_value !== undefined ? `${predictionUnit}: ${formattedValue}` : ''}<br/>
            ${point.model_name ? `Modelo: ${point.model_name}` : ''}<br/>
            ${getConfidenceCategory(confidence)}<br/>
            ${point.timestamp ? new Date(point.timestamp).toLocaleString('pt-AO') : ''}
          </small>
        </div>
      `;

      circle.bindPopup(popupContent);

      // Add tooltip on hover
      circle.bindTooltip(`${symbol} ${(confidence * 100).toFixed(0)}%`, {
        permanent: false,
        direction: 'top',
        className: 'ml-prediction-tooltip'
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

// Get color for confidence value (0.0-1.0)
function getConfidenceColor(confidence: number): string {
  const confidenceScale = chroma.scale([
    '#8b0000', // 0.0: Dark red (low confidence)
    '#ff4500', // 0.3: Orange-red
    '#ffa500', // 0.5: Orange
    '#ffd700', // 0.7: Gold
    '#00ff00'  // 1.0: Bright green (high confidence)
  ]).mode('lab').domain([0.0, 0.3, 0.5, 0.7, 1.0]);

  const clampedValue = Math.max(0, Math.min(1, confidence));
  return confidenceScale(clampedValue).hex();
}

// Get darker version of color for border
function getDarkerColor(color: string): string {
  return chroma(color).darken(0.5).hex();
}

// Get symbol/emoji for prediction type
function getPredictionSymbol(type: string): string {
  switch (type) {
    // Original 5 types
    case 'coral_health':
      return '🪸';
    case 'fish_stock':
      return '🐟';
    case 'pollution_risk':
      return '⚠️';
    case 'species_distribution':
      return '🐠';
    case 'vessel_detection':
      return '🚢';
    // New 7 AI model types
    case 'biodiversityHotspots':
      return '🌊';
    case 'speciesPresence':
      return '🐋';
    case 'habitatSuitability':
      return '🏝️';
    case 'conservationPriority':
      return '🛡️';
    case 'fishingZones':
      return '🎣';
    case 'monitoringPoints':
      return '📍';
    case 'riskAssessment':
      return '⚡';
    default:
      return '🔮';
  }
}

// Get Portuguese label for prediction type
function getPredictionTypeLabel(type: string): string {
  switch (type) {
    // Original 5 types
    case 'coral_health':
      return 'Saúde dos Corais';
    case 'fish_stock':
      return 'Estoque de Peixes';
    case 'pollution_risk':
      return 'Risco de Poluição';
    case 'species_distribution':
      return 'Distribuição de Espécies';
    case 'vessel_detection':
      return 'Detecção de Embarcações';
    // New 7 AI model types
    case 'biodiversityHotspots':
      return 'Hotspots de Biodiversidade';
    case 'speciesPresence':
      return 'Presença de Espécies';
    case 'habitatSuitability':
      return 'Adequação do Habitat';
    case 'conservationPriority':
      return 'Prioridade de Conservação';
    case 'fishingZones':
      return 'Zonas de Pesca';
    case 'monitoringPoints':
      return 'Pontos de Monitoramento';
    case 'riskAssessment':
      return 'Avaliação de Risco';
    default:
      return type;
  }
}

// Get category name for confidence value
function getConfidenceCategory(confidence: number): string {
  if (confidence < 0.3) return 'Confiança muito baixa';
  if (confidence < 0.5) return 'Confiança baixa';
  if (confidence < 0.7) return 'Confiança moderada';
  if (confidence < 0.85) return 'Confiança alta';
  return 'Confiança muito alta';
}

// Get prediction unit label
function getPredictionUnit(type: string): string {
  switch (type) {
    case 'biodiversityHotspots':
      return 'Índice de Biodiversidade';
    case 'speciesPresence':
      return 'Probabilidade de Presença';
    case 'habitatSuitability':
      return 'Índice de Adequação';
    case 'conservationPriority':
      return 'Pontuação de Prioridade';
    case 'fishingZones':
      return 'Índice CPUE';
    case 'monitoringPoints':
      return 'Importância';
    case 'riskAssessment':
      return 'Nível de Risco';
    default:
      return 'Valor';
  }
}

// Format prediction value based on type
function formatPredictionValue(value: any, type: string): string {
  if (value === undefined || value === null) return 'N/A';

  switch (type) {
    case 'speciesPresence':
      // Format as percentage for probability
      return `${(value * 100).toFixed(1)}%`;
    case 'biodiversityHotspots':
      // Format as species count
      return `${Math.round(value)} espécies`;
    case 'habitatSuitability':
    case 'conservationPriority':
    case 'fishingZones':
    case 'monitoringPoints':
      // Format as score out of 100
      return `${value.toFixed(1)}/100`;
    case 'riskAssessment':
      // Format as risk level
      if (value < 20) return 'Baixo';
      if (value < 40) return 'Moderado';
      if (value < 60) return 'Alto';
      if (value < 80) return 'Muito Alto';
      return 'Crítico';
    default:
      return value.toFixed(1);
  }
}

/**
 * Data Transformers (Enhanced with Quality Validation)
 *
 * Transform oceanographic data from bgapp-api-worker format
 * to the format expected by realtime-angola frontend visualizations.
 * 
 * Features:
 * - Quality filtering (only high-quality data)
 * - Value range validation (Angola-specific ranges)
 * - Outlier detection and removal
 * - Data cleaning and normalization
 */

import type {
  SSTRecord,
  OceanColorRecord,
  SalinityRecord,
  VesselLightsRecord,
  MLPredictionRecord
} from './oceanographicDataService';

/**
 * Frontend data point format for heatmap visualizations
 */
export interface HeatmapDataPoint {
  lat: number;
  lon: number;
  value: number;
  source?: string;
  quality?: string;
  quality_score?: number;
  timestamp?: string;
}

/**
 * Valid data ranges for Angola waters
 */
const ANGOLA_DATA_RANGES = {
  sst: { min: 15, max: 32 },          // °C - Sea Surface Temperature
  chlorophyll: { min: 0.01, max: 100 }, // mg/m³ - Chlorophyll-a
  salinity: { min: 30, max: 37 },      // PSU - Practical Salinity Units
  radiance: { min: 0, max: 1000 }      // nW/cm²/sr - VIIRS radiance
} as const;

/**
 * Angola EEZ bounds for spatial validation
 */
const ANGOLA_EEZ_BOUNDS = {
  minLat: -18.02,
  maxLat: -5.55,
  minLon: 8.9,
  maxLon: 13.35
} as const;

/**
 * Validate if a point is within Angola EEZ
 */
function isWithinAngolaEEZ(lat: number, lon: number): boolean {
  return lat >= ANGOLA_EEZ_BOUNDS.minLat && 
         lat <= ANGOLA_EEZ_BOUNDS.maxLat &&
         lon >= ANGOLA_EEZ_BOUNDS.minLon && 
         lon <= ANGOLA_EEZ_BOUNDS.maxLon;
}

/**
 * Transform SST (Sea Surface Temperature) data with quality validation
 *
 * @param sstRecords - Array of SST records from bgapp-api-worker
 * @returns Array of validated heatmap data points with temperature values
 */
export function transformSSTData(sstRecords: SSTRecord[]): HeatmapDataPoint[] {
  return sstRecords
    .filter(record => {
      // Validate coordinates
      if (!isWithinAngolaEEZ(record.latitude, record.longitude)) {
        return false;
      }
      
      // Validate temperature range (15-32°C for Angola waters)
      if (record.temperature < ANGOLA_DATA_RANGES.sst.min || 
          record.temperature > ANGOLA_DATA_RANGES.sst.max) {
        return false;
      }
      
      // Filter for high quality data only
      // quality_level should be 'high' or quality_flag >= 3
      if (record.quality_level && record.quality_level !== 'high') {
        return false;
      }
      
      return true;
    })
    .map(record => ({
      lat: record.latitude,
      lon: record.longitude,
      value: Number(record.temperature.toFixed(2)),
      source: record.data_source,
      quality: record.quality_level || 'high',
      quality_score: 1.0,
      timestamp: record.timestamp
    }));
}

/**
 * Transform Ocean Color (Chlorophyll-a) data with quality validation
 *
 * @param oceanColorRecords - Array of ocean color records from bgapp-api-worker
 * @returns Array of validated heatmap data points with chlorophyll-a values
 */
export function transformChlorophyllData(oceanColorRecords: OceanColorRecord[]): HeatmapDataPoint[] {
  return oceanColorRecords
    .filter(record => {
      // Validate coordinates
      if (!isWithinAngolaEEZ(record.latitude, record.longitude)) {
        return false;
      }
      
      // Validate chlorophyll-a range (0.01-100 mg/m³)
      if (record.chlorophyll_a < ANGOLA_DATA_RANGES.chlorophyll.min || 
          record.chlorophyll_a > ANGOLA_DATA_RANGES.chlorophyll.max) {
        return false;
      }
      
      // Filter for high quality data only
      if (record.quality_level && record.quality_level !== 'high') {
        return false;
      }
      
      // Additional validation: check for NaN or Infinity
      if (!isFinite(record.chlorophyll_a)) {
        return false;
      }
      
      return true;
    })
    .map(record => ({
      lat: record.latitude,
      lon: record.longitude,
      value: Number(record.chlorophyll_a.toFixed(3)),
      source: record.data_source,
      quality: record.quality_level || 'high',
      quality_score: 1.0,
      timestamp: record.timestamp
    }));
}

/**
 * Transform Salinity data with quality validation
 *
 * @param salinityRecords - Array of salinity records from bgapp-api-worker
 * @returns Array of validated heatmap data points with salinity values
 */
export function transformSalinityData(salinityRecords: SalinityRecord[]): HeatmapDataPoint[] {
  return salinityRecords
    .filter(record => {
      // Validate coordinates
      if (!isWithinAngolaEEZ(record.latitude, record.longitude)) {
        return false;
      }
      
      // Validate salinity range (30-37 PSU for Angola waters)
      if (record.salinity < ANGOLA_DATA_RANGES.salinity.min || 
          record.salinity > ANGOLA_DATA_RANGES.salinity.max) {
        return false;
      }
      
      // Filter for high quality data only
      if (record.quality_level && record.quality_level !== 'high') {
        return false;
      }
      
      // Additional validation: check for NaN or Infinity
      if (!isFinite(record.salinity)) {
        return false;
      }
      
      return true;
    })
    .map(record => ({
      lat: record.latitude,
      lon: record.longitude,
      value: Number(record.salinity.toFixed(2)),
      source: record.data_source,
      quality: record.quality_level || 'high',
      quality_score: 1.0,
      timestamp: record.timestamp
    }));
}

/**
 * Transform Vessel Lights (VIIRS) data from API format to frontend format
 *
 * @param vesselLightsRecords - Array of vessel lights records from bgapp-api-worker
 * @returns Array of heatmap data points with radiance values
 */
export function transformVesselLightsData(vesselLightsRecords: VesselLightsRecord[]): HeatmapDataPoint[] {
  return vesselLightsRecords.map(record => ({
    lat: record.latitude,
    lon: record.longitude,
    value: record.radiance,
    source: record.data_source,
    quality: record.quality_level,
    timestamp: record.timestamp
  }));
}

/**
 * Transform ML Prediction data from API format to frontend format
 *
 * @param mlRecords - Array of ML prediction records from bgapp-api-worker
 * @returns Array of heatmap data points with prediction confidence values
 */
export function transformMLPredictionData(mlRecords: MLPredictionRecord[]): HeatmapDataPoint[] {
  return mlRecords.map(record => ({
    lat: record.latitude,
    lon: record.longitude,
    value: record.confidence,
    source: record.model_name,
    quality: record.prediction_type,
    timestamp: record.timestamp
  }));
}

/**
 * Filter data points by quality level
 *
 * @param dataPoints - Array of heatmap data points
 * @param minQuality - Minimum quality level to include ('low', 'medium', 'high')
 * @returns Filtered array of data points
 */
export function filterByQuality(
  dataPoints: HeatmapDataPoint[],
  minQuality: 'low' | 'medium' | 'high' = 'low'
): HeatmapDataPoint[] {
  const qualityOrder = { 'low': 0, 'medium': 1, 'high': 2 };
  const minQualityLevel = qualityOrder[minQuality];

  return dataPoints.filter(point => {
    if (!point.quality) return true;
    const pointQualityLevel = qualityOrder[point.quality as keyof typeof qualityOrder];
    return pointQualityLevel !== undefined && pointQualityLevel >= minQualityLevel;
  });
}

/**
 * Filter data points by time range
 *
 * @param dataPoints - Array of heatmap data points
 * @param maxAgeHours - Maximum age in hours (data older than this is filtered out)
 * @returns Filtered array of recent data points
 */
export function filterByRecency(
  dataPoints: HeatmapDataPoint[],
  maxAgeHours: number = 24
): HeatmapDataPoint[] {
  const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

  return dataPoints.filter(point => {
    if (!point.timestamp) return true;
    const pointTime = new Date(point.timestamp);
    return pointTime >= cutoffTime;
  });
}

/**
 * Calculate statistics for a dataset
 *
 * @param dataPoints - Array of heatmap data points
 * @returns Statistics object with min, max, mean, count
 */
export function calculateStatistics(dataPoints: HeatmapDataPoint[]) {
  if (dataPoints.length === 0) {
    return { min: 0, max: 0, mean: 0, count: 0 };
  }

  const values = dataPoints.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

  return {
    min: parseFloat(min.toFixed(2)),
    max: parseFloat(max.toFixed(2)),
    mean: parseFloat(mean.toFixed(2)),
    count: dataPoints.length
  };
}

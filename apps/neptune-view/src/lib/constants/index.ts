// Constantes para o Real-time Angola
export const ANGOLA_COORDINATES = {
  center: [-8.8137, 13.2894] as [number, number],
  bounds: {
    north: -4.0,
    south: -18.0,
    east: 24.0,
    west: 11.0
  }
};

export const MAP_CONFIG = {
  defaultZoom: 6,
  minZoom: 2,     // Allow global zoom out
  maxZoom: 18,    // Allow detailed zoom in
  maxBounds: null, // Remove bounds restrictions for free exploration
  maxBoundsViscosity: 0.0
};

export const API_ENDPOINTS = {
  realtime: '/api/realtime/data',
  vessels: '/api/gfw/vessel-presence',
  copernicus: '/api/copernicus/marine-data',
  ml: '/api/ml/predictions'
} as const;

export const REFRESH_INTERVALS = {
  realtime: 30000, // 30 segundos
  vessels: 60000,  // 1 minuto
  ml: 300000       // 5 minutos
} as const;

export const LAYER_STYLES = {
  vessel: {
    fillColor: '#FF6B6B',
    strokeColor: '#FF4757',
    radius: 8,
    opacity: 0.8
  },
  temperature: {
    colorScale: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'],
    opacity: 0.6
  },
  chloropleth: {
    opacity: 0.7,
    strokeWidth: 1
  }
} as const;

export const ML_MODEL_PATHS = {
  temperature: '/models/temperature-prediction.json',
  chlorophyll: '/models/chlorophyll-prediction.json',
  vessel: '/models/vessel-behavior.json'
} as const;

export const DATA_QUALITY_THRESHOLDS = {
  high: 0.9,
  medium: 0.7,
  low: 0.5
} as const;
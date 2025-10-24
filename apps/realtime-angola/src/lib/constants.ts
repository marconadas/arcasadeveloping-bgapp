// API Endpoints configuration
export const API_ENDPOINTS = {
  // Copernicus Marine Data API
  copernicus: '/api/copernicus/marine-data',

  // Global Fishing Watch API
  vessels: '/api/gfw/vessel-presence',

  // Real-time data API
  realtime: '/api/realtime/data',

  // ML Predictions API
  mlPredictions: '/api/realtime/ml-predictions',

  // NASA Earthdata APIs
  nasa: {
    oceanColor: '/api/nasa/ocean-color',
    sst: '/api/nasa/sst',
    vesselLights: '/api/nasa/vessel-lights'
  }
} as const;

// Refresh intervals in milliseconds
export const REFRESH_INTERVALS = {
  // Auto-refresh data every 30 seconds
  data: 30000,

  // Refresh marine data every 60 seconds
  marine: 60000,

  // Refresh vessel data every 45 seconds
  vessels: 45000,

  // Refresh chloropleth data every 30 seconds
  chloropleth: 30000
} as const;

// Angola coordinates for map centering
export const ANGOLA_COORDINATES = {
  center: [-11.2, 12.5] as [number, number]
} as const;

// Map configuration
export const MAP_CONFIG = {
  // Angola EEZ boundaries
  bounds: {
    north: -4.376,
    south: -18.042,
    east: 13.377,
    west: 11.679
  },

  // Default map center (Angola coast)
  center: {
    lat: -11.2,
    lng: 12.5
  },

  // Default zoom level
  defaultZoom: 6,
  zoom: 6,

  // Min/max zoom levels
  minZoom: 5,
  maxZoom: 18
} as const;

// Layer IDs
export const LAYER_IDS = {
  TEMPERATURE: 'temperature',
  CHLOROPHYLL: 'chloropleth',
  VESSELS: 'vessels',
  ML_PREDICTIONS: 'ml-predictions',
  NASA_OCEAN_COLOR: 'nasa-ocean-color',
  NASA_SST: 'nasa-sst',
  NASA_VESSEL_LIGHTS: 'nasa-vessel-lights'
} as const;

// Data limits
export const DATA_LIMITS = {
  // Maximum number of data points to fetch
  maxDataPoints: 5000,

  // Maximum number of vessels to display
  maxVessels: 1000,

  // Maximum number of ML predictions
  maxPredictions: 1000
} as const;

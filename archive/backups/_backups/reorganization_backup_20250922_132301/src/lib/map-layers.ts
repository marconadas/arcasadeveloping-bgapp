export interface MapLayerConfig {
  url: string;
  attribution: string;
  name: string;
  maxZoom: number;
  id: string;
  // WMS specific properties
  wms?: boolean;
  layers?: string;
  format?: string;
  transparent?: boolean;
  version?: string;
  // Additional properties
  opacity?: number;
  tileSize?: number;
}

export const MAP_LAYERS: Record<string, MapLayerConfig> = {
  // Keep CARTO Dark as default
  cartoDark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© CARTO © OpenStreetMap contributors',
    name: '🌙 Dark Theme',
    maxZoom: 18,
    id: 'cartoDark',
    opacity: 0.95
  },

  // Standard OpenStreetMap
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    name: '🗺️ OpenStreetMap',
    maxZoom: 18,
    id: 'osm'
  },

  // EOX Satellite Imagery
  satellite: {
    url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg',
    attribution: '© EOX IT Services GmbH (Sentinel-2 cloudless)',
    name: '🛰️ Satellite',
    maxZoom: 14,
    id: 'satellite'
  },

  // EOX Marine/Terrain Layer
  marine: {
    url: 'https://tiles.maps.eox.at/wmts/1.0.0/terrain-light_3857/default/g/{z}/{y}/{x}.jpg',
    attribution: '© EOX Marine Terrain',
    name: '🌊 Marine',
    maxZoom: 12,
    id: 'marine'
  },

  // GEBCO Bathymetry (WMS)
  bathymetry: {
    url: 'https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv',
    attribution: '© GEBCO Bathymetric Data',
    name: '🏔️ Bathymetry',
    maxZoom: 10,
    id: 'bathymetry',
    wms: true,
    layers: 'GEBCO_LATEST',
    format: 'image/png',
    transparent: false,
    version: '1.3.0'
  },

  // CARTO Light theme
  cartoLight: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© CARTO © OpenStreetMap contributors',
    name: '☀️ Light Theme',
    maxZoom: 18,
    id: 'cartoLight'
  },

  // ESRI Satellite (fallback)
  esriSatellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri, DigitalGlobe, GeoEye, Earthstar Geographics',
    name: '📡 ESRI Satellite',
    maxZoom: 18,
    id: 'esriSatellite'
  }
};

export const DEFAULT_LAYER = 'cartoDark';

// Layer categories for organization
export const LAYER_CATEGORIES = {
  standard: ['cartoDark', 'cartoLight', 'osm'],
  satellite: ['satellite', 'esriSatellite'],
  marine: ['marine', 'bathymetry']
};

// Layer descriptions for tooltips
export const LAYER_DESCRIPTIONS: Record<string, string> = {
  cartoDark: 'Dark theme optimized for marine data visualization',
  cartoLight: 'Light theme with clear land/water distinction',
  osm: 'Standard OpenStreetMap with detailed geographic features',
  satellite: 'Sentinel-2 cloudless satellite imagery from EOX',
  marine: 'Marine-focused terrain with bathymetric information',
  bathymetry: 'GEBCO ocean depth and seafloor topography',
  esriSatellite: 'High-resolution satellite imagery from ESRI'
};
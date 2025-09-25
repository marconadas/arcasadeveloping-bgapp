// Types para o sistema de Real-time Angola
export interface MarineData {
  temperature: number;
  chlorophyll: number;
  salinity: number;
  ph?: number;
  dissolvedOxygen?: number;
  turbidity?: number;
  waveHeight?: number;
  windSpeed?: number;
  windDirection?: number;
  currentSpeed?: number;
  currentDirection?: number;
  timestamp: Date;
  source: 'copernicus' | 'gfw' | 'bgapp' | string;
  quality: 'high' | 'medium' | 'low';
  metadata?: {
    satellite?: string;
    product?: string;
    processingLevel?: string;
    lastUpdate?: string;
  };
}

export interface VesselData {
  id: string;
  name: string;
  mmsi: string;
  imo?: string;
  callsign?: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  heading?: number;
  timestamp: Date;
  type: string;
  flag: string;
  length?: number;
  width?: number;
  draught?: number;
  destination?: string;
  eta?: Date;
  status?: string;
  source?: string;
}

export interface ChloroplethData {
  lat: number;
  lng: number;
  value: number;
  color: [number, number, number, number];
}

export interface RealtimeState {
  marineData: MarineData | null;
  vessels: VesselData[];
  chloroplethData: ChloroplethData[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: Date;
}

export interface MLPrediction {
  type: 'temperature' | 'chlorophyll' | 'vessel_behavior';
  prediction: number;
  confidence: number;
  timeframe: '1h' | '6h' | '24h';
  timestamp: Date;
}

export interface MapViewState {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
}

export interface LayerConfig {
  id: string;
  type: 'vessel' | 'chloropleth' | 'temperature' | 'bathymetry';
  visible: boolean;
  opacity: number;
  data?: unknown;
}
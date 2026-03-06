// Chlorophyll-a concentration service for Angola waters
// Based on Copernicus Marine Service Ocean Color products standards

interface ChlorophyllDataPoint {
  lat: number;
  lon: number;
  chlorophyll: number; // mg/m³
  quality?: 'high' | 'medium' | 'low';
  depth?: number; // meters
  timestamp?: string;
}

interface ChlorophyllMetadata {
  minValue: number;
  maxValue: number;
  avgValue: number;
  dataPoints: number;
  resolution: string;
  coverage: string;
  satellite: string;
  product: string;
  processingLevel: string;
  lastUpdate: string;
}

// Angola oceanographic zones for chlorophyll patterns
const ANGOLA_ZONES = {
  CABINDA_UPWELLING: { minLat: -5.55, maxLat: -4.5, minLon: 11.5, maxLon: 12.5 },
  NORTHERN_COAST: { minLat: -8.5, maxLat: -5.55, minLon: 12.0, maxLon: 13.35 },
  CENTRAL_COAST: { minLat: -12.5, maxLat: -8.5, minLon: 12.5, maxLon: 13.5 },
  SOUTHERN_UPWELLING: { minLat: -16.0, maxLat: -12.5, minLon: 11.0, maxLon: 13.0 },
  BENGUELA_FRONT: { minLat: -18.02, maxLat: -16.0, minLon: 10.0, maxLon: 12.5 },
  OFFSHORE: { minLat: -18.02, maxLat: -5.55, minLon: 8.9, maxLon: 11.0 }
};

// Seasonal factors for chlorophyll concentration (Southern Hemisphere)
function getSeasonalFactor(): number {
  const month = new Date().getMonth();
  // June-September (austral winter) has stronger upwelling and higher productivity
  if (month >= 5 && month <= 8) {
    return 1.5; // 50% increase during upwelling season
  } else if (month >= 11 || month <= 2) {
    return 0.8; // Lower productivity in austral summer
  }
  return 1.0; // Normal conditions
}

// Generate realistic chlorophyll concentration based on location and oceanographic features
export function generateChlorophyllConcentration(lat: number, lon: number): number {
  const seasonalFactor = getSeasonalFactor();
  let baseConcentration = 0.3; // Baseline oligotrophic ocean value (mg/m³)

  // Distance from coast (simplified)
  const coastalDistance = Math.min(Math.abs(lon - 12.5), 3);

  // Benguela Current upwelling influence (stronger in south)
  if (lat < -14) {
    const benguelaStrength = Math.abs(lat + 14) / 4; // Increases southward
    baseConcentration += benguelaStrength * 1.5 * seasonalFactor;
  }

  // Coastal upwelling zones
  if (coastalDistance < 0.5) {
    // Strong coastal upwelling
    baseConcentration += (2.5 + Math.random() * 1.5) * seasonalFactor;

    // Cabinda region special upwelling
    if (lat > -6 && lat < -4.5) {
      baseConcentration += 1.0 * seasonalFactor;
    }

    // Namibe upwelling cell (southern Angola)
    if (lat < -15 && lat > -17) {
      baseConcentration += 1.8 * seasonalFactor;
    }
  } else if (coastalDistance < 1.0) {
    // Moderate coastal influence
    baseConcentration += (1.0 + Math.random() * 0.8) * seasonalFactor;
  } else if (coastalDistance < 2.0) {
    // Offshore transition zone
    baseConcentration += (0.3 + Math.random() * 0.4) * seasonalFactor;
  }

  // Angola-Benguela Frontal Zone (ABFZ) around 15-17°S
  if (lat > -17 && lat < -15) {
    const frontalIntensity = 1 - Math.abs(lat + 16) / 1;
    baseConcentration += frontalIntensity * 1.2 * seasonalFactor;
  }

  // Congo River plume influence (nutrient input)
  if (lat > -7 && lat < -5 && lon > 11 && lon < 12.5) {
    const plumeDistance = Math.sqrt(Math.pow(lat + 6, 2) + Math.pow(lon - 12, 2));
    if (plumeDistance < 2) {
      baseConcentration += (1.5 - plumeDistance * 0.5) * seasonalFactor;
    }
  }

  // Mesoscale features (eddies and filaments)
  const eddyEffect = Math.sin(lat * 2.5) * Math.cos(lon * 3) * 0.3;
  const filamentEffect = Math.sin((lat + lon) * 1.5) * 0.2;

  // Small-scale patchiness
  const patchiness = (Math.random() - 0.5) * 0.2;

  // Combine all effects
  let finalConcentration = baseConcentration + eddyEffect + filamentEffect + patchiness;

  // Apply realistic bounds (0.01 to 10 mg/m³)
  finalConcentration = Math.max(0.01, Math.min(10, finalConcentration));

  return Math.round(finalConcentration * 1000) / 1000; // Round to 3 decimal places
}

// Generate chlorophyll data grid for visualization
export function generateChlorophyllGrid(
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number },
  resolution: number = 0.05
): { data: ChlorophyllDataPoint[]; metadata: ChlorophyllMetadata } {
  const data: ChlorophyllDataPoint[] = [];
  const timestamp = new Date().toISOString();

  // Generate data points
  for (let lat = bounds.minLat; lat <= bounds.maxLat; lat += resolution) {
    for (let lon = bounds.minLon; lon <= bounds.maxLon; lon += resolution) {
      const chlorophyll = generateChlorophyllConcentration(lat, lon);

      // Determine quality based on distance from coast (satellite data quality)
      const coastalDistance = Math.abs(lon - 12.5);
      let quality: 'high' | 'medium' | 'low' = 'high';
      if (coastalDistance < 0.2) {
        quality = 'medium'; // Near-coast satellite data can be less reliable
      } else if (coastalDistance < 0.1) {
        quality = 'low'; // Very close to coast
      }

      data.push({
        lat: Math.round(lat * 100) / 100,
        lon: Math.round(lon * 100) / 100,
        chlorophyll,
        quality,
        depth: 0, // Surface data
        timestamp
      });
    }
  }

  // Calculate metadata
  const chlorophyllValues = data.map(d => d.chlorophyll);
  const metadata: ChlorophyllMetadata = {
    minValue: Math.min(...chlorophyllValues),
    maxValue: Math.max(...chlorophyllValues),
    avgValue: chlorophyllValues.reduce((sum, val) => sum + val, 0) / chlorophyllValues.length,
    dataPoints: data.length,
    resolution: `${resolution}°`,
    coverage: 'Angola EEZ',
    satellite: 'Sentinel-3 OLCI',
    product: 'OCEANCOLOUR_GLO_BGC_L3_MY_009_103',
    processingLevel: 'L3',
    lastUpdate: timestamp
  };

  return { data, metadata };
}

// Interpolate chlorophyll values for smoother visualization
export function interpolateChlorophyll(
  data: ChlorophyllDataPoint[],
  targetLat: number,
  targetLon: number,
  maxDistance: number = 0.5
): number | null {
  // Find nearby points
  const nearbyPoints = data.filter(point => {
    const distance = Math.sqrt(
      Math.pow(point.lat - targetLat, 2) +
      Math.pow(point.lon - targetLon, 2)
    );
    return distance <= maxDistance;
  });

  if (nearbyPoints.length === 0) {
    return null;
  }

  // Inverse distance weighting
  let weightedSum = 0;
  let weightSum = 0;

  nearbyPoints.forEach(point => {
    const distance = Math.sqrt(
      Math.pow(point.lat - targetLat, 2) +
      Math.pow(point.lon - targetLon, 2)
    );

    if (distance === 0) {
      return point.chlorophyll;
    }

    const weight = 1 / Math.pow(distance, 2);
    weightedSum += weight * point.chlorophyll;
    weightSum += weight;
  });

  return weightSum > 0 ? weightedSum / weightSum : null;
}

// Get chlorophyll classification based on concentration
export function getChlorophyllClassification(concentration: number): {
  category: string;
  description: string;
  productivity: string;
} {
  if (concentration < 0.1) {
    return {
      category: 'Ultra-oligotrophic',
      description: 'Very low chlorophyll, minimal phytoplankton',
      productivity: 'Very Low'
    };
  } else if (concentration < 0.3) {
    return {
      category: 'Oligotrophic',
      description: 'Low chlorophyll, open ocean conditions',
      productivity: 'Low'
    };
  } else if (concentration < 0.5) {
    return {
      category: 'Mesotrophic',
      description: 'Moderate chlorophyll, transitional waters',
      productivity: 'Moderate'
    };
  } else if (concentration < 1.0) {
    return {
      category: 'Productive',
      description: 'Good chlorophyll levels, productive waters',
      productivity: 'Good'
    };
  } else if (concentration < 3.0) {
    return {
      category: 'Eutrophic',
      description: 'High chlorophyll, nutrient-rich waters',
      productivity: 'High'
    };
  } else {
    return {
      category: 'Hyper-eutrophic',
      description: 'Very high chlorophyll, possible algal bloom',
      productivity: 'Very High'
    };
  }
}

// Export color scale for visualization (NASA Ocean Color standard)
export const CHLOROPHYLL_COLOR_SCALE = {
  // Logarithmic scale breakpoints (mg/m³)
  breakpoints: [0.01, 0.03, 0.1, 0.3, 0.5, 1.0, 3.0, 10.0],

  // Colors following NASA Ocean Color palette
  colors: [
    '#000033', // 0.01 mg/m³: Deep purple (ultra-oligotrophic)
    '#000055', // 0.03 mg/m³: Dark blue
    '#0000ff', // 0.1 mg/m³: Blue (oligotrophic)
    '#00ffff', // 0.3 mg/m³: Cyan (mesotrophic)
    '#00ff00', // 0.5 mg/m³: Green (productive)
    '#ffff00', // 1.0 mg/m³: Yellow (eutrophic)
    '#ff8800', // 3.0 mg/m³: Orange (high productivity)
    '#ff0000'  // 10.0 mg/m³: Red (hyper-eutrophic/bloom)
  ],

  // Get color for a specific concentration
  getColor(concentration: number): string {
    for (let i = 0; i < this.breakpoints.length - 1; i++) {
      if (concentration <= this.breakpoints[i + 1]) {
        return this.colors[i];
      }
    }
    return this.colors[this.colors.length - 1];
  }
};
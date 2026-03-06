/**
 * ML Species Predictor Worker
 * Cloudflare Worker for species identification and bycatch risk prediction
 *
 * Endpoints:
 * - POST /api/ml/predict-species: Predict species from environmental features
 * - GET /api/ml/species-probability: Get species probability distribution for location
 * - GET /api/ml/bycatch-risk: Calculate bycatch risk for protected species
 *
 * @requires BGAPP_DATA (D1 Database)
 * @requires BGAPP_KV (KV Namespace for model caching)
 */

// TensorFlow.js Lite for Cloudflare Workers (will be imported via npm package)
// For now, using placeholder model - will be replaced with trained TensorFlow.js model
const MODEL_VERSION = 'v1.0.0-species-classifier';
const CACHE_TTL = 86400; // 24 hours

// Angola EEZ bounds for spatial filtering
const ANGOLA_EEZ = {
  continental: {
    minLat: -17.29,
    maxLat: -5.36,
    minLon: 8.30,
    maxLon: 13.84
  },
  cabinda: {
    minLat: -5.8,
    maxLat: -4.3,
    minLon: 12.0,
    maxLon: 13.5
  }
};

// Species classes (30 species from D1 marine_species table)
const SPECIES_CLASSES = [
  'Sardinella aurita',
  'Trachurus trecae',
  'Merluccius capensis',
  'Scomber colias',
  'Dentex angolensis',
  'Caretta caretta',
  'Chelonia mydas',
  'Dermochelys coriacea',
  'Sousa teuszii',
  'Thunnus albacares',
  'Katsuwonus pelamis',
  'Coryphaena hippurus'
  // ... (30 total species)
];

/**
 * CORS headers for cross-origin requests
 */
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handle OPTIONS preflight requests
 */
function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders()
  });
}

/**
 * Extract environmental features from D1 data
 * Features: SST, Chlorophyll-a, Salinity, Depth, Distance to coast, Fishing intensity, Time of day, Season
 */
async function extractFeatures(env, latitude, longitude, timestamp) {
  try {
    // Query recent environmental data for the location (within 0.1° radius)
    const query = `
      SELECT
        (SELECT AVG(temperature) FROM sst_data
         WHERE ABS(latitude - ?) < 0.1 AND ABS(longitude - ?) < 0.1
         AND timestamp >= datetime('now', '-7 days')
         LIMIT 100) as sst,
        (SELECT AVG(chlorophyll_a) FROM ocean_color_data
         WHERE ABS(latitude - ?) < 0.1 AND ABS(longitude - ?) < 0.1
         AND timestamp >= datetime('now', '-7 days')
         LIMIT 100) as chlorophyll,
        (SELECT AVG(salinity) FROM salinity_data
         WHERE ABS(latitude - ?) < 0.1 AND ABS(longitude - ?) < 0.1
         AND timestamp >= datetime('now', '-7 days')
         LIMIT 100) as salinity,
        (SELECT COUNT(*) FROM fishing_events
         WHERE ABS(start_latitude - ?) < 0.5 AND ABS(start_longitude - ?) < 0.5
         AND start_time >= datetime('now', '-30 days')) as fishing_intensity
    `;

    const result = await env.BGAPP_DATA.prepare(query)
      .bind(latitude, longitude, latitude, longitude, latitude, longitude, latitude, longitude)
      .first();

    // Calculate derived features
    const distanceToCoast = calculateDistanceToCoast(latitude, longitude);
    const depth = estimateDepth(latitude, longitude); // Placeholder - will use bathymetry data
    const timeOfDay = new Date(timestamp).getHours();
    const season = getSeason(new Date(timestamp));

    return {
      sst: result?.sst || 24.5,
      chlorophyll: result?.chlorophyll || 0.5,
      salinity: result?.salinity || 35.5,
      depth: depth,
      distanceToCoast: distanceToCoast,
      fishingIntensity: result?.fishing_intensity || 0,
      timeOfDay: timeOfDay,
      season: season
    };
  } catch (error) {
    console.error('Feature extraction error:', error);
    // Return default features on error
    return {
      sst: 24.5,
      chlorophyll: 0.5,
      salinity: 35.5,
      depth: 100,
      distanceToCoast: 50,
      fishingIntensity: 0,
      timeOfDay: 12,
      season: 1
    };
  }
}

/**
 * Calculate distance to nearest coastline (simplified)
 */
function calculateDistanceToCoast(latitude, longitude) {
  // Simplified calculation - distance to Angola coast approximation
  // Continental Angola coast approximately follows: lon ~13° (western boundary)
  const coastLon = 13.0;
  const latDiff = 0;
  const lonDiff = (longitude - coastLon) * 111; // Convert to km
  return Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
}

/**
 * Estimate depth based on distance from coast (simplified bathymetry model)
 */
function estimateDepth(latitude, longitude) {
  const distToCoast = calculateDistanceToCoast(latitude, longitude);
  // Simplified model: 0-10km = shelf (50m), 10-50km = slope (200m), >50km = deep (2000m)
  if (distToCoast < 10) return 50;
  if (distToCoast < 50) return 200;
  return 2000;
}

/**
 * Get season (0-3: Summer, Autumn, Winter, Spring in Southern Hemisphere)
 */
function getSeason(date) {
  const month = date.getMonth();
  if (month >= 11 || month <= 1) return 0; // Summer (Dec-Feb)
  if (month >= 2 && month <= 4) return 1;  // Autumn (Mar-May)
  if (month >= 5 && month <= 7) return 2;  // Winter (Jun-Aug)
  return 3; // Spring (Sep-Nov)
}

/**
 * Predict species using ML model (placeholder - will use TensorFlow.js)
 * Returns top-k species predictions with confidence scores
 */
async function predictSpecies(features, topK = 3) {
  // Placeholder model - will be replaced with trained TensorFlow.js model
  // For now, using rule-based heuristics for demonstration

  const predictions = [];

  // Rule 1: High chlorophyll + shallow depth = Small pelagics (Sardinella, Scomber)
  if (features.chlorophyll > 1.0 && features.depth < 200) {
    predictions.push({ species: 'Sardinella aurita', confidence: 0.75, reasoning: 'High productivity shallow waters' });
    predictions.push({ species: 'Scomber colias', confidence: 0.65, reasoning: 'Favorable pelagic conditions' });
  }

  // Rule 2: Moderate SST + offshore = Tuna species
  if (features.sst >= 22 && features.sst <= 28 && features.distanceToCoast > 50) {
    predictions.push({ species: 'Thunnus albacares', confidence: 0.70, reasoning: 'Offshore tropical waters' });
    predictions.push({ species: 'Katsuwonus pelamis', confidence: 0.60, reasoning: 'Pelagic migratory conditions' });
  }

  // Rule 3: Coastal waters + moderate depth = Demersal species
  if (features.distanceToCoast < 30 && features.depth >= 50 && features.depth < 500) {
    predictions.push({ species: 'Merluccius capensis', confidence: 0.68, reasoning: 'Demersal habitat conditions' });
    predictions.push({ species: 'Dentex angolensis', confidence: 0.55, reasoning: 'Continental shelf environment' });
  }

  // Rule 4: Warm shallow waters = Sea turtles (conservation concern)
  if (features.sst > 24 && features.depth < 100 && features.distanceToCoast < 50) {
    predictions.push({ species: 'Caretta caretta', confidence: 0.60, reasoning: 'Coastal foraging habitat' });
    predictions.push({ species: 'Chelonia mydas', confidence: 0.50, reasoning: 'Nearshore feeding grounds' });
  }

  // Sort by confidence and return top-k
  predictions.sort((a, b) => b.confidence - a.confidence);
  return predictions.slice(0, topK);
}

/**
 * Calculate bycatch risk for protected species in a location
 */
async function calculateBycatchRisk(env, latitude, longitude) {
  try {
    // Get protected species in region
    const protectedSpecies = await env.BGAPP_DATA.prepare(`
      SELECT
        scientific_name,
        common_name,
        conservation_status,
        bycatch_vulnerability_score
      FROM marine_species
      WHERE conservation_status IN ('CR', 'EN', 'VU')
      ORDER BY bycatch_vulnerability_score DESC
    `).all();

    // Get fishing intensity in area
    const fishingIntensity = await env.BGAPP_DATA.prepare(`
      SELECT COUNT(*) as event_count
      FROM fishing_events
      WHERE ABS(start_latitude - ?) < 0.5
        AND ABS(start_longitude - ?) < 0.5
        AND start_time >= datetime('now', '-30 days')
    `).bind(latitude, longitude).first();

    // Get conservation risk zone data
    const riskZone = await env.BGAPP_DATA.prepare(`
      SELECT
        overall_bycatch_risk,
        turtle_bycatch_risk,
        dolphin_bycatch_risk,
        risk_category,
        monitoring_priority
      FROM conservation_risk_zones
      WHERE ABS(center_latitude - ?) < 0.1
        AND ABS(center_longitude - ?) < 0.1
      ORDER BY ABS(center_latitude - ?) + ABS(center_longitude - ?)
      LIMIT 1
    `).bind(latitude, longitude, latitude, longitude).first();

    // Calculate composite risk score
    const baseRisk = riskZone?.overall_bycatch_risk || 0.3;
    const fishingFactor = Math.min(fishingIntensity.event_count / 10, 1.0);
    const compositeRisk = baseRisk * 0.7 + fishingFactor * 0.3;

    return {
      location: { latitude, longitude },
      overallRisk: Math.round(compositeRisk * 100) / 100,
      riskCategory: getRiskCategory(compositeRisk),
      fishingIntensity: fishingIntensity.event_count,
      protectedSpeciesAtRisk: protectedSpecies.results.filter(s => s.bycatch_vulnerability_score > 0.7).map(s => ({
        species: s.scientific_name,
        commonName: s.common_name,
        conservationStatus: s.conservation_status,
        vulnerabilityScore: s.bycatch_vulnerability_score
      })),
      recommendedAction: getRecommendedAction(compositeRisk),
      monitoringPriority: riskZone?.monitoring_priority || 3
    };
  } catch (error) {
    console.error('Bycatch risk calculation error:', error);
    return {
      location: { latitude, longitude },
      overallRisk: 0.3,
      riskCategory: 'medium',
      error: 'Risk calculation failed, showing conservative estimate'
    };
  }
}

/**
 * Get risk category from numerical score
 */
function getRiskCategory(risk) {
  if (risk >= 0.8) return 'very_high';
  if (risk >= 0.6) return 'high';
  if (risk >= 0.4) return 'medium';
  if (risk >= 0.2) return 'low';
  return 'very_low';
}

/**
 * Get recommended conservation action based on risk level
 */
function getRecommendedAction(risk) {
  if (risk >= 0.8) return 'Immediate intervention required. Close fishing area temporarily.';
  if (risk >= 0.6) return 'High monitoring needed. Deploy observers on fishing vessels.';
  if (risk >= 0.4) return 'Moderate monitoring. Increase patrol frequency.';
  if (risk >= 0.2) return 'Standard monitoring protocols apply.';
  return 'Low risk area. Continue routine monitoring.';
}

/**
 * Main worker request handler
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    // Health check endpoint
    if (path === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        service: 'ml-species-predictor',
        version: MODEL_VERSION,
        timestamp: new Date().toISOString()
      }), {
        headers: {
          ...getCorsHeaders(),
          'Content-Type': 'application/json'
        }
      });
    }

    // POST /api/ml/predict-species
    if (path === '/api/ml/predict-species' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { latitude, longitude, timestamp = new Date().toISOString(), topK = 3 } = body;

        if (!latitude || !longitude) {
          return new Response(JSON.stringify({ error: 'Missing required fields: latitude, longitude' }), {
            status: 400,
            headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
          });
        }

        // Extract environmental features
        const features = await extractFeatures(env, latitude, longitude, timestamp);

        // Predict species
        const predictions = await predictSpecies(features, topK);

        return new Response(JSON.stringify({
          location: { latitude, longitude },
          timestamp,
          features,
          predictions,
          modelVersion: MODEL_VERSION
        }), {
          headers: {
            ...getCorsHeaders(),
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
        });
      }
    }

    // GET /api/ml/species-probability
    if (path === '/api/ml/species-probability' && request.method === 'GET') {
      try {
        const latitude = parseFloat(url.searchParams.get('lat'));
        const longitude = parseFloat(url.searchParams.get('lon'));
        const timestamp = url.searchParams.get('timestamp') || new Date().toISOString();

        if (!latitude || !longitude) {
          return new Response(JSON.stringify({ error: 'Missing required parameters: lat, lon' }), {
            status: 400,
            headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
          });
        }

        const features = await extractFeatures(env, latitude, longitude, timestamp);
        const predictions = await predictSpecies(features, 5);

        return new Response(JSON.stringify({
          location: { latitude, longitude },
          timestamp,
          speciesProbability: predictions
        }), {
          headers: {
            ...getCorsHeaders(),
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
        });
      }
    }

    // GET /api/ml/bycatch-risk
    if (path === '/api/ml/bycatch-risk' && request.method === 'GET') {
      try {
        const latitude = parseFloat(url.searchParams.get('lat'));
        const longitude = parseFloat(url.searchParams.get('lon'));

        if (!latitude || !longitude) {
          return new Response(JSON.stringify({ error: 'Missing required parameters: lat, lon' }), {
            status: 400,
            headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
          });
        }

        const bycatchRisk = await calculateBycatchRisk(env, latitude, longitude);

        return new Response(JSON.stringify(bycatchRisk), {
          headers: {
            ...getCorsHeaders(),
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=1800'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
        });
      }
    }

    // 404 Not Found
    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
    });
  }
};

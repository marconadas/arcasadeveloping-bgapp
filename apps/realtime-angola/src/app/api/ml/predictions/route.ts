import { NextRequest, NextResponse } from 'next/server';

// Proxy endpoint for ML predictions to avoid CORS issues
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const limit = searchParams.get('limit') || '500';

    // Build query parameters
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    params.append('limit', limit);

    // Proxy to external Cloudflare Worker API
    const workerUrl = `https://bgapp-api-worker.majearcasa.workers.dev/api/ml/predictions?${params.toString()}`;

    console.log('[ML Predictions API Proxy] Fetching from:', workerUrl);

    const response = await fetch(workerUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // Cache for 5 minutes
      next: {
        revalidate: 300,
      }
    });

    if (!response.ok) {
      console.error('[ML Predictions API Proxy] Worker responded with:', response.status);
      const errorText = await response.text();
      console.error('[ML Predictions API Proxy] Error response:', errorText);

      // For 429 rate limit errors, return mock ML predictions
      if (response.status === 429) {
        console.log('[ML Predictions API Proxy] Rate limited - returning mock data for testing');

        // Generate mock ML predictions data
        const mockData = generateMockMLPredictions(type);

        return NextResponse.json({
          data: mockData,
          predictions: mockData,
          metadata: {
            source: 'mock_data',
            timestamp: new Date().toISOString(),
            type: type || 'all',
            limit: parseInt(limit),
            count: mockData.length,
            warning: 'Rate limited - returning mock data for testing'
          }
        }, {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=60',
            'X-Data-Source': 'mock',
            'X-Data-Type': 'ml-predictions',
            'X-Rate-Limited': 'true'
          }
        });
      }

      // Return empty data with error status
      return NextResponse.json(
        {
          data: [],
          predictions: [],
          error: `Worker API error: ${response.status}`,
          message: errorText || 'Failed to fetch ML predictions'
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Ensure we always return data in expected format
    const formattedResponse = {
      data: data.data || data.predictions || data || [],
      predictions: data.predictions || data.data || data || [],
      metadata: {
        source: 'bgapp-api-worker',
        timestamp: new Date().toISOString(),
        type: type || 'all',
        limit: parseInt(limit),
        count: (data.data || data.predictions || data || []).length
      }
    };

    console.log('[ML Predictions API Proxy] Successfully fetched', formattedResponse.metadata.count, 'predictions');

    return NextResponse.json(formattedResponse, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Data-Source': 'bgapp-api-worker',
        'X-Data-Type': 'ml-predictions'
      }
    });

  } catch (error) {
    console.error('[ML Predictions API Proxy] Error:', error);

    // Return empty data with error information
    return NextResponse.json(
      {
        data: [],
        predictions: [],
        error: 'Failed to fetch ML predictions',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      {
        status: 500,
        headers: {
          'X-Error': 'proxy-failure'
        }
      }
    );
  }
}

// Generate mock ML predictions data for rate limit fallback
function generateMockMLPredictions(type?: string | null) {
  const predictions = [];
  const numPredictions = 50 + Math.floor(Math.random() * 100); // 50-150 predictions

  // Angola EEZ boundaries
  const bounds = {
    minLat: -18.02,
    maxLat: -5.55,
    minLon: 8.9,
    maxLon: 13.35
  };

  // Prediction types available
  const predictionTypes = [
    'fishing_activity',
    'vessel_behavior',
    'environmental_anomaly',
    'species_distribution',
    'illegal_fishing_risk',
    'marine_habitat_quality'
  ];

  // Model names for different prediction types
  const modelNames: Record<string, string> = {
    'fishing_activity': 'FishingActivityPredictor_v2.3',
    'vessel_behavior': 'VesselBehaviorAnalyzer_v1.8',
    'environmental_anomaly': 'AnomalyDetector_v3.1',
    'species_distribution': 'SpeciesDistributionModel_v2.0',
    'illegal_fishing_risk': 'IUUFishingRiskModel_v1.5',
    'marine_habitat_quality': 'HabitatQualityAssessment_v2.2'
  };

  // Common fishing zones in Angola EEZ
  const hotspots = [
    { lat: -8.5, lon: 12.0, radius: 1.5 },   // Northern fishing zone
    { lat: -12.0, lon: 11.5, radius: 2 },    // Central fishing zone
    { lat: -15.5, lon: 11.0, radius: 1.5 },  // Southern fishing zone
    { lat: -10.0, lon: 12.5, radius: 1 },    // Coastal upwelling zone
  ];

  for (let i = 0; i < numPredictions; i++) {
    // Determine prediction type (filter if specific type requested)
    let predType;
    if (type && predictionTypes.includes(type)) {
      predType = type;
    } else if (type === 'all' || !type) {
      predType = predictionTypes[Math.floor(Math.random() * predictionTypes.length)];
    } else {
      // If invalid type specified, still generate but use random type
      predType = predictionTypes[Math.floor(Math.random() * predictionTypes.length)];
    }

    // 60% chance to be in a hotspot zone for fishing-related predictions
    let lat, lon;
    if (Math.random() < 0.6 && (predType === 'fishing_activity' || predType === 'illegal_fishing_risk')) {
      const hotspot = hotspots[Math.floor(Math.random() * hotspots.length)];
      const angle = Math.random() * 2 * Math.PI;
      const r = Math.random() * hotspot.radius;
      lat = hotspot.lat + r * Math.sin(angle);
      lon = hotspot.lon + r * Math.cos(angle);
    } else {
      // Random position in EEZ
      lat = bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat);
      lon = bounds.minLon + Math.random() * (bounds.maxLon - bounds.minLon);
    }

    // Generate confidence based on prediction type
    let confidence = 0.5 + Math.random() * 0.5; // 0.5 to 1.0
    let value;
    let metadata = {};

    // Type-specific value generation
    switch (predType) {
      case 'fishing_activity':
        value = Math.random() < 0.3 ? 1 : 0; // 30% chance of fishing activity
        metadata = {
          vessel_count: value ? Math.floor(1 + Math.random() * 10) : 0,
          fishing_hours: value ? Math.floor(1 + Math.random() * 24) : 0
        };
        break;
      case 'vessel_behavior':
        const behaviors = ['normal', 'suspicious', 'transiting', 'fishing', 'anchored'];
        value = behaviors[Math.floor(Math.random() * behaviors.length)];
        metadata = {
          speed_knots: Math.random() * 15,
          heading: Math.floor(Math.random() * 360)
        };
        break;
      case 'environmental_anomaly':
        value = Math.random() < 0.1; // 10% chance of anomaly
        confidence = value ? 0.7 + Math.random() * 0.3 : 0.3 + Math.random() * 0.4;
        metadata = {
          anomaly_type: value ? ['temperature', 'chlorophyll', 'turbidity'][Math.floor(Math.random() * 3)] : 'none',
          severity: value ? Math.random() : 0
        };
        break;
      case 'species_distribution':
        const species = ['sardines', 'tuna', 'mackerel', 'anchovies', 'horse_mackerel'];
        value = species[Math.floor(Math.random() * species.length)];
        metadata = {
          abundance_index: Math.random() * 100,
          suitable_habitat_score: Math.random()
        };
        break;
      case 'illegal_fishing_risk':
        value = Math.random() * 100; // Risk score 0-100
        confidence = 0.6 + Math.random() * 0.4;
        metadata = {
          risk_level: value > 70 ? 'high' : value > 40 ? 'medium' : 'low',
          contributing_factors: value > 50 ? ['night_fishing', 'no_ais', 'restricted_zone'] : []
        };
        break;
      case 'marine_habitat_quality':
        value = 0.3 + Math.random() * 0.7; // Quality score 0.3-1.0
        metadata = {
          health_index: value,
          stress_factors: value < 0.5 ? ['pollution', 'overfishing', 'temperature'] : [],
          biodiversity_score: value * (0.8 + Math.random() * 0.2)
        };
        break;
      default:
        value = Math.random();
    }

    predictions.push({
      id: `pred_${Date.now()}_${i}`,
      latitude: Math.round(lat * 10000) / 10000,
      longitude: Math.round(lon * 10000) / 10000,
      prediction_type: predType,
      model_name: modelNames[predType] || 'GenericModel_v1.0',
      value: value,
      confidence: Math.round(confidence * 1000) / 1000,
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Within last 24h
      grid_resolution: 0.01,
      metadata: metadata,
      data_source: 'mock_ml_service',
      processing_time_ms: Math.floor(50 + Math.random() * 200)
    });
  }

  // Sort by timestamp (most recent first)
  predictions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // If filtering by type, return only those predictions
  if (type && type !== 'all' && predictionTypes.includes(type)) {
    return predictions.filter(p => p.prediction_type === type);
  }

  return predictions;
}
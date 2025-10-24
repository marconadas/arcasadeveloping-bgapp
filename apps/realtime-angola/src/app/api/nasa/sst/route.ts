import { NextRequest, NextResponse } from 'next/server';

// NASA Sea Surface Temperature API route for realtime-angola app
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];
    const includeAnomaly = searchParams.get('anomaly') === 'true';

    // Use production NASA Earthdata proxy worker
    const nasaProxyUrl = process.env.NASA_PROXY_URL || 'https://nasa-earthdata-proxy.majearcasa.workers.dev';

    // Build query parameters for NASA proxy (uses 'date' not 'startDate/endDate')
    const params = new URLSearchParams({
      date: startDate,
      ...(lat && lon ? { lat, lon } : {})
    });

    // Call NASA proxy worker
    const response = await fetch(`${nasaProxyUrl}/nasa/sst?${params}`, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'max-age=3600' // Cache for 1 hour
      }
    });

    if (!response.ok) {
      // Handle 429 rate limit specifically with mock data
      if (response.status === 429) {
        console.log('[NASA SST API] Rate limited - returning mock data');
        return NextResponse.json({
          sst: generateFallbackSST(),
          metadata: {
            source: 'mock_data',
            reason: 'rate_limited',
            message: 'Rate limit exceeded - using simulated data',
            timestamp: new Date().toISOString()
          },
          visualization: {
            type: 'contour',
            colorScale: 'thermal',
            opacity: 0.8,
            minValue: 18,
            maxValue: 30,
            unit: '°C',
            contourLevels: [18, 20, 22, 24, 26, 28, 30]
          },
          angola_eez: {
            filtered: true,
            bounds: {
              north: -4.376,
              south: -18.042,
              east: 13.377,
              west: 11.679
            }
          }
        }, {
          headers: {
            'Cache-Control': 'public, s-maxage=60',
            'X-Data-Source': 'mock',
            'X-Rate-Limited': 'true'
          }
        });
      }
      throw new Error(`NASA proxy error: ${response.status}`);
    }

    const data = await response.json();

    // Calculate SST anomalies if requested
    if (includeAnomaly && data.sst) {
      const avgSST = calculateAverageSST(data.sst);
      data.sst = data.sst.map((point: any) => ({
        ...point,
        anomaly: point.temperature - avgSST
      }));
    }

    // Process and enhance data for visualization
    const enhancedData = {
      ...data,
      visualization: {
        type: 'contour',
        colorScale: 'thermal',
        opacity: 0.8,
        minValue: data.metadata?.minTemp || 18,
        maxValue: data.metadata?.maxTemp || 30,
        unit: '°C',
        contourLevels: [18, 20, 22, 24, 26, 28, 30]
      },
      angola_eez: {
        filtered: true,
        bounds: {
          north: -4.376,
          south: -18.042,
          east: 13.377,
          west: 11.679
        }
      },
      oceanographic_features: detectOceanographicFeatures(data.sst)
    };

    return NextResponse.json(enhancedData, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });

  } catch (error) {
    console.error('Error fetching NASA SST data:', error);

    // Return fallback data for development/demo
    return NextResponse.json({
      sst: generateFallbackSST(),
      metadata: {
        source: 'fallback',
        message: 'Using simulated data due to API error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Calculate average SST for anomaly detection
function calculateAverageSST(sstData: any[]) {
  if (!sstData || sstData.length === 0) return 24;

  const sum = sstData.reduce((acc, point) => acc + point.temperature, 0);
  return sum / sstData.length;
}

// Detect oceanographic features from SST data
function detectOceanographicFeatures(sstData: any[]) {
  const features = {
    upwelling: [],
    warmCore: [],
    coldCore: [],
    fronts: []
  };

  if (!sstData || sstData.length === 0) return features;

  // Simple feature detection (would be more sophisticated in production)
  const avgTemp = calculateAverageSST(sstData);

  sstData.forEach(point => {
    const tempDiff = point.temperature - avgTemp;

    // Detect upwelling (cold water near coast)
    if (tempDiff < -2 && point.lon > 11.5 && point.lon < 12.5) {
      features.upwelling.push({
        lat: point.lat,
        lon: point.lon,
        intensity: Math.abs(tempDiff)
      });
    }

    // Detect warm core eddies
    if (tempDiff > 2) {
      features.warmCore.push({
        lat: point.lat,
        lon: point.lon,
        intensity: tempDiff
      });
    }

    // Detect cold core eddies
    if (tempDiff < -2 && point.lon < 11.5) {
      features.coldCore.push({
        lat: point.lat,
        lon: point.lon,
        intensity: Math.abs(tempDiff)
      });
    }
  });

  return features;
}

// Generate fallback SST data for Angola EEZ
function generateFallbackSST() {
  const data = [];
  const latStep = 0.1;
  const lonStep = 0.1;

  // Angola EEZ boundaries
  const bounds = {
    minLat: -18.02,
    maxLat: -5.55,
    minLon: 8.9,
    maxLon: 13.35
  };

  // Current month for seasonal variation
  const month = new Date().getMonth();
  const seasonalFactor = Math.sin((month / 12) * 2 * Math.PI) * 2;

  for (let lat = bounds.minLat; lat <= bounds.maxLat; lat += latStep) {
    for (let lon = bounds.minLon; lon <= bounds.maxLon; lon += lonStep) {
      // Realistic SST patterns for Angola
      const distFromCoast = Math.min(Math.abs(lon - 12.5), 2);
      const latFactor = (lat + 11.5) / 12.5; // North is warmer

      // Benguela Current influence (cold from south)
      const benguelaEffect = Math.max(0, 1 - (lat + 16) / 3) * 3;

      // Base temperature
      let temp = 24 + latFactor * 3 + seasonalFactor;

      // Coastal upwelling (cooler near coast)
      if (distFromCoast < 0.5) {
        temp -= 3 * (1 - distFromCoast / 0.5);
      }

      // Apply Benguela effect
      temp -= benguelaEffect;

      // Add some natural variation
      const variation = Math.sin(lat * 0.5) * Math.cos(lon * 0.8) * 0.5;
      temp += variation + (Math.random() - 0.5) * 0.3;

      data.push({
        lat: Math.round(lat * 100) / 100,
        lon: Math.round(lon * 100) / 100,
        temperature: Math.max(16, Math.min(30, Math.round(temp * 100) / 100)),
        quality: Math.floor(Math.random() * 3) + 3,
        sensor: 'MODIS'
      });
    }
  }

  return data;
}

export async function POST(request: NextRequest) {
  // Handle data ingestion from NASA webhook or scheduled updates
  try {
    const body = await request.json();

    // Validate the incoming data
    if (!body.granuleId || !body.data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Process and store the data (would integrate with D1 in production)
    console.log('Processing NASA SST data:', body.granuleId);

    // Detect oceanographic features
    const features = detectOceanographicFeatures(body.data);

    return NextResponse.json({
      success: true,
      granuleId: body.granuleId,
      recordsProcessed: body.data?.length || 0,
      featuresDetected: {
        upwelling: features.upwelling.length,
        warmCore: features.warmCore.length,
        coldCore: features.coldCore.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing NASA SST data:', error);
    return NextResponse.json(
      { error: 'Failed to process data' },
      { status: 500 }
    );
  }
}
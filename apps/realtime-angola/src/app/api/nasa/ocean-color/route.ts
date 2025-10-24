import { NextRequest, NextResponse } from 'next/server';

// NASA Ocean Color API route for realtime-angola app
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];

    // Use production NASA Earthdata proxy worker
    const nasaProxyUrl = process.env.NASA_PROXY_URL || 'https://nasa-earthdata-proxy.majearcasa.workers.dev';

    // Build query parameters for NASA proxy (uses 'date' not 'startDate/endDate')
    const params = new URLSearchParams({
      date: startDate,
      ...(lat && lon ? { lat, lon } : {})
    });

    // Call NASA proxy worker
    const response = await fetch(`${nasaProxyUrl}/nasa/ocean-color?${params}`, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'max-age=3600' // Cache for 1 hour
      }
    });

    if (!response.ok) {
      // Handle 429 rate limit specifically with mock data
      if (response.status === 429) {
        console.log('[NASA Ocean Color API] Rate limited - returning mock data');
        return NextResponse.json({
          oceanColor: generateFallbackOceanColor(),
          metadata: {
            source: 'mock_data',
            reason: 'rate_limited',
            message: 'Rate limit exceeded - using simulated data',
            timestamp: new Date().toISOString()
          },
          visualization: {
            type: 'heatmap',
            colorScale: 'viridis',
            opacity: 0.7,
            minValue: 0,
            maxValue: 10,
            unit: 'mg/m³'
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

    // Process and enhance data for visualization
    const enhancedData = {
      ...data,
      visualization: {
        type: 'heatmap',
        colorScale: 'viridis',
        opacity: 0.7,
        minValue: data.metadata?.minChlorophyll || 0,
        maxValue: data.metadata?.maxChlorophyll || 10,
        unit: 'mg/m³'
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
    };

    return NextResponse.json(enhancedData, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });

  } catch (error) {
    console.error('Error fetching NASA ocean color data:', error);

    // Return fallback data for development/demo
    return NextResponse.json({
      oceanColor: generateFallbackOceanColor(),
      metadata: {
        source: 'fallback',
        message: 'Using simulated data due to API error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Generate fallback ocean color data for Angola EEZ
function generateFallbackOceanColor() {
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

  for (let lat = bounds.minLat; lat <= bounds.maxLat; lat += latStep) {
    for (let lon = bounds.minLon; lon <= bounds.maxLon; lon += lonStep) {
      // Simulate chlorophyll patterns
      const distFromCoast = Math.min(Math.abs(lon - 12.5), 2);
      const upwellingEffect = distFromCoast < 0.5 ? 2.5 : 1.0;
      const latEffect = (lat + 11.5) / 12.5;

      // Higher chlorophyll near coast due to upwelling
      const baseChlorophyll = 0.5 + (1 - distFromCoast / 2) * 3;
      const variation = Math.sin(lat * 0.5) * Math.cos(lon * 0.8) * 0.5;

      data.push({
        lat: Math.round(lat * 100) / 100,
        lon: Math.round(lon * 100) / 100,
        chlorophyll_a: Math.max(0.1, Math.min(10,
          baseChlorophyll * upwellingEffect + variation + (Math.random() - 0.5) * 0.3
        )),
        turbidity: Math.max(0, Math.min(5, distFromCoast < 0.3 ? 2 + Math.random() : 0.5 + Math.random() * 0.5)),
        quality: Math.floor(Math.random() * 3) + 3 // Quality flag 3-5
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
    console.log('Processing NASA ocean color data:', body.granuleId);

    return NextResponse.json({
      success: true,
      granuleId: body.granuleId,
      recordsProcessed: body.data?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing NASA ocean color data:', error);
    return NextResponse.json(
      { error: 'Failed to process data' },
      { status: 500 }
    );
  }
}
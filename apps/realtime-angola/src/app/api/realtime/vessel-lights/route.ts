import { NextRequest, NextResponse } from 'next/server';

/**
 * Vessel Lights API Route
 * Fetches vessel lights data directly from Cloudflare D1 database
 * Data source: vessel_lights_data table (NASA VIIRS nighttime lights)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '500');
    const bbox = searchParams.get('bbox'); // Format: "south,west,north,east"

    // Angola EEZ default bounds
    const angolaEEZ = {
      south: -18.02,
      north: -5.55,
      west: 8.9,
      east: 13.35
    };

    // Parse bbox if provided
    let bounds = angolaEEZ;
    if (bbox) {
      const [south, west, north, east] = bbox.split(',').map(Number);
      bounds = { south, west, north, east };
    }

    console.log('[Vessel Lights API] Fetching vessel lights data from D1...');
    console.log('[Vessel Lights API] Bounds:', bounds);
    console.log('[Vessel Lights API] Limit:', limit);

    // Call production API worker using oceanographic endpoint (same as ocean-color)
    const workerParams = new URLSearchParams({
      type: 'vessel_lights',
      limit: limit.toString(),
      minLat: bounds.south.toString(),
      maxLat: bounds.north.toString(),
      minLon: bounds.west.toString(),
      maxLon: bounds.east.toString()
    });

    const workerUrl = `https://bgapp-api-worker.majearcasa.workers.dev/api/oceanographic?${workerParams.toString()}`;

    console.log('[Vessel Lights API] Calling API worker:', workerUrl);

    const response = await fetch(workerUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      next: {
        revalidate: 300, // Cache for 5 minutes
      }
    });

    if (!response.ok) {
      console.error('[Vessel Lights API] API worker error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('[Vessel Lights API] Error response:', errorText.substring(0, 200));
      throw new Error(`API worker error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[Vessel Lights API] Received data from worker:', {
      hasVesselLights: !!data.vessel_lights,
      count: data.vessel_lights?.length || 0
    });

    // bgapp-api-worker returns data in vessel_lights array
    const vesselLightsData = data.vessel_lights || [];

    // Transform data to match expected format
    const vesselLights = vesselLightsData.map((point: any) => ({
      id: point.id,
      lat: point.latitude,
      lon: point.longitude,
      lng: point.longitude,
      radiance: point.radiance,
      quality: point.quality_flag || 'high',
      timestamp: point.timestamp,
      source: point.data_source || 'nasa_viirs',
      detectionTime: point.timestamp
    }));

    console.log('[Vessel Lights API] Transformed vessel lights:', vesselLights.length, 'points');

    return NextResponse.json({
      success: true,
      count: vesselLights.length,
      vessel_lights: vesselLights,
      metadata: {
        source: 'bgapp-api-worker-d1',
        table: 'vessel_lights_data',
        bounds,
        limit,
        timestamp: new Date().toISOString(),
        d1_source: data.metadata?.source,
        total_available: data.metadata?.counts?.vessel_lights || vesselLights.length
      }
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Content-Type': 'application/json',
        'X-Data-Source': 'bgapp-api-worker',
        'X-Data-Type': 'vessel-lights'
      }
    });

  } catch (error) {
    console.error('[Vessel Lights API] Error fetching vessel lights data:', error);

    // Return empty but valid response on error
    return NextResponse.json({
      success: false,
      count: 0,
      vessel_lights: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        source: 'error',
        timestamp: new Date().toISOString()
      }
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

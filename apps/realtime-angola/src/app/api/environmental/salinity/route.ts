import { NextRequest, NextResponse } from 'next/server';

// Proxy endpoint for salinity data to avoid CORS issues
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bbox = searchParams.get('bbox');
    const limit = searchParams.get('limit') || '1000';

    // Build query parameters
    const params = new URLSearchParams();
    if (bbox) params.append('bbox', bbox);
    params.append('limit', limit);

    // Proxy to external Cloudflare Worker API - Correct endpoint
    const workerParams = new URLSearchParams({
      type: 'salinity',
      limit: limit,
      minLat: '-18.02',
      maxLat: '-5.55',
      minLon: '8.9',
      maxLon: '13.35'
    });
    
    const workerUrl = `https://bgapp-api-worker.majearcasa.workers.dev/api/oceanographic?${workerParams.toString()}`;

    console.log('[Salinity API Proxy] Fetching from:', workerUrl);

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
      console.error('[Salinity API Proxy] Worker responded with:', response.status);
      const errorText = await response.text();
      console.error('[Salinity API Proxy] Error response:', errorText.substring(0, 200));

      // For 429 rate limit errors, return mock data for testing
      if (response.status === 429) {
        console.log('[Salinity API Proxy] Rate limited - returning mock data for testing');

        // Generate mock salinity data points within Angola EEZ
        const mockData = [];
        const numPoints = 50;

        for (let i = 0; i < numPoints; i++) {
          // Angola EEZ approximate bounds: lat -18.02 to -5.55, lon 8.9 to 13.35
          const lat = -18.02 + Math.random() * 12.47; // Range of latitudes
          const lon = 8.9 + Math.random() * 4.45;     // Range of longitudes

          mockData.push({
            latitude: lat,
            longitude: lon,
            salinity: 34.5 + Math.random() * 2.5, // Typical ocean salinity 34.5-37 PSU
            depth: Math.random() * 100,
            timestamp: new Date().toISOString(),
            data_source: 'mock_data',
            quality_flag: 1,
            metadata: {
              mock: true,
              reason: 'rate_limited'
            }
          });
        }

        return NextResponse.json({
          data: mockData,
          metadata: {
            source: 'mock_data',
            timestamp: new Date().toISOString(),
            bbox: bbox || 'angola_eez',
            limit: parseInt(limit),
            count: mockData.length,
            warning: 'Rate limited - returning mock data for testing'
          }
        }, {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=60',
            'X-Data-Source': 'mock',
            'X-Data-Type': 'salinity',
            'X-Rate-Limited': 'true'
          }
        });
      }

      // Return empty data with error status for other errors
      return NextResponse.json(
        {
          data: [],
          error: `Worker API error: ${response.status}`,
          message: 'Failed to fetch salinity data'
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // bgapp-api-worker returns data in salinity array
    // Worker already filters by Angola EEZ boundaries (Continental + Cabinda)
    // EEZ bounds from D1 geometry: lat -17.29 to -4.3, lon 8.30 to 13.84
    const salinityData = data.salinity || [];

    const formattedResponse = {
      data: salinityData,
      metadata: {
        source: 'bgapp-api-worker-d1',
        timestamp: data.metadata?.timestamp || new Date().toISOString(),
        bbox: bbox || 'angola_eez',
        limit: parseInt(limit),
        count: salinityData.length,
        d1_source: data.metadata?.source,
        total_available: data.metadata?.counts?.salinity || salinityData.length
      }
    };

    console.log('[Salinity API Proxy] Successfully fetched', formattedResponse.metadata.count, 'records from D1 (EEZ-filtered at worker level)');

    return NextResponse.json(formattedResponse, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Data-Source': 'bgapp-api-worker',
        'X-Data-Type': 'salinity'
      }
    });

  } catch (error) {
    console.error('[Salinity API Proxy] Error:', error);

    // Return empty data with error information
    return NextResponse.json(
      {
        data: [],
        error: 'Failed to fetch salinity data',
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
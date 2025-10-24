import { NextRequest, NextResponse } from 'next/server';

// Proxy endpoint for SST (Sea Surface Temperature) data to avoid CORS issues
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
      type: 'sst',
      limit: limit,
      minLat: '-18.02',
      maxLat: '-5.55',
      minLon: '8.9',
      maxLon: '13.35'
    });
    
    const workerUrl = `https://bgapp-api-worker.majearcasa.workers.dev/api/oceanographic?${workerParams.toString()}`;

    console.log('[SST API Proxy] Fetching from:', workerUrl);

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
      console.error('[SST API Proxy] Worker responded with:', response.status);
      const errorText = await response.text();
      console.error('[SST API Proxy] Error response:', errorText.substring(0, 200));

      // For 429 rate limit errors, return mock data for testing
      if (response.status === 429) {
        console.log('[SST API Proxy] Rate limited - returning mock data for testing');

        // Generate mock SST data points within Angola EEZ
        const mockData = [];
        const numPoints = 150;

        for (let i = 0; i < numPoints; i++) {
          // Angola EEZ approximate bounds: lat -18.02 to -5.55, lon 8.9 to 13.35
          const lat = -18.02 + Math.random() * 12.47; // Range of latitudes
          const lon = 8.9 + Math.random() * 4.45;     // Range of longitudes

          // Temperature varies by latitude (warmer near equator)
          const baseTemp = 20 + (Math.abs(lat + 10) * 0.3); // Base temperature based on latitude
          const variation = Math.random() * 3 - 1.5; // Random variation ±1.5°C

          mockData.push({
            latitude: lat,
            longitude: lon,
            temperature: Math.min(28, Math.max(18, baseTemp + variation)), // Keep between 18-28°C
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
            'X-Data-Type': 'sst',
            'X-Rate-Limited': 'true'
          }
        });
      }

      // Return empty data with error status for other errors
      return NextResponse.json(
        {
          data: [],
          error: `Worker API error: ${response.status}`,
          message: 'Failed to fetch SST data'
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // bgapp-api-worker returns data in sst array
    const sstData = data.sst || [];
    
    const formattedResponse = {
      data: sstData,
      metadata: {
        source: 'bgapp-api-worker-d1',
        timestamp: data.metadata?.timestamp || new Date().toISOString(),
        bbox: bbox || 'angola_eez',
        limit: parseInt(limit),
        count: sstData.length,
        d1_source: data.metadata?.source,
        total_available: data.metadata?.counts?.sst || sstData.length
      }
    };

    console.log('[SST API Proxy] Successfully fetched', formattedResponse.metadata.count, 'records from D1');

    return NextResponse.json(formattedResponse, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Data-Source': 'bgapp-api-worker',
        'X-Data-Type': 'sst'
      }
    });

  } catch (error) {
    console.error('[SST API Proxy] Error:', error);

    // Return empty data with error information
    return NextResponse.json(
      {
        data: [],
        error: 'Failed to fetch SST data',
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
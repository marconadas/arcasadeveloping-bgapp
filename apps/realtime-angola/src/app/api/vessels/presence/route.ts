import { NextRequest, NextResponse } from 'next/server';

// Proxy endpoint for vessel presence data to avoid CORS issues
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bbox = searchParams.get('bbox');
    const limit = searchParams.get('limit') || '500';

    // Build query parameters
    const params = new URLSearchParams();
    if (bbox) params.append('bbox', bbox);
    params.append('limit', limit);

    // Proxy to external Cloudflare Worker API
    const workerUrl = `https://bgapp-api-worker.majearcasa.workers.dev/api/vessels/presence?${params.toString()}`;

    console.log('[Vessel Presence API Proxy] Fetching from:', workerUrl);

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
      console.error('[Vessel Presence API Proxy] Worker responded with:', response.status);
      const errorText = await response.text();
      console.error('[Vessel Presence API Proxy] Error response:', errorText);

      // Return empty data with error status
      return NextResponse.json(
        {
          data: [],
          vessels: [],
          error: `Worker API error: ${response.status}`,
          message: errorText || 'Failed to fetch vessel presence data'
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Ensure we always return data in expected format
    const formattedResponse = {
      data: data.data || data.vessels || data || [],
      vessels: data.vessels || data.data || data || [],
      metadata: {
        source: 'bgapp-api-worker',
        timestamp: new Date().toISOString(),
        bbox: bbox || 'none',
        limit: parseInt(limit),
        count: (data.data || data.vessels || data || []).length
      }
    };

    console.log('[Vessel Presence API Proxy] Successfully fetched', formattedResponse.metadata.count, 'vessels');

    return NextResponse.json(formattedResponse, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Data-Source': 'bgapp-api-worker',
        'X-Data-Type': 'vessel-presence'
      }
    });

  } catch (error) {
    console.error('[Vessel Presence API Proxy] Error:', error);

    // Return empty data with error information
    return NextResponse.json(
      {
        data: [],
        vessels: [],
        error: 'Failed to fetch vessel presence data',
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
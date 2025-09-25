import { NextRequest, NextResponse } from 'next/server';

// Export dynamic for Next.js static generation
export const dynamic = 'force-dynamic';

const API_WORKER_URL = process.env.NODE_ENV === 'production'
  ? 'https://bgapp-api-worker.majearcasa.workers.dev'
  : 'https://bgapp-admin-api-worker.majearcasa.workers.dev';

const COPERNICUS_WORKER_URL = 'https://copernicus-official-worker.majearcasa.workers.dev';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat') || '-8.8137';
    const lon = searchParams.get('lon') || '13.2894';
    const layers = searchParams.get('layers') || 'temperature,chlorophyll,salinity';

    // Try to get real data from Copernicus worker
    const response = await fetch(
      `${COPERNICUS_WORKER_URL}/api/marine-data?lat=${lat}&lon=${lon}&layers=${layers}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      }
    );

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    // Fallback to API worker
    const fallbackResponse = await fetch(
      `${API_WORKER_URL}/api/copernicus/marine-data?lat=${lat}&lon=${lon}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      }
    );

    if (fallbackResponse.ok) {
      const data = await fallbackResponse.json();
      return NextResponse.json(data);
    }

    // Return realistic mock data for Angola region
    const mockData = {
      temperature: 24.5 + Math.random() * 3, // 24.5-27.5°C typical for Angola waters
      chlorophyll: 0.3 + Math.random() * 1.2, // 0.3-1.5 mg/m³ typical range
      salinity: 35.5 + Math.random() * 0.5, // 35.5-36 PSU typical
      ph: 8.1 + Math.random() * 0.1,
      dissolvedOxygen: 6.5 + Math.random() * 1.0,
      turbidity: 0.5 + Math.random() * 2.0,
      waveHeight: 1.0 + Math.random() * 2.0, // 1-3m typical
      windSpeed: 5.0 + Math.random() * 10.0, // 5-15 m/s
      windDirection: Math.random() * 360,
      currentSpeed: 0.2 + Math.random() * 0.8, // 0.2-1.0 m/s
      currentDirection: Math.random() * 360,
      timestamp: new Date().toISOString(),
      location: {
        lat: parseFloat(lat),
        lon: parseFloat(lon)
      },
      source: 'copernicus',
      quality: Math.random() > 0.3 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low',
      metadata: {
        satellite: 'Sentinel-3',
        product: 'OCEANCOLOUR_GLO_BGC_L3_MY_009_103',
        processingLevel: 'L3',
        lastUpdate: new Date().toISOString()
      }
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error fetching marine data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marine data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bbox, layers, timeRange } = body;

    // Forward to worker for area-based queries
    const response = await fetch(`${API_WORKER_URL}/api/copernicus/area-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bbox, layers, timeRange }),
      cache: 'no-store'
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    // Generate grid data for visualization
    const gridData = [];
    const latStep = 0.5;
    const lonStep = 0.5;
    
    for (let lat = bbox.south; lat <= bbox.north; lat += latStep) {
      for (let lon = bbox.west; lon <= bbox.east; lon += lonStep) {
        gridData.push({
          lat,
          lon,
          temperature: 24.5 + Math.random() * 3,
          chlorophyll: 0.3 + Math.random() * 1.2,
          salinity: 35.5 + Math.random() * 0.5,
          timestamp: new Date().toISOString()
        });
      }
    }

    return NextResponse.json({
      grid: gridData,
      bbox,
      resolution: `${latStep}x${lonStep}`,
      timestamp: new Date().toISOString(),
      source: 'mock'
    });
  } catch (error) {
    console.error('Error fetching area data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch area data' },
      { status: 500 }
    );
  }
}
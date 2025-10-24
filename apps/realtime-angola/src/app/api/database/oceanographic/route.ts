import { NextRequest, NextResponse } from 'next/server';

// API endpoint to fetch real oceanographic data from Cloudflare Worker
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get('type') || 'all';
    const source = searchParams.get('source') || 'all'; // nasa, copernicus, or all
    const limit = Math.min(parseInt(searchParams.get('limit') || '1000'), 5000);

    // Angola EEZ boundaries
    const bounds = {
      minLat: parseFloat(searchParams.get('minLat') || '-18.02'),
      maxLat: parseFloat(searchParams.get('maxLat') || '-5.55'),
      minLon: parseFloat(searchParams.get('minLon') || '8.9'),
      maxLon: parseFloat(searchParams.get('maxLon') || '13.35')
    };

    // Call the API worker to get real database data
    const workerUrl = 'https://bgapp-api-worker.majearcasa.workers.dev/api/oceanographic';
    const queryParams = new URLSearchParams({
      type: dataType,
      source: source,
      limit: limit.toString(),
      minLat: bounds.minLat.toString(),
      maxLat: bounds.maxLat.toString(),
      minLon: bounds.minLon.toString(),
      maxLon: bounds.maxLon.toString()
    });

    const response = await fetch(`${workerUrl}?${queryParams}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      // If worker is not available, fall back to direct query structure
      // This prepares the expected data structure for the frontend
      return NextResponse.json({
        sst: [],
        ocean_color: [],
        salinity: [],
        vessel_lights: [],
        ml_predictions: [],
        metadata: {
          source: 'fallback',
          timestamp: new Date().toISOString(),
          message: 'Worker unavailable, please check API configuration'
        }
      });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching oceanographic data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch oceanographic data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to transform database data to map-friendly format
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dataType, points } = body;

    // Transform data points for deck.gl visualization
    const transformedData = points.map((point: any) => {
      switch(dataType) {
        case 'sst':
          return {
            position: [point.longitude, point.latitude],
            value: point.temperature,
            timestamp: point.timestamp,
            source: point.data_source
          };
        case 'ocean_color':
          return {
            position: [point.longitude, point.latitude],
            value: point.chlorophyll_a,
            timestamp: point.timestamp,
            source: point.data_source
          };
        case 'salinity':
          return {
            position: [point.longitude, point.latitude],
            value: point.salinity,
            timestamp: point.timestamp,
            source: point.data_source
          };
        case 'vessel_lights':
          return {
            position: [point.longitude, point.latitude],
            value: point.radiance,
            timestamp: point.timestamp,
            vessel_count: point.vessel_count
          };
        case 'ml_predictions':
          return {
            position: [point.longitude, point.latitude],
            value: point.prediction_value,
            confidence: point.confidence_score,
            type: point.prediction_type,
            model: point.model_name
          };
        default:
          return point;
      }
    });

    return NextResponse.json({
      data: transformedData,
      count: transformedData.length,
      dataType
    });

  } catch (error) {
    console.error('Error transforming data:', error);
    return NextResponse.json(
      { error: 'Failed to transform data' },
      { status: 500 }
    );
  }
}
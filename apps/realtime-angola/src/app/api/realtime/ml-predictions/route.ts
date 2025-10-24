import { NextResponse } from 'next/server';

const API_BASE = 'https://bgapp-api-worker.majearcasa.workers.dev';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Build query parameters
    const params = new URLSearchParams({
      type: 'ml_predictions',
      limit: searchParams.get('limit') || '1000'
    });

    // Add optional geographic bounds if provided
    if (searchParams.get('minLat')) params.append('minLat', searchParams.get('minLat')!);
    if (searchParams.get('maxLat')) params.append('maxLat', searchParams.get('maxLat')!);
    if (searchParams.get('minLon')) params.append('minLon', searchParams.get('minLon')!);
    if (searchParams.get('maxLon')) params.append('maxLon', searchParams.get('maxLon')!);

    // Optional: filter by prediction type
    if (searchParams.get('prediction_type')) {
      params.append('prediction_type', searchParams.get('prediction_type')!);
    }

    const url = `${API_BASE}/api/oceanographic?${params}`;

    console.log('[ML Predictions API] Fetching from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: {
        revalidate: 3600, // Cache for 1 hour
        tags: ['ml-predictions']
      }
    });

    if (!response.ok) {
      console.error('[ML Predictions API] Error:', response.status, response.statusText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Extract ML predictions data
    const mlPredictions = data.ml_predictions || [];

    console.log(`[ML Predictions API] Retrieved ${mlPredictions.length} predictions`);

    // Transform data to match frontend expectations
    const transformedData = mlPredictions.map((record: any) => ({
      lat: record.latitude,
      lon: record.longitude,
      prediction_type: record.prediction_type,
      confidence: record.confidence,
      model_name: record.model_name,
      prediction_value: record.prediction_value,
      timestamp: record.timestamp
    }));

    return NextResponse.json({
      data: transformedData,
      metadata: {
        count: transformedData.length,
        timestamp: new Date().toISOString(),
        source: 'bgapp-api-worker'
      }
    });

  } catch (error) {
    console.error('[ML Predictions API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch ML predictions data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { fetchOceanographicDataWithRetry } from '@/services/oceanographicDataService';
import {
  transformSSTData,
  transformChlorophyllData,
  transformSalinityData,
  transformVesselLightsData,
  transformMLPredictionData,
  filterByQuality,
  filterByRecency,
  calculateStatistics
} from '@/services/dataTransformers';

// Commented out for production build with output: 'export'
// export const dynamic = 'force-dynamic';

// TypeScript interfaces for better type safety
interface TemperaturePoint {
  lat: number;
  lon: number;
  temperature: number;
}


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const layer = searchParams.get('layer') || 'all';

    // Fetch real SST data from bgapp-api-worker
    if (layer === 'temperature' || layer === 'all') {
      try {
        const apiData = await fetchOceanographicDataWithRetry({
          type: 'sst',
          limit: 5000,
          minLat: -18.02,
          maxLat: -5.55,
          minLon: 8.9,
          maxLon: 13.35
        });

        const temperatureData = transformSSTData(apiData.sst);
        const stats = calculateStatistics(temperatureData);

        // Convert to backward-compatible format {lat, lon, temperature}
        const formattedData = temperatureData.map(point => ({
          lat: point.lat,
          lon: point.lon,
          temperature: point.value
        }));

        return NextResponse.json({
          temperature: formattedData,
          metadata: {
            minTemp: stats.min,
            maxTemp: stats.max,
            avgTemp: stats.mean,
            dataPoints: stats.count,
            coverage: 'Angola EEZ',
            lastUpdate: apiData.metadata.timestamp,
            source: 'bgapp-api-worker'
          },
          timestamp: new Date().toISOString(),
          layer
        });
      } catch (error) {
        console.error('Failed to fetch SST data:', error);
        return NextResponse.json({
          temperature: [],
          metadata: {
            error: 'API temporarily unavailable',
            dataPoints: 0
          },
          timestamp: new Date().toISOString(),
          layer
        });
      }
    }

    // Fetch real chlorophyll data from bgapp-api-worker
    if (layer === 'chloropleth' || layer === 'chlorophyll') {
      try {
        const apiData = await fetchOceanographicDataWithRetry({
          type: 'ocean_color',
          limit: 5000,
          minLat: -18.02,
          maxLat: -5.55,
          minLon: 8.9,
          maxLon: 13.35
        });

        const chlorophyllData = transformChlorophyllData(apiData.ocean_color);
        const stats = calculateStatistics(chlorophyllData);

        return NextResponse.json({
          chloropleth: chlorophyllData,
          metadata: {
            min: stats.min,
            max: stats.max,
            mean: stats.mean,
            dataPoints: stats.count,
            coverage: 'Angola EEZ',
            lastUpdate: apiData.metadata.timestamp,
            source: 'bgapp-api-worker'
          },
          timestamp: new Date().toISOString(),
          layer
        });
      } catch (error) {
        console.error('Failed to fetch chlorophyll data:', error);
        return NextResponse.json({
          chloropleth: [],
          metadata: {
            error: 'API temporarily unavailable',
            dataPoints: 0
          },
          timestamp: new Date().toISOString(),
          layer
        });
      }
    }

    // Return all real-time data
    return NextResponse.json({
      status: 'active',
      timestamp: new Date().toISOString(),
      layers: {
        temperature: true,
        chlorophyll: true,
        vessels: true,
        wind: false,
        waves: true
      },
      stats: {
        vesselsActive: 8,
        dataPoints: 256,
        lastUpdate: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching realtime data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch realtime data' },
      { status: 500 }
    );
  }
}

// Helper function to check if point is within Angola EEZ
function isPointInAngolaEEZ(lat: number, lon: number): boolean {
  // Angola EEZ bounds (simplified rectangle for performance) - not used in this function but kept for reference
  // const angolaEEZ = [
  //   [-18.02, 13.35],
  //   [-5.55, 12.2],
  //   [-5.55, 8.9],
  //   [-18.02, 10.05],
  //   [-18.02, 13.35]
  // ];

  // Simple point-in-polygon check for the rectangular EEZ
  return lat >= -18.02 && lat <= -5.55 && lon >= 8.9 && lon <= 13.35;
}

// Interpolation function for smoother temperature gradients
function addInterpolatedPoints(data: TemperaturePoint[]): TemperaturePoint[] {
  const interpolated: TemperaturePoint[] = [];

  if (data.length < 4) return interpolated;

  // Add interpolated points between existing data points
  for (let i = 0; i < data.length; i++) {
    const current = data[i];

    // Find nearby points for interpolation
    const neighbors = data.filter(point => {
      const dist = Math.sqrt(
        Math.pow(point.lat - current.lat, 2) +
        Math.pow(point.lon - current.lon, 2)
      );
      return dist > 0 && dist < 0.15; // Within ~17km
    });

    if (neighbors.length >= 3) {
      // Create interpolated points around the current point
      const offsets = [
        { dlat: 0.025, dlon: 0 },
        { dlat: -0.025, dlon: 0 },
        { dlat: 0, dlon: 0.025 },
        { dlat: 0, dlon: -0.025 }
      ];

      offsets.forEach(offset => {
        const newLat = current.lat + offset.dlat;
        const newLon = current.lon + offset.dlon;

        if (isPointInAngolaEEZ(newLat, newLon)) {
          // Inverse distance weighted interpolation
          const interpolatedTemp = idwInterpolation(
            newLat, newLon,
            [current, ...neighbors.slice(0, 5)] // Use up to 6 points
          );

          interpolated.push({
            lat: Math.round(newLat * 100) / 100,
            lon: Math.round(newLon * 100) / 100,
            temperature: Math.round(interpolatedTemp * 100) / 100
          });
        }
      });
    }
  }

  return interpolated;
}

// Inverse Distance Weighting interpolation
function idwInterpolation(lat: number, lon: number, points: TemperaturePoint[], power: number = 2): number {
  let weightedSum = 0;
  let weightSum = 0;

  for (const point of points) {
    const distance = Math.sqrt(
      Math.pow(point.lat - lat, 2) + Math.pow(point.lon - lon, 2)
    );

    if (distance === 0) {
      return point.temperature; // Exact match
    }

    const weight = 1 / Math.pow(distance, power);
    weightedSum += weight * point.temperature;
    weightSum += weight;
  }

  return weightSum > 0 ? weightedSum / weightSum : 24; // Fallback to 24°C
}
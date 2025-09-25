import { NextRequest, NextResponse } from 'next/server';

// Export dynamic for Next.js static generation
export const dynamic = 'force-dynamic';

// TypeScript interfaces for better type safety
interface TemperaturePoint {
  lat: number;
  lon: number;
  temperature: number;
}

interface ChlorophyllPoint {
  lat: number;
  lon: number;
  chlorophyll: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const layer = searchParams.get('layer') || 'all';

    // Generate temperature grid data for heatmap visualization with improved interpolation
    if (layer === 'temperature' || layer === 'all') {
      const temperatureData = [];
      const latStep = 0.05; // Higher resolution for smoother gradients
      const lonStep = 0.05;

      // Angola EEZ boundaries for clipping
      const angolaEEZ = {
        minLat: -18.02,
        maxLat: -5.55,
        minLon: 8.9,
        maxLon: 13.35
      };

      // Generate base temperature field
      for (let lat = angolaEEZ.minLat; lat <= angolaEEZ.maxLat; lat += latStep) {
        for (let lon = angolaEEZ.minLon; lon <= angolaEEZ.maxLon; lon += lonStep) {
          // Only include points within Angola EEZ
          if (isPointInAngolaEEZ(lat, lon)) {
            // Realistic temperature distribution based on oceanographic patterns
            const distanceFromCoast = Math.min(Math.abs(lon - 12.5), 2);
            const latitudeFactor = (lat + 11.5) / 12.5; // North is warmer
            const seasonalFactor = Math.sin(new Date().getMonth() / 12 * 2 * Math.PI) * 0.5; // Seasonal variation

            // Base temperature field with realistic gradients
            let baseTemp = 23 + (latitudeFactor * 4); // 23-27°C base range

            // Benguela Current influence (cooler water from south)
            const benguelaEffect = Math.max(0, 1 - (lat + 16) / 3) * 2;
            baseTemp -= benguelaEffect;

            // Coastal upwelling effect
            if (distanceFromCoast < 0.5) {
              baseTemp -= 2 * (1 - distanceFromCoast / 0.5); // Strong cooling near coast
            } else if (distanceFromCoast < 1) {
              baseTemp -= 0.8 * (1 - (distanceFromCoast - 0.5) / 0.5); // Moderate cooling
            }

            // Add realistic oceanic patterns
            const eddyEffect = Math.sin(lat * 0.5) * Math.cos(lon * 0.8) * 0.4;
            const frontalEffect = Math.sin((lat + 12) * 2) * 0.3;
            const mixingEffect = (Math.random() - 0.5) * 0.4; // Small random variation

            const temperature = Math.max(18, Math.min(30,
              baseTemp + eddyEffect + frontalEffect + seasonalFactor + mixingEffect
            ));

            temperatureData.push({
              lat: Math.round(lat * 100) / 100,
              lon: Math.round(lon * 100) / 100,
              temperature: Math.round(temperature * 100) / 100 // Round to 2 decimals
            });
          }
        }
      }

      // Add some interpolated points for smoother gradients
      const interpolatedData = addInterpolatedPoints(temperatureData);
      const finalData = [...temperatureData, ...interpolatedData];

      return NextResponse.json({
        temperature: finalData,
        metadata: {
          minTemp: Math.min(...finalData.map(d => d.temperature)),
          maxTemp: Math.max(...finalData.map(d => d.temperature)),
          avgTemp: finalData.reduce((sum, d) => sum + d.temperature, 0) / finalData.length,
          dataPoints: finalData.length,
          resolution: `${latStep}° x ${lonStep}°`,
          coverage: 'Angola EEZ',
          lastUpdate: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        layer
      });
    }

    // Generate chlorophyll data using scientific patterns
    if (layer === 'chloropleth' || layer === 'chlorophyll') {
      const { generateChlorophyllGrid } = await import('@/services/chlorophyllService');

      // Angola EEZ bounds
      const bounds = {
        minLat: -18.02,
        maxLat: -5.55,
        minLon: 8.9,
        maxLon: 13.35
      };

      // Generate high-resolution chlorophyll data
      const { data, metadata } = generateChlorophyllGrid(bounds, 0.1); // 0.1° resolution

      return NextResponse.json({
        chloropleth: data,
        metadata,
        timestamp: new Date().toISOString(),
        layer
      });
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
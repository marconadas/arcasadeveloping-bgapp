import { NextRequest, NextResponse } from 'next/server';

// NASA VIIRS Vessel Lights Detection API route
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const minRadiance = parseFloat(searchParams.get('minRadiance') || '0.5');
    const cluster = searchParams.get('cluster') === 'true';

    // Use production NASA Earthdata proxy worker
    const nasaProxyUrl = process.env.NASA_PROXY_URL || 'https://nasa-earthdata-proxy.majearcasa.workers.dev';

    // Build query parameters
    const params = new URLSearchParams({
      date,
      minRadiance: minRadiance.toString()
    });

    // Call NASA proxy worker
    const response = await fetch(`${nasaProxyUrl}/nasa/vessel-lights?${params}`, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'max-age=3600' // Cache for 1 hour
      }
    });

    if (!response.ok) {
      // Handle 429 rate limit specifically with mock data
      if (response.status === 429) {
        console.log('[NASA Vessel Lights API] Rate limited - returning mock data');
        const fallbackVessels = generateFallbackVesselLights();
        return NextResponse.json({
          vessels: fallbackVessels,
          clusters: [],
          metadata: {
            source: 'mock_data',
            reason: 'rate_limited',
            message: 'Rate limit exceeded - using simulated data',
            timestamp: new Date().toISOString(),
            totalDetections: fallbackVessels.length,
            clustered: false,
            dateRange: {
              start: date,
              end: date
            }
          },
          visualization: {
            type: 'points',
            icon: 'vessel',
            sizeScale: [5, 20],
            colorScale: 'heat',
            opacity: 0.9,
            radiusMinPixels: 3,
            radiusMaxPixels: 15
          },
          angola_eez: {
            filtered: true,
            bounds: {
              north: -4.376,
              south: -18.042,
              east: 13.377,
              west: 11.679
            }
          },
          statistics: calculateVesselStatistics(fallbackVessels)
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

    // Cluster vessel detections if requested
    let processedData = data.vessels || [];
    if (cluster && processedData.length > 0) {
      processedData = clusterVessels(processedData);
    }

    // Classify vessel types based on radiance patterns
    processedData = processedData.map((vessel: any) => ({
      ...vessel,
      vesselType: classifyVesselType(vessel),
      riskLevel: assessRiskLevel(vessel)
    }));

    // Process and enhance data for visualization
    const enhancedData = {
      vessels: processedData,
      clusters: cluster ? identifyClusters(processedData) : [],
      metadata: {
        ...data.metadata,
        totalDetections: processedData.length,
        clustered: cluster,
        dateRange: {
          start: date,
          end: date
        }
      },
      visualization: {
        type: 'points',
        icon: 'vessel',
        sizeScale: [5, 20],
        colorScale: 'heat',
        opacity: 0.9,
        radiusMinPixels: 3,
        radiusMaxPixels: 15
      },
      angola_eez: {
        filtered: true,
        bounds: {
          north: -4.376,
          south: -18.042,
          east: 13.377,
          west: 11.679
        }
      },
      statistics: calculateVesselStatistics(processedData)
    };

    return NextResponse.json(enhancedData, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });

  } catch (error) {
    console.error('Error fetching NASA vessel lights data:', error);

    // Return fallback data for development/demo
    return NextResponse.json({
      vessels: generateFallbackVesselLights(),
      metadata: {
        source: 'fallback',
        message: 'Using simulated data due to API error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Cluster nearby vessel detections
function clusterVessels(vessels: any[], clusterRadius = 0.1) {
  const clustered = [];
  const processed = new Set();

  for (let i = 0; i < vessels.length; i++) {
    if (processed.has(i)) continue;

    const cluster = [vessels[i]];
    processed.add(i);

    for (let j = i + 1; j < vessels.length; j++) {
      if (processed.has(j)) continue;

      const dist = calculateDistance(
        vessels[i].lat, vessels[i].lon,
        vessels[j].lat, vessels[j].lon
      );

      if (dist < clusterRadius) {
        cluster.push(vessels[j]);
        processed.add(j);
      }
    }

    // Create cluster center or keep individual vessels
    if (cluster.length > 1) {
      const avgLat = cluster.reduce((sum, v) => sum + v.lat, 0) / cluster.length;
      const avgLon = cluster.reduce((sum, v) => sum + v.lon, 0) / cluster.length;
      const totalRadiance = cluster.reduce((sum, v) => sum + v.radiance, 0);

      clustered.push({
        lat: avgLat,
        lon: avgLon,
        radiance: totalRadiance,
        vesselCount: cluster.length,
        clustered: true,
        vessels: cluster
      });
    } else {
      clustered.push({
        ...cluster[0],
        vesselCount: 1,
        clustered: false
      });
    }
  }

  return clustered;
}

// Identify fishing fleet clusters
function identifyClusters(vessels: any[]) {
  const clusters = [];

  vessels.filter(v => v.clustered && v.vesselCount > 3).forEach(cluster => {
    clusters.push({
      center: { lat: cluster.lat, lon: cluster.lon },
      vesselCount: cluster.vesselCount,
      totalRadiance: cluster.radiance,
      type: cluster.vesselCount > 10 ? 'large_fleet' : 'small_fleet',
      risk: cluster.vesselCount > 15 ? 'high' : 'medium'
    });
  });

  return clusters;
}

// Classify vessel type based on radiance signature
function classifyVesselType(vessel: any) {
  const { radiance, time } = vessel;

  // Simple classification based on radiance levels
  if (radiance > 100) {
    return 'industrial_fishing';
  } else if (radiance > 50) {
    return 'commercial_fishing';
  } else if (radiance > 20) {
    return 'small_commercial';
  } else if (radiance > 5) {
    return 'artisanal';
  }
  return 'unknown';
}

// Assess risk level based on various factors
function assessRiskLevel(vessel: any) {
  let riskScore = 0;

  // High radiance at night
  if (vessel.radiance > 100) riskScore += 3;
  else if (vessel.radiance > 50) riskScore += 2;
  else if (vessel.radiance > 20) riskScore += 1;

  // Location-based risk (near protected areas, etc.)
  if (vessel.lat < -15 && vessel.lon < 11) {
    riskScore += 1; // Southern protected zone
  }

  // Time-based risk (illegal fishing hours)
  const hour = new Date(vessel.detectionTime || '').getHours();
  if (hour >= 22 || hour <= 4) {
    riskScore += 1;
  }

  if (riskScore >= 4) return 'high';
  if (riskScore >= 2) return 'medium';
  return 'low';
}

// Calculate distance between two points (in degrees, approximate)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2));
}

// Calculate vessel activity statistics
function calculateVesselStatistics(vessels: any[]) {
  if (!vessels || vessels.length === 0) {
    return {
      total: 0,
      byType: {},
      byRisk: {},
      avgRadiance: 0
    };
  }

  const stats = {
    total: vessels.length,
    byType: {} as Record<string, number>,
    byRisk: {} as Record<string, number>,
    avgRadiance: 0,
    hotspots: [] as any[]
  };

  let totalRadiance = 0;

  vessels.forEach(vessel => {
    // Count by type
    const type = vessel.vesselType || 'unknown';
    stats.byType[type] = (stats.byType[type] || 0) + (vessel.vesselCount || 1);

    // Count by risk
    const risk = vessel.riskLevel || 'low';
    stats.byRisk[risk] = (stats.byRisk[risk] || 0) + (vessel.vesselCount || 1);

    totalRadiance += vessel.radiance || 0;
  });

  stats.avgRadiance = totalRadiance / vessels.length;

  // Identify hotspots (areas with high vessel concentration)
  const gridSize = 0.5; // degrees
  const grid: Record<string, any> = {};

  vessels.forEach(vessel => {
    const gridKey = `${Math.floor(vessel.lat / gridSize)},${Math.floor(vessel.lon / gridSize)}`;
    if (!grid[gridKey]) {
      grid[gridKey] = {
        lat: Math.floor(vessel.lat / gridSize) * gridSize + gridSize / 2,
        lon: Math.floor(vessel.lon / gridSize) * gridSize + gridSize / 2,
        count: 0,
        totalRadiance: 0
      };
    }
    grid[gridKey].count += vessel.vesselCount || 1;
    grid[gridKey].totalRadiance += vessel.radiance || 0;
  });

  stats.hotspots = Object.values(grid)
    .filter(cell => cell.count > 3)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return stats;
}

// Generate fallback vessel lights data
function generateFallbackVesselLights() {
  const vessels = [];
  const numVessels = 15 + Math.floor(Math.random() * 20);

  // Angola EEZ boundaries
  const bounds = {
    minLat: -18.02,
    maxLat: -5.55,
    minLon: 8.9,
    maxLon: 13.35
  };

  // Common fishing grounds
  const fishingGrounds = [
    { lat: -8.5, lon: 12.0, radius: 1 },   // Northern grounds
    { lat: -12.0, lon: 11.5, radius: 1.5 }, // Central grounds
    { lat: -15.5, lon: 11.0, radius: 1 },   // Southern grounds
  ];

  for (let i = 0; i < numVessels; i++) {
    // 70% chance to be in a fishing ground
    let lat, lon;
    if (Math.random() < 0.7 && fishingGrounds.length > 0) {
      const ground = fishingGrounds[Math.floor(Math.random() * fishingGrounds.length)];
      const angle = Math.random() * 2 * Math.PI;
      const r = Math.random() * ground.radius;
      lat = ground.lat + r * Math.sin(angle);
      lon = ground.lon + r * Math.cos(angle);
    } else {
      // Random position in EEZ
      lat = bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat);
      lon = bounds.minLon + Math.random() * (bounds.maxLon - bounds.minLon);
    }

    // Radiance based on vessel type distribution
    let radiance;
    const typeRand = Math.random();
    if (typeRand < 0.1) {
      radiance = 100 + Math.random() * 50; // Industrial
    } else if (typeRand < 0.3) {
      radiance = 50 + Math.random() * 50; // Commercial
    } else if (typeRand < 0.6) {
      radiance = 20 + Math.random() * 30; // Small commercial
    } else {
      radiance = 5 + Math.random() * 15; // Artisanal
    }

    vessels.push({
      id: `vessel_${i}`,
      lat: Math.round(lat * 1000) / 1000,
      lon: Math.round(lon * 1000) / 1000,
      radiance: Math.round(radiance * 10) / 10,
      confidence: 0.5 + Math.random() * 0.5,
      detectionTime: new Date().toISOString()
    });
  }

  return vessels;
}

export async function POST(request: NextRequest) {
  // Handle vessel detection alerts or batch processing
  try {
    const body = await request.json();

    // Validate the incoming data
    if (!body.detections || !Array.isArray(body.detections)) {
      return NextResponse.json(
        { error: 'Invalid detections data' },
        { status: 400 }
      );
    }

    // Process vessel detections
    const statistics = calculateVesselStatistics(body.detections);

    // Check for anomalies or high-risk activities
    const alerts = [];
    if (statistics.byRisk.high > 5) {
      alerts.push({
        type: 'high_risk_concentration',
        message: `${statistics.byRisk.high} high-risk vessels detected`,
        severity: 'high'
      });
    }

    statistics.hotspots.forEach(hotspot => {
      if (hotspot.count > 10) {
        alerts.push({
          type: 'vessel_concentration',
          location: { lat: hotspot.lat, lon: hotspot.lon },
          message: `High vessel concentration: ${hotspot.count} vessels`,
          severity: 'medium'
        });
      }
    });

    return NextResponse.json({
      success: true,
      detectionsProcessed: body.detections.length,
      statistics,
      alerts,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing vessel detections:', error);
    return NextResponse.json(
      { error: 'Failed to process detections' },
      { status: 500 }
    );
  }
}
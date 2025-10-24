/**
 * BGAPP Enhanced API Endpoints
 * REST API endpoints using the enhanced database schema
 */

import * as db from './db-service.js';

/**
 * Environmental Data Endpoints
 */

// GET /api/environmental/sst - Get Sea Surface Temperature data
export async function handleGetSST(request, env) {
  const url = new URL(request.url);
  const params = {
    bbox: url.searchParams.get('bbox'),
    start_time: url.searchParams.get('start_time'),
    end_time: url.searchParams.get('end_time'),
    limit: parseInt(url.searchParams.get('limit') || '1000')
  };

  const data = await db.getSSTData(env, params);

  return new Response(JSON.stringify({
    success: true,
    count: data.length,
    data
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// POST /api/environmental/sst - Insert SST data
export async function handleInsertSST(request, env) {
  const data = await request.json();
  const result = await db.insertSSTData(env, data);

  await db.updateDataFreshness(env, 'sst', data.data_source || 'copernicus', 1, data.bbox);

  return new Response(JSON.stringify(result), {
    status: result.success ? 201 : 400,
    headers: { 'Content-Type': 'application/json' }
  });
}

// GET /api/environmental/ocean-color - Get ocean color/chlorophyll data
export async function handleGetOceanColor(request, env) {
  const url = new URL(request.url);
  const params = {
    bbox: url.searchParams.get('bbox'),
    start_time: url.searchParams.get('start_time'),
    end_time: url.searchParams.get('end_time'),
    limit: parseInt(url.searchParams.get('limit') || '1000')
  };

  const data = await db.getOceanColorData(env, params);

  return new Response(JSON.stringify({
    success: true,
    count: data.length,
    data
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// POST /api/environmental/ocean-color - Insert ocean color data
export async function handleInsertOceanColor(request, env) {
  const data = await request.json();
  const result = await db.insertOceanColorData(env, data);

  await db.updateDataFreshness(env, 'ocean_color', data.data_source || 'copernicus', 1, data.bbox);

  return new Response(JSON.stringify(result), {
    status: result.success ? 201 : 400,
    headers: { 'Content-Type': 'application/json' }
  });
}

// POST /api/environmental/salinity - Insert salinity data
export async function handleInsertSalinity(request, env) {
  const data = await request.json();
  const result = await db.insertSalinityData(env, data);

  await db.updateDataFreshness(env, 'salinity', data.data_source || 'copernicus', 1, data.bbox);

  return new Response(JSON.stringify(result), {
    status: result.success ? 201 : 400,
    headers: { 'Content-Type': 'application/json' }
  });
}

// POST /api/environmental/current - Insert current data
export async function handleInsertCurrent(request, env) {
  const data = await request.json();
  const result = await db.insertCurrentData(env, data);

  await db.updateDataFreshness(env, 'current', data.data_source || 'copernicus', 1);

  return new Response(JSON.stringify(result), {
    status: result.success ? 201 : 400,
    headers: { 'Content-Type': 'application/json' }
  });
}

// POST /api/environmental/wave - Insert wave data
export async function handleInsertWave(request, env) {
  const data = await request.json();
  const result = await db.insertWaveData(env, data);

  await db.updateDataFreshness(env, 'wave', data.data_source || 'copernicus', 1);

  return new Response(JSON.stringify(result), {
    status: result.success ? 201 : 400,
    headers: { 'Content-Type': 'application/json' }
  });
}

// GET /api/environmental/latest - Get latest environmental conditions (uses view)
export async function handleGetLatestEnvironmental(request, env) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '1000');

  const data = await db.getLatestEnvironmentalConditions(env, limit);

  return new Response(JSON.stringify({
    success: true,
    count: data.length,
    data
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Vessel Tracking Endpoints (GFW)
 */

// GET /api/vessels - Get vessel tracking data
export async function handleGetVessels(request, env) {
  const url = new URL(request.url);
  const params = {
    vessel_id: url.searchParams.get('vessel_id'),
    vessel_type: url.searchParams.get('vessel_type'),
    in_eez: url.searchParams.get('in_eez'),
    start_time: url.searchParams.get('start_time'),
    end_time: url.searchParams.get('end_time'),
    limit: parseInt(url.searchParams.get('limit') || '1000')
  };

  const data = await db.getVesselData(env, params);

  return new Response(JSON.stringify({
    success: true,
    count: data.length,
    data
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// POST /api/vessels - Insert vessel data
export async function handleInsertVessel(request, env) {
  const data = await request.json();
  const result = await db.insertVesselData(env, data);

  await db.updateDataFreshness(env, 'vessel', data.data_source || 'gfw', 1);

  return new Response(JSON.stringify(result), {
    status: result.success ? 201 : 400,
    headers: { 'Content-Type': 'application/json' }
  });
}

// POST /api/vessels/bulk - Bulk insert vessel data
export async function handleBulkInsertVessels(request, env) {
  const dataArray = await request.json();

  if (!Array.isArray(dataArray)) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Expected array of vessel data'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const results = await db.bulkInsertVesselData(env, dataArray);

  await db.updateDataFreshness(env, 'vessel', 'gfw', results.success);

  return new Response(JSON.stringify({
    success: true,
    results
  }), {
    status: results.failed > 0 ? 207 : 201,
    headers: { 'Content-Type': 'application/json' }
  });
}

// GET /api/vessels/activity - Get recent vessel activity (uses view)
export async function handleGetVesselActivity(request, env) {
  const data = await db.getRecentVesselActivity(env);

  return new Response(JSON.stringify({
    success: true,
    count: data.length,
    data
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// GET /api/vessels/presence - Get vessel presence/heatmap data
export async function handleGetVesselPresence(request, env) {
  const url = new URL(request.url);
  const params = {
    time_period: url.searchParams.get('time_period') || 'day',
    start_time: url.searchParams.get('start_time'),
    end_time: url.searchParams.get('end_time'),
    limit: parseInt(url.searchParams.get('limit') || '10000')
  };

  const data = await db.getVesselPresence(env, params);

  return new Response(JSON.stringify({
    success: true,
    count: data.length,
    data
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// POST /api/vessels/presence - Insert vessel presence data
export async function handleInsertVesselPresence(request, env) {
  const data = await request.json();
  const result = await db.insertVesselPresence(env, data);

  return new Response(JSON.stringify(result), {
    status: result.success ? 201 : 400,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Fishing Events Endpoints
 */

// GET /api/fishing/events - Get fishing events
export async function handleGetFishingEvents(request, env) {
  const url = new URL(request.url);
  const params = {
    vessel_id: url.searchParams.get('vessel_id'),
    event_type: url.searchParams.get('event_type'),
    in_eez: url.searchParams.get('in_eez'),
    start_time: url.searchParams.get('start_time'),
    end_time: url.searchParams.get('end_time'),
    limit: parseInt(url.searchParams.get('limit') || '1000')
  };

  const data = await db.getFishingEvents(env, params);

  return new Response(JSON.stringify({
    success: true,
    count: data.length,
    data
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// POST /api/fishing/events - Insert fishing event
export async function handleInsertFishingEvent(request, env) {
  const data = await request.json();
  const result = await db.insertFishingEvent(env, data);

  return new Response(JSON.stringify(result), {
    status: result.success ? 201 : 400,
    headers: { 'Content-Type': 'application/json' }
  });
}

// GET /api/fishing/hotspots - Get fishing hotspots (uses view)
export async function handleGetFishingHotspots(request, env) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '100');

  const data = await db.getFishingHotspots(env, limit);

  return new Response(JSON.stringify({
    success: true,
    count: data.length,
    data
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * NASA Data Endpoints
 */

// POST /api/nasa/vessel-lights - Insert NASA vessel lights data
export async function handleInsertVesselLights(request, env) {
  const data = await request.json();
  const result = await db.insertVesselLightsData(env, data);

  await db.updateDataFreshness(env, 'vessel_lights', 'nasa', 1, data.bbox);

  return new Response(JSON.stringify(result), {
    status: result.success ? 201 : 400,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Monitoring & Metrics Endpoints
 */

// GET /api/metrics - Get API metrics
export async function handleGetMetrics(request, env) {
  const url = new URL(request.url);
  const params = {
    endpoint: url.searchParams.get('endpoint'),
    data_source: url.searchParams.get('data_source'),
    start_time: url.searchParams.get('start_time'),
    end_time: url.searchParams.get('end_time'),
    limit: parseInt(url.searchParams.get('limit') || '1000')
  };

  const data = await db.getAPIMetrics(env, params);

  // Calculate statistics
  const stats = {
    total_requests: data.length,
    avg_response_time: data.reduce((sum, m) => sum + m.response_time, 0) / data.length || 0,
    success_rate: data.filter(m => m.status_code < 400).length / data.length || 0,
    error_count: data.filter(m => m.status_code >= 400).length
  };

  return new Response(JSON.stringify({
    success: true,
    stats,
    data
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// GET /api/data-freshness - Get data freshness status
export async function handleGetDataFreshness(request, env) {
  const url = new URL(request.url);
  const data_type = url.searchParams.get('data_type');
  const data_source = url.searchParams.get('data_source');

  const data = await db.getDataFreshness(env, data_type, data_source);

  return new Response(JSON.stringify({
    success: true,
    count: data.length,
    data
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Maintenance Endpoints
 */

// POST /api/maintenance/cleanup - Cleanup expired data
export async function handleCleanupExpiredData(request, env) {
  const results = await db.cleanupExpiredData(env);

  return new Response(JSON.stringify({
    success: true,
    results
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Batch Processing Endpoints
 */

// POST /api/batch/copernicus - Process batch Copernicus data
export async function handleBatchCopernicus(request, env) {
  const { sst, ocean_color, salinity } = await request.json();
  const results = {
    sst: { success: 0, failed: 0 },
    ocean_color: { success: 0, failed: 0 },
    salinity: { success: 0, failed: 0 }
  };

  // Process SST data
  if (sst && Array.isArray(sst)) {
    const sstResults = await db.bulkInsertSSTData(env, sst);
    results.sst = { success: sstResults.success, failed: sstResults.failed };
    await db.updateDataFreshness(env, 'sst', 'copernicus', sstResults.success);
  }

  // Process ocean color data
  if (ocean_color && Array.isArray(ocean_color)) {
    for (const data of ocean_color) {
      const result = await db.insertOceanColorData(env, data);
      if (result.success) results.ocean_color.success++;
      else results.ocean_color.failed++;
    }
    await db.updateDataFreshness(env, 'ocean_color', 'copernicus', results.ocean_color.success);
  }

  // Process salinity data
  if (salinity && Array.isArray(salinity)) {
    for (const data of salinity) {
      const result = await db.insertSalinityData(env, data);
      if (result.success) results.salinity.success++;
      else results.salinity.failed++;
    }
    await db.updateDataFreshness(env, 'salinity', 'copernicus', results.salinity.success);
  }

  return new Response(JSON.stringify({
    success: true,
    results
  }), {
    status: 207,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Route handler for enhanced API
 */
export async function handleEnhancedAPIRoute(request, env, pathname, method) {
  const startTime = Date.now();
  let response;

  try {
    // Environmental Data Routes
    if (pathname === '/api/environmental/sst' && method === 'GET') {
      response = await handleGetSST(request, env);
    } else if (pathname === '/api/environmental/sst' && method === 'POST') {
      response = await handleInsertSST(request, env);
    } else if (pathname === '/api/environmental/ocean-color' && method === 'GET') {
      response = await handleGetOceanColor(request, env);
    } else if (pathname === '/api/environmental/ocean-color' && method === 'POST') {
      response = await handleInsertOceanColor(request, env);
    } else if (pathname === '/api/environmental/salinity' && method === 'POST') {
      response = await handleInsertSalinity(request, env);
    } else if (pathname === '/api/environmental/current' && method === 'POST') {
      response = await handleInsertCurrent(request, env);
    } else if (pathname === '/api/environmental/wave' && method === 'POST') {
      response = await handleInsertWave(request, env);
    } else if (pathname === '/api/environmental/latest' && method === 'GET') {
      response = await handleGetLatestEnvironmental(request, env);
    }

    // Vessel Tracking Routes
    else if (pathname === '/api/vessels' && method === 'GET') {
      response = await handleGetVessels(request, env);
    } else if (pathname === '/api/vessels' && method === 'POST') {
      response = await handleInsertVessel(request, env);
    } else if (pathname === '/api/vessels/bulk' && method === 'POST') {
      response = await handleBulkInsertVessels(request, env);
    } else if (pathname === '/api/vessels/activity' && method === 'GET') {
      response = await handleGetVesselActivity(request, env);
    } else if (pathname === '/api/vessels/presence' && method === 'GET') {
      response = await handleGetVesselPresence(request, env);
    } else if (pathname === '/api/vessels/presence' && method === 'POST') {
      response = await handleInsertVesselPresence(request, env);
    }

    // Fishing Events Routes
    else if (pathname === '/api/fishing/events' && method === 'GET') {
      response = await handleGetFishingEvents(request, env);
    } else if (pathname === '/api/fishing/events' && method === 'POST') {
      response = await handleInsertFishingEvent(request, env);
    } else if (pathname === '/api/fishing/hotspots' && method === 'GET') {
      response = await handleGetFishingHotspots(request, env);
    }

    // NASA Data Routes
    else if (pathname === '/api/nasa/vessel-lights' && method === 'POST') {
      response = await handleInsertVesselLights(request, env);
    }

    // Monitoring Routes
    else if (pathname === '/api/metrics' && method === 'GET') {
      response = await handleGetMetrics(request, env);
    } else if (pathname === '/api/data-freshness' && method === 'GET') {
      response = await handleGetDataFreshness(request, env);
    }

    // Maintenance Routes
    else if (pathname === '/api/maintenance/cleanup' && method === 'POST') {
      response = await handleCleanupExpiredData(request, env);
    }

    // Batch Processing Routes
    else if (pathname === '/api/batch/copernicus' && method === 'POST') {
      response = await handleBatchCopernicus(request, env);
    }

    else {
      return null; // Route not found - let main handler deal with it
    }

    // Log API metric
    const responseTime = Date.now() - startTime;
    const status = response.status || 200;

    await db.logAPIMetric(env, {
      endpoint: pathname,
      http_method: method,
      response_time: responseTime,
      status_code: status,
      data_source: pathname.includes('copernicus') ? 'copernicus' : pathname.includes('gfw') || pathname.includes('vessel') ? 'gfw' : pathname.includes('nasa') ? 'nasa' : null
    });

    return response;
  } catch (error) {
    console.error('Error handling enhanced API route:', error);

    // Log error metric
    const responseTime = Date.now() - startTime;
    await db.logAPIMetric(env, {
      endpoint: pathname,
      http_method: method,
      response_time: responseTime,
      status_code: 500,
      error_message: error.message
    });

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
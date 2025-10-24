/**
 * NASA Data Population Worker (v3 - High Density & Quality)
 * Populates D1 tables with high-density NASA oceanographic data via proxy
 * Target: 2000+ points per dataset with quality filtering
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Main populate endpoint
    if (url.pathname === '/populate' && request.method === 'POST') {
      return handlePopulation(request, env, ctx);
    }

    // Status endpoint
    if (url.pathname === '/status' && request.method === 'GET') {
      return handleStatus(env);
    }

    // Clear old data endpoint
    if (url.pathname === '/clear-old' && request.method === 'POST') {
      return handleClearOldData(env);
    }

    return new Response('NASA Data Populator (v3 High Density). POST to /populate to start.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};

/**
 * Main population handler
 */
async function handlePopulation(request, env, ctx) {
  const startTime = Date.now();
  const results = {
    started: new Date().toISOString(),
    tables_populated: [],
    errors: [],
    summary: {}
  };

  try {
    const options = await request.json().catch(() => ({}));
    const { dataTypes = 'all' } = options;

    console.log('🚀 Starting NASA data population');
    console.log('Data types:', dataTypes);

    // Angola EEZ bounding box
    const angolaBbox = {
      minLat: -18.02,
      maxLat: -5.55,
      minLon: 8.9,
      maxLon: 13.35
    };

    // Populate NASA datasets sequentially
    if (dataTypes === 'all' || dataTypes.includes('nasa_ocean_color')) {
      try {
        console.log('📡 Fetching NASA Ocean Color data...');
        const result = await populateNASAOceanColorData(env, angolaBbox);
        results.tables_populated.push('ocean_color_data (NASA)');
        results.summary.nasa_ocean_color = result;
      } catch (err) {
        results.errors.push({ table: 'ocean_color_data (NASA)', error: err.message });
      }
    }

    if (dataTypes === 'all' || dataTypes.includes('nasa_sst')) {
      try {
        console.log('📡 Fetching NASA SST data...');
        const result = await populateNASASSTData(env, angolaBbox);
        results.tables_populated.push('sst_data (NASA)');
        results.summary.nasa_sst = result;
      } catch (err) {
        results.errors.push({ table: 'sst_data (NASA)', error: err.message });
      }
    }

    if (dataTypes === 'all' || dataTypes.includes('nasa_vessel_lights')) {
      try {
        console.log('📡 Fetching NASA Vessel Lights data...');
        const result = await populateNASAVesselLightsData(env, angolaBbox);
        results.tables_populated.push('vessel_lights_data');
        results.summary.nasa_vessel_lights = result;
      } catch (err) {
        results.errors.push({ table: 'vessel_lights_data', error: err.message });
      }
    }

    if (dataTypes === 'all' || dataTypes.includes('nasa_salinity')) {
      try {
        console.log('📡 Fetching NASA Salinity data...');
        const result = await populateNASASalinityData(env, angolaBbox);
        results.tables_populated.push('salinity_data (NASA)');
        results.summary.nasa_salinity = result;
      } catch (err) {
        results.errors.push({ table: 'salinity_data (NASA)', error: err.message });
      }
    }

    results.completed = new Date().toISOString();
    results.duration_ms = Date.now() - startTime;
    results.success = results.errors.length === 0;

    console.log('✅ NASA data population completed');
    console.log(`Tables populated: ${results.tables_populated.length}`);
    console.log(`Errors: ${results.errors.length}`);
    console.log(`Duration: ${results.duration_ms}ms`);

    return new Response(JSON.stringify(results, null, 2), {
      status: results.success ? 200 : 207,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Population error:', error);
    results.error = error.message;
    results.completed = new Date().toISOString();

    return new Response(JSON.stringify(results, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Populate ocean_color_data with high-density NASA data
 * Target: 2000+ high-quality points
 */
async function populateNASAOceanColorData(env, bbox) {
  const result = { rows_inserted: 0, points_processed: 0, filtered_out: 0 };

  try {
    const date = new Date().toISOString().split('T')[0];
    const bboxStr = `${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}`;
    const queries = [];

    // Generate dense grid of sample points (0.05° resolution ~5.5km)
    const gridSize = 0.05;
    const gridPoints = generateGridPoints(bbox, gridSize);
    console.log(`🌐 Requesting ocean color data for ${gridPoints.length} grid points`);

    // Batch grid points to avoid timeout (max 50 points per request)
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < gridPoints.length; i += batchSize) {
      batches.push(gridPoints.slice(i, i + batchSize));
    }

    // Fetch data for each batch
    for (let b = 0; b < batches.length && queries.length < 2500; b++) {
      const batch = batches[b];
      
      // Call NASA proxy for batch
      const batchParams = batch.map(p => `${p.lat},${p.lon}`).join(';');
      const url = `/nasa/ocean-color?date=${date}&points=${encodeURIComponent(batchParams)}`;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await env.NASA_PROXY.fetch(`https://dummy${url}`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          
          if (data.points && Array.isArray(data.points)) {
            for (const point of data.points) {
              result.points_processed++;
              
              // Quality filtering: Only high-quality data
              if (point.quality_flag !== 'good' && point.quality_flag !== 1) {
                result.filtered_out++;
                continue;
              }
              
              // Value validation: Chlorophyll-a should be 0.01-100 mg/m³ for Angola
              if (!point.chlorophyll_a || point.chlorophyll_a < 0.01 || point.chlorophyll_a > 100) {
                result.filtered_out++;
                continue;
              }
              
              queries.push(
                env.DB.prepare(`
                  INSERT INTO ocean_color_data (
                    latitude, longitude, chlorophyll_a,
                    timestamp, data_source, quality_flag,
                    bbox, expires_at
                  ) VALUES (?, ?, ?, datetime('now'), 'nasa', 1, ?, datetime('now', '+24 hours'))
                `).bind(
                  point.lat,
                  point.lon,
                  point.chlorophyll_a,
                  bboxStr
                )
              );
            }
          }
        }
      } catch (batchError) {
        console.warn(`⚠️ Batch ${b + 1} failed:`, batchError.message);
      }
    }

    // Execute batch insert with chunking (SQLite has limits)
    if (queries.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < queries.length; i += chunkSize) {
        const chunk = queries.slice(i, i + chunkSize);
        await env.DB.batch(chunk);
        result.rows_inserted += chunk.length;
      }
    }

    console.log(`✅ Inserted ${result.rows_inserted} NASA ocean color records (${result.filtered_out} filtered out for quality)`);
    return result;

  } catch (error) {
    console.error('❌ Error populating NASA ocean color data:', error);
    throw error;
  }
}

/**
 * Populate sst_data with high-density NASA data
 * Target: 2000+ high-quality SST points
 */
async function populateNASASSTData(env, bbox) {
  const result = { rows_inserted: 0, points_processed: 0, filtered_out: 0 };

  try {
    const date = new Date().toISOString().split('T')[0];
    const bboxStr = `${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}`;
    const queries = [];

    // Generate dense grid of sample points (0.05° resolution ~5.5km)
    const gridSize = 0.05;
    const gridPoints = generateGridPoints(bbox, gridSize);
    console.log(`🌐 Requesting SST data for ${gridPoints.length} grid points`);

    // Batch grid points to avoid timeout (max 50 points per request)
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < gridPoints.length; i += batchSize) {
      batches.push(gridPoints.slice(i, i + batchSize));
    }

    // Fetch data for each batch
    for (let b = 0; b < batches.length && queries.length < 2500; b++) {
      const batch = batches[b];
      
      // Call NASA proxy for batch
      const batchParams = batch.map(p => `${p.lat},${p.lon}`).join(';');
      const url = `/nasa/sst?date=${date}&points=${encodeURIComponent(batchParams)}`;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await env.NASA_PROXY.fetch(`https://dummy${url}`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          
          if (data.points && Array.isArray(data.points)) {
            for (const point of data.points) {
              result.points_processed++;
              
              // Quality filtering: Only high-quality data
              if (point.quality_flag !== 'good' && point.quality_flag !== 1) {
                result.filtered_out++;
                continue;
              }
              
              // Value validation: SST should be 15-32°C for Angola waters
              if (!point.sst || point.sst < 15 || point.sst > 32) {
                result.filtered_out++;
                continue;
              }
              
              queries.push(
                env.DB.prepare(`
                  INSERT INTO sst_data (
                    latitude, longitude, temperature,
                    timestamp, data_source, quality_flag,
                    bbox, expires_at
                  ) VALUES (?, ?, ?, datetime('now'), 'nasa', 1, ?, datetime('now', '+24 hours'))
                `).bind(
                  point.lat,
                  point.lon,
                  point.sst,
                  bboxStr
                )
              );
            }
          }
        }
      } catch (batchError) {
        console.warn(`⚠️ Batch ${b + 1} failed:`, batchError.message);
      }
    }

    // Execute batch insert with chunking (SQLite has limits)
    if (queries.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < queries.length; i += chunkSize) {
        const chunk = queries.slice(i, i + chunkSize);
        await env.DB.batch(chunk);
        result.rows_inserted += chunk.length;
      }
    }

    console.log(`✅ Inserted ${result.rows_inserted} NASA SST records (${result.filtered_out} filtered out for quality)`);
    return result;

  } catch (error) {
    console.error('❌ Error populating NASA SST data:', error);
    throw error;
  }
}

/**
 * Populate vessel_lights_data with NASA data from proxy
 */
async function populateNASAVesselLightsData(env, bbox) {
  const result = { rows_inserted: 0, points_processed: 0 };

  try {
    const date = new Date().toISOString().split('T')[0];
    const queries = [];

    // Call NASA proxy ONCE with date parameter via Service Binding - returns entire Angola EEZ
    const url = `/nasa/vessel-lights?date=${date}`;
    console.log(`🌐 Calling NASA Vessel Lights proxy via Service Binding: ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await env.NASA_PROXY.fetch(`https://dummy${url}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NASA proxy error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log(`📦 Received ${data.detections?.length || 0} vessel light detections from NASA proxy`);

    if (data.detections && Array.isArray(data.detections)) {
      for (const detection of data.detections) {
        const metadata = JSON.stringify({
          dataset: data.dataset || 'VIIRS_DNB',
          date: data.date,
          source: 'NASA VIIRS'
        });

        queries.push(
          env.DB.prepare(`
            INSERT INTO vessel_lights_data (
              latitude, longitude, radiance,
              timestamp, quality_flag, potential_vessel_activity,
              metadata
            ) VALUES (?, ?, ?, datetime('now'), ?, ?, ?)
          `).bind(
            detection.lat,
            detection.lon,
            detection.radiance,
            detection.quality_flag || 0,
            detection.confidence || 0.5,
            metadata
          )
        );
        result.points_processed++;
      }
    }

    if (queries.length > 0) {
      await env.DB.batch(queries);
      result.rows_inserted = queries.length;
    }

    console.log(`✅ Inserted ${result.rows_inserted} NASA vessel lights records from ${result.points_processed} detections`);
    return result;

  } catch (error) {
    console.error('❌ Error populating NASA vessel lights data:', error);
    throw error;
  }
}

/**
 * Populate salinity_data with high-density NASA data
 * Target: 1500+ high-quality salinity points
 */
async function populateNASASalinityData(env, bbox) {
  const result = { rows_inserted: 0, points_processed: 0, filtered_out: 0 };

  try {
    const date = new Date().toISOString().split('T')[0];
    const bboxStr = `${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}`;
    const queries = [];

    // Generate dense grid of sample points (0.06° resolution for salinity - lower resolution)
    const gridSize = 0.06;
    const gridPoints = generateGridPoints(bbox, gridSize);
    console.log(`🌐 Requesting salinity data for ${gridPoints.length} grid points`);

    // Batch grid points to avoid timeout
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < gridPoints.length; i += batchSize) {
      batches.push(gridPoints.slice(i, i + batchSize));
    }

    // Fetch data for each batch
    for (let b = 0; b < batches.length && queries.length < 2000; b++) {
      const batch = batches[b];
      
      // Call NASA proxy for batch
      const batchParams = batch.map(p => `${p.lat},${p.lon}`).join(';');
      const url = `/nasa/salinity?date=${date}&points=${encodeURIComponent(batchParams)}`;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await env.NASA_PROXY.fetch(`https://dummy${url}`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          
          if (data.points && Array.isArray(data.points)) {
            for (const point of data.points) {
              result.points_processed++;
              
              // Quality filtering: Only high-quality data
              if (point.quality_flag !== 'good' && point.quality_flag !== 1) {
                result.filtered_out++;
                continue;
              }
              
              // Value validation: Salinity should be 30-37 PSU for Angola waters
              if (!point.sss || point.sss < 30 || point.sss > 37) {
                result.filtered_out++;
                continue;
              }
              
              queries.push(
                env.DB.prepare(`
                  INSERT INTO salinity_data (
                    latitude, longitude, salinity, depth,
                    timestamp, data_source, quality_flag,
                    bbox, expires_at
                  ) VALUES (?, ?, ?, 0, datetime('now'), 'nasa', 1, ?, datetime('now', '+24 hours'))
                `).bind(
                  point.lat,
                  point.lon,
                  point.sss,
                  bboxStr
                )
              );
            }
          }
        }
      } catch (batchError) {
        console.warn(`⚠️ Batch ${b + 1} failed:`, batchError.message);
      }
    }

    // Execute batch insert with chunking
    if (queries.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < queries.length; i += chunkSize) {
        const chunk = queries.slice(i, i + chunkSize);
        await env.DB.batch(chunk);
        result.rows_inserted += chunk.length;
      }
    }

    console.log(`✅ Inserted ${result.rows_inserted} NASA salinity records (${result.filtered_out} filtered out for quality)`);
    return result;

  } catch (error) {
    console.error('❌ Error populating NASA salinity data:', error);
    throw error;
  }
}

/**
 * Generate dense grid of sample points for Angola EEZ
 * @param {Object} bbox - Bounding box with minLat, maxLat, minLon, maxLon
 * @param {number} gridSize - Grid resolution in degrees (e.g., 0.05 for ~5.5km)
 * @returns {Array} Array of {lat, lon} points
 */
function generateGridPoints(bbox, gridSize = 0.05) {
  const points = [];
  
  for (let lat = bbox.minLat; lat <= bbox.maxLat; lat += gridSize) {
    for (let lon = bbox.minLon; lon <= bbox.maxLon; lon += gridSize) {
      // Round to avoid floating point issues
      points.push({
        lat: Math.round(lat * 100) / 100,
        lon: Math.round(lon * 100) / 100
      });
    }
  }
  
  return points;
}

/**
 * Clear old data from tables
 * Removes data older than specified hours
 */
async function handleClearOldData(env) {
  try {
    const hoursToKeep = 48; // Keep last 48 hours
    const results = {};

    const tables = [
      'sst_data',
      'ocean_color_data',
      'salinity_data',
      'vessel_lights_data'
    ];

    for (const table of tables) {
      const deleteQuery = `
        DELETE FROM ${table}
        WHERE timestamp < datetime('now', '-${hoursToKeep} hours')
          AND data_source = 'nasa'
      `;
      
      const result = await env.DB.prepare(deleteQuery).run();
      results[table] = {
        deleted: result.changes || 0
      };
    }

    return new Response(JSON.stringify({
      message: `Cleared data older than ${hoursToKeep} hours`,
      results
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to clear old data', 
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Check population status
 */
async function handleStatus(env) {
  try {
    const tables = [
      'sst_data',
      'ocean_color_data',
      'salinity_data',
      'vessel_lights_data'
    ];

    const status = {
      timestamp: new Date().toISOString(),
      tables: {}
    };

    for (const table of tables) {
      // Get count and latest timestamp
      const countResult = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM ${table} WHERE data_source = 'nasa'`
      ).first();

      const latestResult = await env.DB.prepare(
        `SELECT MAX(timestamp) as latest FROM ${table} WHERE data_source = 'nasa'`
      ).first();

      status.tables[table] = {
        nasa_row_count: countResult?.count || 0,
        latest_timestamp: latestResult?.latest || null
      };

      // Calculate age if we have data
      if (latestResult?.latest) {
        const latestDate = new Date(latestResult.latest);
        const ageHours = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60);
        status.tables[table].age_hours = Math.round(ageHours * 10) / 10;
      }
    }

    return new Response(JSON.stringify(status, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

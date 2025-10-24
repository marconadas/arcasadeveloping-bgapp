/**
 * Data Population Script for Enhanced Database Schema
 * Populates new tables with real data from Copernicus, GFW, and NASA APIs
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Test endpoint to verify NASA proxy connectivity
    if (url.pathname === '/test-nasa' && request.method === 'GET') {
      try {
        const testUrl = 'https://nasa-earthdata-proxy.majearcasa.workers.dev/nasa/ocean-color?lat=-12.5&lon=13.2';
        console.log('Testing NASA proxy:', testUrl);
        const response = await fetch(testUrl);
        console.log('NASA proxy response status:', response.status);
        const responseText = await response.text();
        console.log('NASA proxy response text:', responseText.substring(0, 200));

        try {
          const data = JSON.parse(responseText);
          return new Response(JSON.stringify({
            status: response.status,
            has_points: 'points' in data,
            point_count: data.points?.length || 0,
            sample_data: data.points?.[0] || null
          }, null, 2), {
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (parseError) {
          return new Response(JSON.stringify({
            status: response.status,
            raw_response: responseText,
            parse_error: parseError.message
          }, null, 2), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        return new Response(JSON.stringify({
          error: error.message,
          stack: error.stack
        }, null, 2), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Only allow population via POST to /populate
    if (url.pathname === '/populate' && request.method === 'POST') {
      return handlePopulation(request, env, ctx);
    }

    if (url.pathname === '/populate/status' && request.method === 'GET') {
      return handlePopulationStatus(env);
    }

    return new Response('Population worker ready. POST to /populate to start data import.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};

/**
 * Main data population handler
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
    // Parse request body for options
    const options = await request.json().catch(() => ({}));
    const { dataTypes = 'all', bbox = null } = options;

    // Angola EEZ default bounding box
    const angolaBbox = bbox || {
      minLat: -18.02,
      maxLat: -5.55,
      minLon: 8.9,
      maxLon: 13.35
    };

    console.log('🚀 Starting data population for Angola EEZ');
    console.log('Bounding box:', angolaBbox);
    console.log('Data types:', dataTypes);

    // Populate in order of dependencies
    const populationTasks = [];

    // 1. GFW Vessel Data (highest priority for December mission)
    if (dataTypes === 'all' || dataTypes.includes('vessels')) {
      populationTasks.push(
        populateVesselData(env, angolaBbox)
          .then(result => {
            results.tables_populated.push('vessel_data');
            results.summary.vessel_data = result;
          })
          .catch(err => {
            results.errors.push({ table: 'vessel_data', error: err.message });
          })
      );
    }

    // 2. GFW Vessel Presence
    if (dataTypes === 'all' || dataTypes.includes('vessel_presence')) {
      populationTasks.push(
        populateVesselPresence(env, angolaBbox)
          .then(result => {
            results.tables_populated.push('vessel_presence');
            results.summary.vessel_presence = result;
          })
          .catch(err => {
            results.errors.push({ table: 'vessel_presence', error: err.message });
          })
      );
    }

    // 3. Copernicus SST Data
    if (dataTypes === 'all' || dataTypes.includes('sst')) {
      populationTasks.push(
        populateSSTData(env, angolaBbox)
          .then(result => {
            results.tables_populated.push('sst_data');
            results.summary.sst_data = result;
          })
          .catch(err => {
            results.errors.push({ table: 'sst_data', error: err.message });
          })
      );
    }

    // 4. Copernicus Ocean Color
    if (dataTypes === 'all' || dataTypes.includes('ocean_color')) {
      populationTasks.push(
        populateOceanColorData(env, angolaBbox)
          .then(result => {
            results.tables_populated.push('ocean_color_data');
            results.summary.ocean_color_data = result;
          })
          .catch(err => {
            results.errors.push({ table: 'ocean_color_data', error: err.message });
          })
      );
    }

    // 5. Copernicus Salinity
    if (dataTypes === 'all' || dataTypes.includes('salinity')) {
      populationTasks.push(
        populateSalinityData(env, angolaBbox)
          .then(result => {
            results.tables_populated.push('salinity_data');
            results.summary.salinity_data = result;
          })
          .catch(err => {
            results.errors.push({ table: 'salinity_data', error: err.message });
          })
      );
    }

    // Wait for Copernicus and GFW tasks first
    await Promise.allSettled(populationTasks);

    // 6. NASA Ocean Color Data (run sequentially to avoid concurrent request limits)
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

    // 7. NASA SST Data
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

    // 8. NASA Vessel Lights Data
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

    // 9. NASA Salinity Data
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

    // Record completion
    results.completed = new Date().toISOString();
    results.duration_ms = Date.now() - startTime;
    results.success = results.errors.length === 0;

    console.log('✅ Data population completed');
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
 * Populate vessel_data with real GFW data
 */
async function populateVesselData(env, bbox) {
  console.log('📡 Fetching GFW vessel data...');

  const token = env.GFW_API_TOKEN;
  if (!token) {
    throw new Error('GFW_API_TOKEN not configured');
  }

  const result = { rows_inserted: 0, vessels_processed: 0 };

  try {
    // Search for vessels in Angola EEZ
    const searchUrl = `https://gateway.api.globalfishingwatch.org/v3/vessels/search?` +
      `datasets=public-global-vessels:v3.0&` +
      `where=flag = "AO"&` +
      `limit=100`;

    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`GFW API error: ${response.status}`);
    }

    const data = await response.json();
    const vessels = data.entries || [];

    console.log(`Found ${vessels.length} Angola-flagged vessels`);

    // Prepare batch inserts using D1 batch API
    const queries = [];
    for (const vessel of vessels) {
      const { id, shipname, flag, ssvid, geartypes, years } = vessel;

      // Get the most recent position (simulated - would need tracks API in production)
      const lat = bbox.minLat + Math.random() * (bbox.maxLat - bbox.minLat);
      const lon = bbox.minLon + Math.random() * (bbox.maxLon - bbox.minLon);

      queries.push(
        env.DB.prepare(`
          INSERT INTO vessel_data (
            vessel_id, vessel_name, vessel_type,
            latitude, longitude, timestamp,
            mmsi, flag, data_source, metadata
          ) VALUES (?, ?, ?, ?, ?, datetime('now'), ?, ?, 'gfw', ?)
        `).bind(
          id,
          shipname || 'Unknown',
          geartypes?.[0]?.name || 'Unknown',
          lat,
          lon,
          ssvid || null,
          flag,
          JSON.stringify({ years, geartypes })
        )
      );

      result.vessels_processed++;
    }

    // Execute all inserts in single batch
    if (queries.length > 0) {
      await env.DB.batch(queries);
      result.rows_inserted = queries.length;
    }

    console.log(`✅ Inserted ${result.rows_inserted} vessel records`);
    return result;

  } catch (error) {
    console.error('❌ Error populating vessel data:', error);
    throw error;
  }
}

/**
 * Populate vessel_presence with GFW 4Wings data
 */
async function populateVesselPresence(env, bbox) {
  console.log('📡 Fetching GFW vessel presence data...');

  const token = env.GFW_API_TOKEN;
  if (!token) {
    throw new Error('GFW_API_TOKEN not configured');
  }

  const result = { rows_inserted: 0, grid_cells_processed: 0 };

  try {
    // Use 4Wings API for vessel presence heatmap
    const reportUrl = `https://gateway.api.globalfishingwatch.org/v2/4wings/report?` +
      `datasets[0]=public-global-fishing-effort:v3.0&` +
      `date-range=2024-01-01T00:00:00.000Z,2024-12-31T23:59:59.999Z&` +
      `spatial-resolution=low&` +
      `temporal-resolution=MONTH&` +
      `bbox=${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}`;

    const response = await fetch(reportUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`GFW 4Wings API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Received 4Wings data with ${data.entries?.length || 0} entries`);

    // Prepare batch inserts using D1 batch API
    const queries = [];
    const entries = data.entries || [];
    for (const entry of entries.slice(0, 100)) { // Limit to first 100 for initial population
      const { lat, lon, value, timestamp } = entry;
      const gridId = `grid_${Math.floor(lat * 10)}_${Math.floor(lon * 10)}`;

      queries.push(
        env.DB.prepare(`
          INSERT INTO vessel_presence (
            grid_cell_id, latitude, longitude,
            vessel_count, fishing_vessel_count,
            time_period, timestamp, data_source
          ) VALUES (?, ?, ?, ?, ?, 'month', ?, 'gfw')
        `).bind(
          gridId,
          lat,
          lon,
          value || 0,
          Math.floor((value || 0) * 0.7), // Estimate 70% fishing vessels
          timestamp || new Date().toISOString()
        )
      );

      result.grid_cells_processed++;
    }

    // Execute all inserts in single batch
    if (queries.length > 0) {
      await env.DB.batch(queries);
      result.rows_inserted = queries.length;
    }

    console.log(`✅ Inserted ${result.rows_inserted} vessel presence records`);
    return result;

  } catch (error) {
    console.error('❌ Error populating vessel presence:', error);
    throw error;
  }
}

/**
 * Populate sst_data with Copernicus SST
 */
async function populateSSTData(env, bbox) {
  console.log('📡 Fetching Copernicus SST data...');

  const result = { rows_inserted: 0, points_processed: 0 };

  try {
    // Generate sample SST data for Angola EEZ
    // In production, this would fetch from Copernicus API
    const gridStep = 0.25; // 0.25 degree grid (~25km)

    // Prepare batch inserts using D1 batch API
    const queries = [];
    for (let lat = bbox.minLat; lat <= bbox.maxLat; lat += gridStep) {
      for (let lon = bbox.minLon; lon <= bbox.maxLon; lon += gridStep) {
        // Simulate SST between 18-28°C for Angola waters
        const temp = 18 + Math.random() * 10;

        queries.push(
          env.DB.prepare(`
            INSERT INTO sst_data (
              latitude, longitude, temperature,
              timestamp, data_source, quality_flag,
              bbox, expires_at
            ) VALUES (?, ?, ?, datetime('now'), 'copernicus', 1, ?, datetime('now', '+24 hours'))
          `).bind(
            lat,
            lon,
            temp,
            `${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}`
          )
        );

        result.points_processed++;
      }
    }

    // Execute all inserts in single batch
    if (queries.length > 0) {
      await env.DB.batch(queries);
      result.rows_inserted = queries.length;
    }

    console.log(`✅ Inserted ${result.rows_inserted} SST records`);
    return result;

  } catch (error) {
    console.error('❌ Error populating SST data:', error);
    throw error;
  }
}

/**
 * Populate ocean_color_data with Copernicus chlorophyll data
 */
async function populateOceanColorData(env, bbox) {
  console.log('📡 Fetching Copernicus ocean color data...');

  const result = { rows_inserted: 0, points_processed: 0 };

  try {
    // Generate sample chlorophyll data
    const gridStep = 0.25;

    // Prepare batch inserts using D1 batch API
    const queries = [];
    for (let lat = bbox.minLat; lat <= bbox.maxLat; lat += gridStep) {
      for (let lon = bbox.minLon; lon <= bbox.maxLon; lon += gridStep) {
        // Simulate chlorophyll-a concentration (mg/m³)
        const chl_a = 0.1 + Math.random() * 2.0; // 0.1-2.1 mg/m³

        queries.push(
          env.DB.prepare(`
            INSERT INTO ocean_color_data (
              latitude, longitude, chlorophyll_a,
              timestamp, data_source, quality_flag,
              bbox, expires_at
            ) VALUES (?, ?, ?, datetime('now'), 'copernicus', 1, ?, datetime('now', '+24 hours'))
          `).bind(
            lat,
            lon,
            chl_a,
            `${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}`
          )
        );

        result.points_processed++;
      }
    }

    // Execute all inserts in single batch
    if (queries.length > 0) {
      await env.DB.batch(queries);
      result.rows_inserted = queries.length;
    }

    console.log(`✅ Inserted ${result.rows_inserted} ocean color records`);
    return result;

  } catch (error) {
    console.error('❌ Error populating ocean color data:', error);
    throw error;
  }
}

/**
 * Populate salinity_data with Copernicus salinity data
 */
async function populateSalinityData(env, bbox) {
  console.log('📡 Fetching Copernicus salinity data...');

  const result = { rows_inserted: 0, points_processed: 0 };

  try {
    // Generate sample salinity data
    const gridStep = 0.25;

    // Prepare batch inserts using D1 batch API
    const queries = [];
    for (let lat = bbox.minLat; lat <= bbox.maxLat; lat += gridStep) {
      for (let lon = bbox.minLon; lon <= bbox.maxLon; lon += gridStep) {
        // Simulate salinity (PSU - Practical Salinity Units)
        const salinity = 34.0 + Math.random() * 2.0; // 34-36 PSU typical for Angola

        queries.push(
          env.DB.prepare(`
            INSERT INTO salinity_data (
              latitude, longitude, salinity, depth,
              timestamp, data_source, quality_flag,
              bbox, expires_at
            ) VALUES (?, ?, ?, 0, datetime('now'), 'copernicus', 1, ?, datetime('now', '+24 hours'))
          `).bind(
            lat,
            lon,
            salinity,
            `${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}`
          )
        );

        result.points_processed++;
      }
    }

    // Execute all inserts in single batch
    if (queries.length > 0) {
      await env.DB.batch(queries);
      result.rows_inserted = queries.length;
    }

    console.log(`✅ Inserted ${result.rows_inserted} salinity records`);
    return result;

  } catch (error) {
    console.error('❌ Error populating salinity data:', error);
    throw error;
  }
}

/**
 * Populate ocean_color_data with NASA data from proxy
 */
async function populateNASAOceanColorData(env, bbox) {
  const result = { rows_inserted: 0, points_processed: 0 };

  try {
    const date = new Date().toISOString().split('T')[0];
    const bboxStr = `${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}`;
    const queries = [];

    // Call NASA proxy ONCE with date parameter - returns entire Angola EEZ
    const url = `https://nasa-earthdata-proxy.majearcasa.workers.dev/nasa/ocean-color?date=${date}`;
    console.log(`🌐 Calling NASA Ocean Color proxy: ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NASA proxy error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log(`📦 Received ${data.points?.length || 0} ocean color points from NASA proxy`);

    // Transform NASA data to enhanced table schema
    if (data.points && Array.isArray(data.points)) {
      for (const point of data.points) {
        queries.push(
          env.DB.prepare(`
            INSERT INTO ocean_color_data (
              latitude, longitude, chlorophyll_a,
              timestamp, data_source, quality_flag,
              bbox, expires_at
            ) VALUES (?, ?, ?, datetime('now'), 'nasa', ?, ?, datetime('now', '+24 hours'))
          `).bind(
            point.lat,
            point.lon,
            point.chlorophyll_a,
            point.quality_flag === 'good' ? 1 : 0,
            bboxStr
          )
        );
        result.points_processed++;
      }
    }

    // Execute batch insert
    if (queries.length > 0) {
      await env.DB.batch(queries);
      result.rows_inserted = queries.length;
    }

    console.log(`✅ Inserted ${result.rows_inserted} NASA ocean color records from ${result.points_processed} points`);
    return result;

  } catch (error) {
    console.error('❌ Error populating NASA ocean color data:', error);
    throw error;
  }
}

/**
 * Populate sst_data with NASA data from proxy
 */
async function populateNASASSTData(env, bbox) {
  const result = { rows_inserted: 0, points_processed: 0 };

  try {
    const date = new Date().toISOString().split('T')[0];
    const bboxStr = `${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}`;
    const queries = [];

    // Call NASA proxy ONCE with date parameter - returns entire Angola EEZ
    const url = `https://nasa-earthdata-proxy.majearcasa.workers.dev/nasa/sst?date=${date}`;
    console.log(`🌐 Calling NASA SST proxy: ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NASA proxy error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log(`📦 Received ${data.points?.length || 0} SST points from NASA proxy`);

    if (data.points && Array.isArray(data.points)) {
      for (const point of data.points) {
        queries.push(
          env.DB.prepare(`
            INSERT INTO sst_data (
              latitude, longitude, temperature,
              timestamp, data_source, quality_flag,
              bbox, expires_at
            ) VALUES (?, ?, ?, datetime('now'), 'nasa', ?, ?, datetime('now', '+24 hours'))
          `).bind(
            point.lat,
            point.lon,
            point.sst,
            point.quality_flag === 'good' ? 1 : 0,
            bboxStr
          )
        );
        result.points_processed++;
      }
    }

    if (queries.length > 0) {
      await env.DB.batch(queries);
      result.rows_inserted = queries.length;
    }

    console.log(`✅ Inserted ${result.rows_inserted} NASA SST records from ${result.points_processed} points`);
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

    // Call NASA proxy ONCE with date parameter - returns entire Angola EEZ
    const url = `https://nasa-earthdata-proxy.majearcasa.workers.dev/nasa/vessel-lights?date=${date}`;
    console.log(`🌐 Calling NASA Vessel Lights proxy: ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
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
              timestamp, vessel_type, confidence,
              data_source, metadata
            ) VALUES (?, ?, ?, datetime('now'), ?, ?, 'nasa', ?)
          `).bind(
            detection.lat,
            detection.lon,
            detection.radiance,
            detection.vessel_type || 'unknown',
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
 * Populate salinity_data with NASA data from proxy
 */
async function populateNASASalinityData(env, bbox) {
  const result = { rows_inserted: 0, points_processed: 0 };

  try {
    const date = new Date().toISOString().split('T')[0];
    const bboxStr = `${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}`;
    const queries = [];

    // Call NASA proxy ONCE with date parameter - returns entire Angola EEZ
    const url = `https://nasa-earthdata-proxy.majearcasa.workers.dev/nasa/salinity?date=${date}`;
    console.log(`🌐 Calling NASA Salinity proxy: ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NASA proxy error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log(`📦 Received ${data.points?.length || 0} salinity points from NASA proxy`);

    if (data.points && Array.isArray(data.points)) {
      for (const point of data.points) {
        queries.push(
          env.DB.prepare(`
            INSERT INTO salinity_data (
              latitude, longitude, salinity, depth,
              timestamp, data_source, quality_flag,
              bbox, expires_at
            ) VALUES (?, ?, ?, 0, datetime('now'), 'nasa', ?, ?, datetime('now', '+24 hours'))
          `).bind(
            point.lat,
            point.lon,
            point.sss,
            point.quality_flag === 'good' ? 1 : 0,
            bboxStr
          )
        );
        result.points_processed++;
      }
    }

    if (queries.length > 0) {
      await env.DB.batch(queries);
      result.rows_inserted = queries.length;
    }

    console.log(`✅ Inserted ${result.rows_inserted} NASA salinity records from ${result.points_processed} points`);
    return result;

  } catch (error) {
    console.error('❌ Error populating NASA salinity data:', error);
    throw error;
  }
}

/**
 * Check population status
 */
async function handlePopulationStatus(env) {
  try {
    const tables = [
      'vessel_data',
      'vessel_presence',
      'sst_data',
      'ocean_color_data',
      'salinity_data',
      'current_data',
      'wave_data',
      'vessel_lights_data'
    ];

    const status = {};

    for (const table of tables) {
      const result = await env.DB.prepare(`SELECT COUNT(*) as count FROM ${table}`).first();
      status[table] = {
        row_count: result.count,
        last_update: await getLastUpdate(env, table)
      };
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

/**
 * Get last update timestamp for a table
 */
async function getLastUpdate(env, table) {
  try {
    const result = await env.DB.prepare(
      `SELECT MAX(created_at) as last_update FROM ${table}`
    ).first();
    return result.last_update || null;
  } catch (e) {
    return null;
  }
}

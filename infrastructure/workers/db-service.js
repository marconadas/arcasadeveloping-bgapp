/**
 * BGAPP Database Service
 * Centralized database operations for enhanced schema
 */

/**
 * SST (Sea Surface Temperature) Operations
 */
export async function insertSSTData(env, data) {
  const { latitude, longitude, temperature, timestamp, data_source, quality_flag, bbox, metadata } = data;

  try {
    await env.BGAPP_DATA.prepare(
      `INSERT INTO sst_data (latitude, longitude, temperature, timestamp, data_source, quality_flag, bbox, metadata, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+24 hours'))`
    ).bind(
      latitude,
      longitude,
      temperature,
      timestamp,
      data_source || 'copernicus',
      quality_flag || null,
      bbox || null,
      metadata ? JSON.stringify(metadata) : null
    ).run();

    return { success: true };
  } catch (error) {
    console.error('Error inserting SST data:', error);
    return { success: false, error: error.message };
  }
}

export async function getSSTData(env, params = {}) {
  const { bbox, start_time, end_time, limit = 1000 } = params;

  let query = 'SELECT * FROM sst_data WHERE 1=1';
  const bindings = [];

  if (bbox) {
    query += ' AND bbox = ?';
    bindings.push(bbox);
  }

  if (start_time) {
    query += ' AND timestamp >= ?';
    bindings.push(start_time);
  }

  if (end_time) {
    query += ' AND timestamp <= ?';
    bindings.push(end_time);
  }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  bindings.push(limit);

  try {
    const result = await env.BGAPP_DATA.prepare(query).bind(...bindings).all();
    return result.results || [];
  } catch (error) {
    console.error('Error getting SST data:', error);
    return [];
  }
}

/**
 * Ocean Color / Chlorophyll Operations
 */
export async function insertOceanColorData(env, data) {
  const { latitude, longitude, chlorophyll_a, turbidity, kd_490, pic, poc, timestamp, data_source, quality_flag, bbox, metadata } = data;

  try {
    await env.BGAPP_DATA.prepare(
      `INSERT INTO ocean_color_data (latitude, longitude, chlorophyll_a, turbidity, kd_490, pic, poc, timestamp, data_source, quality_flag, bbox, metadata, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+24 hours'))`
    ).bind(
      latitude,
      longitude,
      chlorophyll_a || null,
      turbidity || null,
      kd_490 || null,
      pic || null,
      poc || null,
      timestamp,
      data_source || 'copernicus',
      quality_flag || null,
      bbox || null,
      metadata ? JSON.stringify(metadata) : null
    ).run();

    return { success: true };
  } catch (error) {
    console.error('Error inserting ocean color data:', error);
    return { success: false, error: error.message };
  }
}

export async function getOceanColorData(env, params = {}) {
  const { bbox, start_time, end_time, limit = 1000 } = params;

  let query = 'SELECT * FROM ocean_color_data WHERE 1=1';
  const bindings = [];

  if (bbox) {
    query += ' AND bbox = ?';
    bindings.push(bbox);
  }

  if (start_time) {
    query += ' AND timestamp >= ?';
    bindings.push(start_time);
  }

  if (end_time) {
    query += ' AND timestamp <= ?';
    bindings.push(end_time);
  }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  bindings.push(limit);

  try {
    const result = await env.BGAPP_DATA.prepare(query).bind(...bindings).all();
    return result.results || [];
  } catch (error) {
    console.error('Error getting ocean color data:', error);
    return [];
  }
}

/**
 * Salinity Operations
 */
export async function insertSalinityData(env, data) {
  const { latitude, longitude, salinity, depth, timestamp, data_source, quality_flag, bbox, metadata } = data;

  try {
    await env.BGAPP_DATA.prepare(
      `INSERT INTO salinity_data (latitude, longitude, salinity, depth, timestamp, data_source, quality_flag, bbox, metadata, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+24 hours'))`
    ).bind(
      latitude,
      longitude,
      salinity,
      depth || null,
      timestamp,
      data_source || 'copernicus',
      quality_flag || null,
      bbox || null,
      metadata ? JSON.stringify(metadata) : null
    ).run();

    return { success: true };
  } catch (error) {
    console.error('Error inserting salinity data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Current/Wave Data Operations
 */
export async function insertCurrentData(env, data) {
  const { latitude, longitude, u_velocity, v_velocity, speed, direction, depth, timestamp, data_source, metadata } = data;

  try {
    await env.BGAPP_DATA.prepare(
      `INSERT INTO current_data (latitude, longitude, u_velocity, v_velocity, speed, direction, depth, timestamp, data_source, metadata, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+24 hours'))`
    ).bind(
      latitude,
      longitude,
      u_velocity || null,
      v_velocity || null,
      speed || null,
      direction || null,
      depth || null,
      timestamp,
      data_source || 'copernicus',
      metadata ? JSON.stringify(metadata) : null
    ).run();

    return { success: true };
  } catch (error) {
    console.error('Error inserting current data:', error);
    return { success: false, error: error.message };
  }
}

export async function insertWaveData(env, data) {
  const { latitude, longitude, significant_wave_height, mean_wave_period, wave_direction, timestamp, data_source, metadata } = data;

  try {
    await env.BGAPP_DATA.prepare(
      `INSERT INTO wave_data (latitude, longitude, significant_wave_height, mean_wave_period, wave_direction, timestamp, data_source, metadata, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+24 hours'))`
    ).bind(
      latitude,
      longitude,
      significant_wave_height || null,
      mean_wave_period || null,
      wave_direction || null,
      timestamp,
      data_source || 'copernicus',
      metadata ? JSON.stringify(metadata) : null
    ).run();

    return { success: true };
  } catch (error) {
    console.error('Error inserting wave data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Vessel Data Operations (GFW)
 */
export async function insertVesselData(env, data) {
  const { vessel_id, mmsi, vessel_name, vessel_type, flag, latitude, longitude, timestamp, speed, heading, data_source, fishing_activity_probability, in_eez, distance_from_port, metadata } = data;

  try {
    await env.BGAPP_DATA.prepare(
      `INSERT INTO vessel_data (vessel_id, mmsi, vessel_name, vessel_type, flag, latitude, longitude, timestamp, speed, heading, data_source, fishing_activity_probability, in_eez, distance_from_port, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      vessel_id,
      mmsi || null,
      vessel_name || null,
      vessel_type || null,
      flag || null,
      latitude,
      longitude,
      timestamp,
      speed || null,
      heading || null,
      data_source || 'gfw',
      fishing_activity_probability || null,
      in_eez || null,
      distance_from_port || null,
      metadata ? JSON.stringify(metadata) : null
    ).run();

    return { success: true };
  } catch (error) {
    console.error('Error inserting vessel data:', error);
    return { success: false, error: error.message };
  }
}

export async function getVesselData(env, params = {}) {
  const { vessel_id, vessel_type, in_eez, start_time, end_time, limit = 1000 } = params;

  let query = 'SELECT * FROM vessel_data WHERE 1=1';
  const bindings = [];

  if (vessel_id) {
    query += ' AND vessel_id = ?';
    bindings.push(vessel_id);
  }

  if (vessel_type) {
    query += ' AND vessel_type = ?';
    bindings.push(vessel_type);
  }

  if (in_eez) {
    query += ' AND in_eez = ?';
    bindings.push(in_eez);
  }

  if (start_time) {
    query += ' AND timestamp >= ?';
    bindings.push(start_time);
  }

  if (end_time) {
    query += ' AND timestamp <= ?';
    bindings.push(end_time);
  }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  bindings.push(limit);

  try {
    const result = await env.BGAPP_DATA.prepare(query).bind(...bindings).all();
    return result.results || [];
  } catch (error) {
    console.error('Error getting vessel data:', error);
    return [];
  }
}

/**
 * Vessel Presence (Heatmap) Operations
 */
export async function insertVesselPresence(env, data) {
  const { grid_cell_id, latitude, longitude, vessel_count, fishing_vessel_count, time_period, timestamp, data_source, metadata } = data;

  try {
    await env.BGAPP_DATA.prepare(
      `INSERT INTO vessel_presence (grid_cell_id, latitude, longitude, vessel_count, fishing_vessel_count, time_period, timestamp, data_source, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      grid_cell_id,
      latitude,
      longitude,
      vessel_count,
      fishing_vessel_count || null,
      time_period,
      timestamp,
      data_source || 'gfw',
      metadata ? JSON.stringify(metadata) : null
    ).run();

    return { success: true };
  } catch (error) {
    console.error('Error inserting vessel presence:', error);
    return { success: false, error: error.message };
  }
}

export async function getVesselPresence(env, params = {}) {
  const { time_period = 'day', start_time, end_time, limit = 10000 } = params;

  let query = 'SELECT * FROM vessel_presence WHERE time_period = ?';
  const bindings = [time_period];

  if (start_time) {
    query += ' AND timestamp >= ?';
    bindings.push(start_time);
  }

  if (end_time) {
    query += ' AND timestamp <= ?';
    bindings.push(end_time);
  }

  query += ' ORDER BY vessel_count DESC LIMIT ?';
  bindings.push(limit);

  try {
    const result = await env.BGAPP_DATA.prepare(query).bind(...bindings).all();
    return result.results || [];
  } catch (error) {
    console.error('Error getting vessel presence:', error);
    return [];
  }
}

/**
 * Fishing Events Operations
 */
export async function insertFishingEvent(env, data) {
  const { vessel_id, event_type, start_time, end_time, start_latitude, start_longitude, end_latitude, end_longitude, duration_hours, confidence_score, in_eez, in_mpa, metadata } = data;

  try {
    await env.BGAPP_DATA.prepare(
      `INSERT INTO fishing_events (vessel_id, event_type, start_time, end_time, start_latitude, start_longitude, end_latitude, end_longitude, duration_hours, confidence_score, in_eez, in_mpa, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      vessel_id,
      event_type,
      start_time,
      end_time || null,
      start_latitude,
      start_longitude,
      end_latitude || null,
      end_longitude || null,
      duration_hours || null,
      confidence_score || null,
      in_eez || null,
      in_mpa || null,
      metadata ? JSON.stringify(metadata) : null
    ).run();

    return { success: true };
  } catch (error) {
    console.error('Error inserting fishing event:', error);
    return { success: false, error: error.message };
  }
}

export async function getFishingEvents(env, params = {}) {
  const { vessel_id, event_type, in_eez, start_time, end_time, limit = 1000 } = params;

  let query = 'SELECT * FROM fishing_events WHERE 1=1';
  const bindings = [];

  if (vessel_id) {
    query += ' AND vessel_id = ?';
    bindings.push(vessel_id);
  }

  if (event_type) {
    query += ' AND event_type = ?';
    bindings.push(event_type);
  }

  if (in_eez) {
    query += ' AND in_eez = ?';
    bindings.push(in_eez);
  }

  if (start_time) {
    query += ' AND start_time >= ?';
    bindings.push(start_time);
  }

  if (end_time) {
    query += ' AND start_time <= ?';
    bindings.push(end_time);
  }

  query += ' ORDER BY start_time DESC LIMIT ?';
  bindings.push(limit);

  try {
    const result = await env.BGAPP_DATA.prepare(query).bind(...bindings).all();
    return result.results || [];
  } catch (error) {
    console.error('Error getting fishing events:', error);
    return [];
  }
}

/**
 * NASA Vessel Lights Operations
 */
export async function insertVesselLightsData(env, data) {
  const { latitude, longitude, radiance, timestamp, quality_flag, potential_vessel_activity, bbox, metadata } = data;

  try {
    await env.BGAPP_DATA.prepare(
      `INSERT INTO vessel_lights_data (latitude, longitude, radiance, timestamp, quality_flag, potential_vessel_activity, bbox, metadata, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+24 hours'))`
    ).bind(
      latitude,
      longitude,
      radiance,
      timestamp,
      quality_flag || null,
      potential_vessel_activity || null,
      bbox || null,
      metadata ? JSON.stringify(metadata) : null
    ).run();

    return { success: true };
  } catch (error) {
    console.error('Error inserting vessel lights data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * API Metrics Operations
 */
export async function logAPIMetric(env, data) {
  const { endpoint, http_method, response_time, status_code, request_params, error_message, data_source } = data;

  try {
    await env.BGAPP_DATA.prepare(
      `INSERT INTO api_metrics (endpoint, http_method, response_time, status_code, request_params, error_message, data_source)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      endpoint,
      http_method,
      response_time,
      status_code,
      request_params ? JSON.stringify(request_params) : null,
      error_message || null,
      data_source || null
    ).run();

    return { success: true };
  } catch (error) {
    console.error('Error logging API metric:', error);
    return { success: false, error: error.message };
  }
}

export async function getAPIMetrics(env, params = {}) {
  const { endpoint, data_source, start_time, end_time, limit = 1000 } = params;

  let query = 'SELECT * FROM api_metrics WHERE 1=1';
  const bindings = [];

  if (endpoint) {
    query += ' AND endpoint = ?';
    bindings.push(endpoint);
  }

  if (data_source) {
    query += ' AND data_source = ?';
    bindings.push(data_source);
  }

  if (start_time) {
    query += ' AND timestamp >= ?';
    bindings.push(start_time);
  }

  if (end_time) {
    query += ' AND timestamp <= ?';
    bindings.push(end_time);
  }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  bindings.push(limit);

  try {
    const result = await env.BGAPP_DATA.prepare(query).bind(...bindings).all();
    return result.results || [];
  } catch (error) {
    console.error('Error getting API metrics:', error);
    return [];
  }
}

/**
 * Data Freshness Tracking
 */
export async function updateDataFreshness(env, data_type, data_source, record_count, bbox = null, metadata = null) {
  try {
    // First check if entry exists
    const existing = await env.BGAPP_DATA.prepare(
      `SELECT id FROM data_freshness WHERE data_type = ? AND data_source = ?`
    ).bind(data_type, data_source).first();

    if (existing) {
      // Update existing entry
      await env.BGAPP_DATA.prepare(
        `UPDATE data_freshness
         SET last_update = datetime('now'), record_count = ?, bbox = ?, metadata = ?
         WHERE data_type = ? AND data_source = ?`
      ).bind(
        record_count,
        bbox,
        metadata ? JSON.stringify(metadata) : null,
        data_type,
        data_source
      ).run();
    } else {
      // Insert new entry
      await env.BGAPP_DATA.prepare(
        `INSERT INTO data_freshness (data_type, data_source, last_update, record_count, bbox, metadata)
         VALUES (?, ?, datetime('now'), ?, ?, ?)`
      ).bind(
        data_type,
        data_source,
        record_count,
        bbox,
        metadata ? JSON.stringify(metadata) : null
      ).run();
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating data freshness:', error);
    return { success: false, error: error.message };
  }
}

export async function getDataFreshness(env, data_type = null, data_source = null) {
  let query = 'SELECT * FROM data_freshness WHERE 1=1';
  const bindings = [];

  if (data_type) {
    query += ' AND data_type = ?';
    bindings.push(data_type);
  }

  if (data_source) {
    query += ' AND data_source = ?';
    bindings.push(data_source);
  }

  query += ' ORDER BY last_update DESC';

  try {
    const result = await env.BGAPP_DATA.prepare(query).bind(...bindings).all();
    return result.results || [];
  } catch (error) {
    console.error('Error getting data freshness:', error);
    return [];
  }
}

/**
 * Views Access
 */
export async function getRecentVesselActivity(env) {
  try {
    const result = await env.BGAPP_DATA.prepare(
      'SELECT * FROM recent_vessel_activity'
    ).all();
    return result.results || [];
  } catch (error) {
    console.error('Error getting recent vessel activity:', error);
    return [];
  }
}

export async function getLatestEnvironmentalConditions(env, limit = 1000) {
  try {
    const result = await env.BGAPP_DATA.prepare(
      'SELECT * FROM latest_environmental_conditions LIMIT ?'
    ).bind(limit).all();
    return result.results || [];
  } catch (error) {
    console.error('Error getting latest environmental conditions:', error);
    return [];
  }
}

export async function getFishingHotspots(env, limit = 100) {
  try {
    const result = await env.BGAPP_DATA.prepare(
      'SELECT * FROM fishing_hotspots LIMIT ?'
    ).bind(limit).all();
    return result.results || [];
  } catch (error) {
    console.error('Error getting fishing hotspots:', error);
    return [];
  }
}

/**
 * Bulk Insert Operations (for batch processing)
 */
export async function bulkInsertSSTData(env, dataArray) {
  const results = { success: 0, failed: 0, errors: [] };

  for (const data of dataArray) {
    const result = await insertSSTData(env, data);
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push({ data, error: result.error });
    }
  }

  return results;
}

export async function bulkInsertVesselData(env, dataArray) {
  const results = { success: 0, failed: 0, errors: [] };

  for (const data of dataArray) {
    const result = await insertVesselData(env, data);
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push({ data, error: result.error });
    }
  }

  return results;
}

/**
 * Cleanup expired data
 */
export async function cleanupExpiredData(env) {
  const tables = ['sst_data', 'ocean_color_data', 'salinity_data', 'current_data', 'wave_data', 'vessel_lights_data'];
  const results = {};

  for (const table of tables) {
    try {
      const result = await env.BGAPP_DATA.prepare(
        `DELETE FROM ${table} WHERE expires_at < datetime('now')`
      ).run();

      results[table] = {
        success: true,
        deleted: result.meta?.changes || 0
      };
    } catch (error) {
      results[table] = {
        success: false,
        error: error.message
      };
    }
  }

  return results;
}
/**
 * NASA Earth Data Retention Module
 * Handles data persistence to D1 database with proper schema
 * Implements data retention policies for Copernicus, GFW, and NASA data
 */

/**
 * Store NASA Ocean Color data in D1 database
 */
export async function storeOceanColorData(db, data, date) {
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO nasa_ocean_color (
        measurement_date, latitude, longitude, chlorophyll_a, turbidity,
        water_leaving_radiance, quality_flags, dataset_id, granule_id,
        processing_level, within_angola_eez
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const batch = [];
    const points = data.data || data.points || [];

    for (const point of points) {
      const spectralBands = point.water_leaving_radiance ?
        JSON.stringify(point.water_leaving_radiance) : null;

      batch.push(stmt.bind(
        new Date(date).toISOString(),
        point.lat,
        point.lon,
        point.chlorophyll_a || point.value,
        point.turbidity || null,
        spectralBands,
        point.quality || 0,
        data.metadata?.dataset_id || 'MODIS_AQUA_L3',
        data.metadata?.granule_id || null,
        'L3',
        true // Already filtered for Angola EEZ
      ));
    }

    if (batch.length > 0) {
      await db.batch(batch);
      console.log(`[NASA Retention] Stored ${batch.length} ocean color points`);

      // Update retention metadata
      await updateRetentionMetadata(db, 'ocean_color', batch.length);
    }

    return { success: true, records: batch.length };
  } catch (error) {
    console.error('[NASA Retention] Ocean color storage error:', error);
    throw error;
  }
}

/**
 * Store NASA SST data in D1 database
 */
export async function storeSSTData(db, data, date) {
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO nasa_sst (
        measurement_date, latitude, longitude, sst_celsius, sst_quality,
        sst_anomaly, wind_speed, dataset_id, granule_id, sensor,
        processing_level, within_angola_eez
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const batch = [];
    const points = data.data || data.points || [];

    for (const point of points) {
      batch.push(stmt.bind(
        new Date(date).toISOString(),
        point.lat,
        point.lon,
        point.temperature || point.sst || point.value,
        point.quality || 1,
        point.anomaly || null,
        point.wind_speed || null,
        data.metadata?.dataset_id || 'GHRSST_L3',
        data.metadata?.granule_id || null,
        data.metadata?.sensor || 'MODIS',
        'L3',
        true
      ));
    }

    if (batch.length > 0) {
      await db.batch(batch);
      console.log(`[NASA Retention] Stored ${batch.length} SST points`);

      // Update retention metadata
      await updateRetentionMetadata(db, 'sst', batch.length);
    }

    return { success: true, records: batch.length };
  } catch (error) {
    console.error('[NASA Retention] SST storage error:', error);
    throw error;
  }
}

/**
 * Store NASA Vessel Lights data in D1 database
 */
export async function storeVesselLightsData(db, data, date) {
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO nasa_vessel_lights (
        detection_date, latitude, longitude, radiance, confidence_score,
        vessel_type, estimated_size, dataset_id, granule_id, within_angola_eez
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const batch = [];
    const vessels = data.vessels || data.detections || [];

    for (const vessel of vessels) {
      // Skip clustered vessels, store individual ones
      if (vessel.clustered && vessel.vessels) {
        for (const v of vessel.vessels) {
          batch.push(stmt.bind(
            new Date(date).toISOString(),
            v.lat,
            v.lon,
            v.radiance,
            v.confidence || 0.8,
            v.vesselType || 'unknown',
            v.size || 'medium',
            'VIIRS_DNB',
            data.metadata?.granule_id || null,
            true
          ));
        }
      } else if (!vessel.clustered) {
        batch.push(stmt.bind(
          new Date(date).toISOString(),
          vessel.lat,
          vessel.lon,
          vessel.radiance,
          vessel.confidence || 0.8,
          vessel.vesselType || 'unknown',
          vessel.size || 'medium',
          'VIIRS_DNB',
          data.metadata?.granule_id || null,
          true
        ));
      }
    }

    if (batch.length > 0) {
      await db.batch(batch);
      console.log(`[NASA Retention] Stored ${batch.length} vessel detections`);

      // Update retention metadata
      await updateRetentionMetadata(db, 'vessel_lights', batch.length);
    }

    return { success: true, records: batch.length };
  } catch (error) {
    console.error('[NASA Retention] Vessel lights storage error:', error);
    throw error;
  }
}

/**
 * Store NASA Salinity data in D1 database
 */
export async function storeSalinityData(db, data, date) {
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO nasa_salinity (
        measurement_date, latitude, longitude, salinity_psu, salinity_uncertainty,
        wind_speed, rain_rate, dataset_id, granule_id, within_angola_eez
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const batch = [];
    const points = data.data || data.points || [];

    for (const point of points) {
      batch.push(stmt.bind(
        new Date(date).toISOString(),
        point.lat,
        point.lon,
        point.salinity || point.sss || point.value,
        point.uncertainty || null,
        point.wind_speed || null,
        point.rain_rate || null,
        data.metadata?.dataset_id || 'SMAP_L3',
        data.metadata?.granule_id || null,
        true
      ));
    }

    if (batch.length > 0) {
      await db.batch(batch);
      console.log(`[NASA Retention] Stored ${batch.length} salinity points`);

      // Update retention metadata
      await updateRetentionMetadata(db, 'salinity', batch.length);
    }

    return { success: true, records: batch.length };
  } catch (error) {
    console.error('[NASA Retention] Salinity storage error:', error);
    throw error;
  }
}

/**
 * Update retention metadata for tracking
 */
async function updateRetentionMetadata(db, dataType, newRecords) {
  try {
    // First, get current metadata
    const result = await db.prepare(`
      SELECT total_records FROM nasa_retention_metadata
      WHERE data_type = ?
    `).bind(dataType).first();

    const currentRecords = result?.total_records || 0;
    const totalRecords = currentRecords + newRecords;

    // Update or insert metadata
    await db.prepare(`
      INSERT OR REPLACE INTO nasa_retention_metadata (
        data_type, retention_days, priority_level, last_cleanup,
        total_records, updated_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      dataType,
      90, // 90 days retention
      dataType === 'vessel_lights' ? 5 : 3, // Higher priority for vessel data
      null, // Last cleanup will be set during cleanup process
      totalRecords
    ).run();

    console.log(`[NASA Retention] Updated metadata for ${dataType}: ${totalRecords} total records`);
  } catch (error) {
    console.error('[NASA Retention] Metadata update error:', error);
    // Non-fatal error
  }
}

/**
 * Update daily statistics for performance optimization
 */
export async function updateDailyStats(db, date) {
  try {
    // Calculate averages for ocean color
    const oceanColorStats = await db.prepare(`
      SELECT
        AVG(chlorophyll_a) as avg_chlorophyll,
        MIN(latitude) as min_lat,
        MAX(latitude) as max_lat,
        MIN(longitude) as min_lon,
        MAX(longitude) as max_lon,
        COUNT(*) as data_points
      FROM nasa_ocean_color
      WHERE DATE(measurement_date) = DATE(?)
    `).bind(date).first();

    // Calculate averages for SST
    const sstStats = await db.prepare(`
      SELECT
        AVG(sst_celsius) as avg_sst,
        COUNT(*) as data_points
      FROM nasa_sst
      WHERE DATE(measurement_date) = DATE(?)
    `).bind(date).first();

    // Count vessel detections
    const vesselStats = await db.prepare(`
      SELECT COUNT(*) as vessel_detections
      FROM nasa_vessel_lights
      WHERE DATE(detection_date) = DATE(?)
    `).bind(date).first();

    // Calculate averages for salinity
    const salinityStats = await db.prepare(`
      SELECT AVG(salinity_psu) as avg_salinity
      FROM nasa_salinity
      WHERE DATE(measurement_date) = DATE(?)
    `).bind(date).first();

    // Store aggregated statistics
    await db.prepare(`
      INSERT OR REPLACE INTO nasa_daily_stats (
        date, data_type, avg_chlorophyll, avg_sst, avg_salinity,
        vessel_detections, min_lat, max_lat, min_lon, max_lon,
        data_points, quality_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      date,
      'daily_aggregate',
      oceanColorStats?.avg_chlorophyll,
      sstStats?.avg_sst,
      salinityStats?.avg_salinity,
      vesselStats?.vessel_detections || 0,
      oceanColorStats?.min_lat,
      oceanColorStats?.max_lat,
      oceanColorStats?.min_lon,
      oceanColorStats?.max_lon,
      (oceanColorStats?.data_points || 0) + (sstStats?.data_points || 0),
      0.95 // Default quality score
    ).run();

    console.log(`[NASA Retention] Updated daily statistics for ${date}`);
  } catch (error) {
    console.error('[NASA Retention] Daily stats update error:', error);
    // Non-fatal error
  }
}

/**
 * Clean up old data based on retention policy
 */
export async function cleanupOldData(db) {
  try {
    const retentionDays = 90; // Default retention period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffISO = cutoffDate.toISOString();

    // Clean ocean color data
    const oceanColorDeleted = await db.prepare(`
      DELETE FROM nasa_ocean_color
      WHERE measurement_date < ? AND within_angola_eez = false
    `).bind(cutoffISO).run();

    // Clean SST data
    const sstDeleted = await db.prepare(`
      DELETE FROM nasa_sst
      WHERE measurement_date < ? AND within_angola_eez = false
    `).bind(cutoffISO).run();

    // Clean vessel lights (shorter retention for non-EEZ)
    const vesselDeleted = await db.prepare(`
      DELETE FROM nasa_vessel_lights
      WHERE detection_date < ? AND within_angola_eez = false
    `).bind(cutoffISO).run();

    // Clean salinity data
    const salinityDeleted = await db.prepare(`
      DELETE FROM nasa_salinity
      WHERE measurement_date < ? AND within_angola_eez = false
    `).bind(cutoffISO).run();

    // Update retention metadata
    await db.prepare(`
      UPDATE nasa_retention_metadata
      SET last_cleanup = CURRENT_TIMESTAMP
      WHERE data_type IN ('ocean_color', 'sst', 'vessel_lights', 'salinity')
    `).run();

    console.log(`[NASA Retention] Cleanup completed:
      - Ocean color: ${oceanColorDeleted.meta.changes} records
      - SST: ${sstDeleted.meta.changes} records
      - Vessel lights: ${vesselDeleted.meta.changes} records
      - Salinity: ${salinityDeleted.meta.changes} records`);

    return {
      ocean_color: oceanColorDeleted.meta.changes,
      sst: sstDeleted.meta.changes,
      vessel_lights: vesselDeleted.meta.changes,
      salinity: salinityDeleted.meta.changes
    };
  } catch (error) {
    console.error('[NASA Retention] Cleanup error:', error);
    throw error;
  }
}

/**
 * Initialize NASA retention tables
 */
export async function initializeRetentionTables(db) {
  try {
    // Read and execute the schema SQL
    const schemaSQL = `
      -- NASA Ocean color measurements table
      CREATE TABLE IF NOT EXISTS nasa_ocean_color (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        measurement_date DATETIME NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        chlorophyll_a REAL,
        turbidity REAL,
        water_leaving_radiance TEXT,
        quality_flags INTEGER,
        dataset_id TEXT NOT NULL,
        granule_id TEXT,
        processing_level TEXT DEFAULT 'L2',
        within_angola_eez BOOLEAN DEFAULT true,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(measurement_date, latitude, longitude, dataset_id)
      );

      -- NASA SST measurements table
      CREATE TABLE IF NOT EXISTS nasa_sst (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        measurement_date DATETIME NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        sst_celsius REAL NOT NULL,
        sst_quality INTEGER,
        sst_anomaly REAL,
        wind_speed REAL,
        dataset_id TEXT NOT NULL,
        granule_id TEXT,
        sensor TEXT,
        processing_level TEXT DEFAULT 'L3',
        within_angola_eez BOOLEAN DEFAULT true,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(measurement_date, latitude, longitude, sensor)
      );

      -- NASA Salinity measurements table
      CREATE TABLE IF NOT EXISTS nasa_salinity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        measurement_date DATETIME NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        salinity_psu REAL NOT NULL,
        salinity_uncertainty REAL,
        wind_speed REAL,
        rain_rate REAL,
        dataset_id TEXT NOT NULL,
        granule_id TEXT,
        within_angola_eez BOOLEAN DEFAULT true,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(measurement_date, latitude, longitude)
      );

      -- NASA Vessel lights detection table
      CREATE TABLE IF NOT EXISTS nasa_vessel_lights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        detection_date DATETIME NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        radiance REAL NOT NULL,
        confidence_score REAL,
        vessel_type TEXT,
        estimated_size TEXT,
        dataset_id TEXT NOT NULL,
        granule_id TEXT,
        within_angola_eez BOOLEAN DEFAULT true,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(detection_date, latitude, longitude)
      );

      -- NASA retention metadata table
      CREATE TABLE IF NOT EXISTS nasa_retention_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data_type TEXT NOT NULL,
        retention_days INTEGER DEFAULT 90,
        priority_level INTEGER DEFAULT 1,
        last_cleanup DATETIME,
        total_records INTEGER,
        compressed_records INTEGER,
        compression_ratio REAL,
        ml_processed BOOLEAN DEFAULT false,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- NASA daily statistics table
      CREATE TABLE IF NOT EXISTS nasa_daily_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        data_type TEXT NOT NULL,
        avg_chlorophyll REAL,
        avg_sst REAL,
        avg_salinity REAL,
        vessel_detections INTEGER,
        min_lat REAL,
        max_lat REAL,
        min_lon REAL,
        max_lon REAL,
        data_points INTEGER,
        quality_score REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, data_type)
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_ocean_color_date ON nasa_ocean_color(measurement_date);
      CREATE INDEX IF NOT EXISTS idx_ocean_color_location ON nasa_ocean_color(latitude, longitude);
      CREATE INDEX IF NOT EXISTS idx_sst_date ON nasa_sst(measurement_date);
      CREATE INDEX IF NOT EXISTS idx_sst_location ON nasa_sst(latitude, longitude);
      CREATE INDEX IF NOT EXISTS idx_salinity_date ON nasa_salinity(measurement_date);
      CREATE INDEX IF NOT EXISTS idx_salinity_location ON nasa_salinity(latitude, longitude);
      CREATE INDEX IF NOT EXISTS idx_vessel_lights_date ON nasa_vessel_lights(detection_date);
      CREATE INDEX IF NOT EXISTS idx_vessel_lights_location ON nasa_vessel_lights(latitude, longitude);
      CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON nasa_daily_stats(date, data_type);
    `;

    // Execute schema creation
    const statements = schemaSQL.split(';').filter(s => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await db.prepare(statement).run();
      }
    }

    console.log('[NASA Retention] Tables initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('[NASA Retention] Table initialization error:', error);
    throw error;
  }
}

/**
 * Unified data retention handler for all oceanographic data
 */
export async function handleUnifiedRetention(db, source, dataType, data, date) {
  try {
    console.log(`[Unified Retention] Processing ${source} ${dataType} data`);

    switch (source) {
      case 'nasa':
        switch (dataType) {
          case 'ocean_color':
            return await storeOceanColorData(db, data, date);
          case 'sst':
            return await storeSSTData(db, data, date);
          case 'vessel_lights':
            return await storeVesselLightsData(db, data, date);
          case 'salinity':
            return await storeSalinityData(db, data, date);
          default:
            throw new Error(`Unknown NASA data type: ${dataType}`);
        }

      case 'copernicus':
        // Implement Copernicus retention (similar pattern)
        console.log('[Unified Retention] Copernicus retention to be implemented');
        break;

      case 'gfw':
        // Implement GFW retention (similar pattern)
        console.log('[Unified Retention] GFW retention to be implemented');
        break;

      default:
        throw new Error(`Unknown data source: ${source}`);
    }

    // Update daily statistics after storing data
    await updateDailyStats(db, date);

    return { success: true };
  } catch (error) {
    console.error(`[Unified Retention] Error processing ${source} ${dataType}:`, error);
    throw error;
  }
}
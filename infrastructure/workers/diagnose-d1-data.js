/**
 * D1 Database Diagnostic Tool
 * Verifica estado das tabelas, qualidade dos dados e cobertura espacial
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/diagnose' && request.method === 'GET') {
      return handleDiagnosis(env);
    }

    return new Response('D1 Diagnostic Tool. GET /diagnose to run diagnostics.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};

async function handleDiagnosis(env) {
  const diagnosis = {
    timestamp: new Date().toISOString(),
    database: 'bgapp-data',
    tables: {},
    summary: {
      total_records: 0,
      tables_with_data: 0,
      tables_empty: 0,
      oldest_data: null,
      newest_data: null
    },
    spatial_coverage: {},
    quality_metrics: {},
    recommendations: []
  };

  try {
    // Angola EEZ bounds for spatial analysis
    const angolaBounds = {
      minLat: -18.02,
      maxLat: -5.55,
      minLon: 8.9,
      maxLon: 13.35
    };

    // Check sst_data table
    diagnosis.tables.sst_data = await analyzeTable(
      env.BGAPP_DATA,
      'sst_data',
      'temperature',
      angolaBounds,
      { min: 15, max: 32 } // Valid SST range for Angola
    );

    // Check ocean_color_data table
    diagnosis.tables.ocean_color_data = await analyzeTable(
      env.BGAPP_DATA,
      'ocean_color_data',
      'chlorophyll_a',
      angolaBounds,
      { min: 0.01, max: 100 } // Valid chlorophyll range
    );

    // Check salinity_data table
    diagnosis.tables.salinity_data = await analyzeTable(
      env.BGAPP_DATA,
      'salinity_data',
      'salinity',
      angolaBounds,
      { min: 30, max: 37 } // Valid salinity range for Angola
    );

    // Check vessel_lights_data table
    diagnosis.tables.vessel_lights_data = await analyzeTable(
      env.BGAPP_DATA,
      'vessel_lights_data',
      'radiance',
      angolaBounds,
      { min: 0, max: 1000 } // Valid radiance range
    );

    // Check ml_predictions table
    diagnosis.tables.ml_predictions = await analyzeTable(
      env.BGAPP_DATA,
      'ml_predictions',
      'confidence',
      angolaBounds,
      { min: 0, max: 1 } // Confidence should be 0-1
    );

    // Calculate summary statistics
    for (const [tableName, tableData] of Object.entries(diagnosis.tables)) {
      diagnosis.summary.total_records += tableData.record_count;
      
      if (tableData.record_count > 0) {
        diagnosis.summary.tables_with_data++;
        
        // Track oldest and newest data
        if (!diagnosis.summary.oldest_data || tableData.oldest_record < diagnosis.summary.oldest_data) {
          diagnosis.summary.oldest_data = tableData.oldest_record;
        }
        if (!diagnosis.summary.newest_data || tableData.newest_record > diagnosis.summary.newest_data) {
          diagnosis.summary.newest_data = tableData.newest_record;
        }
      } else {
        diagnosis.summary.tables_empty++;
      }
    }

    // Generate recommendations
    diagnosis.recommendations = generateRecommendations(diagnosis);

    // Calculate spatial coverage for Angola EEZ
    diagnosis.spatial_coverage = await calculateSpatialCoverage(env.BGAPP_DATA, angolaBounds);

    return new Response(JSON.stringify(diagnosis, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Diagnosis failed',
      message: error.message,
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function analyzeTable(db, tableName, valueColumn, bounds, validRange) {
  const analysis = {
    table_name: tableName,
    record_count: 0,
    oldest_record: null,
    newest_record: null,
    value_stats: {
      min: null,
      max: null,
      avg: null
    },
    quality_stats: {
      high_quality: 0,
      medium_quality: 0,
      low_quality: 0
    },
    spatial_distribution: {
      in_angola_eez: 0,
      outside_eez: 0
    },
    data_sources: {},
    issues: []
  };

  try {
    // Check if table exists and get record count
    const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
    const countResult = await db.prepare(countQuery).first();
    analysis.record_count = countResult?.count || 0;

    if (analysis.record_count === 0) {
      analysis.issues.push(`Table ${tableName} is empty`);
      return analysis;
    }

    // Get timestamp range
    const timestampQuery = `
      SELECT 
        MIN(timestamp) as oldest,
        MAX(timestamp) as newest
      FROM ${tableName}
    `;
    const timestampResult = await db.prepare(timestampQuery).first();
    analysis.oldest_record = timestampResult?.oldest;
    analysis.newest_record = timestampResult?.newest;

    // Check data freshness
    if (analysis.newest_record) {
      const newestDate = new Date(analysis.newest_record);
      const ageHours = (Date.now() - newestDate.getTime()) / (1000 * 60 * 60);
      if (ageHours > 48) {
        analysis.issues.push(`Data is ${Math.round(ageHours)} hours old (> 48h)`);
      }
    }

    // Get value statistics
    const valueQuery = `
      SELECT 
        MIN(${valueColumn}) as min_val,
        MAX(${valueColumn}) as max_val,
        AVG(${valueColumn}) as avg_val
      FROM ${tableName}
    `;
    const valueResult = await db.prepare(valueQuery).first();
    analysis.value_stats.min = valueResult?.min_val;
    analysis.value_stats.max = valueResult?.max_val;
    analysis.value_stats.avg = valueResult?.avg_val;

    // Check for invalid values
    if (analysis.value_stats.min < validRange.min || analysis.value_stats.max > validRange.max) {
      analysis.issues.push(`Values outside valid range (${validRange.min}-${validRange.max})`);
    }

    // Check quality distribution (if quality_flag column exists)
    try {
      const qualityQuery = `
        SELECT quality_flag, COUNT(*) as count
        FROM ${tableName}
        GROUP BY quality_flag
      `;
      const qualityResults = await db.prepare(qualityQuery).all();
      
      for (const row of qualityResults.results || []) {
        if (row.quality_flag >= 3) {
          analysis.quality_stats.high_quality += row.count;
        } else if (row.quality_flag >= 1) {
          analysis.quality_stats.medium_quality += row.count;
        } else {
          analysis.quality_stats.low_quality += row.count;
        }
      }
    } catch (e) {
      // quality_flag column might not exist
      analysis.issues.push('quality_flag column not found or not indexed');
    }

    // Check spatial distribution
    const spatialQuery = `
      SELECT 
        SUM(CASE 
          WHEN latitude BETWEEN ? AND ? 
          AND longitude BETWEEN ? AND ?
          THEN 1 ELSE 0 END) as in_eez,
        SUM(CASE 
          WHEN latitude NOT BETWEEN ? AND ? 
          OR longitude NOT BETWEEN ? AND ?
          THEN 1 ELSE 0 END) as outside_eez
      FROM ${tableName}
    `;
    const spatialResult = await db.prepare(spatialQuery)
      .bind(
        bounds.minLat, bounds.maxLat, bounds.minLon, bounds.maxLon,
        bounds.minLat, bounds.maxLat, bounds.minLon, bounds.maxLon
      )
      .first();
    
    analysis.spatial_distribution.in_angola_eez = spatialResult?.in_eez || 0;
    analysis.spatial_distribution.outside_eez = spatialResult?.outside_eez || 0;

    // Get data source distribution
    try {
      const sourceQuery = `
        SELECT data_source, COUNT(*) as count
        FROM ${tableName}
        GROUP BY data_source
      `;
      const sourceResults = await db.prepare(sourceQuery).all();
      
      for (const row of sourceResults.results || []) {
        analysis.data_sources[row.data_source] = row.count;
      }
    } catch (e) {
      // data_source column might not exist
    }

    // Check spatial density
    const densityCheck = analysis.record_count / ((bounds.maxLat - bounds.minLat) * (bounds.maxLon - bounds.minLon));
    if (densityCheck < 10) { // Less than 10 points per square degree
      analysis.issues.push(`Low spatial density: ${densityCheck.toFixed(2)} points/degree²`);
    }

  } catch (error) {
    analysis.issues.push(`Analysis error: ${error.message}`);
  }

  return analysis;
}

async function calculateSpatialCoverage(db, bounds) {
  const coverage = {
    total_area_deg2: (bounds.maxLat - bounds.minLat) * (bounds.maxLon - bounds.minLon),
    grid_resolution: 0.1, // 0.1 degree grid cells
    cells_with_data: {},
    coverage_percent: {}
  };

  const gridSize = coverage.grid_resolution;
  const latCells = Math.ceil((bounds.maxLat - bounds.minLat) / gridSize);
  const lonCells = Math.ceil((bounds.maxLon - bounds.minLon) / gridSize);
  const totalCells = latCells * lonCells;

  // Check coverage for each table
  const tables = ['sst_data', 'ocean_color_data', 'salinity_data', 'vessel_lights_data'];
  
  for (const table of tables) {
    try {
      // Count distinct grid cells with data
      const coverageQuery = `
        SELECT COUNT(DISTINCT 
          CAST((latitude - ?) / ? AS INTEGER) || ',' || 
          CAST((longitude - ?) / ? AS INTEGER)
        ) as cells
        FROM ${table}
        WHERE latitude BETWEEN ? AND ?
          AND longitude BETWEEN ? AND ?
      `;
      
      const result = await db.prepare(coverageQuery)
        .bind(
          bounds.minLat, gridSize,
          bounds.minLon, gridSize,
          bounds.minLat, bounds.maxLat,
          bounds.minLon, bounds.maxLon
        )
        .first();
      
      coverage.cells_with_data[table] = result?.cells || 0;
      coverage.coverage_percent[table] = ((coverage.cells_with_data[table] / totalCells) * 100).toFixed(2);
      
    } catch (error) {
      coverage.cells_with_data[table] = 0;
      coverage.coverage_percent[table] = '0.00';
    }
  }

  return coverage;
}

function generateRecommendations(diagnosis) {
  const recommendations = [];

  // Check if database is empty
  if (diagnosis.summary.total_records === 0) {
    recommendations.push({
      priority: 'CRITICAL',
      issue: 'Database is completely empty',
      action: 'Run initial data population: POST /populate on nasa-data-populator worker'
    });
    return recommendations;
  }

  // Check data freshness
  if (diagnosis.summary.newest_data) {
    const newestDate = new Date(diagnosis.summary.newest_data);
    const ageHours = (Date.now() - newestDate.getTime()) / (1000 * 60 * 60);
    
    if (ageHours > 48) {
      recommendations.push({
        priority: 'HIGH',
        issue: `Data is ${Math.round(ageHours)} hours old`,
        action: 'Update data: POST /populate or setup scheduled refresh'
      });
    }
  }

  // Check spatial coverage
  for (const [table, coverage] of Object.entries(diagnosis.spatial_coverage.coverage_percent)) {
    const coverageNum = parseFloat(coverage);
    if (coverageNum < 30) {
      recommendations.push({
        priority: 'HIGH',
        issue: `${table} has only ${coverage}% spatial coverage`,
        action: 'Increase data point density - aim for >50% coverage'
      });
    }
  }

  // Check record counts
  for (const [tableName, tableData] of Object.entries(diagnosis.tables)) {
    if (tableData.record_count === 0) {
      recommendations.push({
        priority: 'HIGH',
        issue: `${tableName} is empty`,
        action: `Populate ${tableName} with real data from NASA/Copernicus`
      });
    } else if (tableData.record_count < 500) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: `${tableName} has only ${tableData.record_count} records`,
        action: 'Increase data density to 1500-2000 points for better visualization'
      });
    }
  }

  // Check data quality
  for (const [tableName, tableData] of Object.entries(diagnosis.tables)) {
    const totalQuality = tableData.quality_stats.high_quality + 
                        tableData.quality_stats.medium_quality + 
                        tableData.quality_stats.low_quality;
    
    if (totalQuality > 0) {
      const highQualityPercent = (tableData.quality_stats.high_quality / totalQuality) * 100;
      if (highQualityPercent < 70) {
        recommendations.push({
          priority: 'MEDIUM',
          issue: `${tableName} has only ${highQualityPercent.toFixed(1)}% high quality data`,
          action: 'Filter for quality_flag >= 3 during population'
        });
      }
    }
  }

  // If no issues found
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'INFO',
      issue: 'Database appears healthy',
      action: 'Continue monitoring and maintain scheduled updates'
    });
  }

  return recommendations;
}


/**
 * BGAPP - Blue Justice Vessel Data Populator
 *
 * Populates D1 database with simulated vessel tracking data to demonstrate
 * Blue Justice program integration capabilities for December 2025 presentation.
 *
 * Blue Justice Context:
 * - INTERPOL-led initiative to combat transnational organized crime in fisheries
 * - Angola signed Copenhagen Declaration (March 2023)
 * - Focus: IUU fishing, vessel tracking, law enforcement coordination
 *
 * Data Categories:
 * 1. Legitimate fishing vessels (Angola-flagged, licensed)
 * 2. Suspicious foreign vessels (IUU risk indicators)
 * 3. Cargo/tanker vessels (background traffic)
 * 4. Patrol/enforcement vessels (Angola authorities)
 *
 * Deployment: wrangler deploy populate-blue-justice-vessels.js --config populate-blue-justice-vessels.toml
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Route: /populate - Trigger data population
    if (pathname === '/populate' && request.method === 'POST') {
      try {
        const results = await populateBlueJusticeData(env);
        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Population error:', error);
        return new Response(JSON.stringify({
          error: error.message,
          stack: error.stack
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Route: /status - Check population status
    if (pathname === '/status') {
      try {
        const status = await getPopulationStatus(env);
        return new Response(JSON.stringify(status), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Default response
    return new Response(JSON.stringify({
      service: 'Blue Justice Vessel Data Populator',
      version: '1.0.0',
      endpoints: {
        'POST /populate': 'Populate database with Blue Justice vessel data',
        'GET /status': 'Check current database status'
      },
      blueJusticeInfo: {
        program: 'INTERPOL Blue Justice Initiative',
        focus: 'Combat IUU fishing and transnational organized crime',
        angolaStatus: 'Copenhagen Declaration signatory (March 2023)'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Main population function
 */
async function populateBlueJusticeData(env) {
  const results = {
    timestamp: new Date().toISOString(),
    vesselsCreated: 0,
    fishingEventsCreated: 0,
    vesselPresenceCreated: 0,
    errors: []
  };

  try {
    // 1. Populate vessel_data
    const vessels = await populateVesselData(env);
    results.vesselsCreated = vessels;

    // 2. Populate fishing_events
    const events = await populateFishingEvents(env);
    results.fishingEventsCreated = events;

    // 3. Populate vessel_presence (heatmap data)
    const presence = await populateVesselPresence(env);
    results.vesselPresenceCreated = presence;

    results.status = 'success';
    results.message = `Successfully populated Blue Justice demonstration data`;
  } catch (error) {
    results.status = 'error';
    results.errors.push(error.message);
    throw error;
  }

  return results;
}

/**
 * Populate vessel_data table with realistic vessel tracking data
 */
async function populateVesselData(env) {
  // Angola EEZ boundaries (approximate)
  const angolaEEZ = {
    minLat: -17.5,
    maxLat: -5.0,
    minLon: 8.0,
    maxLon: 14.0
  };

  const vessels = [];
  const now = new Date();

  // Category 1: Angola-flagged legitimate fishing vessels (20 vessels)
  const angolanVessels = [
    'LUANDA PESCADOR I', 'BENGUELA FISH II', 'NAMIBE OCEAN III',
    'LOBITO MARINHO IV', 'PORTO AMBOIM V', 'SOYO ATLANTIC VI',
    'CABINDA FISHING VII', 'TOMBUA OCEANIC VIII', 'LUCIRA MARITIME IX',
    'BAIA FARTA X', 'MOÇÂMEDES XI', 'CAOTA XII', 'AMBRIZ XIII',
    'SUMBE XIV', 'NOVO REDONDO XV', 'DANDE XVI', 'QUICOMBO XVII',
    'AMBRIZETE XVIII', 'CUANZA XIX', 'CATUMBELA XX'
  ];

  for (let i = 0; i < 20; i++) {
    const vesselId = `AO-FISH-${String(i + 1).padStart(4, '0')}`;
    const mmsi = `603${String(1000000 + i).slice(1)}`; // Angola MMSI prefix: 603

    // Generate positions over last 24 hours
    for (let hour = 0; hour < 24; hour++) {
      const timestamp = new Date(now.getTime() - (hour * 3600000));
      const lat = angolaEEZ.minLat + Math.random() * (angolaEEZ.maxLat - angolaEEZ.minLat);
      const lon = angolaEEZ.minLon + Math.random() * (angolaEEZ.maxLon - angolaEEZ.minLon);

      vessels.push({
        vessel_id: vesselId,
        mmsi: mmsi,
        vessel_name: angolanVessels[i],
        vessel_type: 'fishing',
        flag: 'AGO',
        latitude: lat,
        longitude: lon,
        timestamp: timestamp.toISOString(),
        speed: 3 + Math.random() * 5, // 3-8 knots (fishing speed)
        heading: Math.random() * 360,
        data_source: 'blue_justice',
        fishing_activity_probability: 0.7 + Math.random() * 0.3, // High fishing probability
        in_eez: 'AGO',
        distance_from_port: 10 + Math.random() * 80,
        metadata: JSON.stringify({
          license_status: 'valid',
          license_number: `AGO-FL-2025-${i + 1}`,
          vessel_length: 15 + Math.random() * 20,
          crew_size: 8 + Math.floor(Math.random() * 12),
          gear_type: ['trawl', 'longline', 'gillnet'][Math.floor(Math.random() * 3)],
          blue_justice_verified: true
        })
      });
    }
  }

  // Category 2: Suspicious foreign vessels (10 vessels - IUU risk indicators)
  const suspiciousFlags = ['CHN', 'KOR', 'ESP', 'PRT', 'THA'];
  const suspiciousVessels = [
    'OCEAN FORTUNE', 'SEA HARVEST', 'PACIFIC GLORY', 'NEPTUNE STAR',
    'BLUE MARLIN', 'GOLDEN CATCH', 'SILVER WAVE', 'EASTERN WIND',
    'SOUTH ATLANTIC', 'DEEPWATER KING'
  ];

  for (let i = 0; i < 10; i++) {
    const vesselId = `IUU-SUSPECT-${String(i + 1).padStart(4, '0')}`;
    const flag = suspiciousFlags[Math.floor(Math.random() * suspiciousFlags.length)];
    const mmsi = `${flag === 'CHN' ? '412' : flag === 'KOR' ? '440' : '224'}${String(1000000 + i).slice(1)}`;

    // Generate suspicious patterns: operating at night, near EEZ border
    for (let hour = 0; hour < 24; hour++) {
      const timestamp = new Date(now.getTime() - (hour * 3600000));

      // Position near EEZ border (suspicious behavior)
      const borderLat = angolaEEZ.maxLat - 0.5 + Math.random();
      const borderLon = angolaEEZ.maxLon - 0.5 + Math.random();

      vessels.push({
        vessel_id: vesselId,
        mmsi: mmsi,
        vessel_name: suspiciousVessels[i],
        vessel_type: 'fishing',
        flag: flag,
        latitude: borderLat,
        longitude: borderLon,
        timestamp: timestamp.toISOString(),
        speed: hour >= 18 || hour <= 6 ? 8 + Math.random() * 4 : 2 + Math.random() * 2, // High speed at night
        heading: Math.random() * 360,
        data_source: 'blue_justice',
        fishing_activity_probability: hour >= 18 || hour <= 6 ? 0.9 : 0.3, // Night fishing
        in_eez: Math.random() > 0.3 ? 'AGO' : null, // Sometimes outside EEZ
        distance_from_port: 100 + Math.random() * 150,
        metadata: JSON.stringify({
          license_status: 'none',
          blue_justice_flag: 'high_risk',
          risk_indicators: [
            'no_fishing_license',
            'ais_gaps_detected',
            'night_operations',
            'eez_border_crossing'
          ],
          interpol_watchlist: Math.random() > 0.6,
          last_port_call: Math.random() > 0.5 ? 'Unknown' : 'Outside Angola',
          vessel_length: 40 + Math.random() * 30
        })
      });
    }
  }

  // Category 3: Cargo and tanker vessels (5 vessels - background traffic)
  const cargoVessels = ['ATLANTIC TRADER', 'LUANDA EXPRESS', 'BENGUELA CARRIER'];

  for (let i = 0; i < 5; i++) {
    const vesselType = i < 3 ? 'cargo' : 'tanker';
    const vesselId = `${vesselType.toUpperCase()}-${String(i + 1).padStart(4, '0')}`;

    for (let hour = 0; hour < 24; hour++) {
      const timestamp = new Date(now.getTime() - (hour * 3600000));
      const lat = angolaEEZ.minLat + Math.random() * (angolaEEZ.maxLat - angolaEEZ.minLat);
      const lon = angolaEEZ.minLon + Math.random() * (angolaEEZ.maxLon - angolaEEZ.minLon);

      vessels.push({
        vessel_id: vesselId,
        mmsi: `603${String(5000000 + i).slice(1)}`,
        vessel_name: i < cargoVessels.length ? cargoVessels[i] : `TANKER ${i + 1}`,
        vessel_type: vesselType,
        flag: 'AGO',
        latitude: lat,
        longitude: lon,
        timestamp: timestamp.toISOString(),
        speed: 10 + Math.random() * 5, // 10-15 knots
        heading: Math.random() * 360,
        data_source: 'ais',
        fishing_activity_probability: 0.0,
        in_eez: 'AGO',
        distance_from_port: 5 + Math.random() * 50,
        metadata: JSON.stringify({
          cargo_type: vesselType === 'tanker' ? 'petroleum' : 'general',
          route: 'coastal',
          vessel_length: 80 + Math.random() * 100
        })
      });
    }
  }

  // Category 4: Patrol vessels (Angola authorities - 3 vessels)
  for (let i = 0; i < 3; i++) {
    const vesselId = `AGO-PATROL-${String(i + 1).padStart(4, '0')}`;

    for (let hour = 0; hour < 24; hour++) {
      const timestamp = new Date(now.getTime() - (hour * 3600000));

      // Patrol near suspicious vessels or key areas
      const lat = angolaEEZ.maxLat - 1 + Math.random() * 0.5;
      const lon = angolaEEZ.maxLon - 1 + Math.random() * 0.5;

      vessels.push({
        vessel_id: vesselId,
        mmsi: `603${String(9000000 + i).slice(1)}`,
        vessel_name: `PATROL VESSEL ${i + 1}`,
        vessel_type: 'patrol',
        flag: 'AGO',
        latitude: lat,
        longitude: lon,
        timestamp: timestamp.toISOString(),
        speed: 12 + Math.random() * 8, // 12-20 knots
        heading: Math.random() * 360,
        data_source: 'blue_justice',
        fishing_activity_probability: 0.0,
        in_eez: 'AGO',
        distance_from_port: 20 + Math.random() * 100,
        metadata: JSON.stringify({
          authority: 'Angola Marine Authority',
          mission: 'IUU Fishing Patrol',
          blue_justice_coordination: true,
          equipment: ['radar', 'boarding_team', 'communications'],
          vessel_length: 25 + Math.random() * 15
        })
      });
    }
  }

  // Insert vessels using D1 batch API
  const batchSize = 50; // Smaller batches to avoid rate limits
  let inserted = 0;

  for (let i = 0; i < vessels.length; i += batchSize) {
    const batch = vessels.slice(i, i + batchSize);
    const statements = batch.map(vessel =>
      env.BGAPP_DATA.prepare(`
        INSERT INTO vessel_data (
          vessel_id, mmsi, vessel_name, vessel_type, flag,
          latitude, longitude, timestamp, speed, heading,
          data_source, fishing_activity_probability, in_eez,
          distance_from_port, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        vessel.vessel_id, vessel.mmsi, vessel.vessel_name, vessel.vessel_type,
        vessel.flag, vessel.latitude, vessel.longitude, vessel.timestamp,
        vessel.speed, vessel.heading, vessel.data_source,
        vessel.fishing_activity_probability, vessel.in_eez,
        vessel.distance_from_port, vessel.metadata
      )
    );

    await env.BGAPP_DATA.batch(statements);
    inserted += batch.length;
  }

  return inserted;
}

/**
 * Populate fishing_events table
 */
async function populateFishingEvents(env) {
  const events = [];
  const now = new Date();

  // Create fishing events for last 7 days
  for (let day = 0; day < 7; day++) {
    const eventDate = new Date(now.getTime() - (day * 86400000));

    // Legitimate fishing events (Angola vessels)
    for (let i = 0; i < 10; i++) {
      const vesselId = `AO-FISH-${String(i + 1).padStart(4, '0')}`;
      const duration = 2 + Math.random() * 6; // 2-8 hours
      const startTime = new Date(eventDate.getTime() + Math.random() * 86400000);
      const endTime = new Date(startTime.getTime() + (duration * 3600000));

      events.push({
        vessel_id: vesselId,
        event_type: 'fishing',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        start_latitude: -12 + Math.random() * 5,
        start_longitude: 10 + Math.random() * 3,
        end_latitude: -12 + Math.random() * 5,
        end_longitude: 10 + Math.random() * 3,
        duration_hours: duration,
        confidence_score: 0.85 + Math.random() * 0.15,
        in_eez: 'AGO',
        in_mpa: null,
        metadata: JSON.stringify({
          gear_deployed: true,
          catch_reported: true,
          blue_justice_compliant: true
        })
      });
    }

    // Suspicious events (IUU vessels)
    for (let i = 0; i < 5; i++) {
      const vesselId = `IUU-SUSPECT-${String(i + 1).padStart(4, '0')}`;
      const duration = 4 + Math.random() * 8; // 4-12 hours (longer, suspicious)
      const startTime = new Date(eventDate.getTime() + (18 * 3600000) + Math.random() * 21600000); // Night time
      const endTime = new Date(startTime.getTime() + (duration * 3600000));

      events.push({
        vessel_id: vesselId,
        event_type: Math.random() > 0.7 ? 'loitering' : 'fishing',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        start_latitude: -5.5 + Math.random() * 0.5,
        start_longitude: 13.5 + Math.random() * 0.5,
        end_latitude: -5.5 + Math.random() * 0.5,
        end_longitude: 13.5 + Math.random() * 0.5,
        duration_hours: duration,
        confidence_score: 0.9 + Math.random() * 0.1,
        in_eez: Math.random() > 0.3 ? 'AGO' : null,
        in_mpa: null,
        metadata: JSON.stringify({
          blue_justice_alert: true,
          risk_level: 'high',
          night_operations: true,
          ais_gaps: Math.random() > 0.5,
          unlicensed_activity: true
        })
      });
    }

    // Encounter events (patrol vessels intercepting suspicious vessels)
    if (day < 3) {
      const patrolId = `AGO-PATROL-${String((day % 3) + 1).padStart(4, '0')}`;
      const suspectId = `IUU-SUSPECT-${String((day % 5) + 1).padStart(4, '0')}`;
      const encounterTime = new Date(eventDate.getTime() + (10 * 3600000));

      events.push({
        vessel_id: suspectId,
        event_type: 'encounter',
        start_time: encounterTime.toISOString(),
        end_time: new Date(encounterTime.getTime() + 7200000).toISOString(), // 2 hours
        start_latitude: -5.7,
        start_longitude: 13.7,
        end_latitude: -5.7,
        end_longitude: 13.7,
        duration_hours: 2,
        confidence_score: 1.0,
        in_eez: 'AGO',
        in_mpa: null,
        metadata: JSON.stringify({
          encounter_with: patrolId,
          blue_justice_operation: true,
          boarding_conducted: true,
          violations_found: ['no_license', 'illegal_gear'],
          enforcement_action: 'vessel_detained',
          interpol_coordination: true
        })
      });
    }
  }

  // Insert events using D1 batch API
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    const statements = batch.map(event =>
      env.BGAPP_DATA.prepare(`
        INSERT INTO fishing_events (
          vessel_id, event_type, start_time, end_time,
          start_latitude, start_longitude, end_latitude, end_longitude,
          duration_hours, confidence_score, in_eez, in_mpa, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        event.vessel_id, event.event_type, event.start_time, event.end_time,
        event.start_latitude, event.start_longitude, event.end_latitude,
        event.end_longitude, event.duration_hours, event.confidence_score,
        event.in_eez, event.in_mpa, event.metadata
      )
    );

    await env.BGAPP_DATA.batch(statements);
    inserted += batch.length;
  }

  return inserted;
}

/**
 * Populate vessel_presence table (for heatmaps)
 */
async function populateVesselPresence(env) {
  const presence = [];
  const now = new Date();

  // Create grid cells for Angola EEZ (0.5 degree grid)
  const gridCells = [];
  for (let lat = -17.5; lat < -5.0; lat += 0.5) {
    for (let lon = 8.0; lon < 14.0; lon += 0.5) {
      gridCells.push({
        lat: lat + 0.25,
        lon: lon + 0.25,
        id: `grid_${lat.toFixed(1)}_${lon.toFixed(1)}`
      });
    }
  }

  // Generate hourly presence data for last 24 hours
  for (let hour = 0; hour < 24; hour++) {
    const timestamp = new Date(now.getTime() - (hour * 3600000));

    for (const cell of gridCells) {
      // Vary vessel density based on location and time
      const isNearCoast = cell.lon < 10;
      const isNightTime = hour >= 18 || hour <= 6;

      let vesselCount = Math.floor(Math.random() * 5);
      let fishingVesselCount = Math.floor(Math.random() * 3);

      // Higher density near coast during day
      if (isNearCoast && !isNightTime) {
        vesselCount += Math.floor(Math.random() * 10);
        fishingVesselCount += Math.floor(Math.random() * 7);
      }

      // Suspicious activity at night, far from coast
      if (!isNearCoast && isNightTime) {
        fishingVesselCount += Math.floor(Math.random() * 5);
      }

      if (vesselCount > 0) {
        presence.push({
          grid_cell_id: cell.id,
          latitude: cell.lat,
          longitude: cell.lon,
          vessel_count: vesselCount,
          fishing_vessel_count: fishingVesselCount,
          time_period: 'hour',
          timestamp: timestamp.toISOString(),
          data_source: 'blue_justice',
          metadata: JSON.stringify({
            legitimate_vessels: Math.floor(fishingVesselCount * 0.6),
            suspicious_vessels: Math.floor(fishingVesselCount * 0.4),
            patrol_coverage: isNearCoast ? 'high' : 'medium'
          })
        });
      }
    }
  }

  // Insert presence data using D1 batch API
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < presence.length; i += batchSize) {
    const batch = presence.slice(i, i + batchSize);
    const statements = batch.map(p =>
      env.BGAPP_DATA.prepare(`
        INSERT INTO vessel_presence (
          grid_cell_id, latitude, longitude, vessel_count,
          fishing_vessel_count, time_period, timestamp,
          data_source, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        p.grid_cell_id, p.latitude, p.longitude, p.vessel_count,
        p.fishing_vessel_count, p.time_period, p.timestamp,
        p.data_source, p.metadata
      )
    );

    await env.BGAPP_DATA.batch(statements);
    inserted += batch.length;
  }

  return inserted;
}

/**
 * Get current database status
 */
async function getPopulationStatus(env) {
  const vesselCount = await env.BGAPP_DATA.prepare(
    'SELECT COUNT(*) as count FROM vessel_data'
  ).first();

  const eventCount = await env.BGAPP_DATA.prepare(
    'SELECT COUNT(*) as count FROM fishing_events'
  ).first();

  const presenceCount = await env.BGAPP_DATA.prepare(
    'SELECT COUNT(*) as count FROM vessel_presence'
  ).first();

  const vesselTypes = await env.BGAPP_DATA.prepare(
    'SELECT vessel_type, COUNT(*) as count FROM vessel_data GROUP BY vessel_type'
  ).all();

  return {
    timestamp: new Date().toISOString(),
    vessel_data: {
      total_records: vesselCount.count,
      by_type: vesselTypes.results
    },
    fishing_events: {
      total_records: eventCount.count
    },
    vessel_presence: {
      total_records: presenceCount.count
    }
  };
}

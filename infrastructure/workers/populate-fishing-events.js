/**
 * Fishing Events Populator Worker
 * Generates and populates fishing events data for Angola EEZ
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === '/populate' && request.method === 'POST') {
      try {
        console.log('🎣 Starting fishing events population...');

        // First, check if table exists and current count
        try {
          const checkTable = await env.DB.prepare('SELECT COUNT(*) as count FROM fishing_events').first();
          console.log('Current fishing_events count:', checkTable.count);
        } catch (error) {
          console.error('Error checking table:', error);
        }

        // Angola EEZ bounds
        const angolaEEZ = {
          north: -4.376,
          south: -18.042,
          east: 13.377,
          west: 11.679
        };

        // Event types
        const eventTypes = [
          'fishing_activity',
          'transiting',
          'port_visit',
          'anchoring',
          'suspected_fishing'
        ];

        // Fishing zones
        const fishingZones = [
          { name: 'north_coastal', lat_range: [-4.376, -8], lon_range: [11.679, 12.5] },
          { name: 'central_coastal', lat_range: [-8, -12], lon_range: [12, 13] },
          { name: 'south_coastal', lat_range: [-12, -18.042], lon_range: [11.679, 12.5] },
          { name: 'offshore_north', lat_range: [-4.376, -10], lon_range: [12.5, 13.377] },
          { name: 'offshore_south', lat_range: [-10, -18.042], lon_range: [12.5, 13.377] }
        ];

        const events = [];
        const baseDate = new Date();

        // Generate fishing events for last 30 days
        for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
          const eventDate = new Date(baseDate);
          eventDate.setDate(eventDate.getDate() - daysAgo);

          // Generate 10-20 events per day
          const eventsPerDay = Math.floor(Math.random() * 10) + 10;

          for (let i = 0; i < eventsPerDay; i++) {
            // Select random zone
            const zone = fishingZones[Math.floor(Math.random() * fishingZones.length)];

            // Generate start and end positions within zone (simulating vessel movement)
            const start_lat = zone.lat_range[0] + Math.random() * (zone.lat_range[1] - zone.lat_range[0]);
            const start_lon = zone.lon_range[0] + Math.random() * (zone.lon_range[1] - zone.lon_range[0]);

            // End position slightly offset from start (vessel movement during event)
            const movement = 0.05; // Small movement in degrees
            const end_lat = Math.min(Math.max(start_lat + (Math.random() - 0.5) * movement, zone.lat_range[0]), zone.lat_range[1]);
            const end_lon = Math.min(Math.max(start_lon + (Math.random() - 0.5) * movement, zone.lon_range[0]), zone.lon_range[1]);

            // Random vessel ID (simulated MMSI)
            const vessel_id = `AO${Math.floor(100000000 + Math.random() * 900000000)}`;

            // Random event type
            const event_type = eventTypes[Math.floor(Math.random() * eventTypes.length)];

            // Random event duration (1-12 hours for fishing, shorter for other events)
            const duration_hours = event_type === 'fishing_activity' ?
              (Math.floor(Math.random() * 12) + 1) :
              (Math.random() * 3 + 0.5);

            // Start and end times
            const startHour = Math.floor(Math.random() * 24);
            const start_time = new Date(eventDate);
            start_time.setHours(startHour, Math.floor(Math.random() * 60), 0, 0);

            const end_time = new Date(start_time);
            end_time.setHours(end_time.getHours() + duration_hours);

            // Confidence score based on event type
            const confidence_score = event_type === 'fishing_activity' ?
              (0.6 + Math.random() * 0.35) : // 0.6 to 0.95 for fishing
              (0.7 + Math.random() * 0.25); // 0.7 to 0.95 for other events

            // Check if in EEZ (always true for our generated data)
            const in_eez = true;

            // Check if in MPA (Marine Protected Area) - randomly assign for 20% of events
            const in_mpa = Math.random() < 0.2;

            // Distance from shore (km)
            const distance_from_shore = Math.abs(start_lon - 12) * 111 * Math.cos(start_lat * Math.PI / 180);

            // Metadata
            const metadata = {
              zone: zone.name,
              flag: 'AO', // Angola flag
              vessel_type: event_type === 'fishing_activity' ? 'fishing_vessel' : 'cargo_vessel',
              avg_depth: Math.floor(50 + Math.random() * 2000),
              confidence_level: confidence_score > 0.8 ? 'high' : confidence_score > 0.65 ? 'medium' : 'low',
              distance_from_shore_km: Math.round(distance_from_shore),
              weather_condition: Math.random() > 0.7 ? 'rough' : 'calm',
              speed_knots: event_type === 'fishing_activity' ? (2 + Math.random() * 3) : (10 + Math.random() * 10)
            };

            events.push({
              vessel_id: vessel_id,
              event_type: event_type,
              start_time: start_time.toISOString(),
              end_time: end_time.toISOString(),
              start_latitude: start_lat,
              start_longitude: start_lon,
              end_latitude: end_lat,
              end_longitude: end_lon,
              duration_hours: duration_hours,
              confidence_score: confidence_score,
              in_eez: in_eez,
              in_mpa: in_mpa,
              metadata: JSON.stringify(metadata)
            });
          }
        }

        console.log(`Generated ${events.length} fishing events to insert`);

        // Batch insert events
        const batchSize = 50;
        let totalInserted = 0;
        let failedBatches = 0;

        for (let i = 0; i < events.length; i += batchSize) {
          const batch = events.slice(i, i + batchSize);
          const statements = batch.map(e =>
            env.DB.prepare(`
              INSERT INTO fishing_events (
                vessel_id, event_type, start_time, end_time,
                start_latitude, start_longitude, end_latitude, end_longitude,
                duration_hours, confidence_score, in_eez, in_mpa, metadata
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
              e.vessel_id, e.event_type, e.start_time, e.end_time,
              e.start_latitude, e.start_longitude, e.end_latitude, e.end_longitude,
              e.duration_hours, e.confidence_score, e.in_eez, e.in_mpa, e.metadata
            )
          );

          try {
            const result = await env.DB.batch(statements);
            totalInserted += batch.length;
            console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}: ${totalInserted}/${events.length}`);
          } catch (error) {
            console.error(`Batch ${Math.floor(i/batchSize) + 1} failed:`, error.message);
            failedBatches++;
          }
        }

        return new Response(JSON.stringify({
          success: totalInserted > 0,
          message: totalInserted > 0 ? 'Fishing events populated successfully' : 'Failed to insert events',
          total_events: totalInserted,
          total_generated: events.length,
          failed_batches: failedBatches,
          days_covered: 30,
          event_types: eventTypes.length
        }), {
          status: totalInserted > 0 ? 200 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Error populating fishing events:', error);
        return new Response(JSON.stringify({
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Fishing Events Populator - POST /populate to start', {
      headers: corsHeaders
    });
  }
};
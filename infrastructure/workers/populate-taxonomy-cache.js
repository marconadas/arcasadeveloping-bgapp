/**
 * populate-taxonomy-cache.js
 *
 * Populates the species_taxonomy_cache table from existing marine_species data.
 * This creates a denormalized cache for fast taxonomy lookups.
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

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        worker: 'populate-taxonomy-cache',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Main population endpoint
    if (url.pathname === '/populate' && request.method === 'POST') {
      try {
        const results = {
          success: true,
          processed: 0,
          inserted: 0,
          errors: [],
          timestamp: new Date().toISOString()
        };

        // Get all species from marine_species
        const speciesQuery = `
          SELECT
            aphia_id,
            scientific_name,
            kingdom,
            phylum,
            class,
            order_name,
            family,
            genus,
            species
          FROM marine_species
          ORDER BY aphia_id
        `;

        const speciesResult = await env.BGAPP_DATA.prepare(speciesQuery).all();
        const allSpecies = speciesResult.results || [];

        console.log(`Found ${allSpecies.length} species to cache`);

        // Process each species
        for (const sp of allSpecies) {
          results.processed++;

          try {
            // Check if already cached
            const existingQuery = `
              SELECT aphia_id
              FROM species_taxonomy_cache
              WHERE aphia_id = ?
            `;
            const existing = await env.BGAPP_DATA.prepare(existingQuery)
              .bind(sp.aphia_id)
              .first();

            if (existing) {
              console.log(`AphiaID ${sp.aphia_id} already cached, skipping`);
              continue;
            }

            // Build full taxonomy path
            const taxonomyPath = [
              sp.kingdom,
              sp.phylum,
              sp.class,
              sp.order_name,
              sp.family,
              sp.genus,
              sp.species
            ].filter(Boolean).join(' > ');

            // Prepare taxonomy JSON
            const taxonomyJson = JSON.stringify({
              kingdom: sp.kingdom,
              phylum: sp.phylum,
              class: sp.class,
              order: sp.order_name,
              family: sp.family,
              genus: sp.genus,
              species: sp.species,
              full_path: taxonomyPath
            });

            // Insert into taxonomy cache
            const insertQuery = `
              INSERT INTO species_taxonomy_cache (
                aphia_id,
                scientific_name,
                kingdom,
                phylum,
                class,
                order_name,
                family,
                genus,
                species,
                taxonomy_path,
                taxonomy_json,
                cache_timestamp
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `;

            await env.BGAPP_DATA.prepare(insertQuery).bind(
              sp.aphia_id,
              sp.scientific_name,
              sp.kingdom || null,
              sp.phylum || null,
              sp.class || null,
              sp.order_name || null,
              sp.family || null,
              sp.genus || null,
              sp.species || null,
              taxonomyPath,
              taxonomyJson
            ).run();

            results.inserted++;
            console.log(`Cached AphiaID ${sp.aphia_id}: ${sp.scientific_name}`);

          } catch (error) {
            console.error(`Error caching AphiaID ${sp.aphia_id}:`, error);
            results.errors.push({
              aphia_id: sp.aphia_id,
              scientific_name: sp.scientific_name,
              error: error.message
            });
          }
        }

        // Final verification
        const verifyQuery = `
          SELECT COUNT(*) as cached_count
          FROM species_taxonomy_cache
        `;
        const verifyResult = await env.BGAPP_DATA.prepare(verifyQuery).first();
        results.total_cached = verifyResult.cached_count;

        console.log(`Population complete: ${results.inserted} inserted, ${results.total_cached} total cached`);

        return new Response(JSON.stringify(results, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Population error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        }, null, 2), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Stats endpoint
    if (url.pathname === '/stats') {
      try {
        const statsQuery = `
          SELECT
            COUNT(*) as total_cached,
            COUNT(DISTINCT kingdom) as kingdoms,
            COUNT(DISTINCT phylum) as phyla,
            COUNT(DISTINCT class) as classes,
            COUNT(DISTINCT family) as families,
            MIN(cache_timestamp) as earliest_cache,
            MAX(cache_timestamp) as latest_cache
          FROM species_taxonomy_cache
        `;

        const stats = await env.BGAPP_DATA.prepare(statsQuery).first();

        return new Response(JSON.stringify({
          success: true,
          stats: stats,
          timestamp: new Date().toISOString()
        }, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Default response
    return new Response(JSON.stringify({
      error: 'Not found',
      endpoints: [
        'POST /populate - Populate taxonomy cache from marine_species',
        'GET /stats - Get taxonomy cache statistics',
        'GET /health - Health check'
      ]
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

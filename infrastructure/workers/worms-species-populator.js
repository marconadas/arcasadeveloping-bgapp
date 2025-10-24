/**
 * BGAPP WoRMS Species Populator Worker
 * ======================================
 * Purpose: Populate D1 marine_species table with Angola EEZ species from WoRMS API
 * Strategy: Batch processing of priority species with progress tracking
 * Deployment: wrangler deploy worms-species-populator.js --config worms-species-populator.toml
 */

const WORMS_API_BASE = 'https://www.marinespecies.org/rest';
const BATCH_SIZE = 10; // Process 10 species per invocation to avoid timeouts
const REQUEST_DELAY = 200; // 200ms between API calls to respect rate limits

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      if (url.pathname === '/health') {
        return handleHealthCheck();
      }

      if (url.pathname === '/populate') {
        return await handlePopulate(request, env, url);
      }

      if (url.pathname === '/populate/priority') {
        return await handlePopulatePriority(request, env);
      }

      if (url.pathname === '/populate/single') {
        return await handlePopulateSingle(request, env, url);
      }

      if (url.pathname === '/status') {
        return await handlePopulationStatus(env);
      }

      return new Response(
        JSON.stringify({
          error: 'Not Found',
          available: [
            '/health',
            '/populate - Populate all unpopulated priority species',
            '/populate/priority - Populate priority species in batches',
            '/populate/single?name=<species> - Populate single species',
            '/status - Get population progress',
          ],
        }),
        { status: 404, headers: CORS_HEADERS }
      );
    } catch (error) {
      return handleError(error);
    }
  },
};

/**
 * Health check
 */
function handleHealthCheck() {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      service: 'BGAPP WoRMS Species Populator',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    }),
    { headers: CORS_HEADERS }
  );
}

/**
 * Populate all unpopulated priority species (batch processing)
 * GET /populate?batch_size=10
 */
async function handlePopulate(request, env, url) {
  const batchSize = parseInt(url.searchParams.get('batch_size') || BATCH_SIZE);

  // Get unpopulated priority species
  const query = `
    SELECT scientific_name, aphia_id, priority_level
    FROM angola_priority_species
    WHERE populated = 0
    ORDER BY priority_level ASC, priority_id ASC
    LIMIT ?
  `;

  const { results } = await env.BGAPP_DATA.prepare(query)
    .bind(batchSize)
    .all();

  if (!results || results.length === 0) {
    return new Response(
      JSON.stringify({
        message: 'All priority species already populated',
        total_species: 0,
      }),
      { headers: CORS_HEADERS }
    );
  }

  const populationResults = {
    total: results.length,
    successful: 0,
    failed: 0,
    species: [],
  };

  // Process each species
  for (const species of results) {
    try {
      const result = await populateSpecies(env, species.scientific_name);

      if (result.success) {
        populationResults.successful++;
        populationResults.species.push({
          scientific_name: species.scientific_name,
          aphia_id: result.aphia_id,
          status: 'populated',
        });

        // Mark as populated in priority table
        await env.BGAPP_DATA.prepare(
          'UPDATE angola_priority_species SET populated = 1, aphia_id = ?, population_date = CURRENT_TIMESTAMP WHERE scientific_name = ?'
        )
          .bind(result.aphia_id, species.scientific_name)
          .run();
      } else {
        populationResults.failed++;
        populationResults.species.push({
          scientific_name: species.scientific_name,
          status: 'failed',
          error: result.error,
        });
      }

      // Delay between requests to respect rate limits
      await delay(REQUEST_DELAY);
    } catch (error) {
      populationResults.failed++;
      populationResults.species.push({
        scientific_name: species.scientific_name,
        status: 'error',
        error: error.message,
      });
    }
  }

  return new Response(JSON.stringify(populationResults), {
    headers: CORS_HEADERS,
  });
}

/**
 * Populate priority species (all in batches)
 * POST /populate/priority
 */
async function handlePopulatePriority(request, env) {
  // Get all unpopulated priority species
  const { results } = await env.BGAPP_DATA.prepare(
    'SELECT COUNT(*) as total FROM angola_priority_species WHERE populated = 0'
  ).all();

  const totalUnpopulated = results[0]?.total || 0;

  if (totalUnpopulated === 0) {
    return new Response(
      JSON.stringify({
        message: 'All priority species already populated',
        total: 0,
      }),
      { headers: CORS_HEADERS }
    );
  }

  // For large populations, return instructions to call /populate in batches
  return new Response(
    JSON.stringify({
      message: 'Priority species population ready',
      total_unpopulated: totalUnpopulated,
      recommended_batch_size: BATCH_SIZE,
      instruction: `Call GET /populate?batch_size=${BATCH_SIZE} multiple times until all species are populated`,
      estimated_batches: Math.ceil(totalUnpopulated / BATCH_SIZE),
    }),
    { headers: CORS_HEADERS }
  );
}

/**
 * Populate single species by name
 * GET /populate/single?name=Sardinella aurita
 */
async function handlePopulateSingle(request, env, url) {
  const speciesName = url.searchParams.get('name');

  if (!speciesName) {
    return new Response(
      JSON.stringify({ error: 'Species name parameter required' }),
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const result = await populateSpecies(env, speciesName);

  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 500,
    headers: CORS_HEADERS,
  });
}

/**
 * Get population status
 * GET /status
 */
async function handlePopulationStatus(env) {
  const queries = {
    total_priority: 'SELECT COUNT(*) as count FROM angola_priority_species',
    populated: 'SELECT COUNT(*) as count FROM angola_priority_species WHERE populated = 1',
    total_species: 'SELECT COUNT(*) as count FROM marine_species',
    by_priority: `
      SELECT
        priority_level,
        COUNT(*) as total,
        SUM(CASE WHEN populated = 1 THEN 1 ELSE 0 END) as populated
      FROM angola_priority_species
      GROUP BY priority_level
      ORDER BY priority_level
    `,
    recent_additions: `
      SELECT
        scientific_name,
        common_name_pt,
        family,
        angola_eez_relevance,
        last_updated
      FROM marine_species
      ORDER BY last_updated DESC
      LIMIT 10
    `,
  };

  const stats = {};

  // Execute queries
  const [totalPriority, populated, totalSpecies, byPriority, recentAdditions] = await Promise.all([
    env.BGAPP_DATA.prepare(queries.total_priority).all(),
    env.BGAPP_DATA.prepare(queries.populated).all(),
    env.BGAPP_DATA.prepare(queries.total_species).all(),
    env.BGAPP_DATA.prepare(queries.by_priority).all(),
    env.BGAPP_DATA.prepare(queries.recent_additions).all(),
  ]);

  stats.total_priority_species = totalPriority.results[0]?.count || 0;
  stats.priority_populated = populated.results[0]?.count || 0;
  stats.priority_remaining = stats.total_priority_species - stats.priority_populated;
  stats.total_species_in_catalog = totalSpecies.results[0]?.count || 0;
  stats.population_progress = stats.total_priority_species > 0
    ? ((stats.priority_populated / stats.total_priority_species) * 100).toFixed(2) + '%'
    : '0%';
  stats.by_priority_level = byPriority.results || [];
  stats.recent_additions = recentAdditions.results || [];

  return new Response(JSON.stringify(stats), { headers: CORS_HEADERS });
}

/**
 * Populate a single species into D1
 */
async function populateSpecies(env, scientificName) {
  try {
    // Fetch from WoRMS API
    const wormsUrl = `${WORMS_API_BASE}/AphiaRecordsByName/${encodeURIComponent(scientificName)}?like=false&marine_only=true`;
    const response = await fetch(wormsUrl);

    if (!response.ok) {
      return {
        success: false,
        error: `WoRMS API error: ${response.status}`,
      };
    }

    const data = await response.json();

    // Get accepted record
    const acceptedRecord = Array.isArray(data)
      ? data.find((r) => r.status === 'accepted') || data[0]
      : data;

    if (!acceptedRecord) {
      return {
        success: false,
        error: 'Species not found in WoRMS',
      };
    }

    // Fetch common names (vernacular)
    let commonNamePt = null;
    let commonNameEn = null;
    let vernacularNames = [];

    try {
      const vernacularUrl = `${WORMS_API_BASE}/AphiaVernacularsByAphiaID/${acceptedRecord.AphiaID}`;
      const vernacularResponse = await fetch(vernacularUrl);

      if (vernacularResponse.ok) {
        const vernaculars = await vernacularResponse.json();

        if (Array.isArray(vernaculars)) {
          vernaculars.forEach((v) => {
            const lang = (v.language || '').toLowerCase();
            if (lang.includes('portuguese') || lang.includes('português')) {
              if (!commonNamePt) commonNamePt = v.vernacular;
            } else if (lang.includes('english')) {
              if (!commonNameEn) commonNameEn = v.vernacular;
            }
            vernacularNames.push({
              language: v.language,
              name: v.vernacular,
            });
          });
        }
      }
    } catch (error) {
      console.error('Error fetching vernacular names:', error);
    }

    // Determine Angola EEZ relevance (this is a simplified heuristic)
    const angolaEezRelevance = determineAngolaRelevance(acceptedRecord, scientificName);

    // Insert into marine_species table
    const insertQuery = `
      INSERT OR REPLACE INTO marine_species (
        aphia_id, scientific_name, authority,
        kingdom, phylum, class, order_name, family, genus, species,
        common_name_pt, common_name_en, vernacular_names,
        is_marine, is_brackish, is_freshwater, is_terrestrial,
        status, taxonomic_status,
        angola_eez_relevance,
        worms_url, lsid, citation,
        data_source, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    await env.BGAPP_DATA.prepare(insertQuery)
      .bind(
        acceptedRecord.AphiaID,
        acceptedRecord.scientificname,
        acceptedRecord.authority,
        acceptedRecord.kingdom,
        acceptedRecord.phylum,
        acceptedRecord.class,
        acceptedRecord.order,
        acceptedRecord.family,
        acceptedRecord.genus,
        extractSpeciesName(acceptedRecord.scientificname),
        commonNamePt,
        commonNameEn,
        vernacularNames.length > 0 ? JSON.stringify(vernacularNames) : null,
        acceptedRecord.isMarine || 0,
        acceptedRecord.isBrackish || 0,
        acceptedRecord.isFreshwater || 0,
        acceptedRecord.isTerrestrial || 0,
        acceptedRecord.status,
        acceptedRecord.unacceptreason,
        angolaEezRelevance,
        acceptedRecord.url,
        acceptedRecord.lsid,
        acceptedRecord.citation,
        'worms'
      )
      .run();

    return {
      success: true,
      aphia_id: acceptedRecord.AphiaID,
      scientific_name: acceptedRecord.scientificname,
      common_name_pt: commonNamePt,
      angola_eez_relevance: angolaEezRelevance,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Determine Angola EEZ relevance based on species characteristics
 * This is a simplified heuristic - could be enhanced with actual distribution data
 */
function determineAngolaRelevance(record, scientificName) {
  // High priority species (from angola_priority_species table)
  const highPrioritySpecies = [
    'Sardinella aurita',
    'Sardinella maderensis',
    'Trachurus trecae',
    'Trachurus capensis',
    'Merluccius capensis',
    'Merluccius paradoxus',
  ];

  if (highPrioritySpecies.includes(scientificName)) {
    return 'high';
  }

  // Medium priority: marine species in key families
  const keyFamilies = [
    'Clupeidae',
    'Carangidae',
    'Merlucciidae',
    'Sparidae',
    'Scombridae',
    'Penaeidae',
  ];

  if (record.isMarine && keyFamilies.includes(record.family)) {
    return 'medium';
  }

  // Low priority: other marine species
  if (record.isMarine) {
    return 'low';
  }

  return 'low';
}

/**
 * Extract species name from scientific name
 */
function extractSpeciesName(scientificName) {
  const parts = scientificName.split(' ');
  return parts.length >= 2 ? parts[1] : null;
}

/**
 * Delay helper for rate limiting
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Error handler
 */
function handleError(error) {
  console.error('Worker error:', error);

  return new Response(
    JSON.stringify({
      error: 'Internal Server Error',
      message: error.message,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 500,
      headers: CORS_HEADERS,
    }
  );
}

/**
 * Angola EEZ filtering using real polygon geometry validation
 * Uses Turf.js for accurate point-in-polygon checks
 */

import * as turf from '@turf/turf';

// Angola EEZ bounding box (for quick pre-filtering)
export const ANGOLA_EEZ_BOUNDS = {
  minLat: -17.29,
  maxLat: -4.3,
  minLon: 8.30,
  maxLon: 13.84
};

// Cache for loaded EEZ polygons
let eezPolygons: GeoJSON.FeatureCollection | null = null;

/**
 * Load Angola EEZ polygons from GeoJSON file
 * Contains two polygons: Continental Angola + Cabinda exclave
 */
async function loadEEZPolygons(): Promise<GeoJSON.FeatureCollection> {
  if (eezPolygons) {
    return eezPolygons;
  }

  try {
    const response = await fetch('/angola_eez.json');
    if (!response.ok) {
      throw new Error(`Failed to load EEZ polygons: ${response.status}`);
    }
    eezPolygons = await response.json();
    if (!eezPolygons) {
      throw new Error('Failed to parse EEZ polygons: received null');
    }
    console.log('[EEZ Filter] Loaded Angola EEZ polygons:', {
      features: eezPolygons?.features.length,
      type: eezPolygons?.features[0]?.geometry.type
    });
    return eezPolygons;
  } catch (error) {
    console.error('[EEZ Filter] Failed to load EEZ polygons:', error);
    throw error;
  }
}

/**
 * Check if a point is within the Angola EEZ bounding box (fast pre-filter)
 * @param lat Latitude
 * @param lon Longitude
 * @returns true if point is within EEZ bounding box
 */
export function isPointInEEZBounds(lat: number, lon: number): boolean {
  return (
    lat >= ANGOLA_EEZ_BOUNDS.minLat &&
    lat <= ANGOLA_EEZ_BOUNDS.maxLat &&
    lon >= ANGOLA_EEZ_BOUNDS.minLon &&
    lon <= ANGOLA_EEZ_BOUNDS.maxLon
  );
}

/**
 * Check if a point is within the Angola EEZ polygons (accurate)
 * Uses actual polygon geometry from angola_eez.json
 * @param lat Latitude
 * @param lon Longitude
 * @returns true if point is within any Angola EEZ polygon
 */
export async function isPointInAngolaEEZ(lat: number, lon: number): Promise<boolean> {
  // Quick bounding box check first (performance optimization)
  if (!isPointInEEZBounds(lat, lon)) {
    return false;
  }

  try {
    const polygons = await loadEEZPolygons();
    const point = turf.point([lon, lat]); // Note: GeoJSON uses [longitude, latitude]

    // Check if point is in any of the Angola EEZ polygons (Continental or Cabinda)
    for (const feature of polygons.features) {
      if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
        // MultiPolygon - check each polygon
        const isInside = turf.booleanPointInPolygon(point, feature as GeoJSON.Feature<GeoJSON.MultiPolygon>);
        if (isInside) {
          return true;
        }
      } else if (feature.geometry && feature.geometry.type === 'Polygon') {
        // Single Polygon
        const isInside = turf.booleanPointInPolygon(point, feature as GeoJSON.Feature<GeoJSON.Polygon>);
        if (isInside) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('[EEZ Filter] Error checking point in polygon:', error);
    // Fallback to bounding box if polygon check fails
    return isPointInEEZBounds(lat, lon);
  }
}

/**
 * Synchronous version - checks only bounding box
 * Use this when you need immediate results without async
 * @param lat Latitude
 * @param lon Longitude
 * @returns true if point is within EEZ bounding box
 */
export function isPointInAngolaEEZSync(lat: number, lon: number): boolean {
  return isPointInEEZBounds(lat, lon);
}

/**
 * Filter an array of points to only include those within Angola EEZ polygons
 * Uses accurate polygon geometry validation
 * @param points Array of points with lat/lng properties
 * @returns Filtered array of points within EEZ polygons
 */
export async function filterPointsInEEZ<T extends { lat: number; lng: number }>(
  points: T[]
): Promise<T[]> {
  if (!points || points.length === 0) {
    return [];
  }

  try {
    // Load polygons once for all points
    await loadEEZPolygons();

    // Filter points asynchronously
    const results = await Promise.all(
      points.map(async (point) => ({
        point,
        isValid: await isPointInAngolaEEZ(point.lat, point.lng)
      }))
    );

    const filteredPoints = results
      .filter(({ isValid }) => isValid)
      .map(({ point }) => point);

    console.log('[EEZ Filter] Filtered points:', {
      input: points.length,
      output: filteredPoints.length,
      removed: points.length - filteredPoints.length
    });

    return filteredPoints;
  } catch (error) {
    console.error('[EEZ Filter] Error filtering points:', error);
    // Fallback to bounding box filtering
    return points.filter(point => isPointInEEZBounds(point.lat, point.lng));
  }
}

/**
 * Synchronous version - filters using only bounding box
 * Use this when you need immediate results without async
 * @param points Array of points with lat/lng properties
 * @returns Filtered array of points within EEZ bounds
 */
export function filterPointsInEEZSync<T extends { lat: number; lng: number }>(
  points: T[]
): T[] {
  return points.filter(point => isPointInEEZBounds(point.lat, point.lng));
}

/**
 * Get a human-readable description of the EEZ bounds
 */
export function getEEZDescription(): string {
  return `Angola EEZ: Lat ${ANGOLA_EEZ_BOUNDS.minLat}° to ${ANGOLA_EEZ_BOUNDS.maxLat}°, Lon ${ANGOLA_EEZ_BOUNDS.minLon}° to ${ANGOLA_EEZ_BOUNDS.maxLon}° (2 polygons: Continental + Cabinda)`;
}

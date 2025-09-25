/**
 * Copernicus Notification Processor
 * Processes incoming webhook notifications from Copernicus subscriptions
 */

/**
 * Process a product notification from Copernicus
 * @param {Object} notification - The notification payload
 * @param {Object} env - Environment variables
 * @returns {Promise<Object>} Processing result
 */
export async function processProductNotification(notification, env) {
  try {
    console.log(`📨 Processing notification for product: ${notification.ProductName}`);
    
    const result = {
      productId: notification.ProductId,
      event: notification.SubscriptionEvent,
      processed: true,
      timestamp: new Date().toISOString()
    };

    // Extract product data if available
    if (notification.value) {
      result.product = {
        name: notification.value.Name,
        contentLength: notification.value.ContentLength,
        online: notification.value.Online,
        footprint: notification.value.GeoFootprint,
        contentDate: notification.value.ContentDate,
        s3Path: notification.value.S3Path
      };
    }

    // Process based on event type
    switch (notification.SubscriptionEvent) {
      case 'created':
        await processNewProduct(notification, env);
        break;
      case 'modified':
        await processModifiedProduct(notification, env);
        break;
      case 'deleted':
        await processDeletedProduct(notification, env);
        break;
      default:
        console.warn(`Unknown event type: ${notification.SubscriptionEvent}`);
    }

    return result;

  } catch (error) {
    console.error('Error processing notification:', error);
    throw error;
  }
}

/**
 * Process a new product notification
 */
async function processNewProduct(notification, env) {
  console.log('🆕 Processing new product');
  
  const product = notification.value;
  if (!product) return;

  // Store product metadata
  if (env.KV) {
    const metadata = {
      id: product.Id,
      name: product.Name,
      contentLength: product.ContentLength,
      footprint: product.GeoFootprint,
      contentDate: product.ContentDate,
      attributes: extractProductAttributes(product.Attributes),
      processedAt: new Date().toISOString()
    };

    await env.KV.put(
      `product:${product.Id}`,
      JSON.stringify(metadata),
      { expirationTtl: 86400 * 30 } // 30 days
    );
  }

  // Queue for STAC catalog update
  if (env.PRODUCT_QUEUE) {
    await env.PRODUCT_QUEUE.send({
      type: 'stac_update',
      action: 'create',
      productId: product.Id,
      productData: product
    });
  }
}

/**
 * Process a modified product notification
 */
async function processModifiedProduct(notification, env) {
  console.log('📝 Processing modified product');
  
  // Similar to new product but with update logic
  await processNewProduct(notification, env);
}

/**
 * Process a deleted product notification
 */
async function processDeletedProduct(notification, env) {
  console.log('🗑️ Processing deleted product');
  
  const productId = notification.ProductId;
  
  // Remove from KV storage
  if (env.KV) {
    await env.KV.delete(`product:${productId}`);
  }

  // Queue for STAC catalog removal
  if (env.PRODUCT_QUEUE) {
    await env.PRODUCT_QUEUE.send({
      type: 'stac_update',
      action: 'delete',
      productId: productId,
      deletionCause: notification.value?.DeletionCause
    });
  }
}

/**
 * Extract relevant attributes from Copernicus product
 */
function extractProductAttributes(attributes) {
  const extracted = {};
  
  if (!attributes) return extracted;

  for (const attr of attributes) {
    if (attr.Name && attr.Value !== undefined) {
      extracted[attr.Name] = attr.Value;
    }
  }

  return extracted;
}

/**
 * Check if product is within Angola EEZ bounds
 */
export function isProductInAngolaEEZ(geoFootprint) {
  if (!geoFootprint || !geoFootprint.coordinates) return false;

  const angolaEEZ = {
    north: -4.376,
    south: -18.042,
    east: 13.377,
    west: 11.679
  };

  try {
    const coords = geoFootprint.coordinates[0];
    for (const point of coords) {
      const [lon, lat] = point;
      if (lon >= angolaEEZ.west && lon <= angolaEEZ.east &&
          lat >= angolaEEZ.south && lat <= angolaEEZ.north) {
        return true;
      }
    }
  } catch (error) {
    console.error('Error checking Angola EEZ bounds:', error);
  }

  return false;
}

/**
 * Convert Copernicus product to STAC Item format
 */
export function convertToSTACItem(product) {
  const stacItem = {
    type: "Feature",
    stac_version: "1.0.0",
    id: product.Id,
    properties: {
      datetime: product.ContentDate?.Start || new Date().toISOString(),
      created: product.OriginDate,
      updated: product.ModificationDate,
      "copernicus:product_type": extractProductType(product.Attributes),
      "copernicus:platform": extractPlatform(product.Attributes),
      "copernicus:instrument": extractInstrument(product.Attributes),
      "copernicus:processing_level": extractProcessingLevel(product.Attributes)
    },
    geometry: product.GeoFootprint || null,
    bbox: calculateBoundingBox(product.GeoFootprint),
    assets: {
      data: {
        href: product.Locations?.[0]?.DownloadLink || `https://catalogue.dataspace.copernicus.eu/odata/v1/Products(${product.Id})/$value`,
        type: product.ContentType || "application/octet-stream",
        title: "Product Data",
        roles: ["data"],
        "file:size": product.ContentLength
      }
    },
    links: [
      {
        rel: "self",
        href: `./items/${product.Id}.json`,
        type: "application/geo+json"
      }
    ]
  };

  // Add quicklook if available
  if (product.Assets && product.Assets.length > 0) {
    const quicklook = product.Assets.find(asset => asset.Type === 'QUICKLOOK');
    if (quicklook) {
      stacItem.assets.thumbnail = {
        href: quicklook.DownloadLink,
        type: "image/jpeg",
        title: "Quicklook",
        roles: ["thumbnail"]
      };
    }
  }

  return stacItem;
}

// Helper functions for STAC conversion
function extractProductType(attributes) {
  const attr = attributes?.find(a => a.Name === 'productType');
  return attr?.Value || 'unknown';
}

function extractPlatform(attributes) {
  const attr = attributes?.find(a => a.Name === 'platformShortName');
  return attr?.Value || 'unknown';
}

function extractInstrument(attributes) {
  const attr = attributes?.find(a => a.Name === 'instrumentShortName');
  return attr?.Value || 'unknown';
}

function extractProcessingLevel(attributes) {
  const attr = attributes?.find(a => a.Name === 'processingLevel');
  return attr?.Value || 'unknown';
}

function calculateBoundingBox(geoFootprint) {
  if (!geoFootprint || !geoFootprint.coordinates) return null;

  try {
    const coords = geoFootprint.coordinates[0];
    let minLon = Infinity, minLat = Infinity;
    let maxLon = -Infinity, maxLat = -Infinity;

    for (const [lon, lat] of coords) {
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }

    return [minLon, minLat, maxLon, maxLat];
  } catch (error) {
    console.error('Error calculating bounding box:', error);
    return null;
  }
}

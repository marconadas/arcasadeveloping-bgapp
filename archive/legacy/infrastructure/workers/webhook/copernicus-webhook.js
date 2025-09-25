/**
 * Copernicus Webhook Handler
 * Processes PUSH notifications from Copernicus subscriptions
 */

import { processProductNotification } from '../copernicus-official/processors/notification-processor.js';

// CORS headers for webhook endpoint
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Copernicus-Signature"
};

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    
    // Route: POST /webhook/copernicus
    if (url.pathname === "/webhook/copernicus" && request.method === "POST") {
      return handleCopernicusWebhook(request, env, ctx);
    }

    // Route: GET /webhook/status
    if (url.pathname === "/webhook/status" && request.method === "GET") {
      return handleWebhookStatus(env);
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  }
};

/**
 * Handle incoming Copernicus webhook notification
 */
async function handleCopernicusWebhook(request, env, ctx) {
  const startTime = Date.now();
  
  try {
    // Validate webhook authentication if configured
    if (env.WEBHOOK_AUTH_USERNAME || env.WEBHOOK_AUTH_PASSWORD) {
      const auth = request.headers.get("Authorization");
      if (!validateBasicAuth(auth, env)) {
        console.error("❌ Webhook authentication failed");
        return new Response("Unauthorized", { 
          status: 401, 
          headers: corsHeaders 
        });
      }
    }

    // Parse notification payload
    const notification = await request.json();
    
    console.log("📨 Received Copernicus notification");
    console.log("Event:", notification.SubscriptionEvent);
    console.log("Product:", notification.ProductName);
    console.log("Product ID:", notification.ProductId);

    // Validate notification structure
    if (!isValidNotification(notification)) {
      console.error("❌ Invalid notification structure");
      return new Response("Bad Request", { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Process notification asynchronously
    ctx.waitUntil(
      processNotificationAsync(notification, env)
    );

    // Return immediate success response
    const processingTime = Date.now() - startTime;
    console.log(`✅ Webhook processed in ${processingTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      productId: notification.ProductId,
      processingTime: processingTime
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });

  } catch (error) {
    console.error("❌ Webhook error:", error);
    
    // Log to error tracking if available
    if (env.SENTRY_DSN) {
      ctx.waitUntil(logToSentry(error, env, request));
    }

    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
}

/**
 * Process notification asynchronously
 */
async function processNotificationAsync(notification, env) {
  try {
    // Store raw notification for debugging
    await storeRawNotification(notification, env);

    // Check if product is within Angola EEZ
    if (!isWithinAngolaEEZ(notification.value?.GeoFootprint)) {
      console.log("⚠️ Product outside Angola EEZ, skipping");
      return;
    }

    // Process based on event type
    switch (notification.SubscriptionEvent) {
      case "created":
        await handleProductCreated(notification, env);
        break;
      
      case "modified":
        await handleProductModified(notification, env);
        break;
      
      case "deleted":
        await handleProductDeleted(notification, env);
        break;
      
      default:
        console.warn("Unknown event type:", notification.SubscriptionEvent);
    }

    // Update metrics
    await updateMetrics(notification, env);

  } catch (error) {
    console.error("Error processing notification:", error);
    
    // Store failed notification for retry
    await storeFailedNotification(notification, error, env);
  }
}

/**
 * Handle product created event
 */
async function handleProductCreated(notification, env) {
  console.log("🆕 Processing new product:", notification.ProductName);

  const product = notification.value;
  
  // Extract metadata
  const metadata = {
    id: product.Id,
    name: product.Name,
    contentType: product.ContentType,
    contentLength: product.ContentLength,
    footprint: product.GeoFootprint,
    contentDate: product.ContentDate,
    s3Path: product.S3Path,
    downloadLink: product.Locations?.[0]?.DownloadLink,
    attributes: extractAttributes(product.Attributes),
    processingDate: new Date().toISOString()
  };

  // Store in KV for quick access
  if (env.KV) {
    await env.KV.put(
      `product:${product.Id}`,
      JSON.stringify(metadata),
      { expirationTtl: 86400 * 30 } // 30 days
    );
  }

  // Queue for STAC catalog update
  if (env.PRODUCT_QUEUE) {
    await env.PRODUCT_QUEUE.send({
      type: "stac_update",
      action: "create",
      product: metadata
    });
  }

  console.log("✅ Product processed successfully");
}

/**
 * Handle product modified event
 */
async function handleProductModified(notification, env) {
  console.log("📝 Processing modified product:", notification.ProductName);
  
  // Similar to create but with update logic
  await handleProductCreated(notification, env);
}

/**
 * Handle product deleted event
 */
async function handleProductDeleted(notification, env) {
  console.log("🗑️ Processing deleted product:", notification.ProductName);

  const productId = notification.ProductId;
  
  // Remove from KV
  if (env.KV) {
    await env.KV.delete(`product:${productId}`);
  }

  // Queue for STAC catalog update
  if (env.PRODUCT_QUEUE) {
    await env.PRODUCT_QUEUE.send({
      type: "stac_update",
      action: "delete",
      productId: productId,
      deletionCause: notification.value?.DeletionCause
    });
  }
}

/**
 * Check if product footprint intersects with Angola EEZ
 */
function isWithinAngolaEEZ(geoFootprint) {
  if (!geoFootprint || !geoFootprint.coordinates) return false;

  const angolaEEZ = {
    north: -4.376,
    south: -18.042,
    east: 13.377,
    west: 11.679
  };

  // Simple bounding box check (can be improved with proper geometry library)
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
    console.error("Error checking EEZ bounds:", error);
  }

  return false;
}

/**
 * Extract relevant attributes from OData format
 */
function extractAttributes(attributes) {
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
 * Validate Basic Auth header
 */
function validateBasicAuth(authHeader, env) {
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return false;
  }

  try {
    const base64 = authHeader.slice(6);
    const decoded = atob(base64);
    const [username, password] = decoded.split(":");

    return username === env.WEBHOOK_AUTH_USERNAME && 
           password === env.WEBHOOK_AUTH_PASSWORD;
  } catch (error) {
    return false;
  }
}

/**
 * Validate notification structure
 */
function isValidNotification(notification) {
  return notification &&
         notification.SubscriptionEvent &&
         notification.ProductId &&
         notification.SubscriptionId &&
         notification.NotificationDate;
}

/**
 * Store raw notification for debugging
 */
async function storeRawNotification(notification, env) {
  if (!env.KV) return;

  const key = `notification:${notification.ProductId}:${Date.now()}`;
  await env.KV.put(key, JSON.stringify(notification), {
    expirationTtl: 86400 * 7 // 7 days
  });
}

/**
 * Store failed notification for retry
 */
async function storeFailedNotification(notification, error, env) {
  if (!env.KV) return;

  const key = `failed:${notification.ProductId}:${Date.now()}`;
  await env.KV.put(key, JSON.stringify({
    notification,
    error: error.message,
    timestamp: new Date().toISOString()
  }), {
    expirationTtl: 86400 * 3 // 3 days
  });
}

/**
 * Update webhook metrics
 */
async function updateMetrics(notification, env) {
  if (!env.KV) return;

  const today = new Date().toISOString().split('T')[0];
  const metricsKey = `metrics:webhook:${today}`;

  try {
    const current = await env.KV.get(metricsKey, { type: "json" }) || {
      total: 0,
      created: 0,
      modified: 0,
      deleted: 0,
      errors: 0
    };

    current.total++;
    current[notification.SubscriptionEvent]++;

    await env.KV.put(metricsKey, JSON.stringify(current), {
      expirationTtl: 86400 * 30 // 30 days
    });
  } catch (error) {
    console.error("Error updating metrics:", error);
  }
}

/**
 * Get webhook status and metrics
 */
async function handleWebhookStatus(env) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const metrics = await env.KV?.get(`metrics:webhook:${today}`, { type: "json" }) || {};

    return new Response(JSON.stringify({
      status: "healthy",
      date: today,
      metrics: metrics,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: "error",
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
}

/**
 * Log error to Sentry (placeholder)
 */
async function logToSentry(error, env, request) {
  // TODO: Implement Sentry integration
  console.error("Sentry log:", error);
}

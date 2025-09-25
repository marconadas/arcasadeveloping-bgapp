/**
 * Copernicus Subscriptions Manager
 * Implements PUSH subscriptions for real-time notifications
 * https://documentation.dataspace.copernicus.eu/APIs/Subscriptions.html
 */

import { makeAuthenticatedRequest } from '../auth/simple-auth.js';

const SUBSCRIPTION_CONFIG = {
  BASE_URL: "https://catalogue.dataspace.copernicus.eu/odata/v1/Subscriptions",
  
  // Angola EEZ bounding box
  ANGOLA_EEZ: {
    north: -4.376,
    south: -18.042,
    east: 13.377,
    west: 11.679
  },
  
  // Default subscription settings
  DEFAULTS: {
    Priority: 1,
    StageOrder: true,
    Status: "running",
    SubscriptionType: "push"
  }
};

/**
 * Create a PUSH subscription for Angola marine data
 */
export async function createAngolaMarineSubscription(env, webhookUrl, webhookAuth = {}) {
  try {
    // Build spatial filter for Angola EEZ
    const spatialFilter = buildAngolaEEZFilter();
    
    // Build product type filters
    const productFilter = buildMarineProductFilter();
    
    // Combine filters
    const filterParam = `${productFilter} and ${spatialFilter}`;
    
    const subscriptionData = {
      ...SUBSCRIPTION_CONFIG.DEFAULTS,
      FilterParam: filterParam,
      SubscriptionEvent: ["created", "modified"],
      NotificationEndpoint: webhookUrl,
      NotificationEpUsername: webhookAuth.username || "",
      NotificationEpPassword: webhookAuth.password || ""
    };

    console.log("📡 Creating Angola marine subscription...");
    console.log("Filter:", filterParam);
    console.log("Webhook:", webhookUrl);

    const response = await makeAuthenticatedRequest(
      env,
      SUBSCRIPTION_CONFIG.BASE_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscriptionData)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create subscription: ${response.status} - ${error}`);
    }

    const result = await response.json();
    console.log("✅ Subscription created successfully!");
    console.log("Subscription ID:", result.Id);

    return result;

  } catch (error) {
    console.error("❌ Error creating subscription:", error);
    throw error;
  }
}

/**
 * List all active subscriptions
 */
export async function listSubscriptions(env) {
  try {
    const response = await makeAuthenticatedRequest(
      env,
      `${SUBSCRIPTION_CONFIG.BASE_URL}/Info`
    );

    if (!response.ok) {
      throw new Error(`Failed to list subscriptions: ${response.status}`);
    }

    const subscriptions = await response.json();
    
    // Filter and format subscriptions
    const formatted = subscriptions.map(sub => ({
      id: sub.Id,
      status: sub.Status,
      type: sub.SubscriptionType,
      events: sub.SubscriptionEvent,
      created: sub.SubmissionDate,
      endpoint: sub.NotificationEndpoint || "N/A",
      lastNotification: sub.LastNotificationDate || "Never",
      filter: sub.FilterParam
    }));

    return formatted;

  } catch (error) {
    console.error("Error listing subscriptions:", error);
    throw error;
  }
}

/**
 * Get specific subscription details
 */
export async function getSubscription(env, subscriptionId) {
  try {
    const response = await makeAuthenticatedRequest(
      env,
      `${SUBSCRIPTION_CONFIG.BASE_URL}(${subscriptionId})`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to get subscription: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error("Error getting subscription:", error);
    throw error;
  }
}

/**
 * Update subscription (pause/resume)
 */
export async function updateSubscription(env, subscriptionId, updates) {
  try {
    const allowedUpdates = {};
    
    // Only allow specific fields to be updated
    if (updates.Status) {
      if (!["running", "paused", "cancelled"].includes(updates.Status)) {
        throw new Error("Invalid status. Must be: running, paused, or cancelled");
      }
      allowedUpdates.Status = updates.Status;
    }
    
    if (updates.NotificationEndpoint) {
      allowedUpdates.NotificationEndpoint = updates.NotificationEndpoint;
    }

    const response = await makeAuthenticatedRequest(
      env,
      `${SUBSCRIPTION_CONFIG.BASE_URL}(${subscriptionId})`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allowedUpdates)
      }
    );

    if (response.status === 204) {
      console.log("✅ Subscription updated successfully");
      return { success: true };
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update subscription: ${response.status} - ${error}`);
    }

    return await response.json();

  } catch (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
}

/**
 * Delete a subscription
 */
export async function deleteSubscription(env, subscriptionId) {
  try {
    const response = await makeAuthenticatedRequest(
      env,
      `${SUBSCRIPTION_CONFIG.BASE_URL}(${subscriptionId})`,
      { method: "DELETE" }
    );

    if (response.status === 204) {
      console.log("✅ Subscription deleted successfully");
      return { success: true };
    }

    if (!response.ok) {
      throw new Error(`Failed to delete subscription: ${response.status}`);
    }

    return { success: true };

  } catch (error) {
    console.error("Error deleting subscription:", error);
    throw error;
  }
}

/**
 * Build spatial filter for Angola EEZ
 */
function buildAngolaEEZFilter() {
  const { north, south, east, west } = SUBSCRIPTION_CONFIG.ANGOLA_EEZ;
  
  // Create WKT polygon for Angola EEZ
  const polygon = `POLYGON((${west} ${north}, ${east} ${north}, ${east} ${south}, ${west} ${south}, ${west} ${north}))`;
  
  // OData spatial intersects filter
  return `OData.CSC.Intersects(area=geography'SRID=4326;${polygon}')`;
}

/**
 * Build filter for marine-related products
 */
function buildMarineProductFilter() {
  // Focus on Sentinel-3 for ocean data
  const collections = [
    "Collection/Name eq 'SENTINEL-3'",
    "Collection/Name eq 'SENTINEL-2'" // Also useful for coastal monitoring
  ].join(" or ");
  
  // Product types relevant for marine monitoring
  const productTypes = [
    // Sentinel-3 Ocean products
    "Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' and att/OData.CSC.StringAttribute/Value eq 'OL_2_WFR___')", // Ocean colour
    "Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' and att/OData.CSC.StringAttribute/Value eq 'OL_2_WRR___')", // Reduced resolution
    "Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' and att/OData.CSC.StringAttribute/Value eq 'SR_2_WAT___')", // Surface temperature
    
    // Sentinel-2 for coastal
    "Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' and att/OData.CSC.StringAttribute/Value eq 'S2MSI2A')" // Level-2A
  ].join(" or ");
  
  return `(${collections}) and (${productTypes})`;
}

/**
 * Create a test subscription with minimal filters
 */
export async function createTestSubscription(env, webhookUrl) {
  try {
    const subscriptionData = {
      ...SUBSCRIPTION_CONFIG.DEFAULTS,
      FilterParam: "Collection/Name eq 'SENTINEL-3'", // Simple filter for testing
      SubscriptionEvent: ["created"],
      NotificationEndpoint: webhookUrl
    };

    console.log("🧪 Creating test subscription...");

    const response = await makeAuthenticatedRequest(
      env,
      SUBSCRIPTION_CONFIG.BASE_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscriptionData)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create test subscription: ${response.status} - ${error}`);
    }

    const result = await response.json();
    console.log("✅ Test subscription created!");
    
    return result;

  } catch (error) {
    console.error("Error creating test subscription:", error);
    throw error;
  }
}

// Export config for testing
export { SUBSCRIPTION_CONFIG };

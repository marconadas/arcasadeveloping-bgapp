/**
 * Copernicus Simple Authentication Module
 * Based on official documentation - NO TOTP REQUIRED for API calls
 * https://documentation.dataspace.copernicus.eu/APIs/Token.html
 */

const AUTH_CONFIG = {
  TOKEN_URL: "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token",
  CLIENT_ID: "cdse-public",
  GRANT_TYPE: "password",
  SCOPE: "openid",
  
  // Cache settings
  TOKEN_CACHE_KEY: "copernicus_token",
  REFRESH_CACHE_KEY: "copernicus_refresh",
  CACHE_BUFFER_MINUTES: 5, // Refresh 5 minutes before expiry
};

/**
 * Get access token using simple username/password authentication
 * NO TOTP REQUIRED as per official documentation
 */
export async function getCopernicusToken(env) {
  try {
    // Check cache first
    const cachedToken = await getCachedToken(env);
    if (cachedToken && isTokenValid(cachedToken)) {
      console.log("✅ Using cached token");
      return cachedToken.access_token;
    }

    // Get credentials from environment
    const username = env.COPERNICUS_USERNAME;
    const password = env.COPERNICUS_PASSWORD;

    if (!username || !password) {
      throw new Error("Missing Copernicus credentials in environment");
    }

    console.log(`🔐 Authenticating with Copernicus for user: ${username}`);

    // Prepare request body - NO TOTP!
    const body = new URLSearchParams({
      client_id: AUTH_CONFIG.CLIENT_ID,
      grant_type: AUTH_CONFIG.GRANT_TYPE,
      scope: AUTH_CONFIG.SCOPE,
      username: username,
      password: password
    });

    // Make authentication request
    const response = await fetch(AUTH_CONFIG.TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "BGAPP-Angola/2.0 Copernicus-Simple-Auth"
      },
      body: body.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Authentication failed: ${response.status}`);
      console.error(`Response: ${errorText}`);
      throw new Error(`Auth failed ${response.status}: ${errorText}`);
    }

    const tokenData = await response.json();

    if (!tokenData.access_token) {
      throw new Error("No access token in response");
    }

    // Cache the token
    await cacheToken(env, tokenData);

    console.log("✅ Authentication successful!");
    console.log(`Token expires in: ${tokenData.expires_in} seconds`);

    return tokenData.access_token;

  } catch (error) {
    console.error("❌ Authentication error:", error.message);
    throw error;
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(env) {
  try {
    const refreshToken = await env.KV?.get(AUTH_CONFIG.REFRESH_CACHE_KEY);
    
    if (!refreshToken) {
      console.log("No refresh token available, doing full auth");
      return getCopernicusToken(env);
    }

    const body = new URLSearchParams({
      client_id: AUTH_CONFIG.CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: refreshToken
    });

    const response = await fetch(AUTH_CONFIG.TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "BGAPP-Angola/2.0 Copernicus-Simple-Auth"
      },
      body: body.toString()
    });

    if (!response.ok) {
      console.log("Refresh failed, doing full auth");
      return getCopernicusToken(env);
    }

    const tokenData = await response.json();
    await cacheToken(env, tokenData);

    console.log("✅ Token refreshed successfully!");
    return tokenData.access_token;

  } catch (error) {
    console.error("Refresh error, falling back to full auth:", error.message);
    return getCopernicusToken(env);
  }
}

/**
 * Cache token data in Cloudflare KV
 */
async function cacheToken(env, tokenData) {
  if (!env.KV) {
    console.warn("KV storage not available, skipping cache");
    return;
  }

  const expiresAt = Date.now() + (tokenData.expires_in * 1000);
  const cacheData = {
    access_token: tokenData.access_token,
    expires_at: expiresAt,
    expires_in: tokenData.expires_in,
    cached_at: Date.now()
  };

  // Store access token
  await env.KV.put(
    AUTH_CONFIG.TOKEN_CACHE_KEY,
    JSON.stringify(cacheData),
    { expirationTtl: tokenData.expires_in }
  );

  // Store refresh token if available
  if (tokenData.refresh_token) {
    await env.KV.put(
      AUTH_CONFIG.REFRESH_CACHE_KEY,
      tokenData.refresh_token,
      { expirationTtl: 86400 } // 24 hours
    );
  }
}

/**
 * Get cached token from KV
 */
async function getCachedToken(env) {
  if (!env.KV) return null;

  try {
    const cached = await env.KV.get(AUTH_CONFIG.TOKEN_CACHE_KEY);
    if (!cached) return null;

    return JSON.parse(cached);
  } catch (error) {
    console.error("Cache read error:", error);
    return null;
  }
}

/**
 * Check if token is still valid (with buffer time)
 */
function isTokenValid(tokenData) {
  if (!tokenData || !tokenData.expires_at) return false;
  
  const now = Date.now();
  const bufferMs = AUTH_CONFIG.CACHE_BUFFER_MINUTES * 60 * 1000;
  
  return tokenData.expires_at - bufferMs > now;
}

/**
 * Make authenticated API request
 */
export async function makeAuthenticatedRequest(env, url, options = {}) {
  try {
    // Get valid token
    const token = await getCopernicusToken(env);

    // Merge auth header with any provided headers
    const headers = {
      ...options.headers,
      "Authorization": `Bearer ${token}`,
      "User-Agent": "BGAPP-Angola/2.0"
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    // If unauthorized, try to refresh and retry once
    if (response.status === 401) {
      console.log("Token expired, refreshing...");
      const newToken = await refreshAccessToken(env);
      
      headers.Authorization = `Bearer ${newToken}`;
      return fetch(url, { ...options, headers });
    }

    return response;

  } catch (error) {
    console.error("Authenticated request error:", error);
    throw error;
  }
}

// Export config for testing
export { AUTH_CONFIG };

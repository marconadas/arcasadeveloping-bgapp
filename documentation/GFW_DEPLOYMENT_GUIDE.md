# 🎣 Global Fishing Watch Integration - Deployment Guide

## Overview
This guide explains how to deploy and configure the Global Fishing Watch (GFW) integration for BGAPP's realtime Angola monitoring system.

## 🚀 Quick Deployment

### Option 1: Using the Configuration Script (Recommended)
```bash
# 1. Navigate to the project root
cd /Users/marconadas/Documents/CODE/MareDatum_DevOps/arcasadeveloping-bgapp

# 2. Run the configuration script
./configure-gfw-production.sh

# 3. Deploy the worker
cd workers
wrangler deploy --env production
```

### Option 2: Manual Configuration via Cloudflare Dashboard

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com
   - Navigate to: Workers & Pages → `bgapp-api-worker`
   - Go to: Settings → Variables

2. **Add GFW Token as Secret**
   - Click "Add variable"
   - Type: **Secret** (⚠️ NOT plain text)
   - Name: `GFW_API_TOKEN`
   - Value:
   ```
   <your-gfw-api-token>
   ```

3. **Add Admin Access Key (Optional)**
   - Click "Add variable" 
   - Type: **Secret**
   - Name: `ADMIN_ACCESS_KEY`
   - Value: Generate a secure key (e.g., `bgapp-admin-$(date +%s)-$(openssl rand -hex 16)`)

4. **Save and Deploy**
   - Click "Save and deploy"

## 🧪 Testing the Integration

### 1. Test Local Development
```bash
# Start local worker
cd workers
wrangler dev --env production

# Test endpoints
./test-gfw-realtime-integration.sh
```

### 2. Test Production Endpoints
```bash
# Test Copernicus data aggregation
curl https://bgapp-api-worker.majearcasa.workers.dev/api/realtime/data

# Test GFW vessel presence
curl https://bgapp-api-worker.majearcasa.workers.dev/api/gfw/vessel-presence

# Test GFW status
curl https://bgapp-api-worker.majearcasa.workers.dev/api/config/gfw-status
```

### 3. Verify Frontend Integration
Open in browser:
- Production: https://bgapp-frontend.pages.dev/realtime_angola.html
- Check for:
  - ✅ Real-time KPIs updating (SST, Chlorophyll, Salinity)
  - ✅ "Embarcações Ativas" showing vessel count
  - ✅ 🚢 button toggles GFW vessel layer on map
  - ✅ Console shows "GFW Integration inicializada"

## 📊 Architecture Overview

```
┌─────────────────────────┐
│   Frontend (Pages)      │
│  realtime_angola.html   │
│  gfw-integration.js     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Worker API            │
│ bgapp-api-worker.js     │
├─────────────────────────┤
│ /api/realtime/data      │ ← Copernicus aggregation
│ /api/gfw/vessel-presence│ ← GFW vessel data
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  External Services      │
├─────────────────────────┤
│ • Copernicus Marine     │
│ • Global Fishing Watch  │
└─────────────────────────┘
```

## 🔑 Environment Variables

### Required Secrets (via Cloudflare Dashboard or wrangler secret)
- `GFW_API_TOKEN`: Global Fishing Watch API token
- `ADMIN_ACCESS_KEY`: Admin access key for protected endpoints

### Public Variables (in wrangler.toml)
- `NODE_ENV`: "production"
- `API_VERSION`: "1.2.0"  
- `ALLOWED_ORIGINS`: Allowed CORS origins
- `FRONTEND_BASE`: Frontend base URL

## 🚨 Troubleshooting

### Token Not Working?
1. Check token is configured as **Secret** not plain text
2. Verify token in dashboard: Settings → Variables
3. Check worker logs: Functions → Real-time logs

### CORS Issues?
1. Verify origin is in `ALLOWED_ORIGINS` in wrangler.toml
2. Check browser console for specific CORS error

### No Vessel Data?
1. Check GFW API status: https://api.globalfishingwatch.org/v3/
2. Verify token expiration (valid until 2033)
3. Check Angola EEZ bbox coordinates in worker

## 📝 API Endpoints

### Realtime Data Aggregation
```
GET /api/realtime/data
Response: {
  "temperature": 25.3,
  "salinity": 35.2,
  "chlorophyll": 0.45,
  "current_speed": 0.23,
  "timestamp": "2025-01-16T...",
  "data_points": 1247,
  "source": "copernicus_authenticated_angola.json"
}
```

### GFW Vessel Presence
```
GET /api/gfw/vessel-presence
Response: {
  "vessel_count": 42,
  "total_hours": 1234.5,
  "window_hours": 24,
  "updated_at": "2025-01-16T..."
}
```

### GFW Configuration Status
```
GET /api/config/gfw-status
Response: {
  "status": "active",
  "integration": "global_fishing_watch",
  "version": "1.0.0",
  "token_configured": true,
  "features": ["fishing_activity", "heatmaps", ...],
  "timestamp": "2025-01-16T..."
}
```

## 🔒 Security Considerations

1. **Never commit secrets to git**
   - Use Cloudflare dashboard or wrangler secret
   - Keep tokens out of wrangler.toml

2. **Token Protection**
   - `/api/config/gfw-token` requires admin key
   - Production tokens should be rotated periodically

3. **CORS Configuration**
   - Only allow trusted origins
   - Update `ALLOWED_ORIGINS` as needed

## 📱 Support

For issues or questions:
1. Check worker logs in Cloudflare dashboard
2. Review this guide and troubleshooting section
3. Test with provided scripts
4. Contact: support@arcasadeveloping.org

---

Last Updated: January 16, 2025
Version: 1.0.0

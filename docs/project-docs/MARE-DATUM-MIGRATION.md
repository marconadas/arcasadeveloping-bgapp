# 🌊 MARE-DATUM Organization Migration Guide

## 📋 Migration Status

✅ **Git Repository Preparation**: Complete
- Cleaned up legacy backup files and outdated documentation
- All critical fixes committed and pushed to main repository
- Remote `mare-datum` configured and ready

⚠️ **Next Steps Required**: Repository creation needed in MARE-DATUM organization

## 🚀 Recent Critical Fixes Included

### 1. Temperature Heatmap Animation Fix
- **Issue**: Temperature layer showing only green color with no animation
- **Fix**: Resolved gradient override bug in `leaflet-heat-optimized.ts`
- **Files**: `apps/realtime-angola/src/lib/leaflet-heat-optimized.ts`, `TemperatureHeatmapLayer.tsx`
- **Status**: ✅ Working with full color range and smooth animation

### 2. Copernicus API Integration Fix
- **Issue**: Timeout errors and missing endpoints on production admin dashboard
- **Fix**: Direct worker calls with retry logic, added missing API endpoints
- **Files**: `apps/admin-dashboard/src/components/copernicus/copernicus-official.tsx`, `infrastructure/workers/api-worker.js`
- **Status**: ✅ All 3 Copernicus APIs working (OData, STAC, OpenSearch)

## 🔧 Required Actions for MARE-DATUM Organization

### Step 1: Create Repository in MARE-DATUM Organization
```bash
# Option A: Create new repository 'bgapp-platform' in MARE-DATUM
# Option B: Fork existing repository to MARE-DATUM
# Option C: Create 'arcasadeveloping-bgapp' in MARE-DATUM for consistency
```

### Step 2: Push Code to MARE-DATUM (Once repo exists)
```bash
# The remote is already configured:
git remote -v
# mare-datum	https://github.com/MARE-DATUM/arcasadeveloping-bgapp.git

# Push all branches once repository exists:
git push mare-datum --all
git push mare-datum --tags
```

### Step 3: Update Repository Settings
```bash
# Set MARE-DATUM as new upstream:
git branch --set-upstream-to=mare-datum/main main

# Verify configuration:
git remote show mare-datum
```

## 🏗️ Current Project Structure

```
arcasadeveloping-bgapp/
├── apps/
│   ├── frontend/                    # Main static frontend (Port 8080)
│   ├── admin-dashboard/             # Next.js admin interface (Port 3000)
│   └── realtime-angola/             # Real-time visualization app (Port 3000)
├── infrastructure/
│   └── workers/                     # Cloudflare Workers (API backend)
├── src/bgapp/                       # Python ML and data processing
└── docs/                           # Project documentation
```

## 🌐 Live Deployments

### Production URLs
- **Main Frontend**: https://bgapp-frontend.pages.dev/
- **Admin Dashboard**: https://bgapp-admin.pages.dev/
- **Realtime Angola**: https://bgapp-realtime.pages.dev/
- **API Worker**: https://bgapp-api-worker.majearcasa.workers.dev/

### Development Commands
```bash
# Frontend development
npm run dev                          # Port 8080 (apps/frontend/)
npm run dev:admin                    # Port 3000 (admin-dashboard/)
npm run dev:realtime                 # Port 3000 (realtime-angola/)

# Production deployment
npm run deploy                       # Deploy frontend to Cloudflare Pages
npm run deploy:admin                 # Deploy admin dashboard
npm run deploy:realtime              # Deploy realtime app

# Worker development
cd infrastructure/workers
wrangler dev                         # Local worker development
wrangler deploy                      # Deploy to Cloudflare Workers
```

## 🔑 Environment Configuration

### Required Secrets (Already configured)
```bash
# Cloudflare Workers Secrets
wrangler secret list
# ├── COPERNICUS_USERNAME ✅
# ├── COPERNICUS_PASSWORD ✅
# ├── GFW_API_TOKEN ✅
# └── ADMIN_ACCESS_KEY ✅
```

### Key Integration Points
- **Copernicus Marine Service**: Real-time oceanographic data (temperature, chlorophyll, salinity)
- **Global Fishing Watch**: Vessel tracking and fishing data
- **Cloudflare D1**: Production database with vessel and marine data
- **Cloudflare KV**: High-performance caching layer

## 📊 System Architecture

### Data Flow
```
Copernicus API → Cloudflare Workers → KV Cache → Frontend
GFW API → Worker Processing → D1 Database → Admin Dashboard
User Actions → Next.js API Routes → Workers → Database
```

### Technology Stack
- **Frontend**: deck.gl, Three.js, Mapbox GL, D3.js
- **Backend**: Cloudflare Workers, Next.js API Routes, FastAPI (Python)
- **Database**: Cloudflare D1 (SQLite), PostgreSQL+PostGIS (development)
- **UI Framework**: Next.js 14, Radix UI, Tailwind CSS
- **Deployment**: Cloudflare Pages + Workers

## 🤝 New Collaborator Onboarding

### Development Environment Setup
```bash
# 1. Clone repository (once available in MARE-DATUM)
git clone https://github.com/MARE-DATUM/arcasadeveloping-bgapp.git
cd arcasadeveloping-bgapp

# 2. Install dependencies
npm install                          # Root dependencies
cd apps/admin-dashboard && npm install
cd ../realtime-angola && npm install

# 3. Install Python dependencies (optional)
pip install -r requirements.txt

# 4. Start development servers
npm run dev                          # Main frontend (8080)
npm run dev:admin                    # Admin dashboard (3000)
npm run dev:realtime                 # Realtime app (3000)
```

### Key Files to Understand
```bash
# Configuration
├── CLAUDE.md                        # Development guidelines and commands
├── package.json                     # Root project configuration
├── infrastructure/workers/wrangler.toml    # Cloudflare Workers config

# Critical Components
├── apps/admin-dashboard/src/components/copernicus/
├── apps/realtime-angola/src/components/map/
├── infrastructure/workers/api-worker.js
└── src/bgapp/                       # Python ML and data processing
```

### Testing the System
```bash
# 1. Test API endpoints
curl https://bgapp-api-worker.majearcasa.workers.dev/health
curl https://bgapp-api-worker.majearcasa.workers.dev/copernicus/angola-marine

# 2. Test admin dashboard
open https://bgapp-admin.pages.dev/
# Check: Copernicus Integration should show "ONLINE" status

# 3. Test realtime visualization
open https://bgapp-realtime.pages.dev/
# Check: Temperature layer should show full color range with animation
```

## 🎯 December 2025 Mission Goals

### Current Status: Production Ready ✅
- **Performance**: Sub-2 second load times achieved
- **Real-time Data**: Copernicus and GFW integrations working
- **Visualizations**: deck.gl marine data layers optimized
- **Mobile**: Responsive design across all devices
- **Admin Interface**: Professional Next.js dashboard complete

### Key Demonstration Features
1. **Angola EEZ Marine Monitoring**: Real-time oceanographic data visualization
2. **Vessel Tracking**: Live fishing vessel monitoring via Global Fishing Watch
3. **Temperature/Chlorophyll Mapping**: Interactive heatmaps with smooth animations
4. **ML Analytics**: Predictive models for marine biodiversity analysis
5. **Admin Dashboard**: Professional data management interface

## 📞 Support & Contact

### Current Repository
- **Original**: https://github.com/marconadas/arcasadeveloping-bgapp
- **Status**: All latest fixes pushed and ready for migration

### Technical Documentation
- **Development Guide**: See `CLAUDE.md` for comprehensive development instructions
- **API Documentation**: Available at worker endpoints `/api/docs`
- **Architecture**: Multi-app structure with Cloudflare edge deployment

---

## ⚡ Quick Start for New Collaborator

1. **Access**: Ensure you have access to MARE-DATUM organization
2. **Repository**: Ask org admin to create repository or fork existing one
3. **Clone**: `git clone https://github.com/MARE-DATUM/[repository-name].git`
4. **Install**: `npm install && cd apps/admin-dashboard && npm install`
5. **Develop**: `npm run dev` for main app, `npm run dev:admin` for dashboard
6. **Deploy**: `npm run deploy` when ready for production

The system is production-ready with all critical marine data integrations working. The new collaborator can immediately start contributing to Angola's marine biodiversity monitoring platform! 🌊
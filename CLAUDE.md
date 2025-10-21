# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BGAPP (Biodiversity and Geographic Analysis Platform) is a comprehensive scientific platform for oceanographic analysis and marine biodiversity monitoring in Angola's Exclusive Economic Zone. The project consists of multiple Next.js applications deployed on Cloudflare infrastructure with advanced WebGL visualizations, machine learning models, and real-time oceanographic data integration.

**Mission Critical**: December 2025 presentation to the Government of Angola
**Organization**: MareDatum Consultoria e Gestão de Projectos Unipessoal LDA
**Status**: Production-ready with 85% confidence level
**Key Personnel**: Paulo Fernandes (Director), Marcos Santos (Tech Lead), Ludmilson Francisco (Software Engineer)

### Critical Context
- **Government Presentation**: December 2025 - Must demonstrate real-time marine monitoring capabilities
- **Current Focus**: Performance optimization for Admin Dashboard and Realtime Angola apps
- **Infrastructure**: All deployed on Cloudflare (Pages for frontends, Workers for APIs, D1 for database)
- **Data Sources**: NASA EarthData, Global Fishing Watch, Copernicus Marine Service
- **Angola EEZ Coverage**: Two separate polygons (source: D1 `eez_boundaries` table)
  - **Continental Angola**: -17.29° to -5.36° latitude, 8.30° to 13.84° longitude
  - **Cabinda (exclave)**: ~-5.8° to -4.3° latitude, ~12.0° to 13.5° longitude
  - **Combined bounds**: -17.29° to -4.3° latitude, 8.30° to 13.84° longitude

## High-Level Architecture

### Application Stack
```
Client Layer:
├── apps/admin-dashboard/    → Next.js 14 admin interface (Radix UI)
├── apps/realtime-angola/    → Real-time visualization (deck.gl 9.1.14)
└── apps/frontend/          → Static scientific dashboard (WebGL)
     ↓
API Layer:
├── infrastructure/workers/  → Cloudflare Workers (15+ specialized APIs)
│   ├── api-worker.js       → Main API (25+ endpoints)
│   ├── gfw-proxy.js        → Global Fishing Watch integration
│   ├── nasa-earthdata-proxy.js → NASA satellite data
│   └── copernicus-webhook.js   → Copernicus marine data
     ↓
Data Layer:
├── Cloudflare D1           → Production SQLite database
├── Cloudflare KV           → Caching layer (24hr TTL)
└── External APIs           → GFW, NASA, Copernicus integrations
```

### Data Flow Architecture
1. **Real-time Pipeline**: External APIs → Workers → KV Cache → Frontend Visualization
2. **Admin Operations**: Dashboard → API Routes → Workers → D1 Database
3. **ML Processing**: Raw Data → Python Services → Model Predictions → API Endpoints

## Prerequisites

### Initial Setup
```bash
# 1. Install Node.js (required: >=18.0.0)
node --version  # Should be 18.x or higher

# 2. Authenticate with Cloudflare (required for all deployments)
wrangler login  # Opens browser for OAuth authentication
wrangler whoami # Verify authentication

# 3. Install dependencies
npm install
cd apps/admin-dashboard && npm install
cd apps/realtime-angola && npm install
```

### Environment Authentication
All deployment commands require Cloudflare authentication. If you see errors like "Not authenticated":
```bash
wrangler logout  # Clear existing auth
wrangler login   # Re-authenticate
```

## Essential Commands

### Development
```bash
# Quick start for each application
npm run dev:admin          # Admin dashboard on :3000
npm run dev:realtime       # Realtime Angola on :3000
npm run dev                # Main frontend on :8080

# Alternative ports to avoid conflicts (when port 3000 is busy)
PORT=3002 npm run dev:admin       # Admin on :3002
PORT=3002 npm run dev:realtime    # Realtime on :3002
PORT=4000 npm run dev              # Frontend on :4000

# Worker development (run from project root)
wrangler dev infrastructure/workers/api-worker.js --port 8787 --local
wrangler dev infrastructure/workers/bgapp-api-worker.js --local
wrangler dev infrastructure/workers/nasa-earthdata-proxy.js --local

# Build commands
npm run build              # Build main frontend with optimization
npm run optimize           # Optimize assets before build
cd apps/admin-dashboard && npm run build
cd apps/realtime-angola && npm run build:prod  # Production build with static export

# Testing & Validation
npm run lint               # Run ESLint across all apps
npm run format             # Format code with Prettier
cd apps/admin-dashboard && npm run test:local
cd apps/realtime-angola && npm run dev
```

### Deployment
```bash
# Deploy individual apps
npm run deploy:admin       # Deploy admin to bgapp-admin.pages.dev
npm run deploy:realtime    # Deploy realtime to bgapp-realtime.pages.dev
npm run deploy:workers     # Deploy all workers to production

# Deploy everything
npm run deploy:all

# Worker-specific deployment
wrangler deploy infrastructure/workers/api-worker.js --env production
```

### Database Operations
```bash
# D1 Database commands
wrangler d1 execute bgapp-data --command "SELECT * FROM vessel_data;"
wrangler d1 execute bgapp-data --file infrastructure/workers/schema-enhanced.sql
wrangler d1 execute bgapp-data --remote --command "SELECT COUNT(*) FROM sst_data;"
wrangler d1 backup create bgapp-data
wrangler d1 list

# KV Namespace operations
wrangler kv:namespace list
wrangler kv:key list --namespace-id=<id>

# Quick database status check
wrangler d1 execute bgapp-data --remote --command "SELECT
  (SELECT COUNT(*) FROM vessel_data) as vessels,
  (SELECT COUNT(*) FROM sst_data) as sst,
  (SELECT COUNT(*) FROM ocean_color_data) as ocean_color,
  (SELECT COUNT(*) FROM ml_predictions) as ml_predictions;"
```

### Secret Management
```bash
# Production secrets (required)
wrangler secret put GFW_API_TOKEN
wrangler secret put NASA_EARTHDATA_TOKEN
wrangler secret put ADMIN_ACCESS_KEY
wrangler secret put COPERNICUS_USERNAME
wrangler secret put COPERNICUS_PASSWORD
```

## Code Architecture Insights

### Worker Pattern (infrastructure/workers/)
All workers follow a consistent pattern with request routing, CORS handling, and error management:
```javascript
// Standard worker structure:
export default {
  async fetch(request, env, ctx) {
    // CORS headers
    // Route matching via URL pathname
    // Environment variable access (env.BINDING_NAME)
    // KV cache checks (env.BGAPP_KV)
    // D1 database queries (env.BGAPP_DATA)
    // Response with proper headers
  }
}
```

### Next.js Apps Configuration
Both Next.js apps require careful configuration management:

**Admin Dashboard** (`apps/admin-dashboard/`):
- `next.config.js`: Production config with `output: 'export'` for Cloudflare Pages
- **API Routes Constraint**: Next.js API routes are **completely disabled** due to static export requirement
- **Workaround Pattern**: All backend logic MUST be in Cloudflare Workers (never in `pages/api/`)
- Uses port 3000 by default, with alternatives at 3002, 4000, 8080
- Build: `npm run build` creates static `out/` directory

**Realtime Angola** (`apps/realtime-angola/`):
- `next.config.mjs`: Development config (commented out static export)
- `next.config.prod.mjs`: Production config with `output: 'export'`
- Build production: `npm run build:prod` performs these steps:
  1. Copies `next.config.prod.mjs` → `next.config.mjs`
  2. Runs `next build` with static export enabled
  3. Creates `out/` directory ready for Cloudflare Pages
- Development: `npm run dev` uses dev config (allows hot reload)

**Critical Architecture Constraints**:
- Admin dashboard has `output: 'export'` **permanently enabled** (no API routes possible)
- Realtime Angola **swaps configs** during build process via npm script
- Both apps have TypeScript and ESLint errors temporarily ignored for urgent deployments
- **Never create** `pages/api/*` files in Admin Dashboard - they will not work
- **Always use** Cloudflare Workers at `infrastructure/workers/` for backend logic

### deck.gl Visualization Layers (apps/realtime-angola/src/components/map/)
Each data layer follows a consistent component pattern:
- Props: `data`, `visible`, `opacity`, `colorScale`
- Returns: deck.gl layer instance with WebGL optimizations
- Performance: Use clustering for >1000 points, implement viewport culling

### Database Schema (Enhanced)
The D1 database uses an enhanced schema with these core tables:
- `vessel_data`: AIS vessel tracking with enhanced fields
- `sst_data`, `ocean_color_data`, `salinity_data`: NASA/Copernicus oceanographic data
- `ml_predictions`: Machine learning model outputs
- `eez_boundaries`: Angola EEZ boundary definitions
- `fishing_events`, `marine_data`: Aggregated marine activity

### API Endpoints Structure
Main API worker endpoints follow RESTful patterns:
- `/api/vessels/*` - Vessel tracking and AIS data
- `/api/nasa/*` - NASA Earth Data (ocean color, SST, vessel lights, salinity)
- `/api/gfw/*` - Global Fishing Watch data (vessel presence, fishing activity)
- `/api/ml/*` - Machine learning predictions
- `/api/realtime/*` - Real-time data aggregations
- `/api/dashboard/overview` - Dashboard statistics
- `/api/environmental/*` - Combined oceanographic data
- `/api/database/*` - Direct D1 database queries
- `/admin-dashboard/system-health` - System health metrics
- `/health` - Basic health check endpoint

### Worker Files Architecture
Key workers in `infrastructure/workers/`:
- `api-worker.js` (114KB): Main API with 25+ endpoints
- `bgapp-api-worker.js` (8KB): Simplified D1-focused API
- `nasa-earthdata-proxy.js`: NASA data proxy with caching
- `gfw-proxy.js`: Global Fishing Watch integration
- `copernicus-webhook.js`: Copernicus data webhook handler

Each worker includes CORS handling, KV caching, and D1 database bindings.

## Performance Optimization Patterns

### KV Caching Strategy
```javascript
// Standard caching pattern used across workers:
const cacheKey = `${endpoint}_${lat}_${lon}`;
const cached = await env.BGAPP_KV.get(cacheKey);
if (cached) return new Response(cached, { headers: { 'X-Cache': 'HIT' }});
// ... fetch fresh data ...
await env.BGAPP_KV.put(cacheKey, JSON.stringify(data), { expirationTtl: 86400 });
```

### deck.gl Performance
- Layer updates use `updateTriggers` to prevent unnecessary re-renders
- Large datasets use `DataFilterExtension` for GPU-based filtering
- Implement `getPosition` accessor functions for efficient data transformation

### Database Query Optimization
- Use indexed columns for geospatial queries (latitude, longitude)
- Implement pagination for large result sets
- Batch inserts for data population scripts

## Testing Strategy

### Playwright E2E Testing
The project uses Playwright for end-to-end testing with visual regression:
```bash
# Install Playwright browsers (first time only)
cd apps/realtime-angola
npx playwright install

# Run Playwright tests
npx playwright test

# Run with UI for debugging
npx playwright test --ui

# View test report
npx playwright show-report
```

**Test Screenshots**: All Playwright test screenshots are saved to `.playwright-mcp/` directory for visual verification.

### Local Development Testing
```bash
# Test each app independently
cd apps/admin-dashboard && npm run test:local
cd apps/realtime-angola && npm run dev

# Test worker endpoints
curl http://localhost:8787/api/health
curl "http://localhost:8787/api/nasa/sst?lat=-12.5&lon=13.2"

# Test Python FastAPI backend (development only)
python -m src.bgapp.api.ml_endpoints  # Runs on :8000
```

### Production Health Checks
```bash
# Verify all services
curl -I https://bgapp-admin.pages.dev
curl -I https://bgapp-realtime.pages.dev
curl https://bgapp-api-worker.majearcasa.workers.dev/health

# Monitor worker logs
wrangler tail api-worker --format=pretty
wrangler tail nasa-earthdata-proxy --format=pretty
wrangler tail bgapp-api-worker --format=pretty

# Use monitoring script
.claude/monitor-apis.sh  # Automated health check for all services
```

## Integration Points

### External API Integrations
1. **Global Fishing Watch (GFW)**: Vessel tracking, fishing activity detection
   - Rate limit: 1000 req/hour
   - Token: `GFW_API_TOKEN` secret

2. **NASA EarthData**: Ocean color, SST, vessel lights
   - Proxy: nasa-earthdata-proxy.js
   - Fallback: Pattern-based synthetic data

3. **Copernicus Marine Service**: Real-time oceanographic data
   - Auth: Username/password secrets
   - Cache: 24-hour TTL in KV

### Environment Variables
Required production secrets:
- `GFW_API_TOKEN`: Global Fishing Watch API access
- `NASA_EARTHDATA_TOKEN`: NASA data access
- `ADMIN_ACCESS_KEY`: Admin authentication
- `COPERNICUS_USERNAME/PASSWORD`: Marine data access

Worker environment bindings:
- `BGAPP_KV`: KV namespace for caching
- `BGAPP_DATA`: D1 database instance
- `ALLOWED_ORIGINS`: CORS allowed origins list

## Common Development Patterns

### Adding New API Endpoints
1. Add route handler in `infrastructure/workers/api-worker.js`
2. Implement caching with KV namespace
3. Add fallback data for resilience
4. Update CORS if new origin needed

### Creating New Visualization Layers
1. Create component in `apps/realtime-angola/src/components/map/`
2. Follow existing layer patterns (see TemperatureHeatmapLayer.tsx)
3. Add to LayersPanel.tsx for UI control
4. Optimize for mobile viewports

### Database Schema Changes
1. Create migration SQL in `infrastructure/workers/`
2. Apply with `wrangler d1 execute bgapp-data --file=migration.sql`
3. Update corresponding worker queries
4. Test data population scripts

## Production URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Admin Dashboard | bgapp-admin.pages.dev | Administrative interface |
| Realtime Angola | bgapp-realtime.pages.dev | Real-time monitoring |
| Frontend | bgapp-frontend.pages.dev | Main platform |
| API Worker | bgapp-api-worker.majearcasa.workers.dev | Primary API |
| NASA Proxy | nasa-earthdata-proxy.majearcasa.workers.dev | NASA data proxy |

## Python Development Setup

### Installation
```bash
# Install Python dependencies
pip install -r requirements.txt

# Key Python packages:
# - fastapi & uvicorn: API framework
# - pandas & numpy: Data processing
# - tensorflow & scikit-learn: Machine learning
# - psycopg2 & sqlalchemy: Database access
```

### Data Population Workers
The project includes specialized workers for populating D1 database:
- `populate-enhanced-tables.js`: General data population
- `populate-ml-predictions.js`: ML model predictions
- `populate-fishing-events.js`: Fishing activity data
- `populate-marine-data.js`: Marine environmental data
- `populate-eez-boundaries.js`: EEZ boundary definitions
- `nasa-data-populator.js`: NASA Earth data integration

Deploy with: `wrangler deploy infrastructure/workers/<worker-name>.js --config <worker-name>.toml`

## Troubleshooting

### Port Conflicts
```bash
# Check what's using port 3000
lsof -i :3000
# Use alternative ports
PORT=3002 npm run dev:admin
PORT=4000 npm run dev:realtime
```

### Worker Size Limits
Workers have 1MB limit. If you hit this:
- Split large workers into multiple files
- Remove unused code and dependencies
- Use dynamic imports for large libraries

### API Routes Not Working
- Admin Dashboard: API routes never work (static export always enabled)
- Realtime Angola: Check if `next.config.mjs` has correct configuration
- Solution: Use Cloudflare Workers for all API functionality

### D1 Database Issues
```bash
# Verify database binding
wrangler d1 list
# Expected: bgapp-data with ID 46ed7435-1b25-498d-b832-7bef98061df3
# Test connection
wrangler d1 execute bgapp-data --remote --command "SELECT 1;"
```

### CORS Errors
Update `ALLOWED_ORIGINS` in worker environment variables:
```bash
wrangler secret put ALLOWED_ORIGINS --name api-worker
# Enter: https://bgapp-admin.pages.dev,https://bgapp-realtime.pages.dev
```

### TypeScript/ESLint Errors
Both Next.js apps have errors temporarily ignored. To check actual errors:
```bash
# Remove ignoreDuringBuilds from next.config
cd apps/admin-dashboard && npx tsc --noEmit
cd apps/realtime-angola && npx tsc --noEmit
```

## Documentation Resources

### Architecture Documentation
The project includes comprehensive C4 architecture diagrams located in `docs/architecture/`:
- `c4-context.puml`: System context diagram showing BGAPP in the Angola marine ecosystem
- `c4-container.puml`: Technical architecture with all frontend apps, workers, and data stores
- `c4-admin-components.puml`: Admin Dashboard internal components
- `c4-realtime-components.puml`: Realtime Angola specialized components
- `data-flow.md`: Mermaid diagrams showing real-time data pipelines

View PlantUML diagrams:
```bash
# Install PlantUML
brew install plantuml

# Generate SVG diagrams (recommended for presentations)
plantuml -tsvg docs/architecture/*.puml
```

### Team Structure & Responsibilities
See `STAKEHOLDERS.md` for complete organizational structure:
- **Executive**: Paulo Fernandes (Director), Eng. Leite (Co-Director)
- **Technical Lead**: Marcos Santos - Architecture, ML, Performance, DevOps
- **Software Engineer**: Ludmilson Francisco - Features, APIs, Admin Dashboard
- **Communication**: Luis Santos - Documentation, presentations, stakeholder coordination

RACI Matrix defines clear responsibilities for each domain (Frontend, Admin, Realtime, Workers, ML).

### Technical Inventory
See `INVENTORY_APPS.md` for detailed app specifications:
- Bundle sizes: Frontend (27MB), Admin (891MB dev), Realtime (1.3GB dev)
- Performance targets: All apps < 2s load time
- Current status: Frontend (1.8s ✅), Admin (2.3s 🔄), Realtime (2.1s 🔄)
- December 2025 readiness: 85% confidence with planned optimizations

### API Monitoring
The `.claude/` directory contains monitoring tools and guides:
- `.claude/monitor-apis.sh`: Automated health checks for all services
- `.claude/API_MONITORING_GUIDE.md`: Comprehensive monitoring setup
- `.claude/MONITORING_QUICKSTART.md`: Quick start for API monitoring

Run health checks:
```bash
bash .claude/monitor-apis.sh
```

**Prerequisites for monitoring script**:
- `curl`: HTTP requests (pre-installed on macOS/Linux)
- `jq`: JSON parsing (install: `brew install jq` or `apt-get install jq`)
- Internet connectivity to reach production URLs

## Security Best Practices

### Recent Security Fixes (October 2025)
The project recently addressed critical security issues. Always follow these practices:

1. **API Token Management**:
   - Never commit secrets to repository
   - Use Wrangler secrets: `wrangler secret put SECRET_NAME`
   - Rotate tokens every 90 days
   - Verify secrets: `wrangler secret list --name worker-name`

2. **CORS Configuration**:
   - Keep `ALLOWED_ORIGINS` strict and minimal
   - Never use wildcard `*` in production
   - Test CORS changes locally before deploying

3. **Build Validation**:
   - Always run `npm run build` before deploying
   - Check TypeScript errors: `npm run type-check`
   - Run linting: `npm run lint`
   - Verify no hardcoded secrets in build output

4. **Worker Security**:
   - Validate all user inputs in worker endpoints
   - Implement rate limiting for public endpoints
   - Use environment bindings instead of hardcoded values
   - Monitor worker logs for suspicious activity

## Performance Targets (December 2025)

Critical metrics for government presentation:

| Metric | Target | Current | Priority |
|--------|--------|---------|----------|
| Frontend Load Time | < 2.0s | 1.8s ✅ | Maintain |
| Admin Dashboard Load | < 2.0s | 2.3s 🔄 | **High** |
| Realtime Angola Load | < 2.0s | 2.1s 🔄 | **Critical** |
| API Response Time | < 100ms | 95ms ✅ | Maintain |
| Map Interactions | < 100ms | 85ms ✅ | Maintain |
| WebSocket Latency | < 50ms | 45ms ✅ | Maintain |
| ML Model Accuracy | > 95% | 95%+ ✅ | Maintain |

**Focus Areas for Optimization**:
1. Admin Dashboard bundle size reduction (high priority)
2. Realtime Angola WebGL optimizations (critical)
3. Mobile responsive performance (medium)
4. Offline demo capabilities (backup plan)

## Quick Reference Workflows

### Starting Fresh Development
```bash
# 1. Authenticate with Cloudflare (first time only)
wrangler login
wrangler whoami  # Verify authentication

# 2. Install dependencies (if needed)
npm install
cd apps/admin-dashboard && npm install
cd apps/realtime-angola && npm install

# 3. Start the app you're working on
npm run dev:admin      # Admin Dashboard
npm run dev:realtime   # Realtime Angola
npm run dev            # Main Frontend

# 4. Start relevant workers (optional, for backend testing)
wrangler dev infrastructure/workers/api-worker.js --local
```

### Checking Data Status
```bash
# Quick database health check
wrangler d1 execute bgapp-data --remote --command "
SELECT
  'vessel_data' as table_name, COUNT(*) as count FROM vessel_data
UNION ALL SELECT 'sst_data', COUNT(*) FROM sst_data
UNION ALL SELECT 'ocean_color_data', COUNT(*) FROM ocean_color_data
UNION ALL SELECT 'ml_predictions', COUNT(*) FROM ml_predictions
ORDER BY count DESC;"

# Check API health
bash .claude/monitor-apis.sh
```

### Emergency Deployment
```bash
# When you need to deploy quickly (skips tests)
npm run deploy:all

# Individual emergency deploys
wrangler pages deploy apps/admin-dashboard/out --project-name bgapp-admin --commit-dirty=true
wrangler pages deploy apps/realtime-angola/out --project-name bgapp-realtime --commit-dirty=true
wrangler deploy infrastructure/workers/api-worker.js --env production
```

### Debugging Production Issues
```bash
# View live logs
wrangler tail api-worker --format=pretty
wrangler tail bgapp-api-worker --format=pretty

# Check specific endpoint
curl -I https://bgapp-api-worker.majearcasa.workers.dev/health
curl "https://bgapp-api-worker.majearcasa.workers.dev/api/dashboard/overview"

# Test with authentication
curl -H "X-Admin-Key: $ADMIN_ACCESS_KEY" \
  https://bgapp-api-worker.majearcasa.workers.dev/admin-dashboard/system-health
```

## Key Architectural Decisions

### Why Cloudflare Workers Instead of Next.js API Routes?
The project architecture uses Cloudflare Workers exclusively for backend logic due to:
1. **Static Export Requirement**: Both Next.js apps use `output: 'export'` for Cloudflare Pages deployment
2. **API Routes Incompatibility**: Static export disables Next.js API routes (`pages/api/*`)
3. **Serverless Benefits**: Workers provide global edge deployment, automatic scaling, and 0ms cold starts
4. **Cost Efficiency**: Workers are more cost-effective than maintaining separate backend infrastructure

**Pattern to Follow**:
- ❌ Never create `apps/*/pages/api/*` files
- ✅ Always create backend logic in `infrastructure/workers/*.js`
- ✅ Frontend calls workers via fetch: `fetch('https://worker-name.workers.dev/endpoint')`

### Realtime Angola Config Swap Mechanism
The Realtime Angola app requires different configs for dev vs production:

**Development** (`next.config.mjs`):
- No static export (`output: 'export'` commented out)
- Enables hot module replacement
- Allows dynamic features during development

**Production** (`next.config.prod.mjs`):
- Enables static export (`output: 'export'`)
- Disables dynamic features incompatible with static hosting
- Optimized for Cloudflare Pages deployment

**Build Process**:
```bash
npm run build:prod
# Executes: cp next.config.prod.mjs next.config.mjs && next build
# Result: Overwrites dev config with prod config, then builds
```

**Important**: After production build, `next.config.mjs` contains production settings. To return to development:
```bash
cd apps/realtime-angola
git checkout next.config.mjs  # Restore dev config
npm run dev
```
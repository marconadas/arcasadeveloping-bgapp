# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 MISSION CRITICAL: December 2025 Client Presentation

**PRIMARY OBJECTIVE**: Prepare BGAPP and realtime-angola-nextjs for a major client presentation in December 2025. This is the top priority for all development work.

### Mission Goals:
1. **Production-Ready Platform**: Ensure both BGAPP main platform and realtime-angola-nextjs are fully functional and polished
2. **Performance Optimization**: All visualizations, APIs, and data integrations must perform flawlessly
3. **Client Demonstration**: Platform must showcase Angola's marine biodiversity monitoring capabilities effectively
4. **Professional Polish**: UI/UX must be client-presentation ready with seamless user experience

### December Presentation Requirements:
- **Real-time Data Visualization**: Live oceanographic data from Copernicus and GFW
- **Interactive Maps**: Smooth deck.gl visualizations with vessel tracking and marine data layers
- **Admin Dashboard**: Fully functional Next.js admin interface for data management
- **ML Capabilities**: Demonstrate machine learning models for marine analysis
- **Performance**: Sub-2 second load times, responsive interactions
- **Mobile Compatibility**: Works seamlessly across desktop, tablet, and mobile devices

**⚠️ CRITICAL**: Every change and improvement should be evaluated against these December presentation goals.

## Project Overview

BGAPP (Biodiversity and Geographic Analysis Platform) is a comprehensive scientific platform for oceanographic analysis and marine biodiversity monitoring in Angola's Exclusive Economic Zone. The project consists of multiple applications deployed on Cloudflare infrastructure with advanced WebGL visualizations, machine learning models, and real-time oceanographic data integration.

### 👥 Team & Governance
**Organization**: MareDatum Consultoria e Gestão de Projectos Unipessoal LDA
- **Director Geral**: Sr. Paulo Fernandes
- **Co-Diretor**: Eng. Leite (same permissions as Director)
- **Technical Lead**: Marcos Santos (marconadas)
- **Software Engineer**: Ludmilson Francisco (luddera)
- **Communications**: Luis Santos

📋 **For detailed team responsibilities, escalation procedures, and governance structure, see [STAKEHOLDERS.md](./STAKEHOLDERS.md)**

## 🎯 PROJECT STRUCTURE STATUS (December 2025)

**Current Status**: Successfully reorganized to focused structure with main applications centralized.

### 📁 Current Directory Structure:
```
bgapp/
├── apps/                    # 🎯 All Applications Centralized
│   ├── admin-dashboard/     # Next.js 14 admin interface (primary focus)
│   ├── frontend/           # Main static frontend (deck.gl visualizations)
│   ├── realtime-angola/    # Real-time monitoring Next.js app (mission-critical)
│   └── mapa-enterprise/    # Enterprise mapping features
│
├── infrastructure/         # 🏗️ Infrastructure & Deployment
│   ├── workers/           # Cloudflare Workers (production APIs)
│   ├── configs/           # Configuration files
│   └── deploy/            # Deployment scripts
│
├── archive/              # 📦 Backups & Legacy Files (post-cleanup)
├── docs/                 # 📚 Main Documentation
├── documentation/        # Additional Documentation
└── backup/               # Current backups
```

## Key Architecture Components

### Multi-Application Structure (✅ REORGANIZED & VERIFIED)
- **Frontend (Static)**: `/apps/frontend/` - Main public interface with deck.gl visualizations
- **Admin Dashboard**: `/apps/admin-dashboard/` - Next.js 14 administrative interface
- **Realtime Angola**: `/apps/realtime-angola/` - Specialized Next.js app for real-time data
- **Backend Workers**: `/infrastructure/workers/` - Cloudflare Workers organized by category
- **Python Services**: `/src/bgapp/` - Consolidated Python code with shared utilities

### 🔗 Key Application Details
- **Admin Dashboard**: Next.js 14 with Radix UI, primary admin interface
- **Realtime Angola**: Next.js app with deck.gl for real-time marine data visualization
- **Frontend**: Static frontend with WebGL visualizations and scientific dashboards
- **Infrastructure Workers**: Cloudflare Workers for production APIs and data processing

### Data Integration Stack
- **Copernicus Marine Service**: Real-time oceanographic data
- **Global Fishing Watch (GFW)**: Vessel tracking and fishing data
- **STAC API**: Spatial Temporal Asset Catalog for geospatial data management
- **PostgreSQL + PostGIS**: Geospatial database (development)
- **Cloudflare D1**: Production database
- **Cloudflare KV**: Caching layer

### Deployment Architecture
All applications deploy to Cloudflare:
- **Pages**: Frontend hosting with edge optimization
- **Workers**: Serverless API endpoints with global distribution
- **D1**: SQLite-compatible database
- **KV**: Key-value store for caching

## Development Commands

### Root Project Commands
```bash
# Start main frontend development server
npm run dev                    # Port 8080 (apps/frontend/) - main interface
npm run start                  # Port 8000 (apps/frontend/) - production mode

# Start applications
npm run dev:admin             # Port 3000 (apps/admin-dashboard/)
npm run dev:realtime          # Port 3000 (apps/realtime-angola/)

# Build and optimize assets
npm run build                 # Build all applications
npm run optimize              # Optimize assets using src/scripts/

# Deploy to production
npm run deploy                # Deploy apps/frontend/ to Cloudflare Pages
npm run deploy:admin          # Deploy admin dashboard
npm run deploy:realtime       # Deploy realtime app

# Code quality
npm run lint                  # ESLint for apps/frontend/ JavaScript
npm run format               # Prettier for apps/frontend/ assets
npm run test                 # Test runner (configured)
```

### Admin Dashboard Commands (`apps/admin-dashboard/`)
```bash
# Development servers on different ports
npm run dev                   # Port 3000 (default)
npm run dev:3002             # Port 3002 (alternative)
npm run dev:4000             # Port 4000 (alternative)
npm run dev:8080             # Port 8080 (alternative)
npm run dev:simple           # Simple server fallback

# Build and deployment
npm run build                # Next.js production build
npm run start                # Production server (Port 3000)
npm run start:3002           # Production server (Port 3002)
npm run start:4000           # Production server (Port 4000)
npm run deploy               # Quick deploy to Cloudflare Pages
npm run deploy:watch         # Deploy with file watching
npm run dev:deploy           # Development and deploy workflow

# Code quality and validation
npm run type-check           # TypeScript validation
npm run lint                 # ESLint checks

# Testing workflows
npm run test:local           # Local development test
npm run test:prod            # Production build + deploy test
```

### Cloudflare Workers Commands (`infrastructure/workers/`)
```bash
# Deploy workers
wrangler deploy              # Deploy to production
wrangler dev                 # Local development

# Manage secrets
wrangler secret put GFW_API_TOKEN
wrangler secret put ADMIN_ACCESS_KEY
wrangler secret list

# Database operations
wrangler d1 execute bgapp-data --command "SELECT * FROM vessels;"
wrangler kv:namespace list
```

### Python Development (`src/bgapp/`)
```bash
# Install dependencies
pip install -r requirements.txt
pip install -r requirements-admin.txt  # Admin-specific deps
pip install -r requirements-stac.txt   # STAC integration deps

# Start local API server
python -m src.bgapp.api.ml_endpoints           # Port 8000
python -m src.bgapp.api.ml_retention_endpoints # ML-specific APIs
```

## Technology Stack Integration

### Frontend Technologies
- **deck.gl 9.1.14**: WebGL visualizations for marine data
- **Three.js**: 3D graphics and Unreal Engine integration
- **Mapbox GL**: Base mapping layer
- **D3.js**: Data visualizations and charts
- **Chart.js/Plotly.js**: Scientific plotting

### Backend Technologies
- **Cloudflare Workers**: Primary production API layer
- **Next.js API Routes**: Admin dashboard endpoints
- **FastAPI (Python)**: Local development and ML processing
- **PostgreSQL + PostGIS**: Geospatial data (development)
- **Cloudflare D1 + KV**: Production data layer

### UI Framework (Admin Dashboard)
- **Next.js 14**: React framework with App Router
- **Radix UI**: Headless component primitives
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Animations
- **Lucide React**: Icon system

## Key Environment Configuration

### Required Environment Variables
```bash
# Production (set via wrangler secret put)
GFW_API_TOKEN                 # Global Fishing Watch API access
ADMIN_ACCESS_KEY              # Admin authentication
COPERNICUS_USERNAME           # Copernicus Marine Service
COPERNICUS_PASSWORD

# Development (.env files)
NODE_ENV=development
API_VERSION=1.2.0
FRONTEND_BASE=http://localhost:8080
```

### Cloudflare Bindings
- **BGAPP_KV**: Key-value cache namespace
- **BGAPP_DATA**: D1 database binding
- Production and development environments use same bindings

## 🚀 December Mission Development Workflow

### Mission-Critical Development Priorities (in order):
1. **Performance First**: Every change must improve or maintain performance metrics
2. **User Experience**: Smooth, professional interactions for client demonstration
3. **Data Reliability**: Real-time data must be accurate and consistently available
4. **Visual Polish**: Professional-grade visualizations and UI components
5. **Mobile Responsiveness**: Perfect experience across all device types

### Feature Development (Mission-Focused)

**🎯 DEVELOPMENT FOCUS AREAS**:

#### Primary Development Areas (December Mission Focus):
1. **Admin Dashboard**: Work in `apps/admin-dashboard/src/components/` for client demo workflows
2. **Realtime Visualizations**: Develop in `apps/realtime-angola/src/` for real-time data display
3. **Production APIs**: Add to `infrastructure/workers/` for production deployment
4. **Frontend**: Enhance `apps/frontend/` for main platform features

#### Key File Locations:
- **API Workers**: `infrastructure/workers/api-worker.js`, `gfw-proxy.js`
- **Admin Components**: `apps/admin-dashboard/src/components/`
- **Realtime Features**: `apps/realtime-angola/src/`
- **Frontend Assets**: `apps/frontend/assets/`
- **Configuration**: Root `wrangler.toml`, individual app configs

### Testing Strategy (December-Ready)
- **Admin Dashboard**: `npm run test:local` and `npm run test:prod` - validate demo scenarios
- **API Workers**: Test via Wrangler dev environment - stress test for presentation
- **Integration**: Use test scripts in `/tests/` directory - verify all integrations work
- **Production**: Monitor via Cloudflare Analytics - ensure sub-2s performance
- **Client Demo**: Test complete user journeys from Angola marine data perspective

### Deployment Process (Production-Ready)
1. **Development**: Use `npm run dev` commands for local testing - validate against mission goals
2. **Staging**: Deploy to development workers with `wrangler dev` - performance benchmark
3. **Production**: Deploy via `npm run deploy` commands - zero-downtime deployments only
4. **Verification**: Check deployed URLs and functionality - client-ready validation
5. **Performance Monitoring**: Continuous monitoring for December readiness

## Data Flow Architecture

### Real-time Data Pipeline
1. **Copernicus API** → **Cloudflare Workers** → **KV Cache** → **Frontend**
2. **GFW API** → **Worker Processing** → **D1 Storage** → **Admin Dashboard**
3. **User Interactions** → **Next.js API Routes** → **Worker APIs** → **Database**

### Visualization Data Flow
1. **Raw Data Sources** → **Python Processing** → **STAC Catalog** → **Frontend Rendering**
2. **Real-time Streams** → **WebSocket/SSE** → **deck.gl Layers** → **Interactive Maps**

## Security Considerations

### API Security
- All production API keys stored as Cloudflare secrets
- CORS configuration in worker environment variables
- Rate limiting configured per environment (1000 req/hour production)

### Authentication Flow
- Admin dashboard uses token-based authentication
- GFW integration requires proper API token management
- Copernicus credentials managed via environment secrets

## Performance Optimization

### Frontend Optimization
- **Asset bundling**: Webpack configuration for optimal loading
- **CDN delivery**: Cloudflare Pages global distribution
- **Caching strategy**: KV store for API responses and processed data
- **WebGL optimization**: deck.gl layer management for large datasets

### Backend Optimization
- **Worker edge computing**: Global deployment for low latency
- **Database optimization**: D1 queries optimized for geospatial operations
- **Cache management**: KV TTL settings based on data update frequencies

## Troubleshooting Common Issues

### Development Environment
- **Port conflicts**: Use alternative port commands (`dev:3002`, `dev:4000`)
- **Dependency issues**: Separate requirements files for different components
- **CORS issues**: Check `ALLOWED_ORIGINS` in worker configuration

### Production Deployment
- **Build failures**: Verify TypeScript compilation with `npm run type-check`
- **API errors**: Check Cloudflare Worker logs and secret configuration
- **Data issues**: Verify D1 database schema and KV namespace bindings

### Integration Issues
- **GFW API**: Verify token validity and rate limiting
- **Copernicus**: Check authentication and subscription status
- **STAC**: Validate catalog endpoints and data formatting

## Machine Learning Integration

### Model Development
- Models developed in `/src/bgapp/ml/` using TensorFlow/scikit-learn
- Training data processed via Python pipelines
- Model deployment via FastAPI endpoints for development
- Production models integrated into Cloudflare Workers where possible

### Data Processing
- Geospatial processing with PostGIS for complex operations
- Real-time processing in Workers for simple transformations
- Batch processing via Python scripts for model training

## Additional Development Commands

### Playwright Testing
```bash
# Run Playwright tests (requires .playwright-mcp setup)
npx playwright test
npx @playwright/mcp analyze
npx @browsermcp/mcp@latest screenshot
```

### Realtime Angola Next.js App (`apps/realtime-angola/`)
```bash
# Development and build commands
npm run dev                   # Port 3000 (Next.js development)
npm run build                # Standard Next.js build
npm run build:prod           # Production build with configuration
npm run start                # Production server
npm run lint                 # ESLint validation
npm run deploy               # Build and deploy to Cloudflare Pages

# Testing visualization layers
node test-temperature-fix-simple.js
node test-chlorophyll-improved.js
node test-vessel-clustering.js
```

### Python ML Development
```bash
# Additional API endpoints
python -m src.bgapp.api.ml_endpoints           # Main ML API (Port 8000)
python -m src.bgapp.api.ml_retention_endpoints # ML retention APIs

# Model and data processing
python src/bgapp/ml/train_models.py            # Train ML models
python src/bgapp/cartography/process_data.py   # Process cartographic data
```

## Database Schema Management

### D1 Database Operations
```bash
# Schema management
wrangler d1 execute bgapp-data --file=workers/schema.sql
wrangler d1 execute bgapp-data --command="CREATE TABLE IF NOT EXISTS vessels..."

# Data queries
wrangler d1 execute bgapp-data --command="SELECT COUNT(*) FROM vessels;"
wrangler d1 execute bgapp-data --command="SELECT * FROM marine_data LIMIT 10;"

# Backup and migration
wrangler d1 backup create bgapp-data
wrangler d1 export bgapp-data --output=backup.sql
```

## Integration-Specific Configuration

### Global Fishing Watch (GFW) Integration
- **API Endpoints**: `/api/gfw/*` routes in workers
- **Token Management**: Set via `wrangler secret put GFW_API_TOKEN`
- **Data Processing**: GFW cache stored in D1 database `gfw_cache` table
- **Rate Limiting**: 1000 requests/hour in production

### Copernicus Marine Service Integration
- **Authentication**: Username/password stored as secrets
- **Data Types**: Temperature, chlorophyll, salinity data
- **Processing**: Real-time data streams processed in workers
- **Caching**: 24-hour TTL in KV store for oceanographic data

### STAC (Spatial Temporal Asset Catalog)
- **Catalog Management**: `/src/bgapp/stac/` for catalog operations
- **Asset Processing**: Geospatial assets indexed in PostgreSQL
- **Integration**: STAC browser worker for data discovery

## Project Structure Understanding

### Current Directory Overview

The project has been successfully reorganized with the main applications centralized in the `apps/` directory. The current structure focuses on three main areas for development:

### Active Development Areas
```
├── apps/                       # 🎯 MAIN APPLICATIONS
│   ├── admin-dashboard/        # Next.js 14 admin interface (primary)
│   ├── realtime-angola/        # Next.js real-time visualization app (mission-critical)
│   ├── frontend/              # Static frontend with WebGL visualizations
│   └── mapa-enterprise/        # Enterprise mapping features
│
├── infrastructure/            # 🏗️ PRODUCTION INFRASTRUCTURE
│   ├── workers/               # Cloudflare Workers (API layer)
│   ├── configs/               # Configuration files
│   └── deploy/                # Deployment scripts
│
├── archive/                   # 📦 ARCHIVED FILES
├── docs/                      # 📚 DOCUMENTATION
└── documentation/             # Additional docs and guides
```

### Navigation Strategy for Development

#### For Frontend Work:
1. **Primary**: `admin-dashboard/` or `realtime-angola-nextjs/`
2. **Main Frontend**: `apps/frontend/` (consolidated structure)

#### For Backend/API Work:
1. **Production APIs**: `workers/`
2. **Python Development**: `src/bgapp/`
3. **Configuration**: `configs/` or `config/`

#### For Scripts/Tools:
1. **Build Scripts**: `scripts/` or `src/scripts/`
2. **Utilities**: `utils/`
3. **Testing**: `testing/` or `tests/`

### Package.json Hierarchy
- **Root** (`./package.json`): Main build, deploy, and development commands
- **Admin Dashboard** (`admin-dashboard/package.json`): Next.js 14 with Radix UI components
- **Realtime Angola** (`realtime-angola-nextjs/package.json`): Next.js with deck.gl visualization
- **BGAPP Workflow** (`bgapp-workflow/package.json`): Workflow automation tools

### Directory Cleanup Recommendations

There is an existing `REORGANIZATION_PLAN.md` that proposes consolidating this structure. Key recommendations:

1. **Immediate Focus**: Work primarily in `admin-dashboard/`, `realtime-angola-nextjs/`, and `workers/`
2. **Archive Candidates**: Move `deploy_arcasadeveloping/`, `copernicus-official/`, legacy configs to `archive/`
3. **Consolidation Needed**: Merge duplicate directories (`config/` + `configs/`, `scripts/` + `src/scripts/`)
4. **December Mission**: Focus on the 3-4 core directories that serve the presentation goals

## Key File Locations

### Critical Configuration Files
- `wrangler.toml`: Main Cloudflare Pages configuration
- `infrastructure/workers/*.toml`: Worker-specific configurations
- `apps/admin-dashboard/next.config.js`: Next.js admin configuration
- `apps/admin-dashboard/tailwind.config.js`: Admin Tailwind CSS configuration
- `apps/realtime-angola/next.config.mjs`: Realtime app configuration
- `apps/frontend/_headers`: Static frontend headers and security

### API Implementation
- `infrastructure/workers/api-worker.js`: Main production API worker
- `infrastructure/workers/admin-api-worker.js`: Admin dashboard API worker
- `infrastructure/workers/gfw-proxy.js`: Global Fishing Watch integration
- `infrastructure/workers/copernicus-webhook.js`: Copernicus data integration
- Local Python APIs available for development (not in production)

### Frontend Applications
- `apps/admin-dashboard/`: Next.js 14 admin interface with Radix UI components
- `apps/realtime-angola/`: Next.js real-time visualization app with deck.gl
- `apps/frontend/`: Static frontend with WebGL visualizations and scientific dashboards
- `apps/mapa-enterprise/`: Enterprise mapping features

## 📋 December Mission Checklist

### Phase 1: Foundation (Immediate Priority)
- [ ] **Performance Audit**: Benchmark current load times and optimize to sub-2s
- [ ] **Mobile Optimization**: Ensure responsive design works perfectly on all devices
- [ ] **Data Integration**: Verify Copernicus and GFW APIs are reliable and fast
- [ ] **Error Handling**: Implement graceful fallbacks for all external dependencies

### Phase 2: User Experience (High Priority)
- [ ] **Navigation Flow**: Streamline user journeys for intuitive marine data exploration
- [ ] **Visual Polish**: Enhance deck.gl visualizations for professional presentation
- [ ] **Loading States**: Add elegant loading animations and progress indicators
- [ ] **Accessibility**: Ensure platform meets accessibility standards

### Phase 3: Demo Scenarios (Medium Priority)
- [ ] **Angola EEZ Focus**: Highlight Angola-specific marine data and boundaries
- [ ] **Vessel Tracking**: Showcase real-time vessel monitoring capabilities
- [ ] **Environmental Data**: Demonstrate temperature, chlorophyll, and marine health indicators
- [ ] **ML Insights**: Present predictive models and marine analysis features

### Phase 4: Final Polish (Before December)
- [ ] **Performance Testing**: Load testing under demo conditions
- [ ] **Content Preparation**: Prepare demo data and scenarios
- [ ] **Documentation**: Create client-facing documentation and guides
- [ ] **Backup Plans**: Prepare offline demos and fallback presentations

## 🎯 Success Metrics for December

### Technical Metrics:
- **Load Time**: < 2 seconds for initial page load
- **Interaction Response**: < 100ms for map interactions
- **Uptime**: 99.9% availability during presentation period
- **Mobile Performance**: Perfect rendering on tablets and smartphones

### Business Metrics:
- **User Journey Completion**: Seamless flow through all demo scenarios
- **Visual Impact**: Professional-grade visualizations that impress clients
- **Data Accuracy**: Real-time data reflects actual marine conditions
- **Demonstration Success**: Platform effectively showcases Angola marine capabilities

**Remember**: Every development decision should advance these December presentation goals. When in doubt, prioritize client demonstration value and platform reliability.

## 🗂️ Dealing with the Complex Directory Structure

### Quick Navigation Commands

```bash
# Find files across the complex structure
find . -name "*.js" -path "*/components/*" | grep -v node_modules
find . -name "package.json" | head -5
find . -name "*config*" -type f | head -10

# Check directory sizes to prioritize work
du -sh ./* | sort -hr | head -10

# Find the active development areas
ls -la admin-dashboard/src/
ls -la realtime-angola-nextjs/src/
ls -la workers/
ls -la src/bgapp/
```

### Directory Prioritization for December Mission

#### 🎯 HIGH PRIORITY (Work Here Daily):
- `admin-dashboard/` (1.3GB) - Main admin interface
- `realtime-angola-nextjs/` (1.3GB) - Real-time visualization
- `workers/` (488KB) - Production APIs

#### 🔄 MEDIUM PRIORITY (Reference/Update):
- `src/bgapp/` (4.3MB) - Python ML services
- `apps/frontend/` (27MB) - Main frontend
- `configs/` (3MB) - Configuration files

#### ⚠️ LOW PRIORITY (Avoid Unless Necessary):
- `archive/` (120MB) - Historical files
- `deploy_arcasadeveloping/` (2.2MB) - Old deployment
- `[30+ other directories]` - Various legacy/duplicate content

### Emergency Navigation Tips

```bash
# When lost in the structure, use these commands:

# Find where package.json files are (indicates active projects)
find . -maxdepth 2 -name "package.json"

# Find the main entry points
find . -name "index.html" -o -name "index.js" -o -name "index.ts" | grep -v node_modules

# Find configuration files quickly
find . -name "*wrangler*" -o -name "*next.config*" -o -name "*tailwind*" | head -10

# Identify the largest/most active directories
du -sh ./* | sort -hr | head -15
```

### Recommended Cleanup Strategy (Post-December)

After the December presentation, consider implementing the `REORGANIZATION_PLAN.md`:

1. **Consolidate**: Merge duplicate directories (`config/` + `configs/`, `scripts/` + `src/scripts/`)
2. **Archive**: Move `deploy_arcasadeveloping/`, `copernicus-official/`, legacy configs to `archive/`
3. **Simplify**: Reduce 42 directories to ~15 core directories
4. **Focus**: Maintain only `admin-dashboard/`, `realtime-angola-nextjs/`, `workers/`, `src/`, `docs/`, `archive/`

### Working Effectively Despite Complexity

#### Do:
- ✅ Use the search commands above to find files quickly
- ✅ Focus on the 3-4 main directories for December mission
- ✅ Use absolute paths in scripts to avoid confusion
- ✅ Document any new important file locations

#### Don't:
- ❌ Get overwhelmed by the 42 directories
- ❌ Try to understand every directory's purpose
- ❌ Create new top-level directories
- ❌ Work in legacy/duplicate directories unless absolutely necessary

**Bottom Line**: The project works despite the complex structure. Focus on the mission-critical directories and treat the rest as historical/backup content.
# 🏗️ BGAPP Project Structure

## Directory Organization (After Reorganization)

```
bgapp/
├── apps/                     # All frontend applications
│   ├── frontend/            # Main static frontend (from infra/frontend)
│   ├── admin-dashboard/     # Next.js admin dashboard
│   ├── realtime-angola/     # Next.js realtime monitoring
│   └── minpermar/          # Vue.js MinPerMar app
│
├── src/                     # Python source code
│   ├── bgapp/              # Core BGAPP modules
│   │   ├── api/           # FastAPI endpoints
│   │   ├── ml/            # Machine Learning models
│   │   ├── security/      # Security & authentication
│   │   └── ...
│   ├── shared/             # Shared code
│   │   ├── types/         # Type definitions
│   │   ├── utils/         # Utility functions
│   │   └── constants/     # Constants
│   └── scripts/            # Deployment & maintenance scripts
│
├── infrastructure/          # Infrastructure code
│   ├── workers/            # Cloudflare Workers
│   │   ├── api/           # API workers
│   │   ├── proxy/         # Proxy workers
│   │   ├── webhook/       # Webhook workers
│   │   └── monitoring/    # Monitoring workers
│   ├── configs/            # Configuration files
│   └── deploy/             # Deployment scripts
│
├── archive/                 # Archived files
│   ├── backups/           # Old backups
│   ├── temp/              # Temporary files
│   └── old-structure/     # Previous organization attempts
│
├── docs/                    # Documentation
├── tests/                   # Test files
└── .github/                # GitHub configuration
```

## Import Conventions

### Python
```python
# Use absolute imports
from src.bgapp.api import endpoints
from src.shared.utils import helpers
```

### JavaScript/TypeScript
```javascript
// Frontend apps
import { Component } from '@/components'
import { api } from '@/lib/api'
```

## Environment Variables
All environment configurations are centralized in:
- `.env` - Development
- `.env.production` - Production
- `wrangler.toml` - Cloudflare Workers

## Deployment
- Frontend: `npm run deploy` from each app directory
- Workers: `wrangler deploy` from infrastructure/workers/
- Python: Docker or direct deployment

## December 2024 Presentation Ready ✅

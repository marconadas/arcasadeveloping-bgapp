# API Monitoring Quick Reference

## 🚀 Run Monitoring Now

```bash
# Quick health check
./.claude/monitor-apis.sh

# Detailed analysis
./.claude/monitor-apis.sh --verbose
```

## 💬 Use the Agent

```
@api-data-monitor check all API endpoints
@api-data-monitor validate GFW data quality
@api-data-monitor generate performance report
```

## 📊 Current Status (Last Test)

| Endpoint | Status | Response Time |
|----------|--------|---------------|
| API Worker Health | ✅ | 177ms |
| Metrics | ✅ | 102ms |
| Realtime Data | ⚠️ | 3798ms (SLOW) |
| Services | ❌ | 404 Not Found |
| Admin API | ✅ | 170ms |
| Frontend | ✅ | 235ms |
| Admin Dashboard | ✅ | 525ms |
| Realtime App | ✅ | 492ms |

## 🎯 Action Items

1. **CRITICAL**: Fix `/api/services` endpoint (404)
2. **OPTIMIZE**: Reduce `/api/realtime/data` response time from 3.8s to < 2s
3. **MONITOR**: Continue tracking for December presentation readiness

## 📁 Files

- **Agent Config**: [.claude/agents/api-data-monitor.md](./.claude/agents/api-data-monitor.md)
- **Settings**: [.claude/settings.json](./.claude/settings.json)
- **Script**: [.claude/monitor-apis.sh](./.claude/monitor-apis.sh)
- **Logs**: `.claude/logs/api-monitor-*.log`
- **Full Guide**: [.claude/API_MONITORING_GUIDE.md](./.claude/API_MONITORING_GUIDE.md)

## 🔧 Quick Fixes

### Fix Slow Endpoint
```bash
# Check worker logs
wrangler tail api-worker --format=pretty | grep realtime

# Clear KV cache
wrangler kv:key delete --namespace-id=$BGAPP_KV_ID "realtime:cache"

# Verify improvement
curl -w "\nTime: %{time_total}s\n" https://bgapp-api-worker.majearcasa.workers.dev/api/realtime/data
```

### Add New Endpoint
Edit `.claude/monitor-apis.sh` and add to `ENDPOINTS` array:
```bash
ENDPOINTS=(
  # ... existing endpoints ...
  "https://your-new-endpoint.com/api/custom"
)
```

## 📞 Need Help?

See [API_MONITORING_GUIDE.md](./.claude/API_MONITORING_GUIDE.md) for detailed documentation.

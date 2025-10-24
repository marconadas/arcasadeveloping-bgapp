# API Data Monitoring Agent - Setup Guide

## 🎯 What This Does

The API Data Monitoring Agent continuously tracks incoming data from all BGAPP API endpoints to ensure:
- **Data Quality**: Validates schema compliance and data freshness
- **Performance**: Monitors response times and identifies bottlenecks
- **Reliability**: Detects failures before they impact the December presentation
- **Alerts**: Provides early warnings for issues requiring attention

## 📁 Files Created

```
.claude/
├── agents/
│   └── api-data-monitor.md          # Agent configuration and instructions
├── settings.json                     # Agent permissions and hooks
├── monitor-apis.sh                   # Automated monitoring script
└── logs/                            # Monitoring logs directory
    └── api-monitor-[timestamp].log   # Individual monitoring reports
```

## 🚀 Quick Start

### Option 1: Run Manual Monitoring

```bash
# Basic monitoring (quick check)
./.claude/monitor-apis.sh

# Verbose mode (includes data quality checks)
./.claude/monitor-apis.sh --verbose
```

### Option 2: Use the Agent Directly

To invoke the monitoring agent from Claude Code:

```
@api-data-monitor please check the health of all API endpoints
```

```
@api-data-monitor validate the GFW data quality and freshness
```

```
@api-data-monitor generate a comprehensive performance report
```

## 📊 Monitoring Results Interpretation

### Exit Codes
- `0` - All systems healthy ✅
- `1` - Critical failures detected 🚨
- `2` - Warnings (slow responses) ⚠️

### Sample Output
```
✅ Healthy Endpoints: 6
⚠️  Warning Endpoints: 1  (response time > 2000ms)
❌ Failed Endpoints: 1    (HTTP error or timeout)
📊 Average Response Time: 692ms
```

### Current Findings (from test run)

**✅ HEALTHY**:
- Main API Worker health endpoint (177ms)
- Metrics endpoint (102ms)
- Admin API Worker (170ms)
- Frontend Pages (235ms)
- Admin Dashboard (525ms)
- Realtime App (492ms)

**⚠️ WARNINGS**:
- Realtime Data Endpoint (3798ms - SLOW)
  - **Action Required**: Optimize `/api/realtime/data` endpoint
  - **Target**: < 2000ms response time

**❌ FAILED**:
- Services Endpoint (404 Not Found)
  - **Action Required**: Verify `/api/services` endpoint exists or remove from monitoring

## 🔧 Configuration

### Monitored Endpoints

Edit [.claude/monitor-apis.sh](./.claude/monitor-apis.sh) to add/remove endpoints:

```bash
ENDPOINTS=(
  "https://bgapp-api-worker.majearcasa.workers.dev/health"
  "https://your-new-endpoint.com/api/custom"
  # Add more endpoints here
)
```

### Alert Thresholds

Configure thresholds in [.claude/settings.json](./.claude/settings.json):

```json
"alertThresholds": {
  "responseTime": 2000,      // 2 seconds max response time
  "errorRate": 0.01,         // 1% error rate threshold
  "dataFreshness": 86400     // 24 hours max data age
}
```

### Agent Permissions

The agent has access to these tools (configured in [.claude/settings.json](./.claude/settings.json)):

**Allowed**:
- `Bash` - Execute monitoring scripts
- `Read` - Read configuration and logs
- `WebFetch` - Test production endpoints
- `mcp__cloudflare__*` - Query Cloudflare Workers and KV
- `mcp__sentry__*` - Check error tracking

**Disallowed** (read-only monitoring):
- `Write` - Cannot modify files
- `Edit` - Cannot edit configurations
- `mcp__cloudflare__worker_deploy` - Cannot deploy changes

## 📅 Automated Monitoring Schedule

### Recommended Schedule

```bash
# Add to crontab for automated monitoring
# Every 5 minutes during business hours (9 AM - 6 PM)
*/5 9-18 * * 1-5 cd /path/to/bgapp && ./.claude/monitor-apis.sh >> .claude/logs/cron.log 2>&1

# Every 30 minutes outside business hours
*/30 0-8,19-23 * * * cd /path/to/bgapp && ./.claude/monitor-apis.sh >> .claude/logs/cron.log 2>&1

# Full verbose report daily at 8 AM
0 8 * * * cd /path/to/bgapp && ./.claude/monitor-apis.sh --verbose | mail -s "BGAPP Daily Monitoring Report" team@example.com
```

### GitHub Actions Integration

Create `.github/workflows/api-monitoring.yml`:

```yaml
name: API Health Monitoring
on:
  schedule:
    - cron: '*/30 * * * *'  # Every 30 minutes
  workflow_dispatch:

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run API Monitoring
        run: ./.claude/monitor-apis.sh
      - name: Upload Logs
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: monitoring-logs
          path: .claude/logs/
```

## 🎯 December Mission Integration

### Pre-Presentation Checklist

Run these commands before the December presentation:

```bash
# 1. Comprehensive health check
./.claude/monitor-apis.sh --verbose

# 2. Verify all endpoints are healthy
if [ $? -eq 0 ]; then
  echo "✅ All systems ready for presentation"
else
  echo "🚨 Issues detected - review logs"
fi

# 3. Check recent monitoring history
tail -100 .claude/logs/*.log | grep "FAILED\|SLOW"
```

### During Presentation

Keep monitoring active:
```bash
# Terminal 1: Live monitoring
watch -n 60 './.claude/monitor-apis.sh'

# Terminal 2: Real-time logs
tail -f .claude/logs/api-monitor-*.log
```

## 🔍 Advanced Usage

### Custom Data Quality Checks

Invoke the agent with specific validation requests:

```
@api-data-monitor validate that all vessel coordinates are within Angola's EEZ bounds
```

```
@api-data-monitor check if Copernicus temperature data is within valid range (15-30°C)
```

```
@api-data-monitor verify all timestamps are less than 24 hours old
```

### Performance Profiling

```
@api-data-monitor profile the slowest API endpoints and suggest optimizations
```

### Cache Analysis

```
@api-data-monitor analyze KV cache hit/miss ratios for the last hour
```

## 📝 Logging

### Log Location
All monitoring logs are saved in `.claude/logs/` with timestamp-based filenames:
```
.claude/logs/api-monitor-2025-10-01T21:16:00Z.log
```

### Log Retention
- Keep monitoring logs for 30 days
- Archive critical reports indefinitely
- Clean old logs: `find .claude/logs/ -mtime +30 -delete`

## 🚨 Troubleshooting

### Issue: Agent not found
```bash
# Verify agent file exists
ls -la .claude/agents/api-data-monitor.md

# Re-create agent if needed
# (Files are version controlled - use git restore)
```

### Issue: Permission denied for monitoring script
```bash
chmod +x .claude/monitor-apis.sh
```

### Issue: jq command not found (for verbose mode)
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

### Issue: Monitoring shows false failures
- Check network connectivity
- Verify API endpoints are accessible
- Review Cloudflare Worker status
- Check rate limiting quotas

## 📞 Support

For monitoring issues or questions:
- **Technical Lead**: Marcos Santos (marconadas)
- **Documentation**: See [STAKEHOLDERS.md](../STAKEHOLDERS.md)
- **Escalation**: Follow procedures in stakeholder guide

## 🎉 Success Indicators

Your monitoring is working correctly when:
- ✅ All critical APIs show < 2s response times
- ✅ Zero failed endpoints during demo scenarios
- ✅ Data freshness within defined thresholds
- ✅ Early detection of issues before presentation
- ✅ Comprehensive logs for troubleshooting

---

**December Mission Focus**: This monitoring ensures the platform is presentation-ready with reliable, performant APIs delivering accurate marine data for Angola's Exclusive Economic Zone.

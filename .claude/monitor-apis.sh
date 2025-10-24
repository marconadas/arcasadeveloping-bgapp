#!/bin/bash

# API Data Monitor Script
# Automated monitoring for BGAPP API endpoints
# Usage: ./.claude/monitor-apis.sh [--verbose]

set -e

VERBOSE=${1:-""}
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
LOG_FILE=".claude/logs/api-monitor-${TIMESTAMP}.log"

echo "🚀 BGAPP API Data Monitor - ${TIMESTAMP}" | tee -a "$LOG_FILE"
echo "================================================" | tee -a "$LOG_FILE"

# API Endpoints to monitor
ENDPOINTS=(
  "https://bgapp-api-worker.majearcasa.workers.dev/health"
  "https://bgapp-api-worker.majearcasa.workers.dev/services"
  "https://bgapp-api-worker.majearcasa.workers.dev/api/metrics"
  "https://bgapp-api-worker.majearcasa.workers.dev/api/realtime/data"
  "https://bgapp-admin-api-worker.majearcasa.workers.dev/health"
  "https://bgapp-frontend.pages.dev"
  "https://bgapp-admin.pages.dev"
  "https://bgapp-realtime.pages.dev"
)

# Counters
HEALTHY=0
WARNING=0
FAILED=0
TOTAL_RESPONSE_TIME=0

echo "" | tee -a "$LOG_FILE"
echo "📊 Testing Endpoints..." | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

for endpoint in "${ENDPOINTS[@]}"
do
  echo "Testing: $endpoint" | tee -a "$LOG_FILE"

  # Perform the request and capture response time and status
  RESPONSE=$(curl -s -w "\n%{http_code}\n%{time_total}" -o /dev/null "$endpoint" 2>&1 || echo "000\n0")
  HTTP_CODE=$(echo "$RESPONSE" | tail -2 | head -1)
  RESPONSE_TIME=$(echo "$RESPONSE" | tail -1)

  # Calculate response time in ms
  RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | bc 2>/dev/null || echo "0")
  TOTAL_RESPONSE_TIME=$(echo "$TOTAL_RESPONSE_TIME + $RESPONSE_MS" | bc 2>/dev/null || echo "$TOTAL_RESPONSE_TIME")

  # Evaluate status
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    if (( $(echo "$RESPONSE_MS < 2000" | bc -l 2>/dev/null || echo 0) )); then
      echo "  ✅ Status: $HTTP_CODE | Response Time: ${RESPONSE_MS}ms" | tee -a "$LOG_FILE"
      HEALTHY=$((HEALTHY + 1))
    else
      echo "  ⚠️  Status: $HTTP_CODE | Response Time: ${RESPONSE_MS}ms (SLOW)" | tee -a "$LOG_FILE"
      WARNING=$((WARNING + 1))
    fi
  else
    echo "  ❌ Status: $HTTP_CODE | FAILED" | tee -a "$LOG_FILE"
    FAILED=$((FAILED + 1))
  fi

  echo "" | tee -a "$LOG_FILE"
done

# Calculate average response time
ENDPOINT_COUNT=${#ENDPOINTS[@]}
AVG_RESPONSE_TIME=$(echo "scale=2; $TOTAL_RESPONSE_TIME / $ENDPOINT_COUNT" | bc 2>/dev/null || echo "0")

echo "================================================" | tee -a "$LOG_FILE"
echo "📈 Summary Report" | tee -a "$LOG_FILE"
echo "================================================" | tee -a "$LOG_FILE"
echo "✅ Healthy Endpoints: $HEALTHY" | tee -a "$LOG_FILE"
echo "⚠️  Warning Endpoints: $WARNING" | tee -a "$LOG_FILE"
echo "❌ Failed Endpoints: $FAILED" | tee -a "$LOG_FILE"
echo "📊 Average Response Time: ${AVG_RESPONSE_TIME}ms" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Test GFW data if verbose mode
if [ "$VERBOSE" = "--verbose" ]; then
  echo "🔍 Testing GFW Data Quality..." | tee -a "$LOG_FILE"
  GFW_DATA=$(curl -s "https://bgapp-api-worker.majearcasa.workers.dev/api/gfw/vessels?limit=5" 2>/dev/null || echo "{}")

  if command -v jq &> /dev/null; then
    VESSEL_COUNT=$(echo "$GFW_DATA" | jq 'length' 2>/dev/null || echo "0")
    echo "  Vessels Retrieved: $VESSEL_COUNT" | tee -a "$LOG_FILE"

    if [ "$VESSEL_COUNT" != "0" ]; then
      SAMPLE=$(echo "$GFW_DATA" | jq '.[0]' 2>/dev/null || echo "{}")
      echo "  Sample Data: $SAMPLE" | tee -a "$LOG_FILE"
    fi
  else
    echo "  ⚠️  jq not installed - skipping detailed data analysis" | tee -a "$LOG_FILE"
  fi
  echo "" | tee -a "$LOG_FILE"
fi

# Generate recommendations
echo "📝 Recommendations:" | tee -a "$LOG_FILE"
if [ $FAILED -gt 0 ]; then
  echo "  🚨 CRITICAL: $FAILED endpoint(s) failed - immediate investigation required" | tee -a "$LOG_FILE"
fi
if [ $WARNING -gt 0 ]; then
  echo "  ⚠️  $WARNING endpoint(s) responding slowly - consider optimization" | tee -a "$LOG_FILE"
fi
if [ $FAILED -eq 0 ] && [ $WARNING -eq 0 ]; then
  echo "  ✅ All systems operational - ready for December presentation" | tee -a "$LOG_FILE"
fi
echo "" | tee -a "$LOG_FILE"

echo "📄 Full log saved to: $LOG_FILE" | tee -a "$LOG_FILE"

# Exit with appropriate code
if [ $FAILED -gt 0 ]; then
  exit 1
elif [ $WARNING -gt 0 ]; then
  exit 2
else
  exit 0
fi
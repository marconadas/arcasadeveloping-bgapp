# API Performance Fix Plan

## 🎯 Issues Identified

### Issue 1: `/api/services` Endpoint 404
**Status**: ❌ FAILED
**Current**: Returns 404 Not Found
**Root Cause**: Endpoint exists at line 1315 as `/services` but monitoring script tests `/api/services`
**Impact**: Medium - monitoring false positive

### Issue 2: `/api/realtime/data` Endpoint Slow (3.8s)
**Status**: ⚠️ SLOW (3798ms)
**Current**: Takes 3.8 seconds to respond
**Target**: < 2000ms (2 seconds)
**Root Cause Analysis** (lines 1439-1554):
1. **Sequential API Calls**:
   - Calls `getCopernicusMarineData()` first
   - Then fetches fallback JSON from frontend
   - Then calls GFW API sequentially
   - Each network call adds latency

2. **No Caching**:
   - No KV cache implementation
   - Fetches data fresh on every request
   - Copernicus/GFW calls happen every time

3. **Heavy Processing**:
   - Loops through all entries to calculate means
   - Multiple array operations
   - No optimization for large datasets

**Impact**: 🚨 CRITICAL - Violates December presentation target (< 2s)

## 📋 Fix Strategy

### Fix 1: Update Monitoring Script (Quick Fix)
**Time**: 2 minutes
**Risk**: Low
**Action**: Change monitoring URL from `/api/services` to `/services`

### Fix 2: Add KV Caching to /api/realtime/data (Medium Priority)
**Time**: 15 minutes
**Risk**: Low
**Expected Improvement**: 3800ms → ~200ms (cached), ~1500ms (fresh)
**Actions**:
1. Cache Copernicus data in KV for 5 minutes
2. Cache GFW vessel count for 5 minutes
3. Return cached data immediately if available
4. Refresh cache in background

### Fix 3: Optimize Data Processing (Low Priority)
**Time**: 10 minutes
**Risk**: Low
**Expected Improvement**: Additional 100-200ms reduction
**Actions**:
1. Optimize mean calculation loops
2. Pre-calculate vessel count instead of fetching
3. Reduce data point processing

### Fix 4: Parallelize API Calls (Optional)
**Time**: 20 minutes
**Risk**: Medium
**Expected Improvement**: Additional 500ms reduction
**Actions**:
1. Use `Promise.all()` for GFW + Copernicus
2. Process results in parallel
3. Implement timeout handling

## 🚀 Implementation Priority

### Phase 1: Immediate (Critical for December)
✅ Fix 1: Update monitoring script
✅ Fix 2: Add KV caching

### Phase 2: Optimization (Nice to have)
⏳ Fix 3: Optimize processing
⏳ Fix 4: Parallelize calls

## 📊 Expected Results

| Metric | Before | After Fix 2 | After Fix 3 | Target |
|--------|--------|-------------|-------------|--------|
| Cold Start | 3800ms | 1500ms | 1300ms | < 2000ms |
| Cached Hit | N/A | 200ms | 150ms | < 500ms |
| Cache Rate | 0% | ~80% | ~80% | > 70% |

## 🔧 Technical Implementation Details

### Fix 2: KV Cache Implementation

```javascript
// Add before the /api/realtime/data handler
const REALTIME_CACHE_KEY = 'realtime:data:latest';
const REALTIME_CACHE_TTL = 300; // 5 minutes

// Inside /api/realtime/data handler:
// 1. Try cache first
const cached = await env.BGAPP_KV?.get(REALTIME_CACHE_KEY, { type: 'json' });
if (cached && (Date.now() - cached.timestamp) < REALTIME_CACHE_TTL * 1000) {
  return jsonResponse({
    ...cached,
    cache_hit: true,
    cache_age: Math.floor((Date.now() - cached.timestamp) / 1000)
  });
}

// 2. Fetch fresh data (existing code)
// ... existing getCopernicusMarineData() logic ...

// 3. Store in cache before returning
await env.BGAPP_KV?.put(REALTIME_CACHE_KEY, JSON.stringify({
  ...response,
  timestamp: Date.now()
}), { expirationTtl: REALTIME_CACHE_TTL });

return jsonResponse(response);
```

### Fix 1: Monitoring Script Update

```bash
# Change in .claude/monitor-apis.sh:
ENDPOINTS=(
  # ... other endpoints ...
  "https://bgapp-api-worker.majearcasa.workers.dev/services"  # Remove /api/ prefix
  # ... rest ...
)
```

## ✅ Verification Steps

1. **Test monitoring script**: Should show 0 failures
2. **Test /api/realtime/data**:
   - First call: < 2000ms (cold)
   - Second call: < 500ms (cached)
3. **Verify cache**: Check KV namespace for cached data
4. **Load test**: Multiple concurrent requests should serve from cache

## 🎯 Success Criteria

- ✅ All monitoring endpoints return 200 OK
- ✅ /api/realtime/data responds in < 2s (cold start)
- ✅ /api/realtime/data responds in < 500ms (cached)
- ✅ Cache hit rate > 70% during normal operation
- ✅ Ready for December presentation

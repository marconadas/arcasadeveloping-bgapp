# Background Agent Tasks - fix/critical-security

## 🚨 Critical Security Issues (Priority 1)

### 1. CORS Security Fixes
- [ ] **File**: `workers/api-worker.js`
  - Fix CORS whitelist implementation
  - Add proper origin validation
  - Implement preflight request handling

- [ ] **File**: `workers/admin-api-worker.js`
  - Apply same CORS fixes as api-worker.js
  - Add admin-specific origin validation

- [ ] **File**: `workers/stac-api-worker.js`
  - Implement CORS for STAC endpoints
  - Add proper headers for geospatial data

### 2. Next.js Security Configuration
- [ ] **File**: `admin-dashboard/next.config.js`
  - Remove `ignoreBuildErrors: true`
  - Add security headers configuration
  - Enable CSP (Content Security Policy)

### 3. Authentication & Authorization
- [ ] **File**: `src/bgapp/auth/`
  - Implement JWT token validation
  - Add role-based access control
  - Fix session management

### 4. Input Validation
- [ ] **File**: `src/bgapp/api/`
  - Add Pydantic models for all endpoints
  - Implement request validation
  - Add SQL injection protection

## 🔧 TypeScript Errors (Priority 2)

### 1. Admin Dashboard
- [ ] **File**: `admin-dashboard/src/lib/logger.ts`
  - Create missing logger.ts file
  - Implement proper logging interface

- [ ] **File**: `admin-dashboard/src/components/`
  - Fix TypeScript errors in components
  - Add proper type definitions

### 2. Workers
- [ ] **File**: `workers/cors-config.js`
  - Create missing CORS configuration file
  - Add TypeScript definitions

## 🐛 Memory Leaks (Priority 3)

### 1. Frontend JavaScript
- [ ] **File**: `infra/frontend/assets/js/`
  - Fix event listener cleanup
  - Remove circular references
  - Optimize DOM manipulation

### 2. Service Workers
- [ ] **File**: `infra/frontend/sw-advanced.js`
  - Fix cache management
  - Optimize memory usage
  - Add proper cleanup

## ⚡ Performance Optimizations (Priority 4)

### 1. Bundle Size
- [ ] **File**: `admin-dashboard/`
  - Optimize Next.js bundle
  - Remove unused dependencies
  - Implement code splitting

### 2. API Performance
- [ ] **File**: `src/bgapp/api/`
  - Add response caching
  - Optimize database queries
  - Implement pagination

## 🧪 Testing (Priority 5)

### 1. Unit Tests
- [ ] **File**: `tests/`
  - Add tests for security functions
  - Test API endpoints
  - Add component tests

### 2. Integration Tests
- [ ] **File**: `tests/integration/`
  - Test CORS implementation
  - Test authentication flow
  - Test API security

## 📝 Documentation (Priority 6)

### 1. Security Documentation
- [ ] **File**: `docs/security/`
  - Document security measures
  - Add security checklist
  - Create incident response guide

### 2. API Documentation
- [ ] **File**: `docs/api/`
  - Update API documentation
  - Add security requirements
  - Document authentication

## 🎯 Success Criteria

- [ ] All CORS issues resolved
- [ ] No TypeScript errors
- [ ] Memory leaks fixed
- [ ] Security vulnerabilities patched
- [ ] Performance improved by 20%
- [ ] Test coverage > 80%

## 📋 Background Agent Instructions

1. **Start with Critical Security Issues** - These are blocking production deployment
2. **Fix TypeScript Errors** - These prevent proper development workflow
3. **Address Memory Leaks** - These affect application stability
4. **Optimize Performance** - These improve user experience
5. **Add Testing** - These ensure code quality
6. **Update Documentation** - These help maintain the codebase

## 🔄 Workflow

1. Pick one task from the highest priority category
2. Implement the fix
3. Test locally
4. Commit with conventional commit message
5. Move to next task
6. Update this file with progress

## 📞 Support

- Check existing documentation in `docs/`
- Follow existing code patterns
- Ask for clarification if needed
- Test thoroughly before committing

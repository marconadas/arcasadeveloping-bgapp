# 🔴 CRITICAL SECURITY FIXES - Branch: fix/critical-security

**Prioridade:** CRÍTICA  
**Prazo:** 1-2 dias  
**Branch:** `fix/critical-security`  
**Repositório:** https://github.com/marconadas/arcasadeveloping-bgapp.git

---

## 📋 TASK LIST

### ✅ Task 1: Remove Dangerous Build Configurations
**Status:** 🔄 TODO  
**Severity:** CRITICAL  
**Files to modify:**
- [ ] `admin-dashboard/next.config.js`
- [ ] `admin-dashboard/next.config.cloudflare.js`
- [ ] `admin-dashboard/tsconfig.json` (if needed)

**Actions:**
- [ ] Remove `ignoreBuildErrors: true` from Next.js config
- [ ] Remove `ignoreDuringBuilds: true` for ESLint
- [ ] Fix resulting TypeScript errors
- [ ] Fix resulting ESLint warnings
- [ ] Test build process

**Commit Message:**
```
fix(security): remove ignoreBuildErrors from Next.js config

- Remove ignoreBuildErrors from Next.js config
- Enable ESLint during builds
- Fix resulting TypeScript errors
- Ensure type safety in production builds

BREAKING CHANGE: Build will now fail on TypeScript/ESLint errors
```

---

### ✅ Task 2: Remove Hardcoded Credentials
**Status:** 🔄 TODO  
**Severity:** CRITICAL  
**Files to modify:**
- [ ] `config/example.env`
- [ ] `env.example`
- [ ] `scripts/generate_secure_env.py`
- [ ] All workers with hardcoded URLs

**Actions:**
- [ ] Remove NGROK_AUTHTOKEN from config/example.env
- [ ] Move all passwords to environment variables
- [ ] Implement env vars validation on startup
- [ ] Create safe .env.example template
- [ ] Update documentation

**Commit Message:**
```
fix(security): remove hardcoded credentials

- Remove exposed NGROK token
- Move all passwords to environment variables
- Add env validation on startup
- Create safe .env.example template

Security: Rotate all exposed credentials immediately
```

---

### ✅ Task 3: Fix CORS in All Workers
**Status:** 🔄 TODO  
**Severity:** CRITICAL  
**Files to modify:**
- [ ] `workers/admin-api-worker.js`
- [ ] `workers/api-worker.js`
- [ ] `workers/bgapp-services-proxy-worker.js`
- [ ] `workers/stac-api-worker.js`
- [ ] `workers/stac-browser-worker.js`
- [ ] `workers/stac-oceanographic-worker.js`
- [ ] `workers/pygeoapi-worker.js`
- [ ] `workers/monitoring-worker.js`
- [ ] `workers/keycloak-worker.js`

**Actions:**
- [ ] Replace `'Access-Control-Allow-Origin': '*'` with domain whitelist
- [ ] Implement origin validation
- [ ] Use `cors-security-enhanced.js` in all workers
- [ ] Add rate limiting to all workers
- [ ] Test CORS functionality

**Commit Message:**
```
fix(security): implement proper CORS configuration

- Replace wildcard CORS with domain whitelist
- Implement origin validation
- Add rate limiting to all workers
- Use centralized CORS security module

Security: Prevents unauthorized cross-origin requests
```

---

### ✅ Task 4: Remove Console.log from Production
**Status:** 🔄 TODO  
**Severity:** HIGH  
**Files to scan:**
- [ ] `admin-dashboard/src/**/*.{ts,tsx,js,jsx}`
- [ ] `workers/*.js`
- [ ] `utils/*.py`
- [ ] `scripts/*.py`

**Actions:**
- [ ] Find all console.log statements (22+ found in audit)
- [ ] Replace with proper logging system
- [ ] Remove debug console statements
- [ ] Implement conditional logging for development
- [ ] Update logging configuration

**Commit Message:**
```
fix(security): remove console.log statements from production

- Remove all console.log statements from production code
- Replace with proper logging system
- Implement conditional logging for development
- Improve security by not exposing debug info
```

---

### ✅ Task 5: Add Environment Variables Validation
**Status:** 🔄 TODO  
**Severity:** HIGH  
**Files to create/modify:**
- [ ] `src/bgapp/core/env_validator.py`
- [ ] `admin-dashboard/src/config/env-validator.ts`
- [ ] Update startup scripts

**Actions:**
- [ ] Create environment validation module
- [ ] Define required environment variables
- [ ] Implement startup validation
- [ ] Add error handling for missing vars
- [ ] Document required environment variables

**Commit Message:**
```
feat(security): add environment variables validation

- Implement env vars validation on startup
- Define required environment variables
- Add error handling for missing variables
- Improve application security and reliability
```

---

## 🎯 EXECUTION ORDER

1. **Task 2** (Remove Credentials) - Most critical security risk
2. **Task 3** (Fix CORS) - Network security
3. **Task 1** (Build Config) - Code quality and safety
4. **Task 4** (Console.log) - Information disclosure
5. **Task 5** (Env Validation) - Operational security

---

## 🔍 VALIDATION CHECKLIST

Before marking each task as complete:
- [ ] Code changes tested locally
- [ ] No new TypeScript errors introduced
- [ ] No new ESLint warnings
- [ ] Security improvement verified
- [ ] Documentation updated
- [ ] Commit message follows convention

---

## 📊 PROGRESS TRACKING

- **Tasks Total:** 5
- **Tasks Completed:** 0
- **Tasks In Progress:** 0
- **Tasks TODO:** 5
- **Estimated Time:** 1-2 days

---

## 🚨 CRITICAL NOTES

1. **NGROK Token** in `config/example.env` must be rotated immediately
2. **CORS wildcards** expose all workers to XSS attacks
3. **Build ignoring errors** can deploy broken code to production
4. **Console.logs** may expose sensitive information
5. **Missing env validation** can cause runtime failures

---

**Created:** Janeiro 2025  
**Branch:** fix/critical-security  
**Assignee:** Development Team  
**Priority:** P0 - Critical

---

*Update this file as tasks are completed. Mark with ✅ when done.*

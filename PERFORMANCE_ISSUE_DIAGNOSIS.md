# 🔧 Performance Issue Analysis & Fix

**Root Cause**: **Render free tier spins down services after 15 minutes of inactivity**

When you don't use the app for 5-10 hours:
1. ✗ Render spins down the backend (saves resources)
2. ✗ Supabase connections timeout
3. ✗ Next login request takes 30-60s for Render to spin up + reconnect to DB

---

## 📊 Diagnosis

### Current Architecture Issues:

```
Frontend (Vercel)
    ↓ (HTTP request after 5-10 hours idle)
    ↓ (WAITS 30-60 seconds for Render to spin up)
Backend (Render - FREE TIER - SPINS DOWN) ❌
    ↓
Database (Supabase - connections timeout) ❌
```

### Backend Config Issue:
- **File**: `render.yaml`
- **Problem**: `plan: free` = auto spin-down after 15 min inactivity
- **Result**: 30-60 second delay on first request after idle

### API Client Issue:
- **File**: `src/services/api.ts`
- **Problem**: No retry logic for timeouts
- **Result**: Failed requests when backend is spinning up

---

## ✅ Solutions

### Fix 1: Add Retry Logic to fetchApi (IMMEDIATE)
Add exponential backoff retry for temporary failures:
```typescript
// Retry up to 3 times for network errors
// Wait: 1s → 2s → 4s
```

### Fix 2: Add Keep-Alive Ping (IMMEDIATE)
Send background request every 10 minutes to keep services warm:
```typescript
// Background task pings /api/health endpoint
// Keeps Render warm, prevents spin-down
```

### Fix 3: Add Health Check Endpoint (IMMEDIATE)
Fast endpoint for keep-alive pings:
```typescript
// GET /api/health → responds in <100ms
// No database calls, just confirms backend is running
```

### Fix 4: Optimize Supabase Connection (OPTIONAL)
Add connection pooling to Supabase config.

---

## 🚀 Implementation

Will implement in this order:
1. ✅ Add retry logic to API calls
2. ✅ Add keep-alive mechanism
3. ✅ Add health check endpoint
4. ✅ Test and verify

Then you can:
- Keep app tab open → always fast (no spin-down)
- OR upgrade Render to paid plan → no spin-down ever

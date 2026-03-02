# NICSAN CRM – Fixes Summary

This document lists all fixes applied to the NICSAN CRM codebase, including auth/403 error resolution, type fixes, cleanup, and hardcoded localhost URL fixes.

---

## 1. Auth Fixes

### 1.1 Auth Split Fix (Single Source of Truth)

**Problem:** `NicsanCRMMock` used local state for login and never updated AuthContext. CrossDeviceSyncProvider and pages using `useAuth()` got `user = null` after login.

**Fix:**
- `LoginPage` now calls `AuthContext.login()` instead of `DualStorageService.login` + `onLogin`
- `NicsanCRMMock` uses `useAuth()` for `user`, `isAuthenticated`, `isLoading`, `logout`
- AuthContext is the single source of truth for auth state

**Files changed:** `src/contexts/AuthContext.tsx`, `src/NicsanCRMMock.tsx`

---

### 1.2 403 Before Login Fix

**Problem:** Sync service ran on app load (before anyone logged in) and called policies, uploads, dashboard APIs. With no token, backend returned 403.

**Fix:** In `fetchAllData()`, check for auth token first. If no token, return empty data immediately without calling any APIs.

**File changed:** `src/services/crossDeviceSyncService.ts`

---

### 1.3 403 for Telecallers (Already in Place)

**Problem:** Telecallers don't have access to policies, uploads, dashboard APIs. Sync was calling them for all users.

**Fix:** When role is `telecaller`, sync returns empty data and skips those API calls. Role comes from `CrossDeviceSyncProvider` (AuthContext) or JWT fallback.

**File:** `src/services/crossDeviceSyncService.ts`

---

## 2. Type Fixes

### 2.1 AuthContext User Role

**Fix:** Added `'telecaller'` to `User.role` type.

**File:** `src/contexts/AuthContext.tsx`

---

### 2.2 LoginResponse Role

**Fix:** Added `'telecaller'` to `LoginResponse.user.role` type.

**File:** `src/services/api.ts`

---

## 3. JWT Parsing Fix

**Problem:** `api.ts` used `atob()` directly on JWT payload. JWTs use Base64URL encoding; `atob()` expects standard Base64. Could fail for some tokens.

**Fix:** Added `decodeJwtPayload()` helper with proper Base64URL handling (same logic as `crossDeviceSyncService`). Used in `apiCall()` and `refreshToken()`.

**File:** `src/services/api.ts`

---

## 4. Cleanup

### 4.1 Removed Unused ProtectedRoute

**Fix:** Deleted `src/components/ProtectedRoute.tsx` – it was never imported or used.

---

### 4.2 Logout Without Full Page Reload

**Problem:** `authUtils.logout()` did `window.location.href = '/'`, forcing a full page reload.

**Fix:** Removed the redirect. AuthContext's `setUser(null)` triggers re-render; app shows LoginPage without reload.

**File:** `src/services/api.ts`

---

## 5. Hardcoded Localhost URL Fixes

**Problem:** Several API calls used `http://localhost:3001` hardcoded. In staging/production, these would fail because the backend is not on localhost.

**Fix:** Replaced hardcoded URLs with `API_BASE_URL` or `VITE_API_BASE_URL` so they work in all environments.

### 5.1 backendApiService.ts (5 places)

| Endpoint | Method | Used by |
|----------|--------|---------|
| `/upload/document` | uploadDocument() | PDF Upload |
| `/upload/documents/${policyNumber}` | getPolicyDocuments() | Policy Detail |
| `/health-insurance/save` | saveHealthInsurance() | Manual Form |
| `/health-insurance/${policyNumber}` | getHealthInsuranceDetail() | Policy Detail |
| `/dashboard/health-metrics` | getHealthInsuranceMetrics() | Company Overview |

### 5.2 PolicyDetail.tsx (1 place)

| Endpoint | Function | Used when |
|----------|----------|-----------|
| `/upload/s3-url/${s3Key}` | downloadDocument() | User clicks download for policy PDF, Aadhaar, pancard, RC |

**Files changed:** `src/services/backendApiService.ts`, `src/pages/operations/PolicyDetail/PolicyDetail.tsx`

---

## 6. Summary Table

| # | Fix | File(s) |
|---|-----|---------|
| 1 | Auth split (AuthContext single source) | AuthContext.tsx, NicsanCRMMock.tsx |
| 2 | 403 before login (no token check) | crossDeviceSyncService.ts |
| 3 | 403 for telecallers (role skip) | crossDeviceSyncService.ts |
| 4 | AuthContext User.role + telecaller | AuthContext.tsx |
| 5 | LoginResponse role + telecaller | api.ts |
| 6 | JWT Base64URL parsing | api.ts |
| 7 | Removed unused ProtectedRoute | (deleted) |
| 8 | Logout without full reload | api.ts |
| 9 | Hardcoded localhost URLs (6 places) | backendApiService.ts, PolicyDetail.tsx |

---

## 7. Related Documentation

- **CROSSDEVICE_SYNC_AND_SETTINGS_CHANGES_DOCUMENTATION.md** – Detailed CrossDevice sync and Settings changes
- **TASK_ENGINE_AND_CHANGES_DOCUMENTATION.md** – Task engine implementation
- **IMPLEMENTATION_SUMMARY_FINAL.md** – Full implementation summary

---

*Generated for NICSAN CRM codebase.*

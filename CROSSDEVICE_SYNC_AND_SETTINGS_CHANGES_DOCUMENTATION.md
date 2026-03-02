# Cross-Device Sync & Settings – Detailed Change Documentation

This document describes all changes made to the **Cross-Device Sync Service**, **Settings (SettingsContext)**, **Settings page** (Account Settings / change password), **AuthContext**, and related components to fix **403 Forbidden** errors (before login, for telecallers), the **auth split bug** (two sources of truth), and to give telecallers access to change their own password.

---

## 1. PROBLEM SUMMARY

### 1.1 Settings 403 Errors

| Scenario | Error | Cause |
|----------|------|-------|
| **Before login** | `GET /api/settings` → 403 Forbidden | `SettingsProvider` was mounted at app root and called `/api/settings` on load, before any user was authenticated. |
| **Telecaller logged in** | `GET /api/settings` → 403 Forbidden | `/api/settings` is **founder-only** (`requireFounder`). Telecallers and ops users do not have access. |
| **Ops logged in** | `GET /api/settings` → 403 Forbidden | Same as above – only founders can access the settings API. |

### 1.2 Cross-Device Sync 403 Errors

| Scenario | Error | Cause |
|----------|------|-------|
| **Before login** | `GET /api/policies/search-fields`, `/api/upload`, `/api/dashboard/metrics` → 403 | Sync service runs on app load and called these APIs without any auth token. |
| **Telecaller logged in** | `GET /api/policies/search-fields` → 403 | Sync service fetches policies, uploads, dashboard for all users. These APIs are ops/founder-only. |
| **Telecaller logged in** | `GET /api/upload` → 403 | Same – telecallers cannot access uploads. |
| **Telecaller logged in** | `GET /api/dashboard/metrics` → 403 | Same – telecallers cannot access dashboard. |

### 1.3 Auth Split (Two Sources of Truth)

| Scenario | Problem | Cause |
|----------|---------|-------|
| **After login** | CrossDeviceSyncProvider never got user; pages using `useAuth()` got `user = null` | `NicsanCRMMock` used local state for login and never updated AuthContext. AuthContext stayed empty. |

The sync service runs on:
- Initial load
- Every 30 seconds (periodic sync)
- When the tab becomes visible
- When the window regains focus
- When the device comes back online

So telecallers were repeatedly hitting 403 on these endpoints.

---

## 2. SETTINGS CHANGES (SettingsContext)

**File:** `src/contexts/SettingsContext.tsx`

### 2.1 New `userRole` Prop

**Before:** `SettingsProvider` had no role awareness. It always called `DualStorageService.getSettings()` (which hits `/api/settings`) on mount.

**After:** `SettingsProvider` accepts an optional `userRole` prop:

```typescript
interface SettingsProviderProps {
  children: ReactNode;
  /** Only founders can access /api/settings. For telecaller/ops, use defaults and skip the API call to avoid 403. */
  userRole?: 'founder' | 'ops' | 'telecaller';
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children, userRole = 'ops' }) => {
```

- **Default:** `userRole = 'ops'` – if not passed, treats user as ops (no API call).

### 2.2 Conditional API Fetch in `refreshSettings`

**Before:** `refreshSettings` always called `DualStorageService.getSettings()`.

**After:** It returns immediately if the user is not a founder:

```typescript
const refreshSettings = async () => {
  if (userRole !== 'founder') return; // /api/settings requires founder role
  try {
    setIsLoading(true);
    // ... fetch settings
  }
};
```

### 2.3 Conditional Fetch in `useEffect`

**Before:** `useEffect` always called `refreshSettings()` on mount/dependency change.

**After:** Role-based behavior:

```typescript
useEffect(() => {
  if (userRole === 'founder') {
    refreshSettings();
  } else {
    setSettings(defaultSettings);
    setIsLoading(false);
    setError(null);
  }
}, [userRole]);
```

- **Founder:** Fetches settings from API.
- **Ops / Telecaller:** Uses `defaultSettings` (brokeragePercent: '15', repDailyCost: '2000', etc.), no API call.

### 2.4 Initial Loading State

**Before:** `isLoading` started as `true` or a fixed value.

**After:** `isLoading` is `true` only when the user is a founder (since only founders trigger a fetch):

```typescript
const [isLoading, setLoading] = useState(userRole === 'founder');
```

### 2.5 Default Settings

Non-founders receive these defaults (no API call):

| Key | Default Value |
|-----|---------------|
| `brokeragePercent` | `'15'` |
| `repDailyCost` | `'2000'` |
| `expectedConversion` | `'25'` |
| `premiumGrowth` | `'10'` |

---

## 3. SETTINGS PROVIDER MOUNTING (NicsanCRMMock)

**File:** `src/NicsanCRMMock.tsx`

### 3.1 Mount Only After Login

**Before:** `SettingsProvider` was likely mounted at the app root (e.g. in `App.tsx` or similar), wrapping the entire app including the login page. On mount, it called `/api/settings` without a valid token → **403 before login**.

**After:** `SettingsProvider` is mounted **only after** the user has logged in. `NicsanCRMMock` now uses `useAuth()` from AuthContext (single source of truth):

```tsx
const { user, isAuthenticated, isLoading, logout } = useAuth();
// ...
if (!isAuthenticated || !user) return <LoginPage />;

return (
  <SettingsProvider userRole={user.role}>
    {/* ... rest of app */}
  </SettingsProvider>
);
```

- Before login: No `SettingsProvider` → no settings API call.
- After login: `SettingsProvider` mounts with `userRole={user.role}` from AuthContext.

### 3.2 Passing `userRole`

`userRole` is passed from the logged-in user:

```tsx
<SettingsProvider userRole={user.role}>
```

So the provider knows whether to fetch (founder) or use defaults (ops/telecaller).

### 3.3 Telecaller Settings Page (Account Settings / Change Password)

**File:** `src/NicsanCRMMock.tsx`

Telecallers now have a **Settings** page in their sidebar, same as Operations. This is the **Account Settings** page that allows users to change their own password.

**Changes:**

1. **TelecallerSidebar** – Added Settings item:
   ```tsx
   { id: "settings", label: "Settings", icon: Settings },
   ```

2. **Telecaller route** – Added route for Settings page:
   ```tsx
   {telecallerPage === "settings" && <PageOperationsSettings />}
   ```

**Behavior:**

- Telecallers see **Create Request**, **My Requests**, and **Settings** in the sidebar.
- The Settings page uses the same `PageOperationsSettings` component as Operations, which includes `WorkingPasswordChange` (current password, new password, confirm password).
- Backend: `POST /api/password/change-own` uses `authenticateToken` only (no role restriction), so any authenticated user—including telecallers—can change their own password.

**Note:** This is separate from **SettingsContext** (business settings like brokeragePercent, repDailyCost). Those remain founder-only. The Telecaller Settings page is for **Account Settings** (change password only).

---

## 4. CROSS-DEVICE SYNC SERVICE CHANGES

**File:** `src/services/crossDeviceSyncService.ts`

### 4.1 New Private Property: `userRole`

```typescript
private userRole: string = '';
```

Stores the current user's role so the sync service can decide whether to call ops-only APIs.

### 4.2 New Public Method: `setUserRole(role: string)`

```typescript
public setUserRole(role: string): void {
  this.userRole = role || '';
}
```

Called by `CrossDeviceSyncProvider` when the user logs in or out. Allows the sync service to know the current role without fetching it itself.

### 4.3 New Private Method: `decodeJwtPayload(token: string)`

```typescript
/** Decode JWT payload (Base64URL); returns null on failure. */
private decodeJwtPayload(token: string): { role?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const padded = pad ? base64 + '==='.slice(0, 4 - pad) : base64;
    const json = atob(padded);
    return JSON.parse(json) as { role?: string };
  } catch {
    return null;
  }
}
```

**Why:**

- JWTs use **Base64URL** encoding (`-` and `_` instead of `+` and `/`).
- `atob()` expects standard Base64.

Without this conversion, `atob()` can fail or produce wrong output. This helper correctly decodes the JWT payload so the role can be read from the token when the provider has not yet set it.

### 4.4 New Private Method: `getEffectiveRole()`

```typescript
private getEffectiveRole(): string {
  if (this.userRole) return this.userRole;
  try {
    const token = localStorage.getItem('authToken');
    if (token) {
      const payload = this.decodeJwtPayload(token);
      if (payload && payload.role) return payload.role;
    }
  } catch (_e) {}
  return '';
}
```

**Logic:**

1. If `setUserRole` has been called (user logged in via AuthContext), use `this.userRole`.
2. Otherwise, try to read the role from the JWT in `localStorage` (e.g. when login uses `NicsanCRMMock` local state and AuthContext is not updated).
3. Return `''` if neither is available.

**Why both sources?**

- `CrossDeviceSyncProvider` uses `useAuth()` from AuthContext and calls `setUserRole(user.role)` when user logs in.
- JWT fallback: If the provider has not yet set the role (e.g. timing edge case), reading from the JWT ensures telecallers are still detected correctly.

### 4.5 Modified `fetchAllData()` – Skip Before Login & Telecaller Skip

**Before:** `fetchAllData()` always called the same APIs for all users:

```typescript
const [policiesResponse, healthInsuranceResponse, uploadsResponse, dashboardResponse] = await Promise.all([
  DualStorageService.getPolicySearchFields(),
  DualStorageService.getHealthInsuranceSearchFields(),
  DualStorageService.getUploads(),
  DualStorageService.getDashboardMetrics()
]);
```

**After:** Early returns for (1) no token (before login) and (2) telecaller role:

```typescript
private async fetchAllData(): Promise<SyncData | null> {
  try {
    // Skip sync when user is not logged in (no token) - avoid 403 before login
    if (!localStorage.getItem('authToken')) {
      return { policies: [], healthInsurance: [], uploads: [], dashboard: null, lastUpdated: Date.now() };
    }
    // Telecallers don't have access to policies, uploads, dashboard - skip to avoid 403 errors
    // Check both setUserRole and JWT (sync can run before provider sets role)
    if (this.getEffectiveRole() === 'telecaller') {
      return {
        policies: [],
        healthInsurance: [],
        uploads: [],
        dashboard: null,
        lastUpdated: Date.now()
      };
    }

    // ... rest of fetch (unchanged for founder/ops)
  }
}
```

**For before login (no token):**

- No API calls → no 403 errors on login page.

**For telecallers:**

- No calls to `getPolicySearchFields`, `getHealthInsuranceSearchFields`, `getUploads`, `getDashboardMetrics`.
- Returns empty arrays and `null` for dashboard.
- Sync still runs (cache, status, etc.) but without hitting forbidden APIs.

---

## 5. CROSS-DEVICE SYNC PROVIDER CHANGES

**File:** `src/components/CrossDeviceSyncProvider.tsx`

### 5.1 New `useEffect` – Set User Role on Auth Change

```typescript
useEffect(() => {
  if (isAuthenticated && user) {
    // Set user ID for WebSocket service
    wsService.setUserId(user.id.toString());
    // Set role so sync skips ops-only APIs for telecallers (avoids 403 errors)
    syncService.setUserRole(user.role || '');
  } else {
    syncService.setUserRole('');
  }
}, [isAuthenticated, user]);
```

**Behavior:**

- When the user is authenticated and `user` exists: `syncService.setUserRole(user.role)`.
- When logged out or no user: `syncService.setUserRole('')`.

So the sync service always has the current role when AuthContext is available. AuthContext is now the single source of truth (see Section 7). The JWT fallback remains as a safety net for edge cases.

---

## 6. BACKEND CONTEXT (for reference)

**File:** `nicsan-crm-backend/routes/settings.js`

```javascript
router.get('/', authenticateToken, requireFounder, async (req, res) => {
  // ...
});
```

- `authenticateToken` – requires a valid JWT.
- `requireFounder` – only founders can access.

**APIs restricted to ops/founder:**

- `GET /api/policies/search-fields`
- `GET /api/upload`
- `GET /api/dashboard/metrics`

Telecallers are not allowed to call these endpoints, hence the need to skip them in the sync service when the role is `telecaller`.

---

## 7. AUTH SPLIT FIX (Single Source of Truth)

**Problem:** `NicsanCRMMock` used local state for login and never updated AuthContext. CrossDeviceSyncProvider and pages using `useAuth()` got `user = null` after login.

**Fix:** AuthContext is now the single source of truth. Login updates AuthContext; all consumers read from it.

### 7.1 AuthContext Changes

**File:** `src/contexts/AuthContext.tsx`

- Added `'telecaller'` to `User.role` type.

### 7.2 NicsanCRMMock Changes

**File:** `src/NicsanCRMMock.tsx`

- Removed local `user` state; uses `useAuth()` for `user`, `isAuthenticated`, `isLoading`, `logout`.
- `LoginPage` calls `AuthContext.login()` instead of `DualStorageService.login` + `onLogin`.
- `onLogout` uses `logout` from AuthContext.
- Added `useEffect` to set tab based on `user.role` when user changes.

### 7.3 LoginPage Changes

**File:** `src/NicsanCRMMock.tsx`

- Removed `onLogin` prop.
- Uses `login({ email, password })` from `useAuth()`.
- On success, AuthContext updates; `NicsanCRMMock` re-renders with user from context.

---

## 8. 403 BEFORE LOGIN FIX

**Problem:** Sync service ran on app load (before anyone logged in) and called policies, uploads, dashboard APIs. With no token, backend returned 403.

**Fix:** In `fetchAllData()`, check for auth token first. If no token, return empty data immediately without calling any APIs.

**File:** `src/services/crossDeviceSyncService.ts`

```typescript
// At start of fetchAllData():
if (!localStorage.getItem('authToken')) {
  return {
    policies: [],
    healthInsurance: [],
    uploads: [],
    dashboard: null,
    lastUpdated: Date.now()
  };
}
```

---

## 9. CHANGE SUMMARY TABLE

| File | Change | Purpose |
|------|--------|---------|
| `src/contexts/AuthContext.tsx` | Added `'telecaller'` to User.role type | Support telecaller role |
| `src/NicsanCRMMock.tsx` | Use `useAuth()` instead of local user state | AuthContext as single source of truth |
| `src/NicsanCRMMock.tsx` | `LoginPage` calls `AuthContext.login()` | Login updates AuthContext |
| `src/NicsanCRMMock.tsx` | `onLogout` uses `logout` from AuthContext | Proper logout flow |
| `src/services/crossDeviceSyncService.ts` | Check for `authToken` before API calls | Avoid 403 before login |
| `src/contexts/SettingsContext.tsx` | Added `userRole` prop | Only founders fetch settings |
| `src/contexts/SettingsContext.tsx` | `refreshSettings` returns early if not founder | Avoid 403 for non-founders |
| `src/contexts/SettingsContext.tsx` | `useEffect` fetches only when founder | Same |
| `src/contexts/SettingsContext.tsx` | Non-founders use `defaultSettings` | No API call for ops/telecaller |
| `src/NicsanCRMMock.tsx` | `SettingsProvider` only after login | Avoid 403 before login |
| `src/NicsanCRMMock.tsx` | `userRole={user.role}` passed to `SettingsProvider` | Role-aware settings fetch |
| `src/NicsanCRMMock.tsx` | TelecallerSidebar: Settings item + route | Telecallers can change password (same as Operations) |
| `src/services/crossDeviceSyncService.ts` | `userRole`, `setUserRole()` | Store role for sync decisions |
| `src/services/crossDeviceSyncService.ts` | `decodeJwtPayload()` | Correct JWT Base64URL decode |
| `src/services/crossDeviceSyncService.ts` | `getEffectiveRole()` | Role from provider or JWT |
| `src/services/crossDeviceSyncService.ts` | Skip policies/uploads/dashboard for telecaller | Avoid 403 for telecallers |
| `src/components/CrossDeviceSyncProvider.tsx` | `syncService.setUserRole(user.role)` on auth change | Pass role to sync service |

---

## 10. DATA FLOW

### Cross-Device Sync (Before Login)

```
App loads → CrossDeviceSyncService runs sync
  → fetchAllData() checks localStorage.getItem('authToken')
  → No token → return empty data immediately, no API calls → No 403
```

### Settings (Founder)

```
User logs in (founder) → AuthContext has user → NicsanCRMMock mounts SettingsProvider(userRole={user.role})
  → userRole === 'founder' → refreshSettings() → GET /api/settings → OK
```

### Settings (Telecaller / Ops)

```
User logs in (telecaller/ops) → AuthContext has user → NicsanCRMMock mounts SettingsProvider(userRole={user.role})
  → userRole !== 'founder' → use defaultSettings, no API call
```

### Cross-Device Sync (Founder / Ops)

```
User logs in → AuthContext.login() updates user
  → CrossDeviceSyncProvider gets user from AuthContext, calls syncService.setUserRole(user.role)
  → sync runs → getEffectiveRole() returns 'founder' or 'ops'
  → fetchAllData() calls policies, uploads, dashboard APIs → OK
```

### Cross-Device Sync (Telecaller)

```
User logs in (telecaller) → AuthContext.login() updates user
  → CrossDeviceSyncProvider gets user, calls syncService.setUserRole('telecaller')
  → sync runs → getEffectiveRole() returns 'telecaller'
  → fetchAllData() returns empty data immediately, no API calls → No 403
```

### Telecaller Settings Page (Change Password)

```
Telecaller logs in → Sidebar: Create Request, My Requests, Settings
  → Clicks Settings → PageOperationsSettings (WorkingPasswordChange)
  → Submits form → POST /api/password/change-own (authenticateToken only) → OK
```

---

## 11. SETTINGS PAGE vs SETTINGS CONTEXT

| Concept | Purpose | Who can access |
|--------|---------|----------------|
| **SettingsContext** | Business settings (brokeragePercent, repDailyCost, etc.) | `GET /api/settings` – founder only |
| **Settings page** | Account Settings (change own password) | Operations, Telecaller, Founder – `POST /api/password/change-own` uses `authenticateToken` only |

---

*Document generated for the NICSAN CRM codebase.*

# NICSAN CRM – Task Engine & Related Changes – Implementation Summary

This document lists everything that was implemented and all files that were created or changed.

---

## 1. WHAT WAS IMPLEMENTED

### 1.1 Task Engine (End-to-End)

| Feature | Description |
|--------|--------------|
| **Database** | `tasks` and `task_documents` tables; `users` extended with status, task_limit, avg_response_time_ms |
| **Backend APIs** | Create task, my-requests, assigned, get by id, start, complete, executive status, summary |
| **Assignment engine** | Picks available executive; SLA: QUOTE 5 min, ISSUE_POLICY 10 min |
| **Telecaller flow** | Create Request (form + docs), My Requests (list + download) |
| **Operations flow** | Task Inbox, availability toggle, start/complete task |
| **Founder flow** | Task Engine Dashboard (metrics + recent tasks) |
| **User role** | Telecaller role added in user management |

### 1.2 403 Error Fixes

| Fix | What it does |
|-----|----------------|
| **Settings** | SettingsProvider only fetches `/api/settings` when user is **founder**; telecaller/ops use defaults (no API call). |
| **Settings mount** | SettingsProvider mounts only after login (not on login page). |
| **CrossDeviceSync** | For **telecaller** role, sync skips policies/uploads/dashboard APIs to avoid 403. |

### 1.3 Real-Time Task Events (Socket.IO)

| Feature | Description |
|--------|--------------|
| **Backend** | Emits `task_assigned` (to executive) and `task_completed` (to telecaller). |
| **Frontend** | `websocketSyncService` listens for `task_assigned` and `task_completed`. |
| **TaskInbox** | Refreshes when `task_assigned` is received. |
| **My Requests** | Refreshes when `task_completed` is received. |

### 1.4 Reassign Override (Founder Only)

| Feature | Description |
|--------|--------------|
| **API** | `PATCH /api/tasks/:id/reassign` with body `{ executive_id: number }`. |
| **Access** | **Founder only** (requireFounderOnly). |
| **Backend** | Updates assigned_to, sla_deadline, reassignment_count; emits `task_assigned` to new executive. |
| **Frontend** | Task Engine Dashboard: Reassign button + modal with executive dropdown. |

### 1.5 SLA Breach Cron

| Feature | Description |
|--------|--------------|
| **Job** | Runs every **2 minutes**. |
| **Logic** | Finds tasks with status ASSIGNED or IN_PROGRESS and `sla_deadline < NOW()`. |
| **Action** | Sets status to **SLA_BREACHED**. No auto-reassign. |
| **Admin** | Founder sees breached tasks in Task Engine Dashboard and can manually reassign. |

---

## 2. FILES CREATED

| File | Purpose |
|------|--------|
| `nicsan-crm-backend/services/assignmentEngine.js` | Picks available executive; SLA deadline helper. |
| `nicsan-crm-backend/services/taskService.js` | Task CRUD, start/complete, reassign, summary; S3 docs. |
| `nicsan-crm-backend/routes/tasks.js` | Task API routes. |
| `nicsan-crm-backend/jobs/slaBreachCron.js` | Cron to mark overdue tasks as SLA_BREACHED. |
| `src/services/taskApi.ts` | Frontend task API client. |
| `src/pages/telecaller/CreateRequest.tsx` | Create task form (telecaller). |
| `src/pages/telecaller/MyRequests.tsx` | Telecaller’s task list + download. |
| `src/pages/operations/TaskInbox/TaskInbox.tsx` | Executive inbox, availability, start/complete. |
| `src/pages/founders/TaskEngineDashboard/TaskEngineDashboard.tsx` | Founder dashboard + Reassign UI. |

---

## 3. FILES MODIFIED

### Backend

| File | Changes |
|------|--------|
| `nicsan-crm-backend/middleware/auth.js` | Added `requireFounderOnly`; existing role middleware unchanged. |
| `nicsan-crm-backend/routes/users.js` | Role validation allows `telecaller`. |
| `nicsan-crm-backend/server.js` | Mounted `/api/tasks`; starts `slaBreachCron`. |

### Frontend

| File | Changes |
|------|--------|
| `src/contexts/SettingsContext.tsx` | `userRole` prop; fetch settings only when `userRole === 'founder'`; default settings for others. |
| `src/services/crossDeviceSyncService.ts` | `userRole`, `setUserRole`, `getEffectiveRole`; skip sync for telecaller. |
| `src/components/CrossDeviceSyncProvider.tsx` | Calls `syncService.setUserRole(user.role)` on auth change. |
| `src/services/websocketSyncService.ts` | Listeners for `task_assigned` and `task_completed`; `onTaskAssigned`, `onTaskCompleted`, remove callbacks. |
| `src/services/taskApi.ts` | `reassignTask(taskId, executiveId)`. |
| `src/pages/operations/TaskInbox/TaskInbox.tsx` | Subscribes to `task_assigned` to refresh list. |
| `src/pages/telecaller/MyRequests.tsx` | Subscribes to `task_completed` to refresh list. |
| `src/pages/founders/TaskEngineDashboard/TaskEngineDashboard.tsx` | Reassign button, modal, ops users dropdown, `reassignTask` call. |
| `src/NicsanCRMMock.tsx` | SettingsProvider only after login; `userRole={user.role}`; telecaller shell; Task Inbox; Task Engine Dashboard. |
| `src/components/Settings/UserManagement.tsx` | Telecaller role option. |
| `src/services/userService.ts` | Types include `telecaller` role. |

---

## 4. QUICK REFERENCE – ROUTES & ROLES

### Task API (backend)

| Method | Route | Who |
|--------|-------|-----|
| POST | `/api/tasks` | Telecaller, Founder, Admin |
| GET | `/api/tasks/my-requests` | Telecaller, Founder, Admin |
| GET | `/api/tasks/assigned` | Ops |
| GET | `/api/tasks/summary` | Founder |
| PATCH | `/api/tasks/executives/me/status` | Ops |
| GET | `/api/tasks/:id` | Authenticated |
| POST | `/api/tasks/:id/start` | Ops |
| POST | `/api/tasks/:id/complete` | Ops |
| **PATCH** | **`/api/tasks/:id/reassign`** | **Founder only** |

### Frontend pages

| Page | Role | Location |
|------|------|----------|
| Create Request | Telecaller | Telecaller sidebar |
| My Requests | Telecaller | Telecaller sidebar |
| Task Inbox | Ops | Operations sidebar |
| Task Engine Dashboard | Founder | Founder sidebar (Reassign here) |

---

## 5. SLA BEHAVIOUR SUMMARY

- **On assign:** `sla_deadline` set (QUOTE 5 min, ISSUE_POLICY 10 min).
- **Cron (every 2 min):** Tasks with status ASSIGNED/IN_PROGRESS and `sla_deadline < NOW()` → status set to **SLA_BREACHED**.
- **No auto-reassign:** Founder uses Reassign in Task Engine Dashboard to move SLA_BREACHED tasks to another executive.

---

*Document generated to reflect the current state of the NICSAN CRM codebase.*

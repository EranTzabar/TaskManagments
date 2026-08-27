# API Reference

REST endpoints under `src/app/api/`. All routes return JSON unless noted.

**Related documentation**

- [App structure](APP_STRUCTURE.md)
- [UI guide](UI.md)
- [Architecture](ARCHITECTURE.md)
- [Running and usage](RUNNING.md)

---

## Conventions

| Item | Rule |
|------|------|
| Authentication | httpOnly cookie `auth_token` (JWT) |
| Error shape | `{ "error": "message" }` |
| Status codes | `401` unauthenticated, `403` forbidden, `400` validation, `404` not found, `500` server error |
| Project scope | Many task routes require `?projectId=` query parameter |

### Guards

| Guard | Meaning |
|-------|---------|
| Auth | Valid JWT required |
| Admin | Authenticated user with `role === "admin"` |
| Project | User may access the given `projectId` (admins always pass) |

---

## Authentication

### `POST /api/auth/login`

| | |
|---|---|
| Guard | None |
| Body | `{ "username": string, "password": string }` |
| Success | `200` — `{ "user": { "username", "role" } }`; sets `auth_token` cookie |
| Errors | `400` missing fields, `401` invalid credentials |

### `POST /api/auth/logout`

| | |
|---|---|
| Guard | None |
| Body | Empty |
| Success | `200` — `{ "ok": true }`; clears cookie |

### `GET /api/auth/me`

| | |
|---|---|
| Guard | Auth |
| Success | `200` — `{ "user": { "username", "role" } }` |
| Errors | `401` not logged in |

---

## Projects

### `GET /api/projects`

| | |
|---|---|
| Guard | Auth |
| Success | `200` — `{ "projects": Project[] }` filtered by user board access |

### `POST /api/projects`

| | |
|---|---|
| Guard | Admin |
| Body | `{ "name": string }` (max 50 chars) |
| Success | `201` — `{ "project": Project }` |

### `PATCH /api/projects/[id]`

| | |
|---|---|
| Guard | Admin |
| Body | `{ "name": string }` |
| Success | `200` — `{ "project": Project }` |

### `DELETE /api/projects/[id]`

| | |
|---|---|
| Guard | Admin |
| Success | `200` — `{ "ok": true }` |
| Side effects | Deletes all tasks, custom columns, and board notes for the project |

---

## Tasks

All task routes use numeric `taskId` in the path. Most require `?projectId=` on the query string.

### `GET /api/tasks?projectId={id}`

| | |
|---|---|
| Guard | Auth + Project |
| Success | `200` — `{ "tasks": Task[] }` |

### `POST /api/tasks?projectId={id}`

| | |
|---|---|
| Guard | Admin |
| Body | `{ "title", "priority", "details", "parentTaskId?": number \| null, "projectId?": number }` |
| Success | `201` — `{ "task": Task, "parentTask?": Task }` when creating a subtask |
| Notes | Does not currently call `requireProjectAccess` — admin-only but worth hardening |

### `PATCH /api/tasks/[id]?projectId={id}`

| | |
|---|---|
| Guard | Admin |
| Body | Partial: `{ "title?", "priority?", "status?", "details?", "notes?", "customFields?": { [columnId]: string } }` |
| Success | `200` — `{ "task": Task, "parentTask?": Task }` when parent status rolls up |

### `DELETE /api/tasks/[id]?projectId={id}`

| | |
|---|---|
| Guard | Admin |
| Success | `200` — `{ "ok": true, "parentTask?": Task }` when parent status rolls up |

### `POST /api/tasks/reorder?projectId={id}`

| | |
|---|---|
| Guard | Admin |
| Body | `{ "orderedTaskIds": number[] }` |
| Success | `200` — `{ "tasks": Task[] }` |

### `POST /api/tasks/import?projectId={id}`

| | |
|---|---|
| Guard | Admin |
| Body | `{ "tasks": ImportTask[] }` or `ImportTask[]` |
| Success | `200` — `{ "imported": number, "tasks": Task[] }` |

### `POST /api/tasks/delete-all?projectId={id}`

| | |
|---|---|
| Guard | Admin |
| Success | `200` — `{ "deleted": number }` |

### `POST /api/tasks/reset?projectId={id}`

| | |
|---|---|
| Guard | Admin |
| Success | `200` — `{ "reset": number }` — sets all task statuses to `ממתין להתחלה` |

---

## Custom columns

Base path: `/api/projects/[id]/columns`

### `GET /api/projects/[id]/columns`

| | |
|---|---|
| Guard | Auth |
| Success | `200` — `{ "columns": CustomColumn[] }` |
| Note | Does not call `requireProjectAccess` |

### `POST /api/projects/[id]/columns`

| | |
|---|---|
| Guard | Admin |
| Body | `{ "name": string, "type": "text" \| "number" \| "date" \| "link" }` |
| Success | `201` — `{ "column": CustomColumn }` |

### `PATCH /api/projects/[id]/columns/[columnId]`

| | |
|---|---|
| Guard | Admin |
| Body | `{ "name": string }` |
| Success | `200` — `{ "column": CustomColumn }` |

### `DELETE /api/projects/[id]/columns/[columnId]`

| | |
|---|---|
| Guard | Admin |
| Success | `200` — `{ "ok": true }` |
| Side effects | Removes column values from all project tasks |

### `POST /api/projects/[id]/columns/reorder`

| | |
|---|---|
| Guard | Admin |
| Body | `{ "orderedColumnIds": number[] }` |
| Success | `200` — `{ "columns": CustomColumn[] }` |

---

## Board notes

Base path: `/api/projects/[id]/notes`

### `GET /api/projects/[id]/notes`

| | |
|---|---|
| Guard | Auth + Project |
| Success | `200` — `{ "notes": BoardNote[] }` |

### `POST /api/projects/[id]/notes`

| | |
|---|---|
| Guard | Admin + Project |
| Body | `{ "content?", "color?", "x?", "y?", "width?", "height?" }` |
| Success | `201` — `{ "note": BoardNote }` |

### `PATCH /api/projects/[id]/notes/[noteId]`

| | |
|---|---|
| Guard | Admin + Project |
| Body | Partial: `{ "content?", "color?", "x?", "y?", "width?", "height?", "zIndex?" }` |
| Success | `200` — `{ "note": BoardNote }` |

### `DELETE /api/projects/[id]/notes/[noteId]`

| | |
|---|---|
| Guard | Admin + Project |
| Success | `200` — `{ "ok": true }` |

---

## Users

### `GET /api/users`

| | |
|---|---|
| Guard | Admin |
| Success | `200` — `{ "users": UserPublic[] }` (no password hash) |

### `POST /api/users`

| | |
|---|---|
| Guard | Admin |
| Body | `{ "username", "password", "role": "admin" \| "user", "allowedProjectIds?": number[] \| null }` |
| Success | `201` — `{ "user": UserPublic }` |

### `PATCH /api/users/[id]`

| | |
|---|---|
| Guard | Admin |
| Body | `{ "role?", "password?", "allowedProjectIds?": number[] \| null }` |
| Success | `200` — `{ "user": UserPublic }` |

### `DELETE /api/users/[id]`

| | |
|---|---|
| Guard | Admin |
| Success | `200` — `{ "ok": true }` |
| Errors | `400` if deleting the current user |

---

## Presence

### `POST /api/sessions/sync`

| | |
|---|---|
| Guard | Auth |
| Body | `{ "sessionId?": string \| null }` |
| Success | `200` — `{ "sessionId", "name", "avatarPath", "onlineUsers": [...] }` |
| Purpose | Assign or refresh anonymous presence; returns online user list |

---

## Response types (summary)

### Task

```typescript
{
  projectId: number;
  taskId: number;
  title: string;
  priority: "קריטי" | "גבוה" | "בינוני" | "נמוך";
  details: string;
  status: "ממתין להתחלה" | "בטיפול" | "הושלם";
  notes: string;
  parentTaskId: number | null;
  sortOrder: number;
  customFields: Record<string, string>;
}
```

### Project

```typescript
{ projectId: number; name: string; sortOrder: number; }
```

### BoardNote

```typescript
{
  noteId: number;
  projectId: number;
  content: string;
  color: "yellow" | "green" | "blue" | "pink" | "purple";
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}
```

### CustomColumn

```typescript
{
  columnId: number;
  projectId: number;
  name: string;
  type: "text" | "number" | "date" | "link";
  sortOrder: number;
}
```

---

## Client helpers

Browser-side wrappers live in `src/lib/api-client.ts`. Each function mirrors the routes above: sets credentials, parses JSON, throws on non-OK responses.

Key exports: `login`, `logout`, `fetchTasks`, `createTask`, `updateTask`, `deleteTask`, `fetchProjects`, `fetchBoardNotes`, `createBoardNote`, `updateBoardNote`, `deleteBoardNote`, `syncPresence`, and user/column/import helpers.

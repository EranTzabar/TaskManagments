# Running and Usage

How to install, configure, start, and verify the application. For what the app does and how it is built, see the other guides in this folder.

**Related documentation**

- [App structure](APP_STRUCTURE.md)
- [UI guide](UI.md)
- [Architecture](ARCHITECTURE.md)
- [API reference](API.md)

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18+ |
| npm | 9+ (bundled with Node) |
| MongoDB | 6+ (local install or Atlas cluster) |

---

## Environment setup

1. Copy the example env file:

```bash
cp .env.example .env.local
```

2. Edit `.env.local`:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string, e.g. `mongodb://127.0.0.1:27017/tasks-tracker` |
| `JWT_SECRET` | Secret for signing JWTs — **at least 32 characters** |

The app reads `.env.local` at runtime. Scripts in `scripts/` also load it via `dotenv`.

---

## Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
npm start
```

---

## First-time bootstrap

No users exist until one is created manually.

### Create an admin user

```bash
npm run create-user -- --username admin --password yourpassword --type admin
```

### Create a viewer user

```bash
npm run create-user -- --username viewer --password yourpassword --type user
```

Then log in at `/` with the credentials.

### Optional maintenance scripts

| Command | Purpose |
|---------|---------|
| `npm run clear-tasks` | Remove all tasks from the database |
| `npm run clear-sessions` | Remove stale presence sessions |
| `npm run seed` | **Broken** — references missing `scripts/seed.ts` |

---

## Day-to-day usage

### Login

1. Open `/`
2. Enter username and password
3. On success, the task board loads for the first accessible project

### Switch boards

Click a project tab in the header. The URL updates to `/?project={id}` and the selection is remembered in a cookie.

### Admin workflow

| Task | How |
|------|-----|
| Add task | Click `הוסף משימה` at the bottom of the table, or press **A** |
| Edit title/details | Click the pencil icon on the row |
| Change priority/status | Use inline dropdowns |
| Add subtask | Expand parent row, click add subtask |
| Reorder tasks | Drag the handle on the left (filters must be cleared) |
| Import tasks | ⋮ menu → `ייבוא מקובץ` or `ייבוא JSON` |
| Export tasks | ⋮ menu → `ייצוא JSON` |
| Add custom column | `+ הוסף עמודה` in the table header |
| Manage sticky notes | Click notes icon → `/notes?project={id}` |
| Manage users | Header link → `/users` |

### Viewer workflow

- Browse tasks, filter, search, expand subtasks
- Read sticky notes at `/notes`
- Cannot create, edit, delete, import, or reorder

### Sticky notes page

- **Admin:** Create with `+ פתק חדש`, drag by header, resize from bottom-right corner, edit text by clicking the body, change color from swatches, delete with X
- **Viewer:** Read-only stacked cards on mobile; read-only canvas on desktop

### Theme

Toggle dark/light mode in the header. Preference persists in browser `localStorage`.

---

## Verification

### Automated checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

All three should complete without errors before deploying.

### Manual smoke test

| Step | Expected result |
|------|-----------------|
| Login as admin | Board loads |
| Create a task | Appears in table |
| Add a subtask | Parent status updates |
| Drag-reorder (no filters) | Order persists after refresh |
| Export JSON | File downloads |
| Import JSON | Tasks append |
| Open `/notes` | Notes page loads; create and drag a note |
| Login as viewer | Read-only UI; no edit controls |
| Restrict viewer to one board | Only that tab visible |
| Toggle dark mode | Theme persists on reload |
| Logout | Returns to login screen |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `JWT_SECRET must be at least 32 characters` | Short secret in `.env.local` | Use a longer random string |
| `MONGODB_URI is not defined` | Missing env file | Create `.env.local` from `.env.example` |
| Login returns 401 | Wrong credentials or no user | Run `create-user` script |
| Empty board after login | No projects yet | Admin: create a board from the `+` tab |
| Viewer sees no boards | `allowedProjectIds` is `[]` | Admin: edit user permissions on `/users` |
| `npm run seed` fails | Script file missing | Use `create-user` instead; add seed script if needed |
| Notes badge shows 0 | No notes on board | Expected; badge updates after creating notes |

---

## Import format

Task import expects JSON documented in `public/docs/import-tasks.md`. Import always **appends**; it never replaces existing tasks.

---

## Deployment notes

- Set `JWT_SECRET` and `MONGODB_URI` in the hosting environment
- Use a production MongoDB URI (Atlas or managed instance)
- The auth cookie uses `secure: true` when `NODE_ENV === "production"`
- Run `npm run build` as part of the deploy pipeline

# App Structure

Hebrew RTL task-management application (**לוח מעקב משימות**). Users work on **boards** (projects) containing tasks, optional subtasks, custom columns, and shared sticky notes.

**Related documentation**

- [UI guide](UI.md)
- [Architecture](ARCHITECTURE.md)
- [API reference](API.md)
- [Running and usage](RUNNING.md)

---

## Pages

| Route | Purpose | Access |
|-------|---------|--------|
| `/` | Login screen, or main task board when authenticated | All users |
| `/notes?project={id}` | Sticky notes canvas for a board | Users with board access |
| `/users` | User administration | Admins only |

The home page resolves the active board from the `?project=` query parameter or the `activeProjectId` cookie. Unauthenticated users see the login form only.

---

## User roles

| Role | UI label | Description |
|------|----------|-------------|
| `admin` | מנהל | Full create/edit/delete on tasks, boards, columns, notes, and users |
| `user` | צופה | Read-only task board and notes; can filter, search, and collapse rows |

Board visibility for viewers is controlled by `allowedProjectIds` on the user account (see [Architecture](ARCHITECTURE.md)).

---

## Main UI layout

### Header

- App title area
- Link to user management (`ניהול משתמשים`) — admins only
- Dark/light theme toggle
- Online users strip (anonymous display names and avatars)
- Logout

### Project tabs (`ProjectListBar`)

- One tab per accessible board
- Admin: create (`+`), rename (pencil), delete (X), export before delete
- Selecting a tab updates the URL (`?project=`) and the `activeProjectId` cookie

### Task board toolbar

- **Notes icon** — link to `/notes?project={id}` with badge showing note count
- **Bulk bar** — select all checkbox, import/export menu (⋮, admin only), close-all and delete actions when rows are selected

### Filters (`FiltersBar`)

- Search: title, details, or task ID
- Priority filter dropdown
- Status filter buttons
- Reset filters link
- Result count display

### Metrics dashboard

- Progress bar for completed top-level tasks
- Open-task counts by priority (critical, high, medium)

### Task views

| View | Breakpoint | Component |
|------|------------|-----------|
| Table | `md` and up | `TaskTable` |
| Cards | below `md` | `TaskCards` |

Both views share the same data and filters.

---

## Task features

### Core fields

| Field | Hebrew label | Notes |
|-------|--------------|-------|
| Title | משימה | Max 70 characters; admin edits via modal |
| Priority | עדיפות | Inline select |
| Status | סטטוס | Inline select; derived from subtasks when subtasks exist |
| Details | פירוט | Truncated in table; admin edits via modal |
| Notes | (expand row) | Per-task personal notes; debounced auto-save (500 ms) |
| Sort order | — | Drag-reorder within sibling group (admin, when filters cleared) |

### Status values

`ממתין להתחלה`, `בטיפול`, `הושלם`

### Priority values

`קריטי`, `גבוה`, `בינוני`, `נמוך`

### Subtasks

- One nesting level only (subtasks cannot have subtasks)
- Added via modal or inline button
- Parent status rolls up from subtask statuses automatically
- Expand/collapse per parent row
- Bulk select parents for close-all or delete (admin)

### Adding tasks

- **Desktop:** Inline row at the bottom of the table (`הוסף משימה`)
- **Mobile:** Bottom bar equivalent
- Keyboard shortcut **`A`** opens the add row (when not focused in an input)
- Empty board: admin sees hint to add or import; viewer sees empty state

### Celebration modal

When all top-level tasks reach `הושלם`, a one-time trophy modal appears per session.

---

## Custom columns

Per-board optional columns appended to the task table.

| Type | UI label | Cell behavior |
|------|----------|---------------|
| `text` | טקסט | Plain text input |
| `number` | מספר | Number input |
| `date` | תאריך | Calendar picker; displayed in Hebrew locale |
| `link` | קישור | URL input; rendered as clickable link |

- Admin adds columns via `+ הוסף עמודה` modal
- Admin deletes via header X; values removed from all tasks
- Admin drag-reorders column headers when two or more columns exist
- Values stored on each task in `customFields` keyed by column ID
- Viewers see read-only cells

---

## Board notes (sticky notes)

Separate from per-task **notes** in the table. Shared sticky notes on `/notes`.

| Capability | Admin | Viewer |
|------------|-------|--------|
| View notes | Yes | Yes |
| Create | Yes (`+ פתק חדש`) | No |
| Edit text | Yes (click body) | No |
| Drag by header | Yes (desktop) | No |
| Resize | Yes (corner handle, desktop) | No |
| Change color | Yes (swatches in header) | No |
| Delete | Yes | No |

- Plain text; URLs auto-linked in view mode
- Five colors: yellow, green, blue, pink, purple
- Desktop: free-position canvas with grid background
- Mobile: stacked cards; no drag or resize
- Content max 2000 characters

---

## User management (`/users`)

| Action | Description |
|--------|-------------|
| List users | Username, role badge, board access summary, dates |
| Create | Username, password, role, board checkboxes |
| Edit | Role, optional new password, board permissions |
| Delete | Not allowed for the currently logged-in user |

Board permission UI (`UserBoardPermissions`):

- Admins: all boards; checkboxes disabled
- Viewers: per-board checkboxes, select all, clear all

---

## Import and export

Admin-only, accessed from the ⋮ menu in the bulk bar.

| Action | Label | Behavior |
|--------|-------|----------|
| Export | ייצוא JSON | Downloads current board tasks as JSON file |
| Import file | ייבוא מקובץ | File picker |
| Import paste | ייבוא JSON | Modal with file pick or JSON paste |

Import **appends** tasks; it does not replace existing data. Format is documented in [Architecture](ARCHITECTURE.md#importexport-format) and `public/docs/import-tasks.md`.

---

## Theming and feedback

- **Dark mode:** Toggle in header; persisted in `localStorage` key `theme`
- **Toasts:** Success, error, and info messages; auto-dismiss after 3 seconds
- **Modals:** Task add/edit, project create/rename/delete, user CRUD, import JSON, delete confirmations

---

## Domain limits

| Item | Limit |
|------|-------|
| Task title | 70 characters |
| Board name | 50 characters |
| Username | 2–32 characters |
| Password | Minimum 6 characters |
| Custom column name | 50 characters |
| Sticky note content | 2000 characters |
| Sticky note width | 160–520 px (default 240) |
| Sticky note height | 100–520 px (default 120) |

---

## Entity overview

| Entity | Purpose |
|--------|---------|
| User | Login account with role and board permissions |
| Project | A task board |
| Task | Work item; may have one level of subtasks |
| CustomColumn | Optional typed column definition per board |
| BoardNote | Shared sticky note on the notes page |
| VisitorSession | Anonymous online-presence session |
| PresenceResource | Assignable display name or avatar for presence |

Full schemas are in [Architecture](ARCHITECTURE.md#data-model).

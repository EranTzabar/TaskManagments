# Task Management

Hebrew RTL task board: projects, tasks and subtasks, sticky notes, and user permissions.

Built with Next.js 14, React 18, TypeScript, Tailwind CSS, and MongoDB (Mongoose 9).

![Tasks Tracker board](docs/board.png)

## Features

- **Boards (projects)** — Switch between boards with tabs. Admins can create, rename, and delete boards.
- **Tasks and subtasks** — Title, priority (critical / high / medium / low), status (waiting / in progress / done), optional פירוט, and personal notes. Subtasks nest under a parent task.
- **Table and cards** — Desktop uses a resizable table; phones use a card list. Same filters and data in both views.
- **Search and filters** — Search by title, פירוט, or task ID. Filter by priority and status.
- **Progress** — Dashboard cards show open tasks by priority and overall completion.
- **Custom columns** — Admins can add extra fields per board (text, number, date, or link).
- **Import / export** — Admins can import and export tasks as JSON, including bulk select and delete.
- **Sticky notes** — Shared canvas per board (`/notes`), with colors, drag, and resize.
- **Users and roles** — Admins (`מנהל`) have full edit access. Viewers (`צופה`) can open allowed boards, search, and filter, but cannot change tasks. User management is at `/users`.
- **Hebrew RTL** — UI is Hebrew, right-to-left, with light and dark theme.
- **Presence** — Header shows who is currently online.

## Requirements

| Requirement | Version / notes |
|-------------|-----------------|
| Node.js | 18.17 or later (20+ recommended) |
| npm | 9+ (comes with Node) |
| MongoDB | **6.0 or later** — local server or [MongoDB Atlas](https://www.mongodb.com/atlas) |
| OS | Windows, macOS, or Linux |

### MongoDB

The app does not run without a reachable MongoDB instance.

- **Version:** MongoDB Server **6.0+** (matches Mongoose 9).
- **How to provide it:** install [MongoDB Community](https://www.mongodb.com/try/download/community) locally, or use a free Atlas cluster.
- **Connection string:** set `MONGODB_URI` in `.env.local`. The database name is the last path segment of the URI.
  - Local example: `mongodb://127.0.0.1:27017/tasks-tracker`
  - Atlas example: `mongodb+srv://USER:PASSWORD@cluster.mongodb.net/tasks-tracker`
- **Must be running** before `npm run dev` or any `scripts/` command. If MongoDB is down, the app throws `Please define the MONGODB_URI environment variable` (missing env) or a connection error (server unreachable).
- **Collections** are created automatically by Mongoose on first write. No manual schema migration is required. Models include tasks, projects, users, sessions, board notes, custom columns, and presence.
- **Auth:** no MongoDB username is required for a default local install. Atlas (and secured local servers) need credentials in the URI.
- **Replica set:** not required for local development. Atlas clusters already provide one.

Copy `.env.example` to `.env.local` and fill in:

```
MONGODB_URI=mongodb://127.0.0.1:27017/tasks-tracker
JWT_SECRET=your_jwt_secret_at_least_32_characters_long
```

`JWT_SECRET` must be at least 32 characters.

## Getting started

```bash
npm install
npm run create-user -- --username admin --password yourpassword --type admin
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the user you created.

```bash
npm run build
npm start
```

More install, script, and troubleshooting detail: [guid/RUNNING.md](guid/RUNNING.md).

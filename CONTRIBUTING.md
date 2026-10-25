# Contributing

Thanks for helping with Task Management, the Hebrew RTL task board.

## Where to start

- Questions and ideas go in [Discussions](https://github.com/EranTzabar/TaskManagments/discussions).
- Bugs go in [Issues](https://github.com/EranTzabar/TaskManagments/issues/new/choose).
- Security problems go through [SECURITY.md](SECURITY.md). Do not open a public issue for them.
- A larger code change should be discussed in Discussions or an issue before you start.

## Code of Conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## Set up a development copy

You need Node.js 18.17 or later, npm 9 or later, and MongoDB 6.0 or later (local or Atlas).

```bash
git clone https://github.com/EranTzabar/TaskManagments.git
cd TaskManagments
npm install
```

Copy `.env.example` to `.env.local` and set `MONGODB_URI` and a `JWT_SECRET` of at least 32 characters. MongoDB must be running before the app or the scripts start. Create the first admin, then start the app:

```bash
npm run create-user -- --username admin --password yourpassword --type admin
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Install, scripts, and troubleshooting are in [guid/RUNNING.md](guid/RUNNING.md). Do not commit `.env.local`.

## Project layout

| Path | What it holds |
|---|---|
| `src/app` | Pages (`/`, `/notes`, `/users`) and API routes under `src/app/api` |
| `src/components` | React UI for the board, users, notes, columns, and layout |
| `src/lib` | MongoDB models, auth, and task, project, and user logic |
| `src/hooks` | Client hooks for presence and table columns |
| `scripts` | `create-user`, `clear-tasks`, and `clear-sessions` |
| `guid` | How the app is built, the API, and how to run it |
| `docs` | Board screenshot and the import format |
| `public` | Static files, including a second copy of the import format |

There is no database migration step. Mongoose creates collections on first write.

## Making a change

Branch from `main`. Match the style of the files around your change. The UI is Hebrew and right-to-left.

- There is no schema migration folder. Model changes apply when the app next connects to MongoDB.
- If you change the import JSON format, update both [docs/import-tasks.md](docs/import-tasks.md) and [public/docs/import-tasks.md](public/docs/import-tasks.md). They are the same document.
- If behavior a contributor needs changes, update [guid/RUNNING.md](guid/RUNNING.md) or the matching file in `guid/`.
- `npm run seed` is broken. It points at a missing `scripts/seed.ts`. Use `npm run create-user` instead.

There is no automated test suite. Before you open a pull request, run:

```bash
npm run lint
npx tsc --noEmit
```

## Pull requests

Keep a pull request to one topic and small enough to review. Explain why the change is needed, and link the issue (`Fixes #123`) when there is one. Say how you checked it. For a UI change, add a screenshot of the Hebrew board (desktop, and mobile if the layout changed).

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).

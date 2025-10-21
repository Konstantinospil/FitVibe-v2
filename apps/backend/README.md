# FitVibe Backend

The FitVibe backend is an Express API with PostgreSQL persistence managed through Knex. It provides authentication, workout planning, progress tracking, and feed endpoints that power the web client and external integrations.

## Prerequisites

- Node.js 20+
- PNPM 9
- PostgreSQL 14+ (local or containerised)

## Environment

Copy the sample env file and tweak values to match your local setup:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Key variables:

| Variable                | Purpose                                        |
| ----------------------- | ---------------------------------------------- |
| `DATABASE_URL` or `PG*` | Connection string or discrete connection parts |
| `JWT_PRIVATE_KEY_PATH`  | RSA private key for signing tokens             |
| `JWT_PUBLIC_KEY_PATH`   | RSA public key for verification                |
| `CSRF_ENABLED`          | Toggle CSRF protection (defaults to false)     |

## Scripts

```bash
pnpm --filter @fitvibe/backend dev         # start express with TSX watch
pnpm --filter @fitvibe/backend build       # compile to dist/
pnpm --filter @fitvibe/backend start       # run compiled server
pnpm --filter @fitvibe/backend lint        # eslint over src
pnpm --filter @fitvibe/backend typecheck   # strict tsc pass
pnpm --filter @fitvibe/backend test        # jest suite
```

Database tasks live under `src/db/scripts` and can be executed with `pnpm ts-node` or by wiring them into npm scripts:

```bash
pnpm ts-node apps/backend/src/db/scripts/migrate.ts
```

## Project Structure

```
src/
  api/             # Route adapters that surface module routers
  config/          # Environment loading and logger plumbing
  db/              # Knex config, migrations, seeds, SQL helpers
  middlewares/     # Express middleware (auth guard, error handler, etc.)
  modules/         # Feature-vertical logic (auth, users, sessions, ...)
  observability/   # Metrics and tracing bootstrap
  services/        # External integrations (mailer, cache, crypto)
  utils/           # Shared helpers (HTTP errors, pagination)
  server.ts        # Entry point that listens on configured port
```

See `apps/docs/project-structure.md` for the canonical layout and `apps/docs/adr/` for the decision log that shaped the architecture.

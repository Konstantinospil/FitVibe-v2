# Apps Workspace

The `apps` workspace hosts the runnable surfaces of FitVibe V2. Each application is an independent PNPM workspace but they share tooling, lint rules, and TypeScript config through the `packages` directory.

## Contents

| Directory   | Description                                           |
| ----------- | ----------------------------------------------------- |
| `backend/`  | FitVibe REST API (Express + Knex + PostgreSQL)        |
| `frontend/` | React single-page application built with Vite         |
| `docs/`     | Authoritative product, design, and governance content |

Refer to the individual READMEs inside each app for setup and workflow details. Turbo tasks are configured so that running `pnpm dev` at the root will start both the backend and frontend in watch mode.

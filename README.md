# FitVibe V2

FitVibe is the training companion that helps athletes plan sessions, log workouts, and track long-term progress. This repository contains the second-generation implementation packaged as a PNPM-managed monorepo.

## Repository Layout

| Path            | Purpose                                                 |
| --------------- | ------------------------------------------------------- |
| `apps/backend`  | Node.js API (Express, Knex, PostgreSQL)                 |
| `apps/frontend` | React + Vite single-page app                            |
| `apps/docs`     | Product, design, and governance documentation           |
| `packages/*`    | Shared code: lint rules, design system, utilities, etc. |
| `infra`         | Docker, NGINX, observability, and security collateral   |
| `tests`         | Automated test suites and performance scripts           |

The authoritative tree is documented in `apps/docs/project-structure.md`.

## Prerequisites

- Node.js 20+
- PNPM 9 (install via `corepack enable pnpm`)
- Docker (optional but required for local Postgres/NGINX stacks)

## Getting Started

```bash
pnpm install            # bootstrap all workspaces
pnpm dev                # start backend + frontend via Turbo
```

Visit the dedicated READMEs under `apps/*`, `packages/*`, `infra/`, and `tests/` for workflow specifics.

## Everyday Commands

```bash
pnpm lint               # lint every workspace
pnpm lint:check         # lint and fail on warnings
pnpm typecheck          # TypeScript across the repo
pnpm test               # unit/integration tests
pnpm build              # production builds via Turbo
```

## Reference

- Architecture decisions live in `apps/docs/adr/`.
- CI/CD definitions and automation sit under `.github/workflows/`.
- Environment variable templates are provided in `.env.example` files throughout the repo.

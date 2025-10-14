```
[ ] FitVibe V2/
[ ] ├── .github/
[ ] │   ├── templates/                         # PR/Issue templates
[ ] │   └── workflows/
[ ] │       ├── ci.yml                         # Lint, typecheck, unit tests, build
[ ] │       ├── cd-prod.yml                    # Docker build & deploy (compose prod)
[ ] │       └── security-scan.yml              # CodeQL, Trivy, etc.
[ ] ├── .husky/
[ ] │   └── _/                                 # Husky helper scripts
[ ] ├── .vscode/
[ ] │   ├── tasks.json
[ ] │   └── extensions.json
[ ] ├── apps/
[ ] │   ├── backend/
[ ] │   │   ├── package.json
[ ] │   │   ├── tsconfig.json
[ ] │   │   └── src/
[ ] │   │       ├── api/                       # Route registration (feature-first)
[ ] │   │       │   ├── auth.routes.ts
[ ] │   │       │   ├── users.routes.ts
[ ] │   │       │   ├── exercises.routes.ts
[ ] │   │       │   ├── sessions.routes.ts
[ ] │   │       │   ├── progress.routes.ts
[ ] │   │       │   ├── points.routes.ts
[ ] │   │       │   └── feed.routes.ts
[ ] │   │       ├── config/                    # env, logger, app cfg
[ ] │   │       │   ├── env.ts
[ ] │   │       │   ├── logger.ts
[ ] │   │       │   └── index.ts
[ ] │   │       ├── db/
[ ] │   │       │   ├── knexfile.ts
[ ] │   │       │   ├── migrations/
[ ] │   │       │   │   ├── 20251012T2100_init_schema.ts
[ ] │   │       │   │   ├── 20251012T2130_add_points_partitioning.ts
[ ] │   │       │   │   └── (…more…).ts
[ ] │   │       │   ├── seeds/
[ ] │   │       │   │   ├── dev/
[ ] │   │       │   │   │   ├── 001_users.seed.ts
[ ] │   │       │   │   │   ├── 002_exercises.seed.ts
[ ] │   │       │   │   │   └── 003_sessions.seed.ts
[ ] │   │       │   │   └── prod/
[ ] │   │       │   │       └── 001_reference.seed.ts
[ ] │   │       │   ├── functions/             # SQL funcs
[ ] │   │       │   │   ├── ensure_partitions.sql
[ ] │   │       │   │   └── refresh_session_summary.sql
[ ] │   │       │   ├── views/                 # SQL views / materialized views
[ ] │   │       │   │   ├── v_session_summary.sql
[ ] │   │       │   │   └── mv_session_summary.sql
[ ] │   │       │   ├── triggers/
[ ] │   │       │   │   └── t_audit_sessions.sql
[ ] │   │       │   ├── types/                 # enums/domains
[ ] │   │       │   │   └── exercise_difficulty_enum.sql
[ ] │   │       │   ├── fixtures/              # reference data
[ ] │   │       │   │   ├── countries.json
[ ] │   │       │   │   └── exercise_types.json
[ ] │   │       │   ├── schema/                # auto-generated DDL snapshot (read-only)
[ ] │   │       │   │   └── fitvibe_schema.sql
[ ] │   │       │   ├── utils/                 # db helpers (e.g., knex helpers)
[ ] │   │       │   │   └── index.ts
[ ] │   │       │   └── scripts/
[ ] │   │       │       ├── migrate.ts
[ ] │   │       │       ├── rollback.ts
[ ] │   │       │       ├── refresh-materialized.ts
[ ] │   │       │       └── rotate-partitions.ts
[ ] │   │       ├── jobs/
[ ] │   │       │   └── services/
[ ] │   │       │       └── queue.service.ts
[ ] │   │       ├── middlewares/
[ ] │   │       │   ├── auth.guard.ts
[ ] │   │       │   ├── error.handler.ts
[ ] │   │       │   └── rate-limit.ts
[ ] │   │       ├── modules/                   # Feature verticals
[ ] │   │       │   ├── auth/
[ ] │   │       │   ├── common/
[ ] │   │       │   ├── exercise-types/
[ ] │   │       │   ├── exercises/
[ ] │   │       │   ├── feed/
[ ] │   │       │   ├── health/
[ ] │   │       │   ├── plans/
[ ] │   │       │   ├── points/
[ ] │   │       │   ├── progress/
[ ] │   │       │   ├── sessions/
[ ] │   │       │   ├── system/
[ ] │   │       │   └── users/
[ ] │   │       ├── observability/             # OTel setup, request logging, metrics
[ ] │   │       │   ├── tracing.ts
[ ] │   │       │   └── metrics.ts
[ ] │   │       ├── services/                  # mail, cache, crypto, storage adapters
[ ] │   │       │   ├── cache.service.ts
[ ] │   │       │   ├── crypto.service.ts
[ ] │   │       │   └── mailer.service.ts
[ ] │   │       ├── types/
[ ] │   │       │   └── index.ts
[ ] │   │       ├── utils/
[ ] │   │       │   ├── http.ts
[ ] │   │       │   ├── pagination.ts
[ ] │   │       │   └── validation.ts
[ ] │   │       ├── app.ts
[ ] │   │       └── server.ts
[ ] │   ├── frontend/
[ ] │   │   ├── package.json
[ ] │   │   ├── tsconfig.json
[ ] │   │   ├── public/
[ ] │   │   └── src/
[ ] │   │       ├── assets/
[ ] │   │       ├── components/
[ ] │   │       ├── contexts/
[ ] │   │       ├── hooks/
[ ] │   │       ├── i18n/
[ ] │   │       ├── pages/
[ ] │   │       ├── routes/
[ ] │   │       ├── services/
[ ] │   │       ├── store/
[ ] │   │       └── utils/
[ ] │   └── docs/                              # Single source of truth (workspace)
[ ] │       ├── 1. Product Requirements Document.md
[ ] │       ├── 2. Technical Design Document.md
[ ] │       ├── 3. Testing and Quality Assurance Plan.md
[ ] │       ├── SECURITY.md
[ ] │       ├── adr/
[ ] │       │   └── 0001-record-architecture-decisions.md
[ ] │       └── diagrams/
[ ] │           ├── architecture.mmd
[ ] │           ├── erd.mmd
[ ] │           └── ci-cd.mmd
[ ] ├── packages/
[ ] │   ├── eslint-config/
[ ] │   │   └── index.js
[ ] │   ├── tsconfig/
[ ] │   │   └── tsconfig.base.json
[ ] │   ├── i18n/
[ ] │   │   └── src/
[ ] │   ├── types/
[ ] │   │   └── src/
[ ] │   ├── ui/
[ ] │   │   └── src/
[ ] │   └── utils/
[ ] │       └── src/
[ ] ├── infra/
[ ] │   ├── docker/
[ ] │   │   ├── dev/
[ ] │   │   │   └── compose.dev.yml
[ ] │   │   └── prod/
[ ] │   │       ├── compose.prod.yml
[ ] │   │       └── Dockerfile.backend
[ ] │   ├── nginx/
[ ] │   │   ├── nginx.conf
[ ] │   │   └── sites-enabled/
[ ] │   │       └── fitvibe.conf
[ ] │   ├── observability/
[ ] │   │   ├── prometheus.yml
[ ] │   │   └── grafana/
[ ] │   │       └── dashboards/
[ ] │   │           ├── backend-api.json
[ ] │   │           └── postgres.json
[ ] │   ├── scripts/
[ ] │   │   ├── migrate.sh
[ ] │   │   ├── rollback.sh
[ ] │   │   └── seed-dev.sh
[ ] │   └── security/
[ ] │       └── policies/
[ ] │           ├── password-policy.md
[ ] │           └── key-rotation-policy.md
[ ] ├── tests/
[ ] │   ├── backend/
[ ] │   │   ├── api/
[ ] │   │   └── integration/
[ ] │   ├── frontend/
[ ] │   │   ├── components/
[ ] │   │   └── e2e/
[ ] │   ├── perf/
[ ] │   │   └── k6-smoke.js
[ ] │   ├── reports/                            # JUnit/coverage/Lighthouse/k6 outputs
[ ] │   └── setup/
[ ] │       ├── jest.setup.ts
[ ] │       └── test-helpers.ts
[ ] ├── .dockerignore
[ ] ├── .editorconfig
[ ] ├── .eslintrc.js
[ ] ├── .prettierrc
[ ] ├── .env.example
[ ] ├── CODEOWNERS
[ ] ├── CONTRIBUTING.md
[ ] ├── SECURITY.md
[ ] ├── LICENSE
[ ] ├── jest.config.ts
[ ] ├── pnpm-workspace.yaml
[ ] ├── turbo.json                              # Turbo v2 “tasks” config
[ ] ├── tsconfig.base.json
[x] └── package.json
```

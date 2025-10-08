# 🧭 FitVibe – Complete Task Tracker (Updated)

> Status: [x] Done • [ ] Open • ⏳ In progress

## 1) Project Foundation & Governance
- [x] P-1 Monorepo root + folders (`apps/`, `packages/`, `infra/`, `tests/`)
- [x] P-2 pnpm workspaces + (optional) Turborepo
- [x] P-3 CONTRIBUTING.md (branching, PR rules, semver)
- [x] P-4 SECURITY.md (key rotation, GDPR procedures)
- [x] P-5 ADR framework (`apps/docs/adr/` + template)
- [x] P-6 Glossary + docs index under `apps/docs/`

## 2) CI/CD & Dev Tooling
- [x] I-1 CI/CD stages defined in PRD (lint→type→test→build→Docker→GHCR; health gate & rollback)
- [x] I-2 Implement `.github/workflows/ci.yml` (incl. Codecov)
- [x] I-3 Implement `.github/workflows/cd.yml` (manual approval, healthcheck, rollback)
- [x] I-4 Lighthouse CI (fail if < 90)
- [x] I-5 Security scans (npm-audit/Snyk) + CycloneDX SBOM
- [x] I-6 Ephemeral Postgres + seeds for CI
- [x] I-7 `.vscode/tasks.json` extended commands
- [x] I-8 Rollback scripts (`infra/scripts/rollback.sh`)

## 3) Backend – Cross-Cutting
- [x] B-CC-1 App bootstrap + router mounts
- [x] B-CC-2 Error handler + error envelope
- [x] B-CC-3 Logger (pino/morgan) with PII redaction
- [x] B-CC-4 Helmet, CORS, rate-limit
- [x] B-CC-5 CSRF protection for state-changing routes
- [x] B-CC-6 `/health` endpoint
- [ ] B-CC-7 `/metrics` (Prometheus) + histograms
- [ ] B-CC-8 Audit logger (GDPR-safe) wired to key flows

## 4) Backend – Domain Modules
### 4.1 Auth & Security (FR-1)
- [x] B-A-1 Login (access/refresh; rotation)
- [ ] B-A-2 Registration + email verification (token TTL ≤ 15 min)
- [ ] B-A-3 Logout & refresh revocation by `jti`
- [ ] B-A-4 Lockout after 10 failed logins + CAPTCHA fallback
- [ ] B-A-5 Password reset (≤ 15 min TTL; session invalidation)
- [ ] B-A-6 JWKS exposure at `/.well-known/jwks.json`
- [ ] B-A-7 GDPR export & delete endpoints (DSR ≤ 30 days)

### 4.2 Users & Profiles (FR-2)
- [x] B-U-1 `GET/PUT /users/me`
- [x] B-U-2 Snapshot updates in `user_state_history`
- [ ] B-U-3 Alias uniqueness (case-insensitive)
- [ ] B-U-4 Avatar upload constraints (JPEG/PNG/WebP ≤ 5 MB)
- [ ] B-U-5 Preferred language persisted & applied

### 4.3 Exercises (FR-3)
- [x] B-E-1 CRUD (private/public) + soft-delete
- [x] B-E-2 Fix pluralization imports (bugfix)
- [ ] B-E-3 i18n columns for exercise categories/lookups
- [ ] B-E-4 Discovery respects visibility

### 4.4 Sessions (FR-4)
- [x] B-S-1 Plan / log / complete
- [x] B-S-2 Clone own/public (keep attribution)
- [ ] B-S-3 Recurrence rules
- [ ] B-S-4 Time-zone/DST safety
- [ ] B-S-5 Archive canceled sessions

### 4.5 Progress & Analytics (FR-5)
- [x] B-P-1 Aggregation/charts service skeleton
- [ ] B-P-2 CSV/JSON export endpoints
- [ ] B-P-3 Personal bests & streaks

### 4.6 Points (FR-6)
- [⏳] B-PT-1 Points algorithm (non-negative bounded)
- [ ] B-PT-2 Award on `session.complete()`; history API
- [ ] B-PT-3 Anti-gaming logs & thresholds

### 4.7 Feed & Community (FR-7)
- [x] B-F-1 Public feed (pagination/search)
- [x] B-F-2 Clone from feed (attribution)
- [ ] B-F-3 Default privacy enforced server-side
- [ ] B-F-4 Moderation placeholders (admin)

### 4.8 Internationalization (FR-8)
- [⏳] B-I-1 `detectLanguage` middleware
- [ ] B-I-2 `translation.service` + provider adapter (OpenAI/DeepL)
- [ ] B-I-3 `translation_cache` table + TTL
- [ ] B-I-4 PII redaction before translation API calls
- [ ] B-I-5 Integrate translations in `/feed` & `/sessions`

## 5) Database & Migrations
- [x] D-1 Core tables (users, sessions, exercises, points, media, …)
- [x] D-2 Lookup normalization + seeds
- [x] D-3 Soft-delete (`archived_at`)
- [ ] D-4 Indices & FKs complete
- [ ] D-5 Views for progress aggregates
- [ ] D-6 Retention & purge scripts (GDPR)
- [x] D-7 Migration up/down tests scaffold

## 6) Frontend (React SPA)
- [⏳] F-1 Vite + React scaffold
- [ ] F-2 Routing (Login, Dashboard, Planner, Logger, Progress, Feed, Profile)
- [ ] F-3 State (Zustand/Redux + React Query)
- [ ] F-4 Axios client + 401→refresh
- [ ] F-5 UI kit (Buttons, Cards, Avatar, Chart)
- [x] F-6 Typography system & brand tokens applied
- [ ] F-7 i18next (EN/DE) dictionaries + switch
- [ ] F-8 Accessibility (ARIA/keyboard/contrast)
- [ ] F-9 Lighthouse ≥ 90 (LCP < 2.5 s)

## 7) Testing & QA Automation
- [x] Q-1 QA Plan v2.0 baseline established
- [x] Q-2 Unit/integration scaffolding (Jest + Supertest)
- [ ] Q-3 Contract tests (zod ⇄ OpenAPI)
- [ ] Q-4 E2E Playwright (register → login → plan → complete)
- [ ] Q-5 Accessibility tests (axe + Lighthouse CI)
- [ ] Q-6 Performance tests (k6; p95 < 300 ms)
- [ ] Q-7 Security scans (ZAP, Snyk, secret scans)
- [ ] Q-8 Coverage gate ≥ 80 % (Codecov)
- [ ] Q-9 QA summary HTML + Grafana trend

## 8) Observability, Security & Ops (NFR)
- [x] O-1 Structured logs (correlation IDs; PII redaction)
- [ ] O-2 Prometheus metrics + Grafana dashboards
- [ ] O-3 Loki log pipeline
- [ ] O-4 Alert rules (p95 > 600 ms, 5xx > 1 %)
- [ ] O-5 Backup & restore scripts + quarterly DR test
- [ ] O-6 JWT key rotation runbook + monitoring
- [ ] O-7 SLO dashboard (≥ 99.5 %)

## 9) Documentation & Governance
- [x] D-OC-1 PRD v1.0 complete
- [x] D-OC-2 TDD v1.2 (backend MVP) complete
- [x] D-OC-3 QA Plan v2.0 complete
- [ ] D-OC-4 ADRs for major decisions created
- [ ] D-OC-5 API reference auto-generation (OpenAPI)
- [ ] D-OC-6 ERD export (Mermaid) from current schema

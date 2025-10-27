# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

FitVibe V2 is a PNPM-managed monorepo for a fitness training companion that helps athletes plan sessions, log workouts, and track long-term progress. The stack includes a Node.js/Express backend with PostgreSQL, and a React + Vite frontend.

**Key Principles:**
- **Privacy-by-design**: All user content is private-by-default; explicit consent required for sharing
- **GDPR compliance**: Data Subject Rights (DSR) endpoints for export/delete; 24-month inactivity auto-purge
- **Security-first**: RS256 JWT with refresh rotation, CSRF protection, CSP/HSTS headers, rate limiting
- **Observability**: Structured logging (Pino), Prometheus metrics, correlation IDs; no PII in logs

## Development Commands

### Starting Development
```bash
pnpm install              # bootstrap all workspaces
pnpm dev                  # start backend + frontend via Turbo in parallel
```

### Running Specific Apps
```bash
pnpm --filter @fitvibe/backend dev      # run backend only (Express + TSX watch)
pnpm --filter @fitvibe/frontend dev     # run frontend only (Vite dev server)
```

### Testing & Quality
```bash
pnpm test                                # unit/integration tests across repo
pnpm --filter @fitvibe/backend test     # backend tests (Jest 30 + @swc/jest)
pnpm --filter @fitvibe/frontend test    # frontend tests (Vitest)

pnpm lint                                # lint all workspaces (continue on errors)
pnpm lint:check                          # lint with --max-warnings=0 (CI mode)
pnpm typecheck                           # TypeScript across the repo

pnpm fmt                                 # format all files with Prettier
```

### Building
```bash
pnpm build                               # production builds via Turbo
pnpm --filter @fitvibe/backend build    # compile backend to dist/
pnpm --filter @fitvibe/frontend build   # build frontend to dist/
pnpm --filter @fitvibe/frontend preview # preview frontend production build
```

### Database Operations
```bash
# Run migration scripts (from repo root)
pnpm tsx apps/backend/src/db/scripts/migrate.ts
pnpm tsx apps/backend/src/db/scripts/rollback.ts
pnpm tsx apps/backend/src/db/scripts/rotate-partitions.ts
pnpm tsx apps/backend/src/db/scripts/refresh-materialized.ts

# Run retention job (GDPR auto-purge after 24 months inactivity)
pnpm retention:run                       # shortcut for run-retention.ts

# Generate OpenAPI spec
pnpm openapi:build                       # generate OpenAPI documentation
```

### Other Commands
```bash
pnpm clean                               # remove node_modules, .turbo, reinstall
```

## Architecture

### High-Level Design Principles

**Three-Layer Architecture (ADR-013):**
1. **Router (HTTP layer)** - Express routers per domain; request parsing, Zod validation, authn, coarse RBAC, HTTP error mapping
2. **Service (domain layer)** - Pure business logic; coordinates repositories; enforces fine-grained authz; emits events
3. **Repository (data layer)** - SQL via Knex; owns queries, pagination, data mapping; no HTTP code

**Domain Modules:**
- `auth` - Registration, login, email verification, password reset, 2FA (TOTP), session management
- `users` - Profile management, privacy settings, avatar upload with AV scan
- `exercises` - Exercise library with user-owned and admin-owned global exercises
- `sessions` - Workout planning and logging with idempotency protection
- `progress` - Analytics, PRs, body measurements, materialized views
- `points` - Gamification system with deterministic rules
- `feed` - Social feed with privacy controls (public/followers/link/private)

### Backend Structure (`apps/backend/`)

```
src/
  api/             # Route adapters that surface module routers
  modules/         # Feature-vertical logic (auth, users, sessions, exercises, progress, points, feed)
  db/              # Knex config, migrations (40+), seeds, SQL helpers, scripts
  middlewares/     # Express middleware (auth guard, error handler, rate limit, CSRF, request logger)
  services/        # External integrations (mailer, cache, crypto)
  config/          # Environment loading (Zod validation), logger plumbing (Pino)
  observability/   # Prometheus metrics, tracing bootstrap
  utils/           # Shared helpers (HTTP errors, pagination, async handler)
  app.ts           # Express app configuration with all middleware and routing
  server.ts        # Entry point that listens on configured port
```

**Key Backend Patterns:**

- **Authentication (ADR-002)**:
  - RS256 JWT access tokens (10-15 min TTL)
  - Rotating refresh tokens (up to 30 days) with reuse detection
  - Session revocation on compromise (revoke entire session family)
  - JWKS endpoint at `/.well-known/jwks.json` for key rotation
  - Quarterly key rotation with 24h overlap window
  - Optional TOTP 2FA with backup codes

- **Authorization**:
  - RBAC roles baked into JWT (`user`, `admin`)
  - Router enforces coarse role checks
  - Service layer enforces fine-grained resource ownership
  - Admin endpoints require elevated scopes and stricter rate limits

- **Idempotency (ADR-007)**:
  - `Idempotency-Key` header for all POST/PUT/PATCH/DELETE endpoints
  - 24-hour TTL storage (Redis primary, Postgres fallback)
  - Same payload → replay stored response
  - Different payload → 409 Conflict
  - Scoped to `{principal, method, route_template}`

- **Security Controls**:
  - Helmet for HTTP headers (CSP no `unsafe-inline`, HSTS, Referrer-Policy, Permissions-Policy)
  - Strict CORS allowlist (env-configured)
  - Rate limiting: 100 req/min/IP baseline; stricter on auth endpoints
  - CSRF protection with SameSite cookies + CSRF token
  - Request ID tracking via X-Request-Id header
  - No PII in logs or metrics labels

- **API Conventions**:
  - All routes under `/api/v1`
  - RFC 7807 error envelope: `{ error: { code, message, details, requestId } }`
  - Cursor pagination for large result sets
  - Zod validation for all inputs and environment variables
  - Health endpoint at `/health`
  - Metrics endpoint at `/metrics` (if `METRICS_ENABLED=true`)

- **Database Configuration**:
  - Knex config: `apps/backend/src/db/knexfile.ts`
  - Environments: development, test, production
  - Connection via `DATABASE_URL` or discrete `PG*` variables
  - SSL support in production via `PGSSL=true`
  - Migration naming: `YYYYMMDDHHMM_description.ts`

### Frontend Structure (`apps/frontend/`)

```
src/
  pages/         # Route-aligned page components (Home, Dashboard, Login, Register, Planner, Logger, Progress, Profile, Feed)
  components/    # Reusable UI components
  services/      # API client with Axios interceptors for token refresh
  store/         # Zustand stores (auth, etc.)
  contexts/      # React context providers
  hooks/         # Shared React hooks
  routes/        # React Router v6 configuration
  i18n/          # i18next translations (static EN/DE for MVP)
  assets/        # Static assets and global styles
  utils/         # Client-side helpers
```

**Key Frontend Patterns:**

- **Authentication Flow**:
  1. User logs in/registers → backend returns `accessToken` (15min) + `refreshToken` (14 days)
  2. Tokens stored in Zustand auth store
  3. Axios interceptor attaches `Authorization: Bearer <accessToken>` to all requests
  4. On 401: automatic refresh via `/api/v1/auth/refresh`
  5. Request queueing prevents concurrent refresh attempts
  6. Failed refresh → sign out and redirect to login

- **API Client** (`src/services/api.ts`):
  - `apiClient` - For authenticated requests (with interceptors)
  - `rawHttpClient` - For auth endpoints (no interceptors)
  - Base URL: `VITE_API_URL` (defaults to `http://localhost:4000`)
  - Automatic token refresh with queue management

- **State Management**:
  - Zustand for lightweight global state (auth)
  - TanStack Query for server state caching and background refetch
  - React Router v6 for client-side routing

- **UI & Styling**:
  - TailwindCSS for design system and theming
  - Recharts for data visualization
  - Lucide React for icons
  - WCAG 2.1 AA compliance target

### Database Design

**Schema Overview (40+ migrations):**

**1. Identity & Security:**
- `users` - Account records with soft delete (`deleted_at`)
- `profiles` - 1:1 user profiles with privacy settings
- `roles`, `user_roles` - RBAC mapping
- `user_sessions` - Auth sessions with device metadata (IP, user-agent)
- `verification_tokens`, `reset_tokens` - Short-lived tokens (15min TTL)
- `auth_token_tables` - Refresh token storage with rotation tracking

**2. Catalog & i18n:**
- `exercise_categories`, `exercises` - User-owned + admin-owned global exercises
- `tags`, `exercise_tags` - Tagging system
- `translations`, `translation_fields` - Field-level i18n with allow-list
- `translation_cache` - Optional cache for translated content

**3. Planning & Logging:**
- `plans` - User training plans
- `workout_templates` - Reusable workout templates with ratings
- `sessions` - Workout sessions (planned/started/completed) with visibility controls
- `session_exercises` - Exercises within a session
- `exercise_sets` - Set-level data (reps, weight, RPE, tempo, rest)

**4. Progress & Recovery:**
- `personal_records` - Time-series PRs with `is_current` flag
- `body_measurements` - Daily snapshots (weight, BF%)
- `recovery_logs` - Daily wellness inputs (sleep, soreness, stress)
- `user_metrics` - Historical metrics tracking

**5. Social & Gamification:**
- `feed_items` - Activity feed with visibility (public/followers/link/private)
- `feed_comments`, `feed_likes`, `session_bookmarks` - Social interactions
- `followers` - User following relationships
- `share_links` - Revocable link tokens for sharing
- `badge_catalog`, `badges` - Badge definitions and awards
- `user_points` - Append-only points ledger (partitioned by `awarded_at`)

**6. Media & Operations:**
- `media_assets` - File uploads with AV scan metadata
- `idempotency_keys` - Request deduplication (24h TTL)
- `audit_log` - PII-free audit trail (partitioned by month)

**Advanced Features:**
- **Partitioning**: `sessions` (monthly on `planned_at`), `audit_log` (monthly), `user_points` (by `awarded_at`)
- **Materialized Views**: `session_summary`, `weekly_aggregates`, `leaderboard_view` (incremental refresh)
- **Soft Deletes**: `deleted_at` and `archived_at` columns for recoverable deletes
- **Immutability Constraints**: `date_of_birth` and `gender_id` in profiles (trigger-enforced)
- **Ownership Model (ADR-009)**: Global exercises have `owner_id = NULL` (admin-owned)
- **Visibility Model (ADR-010)**: Enum `{public, followers, link, private}` with default `private`

### Shared Packages (`packages/`)

- **`utils`** - Shared utilities across frontend and backend
- **`types`** - Shared TypeScript types and DTOs
- **`eslint-config`** - ESLint configuration preset
- **`tsconfig`** - Base TypeScript configurations
- **`i18n`** - Internationalization utilities
- **`ui`** - Design system/component library

### Monorepo Tools

- **PNPM workspaces** (v9) for dependency management
- **Turbo** for task orchestration and caching
- **Husky** for git hooks (commit signing required)
- **lint-staged** for pre-commit linting
- **Node.js 20 LTS** minimum runtime

## Environment Setup

### Backend Environment Variables

Copy `.env.example` to the root directory:

**Required:**
- `DATABASE_URL` - PostgreSQL connection string, OR:
  - `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`
- `JWT_PRIVATE_KEY_PATH` / `JWT_PUBLIC_KEY_PATH` - RSA-4096 keys for JWT signing
  - Generate: `openssl genrsa -out jwt_private.pem 4096 && openssl rsa -in jwt_private.pem -pubout -out jwt_public.pem`
  - Rotation: Quarterly (14-day alerts)

**Common:**
- `PORT` - Backend port (default: 3000)
- `NODE_ENV` - `development` | `test` | `production`
- `ALLOWED_ORIGINS` - CORS origins (comma-separated)
- `CSRF_ENABLED` - Toggle CSRF protection (default: false in dev)
- `CSRF_ALLOWED_ORIGINS` - CSRF-specific origins
- `GLOBAL_RATE_LIMIT_POINTS` - Requests per window (default: 120)
- `GLOBAL_RATE_LIMIT_DURATION` - Window in seconds (default: 60)
- `ACCESS_TOKEN_TTL_SEC` - Access token lifetime (default: 900 = 15min)
- `REFRESH_TOKEN_TTL_SEC` - Refresh token lifetime (default: 1209600 = 14 days)
- `METRICS_ENABLED` - Enable Prometheus metrics (default: true)
- `LOG_LEVEL` - Pino log level (debug/info/warn/error)

**Feature Flags:**
- `FEATURE_SOCIAL_FEED` - Enable social feed (default: false)
- `FEATURE_COACH_DASHBOARD` - Enable coach features (default: false)
- `FEATURE_INSIGHTS` - Enable advanced analytics (default: false)

### Frontend Environment Variables

Create `apps/frontend/.env.local`:

```
VITE_API_URL=http://localhost:4000
```

Additional `VITE_*` variables are exposed to the bundle.

## Key Technical Details

### Authentication & Session Management (ADR-002)

**Token Model:**
- **Access Token**: RS256 JWT, 10-15min TTL
  - Claims: `iss`, `aud`, `sub`, `exp`, `iat`, `nbf`, `jti`, `sid`, `scope`, `roles`, `locale`
  - Header includes `kid` for key rotation
- **Refresh Token**: Opaque, one-time-use rotating token
  - Stored hashed in DB (`user_sessions` table)
  - Lifetime up to 30 days (configurable)
  - Rotation on each refresh with reuse detection

**Session Lifecycle:**
1. Register → email verification (15min TTL) → verified account
2. Login → issue `{accessToken, refreshToken}` pair
3. Client stores tokens in Zustand store
4. On 401: automatic refresh via `/api/v1/auth/refresh`
5. Refresh rotation: invalidate old RT, issue new RT + AT
6. Reuse detection: if used RT is replayed → revoke entire session family
7. Logout: revoke active refresh session family (all tokens bound to `jti`)

**Security Controls:**
- Password policy: min 12 chars, uppercase, lowercase, number, symbol
- Progressive lockout on failed attempts
- No user enumeration (identical messages for existent/non-existent emails)
- Verification emails: max 3/hour
- Unverified accounts: auto-purge after 7 days

### Idempotency Policy (ADR-007)

**Requirements:**
- All POST/PUT/PATCH/DELETE endpoints accept `Idempotency-Key` header
- Client generates UUID per logical operation
- Server stores `{ key, route, method, principal, body_hash, response_code, response_body, ttl }`

**Behavior:**
- Same key + same payload → replay stored response (status + body)
- Same key + different payload → 409 Conflict
- TTL: 24 hours (after expiry, key is forgotten)
- Scoped to `{principal, method, route_template}`

**Storage:**
- Primary: Redis with TTL
- Fallback: Postgres `idempotency_keys` table
- Atomic write: `SETNX` or Lua script for first-write wins

### API Versioning (ADR-001)

**Policy:**
- `/api/v1` is stable; additive changes only (new fields, endpoints)
- Deprecations use `Deprecation` and `Sunset` headers
- Breaking changes require new version (`/api/v2`)
- 2-release overlap for major version transitions

### Data Retention & GDPR (ADR-003)

**Classification:**
- **Public** - Marketing content, public profiles
- **Internal** - Configs, runbooks (24-month retention)
- **Restricted** - Infra IPs, rate-limit configs (24-month retention)
- **Sensitive (Personal)** - User data, workout logs (delete on request; auto-purge after 24 months inactivity)

**DSR Endpoints:**
- `/api/v1/users/export` - Export all user data (JSON/CSV)
- `/api/v1/users/delete` - Trigger deletion (hard delete + backup purge ≤14 days)

**Retention:**
- App logs (no PII): 7 days
- Security audit logs: 24 months
- Backups: Purge ≤14 days after hard delete
- Unverified accounts: Auto-purge after 7 days

### Media Upload Safety (ADR-004)

**Upload Flow:**
1. Client requests signed upload URL
2. Server validates MIME type (allow-list: JPEG/PNG/WebP)
3. Client uploads directly to object storage
4. Server triggers AV scan (ClamAV or cloud-based)
5. On clean scan: create `media_assets` record
6. On malware/suspect: quarantine + alert
7. EXIF stripping for privacy
8. Generate 128×128 avatar derivative

**Constraints:**
- Max file size: 5MB
- Image-only MIME types
- Private ACL by default
- Avatar storage: object storage (S3/GCS) in production, local `/uploads` in dev

### Observability

**Structured Logging (Pino):**
- Correlation IDs propagated across layers
- No PII in logs (use pseudonymous UUIDs)
- Log levels: debug, info, warn, error
- Request/response logging via morgan

**Metrics (Prometheus):**
- Request latency histograms per route
- Domain counters (created/updated/deleted)
- Auth failure rates
- Cache hit ratios
- Alert thresholds:
  - 5xx rate > 1%
  - p95 latency > 600ms
  - JWT signing key age > 14 days
  - Failed-login spike > 3σ baseline

**Performance Budgets:**
- API p95 < 300ms (overall)
- Auth endpoints ≤ 200ms
- CRUD endpoints ≤ 300ms
- Feed endpoints ≤ 400ms
- Analytics endpoints ≤ 600ms
- LCP < 2.5s (frontend)
- Fail on >10% performance regression

### Testing Strategy

**Backend (Jest 30 + @swc/jest per ADR-021):**
- Unit tests: Services with mocked repositories
- Integration tests: Routers → Services → Repos against ephemeral Postgres
- Database tests: pg-mem or ephemeral instance with migrations + seeds
- Security tests: OWASP ZAP baseline (weekly), Snyk scans (nightly)

**Frontend (Vitest):**
- Component tests: React Testing Library + jsdom
- Integration tests: User flows with mocked API
- E2E tests: Playwright flows (planned)
- Accessibility tests: Lighthouse + axe (≥90 score requirement)

**Quality Gates (CI):**
- Lint: `pnpm lint:check` (--max-warnings=0)
- Type check: `tsc --noEmit`
- Tests: `pnpm test` (all workspaces)
- Security: npm audit / Snyk (block on high/critical)
- Performance: k6 thresholds aligned to SLOs
- SBOM generation: CycloneDX and/or SPDX

## Security & Compliance

### Security Controls Summary

| Area | Control | Notes |
|------|---------|-------|
| **Authentication** | RS256 JWT (≤15min) + rotating refresh | Reuse detection, quarterly key rotation |
| **Transport** | TLS 1.3 only, HSTS, OCSP stapling | Modern ciphers only |
| **Headers** | CSP (no unsafe-inline), Referrer-Policy, Permissions-Policy, X-Frame-Options, X-Content-Type-Options | Strict defaults |
| **CSRF** | SameSite cookies + CSRF token | Defense-in-depth |
| **Validation** | Zod DTO validation, environment schema | Deny by default |
| **Rate Limiting** | 100 req/min/IP baseline (adjustable) | Stricter on auth routes |
| **Uploads** | AV scan, MIME allow-list, EXIF strip, private ACL | Quarantine on fail |
| **Idempotency** | 24h key storage, replay-safe | Required for state-changing writes |
| **Observability** | Pino logs + correlation IDs; Prometheus metrics | No PII in logs/labels |
| **Privacy/GDPR** | Privacy-by-default; DSR endpoints; data minimization | Auto-purge after 24mo |
| **Supply Chain** | SCA (npm-audit/Snyk), SBOM, signed images, pinned digests | Block on critical/high |

### CVSS Severity → Fix SLAs

| CVSS Score | Severity | Target Triage | Target Fix (Prod) |
|------------|----------|---------------|-------------------|
| 9.0–10.0 | Critical | ≤24h | ≤72h |
| 7.0–8.9 | High | ≤48h | ≤7 days |
| 4.0–6.9 | Medium | ≤5 biz days | ≤30 days |
| 0.1–3.9 | Low | Best effort | Next release |

### Contributor Security Requirements

All contributors must:
- Use 2FA on GitHub accounts
- Sign commits (`git config --global commit.gpgSign true`)
- Never commit secrets or `.env` files
- Run security scans before PR submission
- Confirm "No secrets committed" in PR checklist

## Common Development Patterns

### Adding a New API Endpoint

1. **Create/update router** in `apps/backend/src/api/<domain>.routes.ts`
2. **Implement controller** in `apps/backend/src/modules/<domain>/<domain>.controller.ts`
3. **Add service logic** in `apps/backend/src/modules/<domain>/<domain>.service.ts`
4. **Create repository methods** in `apps/backend/src/modules/<domain>/<domain>.repository.ts`
5. **Define Zod validators** in `apps/backend/src/modules/<domain>/<domain>.validators.ts`
6. **Mount router** in `apps/backend/src/app.ts`
7. **Update frontend API client** in `apps/frontend/src/services/api.ts`
8. **Add tests** for all layers (unit, integration, E2E)

### Adding a Database Migration

1. **Create migration file**: `apps/backend/src/db/migrations/YYYYMMDDHHMM_description.ts`
   - Naming: Use current timestamp + descriptive slug
   - Example: `202510270101_create_users_table.ts`

2. **Implement up/down functions**:
```typescript
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('username').notNullable().unique();
    table.text('password_hash').notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
```

3. **Run migration**: `pnpm tsx apps/backend/src/db/scripts/migrate.ts`
4. **Verify**: Check `knex_migrations` table
5. **Rollback if needed**: `pnpm tsx apps/backend/src/db/scripts/rollback.ts`

**Migration Best Practices:**
- Always include `down` function for rollback capability
- Use transactions for multi-step migrations
- Add indexes for foreign keys and frequently queried columns
- Document breaking changes in migration comments
- Test migrations against production-like data volumes

### Adding a New Frontend Page

1. **Create page component** in `apps/frontend/src/pages/<PageName>.tsx`
2. **Add route** in `apps/frontend/src/routes/` (React Router v6)
3. **Create API functions** in `apps/frontend/src/services/api.ts`
4. **Use TanStack Query** for data fetching:
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['resource', id],
  queryFn: () => apiClient.get(`/api/v1/resource/${id}`),
});
```
5. **Handle authentication** via `useAuthStore` hook
6. **Add accessibility** attributes (ARIA labels, keyboard nav)

### Working with Feature Flags

**Backend:**
```typescript
import { env } from './config/env';

if (env.FEATURE_SOCIAL_FEED) {
  app.use('/api/v1/feed', feedRouter);
}
```

**Frontend:**
```typescript
const FEATURES = {
  socialFeed: import.meta.env.VITE_FEATURE_SOCIAL_FEED === 'true',
};

{FEATURES.socialFeed && <FeedComponent />}
```

### Handling Errors

**Backend error pattern:**
```typescript
import { HttpError } from '../utils/http-errors';

throw new HttpError(401, 'E.AUTH.INVALID_CREDENTIALS', 'Invalid credentials');
```

**Frontend error handling:**
```typescript
try {
  await apiClient.post('/api/v1/resource', data);
} catch (error) {
  if (error.response?.status === 401) {
    // Token refresh handled by interceptor
  } else {
    // Display user-friendly error
  }
}
```

## Documentation

### Primary Documentation Sources

- **Product Requirements**: `apps/docs/1.Product_Requirements_Document.md`
- **Technical Design**: `apps/docs/2*.Technical_Design_Document_*.md` (Tech Stack, Modules, Data, API, Misc)
- **Testing & QA**: `apps/docs/4*.Testing_and_Quality_Assurance_Plan*.md`
- **Security Policy**: `apps/docs/SECURITY.md`
- **Architecture Decisions**: `apps/docs/6. adr/` (21 ADRs - see ADR_INDEX.md)
- **Project Structure**: `apps/docs/project-structure.md` (10MB+ canonical layout)
- **API Reference**: Generate via `pnpm openapi:build`

### Key Architecture Decision Records (ADRs)

| ID | Title | Key Points |
|----|-------|------------|
| ADR-001 | API Versioning Policy | `/api/v1` stable; additive only; breaking → `/v2` |
| ADR-002 | Authentication Token Strategy | RS256 JWT + rotating refresh; reuse detection |
| ADR-003 | Data Retention & GDPR | DSR endpoints; 24mo auto-purge; backup purge ≤14d |
| ADR-004 | Media Upload Safety | AV scan; MIME allow-list; EXIF strip; quarantine |
| ADR-005 | Partitioning Strategy | Sessions monthly on `planned_at`; audit_log monthly |
| ADR-006 | Observability Cardinality | No PII in labels; bounded label sets; alert on growth |
| ADR-007 | Idempotency Policy | `Idempotency-Key` header; 24h TTL; 409 on mismatch |
| ADR-008 | Materialized Views | session_summary, weekly_aggregates; incremental refresh |
| ADR-009 | Exercise Library Ownership | Global exercises: `owner_id = NULL` (admin-owned) |
| ADR-010 | Visibility Model | public/followers/link/private; default private |
| ADR-011 | Internationalization | Static EN/DE for MVP; AI translation feature-flagged |
| ADR-012 | Monorepo Structure | pnpm + Turbo; CODEOWNERS; feature flags |
| ADR-013 | Modular Backend | Router → Service → Repository; domain modules |
| ADR-014 | Technology Stack | Node/Express, React/Vite, Postgres, object storage |
| ADR-015 | API Design | REST/JSON; RFC7807 errors; cursor pagination |
| ADR-016 | Security Middleware | CSP/HSTS; RBAC; PII-free audit logs |
| ADR-017 | Avatar Handling | Server-mediated; AV scan; signed URLs; private-default |
| ADR-018 | CI/CD | GitHub Actions; GHCR images; SBOM/provenance; OIDC |
| ADR-019 | Caching Strategy | Layered caching; explicit invalidation; p95 < 300ms |
| ADR-020 | Accessibility | WCAG 2.1 AA; Lighthouse ≥90; keyboard flows |
| ADR-021 | Test Runner | Jest 30 + @swc/jest for backend; Vitest for frontend |

### Glossary (Key Terms)

- **ADR**: Architecture Decision Record
- **DSR**: Data Subject Rights (GDPR: access, rectification, deletion, portability)
- **GDPR**: General Data Protection Regulation
- **JWT**: JSON Web Token
- **RBAC**: Role-Based Access Control
- **2FA**: Two-Factor Authentication (TOTP)
- **CSP**: Content Security Policy
- **HSTS**: HTTP Strict Transport Security
- **WCAG**: Web Content Accessibility Guidelines
- **p95**: 95th percentile latency
- **SLO**: Service Level Objective
- **RPO**: Recovery Point Objective (≤24h)
- **RTO**: Recovery Time Objective (≤4h)
- **SBOM**: Software Bill of Materials
- **SCA**: Software Composition Analysis

## Troubleshooting

### Common Issues

**Database Connection Errors:**
- Verify `DATABASE_URL` or `PG*` variables in `.env`
- Ensure PostgreSQL is running: `docker ps` or `pg_isready`
- Check migrations: `pnpm tsx apps/backend/src/db/scripts/migrate.ts`

**JWT Errors:**
- Verify RSA key files exist at paths specified in env
- Generate keys: `openssl genrsa -out jwt_private.pem 4096 && openssl rsa -in jwt_private.pem -pubout -out jwt_public.pem`
- Check key permissions (readable by Node process)

**CORS Errors:**
- Add frontend URL to `ALLOWED_ORIGINS` in backend `.env`
- Format: `http://localhost:3000` (no trailing slash)

**Rate Limit Issues:**
- Adjust `GLOBAL_RATE_LIMIT_POINTS` and `GLOBAL_RATE_LIMIT_DURATION` in `.env`
- Clear rate limit cache (restart backend or flush Redis)

**Migration Failures:**
- Rollback: `pnpm tsx apps/backend/src/db/scripts/rollback.ts`
- Check `knex_migrations` table for current state
- Review migration file for syntax errors
- Ensure database user has CREATE/ALTER permissions

## Additional Resources

- **CI/CD Workflows**: `.github/workflows/`
- **Infrastructure**: `infra/` (Docker, NGINX, observability)
- **Diagrams**: `apps/docs/diagrams/` (Mermaid files)
- **Personas**: `apps/docs/4.personas/` (User roles and workflows)
- **Privacy Policy**: `apps/docs/policies/Privacy_Policy.md`
- **Data Map**: `apps/docs/policies/Data_Map.md`

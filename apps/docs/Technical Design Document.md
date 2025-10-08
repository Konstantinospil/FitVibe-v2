# FitVibe – Technical Design Document (TDD)
**Subsystem:** Backend (MVP)  
**Product:** FitVibe – Training Planner & Logger Web App  
**Author:** Konstantinos (with assistance)  
**Revision:** v1.0 (Backend MVP)  
**Date:** 2025‑10‑05

## Revision History
| Version | Date | Author | Description |
|--------:|------|--------|-------------|
| v1.0 | 2025‑10‑05 | Konstantinos | Initial backend MVP |
| v1.1 | 2025‑10‑05 | Konstantinos | Added lookup normalization tables & FKs |
| v1.2 | 2025‑10‑05 | Konstantinos | Added governance, layer contracts, migration policy, monitoring (Prometheus/Grafana), metrics, threat model, CI/CD promotion & rollback, test matrix, and Phase‑2 appendix |

> Cross‑reference: PRD at `apps/docs/Fitvibe_PRD.md`. When this TDD references “PRD §x.y”, it points to that document.

---

## Table of Contents

1. Purpose, Scope & References  
2. System Overview  
3. Architecture & Design Decisions  
4. Module Design (Backend)  
   - 4.1 Cross‑Cutting Concerns  
   - 4.2 Auth Module  
   - 4.3 Users Module  
   - 4.4 Exercises Module  
   - 4.5 Sessions Module  
   - 4.6 Progress Module  
   - 4.7 Points Module  
   - 4.8 Feed Module  
   - 4.9 System/Health Module  
5. Sequence Diagrams (Inline)  
6. Database Design (DDL‑level)  
7. API Specifications (Schemas & Contracts)  
8. Configuration & Environment  
9. Error Handling & Logging  
10. Security Implementation  
11. Testing & Validation Plan  
12. Deployment & CI/CD (Runtime Topology)  
13. Operability (Runbooks)  
14. Non‑Functional Requirements Mapping  
15. Glossary

---

## List of Tables

| No. | Title                                                    |
| --- | -------------------------------------------------------- |
| T1  | Module Responsibilities & Dependencies                   |
| T2  | Error Envelope & Standard Codes                          |
| T3  | Environment Variables & Validation                       |
| T4  | Database Tables & Indexes Overview                       |
| T5  | Test Types, Scope, and Coverage Targets                  |

## List of Figures

| No. | Title                                         |
| --- | --------------------------------------------- |
| F1  | Backend High‑Level Architecture (Context)     |
| F2  | Sequence: Registration & Email Verification   |
| F3  | Sequence: Login + Access/Refresh Rotation     |
| F4  | Sequence: Plan Session                        |
| F5  | Sequence: Complete Session & Award Points     |
| F6  | Sequence: Clone Public Session                |

---

## 1. Purpose, Scope & References

**Purpose.** This TDD translates the product intent from the PRD into a developer‑ready design for the **FitVibe Backend (MVP)**. It covers architecture, modules, database schema, API contracts, security, testing, and deployment.

**Scope.** Backend only (Node.js 20 + Express). MVP features per PRD FR‑1…FR‑7: authentication, profiles, exercise library, session planning & logging, progress endpoints, points granting, feed, and system health.

**Out of Scope (for this TDD).** Real‑time features, wearables, nutrition, full notifications pipeline, and advanced social modules are deferred (Phase 2+).

**References.**
- **PRD:** `apps/docs/Fitvibe_PRD.md` (a.k.a. FitVibe_PRD.md) – authoritative requirements baseline.
- **Mermaid assets:** this TDD embeds inline. You may export to `apps/docs/*.mmd` later.
- **Repo structure & CI/CD:** see PRD §11 and monorepo layout.

---

## 2. System Overview

Backend serves a REST API under `/api/v1`. It follows a layered approach:
- **Router/Controller** (HTTP concerns) → **Service** (business logic) → **Repository** (DB via Knex).  
- Cross‑cutting modules: **auth**, **security middleware**, **validation (zod)**, **logging**, **config/env**, **error handler**.

### F1. Backend High‑Level Architecture (Context)

```mermaid
flowchart LR
  subgraph Client
    FE[SPA: React + Axios]
  end
  FE -->|HTTPS /api/v1| NGINX[NGINX TLS + HSTS]
  NGINX --> API[Express App]

  subgraph API[Express App: Node 20 + TS]
    direction TB
    RT[Routers/Controllers] --> SV[Services]
    SV --> REPO[Repositories: Knex]
    RT --> MW[Security Middleware: Helmet, CORS, Rate Limit, CSRF]
    RT --> VAL[Validation: zod DTOs]
    API_LOG[Logging: pino/morgan]
  end

  REPO --> PG[PostgreSQL 18]
  SV --> MAIL[Mailer Abstraction]
  SV -. future .-> JOBS[Job Queue: BullMQ/Temporal]
  class JOBS future;
```
`future` class refers to Phase 2+ items.

---

### F7. Component Interaction & Dependencies
```mermaid
flowchart TB
  Auth --> Users
  Auth --> Mailer
  Sessions --> Exercises
  Sessions --> Points
  Points --> PG[(DB)]
  Users --> Media
  Feed --> Sessions
  subgraph CrossCutting
    Logger
    ErrorHandler
    Validation
    Config
  end
  Auth --> Logger
  Sessions --> Logger
  Points --> Logger
  Feed --> Logger
```

---

## 3. Architecture & Design Decisions

- **Framework:** **Express** for minimal, explicit control; **TypeScript** for typing.  
- **API style:** REST, versioned at `/api/v1`.  
- **Layering:** Router → Service → Repository to isolate concerns, ease testing.  
- **Validation:** **zod** for runtime DTO & env validation (fail‑fast on boot).  
- **Auth:** JWT (RS256) **access** (≤15m) + server‑stored **refresh** (rotation by `jti`). Cookies are `httpOnly`, `Secure`, `SameSite=Lax`.  
- **Security middleware order:** `helmet` → `cors` → `rateLimit` → `cookieParser` → `csrf` (state‑changing routes) → routes.  
- **Database:** PostgreSQL 18 + Knex migrations; normalized schema; soft‑deletes for archive entities.  
- **Observability:** pino structured logs + morgan access logs; correlation IDs; GDPR‑safe (no PII).  
- **CI/CD:** GitHub Actions (lint → typecheck → jest → build → docker → GHCR) + manual prod deploy; migrations executed on startup job.

---

### 3.1 Layer Contracts (new)
- **Router Layer:** Express handlers; parse/validate inputs; map service errors → HTTP. **Never** access DB directly.  
- **Service Layer:** Business logic; pure functions where possible; transactional boundaries; throws domain errors.  
- **Repository Layer:** All SQL/Knex; returns typed records/DTOs; no business rules.  
- **Utilities:** time, ids, hashing, token, mail, storage, metrics.

---

## 4. Module Design (Backend)

### 4.1 Cross‑Cutting Concerns

- **App bootstrap (`app.ts`):** mounts middlewares, routes, error handler.
- **Env config (`config/env.ts`):** parses process env via zod; throws on invalid.
- **Error handler (`middlewares/errorHandler.ts`):** centralizes mapping to error envelope (see §9).
- **Logger (`utils/logger.ts`):** exports pino instance with child bindings (requestId).  
- **Auth utilities:** JWT signer/verifier, refresh store access, password hashing (bcryptjs), TOTP (Phase 2).  
- **DTO Validation:** per‑route `zod` schemas; `validate(dto)` middleware rejects 400.

**Table T1 — Module responsibilities & dependencies**
| Module | Responsibilities | Depends On |
| --- | --- | --- |
| `auth` | register, verify email, login, refresh, logout, reset password | users repo, mailer, bcrypt, jwt, refresh repo |
| `users` | read/update own profile, state history | users repo, storage, auth |
| `exercises` | CRUD + archive exercises | exercises repo, users auth |
| `sessions` | plan/log sessions, planned vs actual attributes | sessions repo, exercises repo |
| `progress` | summaries and chart data | sessions repo, aggregates |
| `points` | compute/read points on completion | points service, sessions repo |
| `feed` | list/clone public sessions | sessions repo |
| `system` | `/health` | none |

---

### 4.2 Auth Module

**Responsibilities.** Account lifecycle: registration (email verification), login, token issuance (access + refresh), rotation, logout, password reset.

**Key rules.**
- Passwords: min 12 chars; uppercase/lowercase/digit/symbol.
- Access JWT ≤ 15m; minimal claims `{ sub, iat, exp }`.  
- Refresh token stored in DB with `jti`; rotated on each refresh; revoke on logout/password change.

**Public Endpoints.**
- `POST /auth/register` → create user (inactive), send verification link (15m TTL).  
- `POST /auth/login` → set cookies (`access`, `refresh`).  
- `POST /auth/refresh` → rotate refresh, return new access.  
- `POST /auth/logout` → revoke refresh.  
- `POST /auth/password/forgot` → email reset token (15m).  
- `POST /auth/password/reset` → set new password, revoke sessions.  
- `GET  /.well-known/jwks.json` → expose public keys for verification.

**Services.**
- `registerUser(input)`, `verifyEmail(token)`, `login(creds)`, `refresh(jti)`, `logout(jti)`, `requestPasswordReset(email)`, `resetPassword(token,newPw)`.

**Data.**
- Tables: `users`, `user_contacts`, `auth_sessions`, `password_reset_requests` (see §6).

**Security.**
- Generic errors (no user enumeration).  
- Rate limiting on `/auth/*` and `/users/*` sensitive routes.  
- Optional TOTP (Phase 2).

---

### 4.3 Users Module

**Responsibilities.** Access/update editable profile attributes; keep immutable in `user_static`; write history rows to `user_state_history`.

**Endpoints.**
- `GET /users/me`  
- `PUT /users/me` (alias, avatar, fitness level, frequency).

**Notes.** Avatar upload validated (JPEG/PNG/WebP ≤ 5MB). Write a history snapshot on update.

---

### 4.4 Exercises Module

**Responsibilities.** Create/edit/archive exercises. Default visibility **private**; `is_public` flag enables discovery. Safe delete via archive.

**Endpoints.**
- `GET /exercises` (own + public)  
- `POST /exercises`  
- `PUT /exercises/:id`  
- `DELETE /exercises/:id` (archive)

**Data.** `exercises`, `exercise_categories` lookups. Name snapshot captured in `session_exercises` to preserve history.

---

### 4.5 Sessions Module

**Responsibilities.** Plan sessions (date/time, optional recurrence), log actuals, mark `completed|canceled`, compare planned vs actual, archive.

**Endpoints.**
- `GET /sessions`  
- `POST /sessions`  
- `PATCH /sessions/:id/complete`

**Data.** `sessions`, `session_exercises`, `planned_exercise_attributes`, `actual_exercise_attributes`.

**Business.** On completion, emit domain event (`SessionCompleted`) consumed by **Points** service (synchronous in MVP).

---

### 4.6 Progress Module

**Responsibilities.** Summaries and chart data over time by filters (date, category, visibility).

**Endpoints.**
- `GET /progress/summary`  
- `GET /progress/charts`

**Data.** Aggregates over sessions/attributes; PBs and streaks may be deferred to Phase 2 UI.

---

### 4.7 Points Module

**Responsibilities.** Compute and persist points on session completion using bounded formulas (age, gender, fitness level, frequency, calories/RPE). Anti‑gaming checks.

**Endpoints.**
- `GET /points` (current total)  
- `GET /points/history`

**Data.** `user_points` with `source_type`, `algorithm_version` for audit. Admin manual adjustments (Phase 2).

---

### 4.8 Feed Module

**Responsibilities.** List public sessions; clone into planner with attribution preserved.

**Endpoints.**
- `GET /feed`  
- `POST /feed/:id/clone`

**Privacy.** Default privacy is private; only public sessions appear in feed.

---

### 4.9 System / Health

- `GET /health` → `200 { status:"ok", timestamp }` for uptime checks and deployment verification.

---

# 4.10 Internationalization & Localization (i18n / l10n)

- **Frontend:** Token-based translation system using i18next with English (en) and German (de) JSON resources.  
- **Backend:** Express middleware for language detection, lookup normalization, and AI translation proxy.  
- **Database:** Persistent translation cache table and localized lookup tables.  
- **Infrastructure:** Optional Redis layer for translation caching (Phase 2+).  
- **Security:** PII redaction and GDPR-compliant data handling before API calls to external translation providers.

---

## 4.10.1 Architecture Overview

| Layer | Component | Description |
|-------|------------|-------------|
| **Frontend** | `i18n.ts` | Initializes i18next and loads static resources from `/src/utils/i18n/{lang}.json` |
| **Backend Middleware** | `detectLanguage.ts` | Extracts language from `Accept-Language` header or user profile |
| **Backend Service** | `translation.service.ts` | Calls AI translation API (DeepL/OpenAI/Azure), caches result |
| **Database** | `translation_cache` | Stores `(source, lang, translated, created_at)` entries for reuse |
| **Config** | `i18n.ts` | Defines supported languages, fallback, and API provider credentials |

---

## 4.10.2 Data Flow

```mermaid
sequenceDiagram
  participant U as User (Browser)
  participant FE as Frontend (React + i18next)
  participant BE as Backend (Express)
  participant AI as AI Translator (DeepL/OpenAI)
  participant DB as PostgreSQL (Cache)

  U->>FE: Request Feed (lang=de)
  FE->>BE: GET /feed?lang=de
  BE->>DB: Lookup cached translations
  alt Cache hit
    DB-->>BE: Return translated text
  else Cache miss
    BE->>AI: Translate content (EN→DE)
    AI-->>BE: Return translated text
    BE->>DB: Cache result
  end
  BE-->>FE: Localized JSON response
  FE-->>U: Render translated text
```

---

## 4.10.3 Backend Implementation

### Middleware: `detectLanguage.ts`
```ts
// apps/backend/src/middlewares/detectLanguage.ts
export function detectLanguage(req, _res, next) {
  req.lang =
    req.headers["accept-language"]?.split(",")[0]?.slice(0, 2) ||
    req.user?.preferred_lang ||
    process.env.DEFAULT_LANG ||
    "en";
  next();
}
```

### Service: `translation.service.ts`
```ts
// apps/backend/src/services/translation.service.ts
import crypto from "crypto";
import { knex } from "../db/knex";

export async function translateText(source, targetLang) {
  const hash = crypto.createHash("sha256").update(source + targetLang).digest("hex");
  const cached = await knex("translation_cache").where({ id: hash }).first();
  if (cached) return cached.translated;

  const response = await callTranslatorAPI(source, targetLang);
  await knex("translation_cache").insert({
    id: hash,
    source,
    lang: targetLang,
    translated: response,
    created_at: new Date()
  });
  return response;
}

async function callTranslatorAPI(text, lang) {
  const provider = process.env.AI_TRANSLATION_PROVIDER;
  if (provider === "deepl") return callDeepL(text, lang);
  if (provider === "openai") return callOpenAI(text, lang);
  throw new Error("Unsupported translation provider");
}
```

### Integration: Feed Router Example
```ts
router.get("/feed", detectLanguage, async (req, res) => {
  const { lang } = req;
  const feed = await FeedService.getPublicFeed();
  const translatedFeed = await Promise.all(
    feed.map(async item => ({
      ...item,
      description: await translateText(item.description, lang),
    }))
  );
  res.json(translatedFeed);
});
```

---

## 4.10.4 Database Schema Extension

### Table: `translation_cache`

| Column | Type | Description |
|---------|------|-------------|
| `id` | UUID / SHA-256 hash | Unique key combining text + language |
| `source` | TEXT | Original text |
| `lang` | TEXT | Target language code (e.g., 'de') |
| `translated` | TEXT | Translated output |
| `created_at` | TIMESTAMP | Insertion timestamp |

### Lookup Table Updates
Add columns or new `_i18n` tables for localized descriptions, e.g.:
```sql
ALTER TABLE fitness_levels ADD COLUMN description_en TEXT;
ALTER TABLE fitness_levels ADD COLUMN description_de TEXT;
```

---

## 4.10.5 Configuration

| Variable | Description | Example |
|-----------|-------------|----------|
| `DEFAULT_LANG` | Fallback language | `en` |
| `I18N_SUPPORTED_LANGS` | Supported languages | `en,de` |
| `AI_TRANSLATION_PROVIDER` | Translation API provider | `openai` |
| `AI_TRANSLATION_KEY` | Provider API key | `env secret` |
| `I18N_CACHE_TTL` | Cache retention (days) | `7` |

---

## 4.10.6 Testing Strategy

| Test Type | Objective | Tools |
|------------|------------|--------|
| **Unit Tests** | Validate translation service logic & cache lookup | Jest |
| **Integration Tests** | Verify translation flow within `/feed` endpoint | Jest + Supertest |
| **Mocked API Tests** | Replace AI service with mock to avoid external calls | Jest mock modules |
| **Performance Tests** | Ensure < 300 ms latency on cache hit | k6 |
| **Privacy Tests** | Ensure PII is redacted before external calls | Custom regex-based sanitizer tests |

### Example Test Stub
```ts
describe("translation.service", () => {
  it("returns cached translation if available", async () => {
    const text = "Hello";
    const lang = "de";
    await knex("translation_cache").insert({
      id: "123",
      source: text,
      lang,
      translated: "Hallo",
      created_at: new Date()
    });
    const result = await translateText(text, lang);
    expect(result).toBe("Hallo");
  });
});
```

---

## 4.10.7 Security & GDPR Compliance

- Redact all PII before translation (names, emails, tokens).  
- Enforce HTTPS for translation API requests.  
- Cache only anonymized text.  
- Include translation API calls in audit logs with timestamp, user ID, and target language.  
- Users can request deletion of cached translations via DSR endpoint.

---

## 4.10.8 Roadmap

| Phase | Focus | Deliverable |
|--------|--------|-------------|
| **Phase 1 (MVP)** | Static translations (EN/DE) | UI tokens + backend strings |
| **Phase 2** | AI-assisted hybrid model | Translation service + cache |
| **Phase 3** | Cloud-managed translations | Phrase/Tolgee integration |
| **Phase 4** | Domain-adapted AI model | Fine-tuned fitness-specific glossary |

---

## 4.10.9 Success Metrics

| Metric | Target |
|---------|---------|
| Translation latency (cache hit) | ≤ 300 ms |
| Cache hit ratio | ≥ 80 % |
| Translation accuracy | ≥ 90 % manual QA |
| GDPR compliance | 100 % |
| Translation coverage | 100 % of UI tokens |

---

## 5. Sequence Diagrams (Inline)

### F2. Registration & Email Verification

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant FE as Frontend
  participant API as Backend (Auth Router)
  participant SVC as Auth Service
  participant DB as PostgreSQL
  participant MAIL as Mailer

  U->>FE: Fill registration form
  FE->>API: POST /auth/register {email, username, password}
  API->>SVC: validate + registerUser()
  SVC->>DB: insert users (inactive) + verification token (TTL 15m)
  SVC->>MAIL: sendVerificationEmail(link)
  API-->>FE: 201 Created

  U->>FE: Click verification link
  FE->>API: GET /auth/verify?token=...
  API->>SVC: verifyEmail(token)
  SVC->>DB: set user active, delete token
  API-->>FE: 200 OK
```

### F3. Login + Access/Refresh Rotation

```mermaid
sequenceDiagram
  autonumber
  participant FE as Frontend
  participant API as /auth/login
  participant SVC as Auth Service
  participant DB as PostgreSQL

  FE->>API: POST /auth/login {username,email,password}
  API->>SVC: 'login()'
  SVC->>DB: verify hash, create refresh: jti, expires
  SVC-->>API: accessJWT:≤15m, refreshCookie
  API-->>FE: Set_Cookie: access, refresh

  FE->>API: GET /protected
  API-->>FE: 200 OK

  Note over FE,API: Access expires
  FE->>API: POST /auth/refresh : cookie
  API->>SVC: rotateRefresh: jti
  SVC->>DB: revoke old, create new, issue new access
  API-->>FE: Set-Cookie: new access, new refresh
```

### F4. Plan Session

```mermaid
sequenceDiagram
  participant FE as Frontend
  participant API as /sessions
  participant SVC as Sessions Service
  participant DB as PostgreSQL

  FE->>API: POST /sessions {title, planned_for, exercises[]}
  API->>SVC: createSession(cmd)
  SVC->>DB: insert session + session_exercises + planned_attributes
  SVC-->>API: sessionId
  API-->>FE: 201 Created {id}
```

### F5. Complete Session & Award Points

```mermaid
sequenceDiagram
  participant FE as Frontend
  participant API as /sessions/:id/complete
  participant SVC as Sessions Service
  participant PTS as Points Service
  participant DB as PostgreSQL

  FE->>API: PATCH /sessions/:id/complete {actuals}
  API->>SVC: completeSession(id, actuals)
  SVC->>DB: write actual_attributes, set status=completed
  SVC-->>PTS: SessionCompleted(userId, sessionId)  %% sync in MVP
  PTS->>DB: compute & insert user_points
  API-->>FE: 200 OK {pointsAwarded}
```

### F6. Clone Public Session

```mermaid
sequenceDiagram
  participant FE as Frontend
  participant API as /feed/:id/clone
  participant SVC as Feed Service
  participant DB as PostgreSQL

  FE->>API: POST /feed/:id/clone
  API->>SVC: cloneSession(publicId, userId)
  SVC->>DB: read source session + exercises
  SVC->>DB: insert new session for user (attribution kept)
  API-->>FE: 201 Created {newSessionId}
```

---

## 6. Database Design (DDL‑level)

> PostgreSQL 18, UUID PKs, UTC timestamps, soft‑delete via `archived_at` where applicable. Use `citext` for case‑insensitive emails/usernames.

**Extensions**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
```

### 6.1 Tables (overview) — Table T4
- Security & Users: `users`, `roles`, `user_contacts`, `user_static`, `genders`, `user_state_history`, `fitness_levels`, `auth_sessions`, `password_reset_requests`
- Domain: `exercises`, `exercise_cateogories`, `sessions`, `session_exercises`
- Attributes: `planned_exercise_attributes`, `actual_exercise_attributes`
- Gamification & Community: `user_points`, `badges`, `followers`, `media`

### 6.1.1 Lookup Normalization Tables

The following additional lookup tables extend the MVP schema for data consistency and referential integrity.  
They replace plain-text enums for better analytics and i18n extensibility.

```sql
-- CONTACT TYPES
CREATE TABLE contact_types (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL
);

INSERT INTO contact_types (code, description) VALUES
('email', 'Email address'),
('phone', 'Telephone number');

-- TRAINING FREQUENCY
CREATE TABLE training_freq (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL
);

INSERT INTO training_freq (code, description) VALUES
('not at all', 'Not training currently'),
('monthly', 'Once a month'),
('weekly', 'One or more times per week'),
('daily', 'Daily training');

-- POINT SOURCES
CREATE TABLE point_sources (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL
);

INSERT INTO point_sources (code, description) VALUES
('session_completion', 'Points from completed session'),
('admin_adjustment', 'Manual adjustment by admin'),
('bonus_event', 'Special campaign or challenge');

-- BADGE TYPES
CREATE TABLE badge_types (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL
);

INSERT INTO badge_types (code, description) VALUES
('first_session', 'Completed first training session'),
('hundred_workouts', 'Logged 100 sessions'),
('marathon_badge', 'Completed a marathon event');
```
**Foreign Keys (add at the end of each referencing table):**

```sql
ALTER TABLE user_contacts
  ADD CONSTRAINT fk_contact_type FOREIGN KEY (type)
  REFERENCES contact_types(code);

ALTER TABLE user_state_history
  ADD CONSTRAINT fk_training_freq FOREIGN KEY (training_frequency)
  REFERENCES training_freq(code);

ALTER TABLE user_points
  ADD CONSTRAINT fk_point_source FOREIGN KEY (source_type)
  REFERENCES point_sources(code);

ALTER TABLE badges
  ADD CONSTRAINT fk_badge_type FOREIGN KEY (badge_type)
  REFERENCES badge_types(code);
```

---

### 6.2 DDL (representative; adjust naming as needed)

```sql
-- ROLES
CREATE TABLE roles (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL
);

-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL REFERENCES roles(code) DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'inactive', -- inactive|active|archived
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_users_username_lower ON users((lower(username)));

-- USER_CONTACTS (email, phone)
CREATE TABLE user_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                       -- email|phone
  value CITEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_recovery BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_contacts_user ON user_contacts(user_id);
CREATE UNIQUE INDEX uq_user_primary_email ON user_contacts(user_id) WHERE is_primary AND type='email';

-- IMMUTABLE USER STATIC (dob, gender)
CREATE TABLE genders (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL
);
CREATE TABLE user_static (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth DATE,
  gender TEXT REFERENCES genders(code)
);

-- USER STATE HISTORY (mutable profile fields over time)
CREATE TABLE fitness_levels (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL
);
CREATE TABLE user_state_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight NUMERIC(6,2),
  unit TEXT,                               -- kg|lb
  fitness_level TEXT REFERENCES fitness_levels(code),
  training_frequency TEXT,                 -- tokens
  photo_url TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_state_hist_user_time ON user_state_history(user_id, recorded_at DESC);

-- AUTH SESSIONS (refresh tokens store)
CREATE TABLE auth_sessions (
  jti UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);
CREATE INDEX idx_auth_sessions_user ON auth_sessions(user_id);

-- PASSWORD RESET REQUESTS
CREATE TABLE password_reset_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);
CREATE INDEX idx_pw_reset_user ON password_reset_requests(user_id);

-- EXERCISES
CREATE TABLE exercise_categories (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL
);
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT REFERENCES exercise_categories(code),
  muscle_group TEXT,
  tags TEXT[],
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);
CREATE INDEX idx_exercises_owner ON exercises(owner);
CREATE INDEX idx_exercises_public ON exercises(is_public) WHERE is_public = true;

-- SESSIONS
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  planned_for TIMESTAMPTZ,
  recurrence_rule TEXT,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'planned',      -- planned|completed|canceled
  visibility TEXT NOT NULL DEFAULT 'private',  -- private|public
  calories INTEGER,
  points INTEGER,
  attribution_source UUID,                     -- if cloned from another session
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);
CREATE INDEX idx_sessions_owner ON sessions(owner);
CREATE INDEX idx_sessions_visibility ON sessions(visibility);

-- SESSION_EXERCISES
CREATE TABLE session_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  position INTEGER NOT NULL,
  name_snapshot TEXT,  -- preserve historical name
  notes TEXT
);
CREATE INDEX idx_sess_ex_session ON session_exercises(session_id);

-- PLANNED / ACTUAL ATTRIBUTES
CREATE TABLE planned_exercise_attributes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_exercise_id UUID NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
  sets INTEGER,
  reps INTEGER,
  load NUMERIC(8,2),
  distance NUMERIC(8,2),
  duration INTERVAL,
  rpe INTEGER
);
CREATE INDEX idx_planned_se ON planned_exercise_attributes(session_exercise_id);

CREATE TABLE actual_exercise_attributes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_exercise_id UUID NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
  sets INTEGER,
  reps INTEGER,
  load NUMERIC(8,2),
  distance NUMERIC(8,2),
  duration INTERVAL,
  rpe INTEGER
);
CREATE INDEX idx_actual_se ON actual_exercise_attributes(session_exercise_id);

-- POINTS & BADGES
CREATE TABLE user_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,            -- session_completion|admin_adjustment
  algorithm_version TEXT NOT NULL,
  points INTEGER NOT NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_points_user_time ON user_points(user_id, awarded_at DESC);

CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SOCIAL / FEED
CREATE TABLE followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);
CREATE INDEX idx_followers_follower ON followers(follower_id);

-- MEDIA (avatars, photos)
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,            -- user|exercise|session
  target_id UUID,
  file_url TEXT NOT NULL,
  media_type TEXT NOT NULL,             -- image/jpeg|image/png|image/webp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 6.3 Data Retention & Purging Policy
| Entity | Purpose | Retention | Purge/Archive |
|--------|---------|----------:|---------------|
| `auth_sessions` | refresh tokens store | active + 30d | hard‑delete expired |
| `password_reset_requests` | password reset audit | 30d | hard‑delete used/expired |
| `user_state_history` | profile snapshots | 24 months | keep monthly aggregates beyond 24m |
| `sessions`/`session_exercises` | training history | indefinite | user‑initiated delete via GDPR DSR |
| `media` | avatars/photos | 24 months rolling | delete on record removal |

> See PRD §5.7 (GDPR). Exports & deletes via DSR endpoints.

---

### Migration Order

```
001_roles.sql
002_genders.sql
003_fitness_levels.sql
004_contact_types.sql
005_training_freq.sql
006_exercise_categories.sql
007_point_sources.sql
008_badge_types.sql
009_users.sql
010_user_contacts.sql
```

### 6.4 Migration Strategy & Conventions
- **Naming:** `YYYYMMDDHHMM__<description>.ts` (Knex).  
- **Idempotence:** `up`/`down` required; avoid destructive `down` in prod unless safe.  
- **Order:** lookups → users → domain → attributes → social.  
- **Gate:** CI runs `migrate:latest` on temp DB; CD runs migrations before app start; fail fast on error.  
- **Data migrations:** keep separate scripts (e.g., `20251005__seed_lookups.ts`).

- **Conventions.**
  - All timestamps are UTC `TIMESTAMPTZ`.
  - Soft‑delete via `archived_at` for user‑facing content.
  - Name snapshot in `session_exercises` to preserve historical correctness.


### 6.5 Sample Migration Snippets (new)
```ts
// 202510051015__create_roles.ts
export async function up(knex) {
  await knex.schema.createTable('roles', t => {
    t.string('code').primary();
    t.string('description').notNullable();
  });
}
export async function down(knex) {
  await knex.schema.dropTableIfExists('roles');
}
```

---

###  Fixtures Update

Add seed data for all new lookup tables to:
```
/apps/backend/src/db/seeds/lookup.seed.ts
```

Include:
- `roles`
- `genders`
- `fitness_levels`
- `contact_types`
- `training_freq`
- `exercise_categories`
- `point_sources`
- `badge_types`

---

## 7. API Specifications (Schemas & Contracts)

**Standards.** JSON responses, error envelope (see §9). Authentication via cookies (`access`, `refresh`). Idempotent GET; state changes via POST/PUT/PATCH/DELETE with CSRF protection.

### Common Types (TypeScript + zod)

```ts
// src/api/_schemas/common.ts
import { z } from "zod";

export const UUID = z.string().uuid();
export const Timestamp = z.string().datetime();

export const PaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type Paginated<T> = { items: T[]; page: number; pageSize: number; total: number };
```

### 7.1 Auth

```ts
// Register
export const RegisterBody = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(32),
  password: z.string().min(12)
    .regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/)
});

// Login
export const LoginBody = z.object({
  login: z.string(), // username or email
  password: z.string().min(1)
});

// Refresh: cookie-based, no body

// Forgot/Reset
export const ForgotBody = z.object({ email: z.string().email() });
export const ResetBody = z.object({ token: z.string(), newPassword: RegisterBody.shape.password });
```

**Responses (examples).**
```json
// 200 login
{ "user": { "id": "uuid", "username": "kpil", "role": "user" } }

// 200 refresh
{ "access": { "exp": 1699999999 } }
```

### 7.2 Users

```ts
export const UpdateMeBody = z.object({
  alias: z.string().min(1).max(64).optional(),
  avatarUrl: z.string().url().optional(),
  fitnessLevel: z.enum(["beginner","intermediate","advanced"]).optional(),
  trainingFrequency: z.enum(["none","monthly","weekly","daily"]).optional(),
  weight: z.number().min(0).max(500).optional(),
  unit: z.enum(["kg","lb"]).optional()
});
```

### 7.3 Exercises

```ts
export const CreateExerciseBody = z.object({
  name: z.string().min(1).max(128),
  type: z.enum(["cardio","strength","endurance"]).optional(),
  muscleGroup: z.string().max(64).optional(),
  tags: z.array(z.string().max(24)).max(12).optional(),
  isPublic: z.boolean().default(false)
});
```

### 7.4 Sessions

```ts
const ExercisePlan = z.object({
  exerciseId: UUID.optional(),
  name: z.string().min(1).max(128), // snapshot if custom
  position: z.number().int().min(0),
  planned: z.object({
    sets: z.number().int().min(0).nullable(),
    reps: z.number().int().min(0).nullable(),
    load: z.number().min(0).nullable(),
    distance: z.number().min(0).nullable(),
    durationSec: z.number().int().min(0).nullable(),
    rpe: z.number().int().min(1).max(10).nullable()
  })
});

export const CreateSessionBody = z.object({
  title: z.string().min(1).max(128),
  plannedFor: z.string().datetime().optional(),
  recurrenceRule: z.string().max(256).nullable().optional(),
  visibility: z.enum(["private","public"]).default("private"),
  exercises: z.array(ExercisePlan).min(1)
});

export const CompleteSessionBody = z.object({
  actuals: z.array(z.object({
    sessionExerciseId: UUID,
    sets: z.number().int().min(0).nullable(),
    reps: z.number().int().min(0).nullable(),
    load: z.number().min(0).nullable(),
    distance: z.number().min(0).nullable(),
    durationSec: z.number().int().min(0).nullable(),
    rpe: z.number().int().min(1).max(10).nullable()
  }))
});
```

### 7.5 Progress

Query parameters:
```
GET /progress/summary?from=ISO&to=ISO&category=strength|cardio|...
GET /progress/charts?interval=week|month|year
```

### 7.6 Points

```
GET /points
GET /points/history?page=1&pageSize=20
```

### 7.7 Feed

```
GET  /feed
POST /feed/:id/clone
```

---

## 8. Configuration & Environment

**Table T3 — Environment variables**
| Name | Required | Example | Note |
| --- | --- | --- | --- |
| `NODE_ENV` | yes | `production` | `development|test|production` |
| `PORT` | yes | `8080` | Express listen port |
| `DATABASE_URL` | yes | `postgres://...` | Knex connection |
| `JWT_PRIVATE_KEY` | yes | `-----BEGIN PRIVATE KEY-----...` | RS256 signing key |
| `JWT_PUBLIC_KEY` | yes | `-----BEGIN PUBLIC KEY-----...` | JWKS |
| `REFRESH_TTL_DAYS` | yes | `14` | refresh expiry |
| `ACCESS_TTL_MINUTES` | yes | `15` | access expiry |
| `CORS_ORIGIN` | yes | `https://app.fitvibe` | allowlist |
| `SESSION_COOKIE_DOMAIN` | yes | `.fitvibe` | cookie scoping |
| `SMTP_URL` | yes | `smtp://user:pass@host:587` | mail transport |
| `MAIL_FROM` | yes | `no-reply@fitvibe.app` | from header |
| `UPLOADS_DIR` | dev | `./uploads` | dev only |
| `OBJECT_STORAGE_URL` | prod | `s3://bucket` | prod only |

**zod env schema sketch**
```ts
export const Env = z.object({
  NODE_ENV: z.enum(["development","test","production"]),
  PORT: z.coerce.number().int().min(1),
  DATABASE_URL: z.string().url(),
  JWT_PRIVATE_KEY: z.string().min(100),
  JWT_PUBLIC_KEY: z.string().min(40),
  REFRESH_TTL_DAYS: z.coerce.number().int().positive(),
  ACCESS_TTL_MINUTES: z.coerce.number().int().positive(),
  CORS_ORIGIN: z.string(),
  SESSION_COOKIE_DOMAIN: z.string(),
  SMTP_URL: z.string(),
  MAIL_FROM: z.string().email(),
  UPLOADS_DIR: z.string().optional(),
  OBJECT_STORAGE_URL: z.string().optional(),
});
```

---

## 9. Error Handling & Logging

**Error envelope** (Table T2):
```json
{
  "error": {
    "code": "string",          // e.g., "AUTH_INVALID_CREDENTIALS"
    "message": "human readable",
    "details": { "field": "..." }, // optional structured context
    "requestId": "uuid"        // correlation id
  }
}
```
**HTTP ↔ code mapping.**
- `400` → `VALIDATION_ERROR`
- `401` → `AUTH_REQUIRED` / `AUTH_INVALID_CREDENTIALS`
- `403` → `FORBIDDEN`
- `404` → `NOT_FOUND`
- `409` → `CONFLICT`
- `422` → `UNPROCESSABLE`
- `429` → `RATE_LIMITED`
- `500` → `INTERNAL`

**Logging.**
- Use pino JSON; include `requestId`, `userId` if available. No PII.  
- Access logs via morgan combined format → pipe into pino.

---

## 10. Security Implementation

- **Middleware order:** `helmet` → `cors` → `rateLimit` → `cookieParser` → `csrfProtection` (for state changes) → routes.  
- **CORS:** strict origin; allow credentials.  
- **Cookies:** `httpOnly`, `Secure` (prod), `SameSite=Lax`, domain from env.  
- **JWT:** RS256; claims `{ sub, iat, exp }`. JWKS at `/.well-known/jwks.json`.  
- **Refresh rotation:** on each `/auth/refresh` request; revoke old `jti`.  
- **CSRF:** token double‑submit or header for non‑GET with cookie auth.  
- **Brute force:** 10 failed attempts → exponential backoff; optional CAPTCHA.  
- **Password reset:** tokens expire ≤15m; invalidate sessions on reset.  
- **Backups & retention:** see DB; DSR endpoints for export/delete.  

---

### 10.1 Threat Model & Mitigations
| Threat Vector | Impact | Mitigation | Validation |
|---------------|--------|------------|------------|
| Password brute force | Account takeover | rate limit, bcrypt cost 12, lockout after 10 fails | security tests |
| JWT theft/replay | Session hijack | `httpOnly` cookies, short access TTL, rotated refresh, IP/UA anomaly check (opt) | E2E + pen test |
| CSRF | Unauthorized state change | CSRF token + SameSite | integration tests |
| SQL injection | Data breach | Knex param binding, no string‑concat | unit tests |
| XSS via reflected messages | Token leakage | CSP via Helmet, no user data in logs | dynamic scanning |
| Sensitive logs | GDPR/PII risk | pino redaction, no secrets/PII | log review |

### 10.2 Dependency Scanning & SBOM
- **CI steps:** `npm audit --production`, `npx @cyclonedx/cyclonedx-npm` to generate SBOM.  
- **Policy:** fail build on high‑severity CVEs; weekly dependency refresh PR.

---

## 11. Testing & Validation Plan

**Targets.** Coverage ≥ **80%** lines/branches; CI fails below threshold.

**Table T5 — Test Strategy**
| Type | Scope | Notes |
| --- | --- | --- |
| Unit | Services & Utils | mock repos, time, mailer |
| Integration | API + DB | Supertest + seeded Postgres container |
| Contract | zod schemas | ensure request/response conformity |
| Security | auth flows | brute force, CSRF, CORS, cookie flags |
| Migration | DB migrations | up/down consistency, idempotence |
| E2E (opt) | Staging smoke | happy paths: register→login→plan→complete |

**Fixtures.** `tests/setup/jest.setup.ts` boots env; `tests/db/sanity.test.ts` pings DB & checks schema.  
**Data.** Minimal seeds for lookups: roles, genders, fitness_levels, exercise_categories.

---

### 11.1 Test Matrix
| Feature | Unit | Integration | Contract | Security | E2E | Perf |
|--------|:----:|:-----------:|:--------:|:--------:|:---:|:---:|
| Auth (register/login/refresh) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Users (profile update) | ✅ | ✅ | ✅ | — | ✅ | — |
| Exercises (CRUD) | ✅ | ✅ | ✅ | — | ✅ | — |
| Sessions (plan/complete) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Points (award & history) | ✅ | ✅ | ✅ | — | — | ✅ |
| Feed (list/clone) | ✅ | ✅ | ✅ | — | ✅ | — |

### 11.2 Mocking Strategy
- **Mailer:** mock transport (nodemailer `streamTransport`) capturing payloads.  
- **DB:** unit tests stub repositories; integration uses ephemeral Postgres container.  
- **Time & UUID:** inject clock/ID providers for deterministic tests.  
- **External storage:** local FS adapter in test; no network I/O.

### 11.3 Performance & Load Testing
Use **k6** or **Artillery** to validate NFRs (PRD §NFR). Targets: `p95 < 300ms`, `p99 < 600ms` for key endpoints under 100 rps; error rate < 0.1%.

---

## 12. Deployment & CI/CD (Runtime Topology)

- **Containers:** backend, frontend, nginx, postgres, (certbot), (redis future).  
- **Ports:** nginx :80/:443 → backend :8080.  
- **Start order:** postgres → migrations → backend → nginx.  
- **Healthcheck:** `/health` returns 200 for compose & CD gate.  
- **Images:** GHCR tagged with `sha-<commit>` and semver.  
- **Rollback:** keep previous image; CD path supports rollback on failed health.

---

### 12.1 Pipeline & Promotion Flow
```mermaid
flowchart LR
  A[Commit/PR] --> CI[CI: Lint • Type • Test • Build • SBOM • Docker]
  CI --> REG[Push image to GHCR]
  REG --> STG[Deploy Staging]
  STG --> TESTS[Smoke + E2E + Migrations + Perf sample]
  TESTS -->|manual gate| PRD[Deploy Production]
  PRD --> HCHK[/Health + /metrics gate/]
```

---

### 12.2 Rollback Strategy
- Keep last two prod images; `docker compose pull <prev>` + redeploy.  
- DB: schema changes must be backward‑compatible; use **expand/contract** pattern; avoid destructive `down` in prod.  
- Feature flags to instantly disable faulty modules.

---

### 12.3 Feature Flags
- Use env‑based toggles for Phase‑2 endpoints (hidden by default).  
- Optional: adopt a small flag utility (`process.env.FEATURE_X === "true"`).

---

## 13. Operability (Runbooks)

- **Rotate JWT keys:** generate new pair → add to env → publish JWKS (multi‑kid) → deploy → retire old after grace.  
- **Revoke user sessions:** `DELETE FROM auth_sessions WHERE user_id = $1`.  
- **GDPR delete:** queue deletion → hard delete PII tables → anonymize references → propagate to backups per policy.  
- **Restore test:** quarterly restore into staging; validate `/health`, auth, sample flows.

---

### 13.1 Monitoring with Prometheus & Grafana (new)
- **Prometheus client:** `prom-client` in Node.  
- **Endpoint:** `GET /metrics` (no auth, IP‑allowlist at NGINX).  
- **Grafana dashboards:** HTTP latency histograms, error rates, throughput, DB pool stats.  
- **Alerts:** p95 latency > 600ms 5m; 5xx rate > 1% 5m; DB connection saturation > 80% 10m.

**Code sketch:**
```ts
import client from "prom-client";
const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request latency",
  labelNames: ["method","route","status_code"],
  buckets: [0.05,0.1,0.2,0.5,1,2,5]
});
register.registerMetric(httpRequestDuration);

// Express middleware
app.use((req,res,next)=>{
  const end = httpRequestDuration.startTimer({ method:req.method, route:req.path });
  res.on("finish", () => end({ status_code: String(res.statusCode) }));
  next();
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});
```

### 13.2 Metrics Catalog (new)
| Metric | Type | Labels | Purpose |
|--------|------|--------|---------|
| `http_request_duration_seconds` | Histogram | method, route, status_code | API latency |
| `http_requests_total` | Counter | method, route, status_code | Throughput |
| `auth_login_fail_total` | Counter | reason | Security visibility |
| `sessions_completed_total` | Counter | | Product KPI |
| `db_pool_in_use` | Gauge | | DB saturation |
| `process_cpu_user_seconds_total` | Counter | | Host health |

### 13.3 Log Aggregation (Loki) (new)
- **Stack:** Promtail → **Loki** → **Grafana**.  
- **Format:** pino JSON; fields: `ts, level, msg, requestId, userId, module`.  
- **Retention:** 14–30 days depending on volume; privacy filter (no PII).

---

## 14. NFR Mapping (from PRD → TDD)

- **Performance:** p95 < 300ms (API). Practices: DB indexes, lean payloads, caching readiness.  
- **Availability:** SLO 99.5%/month; stateless API + containers; health‑gated deploys.  
- **Security & Privacy:** JWT rotation, CSRF, cookie flags, GDPR DSR endpoints.  
- **Accessibility:** Mostly FE concern; BE supports i18n tokens (future).  
- **Observability:** structured logs, correlation IDs, metrics/alerts hooks.  
- **Backup/DR:** daily encrypted backups; RPO ≤24h, RTO ≤4h.

---

## 15. Glossary

**DTO:** Data Transfer Object.  
**DSR:** Data Subject Rights (GDPR).  
**JWKS:** JSON Web Key Set (public keys exposure).  
**JTI:** JWT ID (unique refresh token id).  
**RPO/RTO:** Recovery Point/Time Objective.  
**SLO:** Service Level Objective.  

---

### Appendix A — Endpoint Catalog (MVP)

| Module | Endpoint | Method | Auth |
| --- | --- | --- | --- |
| System | `/health` | GET | — |
| Auth | `/auth/register` | POST | — |
|  | `/auth/login` | POST | — |
|  | `/auth/refresh` | POST | cookie |
|  | `/auth/logout` | POST | cookie |
|  | `/auth/password/forgot` | POST | — |
|  | `/auth/password/reset` | POST | — |
| Users | `/users/me` | GET | access |
|  | `/users/me` | PUT | access |
| Exercises | `/exercises` | GET | access |
|  | `/exercises` | POST | access |
|  | `/exercises/:id` | PUT | access |
|  | `/exercises/:id` | DELETE | access |
| Sessions | `/sessions` | GET | access |
|  | `/sessions` | POST | access |
|  | `/sessions/:id/complete` | PATCH | access |
| Progress | `/progress/summary` | GET | access |
|  | `/progress/charts` | GET | access |
| Points | `/points` | GET | access |
|  | `/points/history` | GET | access |
| Feed | `/feed` | GET | access (optional) |
|  | `/feed/:id/clone` | POST | access |

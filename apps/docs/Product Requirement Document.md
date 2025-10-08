# Product Requirements Document (PRD)

**Product:** FitVibe – Training Planner & Logger Web App  
**Author:** Konstantinos  
**Revision:** v1.0  
**Date:** 2025.10.03

---

## Table of Contents

# Table of Contents

1. **Vision**

2. **Context, Scope & Goals**  
   - 2.1 Goals  
   - 2.2 Scope (MVP)  
   - 2.3 Future Improvements  

3. **Users & Use Cases**  
   - 3.1 Personas  
   - 3.2 Core Use Cases  

4. **Functional Requirements (FR)**  
   - FR-1 User Management & Security  
   - FR-2 Profile & Settings  
   - FR-3 Exercise Library  
   - FR-4 Sessions  
   - FR-5 Progress & Analytics  
   - FR-6 Points System  
   - FR-7 Sharing & Community  

5. **Non-Functional Requirements (NFR)**  
   - 5.1 Security  
   - 5.2 Privacy & GDPR  
   - 5.3 Performance  
   - 5.4 Availability  
   - 5.5 Accessibility  
   - 5.6 Observability  
   - 5.7 Backup & Disaster Recovery  
   - 5.8 Modularity & Extensibility  
   - 5.9 Security Threat Model (MVP)

6. **Technology**  
   - 6.1 Technology → Purpose Map (canonical)  
   - 6.2 Rationale  
   - 6.3 Frontend Stack  
   - 6.4 Backend Stack  
     - 6.4.1 API Route Overview (MVP)  
     - 6.4.2 Layer Contracts  
     - 6.4.3 Error Handling Specification  
     - 6.4.4 Testing Approach  
     - 6.4.5 Migration Conventions  
     - 6.4.6 Logging & Monitoring Middleware  
   - 6.5 Database & Persistence  
   - 6.6 Infrastructure & DevOps  
   - 6.7 Configuration & Secrets  
   - 6.8 Environments  
   - 6.9 Build & Release  
   - 6.10 Observability & Monitoring  
   - 6.11 Data Protection & Privacy  
   - 6.12 Monorepo Tooling  
   - 6.13 Operability Runbooks  
   - 6.14 Internationalization & Localization (i18n / l10n)

7. **Data Model & Structures**  
   - 7.1 Design Principles  
   - 7.2 Core Entities  
   - 7.3 Lookup Tables  
   - 7.4 Lookup Normalization Tables  

8. **User Experience (UX)**  
   - 8.1 Key Screens  
   - 8.2 UX Design Principles  
   - 8.3 User Journeys  
   - 8.4 Visual Design System  
     - 8.4.1 Design Philosophy  
     - 8.4.2 Brand Color System  
     - 8.4.3 Depth & Shadow System  
     - 8.4.4 Light / Dark Mode Specification  
     - 8.4.5 Component Style Tokens  
     - 8.4.6 Logo & Brand Symbolism  
     - 8.4.7 Typography System  
     - 8.4.8 Accessibility & Contrast  

9. **Authentication Lifecycle**  
   - 9.1 Account Creation  
   - 9.2 Login  
   - 9.3 Session Management  
   - 9.4 Logout  
   - 9.5 Password Management  
   - 9.6 Token & Key Management  
   - 9.7 Account Recovery & Deletion  
   - 9.8 Future Extensions  
   - 9.9 Authentication Security Risk Table  

10. **Backlog Items**  
    - 10.1 Backend Backlog  
    - 10.2 Frontend Backlog  

11. **Project Structure**  
    - 11.1 Rationale  
    - 11.2 CI/CD Workflow  
    - 11.3 Contribution Guidelines  

12. **Glossary**


---

## List of Tables

| Table No. | Title                              | Section |
| --------- | ---------------------------------- | ------- |
| Table 6.1 | Technology Stack (Master Table)    | 6.1     |
| Table 9.1 | Authentication Security Risk Table | 9.9     |

---

## List of Figures and Graphs

| Figure No.  | Title                                                         | Section |
| ----------- | ------------------------------------------------------------- | ------- |
| Figure 6.1  | High-Level Architecture (Mermaid)                             | 6.1     |
| Figure 7.1  | Entity Relationship Diagram (ERD)                             | 7       |
| Figure 8.1  | User Journey: Registration & Account Activation               | 8.3     |
| Figure 8.2  | User Journey: Plan & Log a Session                            | 8.3     |
| Figure 8.3  | User Journey: Discover & Clone a Session                      | 8.3     |
| Figure 8.4  | User Journey: Update Profile or Archive Account (with Errors) | 8.3     |
| Figure 8.5  | User Journey: Update Profile or Archive Account               | 8.3     |
| Figure 9.1  | Authentication Lifecycle Diagram                              | 9       |
| Figure 11.1 | CI/CD Workflow Diagram                                        | 11.2    |

---

## 1. Vision

FitVibe is a platform where users can upload and plan training sessions expanding over all domains of fitness:

- Strength: olympic weightlifting, powerlifting, strongman, body building
- Agility: juggling, climbing, bouldering, calisthenics, gymnastics, parkour,
- Endurance: running, hiking, cycling, rowing, jump rope
- Speed and explosivity: Sprints, jumps, throws or
- Hybrid exercises: boxing, hyrox

It enables individuals to **plan, log, share, and track** their training sessions with a clear, accessible, and responsive interface. The system is designed with a **modular, scalable architecture** and strict **separation of concerns**, ensuring sustainable growth and easy extensibility (e.g., nutrition tracking, wearables integration, AI recommendations).

The system shall follow a **security-first design** and guarantee full **GDPR compliance**, including privacy-by-default settings and user-controlled data management.  
Accessibility shall be central, following **WCAG 2.1 AA standards**, providing a barrier-free experience across devices and user groups.

---

## 2. Context, Scope, and Goals

### 2.1 Goals

The system shall:

- Provide an **easy-to-use interface** for planning and logging training sessions.
- Enable **fast entry and retrieval** of exercises and sessions.
- Facilitate **sharing and community engagement** with robust privacy controls.
- Offer **progress tracking** with historical data and analytics.
- Deliver a **gamified experience** via a hidden points system.
- Ensure an **accessible and responsive UI** (WCAG 2.1 AA).
- Guarantee **security-first user management** (2FA, brute-force protection, password policy).
- Support **scalability and modularity** for future enhancements.

### 2.2 Scope (MVP)

**In Scope (MVP):**

- User accounts, profiles, and secure authentication.
- Personal Exercise library: Every authenticated user can create and manage their own custom exercises.
- Global Exercise library: Admins can still edit or delete system-wide (shared) exercises, but users can add personal ones that appear only in their own planner/logger.
- Planning and logging sessions, as series of exercises done one-after-the-other.
- Points awarded upon session completion.
- Progress dashboard (history and charts).
- Public feed of sessions with privacy controls.
- Foundation-level admin dashboards for moderation.
- English (**en**) and German (**de**) static translations for all UI and system text.  
- Language detection based on browser preference or user profile.  
- Locale-aware date, number, and unit formatting.  
- Automatic AI translation of user-generated content (feed, sessions, comments) via external API (OpenAI).  
- Caching of translated texts for performance and cost control.  

**Out of Scope (MVP):**

- Third-party integrations (Garmin/Strava).
- Nutrition tracking and body composition analytics.
- AI coach and adaptive recommendations.
- Real-time chat or advanced social features (likes, comments, leaderboards).
- Native mobile apps (progressive web app acceptable for MVP).
- Manual translation workflows or in-app translation editing.  
- Voice or speech translation.  
- RTL (right-to-left) language support.

### 2.3 Future Improvements (Post-MVP)

- Third-party wearable integrations (Garmin/Strava).
- Real-time chat and social graph.
- Nutrition tracking and advanced body analytics.
- AI-based training recommendations.
- Expanded gamification (badges, leaderboards, streaks).

---

## 3. Users and Use Cases

### 3.1 Personas

- **Member (Athlete):**

  - Plans and logs workouts.
  - Reviews progress.
  - Attains points and badges.
  - Shares sessions.

- **Administrator:**

  - Moderates content.
  - Manages selectable values.
  - Monitors community rule violations.

- **Follower:**
  - Watches the progress of athletes.
  - Gives feedback on logged sessions.
  - Comments on logged sessions and exercises.

### 3.2 Core Use Cases

The system shall enable users to:

1. **Plan a session** with exercises and attributes; save as draft or scheduled.
2. **Log a session**; record actual performance; mark complete; receive points.
3. **Browse the feed**; view or clone public sessions into the planner.
4. **Manage accounts**; edit profile, avatar, and security settings; export or delete data.
5. **Administer the platform**; configure selectable lists, review reports, moderate community content.

---

## 4. Functional Requirements (FR)

> Each FR includes **Acceptance Criteria (AC)** and, where relevant, **Error Behaviors (EB)**.

#### FR-1 User Management & Security

- **Registration** with verified email (15-minute TTL token, 3 resend/hour, auto-purge in 7 days).
  - **AC:** Duplicate usernames rejected (case-insensitive).
- **Login** with username/password; optional 2FA (TOTP + backup codes).
  - **EB:** Generic error messages, no user enumeration.
- **Password policy:** ≥12 chars, must include upper, lower, number, symbol.
- **Brute force protection:** max 10 failed attempts → exponential backoff, lock, optional CAPTCHA, user notified.
- **Logout** invalidates refresh session (rotated per use, revoked by `jti`).
- **Password reset** via single-use link (15 min TTL, audit logged).
- **Account deletion (GDPR):** hard deletion within 30 days (with exceptions for audit/legal); queued deletion from backups.
- **Data export:** JSON of profile, sessions, exercises, points (link valid 24h).
- **Roles & authorization:** `user` (default) and `admin`, enforced server-side.

#### FR-2 Profile & Settings

- **Editable:** alias, weight (+unit), fitness level, avatar (max 5MB jpeg/png/webp).
- **Immutable:** date of birth, gender (man, woman, diverse, prefer not to say).
- **Training frequency** stored for personalization.
- **Avatar:** 128×128 preview, placeholder if absent.

#### FR-3 Exercise Library

- Create, edit, archive exercises with attributes (name, category: cardio/strength/power-endurance, muscle group, tags).
- **Default visibility:** private; public exercises discoverable.
- Safe delete = archive (hidden from selectors, retained for history).
- **Reuse across sessions:** snapshot of name retained in session_exercises for historical accuracy.

#### FR-4 Sessions

- **Plan sessions** for specific date/time or recurring template (time-zone aware, DST safe).
- **Log actuals**; mark completed/canceled; compare planned vs actual.
- **Clone & modify** own or public sessions (attribution retained).
- **Visibility:** private (default) or public; switching never leaks past data.
- **Archival:** sessions archived, not deleted, for historical traceability.

#### FR-5 Progress & Analytics

- **History view** with filters (date, category, visibility).
- **Charts**: volume, duration, distance, intensity, frequency.
- **Summaries**: weekly, monthly, yearly.
- **Personal bests & streaks** tracked.

#### FR-6 Points System

- Awarded server-side upon session completion.
- Formula inputs: calories (if available), age, gender, fitness level, frequency, RPE.
- **AC:** Users see awarded points only, not formula.
- Anti-gaming: bounds checking, device/IP heuristics; manual admin adjustments logged.

#### FR-7 Sharing & Community

- Authenticated feed of public sessions with search/sort.
- Clone public sessions into planner (attribution preserved).
- Reporting & moderation placeholders (future admin UI).
- **Policy:** default privacy is private; community guidelines apply.

#### FR-8 Internalisation (i18n)

- **Language Detection**: The system shall detect the user’s preferred language via browser headers or stored profile preference.
- **Static UI Translation**: All visible system UI elements shall be translated using predefined token dictionaries (JSON resources).
- **Dynamic AI Translation**: User-generated text (e.g., session title, description, comments) shall be translated dynamically on request using an AI translation service.
- **Fallback**: If a translation for a token or text is unavailable, the system shall display the original English text.
- **Locale Formatting**: Dates, numbers, and units shall follow the selected locale conventions.
- **Caching**: The backend shall cache translated texts to reduce latency and API cost.
- **Privacy**: AI translation requests shall exclude personally identifiable information and respect GDPR principles.
- **User Preference Persistence**: The user’s preferred language shall be stored in their profile and applied on login.
---

## 5. Non-Functional Requirements (NFR)

### 5.1 Security

- **Authentication & Tokens:**
  - Passwords hashed with bcryptjs + per-user salts.
  - JWT (RS256) short-lived access tokens (≤15 min).
  - Server-stored refresh tokens with rotation (`jti`), revocation on logout.
- **Account Protection:**
  - 2FA (TOTP + backup codes).
  - Brute force protection: max 10 failed attempts → exponential backoff, lock, CAPTCHA fallback.
  - Email verification mandatory; unverified accounts purged after 7 days.
- **Transport & Session Security:**
  - HTTPS enforced; TLS termination via NGINX + Certbot.
  - httpOnly, `Secure`, `SameSite` cookies for session storage.
  - CSRF protection for all state-changing requests.
- **Infrastructure Security:**
  - Helmet, CORS allowlist, request logging (morgan).
  - Secrets managed via environment variables; rotation procedure documented.

### 5.2 Privacy & GDPR

- GDPR compliance: legal basis (contract), privacy notice, opt-in for analytics.
- Data Subject Rights (access, rectification, portability, deletion) implemented.
- Hard deletion of personal data within 30 days (with legal/audit exceptions).
- Deletion propagates to encrypted backups within 30 days.
- Data minimization and entity-specific retention policies.

### 5.3 Performance

- Backend API response: **p95 < 300 ms** under nominal load.
- Frontend rendering: **Largest Contentful Paint (LCP) < 2.5 s** on mid-tier device over 4G.
- Performance budgets defined and tracked in CI.
- Error rate: **< 0.1 %** sustained.  
- Each release shall validate these KPIs via automated k6 load tests.

### 5.4 Availability

- Service Level Objective (SLO): **99.5% monthly availability**.
- Error budget tracked to inform release management and reliability improvements.
- Stateless API and containerized infra support horizontal scaling.

### 5.5 Accessibility

- Conforms to **WCAG 2.1 AA**.
- Keyboard navigation, ARIA labels, and color-blind safe palettes.
- Responsive, barrier-free design across devices.

### 5.6 Observability

- Structured, non-PII logs with correlation IDs.
- Dashboards for latency (p95), error rate, and auth failures.
- Alerts for 5xx spikes, DB pool saturation, and security anomalies.

### 5.7 Backup & Disaster Recovery (DR)

- Daily encrypted backups of all critical data.
- **Recovery Point Objective (RPO): ≤24h**.
- **Recovery Time Objective (RTO): ≤4h**.
- Quarterly restore tests ensure backup integrity.

### 5.8 Modularity & Extensibility

- Strict separation of concerns (frontend, backend, infra).
- API-first design with versioning (`/api/v1`).
- Extensible architecture to support nutrition, wearables, AI coaching, and leaderboards.

### 5.9 Security Threat Model (MVP)

The system shall follow a structured threat-mitigation model aligned with OWASP Top 10 (2021).  
Each vector is mitigated through preventive and detective controls at application, infrastructure, and process level.

| ID  | Threat / Attack Vector            | Risk Description                                                                  | Mitigation                                                                                                                       | OWASP Top 10 Ref                                               |
| --- | --------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| R1  | Brute-force login attempts        | Automated password guessing against login endpoint.                               | - **Rate limiting** per IP & account.<br>- Optional CAPTCHA after repeated failures.<br>- Strong password policy.                | A07: Identification & Authentication Failures                  |
| R2  | Password theft / hash cracking    | Stolen DB dump used to brute-force weak hashes offline.                           | - **bcryptjs** with per-user salt.<br>- Enforce password complexity.<br>- Credential rotation policy.                            | A02: Cryptographic Failures                                    |
| R3  | Token theft (XSS / localStorage)  | Stolen JWT access/refresh tokens misused for API access.                          | - Store tokens in **httpOnly Secure cookies**.<br>- Short-lived access tokens (≤15 min).<br>- Refresh token rotation with `jti`. | A07: Identification & Authentication Failures / A03: Injection |
| R4  | Refresh token replay              | Attacker reuses stolen refresh token to obtain new access tokens.                 | - **Refresh token rotation** (rotate on every use).<br>- Server-stored tokens with `jti`.<br>- Revoke on anomaly/logout.         | A07: Identification & Authentication Failures                  |
| R5  | Cross-Site Request Forgery (CSRF) | Unauthorized state-changing requests executed via victim’s authenticated session. | - **SameSite=Lax cookies**.<br>- CSRF protection middleware.<br>- Validate `Origin`/`Referer` headers.                           | A05: Security Misconfiguration / A08: CSRF                     |
| R6  | Cross-Site Scripting (XSS)        | Injected JS steals cookies or manipulates DOM.                                    | - **httpOnly cookies**.<br>- **CSP headers**.<br>- React DOM sanitization.<br>- Input validation.                                | A03: Injection                                                 |
| R7  | Session fixation                  | Attacker forces victim to use a known session token.                              | - **Refresh tokens rotated** at login.<br>- Invalidate sessions on password change or logout.                                    | A07: Identification & Authentication Failures                  |
| R8  | Man-in-the-Middle (MITM)          | Network interception of credentials or tokens.                                    | - **HTTPS only** via NGINX.<br>- TLS 1.2+ enforced.<br>- **HSTS** headers enabled.                                               | A02: Cryptographic Failures                                    |
| R9  | Account takeover via reset        | Weak password reset exploited to gain control of accounts.                        | - **One-time reset tokens** (expire ≤15 min).<br>- Verified email links.<br>- Reset invalidates sessions.                        | A07: Identification & Authentication Failures                  |
| R10 | Privilege escalation              | Attacker bypasses or manipulates role checks.                                     | - **RBAC enforced server-side**.<br>- Minimal JWT claims.<br>- Backend validates roles, not client.                              | A01: Broken Access Control                                     |
| R11 | Data leakage via logs             | Sensitive data (tokens, passwords, PII) written to logs.                          | - **Structured logging** (pino/winston).<br>- Exclude PII.<br>- Use correlation IDs only.                                        | A09: Security Logging & Monitoring Failures                    |
| R12 | Denial of Service (DoS)           | Flood of requests exhausts server or DB resources.                                | - **Rate limiting**.<br>- Optional **Redis counters** (future scaling).<br>- Autoscaling (future).                               | A06: Vulnerable & Outdated Components / A08: DoS               |

---

## 6. Technology

The technology stack is summarized in **Table 6.1**.  
The high-level architecture is illustrated in **Figure 6.1**.

This section describes the technology choices that underpin **FitVibe’s architecture**.  
It is divided into four subsections for clarity and separation of concerns:

1. **Backend Technology** – Application runtime, frameworks, libraries, and server-side logic.
2. **Frontend Technology** – User interface stack, styling, and accessibility libraries.
3. **Data Technology** – Database engine, schema design, and persistence tooling.
4. **Infrastructure Technology** – Deployment, CI/CD, monitoring, and scaling.

The objective is to define a **developer-ready technology baseline**, ensuring consistency across the stack, maintainability, and scalability.

## 6.1 Technology → Purpose Map (canonical)

### Technology Stack (Master Table)

| Category                          | Technologies & Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend (Runtime & UI)**       | - **React 18 + Vite** (SPA shell, fast dev/prod builds)<br>- **React Router DOM** (client routing)<br>- **Axios** with interceptor (`401 → /auth/refresh`)<br>- **State Management**: Zustand (lightweight) or Redux (global orchestration); optional React Query for caching & background refetch<br>- **TailwindCSS** (design system, theming tokens)<br>- **Recharts** (charts for dashboards)<br>- **Lucide React** (icons)<br>- **Accessibility**: WCAG 2.1 AA, ARIA, keyboard navigation<br>- **Internationalization (future)**: EN/DE tokens |
| **Backend (Runtime & Framework)** | - **Node.js 20 LTS + Express** with modular routers (`auth`, `users`, `exercises`, `sessions`, `progress`, `points`, `feed`)<br>- **Knex.js** for SQL queries, migrations, seeds<br>- **bcryptjs** for password hashing<br>- **jsonwebtoken (RS256)** for short-lived access tokens<br>- **Refresh tokens**: server-stored, rotated by `jti`, revocable on logout<br>- Optional **TOTP 2FA** with backup codes                                                                                                                                      |
| **Authentication & Security**     | - **Helmet** for HTTP headers<br>- **CORS allowlist** (env-configured)<br>- **express-rate-limit** (per-IP & per-account throttling, optional CAPTCHA)<br>- **CSRF protection** middleware<br>- **httpOnly Secure cookies** for refresh/session<br>- **compression** for gzip responses                                                                                                                                                                                                                                                             |
| **Validation & Config**           | - **zod** for request DTO and environment schema validation<br>- **dotenv** for environment variables<br>- Strict schema enforcement (`NODE_ENV`, `DATABASE_URL`, `JWT_PRIVATE_KEY`, etc.)                                                                                                                                                                                                                                                                                                                                                          |
| **Database & Persistence**        | - **PostgreSQL 18** (primary relational datastore)<br>- **Knex.js** migrations (`YYYYMMDDHHMM__*.ts`)<br>- Constraints & indexes (e.g., `lower(username)`, partial indexes, FK cascades)<br>- Soft deletes (`deleted_at`, `archived_at`)<br>- **Backups**: daily encrypted, RPO ≤ 24h, RTO ≤ 4h<br>- **Retention policies** per entity, optional anonymization for analytics                                                                                                                                                                        |
| **File & Media Storage**          | - Local `/uploads` in dev<br>- Cloud storage (**AWS S3 / GCS**) in production<br>- Excluded from Git/Docker<br>- Optional virus scanning hook<br>- Future: avatar uploads, media constraints (JPEG/PNG/WebP ≤ 5 MB)                                                                                                                                                                                                                                                                                                                                 |
| **Email & Notifications**         | - Provider-agnostic mailer abstraction (**SMTP, SES, SendGrid, etc.**)<br>- Used for verification, password reset<br>- Backlog: unified notification system (email + push)                                                                                                                                                                                                                                                                                                                                                                          |
| **Background Jobs & Caching**     | - **Redis** for caching + rate-limit counters (Phase 2+)<br>- **BullMQ / Temporal.io** for async jobs (emails, reports, recalculations, imports)<br>- Retry handling for transient failures +                                                                                                                                                                                                                                                                                                                                                       |
| **Testing Framework**             | **Jest + ts-jest** — unit and integration testing framework for backend and shared packages. Optional Cypress/Playwright for E2E in staging.                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Logging & Monitoring**          | - **pino** or **winston** for structured logs<br>- **morgan** for HTTP request logs<br>- Correlation/request IDs propagated FE→BE<br>- GDPR-compliant (exclude PII)<br>- **Metrics dashboards** (latency p95/p99, auth failures, DB saturation)<br>- **Alerting** on 5xx spikes, auth failures<br>- Tracing enabled                                                                                                                                                                                                                                 |
| **Infrastructure & DevOps**       | - **NGINX** reverse proxy (static assets, HTTPS redirect, HSTS)<br>- **Certbot (Let’s Encrypt)** TLS automation & renewal<br>- **Docker / Docker Compose** (multi-stage builds, reproducible dev/prod)<br>- **GitHub Actions CI**: checkout → install (pnpm) → lint → test → build → Docker push (GHCR)<br>- **GitHub Actions CD**: manual approval → SSH deploy → `docker compose up -d`                                                                                                                                                           |
| **Environments**                  | - **Local (dev):** hot reload, verbose logs, seeded demo data<br>- **Staging (optional):** mirrors prod, pre-release validation<br>- **Production:** optimized builds, strict CORS, reduced logs, monitoring enabled                                                                                                                                                                                                                                                                                                                                |
| **Build & Release**               | - **Versioning:** `/api/v1` base path with deprecation policy<br>- **Artifacts:** Docker images tagged with commit SHA + semver<br>- **Rollback:** compose retains last good image<br>- **Static assets:** frontend built assets served by NGINX with cache headers                                                                                                                                                                                                                                                                                 |
| **Data Protection & Privacy**     | - **GDPR compliance**: DSR endpoints (export/delete), privacy notice, minimization<br>- **Cookies:** httpOnly, Secure, SameSite=Lax<br>- Upload scanning optional, user-controlled data management                                                                                                                                                                                                                                                                                                                                                  |
| **Monorepo Tooling**              | - **pnpm workspaces** for dependency mgmt<br>- **turbo** (optional) for task caching & parallelism<br>- **ESLint & Prettier** configs at root<br>- **TypeScript** base config (`tsconfig.base.json`)                                                                                                                                                                                                                                                                                                                                                |

---

### High-Level Architecture

```mermaid
flowchart TB
    %% =========================================================
    %% Styles
    %% =========================================================
    classDef optional fill:#f7f7f7,stroke:#999,stroke-dasharray: 5 5,color:#444
    classDef core fill:#fff,stroke:#333,color:#222

    %% =========================================================
    %% Client & Reverse Proxy
    %% =========================================================
    U[User Browser]:::core
    NGINX[NGINX<br/>Reverse Proxy • TLS • HSTS • Static Assets]:::core
    CERTBOT[Certbot:<br/>Let's Encrypt]:::core

    U -->|HTTPS| NGINX
    CERTBOT -->|TLS certs| NGINX

    %% =========================================================
    %% Frontend (Runtime & UI)
    %% =========================================================
    subgraph FE[Frontend: SPA]
        direction TB
        FE_APP[React 18: Vite build<br/>SPA Shell]:::core
        FE_ROUTER[React Router DOM<br/>Client Routing]:::core
        FE_HTTP[Axios<br/>401→/auth/refresh]:::core
        FE_STATE[State: Zustand / Redux<br/>React Query: optional cache]:::core
        FE_UI[TailwindCSS • Lucide Icons]:::core
        FE_CHARTS[Recharts • Dashboards]:::core
        FE_A11Y[Accessibility<br/>WCAG 2.1 AA, ARIA, Keyboard]:::core
        FE_I18N[I18N:EN/DE tokens:<br/>future]:::optional
    end

    %% Static assets served to browser
    NGINX -->|serve built assets| FE_APP
    FE_APP --> FE_ROUTER
    FE_APP --> FE_STATE
    FE_APP --> FE_UI
    FE_APP --> FE_CHARTS
    FE_APP --> FE_A11Y
    FE_APP -.-> FE_I18N

    %% API calls from FE
    FE_HTTP -->|/api: HTTPS| NGINX

    %% =========================================================
    %% Backend (Runtime & Framework)
    %% =========================================================
    subgraph BE[Backend: Node.js 20 + Express]
        direction TB
        BE_API[Express API Routers<br/>auth • users • exercises • sessions • progress • points • feed]:::core
        BE_SEC[Security: Helmet • CORS allowlist • Rate limiting • CSRF • httpOnly Secure cookies]:::core
        BE_AUTH[Auth: JWT: RS256 access<br/>Server-stored refresh: jti rotation & revocation]:::core
        BE_VALID[Validation & Config:<br/>zod DTOs • zod+dotenv env schema]:::core
        BE_UPLOADS[Uploads Abstraction:<br/>/uploads: dev • S3/GCS: prod]:::core
        BE_EMAIL[Email Abstraction:<br/>SMTP • SES • SendGrid]:::core
        BE_LOGS[Logging:<br/>pino/winston • morgan]:::core
        BE_JOBS[Background Jobs: future:<br/>BullMQ / Temporal]:::optional
        BE_CACHE[Redis: future:<br/>Caching • Rate limits]:::optional
    end

    %% Reverse proxy to backend
    NGINX -->|reverse proxy| BE_API

    BE_API --> BE_SEC
    BE_API --> BE_AUTH
    BE_API --> BE_VALID
    BE_API --> BE_UPLOADS
    BE_API --> BE_EMAIL
    BE_API --> BE_LOGS
    BE_API -.-> BE_JOBS
    BE_API -.-> BE_CACHE

    %% =========================================================
    %% Database & Persistence
    %% =========================================================
    subgraph DB[Database & Persistence]
        direction TB
        DB_PG[PostgreSQL 18]:::core
        DB_MIG[Knex.js Migrations & Seeds<br/>YYYYMMDDHHMM__*.ts]:::core
        DB_POL[Indexes & Constraints • Soft deletes:<br/>lower username, partial idx, FK cascades]:::core
        DB_BKP[Backups & Retention:<br/>Encrypted daily • RPO ≤ 24h • RTO ≤ 4h]:::core
    end

    BE_API --> DB_MIG --> DB_PG
    DB_PG --> DB_POL
    DB_PG --> DB_BKP

    %% =========================================================
    %% File & Media Storage
    %% =========================================================
    subgraph STORAGE[File & Media Storage]
        direction TB
        FS_DEV[Local /uploads: dev<br/>excluded from Git & Docker]:::core
        FS_OBJ[Object Storage: prod:<br/>AWS S3 / GCS]:::core
        FS_SCAN[Virus scan hook: optional]:::optional
        FS_RULES[Media constraints:<br/>JPEG/PNG/WebP ≤ 5MB]:::core
    end

    BE_UPLOADS --> FS_DEV
    BE_UPLOADS --> FS_OBJ
    FS_OBJ -.-> FS_SCAN
    BE_UPLOADS --> FS_RULES

    %% =========================================================
    %% Email & Notifications
    %% =========================================================
    subgraph MAIL[Email & Notifications]
        direction TB
        MAIL_ABS[Mailer Abstraction]:::core
        MAIL_PROV[Providers: SMTP • SES • SendGrid]:::core
        MAIL_BACKLOG[Unified notifications: email+push]:::optional
    end

    BE_EMAIL --> MAIL_ABS --> MAIL_PROV
    MAIL_ABS -.-> MAIL_BACKLOG

    %% =========================================================
    %% Observability & Monitoring
    %% =========================================================
    subgraph OBS[Observability & Monitoring]
        direction TB
        OBS_METRICS[Metrics & Alerts:<br/>p95/p99 latency • 5xx • auth failures • DB saturation]:::core
        OBS_TRACING[Tracing & Correlation IDs<br/>FE→BE propagation]:::core
        OBS_PRIVACY[GDPR-aware logs: no PII]:::core
    end

    BE_LOGS --> OBS_TRACING
    BE_API --> OBS_METRICS
    DB_PG --> OBS_METRICS
    BE_LOGS --> OBS_PRIVACY

    %% =========================================================
    %% Data Protection & Privacy
    %% =========================================================
    subgraph PRIV[Data Protection & Privacy]
        direction TB
        GDPR[GDPR: DSR endpoints: export/delete • Data minimization]:::core
        COOKIES[Cookies: httpOnly • Secure • SameSite=Lax]:::core
    end

    FE_APP --> COOKIES
    BE_SEC --> COOKIES
    BE_API --> GDPR

    %% =========================================================
    %% Environments
    %% =========================================================
    ENVS[Environments:<br/>Local: dev • Staging: opt • Production]:::core
    ENVS --> NGINX
    ENVS --> BE_API
    ENVS --> DB_PG

    %% =========================================================
    %% CI/CD, Build & Release, Infrastructure
    %% =========================================================
    subgraph CICD[CI/CD • Build & Release • Infra]
        direction TB
        CI[GitHub Actions CI:<br/>checkout • pnpm install • lint • test • build • push GHCR]:::core
        REG[GHCR Registry:<br/>Docker images tagged: SHA + semver]:::core
        CD[GitHub Actions CD:<br/>manual approval • SSH deploy]:::core
        DOCKER[Docker / Compose:<br/>multi-stage builds • reproducible dev/prod]:::core
        HOST[Target Host / Server:<br/>docker compose up -d]:::core
        VER[Versioning & Rollback:<br/>/api/v1 • retain last good image]:::core
        STATIC[Static assets caching via NGINX]:::core
    end

    CI --> REG
    REG --> CD
    CD --> HOST
    HOST --> DOCKER
    DOCKER --> NGINX
    DOCKER --> BE_API
    DOCKER --> DB_PG
    NGINX --> STATIC
    CI --> VER
    CD --> VER

    %% =========================================================
    %% Monorepo Tooling
    %% =========================================================
    TOOLS[Monorepo Tooling:<br/>pnpm workspaces • turbo • ESLint • Prettier • TS base config]:::core
    TOOLS --> CI
    TOOLS --> FE_APP
    TOOLS --> BE_API

    %% =========================================================
    %% Legend
    %% =========================================================
    subgraph LEGEND[Legend]
        direction LR
        L_OPT[Optional: Phase 2+]:::optional
    end

    %% Assign optional class
    class FE_I18N,BE_JOBS,BE_CACHE,FS_SCAN,MAIL_BACKLOG optional
```

---

### 6.2 Rationale

- **Node.js 20 + Express**: Chosen for maturity, wide ecosystem support, and straightforward modularization. Express offers fine-grained control, which is preferable over heavier frameworks for a project emphasizing separation of concerns.
- **Knex.js over full ORM**: Provides SQL flexibility and performance without ORM abstraction overhead. It ensures maintainability via migrations and seeds while keeping developers close to SQL.
- **PostgreSQL 18**: Selected for its robustness, JSONB support (for flexible fields), and strong community support. The latest version ensures long-term support.
- **JWT + refresh rotation**: Access tokens remain short-lived (≤15 min) to minimize compromise risk. Refresh tokens are stored server-side, rotated on each use, and revocable per `jti` to guard against theft.
- **bcryptjs**: A widely adopted password hashing algorithm with proven resilience against brute-force attacks.
- **TOTP 2FA**: Enhances account security with optional strong second-factor authentication.
- **zod**: Ensures runtime validation for API inputs and environment variables, reducing runtime errors and misconfigurations.
- **pino/winston + morgan**: Enable structured logs, traceability, and operational visibility. Logging is GDPR-aware (no PII storage).
- **Mailer abstraction**: Keeps email logic independent of provider (SMTP, AWS SES, SendGrid), allowing flexible deployments.
- **File storage abstraction**: Development uses local storage; production uses cloud object stores (S3/GCS). This separation ensures scalability without complicating dev workflows.
- **Redis + BullMQ/Temporal (backlog)**: Provide caching and asynchronous job execution. Not required for MVP, but designed for scalability in later phases.
- **Supporting libs**: cors, express-rate-limit, compression, uuid, and date/time utilities are battle-tested solutions for common API needs.

---

### 6.3 Frontend Stack

- **App shell & routing:** React + React Router DOM.
- **State & data:** Zustand/Redux; optional React Query for caching and background refetch.
- **HTTP:** Axios instance with interceptors (attach access token; handle 401 → refresh).
- **Styling:** TailwindCSS; component primitives (Navbar, Card, Button, AvatarUpload, Chart) per styling guide.
- **Charts:** Recharts (line/area, circular progress).
- **Accessibility:** WCAG 2.1 AA; semantic HTML; ARIA labels; keyboard navigation.
- **Internationalization (placeholder):** prepare for EN/DE labels (tokens-based).

---

### 6.4 Backend Stack

- **API:** Express with modular routers per domain (auth, users, exercises, sessions, progress, points, feed).
- **Security:** Helmet, CORS allowlist, rate limiting, CSRF protection, httpOnly `Secure` cookies.
- **Auth:** JWT (short-lived access) + **server-stored refresh** tokens with rotation and revocation by `jti`; optional TOTP 2FA with backup codes.
- **Data access:** Knex query builder; connection pooling; migrations & seeds.
- **Storage:** Local `/uploads` (dev) and pluggable S3/GCS provider (prod) via abstraction; uploads excluded from VCS and Docker build.
- **Email:** Verification/reset via provider-agnostic mailer (SMTP/SES/etc.).
- **Logging:** Structured logs (pino/winston) with correlation IDs; `morgan` for access logs.
- **Validation:** zod schemas for request DTOs and environment config.
- **Background jobs (future):** BullMQ/Temporal for async tasks (emails, reports, imports).
- **System utilities:** The system shall expose a `GET /health` endpoint for container health-checks and uptime monitoring. It shall return HTTP 200 OK with a JSON payload `{ status: 'ok', timestamp: <ISO8601> }`.

#### 6.4.1 API Route Overview (MVP)

The following table summarizes the REST API endpoints implemented for the MVP scope.  
Each endpoint adheres to REST semantics and returns JSON responses. Authentication is JWT-based as defined in § 9 Authentication Lifecycle.

| Module | Endpoint | Method | Auth | Description | Status Codes |
|:--------|:----------|:--------|:------|:--------------|:--------------|
| **System** | `/health` | GET | No | System liveness check for CI/CD and uptime monitoring | 200 |
| **Auth** | `/auth/register` | POST | No | Register a new account | 201, 400, 409 |
|  | `/auth/login` | POST | No | Login with credentials | 200, 401 |
|  | `/auth/refresh` | POST | Yes | Issue a new access token | 200, 401 |
|  | `/auth/logout` | POST | Yes | Invalidate refresh session | 204, 401 |
| **Users** | `/users/me` | GET | Yes | Retrieve own profile | 200, 401 |
|  | `/users/me` | PUT | Yes | Update editable profile fields | 200, 400 |
| **Exercises** | `/exercises` | GET | Yes | List user and public exercises | 200 |
|  | `/exercises` | POST | Yes | Create a new exercise | 201, 400 |
|  | `/exercises/:id` | PUT | Yes | Update existing exercise | 200, 404 |
|  | `/exercises/:id` | DELETE | Yes | Archive exercise | 204, 404 |
| **Sessions** | `/sessions` | GET | Yes | List sessions | 200 |
|  | `/sessions` | POST | Yes | Create planned session | 201 |
|  | `/sessions/:id/complete` | PATCH | Yes | Mark session as completed | 200 |
| **Progress** | `/progress/summary` | GET | Yes | Summary statistics | 200 |
|  | `/progress/charts` | GET | Yes | Chart data | 200 |
| **Points** | `/points` | GET | Yes | Get current total | 200 |
|  | `/points/history` | GET | Yes | Retrieve points history | 200 |
| **Feed** | `/feed` | GET | Yes (optional) | Public session feed | 200 |
|  | `/feed/:id/clone` | POST | Yes | Clone public session | 201, 404 |

---

#### 6.4.2 Layer Contracts

The backend shall follow a strict three-layer architecture:

1. **Router Layer** – Handles HTTP routing, parses input, validates DTOs, and maps service errors to HTTP codes.  
   Routers shall never access the database directly.
2. **Service Layer** – Encapsulates business logic, transaction handling, and domain events.
3. **Repository Layer** – Performs all SQL operations via Knex; returns typed DTOs; no business logic allowed.

Utilities (e.g., logger, metrics, mailer) are dependency-injected where possible to ensure testability.

---

#### 6.4.3 Error Handling Specification

All API responses shall use a standardized JSON error envelope:

```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid username or password.",
    "requestId": "uuid"
  }
}
```

| HTTP Code | Error Code                               | Description                            |
| --------- | ---------------------------------------- | -------------------------------------- |
| 400       | VALIDATION_ERROR                         | Request body failed schema validation. |
| 401       | AUTH_REQUIRED / AUTH_INVALID_CREDENTIALS | Missing or invalid token.              |
| 403       | FORBIDDEN                                | Insufficient privileges.               |
| 404       | NOT_FOUND                                | Resource not found.                    |
| 409       | CONFLICT                                 | Unique constraint or state conflict.   |
| 422       | UNPROCESSABLE                            | Business rule violation.               |
| 429       | RATE_LIMITED                             | Too many requests.                     |
| 500       | INTERNAL                                 | Unexpected server error.               |

The system shall include correlation IDs in every log and response for traceability.

---

#### 6.4.4 Testing Approach
 Each `endpoi11.2.nt` is covered by automated integration tests (`Jest` + `Supertest`) validating status codes, authentication, and schema compliance. A Postman collection mirrors this route map for manual verification during MVP development.

---

#### 6.4.5 Migration Conventions

- Migration filenames shall follow: `YYYYMMDDHHMM__<description>.ts`.  
- Order: lookup → users → domain → attributes → social.  
- Each migration shall provide reversible `up`/`down` functions.  
- CI executes migrations on ephemeral DB; CD runs `migrate:latest` before app start.  
- No destructive `down` migrations in production; use expand/contract pattern.

#### 6.4.6 Logging and Monitoring Middleware

- **Logging:** use `pino` for structured JSON logs; `morgan` for access logs; include `requestId` and `userId` where available.  
- **Privacy:** exclude passwords, tokens, and PII from logs.  
- **Monitoring:** integrate Prometheus middleware capturing latency histograms by route and status.

---

### 6.5 Database & Persistence

- **Engine:** PostgreSQL **18**.
- **Migrations:** Knex migrations with semantic naming `YYYYMMDDHHMM__*.ts`.
- **Indexes & constraints:** uniques (e.g., `lower(username)`), partial indexes excluding archived rows; FK cascades where appropriate.
- **Soft deletes:** `deleted_at`/`archived_at` fields; default scopes exclude archived.
- **Backups:** daily encrypted backups; **RPO ≤ 24h**, **RTO ≤ 4h**; quarterly restore test.
- **Retention:** per-entity retention policies; anonymization considered for analytics (opt-in only).

---

### 6.6 Infrastructure & DevOps

- **Reverse proxy:** NGINX with HTTP→HTTPS redirect; HSTS.
- **TLS:** Let’s Encrypt via Certbot with automated renewal.
- **Containers:** Multi-stage Dockerfiles; minimal base images (`node:20-alpine`).
- **Compose:** `infra/docker/docker-compose.dev.yml` and `docker-compose.prod.yml` orchestrate FE, BE, DB, NGINX, (Certbot).
- **CI (GitHub Actions):** checkout → setup Node → install (pnpm) → lint → type-check → unit tests → build FE/BE → build/push Docker images to **GHCR**.
- **CD (GitHub Actions):** manual approval → SSH to host → pull images → `docker compose -f infra/docker/docker-compose.prod.yml up -d`.

---

### 6.7 Configuration & Secrets

- **Env management:** `.env.example` at repo root; real secrets via host env or secrets manager.
- **Secrets:** never in VCS; rotate keys regularly; least privilege for DB/object storage.
- **Config schema:** zod-validated `env.ts`; fails fast on boot with descriptive errors.

---

### 6.8 Environments

- **Local (dev):** hot reload, verbose logging, seeded demo data.
- **Staging (optional):** mirrors prod configs; used for pre-prod validation.
- **Production:** optimized builds; strict CORS; reduced log verbosity; metrics and alerts enabled.

---

### 6.9 Build & Release

- **Versioning:** `/api/v1` base path with deprecation policy.
- **Artifacts:** Docker images tagged with commit SHA + semver.
- **Rollback:** compose retains last good image; rollback procedure documented.
- **Static assets:** FE built assets served by NGINX with cache headers.

#### 6.9.1 Rollback Policy & Feature Flags

- **Rollback:** retain the last two production images; revert via `docker compose pull <prev>` + redeploy.  
  Database changes must be backward-compatible (expand/contract).  
- **Feature Flags:** conditional execution via environment variables  
  (`process.env.FEATURE_X === "true"`). Disabled features shall remain dormant without code removal.

---

### 6.10 Observability & Monitoring

- **Metrics dashboards:** latency p95/p99, error rate, auth failures, DB pool saturation.
- **Alerting:** thresholds on 5xx spikes and elevated auth failures.
- **Tracing:** correlation/request IDs propagated FE→BE; logs are PII-safe.

#### 6.10.1 Monitoring stack
- **Prometheus** (metrics), 
- **Grafana** (dashboards & alerts), 
- **Loki** (logs).  

The backend shall expose a `/metrics` endpoint for Prometheus scraping (restricted via NGINX allowlist).

| Metric | Type | Labels | Description |
|---------|------|--------|-------------|
| `http_request_duration_seconds` | Histogram | method, route, status_code | API latency |
| `http_requests_total` | Counter | method, route, status_code | Throughput |
| `auth_login_fail_total` | Counter | reason | Failed logins |
| `sessions_completed_total` | Counter | – | Completed sessions |
| `db_pool_in_use` | Gauge | – | Database pool utilization |
| `process_cpu_user_seconds_total` | Counter | – | CPU usage |

---

### 6.11 Data Protection & Privacy

- **GDPR:** DSR endpoints (export/delete), privacy notice, data minimization.
- **Cookies:** httpOnly, `Secure`, `SameSite=Lax`.
- **Uploads:** virus scanning hook optional; constraints: JPEG/PNG/WebP, ≤5 MB.

---

### 6.12 Monorepo Tooling

- **Package management:** pnpm workspaces.
- **Task runner:** turbo (optional) for caching and parallelism.
- **Quality:** ESLint & Prettier configs at root; TypeScript base config `tsconfig.base.json`.

---

### 6.13 Operability Runbooks

Operational procedures shall be documented to ensure secure and maintainable operation:

- **JWT Key Rotation:** introduce new key pair → publish via JWKS → deploy → deprecate old key after grace period.  
- **GDPR Delete Request:** queue deletion job → remove PII tables → anonymize references → propagate to backups.  
- **Backup Restore Test:** quarterly restore to staging → validate `/health`, authentication, and data integrity.  
- **Session Revocation:** manual admin command `DELETE FROM auth_sessions WHERE user_id = ?;`.

---

# 6.14 Internationalization & Localization (i18n / l10n)

## 6.14.1 Purpose

The goal of this section is to define how **FitVibe** supports multiple languages and cultural formats across its user interface, data model, and content ecosystem.  
The system shall implement a **hybrid internationalization (i18n) and localization (l10n)** model consisting of:

1. **Static translation** for all **application-controlled UI elements** (buttons, menus, messages, validation text).  
2. **Dynamic AI-assisted translation** for **user-generated content** (sessions, titles, descriptions, feed posts, comments).  

This approach ensures both predictable UX consistency and real-time multilingual accessibility, enabling users from different locales to interact seamlessly.

---

### 6.14.2 Architecture Overview

| Layer | Responsibility | Implementation |
|-------|----------------|----------------|
| **Frontend (React + Vite)** | Static translations, runtime switching, locale formatting | `i18next + react-i18next`, JSON dictionaries (`/src/utils/i18n/{lang}.json`), `Intl.DateTimeFormat` and `Intl.NumberFormat` APIs |
| **Backend (Node.js + Express)** | Language detection, localized lookup responses, AI translation proxy | Middleware `detectLanguage`, `translateText(service, cache)`, optional `/i18n/:lang` endpoint |
| **Database (PostgreSQL)** | Localized lookup data | Columns `description_en`, `description_de`, or i18n table (`*_i18n(lang, description)`) |
| **AI Translation Service** | Translate user content | Pluggable adapter (DeepL / OpenAI / Azure) with caching and redaction middleware |

### Data Flow

```mermaid
sequenceDiagram
  participant U as User (Browser)
  participant FE as Frontend (React +i18next)
  participant BE as Backend (Express)
  participant AI as AI Translator (DeepL/OpenAI)
  participant DB as PostgreSQL (Cache)

  U->>FE: View Feed (locale=de)
  FE->>BE: GET /feed?lang=de
  BE->>DB: Fetch original EN content
  BE->>AI: Translate missing entries (EN→DE)
  AI-->>BE: Translated text
  BE->>DB: Cache translation
  BE-->>FE: Localized response (JSON)
  FE-->>U: Render German text
```

### Backend Modules

- `middlewares/detectLanguage.ts` → reads `Accept-Language` header and sets `req.lang`.  
- `services/translation.service.ts` → handles AI translation + caching.  
- `config/i18n.ts` → defines supported languages and API credentials.  
- Integration into `/feed`, `/sessions`, and `/comments` routers for auto-translated responses.

### Caching Policy
- Key format: `hash(original_text + lang)`  
- Store in `Redis` (Phase 2) or PostgreSQL JSON cache table.  
- TTL: 7 days; re-validate on content edit.

---

## 6.14.3 User Experience Requirements

- **Language Selector:** visible in the navbar; persists selection.  
- **Feedback:** UI must update instantly on language switch without reload.  
- **Accessibility:** `<html lang="xx">` attribute updated dynamically for screen readers.  
- **User-Generated Content:** display translated text with tooltip or toggle to show original.  
- **Consistency:** mixed-language feeds should appear seamless, with auto-translated content visually marked (e.g., “Translated from English”).

---

## 6.14.4 Testing & QA

| Test Type | Objective | Tool |
|------------|------------|------|
| **Unit Tests (Frontend)** | Verify translation tokens render correctly | Jest / React Testing Library |
| **Integration Tests (Backend)** | Validate AI translation API + caching logic | Jest + Supertest |
| **Accessibility Tests** | Ensure language attributes and labels comply with WCAG 2.1 AA | axe-core |
| **Localization Accuracy** | Compare translated outputs via benchmark dataset | Playwright visual regression |
| **Performance Tests** | Ensure caching reduces latency (< 300 ms p95) | k6 |
| **Privacy Audit** | Verify no PII sent to external translators | Security review checklist |

---

## 6.14.5 Roadmap & Future Extensions

| Phase | Focus | Description |
|--------|--------|-------------|
| **Phase 1 (MVP)** | Static EN/DE | JSON dictionaries for all UI tokens |
| **Phase 2** | Hybrid AI translation | Real-time translation of user content + caching |
| **Phase 3** | Multilingual community | Extend to FR/ES; train custom AI glossary for fitness terms |

---

### 6.14.6 Dependencies & Configuration

| Variable | Description | Example |
|-----------|-------------|----------|
| `DEFAULT_LANG` | System fallback language | `en` |
| `AI_TRANSLATION_PROVIDER` | Selected API provider | `OpenAI` |
| `AI_TRANSLATION_KEY` | Provider API key | `env secret` |
| `I18N_SUPPORTED_LANGS` | CSV list of supported locales | `en,de` |

---

### 6.14.7 Security & Compliance

- Translation API calls shall redact usernames, emails, and any identifiers.  
- Translated texts shall be cached only in anonymized form.  
- GDPR compliance: users can request deletion of cached translations linked to their content.  
- Audit logs record all external translation calls with timestamp and target language.

---

### 6.14.8 Success Metrics

| Metric | Target |
|---------|---------|
| Translation coverage (UI) | 100 % of tokens localized |
| Latency for translated feed | ≤ 500 ms p95 |
| AI translation accuracy (manual review) | ≥ 90 % |
| Cache hit ratio | ≥ 80 % |
| User satisfaction with localization (survey) | ≥ 4.5 / 5 |

---

## 7. Data Model and Structures

The core database schema and relationships are shown in **Figure 7.1**.

The following section defines the core **database schema** and **entity relationships** for FitVibe. The design follows 3NF/BCNF principles for consistency and extensibility while preserving GDPR compliance through archival and separation of personal identifiers.

---

### 7.1 ERD

```mermaid
erDiagram
    %% ==============================
    %% USERS & SECURITY
    %% ==============================
    USERS {
        uuid id
        string username
        string password_hash
        string role
        string status
        string preferred_lanf
        timestamp created_at
    }

    ROLES {
        string code
        string description
    }

    USER_CONTACTS {
        uuid id
        uuid user_id
        string type
        string value
        boolean is_primary
        boolean is_recovery
        boolean is_verified
        timestamp created_at
    }

    USER_STATIC {
        uuid user_id
        date date_of_birth
        string gender
    }

    GENDERS {
        string code
        string description
    }

    USER_STATE_HISTORY {
        uuid id
        uuid user_id
        decimal weight
        string unit
        string fitness_level
        string training_frequency
        string photo_url
        timestamp recorded_at
    }

    FITNESS_LEVELS {
        string code
        string description
    }

    AUTH_SESSIONS {
        uuid jti
        uuid user_id
        timestamp expires_at
        timestamp created_at
    }

    TRANSLATION_CACHE {
      uuid id
      string source
      string lang
      string translated
      timestamp created_at
    }

    %% ==============================
    %% EXERCISES & SESSIONS
    %% ==============================
    EXERCISES {
        uuid id
        uuid owner
        string name
        string type
        string muscle_group
        string[] tags
        boolean is_public
        string description_en
        string description_de
        timestamp created_at
        timestamp archived_at
    }

    EXERCISE_TYPES {
        string code
        string description
    }

    SESSIONS {
        uuid id
        uuid owner
        string title
        timestamp planned_for
        string recurrence_rule
        timestamp completed_at
        string status
        string visibility
        integer calories
        integer points
        timestamp created_at
        timestamp archived_at
    }

    SESSION_EXERCISES {
        uuid id
        uuid session_id
        uuid exercise_id
        int position
        string notes
    }

    PLANNED_EXERCISE_ATTRIBUTES {
        uuid id
        uuid session_exercise_id
        int sets
        int reps
        decimal load
        decimal distance
        interval duration
        int rpe
    }

    ACTUAL_EXERCISE_ATTRIBUTES {
        uuid id
        uuid session_exercise_id
        int sets
        int reps
        decimal load
        decimal distance
        interval duration
        int rpe
    }

    %% ==============================
    %% GAMIFICATION & COMMUNITY
    %% ==============================
    USER_POINTS {
        uuid id
        uuid user_id
        string source_type
        string algorithm_version
        int points
        timestamp awarded_at
    }

    BADGES {
        uuid id
        uuid user_id
        string badge_type
        timestamp awarded_at
    }

    FOLLOWERS {
        uuid id
        uuid follower_id
        uuid following_id
        timestamp created_at
    }

    MEDIA {
        uuid id
        uuid owner_id
        string target_type
        uuid target_id
        string file_url
        string media_type
        timestamp created_at
    }

    %% ==============================
    %% RELATIONSHIPS
    %% ==============================
    USERS ||--o{ USER_CONTACTS : has
    USERS ||--o{ USER_STATIC : has
    USERS ||--o{ USER_STATE_HISTORY : tracks
    USERS ||--o{ AUTH_SESSIONS : maintains
    USERS ||--o{ EXERCISES : owns
    USERS ||--o{ SESSIONS : plans
    USERS ||--o{ USER_POINTS : earns
    USERS ||--o{ BADGES : awarded
    USERS ||--o{ FOLLOWERS : connects

    USERS }o--|| ROLES : "has role"
    USER_STATIC }o--|| GENDERS : "has gender"
    USER_STATE_HISTORY }o--|| FITNESS_LEVELS : "has fitness level"
    EXERCISES }o--|| EXERCISE_TYPES : "has type"

    SESSIONS ||--o{ SESSION_EXERCISES : includes
    SESSION_EXERCISES ||--o{ PLANNED_EXERCISE_ATTRIBUTES : planned
    SESSION_EXERCISES ||--o{ ACTUAL_EXERCISE_ATTRIBUTES : actual
```

### 7.2 Design Principles

- **Normalization:** Entities are decomposed into separate tables to avoid redundancy.
- **History & Archival:** Mutable profile attributes (e.g., weight, fitness level) are stored in history tables; sessions and exercises are archived, not deleted.
- **Lookup Tables:** Roles, genders, categories, and point sources are maintained in dedicated reference tables for consistency.
- **Extensibility:** Planned vs. actual exercise attributes split into child tables, supporting future analytics without schema bloat.
- **Compliance:** Personally identifiable information (contacts, aliases) is separate from activity logs to enable anonymization upon GDPR deletion.

### 7.3 Core Entities

#### 7.3.1 Users & Security

- **users:** base account data (username, password hash, role, status).
- **user_contacts:** multiple verified emails/phones with primary/recovery flags.
- **user_static:** immutable attributes (date of birth, gender).
- **user_state_history:** temporal attributes (weight, fitness level, training frequency, photo).
- **auth_sessions:** server-stored refresh sessions (jti) with rotation and expiry.

#### 7.3.2 Exercises & Sessions

- **exercises:** user-owned or public exercise definitions (category, muscle group, tags).
- **sessions:** planned workouts with optional recurrence rules; can be completed, archived, or cloned.
- **session_exercises:** ordered references to exercises within a session.
- **planned_exercise_attributes:** planned values (sets, reps, load, distance, duration, RPE).
- **actual_exercise_attributes:** actual logged values, enabling comparison against planned.

#### 7.3.3 Gamification & Community

- **user_points:** points awarded on session completion; includes source_type and algorithm_version for audit.
- **badges:** achievements tied to badge types, awarded to users.
- **followers:** follower/following relationships for social graph.

#### 7.3.4 Media

- **media:** references to user avatars, exercise/session photos, stored in external object storage (S3/GCS).

### 7.4 Lookup Tables

- **roles**: user roles (user, admin).
- **contact_types**: e.g., email, phone.
- **genders**: man, woman, diverse, prefer not to say.
- **fitness_levels**: beginner, intermediate, advanced.
- **training_freq**: not at all, monthly, weekly, daily.
- **exercise_categories**: cardio, strength, endurance.
- **muscle_groups**: upper body, lower body, core, etc.
- **point_sources**: session completion, admin adjustment, bonus, algorithm_version.
- **badge_types**: e.g., “First Session”, “100 Workouts”, “Marathon Badge”.

---

### 7.5 Lookup Normalization Tables

To improve referential integrity and analytics, the following lookup tables shall replace plain-text enums:

| Table | Example Values |
|--------|----------------|
| **contact_types** | email, phone |
| **training_freq** | none, monthly, weekly, daily |
| **point_sources** | session_completion, admin_adjustment, bonus_event |
| **badge_types** | first_session, hundred_workouts, marathon_badge |

Each shall use `code TEXT PRIMARY KEY` and a localized `description TEXT` column.

---

## 8. User Experience (UX)

### 8.1 Key Screens

1. **Login / Registration**

   - **Purpose:** Secure access to the platform.
   - **Features:**
     - Login with username/password.
     - Registration with email verification.
     - Password reset with 15-minute TTL token.
     - Optional 2FA (TOTP + backup codes).
   - **Design Notes:**
     - Minimal form fields; clear validation messages.
     - Prominent CTA buttons (“Login”, “Register”).
     - Accessibility: focus order, error messages with ARIA labels, keyboard-navigable.

2. **Dashboard / Homepage**

   - **Purpose:** First point of interaction after login; quick overview.
   - **Features:**
     - “Next planned session” card.
     - Quick stats: streak, weekly volume, points.
     - Feed preview of recent public sessions.
   - **Design Notes:**
     - Card-based layout with minimal icons (Lucide).
     - Color semantics: green for completed, indigo/purple gradient for planned.
     - Accessibility: high-contrast palette, scalable typography, responsive grid.

3. **Planner**

   - **Purpose:** Plan sessions in advance, including recurring schedules.
   - **Features:**
     - Calendar view (week/month).
     - Create/edit session with exercises.
     - Recurrence rules (weekly, custom).
   - **Design Notes:**
     - Drag-and-drop exercise selection.
     - Tooltips with planned attributes (sets, reps, load, RPE).
     - Accessibility: calendar keyboard navigation, ARIA labels for events.

4. **Logger**

   - **Purpose:** Record actual session performance.
   - **Features:**
     - Mark session as completed or canceled.
     - Capture actual sets/reps/load/duration.
     - Compare planned vs actual in real-time.
   - **Design Notes:**
     - Mobile-first form (stepper for reps/sets).
     - Inline progress indicators (completion %).
     - Accessibility: large touch targets, validation feedback announced to screen readers.

5. **Progress Dashboard**

   - **Purpose:** Track performance and visualize progress.
   - **Features:**
     - Charts: volume, duration, distance, intensity, frequency.
     - Filters: date, category, visibility.
     - Personal bests and streaks.
   - **Design Notes:**
     - Recharts for interactive graphs.
     - Export options (CSV, JSON).
     - Accessibility: color-blind friendly charts; text summaries of metrics.

6. **Feed / Community**

   - **Purpose:** Engage with public content, discover new sessions.
   - **Features:**
     - Paginated list of public sessions.
     - Clone sessions with attribution.
     - Report inappropriate content (future admin moderation).
   - **Design Notes:**
     - Infinite scroll or paginated grid.
     - Default privacy = private; visual markers for public sessions.
     - Accessibility: distinguishable session cards with ARIA region labeling.

7. **Profile & Settings**
   - **Purpose:** Manage account details, privacy, and security.
   - **Features:**
     - Profile editing (alias, avatar, fitness level, frequency).
     - Security settings (password, 2FA, data export, account deletion).
     - Privacy controls (session visibility defaults).
   - **Design Notes:**
     - Tabbed interface for Profile / Security / Privacy.
     - Avatar upload with 128×128 preview.
     - Accessibility: forms labeled, destructive actions require confirmation modal.

### 8.2 UX Design Principles

- **Minimalist & Consistent:** Clear hierarchy, reusable components, responsive design.
- **Accessibility:** WCAG 2.1 AA conformance; ARIA roles; keyboard navigation.
- **Privacy-first:** Defaults to private; opt-in for sharing and analytics.
- **Gamified Engagement:** Subtle points and streak indicators encourage continued use.
- **Future-proof:** Layout accommodates additional modules (nutrition, leaderboards, wearables).

### 8.3 User Journeys

The graphs show the user's journey over the app screens and the expected satisfaction from the interaction with FitVibe.

- Registration flow shown in **Figure 8.1**.
- Plan and log flow shown in **Figure 8.2**.
- Session discovery and cloning shown in **Figure 8.3**.
- Profile update and archival with errors shown in **Figure 8.4**.
- Profile update and archival flow shown in **Figure 8.5**.

#### Registration → Account Activation

```mermaid
journey
    title User Journey: Registration & Account Activation
    section Registration Form
      Open registration page: 5: User
      Enter username, email, password: 5: User
      Error weak password: 2: System
      Error duplicate username/email: 2: System
      Submit registration form: 4: User
    section Verification
      System sends verification email (15‑min TTL link): 3: System
      User clicks verification link: 5: User
      Error expired or invalid token: 2: System
      Successful verification: 4: User
    section First Login
      User logs in with credentials: 5: User
      System creates auth session + optional 2FA setup: 3: System
      Redirect to Dashboard: 5: System
```

#### Login → Dashboard → Planner → Logger → Progress

```mermaid
journey
    title User Journey: Plan & Log a Session
    section Authentication
      Open login page: 5: User
      Enter credentials & 2FA: 5: User
      Backend validates, redirects: 7: System
    section Dashboard
      View next planned session: 8: User
      Click "Plan new session": 7: User
    section Planner
      Add exercises & recurrence: 6: User
      Save planned session: 6: User
    section Logger
      Open planned session: 8: User
      Record actuals (sets/reps/load): 9: User
      Mark as complete: 9: User
    section Progress
      Open Progress Dashboard: 8: User
      View charts and streaks: 8: User
```

#### Dashboard → Feed → Clone Session

```mermaid
journey
    title User Journey: Discover & Clone a Session
    section Dashboard
      Open feed preview: 5: User
    section Feed
      Browse public sessions: 7: User
      Select a session: 7: User
      Clone into planner: 9: User
    section Planner
      Adjust details & save: 7: User
      Session added to personal schedule: 9: System
```

#### Profile → Change State (Update Info or Archive Account) with Error States

```mermaid
journey
    title User Journey: Update Profile or Archive Account (with Errors)
    section Profile
      Open Profile & Settings: 5: User
      View current information: 5: User
    section Edit Information
      Change alias, fitness level, avatar: 7: User
      Error - alias already taken: 2: System
      Error - avatar exceeds 5MB or invalid format: 2: System
      Save changes valid: 5: User
      System updates state history: 3: System
    section Archive Account
      Select "Delete Account": 8: User
      Confirm with modal: 3: User
      Error incorrect password re‑entry for confirmation: 2: System
      System queues GDPR-compliant deletion valid: 3: System
      Data anonymized/removed in backups: 2: System
```

```mermaid
journey
    title User Journey: Update Profile or Archive Account
    section Profile
      Open Profile & Settings: 5: User
      View current information: 5: User
    section Edit Information
      Change alias, fitness level, avatar: 5: User
      Save changes: 4: User
      System updates state history: 3: System
    section Archive Account
      Select "Delete Account": 5: User
      Confirm with modal: 4: User
      System queues GDPR-compliant deletion: 3: System
      Data anonymized/removed in backups: 2: System
```

---

### 8.4 Visual Design System

This section defines the **FitVibe color palette**, **visual identity**, and **UI component principles** derived from the current design explorations and logo branding.

#### 8.4.1 Design Philosophy

FitVibe’s interface expresses **energy, discipline, and balance** through a harmonious blend of the four classical elements—**Fire**, **Water**, **Earth**, and **Air**—which mirror the app’s fitness domains (speed, endurance, strength, agility).  
The tone is **minimalist**, **professional**, and **accessible**, aligning with WCAG 2.1 AA standards.

---

#### 8.4.2 Brand Color System (v1.0)

| Element           | Role                 | Highlight | Base      | Shadow    | Usage                                       |
| ----------------- | -------------------- | --------- | --------- | --------- | ------------------------------------------- |
| **Fire**          | Speed & Intensity    | `#FDC54D` | `#F9A51A` | `#B45E00` | Primary buttons, CTAs, hover emphasis       |
| **Water**         | Flow & Endurance     | `#5CB2F5` | `#1A78DA` | `#0E4E95` | Progress bars, charts, secondary actions    |
| **Earth**         | Strength & Stability | `#4D7C62` | `#29553E` | `#162C22` | Navigation bars, confirmations, footers     |
| **Air**           | Agility & Clarity    | `#FFE8A3` | `#F9E6B2` | `#CBB56C` | Highlights, tooltips, secondary backgrounds |
| **Neutral Light** | —                    | —         | `#FAF9F6` | —         | Primary surface color (light mode)          |
| **Neutral Dark**  | —                    | —         | `#0B0C10` | —         | Background & text color (dark mode)         |

**Gradients**

- **Fire → Air** → `linear-gradient(90deg, #F9A51A, #FFE8A3)`
- **Water → Earth** → `linear-gradient(90deg, #1A78DA, #29553E)`
- **Four-Element Blend** → `linear-gradient(270deg, #F9A51A, #1A78DA, #29553E, #FFE8A3)`

---

#### 8.4.3 Depth and Shadow System

| Level    | Purpose                          | Example                  |
| -------- | -------------------------------- | ------------------------ |
| Shadow-1 | Subtle UI depth (buttons, icons) | `rgba(11, 12, 16, 0.10)` |
| Shadow-2 | Card and modal elevation         | `rgba(11, 12, 16, 0.20)` |
| Shadow-3 | Floating elements                | `rgba(11, 12, 16, 0.30)` |

---

#### 8.4.4 Light / Dark Mode Specification

- **Light Mode**

  - Background: `#FAF9F6`
  - Text: `#1C1C1C`
  - Emphasis colors follow Fire & Earth tones for warmth and stability.
  - Cards use soft shadows and warm whites to ensure legibility.

- **Dark Mode**
  - Background: `#0B0C10`
  - Text: `#E3E0D9`
  - Gradients become deeper; contrasts shift toward Water & Fire hues for vibrancy.
  - Shadows replaced with soft glow or brightness layering.

---

#### 8.4.5 Component Style Tokens

| Component            | Background                           | Text                  | Border / Accent | Hover / Active                   |
| -------------------- | ------------------------------------ | --------------------- | --------------- | -------------------------------- |
| **Navbar**           | `#29553E` (light) / `#162C22` (dark) | `#FAF9F6`             | —               | Gradient overlay (Earth → Water) |
| **Primary Button**   | `#F9A51A`                            | `#0B0C10`             | none            | `#FDC54D`                        |
| **Secondary Button** | `#1A78DA`                            | `#FAF9F6`             | none            | `#5CB2F5`                        |
| **Card**             | `#FFFFFF` (light) / `#162C22` (dark) | `#1C1C1C` / `#E3E0D9` | `#E3E0D9`       | Border accent → `#F9A51A`        |
| **Footer**           | `#29553E` (light) / `#0B0C10` (dark) | `#FAF9F6`             | —               | none                             |

---

#### 8.4.6 Logo and Brand Symbolism

- **Primary Logo:** circular emblem composed of four flowing wave-segments (Fire, Water, Earth, Air) encased in a dark-navy outline.
- **Monochrome Logo:** white emblem on dark background for minimal contexts.
- **Favicon:** simplified emblem without typography.
- **Typography:** Sans-serif, geometric font (e.g., _Inter_, _Nunito Sans_, _Poppins_).
- **Iconography:** line-based (Lucide React) for visual consistency.

#### 8.4.6.1 Branding

- **Catchphrase**: FitVibe: Your vibe, your fitness

---

#### 8.4.7 Typography System

The typography for **FitVibe** conveys **clarity, precision, and professionalism**.  
It avoids decorative styles in favor of a **neutral, functional aesthetic** that supports readability across training dashboards, mobile interfaces, and data-dense components.

##### 8.4.7.1 Design Principles

- **Modern & Neutral:** Typography is clean and understated — focused on legibility, not personality.
- **Consistency:** Heading weights and spacing follow a unified rhythm; the same styles apply across all devices.
- **Function over style:** Size and spacing create hierarchy rather than color or ornament.
- **Performance:** System-rendered fonts reduce load time and maintain crispness on all screens.
- **Accessibility:** Conforms to WCAG 2.1 AA for size and contrast; supports text scaling to 200 %.

---

##### 8.4.7.2 Typefaces

| Role                    | Font Family                  | Fallback                                  | Description                                                                                                               |
| ----------------------- | ---------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Primary Typeface**    | **Roboto Flex** _(Variable)_ | `system-ui, Helvetica, Arial, sans-serif` | A modern, highly legible neo-grotesque designed for digital UI. Variable axes allow fine weight and optical-size control. |
| **Secondary Typeface**  | **Inter**                    | `system-ui, Helvetica, sans-serif`        | Used for longer paragraphs and UI text where optimal legibility and compact spacing are needed.                           |
| **Monospace / Numeric** | **IBM Plex Mono**            | `monospace`                               | Used in analytics panels and numeric outputs for alignment precision.                                                     |

All typefaces are open-source and screen-optimized.  
If system fonts are used for performance, **SF Pro Display (macOS/iOS)** and **Segoe UI Variable (Windows 11)** are the preferred fallbacks.

---

##### 8.4.7.3 Typographic Scale

| Level        | Role                       | Weight        | Size (rem) | Line Height | Notes                                    |
| ------------ | -------------------------- | ------------- | ---------- | ----------- | ---------------------------------------- |
| H1           | Page title / Hero headline | 600           | 3.0        | 1.2         | Clear, confident section openers.        |
| H2           | Section heading            | 600           | 2.0        | 1.3         | Used for major content groupings.        |
| H3           | Subsection / Card title    | 500           | 1.5        | 1.35        | Consistent across cards and widgets.     |
| Body Text    | Paragraph / description    | 400           | 1.125      | 1.6         | Default text size for all content.       |
| Caption      | Metadata / labels          | 400 italic    | 0.875      | 1.4         | Used for timestamps, footnotes.          |
| Button Label | Actions / CTAs             | 600 uppercase | 1.0        | 1.2         | Compact, assertive call-to-action style. |

All sizes use fluid scaling with `clamp()` to adapt between mobile and desktop viewports.

---

##### 8.4.7.4 Implementation Guidelines

```css
@import url("https://fonts.googleapis.com/css2?family=Roboto+Flex:wght@400;500;600&family=Inter:wght@400;500&display=swap");

html {
  font-family: "Roboto Flex", "Inter", system-ui, sans-serif;
  font-synthesis: none;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

h1,
h2,
h3 {
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #111;
}

p {
  max-width: 70ch;
  color: #333;
  line-height: 1.6;
}
```

---

#### 8.4.8 Accessibility & Contrast

- All text-to-background contrast ratios ≥ 4.5 : 1 (WCAG 2.1 AA).
- Color-blind-safe palette verified for deuteranopia and protanopia.
- Hover and focus states rely on both **color** and **shadow/glow** cues.
- Maintain a **maximum line length of 65–75 characters** for body text.
- Avoid all-caps in large blocks of text.
- Preserve at least **1.4 em vertical spacing** between paragraphs.
- Headings and UI labels must maintain **≥ 4.5 : 1** color contrast ratio.
- Typography is validated for clarity on **Retina / 4K** and **OLED** displays.

---

## 9. Authentication Lifecycle

Authentication in **FitVibe** follows a **security-first, token-based model** with strict session management, GDPR compliance, and extensibility for future identity providers.

The authentication lifecycle is depicted in **Figure 9.1**.  
Risks and mitigations are summarized in **Table 9.1**.

```mermaid
flowchart LR
    REGISTER[Account Creation<br/>Email + Password<br/>Email Verification] --> LOGIN[Login<br/>Email + Password<br/>Optional TOTP 2FA]
    LOGIN --> ACCESS[Access Token: JWT RS256<br/>15 min validity]
    LOGIN --> REFRESH[Refresh Token<br/>Stored in DB with jti<br/>Expires 14d]
    ACCESS -->|Expired| REFRESH --> NEWACCESS[New Access Token<br/>Rotated Refresh]
    ACCESS --> API[API Requests<br/>Protected Endpoints]
    LOGOUT[Logout] -->|Revoke token| REFRESH
    RESETPW[Forgot / Reset Password<br/>Email + Token] --> LOGIN
    DELETE[Account Deletion: GDPR] --> TERMINATE[Anonymize Data + Invalidate Sessions]
```

---

#### 9.1.2 Account Creation

- **Registration Flow:**
  - User provides email + password.
  - Email verification required (activation link, expires in 24h).
- **Password Policy:**
  - Minimum 12 characters, at least one uppercase, one lowercase, one digit, one special character.
  - No birthday and user name
  - Stored using **bcryptjs** with unique per-user salt.
- **Account Confirmation:**
  - Account remains inactive until verified.
  - Verification email sent via provider-agnostic mailer (SMTP/SES/SendGrid).
  - One account per email allowed.

---

#### 9.1.3 Login

- **Primary login:** email + password.
- **Session security:**
  - Passwords checked with bcryptjs hash.
  - Upon success, issue:
    - **Access token (JWT, RS256)** → short-lived (15 min).
    - **Refresh token** → server-stored, tied to user ID + `jti`.
  - Both tokens returned via **httpOnly, Secure cookies**.
- **Optional MFA (Phase 2+):**
  - TOTP 2FA (RFC 6238, Google Authenticator/FreeOTP).
  - Backup codes (one-time, printable).

---

#### 9.1.4 Session Management

- **Access Token:**
  - JWT signed with RS256.
  - Contains minimal claims (user ID, scope, expiration).
  - Lifetime: ≤15 minutes.
- **Refresh Token:**
  - Stored server-side in DB with `jti` (rotation ID).
  - Rotated on every use; old tokens revoked.
  - Stored in `httpOnly Secure` cookies with `SameSite=Lax`.
- **Auto-Refresh:**
  - Axios interceptor retries requests on 401 → `/auth/refresh`.
- **Session Expiration:**
  - Refresh token lifetime configurable (e.g., 14 days).
  - Expired sessions require full login.

---

#### 9.1.5 Logout

- **Single-session logout:**
  - Refresh token revoked from DB.
  - Cookies cleared on client.
- **Global logout:**
  - All refresh tokens revoked for that user (`WHERE user_id = ?`).
  - Useful for compromised account recovery.

---

#### 9.1.6 Password Management

- **Change password:**
  - Requires current password.
  - No reuse of passwords.
  - Triggers forced re-login (all tokens invalidated).
- **Forgot password:**
  - Email with one-time token (expires in 15 minutes).
  - Token linked to `reset_requests` table in DB.
- **Password reset:**
  - Sets new password, invalidates all existing sessions.

---

#### 9.1.7 Token & Key Management

- **JWT Access Tokens:**
  - Signed with private key (RS256).
  - Public key exposed at `/.well-known/jwks.json` for validation.
- **Key Rotation:**
  - Private keys rotated annually (at minimum).
  - Old keys supported for a grace period (multi-key validation).
- **Refresh Token DB:**
  - Columns: `id`, `user_id`, `jti`, `expires_at`, `revoked_at`.
  - Indexes: `(user_id, jti)` for fast lookup.

---

#### 9.1.8 Account Recovery & Deletion

- **Account Recovery:**
  - Verified email reset flow.
  - Locked after multiple failed attempts (rate-limited).
- **Account Deletion (GDPR):**
  - User can request account deletion → triggers anonymization.
  - Retention exceptions for audit/logging (non-identifiable).
- **Data Export:**
  - DSR endpoint for user data export (JSON, machine-readable).

---

#### 9.1.9 Future Extensions (Phase 2+)

- **Social Login / OAuth 2.0:** Google, Apple, GitHub.
- **Role-based Access Control (RBAC):** Differentiated roles (user, admin, moderator).
- **Device Trust:** Recognized device tokens, with step-up auth for new devices.
- **Session Analytics:** Alerts for unusual login activity (geo/IP anomaly).

---

## 10. Backlog Items

### 10.1 Backend Backlog

- Admin moderation (report queue, suspensions, takedowns).
- Notifications (email/push, job queue).
- Wearables integration (Garmin/Strava).
- Nutrition module (meals, macros).
- AI recommendations (adaptive training).
- Leaderboards (global/friends).

### 10.2 Frontend Backlog

- Advanced dashboards (PBs, streaks).
- Social features (likes, bookmarks, comments).
- Follow
- Badges surfacing.
- Notifications UI.
- Extended feed features.

---

## 11. Project Structure

The repository layout is provided, CI/CD workflow illustrated in **Figure 11.1**.

The **FitVibe** system is organized as a **monorepo** using **pnpm workspaces** and optional **Turborepo** task caching. This approach ensures:

- **Separation of concerns** between frontend, backend, shared libraries, and infrastructure.
- **Consistency** in tooling (TypeScript, ESLint, Prettier) across all modules.
- **Scalability**, as new features (e.g., nutrition, wearables, AI modules) can be added without breaking existing functionality.
- **Traceability**, with version-controlled documentation, migrations, and infrastructure as code.

The structure reflects a clear distinction between **applications**, **shared packages**, and **infrastructure**:

```
fitvibe/
├── tests/
│   ├── setup/
│   │   ├── jest.setup.ts        # DB + env bootstrap
│   │   └── test-helpers.ts      # shared utils
│   ├── db/
│   │   └── sanity.test.ts       # DB sanity check
│   ├── api/
│   │   ├── auth.test.ts
│   │   ├── users.test.ts
│   │   └── sessions.test.ts
│   └── frontend/
│       └── components.test.ts   # optional in Phase 2
├── apps/
│   ├── frontend/
│   │   ├── public/
│   │   │   ├── favicon.ico
│   │   │   ├── index.html
│   │   │   └── robots.txt
│   │   ├── src/
│   │   │   ├── assets/.gitkeep
│   │   │   ├── components/
│   │   │   │   └── README.md            # describe UI primitives
│   │   │   ├── features/
│   │   │   │   └── README.md            # Planner, Logger, Progress, Feed, Profile
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts           # stub hook
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   └── Profile.tsx
│   │   │   ├── router/
│   │   │   │   └── index.tsx            # React Router placeholder
│   │   │   ├── state/
│   │   │   │   └── auth.store.ts        # Zustand/Redux stub
│   │   │   ├── styles/
│   │   │   │   └── globals.css
│   │   │   ├── utils/
│   │   │   │   └── i18n.ts              # EN/DE placeholder
│   │   │   ├── main.tsx
│   │   │   └── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   └── tsconfig.json
│   │
│   ├── backend/
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   ├── health/health.router.ts      # system health check (non-functional)
│   │   │   │   ├── auth/auth.router.ts
│   │   │   │   ├── users/users.router.ts
│   │   │   │   ├── exercises/exercises.router.ts
│   │   │   │   ├── sessions/sessions.router.ts
│   │   │   │   ├── progress/progress.router.ts
│   │   │   │   ├── points/points.router.ts
│   │   │   │   └── feed/feed.router.ts
│   │   │   ├── config/env.ts            # zod validated env
│   │   │   ├── db/
│   │   │   │   ├── migrations/.gitkeep
│   │   │   │   ├── seeds/.gitkeep
│   │   │   │   └── knexfile.ts
│   │   │   ├── jobs/.gitkeep            # BullMQ/Temporal (future)
│   │   │   ├── middlewares/
│   │   │   │   └── errorHandler.ts
│   │   │   ├── models/.gitkeep
│   │   │   ├── services/
│   │   │   │   └── mailer.service.ts    # stub mailer abstraction
│   │   │   ├── utils/logger.ts
│   │   │   ├── app.ts                   # express bootstrap
│   │   │   └── server.ts                # server entrypoint
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── docs/
│       ├── prd.md                       # product requirements
│       ├── architecture.mmd             # mermaid: HLA
│       ├── erd.mmd                      # mermaid: DB schema
│       └── auth-lifecycle.mmd           # mermaid: auth flow
│
├── packages/
│   ├── eslint-config/
│   │   └── index.js
│   ├── tsconfig/
│   │   └── tsconfig.base.json
│   ├── ui/
│   │   ├── Button.tsx
│   │   └── README.md
│   ├── utils/
│   │   ├── dates.ts
│   │   └── README.md
│   └── types/
│       └── index.ts                     # shared TS types (User, Session, Exercise)
│
├── infra/
│   ├── docker/
│   │   ├── Dockerfile.frontend
│   │   ├── Dockerfile.backend
│   │   ├── docker-compose.dev.yml
│   │   ├── docker-compose.prod.yml
│   │   └── nginx.conf
│   ├── github/
│   │   └── workflows/
│   │       ├── ci.yml
│   │       └── cd.yml
│   └── scripts/
│       ├── seed-dev.sh
│       ├── migrate.sh
│       └── rollback.sh
│
├── .gitignore
├── .dockerignore
├── .eslintrc.js
├── .prettierrc
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── jest.config.ts
└── package.json
```

---

### 11.1 Rationale

- **Monorepo Management**:

  - `pnpm` ensures efficient dependency management and disk space savings.
  - `turborepo` enables task caching, speeding up builds and tests across apps.

- **Strict Separation**:

  - **apps/** contains deployable code (frontend, backend, docs).
  - **packages/** holds reusable libraries (UI, utils, types) to avoid duplication.
  - **infra/** centralizes deployment, CI/CD, and operational scripts.

- **Developer Experience**:

  - Shared **TypeScript configs** and **linting rules** guarantee consistency.
  - Local development supports hot reloads with seeded demo data.
  - Documentation is versioned alongside source code (`apps/docs/`).

- **Extensibility**:
  - New domains (nutrition, AI coaching, wearables) can be introduced as new routers in `apps/backend/src/api` and features in `apps/frontend/src/features`.
  - Shared entities (`packages/types`) evolve without breaking existing modules.

> **Repository hygiene**: Uploads and other generated artifacts are intentionally **excluded** from VCS and Docker build contexts via `.gitignore` and `.dockerignore` to support GDPR and reduce image bloat.

---

### 11.2 CI/CD Workflow

To ensure **consistent collaboration, predictable deployments, and safe rollbacks**, the following CI/CD workflow applies.

```mermaid
flowchart TD
  Dev[Developer] -->|push/PR| Repo[GitHub Repository]

  subgraph CI[Continuous Integration]
    direction TB
    Repo --> Checkout[Checkout Code]
    Checkout --> Install[Install Dependencies + Restore Cache]
    Install --> Lint[Run Lint]
    Lint --> TypeCheck[Run Type Check]
    TypeCheck --> Test[Jest: Run Unit & Integration Tests]
    Test --> Build[Build FE & BE Artifacts]
    Build --> DockerBuild[Build Docker Images]
    DockerBuild --> PushImages[Push to GHCR: SHA + SemVer]
    Lint -.->|fail| CI_Fail[❌ CI Failed]
    TypeCheck -.->|fail| CI_Fail
    Test -.->|fail| CI_Fail
  end

  PushImages --> Approval[🔒 Manual Approval Required]

  subgraph CD[Continuous Deployment]
    direction TB
    Approval --> Deploy[Deploy Job]
    Deploy --> Runner[GitHub Runner / SSH to Host]
    Runner --> Pull[Pull Images from GHCR]
    Pull --> Compose[Run docker compose prod]
    Compose --> HealthCheck[Run Health Checks]
    HealthCheck -->|ok| Services[✅ Services Updated]
    HealthCheck -.->|fail| Rollback[Rollback to Previous Image]
  end
```

---

#### 11.2.1 Local Development

- **Clone & Install**

  ```bash
  git clone <repo-url>
  cd fitvibe
  pnpm install
  ```

- **Run Applications**

  ```bash
  # frontend (Vite + React)
  pnpm --filter frontend dev

  # backend (Express API)
  pnpm --filter backend dev
  ```

- **Run Both in Parallel** (if a root `dev` script exists)

  ```bash
  pnpm dev
  ```

- **Database**

  ```bash
  # Run migrations
  pnpm --filter backend migrate

  # Seed demo data
  pnpm --filter backend seed-dev
  ```

---

#### 11.2.2 Code Standards

- **TypeScript** is mandatory for all code.
- **ESLint + Prettier** enforce style rules (`pnpm lint` before commit).
- **Folder naming convention**: lowercase, kebab-case (`session-logger`, `user-profile`).
- **Commit messages** follow **Conventional Commits** (e.g., `feat(auth): add refresh token rotation`).

---

#### 11.2.3 Testing

FitVibe uses **Jest + ts-jest** as its universal testing framework across backend, shared packages, and database integration.  
Endpoints listed in § 6.4.1 are covered by integration tests ensuring conformance with FR-1 … FR-7.
All test logic is centralized under the top-level `/tests` directory for unified execution and reporting.

Test coverage thresholds:
- **Lines / Branches:** ≥ 80 %
- **CI Enforcement:** build fails below threshold.

| Feature | Unit | Integration | Contract | Security | E2E | Perf |
|----------|:----:|:-----------:|:--------:|:--------:|:---:|:---:|
| Auth | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Users | ✅ | ✅ | ✅ | – | ✅ | – |
| Exercises | ✅ | ✅ | ✅ | – | ✅ | – |
| Sessions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Points | ✅ | ✅ | ✅ | – | – | ✅ |
| Feed | ✅ | ✅ | ✅ | – | ✅ | – |


##### Test Architecture

| Type                            | Scope                   | Location                       | Description                                                                                          |
| ------------------------------- | ----------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **Unit Tests**                  | Backend, Shared Utils   | `/tests/api/`, `/tests/utils/` | Validate individual services, API endpoints, and utility functions using isolated mocks.             |
| **Integration Tests**           | Database, API Contracts | `/tests/db/`, `/tests/api/`    | Run against a seeded PostgreSQL instance (via Knex) to verify schema, migrations, and API data flow. |
| **End-to-End Tests (optional)** | Full System             | `/tests/frontend/`             | Use Cypress or Playwright in staging to validate real browser flows.                                 |
| **Sanity Tests**                | Database Connectivity   | `/tests/db/sanity.test.ts`     | Verifies schema presence and seed data before API startup.                                           |

##### Test Execution

- All tests are written in **TypeScript** (`.test.ts` / `.test.tsx`) and run via `jest` using the monorepo root configuration.
- Jest setup is defined in `jest.config.ts` and bootstrapped through `tests/setup/jest.setup.ts`.
- Run all tests from the repository root:
  ```bash
  pnpm test
  ```

##### CI/CD Integration

During CI, Jest runs after linting and type checking:

```mermaid
flowchart TD
    Lint --> TypeCheck
    TypeCheck --> Test[Jest: Run Unit & Integration Tests]
    Test --> Build
```

- **Coverage threshold:** ≥ 80 % lines and branches (tracked in CI).
- **Fail-fast policy:** build fails on test or coverage errors.
- **Test environment:** ephemeral PostgreSQL container seeded via Knex migrations and seed files.

- Run all tests:
  ```bash
  pnpm test
  ```
---

#### 11.2.4 Continuous Integration (CI)

CI builds multi-architecture Docker images (amd64, arm64) for Raspberry Pi compatibility.

- Runs on **GitHub Actions**:

  1. Checkout → `pnpm install` with cache restore.
  2. Run lint → type-check → tests.
  3. Build frontend and backend artifacts.
  4. Build Docker images and push to **GHCR**, tagged with:
     - `:sha-<commit>`
     - `:v<semver>`

- CI fails if **any stage** fails.

---

#### 11.2.5 Continuous Deployment (CD)

- **Manual approval required** for production deployment.
- Workflow:

  1. Connect to host via GitHub Runner (or SSH).
  2. Pull latest tagged images from GHCR.
  3. Run:
     ```bash
     docker compose -f infra/docker/docker-compose.prod.yml up -d
     ```
  4. Run health checks (HTTP 200, DB migration status).
  5. If checks fail → rollback to previous image.

- **Rollback Command** example:
  ```bash
  docker compose -f infra/docker/docker-compose.prod.yml pull app_backend:sha-<prev-commit>
  docker compose -f infra/docker/docker-compose.prod.yml up -d
  ```

---

#### 11.2.6 Documentation

- **PRD**, **ERD**, and **architecture diagrams** live under `apps/docs/`.
- Changes to architecture require an **Architecture Decision Record (ADR)** in `apps/docs/`.
- All diagrams use **Mermaid syntax** to remain version-controllable.

---

### 11.3 Contribution Guidelines

To maintain a **high-quality, secure, and sustainable codebase**, the following contribution rules apply.

---

#### 11.3.1 Branching Strategy

- **Main branch** → always production-ready.
- **Develop branch (optional)** → integrates tested features before merging to `main`.
- **Feature branches** → named as `feature/<scope>` (e.g., `feature/auth-2fa`).
- **Bugfix branches** → named as `fix/<scope>` (e.g., `fix/session-timezone`).
- **Release branches** → `release/vX.Y.Z`.
- **Hotfix branches** → `hotfix/<scope>`.

---

#### 11.3.2 Pull Requests (PRs)

- PRs must be reviewed by **at least one senior developer**.
- PRs must pass the **full CI pipeline** (lint, type-check, unit/integration tests, build).
- PRs must include:
  - Scope of changes.
  - Related issue or ticket reference.
  - Testing performed.
- Draft PRs are encouraged for early feedback.

---

#### 11.3.3 Commit & Release Policy

- Commits follow **Conventional Commits** (e.g., `feat`, `fix`, `docs`, `chore`, `refactor`).
- Semantic Versioning:
  - **MAJOR** → incompatible API changes.
  - **MINOR** → backward-compatible features.
  - **PATCH** → backward-compatible fixes.
- Releases:
  - Tagged in GitHub (`vX.Y.Z`).
  - Docker images tagged in GHCR with both **semver** and **commit SHA**.

---

#### 11.3.4 Code Ownership

- **Backend API**: owned by backend team. Frontend reviewers confirm API contract usage.
- **Frontend features**: owned by frontend team. Backend reviewers validate integration consistency.
- **Shared packages**: changes require **dual review** from both frontend and backend teams.

---

#### 11.3.5 Security & Compliance

- No secrets committed to VCS.
- All environment variables must be validated via **zod schemas** in `apps/backend/src/config/env.ts`.
- Security-sensitive PRs (auth, GDPR, infra) require **two approvals**.
- CI/CD must pass **security checks** (dependency scans, secret scans) before deployment.
- **Rollback policy awareness**: contributors must ensure deployments include a tested rollback strategy.

---

#### 11.3.6 Documentation & ADRs

- All architecture-related changes require an **Architecture Decision Record (ADR)** entry in `apps/docs/adr/`.
- ADRs must describe:
  - Problem statement.
  - Considered options.
  - Final decision & rationale.
  - Consequences and trade-offs.
- **Mermaid diagrams** are the default format for visual documentation.

---

## 12. Glossary

- **FR**: Functional Requirement – specifies what the system shall do.
- **ERD**: Entity-Relations Dia
- **NFR**: Non-Functional Requirement – specifies system qualities and constraints.
- **MVP**: Minimum Viable Product – smallest feature set that delivers value to users.
- **DSR**: Data Subject Rights – GDPR rights (access, rectification, deletion, portability).
- **SLO**: Service Level Objective – agreed target level for service availability or performance.
- **JWT**: JSON Web Token – token format used for authentication.
- **TOTP**: Time-based One-Time Password – algorithm for two-factor authentication.
- **RPO**: Recovery Point Objective – maximum acceptable data loss window in disaster recovery.
- **RTO**: Recovery Time Objective – maximum acceptable downtime for recovery.
- **ADR**: Architecture Decision Record – structured documentation of key technical decisions.
- **CI/CD**: Continuous Integration / Continuous Deployment – automated pipelines for building, testing, and deploying code.
- **GDPR**: General Data Protection Regulation – EU regulation governing data protection and privacy.

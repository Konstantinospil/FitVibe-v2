# FitVibe – Testing & Quality Assurance Plan (v2.0)

**Product:** FitVibe – Training Planner & Logger Web App  
**Author:** Konstantinos Pilpilidis  
**Revision:** v2.0  
**Date:** 2025-10-05  
**Scope:** Unified QA baseline for MVP (Frontend, Backend, Infrastructure)  
**Cross-Reference:** PRD §4-6-11 / TDD §4-11  

---

## Table of Contents
1. Purpose & Scope  
2. QA Objectives  
3. Acceptance Criteria (FR & NFR)  
4. Requirements Traceability Matrix (RTM)  
5. Test Levels & Responsibilities  
6. Test Strategy (per Layer)  
7. Test Environments & Data  
8. Quality Metrics & Thresholds  
9. Toolchain & Automation  
10. Accessibility & Usability Testing  
11. Performance & Load Testing  
12. Security & Compliance Testing  
13. CI/CD Integration & Reporting  
14. Defect Management Workflow  
15. Continuous Improvement Process  
16. Glossary  

---

## 1  Purpose & Scope
This plan defines the quality-assurance framework for the **FitVibe MVP**.  
It unifies all test and validation activities across **frontend**, **backend**, and **infrastructure**, ensuring that:

- Functional Requirements (FR-1 … FR-8) in the PRD are implemented and verified.  
- Non-Functional Requirements (NFR §5) are measurable and continuously monitored.  
- All QA stages integrate seamlessly into CI/CD pipelines.

---

## 2 QA Governance

| Role | Responsibility |
|------|----------------|
| QA Lead | Approves test plans, monitors coverage, reports to PO |
| Product Owner | Defines acceptance criteria, signs off on UAT |
| Dev Lead | Ensures CI/CD QA integration and release gates |
| Security Officer | Oversees vulnerability management |
| QA Reviewer | Performs quarterly audit of QA artifacts |

**Review cadence:** QA Plan reviewed each release or quarterly, whichever earlier.

---

## 3  QA Objectives
| Goal | Target |
|------|---------|
| Functional correctness | 100 % pass rate on register → login → plan → complete flow |
| Test coverage | ≥ 80 % lines + branches per module |
| Regression runtime | < 15 min for CI pipeline |
| Frontend LCP | < 2.5 s on mid-tier 4 G device |
| API latency (p95) | < 300 ms |
| Accessibility | WCAG 2.1 AA conformance |
| Availability | ≥ 99.5 % SLO |
| Security | 0 critical CVEs / build |
| GDPR & privacy | 100 % compliance verified quarterly |

---

## 4 QA Out-of-Scope (MVP)

| Area | Reason for Exclusion | Planned Phase |
|-------|----------------------|----------------|
| Real-time collaboration | Deferred to Phase 2 | 2 |
| Nutrition tracking | Not implemented in MVP | 3 |
| Wearables integration | Hardware dependency | 3 |
| Notification engine | Cost optimization | 2 |

---

## 5  Acceptance Criteria (Functional & Non-Functional)

### 5.1 Functional Acceptance Criteria

### 5.1 Functional Acceptance Criteria (with Test IDs)

| ID | Requirement (PRD §4) | Acceptance Criterion | Verification Method |
|----|----------------------|----------------------|---------------------|
| **AC-1.1** | FR-1 User Mgmt & Security | User must verify email before login (15 min TTL) | Unit (Jest) |
| **AC-1.2** | FR-1 User Mgmt & Security | System locks account after 10 failed login attempts and requires CAPTCHA | Integration (Supertest) |
| **AC-1.3** | FR-1 User Mgmt & Security | Password policy enforced: ≥ 12 chars, includes upper/lower/number/symbol | Unit + Integration |
| **AC-1.4** | FR-1 User Mgmt & Security | GDPR export and delete requests processed ≤ 30 days | E2E + Manual audit |
| **AC-2.1** | FR-2 Profile & Settings | Alias must be unique (case-insensitive) | Integration |
| **AC-2.2** | FR-2 Profile & Settings | Avatar ≤ 5 MB (JPEG/PNG/WebP) renders correctly in UI | E2E (Playwright) |
| **AC-2.3** | FR-2 Profile & Settings | Each update creates a snapshot in `user_state_history` | Integration |
| **AC-3.1** | FR-3 Exercise Library | Delete operation archives record (soft-delete) | Integration |
| **AC-3.2** | FR-3 Exercise Library | Public visibility flag controls discovery in feed | Integration + E2E |
| **AC-3.3** | FR-3 Exercise Library | Exercise name snapshot retained in `session_exercises` | DB test |
| **AC-4.1** | FR-4 Sessions | System stores time-zone-safe timestamps (DST verified) | Unit + Integration |
| **AC-4.2** | FR-4 Sessions | Planned vs Actual comparison visible in session view | E2E |
| **AC-4.3** | FR-4 Sessions | Cloned session preserves attribution to original | E2E |
| **AC-5.1** | FR-5 Progress & Analytics | Aggregations by date & category return accurate totals | Unit |
| **AC-5.2** | FR-5 Progress & Analytics | Personal bests (PBs) & streaks calculated correctly | Integration |
| **AC-5.3** | FR-5 Progress & Analytics | Export endpoints deliver valid CSV / JSON | E2E |
| **AC-6.1** | FR-6 Points System | Points awarded automatically on `session.complete()` | Integration |
| **AC-6.2** | FR-6 Points System | Scoring formula produces only non-negative bounded values | Unit |
| **AC-6.3** | FR-6 Points System | Anti-gaming checks logged when thresholds exceeded | Perf (k6) + Security |
| **AC-7.1** | FR-7 Sharing & Community | Default privacy = private for all sessions | Unit + Integration |
| **AC-7.2** | FR-7 Sharing & Community | Public feed is paginated + searchable | Integration |
| **AC-7.3** | FR-7 Sharing & Community | Cloned session includes attribution metadata | E2E |
| **AC-8.1** | FR-8 Internationalization (i18n) | Language auto-detected from browser / profile | Unit |
| **AC-8.2** | FR-8 Internationalization (i18n) | Manual language switch persists between sessions | E2E |
| **AC-8.3** | FR-8 Internationalization (i18n) | AI-translated text cached 7 days in `translation_cache` | Integration |
| **AC-8.4** | FR-8 Internationalization (i18n) | No PII or sensitive data transmitted to external translation APIs | Security (ZAP) + Manual review |

### 5.2 Non-Functional Acceptance Criteria (PRD §5)

| Category | Metric | Target | Verification |
|-----------|--------|---------|--------------|
| **Security** | Auth / 2FA / CORS / CSRF | All middleware active per TDD §10 | Automated security tests |
| **Performance** | API p95 latency | < 300 ms | k6 CI run |
| **Availability** | Uptime (SLO) | ≥ 99.5 % monthly | Prometheus alert |
| **Accessibility** | WCAG 2.1 AA | ≥ 90 % axe score | Lighthouse CI |
| **Privacy & GDPR** | DSR response time | ≤ 30 days | Manual audit |
| **Backup / DR** | RPO ≤ 24 h  RTO ≤ 4 h | Quarterly restore test |
| **Observability** | Logs & Metrics | 100 % routes instrumented | Prometheus & Grafana |

---

## 6  Requirements Traceability Matrix (RTM)

| PRD Ref | Acceptance Criteria IDs | TDD Section | Test Case / Path | Verification Type |
|:--------|:------------------------|:-------------|:-----------------|:------------------|
| **FR-1 User Mgmt & Security** | AC-1.1 → AC-1.4 | § 4.2 Auth / § 5 F2 + F3 | `/tests/api/auth.test.ts`, `/tests/e2e/auth.spec.ts`, `/tests/security/auth_zap_scan.yaml` | Unit + Integration + E2E + Security |
| **FR-2 Profile & Settings** | AC-2.1 → AC-2.3 | § 4.3 Users | `/tests/api/users.test.ts`, `/tests/e2e/profile.spec.ts` | Integration + E2E |
| **FR-3 Exercise Library** | AC-3.1 → AC-3.3 | § 4.4 Exercises | `/tests/api/exercises.test.ts`, `/tests/db/exercises_schema.test.ts` | Integration + DB Schema |
| **FR-4 Sessions (Plan / Log / Clone)** | AC-4.1 → AC-4.3 | § 4.5 Sessions + F4 F5 F6 | `/tests/api/sessions.test.ts`, `/tests/e2e/session.spec.ts`, `/tests/perf/session_load.k6.js` | Integration + E2E + Performance |
| **FR-5 Progress & Analytics** | AC-5.1 → AC-5.3 | § 4.6 Progress | `/tests/api/progress.test.ts`, `/tests/frontend/dashboard.spec.ts` | Unit + Integration + UI |
| **FR-6 Points System** | AC-6.1 → AC-6.3 | § 4.7 Points + F5 | `/tests/api/points.test.ts`, `/tests/perf/points_stress.k6.js` | Integration + Performance + Security |
| **FR-7 Sharing & Community** | AC-7.1 → AC-7.3 | § 4.8 Feed + F6 | `/tests/api/feed.test.ts`, `/tests/e2e/feed.spec.ts` | Integration + E2E |
| **FR-8 Internationalization (i18n)** | AC-8.1 → AC-8.4 | § 4.10 i18n / Localization | `/tests/api/i18n.test.ts`, `/tests/frontend/i18n.spec.tsx`, `/tests/security/pii_sanitization.test.ts` | Unit + Integration + Accessibility + Security |
| **NFR 5.1 Security Middleware** | AC-1.2, AC-8.4 | § 10 Security | `/tests/security/*.test.ts` | Static + Dynamic Security Tests |
| **NFR 5.3 Performance** | AC-4.3, AC-6.3 | § 11.3 Performance Testing | `/tests/perf/k6/*.js` | Load Testing |
| **NFR 5.5 Accessibility** | AC-8.1 → AC-8.2 | QA § 13 Accessibility | `/tests/accessibility/*.spec.ts` | axe-core + Lighthouse |
| **NFR 5.6 Observability** | – | § 13.1 – 13.3 Monitoring & Metrics | `/tests/metrics/prometheus_exposure.test.ts` | Monitoring Validation |
| **NFR 5.7 Backup & DR** | – | § 13 Operability / DR Policy | manual restore procedure logs | Operational Test (Audit) |


---

## 7  Test Levels & Responsibilities
| Level | Owner | Purpose |
|--------|--------|---------|
| **Unit** | Developers | Validate single functions / services |
| **Integration** | Backend team | Validate API ↔ DB interaction |
| **Contract** | Full-stack devs | DTO ⇄ OpenAPI alignment |
| **E2E** | QA + FE dev | Simulate user journeys |
| **Security** | DevOps + Auditor | Static & dynamic scans |
| **Performance** | DevOps | Load / stress tests (k6) |
| **Accessibility** | UX Team | axe + Lighthouse CI |
| **UAT** | Product Owner | Sign-off vs acceptance criteria |

---

## 8  Test Strategy (per Layer)

### 8.1 Backend (API)
- Framework: Jest + Supertest  
- Isolation: Ephemeral PostgreSQL in Docker  
- Mocks: Mailer, time provider, UUIDs  
- Coverage: ≥ 80 % lines & branches  

### 8.2 Frontend (SPA)
- Framework: Vitest / Jest + React Testing Library  
- Mock API layer (Axios Mock Adapter)  
- Snapshot tests for Planner, Logger, Progress Chart  

### 8.3 Contract Tests
- zod ⇄ OpenAPI validation pipeline (`ts-to-openapi`)  
- Run on every build to detect schema drift  

### 8.4 End-to-End (E2E)
- Tool: Playwright (Chromium + WebKit + Firefox)  
- Flows: Register → Login → Plan → Complete → View Progress  
- Auth helper for cookie-based login  

---

## 9  Test Environments & Data
| Env | Purpose | DB Source | Access |
|------|----------|-----------|---------|
| **Local** | Developer testing | Local Postgres + seeded data | localhost |
| **CI** | Automated pipeline | Ephemeral Docker PG | GitHub Actions |
| **Staging** | Pre-release / UAT | Snapshot of prod schema | restricted |
| **Production** | Monitoring / Smoke | Live readonly / health | limited |

Data protection: test accounts use non-PII seed records (`seed-dev.ts`).

### QA Test Data Management
- Synthetic, non-PII data only  
- Ephemeral databases destroyed post-run  
- Access restricted to CI service accounts  
- No production data replicated  


### 10 QA Trend Visualization
- Grafana dashboards:
  - **Coverage Trend** (backend/frontend)
  - **Flaky Test Index** (tests failing ≥2x/quarter)
  - **Defect Density per 1 KLOC**
- QA reports auto-published to `/reports/qa_summary.html`.


---

## 11  Quality Metrics & Thresholds
| Metric | Target | Measured By |
|---------|---------|-------------|
| Unit coverage | ≥ 80 % | Jest report |
| Integration pass rate | 100 % | CI summary |
| E2E flows | 100 % | Playwright dashboard |
| Accessibility score | ≥ 90 % | axe-core / Lighthouse |
| Perf p95 | < 300 ms | k6 metrics |
| LCP (frontend) | < 2.5 s | Lighthouse CI |
| Error budget (SLO 99.5 %) | < 0.5 % downtime | Prometheus alerts |

---

## 12  Toolchain & Automation
| Area | Tool | Notes |
|------|------|------|
| Testing | Jest / Vitest | Unified config `jest.config.ts` |
| E2E | Playwright | Headless runs in CI |
| Accessibility | axe-core / Lighthouse CI | Auto audit pipeline |
| Load | k6 | `/tests/load/*.js` scenarios |
| Security | npm-audit / Snyk / OWASP ZAP | Weekly scans |
| Coverage | Codecov / GH Summary | PR comments + threshold gate |
| CI | GitHub Actions | Matrix: backend / frontend / tests |

---

## 13  Accessibility & Usability Testing
- Automated: Lighthouse CI + axe-core  
- Manual: keyboard nav + JAWS/NVDA  
- Contrast: WCAG AA ≥ 4.5 : 1 validated via Figma/DevTools  
- Usability: 10-user heuristic evaluation (post-MVP)

---

## 14  Performance & Load Testing
- Tool: k6 (TypeScript scenarios)  
- Baseline: 100 req/s, error < 0.1 %  
- Metrics: p95 < 300 ms, p99 < 600 ms  
- Schedule: nightly (staging) + monthly trend review  
- Output: Grafana dashboard (`http_request_duration_seconds`)

---

## 15  Security & Compliance Testing
| Type | Method | Frequency |
|------|---------|-----------|
| Static dependency scan | `npm audit --production` | each build |
| Dynamic scan | OWASP ZAP baseline | weekly |
| Pen test | External audit | pre-Phase 2 launch |
| GDPR review | Checklist (DSR, retention) | quarterly |
| Secrets detection | GitHub Secret Scan | continuous |

---

## 16  CI/CD Integration & Reporting
1. Lint → Type-Check → Unit Tests  
2. Integration Tests (ephemeral DB)  
3. E2E Playwright (on push to main)  
4. Coverage → Codecov PR comment  
5. Lighthouse audit → fail < 90 score  
6. Security scan → fail on high CVE  
7. Docker build → push GHCR → manual CD  

Reports: HTML coverage (`/coverage`), JUnit XML (CI artifact), Playwright trace, Accessibility reports (`/reports/accessibility/`).

---

## 17  Defect Management Workflow
| Step | Description |
|------|-------------|
| Detection | CI failure, QA test, or user feedback |
| Logging | GitHub issue → label `bug` + priority |
| Triage | PO + Lead Dev assign S1–S4 |
| Fix | Feature branch → PR → CI must pass |
| Verification | QA closes after regression test |
| Metrics | MTTR < 2 days for S1/S2 |

### 18 Severity & Priority Matrix
| Severity | Description | Target Fix Time | Responsible |
|-----------|--------------|-----------------|--------------|
| **S1 – Critical** | Production outage / data loss | ≤ 24 h | DevOps + QA |
| **S2 – Major** | Feature blocked, workaround exists | ≤ 3 d | Dev Lead |
| **S3 – Minor** | Cosmetic / low impact | ≤ 7 d | Dev |
| **S4 – Trivial** | Typos / docs | Next sprint | Dev |

---

## 19  Continuous Improvement Process
- Weekly QA sync for flaky/failing tests  
- Monthly coverage trend chart (Grafana)  
- Quarterly post-mortem for escaped defects  
- Add new tests for each production incident  

---

## 20  Glossary
**AC** – Acceptance Criteria 
**ADR** – Architecture Decision Record  
**CI/CD** – Continuous Integration / Deployment 
**DSR** – Data Subject Rights  
**E2E** – End-to-End Testing 
**FR/NFR** – Functional / Non-Functional Requirement  
**LCP** – Largest Contentful Paint 
**MTTR** – Mean Time to Repair  
**PII** – Personally Identifiable Information 
**RTM** – Requirements Traceability Matrix  
**SLO** – Service Level Objective 
**WCAG** – Web Content Accessibility Guidelines  

---

> **Repository Location:** `apps/docs/FitVibe_QA_Plan.md`  
> All changes to this document must undergo the same review and CI policy as source code.

---

## Appendix A – Risk-Based Testing Matrix
| Risk Area | Likelihood | Impact | Risk Level | Mitigation / Test Focus |
|------------|-------------|---------|-------------|--------------------------|
| Auth & Token Rotation | High | High | 🔴 Critical | Full regression each release |
| Session Completion Logic | Medium | High | 🟠 Major | Integration + Perf test |
| Translation Service (AI) | Medium | Medium | 🟡 Moderate | Mock API, cache validation |
| Feed Privacy | Low | High | 🟡 Moderate | Security + E2E clone tests |
| Analytics Charts | Low | Medium | 🟢 Minor | Snapshot validation |

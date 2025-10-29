# FitVibe — AC Master (Expanded)

_Date: 2025-10-29_

> NOTE: Complex ACs are decomposed into parts (A, B, C …). IDs remain stable across iterations.

| Type | Requirement ID | Requirement Title | AC ID | Acceptance Criteria (SMART) | Test Method | Evidence | Owner | Priority | Gate | Status | Trace → PRD | Trace → TDD |
| :--- | :------------- | :---------------- | :---- | :-------------------------- | :---------- | :------- | :---- | :------- | :--- | :----- | :---------- | :---------- |

### FR‑001 — User Registration

| FR | FR-001 | User Registration | FR-001-AC01-A | Given a valid email+password, POST /auth/register creates a user record and sends a verification email within **<1s**. | API integration | HTTP recordings, DB snapshot (user+token), email spool | ENG/QA | High | GOLD | Proposed | PRD §Auth | TDD §Auth-API |
| FR | FR-001 | User Registration | FR-001-AC01-B | Password policy enforced: length ≥12, 1 upper, 1 lower, 1 digit or symbol; weak passwords rejected with code `WEAK_PASSWORD`. | Unit + API negative | Validator test, sample payloads | ENG/QA | High | GOLD | Proposed | PRD §Auth | TDD §Auth-API |
| FR | FR-001 | User Registration | FR-001-AC02-A | Unverified users cannot access protected routes; responses are **401** (API) or redirect to **/login** (SPA). | E2E (Playwright) | Screenshots, 401 traces | ENG/QA | High | GOLD | Proposed | PRD §Auth | TDD §Middleware |
| FR | FR-001 | User Registration | FR-001-AC02-B | Email verification token TTL **= 24h**; using an expired token returns **410 Gone** and offers resend flow. | Integration + E2E | DB token TTL, HTTP recordings | ENG/QA | High | GOLD | Proposed | PRD §Auth | TDD §Auth-API |
| FR | FR-001 | User Registration | FR-001-AC02-C | Resend verification limited to **5 requests/24h/IP**; further attempts respond **429** with `Retry-After`. | Rate-limit integration | Header dump, logs | ENG/SEC | High | GOLD | Proposed | PRD §Auth | TDD §Security |
| FR | FR-001 | User Registration | FR-001-AC03-A | Duplicate registration for an existing email is rejected with `409 CONFLICT`; no second user record is created. | API negative | DB before/after | ENG/QA | High | GOLD | Proposed | PRD §Auth | TDD §Auth-API |
| FR | FR-001 | User Registration | FR-001-AC03-B | Email normalization (case-folding/trim) prevents duplicates differing only by case/whitespace. | Unit | Normalization tests | ENG | Medium | SILVER | Proposed | PRD §Auth | TDD §Auth-API |
| FR | FR-001 | User Registration | FR-001-AC03-C | After a successful verification the user can login in the application. | Unit | DB before/after | ENG | Medium | SILVER | Proposed | PRD §Auth | TDD §Auth-API |

### FR‑002 — Login & Session

| FR | FR-002 | Login & Session | FR-002-AC01-A | On valid credentials, issue RS256 access token (TTL ≤15m) and refresh token (TTL ≤30d); tokens contain `sub`, `iat`, `exp`, `iss`, `aud`. | Unit + API | JWT samples, config snapshot | ENG/QA | High | GOLD | Proposed | PRD §Auth | TDD §Sessions |
| FR | FR-002 | Login & Session | FR-002-AC01-B | Secure cookie flags (HttpOnly, Secure, SameSite=Lax/Strict) configured per environment; local storage not used for secrets. | Integration | Set-Cookie headers | ENG/SEC | High | GOLD | Proposed | PRD §Security | TDD §Sessions |
| FR | FR-002 | Login & Session | FR-002-AC02-A | Logout invalidates the current refresh token server-side; subsequent refresh fails with **401** within **≤1s**. | Integration | Revocation log | ENG/QA | High | GOLD | Proposed | PRD §Auth | TDD §Sessions |
| FR | FR-002 | Login & Session | FR-002-AC02-B | Refresh rotation with replay detection: attempting reuse of a rotated token locks that session and logs a security event. | Unit + Integration | Audit event, JWT samples | ENG/SEC | High | GOLD | Proposed | PRD §Security | TDD §Sessions |
| FR | FR-002 | Login & Session | FR-002-AC03-A | Incorrect credentials return a single generic error; timing does not differ by user existence (±5ms). | Security negative | Timing histogram | ENG/SEC | High | GOLD | Proposed | PRD §Security | TDD §Sessions |
| FR | FR-002 | Login & Session | FR-002-AC03-B | Account lockout after **10** failed attempts per 15m/IP+account, auto-unlock after 15m; 2FA unaffected. | Integration | Lockout records | ENG/SEC | High | GOLD | Proposed | PRD §Security | TDD §Sessions |
| FR | FR-002 | Login & Session | FR-002-AC04-A | Optional 2FA (TOTP): enroll with QR, verify once, backup codes (10 one-time). | E2E + Unit | QR fixture, code list | ENG/QA | Medium | SILVER | Proposed | PRD §Auth | TDD §Sessions |

### FR‑003 — Pre‑Login Access Restricted (Auth‑Wall)

| FR | FR-003 | Auth‑Wall | FR-003-AC01 | Unauthenticated SPA navigation to any route except `/login` and `/register` redirects to `/login`. | E2E | Screenshots, router traces | ENG/QA | High | GOLD | Proposed | PRD §Privacy | ADR‑0012; TDD §Middleware |
| FR | FR-003 | Auth‑Wall | FR-003-AC02 | Unauthenticated API calls to `/api/**` return **401** `{ error: "unauthorized" }`. | API integration | HTTP traces | ENG/QA | High | GOLD | Proposed | PRD §Privacy | ADR‑0012; TDD §Middleware |
| FR | FR-003 | Auth‑Wall | FR-003-AC03-A | Legacy public/share links return **404**; | E2E negative | Screenshots | ENG/QA | High | GOLD | Proposed | PRD §Privacy | TDD §Middleware |
| FR | FR-003 | Auth‑Wall | FR-003-AC03-B | Static assets for auth pages remain reachable (200) and cacheable. | Static tests | HTTP headers | ENG | Medium | SILVER | Proposed | PRD §Privacy | TDD §Frontend |

### FR‑004 — Training Plan Management

| FR | FR-004 | Planner | FR-004-AC01-A | Create/edit/delete plans persist within **≤500 ms** and are visible after reload. | Integration | DB diff + UI screenshots | ENG | Medium | SILVER | Proposed | PRD §Planner | TDD §Planner |
| FR | FR-004 | Planner | FR-004-AC01-B | Concurrency: last-writer-wins with conflict banner if stale ETag; user can retry. | Integration | ETag headers | ENG | Medium | SILVER | Proposed | PRD §Planner | TDD §Planner |
| FR | FR-004 | Planner | FR-004-AC02-A | Drag‑and‑drop scheduling updates without full reload; calendar re-renders under **150 ms** on modern desktop. | E2E | Perf trace | ENG | Medium | SILVER | Proposed | PRD §Planner | TDD §Planner |
| FR | FR-004 | Planner | FR-004-AC02-B | Mobile drag/resize works via touch gestures; no scroll-jank > 50ms long tasks. | E2E mobile emu | Perf trace | ENG | Medium | SILVER | Proposed | PRD §Planner | TDD §Planner |
| FR | FR-004 | Planner | FR-004-AC03-A | Overlapping sessions detected client-side before save with actionable message and highlight. | Unit + E2E | UI screenshots | ENG | Medium | SILVER | Proposed | PRD §Planner | TDD §Rules |
| FR | FR-004 | Planner | FR-004-AC03-B | Server re-validates overlaps; rejects with 422 and returns conflicting session IDs. | API negative | HTTP traces | ENG | Medium | SILVER | Proposed | PRD §Planner | TDD §API |

### FR‑005 — Workout Logging & Import

| FR | FR-005 | Logging & Import | FR-005-AC01-A | Start/stop records duration, distance, HR; edits audit‑logged (who/when/what). | Unit + Integration | Audit excerpts | ENG | Medium | SILVER | Proposed | PRD §Logging | TDD §Importers |
| FR | FR-005 | Logging & Import | FR-005-AC01-B | Offline logging buffers events and syncs within **≤5s** after reconnect. | E2E (PWA offline) | Network trace | ENG | Medium | SILVER | Proposed | PRD §Logging | TDD §Frontend |
| FR | FR-005 | Logging & Import | FR-005-AC02-A | Import GPX/FIT parses **≥99%** valid samples; malformed inputs produce user-facing error without crash. | Fuzz + fixtures | Corpus results | ENG | Medium | SILVER | Proposed | PRD §Logging | TDD §Importers |
| FR | FR-005 | Logging & Import | FR-005-AC02-B | FIT file EXIF/metadata with GPS/HR respected; timezone normalization applied. | Unit | Parser snapshots | ENG | Medium | SILVER | Proposed | PRD §Logging | TDD §Importers |
| FR | FR-005 | Logging & Import | FR-005-AC03-A | Editing pace/elevation recomputes derived metrics consistently within **≤200 ms**. | Integration | Recalc logs | ENG | Medium | SILVER | Proposed | PRD §Logging | TDD §Calculations |
| FR | FR-005 | Logging & Import | FR-005-AC03-B | Recalculation is idempotent for the same inputs; snapshot tests stable. | Unit | Snapshots | ENG | Medium | SILVER | Proposed | PRD §Logging | TDD §Calculations |

### FR‑006 — Badges & Points

| FR | FR-006 | Gamification | FR-006-AC01-A | Scoring rules are deterministic and pure; property-based tests hold across 10k generated cases. | Property-based | Test run logs | ENG | Medium | SILVER | Proposed | PRD §Gamification | TDD §Rules |
| FR | FR-006 | Gamification | FR-006-AC01-B | No negative points; user total ≤ configured max per period. | Unit | Bound checks | ENG | Medium | SILVER | Proposed | PRD §Gamification | TDD §Rules |
| FR | FR-006 | Gamification | FR-006-AC02-A | Badge awards appear in profile within **≤2s** of qualifying event and persist post reload. | E2E | UI/screens | ENG | Medium | SILVER | Proposed | PRD §Gamification | TDD §Rules |
| FR | FR-006 | Gamification | FR-006-AC02-B | Revocation/adjustment re-evaluates affected users within one job cycle; audit trail recorded. | Job integration | Job logs | ENG | Medium | SILVER | Proposed | PRD §Gamification | TDD §Jobs |

### FR‑007 — Analytics & Export

| FR | FR-007 | Analytics & Export | FR-007-AC01-A | Dashboard aggregates (weekly, monthly, custom range) match DB-level checks within **±0.5%**. | Integration | Query snapshots | ENG/QA | High | GOLD | Proposed | PRD §Analytics | TDD §Analytics |
| FR | FR-007 | Analytics & Export | FR-007-AC01-B | Personal bests and streaks compute correctly from seeds; break on skipped days as specified. | Unit + Integration | Seed fixtures | ENG/QA | Medium | SILVER | Proposed | PRD §Analytics | TDD §Analytics |
| FR | FR-007 | Analytics & Export | FR-007-AC02-A | Export CSV/JSON delivers correct schema (UTF-8, CRLF normalized), downloadable under **≤1s** for ≤10k rows. | API + E2E | File samples | ENG/QA | Medium | SILVER | Proposed | PRD §Analytics | TDD §Export |
| FR | FR-007 | Analytics & Export | FR-007-AC02-B | Export excludes private sessions by default; toggle explicitly includes them with warning modal. | E2E | UI/screens | ENG/QA | Medium | SILVER | Proposed | PRD §Privacy | TDD §Export |

### FR‑008 — Admin & RBAC

| FR | FR-008 | Admin & RBAC | FR-008-AC01-A | Roles: `user`, `coach`, `admin`; route guards deny access appropriately with **403**; no leakage in error text. | Unit + API | Snapshot policies | ENG/QA | High | GOLD | Proposed | PRD §Admin | TDD §RBAC |
| FR | FR-008 | Admin & RBAC | FR-008-AC01-B | Admin actions (adjust points, edit user, delete session) require 2-step confirm and are fully audit-logged. | E2E + Integration | Audit samples | ENG/QA | High | GOLD | Proposed | PRD §Admin | TDD §RBAC |
| FR | FR-008 | Admin & RBAC | FR-008-AC02 | RBAC claims come from JWT `roles[]`; middleware rejects tokens missing required role. | Unit + API | JWT samples | ENG/QA | High | GOLD | Proposed | PRD §Admin | TDD §RBAC |

### NFR‑001 — Security Hardening

| NFR | NFR-001 | Security | NFR-001-AC01-A | CSP: no inline scripts/styles; `script-src` uses nonces; report-only passes 7 days before enforce with ≤1% violations. | Headers + ZAP | Header dump, ZAP report | SEC/ENG | High | GOLD | Proposed | PRD §Security | TDD §Security |
| NFR | NFR-001 | Security | NFR-001-AC01-B | HSTS (min-age ≥ 6 months), Referrer-Policy strict, Permissions-Policy limits sensors; cookies flagged properly. | Headers test | Curl captures | SEC/ENG | High | GOLD | Proposed | PRD §Security | TDD §Security |
| NFR | NFR-001 | Security | NFR-001-AC02-A | Rate-limit `/auth/*`: ≥10 req/min/IP; return **429** with `Retry-After`. | Integration | Logs + headers | SEC/ENG | High | GOLD | Proposed | PRD §Security | TDD §Security |
| NFR | NFR-001 | Security | NFR-001-AC02-B | CAPTCHA challenge after sustained abuse (>50 req/10min/IP) toggled via feature flag. | E2E | Abuse sim logs | SEC/ENG | Medium | SILVER | Proposed | PRD §Security | TDD §Security |
| NFR | NFR-001 | Security | NFR-001-AC03-A | JWT claims validated: `aud/iss/exp` + clock skew ≤30s; alg pinned RS256; kid rotation tested. | Unit + Integration | JWT samples | SEC/ENG | High | GOLD | Proposed | PRD §Security | TDD §Security |
| NFR | NFR-001 | Security | NFR-001-AC03-B | Upload AV scan rejects EICAR and quarantines file with user-safe message. | Integration | AV logs | SEC/ENG | Medium | SILVER | Proposed | PRD §Security | TDD §Security |

### NFR‑002 — Privacy / DSGVO

| NFR | NFR-002 | Privacy | NFR-002-AC01-A | Logs contain no PII beyond hashed IDs; redaction verified across error paths. | Unit + Integration | Log samples | ENG/QA | High | GOLD | Proposed | PRD §Privacy | TDD §Data, QA |
| NFR | NFR-002 | Privacy | NFR-002-AC01-B | Consent banner gates optional analytics; opt-out respected within **≤5m** across services. | E2E | Config + screenshots | ENG/QA | High | GOLD | Proposed | PRD §Privacy | TDD §Frontend |
| NFR | NFR-002 | Privacy | NFR-002-AC02-A | User data export (JSON+CSV) available within **≤24h** for typical accounts; job monitored. | E2E DSR | Job logs | ENG/QA | High | GOLD | Proposed | PRD §Privacy | TDD §Data |
| NFR | NFR-002 | Privacy | NFR-002-AC02-B | Deletion: anonymization + purge across primary/backup within **≤30d**; evidence in staging. | Ops review | Runbook evidence | ENG/QA | High | GOLD | Proposed | PRD §Privacy | TDD §Data |
| NFR | NFR-002 | Privacy | NFR-002-AC03 | Retention jobs execute per policy; at least one successful run evidenced in staging. | Ops log review | Job logs | ENG/QA | High | GOLD | Proposed | PRD §Privacy | TDD §Data |

### NFR‑003 — Performance (Web)

| NFR | NFR-003 | Performance | NFR-003-AC01-A | P95 LCP ≤ 2.5s and CLS ≤ 0.1 on Dashboard and Planner (staging & prod). | LHCI | LHCI reports | ENG | High | GOLD | Proposed | PRD §Perf | TDD §Perf |
| NFR | NFR-003 | Performance | NFR-003-AC01-B | P95 TTI ≤ 3.5s on mid-tier mobile (Moto G4 class). | LHCI | LHCI reports | ENG | Medium | SILVER | Proposed | PRD §Perf | TDD §Perf |
| NFR | NFR-003 | Performance | NFR-003-AC02 | P95 TTFB ≤ 500ms for authenticated HTML/API responses. | Synthetic | WebPageTest | ENG | High | GOLD | Proposed | PRD §Perf | TDD §Perf |
| NFR | NFR-003 | Performance | NFR-003-AC03 | No regression >10% on Core Web Vitals across releases (LHCI budgets). | Trend compare | LHCI budgets | ENG | High | GOLD | Proposed | PRD §Perf | TDD §Perf |

### NFR‑004 — Accessibility (WCAG 2.1 AA)

| NFR | NFR-004 | A11y | NFR-004-AC01-A | Color contrast ≥ 4.5:1 for text; axe checks yield 0 critical issues across key pages. | axe CI | axe JSON | ENG/QA | High | GOLD | Proposed | PRD §A11y | VDS; QA |
| NFR | NFR-004 | A11y | NFR-004-AC01-B | Focus visible on all interactive elements; no keyboard traps; tab order matches DOM. | Manual sweeps | Screenshots | ENG/QA | High | GOLD | Proposed | PRD §A11y | VDS; QA |
| NFR | NFR-004 | A11y | NFR-004-AC02 | Screen-reader labels/roles present; no empty links/buttons; ARIA only when necessary. | SR checks | VoiceOver/NVDA notes | ENG/QA | High | GOLD | Proposed | PRD §A11y | VDS; QA |

### NFR‑005 — Availability & Backups

| NFR | NFR-005 | Ops | NFR-005-AC01 | SLO uptime ≥ 99.0% monthly; outages have RCA within 5 BD. | Monitoring | Status page, RCA | OPS/ENG | High | SILVER | Proposed | PRD §Ops | TDD §Ops |
| NFR | NFR-005 | Ops | NFR-005-AC02 | Nightly backups succeed; monthly restore drill validates RTO≤4h/RPO≤24h. | Restore drill | Restore logs | OPS/ENG | High | SILVER | Proposed | PRD §Ops | TDD §Ops |
| NFR | NFR-005 | Ops | NFR-005-AC03 | `/healthz` allowlisted only; no sensitive data in body. | Proxy test | Curl captures | OPS/ENG | High | SILVER | Proposed | PRD §Ops | TDD §Ops |

### NFR‑006 — Internationalization

| NFR | NFR-006 | i18n | NFR-006-AC01 | Static keys exist for EN/DE; missing‑key linter passes CI with 0 missing keys. | Lint | Lint logs | ENG | Medium | SILVER | Proposed | PRD §i18n | TDD §i18n |
| NFR | NFR-006 | i18n | NFR-006-AC02 | Language toggle persists across sessions; locale formats match selection. | E2E | Screens | ENG | Medium | SILVER | Proposed | PRD §i18n | TDD §i18n |
| NFR | NFR-006 | i18n | NFR-006-AC03 | No hard-coded user-facing strings in covered paths. | Static | Lint logs | ENG | Medium | SILVER | Proposed | PRD §i18n | TDD §i18n |

# ADR-015: API Design & Internationalization (Hybrid) – MVP Static, UGC Translation Feature-Flagged

**Date:** 2025-10-14  
**Status:** Accepted  
**Author:** Reviewer  
**Cross-References:** PRD §5–§7 (API principles, security, i18n §6.14); TDD §3–§7 (routes, layering, idempotency), §10 (ops); QA §2–§14 (CI gates, perf/a11y/security)

---

## Context

We need a consistent REST API that is easy to consume, testable, and compliant with security and i18n requirements. The PRD specifies REST with strong security defaults, idempotent writes, and a **hybrid i18n** approach (static UI tokens; optional AI translation for UGC). The TDD locks the MVP to **static i18n only**, with dynamic UGC translation **deferred** and **behind a feature flag**. QA enforces budgets (API p95 < 300 ms) and regression gates, plus a11y and security scans.

This ADR defines the API style guide and how i18n concerns are represented at the API layer without violating MVP scope.

---

## Decision

1. **API Style & Versioning**
   - **RESTful JSON over HTTPS**, base path `/api/v1`.
   - **OpenAPI** spec generated in CI from route definitions and shared DTO/validators. Artifacts published with each build.
   - **Backward compatibility:** additive changes preferred; deprecations announced with `Deprecation` header and doc changelog; removal after ≥2 minor versions.

2. **Resource Modeling & Conventions**
   - Plural nouns: `/users`, `/exercises`, `/sessions`, `/progress`, `/points`, `/feed`.
   - **Nesting** only when ownership is strict (e.g., `/users/{id}/sessions`). Otherwise use query filters.
   - **IDs:** expose ULIDs for public resources; server maintains internal PKs as needed.

3. **Pagination, Filtering, Sorting**
   - **Cursor-based** pagination: `?cursor=...&limit=50`. Response includes `{ items, nextCursor }`.
   - Filtering/sorting via whitelisted query params (`?userId=...&sort=-createdAt`).

4. **Errors & Problem Details**
   - Errors conform to **RFC 7807** style: `{ type, title, status, detail, instance, code }`.
   - Domain errors mapped from `DomainError(code, message)` in the router. No DB error details are leaked.

5. **Idempotency for Unsafe Writes**
   - All `POST`/`PUT`/`PATCH` that create or mutate accept `Idempotency-Key` header.
   - The service layer stores **24h** idempotency keys; **409** on payload mismatch; deterministic replay for identical payloads. Keys are **scoped to user+route**.

6. **Security Defaults**
   - **Auth:** Bearer **JWT RS256** access tokens; server-stored rotating refresh tokens.
   - **RBAC:** Coarse checks in router, fine-grained in services.
   - **Headers:** CSP (no `unsafe-inline`), HSTS, Referrer-Policy, Permissions-Policy, strict CORS allowlist.
   - **CSRF:** Protection on cookie-based flows and all state-changing routes when cookies are present.
   - **Rate limits:** Per-IP and per-user token bucket; separate bucket for translation API if enabled.
   - **Logging:** Correlation ID; no PII in logs.

7. **Internationalization (API Facets)**
   - **MVP:** API conveys UI language via `Accept-Language` (client optional); server returns UI text keys, not translated UI strings. Clients render UI using **static catalogs (EN/DE)**.
   - **UGC Translation (Feature-flagged, Phase 2):**
     - Endpoint capability signaled via response capability object (e.g., `{ capabilities: { ugcTranslation: true } }`) when the flag is enabled.
     - Translation is performed server-side via `POST /i18n/translate` (internal call from services), **not** exposed directly to clients.
     - **Caching:** hash(text+targetLang) as key; TTL configured; invalidation on source edit/delete.
     - **Privacy:** PII redaction before provider call; cache stores redacted text only; DSR delete purges entries within ≤14 days.
     - **UX hints:** payloads carrying translated text include `{ translated: true, originalLanguage: "xx", notice: "Translated from …" }`.

8. **Content Negotiation & Localization Hints**
   - API may include localized, non-UGC labels (e.g., enums) **if** they originate from static catalogs; otherwise it returns keys and clients map them.
   - All date/time fields are ISO-8601 in UTC; clients apply locale formatting.

9. **Performance Budgets & Caching at API Edge**
   - **Budgets:** API **p95 < 300 ms** overall; auth ≤200 ms; feed ≤400 ms; analytics ≤600 ms.
   - **Cache-Control** used for safe GETs where applicable; ETags supported for conditional requests.
   - CI **fails on >10% regression** against baseline k6 smoke.

10. **Observability**
    - Prometheus metrics by route (`http_server_requests_seconds_bucket`), auth failures, cache hits, translation latency (`i18n_translation_latency_ms`).
    - OpenTelemetry tracing enabled for HTTP and DB spans with correlation IDs propagated.

11. **Documentation & SDKs**
    - OpenAPI generated clients for **TypeScript** in `packages/shared` (SDK), versioned with the app.
    - Changelog and migration notes per API release; code samples validated in CI.

---

## Consequences

**Positive**

- Clear, testable API style with idempotency and error contracts; aligned with PRD security/i18n and TDD layering.
- MVP ships without UGC translation risk; Phase-2 enables it safely behind a flag with caching and privacy controls.
- QA can assert budgets, headers, and compatibility via generated OpenAPI and Playwright flows.

**Negative / Trade-offs**

- Cursor pagination requires client handling of `nextCursor`.
- Maintaining OpenAPI generation and SDK publishing adds CI complexity (acceptable for benefits).

**Operational**

- Feature flags must be pinned in environment (prod off).
- Idempotency key store monitored for TTL eviction and storage growth; alerts if collision rate > expected baseline.

---

## Alternatives Considered

| Option                  | Description           | Reason Rejected                                                                  |
| ----------------------- | --------------------- | -------------------------------------------------------------------------------- |
| Offset-based pagination | `?page=1&size=50`     | Hotspot pages and drift under writes; cursor is more stable and efficient        |
| GraphQL                 | Single graph endpoint | Added infra/complexity for MVP; REST satisfies PRD/TDD and improves cacheability |
| Client-side translation | Use SDKs in browser   | Violates privacy model and observability; caching harder; not aligned with PRD   |

---

## References

- PRD: API principles, security baselines, hybrid i18n (§6.14)
- TDD: Layered architecture, idempotency policy, MVP i18n scope (static)
- QA: CI gates (security, perf, a11y), regression thresholds, API budgets

---

## Status Log

| Version | Date       | Change                                                                                      | Author   |
| ------- | ---------- | ------------------------------------------------------------------------------------------- | -------- |
| v1.0    | 2025-10-14 | Initial ADR for API design & i18n hybrid with MVP static-only and flaggable UGC translation | Reviewer |

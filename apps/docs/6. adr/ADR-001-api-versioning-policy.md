# ADR-001 — Adopt URI-based API Versioning with Additive v1 Policy and Deprecation Headers

> **File:** docs/adr/ADR-001-api-versioning-policy.md  
> **Purpose:** Architectural decision record defining FitVibe’s API versioning strategy for MVP and beyond.

---

id: ADR-001
title: "Adopt URI-based API Versioning with Additive v1 Policy and Deprecation Headers"
status: "Accepted"
date: "2025-10-13"
owners: ["Dr. Konstantinos Pilpilidis"]
version: "1.0"
links:

- PRD: "docs/1. Product Requirements Document.md#ci-cd-and-governance"
- TDD: "docs/2. Technical Design Document v2.md#api-conventions-and-routing"
- QA: "docs/3. Testing and Quality Assurance Plan.md#non-functional-acceptance-criteria-and-slos"

---

## Context

FitVibe exposes a public REST API consumed by the React SPA and future clients (mobile, partners). We need a **stable contract** for MVP while allowing **safe additive evolution** and **predictable deprecation**. A clear versioning policy reduces integration churn and aligns with CI/CD rollback strategies and QA SLO monitoring.

**Drivers**

- Stability for SPA and potential third-party clients
- Governance of additive vs. breaking changes
- Traceable deprecation with client-visible signals
- CI/CD gates and contract testing
- Version-scoped telemetry for SLOs and migration tracking

**Stakeholders**: Product, Backend, Frontend, QA, Security/Compliance, Ops

## Decision

We adopt **URI-based major versioning** using `/api/v1` with an **additive-only** compatibility policy for v1.

- **Base path**:
  - Local: `http://localhost:4100/api/v1`
  - Staging/Prod: `https://api.fitvibe.app/api/v1`
- **Within v1**: Only backward-compatible, additive changes permitted (new optional fields/endpoints; enums are forward-tolerant). No removals or breaking behavior changes.
- **Breaking changes**: Require a **new major path** (e.g., `/api/v2`) with a managed deprecation window for v1 endpoints.
- **Deprecation signaling** (per RFC 8594 & IETF draft practices):
  - `Deprecation: true` when an endpoint is scheduled for removal
  - `Sunset: <RFC 1123 date>` to announce end-of-life
  - `Link: <url>; rel="deprecation"` to migration notes
- **OpenAPI/SDKs**: OpenAPI stamped per major; language SDKs generated per major version.
- **CI governance**: PRs that remove/rename fields or change response shapes must either (a) introduce `/api/v2` and update docs, or (b) demonstrate non-breaking via contract tests.
- **Observability**: Expose `api_version` label in HTTP metrics and logs; create per-version dashboards and alerts.

## Consequences

**Positive**

- Predictable client experience; safe iteration velocity within v1
- Clear migration path and overlap window for `/api/v2`
- Easier rollbacks and side-by-side canarying

**Trade-offs**

- Temporary multi-version maintenance overhead
- Requires strict contract testing discipline to prevent accidental breaks

## Alternatives Considered

1. **Header-based versioning** (e.g., `Accept: application/vnd.fitvibe.v2+json`)  
   _Pros_: Clean URLs, flexible per-resource versioning.  
   _Cons_: Harder to debug/proxy/cache; less transparent.

2. **No versioning (always latest)**  
   _Pros_: Minimal surface.  
   _Cons_: High break risk; undermines governance and client trust.

## Implementation Notes

- **Routing**: Mount all controllers under `/api/v1`; future majors under `/api/vN`.
- **Contract tests**: Add OpenAPI diff check in CI to block breaking changes by default.
- **Deprecation process**:
  1. Mark endpoints with headers and docs
  2. Provide migration notes and examples
  3. Maintain **≥ 2 release cycles** overlap before removal
- **Docs**: Group OpenAPI by major; publish a deprecation timeline in the developer docs.
- **Telemetry**: Add `api_version` to request metrics; create Grafana panel to monitor v1→v2 traffic decay and error budgets.

## Backout Plan

If `/api/v2` introduces regressions, maintain `/api/v1` as the primary surface, revert client routing as needed, and roll forward fixes. Do not remove v1 until SLOs are stable and the deprecation window elapses. If the strategy changes materially, supersede this ADR with a new record and update the ADR index.

## Change Log

- **1.0 (2025-10-13):** Initial acceptance for MVP.

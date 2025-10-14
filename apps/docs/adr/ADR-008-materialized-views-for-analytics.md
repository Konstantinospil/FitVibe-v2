# ADR-008 — Materialized Views for Analytics

> **File:** docs/adr/ADR-008-materialized-views-for-analytics.md  
> **Purpose:** Provide fast read paths for dashboards and reports without impacting OLTP workload.

---
id: ADR-008
title: "Materialized Views for Analytics"
status: "Proposed"
date: "2025-10-13"
owners: ["Dr. Konstantinos Pilpilidis"]
version: "1.0"
links:
  - TDD §4.5: "Reporting & analytics"
  - TDD §6.3: "Performance architecture"
---

## Context
Dashboards need quick aggregates (e.g., weekly volume, PRs, exercise counts). Computing these over raw `sessions` and `sets` on every page load is expensive and affects OLTP. We need **pre‑computed** aggregates with predictable refresh.

## Decision
Use **PostgreSQL Materialized Views** for:  
- `analytics.session_summary` — per session aggregates (total volume, duration, avg RPE).  
- `analytics.weekly_aggregates` — per user, per week KPIs (distance, time, volume, sessions).

### Refresh Strategy
- **Incremental on write (near‑real‑time)**: After successful commit of `core.sets`/`core.sessions`, enqueue a small job to refresh **only affected partitions** or **parameterized subsets** via **REFRESH MATERIALIZED VIEW CONCURRENTLY** with filters (when feasible using helper tables).  
- **Scheduled full refresh**: Nightly **02:00** UTC job to run `REFRESH ... CONCURRENTLY` for both views.  
- **Staging tables**: Maintain `analytics.staging_changes(user_id, session_id, week)` fed by triggers or app events; refresh jobs read and clear this table.

### Indexing
- Create indexes on matviews for typical filters: `(user_id, week_start)` for weekly, `(user_id, session_id)` for session summary.

### Consistency
- Readers tolerate slight staleness; dashboards show `as of <timestamp>` from matview `last_refresh_at` column.

## Consequences
- Faster dashboards; reduced OLTP contention.  
- Additional complexity (refresh jobs and staging).

## Alternatives Considered
- **On‑the‑fly views**: Simpler but slow under load.  
- **External OLAP**: Future option; overkill for MVP.

## QA & Acceptance
- E2E tests: creating/updating/deleting sessions updates aggregates after refresh.  
- Performance tests: dashboard queries p95 < 150 ms using matviews.

## Backout Plan
Disable incremental refresh and rely solely on nightly refresh; if still problematic, fall back to normal SQL views while we redesign.

## Change Log
- **1.0 (2025-10-13):** Initial proposal.

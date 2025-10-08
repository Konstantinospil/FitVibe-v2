# ADR-008: Caching & Performance Strategy
**Date:** 2025-10-07  
**Status:** Proposed  
**Cross-References:** QA §8 / TDD §10  

## Decision
In-memory caching (Redis optional) for read-heavy endpoints.  
p95 latency < 300ms, LCP < 2.5s enforced.

## Consequences
✅ Faster response times  
⚠️ Cache invalidation complexity

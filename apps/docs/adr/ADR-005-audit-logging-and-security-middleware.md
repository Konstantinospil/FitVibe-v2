# ADR-005: Audit Logging & Security Middleware
**Date:** 2025-10-07  
**Status:** Accepted  
**Cross-References:** TDD §9 / SECURITY.md  

## Decision
Central audit middleware logs CRUD events with user_id, timestamp, IP.  
JWT auth and role-based access enforced per endpoint.

## Consequences
✅ GDPR traceability  
⚠️ Slight performance overhead

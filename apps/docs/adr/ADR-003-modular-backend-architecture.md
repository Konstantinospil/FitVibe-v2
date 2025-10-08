# ADR-003: Modular Backend Architecture
**Date:** 2025-10-07  
**Status:** Accepted  
**Cross-References:** TDD §4  

## Decision
Backend split into domain modules (users, sessions, exercises, plans).  
Each module follows Controller → Service → Repository pattern.

## Consequences
✅ Clear separation of concerns  
⚠️ Slightly more boilerplate

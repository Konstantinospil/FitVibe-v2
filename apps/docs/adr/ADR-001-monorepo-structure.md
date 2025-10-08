# ADR-001: Monorepo Structure for FitVibe
**Date:** 2025-10-07  
**Status:** Accepted  
**Author:** Dr. Konstantinos Pilpilidis  
**Cross-References:** PRD §7 / TDD §3 / QA §9  

## Context
FitVibe is a full-stack modular web application composed of multiple interdependent components (frontend, backend, shared libraries).  
A monorepo was chosen for traceability, CI/CD unification, and type-safe dependency sharing.

## Decision
Monorepo using Yarn Workspaces + Docker Compose.  
Structure:
```
fitvibe/
├── apps/backend/
├── apps/frontend/
├── packages/shared/
├── packages/i18n/
├── tests/
├── docs/
└── docker/
```

## Consequences
✅ Unified lifecycle management  
⚠️ Larger repo size, requires governance

## References
PRD §7, TDD §3, QA §9, Chats 2025-10-03

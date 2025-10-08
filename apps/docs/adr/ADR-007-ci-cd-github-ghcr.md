# ADR-007: CI/CD Workflow on GitHub Actions + GHCR
**Date:** 2025-10-07  
**Status:** Accepted  
**Cross-References:** PRD §7.2 / QA §13  

## Decision
GitHub Actions automates build, lint, test, and Docker push to GHCR.  
Production server pulls via SSH and restarts via Compose.

## Consequences
✅ Predictable deployments  
⚠️ Requires secrets management

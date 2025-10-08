# ADR-002: Technology Stack for FitVibe
**Date:** 2025-10-07  
**Status:** Accepted  
**Cross-References:** PRD §5 / TDD §2 / QA §9  

## Decision
| Layer | Technology |
|--------|-------------|
| Frontend | React + Vite + Tailwind |
| Backend | Node.js (Express) + Prisma |
| DB | PostgreSQL |
| Container | Docker + Docker Compose |
| CI/CD | GitHub Actions + GHCR |
| Monitoring | Prometheus + Grafana |
| Tests | Jest + Supertest + Playwright |
| Language | TypeScript |

## Consequences
✅ Full TypeScript stack  
⚠️ Higher learning curve

# FitVibe Documentation Hub

This workspace is the single source of truth for product requirements, technical design, testing strategy, and decision records that govern FitVibe V2.

## Directory Overview

| Path                                | Purpose                                                |
| ----------------------------------- | ------------------------------------------------------ |
| `1. Product Requirements Document.md` | Business goals, user journeys, and feature scope      |
| `2. Technical Design Document.md`     | System architecture, data flows, and integration plans |
| `3. Testing and Quality Assurance Plan.md` | Test strategy, quality gates, and release criteria |
| `4. Tasks.md`                         | Work breakdown and delivery tracking                   |
| `adr/`                                | Architecture Decision Records                          |
| `diagrams/`                           | Mermaid diagrams referenced by the PRD and TDD         |
| `policies/`                           | Governance artefacts (security, compliance, etc.)      |
| `project-structure.md`                | Canonical filesystem blueprint for the repository      |

## Working With the Docs

- Keep numbered documents in sync with the latest scope; the numbering matches cross-references throughout the codebase.
- When making architectural decisions, add a new ADR via `ADR_TEMPLATE.md` and link it from `adr/0001-record-architecture-decisions.md`.
- Place new diagrams in `diagrams/` using the naming convention `<source>_<section>_<slug>.mmd` or update the existing high-level trio (`architecture.mmd`, `ci-cd.mmd`, `erd.mmd`).
- Policies should live under `policies/` so that infra and security teams can consume them independently of the apps.

## Contribution Tips

1. Prefer Markdown with fenced code blocks for technical snippets.
2. Embed links to relevant code locations or ADRs to keep readers oriented.
3. Reflect structural changes from the codebase in `project-structure.md` immediately to avoid drift.
4. Treat this workspace like source code: review changes, keep commit history descriptive, and align terminology with the product language.

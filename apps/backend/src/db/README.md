# Database Schema & Tooling

This directory contains everything related to the FitVibe relational schema: migrations, seeds, operational scripts, partition helpers, and reference fixtures.

## Runbooks

- pnpm --filter @fitvibe/backend exec ts-node src/db/scripts/migrate.ts � apply latest migrations
- pnpm --filter @fitvibe/backend exec ts-node src/db/scripts/rollback.ts � rollback the last batch
- pnpm --filter @fitvibe/backend exec ts-node src/db/scripts/refresh-materialized.ts � refresh materialized views
- pnpm --filter @fitvibe/backend exec ts-node src/db/scripts/rotate-partitions.ts � create upcoming monthly partitions

## Contents

| Path        | Purpose                                                         |
| ----------- | --------------------------------------------------------------- |
| migrations/ | One migration per table/function/view (see PRD entity mapping)  |
| seeds/      | Canonical data for local dev/tests (roles, users, exercises, �) |
| unctions/   | SQL routines (partition rotation, materialized view refresh)    |
| riggers/    | Trigger definitions (e.g., auto-refresh session_summary)        |
| iews/       | SQL for materialized + logical views used by analytics          |
| scripts/    | Node scripts to run migrations, seeds, partition maintenance    |
| ixtures/    | JSON fixtures referenced by seeds or future data imports        |
| schema/     | Human-readable snapshot of the current schema                   |
| ypes/       | Custom PostgreSQL types shared across migrations                |
| utils/      | Utility scripts for DBA-style operations (backup, verify, etc.) |

Consult pps/docs/project-structure.md for the canonical layout and the PRD (section 7) for entity definitions.

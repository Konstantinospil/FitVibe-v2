# @fitvibe/utils

Cross-cutting utilities shared by multiple FitVibe workspaces. Typical concerns include date formatting, logging wrappers, and small functional helpers.

## Scripts

```bash
pnpm --filter @fitvibe/utils build    # compile TypeScript to dist/
pnpm --filter @fitvibe/utils lint     # lint the source files
```

## Usage

```ts
import { formatUtcDate } from "@fitvibe/utils/date";
import { logger } from "@fitvibe/utils";
```

When introducing new helpers:

1. Implement the utility inside `src/`.
2. Export it from `src/index.ts`.
3. Add unit tests (backed by the root `tests/` workspace where appropriate).
4. Re-run build and lint tasks.

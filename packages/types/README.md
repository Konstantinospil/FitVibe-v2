# @fitvibe/types

Central repository of TypeScript types that are shared between the backend, frontend, and tooling. Keeping these definitions in one place prevents drift between client and server contracts.

## Build

```bash
pnpm --filter @fitvibe/types build    # emits ESM/CJS typings into dist/
```

## Usage

```ts
import type { SessionSummary, UserProfile } from "@fitvibe/types";
```

### Adding a Type

1. Create or update files in `src/`.
2. Export the new types from `src/index.ts`.
3. Re-run `pnpm build` for this package.
4. Bump dependants if the change is breaking.

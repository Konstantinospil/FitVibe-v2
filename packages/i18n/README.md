# @fitvibe/i18n

Shared translation tables and helpers for FitVibe surfaces. The package exposes locale dictionaries and utility functions so that both the frontend and backend can reuse consistent wording.

## Build

```bash
pnpm --filter @fitvibe/i18n build    # emits compiled assets into dist/
```

Type declarations are generated alongside the compiled output so TypeScript consumers get key safety.

## Usage

```ts
import { dictionaries, t } from "@fitvibe/i18n";

const en = dictionaries.en;
console.log(t(en, "session.start"));
```

### Adding a Locale

1. Create `src/<locale>.ts` exporting the dictionary.
2. Export the locale from `src/index.ts`.
3. Re-run `pnpm build` and update consuming apps with the new locale code.

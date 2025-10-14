# @fitvibe/ui

Reusable React components and design tokens shared across FitVibe surfaces. Components are authored in TypeScript and compiled to a distributable bundle for consumption by the main web app and any future portals.

## Build

```bash
pnpm --filter @fitvibe/ui build       # compiles to dist/
```

`react` is declared as a peer dependency; ensure the consuming application provides a compatible version.

## Usage

```tsx
import { Button } from "@fitvibe/ui";

export function Cta() {
  return <Button variant="primary">Start session</Button>;
}
```

Add new components under `src/` and export them from `src/index.ts` so they are available to consumers.

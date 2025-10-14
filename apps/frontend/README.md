# FitVibe Frontend

The frontend is a React 18 single-page application bundled with Vite. It consumes the FitVibe backend and provides session planning, workout logging, and dashboards for end users.

## Prerequisites

- Node.js 20+
- PNPM 9

## Environment

Create an `.env.local` (or edit the existing `.env`) to point the client at your API:

```
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

Additional keys (feature flags, analytics, etc.) can be added as `VITE_*` entries so Vite exposes them to the bundle.

## Scripts

```bash
pnpm --filter @fitvibe/frontend dev         # run Vite dev server
pnpm --filter @fitvibe/frontend build       # production build (outputs to dist/)
pnpm --filter @fitvibe/frontend preview     # preview the production build
pnpm --filter @fitvibe/frontend lint        # eslint over src
pnpm --filter @fitvibe/frontend typecheck   # strict TypeScript
```

## Structure

```
src/
  assets/        # Static assets and global styles
  components/    # Reusable UI components
  contexts/      # React context providers
  hooks/         # Shared hooks
  i18n/          # Client-side translations
  pages/         # Route-aligned page components
  routes/        # Router configuration
  services/      # API clients and side-effect utilities
  store/         # State management (e.g., Zustand/Redux)
  utils/         # Client helpers
```

End-to-end checks live under `apps/frontend/tests`. Use `pnpm test --filter frontend` from the repo root to run the e2e / component suites once they are implemented.

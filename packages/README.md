# Shared Packages

The `packages` workspace contains reusable building blocks that are consumed by the FitVibe backend, frontend, and tooling. Each directory is a standalone PNPM workspace published (or versioned) together with the app code.

| Package            | Description                                                |
| ------------------ | ---------------------------------------------------------- |
| `eslint-config/`   | Shared ESLint configuration used across all workspaces     |
| `i18n/`            | Translation catalogues and helpers                         |
| `tsconfig/`        | Base TypeScript configuration files                        |
| `types/`           | Cross-cutting TypeScript type definitions                  |
| `ui/`              | Reusable React UI primitives and design tokens             |
| `utils/`           | General-purpose helpers shared between backend/frontend    |

Each package has its own `package.json` and can define scripts (build, lint, test) as needed. Use Turbo scopes or `pnpm --filter` to run tasks for a specific package.

```bash
pnpm --filter @fitvibe/utils test
pnpm --filter @fitvibe/ui build
```

When adding a new shared package, update this README and ensure it is referenced from `pnpm-workspace.yaml`.

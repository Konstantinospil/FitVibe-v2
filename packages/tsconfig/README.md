# @fitvibe/tsconfig

Shared TypeScript configuration presets for the FitVibe monorepo. Consuming workspaces extend the base config to ensure consistent compiler options and path aliases.

## Usage

In a workspace `tsconfig.json`:

```json
{
  "extends": "@fitvibe/tsconfig/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
```

Whenever you change the base configuration, re-run `pnpm typecheck` at the repo root to surface incompatibilities across workspaces.

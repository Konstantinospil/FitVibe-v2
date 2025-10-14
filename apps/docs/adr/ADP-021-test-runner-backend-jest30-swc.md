---
title: "ADP-021: Standardize Backend Test Runner on Jest 30 + @swc/jest"
version: 1.0
status: Proposed → Accepted
date: 2025-10-14
author: Konstantinos Pilpilidis (FitVibe)
reviewers: Core Team
tags: [testing, qa, backend, ci, jest, swc]
references:
  - PRD §6.4.4 Testing Approach; PRD Tooling Table (“Testing Framework: Jest + ts-jest” → updated to Jest + SWC)
  - TDD §8.* Backend Services – Testing notes (Jest + Supertest)
  - QA Plan §8.1 Backend (API) Test Strategy (Jest + Supertest), §12 Toolchain & Automation
---

# Decision

**Adopt _Jest 30_ with _@swc/jest_ for the backend test runner** (unit + integration with Supertest), replacing ts-jest.  
Frontend remains on **Vitest** (fast dev UX). This preserves our existing Jest semantics for the API layer while modernizing TypeScript transforms with SWC.

# Context

- Our current attempt to run tests with **Jest 30** failed because **TypeScript sources weren’t transformed**; Node tried to load `.ts` files directly (e.g., `export` / `as const`), causing syntax errors in imports from `/apps/backend/src/modules/auth/*.ts`.
- The previous baseline in docs used **Jest 29 + ts-jest**. Jest 30 changed transform hooks; **ts-jest** isn’t a good fit for our setup anymore.
- We need a **TS-aware** transform that works with Jest 30, is **fast**, and has **low migration risk**.

# Decision Drivers

- **Alignment with governance docs**: Backend = **Jest + Supertest** (PRD/TDD); QA Plan §8.1 calls out **Jest** for API tests.
- **Low churn**: Keep reporters, snapshot behavior, watch mode, mock APIs, and existing Jest helpers.
- **Performance**: **SWC** is faster than Babel and avoids ts-jest’s overhead.
- **CI stability**: Preserve coverage gates (≥ 80% lines & branches) and existing GitHub Actions steps.
- **Future flexibility**: We can still standardize repo-wide later if needed via ADR/ADP.

# Options Considered

| Option | Summary | Pros | Cons |
|---|---|---|---|
| **A. Jest 30 + @swc/jest (Chosen)** | Use SWC to transform TS for Jest 30 | Keeps Jest semantics; fast; minimal code changes; easy CI | Slightly different source-map behavior vs ts-jest; SWC config surface |
| **B. Vitest (backend)** | Migrate API tests to Vitest | Very fast; native TS; modern runner | Diverges from QA §8.1 (Jest); requires adapting some Jest-specific helpers; ADR + QA edits |
| **C. Pin Jest 29 + ts-jest** | Roll back to the old stack | Minimal work now | Freezes on old major; future upgrade tax; slower than SWC |

# Scope

- **In scope**: `/apps/backend` tests (unit + integration with Supertest), coverage collection, CI gates.
- **Out of scope**: Frontend (continue with Vitest), E2E (Playwright), load tests (k6).

# Detailed Plan

## 1) Dependencies (backend)
`apps/backend/package.json` (devDependencies excerpt):
```json
{
  "jest": "^30.0.0",
  "@swc/core": "^1.7.0",
  "@swc/jest": "^0.2.36",
  "supertest": "^7.0.0",
  "typescript": "^5.6.0"
}
```

## 2) Jest config (ESM example)
`apps/backend/jest.config.ts`:
```ts
import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  transform: {
    '^.+\.(t|j)s$': ['@swc/jest', {
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { decoratorMetadata: true }
      },
      module: { type: 'es6' }
    }]
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/*.(spec|test).ts'],
  modulePathIgnorePatterns: ['<rootDir>/dist'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/index.ts',
    '!src/**/__tests__/**'
  ],
  coverageThreshold: { global: { lines: 80, branches: 80 } }
};

export default config;
```

> If the backend is **CJS**, set `module: { type: 'commonjs' }` and remove `extensionsToTreatAsEsm`.

## 3) TS config for tests (optional)
`apps/backend/tsconfig.jest.json`:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "ESNext",
    "types": ["jest", "node"]
  }
}
```

## 4) NPM scripts
```json
{
  "scripts": {
    "test": "jest --runInBand --passWithNoTests",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage"
  }
}
```

## 5) CI: keep gates and reports
- No change to the CI stage names. Coverage uses V8 (default in Jest 30) and remains **≥ 80%** for lines & branches.
- Ensure `apps/backend` test task in Turbo/Actions calls `pnpm --filter backend test`.

# Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Source maps differ (SWC vs ts-jest) | Debugging stack traces | Enable `sourceMaps` in SWC if needed; rely on IDE mappings |
| Decorators/metadata not emitted | Tests using reflection fail | `decorators: true` + `decoratorMetadata: true` in `@swc/jest` config |
| Mixed ESM/CJS friction | Import/require errors | Choose one module system per package; set `module.type` correctly |
| Snapshot diffs | Minor | Re-run snapshots once; review changes |
| Coverage drift | Gate failures | Keep `collectCoverageFrom` strict; validate in CI before merge |

# Backout Plan

If regressions appear, temporarily pin backend to **Jest 29 + ts-jest** (previous known-good), while keeping this ADP as the long-term target. Rollback steps: replace transform/preset, re-run CI, create a follow-up fix branch.

# Consequences

- **Positive**: Green tests on Jest 30; faster transforms; governance alignment; minimal developer retraining.
- **Trade-offs**: Another tool (`@swc/*`) in the stack; slight differences in source-map accuracy vs ts-jest.

# Compliance & Traceability

- **PRD**: Testing approach and CI coverage thresholds remain as specified (≥ 80%). (PRD §6.4.4, PRD Tooling table updated to “Jest + SWC”).  
- **TDD**: Backend testing remains “Jest + Supertest” with coverage gates.  
- **QA Plan**: Conforms to **§8.1 Backend (API) Test Strategy** and **§12 Toolchain & Automation** (Jest present).

# Tasks (extract for backlog)

- **A-120** Update `apps/backend/package.json` devDependencies (Jest 30 + @swc/jest).  
- **A-121** Add/adjust `jest.config.ts` (SWC transform, coverage settings).  
- **A-122** Ensure `moduleNameMapper` matches TS path aliases.  
- **A-123** Validate CI coverage gates (≥ 80% lines & branches).  
- **A-124** Smoke-run integration tests (Supertest) against running API.  
- **A-125** Update docs (PRD Tooling, TDD testing notes) to reflect Jest + SWC.  
- **A-126** (Optional) Create troubleshooting guide for ESM/CJS with Jest 30 + SWC.

# Appendix: Minimal Diff Preview

```diff
-  "jest": "29.7.0",
-  "ts-jest": "29.2.5",
+  "jest": "^30.0.0",
+  "@swc/core": "^1.7.0",
+  "@swc/jest": "^0.2.36"
```

```ts
// jest.config.ts
- export default { preset: 'ts-jest', testEnvironment: 'node' };
+ export default {
+   testEnvironment: 'node',
+   transform: { '^.+\.(t|j)s$': ['@swc/jest', { jsc: { parser: { syntax: 'typescript', decorators: true }, transform: { decoratorMetadata: true } }, module: { type: 'es6' } }] },
+   extensionsToTreatAsEsm: ['.ts'],
+   /* coverage + mapper + ignores as above */
+ };
```

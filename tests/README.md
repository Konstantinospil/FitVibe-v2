# Test Suites

The `tests` workspace houses automated validation that sits outside individual apps. It consolidates backend API checks, frontend UI tests, performance probes, and shared setup helpers.

## Directory Layout

| Path                   | Purpose                                            |
| ---------------------- | -------------------------------------------------- |
| `backend/api/`         | Black-box API tests (REST contract, error cases)   |
| `backend/integration/` | Multi-service flows hitting the real database      |
| `frontend/components/` | Component-level tests (e.g., Playwright/Jest)      |
| `frontend/e2e/`        | Browser-based end-to-end scenarios                 |
| `perf/`                | Performance tests (k6 scripts, Lighthouse configs) |
| `reports/`             | Generated artefacts (JUnit, coverage, Lighthouse)  |
| `setup/`               | Shared helpers and Jest setup files                |

## Running Tests

Most suites are orchestrated via Turbo from the repository root:

```bash
pnpm test                 # run every registered suite
pnpm --filter tests perf  # run only performance checks
```

Individual test tools (e.g., Playwright, k6) can be invoked directly by pointing to the files in this workspace.

## Adding a New Suite

1. Create a descriptive directory under `tests/`.
2. Update this README and any CI workflow that should execute the new suite.
3. Export helper functions from `setup/` to keep assertions consistent across suites.

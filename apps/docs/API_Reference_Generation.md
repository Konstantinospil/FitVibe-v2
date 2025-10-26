# API Reference Automation

The FitVibe backend publishes an OpenAPI 3.1 specification that mirrors the
current REST surface. The specification is generated from the source tree so
that release automation and downstream clients can consume an up-to-date
contract.

## Generation workflow

1. Ensure dependencies are installed (`pnpm install` at repo root).
2. Run the monorepo script:
   ```
   pnpm openapi:build
   ```
   This delegates to `apps/backend/scripts/generate-openapi.mjs` which exports
   `openapi/openapi.json`.
3. The file can be served directly to Stoplight, Redocly, or bundled into the
   documentation site. CI artifacts already upload the JSON for release tags.

## Adding new endpoints

- Document the handler in-place (JSDoc or module docstring) and update the
  schema definitions inside `generate-openapi.mjs`.
- When zod-to-openapi wiring lands, the generator will pull the contract from
  the runtime validators automatically. Until then, keep the manual schema in
  sync with controller DTOs.
- Remember to include auth headers, error envelopes, and pagination metadata.

## Quality gates

- CI runs `pnpm openapi:build` and diffs the resulting JSON. Commits that omit
  regenerated artifacts will fail.
- Reviewers expect the PR description to link to the generated specification if
  the API shape changed (`openapi/openapi.json` diff).
- The QA plan references this artifact for contract testing
  (see `4c.Testing_and_Quality_Assurance_Plan_ApCD.md`).

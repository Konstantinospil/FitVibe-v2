# @fitvibe/eslint-config

Centralised ESLint configuration for the FitVibe monorepo. It wraps the shared rules for TypeScript, React, accessibility, import hygiene, and Prettier integration.

## Usage

In any workspace, extend the config from your `eslint.config.js` (flat config) or `.eslintrc.js`:

```js
import shared from "@fitvibe/eslint-config";

export default shared;
```

or

```js
module.exports = {
  extends: ["@fitvibe/eslint-config"],
};
```

Install the declared peer dependencies in the consuming workspace to ensure consistent lint behaviour.

## Scripts

```bash
pnpm --filter @fitvibe/eslint-config lint   # runs eslint over the config itself
```

Edit `index.js` to adjust rules or add new plugins, then update dependent workspaces if rule changes introduce new violations.

# @orbit/eslint-config

Shared ESLint flat configuration for Orbit packages.

## Exports

- `@orbit/eslint-config`: Base JavaScript and TypeScript rules.
- `@orbit/eslint-config/react`: Base rules plus React Hooks and React Refresh rules.

## Source Layout

- `src/index.js`: Base config, TypeScript project service setup, and shared rules.
- `src/react.js`: React-specific config layered on the base config.

## Usage

Import the config from a package-level `eslint.config.js`:

```js
import config from "@orbit/eslint-config";

export default config;
```

For React packages:

```js
import config from "@orbit/eslint-config/react";

export default config;
```

## Development Notes

- This package exports source files directly; it does not have a build step.
- Keep rules broadly applicable. Package-specific ignores or overrides should live in the consuming package when possible.

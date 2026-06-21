# Orbit

Orbit is a modern Electron and SQLite spaced repetition app. The workspace is a pnpm monorepo managed with Turborepo.

## Workspace

- `apps/desktop`: Electron desktop app with a React Router renderer.
- `packages/anki`: Anki package parsing and writing utilities.
- `packages/types`: Shared domain types and Zod schemas.
- `packages/ui`: Shared React UI components, styles, and helpers.
- `packages/eslint-config`: Shared ESLint flat configs.

## Requirements

- pnpm `11.7.0`
- Node.js compatible with the pinned package set

Install dependencies from the repository root:

```sh
pnpm install
```

## Common Commands

```sh
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

Use pnpm filters when working on a single package:

```sh
pnpm --filter @orbit/desktop typecheck
pnpm --filter @orbit/anki test
```

## Development Notes

- Keep Electron and Node-only capabilities behind the main, IPC, and preload layers in `apps/desktop`.
- Add renderer routes under `apps/desktop/src/renderer/routes`; route discovery uses `@react-router/fs-routes`.
- Import shared UI from `@orbit/ui` and shared data contracts from `@orbit/types`.
- Update `packages/types` when a cross-package data shape changes.
- Anki feature behavior is documented as testable criteria in `docs/anki-features/README.md`.

## Build Outputs

Generated output lives in directories such as `dist`, `out`, `.turbo`, `.react-router`, `node_modules`, and `test-results`. These should not be edited directly.

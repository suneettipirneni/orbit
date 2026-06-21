# Agent Guide

Use this file as a map to the repo's existing conventions and architecture. Prefer following the linked source files over duplicating guidance here.

## Repo Shape

- Workspace definition: [pnpm-workspace.yaml](pnpm-workspace.yaml)
- Task graph: [turbo.json](turbo.json)
- Root scripts and pinned package manager: [package.json](package.json)
- Shared TypeScript defaults: [tsconfig.base.json](tsconfig.base.json)
- Shared ESLint config package: [packages/eslint-config/src/index.js](packages/eslint-config/src/index.js) and [packages/eslint-config/src/react.js](packages/eslint-config/src/react.js)

## Packages

- Desktop app: [apps/desktop](apps/desktop)
- Shared UI components and styles: [packages/ui](packages/ui)
- Anki package parsing and writing: [packages/anki](packages/anki)
- Shared domain types: [packages/types](packages/types)
- Shared lint presets: [packages/eslint-config](packages/eslint-config)

## Desktop Architecture

- Electron main entry and custom `orbit://app` renderer protocol: [apps/desktop/src/main/index.ts](apps/desktop/src/main/index.ts)
- IPC registration boundary: [apps/desktop/src/main/ipc/index.ts](apps/desktop/src/main/ipc/index.ts)
- Deck IPC handlers: [apps/desktop/src/main/ipc/deck.ts](apps/desktop/src/main/ipc/deck.ts)
- Preload API contract exposed on `window.api`: [apps/desktop/src/preload/api.ts](apps/desktop/src/preload/api.ts)
- Preload implementation: [apps/desktop/src/preload/index.ts](apps/desktop/src/preload/index.ts)
- Renderer root, providers, and app shell: [apps/desktop/src/renderer/root.tsx](apps/desktop/src/renderer/root.tsx)
- React Router flat routes config: [apps/desktop/src/renderer/routes.ts](apps/desktop/src/renderer/routes.ts)
- Renderer data layer and local schema: [apps/desktop/src/renderer/lib/powersync.ts](apps/desktop/src/renderer/lib/powersync.ts) and [apps/desktop/src/renderer/lib/powersync-schema.ts](apps/desktop/src/renderer/lib/powersync-schema.ts)
- Renderer repositories: [apps/desktop/src/renderer/lib/repo](apps/desktop/src/renderer/lib/repo)

## UI Conventions

- UI package shadcn configuration and aliases: [packages/ui/components.json](packages/ui/components.json)
- Shared Tailwind/CSS variables: [packages/ui/src/styles.css](packages/ui/src/styles.css)
- Desktop renderer styles: [apps/desktop/src/renderer/styles.css](apps/desktop/src/renderer/styles.css)
- Exported UI surface: [packages/ui/src/index.ts](packages/ui/src/index.ts)
- Local UI components: [packages/ui/src/components](packages/ui/src/components)

Use `@orbit/ui` components where available, keep UI behavior accessible, and use `lucide-react` for icons to match the existing setup.

## Product Specs

Anki feature behavior is documented as testable criteria under [docs/anki-features/README.md](docs/anki-features/README.md). Start there when changing deck library, deck overview, review, authoring, browser/search, scheduling, import/export, statistics, or preferences behavior.

## Tests And Checks

Root scripts are defined in [package.json](package.json):

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

Desktop-specific scripts are in [apps/desktop/package.json](apps/desktop/package.json). Use filters when narrowing scope, for example `pnpm --filter @orbit/desktop typecheck`.

## Working Notes

- This is a strict TypeScript repo. Keep exported package contracts typed and update shared types in [packages/types/src](packages/types/src) when cross-package data shapes change.
- React Router routes are file-system based via `@react-router/fs-routes`; add or move renderer routes under [apps/desktop/src/renderer/routes](apps/desktop/src/renderer/routes).
- Keep Electron-only capabilities behind IPC/preload boundaries instead of importing Node or Electron APIs into renderer components.
- Do not edit generated or build output directories such as `dist`, `out`, `.turbo`, `.react-router`, `node_modules`, or `test-results` unless a task explicitly requires artifact inspection.

# @orbit/desktop

Electron desktop app for Orbit. It contains the Electron main process, preload API, React Router renderer, local data layer, and end-to-end tests.

## Key Entry Points

- `src/main/index.ts`: Electron startup, window creation, native binding setup, and `orbit://app` renderer protocol.
- `src/main/ipc/index.ts`: IPC registration boundary.
- `src/main/ipc/deck.ts`: Deck and Anki package IPC handlers.
- `src/preload/api.ts`: Typed `window.api` contract exposed to the renderer.
- `src/preload/index.ts`: Preload implementation.
- `src/renderer/root.tsx`: Renderer root and providers.
- `src/renderer/routes.ts`: React Router route configuration using flat routes.
- `src/renderer/routes`: File-system routes and route-local components.
- `src/renderer/lib/powersync.ts`: Renderer data layer setup.
- `src/renderer/lib/powersync-schema.ts`: Local schema.

## Commands

Run these from the repo root with a filter, or from this directory without one.

```sh
pnpm --filter @orbit/desktop dev
pnpm --filter @orbit/desktop typecheck
pnpm --filter @orbit/desktop lint
pnpm --filter @orbit/desktop test
pnpm --filter @orbit/desktop test:e2e
pnpm --filter @orbit/desktop build
pnpm --filter @orbit/desktop start
```

## Architecture Notes

- The renderer should not import Node or Electron APIs directly. Add desktop capabilities through IPC and expose typed methods through preload.
- The packaged app serves renderer assets through the custom `orbit://app` protocol.
- Development can load the renderer from `ELECTRON_RENDERER_URL` or `ORBIT_RENDERER_URL`.
- Native SQLite support depends on rebuilding `better-sqlite3` for Electron with `pnpm --filter @orbit/desktop rebuild:native`.
- Use `@orbit/ui` for shared components and `lucide-react` for icons.

## Tests

- Unit and route-level tests use Vitest through Electron's Node runtime.
- Browser-style workflows live under `e2e` and run with Playwright.

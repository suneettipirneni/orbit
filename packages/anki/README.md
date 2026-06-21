# @orbit/anki

Utilities for reading and writing Anki package files used by Orbit.

## Public API

The package exports from `src/index.ts`:

- `isAnkiPackagePath`
- `loadAnkiPackage`
- `saveAnkiPackage`
- `AnkiCard`
- `AnkiDeck`
- `AnkiNote`
- `AnkiPackage`
- `AnkiPackageDatabaseOptions`

## Source Layout

- `src/anki-package.ts`: Anki package database and archive handling.
- `src/index.ts`: Public package surface.

## Commands

```sh
pnpm --filter @orbit/anki build
pnpm --filter @orbit/anki typecheck
pnpm --filter @orbit/anki lint
pnpm --filter @orbit/anki test
```

## Development Notes

- Keep this package independent of Electron and renderer code.
- Preserve typed exports for any data consumed across package boundaries.
- Use fixture-based tests for package parsing and writing behavior when adding coverage.

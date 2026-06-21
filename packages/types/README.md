# @orbit/types

Shared Orbit domain types and validation schemas.

## Public API

The package exports from `src/index.ts`:

- Cards: `src/cards.ts`
- Decks: `src/decks.ts`
- Notes: `src/notes.ts`
- Pagination: `src/pagination.ts`
- Reviews: `src/reviews.ts`

## Commands

```sh
pnpm --filter @orbit/types build
pnpm --filter @orbit/types typecheck
pnpm --filter @orbit/types lint
pnpm --filter @orbit/types test
```

## Development Notes

- Put shared data shapes here when they cross app or package boundaries.
- Keep exported contracts stable and typed; prefer Zod schemas where runtime validation is needed.
- Avoid importing from app packages. This package should remain a small domain contract layer.

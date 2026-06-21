# @orbit/ui

Shared React UI components, styles, and helpers for Orbit.

## Public API

The main export in `src/index.ts` currently includes:

- `button`
- `card`
- `data-table`
- `field`
- `input`
- `label`
- `table`
- `textarea`
- `cn` and related utilities from `src/lib/utils.ts`

Additional component, hook, and utility files are available through package subpath exports:

```ts
import { Button } from "@orbit/ui";
import { Tooltip } from "@orbit/ui/components/tooltip";
import { useIsMobile } from "@orbit/ui/hooks/use-mobile";
```

Global styles are exported as:

```ts
import "@orbit/ui/styles.css";
```

## Source Layout

- `src/components`: Shared component implementations.
- `src/hooks`: Shared React hooks.
- `src/lib`: Shared UI helpers.
- `src/styles.css`: Tailwind and design token styles.
- `components.json`: shadcn configuration and aliases.

## Commands

```sh
pnpm --filter @orbit/ui build
pnpm --filter @orbit/ui typecheck
pnpm --filter @orbit/ui test
```

The package lint script currently skips linting because this package includes generated shadcn UI components.

## Development Notes

- Keep components accessible and composable.
- Prefer existing component patterns before adding new abstractions.
- Use `lucide-react` for icons in shared controls.
- Update `src/index.ts` when a component should be part of the primary package surface.

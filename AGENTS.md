# AGENTS.md

AI coding guidance for **NicoNico Auto Set Language**.

This repository is a minimal **Tampermonkey/Violentmonkey userscript** that automatically sets the language preference on NicoNico to Japanese.

## Stack

- TypeScript 6.0.x
- Biome 2.x
- pnpm 10.x
- Node.js 24.x

## Repository Structure

- `src/niconico-auto-set-language.user.ts` — single TypeScript userscript source
- `dist/` — build artifacts (gitignored)

## Core Constraints

- **No external runtime dependencies**: only Tampermonkey/Violentmonkey GM APIs.
- **No server involvement**: all logic runs in the user's browser.
- Source code, comments, and documentation: **English only**.
- Commit messages: **English**, conventional commits.

## Commands

```bash
pnpm build           # full prod build (runs quality via prebuild)
pnpm check           # TypeScript type check (no emit)
pnpm lint            # Biome lint
pnpm lint:fix        # Biome lint --write
pnpm fmt             # Biome format check
pnpm fmt:fix         # Biome format --write
pnpm knip            # Unused dependency scan
pnpm quality         # fmt + lint + check + knip
pnpm quality:fix     # quality with auto-fix
pnpm clean           # rimraf dist
pnpm verify          # build + build:min
```

## Code Rules

- Keep the implementation small and browser-local.
- Types and aliases: PascalCase. Functions/variables: camelCase. Constants: UPPER_SNAKE_CASE.
- Use DOM APIs such as `textContent`; do not inject raw HTML.
- Avoid `eval`, `new Function`, or string-based timers.
- Keep selectors resilient and fail safely if NicoNico changes its DOM.
- Prefer `MutationObserver` + timeout/debounce patterns over aggressive polling.
- Prefix runtime logs with `[NicoNico Language]`.

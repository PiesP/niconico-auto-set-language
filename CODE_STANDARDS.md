# Code Standards

Consistency guide for **NicoNico Auto Set Language**.

## 1. Project shape

- `src/niconico-auto-set-language.user.ts` is the single TypeScript userscript source.
- `dist/niconico-auto-set-language.user.js` is the readable build artifact.
- `dist/niconico-auto-set-language.user.min.js` is the minified release artifact.
- Keep the implementation small and browser-local.

## 2. Metadata block rules

- The `// ==UserScript==` header is part of the public interface.
- Keep `@name`, `@namespace`, `@match`, and `@grant` values intentional and minimal.
- Update `@version` only for release/versioning work.
- Do not remove metadata comments needed by userscript managers or release automation.

## 3. Naming and structure

- Types and aliases: `PascalCase`
- Functions and variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Group logic by responsibility: settings, notifications, DOM lookup, language switching, observers
- Prefer short helper functions over deeply nested inline logic

## 4. TypeScript rules

- Keep TypeScript strict and avoid `any`.
- Prefer `unknown` + narrowing for storage/input values.
- Use explicit types for settings objects, timers, and DOM query results.
- Use `as const` for fixed maps such as toast colors.

## 5. Userscript and GM API conventions

- Keep `GM_*` declarations typed near the top of the source file.
- Do not add grants unless they are required by real functionality.
- Persist settings through the existing storage helper flow.
- Menu-command actions should remain safe to trigger multiple times.

## 6. DOM and safety rules

- Use DOM APIs such as `textContent`; do not inject raw HTML.
- Avoid `eval`, `new Function`, or string-based timers.
- Keep selectors resilient and fail safely if NicoNico changes its DOM.
- Prefer `MutationObserver` + timeout/debounce patterns over aggressive polling.

## 7. Logging and notifications

- Prefix runtime logs with `[NicoNico Language]`.
- Keep debug logging optional and gated behind the stored `debug` setting.
- Toast notifications should remain short-lived and non-blocking.

## 8. Quality gates

Run these before opening a PR:

```bash
pnpm quality
pnpm verify
```

Helpful focused checks:

```bash
pnpm build:dev
pnpm dev
pnpm check
pnpm fmt
pnpm lint
pnpm quality:fix
```

## 9. Release expectations

- Greasy Fork / readable distribution should use `dist/niconico-auto-set-language.user.js`.
- GitHub releases may additionally ship the minified artifact.
- Release automation depends on the readable build retaining userscript metadata.

## 10. Pre-PR checklist

- [ ] `pnpm quality` passes
- [ ] `pnpm verify` succeeds
- [ ] Userscript metadata block is still intact
- [ ] Manual checks from [TESTING.md](./TESTING.md) were run when runtime behavior changed
- [ ] `README.md` updated if install flow or user-visible behavior changed

# Contributing to NicoNico Auto Set Language

Thanks for improving **NicoNico Auto Set Language**. This repository ships a small TypeScript userscript that keeps NicoNico's language preference aligned with Japanese so comments render consistently.

> **Language policy**: Source code, comments, commit messages, and development documentation in this repository must be written in **English**.

## Communication

- Bugs / feature requests: GitHub Issues
- Questions: open a GitHub issue with clear repro context

This repository does not currently publish a separate security policy. Please avoid posting secrets, private account details, or session information in public issues.

## Before opening an issue

Please include:

- Browser + version
- OS + userscript manager
- NicoNico page type / URL pattern that reproduced the issue
- Expected vs actual language behavior
- Whether the script was already enabled/disabled via the userscript menu
- Relevant console output (prefixed with `[NicoNico Language]`)

## Development setup

### Prerequisites

- Volta Node.js `24.15.0` (project default) or engines-compatible Node.js `>=24.0.0`
- pnpm `>=10.29.2`

### Install

```bash
pnpm install
```

### Common commands

```bash
pnpm build:dev
pnpm dev
pnpm check
pnpm typecheck
pnpm fmt
pnpm lint
pnpm quality
pnpm quality:fix
pnpm build
pnpm verify
```

## Recommended development flow

1. Make a focused change in `src/niconico-auto-set-language.user.ts`.
2. Use `pnpm build:dev` or `pnpm dev` for quick iteration.
3. Run `pnpm quality`; use `pnpm quality:fix` first if you want repository-standard fixes applied.
4. Run `pnpm verify` before opening a PR.
5. Follow the manual checks in [TESTING.md](./TESTING.md) when runtime behavior changed.
6. Update `README.md` if user-visible behavior, install flow, or release expectations changed.

## Project constraints

- Keep the userscript metadata block at the top of `src/niconico-auto-set-language.user.ts` intact.
- The readable artifact in `dist/niconico-auto-set-language.user.js` is the primary distribution file.
- `dist/niconico-auto-set-language.user.min.js` is for GitHub release packaging only.
- Keep the script browser-local; do not add remote services or unsafe HTML injection.
- Selector logic must fail safely when NicoNico changes its DOM.

## Code style

- Prefer small, named helper functions over large nested blocks.
- Use DOM APIs such as `textContent`; avoid `innerHTML`.
- Keep logging behind the `[NicoNico Language]` prefix.
- Follow [CODE_STANDARDS.md](./CODE_STANDARDS.md) for the detailed coding policy.

## Pull request expectations

A good PR includes:

- A concise title and description of **what** changed and **why**
- Small, focused commits with descriptive messages
- A short validation note (`pnpm quality`, `pnpm verify`, manual checks) or why a smaller check set was enough

## Reference documents

- [README.md](./README.md) — user-facing overview
- [CODE_STANDARDS.md](./CODE_STANDARDS.md) — coding rules and repository constraints
- [TESTING.md](./TESTING.md) — manual verification checklist

Thanks for helping improve **NicoNico Auto Set Language**!

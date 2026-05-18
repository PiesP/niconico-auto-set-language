# NicoNico Auto Set Language

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A UserScript that automatically sets the language to Japanese on NicoNico to ensure proper comment display and consistent browsing experience.

## Features

- Automatically changes language to Japanese when browsing NicoNico
- Ensures proper display of all comments on videos
- Visual notification when language setting is changed
- Smart DOM observation for dynamically loaded content
- Efficient performance with timeout to prevent excessive resource usage
- Toggle on/off via userscript menu command

## Installation

1. Install a UserScript manager ([Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), or [Greasemonkey](https://www.greasespot.net/))
2. [Click here to install the latest version](https://github.com/PiesP/niconico-auto-set-language/releases/latest/download/niconico-auto-set-language.user.js)
3. Confirm installation in your UserScript manager

## Usage

1. Navigate to any NicoNico page (\*.nicovideo.jp)
2. The script automatically checks if the language is already set to Japanese
3. If not, it finds the language preference form and submits Japanese
4. A brief notification appears when the language is changed (if enabled)
5. The page reloads with Japanese language settings

### Configuration

Settings are stored via `GM_setValue` and persist across sessions. The script provides a `Toggle Auto Set Language` menu command in your userscript manager to enable/disable the script at runtime.

## Development

This project is developed with **pnpm + TypeScript**, and the built userscript files are generated in `dist/`.

Prerequisites: Node.js `>=24.0.0`, pnpm `>=10.29.2`

### Main Scripts

- `pnpm check`: TypeScript type check (no emit)
- `pnpm fmt`: Biome format check
- `pnpm fmt:fix`: Biome format fix
- `pnpm lint`: Biome lint
- `pnpm lint:fix`: Biome lint fix
- `pnpm quality`: Format check + lint + type check + unused dep scan
- `pnpm quality:fix`: Apply formatting/lint fixes, then rerun quality gate
- `pnpm build`: Clean + TypeScript build (generates the readable userscript in `dist/`)
- `pnpm build:dev`: TS build only without minification
- `pnpm verify`: `pnpm build` + `pnpm build:min` (generates the minified release artifact)
- `pnpm dev`: TypeScript watch mode

### Workflow

1. Modify `src/niconico-auto-set-language.user.ts`
2. For quick checks during development, use `pnpm build:dev` or `pnpm dev`
3. Before release, run `pnpm quality` and then `pnpm verify`
4. Update the `@version` in userscript metadata when releasing

### Developer docs

- Contributor workflow: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Coding policy: [CODE_STANDARDS.md](./CODE_STANDARDS.md)
- Manual verification: [TESTING.md](./TESTING.md)

### Greasy Fork Upload Notice

Greasy Fork requires that published scripts be **non-minified/non-obfuscated (readable) code**.

- Upload `dist/niconico-auto-set-language.user.js` (non-minified) to Greasy Fork.
- Use `dist/*.min.js` (minified version) only for GitHub releases.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the standard development flow, PR checklist, and project constraints.

## Why This Script Was Created

This script was developed after discovering an issue where comments were not displayed on certain NicoNico videos. Investigation revealed that this issue was caused by language settings—only comments in the selected language are displayed. By ensuring the language is set to Japanese, this script resolves the issue and ensures a consistent viewing experience.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

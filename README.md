# NicoNico Auto Set Language

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A UserScript that automatically sets the language to Japanese on NicoNico website to ensure proper comment display and consistent browsing experience. This script fixes the issue where comments aren't properly displayed when using non-Japanese language settings.

## Features

- Automatically changes language to Japanese when browsing NicoNico
- Ensures proper display of all comments on videos
- Multiple detection methods for language UI elements to handle site updates
- Visual notification when language setting is changed
- Smart DOM observation for dynamically loaded content
- Efficient performance with timeout to prevent excessive resource usage
- Works across all NicoNico website domains

## Installation

1. Install a UserScript manager ([Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), or [Greasemonkey](https://www.greasespot.net/))
2. [Click here to install the latest version](https://github.com/PiesP/niconico-auto-set-language/releases/latest/download/niconico-auto-set-language.user.js)
3. Confirm installation in your UserScript manager

## Usage

1. Navigate to any NicoNico page (\*.nicovideo.jp)
2. The script automatically checks if the language is already set to Japanese
3. If not, it will change the language setting for you
4. A brief green notification appears when the language is changed (if enabled)
5. The page will reload with proper Japanese language settings

### Configuration

The script comes with default settings but can be customized by editing the `userSettings` object:

- `enabled`: Turn the script on/off
- `showNotification`: Display visual feedback when language is changed
- `language`: Target language code (default: 'ja-jp')
- `debug`: Enable detailed console logging for troubleshooting

## Browser Compatibility

Tested and compatible with:

- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- Safari

## Development

This project is developed with **pnpm + TypeScript**, and the built userscript files are generated in `dist/`.

### Main Scripts

- `pnpm check`: TypeScript type check (no emit)
- `pnpm quality`: Type check + biome check (recommended for CI/PR)
- `pnpm build`: clean + TS build + terser minification (generates `dist/` for distribution)
- `pnpm build:dev`: TS build only without minification
- `pnpm dev`: TypeScript watch mode

### Workflow

1. Modify `src/niconico-auto-set-language.user.ts`
2. For quick checks during development, use `pnpm build:dev` or `pnpm dev`
3. Before release, run `pnpm quality` then `pnpm build`
4. Update the `@version` in userscript metadata when releasing

### Greasy Fork Upload Notice

Greasy Fork requires that published scripts be **non-minified/non-obfuscated (readable) code**.

- Upload `dist/niconico-auto-set-language.user.js` (non-minified) to Greasy Fork.
- Use `dist/*.min.js` (minified version) only for GitHub releases.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or create an Issue if you encounter any problems or have suggestions for improvements.

## Acknowledgements

This project was developed in collaboration with AI.

## Why This Script Was Created

This script was developed after discovering an issue where comments were not displayed on certain NicoNico videos. Investigation revealed that this issue was caused by language settings—only comments in the selected language are displayed. By ensuring the language is set to Japanese, this script resolves the issue and ensures a consistent viewing experience.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

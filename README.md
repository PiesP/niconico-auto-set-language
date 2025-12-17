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

이 프로젝트는 **pnpm + TypeScript** 기반으로 개발하며, 빌드 결과 userscript 파일은 `dist/`에 생성됩니다.

### 주요 스크립트

- `pnpm check`: TypeScript 타입체크(emit 없음)
- `pnpm quality`: 타입체크 + biome check (CI/PR에 권장)
- `pnpm build`: clean + TS 빌드 + terser 최소화(배포용 `dist/` 생성)
- `pnpm build:dev`: 최소화 없이 TS 빌드만 수행
- `pnpm dev`: TypeScript watch 모드

### 작업 흐름

1. `src/niconico-auto-set-language.user.ts` 를 수정
2. 개발 중 빠른 확인은 `pnpm build:dev` 또는 `pnpm dev`
3. 배포 전에는 `pnpm quality` 후 `pnpm build`
4. 배포 시 userscript 메타데이터의 `@version` 갱신

### Greasy Fork 업로드 주의

Greasy Fork는 게시되는 스크립트가 **최소화/난독화되지 않은(읽을 수 있는) 코드**이기를 요구합니다.

- Greasy Fork에는 `dist/niconico-auto-set-language.user.js`(비-최소화)를 업로드하세요.
- `dist/*.min.js`(최소화 버전)는 GitHub 배포용으로만 사용하세요.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or create an Issue if you encounter any problems or have suggestions for improvements.

## Acknowledgements

This project was developed in collaboration with AI.

## Why This Script Was Created

This script was developed after discovering an issue where comments were not displayed on certain NicoNico videos. Investigation revealed that this issue was caused by language settings—only comments in the selected language are displayed. By ensuring the language is set to Japanese, this script resolves the issue and ensures a consistent viewing experience.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

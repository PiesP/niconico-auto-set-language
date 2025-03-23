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
2. [Click here to install the latest version](https://github.com/PiesP/niconico-auto-set-language/raw/master/niconico-auto-set-language.user.js)
3. Confirm installation in your UserScript manager

## Usage

1. Navigate to any NicoNico page (*.nicovideo.jp)
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

The script uses a simple, straightforward JavaScript structure. To modify:

1. Edit the `niconico-auto-set-language.user.js` file
2. Test your changes on NicoNico website
3. Update version number in the script metadata

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or create an Issue if you encounter any problems or have suggestions for improvements.

## Acknowledgements

This project was developed in collaboration with AI.

## Why This Script Was Created

This script was developed after discovering an issue where comments were not displayed on certain NicoNico videos. Investigation revealed that this issue was caused by language settings—only comments in the selected language are displayed. By ensuring the language is set to Japanese, this script resolves the issue and ensures a consistent viewing experience.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

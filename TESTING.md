# Testing Checklist – NicoNico Auto Set Language

This checklist covers the userscript that forces NicoNico language settings to Japanese.

## Pre-test setup

- `pnpm quality`
- `pnpm build:dev` for quick iteration or `pnpm verify` for release-style output
- Install `dist/niconico-auto-set-language.user.js` in Tampermonkey or Violentmonkey
- Use a browser session where NicoNico can render the language preference form

## Core behavior

- When the page language is not Japanese, the script finds the language form and submits the Japanese value
- A temporary notification appears when `showNotification` is enabled
- The page reloads with the expected Japanese language state
- When the page is already set to Japanese, the script does not resubmit unnecessarily

## Settings and menu command

- `Toggle Auto Set Language` changes the enabled state
- Disabling the script stops observers and prevents form submission
- Re-enabling the script allows the flow to run again
- Stored settings persist across reloads

## Failure handling

- If the form never appears, observation stops after the timeout without spamming the page
- Failed submissions log an error and show the failure toast
- Debug logging remains silent when `debug` is disabled

## Production verification

- `pnpm quality` passes
- `pnpm verify` succeeds
- `dist/niconico-auto-set-language.user.js` exists and remains readable
- `dist/niconico-auto-set-language.user.min.js` exists for release packaging
- The userscript metadata block is still present at the top of the readable artifact

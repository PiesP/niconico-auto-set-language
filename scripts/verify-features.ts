import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Dependency-free user-feature contract checks.
 *
 * The repository intentionally keeps Vitest tests in the ignored `test/`
 * workspace. This script is the tracked CI-facing verification entry point:
 * it validates the generated userscript that users actually install and
 * fails when a published feature contract is accidentally removed.
 */

const distFile = process.argv[2] ?? 'dist/niconico-auto-set-language.user.js';
const sourceFile = 'src/niconico-auto-set-language.user.ts';

const readProjectFile = (file: string): string =>
  readFileSync(resolve(process.cwd(), file), 'utf8');

if (!existsSync(resolve(process.cwd(), distFile))) {
  console.error(`Generated userscript not found: ${distFile}`);
  console.error('Run `pnpm build:ts` before feature verification.');
  process.exit(1);
}

const source = readProjectFile(sourceFile);
const bundle = readProjectFile(distFile);

const requiredMetadata = [
  '@match        https://www.nicovideo.jp/*',
  '@match        https://nicovideo.jp/*',
  '@grant        GM_registerMenuCommand',
  '@grant        GM_setValue',
  '@grant        GM_getValue',
  '@noframes',
  '@run-at     document-end',
] as const;

const requiredFeatureContracts = [
  // Automatically submits the Japanese language form and supports already-Japanese pages.
  "const TARGET_LANGUAGE = 'ja-jp'",
  'form input[name="language"]',
  'found.form.submit()',
  // Dynamically rendered watch pages and SPA navigation.
  'new MutationObserver',
  "window.addEventListener('popstate', checkNavigation)",
  "navigation.addEventListener('navigate', checkNavigation)",
  // User-visible feedback and the enable/disable menu toggle.
  "el.setAttribute('role', 'alert')",
  'GM_registerMenuCommand',
  'GM_getValue',
  'GM_setValue',
  // Protect users from submitting language credentials to an unrelated host.
  'function isFormActionSafe',
] as const;

const missingMetadata = requiredMetadata.filter((entry) => !bundle.includes(entry));
const missingSourceContracts = requiredFeatureContracts.filter((entry) => !source.includes(entry));

if (missingMetadata.length > 0 || missingSourceContracts.length > 0) {
  if (missingMetadata.length > 0) {
    console.error('Missing generated userscript metadata:');
    for (const entry of missingMetadata) console.error(`  - ${entry}`);
  }
  if (missingSourceContracts.length > 0) {
    console.error('Missing source feature contracts:');
    for (const entry of missingSourceContracts) console.error(`  - ${entry}`);
  }
  process.exit(1);
}

console.log('✓ NicoNico user-facing feature contracts verified');
console.log(`  bundle: ${distFile}`);
console.log(
  '  features: Japanese auto-selection, SPA/dynamic DOM, feedback, toggle, safe form action'
);

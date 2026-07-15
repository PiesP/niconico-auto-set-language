import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'));
const expected = pkg.version;
let failed = false;

// Check UserScript metadata @version
const userScriptFile = 'src/niconico-auto-set-language.user.ts';
const srcContent = readFileSync(resolve(process.cwd(), userScriptFile), 'utf-8');
const versionMatch = srcContent.match(/\/\/ @version\s+(\S+)/);
if (!versionMatch) {
  console.error(`✗ UserScript metadata: @version not found in ${userScriptFile}`);
  failed = true;
} else if (versionMatch[1] !== expected) {
  console.error(
    `✗ UserScript metadata: expected ${expected}, found ${versionMatch[1]} in ${userScriptFile}`
  );
  failed = true;
} else {
  console.log(`✓ UserScript @version: ${versionMatch[1]}`);
}

if (failed) {
  console.error('\nVersion mismatch between package.json and UserScript metadata.');
  process.exit(1);
}
console.log('\n✓ All versions match:', expected);

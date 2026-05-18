import { readFileSync, writeFileSync } from 'node:fs';

const file = 'dist/niconico-auto-set-language.user.js';
const content = readFileSync(file, 'utf-8');

// Remove the "use strict"; line that tsc prepends for ESM modules.
// UserScripts don't need it and it breaks metadata-first validation.
const stripped = content.replace(/^"use strict";\n/, '');

writeFileSync(file, stripped, 'utf-8');

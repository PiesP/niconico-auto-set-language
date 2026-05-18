import { readFileSync, writeFileSync } from 'node:fs';

const file = 'dist/niconico-auto-set-language.user.js';
const content = readFileSync(file, 'utf-8');

// Remove the "use strict"; that tsc prepends for ESM modules.
// UserScripts don't need it and it breaks metadata-first validation.
writeFileSync(file, content.replace(/^"use strict";\n/, ''), 'utf-8');

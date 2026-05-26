import { readFileSync, writeFileSync } from "node:fs";

const distFile = process.argv[2];
const srcFile = process.argv[3] ?? "src/niconico-auto-set-language.user.ts";

if (!distFile) {
  console.error("Usage: node --experimental-strip-types scripts/bundle-userscript.ts <dist-file> [src-file]");
  process.exit(1);
}

// ── 1. Extract UserScript metadata block from source ──
const src = readFileSync(srcFile, "utf8");
const metaMatch = src.match(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/);
if (!metaMatch) {
  console.error(`Could not find // ==UserScript== block in ${srcFile}`);
  process.exit(1);
}
const metadata = metaMatch[0];

// ── 2. Strip TSC-added preamble from dist output ──
const dist = readFileSync(distFile, "utf8");
const distLines = dist.split("\n");

// TypeScript 6.0 adds "use strict" and preserves SPDX + copyright lines
// but drops the UserScript metadata block. Strip everything before body.
let bodyStart = 0;
if (distLines[0]?.startsWith('"use strict"')) bodyStart++;
while (bodyStart < distLines.length && distLines[bodyStart]?.startsWith("//")) {
  bodyStart++;
}

const body = distLines.slice(bodyStart).join("\n").trimStart();

// ── 3. Assemble output ──
const output = `${metadata}\n\n${body}\n`;
writeFileSync(distFile, output);
console.log(`Bundled UserScript: ${distFile} (${distLines.length} → ${output.split("\n").length} lines)`);

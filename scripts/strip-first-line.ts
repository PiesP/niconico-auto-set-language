import { readFileSync, writeFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error(
    "Usage: node --experimental-strip-types scripts/strip-first-line.ts <path>",
  );
  process.exit(1);
}

const content = readFileSync(file, "utf8");
const lines = content.split("\n");
writeFileSync(file, lines.slice(1).join("\n"));
console.log(`Stripped first line from ${file}`);

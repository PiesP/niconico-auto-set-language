import { readFileSync, writeFileSync } from 'node:fs';

function main(): void {
  const file = process.argv[2];
  const version = process.argv[3] || process.env.RELEASE_VERSION || '';

  if (!file || !version) {
    console.error(
      'Usage: node --experimental-strip-types scripts/update-userscript-meta.ts <path> <version>'
    );
    console.error('  or set RELEASE_VERSION environment variable');
    process.exit(1);
  }

  let content = readFileSync(file, 'utf8');

  // --- Update @version ---
  const versionPat = /^\/\/\s*@version\s+.*$/m;
  const versionRepl = `// @version      ${version}`;
  const versionMatch = content.match(versionPat);
  if (!versionMatch) {
    console.error('Could not find @version line in', file);
    process.exit(1);
  }
  content = content.replace(versionPat, versionRepl);
  console.log(`Synced @version -> ${version}`);

  // --- Update @downloadURL and @updateURL ---
  const repo = process.env.GITHUB_REPOSITORY || '';
  if (repo) {
    const url = `https://github.com/${repo}/releases/latest/download/niconico-auto-set-language.user.js`;

    for (const key of ['downloadURL', 'updateURL']) {
      const pat = new RegExp(`^//\\s*@${key}\\s+.*$`, 'm');
      const repl = `// @${key}  ${url}`;
      if (pat.test(content)) {
        content = content.replace(pat, repl);
      } else {
        // Insert after the @match line
        const matchAnchor = content.match(/^\/\/\s*@match\s+.*$/m);
        if (matchAnchor && matchAnchor.index !== undefined) {
          const idx = matchAnchor.index + matchAnchor[0].length;
          content = content.slice(0, idx) + '\n' + repl + content.slice(idx);
        } else {
          console.error(`Cannot insert @${key}: no @match anchor found`);
          process.exit(1);
        }
      }
      console.log(`Synced @${key} -> ${url}`);
    }
  } else {
    console.log('GITHUB_REPOSITORY not set, skipping @downloadURL/@updateURL update');
  }

  writeFileSync(file, content, 'utf8');
}

main();

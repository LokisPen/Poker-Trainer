// Rewrites the list of source files inside sw.js so the offline copy always matches what is in src/.
// Run with `npm run sync-sw` after adding, removing or renaming a module.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

export function sourceFiles(dir = 'src') {
  return readdirSync(join(root, dir))
    .flatMap((name) => {
      const rel = `${dir}/${name}`;
      return statSync(join(root, rel)).isDirectory() ? sourceFiles(rel) : rel.endsWith('.js') ? [rel] : [];
    })
    .sort();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = join(root, 'sw.js');
  const list = sourceFiles()
    .map((f) => `  './${f}',`)
    .join('\n');
  const next = readFileSync(file, 'utf8').replace(
    /(\/\* src:start \*\/)[\s\S]*?(\n\s*\/\* src:end \*\/)/,
    `$1\n${list}$2`,
  );
  writeFileSync(file, next);
  console.log(`sw.js lists ${sourceFiles().length} source files`);
}

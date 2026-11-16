import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sourceFiles } from '../scripts/sync-sw.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (f) => readFileSync(root + f, 'utf8');

test('the offline copy lists every file the app ships', () => {
  const listed = [...read('sw.js').matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean);
  for (const f of listed) assert.ok(existsSync(root + f), `${f} is listed in sw.js but does not exist`);
  for (const f of sourceFiles()) assert.ok(listed.includes(f), `${f} is missing from sw.js: run npm run sync-sw`);
  for (const f of ['index.html', 'styles/app.css', 'manifest.webmanifest']) assert.ok(listed.includes(f), f);
});

test('the manifest and the page point at files that exist', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) assert.ok(existsSync(root + icon.src), icon.src);
  const local = [...read('index.html').matchAll(/(?:href|src)="\.\/([^"]+)"/g)].map((m) => m[1]);
  assert.ok(local.includes('src/app/main.js') && local.includes('manifest.webmanifest'));
  for (const f of local) assert.ok(existsSync(root + f), f);
});

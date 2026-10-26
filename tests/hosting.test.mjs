import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));

test('static host entry points and PWA manifest are present and valid', () => {
  assert.ok(exists('index.html'), 'index.html must exist at the deployment root');
  assert.ok(exists('manifest.webmanifest'), 'PWA manifest must exist');
  assert.ok(exists('sw.js'), 'service worker must exist');
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0);
  for (const icon of manifest.icons) {
    assert.ok(exists(icon.src), `manifest icon missing: ${icon.src}`);
  }
});

test('local HTML asset references resolve from the static deployment root', () => {
  const html = read('index.html');
  const refs = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map(match => match[1])
    .filter(ref => !/^(?:[a-z]+:|\/\/|#|data:)/i.test(ref));
  assert.ok(refs.length > 0, 'expected local assets in index.html');
  for (const ref of refs) {
    const clean = decodeURIComponent(ref.split(/[?#]/, 1)[0]);
    assert.ok(exists(clean), `local HTML asset missing: ${ref}`);
  }
});

test('every relative JavaScript import in src resolves to a checked-in file', () => {
  const sourceDir = path.join(root, 'src');
  const files = fs.readdirSync(sourceDir).filter(name => name.endsWith('.js'));
  assert.ok(files.length > 0, 'expected JavaScript modules in src/');
  const importPattern = /(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"](\.{1,2}\/[^'"]+)['"]/g;
  for (const filename of files) {
    const source = fs.readFileSync(path.join(sourceDir, filename), 'utf8');
    for (const match of source.matchAll(importPattern)) {
      const resolved = path.resolve(sourceDir, match[1]);
      assert.ok(resolved.startsWith(sourceDir + path.sep), `${filename} import escapes src/: ${match[1]}`);
      assert.ok(fs.existsSync(resolved), `${filename} imports missing module: ${match[1]}`);
    }
  }
});

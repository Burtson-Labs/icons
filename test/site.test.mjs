import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, listIconNames } from '../scripts/lib.mjs';

execFileSync(process.execPath, [join(ROOT, 'site/build.mjs')], { stdio: 'pipe' });
const html = readFileSync(join(ROOT, 'site/dist/index.html'), 'utf8');

test('the site embeds every icon and serves its files', () => {
  const data = JSON.parse(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/.exec(html)[1]);
  assert.deepEqual(data.icons.map((i) => i.n).sort(), listIconNames());
  for (const n of listIconNames()) assert.ok(existsSync(join(ROOT, 'site/dist/svg', `${n}.svg`)), n);
  for (const f of ['sprite.svg', 'icons.json', 'robots.txt', 'sitemap.xml']) assert.ok(existsSync(join(ROOT, 'site/dist', f)), f);
});

test('the page loads nothing from another origin', () => {
  // Links out are fine; fetching scripts, styles, fonts or images is not.
  const loads = [...html.matchAll(/<(script|link|img|iframe)\b[^>]*\b(src|href)="(https?:[^"]+)"/g)]
    .filter((m) => !(m[1] === 'link' && /rel="canonical"/.test(m[0])))
    .map((m) => m[3]);
  assert.deepEqual(loads, []);
});

test('embedded data cannot close its script tag', () => {
  const block = /<script id="data" type="application\/json">([\s\S]*?)<\/script>/.exec(html)[1];
  assert.ok(!block.includes('</'));
});

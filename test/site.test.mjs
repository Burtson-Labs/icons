import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, listIconNames } from '../scripts/lib.mjs';

execFileSync(process.execPath, [join(ROOT, 'site/build.mjs')], { stdio: 'pipe' });
const html = readFileSync(join(ROOT, 'site/dist/index.html'), 'utf8');

test('the site embeds every icon and serves its files', () => {
  const data = JSON.parse(
    /<script id="data" type="application\/json">([\s\S]*?)<\/script>/.exec(html)[1],
  );
  assert.deepEqual(data.icons.map((i) => i.n).sort(), listIconNames());
  for (const n of listIconNames())
    assert.ok(existsSync(join(ROOT, 'site/dist/svg', `${n}.svg`)), n);
  for (const f of ['sprite.svg', 'icons.json', 'robots.txt', 'sitemap.xml'])
    assert.ok(existsSync(join(ROOT, 'site/dist', f)), f);
});

test('the page loads nothing from another origin', () => {
  // Links out are fine; fetching scripts, styles, fonts or images is not.
  // Code samples (inside <script> strings and <pre>) are text, not loads.
  const markup = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<pre[\s\S]*?<\/pre>/g, '');
  const loads = [
    ...markup.matchAll(/<(script|link|img|iframe)\b[^>]*\b(src|href)="(https?:[^"]+)"/g),
  ]
    .filter((m) => !(m[1] === 'link' && /rel="canonical"/.test(m[0])))
    .map((m) => m[3]);
  assert.deepEqual(loads, []);
});

test('embedded data cannot close its script tag', () => {
  const block = /<script id="data" type="application\/json">([\s\S]*?)<\/script>/.exec(html)[1];
  assert.ok(!block.includes('</'));
});

test('link previews (Slack, Teams, X) have a large image card', () => {
  const meta = (attr, key) =>
    new RegExp(`<meta ${attr}="${key}" content="([^"]+)"`).exec(html)?.[1];
  for (const k of [
    'og:title',
    'og:description',
    'og:url',
    'og:image',
    'og:image:alt',
    'og:site_name',
  ]) {
    assert.ok(meta('property', k), k);
  }
  assert.equal(meta('name', 'twitter:card'), 'summary_large_image');
  assert.match(meta('property', 'og:image'), /^https:\/\/icons\.burtson\.ai\/og\.png/);
  assert.equal(meta('property', 'og:image:width'), '1200');
  assert.equal(meta('property', 'og:image:height'), '630');
  for (const f of ['og.png', 'favicon.svg', 'apple-touch-icon.png'])
    assert.ok(existsSync(join(ROOT, 'site/dist', f)), f);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
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

test('every inline script is allowed by hash, and nothing else inline can run', () => {
  const csp = /<meta http-equiv="Content-Security-Policy" content="([^"]+)">/.exec(html)?.[1];
  assert.ok(csp, 'the page carries a script CSP');
  assert.ok(html.indexOf(csp) < html.indexOf('<script'), 'the policy precedes the first script');
  const scriptSrc = /script-src ([^;]+)/.exec(csp)[1].split(' ');
  assert.ok(!scriptSrc.includes("'unsafe-inline'") && !scriptSrc.includes("'unsafe-eval'"));
  assert.match(csp, /script-src-attr 'none'/);
  const inline = [
    ...html.matchAll(/<script(?![^>]*type="application\/json")[^>]*>([\s\S]*?)<\/script>/g),
  ];
  assert.ok(inline.length >= 2);
  for (const [, code] of inline)
    assert.ok(
      scriptSrc.includes(`'sha256-${createHash('sha256').update(code, 'utf8').digest('base64')}'`),
      'an inline script is missing from the CSP hashes',
    );
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

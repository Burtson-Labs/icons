import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { test } from 'node:test';

import { BRAND_GROUPS, MISSING, loadBrands } from '../scripts/brands.mjs';
import { ROOT, listIconNames } from '../scripts/lib.mjs';

const require = createRequire(import.meta.url);

test('every listed brand exists in the pinned simple-icons and is built', async () => {
  const brands = loadBrands();
  const listed = Object.values(BRAND_GROUPS).flatMap((g) => Object.keys(g.brands));
  assert.equal(brands.length, listed.length);
  const mod = await import('../dist/brands/index.js');
  for (const b of brands) {
    assert.match(b.hex, /^#[0-9A-F]{6}$/i, b.name);
    assert.equal(mod.brands[b.name].path, b.path);
    for (const d of ['svg', 'svg-color', 'react'])
      assert.ok(
        existsSync(join(ROOT, 'dist/brands', d, `${b.name}.${d === 'react' ? 'js' : 'svg'}`)),
      );
  }
  assert.match(mod.toBrandSvg('claude', { size: 16 }), /width="16"[^>]*fill="currentColor"/);
  assert.match(mod.toBrandSvg('docker', { colored: true }), /fill="#2496ED"/i);
  assert.throws(() => mod.toBrandSvg('no-such-brand'));
});

test('brands stay out of the stroke set', async () => {
  const { iconNodes } = await import('../dist/index.js');
  assert.equal(Object.keys(iconNodes).length, listIconNames().length);
  assert.ok(!existsSync(join(ROOT, 'icons', 'claude.svg')));
  const json = JSON.parse(readFileSync(join(ROOT, 'dist/brands/brands.json'), 'utf8'));
  assert.deepEqual(json.missing, MISSING);
  const trademarks = readFileSync(join(ROOT, 'TRADEMARKS.md'), 'utf8');
  for (const m of MISSING) assert.ok(trademarks.includes(m), `TRADEMARKS.md lacks ${m}`);
});

test('brand React components render monochrome by default and coloured on request', () => {
  const { ClaudeLogo, GithubLogo } = require('@burtson-labs/icons/brands/react');
  const { createElement } = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const mono = renderToStaticMarkup(createElement(ClaudeLogo, { size: 20 }));
  assert.match(mono, /fill="currentColor"/);
  assert.match(mono, /aria-hidden="true"/);
  const named = renderToStaticMarkup(createElement(GithubLogo, { colored: true, title: 'GitHub' }));
  assert.match(named, /fill="#181717"/);
  assert.match(named, /role="img"/);
  assert.match(named, /<title>GitHub<\/title>/);
});

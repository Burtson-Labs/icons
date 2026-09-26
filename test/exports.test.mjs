import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { loadBrands } from '../scripts/brands.mjs';
import { ROOT, listIconNames, toCamel, toPascal } from '../scripts/lib.mjs';

// The export contract: every source icon reaches every delivery surface, and
// every delivery surface holds only source icons. A stray file in dist/ or a
// missing per-icon entry fails here before it reaches npm.
const dist = join(ROOT, 'dist');
const read = (f) => readFileSync(join(dist, f), 'utf8');
const names = listIconNames();
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

test('every icon has a file on every surface', () => {
  const sprite = read('sprite.svg');
  const css = read('icons.css');
  const catalog = JSON.parse(read('icons.json'));
  const inCatalog = new Set(catalog.icons.map((i) => i.name));
  for (const n of names) {
    for (const f of [
      `svg/${n}.svg`,
      `svg-white/${n}.svg`,
      `svg-black/${n}.svg`,
      `svg-accent/${n}.svg`,
      `nodes/${n}.js`,
      `nodes/${n}.d.ts`,
      `react/${n}.js`,
      `react/${n}.d.ts`,
      `mui/${n}.js`,
      `mui/${n}.d.ts`,
    ])
      assert.ok(existsSync(join(dist, f)), `dist/${f}`);
    assert.ok(sprite.includes(`<symbol id="${n}"`), `sprite ${n}`);
    assert.ok(css.includes(`.bl-icon--${n}{`), `css ${n}`);
    assert.ok(inCatalog.has(n), `icons.json ${n}`);
    assert.ok(existsSync(join(ROOT, 'preview', 'accent', `${n}.svg`)), `preview ${n}`);
  }
  assert.equal(catalog.icons.length, names.length);
});

test('no surface carries an icon that is not in the source', () => {
  const src = new Set(names);
  for (const dir of ['svg', 'svg-white', 'svg-black', 'svg-accent', 'nodes', 'react', 'mui']) {
    const found = new Set(
      readdirSync(join(dist, dir)).map((f) => f.replace(/\.(d\.ts|js|svg)$/, '')),
    );
    assert.deepEqual(
      [...found].filter((n) => !src.has(n)),
      [],
      `orphans in dist/${dir}`,
    );
  }
});

test('the barrels export exactly the icon set (ESM, types and CommonJS)', async () => {
  const pascal = names.map(toPascal).sort();
  const camel = names.map(toCamel).sort();
  const react = await import('../dist/react.js');
  assert.deepEqual(
    Object.keys(react)
      .filter((k) => !['createIcon', 'createBurtsonIcon'].includes(k))
      .sort(),
    pascal,
  );
  const mui = await import('../dist/mui.js');
  assert.deepEqual(
    Object.keys(mui)
      .filter((k) => k !== 'createMuiIcon')
      .sort(),
    pascal,
  );
  const core = await import('../dist/index.js');
  const reserved = ['version', 'iconNodes', 'aliases', 'toSvg', 'resolveIcon'];
  assert.deepEqual(
    Object.keys(core)
      .filter((k) => !reserved.includes(k))
      .sort(),
    camel,
  );
  for (const [file, list] of [
    ['react.d.ts', pascal],
    ['mui.d.ts', pascal],
    ['index.d.ts', camel],
  ]) {
    const dts = read(file);
    for (const id of list) assert.ok(new RegExp(`\\b${id}\\b`).test(dts), `${file} lacks ${id}`);
  }
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  for (const entry of ['react', 'mui']) {
    const cjs = require(`../dist/cjs/${entry}.cjs`);
    for (const p of pascal) assert.equal(typeof cjs[p], 'object', `cjs/${entry} ${p}`);
  }
});

test('per-icon modules agree with the barrels and import nothing extra', async () => {
  for (const n of names.slice(0, 25)) {
    const p = toPascal(n);
    const react = await import(`../dist/react/${n}.js`);
    assert.equal(react.default, react[p]);
    const mui = await import(`../dist/mui/${n}.js`);
    assert.equal(mui.default, mui[p]);
    assert.equal(mui[p].muiName, 'SvgIcon');
    for (const src of [read(`react/${n}.js`), read(`mui/${n}.js`)]) {
      assert.ok(!src.includes('index.js'), 'per-icon modules never load the registry');
      assert.ok(src.includes(`nodes/${n}.js`));
    }
  }
});

test('the package exports map covers every subpath a consumer can import', () => {
  const ex = pkg.exports;
  for (const k of [
    '.',
    './react',
    './react/*',
    './mui',
    './mui/*',
    './nodes/*',
    './render',
    './browser',
    './svg/*',
    './sprite.svg',
    './icons.json',
    './icons.css',
    './brands',
    './brands/react',
    './brands/react/*',
    './package.json',
  ])
    assert.ok(ex[k], `exports lacks ${k}`);
  // Every exported file target exists (patterns checked with one icon).
  const sample = names[0];
  const brand = loadBrands()[0].name;
  const targets = (v) => (typeof v === 'string' ? [v] : Object.values(v));
  for (const [k, v] of Object.entries(ex))
    for (const t of targets(v)) {
      const name = k.startsWith('./brands') ? brand : sample;
      const f = t.replace('*', /\/svg[^/]*\/\*$/.test(k) ? `${name}.svg` : name);
      assert.ok(existsSync(join(ROOT, f)), `${k} -> ${f}`);
    }
  // typesVersions mirrors the subpaths that carry types, for older resolution.
  for (const k of ['react', 'react/*', 'mui', 'mui/*', 'nodes/*', 'render', 'browser', 'brands'])
    assert.ok(pkg.typesVersions['*'][k], `typesVersions lacks ${k}`);
  assert.deepEqual(pkg.sideEffects, ['**/*.css']);
});

test('brand logos have a React file per logo and stay out of the stroke set', () => {
  const brands = loadBrands().map((b) => b.name);
  const files = readdirSync(join(dist, 'brands', 'react'))
    .filter((f) => f.endsWith('.js'))
    .map((f) => f.slice(0, -3));
  assert.deepEqual(files.sort(), [...brands].sort());
  // Brands and icons are separate namespaces (`XLogo` beside `X`), so a shared
  // kebab name is fine; the React export names must not collide.
  const reactNames = new Set(names.map(toPascal));
  for (const b of brands) assert.ok(!reactNames.has(`${toPascal(b)}Logo`), `${b}Logo collides`);
});

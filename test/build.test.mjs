import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, listIconNames } from '../scripts/lib.mjs';

test('the build output matches the source', async () => {
  const { iconNodes, toSvg, shieldProof, aliases } = await import('../dist/index.js');
  assert.deepEqual(Object.keys(iconNodes).sort(), listIconNames());
  assert.equal(iconNodes['shield-proof'], shieldProof);
  assert.ok(aliases && typeof aliases === 'object');
  const svg = toSvg('shield-proof', { size: 20, color: '#a60ee5' });
  assert.match(svg, /width="20"/);
  assert.match(svg, /stroke="#a60ee5"/);
  assert.throws(() => toSvg('no-such-icon'));
  assert.equal(readdirSync(join(ROOT, 'dist/svg')).length, listIconNames().length);
  const sprite = readFileSync(join(ROOT, 'dist/sprite.svg'), 'utf8');
  for (const n of listIconNames()) assert.ok(sprite.includes(`id="${n}"`), n);
});

test('types and React components are generated for every icon', () => {
  const dts = readFileSync(join(ROOT, 'dist/index.d.ts'), 'utf8');
  const react = readFileSync(join(ROOT, 'dist/react.js'), 'utf8');
  const reactDts = readFileSync(join(ROOT, 'dist/react.d.ts'), 'utf8');
  for (const n of listIconNames()) {
    assert.ok(dts.includes(`"${n}"`), `IconName lacks ${n}`);
    const pascal = n.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
    assert.ok(
      react.includes(`export { ${pascal} } from './react/${n}.js';`),
      `react.js lacks ${pascal}`,
    );
    assert.ok(
      reactDts.includes(`export { ${pascal} } from './react/${n}.js';`),
      `react.d.ts lacks ${pascal}`,
    );
  }
});

test('the README block and previews track the icon set', () => {
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
  assert.match(readme, new RegExp(`\\*\\*${listIconNames().length} icons\\*\\*`));
  for (const theme of ['light', 'dark']) {
    const sheet = readFileSync(join(ROOT, `preview/sheet-${theme}.svg`), 'utf8');
    assert.equal((sheet.match(/<text /g) ?? []).length, listIconNames().length);
  }
  assert.equal(readdirSync(join(ROOT, 'preview/accent')).length, listIconNames().length);
});

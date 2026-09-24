import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { toSvg, iconNodes, resolveIcon, aliases } from '../dist/index.js';
import { toSvgNode, validateNode } from '../dist/render.js';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(root, f), 'utf8');
const catalog = JSON.parse(read('dist/icons.json'));

test('catalog, SVGs, node modules and React modules have matching names', () => {
  assert.ok(catalog.icons.length >= 82);
  assert.equal(Object.keys(iconNodes).length, catalog.icons.length);
  for (const icon of catalog.icons) {
    assert.deepEqual(iconNodes[icon.name], icon.node);
    assert.match(read(`dist/svg/${icon.name}.svg`), /viewBox="0 0 24 24"/);
    assert.match(read(`dist/react/${icon.name}.js`), /@__PURE__/);
    assert.ok(read(`dist/react/${icon.name}.d.ts`).includes('export default'));
  }
});
test('all generated node data is safe geometry', () => {
  for (const icon of catalog.icons)
    assert.equal(validateNode(iconNodes[icon.name]), iconNodes[icon.name]);
});
test('original and expanded icon names remain available', () => {
  for (const n of [
    'stealth-mask',
    'agent-terminal',
    'gpu',
    'shield-proof',
    'agent-loop',
    'mcp-port',
    'workflow-branch',
    'voice-agent',
    'truck-route',
  ])
    assert.ok(iconNodes[n], n);
});
test('raw-node and by-name rendering agree', () => {
  assert.equal(toSvg('agent-loop'), toSvgNode(iconNodes['agent-loop']));
});
test('per-icon node imports do not require React', async () => {
  const module = await import('../dist/nodes/agent-loop.js');
  assert.equal(module.default, iconNodes['agent-loop']);
});
test('unknown and prototype-property names are rejected', () => {
  for (const n of ['not-an-icon', 'constructor', '__proto__', 'toString'])
    assert.throws(() => toSvg(n), /unknown icon/);
});
test('existing aliases still resolve', () => {
  for (const [alias, name] of Object.entries(aliases))
    assert.equal(resolveIcon(alias), iconNodes[name]);
});
test('all string options are escaped, including size and stroke width', () => {
  const attack = '24" onload="alert(1)';
  const s = toSvg('agent-loop', {
    size: attack,
    strokeWidth: attack,
    color: attack,
    className: attack,
  });
  assert.ok(s.includes('&quot;'));
  assert.ok(!s.includes(' onload="'));
  assert.ok(!s.includes('<script'));
});
test('geometry rejects executable tags and attributes', () => {
  assert.throws(() => toSvgNode([['script', { d: 'M3 3' }]]), /geometry/);
  assert.throws(() => toSvgNode([['path', { d: 'M3 3', onload: 'x' }]]), /attribute/);
  assert.throws(() => toSvgNode([['use', { href: 'https://invalid.example/a.svg' }]]), /geometry/);
  assert.throws(() => toSvgNode([['path', { d: Infinity }]]), /finite/);
});
test('invalid numeric size and stroke width fail clearly', () => {
  for (const size of [0, -1, Infinity, NaN])
    assert.throws(() => toSvg('agent-loop', { size }), RangeError);
  for (const strokeWidth of [-1, Infinity, NaN])
    assert.throws(() => toSvg('agent-loop', { strokeWidth }), RangeError);
  assert.ok(toSvg('agent-loop', { strokeWidth: 0 }).includes('stroke-width="0"'));
});
test('CSS sizes work with non-scaling stroke', () => {
  const svg = toSvg('agent-loop', { size: '1em', absoluteStrokeWidth: true });
  assert.ok(svg.includes('width="1em"'));
  assert.ok(svg.includes('vector-effect="non-scaling-stroke"'));
  assert.ok(!svg.includes('NaN'));
});
test('decorative icons are hidden and not keyboard focusable', () => {
  const svg = toSvg('agent-loop');
  assert.ok(svg.includes('aria-hidden="true"'));
  assert.ok(svg.includes('focusable="false"'));
});
test('aria-labelledby prevents automatic hiding', () => {
  const svg = toSvg('agent-loop', { ariaLabelledby: 'agent-status' });
  assert.ok(svg.includes('aria-labelledby="agent-status"'));
  assert.ok(!svg.includes('aria-hidden="true"'));
  assert.ok(svg.includes('role="img"'));
});
test('titles are escaped and accessible without duplicate generated IDs', () => {
  const svg = toSvg('agent-loop', { title: '<Run> & repeat' });
  assert.ok(svg.includes('<title>&lt;Run&gt; &amp; repeat</title>'));
  assert.ok(svg.includes('aria-label="&lt;Run&gt; &amp; repeat"'));
  assert.ok(!svg.includes(' id='));
});
test('explicit title IDs and aria-hidden override defaults', () => {
  const svg = toSvg('agent-loop', { title: 'Run', titleId: 'unique-title', ariaHidden: true });
  assert.ok(svg.includes('<title id="unique-title">Run</title>'));
  assert.ok(svg.includes('aria-hidden="true"'));
});
test('CDN color variants have explicit colors', () => {
  for (const [dir, color] of [
    ['svg-white', '#ffffff'],
    ['svg-black', '#111111'],
    ['svg-accent', '#a60ee5'],
  ])
    assert.ok(read(`dist/${dir}/stealth-mask.svg`).includes(`stroke="${color}"`));
});
test('sprite symbols carry presentation attributes', () => {
  const sprite = read('dist/sprite.svg');
  assert.equal((sprite.match(/<symbol /g) || []).length, catalog.icons.length);
  assert.equal((sprite.match(/stroke-linecap="round"/g) || []).length, catalog.icons.length);
});
test('per-icon React files never import the full registry', () => {
  for (const f of readdirSync(join(root, 'dist/react')).filter((f) => f.endsWith('.js'))) {
    assert.ok(!read(`dist/react/${f}`).includes('index.js'));
    assert.ok(!read(`dist/react/${f}`).includes('import *'));
  }
  assert.ok(!read('dist/react-factory.js').includes('index.js'));
});
test('browser global contains no import, eval, automatic scan or HTML injection', () => {
  const js = read('dist/burtson-icons.js');
  assert.ok(!/^import /m.test(js));
  assert.ok(!/\beval\s*\(/.test(js));
  assert.ok(!js.includes('innerHTML'));
  assert.ok(js.includes('globalThis.BurtsonIcons'));
});
test('CSS contains every icon with relative mask URLs', () => {
  const css = read('dist/icons.css');
  for (const icon of catalog.icons) assert.ok(css.includes(`./svg/${icon.name}.svg`));
});
let React, renderToStaticMarkup;
try {
  React = await import('react');
  ({ renderToStaticMarkup } = await import('react-dom/server'));
} catch {
  /* Optional peers: core-only installs are supported. */
}
test(
  'React SSR supports CSS-unit strokes, labels and unique title IDs',
  { skip: !React || !renderToStaticMarkup },
  async () => {
    const { AgentLoop } = await import('../dist/react.js');
    assert.equal(AgentLoop.displayName, 'AgentLoop');
    const markup = renderToStaticMarkup(
      React.createElement(
        React.Fragment,
        null,
        React.createElement(AgentLoop, { size: '1em', absoluteStrokeWidth: true, title: 'First' }),
        React.createElement(AgentLoop, { title: 'Second' }),
      ),
    );
    assert.ok(!markup.includes('NaN'));
    assert.ok(markup.includes('vector-effect="non-scaling-stroke"'));
    const ids = [...markup.matchAll(/<title id="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(ids.length, 2);
    assert.notEqual(ids[0], ids[1]);
    const label = renderToStaticMarkup(
      React.createElement(AgentLoop, { 'aria-labelledby': 'label' }),
    );
    assert.ok(!label.includes('aria-hidden="true"'));
  },
);

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { measure } from '../scripts/geometry.mjs';
import { readCategories } from '../scripts/lib.mjs';
import { RULES, canonicalSvg, lintAll, lintIcon } from '../scripts/lint-icons.mjs';

const HEAD =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
const META = { tags: ['one', 'two', 'three'], categories: ['interface'], contributors: ['x'] };
const file = (els) => `${HEAD}\n${els.map((e) => `  ${e}`).join('\n')}\n</svg>\n`;
const lint = (els, meta = META, name = 'probe') =>
  lintIcon(name, file(els), meta, readCategories(), JSON.stringify(meta) + '\n');
const errors = (...a) => lint(...a).errors.join('\n');

test('every icon in the repo passes the house lint', async () => {
  const failing = (await lintAll()).filter((r) => r.errors.length);
  assert.deepEqual(
    failing.map((r) => `${r.name}: ${r.errors.join('; ')}`),
    [],
  );
});

test('geometry is measured along curves, not control points', () => {
  const circle = measure([['circle', { cx: '12', cy: '12', r: '9' }]]);
  assert.deepEqual(circle.bbox, [3, 3, 21, 21]);
  assert.ok(Math.abs(circle.length - 2 * Math.PI * 9) < 0.2);
  // A quarter arc from (3,12) to (12,3): the bbox follows the arc, not its chord.
  const arc = measure([['path', { d: 'M3 12A9 9 0 0 1 12 3' }]]);
  assert.deepEqual(arc.bbox, [3, 3, 12, 12]);
  assert.ok(Math.abs(arc.length - (Math.PI * 9) / 2) < 0.1);
  const bez = measure([['path', { d: 'M2 12C2 2 22 2 22 12' }]]);
  assert.ok(bez.bbox[1] > 4 && bez.bbox[1] < 5, 'cubic peaks at y=4.5, not at the control y=2');
});

test('the lint enforces the measured standard', () => {
  assert.equal(errors(['<circle cx="12" cy="12" r="9" />']), '');
  assert.match(errors(['<circle cx="12" cy="12" r="4" />']), /too small/);
  assert.match(errors(['<path d="M0.5 12h23" />']), /too large/);
  assert.match(errors(['<circle cx="8" cy="8" r="6" />']), /off centre/);
  assert.match(
    errors(['<path d="M2 2h20v20H2zM4 4h16v16H4zM6 6h12v12H6zM8 8h8v8H8zM10 10h4v4h-4z" />']),
    /too heavy/,
  );
  assert.match(
    errors(
      Array.from({ length: RULES.maxElements + 1 }, (_, k) => `<path d="M3 ${3 + k * 2}h18" />`),
    ),
    /elements; the budget/,
  );
  const light = lint(['<path d="M3.3 12h17.4" />']);
  assert.match(light.warnings.join(), /0\/2 endpoints on the 0.5 grid/);
});

test('source formatting is canonical and fixable', () => {
  const messy = `${HEAD}\n<circle cx="12" cy="12" r="9"/>\n</svg>`;
  const r = lintIcon('probe', messy, META, readCategories(), JSON.stringify(META) + '\n');
  assert.match(r.errors.join(), /source formatting/);
  assert.equal(r.fixes.svg, canonicalSvg([['circle', { cx: '12', cy: '12', r: '9' }]]));
  assert.equal(r.fixes.svg, file(['<circle cx="12" cy="12" r="9" />']));
});

test('names put the modifier last unless the icon is a badge', () => {
  const ok = [
    'file-plus',
    'shield-off',
    'x-circle',
    'check-square',
    'alert-triangle',
    'circle-dashed',
  ];
  for (const n of ok) assert.equal(errors(['<circle cx="12" cy="12" r="9" />'], META, n), '', n);
  assert.match(errors(['<circle cx="12" cy="12" r="9" />'], META, 'plus-file'), /modifier/);
  assert.match(errors(['<circle cx="12" cy="12" r="9" />'], META, 'off-shield'), /modifier/);
});

test('metadata needs three real search tags, ordered keys and a contributor', () => {
  const geo = ['<circle cx="12" cy="12" r="9" />'];
  assert.match(errors(geo, { ...META, tags: ['probe', 'a', 'b'] }), /search tags besides the name/);
  assert.match(errors(geo, { ...META, tags: ['A', 'b', 'c'] }), /lowercase/);
  assert.match(errors(geo, { ...META, tags: ['a', 'a', 'b'] }), /duplicate tags/);
  assert.match(errors(geo, { ...META, categories: [] }), /no category/);
  assert.match(errors(geo, { ...META, categories: ['a', 'b', 'c'] }), /at most/);
  assert.match(errors(geo, { ...META, contributors: [] }), /contributors/);
  assert.match(errors(geo, { ...META, extra: 1 }), /unknown metadata keys/);
  assert.match(errors(geo, { ...META, aliases: ['probe'] }), /own name/);
  const shuffled = { contributors: ['x'], tags: META.tags, categories: META.categories };
  assert.match(errors(geo, shuffled), /keys in order/);
});

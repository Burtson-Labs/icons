import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT, listIconNames, toCamel, toPascal, toSvgString } from '../scripts/lib.mjs';

const run = (script, args = []) =>
  spawnSync(process.execPath, [join(ROOT, 'scripts', script), ...args], {
    encoding: 'utf8',
    env: { ...process.env, GITHUB_ACTIONS: '' },
  });

test('new-icon refuses bad names and existing icons without writing', () => {
  const bad = run('new-icon.mjs', ['Bad_Name']);
  assert.equal(bad.status, 64);
  assert.match(bad.stderr, /usage/);
  const taken = run('new-icon.mjs', [listIconNames()[0], 'security']);
  assert.equal(taken.status, 1);
  assert.match(taken.stderr, /already exists/);
  const noCat = run('new-icon.mjs', ['not-in-backlog-xyz']);
  assert.equal(noCat.status, 64);
  assert.match(noCat.stderr, /give a category/);
});

test('status totals match the icons on disk', () => {
  const r = run('status.mjs');
  assert.equal(r.status, 0);
  assert.match(r.stdout, new RegExp(`total\\s+${listIconNames().length} drawn`));
});

test('name helpers and SVG serialisation', () => {
  assert.equal(toCamel('shield-proof'), 'shieldProof');
  assert.equal(toPascal('gpu'), 'Gpu');
  const svg = toSvgString([['circle', { cx: '12', cy: '12', r: '9' }]], {
    size: 16,
    color: 'a"<b',
  });
  assert.match(svg, /width="16"/);
  assert.ok(svg.includes('stroke="a&quot;&lt;b"'), 'attribute values are escaped');
});

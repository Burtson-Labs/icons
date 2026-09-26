import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { test } from 'node:test';

import { ROOT } from '../scripts/lib.mjs';

// Rendered markup of the React and MUI wrappers, pinned. A change here is a
// change every consumer sees (attributes, a11y, class names), so it is
// reviewed in the diff of test/snapshots/wrappers.json.
//   UPDATE_SNAPSHOTS=1 npm test
const require = createRequire(import.meta.url);
const { createElement: h } = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const FILE = join(ROOT, 'test', 'snapshots', 'wrappers.json');
const update = process.env.UPDATE_SNAPSHOTS === '1';

// Emotion class hashes depend on the MUI version, not on us.
const normalise = (html) => html.replace(/css-[a-z0-9]+/g, 'css-HASH');

const react = await import('../dist/react.js');
const mui = await import('../dist/mui.js');
const brands = await import('../dist/brands/react.js');
const cases = {
  'react: default is decorative': h(react.AgentLoop),
  'react: size, stroke and className': h(react.ShieldProof, {
    size: 16,
    strokeWidth: 1.5,
    className: 'x',
  }),
  'react: title labels the icon': h(react.AgentLoop, { title: 'Agent loop', titleId: 't1' }),
  'react: aria-label labels without a title': h(react.AgentLoop, { 'aria-label': 'Agent' }),
  'react: absolute stroke with a CSS size': h(react.Gpu, {
    size: '1em',
    absoluteStrokeWidth: true,
  }),
  'react: explicit aria-hidden wins': h(react.AgentLoop, { title: 'x', 'aria-hidden': true }),
  'mui: default is decorative': h(mui.AgentLoop),
  'mui: fontSize, color and sx': h(mui.ShieldProof, {
    fontSize: 'small',
    color: 'primary',
    sx: { mr: 1 },
  }),
  'mui: title is titleAccess': h(mui.AgentLoop, { title: 'Agent loop' }),
  'mui: titleAccess': h(mui.AgentLoop, { titleAccess: 'Agent loop', strokeWidth: 1.5 }),
  'brands: monochrome by default': h(brands.GithubLogo, { size: 20 }),
  'brands: coloured with a title': h(brands.GithubLogo, { colored: true, title: 'GitHub' }),
};

const actual = Object.fromEntries(
  Object.entries(cases).map(([k, el]) => [k, normalise(renderToStaticMarkup(el))]),
);

test('wrapper markup matches the committed snapshots', () => {
  if (update || !existsSync(FILE)) {
    mkdirSync(join(ROOT, 'test', 'snapshots'), { recursive: true });
    writeFileSync(FILE, JSON.stringify(actual, null, 2) + '\n');
  }
  const expected = JSON.parse(readFileSync(FILE, 'utf8'));
  assert.deepEqual(Object.keys(actual), Object.keys(expected), 'snapshot cases');
  for (const k of Object.keys(actual)) assert.equal(actual[k], expected[k], k);
});

test('the snapshots say what the a11y contract promises', () => {
  assert.match(actual['react: default is decorative'], /aria-hidden="true"/);
  assert.doesNotMatch(actual['react: default is decorative'], /role="img"/);
  assert.match(actual['react: title labels the icon'], /role="img"[^>]*aria-labelledby="t1"/);
  assert.match(actual['react: title labels the icon'], /<title id="t1">Agent loop<\/title>/);
  assert.match(actual['mui: default is decorative'], /aria-hidden="true"/);
  assert.match(actual['mui: title is titleAccess'], /role="img"/);
  assert.match(actual['mui: title is titleAccess'], /<title>Agent loop<\/title>/);
  assert.doesNotMatch(actual['mui: title is titleAccess'], / title="/);
  assert.match(actual['mui: fontSize, color and sx'], /MuiSvgIcon-fontSizeSmall/);
});

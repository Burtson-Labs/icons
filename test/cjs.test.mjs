import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

import { listIconNames } from '../scripts/lib.mjs';

// CommonJS consumers (TypeScript `module: CommonJS`, plain require) get the
// main entries as real CJS, not an ESM file they cannot load.
const require = createRequire(import.meta.url);

test('require() loads the core entry with every icon', () => {
  const core = require('@burtson-labs/icons');
  assert.equal(typeof core.toSvg, 'function');
  assert.equal(Object.keys(core.iconNodes).length, listIconNames().length);
  assert.match(core.toSvg('gpu', { size: 20 }), /width="20"/);
});

test('require() loads the React entry and it renders', () => {
  const react = require('@burtson-labs/icons/react');
  const { createElement } = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const html = renderToStaticMarkup(
    createElement(react.ShieldProof, { size: 16, 'aria-label': 'verified' }),
  );
  assert.match(html, /^<svg[^>]*width="16"/);
  assert.match(html, /aria-label="verified"/);
});

test('require() loads the renderer', () => {
  const render = require('@burtson-labs/icons/render');
  assert.equal(typeof render.toSvgNode, 'function');
});

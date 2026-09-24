import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

import { listIconNames } from '../scripts/lib.mjs';

// The MUI entry must behave like @mui/icons-material: fontSize, color and sx
// all work, and the outline is not flooded by SvgIcon's CSS fill.
const require = createRequire(import.meta.url);
const { createElement } = require('react');
const { renderToString } = require('react-dom/server');

test('every icon is exported for MUI', async () => {
  const mui = await import('../dist/mui.js');
  const exported = Object.keys(mui).filter((k) => k !== 'createMuiIcon');
  assert.equal(exported.length, listIconNames().length);
});

for (const [label, load] of [
  ['ESM', () => import('../dist/mui.js')],
  ['CommonJS', async () => require('@burtson-labs/icons/mui')],
]) {
  test(`${label}: MUI props render like a Material icon, outline stays unfilled`, async () => {
    const { Settings } = await load();
    assert.equal(Settings.muiName, 'SvgIcon');
    const html = renderToString(
      createElement(Settings, { fontSize: 'small', color: 'primary', sx: { mr: 1 } }),
    );
    assert.match(html, /MuiSvgIcon-fontSizeSmall/);
    assert.match(html, /MuiSvgIcon-colorPrimary/);
    assert.match(html, /stroke="currentColor"/);
    assert.match(html, /viewBox="0 0 24 24"/);
  });
}

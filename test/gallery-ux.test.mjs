import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { JSDOM } from 'jsdom';

import { ROOT, listIconNames } from '../scripts/lib.mjs';
import { loadBrands } from '../scripts/brands.mjs';

const COUNT = listIconNames().length;

// DOM behavior tests; jsdom has no layout, native dialog focus trap, or contrast engine.
function open(query = '', mobile = false) {
  const html = readFileSync(join(ROOT, 'site/dist/index.html'), 'utf8');
  return new JSDOM(html, {
    url: 'https://icons.burtson.ai/' + query,
    runScripts: 'dangerously',
    beforeParse(window) {
      window.matchMedia = (query) => ({
        matches: query.includes('850px') && mobile,
        addEventListener() {},
      });
      window.HTMLDialogElement.prototype.showModal = function () {
        this.open = true;
      };
      window.HTMLDialogElement.prototype.close = function () {
        if (this.open) {
          this.open = false;
          this.dispatchEvent(new window.Event('close'));
        }
      };
    },
  });
}
function input(dom, id, value) {
  const el = dom.window.document.getElementById(id);
  el.value = value;
  el.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
}

test('interface-size previews compare light and dark surfaces and follow the chosen stroke', () => {
  const dom = open('#keyboard');
  try {
    const d = dom.window.document;
    for (const surface of ['light', 'dark']) {
      const row = d.querySelector(`#sizes [data-surface="${surface}"]`);
      assert.ok(row);
      assert.deepEqual(
        [...row.querySelectorAll('svg')].map((svg) => svg.getAttribute('width')),
        ['16', '20', '24', '32'],
      );
    }
    input(dom, 'weight', '1.5');
    assert.ok(
      [...d.querySelectorAll('#sizes svg')].every(
        (svg) => svg.getAttribute('stroke-width') === '1.5',
      ),
    );
    d.querySelector('[data-key="clipboard-paste"]').click();
    assert.equal(d.querySelector('#sizes svg rect').getAttribute('width'), '6');
    assert.match(d.getElementById('code').textContent, /ClipboardPaste/);
  } finally {
    dom.window.close();
  }
});

test('remote desktop and clipboard shortcuts find the matching controls', () => {
  const dom = open();
  try {
    const d = dom.window.document;
    d.querySelector('[data-workflow="remote desktop"]').click();
    const names = [...d.querySelectorAll('.tile')].map((tile) => tile.dataset.key);
    for (const name of ['monitor-connect', 'file-transfer', 'touchpad', 'clipboard-paste']) {
      assert.ok(names.includes(name), `${name} is discoverable by its workflow`);
    }
    d.querySelector('[data-workflow="clipboard"]').click();
    assert.ok(d.querySelector('[data-key="clipboard"]'));
    assert.ok(d.querySelector('[data-key="clipboard-paste"]'));
  } finally {
    dom.window.close();
  }
});

test('search accepts multiple words and normalizes hyphens', () => {
  const dom = open();
  try {
    input(dom, 'search', 'agent loop');
    const tiles = dom.window.document.querySelectorAll('.tile');
    assert.ok(tiles.length > 0);
    assert.equal(tiles[0].dataset.key, 'agent-loop');
    input(dom, 'search', 'zzzz-no-match');
    assert.equal(dom.window.document.getElementById('result-count').textContent, '0 icons');
    dom.window.document.getElementById('empty-reset').click();
    assert.equal(dom.window.document.querySelectorAll('.tile').length, COUNT);
  } finally {
    dom.window.close();
  }
});

test('size, stroke, format and accessibility mode survive a shared link', () => {
  const dom = open('?size=40&stroke=1.5&format=svg&decorative=false#agent-loop');
  try {
    const code = dom.window.document.getElementById('code').textContent;
    assert.match(code, /width="40"/);
    assert.match(code, /stroke-width="1.5"/);
    assert.match(code, /aria-label="agent loop"/);
    input(dom, 'size', '32');
    assert.match(dom.window.document.getElementById('code').textContent, /width="32"/);
    assert.equal(new URL(dom.window.location.href).searchParams.get('size'), '32');
  } finally {
    dom.window.close();
  }
});

test('malformed URL encoding does not break initialization', () => {
  const dom = open('#%E0%A4%A');
  try {
    assert.equal(dom.window.document.querySelectorAll('.tile').length, COUNT);
  } finally {
    dom.window.close();
  }
});

test('saves icons, filters the collection, and persists selection', () => {
  const dom = open('#agent-loop');
  try {
    const d = dom.window.document;
    d.getElementById('save').click();
    d.getElementById('saved-only').click();
    assert.equal(d.querySelectorAll('.tile').length, 1);
    assert.equal(d.querySelector('.tile').dataset.key, 'agent-loop');
    assert.deepEqual(JSON.parse(dom.window.localStorage.getItem('bl-icons-saved')), ['agent-loop']);
    d.getElementById('save').click();
    assert.equal(d.querySelectorAll('.tile').length, 0);
  } finally {
    dom.window.close();
  }
});

test('format tabs and icon results have one tab stop and support arrows', () => {
  const dom = open();
  try {
    const d = dom.window.document;
    assert.equal(d.querySelectorAll('.tile[tabindex="0"]').length, 1);
    const first = d.querySelector('[data-tab="react"]');
    first.focus();
    first.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    assert.equal(d.activeElement.dataset.tab, 'mui');
    assert.equal(d.activeElement.getAttribute('aria-selected'), 'true');
    assert.equal(d.getElementById('code').getAttribute('aria-labelledby'), d.activeElement.id);
  } finally {
    dom.window.close();
  }
});

test('mobile selection opens an inspector and closing restores its location', () => {
  const dom = open('', true);
  try {
    const d = dom.window.document;
    d.querySelector('.tile').click();
    assert.equal(d.getElementById('mobile-inspector').open, true);
    assert.equal(d.getElementById('inspector').parentElement.id, 'mobile-inspector');
    d.getElementById('close-inspector').click();
    assert.equal(d.getElementById('mobile-inspector').open, false);
    assert.equal(d.getElementById('inspector').parentElement.className, 'shell');
  } finally {
    dom.window.close();
  }
});

test('the MUI tab shows a per-icon import with the chosen size and a titleAccess label', () => {
  const dom = open('?format=mui&size=20&decorative=false#agent-loop');
  try {
    const code = dom.window.document.getElementById('code').textContent;
    assert.match(code, /@burtson-labs\/icons\/mui\/agent-loop/);
    assert.match(code, /fontSize: 20/);
    assert.match(code, /titleAccess="agent loop"/);
  } finally {
    dom.window.close();
  }
});

test('brand logos remain separate and disable stroke adjustment', () => {
  const dom = open('#brand-github');
  try {
    const d = dom.window.document;
    assert.equal(d.getElementById('collection').value, 'brands');
    assert.equal(d.querySelectorAll('.tile').length, loadBrands().length);
    assert.equal(d.getElementById('weight').disabled, true);
    assert.match(d.getElementById('code').textContent, /brands\/react\/github/);
  } finally {
    dom.window.close();
  }
});

test('code blocks are coloured and each has a copy button that copies its own text', async () => {
  const dom = open();
  const doc = dom.window.document;
  const blocks = [...doc.querySelectorAll('.usage .code-block')];
  assert.deepEqual(
    blocks.map((b) => b.querySelector('figcaption').textContent),
    ['Install', 'React', 'MUI', 'JavaScript', 'CDN'],
  );
  for (const b of blocks) assert.ok(b.querySelector('.copy-code'), 'copy button');
  assert.ok(doc.querySelector('#code .tok-string'), 'inspector code is highlighted');
  assert.ok(doc.querySelector('.usage .tok-keyword'), 'usage code is highlighted');

  let copied = '';
  Object.defineProperty(dom.window.navigator, 'clipboard', {
    value: { writeText: async (t) => (copied = t) },
  });
  const install = blocks[0].querySelector('.copy-code');
  install.click();
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(copied, 'npm install @burtson-labs/icons');
  assert.ok(install.classList.contains('copied'));
  assert.equal(install.getAttribute('aria-label'), 'Copied');
});

test('workflow shortcuts reset saved filters and preview the selected icon in context', () => {
  const dom = open();
  try {
    const d = dom.window.document;
    d.querySelector('[data-workflow="profile"]').click();
    assert.equal(d.getElementById('search').value, 'profile');
    const tile = d.querySelector('[data-key="user-image"]');
    assert.ok(tile);
    tile.click();
    assert.equal(d.querySelector('#context-preview svg').getAttribute('width'), '20');
    assert.match(d.getElementById('context-preview').textContent, /user image/);
  } finally {
    dom.window.close();
  }
});

test('mobile package navigation closes on Escape and returns focus', () => {
  const dom = open('', true);
  try {
    const menu = dom.window.document.querySelector('.package-menu');
    menu.open = true;
    menu.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(menu.open, false);
    assert.equal(dom.window.document.activeElement, menu.querySelector('summary'));
  } finally {
    dom.window.close();
  }
});

test('legacy PascalCase names and Material suffixes find canonical icons', () => {
  const dom = open();
  try {
    input(dom, 'search', 'ContentCopy');
    assert.ok(dom.window.document.querySelector('[data-key="copy"]'));
    input(dom, 'search', 'RecordVoiceOver');
    assert.ok(dom.window.document.querySelector('[data-key="speech-output"]'));
    input(dom, 'search', 'PlayArrowRounded');
    assert.ok(dom.window.document.querySelector('[data-key="play"]'));
  } finally {
    dom.window.close();
  }
});

test('ETS color layers survive gallery preview and copied SVG', () => {
  const dom = open('?format=svg#brand-ets');
  try {
    const d = dom.window.document;
    assert.equal(d.getElementById('collection').value, 'brands');
    assert.equal(d.querySelectorAll('#selected-preview path').length, 3);
    const code = d.getElementById('code').textContent;
    for (const path of d.querySelectorAll('#selected-preview path')) {
      assert.ok(code.includes(path.getAttribute('d')));
      assert.ok(code.includes(path.getAttribute('fill')));
    }
    input(dom, 'search', 'Robertson Williams');
    assert.equal(d.querySelector('.tile').dataset.key, 'brand-rwt');
  } finally {
    dom.window.close();
  }
});

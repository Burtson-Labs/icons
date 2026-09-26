import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { JSDOM } from 'jsdom';

import { ROOT, listIconNames } from '../scripts/lib.mjs';

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
    assert.equal(d.querySelectorAll('.tile').length, 75);
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

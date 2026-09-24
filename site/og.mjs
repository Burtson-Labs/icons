#!/usr/bin/env node
// Renders site/og.png, the 1200x630 card Slack, Teams, LinkedIn and X show
// when someone shares icons.burtson.ai. It is committed rather than built in
// CI because it needs a real browser; rerun `npm run og` when the set grows.
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

import { loadIcons } from '../scripts/build.mjs';
import { ROOT, nodeToInner } from '../scripts/lib.mjs';
import { fail, say } from '../scripts/log.mjs';

const CHROME = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => p && existsSync(p));
if (!CHROME) {
  fail('no Chrome found; set CHROME_BIN');
  process.exit(1);
}

const icons = loadIcons();
const byName = new Map(icons.map((i) => [i.name, i]));
// A mix that says "for the tools we build": agents, editors, security,
// provenance, infrastructure, voice and the everyday basics.
const featured = [
  'agent',
  'agent-loop',
  'sparkles',
  'terminal',
  'code-window',
  'git-branch',
  'git-worktree',
  'shield-proof',
  'merkle-tree',
  'signed-log',
  'key',
  'lock',
  'gpu',
  'microvm',
  'cluster-hex',
  'server-stack',
  'vector-store',
  'waveform',
  'mic',
  'workflow-branch',
  'approval-gate',
  'evidence-bag',
  'search',
  'settings',
  'folder-open',
  'file-code',
  'rocket',
  'bell',
  'message-square',
  'users',
  'cloud-check',
  'bowling-pin',
].filter((n) => byName.has(n));
const glyph = (name, size, color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${nodeToInner(byName.get(name).node)}</svg>`;
const vial = byName.has('burtson-labs-vial') ? 'burtson-labs-vial' : 'stealth-mask';

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#101016;color:#f0edf7;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif;overflow:hidden;position:relative}
.glow{position:absolute;inset:auto -200px -260px auto;width:760px;height:760px;background:radial-gradient(circle,#a60ee540,transparent 65%)}
.left{position:absolute;left:72px;top:70px;width:560px}
.brand{display:flex;align-items:center;gap:14px;font-size:26px;font-weight:700;letter-spacing:-.4px}
.brand small{display:block;font:500 13px ui-monospace,Menlo,monospace;letter-spacing:2px;color:#a39bac;margin-top:2px}
h1{font-size:64px;line-height:1.02;letter-spacing:-2.4px;font-weight:750;margin-top:64px}
h1 span{color:#c77afa}
p{font-size:23px;line-height:1.45;color:#b9b1c4;margin-top:22px}
.meta{position:absolute;left:72px;bottom:62px;display:flex;gap:14px;font:600 18px ui-monospace,Menlo,monospace}
.pill{border:1px solid #2e2a3b;background:#191820;border-radius:999px;padding:9px 16px;color:#e4ddeb}
.pill.accent{border-color:#a60ee5;color:#d9a8fa;background:#2b193a}
.grid{position:absolute;right:62px;top:62px;display:grid;grid-template-columns:repeat(4,108px);gap:12px}
.cell{width:108px;height:108px;border-radius:18px;background:#191820;border:1px solid #2e2a3b;display:grid;place-items:center}
.cell.hot{border-color:#a60ee5;background:#2b193a}
</style></head><body><div class="glow"></div>
<div class="left">
  <div class="brand">${glyph(vial, 44, '#c77afa')}<div>Burtson Icons<small>BURTSON LABS · OPEN SOURCE</small></div></div>
  <h1>One visual language.<br><span>Every surface.</span></h1>
  <p>${icons.length} stroke icons for agents, editors, security and infrastructure. React, SVG and CDN. Free under ISC.</p>
</div>
<div class="meta"><span class="pill accent">icons.burtson.ai</span><span class="pill">npm i @burtson-labs/icons</span></div>
<div class="grid">${featured
  .slice(0, 16)
  .map(
    (n, k) =>
      `<div class="cell${k === 5 ? ' hot' : ''}">${glyph(n, 48, k === 5 ? '#d9a8fa' : '#e4ddeb')}</div>`,
  )
  .join('')}</div>
</body></html>`;

const dir = mkdtempSync(join(tmpdir(), 'bl-og-'));
try {
  const page = join(dir, 'og.html');
  writeFileSync(page, html);
  const out = join(ROOT, 'site', 'og.png');
  const r = spawnSync(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--window-size=1200,630',
      `--screenshot=${out}`,
      `file://${page}`,
    ],
    { encoding: 'utf8', timeout: 60_000 },
  );
  if (r.status !== 0 || !existsSync(out)) {
    fail(`Chrome did not render the card: ${r.stderr || r.error?.message}`);
    process.exit(1);
  }
  // Apple touch icon: the vial on the brand dark, for home screens and the
  // site icon some unfurlers show beside the card.
  const touch = join(dir, 'touch.html');
  writeFileSync(
    touch,
    `<!doctype html><html><body style="margin:0;width:180px;height:180px;background:#101016;display:grid;place-items:center">${glyph(vial, 112, '#c77afa')}</body></html>`,
  );
  const touchOut = join(ROOT, 'site', 'apple-touch-icon.png');
  spawnSync(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--window-size=180,180',
      `--screenshot=${touchOut}`,
      `file://${touch}`,
    ],
    { timeout: 60_000 },
  );
  say(`site/og.png, site/apple-touch-icon.png (${icons.length} icons)`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

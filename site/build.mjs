#!/usr/bin/env node
// Builds icons.burtson.ai into site/dist: one self-contained page plus the raw
// assets, so the site doubles as the icon CDN (/svg/<name>.svg, /sprite.svg,
// /icons.json). Hosting lives in the private icons-site repo, which syncs this
// directory the same way bandit-docs syncs docs/site.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readCategories, toPascal, toSvgString } from '../scripts/lib.mjs';
import { loadIcons } from '../scripts/build.mjs';
import { say, fail } from '../scripts/log.mjs';

const OUT = join(ROOT, 'site', 'dist');
const SITE = 'https://icons.burtson.ai';

if (!existsSync(join(ROOT, 'dist', 'icons.json'))) {
  fail('run npm run build first');
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const icons = loadIcons();
const categories = readCategories();
const used = Object.fromEntries(Object.entries(categories).filter(([k]) => icons.some((i) => i.categories.includes(k))));
const data = {
  version: pkg.version,
  categories: used,
  icons: icons.map((i) => ({ n: i.name, p: toPascal(i.name), t: i.tags, c: i.categories, a: i.aliases, g: i.node })),
};
const logo = icons.find((i) => i.name === 'stealth-mask') ?? icons[0];
const favicon = `data:image/svg+xml,${encodeURIComponent(toSvgString(logo.node, { color: '#a60ee5' }))}`;
const json = JSON.stringify(data).replace(/</g, '\\u003c');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Burtson Icons</title>
<meta name="description" content="${icons.length} open-source stroke icons for AI agents, security, provenance, infrastructure and evidence work. ISC licensed, 24px grid, zero dependencies.">
<link rel="canonical" href="${SITE}/">
<meta property="og:title" content="Burtson Icons">
<meta property="og:description" content="Open-source stroke icons from Burtson Labs. ISC licensed.">
<meta property="og:url" content="${SITE}/">
<link rel="icon" href="${favicon}">
<style>
:root{--bg:#f6f5f9;--surface:#fff;--sunk:#eeecf3;--ink:#1a1621;--ink2:#3d3746;--muted:#6a6375;--line:#e2dee9;--line2:#cdc7d6;--accent:#a60ee5;--accent-soft:#f4e6fc;--accent-ink:#7a0aa9;--ok:#1d6f47;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#0f0e14;--surface:#17151d;--sunk:#1f1c27;--ink:#ece8f3;--ink2:#cdc7d8;--muted:#9a92a7;--line:#2a2633;--line2:#3a3546;--accent:#c46bf5;--accent-soft:#2a1938;--accent-ink:#dcaafb;--ok:#6fd3a0;color-scheme:dark}}
:root[data-theme=dark]{--bg:#0f0e14;--surface:#17151d;--sunk:#1f1c27;--ink:#ece8f3;--ink2:#cdc7d8;--muted:#9a92a7;--line:#2a2633;--line2:#3a3546;--accent:#c46bf5;--accent-soft:#2a1938;--accent-ink:#dcaafb;--ok:#6fd3a0;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--accent-ink)}
code,pre{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px}
button{font:inherit;color:inherit}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:6px}
.wrap{max-width:1200px;margin:0 auto;padding:0 16px}
header.top{border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(8px);position:sticky;top:0;z-index:5}
.bar{display:flex;align-items:center;gap:14px;height:60px}
.brand{display:flex;align-items:center;gap:10px;font-weight:750;letter-spacing:-.01em;white-space:nowrap}
.brand svg{color:var(--accent)}
.brand small{font-weight:500;color:var(--muted);font-size:12px;border:1px solid var(--line);border-radius:999px;padding:1px 8px}
.bar nav{margin-left:auto;display:flex;gap:4px;align-items:center}
.bar nav a{color:var(--muted);text-decoration:none;font-size:14px;padding:6px 10px;border-radius:8px}
.bar nav a:hover{color:var(--ink);background:var(--sunk)}
.iconbtn{border:1px solid var(--line);background:var(--surface);width:34px;height:34px;border-radius:8px;display:grid;place-items:center;cursor:pointer}
.hero{padding:44px 0 20px}
.hero h1{font-size:clamp(30px,5vw,48px);line-height:1.05;letter-spacing:-.03em;margin:0 0 12px;max-width:18ch}
.hero h1 em{font-style:normal;color:var(--accent)}
.hero p{color:var(--ink2);max-width:64ch;margin:0 0 18px;font-size:17px}
.install{display:flex;flex-wrap:wrap;gap:8px}
.install code{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:9px 14px;display:inline-flex;gap:10px;align-items:center}
.install button{border:0;background:none;cursor:pointer;color:var(--muted);padding:0}
.tools{position:sticky;top:60px;z-index:4;background:var(--bg);padding:14px 0 10px;display:grid;gap:10px;border-bottom:1px solid var(--line)}
.row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.search{flex:1 1 280px;display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:0 12px;height:42px}
.search input{border:0;background:none;outline:none;flex:1;font:inherit;color:var(--ink);min-width:0}
.ctl{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted);background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:0 12px;height:42px}
.ctl input[type=range]{width:90px;accent-color:var(--accent)}
.ctl input[type=color]{width:26px;height:26px;border:0;padding:0;background:none;cursor:pointer}
.ctl output{font-variant-numeric:tabular-nums;color:var(--ink);min-width:3ch}
.chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}
.chips::-webkit-scrollbar{display:none}
.chip{border:1px solid var(--line);background:var(--surface);border-radius:999px;padding:5px 12px;font-size:13px;cursor:pointer;white-space:nowrap;color:var(--ink2)}
.chip span{color:var(--muted);font-size:11px;margin-left:4px}
.chip[aria-pressed=true]{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.chip[aria-pressed=true] span{color:var(--bg);opacity:.7}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:10px;padding:18px 0 40px}
.cell{background:var(--surface);border:1px solid var(--line);border-radius:12px;aspect-ratio:1/1.02;display:grid;grid-template-rows:1fr auto;place-items:center;cursor:pointer;padding:10px 6px 8px;transition:border-color .12s,transform .12s}
.cell:hover{border-color:var(--accent);transform:translateY(-1px)}
.cell[aria-current=true]{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.cell .nm{font-size:11px;color:var(--muted);font-family:ui-monospace,Menlo,monospace;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.empty{color:var(--muted);padding:40px 0;text-align:center}
.panel{position:fixed;right:16px;bottom:16px;width:min(380px,calc(100vw - 32px));max-height:calc(100vh - 100px);overflow:auto;background:var(--surface);border:1px solid var(--line2);border-radius:16px;box-shadow:0 20px 50px rgba(0,0,0,.18);padding:18px;z-index:10;display:none}
.panel.open{display:block}
.panel header{display:flex;justify-content:space-between;align-items:start;gap:10px}
.panel h2{margin:0;font-size:18px;font-family:ui-monospace,Menlo,monospace}
.panel .big{display:grid;place-items:center;background:var(--sunk);border-radius:12px;height:170px;margin:14px 0;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:20px 20px;background-position:center}
.tags{display:flex;flex-wrap:wrap;gap:5px;margin:0 0 12px}
.tags span{font-size:12px;background:var(--sunk);border-radius:6px;padding:2px 8px;color:var(--ink2)}
.acts{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.acts button,.acts a{border:1px solid var(--line);background:var(--bg);border-radius:10px;padding:9px;font-size:13px;cursor:pointer;text-align:center;text-decoration:none;color:var(--ink)}
.acts button:hover,.acts a:hover{border-color:var(--accent)}
.snip{margin-top:12px;background:var(--sunk);border-radius:10px;padding:10px 12px;overflow-x:auto;white-space:pre;color:var(--ink2)}
.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:8px 14px;border-radius:999px;font-size:13px;opacity:0;transition:opacity .15s;pointer-events:none;z-index:20}
.toast.show{opacity:1}
section.doc{padding:40px 0;border-top:1px solid var(--line)}
section.doc h2{font-size:24px;letter-spacing:-.01em;margin:0 0 6px}
.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr));gap:14px;margin-top:16px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:16px}
.card h3{margin:0 0 8px;font-size:15px}
.card pre{margin:0;background:var(--sunk);border-radius:8px;padding:10px 12px;overflow-x:auto}
footer{border-top:1px solid var(--line);padding:24px 0 40px;color:var(--muted);font-size:13px;display:flex;flex-wrap:wrap;gap:8px 20px;justify-content:space-between}
@media (max-width:640px){.tools{top:60px}.ctl.hide-sm{display:none}}
</style>
</head>
<body>
<header class="top"><div class="wrap bar">
  <div class="brand">${toSvgString(logo.node, { size: 26 })}Burtson Icons <small>v${pkg.version}</small></div>
  <nav>
    <a href="#usage">Usage</a>
    <a href="https://github.com/Burtson-Labs/icons">GitHub</a>
    <a href="https://www.npmjs.com/package/@burtson-labs/icons">npm</a>
    <button class="iconbtn" id="theme" type="button" aria-label="Toggle theme">◐</button>
  </nav>
</div></header>
<main class="wrap">
  <section class="hero">
    <h1>Icons for the tools <em>we actually build.</em></h1>
    <p>${icons.length} open-source stroke icons for AI agents, security audits, provenance, infrastructure and evidence work, drawn on a 24px grid with a 2px stroke. ISC licensed, no runtime dependencies, and made to sit alongside any 24px stroke set.</p>
    <div class="install">
      <code><span>npm i @burtson-labs/icons</span><button type="button" data-copy="npm i @burtson-labs/icons" aria-label="Copy install command">copy</button></code>
    </div>
  </section>
  <div class="tools">
    <div class="row">
      <label class="search"><span aria-hidden="true">⌕</span><input id="q" type="search" placeholder="Search ${icons.length} icons by name or tag" autocomplete="off" spellcheck="false"></label>
      <label class="ctl">Size <input id="size" type="range" min="16" max="48" step="4" value="32"><output id="sizeV">32</output></label>
      <label class="ctl hide-sm">Stroke <input id="stroke" type="range" min="1" max="3" step="0.25" value="2"><output id="strokeV">2</output></label>
      <label class="ctl hide-sm">Colour <input id="color" type="color" value="#1a1621"></label>
    </div>
    <div class="chips" id="chips" role="toolbar" aria-label="Categories"></div>
  </div>
  <div class="grid" id="grid" aria-live="polite"></div>
  <p class="empty" id="empty" hidden>No icons match. Is one missing? <a href="https://github.com/Burtson-Labs/icons/issues/new?title=Icon%20request%3A%20">Request it</a>.</p>

  <section class="doc" id="usage">
    <h2>Usage</h2>
    <p style="color:var(--ink2);margin:0">Every icon uses <code>currentColor</code>, so it takes the text colour around it. Size and stroke width are props.</p>
    <div class="cols">
      <div class="card"><h3>React</h3><pre>import { ShieldProof } from '@burtson-labs/icons/react';

&lt;ShieldProof size={20} strokeWidth={1.75} /&gt;</pre></div>
      <div class="card"><h3>Plain JavaScript</h3><pre>import { toSvg } from '@burtson-labs/icons';

el.innerHTML = toSvg('merkle-tree', { size: 20 });</pre></div>
      <div class="card"><h3>Sprite</h3><pre>&lt;!-- serve node_modules/@burtson-labs/icons/dist/sprite.svg
     from your own origin; browsers block cross-origin &lt;use&gt; --&gt;
&lt;svg width="24" height="24"&gt;&lt;use href="/sprite.svg#gpu" /&gt;&lt;/svg&gt;</pre></div>
      <div class="card"><h3>Straight from this site</h3><pre>&lt;img src="${SITE}/svg/waveform.svg"
     width="24" height="24" alt="" /&gt;</pre></div>
    </div>
  </section>
</main>
<div class="wrap"><footer>
  <span>Burtson Icons ${pkg.version} · <a href="https://github.com/Burtson-Labs/icons/blob/main/LICENSE">ISC License</a> · <a href="${SITE}/icons.json">icons.json</a></span>
  <span>Made by <a href="https://burtson.ai">Burtson Labs</a></span>
</footer></div>
<aside class="panel" id="panel" aria-label="Icon details"></aside>
<div class="toast" id="toast" role="status"></div>
<script id="data" type="application/json">${json}</script>
<script>
(() => {
  const D = JSON.parse(document.getElementById('data').textContent);
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const state = { q: '', cat: 'all', size: 32, stroke: 2, color: null, open: null };
  const inner = (g) => g.map(([t, a]) => '<' + t + ' ' + Object.entries(a).map(([k, v]) => k + '="' + esc(v) + '"').join(' ') + ' />').join('');
  const svg = (i, size, stroke, color) => '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + (color || 'currentColor') + '" stroke-width="' + stroke + '" stroke-linecap="round" stroke-linejoin="round">' + inner(i.g) + '</svg>';
  const toast = (m) => { const t = $('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 1400); };
  const copy = async (text, what) => { try { await navigator.clipboard.writeText(text); toast('Copied ' + what); } catch { toast('Copy failed'); } };

  // theme
  const root = document.documentElement;
  try { const t = localStorage.getItem('bl-icons-theme'); if (t) root.dataset.theme = t; } catch {}
  const dark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  $('theme').onclick = () => { root.dataset.theme = dark() ? 'light' : 'dark'; try { localStorage.setItem('bl-icons-theme', root.dataset.theme); } catch {} ; syncColor(); render(); };
  const syncColor = () => { if (!state.color) $('color').value = dark() ? '#ece8f3' : '#1a1621'; };
  syncColor();

  // categories
  const counts = { all: D.icons.length };
  for (const i of D.icons) for (const c of i.c) counts[c] = (counts[c] || 0) + 1;
  $('chips').innerHTML = [['all', 'All']].concat(Object.entries(D.categories).map(([k, v]) => [k, v.title]))
    .map(([k, t]) => '<button class="chip" type="button" data-cat="' + k + '" aria-pressed="' + (k === 'all') + '">' + esc(t) + '<span>' + (counts[k] || 0) + '</span></button>').join('');
  $('chips').onclick = (e) => { const b = e.target.closest('.chip'); if (!b) return; state.cat = b.dataset.cat; for (const x of $('chips').children) x.setAttribute('aria-pressed', x === b); render(); };

  const match = (i) => {
    if (state.cat !== 'all' && !i.c.includes(state.cat)) return false;
    if (!state.q) return true;
    const q = state.q.toLowerCase().trim();
    return i.n.includes(q) || i.t.some((t) => t.includes(q)) || i.a.some((a) => a.includes(q));
  };
  function render() {
    const list = D.icons.filter(match);
    $('grid').innerHTML = list.map((i) => '<button class="cell" type="button" data-n="' + i.n + '" title="' + i.n + '"' + (state.open === i.n ? ' aria-current="true"' : '') + '>' + svg(i, state.size, state.stroke, state.color) + '<span class="nm">' + i.n + '</span></button>').join('');
    $('empty').hidden = list.length > 0;
  }
  $('grid').onclick = (e) => { const c = e.target.closest('.cell'); if (c) open(c.dataset.n); };

  function open(n) {
    const i = D.icons.find((x) => x.n === n);
    const p = $('panel');
    if (!i) { p.classList.remove('open'); state.open = null; return; }
    state.open = n;
    history.replaceState(null, '', '#' + n);
    const plain = svg(i, 24, 2);
    const jsx = '<' + i.p + ' />';
    p.innerHTML = '<header><div><h2>' + i.n + '</h2><div style="color:var(--muted);font-size:13px">' + i.c.map((c) => esc(D.categories[c]?.title || c)).join(' · ') + '</div></div><button class="iconbtn" type="button" id="x" aria-label="Close">×</button></header>' +
      '<div class="big" style="color:' + (state.color || 'var(--ink)') + '">' + svg(i, 96, state.stroke, state.color) + '</div>' +
      '<div class="tags">' + i.t.map((t) => '<span>' + esc(t) + '</span>').join('') + '</div>' +
      '<div class="acts"><button type="button" data-c="svg">Copy SVG</button><button type="button" data-c="jsx">Copy JSX</button><button type="button" data-c="import">Copy import</button><a href="svg/' + i.n + '.svg" download>Download SVG</a></div>' +
      '<div class="snip">import { ' + i.p + " } from '@burtson-labs/icons/react';</div>";
    p.classList.add('open');
    $('x').onclick = () => { p.classList.remove('open'); state.open = null; history.replaceState(null, '', location.pathname); render(); };
    p.querySelector('.acts').onclick = (e) => {
      const k = e.target.dataset && e.target.dataset.c; if (!k) return;
      if (k === 'svg') copy(plain, 'SVG');
      if (k === 'jsx') copy(jsx, 'JSX');
      if (k === 'import') copy("import { " + i.p + " } from '@burtson-labs/icons/react';", 'import');
    };
    render();
  }

  $('q').oninput = (e) => { state.q = e.target.value; render(); };
  $('size').oninput = (e) => { state.size = +e.target.value; $('sizeV').textContent = state.size; render(); };
  $('stroke').oninput = (e) => { state.stroke = +e.target.value; $('strokeV').textContent = state.stroke; render(); if (state.open) open(state.open); };
  $('color').oninput = (e) => { state.color = e.target.value; render(); if (state.open) open(state.open); };
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-copy]'); if (b) copy(b.dataset.copy, 'install command'); });
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== $('q')) { e.preventDefault(); $('q').focus(); }
    if (e.key === 'Escape' && state.open) $('x').click();
  });
  render();
  if (location.hash.length > 1) open(decodeURIComponent(location.hash.slice(1)));
})();
</script>
</body>
</html>
`;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'index.html'), html);
cpSync(join(ROOT, 'dist', 'svg'), join(OUT, 'svg'), { recursive: true });
cpSync(join(ROOT, 'dist', 'sprite.svg'), join(OUT, 'sprite.svg'));
cpSync(join(ROOT, 'dist', 'icons.json'), join(OUT, 'icons.json'));
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE}/</loc></url></urlset>\n`);
say(`site → site/dist (${icons.length} icons, ${(html.length / 1024).toFixed(1)} KB page)`);

#!/usr/bin/env node
// Builds icons.burtson.ai into site/dist: the gallery page (collections, grid,
// inspector) plus the raw assets, so the site doubles as the icon CDN. Hosting
// lives in the private icons-site repo, which syncs this directory.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
const titles = Object.fromEntries(
  Object.entries(categories)
    .filter(([k]) => icons.some((i) => i.categories.includes(k)))
    .map(([k, v]) => [k, v.title]),
);
const data = {
  version: pkg.version,
  titles,
  icons: icons.map((i) => ({
    n: i.name,
    p: toPascal(i.name),
    t: i.tags,
    c: i.categories,
    a: i.aliases,
    g: i.node,
  })),
};
const json = JSON.stringify(data).replace(/</g, '\\u003c');
const logo =
  icons.find((i) => i.name === 'burtson-labs-vial') ??
  icons.find((i) => i.name === 'stealth-mask') ??
  icons[0];
const favicon = `data:image/svg+xml,${encodeURIComponent(toSvgString(logo.node, { color: '#a60ee5' }))}`;
const css = readFileSync(join(ROOT, 'site', 'gallery.css'), 'utf8');
const n = icons.length;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Burtson Icons</title>
<meta name="description" content="${n} open-source stroke icons for AI agents, editors, security, infrastructure and the products around them. React, SVG and CDN. Free under ISC.">
<meta name="theme-color" content="#101016">
<link rel="canonical" href="${SITE}/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Burtson Labs">
<meta property="og:title" content="Burtson Icons: ${n} open-source icons">
<meta property="og:description" content="One visual language for every surface. Icons for agents, editors, security and infrastructure. Search, tweak and copy React or SVG in one click.">
<meta property="og:url" content="${SITE}/">
<meta property="og:image" content="${SITE}/og.png?v=${pkg.version}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Burtson Icons: ${n} stroke icons for agents, editors, security and infrastructure">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Burtson Icons: ${n} open-source icons">
<meta name="twitter:description" content="Icons for agents, editors, security and infrastructure. React, SVG and CDN. Free under ISC.">
<meta name="twitter:image" content="${SITE}/og.png?v=${pkg.version}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" href="${favicon}">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<script>try{const t=localStorage.getItem('bl-icons-theme');if(t)document.documentElement.dataset.theme=t}catch{}</script>
<style>${css}</style>
</head>
<body>
<header><div class="brand">${toSvgString(logo.node, { extra: ' aria-hidden="true"' })}<div>Burtson Icons<small>BURTSON LABS / OPEN ICON SYSTEM</small></div></div>
<div class="topright"><nav class="links"><a href="#usage">Usage</a><a href="https://github.com/Burtson-Labs/icons">GitHub</a><a href="https://www.npmjs.com/package/@burtson-labs/icons">npm</a></nav><span class="tag">v${pkg.version}</span><button id="theme" type="button" aria-label="Switch light and dark theme">Theme</button></div></header>
<div class="shell"><aside class="nav"><h2>COLLECTIONS</h2><div class="cats" id="cats"></div><div class="navnote"><strong>Familiar by design.</strong><br>24px canvas. Round joins.<br>Current-colour strokes.<br><br>Press <kbd>/</kbd> to search.</div></aside>
<main><section class="hero"><div class="eyebrow">Built for the things you build</div><h1>One visual language.<br><span>Every surface.</span></h1><p>Open-source icons for agents, editors, security, infrastructure and the products around them. The same source geometry ships as React components, SVG files and a CDN.</p><div class="metrics"><div><b>${n}</b><small>Icons</small></div><div><b>${Object.keys(titles).length}</b><small>Collections</small></div><div><b>24 / 2</b><small>Grid / stroke</small></div></div></section>
<div class="controls"><label class="search"><span aria-hidden="true">&#8981;</span><input id="search" type="search" placeholder="Search icons, workflows, tags..." aria-label="Search icons" autocomplete="off" spellcheck="false"><kbd>/</kbd></label><label class="knob">Size<input id="size" type="range" min="16" max="48" value="28" step="4"><output id="sizeout">28</output></label><label class="knob">Stroke<input id="weight" type="range" min="1" max="3" value="2" step=".25"><output id="weightout">2</output></label></div>
<div class="section-head"><h2 id="category-title">All icons</h2><span id="result-count">${n} icons</span></div><div class="grid" id="grid"></div><div class="empty" id="empty">No icons match. <a href="https://github.com/Burtson-Labs/icons/issues/new?title=Icon%20request%3A%20">Request one</a>.</div>
<section class="usage" id="usage"><div class="section-head"><h2>Usage</h2></div><pre>npm i @burtson-labs/icons

// React: one import per icon keeps bundles small
import { AgentLoop } from '@burtson-labs/icons/react/agent-loop';
&lt;AgentLoop size={20} strokeWidth={1.75} aria-label="agent loop" /&gt;

// Plain JavaScript
import { toSvg } from '@burtson-labs/icons';
el.innerHTML = toSvg('merkle-tree', { size: 20 });

// Straight from this site (explicit colours: svg-accent, svg-white, svg-black)
&lt;img src="${SITE}/svg-accent/gpu.svg" width="24" height="24" alt="GPU"&gt;</pre></section>
<div class="foot">Burtson Icons ${pkg.version} · <a href="https://github.com/Burtson-Labs/icons/blob/main/LICENSE">ISC License</a> · <a href="${SITE}/icons.json">icons.json</a> · Made by <a href="https://burtson.ai">Burtson Labs</a></div></main>
<aside class="inspector" aria-label="Selected icon"><div class="eyebrow">Icon inspector</div><h2 class="mono" id="selected-name"></h2><div class="sub" id="selected-status"></div><div class="preview" id="selected-preview"></div><div class="sizes" id="sizes"></div><div class="tabs" role="tablist" aria-label="Code format"><button type="button" data-tab="react" role="tab" aria-selected="true">React</button><button type="button" data-tab="svg" role="tab" aria-selected="false">SVG</button><button type="button" data-tab="cdn" role="tab" aria-selected="false">CDN</button></div><pre id="code" aria-label="Usage code"></pre><div class="actions"><button type="button" class="primary" id="copy">Copy code</button><button type="button" id="download">Download SVG</button></div><div id="tags" class="chips"></div><div class="notice">For an external <code>&lt;img&gt;</code>, use an explicit-colour variant (<code>svg-accent</code>, <code>svg-white</code>, <code>svg-black</code>). Inline SVG, React and CSS masks inherit the text colour.</div></aside></div><div id="toast" class="toast" role="status"></div>
<script id="data" type="application/json">${json}</script>
<script>
(() => {
  const D = JSON.parse(document.getElementById('data').textContent);
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  let selected = D.icons.find((i) => i.n === 'stealth-mask') || D.icons[0];
  let category = 'all';
  let tab = 'react';
  const svg = (i, size = 24) => '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + $('weight').value + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + i.g.map(([t, a]) => '<' + t + ' ' + Object.entries(a).map(([k, v]) => k + '="' + esc(v) + '"').join(' ') + ' />').join('') + '</svg>';
  const label = (i) => i.n.replace(/-/g, ' ');
  function code() {
    const i = selected;
    if (tab === 'react') return "import { " + i.p + " } from\\n  '@burtson-labs/icons/react/" + i.n + "';\\n\\n<" + i.p + "\\n  size={24}\\n  strokeWidth={" + $('weight').value + "}\\n  aria-label=\\"" + label(i) + "\\"\\n/>";
    if (tab === 'svg') return svg(i).replace(' aria-hidden="true"', '').replace(/></g, '>\\n<');
    return '<img\\n  src="${SITE}/svg-accent/' + i.n + '.svg"\\n  width="24" height="24"\\n  alt="' + label(i) + '"\\n/>\\n\\n<!-- or pinned to this release -->\\nhttps://cdn.jsdelivr.net/npm/@burtson-labs/icons@' + D.version + '/dist/svg/' + i.n + '.svg';
  }
  function inspect(i, push = true) {
    selected = i;
    $('selected-name').textContent = i.n;
    $('selected-status').textContent = i.c.map((c) => D.titles[c] || c).join(' / ');
    $('selected-preview').innerHTML = svg(i, 96);
    $('sizes').innerHTML = [16, 24, 32].map((s) => '<div>' + svg(i, s) + '<small>' + s + 'px</small></div>').join('');
    $('code').textContent = code();
    $('tags').replaceChildren(...i.t.map((t) => { const e = document.createElement('span'); e.textContent = t; return e; }));
    document.querySelectorAll('.tile').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.name === i.n)));
    if (push) history.replaceState(null, '', '#' + i.n);
  }
  function render() {
    const q = $('search').value.trim().toLowerCase();
    const list = D.icons.filter((i) => (category === 'all' || i.c.includes(category)) && (!q || [i.n, ...i.t, ...i.a].join(' ').includes(q)));
    $('grid').replaceChildren(...list.map((i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tile'; b.dataset.name = i.n;
      b.setAttribute('aria-label', i.n); b.setAttribute('aria-pressed', String(i.n === selected.n));
      b.innerHTML = svg(i) + '<span class="name">' + i.n + '</span>';
      b.onclick = () => inspect(i);
      return b;
    }));
    $('result-count').textContent = list.length + ' icons';
    $('empty').style.display = list.length ? 'none' : 'block';
    $('category-title').textContent = category === 'all' ? 'All icons' : D.titles[category];
    document.querySelectorAll('.cats button').forEach((b) => { b.classList.toggle('active', b.dataset.category === category); b.setAttribute('aria-pressed', String(b.dataset.category === category)); });
  }
  for (const [id, title] of [['all', 'All icons'], ...Object.entries(D.titles)]) {
    const count = D.icons.filter((i) => id === 'all' || i.c.includes(id)).length;
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.category = id;
    b.innerHTML = '<span>' + esc(title) + '</span><b>' + count + '</b>';
    b.onclick = () => { category = id; render(); };
    $('cats').appendChild(b);
  }
  const dark = () => root.dataset.theme ? root.dataset.theme === 'dark' : !matchMedia('(prefers-color-scheme: light)').matches;
  const paintTheme = () => { $('theme').textContent = dark() ? 'Light mode' : 'Dark mode'; };
  $('theme').onclick = () => { root.dataset.theme = dark() ? 'light' : 'dark'; try { localStorage.setItem('bl-icons-theme', root.dataset.theme); } catch {} paintTheme(); };
  paintTheme();
  $('search').oninput = render;
  $('size').oninput = () => { root.style.setProperty('--size', $('size').value + 'px'); $('sizeout').textContent = $('size').value; };
  $('weight').oninput = () => { root.style.setProperty('--weight', $('weight').value); $('weightout').textContent = $('weight').value; render(); inspect(selected, false); };
  document.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; document.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b))); $('code').textContent = code(); });
  let timer;
  const toast = (t) => { $('toast').textContent = t; $('toast').style.display = 'block'; clearTimeout(timer); timer = setTimeout(() => $('toast').style.display = 'none', 1800); };
  $('copy').onclick = async () => { try { await navigator.clipboard.writeText(code()); toast('Code copied'); } catch { toast('Select and copy the code above'); } };
  $('download').onclick = () => { const a = document.createElement('a'); a.href = 'svg/' + selected.n + '.svg'; a.download = selected.n + '.svg'; a.click(); };
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) { e.preventDefault(); $('search').focus(); }
    if (e.key === 'Escape') { $('search').value = ''; $('search').blur(); render(); }
  });
  const fromHash = D.icons.find((i) => i.n === decodeURIComponent(location.hash.slice(1)));
  if (fromHash) selected = fromHash;
  render();
  inspect(selected, Boolean(fromHash));
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
for (const f of ['og.png', 'apple-touch-icon.png']) {
  if (!existsSync(join(ROOT, 'site', f))) {
    fail(`site/${f} is missing; run npm run og`);
    process.exit(1);
  }
  cpSync(join(ROOT, 'site', f), join(OUT, f));
}
writeFileSync(join(OUT, 'favicon.svg'), toSvgString(logo.node, { color: '#a60ee5' }) + '\n');
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
writeFileSync(
  join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE}/</loc></url></urlset>\n`,
);
say(`site → site/dist (${n} icons, ${(html.length / 1024).toFixed(1)} KB page)`);

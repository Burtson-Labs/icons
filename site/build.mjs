#!/usr/bin/env node
// Builds icons.burtson.ai into site/dist: the gallery page (collections, grid,
// inspector) plus the raw assets, so the site doubles as the icon CDN. Hosting
// lives in the private icons-site repo, which syncs this directory.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readCategories, toPascal, toSvgString } from '../scripts/lib.mjs';
import { loadIcons } from '../scripts/build.mjs';
import { BRAND_GROUPS, loadBrands } from '../scripts/brands.mjs';
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
  // Third-party logos: a separate collection, filled, never mixed into "All icons".
  brands: loadBrands().map((b) => ({
    n: b.name,
    p: toPascal(b.name) + 'Logo',
    ti: b.title,
    h: b.hex,
    d: b.path,
    gr: BRAND_GROUPS[b.group].title,
  })),
};
const json = JSON.stringify(data).replace(/</g, '\\u003c');
const logo =
  icons.find((i) => i.name === 'burtson-labs-vial') ??
  icons.find((i) => i.name === 'stealth-mask') ??
  icons[0];
const glyph = (name, cls) =>
  toSvgString(icons.find((i) => i.name === name).node, {
    size: 16,
    extra: ` aria-hidden="true" class="${cls}"`,
  });
const copyGlyphs = glyph('copy', 'i-copy') + glyph('check', 'i-check');
const escHtml = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** A labelled code block with an inline copy button; gallery.js adds the colouring. */
const codeBlock = (title, lang, text) =>
  `<figure class="code-block"><figcaption>${title}</figcaption><div class="code-frame">` +
  `<button type="button" class="copy-code" aria-label="Copy ${title.toLowerCase()} code">${copyGlyphs}</button>` +
  `<pre tabindex="0"><code data-lang="${lang}">${escHtml(text)}</code></pre></div></figure>`;
const usage = [
  codeBlock('Install', 'sh', 'npm install @burtson-labs/icons'),
  codeBlock(
    'React',
    'tsx',
    `// One import per icon keeps bundles small
import { AgentLoop } from '@burtson-labs/icons/react/agent-loop';

<AgentLoop size={20} strokeWidth={1.75} aria-label="Agent loop" />`,
  ),
  codeBlock(
    'JavaScript',
    'js',
    `import { toSvg } from '@burtson-labs/icons';

el.innerHTML = toSvg('merkle-tree', { size: 20 });`,
  ),
  codeBlock(
    'CDN',
    'html',
    `<!-- Explicit colours: svg-accent, svg-white, svg-black -->
<img src="${SITE}/svg-accent/gpu.svg" width="24" height="24" alt="GPU" />`,
  ),
].join('');
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
<meta name="theme-color" content="#09090b" media="(prefers-color-scheme: dark)"><meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<link rel="canonical" href="${SITE}/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Burtson Icons">
<meta property="og:title" content="Burtson Icons: ${n} open-source icons">
<meta property="og:description" content="${n} stroke icons for agents, editors, security and infrastructure, plus brand logos. React, SVG and CDN. ISC license.">
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
<script>try{const q=new URLSearchParams(location.search),d=document.documentElement,t=q.get('theme')||localStorage.getItem('bl-icons-theme'),a=q.get('accent')||localStorage.getItem('bl-icons-accent');if(t)d.dataset.theme=t;if(a)d.dataset.accent=a}catch{}</script>
<style>${css}</style>
</head>
<body>
<a class="skip-link" href="#main">Skip to icons</a>
<header><div class="brand">${toSvgString(logo.node, { extra: ' aria-hidden="true"' })}<div>Burtson Icons<small>@burtson-labs/icons · ISC</small></div></div>
<div class="topright"><nav class="links" aria-label="Resources"><a href="https://ui.burtson.ai">UI components</a><a href="#usage">Usage</a><a href="https://github.com/Burtson-Labs/icons">GitHub</a><a href="https://www.npmjs.com/package/@burtson-labs/icons">npm</a></nav><span class="tag">v${pkg.version}</span><div class="accents" role="radiogroup" aria-label="Accent colour">${[
  ['ink', 'Ink', '#18181b'],
  ['violet', 'Violet (Burtson)', '#a60ee5'],
  ['blue', 'Blue', '#2563eb'],
  ['teal', 'Teal', '#0d9488'],
  ['orange', 'Orange', '#ea580c'],
]
  .map(
    ([id, label, c]) =>
      `<button type="button" role="radio" data-accent="${id}" aria-label="${label}" title="${label}" aria-checked="false" style="background:${c}"></button>`,
  )
  .join(
    '',
  )}</div><button id="theme" type="button" aria-label="Switch light and dark theme">Theme</button></div></header>
<div class="shell"><aside class="nav"><h2>COLLECTIONS</h2><div class="cats" id="cats"></div><div class="navnote">24px canvas, 2px stroke, round joins, current-colour strokes.<br><br>Press <kbd>/</kbd> to search.</div></aside>
<main id="main" tabindex="-1"><section class="hero"><h1>Burtson Icons</h1><p>Stroke icons drawn for the tools we build: agents, editors, security, infrastructure and evidence work, plus brand logos. Search, set the size and stroke, then copy React or SVG, or link the CDN file. All three come from the same source.</p><div class="metrics"><div><b>${n}</b><small>Icons</small></div><div><b>${Object.keys(titles).length}</b><small>Collections</small></div><div><b>24 / 2</b><small>Grid / stroke</small></div></div></section>
<div class="controls"><label class="search"><span aria-hidden="true">&#8981;</span><input id="search" type="search" placeholder="Search icons, workflows, tags..." aria-label="Search icons" autocomplete="off" spellcheck="false"><kbd>/</kbd></label><label class="knob">Size<input id="size" type="range" min="16" max="48" value="28" step="4"><output id="sizeout">28</output></label><label class="knob">Stroke<input id="weight" type="range" min="1" max="3" value="2" step=".25"><output id="weightout">2</output></label></div>
<div class="filter-row"><label class="collection-select">Collection<select id="collection" aria-label="Collection"></select></label><button type="button" id="saved-only" aria-pressed="false">Saved icons <span id="saved-count">0</span></button><button type="button" id="reset">Reset filters</button></div><div class="section-head"><h2 id="category-title">All icons</h2><span id="result-count" role="status" aria-live="polite" aria-atomic="true">${n} icons</span></div><div class="grid" id="grid" role="group" aria-label="Icon results"></div><div class="empty" id="empty"><h3>No matching icons</h3><p>Try a shorter search, another collection, or reset the filters.</p><button type="button" id="empty-reset">Show all icons</button> <a href="https://github.com/Burtson-Labs/icons/issues/new?title=Icon%20request%3A%20">Request one</a>.</div>
<section class="usage" id="usage"><div class="section-head"><h2>Usage</h2></div><div class="usage-grid">${usage}</div></section>
<div class="foot">Burtson Icons ${pkg.version} · <a href="https://github.com/Burtson-Labs/icons/blob/main/LICENSE">ISC License</a> · <a href="${SITE}/icons.json">icons.json</a> · Brand logos are trademarks of their owners (<a href="https://github.com/Burtson-Labs/icons/blob/main/TRADEMARKS.md">notice</a>) · Made by <a href="https://burtson.ai">Burtson Labs</a></div></main>
<aside class="inspector" id="inspector" aria-label="Selected icon"><button type="button" id="close-inspector" class="mobile-close" aria-label="Close icon inspector">Close ×</button><div class="eyebrow">Icon inspector</div><h2 class="mono" id="selected-name"></h2><div class="sub" id="selected-status"></div><div class="preview" id="selected-preview"></div><div class="sizes" id="sizes"></div><div class="inspector-tools"><button type="button" id="save" aria-pressed="false">Save icon</button><button type="button" id="share">Copy link</button></div><label class="decorative"><input id="decorative" type="checkbox" checked> Decorative icon <span title="Turn off for an icon that conveys meaning without nearby text.">ⓘ</span></label><div class="tabs" role="tablist" aria-label="Code format"><button type="button" data-tab="react" role="tab" aria-selected="true">React</button><button type="button" data-tab="svg" role="tab" aria-selected="false">SVG</button><button type="button" data-tab="cdn" role="tab" aria-selected="false">CDN</button></div><div class="code-frame"><button type="button" class="copy-code" id="copy-inline" aria-label="Copy code">${copyGlyphs}</button><pre id="code" role="tabpanel" tabindex="0" aria-label="Usage code"></pre></div><div class="actions"><button type="button" class="primary" id="copy">Copy code</button><button type="button" id="download">Download SVG</button></div><p class="export-note" id="export-note"></p><div id="tags" class="chips"></div><div class="notice">For an external <code>&lt;img&gt;</code>, use an explicit-colour variant (<code>svg-accent</code>, <code>svg-white</code>, <code>svg-black</code>). Inline SVG, React and CSS masks inherit the text colour.</div></aside></div><div id="toast" class="toast" role="status"></div>
<dialog id="mobile-inspector" aria-labelledby="selected-name"></dialog><noscript><p class="empty-static">Enable JavaScript to search the catalog. SVG files and icons.json remain available directly.</p></noscript>
<script id="data" type="application/json">${json}</script>
<script>${readFileSync(join(ROOT, 'site', 'gallery.js'), 'utf8')}</script>
</body>
</html>
`;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'index.html'), html);
cpSync(join(ROOT, 'dist', 'svg'), join(OUT, 'svg'), { recursive: true });
cpSync(join(ROOT, 'dist', 'sprite.svg'), join(OUT, 'sprite.svg'));
cpSync(join(ROOT, 'dist', 'icons.json'), join(OUT, 'icons.json'));
for (const d of ['svg', 'svg-color'])
  cpSync(join(ROOT, 'dist', 'brands', d), join(OUT, 'brands', d), { recursive: true });
cpSync(join(ROOT, 'dist', 'brands', 'brands.json'), join(OUT, 'brands', 'brands.json'));
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

// Docs for AI agents and LLM tools, written next to the gallery by build.mjs:
//
//   /llms.txt          index (https://llmstxt.org): install, entry points, links
//   /llms-full.txt     every icon with tags, categories, aliases and imports, plus the design rules
//   /agents/           the "Use with AI agents" page: rules to paste, the skill, prompts
//
// Everything comes from the icon metadata and skills/burtson-icons/SKILL.md, so
// a new icon shows up here on the next build with nothing written by hand.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { ROOT, toPascal } from '../scripts/lib.mjs';

const SITE = 'https://icons.burtson.ai';
const UI = 'https://ui.burtson.ai';

export const skill = () => readFileSync(join(ROOT, 'skills', 'burtson-icons', 'SKILL.md'), 'utf8');

/** The block people paste into CLAUDE.md, AGENTS.md or .cursorrules. */
export const projectRules = `## Icons: Burtson Icons

This app uses Burtson Icons (\`@burtson-labs/icons\`).

- Find icons by meaning in ${SITE}/llms-full.txt (every icon with its tags and aliases). Confirm a name exists before importing it.
- React: one import per icon, \`import { ShieldProof } from '@burtson-labs/icons/react/shield-proof'\`. MUI: \`@burtson-labs/icons/mui/<name>\`.
- Use no other icon library (no lucide-react, heroicons, react-icons, Material icons) and do not paste SVG paths from other sets.
- Colour comes from the text colour (\`className="text-muted-foreground"\`), not a hex value.
- Icons next to a text label stay decorative (the default, \`aria-hidden\`). An icon that carries meaning alone needs \`title\` (React), \`titleAccess\` (MUI) or a label on its button.
- In an \`<img>\`, use an explicit-colour file: ${SITE}/svg-accent/<name>.svg, /svg-white/ or /svg-black/.
- If nothing fits, use the closest icon and say so; request new ones at https://github.com/Burtson-Labs/icons/issues.
`;

export const skillCommands = `# Burtson Icons skill
npx skills add burtson-labs/icons

# one agent only, without prompts
npx skills add burtson-labs/icons -a claude-code -y

# Burtson UI components (uses these icons)
npx skills add burtson-labs/ui`;

export const prompts = [
  [
    'Replace another icon set',
    'Replace every lucide-react icon in src/ with the closest Burtson Icon. Look names up by tag and alias in https://icons.burtson.ai/llms-full.txt, import each from @burtson-labs/icons/react/<name>, remove lucide-react from package.json, and list any icon you could not match.',
  ],
  [
    'Pick icons for a feature',
    'Suggest Burtson Icons for an agent run timeline: queued, running, waiting for approval, approved, failed, cancelled. Use https://icons.burtson.ai/llms-full.txt, give the import line for each, and keep them decorative next to the status text.',
  ],
  [
    'Use the CDN in an email or plain page',
    'Add a GPU and a shield icon to this static HTML page from https://icons.burtson.ai using <img> tags with the svg-accent variants, 20px, with alt text that says what each one means.',
  ],
];

/** Design rules, kept short for agents; the full spec is design/DESIGN.md. */
const designRules = `- 24×24 grid, \`viewBox="0 0 24 24"\`; geometry stays inside a 1px margin.
- 2px stroke, round caps and joins, \`fill="none"\`, \`stroke="currentColor"\`; children never override them.
- Only \`path\`, \`circle\`, \`ellipse\`, \`rect\`, \`line\`, \`polyline\`, \`polygon\`; no transforms, groups, masks, text or fills. Usually 2 to 5 elements, at most 8.
- One idea per icon. A modifier (check, x, lock, clock, plus, slash) sits bottom right at about 7px and the base shape is clipped around it.
- Shared vocabulary: a shield means security, a seal a signed or verified record, a spark AI, a chip a model or compute, a hexagon a cluster or node. No robots for agents or brains for memory.
- Names are kebab-case, noun first, modifier last (\`file-plus\`, \`shield-off\`); other conventions resolve through aliases (\`circle-x\`).
- Every drawing is original; CI compares geometry against Lucide and fails near-copies.`;

const usage = (
  pkg,
) => `- Install: \`npm install @burtson-labs/icons\` (v${pkg.version}, ISC, no runtime dependencies; React and MUI are optional peers).
- React: \`import { ShieldProof } from '@burtson-labs/icons/react/shield-proof'\` (named or default export). Props: \`size\` (24), \`strokeWidth\` (2), \`absoluteStrokeWidth\`, \`title\`, \`className\`, any SVG prop. Without \`title\` the icon is \`aria-hidden\`.
- MUI: \`import { ShieldProof } from '@burtson-labs/icons/mui/shield-proof'\`; \`fontSize\`, \`color\`, \`sx\`, \`titleAccess\` work as with @mui/icons-material.
- JavaScript: \`import { toSvg } from '@burtson-labs/icons'; el.innerHTML = toSvg('shield-proof', { size: 20 });\`
- SVG files: \`@burtson-labs/icons/svg/<name>.svg\` or ${SITE}/svg/<name>.svg (\`currentColor\`). For \`<img>\`: ${SITE}/svg-accent/<name>.svg, /svg-white/, /svg-black/.
- Sprite: \`@burtson-labs/icons/sprite.svg\` served from your own origin, \`<svg><use href="/sprite.svg#<name>" /></svg>\` (cross-origin \`<use>\` is blocked).
- Data: ${SITE}/icons.json or \`@burtson-labs/icons/icons.json\` (names, tags, categories, aliases, geometry).
- Brand logos: \`import { GithubLogo } from '@burtson-labs/icons/brands/react/github'\`; \`colored\` uses the brand colour. They are trademarks of their owners.`;

export function llmsTxt({ pkg, icons, titles }) {
  const counts = Object.entries(titles)
    .map(([k, t]) => `${t} ${icons.filter((i) => i.categories[0] === k).length}`)
    .join(', ');
  return `# Burtson Icons

> Burtson Icons (\`@burtson-labs/icons\`) is an open-source set of ${icons.length} stroke icons for AI agents, editors, security, provenance, infrastructure and evidence work, plus third-party brand logos. 24px grid, 2px stroke, \`currentColor\`. React, MUI, plain JavaScript, SVG files, a sprite and a CDN. ISC license.

${usage(pkg)}

Collections (primary category): ${counts}.

## Docs

- [All icons with tags, aliases and imports](${SITE}/llms-full.txt): search this to find an icon by meaning
- [Use with AI agents](${SITE}/agents/): rules to paste into CLAUDE.md or AGENTS.md, the Agent Skill, example prompts
- [icons.json](${SITE}/icons.json): every icon as data, with geometry
- [Gallery](${SITE}/): search, preview and copy code
- [Design spec](https://github.com/Burtson-Labs/icons/blob/main/design/DESIGN.md)

## Optional

- [Agent Skill](https://github.com/Burtson-Labs/icons/blob/main/skills/burtson-icons/SKILL.md): \`npx skills add burtson-labs/icons\`
- [Burtson UI for agents](${UI}/llms.txt): React components that use these icons
- [Brand logos](${SITE}/brands/brands.json)
- [Source on GitHub](https://github.com/Burtson-Labs/icons)
`;
}

export function llmsFull({ pkg, icons, titles, brands }) {
  const byCategory = Object.keys(titles).map((k) => {
    const list = icons.filter((i) => i.categories[0] === k);
    return `## ${titles[k]} (${list.length})

${list
  .map(
    (i) =>
      `### ${i.name}\n` +
      `- React: \`import { ${toPascal(i.name)} } from '@burtson-labs/icons/react/${i.name}'\`\n` +
      `- MUI: \`import { ${toPascal(i.name)} } from '@burtson-labs/icons/mui/${i.name}'\`\n` +
      `- Tags: ${i.tags.join(', ')}\n` +
      `- Categories: ${i.categories.map((c) => titles[c] ?? c).join(', ')}\n` +
      (i.aliases.length ? `- Aliases: ${i.aliases.join(', ')}\n` : ''),
  )
  .join('\n')}`;
  });
  return `# Burtson Icons: every icon

> ${icons.length} stroke icons from \`@burtson-labs/icons\` v${pkg.version}, grouped by primary category. Search tags and aliases to find an icon by meaning; the heading is the name used in every import path and file URL. Index: ${SITE}/llms.txt.

## Usage

${usage(pkg)}

File URLs for any icon \`<name>\`: ${SITE}/svg/<name>.svg, ${SITE}/svg-accent/<name>.svg, ${SITE}/svg-white/<name>.svg, ${SITE}/svg-black/<name>.svg; sprite symbol id \`<name>\`.

## Design rules

${designRules}

${byCategory.join('\n\n')}

## Brand logos (${brands.length})

Filled third-party logos in their own entry; trademarks of their owners. React: \`@burtson-labs/icons/brands/react/<name>\` exports \`<Name>Logo\` (\`colored\` for the brand colour). Files: ${SITE}/brands/svg/<name>.svg and /brands/svg-color/<name>.svg.

${brands.map((b) => `- ${b.n} (${b.ti}, ${b.gr}): \`import { ${b.p} } from '@burtson-labs/icons/brands/react/${b.n}'\``).join('\n')}
`;
}

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Copy buttons on this page only; the gallery's script expects the gallery.
const copyScript =
  "for(const b of document.querySelectorAll('.copy-code'))b.onclick=async()=>{const l=b.getAttribute('aria-label');try{await navigator.clipboard.writeText(b.parentElement.querySelector('pre').textContent);b.classList.add('copied');b.setAttribute('aria-label','Copied');setTimeout(()=>{b.classList.remove('copied');b.setAttribute('aria-label',l)},1400)}catch{b.parentElement.querySelector('pre').focus()}}";

const pageCss = `
/* The gallery locks the document on desktop and scrolls its columns; this page scrolls normally. */
html,body{height:auto;overflow:visible}
body{display:block}
.doc{max-width:780px;margin:0 auto;padding:32px 20px 64px;line-height:1.65}
.doc h1{font-size:clamp(30px,4vw,42px);letter-spacing:-1.2px;line-height:1.1;margin:8px 0 12px}
.doc h2{font-size:20px;letter-spacing:-0.3px;margin:44px 0 10px}
.doc p,.doc li{color:var(--muted)}
.doc p code,.doc li code,.doc td code{color:var(--text)}
.doc a{color:var(--text);text-decoration:underline;text-underline-offset:3px}
.doc .lead{font-size:17px;margin:0 0 20px}
.doc .code-block{margin:12px 0 18px}
.doc .wrap pre{white-space:pre-wrap;overflow-wrap:anywhere}
.doc table{width:100%;border-collapse:collapse;font-size:13.5px;border:1px solid var(--line);border-radius:10px;overflow:hidden;display:block;overflow-x:auto}
.doc th,.doc td{text-align:left;padding:10px 12px;border-top:1px solid var(--line);vertical-align:top}
.doc thead th{border-top:0;background:var(--card)}
.doc .copy-code{width:44px;height:44px;top:4px;right:4px}
.doc .code-frame pre{padding-right:56px}
`;

/** The /agents/ page. `chrome` carries the gallery's header pieces so both pages match. */
export function agentsPage({ pkg, n, css, themeScript, logoSvg, menuGlyph, copyGlyphs }) {
  const block = (title, text, { wrap = false } = {}) =>
    `<figure class="code-block${wrap ? ' wrap' : ''}"><figcaption>${title}</figcaption><div class="code-frame">` +
    `<button type="button" class="copy-code" aria-label="Copy ${esc(title.toLowerCase())}">${copyGlyphs}</button>` +
    `<pre tabindex="0"><code>${esc(text.trimEnd())}</code></pre></div></figure>`;
  const sha = (code) => `'sha256-${createHash('sha256').update(code, 'utf8').digest('base64')}'`;
  const csp = `script-src ${sha(themeScript)} ${sha(copyScript)} https://static.cloudflareinsights.com; script-src-attr 'none'`;
  const title = 'Use with AI agents · Burtson Icons';
  const description =
    'Set up Claude Code, Cursor, Codex or Copilot to use Burtson Icons: llms.txt, rules for CLAUDE.md and AGENTS.md, an Agent Skill and example prompts.';
  const links = `<a href="${UI}">Components</a><a href="/">Icons</a><a href="/agents/" aria-current="page">AI agents</a><a href="https://burtson.ai">Burtson Labs</a><a href="https://github.com/Burtson-Labs/icons">GitHub</a>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="author" content="Mark Burtson">
<meta name="description" content="${description}">
<link rel="canonical" href="${SITE}/agents/">
<link rel="alternate" type="text/plain" href="/llms.txt" title="Burtson Icons docs for AI agents (llms.txt)">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Burtson Icons">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${SITE}/agents/">
<meta property="og:image" content="${SITE}/og.png?v=${pkg.version}">
<meta property="og:image:alt" content="Burtson Icons: ${n} stroke icons for agents, editors, security and infrastructure">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<script>${themeScript}</script>
<style>${css}${pageCss}</style>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header><a href="/" class="brand" aria-label="Burtson Icons home">${logoSvg}<div>Burtson Icons</div></a>
<div class="topright"><nav class="links" aria-label="Burtson packages">${links}</nav><details class="package-menu"><summary aria-label="Package navigation">${menuGlyph}</summary><nav aria-label="Burtson packages mobile">${links}</nav></details><span class="tag">v${pkg.version}</span></div></header>
<main id="main" class="doc" tabindex="-1">
<h1>Use with AI agents</h1>
<p class="lead">Set up Claude Code, Cursor, Codex, Copilot or any other coding agent to find and use the right Burtson Icon instead of guessing names or pulling in another icon set.</p>

<h2 id="docs-for-agents">Docs agents can read</h2>
<table><thead><tr><th scope="col">File</th><th scope="col">What it has</th></tr></thead><tbody>
<tr><td><a href="/llms.txt"><code>/llms.txt</code></a></td><td>Index: install, every entry point (React, MUI, SVG, sprite, CDN), links.</td></tr>
<tr><td><a href="/llms-full.txt"><code>/llms-full.txt</code></a></td><td>All ${n} icons with tags, categories, aliases and import lines, plus the design rules. Search it by meaning.</td></tr>
<tr><td><a href="/icons.json"><code>/icons.json</code></a></td><td>Every icon as data, with geometry. Also <code>@burtson-labs/icons/icons.json</code>.</td></tr>
<tr><td><a href="${UI}/docs/ai-agents"><code>ui.burtson.ai</code></a></td><td>Burtson UI components, its registry, shadcn MCP setup and skill.</td></tr>
</tbody></table>

<h2 id="project-rules">1. Add the rules to your project</h2>
<p>Paste this into the file your agent reads at the start of every task: <code>CLAUDE.md</code> (Claude Code), <code>AGENTS.md</code> (Codex, Cursor, Copilot and others), <code>.cursorrules</code> (or a file in <code>.cursor/rules/</code>) or <code>.github/copilot-instructions.md</code>.</p>
${block('Rules for CLAUDE.md or AGENTS.md', projectRules, { wrap: true })}

<h2 id="skill">2. Install the Agent Skill</h2>
<p>The <code>burtson-icons</code> skill tells an agent how to find an icon by meaning and which import to use. It follows the open <a href="https://agentskills.io">Agent Skills</a> format and lives in <a href="https://github.com/Burtson-Labs/icons/tree/main/skills/burtson-icons">skills/burtson-icons</a>. Install it with the <code>skills</code> CLI, which detects your agents and asks where to put it:</p>
${block('Install', skillCommands)}
<p>Or save the text below as <code>.claude/skills/burtson-icons/SKILL.md</code> (Claude Code) or <code>.agents/skills/burtson-icons/SKILL.md</code>:</p>
${block('SKILL.md', skill(), { wrap: true })}

<h2 id="prompts">3. Ask your agent</h2>
<p>Prompts that work well once the rules or the skill are in place:</p>
${prompts.map(([t, p]) => block(t, p, { wrap: true })).join('\n')}

<h2 id="components">Components</h2>
<p>Burtson UI uses these icons. Its guide covers the component registry, the shadcn MCP server and its own skill: <a href="${UI}/docs/ai-agents">ui.burtson.ai/docs/ai-agents</a>.</p>
</main>
<div class="foot doc">Burtson Icons ${pkg.version} · <a href="https://github.com/Burtson-Labs/icons/blob/main/LICENSE">ISC License</a> · <a href="/llms.txt">llms.txt</a> · Made by <a href="https://burtson.ai">Burtson Labs</a></div>
<script>${copyScript}</script>
</body>
</html>
`;
}

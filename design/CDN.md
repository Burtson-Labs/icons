# React and CDN delivery

No release or CDN deployment is performed by this upgrade. All 0.2.0 URLs below are examples for a future version you publish, not verified live links. The installer preserves the current version.

## Local application and release

Save the installer outside the repository. Start from a clean branch and run:

```sh
node ../apply-burtson-icons-upgrade.mjs .
node ../apply-burtson-icons-upgrade.mjs . --apply
npm ci
npm run check
npm pack
```

The first invocation is a read-only dry run. Review the diff, test against consuming apps with the packed tarball, and select a new unused package version. Do not republish an existing version. Follow the repository's existing release workflow; the installer does not alter authentication or trigger it. If creating a candidate manually, `npm version 0.2.0 --no-git-tag-version` updates both package.json and package-lock.json before the final check and pack. Use a different version if 0.2.0 already exists.

## React imports

```tsx
import { AgentLoop, McpPort, StealthMask } from '@burtson-labs/icons/react';
// Or load a known single component without importing the barrel:
import WorkflowBranch from '@burtson-labs/icons/react/workflow-branch';

<button aria-label="Run agent"><AgentLoop size={18} /></button>
<McpPort size="1em" absoluteStrokeWidth title="Connected tools" />
<StealthMask size={24} color="currentColor" />
<WorkflowBranch size={20} aria-label="Workflow branches" />
```

Do not label the icon redundantly when the enclosing button already has a name. Keep MUI sx/fontSize/theme-color translation at the app's adapter layer rather than putting an MUI dependency in this package. Existing third-party brand logos and ordinary Lucide UI glyphs can stay in place during adoption.

## npm CDN files

A package export map is for module resolution; it does not move files on a CDN. The generated files are physically under dist, so use that path:

```html
<!-- Example only: valid after publishing this version. -->
<img
  src="https://cdn.jsdelivr.net/npm/@burtson-labs/icons@0.2.0/dist/svg-accent/agent-loop.svg"
  alt="Agent"
  width="24"
  height="24"
/>
```

Use svg-white on dark backgrounds, svg-black on light backgrounds, or svg-accent for the house #a60ee5 accent. An SVG loaded through img is a separate document: it does not inherit the surrounding page's text color. Use inline React/DOM SVG or a CSS mask for currentColor inheritance.

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@burtson-labs/icons@0.2.0/dist/icons.css"
/>
<span class="bl-icon-mask bl-icon--mcp-port" aria-hidden="true" style="color:rebeccapurple"></span>
```

The CSS file references SVGs relative to itself. Keep that directory structure when self-hosting. Cross-origin CSS masks require correctly configured asset CORS headers; test your chosen host.

## Plain HTML with no React

```html
<i data-burtson="agent-loop" data-size="20" aria-label="Agent activity"></i>
<script src="https://cdn.jsdelivr.net/npm/@burtson-labs/icons@0.2.0/dist/burtson-icons.js"></script>
<script>
  BurtsonIcons.createIcons();
</script>
```

The global build includes all icon nodes so dynamic names work. It has no runtime imports or eval, but a strict CSP must allow the chosen host and the initialization script (use an external init file or a nonce). Calling createIcons again preserves already rendered SVGs. Framework-managed React trees should use components, not DOM replacement.

Alternatively, import `createIcons` from `.../dist/browser.js` in a script type=module. That entry has relative ESM imports; all referenced dist files must be served. The React entry has a bare React import and is not a drop-in classic script; bundle it in your React app, or use a correctly configured import map/module CDN.

## Existing icons.burtson.ai / private hosting

`npm run site` still builds the existing site, then copies the full distribution into site/dist. Your existing site deployment can therefore serve `/svg`, `/svg-white`, `/svg-black`, `/svg-accent`, `/icons.css`, `/browser.js` and `/burtson-icons.js` alongside the gallery. This does not automatically deploy the site or update another repository.

Those root paths are mutable aliases. Use short/revalidating cache policies. For long-lived immutable caching, copy a complete release into a versioned prefix such as `/icons/0.2.0/` without overwriting previous releases. Keep version directories outside any output directory your deployment deletes on each build.

For custom hosts, serve SVG as image/svg+xml, JS as text/javascript or application/javascript, and CSS as text/css. Configure Access-Control-Allow-Origin appropriately for public icons and modules. Do not add cookies or credentials to public static asset requests. Pin a full immutable version in production and calculate SRI hashes only after the final files exist.

A GitHub-backed CDN can serve source SVGs at `.../gh/Burtson-Labs/icons@<commit>/icons/<name>.svg` after that commit exists. Source SVGs use currentColor, not the explicit image variants; generated dist is normally not committed. Do not assume a future tag or commit is already present.

## SVG sprites

Host sprite.svg on the same origin as the consuming page or inline it. Do not rely on cross-origin use:

```html
<svg width="24" height="24" role="img" aria-label="Agent activity">
  <use href="/sprite.svg#agent-loop"></use>
</svg>
```

The symbols contain their own stroke/fill defaults. SVG fragment identifiers are case-sensitive kebab-case names.

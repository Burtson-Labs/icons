# Changelog

## 0.2.1 - 2026-09-24

- **CommonJS support.** `require('@burtson-labs/icons')`, `/react` and
  `/render` now load real CommonJS builds, so packages compiled with
  TypeScript `module: CommonJS` can depend on the icons.
- **Types under older TypeScript resolution.** `typesVersions` maps every
  subpath (`/react`, `/react/<name>`, `/nodes/<name>`, `/render`,
  `/browser`) for projects on `moduleResolution: node`, which ignores
  package `exports`.
- Link previews for icons.burtson.ai (Slack, Teams, X) and a real favicon.

## 0.2.0 - 2026-09-24

- **230 icons** (from 18). 129 everyday app basics (arrows, chevrons,
  actions, status, files and folders, development, layout, messaging, people),
  82 domain icons for agents, infrastructure, workflows, evidence, voice,
  tenants and logistics, and the `burtson-labs-vial` brand mark. Familiar
  names are aliases, so `house`, `ellipsis`, `close`, `cog` and similar resolve.
- **Per-icon entry points:** `@burtson-labs/icons/react/<name>` and
  `@burtson-labs/icons/nodes/<name>`, plus `/render`, `/browser`, a
  `burtson-icons.js` global, `icons.css` masks, and `svg-accent`, `svg-white`
  and `svg-black` colour variants.
- **React:** `title` and `titleId`, and labelled icons are exposed to
  assistive technology while unlabelled ones stay decorative.
  `absoluteStrokeWidth` works with CSS sizes.
- **icons.burtson.ai:** collections, a searchable grid, and an inspector with
  React, SVG and CDN snippets.
- Tooling follows the Burtson Labs frontend standards (ESLint and Prettier).

## 0.1.0 - 2026-09-23

- First release: 18 icons, React components, SVG files, sprite and JSON.

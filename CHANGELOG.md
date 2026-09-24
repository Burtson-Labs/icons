# Changelog

## 0.4.1

- icons.burtson.ai: plain descriptive copy, neutral ink/paper palette and an
  accent picker (ink by default; violet is the Burtson purple). New link-preview
  card. No change to the icons.

## 0.4.0 - 2026-09-24

- **Brand logos**, in their own entry: `@burtson-labs/icons/brands`,
  `/brands/react` (`<ClaudeLogo />`, `<GithubLogo colored />`),
  per-logo `/brands/react/<name>`, and `brands/svg` + `brands/svg-color`
  files. 75 logos across AI (Anthropic, Claude, Ollama, Gemini, Hugging Face,
  Mistral, Copilot, ...), social (X, Instagram, YouTube, Discord, Bluesky, ...),
  platforms (Apple, macOS, Linux, Ubuntu, Android, ...) and developer tools
  (GitHub, Docker, Kubernetes, Python, TypeScript, Rust, ...). Filled marks with
  official colours; geometry from Simple Icons (CC0), not redrawn. The logos are
  trademarks of their owners: see TRADEMARKS.md, which also lists the brands
  Simple Icons does not carry (OpenAI, LinkedIn, Slack, Microsoft, ...). The
  stroke set, its count and its validators are unchanged.
- icons.burtson.ai has a **Brand logos** collection, and serves
  `/brands/svg/<name>.svg`, `/brands/svg-color/<name>.svg` and
  `/brands/brands.json`.

## 0.3.0 - 2026-09-24

- **382 icons** (from 230). 152 new drawings close every gap found in an
  inventory of the icons Burtson Labs apps actually import: media and devices
  (camera, film, monitors, headphones), connectivity (wifi, cloud-off,
  cloud-sync), text editing (bold, italic, strikethrough, lists), files and
  folders, finance, legal (scale, gavel), charts and trends, faces and more.
  Material Symbols and Lucide names are aliases (`photo-camera`, `sports-score`,
  `local-shipping`, `crop-square`, ...), so migrating is mostly an import change.
- **`@burtson-labs/icons/mui`**: every icon as an MUI `SvgIcon`, so
  `fontSize`, `color="primary"`, `sx` and `startIcon` work exactly as they do
  with `@mui/icons-material`. `@mui/material` is an optional peer.

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

# Burtson Icons expansion

This is an additive expansion, not a replacement for the existing icon library or company logos. The 18 source drawings observed in the repository are retained. The overlay adds 82 geometry-only SVGs and matching metadata, for 100 drawings when applied to that baseline. A later checkout may contain more.

The new drawings retain the 24x24 canvas, round 2px strokes and currentColor. They cover agents, coding, approvals, infrastructure, workflows, evidence, audio, tenant administration, logistics and bowling. Product identity remains in established logos; a UI metaphor such as `forge-anvil` is not a new approved product logo. The existing `stealth-mask` is intentionally unchanged.

## Build architecture

The existing scripts/build.mjs stays in place. A final `enhanceDist(ROOT)` stage consumes its generated dist/icons.json, preserving the real source metadata and aliases. Existing validation, preview generation, README counting and originality comparison remain intact. The site command adds a final copy stage for the new CDN assets.

Generated delivery surfaces:

- `@burtson-labs/icons/react`: named React exports; optional React peer dependency.
- `@burtson-labs/icons/react/agent-loop`: one-component entry, with a matching declaration file.
- `@burtson-labs/icons/nodes/agent-loop` plus `/render`: one raw node and a framework-free renderer.
- `@burtson-labs/icons`: existing named nodes and string-name lookup. The full registry intentionally includes all icons; use node entries when size matters.
- `dist/browser.js`: browser ESM, with explicit `createIcons()` initialization.
- `dist/burtson-icons.js`: dependency-free global `BurtsonIcons`, no automatic DOM scanning.
- `dist/svg`, `svg-white`, `svg-black`, `svg-accent`: one file per icon.
- `dist/icons.css`: currentColor CSS masks with relative SVG paths.
- `dist/sprite.svg`: same-origin symbols, each carrying its presentation attributes.

Components retain size, color, strokeWidth, className, ordinary SVG props, children and forwarded refs. New title/titleId support uses React useId. aria-labelledby and aria-label both make the default icon meaningful; unlabeled icons are decorative. An explicit aria-hidden is respected. Absolute stroke sizing uses vector-effect on each geometry element, including sizes such as 1em and CSS-driven widths. The React factory carries a use-client boundary; framework integration still needs app-level validation.

Named exports and per-icon modules are structured for tree shaking with pure factory annotations. This is not a measured bundle-size guarantee. A real bundler smoke test remains a release task.

The string and DOM renderers escape root attribute values and restrict custom nodes to inert geometry. Arbitrary HTML, event attributes, scripts, foreignObject and external references are rejected. This is an icon-node validator, not a general SVG sanitizer.

## Compatibility and intentional changes

Keep existing `.../react` imports and the `toSvg` core API. Generated SVG strings now include accessibility attributes, so exact snapshots and string equality with older releases can change. Components support the existing ref API. The renderer is ESM; this upgrade does not add CommonJS or React Native support.

The package export map is extended, never replaced. CSS is listed as side-effectful so a bundler does not discard explicitly imported mask styles. The existing build test is adjusted to assert per-icon re-exports instead of the former single-file declaration layout.

No package version, dependencies, lockfile, publish credentials or GitHub workflows are changed by the installer. It does not run builds, install dependencies, push commits or publish.

## Validation before release

Run `npm ci`, `npm run check`, and inspect the new drawings at 16, 24 and 48px with strokes 1.5 through 2.5. Keep the existing originality threshold; redraw anything flagged rather than weakening it. The supplied local quality report does NOT claim the upstream Lucide comparison, lint, full typecheck or application integration passed.

For the real React rendering test, ensure React and react-dom are installed in the development environment. To try them without modifying dependency declarations or the lockfile:

```sh
npm install --no-save --package-lock=false react react-dom
npm run test:react
```

The strict command fails when these dependencies are absent instead of reporting a misleading green React test. The normal enhancement suite skips its React SSR case when the optional dependencies are absent. Release CI should use the strict command with development dependencies installed reproducibly.

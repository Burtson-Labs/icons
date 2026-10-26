---
name: burtson-icons
description: Find and use icons from Burtson Icons (@burtson-labs/icons), a 24px stroke icon set with React, MUI, SVG, sprite and CDN entries. Use when a project depends on @burtson-labs/icons or @burtson-labs/ui, when adding or replacing icons in a Burtson Labs app, or when asked for an icon by meaning (for example "an icon for approvals").
license: ISC
---

# Burtson Icons

Open-source stroke icons: 24×24 grid, 2px round stroke, `currentColor`, no runtime dependencies. Gallery: https://icons.burtson.ai. Index for agents: https://icons.burtson.ai/llms.txt.

## Find an icon

1. Search https://icons.burtson.ai/llms-full.txt for the meaning you need. Every icon is listed with its tags, categories and aliases, so search words like "approve", "delete", "gpu" or a Lucide name ("circle-x") rather than guessing a file name.
2. Machine-readable data with geometry: https://icons.burtson.ai/icons.json (also `@burtson-labs/icons/icons.json` in the package).
3. Confirm the name exists before importing. A wrong name is a build error.

## Use it

Install: `npm install @burtson-labs/icons`.

- React, one import per icon: `import { ShieldProof } from '@burtson-labs/icons/react/shield-proof';` (a default export works too). Props: `size` (24), `strokeWidth` (2), `absoluteStrokeWidth`, `className`, `title`, and any SVG prop.
- MUI: `import { ShieldProof } from '@burtson-labs/icons/mui/shield-proof';` then `fontSize`, `color`, `sx`, `titleAccess` as with `@mui/icons-material`.
- Plain JavaScript: `import { toSvg } from '@burtson-labs/icons'; el.innerHTML = toSvg('shield-proof', { size: 20 });`
- SVG file or CDN: `@burtson-labs/icons/svg/<name>.svg` or `https://icons.burtson.ai/svg/<name>.svg`. In an `<img>`, use an explicit-colour variant (`/svg-accent/`, `/svg-white/`, `/svg-black/`), because `currentColor` does not reach into an image.
- Sprite: copy `@burtson-labs/icons/sprite.svg` to your own origin and use `<svg><use href="/sprite.svg#<name>" /></svg>`. Browsers block cross-origin `<use>`.
- Brand logos (third-party trademarks, filled): `import { GithubLogo } from '@burtson-labs/icons/brands/react/github';` Add `colored` for the brand colour.

## Rules

- Use only `@burtson-labs/icons` in Burtson Labs apps. Do not add lucide-react, heroicons, react-icons or Material icons, and do not paste SVG paths from other sets.
- Colour comes from the text colour (`className="text-muted-foreground"`, theme tokens), not a `color` hex.
- An icon next to a text label is decorative and stays `aria-hidden` (the default). An icon that carries meaning alone needs `title` (React) or `titleAccess` (MUI), or a label on its button.
- Keep the 2px stroke at 16 to 24px. Use `absoluteStrokeWidth` when scaling an icon up so the stroke stays even.
- If no icon fits, use the closest match, say which one you picked, and suggest an icon request at https://github.com/Burtson-Labs/icons/issues. Do not draw a new icon inside the app.

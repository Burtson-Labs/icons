# Burtson Icons design spec

The rules every icon follows. `npm run validate` enforces what the package needs to build, `npm run icons:lint` enforces the measured house standard below, and review covers the rest.

## Canvas

- **24×24 grid**, `viewBox="0 0 24 24"`.
- **1px margin.** Geometry (the stroke's centreline) stays between 1 and 23 on both axes. Aim for 2 to 22. Use the full margin only for thin, wide shapes such as arrows.
- **Optical size, not bounding box.** A circle reads larger than a square of the same width, so a standalone circle is about r=9 (18 across) and a standalone square about 17 to 18 across.

## Stroke

- **2px, round caps, round joins**, set once on the root. Children never override stroke, fill, width or linecap.
- **No fills.** A solid dot is a zero-length path, `M6.5 12h.01`, which the round cap turns into a 2px dot.
- Two parallel strokes need at least **2px of empty space** between them (4px centre to centre), or they merge at 16px.

## Shapes

- **Corner radius:** 2 to 2.5 on containers (windows, cards, documents), 1 to 1.5 on small inner shapes, and 4+ for pills.
- **Coordinates** snap to whole or half pixels where possible, with at most 2 decimals. Integer centrelines give the sharpest result at 24px on 1× screens.
- **Allowed elements:** `path`, `circle`, `ellipse`, `rect`, `line`, `polyline`, `polygon`. No `transform`, `style`, `class`, `id`, gradients, masks, text or groups.
- **Fewer elements.** Most icons need 2 to 5. If one needs more than 8, it's probably two icons.

## Metaphor

- **Draw one idea.** A modifier (check, x, lock, clock, plus, slash) goes bottom right at about 7px, and the base shape gives way to it: clip the base's stroke around the modifier and leave a 1.5px gap. Don't draw the modifier on top of the base.
- **Consistent vocabulary.** A shield means security, a seal means a signed or verified record, a spark means AI, a chip means a model or compute, and a hexagon means a cluster or node. Reuse these, and add a new metaphor only when none of these fit.
- **Avoid clichés where the backlog says so.** "Robot-free", "brain-free" and similar mean exactly that. We don't draw robots for agents or brains for memory.
- **Status variants share a base.** `shield-proof`, `shield-refuted` and `shield-pattern` use the identical shield path, so they line up when swapped in a UI.

## Originality

The grid and stroke conventions match other 24px stroke sets on purpose, so ours mix cleanly with them. The drawings must be our own. Don't trace, paste or nudge paths from Lucide, Feather, Tabler, Heroicons, Material or any other set. `npm run originality` compares every icon's geometry against Lucide and fails at 60% overlap. The same concept drawn independently (a padlock is a padlock) passes, and is fine.

## Names and metadata

- **kebab-case**, noun first, modifier last: `shield-proof`, `key-pinning`, `gpu-release`.
- **Name what it shows,** not where it's used: `merkle-tree`, not `forge-checkpoint-icon`. Product words belong in `tags`.
- **`icons/<name>.json`:** `tags` (at least 2, search words people will type), `categories` (the first is primary; see `categories.json`), optional `aliases` (old or alternative names), and `contributors`.
- **No private product names** anywhere in the repo. It's public.

## Measured standard

Numbers taken from the set itself (0.5.0, 403 icons) and enforced by `npm run icons:lint` (`scripts/lint-icons.mjs`, CI step "Icon lint"). Geometry is measured along the stroke centreline with curves and arcs sampled, so the bounding box and length are real, not control-point guesses (`scripts/geometry.mjs`).

| What              | Standard                                                                                                                                     | Measured                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Canvas and root   | `viewBox="0 0 24 24"`, `stroke="currentColor"`, `stroke-width="2"`, round caps and joins, `fill="none"`; nothing else on the root            | 403/403                                                                                |
| Elements          | `path`, `circle`, `ellipse`, `rect`, `line`, `polyline`, `polygon` with geometry attributes only; no fill, colour, transform, mask, clip, id | 403/403; 1 to 7 per icon, median 2                                                     |
| Element budget    | at most 8                                                                                                                                    | max 7                                                                                  |
| Margin            | centreline within 1 to 23                                                                                                                    | 403/403                                                                                |
| Optical size      | largest side of the bounding box between 10 and 22                                                                                           | 11 to 21; most 17 to 19; glyphs such as chevrons and dots are the small end            |
| Optical centre    | bounding-box centre within 2 of (12, 12)                                                                                                     | worst 1.6 (`play`, deliberately right-heavy); arrows and modifiers are off by 1 to 1.5 |
| Visual weight     | total centreline length at most 150                                                                                                          | median 67, 10th to 90th percentile 41 to 95                                            |
| Grid              | typed endpoints on the 0.5 grid, at most 2 decimals; rotated shapes (gears, stars, arcs) are exempt and the lint warns rather than fails     | 89% of 4,600 endpoints on the half grid; 18 icons warned, all rotational or organic    |
| Dots              | a zero-length path, `M6.5 12h.01`                                                                                                            | 40 icons                                                                               |
| Parallel strokes  | 4 units centre to centre (2 units of daylight) or they merge at 16px                                                                         | reviewed on the 16/20/24/32 contact sheets, light and dark                             |
| Source formatting | root on one line, one element per line indented two spaces, ` />` with a space, trailing newline (`--fix` rewrites)                          | normalised in 0.5.0 (79 files used `/>`)                                               |
| Name              | kebab-case; noun first, modifier last (`file-plus`, `shield-off`); badge icons name the badge shape last (`x-circle`, `check-square`)        | 403/403; other conventions resolve through `aliases` (`circle-x`, `square-check`)      |
| Tags              | at least 3 besides the name; lowercase words with spaces or hyphens; Lucide and Material names go here or in `aliases`                       | median 4                                                                               |
| Categories        | 1 or 2 from `categories.json`, primary first                                                                                                 | 1 for 71%, 2 for 29%                                                                   |
| Aliases           | kebab-case, unique across the set, never an icon name                                                                                        | 330 aliases                                                                            |
| Metadata file     | keys in the order `tags`, `categories`, `aliases`, `contributors`; Prettier formatting                                                       | `--fix` reorders                                                                       |

## Review checklist

1. Read it at 16px, 24px and 48px (the site's size slider). Does it still say one thing at 16px?
2. Check it next to its neighbours in the category. Is the visual weight about the same?
3. Stroke 1.5 and stroke 2.5. Does anything touch or close up?
4. Dark background. Do any gaps disappear?
5. `npm run check` is green.

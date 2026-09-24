# Burtson Icons design spec

The rules every icon follows. `npm run validate` enforces the mechanical ones, and review covers the rest.

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

## Review checklist

1. Read it at 16px, 24px and 48px (the site's size slider). Does it still say one thing at 16px?
2. Check it next to its neighbours in the category. Is the visual weight about the same?
3. Stroke 1.5 and stroke 2.5. Does anything touch or close up?
4. Dark background. Do any gaps disappear?
5. `npm run check` is green.

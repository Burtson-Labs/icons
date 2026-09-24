import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../scripts/lib.mjs';
import { lucideDir, similarity } from '../scripts/originality.mjs';

test(
  'the originality check catches a pasted Lucide icon',
  { skip: !lucideDir() && 'lucide-static not installed' },
  async () => {
    const { parseIcon, elementPoints } = await import('../scripts/lib.mjs');
    const sig = (svg) =>
      new Set(
        parseIcon(svg).children.map(
          (c) =>
            `${c[0]}:${elementPoints(c)
              .map(([x, y]) => `${Math.round(x * 2) / 2},${Math.round(y * 2) / 2}`)
              .join(' ')}`,
        ),
      );
    const lucide = readFileSync(join(lucideDir(), 'shield-check.svg'), 'utf8');
    assert.equal(similarity(sig(lucide), sig(lucide)), 1);
    const ours = readFileSync(join(ROOT, 'icons/shield-proof.svg'), 'utf8');
    assert.ok(similarity(sig(ours), sig(lucide)) < 0.4);
  },
);

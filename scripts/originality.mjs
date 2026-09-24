#!/usr/bin/env node
// Burtson Icons shares Lucide's grid conventions (24px, 2px stroke, round
// caps) so the two can sit side by side, but every drawing must be our own.
// This compares each icon's geometry with the Lucide set (a dev dependency,
// never shipped) and fails on near-copies. It catches a pasted or lightly
// nudged Lucide path; it cannot judge whether a new drawing is merely similar
// in idea, which is fine: a padlock is a padlock.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { elementPoints, listIconNames, parseIcon, readIcon } from './lib.mjs';
import { say, warn, fail } from './log.mjs';

const FAIL = 0.6;
const WARN = 0.4;

/** An element as a comparable string: its tag and its points, rounded to 0.5. */
function signature(child) {
  const r = (v) => Math.round(v * 2) / 2;
  let pts;
  try {
    pts = elementPoints(child);
  } catch {
    return null;
  }
  return `${child[0]}:${pts.map(([x, y]) => `${r(x)},${r(y)}`).join(' ')}`;
}

function signatures(svg) {
  return new Set(parseIcon(svg).children.map(signature).filter(Boolean));
}

export function similarity(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const s of a) if (b.has(s)) shared++;
  return shared / Math.max(a.size, b.size);
}

export function lucideDir() {
  try {
    const require = createRequire(import.meta.url);
    const dir = join(dirname(require.resolve('lucide-static/package.json')), 'icons');
    return existsSync(dir) ? dir : null;
  } catch {
    return null;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = lucideDir();
  if (!dir) {
    fail('lucide-static is not installed (npm install), so originality cannot be checked');
    process.exit(1);
  }
  /** @type {Array<[string, Set<string>]>} */
  const theirs = readdirSync(dir)
    .filter((f) => f.endsWith('.svg'))
    .map((f) => /** @type {[string, Set<string>]} */ ([f.slice(0, -4), signatures(readFileSync(join(dir, f), 'utf8'))]));
  let failed = 0;
  for (const name of listIconNames()) {
    const ours = signatures(readIcon(name).svg);
    let bestName = '';
    let bestScore = 0;
    for (const [other, sig] of theirs) {
      const s = similarity(ours, sig);
      if (s > bestScore) [bestName, bestScore] = [other, s];
    }
    const pct = Math.round(bestScore * 100);
    if (bestScore >= FAIL) {
      failed++;
      fail(`${name}: ${pct}% of its geometry matches lucide/${bestName}; redraw it`);
    } else if (bestScore >= WARN) warn(`${name}: ${pct}% overlap with lucide/${bestName}; check it is really ours`);
  }
  say(`${listIconNames().length} icon(s) compared with ${theirs.length} Lucide icons, ${failed} too close`);
  process.exit(failed ? 1 : 0);
}

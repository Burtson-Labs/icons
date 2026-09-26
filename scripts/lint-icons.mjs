#!/usr/bin/env node
// npm run icons:lint [-- --fix]
//
// The measured house standard (design/DESIGN.md, "Measured standard"), applied
// to every icons/*.svg and *.json. validate.mjs checks what the package needs
// to build (root attributes, allowed elements, the 1px margin, decimals, the
// metadata shape); this checks what the set needs to look like one set:
// canonical source formatting, optical size and centring, visual weight,
// element budget, naming, and metadata that makes search work. `--fix`
// rewrites formatting and metadata order; geometry findings need a person.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { measure } from './geometry.mjs';
import { ICON_DIR, NAME_RE, ROOT_ATTRS, listIconNames, parseIcon, readCategories } from './lib.mjs';
import { fail, say, warn } from './log.mjs';

/** The rules, with the numbers the set was measured against (384 icons). */
export const RULES = {
  minTags: 3,
  maxCategories: 2,
  maxElements: 8,
  /** Largest bounding-box side of the stroke centreline, in grid units. */
  minSize: 10,
  maxSize: 22,
  /** Bounding-box centre must sit within this many units of (12, 12). */
  maxCentreOffset: 2,
  /** Total centreline length (visual weight) of a stroke icon. */
  maxLength: 150,
  /** Warn when fewer than this share of typed endpoints sit on the 0.5 grid. */
  minHalfGridShare: 0.5,
  /** Metadata keys, in the order the file is written. */
  metaKeys: ['tags', 'categories', 'aliases', 'contributors'],
  /**
   * Words that describe a modifier on a base shape. They come last
   * (`file-plus`, `shield-off`), unless the icon is a badge whose last word
   * is the badge shape (`x-circle`, `check-square`, `alert-triangle`).
   */
  modifiers: ['off', 'plus', 'minus', 'check', 'x', 'alert', 'question', 'dashed', 'search'],
  badgeShapes: ['circle', 'square', 'triangle'],
};

const TAG_RE = /^[a-z0-9]+(?:[ -][a-z0-9]+)*$/;

/** The one way an icon file is written. */
export function canonicalSvg(children) {
  const root = Object.entries(ROOT_ATTRS)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');
  const body = children
    .map(
      ([tag, attrs]) =>
        `  <${tag} ${Object.entries(attrs)
          .map(([k, v]) => `${k}="${v}"`)
          .join(' ')} />`,
    )
    .join('\n');
  return `<svg ${root}>\n${body}\n</svg>\n`;
}

/**
 * Metadata keys in a fixed order. Whitespace is Prettier's (npm run format),
 * so the lint only checks the order and `--fix` writes through Prettier.
 */
export function orderedMeta(meta) {
  const out = {};
  for (const k of RULES.metaKeys) if (meta[k] !== undefined) out[k] = meta[k];
  return out;
}

async function formatMeta(meta) {
  const json = JSON.stringify(orderedMeta(meta), null, 2) + '\n';
  try {
    const prettier = await import('prettier');
    const config = (await prettier.resolveConfig(join(ICON_DIR, 'x.json'))) ?? {};
    return prettier.format(json, { ...config, parser: 'json' });
  } catch {
    return json;
  }
}

/**
 * @param {string} name
 * @param {string} svg
 * @param {Record<string, any> | null} meta
 * @param {Record<string, unknown>} categories
 * @param {string | null} metaRaw the .json file as written, for the formatting check
 */
export function lintIcon(name, svg, meta, categories, metaRaw = null) {
  const errors = [];
  const warnings = [];
  const fixes = {};

  // Name
  if (!NAME_RE.test(name)) errors.push('name must be kebab-case');
  const words = name.split('-');
  if (words.length > 1 && RULES.modifiers.includes(words[0])) {
    if (!RULES.badgeShapes.includes(words.at(-1)))
      errors.push(
        `"${words[0]}" is a modifier and comes last (base first: ${words.slice(1).join('-')}-${words[0]}), unless the last word is a badge shape (${RULES.badgeShapes.join(', ')})`,
      );
  }

  // Source formatting
  const { errors: parseErrors, children } = parseIcon(svg);
  if (parseErrors.length) errors.push(...parseErrors);
  else {
    const canonical = canonicalSvg(children);
    if (svg !== canonical) {
      errors.push(
        'source formatting: root on one line, each element on its own line indented two spaces, " />" with a space, trailing newline (npm run icons:lint -- --fix)',
      );
      fixes.svg = canonical;
    }
  }

  // Geometry
  if (children.length > RULES.maxElements)
    errors.push(`${children.length} elements; the budget is ${RULES.maxElements}`);
  if (children.length && !parseErrors.length) {
    let m;
    try {
      m = measure(children);
    } catch (e) {
      errors.push(`geometry: ${e.message}`);
    }
    if (m) {
      const size = Math.max(m.width, m.height);
      if (size < RULES.minSize)
        errors.push(
          `too small: ${m.width}×${m.height}; the largest side is at least ${RULES.minSize}`,
        );
      if (size > RULES.maxSize)
        errors.push(
          `too large: ${m.width}×${m.height}; the largest side is at most ${RULES.maxSize}`,
        );
      const [cx, cy] = m.centre;
      if (Math.abs(cx - 12) > RULES.maxCentreOffset || Math.abs(cy - 12) > RULES.maxCentreOffset)
        errors.push(
          `off centre: bounding box centre (${cx}, ${cy}) is more than ${RULES.maxCentreOffset} from (12, 12)`,
        );
      if (m.length > RULES.maxLength)
        errors.push(
          `too heavy: ${m.length} units of stroke; the set's median is about 67 and the limit is ${RULES.maxLength}`,
        );
      if (m.endpoints && m.onHalfGrid / m.endpoints < RULES.minHalfGridShare)
        warnings.push(
          `${m.onHalfGrid}/${m.endpoints} endpoints on the 0.5 grid; fine for rotated shapes (gears, stars), otherwise snap`,
        );
    }
  }

  // Metadata
  if (!meta) errors.push('missing metadata');
  else {
    const unknown = Object.keys(meta).filter((k) => !RULES.metaKeys.includes(k));
    if (unknown.length) errors.push(`unknown metadata keys: ${unknown.join(', ')}`);
    const tags = Array.isArray(meta.tags) ? meta.tags : [];
    const useful = tags.filter((t) => t !== name);
    if (useful.length < RULES.minTags)
      errors.push(
        `${useful.length} search tags besides the name; at least ${RULES.minTags} (words people type, synonyms, other sets' names)`,
      );
    for (const t of tags)
      if (typeof t !== 'string' || !TAG_RE.test(t))
        errors.push(`tag ${JSON.stringify(t)}: lowercase words, hyphens or spaces only`);
    if (new Set(tags).size !== tags.length) errors.push('duplicate tags');
    const cats = Array.isArray(meta.categories) ? meta.categories : [];
    if (!cats.length) errors.push('no category');
    if (cats.length > RULES.maxCategories)
      errors.push(
        `${cats.length} categories; at most ${RULES.maxCategories} (the first is primary)`,
      );
    for (const c of cats) if (!categories[c]) errors.push(`unknown category "${c}"`);
    if (new Set(cats).size !== cats.length) errors.push('duplicate categories');
    for (const a of meta.aliases ?? []) {
      if (!NAME_RE.test(a)) errors.push(`alias "${a}" must be kebab-case`);
      if (a === name) errors.push(`alias "${a}" is the icon's own name`);
    }
    if (meta.aliases && new Set(meta.aliases).size !== meta.aliases.length)
      errors.push('duplicate aliases');
    if (!Array.isArray(meta.contributors) || !meta.contributors.length)
      errors.push('contributors is empty');
    const order = Object.keys(meta).filter((k) => RULES.metaKeys.includes(k));
    if (order.join() !== Object.keys(orderedMeta(meta)).join()) {
      errors.push(`metadata keys in order ${RULES.metaKeys.join(', ')} (--fix)`);
      fixes.meta = true;
    }
    if (metaRaw !== null && !metaRaw.endsWith('\n')) {
      errors.push('metadata file needs a trailing newline (--fix)');
      fixes.meta = true;
    }
  }
  return { errors, warnings, fixes };
}

export async function lintAll({ fix = false } = {}) {
  const categories = readCategories();
  const names = listIconNames();
  const nameSet = new Set(names);
  const aliasOwner = new Map();
  const results = [];
  for (const name of names) {
    const svgPath = join(ICON_DIR, `${name}.svg`);
    const metaPath = join(ICON_DIR, `${name}.json`);
    const svg = readFileSync(svgPath, 'utf8');
    let metaRaw = null;
    let meta = null;
    try {
      metaRaw = readFileSync(metaPath, 'utf8');
      meta = JSON.parse(metaRaw);
    } catch {
      meta = null;
    }
    const r = lintIcon(name, svg, meta, categories, metaRaw);
    for (const a of meta?.aliases ?? []) {
      if (nameSet.has(a)) r.errors.push(`alias "${a}" is also an icon`);
      if (aliasOwner.has(a)) r.errors.push(`alias "${a}" is also on ${aliasOwner.get(a)}`);
      aliasOwner.set(a, name);
    }
    if (fix) {
      if (r.fixes.svg) writeFileSync(svgPath, r.fixes.svg);
      if (r.fixes.meta && meta) writeFileSync(metaPath, await formatMeta(meta));
      if (r.fixes.svg || r.fixes.meta)
        r.errors = r.errors.filter((e) => !/formatting|--fix/.test(e));
    }
    results.push({ name, ...r });
  }
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fix = process.argv.includes('--fix');
  const results = await lintAll({ fix });
  let failed = 0;
  let warned = 0;
  for (const r of results) {
    for (const w of r.warnings) {
      warned++;
      warn(`${r.name}: ${w}`);
    }
    for (const e of r.errors) fail(`${r.name}: ${e}`);
    if (r.errors.length) failed++;
  }
  say(
    `${results.length} icon(s) linted, ${failed} failing, ${warned} warning(s)${fix ? ' (fixed formatting)' : ''}`,
  );
  process.exit(failed ? 1 : 0);
}

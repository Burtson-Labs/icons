#!/usr/bin/env node
// Every icon must follow design/DESIGN.md mechanically. Taste is reviewed by a
// person; everything a machine can check is checked here, so review time goes
// to the drawing and not to attribute soup.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ALLOWED, ICON_DIR, NAME_RE, ROOT_ATTRS, elementPoints, listIconNames, parseIcon, readCategories, readIcon } from './lib.mjs';
import { say, warn, fail } from './log.mjs';

export function validateIcon(name, svg, meta, categories) {
  const errors = [];
  const warnings = [];
  if (!NAME_RE.test(name)) errors.push('name must be kebab-case: lowercase letters, digits and single hyphens');

  const { errors: parseErrors, attrs, children } = parseIcon(svg);
  errors.push(...parseErrors);

  for (const [k, v] of Object.entries(ROOT_ATTRS)) {
    if (attrs[k] !== v) errors.push(`<svg ${k}> must be "${v}" (found ${attrs[k] === undefined ? 'nothing' : `"${attrs[k]}"`})`);
  }
  for (const k of Object.keys(attrs)) if (!(k in ROOT_ATTRS)) errors.push(`<svg> has an extra attribute "${k}"`);
  if (children.length === 0) errors.push('icon has no geometry');
  if (children.length > 12) warnings.push(`${children.length} elements; icons read best at 24px with fewer than about 8`);

  for (const child of children) {
    const [tag, a] = child;
    const allowed = ALLOWED[tag];
    if (!allowed) {
      errors.push(`<${tag}> is not allowed (use ${Object.keys(ALLOWED).join(', ')})`);
      continue;
    }
    for (const k of Object.keys(a)) if (!allowed.includes(k)) errors.push(`<${tag}> may not carry "${k}"; styling belongs to the root`);
    for (const v of Object.values(a)) {
      for (const num of v.match(/-?\d*\.\d+/g) ?? []) {
        if ((num.split('.')[1] ?? '').length > 2) errors.push(`<${tag}> uses ${num}; round coordinates to 2 decimals`);
      }
    }
    let pts;
    try {
      pts = elementPoints(child);
    } catch (e) {
      errors.push(`<${tag}>: ${e.message}`);
      continue;
    }
    for (const [x, y] of pts) {
      if (x < 1 || x > 23 || y < 1 || y > 23) {
        errors.push(`<${tag}> reaches (${+x.toFixed(2)}, ${+y.toFixed(2)}), outside the 1px padding (1 to 23)`);
        break;
      }
    }
  }

  if (!meta) errors.push(`missing ${name}.json (tags and categories)`);
  else {
    if (!Array.isArray(meta.tags) || meta.tags.length < 2) errors.push('metadata needs at least 2 search tags');
    if (!Array.isArray(meta.categories) || meta.categories.length === 0) errors.push('metadata needs at least one category');
    for (const c of meta.categories ?? []) if (!categories[c]) errors.push(`unknown category "${c}" (see categories.json)`);
    if (meta.aliases) for (const a of meta.aliases) if (!NAME_RE.test(a)) errors.push(`alias "${a}" must be kebab-case`);
  }
  return { errors, warnings };
}

export function validateAll() {
  const categories = readCategories();
  const results = [];
  const seenAliases = new Map();
  for (const name of listIconNames()) {
    const { svg, meta } = readIcon(name);
    const r = validateIcon(name, svg, meta, categories);
    for (const a of meta?.aliases ?? []) {
      if (existsSync(join(ICON_DIR, `${a}.svg`))) r.errors.push(`alias "${a}" collides with an icon of that name`);
      if (seenAliases.has(a)) r.errors.push(`alias "${a}" is also claimed by ${seenAliases.get(a)}`);
      seenAliases.set(a, name);
    }
    results.push({ name, ...r });
  }
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const results = validateAll();
  let failed = 0;
  for (const r of results) {
    for (const w of r.warnings) warn(`${r.name}: ${w}`);
    for (const e of r.errors) fail(`${r.name}: ${e}`);
    if (r.errors.length) failed++;
  }
  say(`${results.length} icon(s) checked, ${failed} failing`);
  process.exit(failed ? 1 : 0);
}

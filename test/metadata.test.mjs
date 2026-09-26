import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { NAME_RE, ROOT, listIconNames, readCategories, readIcon } from '../scripts/lib.mjs';
import { RULES } from '../scripts/lint-icons.mjs';

// The metadata schema, as the site and icons.json rely on it.
const TAG_RE = /^[a-z0-9]+(?:[ -][a-z0-9]+)*$/;
const categories = readCategories();
const icons = listIconNames().map((name) => ({ name, ...readIcon(name) }));

test('categories.json entries have a title and a description', () => {
  for (const [id, c] of Object.entries(categories)) {
    assert.match(id, NAME_RE, id);
    assert.equal(typeof c.title, 'string');
    assert.ok(c.title.length > 0 && c.description.length > 0, id);
  }
});

test('every icon has metadata that fits the schema', () => {
  for (const { name, meta } of icons) {
    assert.ok(meta, `${name}.json`);
    assert.deepEqual(
      Object.keys(meta).filter((k) => !RULES.metaKeys.includes(k)),
      [],
      `${name}: unknown keys`,
    );
    assert.ok(Array.isArray(meta.tags) && meta.tags.every((t) => typeof t === 'string'), name);
    assert.ok(meta.tags.filter((t) => t !== name).length >= RULES.minTags, `${name}: tags`);
    for (const t of meta.tags) assert.match(t, TAG_RE, `${name}: tag ${t}`);
    assert.ok(Array.isArray(meta.categories) && meta.categories.length >= 1, `${name}: categories`);
    assert.ok(meta.categories.length <= RULES.maxCategories, `${name}: too many categories`);
    for (const c of meta.categories) assert.ok(categories[c], `${name}: category ${c}`);
    for (const a of meta.aliases ?? []) assert.match(a, NAME_RE, `${name}: alias ${a}`);
    assert.ok(
      Array.isArray(meta.contributors) && meta.contributors.length >= 1,
      `${name}: contributors`,
    );
  }
});

test('aliases are unique across the set and never shadow an icon', () => {
  const names = new Set(icons.map((i) => i.name));
  const seen = new Map();
  for (const { name, meta } of icons)
    for (const a of meta.aliases ?? []) {
      assert.ok(!names.has(a), `${name}: alias ${a} is an icon`);
      assert.ok(!seen.has(a), `alias ${a} on ${name} and ${seen.get(a)}`);
      seen.set(a, name);
    }
});

test('every category is used, and the built icons.json mirrors the source', () => {
  const used = new Set(icons.flatMap((i) => i.meta.categories));
  assert.deepEqual(
    Object.keys(categories).filter((c) => !used.has(c)),
    [],
    'unused categories',
  );
  const built = JSON.parse(readFileSync(join(ROOT, 'dist', 'icons.json'), 'utf8'));
  assert.deepEqual(built.categories, categories);
  const byName = new Map(built.icons.map((i) => [i.name, i]));
  for (const { name, meta } of icons) {
    const b = byName.get(name);
    assert.ok(b, `${name} in icons.json`);
    assert.deepEqual(b.tags, meta.tags, `${name}: tags`);
    assert.deepEqual(b.categories, meta.categories, `${name}: categories`);
    assert.deepEqual(b.aliases, meta.aliases ?? [], `${name}: aliases`);
  }
});

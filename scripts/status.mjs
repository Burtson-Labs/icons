#!/usr/bin/env node
// Progress against design/backlog.json, per category.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, listIconNames, readCategories, readIcon } from './lib.mjs';
import { say } from './log.mjs';

const done = new Set(listIconNames());
const backlog = JSON.parse(readFileSync(join(ROOT, 'design/backlog.json'), 'utf8')).icons;
const cats = readCategories();
const rows = Object.keys(cats).map((c) => {
  const drawn = [...done].filter((n) => readIcon(n).meta?.categories?.[0] === c).length;
  const todo = backlog.filter((i) => i.category === c && !done.has(i.name)).length;
  return [cats[c].title, drawn, todo];
});
const w = Math.max(...rows.map((r) => r[0].length));
for (const [t, d, n] of rows) say(`${t.padEnd(w)}  ${String(d).padStart(3)} drawn  ${String(n).padStart(3)} to go`);
const todo = backlog.filter((i) => !done.has(i.name)).length;
say(`${'total'.padEnd(w)}  ${String(done.size).padStart(3)} drawn  ${String(todo).padStart(3)} to go`);

#!/usr/bin/env node
// npm run new -- <name> [category]
// Writes a blank icon and its metadata, pre-filled from design/backlog.json.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ICON_DIR, NAME_RE, ROOT, readCategories } from './lib.mjs';
import { say, fail } from './log.mjs';

const [name, category] = process.argv.slice(2);
if (!name || !NAME_RE.test(name)) {
  fail('usage: npm run new -- <kebab-case-name> [category]');
  process.exit(64);
}
const svgPath = join(ICON_DIR, `${name}.svg`);
if (existsSync(svgPath)) {
  fail(`icons/${name}.svg already exists`);
  process.exit(1);
}
const planned = JSON.parse(readFileSync(join(ROOT, 'design/backlog.json'), 'utf8')).icons.find(
  (i) => i.name === name,
);
const cat = category ?? planned?.category;
if (!cat || !readCategories()[cat]) {
  fail(`give a category: ${Object.keys(readCategories()).join(', ')}`);
  process.exit(64);
}
writeFileSync(
  svgPath,
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n  <circle cx="12" cy="12" r="9" />\n</svg>\n',
);
writeFileSync(
  join(ICON_DIR, `${name}.json`),
  JSON.stringify({ tags: name.split('-'), categories: [cat], contributors: [] }, null, 2) + '\n',
);
say(
  `icons/${name}.svg and .json written${planned ? ` (backlog: ${planned.concept})` : ''}. Draw it, then npm run check.`,
);

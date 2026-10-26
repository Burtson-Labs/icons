import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { ROOT, listIconNames } from '../scripts/lib.mjs';

execFileSync(process.execPath, [join(ROOT, 'site/build.mjs')], { stdio: 'pipe' });
const dist = (f) => readFileSync(join(ROOT, 'site/dist', f), 'utf8');
const names = listIconNames();

test('llms.txt is an llmstxt.org index with install lines and links', () => {
  const txt = dist('llms.txt');
  assert.ok(txt.startsWith('# Burtson Icons\n\n> '));
  assert.match(txt, new RegExp(`${names.length} stroke icons`));
  for (const s of [
    'npm install @burtson-labs/icons',
    "@burtson-labs/icons/react/shield-proof'",
    "@burtson-labs/icons/mui/shield-proof'",
    'https://icons.burtson.ai/llms-full.txt',
    'https://icons.burtson.ai/agents/',
    'https://ui.burtson.ai/llms.txt',
  ])
    assert.ok(txt.includes(s), s);
});

test('llms-full.txt lists every icon with its tags, aliases and imports', () => {
  const full = dist('llms-full.txt');
  for (const n of names) {
    const meta = JSON.parse(readFileSync(join(ROOT, 'icons', `${n}.json`), 'utf8'));
    const at = full.indexOf(`\n### ${n}\n`);
    assert.ok(at > 0, `${n} is missing`);
    const entry = full.slice(at, full.indexOf('\n\n', at + 1));
    assert.ok(entry.includes(`@burtson-labs/icons/react/${n}'`), n);
    assert.ok(entry.includes(`@burtson-labs/icons/mui/${n}'`), n);
    assert.ok(entry.includes(`- Tags: ${meta.tags.join(', ')}`), n);
    if (meta.aliases?.length) assert.ok(entry.includes(`- Aliases: ${meta.aliases.join(', ')}`), n);
  }
  assert.ok(full.includes('## Design rules'));
  assert.ok(full.includes("@burtson-labs/icons/brands/react/github'"));
});

test('the agents page renders, is linked and allowed by its CSP', () => {
  const html = dist('agents/index.html');
  for (const s of [
    '<h1>Use with AI agents</h1>',
    '1. Add the rules to your project',
    '2. Install the Agent Skill',
    '3. Ask your agent',
    'npx skills add burtson-labs/icons',
    'name: burtson-icons',
    'https://ui.burtson.ai/docs/ai-agents',
  ])
    assert.ok(html.includes(s), s);
  const csp = /<meta http-equiv="Content-Security-Policy" content="([^"]+)">/.exec(html)[1];
  for (const [, code] of html.matchAll(/<script>([\s\S]*?)<\/script>/g))
    assert.ok(
      csp.includes(`'sha256-${createHash('sha256').update(code, 'utf8').digest('base64')}'`),
      'an inline script is missing from the CSP hashes',
    );
  assert.ok(dist('index.html').includes('href="/agents/"'), 'the gallery links the page');
  assert.ok(dist('sitemap.xml').includes('https://icons.burtson.ai/agents/'));
  assert.ok(dist('robots.txt').includes('https://icons.burtson.ai/llms.txt'));
});

test('the Agent Skill has the frontmatter the skills CLI reads', () => {
  const skill = readFileSync(join(ROOT, 'skills/burtson-icons/SKILL.md'), 'utf8');
  const front = /^---\n([\s\S]*?)\n---\n/.exec(skill)?.[1] ?? '';
  assert.match(front, /^name: burtson-icons$/m);
  const description = /^description: (.+)$/m.exec(front)?.[1] ?? '';
  assert.ok(description.length > 40 && description.length <= 1024);
  assert.ok(skill.includes('https://icons.burtson.ai/llms.txt'));
});

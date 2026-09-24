#!/usr/bin/env node
// CommonJS builds of the main entry points, for consumers that `require()`
// the package or compile to CommonJS (TypeScript `module: CommonJS`). The ESM
// in dist/ stays the source of truth; these are bundles of it. Per-icon
// subpaths stay ESM-only: CommonJS consumers get tree-shaking from nothing
// anyway, so they import the full `.` or `/react` entry.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { build } from 'esbuild';

import { ROOT } from './lib.mjs';
import { fail, say } from './log.mjs';

const DIST = join(ROOT, 'dist');
const entries = { index: 'index.js', react: 'react.js', render: 'render.js' };
for (const f of Object.values(entries)) {
  if (!existsSync(join(DIST, f))) {
    fail(`dist/${f} is missing; run the build first`);
    process.exit(1);
  }
}
await build({
  entryPoints: Object.fromEntries(Object.entries(entries).map(([k, f]) => [k, join(DIST, f)])),
  outdir: join(DIST, 'cjs'),
  outExtension: { '.js': '.cjs' },
  bundle: true,
  format: 'cjs',
  platform: 'neutral',
  target: 'es2020',
  external: ['react', 'react/jsx-runtime'],
  logLevel: 'warning',
});
say(
  `CommonJS entries: ${Object.keys(entries)
    .map((k) => `dist/cjs/${k}.cjs`)
    .join(', ')}`,
);

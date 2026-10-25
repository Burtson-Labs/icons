#!/usr/bin/env node
// Links this package into its own node_modules, so the node10 types check
// resolves @burtson-labs/icons the way an installed consumer does (older
// resolution cannot self-reference a package by name). A link that points
// anywhere else (an old checkout, a copy) is replaced.
import { lstatSync, mkdirSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';

import { ROOT } from './lib.mjs';

const link = join(ROOT, 'node_modules', '@burtson-labs', 'icons');
let current = null;
try {
  if (lstatSync(link)) current = realpathSync(link);
} catch {
  // Missing or a dangling link: (re)create it below.
  rmSync(link, { force: true });
}
if (current !== realpathSync(ROOT)) {
  if (current !== null) rmSync(link, { recursive: true, force: true });
  mkdirSync(join(ROOT, 'node_modules', '@burtson-labs'), { recursive: true });
  symlinkSync(ROOT, link, 'dir');
}

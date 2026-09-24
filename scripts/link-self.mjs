#!/usr/bin/env node
// Links this package into its own node_modules, so the node10 types check
// resolves @burtson-labs/icons the way an installed consumer does (older
// resolution cannot self-reference a package by name).
import { existsSync, lstatSync, mkdirSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';

import { ROOT } from './lib.mjs';

const link = join(ROOT, 'node_modules', '@burtson-labs', 'icons');
if (
  !existsSync(link) &&
  !(() => {
    try {
      return lstatSync(link).isSymbolicLink();
    } catch {
      return false;
    }
  })()
) {
  mkdirSync(join(ROOT, 'node_modules', '@burtson-labs'), { recursive: true });
  symlinkSync(ROOT, link, 'dir');
}

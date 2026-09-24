#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fail } from './log.mjs';
try {
  await import('react');
  await import('react-dom/server');
} catch {
  fail(
    'React verification needs react and react-dom installed in the development environment. See design/ENHANCEMENTS.md.',
  );
  process.exit(1);
}
const result = spawnSync(process.execPath, ['--test', 'test/enhancements.test.mjs'], {
  stdio: 'inherit',
  env: { ...process.env, BURTSON_REQUIRE_REACT: '1' },
});
if (result.error) {
  fail(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);

import { defineBurtsonFrontendConfig } from '@burtson-labs/frontend-standards';
import globals from 'globals';

// Burtson Labs frontend standards (type-aware TS/React, a11y, import order,
// Prettier last). The authored TSX here is the compile-only types check and
// the React example; the build tooling is plain Node ESM.
export default [
  ...defineBurtsonFrontendConfig({
    files: ['test/**/*.tsx', 'examples/**/*.tsx'],
    ignores: ['dist/**', 'site/dist/**', '.burtson-icons-upgrade-backup/**'],
    tsconfigRootDir: import.meta.dirname,
  }),
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: { globals: { ...globals.node } },
    rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }] },
  },
];

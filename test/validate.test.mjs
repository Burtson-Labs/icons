import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathPoints, readCategories } from '../scripts/lib.mjs';
import { validateAll, validateIcon } from '../scripts/validate.mjs';

const HEAD =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
const META = { tags: ['a', 'b'], categories: ['security'] };
const check = (body, meta = META, name = 'probe') =>
  validateIcon(name, `${HEAD}${body}</svg>`, meta, readCategories()).errors;

test('every icon in the repo validates', () => {
  const failing = validateAll().filter((r) => r.errors.length);
  assert.deepEqual(
    failing.map((r) => `${r.name}: ${r.errors.join('; ')}`),
    [],
  );
});

test('the validator rejects what the spec forbids', () => {
  assert.equal(check('<circle cx="12" cy="12" r="9" />').length, 0);
  assert.match(
    check('<circle cx="12" cy="12" r="9" fill="red" />').join(),
    /styling belongs to the root/,
  );
  assert.match(check('<g><circle cx="12" cy="12" r="9" /></g>').join(), /self-closing geometry/);
  assert.match(check('<text x="1" y="1" />').join(), /not allowed/);
  assert.match(check('<circle cx="12" cy="12" r="11.5" />').join(), /outside the 1px padding/);
  assert.match(check('<path d="M2 2h20.123" />').join(), /2 decimals/);
  assert.match(check('<path d="M2 2L25 2" />').join(), /outside/);
  assert.match(
    check('<circle cx="12" cy="12" r="9" />', { tags: ['a'], categories: ['security'] }).join(),
    /2 search tags/,
  );
  assert.match(
    check('<circle cx="12" cy="12" r="9" />', { tags: ['a', 'b'], categories: ['nope'] }).join(),
    /unknown category/,
  );
  assert.match(check('<circle cx="12" cy="12" r="9" />', META, 'Bad_Name').join(), /kebab-case/);
  const wrongRoot = validateIcon(
    'probe',
    HEAD.replace('stroke-width="2"', 'stroke-width="1.5"') +
      '<circle cx="12" cy="12" r="9" /></svg>',
    META,
    readCategories(),
  );
  assert.match(wrongRoot.errors.join(), /stroke-width/);
});

test('path bounds follow relative commands and closepath', () => {
  const pts = pathPoints('M4 4h4v4l-2 2zm10 0a2 2 0 0 1 2 2');
  assert.deepEqual(pts.at(-1), [16, 6]);
  assert.ok(pts.some(([x, y]) => x === 6 && y === 10));
});

#!/usr/bin/env node
// @burtson-labs/icons/brands: third-party logos, kept apart from the icon set.
//
// Logos are trademarks and filled marks, not 24px 2px-stroke drawings, so they
// never enter icons/, the validators, the originality check or the icon count.
// Geometry comes from the pinned `simple-icons` package (CC0-1.0) and is not
// redrawn here. A brand simple-icons does not carry (several were removed at
// the owner's request) is listed in MISSING and TRADEMARKS.md instead of being
// imitated.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import { ROOT } from './lib.mjs';
import { fail, say } from './log.mjs';

const require = createRequire(import.meta.url);
// A variable specifier keeps tsc (checkJs) from loading simple-icons' own
// types, which do not compile with skipLibCheck off; the data is plain JSON.
const SI = 'simple-icons';
/** @type {Record<string, { title: string; hex: string; path: string; source: string; guidelines?: string }>} */
const si = require(SI);
const SI_VERSION = JSON.parse(
  readFileSync(join(dirname(require.resolve(SI)), 'package.json'), 'utf8'),
).version;

/** Our name → simple-icons slug, grouped the way the site shows them. */
export const BRAND_GROUPS = {
  ai: {
    title: 'AI',
    brands: {
      anthropic: 'anthropic',
      claude: 'claude',
      ollama: 'ollama',
      'google-gemini': 'googlegemini',
      'hugging-face': 'huggingface',
      mistral: 'mistralai',
      meta: 'meta',
      perplexity: 'perplexity',
      'github-copilot': 'githubcopilot',
      nvidia: 'nvidia',
      cursor: 'cursor',
      windsurf: 'windsurf',
    },
  },
  social: {
    title: 'Social',
    brands: {
      x: 'x',
      instagram: 'instagram',
      facebook: 'facebook',
      youtube: 'youtube',
      tiktok: 'tiktok',
      reddit: 'reddit',
      discord: 'discord',
      bluesky: 'bluesky',
      mastodon: 'mastodon',
      threads: 'threads',
      whatsapp: 'whatsapp',
      telegram: 'telegram',
    },
  },
  platforms: {
    title: 'Platforms',
    brands: {
      apple: 'apple',
      macos: 'macos',
      ios: 'ios',
      linux: 'linux',
      ubuntu: 'ubuntu',
      debian: 'debian',
      'raspberry-pi': 'raspberrypi',
      android: 'android',
      google: 'google',
      chrome: 'googlechrome',
      firefox: 'firefox',
    },
  },
  dev: {
    title: 'Developer',
    brands: {
      github: 'github',
      gitlab: 'gitlab',
      bitbucket: 'bitbucket',
      git: 'git',
      npm: 'npm',
      docker: 'docker',
      kubernetes: 'kubernetes',
      vscodium: 'vscodium',
      jetbrains: 'jetbrains',
      zed: 'zedindustries',
      python: 'python',
      typescript: 'typescript',
      javascript: 'javascript',
      react: 'react',
      nodejs: 'nodedotjs',
      bun: 'bun',
      deno: 'deno',
      vite: 'vite',
      tailwindcss: 'tailwindcss',
      rust: 'rust',
      go: 'go',
      kotlin: 'kotlin',
      swift: 'swift',
      dotnet: 'dotnet',
      bash: 'gnubash',
      homebrew: 'homebrew',
      postgresql: 'postgresql',
      mongodb: 'mongodb',
      redis: 'redis',
      nginx: 'nginx',
      terraform: 'terraform',
      grafana: 'grafana',
      prometheus: 'prometheus',
      'google-cloud': 'googlecloud',
      cloudflare: 'cloudflare',
      vercel: 'vercel',
      stripe: 'stripe',
      figma: 'figma',
      notion: 'notion',
      jira: 'jira',
    },
  },
};

/**
 * Wanted, but not in simple-icons (removed at the trademark owner's request
 * or never added). Shipping one needs the official asset from the owner's
 * press kit and a check of their guidelines; do not draw a lookalike.
 */
export const MISSING = [
  'OpenAI',
  'LinkedIn',
  'Slack',
  'Microsoft',
  'Microsoft Teams',
  'Windows',
  'Visual Studio Code',
  'Microsoft Azure',
  'Amazon Web Services',
];

const pascal = (s) =>
  s
    .split('-')
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join('');
const camel = (s) => {
  const p = pascal(s);
  return p[0].toLowerCase() + p.slice(1);
};
const write = (p, s) => {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, s);
};

export function loadBrands() {
  const out = [];
  for (const [group, { brands }] of Object.entries(BRAND_GROUPS)) {
    for (const [name, slug] of Object.entries(brands)) {
      const key = `si${slug[0].toUpperCase()}${slug.slice(1)}`;
      const icon = si[key];
      if (!icon) throw new Error(`simple-icons ${SI_VERSION} has no "${slug}" (for ${name})`);
      out.push({
        name,
        group,
        title: icon.title,
        hex: `#${icon.hex}`,
        path: icon.path,
        source: icon.source,
        ...(icon.guidelines ? { guidelines: icon.guidelines } : {}),
      });
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

const svg = (b, fill = 'currentColor') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${fill}" role="img" aria-label="${b.title}"><path d="${b.path}"/></svg>\n`;

function build() {
  const brands = loadBrands();
  const dist = join(ROOT, 'dist', 'brands');

  for (const b of brands) {
    write(join(dist, 'svg', `${b.name}.svg`), svg(b));
    write(join(dist, 'svg-color', `${b.name}.svg`), svg(b, b.hex));
  }
  write(
    join(dist, 'brands.json'),
    JSON.stringify(
      {
        source: `simple-icons@${SI_VERSION}`,
        license: 'CC0-1.0 (geometry); the logos are trademarks of their owners, see TRADEMARKS.md',
        groups: Object.fromEntries(Object.entries(BRAND_GROUPS).map(([k, g]) => [k, g.title])),
        missing: MISSING,
        brands,
      },
      null,
      2,
    ) + '\n',
  );

  // Core: data only, no React, tree-shakeable named exports.
  write(
    join(dist, 'index.js'),
    [
      '// Generated by scripts/brands.mjs. Do not edit.',
      `// Geometry: simple-icons@${SI_VERSION} (CC0-1.0). Logos are trademarks of their owners.`,
      ...brands.map((b) => `export const ${camel(b.name)} = ${JSON.stringify(b)};`),
      `export const brands = { ${brands.map((b) => `${JSON.stringify(b.name)}: ${camel(b.name)}`).join(', ')} };`,
      'const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");',
      "export function toBrandSvg(brand, { size = 24, color = 'currentColor', colored = false, title } = {}) {",
      "  const b = typeof brand === 'string' ? brands[brand] : brand;",
      "  if (!b) throw new Error('unknown brand: ' + brand);",
      '  const fill = colored ? b.hex : color;',
      `  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + esc(size) + '" height="' + esc(size) + '" viewBox="0 0 24 24" fill="' + esc(fill) + '" role="img" aria-label="' + esc(title ?? b.title) + '"><path d="' + b.path + '"/></svg>';`,
      '}',
      '',
    ].join('\n'),
  );
  write(
    join(dist, 'index.d.ts'),
    [
      '// Generated by scripts/brands.mjs. Do not edit.',
      `export type BrandName = ${brands.map((b) => JSON.stringify(b.name)).join(' | ')};`,
      `export type BrandGroup = ${Object.keys(BRAND_GROUPS)
        .map((k) => JSON.stringify(k))
        .join(' | ')};`,
      'export interface Brand {',
      '  name: BrandName;',
      '  group: BrandGroup;',
      '  /** The brand as its owner writes it. */',
      '  title: string;',
      '  /** Official colour, `#rrggbb`. */',
      '  hex: string;',
      '  /** One path in a 24x24 viewBox, filled. */',
      '  path: string;',
      '  source: string;',
      '  guidelines?: string;',
      '}',
      ...brands.map((b) => `export declare const ${camel(b.name)}: Brand;`),
      'export declare const brands: Record<BrandName, Brand>;',
      'export declare function toBrandSvg(brand: BrandName | Brand, options?: { size?: number | string; color?: string; colored?: boolean; title?: string }): string;',
      '',
    ].join('\n'),
  );

  // React: <ClaudeLogo />, <GithubLogo colored />. The "Logo" suffix keeps them
  // from colliding with stroke icons of the same name (e.g. Github vs GithubLogo).
  const FACTORY = [
    '// Generated by scripts/brands.mjs. Do not edit.',
    "import { createElement, forwardRef } from 'react';",
    'export function createBrandIcon(displayName, brand) {',
    "  const Logo = forwardRef(function Logo({ size = 24, color = 'currentColor', colored = false, title, className, children, ...rest }, ref) {",
    "    const label = rest['aria-label'] ?? title;",
    "    return createElement('svg', { ref, xmlns: 'http://www.w3.org/2000/svg', width: size, height: size, viewBox: '0 0 24 24',",
    "      fill: colored ? brand.hex : color, className: ['bl-brand', className].filter(Boolean).join(' '),",
    "      role: label ? 'img' : undefined, 'aria-hidden': label ? undefined : true, focusable: 'false', ...rest },",
    "      title ? createElement('title', null, title) : null, createElement('path', { d: brand.path }), children);",
    '  });',
    '  Logo.displayName = displayName;',
    '  Logo.brand = brand;',
    '  return Logo;',
    '}',
    '',
  ].join('\n');
  const FACTORY_TYPES = [
    '// Generated by scripts/brands.mjs. Do not edit.',
    "import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react';",
    "import type { Brand } from './index.js';",
    "export interface BrandIconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {",
    '  size?: number | string;',
    '  /** Fill when `colored` is false. Defaults to currentColor. */',
    '  color?: string;',
    "  /** Paint the brand's official colour instead of currentColor. */",
    '  colored?: boolean;',
    '  /** Accessible name; without one the logo is aria-hidden. */',
    '  title?: string;',
    '}',
    'export type BrandIcon = ForwardRefExoticComponent<BrandIconProps & RefAttributes<SVGSVGElement>> & { brand: Brand };',
    'export declare function createBrandIcon(displayName: string, brand: Brand): BrandIcon;',
    '',
  ].join('\n');
  write(join(dist, 'react-factory.js'), FACTORY);
  write(join(dist, 'react-factory.d.ts'), FACTORY_TYPES);
  for (const b of brands) {
    const P = `${pascal(b.name)}Logo`;
    write(
      join(dist, 'react', `${b.name}.js`),
      `import { createBrandIcon } from '../react-factory.js';\nimport { ${camel(b.name)} as brand } from '../index.js';\nexport const ${P} = /* @__PURE__ */ createBrandIcon(${JSON.stringify(P)}, brand);\nexport default ${P};\n`,
    );
    write(
      join(dist, 'react', `${b.name}.d.ts`),
      `import type { BrandIcon } from '../react-factory.js';\nexport declare const ${P}: BrandIcon;\nexport default ${P};\n`,
    );
  }
  write(
    join(dist, 'react.js'),
    [
      '// Generated by scripts/brands.mjs. Do not edit.',
      "export { createBrandIcon } from './react-factory.js';",
      ...brands.map((b) => `export { ${pascal(b.name)}Logo } from './react/${b.name}.js';`),
      '',
    ].join('\n'),
  );
  write(
    join(dist, 'react.d.ts'),
    [
      '// Generated by scripts/brands.mjs. Do not edit.',
      "export { createBrandIcon } from './react-factory.js';",
      "export type { BrandIcon, BrandIconProps } from './react-factory.js';",
      ...brands.map((b) => `export { ${pascal(b.name)}Logo } from './react/${b.name}.js';`),
      '',
    ].join('\n'),
  );
  say(
    `brands: ${brands.length} logos → dist/brands/ (simple-icons@${SI_VERSION}); ${MISSING.length} not available`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    build();
  } catch (e) {
    fail(String(e.message ?? e));
    process.exit(1);
  }
}

#!/usr/bin/env node
/** Additive build stage for Burtson Icons. No third-party build dependencies. */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { say, fail } from './log.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const pascal = (s) => {
  const c = camel(s);
  return c[0].toUpperCase() + c.slice(1);
};
const write = (p, s) => {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, s);
};

// Shared runtime. Only allow inert, geometry-only nodes, including custom nodes.
const RENDER = String.raw`// Generated. ISC (c) Burtson Labs.
const allowed = {
  path: ['d'], circle: ['cx','cy','r'], ellipse: ['cx','cy','rx','ry'],
  rect: ['x','y','width','height','rx','ry'], line: ['x1','y1','x2','y2'],
  polyline: ['points'], polygon: ['points']
};
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const esc = (v) => String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
export function validateNode(node) {
  if (!Array.isArray(node) || !node.length) throw new TypeError('IconNode must be a non-empty array');
  for (const entry of node) {
    if (!Array.isArray(entry) || entry.length !== 2) throw new TypeError('Invalid icon node entry');
    const [tag, attrs] = entry;
    if (!own(allowed, tag) || !attrs || typeof attrs !== 'object' || Array.isArray(attrs)) throw new TypeError('Only SVG geometry is allowed');
    for (const [k, v] of Object.entries(attrs)) {
      if (!allowed[tag].includes(k)) throw new TypeError('Unsupported geometry attribute: ' + k);
      if (typeof v !== 'string' && typeof v !== 'number') throw new TypeError('Geometry values must be strings or numbers');
      if (typeof v === 'number' && !Number.isFinite(v)) throw new TypeError('Geometry numbers must be finite');
    }
  }
  return node;
}
function spec(options = {}) {
  const { size = 24, color = 'currentColor', strokeWidth = 2, className,
    absoluteStrokeWidth = false, title, titleId, ariaLabel, ariaLabelledby, ariaHidden } = options;
  if ((typeof size !== 'number' && typeof size !== 'string') || (typeof size === 'number' && (!Number.isFinite(size) || size <= 0))) throw new RangeError('size must be a positive number or CSS length');
  if ((typeof strokeWidth !== 'number' && typeof strokeWidth !== 'string') || (typeof strokeWidth === 'number' && (!Number.isFinite(strokeWidth) || strokeWidth < 0))) throw new RangeError('strokeWidth must be a non-negative number or CSS length');
  const named = Boolean(ariaLabel || ariaLabelledby || title);
  const hidden = ariaHidden ?? (named ? undefined : true);
  const attrs = {
    xmlns:'http://www.w3.org/2000/svg', width:size, height:size, viewBox:'0 0 24 24',
    fill:'none', stroke:color, 'stroke-width':strokeWidth, 'stroke-linecap':'round', 'stroke-linejoin':'round',
    focusable:'false', class:className,
    role: hidden === true || hidden === 'true' ? undefined : 'img',
    'aria-hidden':hidden,
    'aria-label':ariaLabel || (!ariaLabelledby && title && !titleId ? title : undefined),
    'aria-labelledby':ariaLabelledby || (!ariaLabel && title && titleId ? titleId : undefined)
  };
  return { attrs, title, titleId, absoluteStrokeWidth };
}
function attrsString(attrs) {
  return Object.entries(attrs).filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => ' ' + k + '="' + esc(v) + '"').join('');
}
export function toSvgNode(node, options = {}) {
  validateNode(node);
  const { attrs, title, titleId, absoluteStrokeWidth } = spec(options);
  const titleSvg = title ? '<title' + attrsString({ id:titleId }) + '>' + esc(title) + '</title>' : '';
  const body = node.map(([tag, a]) => '<' + tag + attrsString({ ...a, ...(absoluteStrokeWidth ? {'vector-effect':'non-scaling-stroke'} : {}) }) + ' />').join('');
  return '<svg' + attrsString(attrs) + '>' + titleSvg + body + '</svg>';
}
export function createSvgElement(node, options = {}, documentObject = globalThis.document) {
  if (!documentObject?.createElementNS) throw new Error('createSvgElement requires a DOM document');
  validateNode(node);
  const { attrs, title, titleId, absoluteStrokeWidth } = spec(options);
  const svg = documentObject.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) svg.setAttribute(k, String(v));
  if (title) {
    const el = documentObject.createElementNS(svg.namespaceURI, 'title');
    if (titleId) el.setAttribute('id', titleId);
    el.textContent = title;
    svg.appendChild(el);
  }
  for (const [tag, a] of node) {
    const el = documentObject.createElementNS(svg.namespaceURI, tag);
    for (const [k, v] of Object.entries(a)) el.setAttribute(k, String(v));
    if (absoluteStrokeWidth) el.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(el);
  }
  return svg;
}
`;

const FACTORY = String.raw`"use client";
// Generated. React is an optional peer, not bundled.
import { createElement, forwardRef, useId } from 'react';
import { validateNode } from './render.js';
const toProp = (k) => k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
export function createIcon(displayName, node) {
  validateNode(node);
  const Component = forwardRef(function BurtsonIcon({
    size = 24, color = 'currentColor', strokeWidth = 2, absoluteStrokeWidth = false,
    title, titleId, className, children,
    'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby, 'aria-hidden': ariaHidden,
    ...rest
  }, ref) {
    const instanceId = useId();
    const resolvedTitleId = titleId ?? ('bl-title-' + instanceId);
    const named = Boolean(ariaLabel || ariaLabelledby || title);
    const hidden = ariaHidden ?? (named ? undefined : true);
    const attrs = {
      ref, xmlns:'http://www.w3.org/2000/svg', width:size, height:size, viewBox:'0 0 24 24',
      fill:'none', stroke:color, strokeWidth, strokeLinecap:'round', strokeLinejoin:'round',
      className:['bl-icon', className].filter(Boolean).join(' '), focusable:'false',
      role: hidden === true || hidden === 'true' ? undefined : 'img',
      'aria-hidden':hidden, 'aria-label':ariaLabel,
      'aria-labelledby':ariaLabelledby || (!ariaLabel && title ? resolvedTitleId : undefined),
      ...rest
    };
    const content = node.map(([tag, a], key) => createElement(tag, {
      ...Object.fromEntries(Object.entries(a).map(([k,v]) => [toProp(k),v])), key,
      ...(absoluteStrokeWidth ? {vectorEffect:'non-scaling-stroke'} : {})
    }));
    if (title) content.unshift(createElement('title', { key:'title', id:resolvedTitleId }, title));
    return createElement('svg', attrs, ...content, children);
  });
  Component.displayName = displayName;
  return Component;
}
export const createBurtsonIcon = createIcon;
`;

const DOM = String.raw`
/** Replace only explicit placeholders. No automatic DOM scanning or observers. */
export function createIcons({ root = globalThis.document, attrs = {}, onMissing } = {}) {
  if (!root?.querySelectorAll) throw new TypeError('createIcons requires a DOM root');
  const elements = [...(root.matches?.('[data-burtson]') ? [root] : []), ...root.querySelectorAll('[data-burtson]')];
  const rendered = [];
  for (const el of elements) {
    // Preserve an already-rendered SVG, so repeated calls are idempotent.
    if (el.namespaceURI === 'http://www.w3.org/2000/svg') continue;
    const name = el.getAttribute('data-burtson');
    let node;
    try { node = resolveIcon(name); } catch (error) { if (onMissing) onMissing(name, el, error); continue; }
    const read = (key) => el.getAttribute(key) || undefined;
    const hidden = read('aria-hidden');
    const svg = createSvgElement(node, {
      ...attrs,
      size: read('data-size') ?? attrs.size,
      color: read('data-color') ?? attrs.color,
      strokeWidth: read('data-stroke-width') ?? attrs.strokeWidth,
      className: ['bl-icon', attrs.className, read('class')].filter(Boolean).join(' '),
      title: read('data-title') ?? attrs.title,
      ariaLabel: read('aria-label') ?? attrs.ariaLabel,
      ariaLabelledby: read('aria-labelledby') ?? attrs.ariaLabelledby,
      ariaHidden: hidden === undefined ? attrs.ariaHidden : hidden === 'true'
    }, el.ownerDocument);
    if (el.id) svg.id = el.id;
    svg.setAttribute('data-burtson', name);
    el.replaceWith(svg);
    rendered.push(svg);
  }
  return rendered;
}
`;

const TYPES = `export type IconTag = 'path'|'circle'|'ellipse'|'rect'|'line'|'polyline'|'polygon';
export type IconNode = ReadonlyArray<readonly [IconTag, Readonly<Record<string, string | number>>]>;
export interface SvgOptions {
  size?: number | string; color?: string; strokeWidth?: number | string; className?: string;
  absoluteStrokeWidth?: boolean; title?: string; titleId?: string; ariaLabel?: string;
  ariaLabelledby?: string; ariaHidden?: boolean | 'true' | 'false';
}
`;
const REACT_TYPES = `import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react';
import type { IconNode } from './types.js';
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  size?: number | string; color?: string; strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean; title?: string; titleId?: string;
}
export type Icon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;
export declare function createIcon(displayName: string, node: IconNode): Icon;
export declare const createBurtsonIcon: typeof createIcon;
`;

export function enhanceDist(root = ROOT) {
  const dist = join(root, 'dist');
  const source = join(dist, 'icons.json');
  if (!existsSync(source)) throw new Error('Run the existing build stage before enhanceDist');
  const catalog = JSON.parse(readFileSync(source, 'utf8'));
  const icons = catalog.icons;
  if (!Array.isArray(icons) || !icons.length) throw new Error('Invalid dist/icons.json');
  const iconNames = new Set();
  const identifiers = new Set();
  const aliases = {};
  const reserved = new Set(['version', 'iconNodes', 'aliases', 'toSvg', 'resolveIcon']);
  for (const icon of icons) {
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(icon.name))
      throw new Error('Unsupported export name: ' + icon.name);
    if (
      iconNames.has(icon.name) ||
      identifiers.has(camel(icon.name)) ||
      reserved.has(camel(icon.name))
    )
      throw new Error('Export collision: ' + icon.name);
    iconNames.add(icon.name);
    identifiers.add(camel(icon.name));
  }
  for (const icon of icons)
    for (const alias of icon.aliases ?? []) {
      if (Object.hasOwn(aliases, alias) || iconNames.has(alias))
        throw new Error('Alias collision: ' + alias);
      Object.defineProperty(aliases, alias, { value: icon.name, enumerable: true });
    }
  write(join(dist, 'render.js'), RENDER);
  write(join(dist, 'types.d.ts'), TYPES);
  write(
    join(dist, 'render.d.ts'),
    `import type { IconNode, SvgOptions } from './types.js';\nexport type { IconNode, SvgOptions } from './types.js';\nexport declare function validateNode(node: IconNode): IconNode;\nexport declare function toSvgNode(node: IconNode, options?: SvgOptions): string;\nexport declare function createSvgElement(node: IconNode, options?: SvgOptions, documentObject?: Document): SVGSVGElement;\n`,
  );
  write(join(dist, 'react-factory.js'), FACTORY);
  write(join(dist, 'react-factory.d.ts'), REACT_TYPES);
  const core = [`// Generated. ISC (c) Burtson Labs.`, `import { toSvgNode } from './render.js';`];
  const react = [`export { createIcon, createBurtsonIcon } from './react-factory.js';`];
  const coreTypes = [
    `import type { IconNode, SvgOptions } from './types.js';`,
    `export type { IconNode, IconTag, SvgOptions } from './types.js';`,
    `export type IconName = ${icons.map((i) => JSON.stringify(i.name)).join(' | ')};`,
    `export type IconAlias = ${
      Object.keys(aliases)
        .map((a) => JSON.stringify(a))
        .join(' | ') || 'never'
    };`,
    `export type IconKey = IconName | IconAlias;`,
  ];
  const reactTypes = [
    `export { createIcon, createBurtsonIcon } from './react-factory.js';`,
    `export type { Icon, IconProps } from './react-factory.js';`,
  ];
  for (const i of icons) {
    const c = camel(i.name),
      p = pascal(i.name);
    write(
      join(dist, 'nodes', `${i.name}.js`),
      `export const ${c} = ${JSON.stringify(i.node)};\nexport default ${c};\n`,
    );
    write(
      join(dist, 'nodes', `${i.name}.d.ts`),
      `import type { IconNode } from '../types.js';\nexport declare const ${c}: IconNode;\nexport default ${c};\n`,
    );
    write(
      join(dist, 'react', `${i.name}.js`),
      `import { createIcon } from '../react-factory.js';\nimport node from '../nodes/${i.name}.js';\nexport const ${p} = /* @__PURE__ */ createIcon(${JSON.stringify(p)}, node);\nexport default ${p};\n`,
    );
    write(
      join(dist, 'react', `${i.name}.d.ts`),
      `import type { Icon } from '../react-factory.js';\nexport declare const ${p}: Icon;\nexport default ${p};\n`,
    );
    core.push(`import { ${c} } from './nodes/${i.name}.js';`, `export { ${c} };`);
    coreTypes.push(`export { ${c} } from './nodes/${i.name}.js';`);
    react.push(`export { ${p} } from './react/${i.name}.js';`);
    reactTypes.push(`export { ${p} } from './react/${i.name}.js';`);
  }
  const registry = `{${icons.map((i) => JSON.stringify(i.name) + ':' + camel(i.name)).join(',')}}`;
  const resolveBody = `export function resolveIcon(icon) {\n  if (typeof icon !== 'string') return icon;\n  const name = Object.hasOwn(aliases, icon) ? aliases[icon] : icon;\n  if (!Object.hasOwn(iconNodes, name)) throw new Error('unknown icon: ' + icon);\n  return iconNodes[name];\n}\nexport function toSvg(icon, options) { return toSvgNode(resolveIcon(icon), options); }\n`;
  core.push(
    `export const version = ${JSON.stringify(catalog.version)};`,
    `export const iconNodes = /* @__PURE__ */ Object.freeze(${registry});`,
    `export const aliases = /* @__PURE__ */ Object.freeze(${JSON.stringify(aliases)});`,
    resolveBody,
  );
  coreTypes.push(
    `export declare const version: string;`,
    `export declare const iconNodes: Readonly<Record<IconName, IconNode>>;`,
    `export declare const aliases: Readonly<Record<IconAlias, IconName>>;`,
    `export declare function resolveIcon(icon: IconKey | IconNode): IconNode;`,
    `export declare function toSvg(icon: IconKey | IconNode, options?: SvgOptions): string;`,
  );
  write(join(dist, 'index.js'), core.join('\n') + '\n');
  write(join(dist, 'index.d.ts'), coreTypes.join('\n') + '\n');
  write(join(dist, 'react.js'), react.join('\n') + '\n');
  write(join(dist, 'react.d.ts'), reactTypes.join('\n') + '\n');
  write(
    join(dist, 'browser.js'),
    `import { createSvgElement } from './render.js';\nimport { resolveIcon } from './index.js';\nexport { toSvg, iconNodes, aliases, version } from './index.js';\nexport { createSvgElement } from './render.js';\n` +
      DOM,
  );
  write(
    join(dist, 'browser.d.ts'),
    `import type { SvgOptions } from './types.js';\nexport { toSvg, iconNodes, aliases, version } from './index.js';\nexport { createSvgElement } from './render.js';\nexport interface CreateIconsOptions { root?: Document | DocumentFragment | Element; attrs?: SvgOptions; onMissing?: (name: string, element: Element, error: unknown) => void; }\nexport declare function createIcons(options?: CreateIconsOptions): SVGSVGElement[];\n`,
  );
  const plainNodes = Object.fromEntries(icons.map((i) => [i.name, i.node]));
  const globalBody =
    RENDER.replace(/^export /gm, '') +
    `\nconst iconNodes = ${JSON.stringify(plainNodes)};\nconst aliases = ${JSON.stringify(aliases)};\nconst version = ${JSON.stringify(catalog.version)};\n` +
    resolveBody.replace(/^export /gm, '') +
    DOM.replace(/^export /gm, '');
  write(
    join(dist, 'burtson-icons.js'),
    `/*! Burtson Icons ${catalog.version} | ISC | Burtson Labs */\n(function(globalThis){\n'use strict';\n${globalBody}\nglobalThis.BurtsonIcons = Object.freeze({version, iconNodes, aliases, toSvg, createIcons, createSvgElement});\n})(globalThis);\n`,
  );
  // Static variants are for <img>. Inline SVG and CSS masks use currentColor.
  const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const inner = (node) =>
    node
      .map(
        ([t, a]) =>
          `<${t} ${Object.entries(a)
            .map(([k, v]) => `${k}="${esc(v)}"`)
            .join(' ')} />`,
      )
      .join('');
  const symbols = [];
  for (const i of icons) {
    const geometry = inner(i.node);
    for (const [directory, color] of [
      ['svg', 'currentColor'],
      ['svg-white', '#ffffff'],
      ['svg-black', '#111111'],
      ['svg-accent', '#a60ee5'],
    ]) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${geometry}</svg>\n`;
      write(join(dist, directory, i.name + '.svg'), svg);
    }
    // Put presentation on each symbol as well as the root, for external <use>.
    symbols.push(
      `<symbol id="${i.name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${geometry}</symbol>`,
    );
  }
  write(
    join(dist, 'sprite.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols.join('\n')}\n</svg>\n`,
  );
  const css = [
    `/* Burtson Icons. Use a CSS mask for a CDN icon that inherits text color. */`,
    `.bl-icon-mask{display:inline-block;width:var(--bl-icon-size,1.25em);height:var(--bl-icon-size,1.25em);flex:none;vertical-align:-.125em;background-color:currentColor;-webkit-mask:var(--bl-icon-url) center/contain no-repeat;mask:var(--bl-icon-url) center/contain no-repeat;}`,
    ...icons.map((i) => `.bl-icon--${i.name}{--bl-icon-url:url('./svg/${i.name}.svg');}`),
  ];
  write(join(dist, 'icons.css'), css.join('\n') + '\n');
  write(
    join(dist, 'release-manifest.json'),
    JSON.stringify(
      {
        version: catalog.version,
        count: icons.length,
        formats: [
          'react',
          'esm',
          'browser-global',
          'svg',
          'svg-white',
          'svg-black',
          'svg-accent',
          'sprite',
          'css-mask',
        ],
        base: '/dist/',
        cdnPublished: false,
      },
      null,
      2,
    ) + '\n',
  );
  return { count: icons.length, version: catalog.version };
}

export function enhanceSite(root = ROOT) {
  const dist = join(root, 'dist'),
    site = join(root, 'site', 'dist');
  if (!existsSync(join(site, 'index.html'))) throw new Error('Run the existing site builder first');
  if (!existsSync(join(dist, 'release-manifest.json'))) throw new Error('Run npm run build first');
  // The existing site keeps its HTML and gains the complete browser/CDN tree.
  cpSync(dist, site, { recursive: true });
  write(
    join(site, 'CDN-README.txt'),
    'This directory is a complete static site and icon CDN. Root URLs are mutable. Use a version-pinned npm CDN for immutable releases, or preserve previous version directories in your own deployment.\n',
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    if (process.argv.includes('--site')) {
      enhanceSite();
      say('Enhanced site CDN assets');
    } else {
      const result = enhanceDist();
      say(`Enhanced ${result.count} icons: React, SVG, CSS masks, browser ESM and global`);
    }
  } catch (error) {
    fail(error.message);
    process.exitCode = 1;
  }
}

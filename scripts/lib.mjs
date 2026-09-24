// Shared by validate, build, site and tests. Zero dependencies on purpose: the
// published package ships no runtime dependencies, and the tooling that builds
// it should not need any either.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const ICON_DIR = join(ROOT, 'icons');

/** The root element every icon must carry, exactly. */
export const ROOT_ATTRS = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: '24',
  height: '24',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
};

/** Geometry only. Styling lives on the root so consumers can override it. */
export const ALLOWED = {
  path: ['d'],
  circle: ['cx', 'cy', 'r'],
  ellipse: ['cx', 'cy', 'rx', 'ry'],
  rect: ['x', 'y', 'width', 'height', 'rx', 'ry'],
  line: ['x1', 'y1', 'x2', 'y2'],
  polyline: ['points'],
  polygon: ['points'],
};

export const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function listIconNames() {
  return readdirSync(ICON_DIR)
    .filter((f) => f.endsWith('.svg'))
    .map((f) => f.slice(0, -4))
    .sort();
}

export function readIcon(name) {
  const svg = readFileSync(join(ICON_DIR, `${name}.svg`), 'utf8');
  const metaPath = join(ICON_DIR, `${name}.json`);
  const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf8')) : null;
  return { name, svg, meta };
}

export function readCategories() {
  return JSON.parse(readFileSync(join(ROOT, 'categories.json'), 'utf8'));
}

function parseAttrs(src) {
  const attrs = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(src))) attrs[m[1]] = m[2];
  const leftover = src.replace(re, '').trim().replace(/\/$/, '').trim();
  return { attrs, leftover };
}

/**
 * Parse the restricted SVG dialect icons are written in: one <svg> root and
 * self-closing geometry children. Anything else is an error rather than
 * something to be clever about.
 */
export function parseIcon(svg) {
  const errors = [];
  const src = svg.replace(/<!--[\s\S]*?-->/g, '').trim();
  const open = /^<svg\b([^>]*)>([\s\S]*)<\/svg>$/.exec(src);
  if (!open) return { errors: ['file must be a single <svg>…</svg> element'], attrs: {}, children: [] };
  const { attrs } = parseAttrs(open[1]);
  const children = [];
  let body = open[2];
  const el = /<([a-zA-Z]+)\b([^>]*?)\/>/g;
  let m;
  while ((m = el.exec(body))) {
    const tag = m[1];
    const parsed = parseAttrs(m[2]);
    if (parsed.leftover) errors.push(`<${tag}> has unparseable content: ${parsed.leftover}`);
    children.push([tag, parsed.attrs]);
  }
  const rest = body.replace(el, '').trim();
  if (rest) errors.push(`only self-closing geometry elements are allowed; found: ${rest.slice(0, 80)}`);
  return { errors, attrs, children };
}

/** Every coordinate a path visits, control points included. */
export function pathPoints(d) {
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) ?? [];
  const pts = [];
  let i = 0;
  let cmd = '';
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  const num = () => Number(tokens[i++]);
  const counts = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    const up = cmd.toUpperCase();
    const rel = cmd !== up;
    if (up === 'Z') {
      x = sx;
      y = sy;
      continue;
    }
    const n = counts[up];
    if (n === undefined) throw new Error(`unknown path command ${cmd}`);
    const args = [];
    for (let k = 0; k < n; k++) args.push(num());
    if (args.some(Number.isNaN)) throw new Error(`malformed path data near command ${cmd}`);
    const bx = rel ? x : 0;
    const by = rel ? y : 0;
    if (up === 'H') {
      x = bx + args[0];
      pts.push([x, y]);
    } else if (up === 'V') {
      y = by + args[0];
      pts.push([x, y]);
    } else if (up === 'A') {
      x = bx + args[5];
      y = by + args[6];
      pts.push([x, y]);
    } else {
      for (let k = 0; k < n; k += 2) pts.push([bx + args[k], by + args[k + 1]]);
      x = bx + args[n - 2];
      y = by + args[n - 1];
    }
    if (up === 'M') {
      sx = x;
      sy = y;
      cmd = rel ? 'l' : 'L';
    }
  }
  return pts;
}

/** Points that bound one element's centreline (approximate for curves). */
export function elementPoints([tag, a]) {
  const n = (k) => Number(a[k] ?? 0);
  switch (tag) {
    case 'path':
      return pathPoints(a.d ?? '');
    case 'circle':
      return [[n('cx') - n('r'), n('cy') - n('r')], [n('cx') + n('r'), n('cy') + n('r')]];
    case 'ellipse':
      return [[n('cx') - n('rx'), n('cy') - n('ry')], [n('cx') + n('rx'), n('cy') + n('ry')]];
    case 'rect':
      return [[n('x'), n('y')], [n('x') + n('width'), n('y') + n('height')]];
    case 'line':
      return [[n('x1'), n('y1')], [n('x2'), n('y2')]];
    default: {
      const nums = (a.points ?? '').trim().split(/[\s,]+/).map(Number);
      const out = [];
      for (let k = 0; k + 1 < nums.length; k += 2) out.push([nums[k], nums[k + 1]]);
      return out;
    }
  }
}

export function toCamel(name) {
  return name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

export function toPascal(name) {
  const c = toCamel(name);
  return c.charAt(0).toUpperCase() + c.slice(1);
}

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export function nodeToInner(children) {
  return children.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${esc(v)}"`).join(' ')} />`).join('');
}

export function toSvgString(children, { size = 24, color = 'currentColor', strokeWidth = 2, extra = '' } = {}) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" ` +
    `stroke="${esc(color)}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${extra}>` +
    nodeToInner(children) +
    '</svg>'
  );
}

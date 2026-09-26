// Geometry measurement for the icon lint: samples curves and arcs so the
// bounding box, centre and stroke length of an icon are real numbers, not
// control-point guesses. Zero dependencies, like lib.mjs.

function tokens(d) {
  return d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) ?? [];
}

/**
 * Points along an SVG arc (implementation notes F.6.5 of the SVG spec).
 * @returns {Array<[number, number]>}
 */
function arcPoints(x1, y1, rx, ry, phi, fa, fs, x2, y2, steps = 16) {
  if (rx === 0 || ry === 0) return [[x2, y2]];
  const rad = (phi * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cos * dx + sin * dy;
  const y1p = -sin * dx + cos * dy;
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const sign = fa === fs ? -1 : 1;
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const coef = sign * Math.sqrt(Math.max(0, num / den));
  const cxp = coef * ((rx * y1p) / ry);
  const cyp = coef * (-(ry * x1p) / rx);
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2;
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const angle = (ux, uy, vx, vy) => {
    const dot = ux * vx + uy * vy;
    const len = Math.hypot(ux, uy) * Math.hypot(vx, vy);
    let a = Math.acos(Math.min(1, Math.max(-1, dot / len)));
    if (ux * vy - uy * vx < 0) a = -a;
    return a;
  };
  const th1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dth = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!fs && dth > 0) dth -= 2 * Math.PI;
  else if (fs && dth < 0) dth += 2 * Math.PI;
  /** @type {Array<[number, number]>} */
  const out = [];
  for (let i = 1; i <= steps; i++) {
    const t = th1 + (dth * i) / steps;
    const px = rx * Math.cos(t);
    const py = ry * Math.sin(t);
    out.push([cos * px - sin * py + cx, sin * px + cos * py + cy]);
  }
  return out;
}

/** Points along a quadratic (6 numbers) or cubic (8 numbers) Bézier. */
function bezierPoints(p, steps = 12) {
  /** @type {Array<[number, number]>} */
  const out = [];
  const cubic = p.length === 8;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    if (cubic)
      out.push([
        mt ** 3 * p[0] + 3 * mt * mt * t * p[2] + 3 * mt * t * t * p[4] + t ** 3 * p[6],
        mt ** 3 * p[1] + 3 * mt * mt * t * p[3] + 3 * mt * t * t * p[5] + t ** 3 * p[7],
      ]);
    else
      out.push([
        mt * mt * p[0] + 2 * mt * t * p[2] + t * t * p[4],
        mt * mt * p[1] + 2 * mt * t * p[3] + t * t * p[5],
      ]);
  }
  return out;
}

/**
 * Sample a path into polylines. `endpoints` are the places a command ends
 * (the coordinates a designer typed); `polylines` follow the curves.
 * @returns {{ polylines: Array<Array<[number, number]>>, endpoints: Array<[number, number]> }}
 */
export function samplePath(d) {
  const tk = tokens(d);
  const counts = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
  let i = 0;
  let cmd = '';
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let px = null;
  let py = null;
  /** @type {Array<Array<[number, number]>>} */
  const polylines = [];
  /** @type {Array<[number, number]>} */
  let cur = [];
  /** @type {Array<[number, number]>} */
  const endpoints = [];
  const flush = () => {
    if (cur.length > 1) polylines.push(cur);
    else if (cur.length === 1) polylines.push([cur[0], cur[0]]);
  };
  const num = () => Number(tk[i++]);
  while (i < tk.length) {
    if (/[a-zA-Z]/.test(tk[i])) cmd = tk[i++];
    const up = cmd.toUpperCase();
    const rel = cmd !== up;
    if (up === 'Z') {
      cur.push([sx, sy]);
      x = sx;
      y = sy;
      flush();
      cur = [[x, y]];
      px = py = null;
      continue;
    }
    const n = counts[up];
    if (n === undefined) throw new Error(`unknown path command ${cmd}`);
    const a = [];
    for (let k = 0; k < n; k++) a.push(num());
    if (a.some(Number.isNaN)) throw new Error(`malformed path data near command ${cmd}`);
    const bx = rel ? x : 0;
    const by = rel ? y : 0;
    if (up === 'M') {
      x = bx + a[0];
      y = by + a[1];
      sx = x;
      sy = y;
      flush();
      cur = [[x, y]];
      endpoints.push([x, y]);
      cmd = rel ? 'l' : 'L';
      px = py = null;
      continue;
    }
    if (up === 'L') {
      x = bx + a[0];
      y = by + a[1];
      cur.push([x, y]);
      px = py = null;
    } else if (up === 'H') {
      x = bx + a[0];
      cur.push([x, y]);
      px = py = null;
    } else if (up === 'V') {
      y = by + a[0];
      cur.push([x, y]);
      px = py = null;
    } else if (up === 'C') {
      const p = [x, y, bx + a[0], by + a[1], bx + a[2], by + a[3], bx + a[4], by + a[5]];
      cur.push(...bezierPoints(p));
      [px, py, x, y] = [p[4], p[5], p[6], p[7]];
    } else if (up === 'S') {
      const c1x = px == null ? x : 2 * x - px;
      const c1y = py == null ? y : 2 * y - py;
      const p = [x, y, c1x, c1y, bx + a[0], by + a[1], bx + a[2], by + a[3]];
      cur.push(...bezierPoints(p));
      [px, py, x, y] = [p[4], p[5], p[6], p[7]];
    } else if (up === 'Q') {
      const p = [x, y, bx + a[0], by + a[1], bx + a[2], by + a[3]];
      cur.push(...bezierPoints(p));
      [px, py, x, y] = [p[2], p[3], p[4], p[5]];
    } else if (up === 'T') {
      const c1x = px == null ? x : 2 * x - px;
      const c1y = py == null ? y : 2 * y - py;
      const p = [x, y, c1x, c1y, bx + a[0], by + a[1]];
      cur.push(...bezierPoints(p));
      [px, py, x, y] = [c1x, c1y, p[4], p[5]];
    } else if (up === 'A') {
      const x2 = bx + a[5];
      const y2 = by + a[6];
      cur.push(...arcPoints(x, y, a[0], a[1], a[2], a[3], a[4], x2, y2));
      x = x2;
      y = y2;
      px = py = null;
    }
    endpoints.push([x, y]);
  }
  flush();
  return { polylines, endpoints };
}

/**
 * Sample one element.
 * @param {[string, Record<string, string>]} element
 */
export function sampleElement([tag, a]) {
  const n = (k) => Number(a[k] ?? 0);
  const ring = (cx, cy, rx, ry, steps = 32) => {
    /** @type {Array<[number, number]>} */
    const out = [];
    for (let k = 0; k <= steps; k++) {
      const t = (k / steps) * 2 * Math.PI;
      out.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]);
    }
    return out;
  };
  switch (tag) {
    case 'path':
      return samplePath(a.d ?? '');
    case 'circle': {
      const [cx, cy, r] = [n('cx'), n('cy'), n('r')];
      return {
        polylines: [ring(cx, cy, r, r)],
        endpoints: [
          [cx - r, cy],
          [cx + r, cy],
          [cx, cy - r],
          [cx, cy + r],
        ],
      };
    }
    case 'ellipse': {
      const [cx, cy, rx, ry] = [n('cx'), n('cy'), n('rx'), n('ry')];
      return {
        polylines: [ring(cx, cy, rx, ry)],
        endpoints: [
          [cx - rx, cy],
          [cx + rx, cy],
          [cx, cy - ry],
          [cx, cy + ry],
        ],
      };
    }
    case 'rect': {
      const [x, y, w, h] = [n('x'), n('y'), n('width'), n('height')];
      return {
        polylines: [
          [
            [x, y],
            [x + w, y],
            [x + w, y + h],
            [x, y + h],
            [x, y],
          ],
        ],
        endpoints: [
          [x, y],
          [x + w, y + h],
        ],
      };
    }
    case 'line': {
      /** @type {Array<[number, number]>} */
      const pts = [
        [n('x1'), n('y1')],
        [n('x2'), n('y2')],
      ];
      return { polylines: [pts], endpoints: pts };
    }
    default: {
      const nums = (a.points ?? '')
        .trim()
        .split(/[\s,]+/)
        .map(Number);
      /** @type {Array<[number, number]>} */
      const pts = [];
      for (let k = 0; k + 1 < nums.length; k += 2) pts.push([nums[k], nums[k + 1]]);
      /** @type {Array<[number, number]>} */
      const closed = tag === 'polygon' && pts.length ? [...pts, pts[0]] : pts;
      return { polylines: [closed], endpoints: pts };
    }
  }
}

/**
 * Measure an icon: bounding box of the stroke centreline, its centre, the
 * total centreline length (visual weight), and how many typed endpoints sit
 * on the half-pixel grid.
 * @param {Array<[string, Record<string, string>]>} children
 */
export function measure(children) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let length = 0;
  let endpoints = 0;
  let onHalfGrid = 0;
  const half = (v) => Math.abs(v * 2 - Math.round(v * 2)) < 1e-6;
  for (const child of children) {
    const { polylines, endpoints: ends } = sampleElement(child);
    for (const [x, y] of ends) {
      endpoints++;
      if (half(x) && half(y)) onHalfGrid++;
    }
    for (const pl of polylines) {
      for (let k = 0; k < pl.length; k++) {
        const [x, y] = pl[k];
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        if (k > 0) length += Math.hypot(x - pl[k - 1][0], y - pl[k - 1][1]);
      }
    }
  }
  const round = (v) => Math.round(v * 100) / 100;
  return {
    bbox: [minX, minY, maxX, maxY].map(round),
    width: round(maxX - minX),
    height: round(maxY - minY),
    centre: [round((minX + maxX) / 2), round((minY + maxY) / 2)],
    length: round(length),
    endpoints,
    onHalfGrid,
  };
}

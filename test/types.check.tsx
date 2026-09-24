// Compile-only: proves the generated declarations describe the package a
// consumer actually imports. `npm run typecheck` fails if they drift.
import { toSvg, iconNodes, shieldProof, type IconName, type IconNode } from '../dist/index.js';
import { ShieldProof, createIcon, type IconProps } from '../dist/react.js';

const name: IconName = 'shield-proof';
const node: IconNode = iconNodes[name];
const a: string = toSvg(name, { size: 20, strokeWidth: 1.5, color: '#a60ee5' });
const b: string = toSvg(shieldProof);
const props: IconProps = { size: 16, absoluteStrokeWidth: true, 'aria-label': 'verified' };
const Custom = createIcon('Custom', node);
export const views = [<ShieldProof key="a" {...props} />, <Custom key="b" className="x" />, a, b];

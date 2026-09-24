// Compile-only: a consumer on the older TypeScript resolution (`node`,
// CommonJS output), which ignores package `exports`. typesVersions must still
// give it types for every subpath.
import { toSvg } from '@burtson-labs/icons';
import { ShieldProof, type IconProps } from '@burtson-labs/icons/react';
import { AgentLoop } from '@burtson-labs/icons/react/agent-loop';
import { toSvgNode } from '@burtson-labs/icons/render';

const props: IconProps = { size: 16, 'aria-label': 'verified' };
export const views = [
  <ShieldProof key="a" {...props} />,
  <AgentLoop key="b" />,
  toSvg('gpu'),
  toSvgNode,
];

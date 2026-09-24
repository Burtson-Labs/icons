import { AgentLoop, McpPort, StealthMask, WorkflowBranch } from '@burtson-labs/icons/react';

export function IconExamples() {
  return (
    <section aria-label="Burtson icon examples" style={{ color: '#a60ee5' }}>
      <StealthMask size={32} title="Burtson Icons" />
      <button type="button" aria-label="Run agent">
        <AgentLoop size={20} />
      </button>
      <McpPort size="1em" absoluteStrokeWidth title="Connected tools" />
      <span id="workflow-label">Workflow</span>
      <WorkflowBranch size={20} aria-labelledby="workflow-label" />
    </section>
  );
}

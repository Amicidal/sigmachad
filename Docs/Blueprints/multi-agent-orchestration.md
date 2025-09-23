# Multi-Agent Orchestration Blueprint

## 1. Overview
Memento started as a knowledge graph (KG) for single AI agents to query codebase context but is transitioning to an orchestration layer that spawns multiple specialized agents in parallel. This enables efficient, real-time codebase updates and verification, addressing single-agent context bloat and sequential bottlenecks. The KG serves as the shared, fresh visibility hub—agents query/update it atomically via events.

The orchestration layer coordinates agents for tasks like parsing, testing, SCM commits, and verification, with human-in-the-loop UIs (e.g., Vibe Kanban) for oversight.

## Session Coordination (New Subsection)
Multi-agent orchestration uses ephemeral Redis sessions for live handoffs—shared sessionId/keys with pub-sub (e.g., Agent A emits change, B subscribes real-time). Events (transitions/impacts) in cache (TTL 15-60 min to checkpoint); KG anchors summaries (metadata refs on clusters/specs for awareness).

- Scalability: 100+ agents via sharded Redis; bridge queries join cache + KG (e.g., "Catch up on handover impacts").
- Handoffs: Shared IDs for swarms (e.g., Agent A impls → B tests: Pub-sub notifies, query events + KG for "pass→break in cluster").
- Checkpoints: Ref-only in KG metadata; discard cache post-emit for velocity.
- Benefits: No bloat, real-time coord—enables 20+ agents on 1k tasks/day without duplication.

## 2. Current Behavior (2025-09-22)
- Single-agent flows: AI (e.g., Claude via MCP) calls tools like graph.search or /scm/commit-pr sequentially, bloating context for full implementation/verification.
- KG supports events (EventOrchestrator in domain/knowledge/knowledge-graph/) for basic coordination, but no parallel spawning.
- Verification is manual/post-hoc (e.g., pnpm test after SCM commit); no distributed completeness checks.
- Human-in-loop limited to API responses; no dedicated UI for monitoring (WebSocket exists but unused for orchestration).
- Gaps: Concurrent sessions (AGENTS.md) risk stale KG; verification bloats primary agent prompts.

## 3. Target Design
- **Orchestrator**: Application-level coordinator spawns parallel agents (Node.js workers or pnpm scripts) for subtasks, using KG for sync.
- **Specialized Agents**:
  - Parse Agent: File changes → KG update (domain/knowledge/parser).
  - Test Agent: Generate/verify tests (domain/knowledge/testing/TestEngine).
  - SCM Agent: Commit/PR with provenance (infrastructure/scm/SCMService → KG edges).
  - Verification Agent: Query KG metrics (e.g., coverage >80%, all rels linked).
- **KG Coordination**: Agents use facades (e.g., KnowledgeGraphService.createRelationship); events (e.g., "entity:updated") trigger others. Transactions ensure freshness.
- **Human-in-the-Loop**: Vibe Kanban UI (WebSocket-connected) shows task boards (e.g., cards for agents); humans approve (e.g., drag SCM to "Done") or intervene (add notes to specs).
- **Flows**:
  1. Orchestrator receives task (e.g., "Implement spec-123").
  2. Spawn: Parse (update KG), Test (plan via KG), SCM (commit if approved).
  3. Parallel run; Verification checks KG state.
  4. UI notifies human; on approval, finalize (e.g., push PR).

## 4. Implementation Notes
- **Entry Points**: application/multi-agent/Orchestrator.ts (spawns via child_process); integrate with jobs/ for scheduling.
- **Agent Scripts**: scripts/agent-*.ts (e.g., agent-parse.ts imports domain/knowledge/parser).
- **Events**: Extend KG's EventOrchestrator for agent pub/sub (e.g., via Redis in infra).
- **UI Integration**: WebSocketRouter adds /ui/task-stream; Vibe Kanban subscribes to KG events for live cards (e.g., impact previews).
- **Verification**: Use domain/knowledge/analysis for metrics (e.g., getVerificationMetrics() queries coverage/rels).
- **Local-First**: All in Docker; parallel via pnpm exec --parallel.

Example Orchestrator Snippet:
```typescript
// application/multi-agent/Orchestrator.ts
import { spawn } from 'child_process';
import { KnowledgeGraphService } from '../../domain/knowledge';

export class MultiAgentOrchestrator {
  constructor(private kg: KnowledgeGraphService) {}

  async run(tasks: { type: 'parse' | 'test' | 'scm'; params: any }[]) {
    const agents = tasks.map(({ type, params }) => {
      const agent = spawn('pnpm', ['agent', type, ...Object.values(params)], { stdio: 'pipe' });
      agent.stdout.on('data', (data) => {
        // Parse update, apply to KG
        const update = JSON.parse(data);
        this.kg.createEntity(update.entity);
        this.kg.emit(`${type}:progress`, update);
      });
      return new Promise((resolve) => agent.on('close', resolve));
    });

    await Promise.all(agents); // Parallel execution
    const metrics = await this.kg.getVerificationMetrics(); // Check completeness
    if (metrics.coverage < 80) throw new Error('Incomplete');
    return metrics;
  }
}
```

Vibe Kanban Integration Example:
```javascript
// UI (e.g., vibe-kanban WebSocket client)
const ws = new WebSocket('ws://localhost:3000/ws/ui/tasks');
ws.onmessage = (event) => {
  const task = JSON.parse(event.data); // { id: 'parse-1', status: 'running', kgImpact: { entities: 5 } }
  updateKanbanCard(task.id, task.status, task.kgImpact); // Human reviews/approves
};
ws.send(JSON.stringify({ subscribe: 'agent:progress' })); // KG events
```

## 5. Key Features
- **Parallelism**: Reduce verification time 3-5x by distributing tasks (e.g., parse + test concurrent).
- **KG Coordination**: Real-time freshness—agents share state without full context (e.g., query impacts mid-run).
- **Human-in-Loop**: Vibe Kanban for oversight—kanban visualizes agents (columns: Pending/Running/Review); approve via API (e.g., POST /ui/approve → SCM push).
- **Error Handling**: Orchestrator retries failed agents; KG rollbacks via history/checkpoints.
- **Metrics**: Track agent efficiency (e.g., KG queries/sec) for optimization.

## 6. Follow-up Tasks
- [ ] Implement Orchestrator in application/multi-agent/ (spawn via child_process; integrate EventOrchestrator).
- [ ] Create agent scripts/ (e.g., agent-parse.ts using domain/knowledge/parser).
- [ ] Add KG verification methods (domain/knowledge/analysis/getVerificationMetrics).
- [ ] Integrate Vibe Kanban: WebSocketRouter /ui/tasks endpoint; UI repo stub.
- [ ] Tests: Integration for parallel flows (e.g., mock agents, assert KG state).
- [ ] Docs: Update API docs for /orchestrate endpoint; Blueprint for Vibe Kanban UI.
- [ ] Scale: BullMQ for queued agents; handle concurrent human approvals.


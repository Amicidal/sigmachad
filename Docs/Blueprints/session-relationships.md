# Session Relationships (Ephemeral Redis Blueprint)

## 1. Overview
Session management is ephemeral in Redis cache for live multi-agent coordination—store events (modified, impacted, checkpoint) with TTL to next checkpoint (15-60 min) or fixed discard. No persistent KG nodes/edges for depth; use anchors (metadata refs on entities/clusters) for awareness. Bridge service enables graph-aware queries (e.g., transitions/isolation). Focus: Velocity for 100+ agents, zero bloat.

## 2. Current Gaps (Pre-Refresh)
- Legacy designs assumed persistent edges; now shift to cache for scale.

## 3. Desired Capabilities
1. Live events in Redis (sequences, changeInfo, stateTransition, impact) with auto-expire.
2. Sparse KG anchors for summaries (e.g., outcome/impacts on clusters).
3. Bridge for unified queries (Redis depth + KG structure).
4. Checkpoints as durable refs (metadata only); multi-agent handoffs via pub-sub.
5. Opt-in Postgres for rare persistent snapshots (failures).

## 4. Inputs & Consumers
- Inputs: SynchronizationCoordinator emits to Redis (async).
- Consumers: Agents via bridge/MCP (e.g., handover queries); checkpoints tie to KG for recovery.

## 5. Schema (Redis + KG Anchors)
- **Redis (Ephemeral)**:
  - `session:{id}`: Hash/JSON { agentIds: [], events: sorted set (seq, type: 'modified'/'broke', changeInfo: {entityIds}, impact: {}), state: 'working' }. TTL: 15-60 min or checkpoint.
  - `checkpoint:{sessionId}:{seq}`: JSON ref { timestamp, refEntities: [kgIds], summary: {impacts} }—discard after 5-10 min grace.
- **KG Anchors (Persistent, Sparse)**:
  - No nodes; entity metadata: { sessions: [{ sessionId, outcome: 'success/broken', checkpointId, keyImpacts: [ids], perfDelta }] }—array cap 5, prune >7 days.
- **Postgres (Opt-In, Rare)**: `session_snapshots` for failures (JSON dump of events).

## 6. Normalization & Flow
- Emit: Coordinator → Redis (append event, pub/sub notify agents).
- Checkpoint: On trigger (test pass), summarize to KG metadata; set Redis TTL to discard.
- Handoff: Agents share `sessionId`; pub-sub for real-time (e.g., Agent B subscribes on join).
- Bridge: Query Redis for live, KG for context; fallback to checkpoints for closed.

## 7. Query & API Surface
- Bridge Examples:
  - Transitions: Redis: ZRANGE events:{id} | filter 'pass'→'broke'; Bridge: JOIN KG (e.g., "Broke spec's cluster").
  - Isolation: Redis: HGET session:{id} | agentId filter; Bridge: Traverse anchors (e.g., "Session XYZ impacts benchmark").
- APIs: `getLiveSession(sessionId)` (Redis + KG); `getCheckpointRecovery(checkpointId)` (KG refs).
- Multi-Agent: Pub-sub channels per session (e.g., "join session for handover").

## 8. Scalability
- 100+ agents (5k sessions/day, 250k events/day): Redis Cluster (sharded by agentId, $100-500/mo); sub-ms writes/queries.
- Growth: Zero persistent (TTL discards); KG anchors <1% (1k/day refs).
- Ops: Auto-expire; monitor active_sessions via Redis INFO.

## 9. Migration
- From persistent: Migrate summaries to metadata; drop old edges.
- Velocity: Ephemeral maximizes swarms—focus live coord, discard noise.

(No temporal auditing—use Git/checkpoints for history.)

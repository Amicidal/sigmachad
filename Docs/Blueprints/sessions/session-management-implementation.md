# Session Management Implementation Blueprint

## Metadata

- Scope: sessions
- Status: Draft
- Last Updated: 2025-09-27

## Working TODO

- [ ] Add/update Scope metadata (Scope: sessions).
- [ ] Confirm Desired Capabilities with acceptance tests.
- [ ] Link to code touchpoints (packages/, api routes).
- [ ] Add migration/backfill plan if needed.

## Desired Capabilities

- [ ] Define required capabilities and acceptance criteria.
- [ ] Note API/Graph impacts.

## 1. Overview
This document details the ephemeral Redis-based session management for multi-agent coordination in Memento. Sessions capture live events (changes, state transitions like pass→break, impacts) in Redis cache with TTL (15-60 min or tied to checkpoint discard), ensuring zero long-term growth. The KG holds sparse anchors (metadata refs on entities/clusters for summaries/outcomes/checkpoints) for structural awareness. A bridge service (`SessionQueryService`) unifies queries (Redis depth + KG traversals), enabling fast isolation (e.g., "session impacts on spec") and handoffs. Opt-in Postgres snapshots for rare failures (<5%). Focus: Velocity for 100+ agents (5k sessions/day), real-time pub-sub, no bloat—aligns with agent swarms and KG core (relationships/clusters/benchmarks).

## 2. Architecture
```
Multi-Agent Emit (MCP Tool/Event) → Redis Cache (Live Events: Sorted Sets/JSON, TTL 15-60 min)
      │                                       │
      ▼                                       ▼
SynchronizationCoordinator              Pub/Sub Channels (Handoff: Agent B Subscribes Real-Time)
      │                                       │
      ▼                                       │
KG Anchors (Metadata Refs: Summaries/Outcomes) ←── Bridge Service (Queries: Redis Depth + KG Traversals)
      │                                       │
      ▼                                       │
Checkpoints (Ref-Only Metadata on Entities) ─────── Discard Redis Key (Post-TTL/Checkpoint)
      │
      └─ Opt-In Postgres (Rare Failure Snapshots: JSON Dump, Prune >30 Days)
```

- **Redis**: Ephemeral storage for active sessions (sub-ms access, auto-expire).
- **KG (FalkorDB)**: Persistent anchors (e.g., `cluster.metadata.sessions` array, cap 5) for traversals (e.g., "recent outcomes on this benchmark").
- **Bridge**: Joins for intelligent queries (e.g., detect transitions in Redis, enrich with KG impacts).
- **Postgres**: Durable but optional (only for broken sessions; ~1-5% volume).

## 3. Schema and Data Model
### Redis (Ephemeral Cache)
- **Key Structure**: Namespaced for isolation (e.g., by agentId/module).
  - `session:{sessionId}`: Redis Hash with JSON fields (batched events for efficiency, ~1-5KB/session):
    ```
    {
      "agentIds": string[] (e.g., ['agent20', 'agent21'] for multi-agent sharing),
      "state": 'working' | 'broken' | 'coordinating' | 'completed',
      "events": "ZSET" (score = sequenceNumber 1-50, member = JSON event:
        {
          "seq": number,
          "type": 'modified' | 'broke' | 'checkpoint' | 'handoff' | 'test_pass',
          "timestamp": ISODate,
          "changeInfo": {
            "elementType": 'function' | 'cluster' | 'spec' | 'benchmark',
            "entityIds": string[] (KG refs, e.g., ['cluster-ABC', 'spec-XYZ']),
            "operation": 'added' | 'modified' | 'deleted' | 'renamed',
            "affectedLines": number (approx, for context),
            "semanticHash": string (optional, for diff detection)
          },
          "stateTransition": {
            "from": 'working' | 'broken',
            "to": 'working' | 'broken',
            "verifiedBy": 'test' | 'build' | 'manual' | 'agent',
            "confidence": number (0-1, e.g., 0.95 for test-verified)
          },
          "impact": {
            "severity": 'low' | 'medium' | 'high' | 'critical',
            "testsFailed": string[] (KG testIds, e.g., ['test-123']),
            "perfDelta": number (e.g., -10 for ms regression),
            "externalRef": string (opt-in Postgres ID for failure details)
          },
          "actor": string (e.g., 'agent20' for attribution)
        }
      ),
      "currentCheckpoint": {
        "id": string (e.g., 'cp-123'),
        "refEntities": string[] (KG IDs for anchors, e.g., ['cluster-ABC']),
        "summary": { 
          "outcome": 'working' | 'broken',
          "keyImpacts": string[] (e.g., ['test-failed', 'perf-regression']),
          "perfDelta": number (aggregated)
        }
      }
    }
    ```
    - TTL: `EXPIRE session:{id} 3600` (default 1 hour); dynamic reset on activity. On checkpoint: Set to 300s (5 min grace for handoffs), then auto-DEL.
  - `events:{sessionId}`: Separate ZSET for fast ranges (score=seq, member=JSON snippet; duplicate of events in hash for query flex).
  - Pub/Sub Channels: `session:{id}` (multi-agent notifications, e.g., 'modified cluster X'—agents subscribe for real-time).

- **TTL and Discard Logic**: 
  - Default: 15-60 min (task length); reset on new events.
  - Checkpoint-Tied: On emit (e.g., test pass), aggregate summary → KG anchor → set TTL 5-10 min (handoff grace) → DEL key. Ensures discard post-recovery point.

### KG Anchors (Sparse, Persistent)
- No new node types/edges; append to `CodebaseEntity` (clusters/specs/benchmarks/functions) metadata for traversals:
  ```
  metadata: {
    sessions: Array<{  // Cap at 5 recent; prune >7 days via sync job (Cypher REMOVE old)
      sessionId: string (ref to discarded Redis key),
      outcome: 'working' | 'broken' | 'coordinated' | 'completed',
      checkpointId: string (ref for recovery, e.g., 'cp-123'),
      keyImpacts: string[] (e.g., ['test-123-failed', 'benchmark-perf-regression']),
      perfDelta: number (aggregated, e.g., -5 ms),
      actors: string[] (multi-agent, e.g., ['agent20', 'agent21']),
      timestamp: ISODate (checkpoint time),
      externalRef?: string (Postgres ID for failure snapshot, if opt-in)
    }>
  }
  ```
  - Integration: Anchors on clusters (aggregate via `MEMBER_OF_CLUSTER`), specs (`IMPLEMENTS_CLUSTER`), benchmarks (`PERFORMS_FOR`). Enables queries like "Recent session outcomes for this spec's cluster" without full history.

### Postgres (Opt-In, Rare <5% for Failures)
- `session_snapshots` table (durable fallback for broken sessions only):
  ```
  CREATE TABLE session_snapshots (
    id SERIAL PRIMARY KEY,
    sessionId VARCHAR(255),
    eventsJSON JSONB (full batched events dump),
    outcome VARCHAR(50) ('broken'),
    snapshotAt TIMESTAMP,
    externalRef VARCHAR(255) (S3 for artifacts if needed),
    INDEX on (sessionId, snapshotAt)
  );
  ```
  - Prune: >30 days (partition drop). Volume: <5% sessions (failures only), ~1-10GB/year.

## 4. Implementation Flow
1. **Session Creation** (Agent Start, e.g., MCP Tool Call):
   - Generate `sessionId` (UUID), init `session:{id}` in Redis (HSET agentIds/state).
   - Pub/sub announce (e.g., "New session for spec impl—join?").
   - TTL: 60 min initial.

2. **Event Emission** (During Workflow, e.g., Modify Cluster):
   - From `SynchronizationCoordinator` or agent: ZADD to `events:{id}` (seq++, JSON event with `changeInfo.entityIds` as KG refs).
   - Update state (HSET), pub/sub notify (e.g., "Modified cluster-ABC, impact high").
   - Reset TTL on activity.

3. **Checkpoint Trigger** (e.g., Test Pass/Build Success, Every 5-15 Min or Task End):
   - Aggregate from ZRANGE (e.g., count transitions, sum perfDelta, collect impacts).
   - Append summary to KG anchors (Cypher SET on affected entityIds).
   - Set short TTL (300s grace), then DEL keys (post-handover).
   - If `outcome = 'broken'`: Opt-in insert to Postgres snapshot.

4. **Query/Handover** (Live, via Bridge):
   - Agent queries bridge (e.g., "Get transitions for handover").
   - Bridge: Redis for events → KG for context (e.g., traverse entityIds to spec/benchmark).
   - Post-Discard: Fallback to KG anchors/checkpoints.

5. **Cleanup**: Redis auto-DEL on TTL; weekly KG prune job (REMOVE old sessions array entries >7 days).

- **Error Handling**: Retry Redis writes (exponential backoff); on failure, emit to fallback queue (Postgres). Multi-agent: Use Redis locks (SETNX) for concurrent writes.

## 5. Code Stubs
### SessionManager (Ingestion/Redis Writes)
In `@memento/core/SessionManager.ts` (called from `SynchronizationCoordinator`):
```typescript
import Redis from 'ioredis';
import { KnowledgeGraphService } from './KnowledgeGraphService';  // Existing KG

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface SessionEvent {
  seq: number;
  type: 'modified' | 'broke' | 'checkpoint' | 'handoff';
  timestamp: string;  // ISODate
  changeInfo: {
    elementType: string;
    entityIds: string[];  // KG refs
    operation: string;
    affectedLines?: number;
  };
  stateTransition?: {
    from: string;
    to: string;
    verifiedBy: string;
    confidence: number;
  };
  impact?: {
    severity: string;
    testsFailed?: string[];
    perfDelta?: number;
  };
  actor: string;  // e.g., 'agent20'
}

interface SessionAnchor {  // For KG metadata
  sessionId: string;
  outcome: string;
  checkpointId: string;
  keyImpacts: string[];
  perfDelta?: number;
  actors: string[];
  timestamp: string;
  externalRef?: string;
}

class SessionManager {
  constructor(private kg: KnowledgeGraphService) {}

  async createSession(initiatorAgent: string, initialEntityIds: string[] = []): Promise<string> {
    const sessionId = `sess-${crypto.randomUUID()}`;
    await redis.hSet(`session:${sessionId}`, {
      agentIds: JSON.stringify([initiatorAgent]),
      state: 'working',
      events: '0'  // ZSET init score
    });
    await redis.expire(`session:${sessionId}`, 3600);  // 1 hour default

    // Optional initial event
    if (initialEntityIds.length > 0) {
      await this.emitEvent(sessionId, {
        seq: 1,
        type: 'handoff',  // Or 'start'
        timestamp: new Date().toISOString(),
        changeInfo: { elementType: 'session', entityIds: initialEntityIds, operation: 'init' },
        actor: initiatorAgent
      }, initiatorAgent);
    }

    // Pub-sub announce for multi-agent join
    await redis.publish('global:sessions', JSON.stringify({ type: 'new', sessionId, initiator: initiatorAgent }));

    return sessionId;
  }

  async emitEvent(sessionId: string, event: SessionEvent, actor: string): Promise<void> {
    event.actor = actor;
    const eventJson = JSON.stringify(event);

    // Append to ZSET (score = seq for ordering)
    await redis.zAdd(`events:${sessionId}`, { score: event.seq, value: eventJson });

    // Update session (e.g., add actor if new, update state)
    const current = await redis.hGetAll(`session:${sessionId}`);
    const agents = new Set(JSON.parse(current.agentIds || '[]'));
    agents.add(actor);
    await redis.hSet(`session:${sessionId}`, {
      agentIds: JSON.stringify(Array.from(agents)),
      state: event.stateTransition?.to || current.state || 'working'
    });

    // Pub-sub for real-time multi-agent
    await redis.publish(`session:${sessionId}`, JSON.stringify({
      type: event.type,
      seq: event.seq,
      actor,
      summary: { entityIds: event.changeInfo.entityIds, impact: event.impact }
    }));

    // Reset TTL on activity (max 60 min)
    await redis.expire(`session:${sessionId}`, 3600);
    await redis.expire(`events:${sessionId}`, 3600);

    // Auto-checkpoint if seq % 10 === 0 or type='checkpoint' (e.g., every 10 events or explicit)
    if (event.type === 'checkpoint' || event.seq % 10 === 0) {
      await this.handleCheckpoint(sessionId, event.entityIds || []);
    }
  }

  private async handleCheckpoint(sessionId: string, entityIds: string[]): Promise<void> {
    // Aggregate from events (last 10-20 for summary)
    const recentEvents = await redis.zRange(`events:${sessionId}`, -20, -1, 'WITHSCORES');
    const parsedEvents = recentEvents.map(e => ({ ...JSON.parse(e.member), seq: e.score }));

    // Simple aggregate (in prod: more logic for transitions/perf)
    const outcome = parsedEvents.some(e => e.stateTransition?.to === 'broken') ? 'broken' : 'working';
    const keyImpacts = parsedEvents.filter(e => e.impact?.severity === 'high').map(e => e.changeInfo.entityIds[0]);
    const perfDelta = parsedEvents.reduce((sum, e) => sum + (e.impact?.perfDelta || 0), 0);
    const actors = JSON.parse(await redis.hGet(`session:${sessionId}`, 'agentIds') || '[]');
    const checkpointId = `cp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Append to KG anchors (sparse metadata)
    const anchor: SessionAnchor = {
      sessionId,
      outcome,
      checkpointId,
      keyImpacts,
      perfDelta,
      actors,
      timestamp: new Date().toISOString()
    };
    await this.appendKGAnchor(entityIds, anchor);

    // Grace TTL then discard
    await redis.expire(`session:${sessionId}`, 300);  // 5 min for handoffs
    await redis.expire(`events:${sessionId}`, 300);
    setTimeout(async () => {
      await redis.del(`session:${sessionId}`);
      await redis.del(`events:${sessionId}`);
    }, 300000);

    // Opt-in failure snapshot
    if (outcome === 'broken') {
      const allEvents = await redis.zRange(`events:${sessionId}`, 0, -1);
      await postgres.query(
        'INSERT INTO session_snapshots (session_id, events_json, outcome, snapshot_at) VALUES ($1, $2, $3, $4)',
        [sessionId, JSON.stringify(allEvents), outcome, new Date()]
      );
    }

    // Pub-sub 'checkpoint complete'
    await redis.publish(`session:${sessionId}`, JSON.stringify({ type: 'checkpoint_complete', checkpointId, outcome }));
  }

  private async appendKGAnchor(entityIds: string[], anchor: SessionAnchor): Promise<void> {
    const cypher = `
      UNWIND $entityIds as entityId
      MATCH (e:CodebaseEntity {id: entityId})
      SET e.metadata.sessions = CASE
        WHEN e.metadata.sessions IS NULL THEN [$anchor]
        ELSE e.metadata.sessions + [$anchor]
      END
      // Prune to last 5
      WITH e
      SET e.metadata.sessions = tail(e.metadata.sessions)[-5..]
    `;
    await this.kg.query(cypher, { entityIds, anchor });  // kg.query is FalkorDB Cypher
  }

  // Multi-agent join example
  async joinSession(sessionId: string, agentId: string): Promise<void> {
    const session = await redis.hGetAll(`session:${sessionId}`);
    if (!session.agentIds) throw new Error('Session not found');
    const agents = new Set(JSON.parse(session.agentIds));
    agents.add(agentId);
    await redis.hSet(`session:${sessionId}`, { agentIds: JSON.stringify(Array.from(agents)) });
    await redis.subscribe(`session:${sessionId}`, (message) => {
      const update = JSON.parse(message);
      // Agent handles real-time (e.g., 'modified' → re-query KG anchors)
      console.log(`Update from session ${sessionId}:`, update);
    });
  }
}

export { SessionManager, SessionEvent, SessionAnchor };
```

### SessionBridge (Queries: Redis + KG Join)
In `@memento/core/SessionBridge.ts`:
```typescript
import { SessionManager } from './SessionManager';
import { KnowledgeGraphService } from './KnowledgeGraphService';

interface TransitionResult {
  fromSeq: number;
  toSeq: number;
  changeInfo: any;
  impact: any;
  kgContext?: {  // Enriched from KG
    specTitle?: string;
    clusterName?: string;
    benchmarkDelta?: number;
  };
}

class SessionBridge {
  constructor(private sessionMgr: SessionManager, private kg: KnowledgeGraphService) {}

  async getTransitions(sessionId: string, entityId?: string): Promise<TransitionResult[]> {
    // Redis: Fetch and detect transitions
    const events = await this.sessionMgr.redis.zRange(`events:${sessionId}`, 0, -1, 'WITHSCORES');
    const parsed = events.map(e => ({ ...JSON.parse(e.member), seq: e.score as number }));

    const transitions: TransitionResult[] = [];
    for (let i = 1; i < parsed.length; i++) {
      const prev = parsed[i - 1];
      const curr = parsed[i];
      if (prev.type === 'test_pass' && curr.type === 'broke') {  // Or general 'working'→'broken'
        transitions.push({
          fromSeq: prev.seq,
          toSeq: curr.seq,
          changeInfo: curr.changeInfo,
          impact: curr.impact
        });
      }
    }

    // KG Enrichment: If entityId, traverse for context
    if (entityId && transitions.length > 0) {
      const affectedIds = transitions.flatMap(t => t.changeInfo.entityIds);
      const cypher = `
        MATCH (start:CodebaseEntity {id: $entityId})
        MATCH path = (start)-[:IMPACTS|IMPLEMENTS_CLUSTER|PERFORMS_FOR*0..2]-(related:Spec|SemanticCluster|Benchmark)
        WHERE start.id IN $affectedIds
        RETURN start.id, 
               collect(DISTINCT {
                 specTitle: coalesce((related:Spec).title, null),
                 clusterName: coalesce((related:SemanticCluster).name, null),
                 benchmarkDelta: coalesce((related:Benchmark).perfDelta, 0)
               }) as context
      `;
      const kgResults = await this.kg.query(cypher, { entityId, affectedIds });
      // Assign to transitions (match by affectedIds)
      transitions.forEach(t => {
        const match = kgResults.find(r => r.start.id in t.changeInfo.entityIds);
        if (match) t.kgContext = match.context[0];  // First match or aggregate
      });
    }

    return transitions;  // e.g., [{ fromSeq: 5, toSeq: 10, kgContext: { specTitle: 'Login Flow', benchmarkDelta: -10 } }]
  }

  async isolateSession(sessionId: string, agentId: string): Promise<any> {
    // Redis: Filter events by actor
    const events = await this.sessionMgr.redis.zRange(`events:${sessionId}`, 0, -1);
    const allParsed = events.map(e => JSON.parse(e));
    const filtered = allParsed.filter(e => e.actor === agentId);

    // KG Anchors: Get summaries for this agent/session
    const cypher = `
      MATCH (e:CodebaseEntity)
      WHERE ANY(s IN e.metadata.sessions WHERE s.sessionId = $sessionId AND s.actors CONTAINS $agentId)
      RETURN e.id, e.metadata.sessions as anchors, size(e.metadata.sessions) as impactCount
    `;
    const anchors = await this.kg.query(cypher, { sessionId, agentId });

    // Aggregate (e.g., total perfDelta)
    const totalPerfDelta = anchors.reduce((sum, a) => {
      return sum + a.anchors.reduce((s, anchor) => s + (anchor.perfDelta || 0), 0);
    }, 0);

    return {
      events: filtered,
      impacts: anchors.map(a => ({ entityId: a.e.id, anchors: a.anchors, count: a.impactCount })),
      totalPerfDelta,
      agentId
    };  // e.g., { events: [...], impacts: [{ entityId: 'cluster-ABC', count: 3 }], totalPerfDelta: -15 }
  }

  // Live Handoff Query (Multi-Agent)
  async getHandoffContext(sessionId: string, joiningAgent: string): Promise<any> {
    const session = await this.sessionMgr.redis.hGetAll(`session:${sessionId}`);
    if (!session.agentIds) throw new Error('Session not found');

    const recentEvents = await this.sessionMgr.redis.zRange(`events:${sessionId}`, -10, -1);  // Last 10
    const parsedRecent = recentEvents.map(e => JSON.parse(e));

    // KG for Context on Recent Changes
    const affectedIds = parsedRecent.flatMap(e => e.changeInfo?.entityIds || []);
    const cypher = `
      MATCH (e:CodebaseEntity {id: IN $affectedIds})
      OPTIONAL MATCH (e)-[:DEFINES|TESTS|PERFORMS_FOR]-(related:Symbol|Test|Benchmark)
      RETURN e.id, collect(related) as context, e.metadata.sessions[-1] as lastAnchor  // Recent session anchor
    `;
    const kgContext = await this.kg.query(cypher, { affectedIds });

    return {
      sessionId,
      recentChanges: parsedRecent,
      kgContext: kgContext.map(c => ({ entityId: c.e.id, related: c.context, lastAnchor: c.lastAnchor })),
      joiningAdvice: `Sync with agents: ${JSON.parse(session.agentIds).join(', ')}`
    };
  }
}

export { SessionBridge };
```

- **Usage in MCP Tools**: Expose via endpoints (e.g., `tools.getSessionTransitions(sessionId)` calls bridge.getTransitions).

## 6. KG Integration
- **Anchors Enable Traversals**: Metadata refs tie sessions to core without bloat—e.g., query impacts on clusters/specs/benchmarks.
  - **Example: Session Outcomes on Cluster** (Cypher, <100ms):
    ```
    MATCH (cluster:SemanticCluster {id: $clusterId}) -[:IMPLEMENTS_CLUSTER]-> (spec:Spec)
    OPTIONAL MATCH (cluster)<-[:MEMBER_OF_CLUSTER]-(entity:CodebaseEntity)
    WITH cluster, spec, collect(entity.metadata.sessions) as allSessions
    UNWIND allSessions as sessionsArray
    UNWIND sessionsArray as s
    WHERE s.timestamp > datetime() - duration('P7D')  // Last 7 days
    RETURN cluster.name, spec.title, 
           collect(DISTINCT s) as recentSessions,  // e.g., [{sessionId, outcome, perfDelta}]
           avg(s.perfDelta) as avgImpact,
           size([s IN recentSessions WHERE s.outcome = 'broken']) as brokenCount
    // Bridge Tie-In: For broken, call getTransitions(s.sessionId) if live (Redis) or use checkpoint ref
    ```
    - Ties to Vision: Aggregate perfDelta on `PERFORMS_FOR` benchmarks; flag if session broke spec's cluster (via `REQUIRES`).

  - **Multi-Agent Attribution**: Filter anchors by `s.actors` (e.g., "Agent 20's broken sessions on this benchmark").
  - **Sync Job Prune**: Weekly Cypher: `MATCH (e) SET e.metadata.sessions = [s IN e.metadata.sessions WHERE s.timestamp > datetime() - duration('P7D')]` (keeps <5, <1% overhead).

- **No Bloat Guarantee**: Anchors ~1k/day (1k sessions × 1-2 refs); events live-only in Redis (discard post-checkpoint). Integrates with sync (`FileWatcher` emits events if session active).

## 7. Scalability
- **100+ Agents (5k Sessions/Day, 250k Events/Day)**: Redis Cluster (3-6 nodes, sharded by sessionId/agentId, $100-500/mo)—handles 1M+ ops/day sub-ms. Pub/sub scales handoffs (no central bottleneck).
- **Growth**: Zero persistent from events (TTL discards); KG anchors <5% (~1MB/day, prune to 1-2%). Postgres opt-in <1GB/year (failures only).
- **Performance**: Writes <5ms (Redis bulk); queries <100ms (bridge: ZRANGE + 1-hop Cypher). At 1M LOC: Core KG traversals unaffected.
- **Ops**: Auto-TTL; monitor `active_sessions` via Redis INFO. Multi-agent: Sharding isolates (e.g., Agent 50's sessions in shard 5); locks (SETNX) for concurrent writes.

## 8. Multi-Agent Handoffs
- **Shared Sessions**: One ID for workflow (e.g., 5 agents on cluster refactor = 1 cache entry, `agentIds` array). Pub-sub: Agent A publishes 'modified', B/C subscribe real-time ("Join and sync impacts").
- **Example Flow**: Agent 20 starts session for spec impl → Emits events (Redis) → Agent 21 joins (subscribe, getHandoffContext) → On checkpoint (test pass), anchor to KG, discard cache → Agent 22 recovers from anchor refs.
- **Coordination**: Bridge.getHandoffContext(sessionId) for "recent changes + KG context" (e.g., "Catch up: Modified cluster-ABC, broke benchmark Y by -5ms").
- **Velocity Boost**: Real-time (no polling), shared = 2-5x faster swarms (20 agents on 1k tasks/day without duplication).

This blueprint is ready for implementation—stubs adapt to existing `SynchronizationCoordinator` and `KnowledgeGraphService`. For failures, the opt-in Postgres ensures debuggability without routine bloat. Aligns with velocity: Live coord, discard noise, KG for structure.




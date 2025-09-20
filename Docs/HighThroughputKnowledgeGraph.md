# High-Throughput Knowledge Graph Ingestion Deep Dive

## Objective and Target Load
- Goal: sustain ~10,000 changed lines of code per minute (roughly hundreds of files and symbols) while keeping the knowledge graph and derived indexes near real-time parity with the codebase.
- Current stack is optimized for single-agent editing velocity; this document contrasts today’s implementation with a proposed re-architecture suited for sustained high-churn environments.

## Current Architecture Snapshot

| Layer | Implementation (Today) | Key References |
| --- | --- | --- |
| Change Detection | In-process `FileWatcher` with 500 ms debounce and max 10 concurrent change handlers | `src/services/FileWatcher.ts:32`, `src/services/FileWatcher.ts:212` |
| Batch Triggering | App-level 1 s debounce that submits a single incremental sync at a time | `src/index.ts:92` |
| Coordination | `SynchronizationCoordinator` runs one operation serially; incremental sync loops through changes sequentially | `src/services/SynchronizationCoordinator.ts:482`, `src/services/SynchronizationCoordinator.ts:970` |
| Graph Persistence | Entities inserted per item (fallback even in bulk mode); relationship resolution performs synchronous lookups | `src/services/KnowledgeGraphService.ts:4479`, `src/services/SynchronizationCoordinator.ts:1124` |
| Embeddings | Batch size capped at 100 items with 100 ms delay between batches; falls back to per-entity writes on failure | `src/utils/embedding.ts:36`, `src/utils/embedding.ts:96` |
| Monitoring | Throughput metric computed over last 5 minutes of completed operations; no queue depth or lag instrumentation | `src/services/SynchronizationMonitoring.ts:271` |

### Observed Bottlenecks
1. **Debounce Walls:** File events sit behind two serial debounces (500 ms watcher + 1 s application) and a single outstanding job, limiting theoretical start rate to < 60 batches/min regardless of batch size.
2. **Single-Threaded Coordination:** `processQueue` blocks on every operation; incremental sync iterates per file, so a burst of changes forms an ever-growing backlog.
3. **Chatty Persistence:** Incremental updates call `createEntity`/`updateEntity` per entity and perform per-relationship target lookups, producing thousands of serialized graph DB round-trips for large edits.
4. **Embedding Coupling:** Inline embeddings (even when skipped during full sync) eventually funnel through a narrowly tuned batcher, constraining downstream throughput.
5. **Limited Instrumentation:** Lack of real-time lag/queue metrics makes scaling decisions reactive and manual.

## Re-Architecture Goals
- Drive end-to-end ingestion latency (change observed → graph updated) under 500ms (800ms with AI parsing) for most nodes and edges at the 10 k LOC/minute load.
- 
- Remove single-process chokepoints so workload scales horizontally across workers.
- Isolate heavyweight enrichment (embeddings, impact analysis) into asynchronous planes to keep core graph writes fast.
- Provide precise SLO telemetry (queue depth, processing latency, DB utilization) for autoscaling.

## Proposed Architecture (Target)

```
File Events → Event Bus → Parse Workers → Ingestion Orchestrator → Graph/Vectors
      │             │             │                  │                   │
      └── Metrics ←─┴── Backpressure └─ Change DAG ──┘        Async Enrichment ─→ Embedding Plane
```

### 1. Event Ingestion & Ordering
**Current:** In-process `FileWatcher` emits directly to coordinator after debounce.

**Future:**
- Replace direct callbacks with a durable event bus (Kafka, NATS, or Redis Streams) partitioned by namespace/module.
- Enforce ordering per partition while allowing multiple partitions to progress independently.
- Record event metadata (size deltas, diff hashes) to guide downstream batching and prioritization.

**Benefits:** Eliminates single-process bottleneck, enables replay, and allows additional watchers to scale out.

### 2. Parsing & Change Reduction
**Current:** `ASTParser.parseFile` re-parses entire files; incremental mode still walks full AST unless integration flag is set. No distributed parsing.

**Future:**
- Deploy stateless parse workers consuming bus partitions; scale worker count based on queue depth.
- Utilize structural diffs (tree-sitter incremental parsing or ts-morph incremental APIs) so cost scales with change regions, not file length.
- Emit *change fragments* (entities/relationships added/removed/updated) rather than full file payloads, tagged with dependency hints (imports, symbol references).

**Benefits:** Parsing capacity scales horizontally; downstream insertion deals with minimal deltas.

### 3. Ingestion Orchestrator & Storage Writes
**Current:** `SynchronizationCoordinator` handles dependency resolution, graph writes, and retry logic synchronously. Bulk operations limited to batches of ~60 entities, and fall back to per-entity writes on any failure.

**Future:**
- Introduce an orchestration service that builds a dependency DAG from change fragments, then dispatches micro-batches to specialized workers:
  - **Entity upsert workers:** aggregate entities per label/namespace and submit large Cypher `UNWIND` statements with retryable idempotency keys.
  - **Relationship workers:** resolve endpoints using an in-memory cache backed by Redis/Qdrant metadata; fall back to async reconciliation queue when targets missing.
- Support multi-version concurrency control by stamping batches with transaction epochs; leverage database-side pipelines (FalkorDB procedures, Postgres COPY) for high throughput.
- Persist change metadata (session, commit hash, diff stats) separately to avoid polluting core graph writes.

**Benefits:** Graph mutations become streaming-friendly, reducing round-trips and enabling safe parallelism.

### 4. Asynchronous Enrichment Plane
**Current:** Embeddings created inline (or deferred but still executed by coordinator). Failure forces per-entity fallback.

**Future:**
- Publish embedding tasks to a GPU-backed job queue with dynamic batch sizing (hundreds to thousands of entities per request) and SLA-based prioritization.
- Store embeddings and vector metadata in a write-optimized staging table before promoting to production collections to avoid read interference.
- Apply similar async handling for impact analysis, documentation extraction, and security scans.

**Benefits:** Core ingestion stays focused on structural graph consistency; enrichment scales independently based on hardware availability.

### 5. Observability & Control Loops
**Current:** `SynchronizationMonitoring` tracks completed operations, average sync time, and simple error rates; no view of in-flight backlog.

**Future:**
- Instrument queues with lag metrics (oldest event age, partition depth), worker utilization, parse latency distributions, and DB write throughput.
- Implement adaptive throttling: parser backpressure signals the watcher layer to slow commit of new events or merge adjacent changes.
- Expose dashboards/alerts tied to SLOs (e.g., “graph parity lag < 30 s at P95”).

**Benefits:** Enables automated scaling decisions and rapid detection of bottlenecks.

## Comparative Summary

| Dimension | Today | Target |
| --- | --- | --- |
| Event throughput | Limited by 1 s debounce & single operation queue | Horizontal scaling via partitioned event bus |
| Parsing cost | Full-file parse per change | Incremental diff parsing with distributed workers |
| Graph writes | Per-entity MERGE loops; small batches | Micro-batched streaming writes with idempotent bulk operations |
| Embedding latency | Inline or small batches (≤100 items) | Dedicated GPU plane with large dynamic batches |
| Failure recovery | Best-effort rollback per operation | Durable event log + idempotent batch IDs + replay pipelines |
| Telemetry | Basic operation counters | Full queue/lag metrics & autoscaling hooks |

## Migration Roadmap (High-Level)
1. **Instrumentation First**: add queue depth, operation latency, and downstream DB metrics to `SynchronizationMonitoring` to quantify baseline throughput.
2. **Externalize Change Queue**: adapt `FileWatcher` output to publish to a message bus; modify coordinator to consume from the queue while maintaining existing logic.
3. **Parallel Parse Workers**: refactor `ASTParser` usage into standalone workers; introduce diff-aware parsing and shared symbol caches.
4. **Streaming Graph Writes**: implement batch-oriented ingestion APIs in `KnowledgeGraphService` (idempotent bulk upsert endpoints), then move relationship resolution to dedicated async tasks.
5. **Async Enrichment**: decouple embeddings and heavy analyses into job queues with backpressure-aware scheduling.
6. **Autoscaling & SLOs**: use collected metrics to drive scaling policies and validate the 10 k LOC/minute target under load testing.

## Risks & Open Questions
- **Ordering Guarantees:** Need a partitioning strategy that balances throughput with correctness for inter-file relationships.
- **Namespace Isolation:** Ensure new pipelines respect namespace scoping rules identified in existing blueprint gaps (`Docs/Blueprints/knowledge-graph-service.md`).
- **Operational Complexity:** Introducing Kafka/Redis Streams and multiple worker pools increases deployment complexity; require observability/ops investment.
- **Cost Footprint:** GPU embedding planes and horizontal workers raise infrastructure costs; must align with product tiering.

---
*Prepared to guide the transition from the current single-node ingestion path toward a horizontally scalable architecture capable of sustaining sustained high-churn codebases.*

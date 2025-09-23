# Rollback Capabilities Blueprint

## 1. Overview
Rollback orchestration coordinates capture and restoration of entities, relationships, and checkpoint metadata refs across FalkorDB, PostgreSQL, Qdrant, and Redis. The service is exercised heavily by integration flows to rewind partially applied synchronization operations and to recover from pipeline failures. Recent work added an explicit `DatabaseService` readiness check so rollback routines now fail fast when core datastores are not initialized. Checkpoints are ref-only anchors (metadata summaries on entities), not full KG subgraphs, aligning with ephemeral sessions.

## 2. Current Gaps
- **Deferred dependency gating:** Prior behaviour silently attempted to capture entities/relationships even when the database layer was uninitialized, producing confusing "Database not initialized" errors deep in the stack. We now surface an explicit guard, but higher-level callers (schedulers, background jobs) still need to react with retry/backoff semantics.
- **State persistence:** Rollback points live in-memory with a best-effort cleanup policy (50 item cap). They disappear on process restart and aren't replicated across workers, limiting reliability for long-running rollback workflows.
- **Snapshot fidelity:** `createSnapshot` proxies to `createRollbackPoint`, so "snapshots" are only in-memory clones rather than durable datastore checkpoints. Large operations or multi-process restores remain risky.
- **Observability:** Error paths emit aggregated `RollbackError` entries but lack structured telemetry (operation ID, datastore component, recovery hints) needed for production dashboards.

## 3. Desired Capabilities
1. **Dependency-aware orchestration:** Promote the new initialization guard upwards so coordinators short-circuit before allocating rollback points when critical services are offline, and record explicit incidents for SRE monitoring.
2. **Durable rollback ledger:** Persist rollback metadata to PostgreSQL (or dedicated storage) with TTL policies, enabling recovery after restarts and coordinated rollbacks across clustered workers.
3. **Ref-Only Checkpoint Anchors:** Integrate with KG metadata for consistent refs (e.g., checkpoint summaries on entities like clusters); fall back to lightweight in-memory copies for tests—no full datastore snapshots.
4. **Operational telemetry:** Emit structured logs/metrics covering rollback creation, validation, execution, and failures so we can trace recovery attempts end-to-end and trigger alerts when repeated rollbacks fail.
5. **Guarded API surface:** Ensure public APIs reject rollback attempts that omit initialization checks, preventing regressions when new call sites bypass the service-level guard.

## 4. Open Questions
- Where should durable rollback metadata live—embedded in existing maintenance schemas, or in a dedicated rollback journal with retention policies?
- How can we coordinate rollback point cleanup across multiple instances to avoid double-deletes or leaked state? Would a distributed lock or ownership token suffice?
- Should snapshots support partial datastore selection (e.g., graph-only vs. relational) to reduce capture time during selective rollbacks?

## 4. Inputs & Consumers
- **Inputs**: SynchronizationCoordinator parsing cycles, SCM commit metadata, manual change annotations, rollback operations, session manager (ephemeral Redis refs only).
- **Consumers**: History APIs (`src/api/routes/history.ts`), admin dashboards, rollback service, impact analysis, compliance auditors.

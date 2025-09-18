# Temporal Relationship Blueprint

## 1. Overview
Temporal relationships (`PREVIOUS_VERSION`, `MODIFIED_BY`, `CREATED_IN`, `MODIFIED_IN`, `REMOVED_IN`, `OF`) provide the timeline backbone of the knowledge graph. They link entities to versions, sessions, and change records, enabling historical reconstruction, auditing, and rollback support.

## 2. Current Gaps
- `appendVersion`, `openEdge`, and `closeEdge` are stubs that log actions but do not persist temporal edges.
- Version nodes are partially generated but lack transactional guarantees (race conditions, missing `PREVIOUS_VERSION` chains).
- No standardized way to record change provenance (`MODIFIED_BY`, `MODIFIED_IN`); synchronization pipelines omit them.
- Query APIs lack timeline retrieval features, forcing consumers to approximate history from `lastModified` fields.
- Synchronization coordination tests reveal lifecycle operations remain stuck in `pending` when inputs are invalid, and the coordinator still depends on real database connectivity during failure modes. We need deterministic error handling/cleanup so temporal edges can transition to terminal states (`completed`/`failed`).
- Rollback integration still lacks failure-path coverage: `RollbackCapabilities Integration > Error Handling and Edge Cases > should handle database connection failures during rollback point creation` registers zero assertions because the service swallows simulated connection failures. Temporal safety depends on surfacing these errors so rollback checkpoints can be invalidated.
- The coordinator hooks time out while waiting for `clearTestData`, indicating the temporal pipelines need lightweight fixtures or mockable storage to avoid blocking integration suites.

## 3. Desired Capabilities
1. Implement transactional versioning and temporal edge lifecycle to accurately reflect when entities/relationships change.
2. Ensure each change event records provenance: which change set or session modified which entities and edges.
3. Provide accessible timeline APIs (`getEntityTimeline`, `getRelationshipTimeline`, `getChangesForSession`).
4. Support checkpointing by linking snapshots to captured subgraphs with consistent temporal metadata.

## 4. Inputs & Consumers
- **Inputs**: SynchronizationCoordinator parsing cycles, SCM commit metadata, manual change annotations, rollback operations, session manager.
- **Consumers**: History APIs (`src/api/routes/history.ts`), admin dashboards, rollback service, impact analysis, compliance auditors.

## 5. Schema & Metadata Requirements
| Field | Type | Notes |
| --- | --- | --- |
| `versionId` | string | Unique identifier for version node (`ver_<entityId>_<hash>`).
| `changeSetId` | string | Links to change entity (commit, PR, session).
| `timestamp` | Date | Precise timestamp for operations.
| `author` | string | Commit author or session agent.
| `description` | string | Optional summary of change.
| `validFrom`, `validTo` | Date | Validity interval for edges.
| `segmentId` | string | Optional identifier for edge lifespan segments (if using same ID across versions).
| `metadata.diffStats` | object | Stats about change (lines added/removed, tokens impacted).

## 6. Temporal Operation Strategy
1. **Version Creation (`appendVersion`)**:
   - Accept entity snapshot (id, hash, metadata). Create/merge `version` node with `hash`, `timestamp`, `changeSetId`.
   - Link via `OF` to entity and via `PREVIOUS_VERSION` to prior version (ordered by timestamp).
   - Optionally link version to change node (`MODIFIED_IN` or `CREATED_IN`).
2. **Edge Lifecycle (`openEdge`/`closeEdge`)**:
   - `openEdge` ensures relationship exists, sets `validFrom`, clears `validTo`, increments `version`, logs `changeSetId` when provided.
   - `closeEdge` sets `validTo`, marks `active=false`, increments `version`.
   - Both operations should run in transactions to avoid partial state (use `falkordbQuery` with multi-statement or explicit transactions).
3. **Change Provenance**:
   - For each change set (commit/session), create `change` entity node capturing metadata and link via `MODIFIED_BY`, `MODIFIED_IN`, `CREATED_IN`, `REMOVED_IN` relationships.
   - Ensure ingestion populates these links when scanning diffs or applying patches.

## 7. Persistence & Consistency Considerations
1. **Transactions**: Wrap version + edge updates per entity/change set to maintain invariants (no version gap). Consider using `FALKORDB` transaction support or emulating via steps with guards.
2. **Canonical IDs vs. Segments**:
   - Keep canonical IDs stable but maintain `version` counter and `segmentId` (if needed) for referencing specific lifespans.
   - Optionally create derived nodes representing relationship segments when multiple active periods exist; link via `HAS_SEGMENT` edges.
3. **Indexing**: Create indexes on `version.id`, `(changeSetId)`, `(validFrom)`, `(validTo)` to accelerate timeline queries.
4. **Concurrency**: Avoid race conditions by checking existing `validTo`; use locking mechanisms or idempotency keys tied to change set.

## 8. Query & API Surface
1. Implement timeline helpers:
   - `getEntityTimeline(entityId, { includeRelationships?, limit? })`: returns ordered versions and change events.
   - `getRelationshipTimeline(relationshipId)`: iterates through version counters and validity intervals.
   - `getChangesForRange({ since, until })`: lists change sets and affected entities.
2. Update History API to leverage these helpers; provide pagination and filtering (author, change type).
3. Expose timeline data to front-end/CLI for diff visualization and audit exports.

## 9. Migration & Backfill Plan
1. **Baseline Snapshot**: For existing edges, set `validFrom = firstSeenAt` (or `created` fallback) and `validTo = null`. For inactive edges, set `validTo = lastSeenAt`.
2. **Version Nodes**: Create initial version node per entity with current hash; link to entity via `OF`.
3. **Change Sets**: Optionally parse SCM history to populate `change` nodes for recent commits (can be phased).
4. **Idempotency**: Provide scripts that can be rerun without duplicating nodes (use `MERGE`).

## 10. Risks & Mitigations
| Risk | Mitigation |
| --- | --- |
| Transaction failure mid-update causing inconsistent intervals | Implement retry logic and validation checks (e.g., periodic job verifying no overlapping intervals). |
| Data volume increase due to version nodes | Cap retention (store last N versions per entity or prune old segments with archival). |
| Integration complexity with existing ingestion flows | Introduce feature flag; progressively enable per subsystem (code sync, docs, tests). |
| Backfill from SCM costly | Start with present state baseline; schedule incremental backfill if needed; allow partial coverage. |

## 11. Implementation Milestones
1. Design transaction wrappers & implement `openEdge`/`closeEdge` with tests.
2. Implement `appendVersion` storing version nodes and linking to change sets.
3. Build timeline query helpers and update API routes.
4. Execute baseline backfill; monitor metrics and data volume.
5. Expand ingestion to populate change provenance for all subsystems.

## 12. Open Questions
- Should we maintain multiple history modes (full vs. lightweight) configurable via environment variables?
- How to integrate with SCM metadata (git commit, branch) when changes originate from manual edits outside orchestrated pipeline?
- Do we need to preserve diff snapshots (content) in graph or rely on external storage and link via metadata?
- What retention/archival policy ensures graph remains performant while retaining required audit history?

# Session Relationship Blueprint

## 1. Overview
Session relationships (`SESSION_MODIFIED`, `SESSION_IMPACTED`, `SESSION_CHECKPOINT`, `BROKE_IN`, `FIXED_IN`, `DEPENDS_ON_CHANGE`) model real-time collaborative sessions and incident remediation workflows. They capture ordered events, state transitions, and impacts during an editing or debugging session.

## 2. Current Gaps
- Session edges are buffered in `SynchronizationCoordinator` but persistence ignores session-specific fields such as `sessionId`, `sequenceNumber`, `changeInfo`, and `stateTransition`.
- Canonical IDs collide (based on `from|to|type`), causing multiple events per session to overwrite each other.
- Query APIs provide no way to reconstruct session timelines or filter by session metadata.
- Integration with checkpoints is unimplemented—`SESSION_CHECKPOINT` edges do not trigger snapshot creation.

## 3. Desired Capabilities
1. Persist ordered session events with metadata capturing change details, state transitions, and impacts.
2. Ensure edges are unique per event (session + sequence) and maintain ordering guarantees.
3. Provide APIs to reconstruct session timelines, impacted entities, and checkpoints.
4. Link session checkpoints to knowledge graph snapshots for recovery and audit.
5. Support integration with history (temporal edges) and change management tools.

## 4. Inputs & Consumers
- **Inputs**: SynchronizationCoordinator events, IDE integrations, manual annotations, incident response tooling.
- **Consumers**: History/Timeline UI, Rollback service, admin dashboards, analytics on session effectiveness, automation gating (e.g., auto-tests when session impacts critical entities).

## 5. Schema & Metadata Requirements
| Field | Type | Notes |
| --- | --- | --- |
| `sessionId` | string | Unique session identifier (UUID or deterministic). Required.
| `sequenceNumber` | integer | Monotonic order within session.
| `timestamp` | Date | Event time.
| `changeInfo` | object | `{ elementType, elementName, operation, semanticHash, affectedLines }`.
| `stateTransition` | object | `{ from, to, verifiedBy, confidence, criticalChange }`.
| `impact` | object | `{ severity, testsFailed, testsFixed, buildError, performanceImpact }`.
| `eventId` | string | Optional stable ID to dedupe cross-process ingestion.
| `actor` | string | Person/agent performing change.
| `metadata.annotations` | array | Additional labels or comments.

## 6. Normalization Strategy
1. **Helper `normalizeSessionRelationship`**:
   - Require `sessionId` and `sequenceNumber`; convert to canonical formats (lowercase, trim).
   - Ensure `sequenceNumber` is integer ≥ 0; log duplicates or out-of-order events.
   - Convert `timestamp` to Date; default to ingestion time if missing.
   - Validate nested objects (`changeInfo`, `stateTransition`, `impact`) and strip unexpected keys; enforce type constraints.
   - Promote `actor`, `eventId`, `annotations` from metadata; maintain sanitized JSON.
2. Maintain instrumentation tracking sequence violations; provide metrics for session quality.
3. Compute `siteHash` combining `sessionId` + `sequenceNumber` + `changeInfo` to support canonical ID.

## 7. Persistence & Merge Mechanics
1. **Canonical ID**: `rel_session_<sha1(sessionId|sequenceNumber|type)>`. Store `sessionId`/`sequenceNumber` as scalars.
2. **Cypher Projections**: Add columns for `sessionId`, `sequenceNumber`, `timestamp`, `actor`, `eventId`, `changeInfo` JSON, `stateTransition` JSON, `impact` JSON, `annotations` JSON.
3. **Merge Rules**:
   - If duplicate event detected (same session + sequence), compare `eventId`/`timestamp` to decide whether to replace or log conflict.
   - Keep `active` semantics: session edges remain active for analytics but may not need closure; optionally mark `archived` when session completes.
4. **Indexes**: `(sessionId, sequenceNumber)`, `(sessionId, type)`, `(actor)`. Consider partial index for `eventId`.

## 8. Query & API Surface
1. Extend `getRelationships` with filters: `sessionId`, `sequenceNumberRange`, `timestampRange`, `actor`, `impact.severity`, `stateTransition.to`.
2. Provide specialized APIs:
   - `getSessionTimeline(sessionId, { limit, offset })` returning ordered events and metadata.
   - `getSessionImpacts(sessionId)` summarizing impacted entities, severity, and unresolved actions.
   - `getSessionsAffectingEntity(entityId, { since })` for incident triage.
3. Update history routes and admin UI to use these helpers, offering pagination and filtering.

## 9. Integration with Checkpoints & Temporal Data
1. When `SESSION_CHECKPOINT` emitted, trigger asynchronous job creating checkpoint via `createCheckpoint`, linking via `CHECKPOINT_INCLUDES` edges.
2. Store checkpoint metadata (hops, reason) and ensure session timeline references checkpoint ID for quick navigation.
3. Align session edges with temporal pipeline: optionally call `openEdge`/`closeEdge` when sessions start/end, or mark `validFrom/validTo` using `timestamp`.

## 10. Migration & Backfill Plan
1. Add new columns and update canonical ID; ensure feature flag to guard rollout.
2. If historical session logs exist, import them using script that enforces sequence numbers.
3. For existing placeholder edges, generate pseudo sequence numbers (order by ingestion timestamp) to avoid collisions.
4. Validate by reconstructing recent sessions via API and comparing with raw logs.

## 11. Risks & Mitigations
| Risk | Mitigation |
| --- | --- |
| Missing or non-monotonic sequence numbers from clients | Provide server-side auto-increment fallback; log warnings for upstream fixes. |
| High-volume sessions causing large edge counts | Implement retention/archival policy, e.g., compress session details after N days. |
| Checkpoint creation failures leaving dangling edges | Use retry queue with DLQ; mark edges requiring manual intervention. |
| Sensitive metadata (actors, comments) requiring access control | Store access control metadata and ensure APIs enforce permissions. |

## 12. Implementation Milestones
1. Implement normalization/persistence updates with unit tests.
2. Extend query APIs and add timeline helper endpoints.
3. Integrate checkpoint workflow and monitor for successes/failures.
4. Import historical sessions (if available) and validate with stakeholders.
5. Release dashboards/visualizations for session analytics.

## 13. Open Questions
- Should session IDs be namespaced per workspace or globally unique? How to handle concurrent sessions editing same files?
- Do we need to capture undo/redo operations or only final state transitions?
- How to represent collaborative sessions with multiple actors—separate edges per actor or aggregated metadata?
- What retention policy is acceptable for session data given privacy/compliance constraints?

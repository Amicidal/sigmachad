# Spec Relationship Blueprint

## Metadata

- Scope: knowledge-graph
- Status: Draft
- Last Updated: 2025-09-27

## Working TODO

- [ ] Add/update Scope metadata (Scope: knowledge-graph).
- [ ] Confirm Desired Capabilities with acceptance tests.
- [ ] Link to code touchpoints (packages/, api routes).
- [ ] Add migration/backfill plan if needed.

## 1. Overview
Specification edges (`REQUIRES`, `IMPACTS`, `IMPLEMENTS_SPEC`, `IMPLEMENTS_CLUSTER`) connect product requirements to implementation artifacts. They enable requirement traceability, impact analysis, and coverage tracking. For multi-file specs, prefer `IMPLEMENTS_CLUSTER` to attach refactor-resilient groups of entities, avoiding per-symbol maintenance.

## 2. Current Gaps
- Relationship query APIs (`KnowledgeGraphService.getRelationships`) still lack first-class filters for spec metadata (`impactLevel`, `priority`, `status`, acceptance criteria IDs, owner teams), limiting dashboards and automation even though the metadata is now persisted on each edge.
- Structural graph search omits specification entities when callers provide `entityTypes: ["spec"]` because the mapping table in `KnowledgeGraphService.structuralSearch` never handles the `"spec"` case; specs ingest correctly, but discovery breaks for design and test-planning workflows.
- Spec relationship identity still collapses multiple acceptance-criteria references into a single edge because `canonicalRelationshipId` ignores criterion identifiers; this prevents disambiguating inferred links from confirmed per-criterion edges.

## 3. Desired Capabilities
1. Persist structured metadata for requirement linkage: acceptance criteria IDs, rationale, priority, impact level, owning team, verification status.
2. Distinguish between inferred and confirmed relationships, preserving both without data loss.
3. Allow filtering/grouping by spec attributes (priority, impact, domain) to feed planning dashboards and gating automation.
4. Integrate with versioning to capture requirement evolution and compliance timeline.

## 4. Inputs & Consumers
- **Ingestion Sources**: Design authoring APIs (in `@memento/api`), documentation parser (domain docs), manual annotations, potential integrations with project management tools (e.g., Linear, Jira).
- **Consumers**: Impact endpoints, planning dashboards, spec coverage reports, testing automation (identify unimplemented requirements), and compliance audits.

## 5. Schema & Metadata Requirements
| Field | Type | Notes |
| --- | --- | --- |
| `impactLevel` | enum (`high`, `medium`, `low`, `critical`) | Required for prioritization; map free-form inputs.
| `priority` | enum (`critical`, `high`, `medium`, `low`) | Align with backlog tooling.
| `status` | enum (`pending`, `in-progress`, `validated`, `waived`) | Tracks lifecycle of requirement implementation.
| `confidence` | number (0-1) | Confidence in edge accuracy (e.g., heuristic vs. manual).
| `resolutionState` | enum (`inferred`, `confirmed`, `deprecated`) | Distinguish edge origin/validation.
| `acceptanceCriteriaId` | string | Unique identifier for criterion; may come from design doc anchors.
| `rationale` | string | Explanation or summary from spec.
| `ownerTeam` | string | Optional reference to team or squad.
| `metadata.links` | array | URLs or doc references supporting the relationship.
| `validatedAt`, `reviewedAt` | timestamp | Track gating events.
| `clusterId` | string | Optional ID of SemanticCluster implementing this criterion (for group-level attachment) |

## 6. Normalization Strategy
1. **Spec-edge normalization helper (follow-up)**: build a lightweight wrapper around `KnowledgeGraphService.createRelationship` for `REQUIRES`/`IMPACTS`/`IMPLEMENTS_SPEC` edges that
   - Maps free-form `impactLevel`, `priority`, `status`, and `resolutionState` inputs onto the canonical enums; surface unknown values in diagnostics but keep the metadata persisted.
   - Trims and bounds `acceptanceCriteriaId`, `ownerTeam`, and `rationale` strings (e.g., 128, 120, 2000 chars respectively) before writing them back so downstream queries stay indexable.
   - Normalizes acceptance-criteria metadata into `{ acceptanceCriteriaId, acceptanceCriteriaIds }` while preserving the raw array in `metadata.origins` for auditability.
2. **Evidence Handling**: When design doc references specific text or code blocks, continue capturing them via `EdgeEvidence` entries (`source="docs-parser"`); the helper above should ensure evidence arrays are deduplicated and capped.
3. **Validation**: Enforce presence of base spec ID and target entity, and warn when acceptance criteria are duplicate or missing unique anchors so authors can correct documents before confirmation.

## 7. Persistence & Merge Mechanics
1. **Canonical Identity**:
   - Current behavior hashes `specId|normalizedTarget|type`; follow-up is to append an acceptance-criterion hash when the metadata supplies a concrete criterion so that separate confirmations do not collide.
   - Maintain ability to aggregate heuristics vs. confirmed edges by storing `resolutionState`. When merging, prefer `confirmed` metadata.
2. **Cypher Projection**: Add fields `impactLevel`, `priority`, `status`, `confidence`, `resolutionState`, `acceptanceCriteriaId`, `rationale`, `ownerTeam`, `validatedAt`, `reviewedAt`, `links` JSON.
3. **Conflict Resolution**: If a heuristic edge exists and a confirmed edge arrives, update metadata to reflect confirmation while retaining heuristic evidence (store both in `metadata.origins`).
4. **Indexes**: Create indexes for `(type, impactLevel)`, `(type, priority)`, `(acceptanceCriteriaId)`, and optionally `resolutionState` for efficient queries.

## 8. Query & API Surface
1. Extend `getRelationships` to include filters: `impactLevel`, `priority`, `status`, `ownerTeam`, `resolutionState`, `validatedBefore/After`, and acceptance-criteria IDs. Ship REST/TRPC parameter plumbing alongside the server change so planning and dashboard clients can opt-in immediately.
2. Update structural graph search to map `entityTypes: ["spec"]` onto the stored spec entity shape (type=`"spec"`, kind=`"spec"`), and add an integration test that exercises spec lookup right after ingest.
3. Add helper APIs:
   - `getSpecCoverage(specId)` returning attached entities grouped by status.
   - `getSpecsAffectingEntity(entityId, { statusFilter })` for gating flows.
   - `getHighImpactSpecs({ limit, team })` to power dashboards.
   - `getSpecClusters(specId)` returning attached clusters and member entities for implementation overview.
4. Document additional parameters in API docs, providing sample queries for planning tools.
5. Provide GraphQL/trpc schema updates if relevant to front-end clients.

## 9. Temporal & Auditing
1. Integrate with history pipeline: when spec changes, append version snapshot, reopen edges as needed, set `validFrom/validTo` to mirror requirement lifecycle.
2. Track `validatedAt`, `reviewedAt`, and optionally a `statusHistory` array capturing decision events (manual approvals, waivers).
3. Provide timeline queries to show how requirements progressed over time, e.g., `getSpecTimeline(specId)` returning edges with version segments.

## 10. Migration & Backfill Plan
1. **Data Model Update**: Add new columns/properties as needed, and introduce the acceptance-criterion-aware canonical ID behind a feature flag so we can shadow-write and validate before cutting over.
2. **Reingestion**: Run design/doc parsing pipeline to populate new metadata, generating acceptance-criteria IDs if missing (use doc anchor or hashed text).
3. **Manual Data Import**: Provide script to import status/ownership from planning tool exports (CSV/JSON).
4. **Validation Run**: Produce audit report comparing new edges vs. previous counts (delta of heuristics vs. confirmed) to flag drops.

## 11. Risks & Mitigations
| Risk | Mitigation |
| --- | --- |
| Duplicate acceptance-criteria IDs causing collisions | Generate deterministic IDs from doc heading + index; fallback to UUID and store mapping. |
| Overwriting confirmed metadata when heuristics rerun | Merge logic prioritizes `resolutionState='confirmed'`; do not downgrade without explicit signal. |
| Query performance degrade due to new filters | Add indexes and `SKIP/LIMIT` defaults; consider caching aggregated reports. |
| Data staleness when specs change outside pipeline | Integrate with version-control hooks or manual sync command to reingest docs. |

## 12. Implementation Milestones
1. Implement the spec-edge normalization helper and targeted tests covering enum coercion, acceptance-criteria promotion, and evidence deduplication.
2. Introduce the acceptance-criterion-aware canonical ID behind a feature flag, run shadow writes, and flip once collision metrics stay flat.
3. Extend `getRelationships` (and public APIs) with spec metadata filters, update client typings, and document usage.
4. Patch structural search to surface spec entities for `entityTypes: ["spec"]`, and add integration coverage for immediate post-ingest lookup.
5. Rerun reingestion/backfill jobs to populate normalized metadata and acceptance identities, then roll out dashboards/alerts that rely on the richer query surface.

## 13. Open Questions
- Should we model `ownerTeam` as separate entity node to support richer queries (team hierarchies)?
- How do we reconcile spec edges across branches/environments? Do we maintain environment-specific relationships?
- What governance process is needed to manually override `priority`/`impactLevel` and keep history of changes?
- How should archived/retired specs be represented—deactivate edges or move to separate type?

**Cluster-based Implementation Retrieval:**
```
MATCH (spec:Spec {id: $specId})-[:IMPLEMENTS_CLUSTER]->(cluster:SemanticCluster)
OPTIONAL MATCH (cluster)<-[:MEMBER_OF_CLUSTER]-(entity:CodebaseEntity)
RETURN spec, cluster, collect(entity) as clusterMembers
```

# Spec Relationship Blueprint

## 1. Overview
Specification edges (`REQUIRES`, `IMPACTS`, `IMPLEMENTS_SPEC`) connect product requirements to implementation artifacts. They enable requirement traceability, impact analysis, and coverage tracking throughout the development lifecycle.

## 2. Current Gaps
- Spec ingestion (design routes, documentation parsing) emits metadata such as `impactLevel`, `priority`, acceptance-criteria references, and heuristic confidence, but the persistence layer discards these details.
- All spec relationships share the same canonical ID (`specId|entityId|type`), so heuristic reruns overwrite human-verified metadata, and multiple acceptance-criteria mappings collide.
- Query APIs lack filters for spec attributes, limiting dashboards and planning tools.
- Temporal history is unavailable: no trace of when a requirement was satisfied, re-opened, or modified.
- Impact analysis endpoints (`src/api/routes/impact.ts`) now lift spec relationship metadata into risk scoring and recommendations, but the broader query surface still lacks filters/aggregations by `impactLevel`, `priority`, and acceptance-criteria status for dashboards and automation.
- Graph search (`POST /api/v1/graph/search`) does not index freshly recorded specs; even immediately after a successful design ingest, the search response returns an empty `entities` array. The end-to-end integration suite relies on this lookup to confirm that specs round-trip through the graph, so we need to plug spec ingestion into the search index (or provide a fallback query) before the workflow can pass.
- The design authoring endpoint (`POST /api/v1/design/generate`) is still a stub that ends up returning HTTP 500. REST integration tests expect a generated spec identifier and persisted spec relationships, so the blueprint should track the remaining work to wire templating, storage, and graph publication.
- Spec identifiers have transitioned to UUIDs (to satisfy the `documents.id` UUID column); clients and tests assuming legacy `spec_<timestamp>` keys must be updated.
- MCP-driven spec creation does not currently populate `KnowledgeGraphService.getEntity` with the new spec. Test planning now falls back to database hydration, but the graph ingestion path needs to be restored so planning and search operate on graph data instead of heuristic fallbacks.

## 3. Desired Capabilities
1. Persist structured metadata for requirement linkage: acceptance criteria IDs, rationale, priority, impact level, owning team, verification status.
2. Distinguish between inferred and confirmed relationships, preserving both without data loss.
3. Allow filtering/grouping by spec attributes (priority, impact, domain) to feed planning dashboards and gating automation.
4. Integrate with versioning to capture requirement evolution and compliance timeline.

## 4. Inputs & Consumers
- **Ingestion Sources**: Design authoring APIs (`src/api/routes/design.ts`), documentation parser (domain docs), manual annotations, potential integrations with project management tools (e.g., Linear, Jira).
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

## 6. Normalization Strategy
1. **Helper `normalizeSpecRelationship`** invoked from service normalization pipeline:
   - Map enumerations from user input (case-insensitive) to canonical enums; log unknown values.
   - Trim and bound string lengths (e.g., `acceptanceCriteriaId` 128 chars, `rationale` 2000 chars).
   - Promote `confidence`, `rationale`, `ownerTeam`, `status`, `links` from metadata to top-level fields; maintain metadata copy.
   - Store `resolutionState` with precedence: manual confirmations override heuristics; record `verifiedBy` when available.
2. **Evidence Handling**: When design doc references specific text or code block, capture via `EdgeEvidence` entries (source=`docs-parser`).
3. **Validation**: Reject relationships missing base spec ID or target entity; warn when acceptance criteria are duplicate or missing unique IDs.

## 7. Persistence & Merge Mechanics
1. **Canonical Identity**:
   - Extend canonical ID to include acceptance-criteria hash when provided (`rel_hash(spec|entity|type|criterion)`). Use environment flag for migration.
   - Maintain ability to aggregate heuristics vs. confirmed edges by storing `resolutionState`. When merging, prefer `confirmed` metadata.
2. **Cypher Projection**: Add fields `impactLevel`, `priority`, `status`, `confidence`, `resolutionState`, `acceptanceCriteriaId`, `rationale`, `ownerTeam`, `validatedAt`, `reviewedAt`, `links` JSON.
3. **Conflict Resolution**: If a heuristic edge exists and a confirmed edge arrives, update metadata to reflect confirmation while retaining heuristic evidence (store both in `metadata.origins`).
4. **Indexes**: Create indexes for `(type, impactLevel)`, `(type, priority)`, `(acceptanceCriteriaId)`, and optionally `resolutionState` for efficient queries.

## 8. Query & API Surface
1. Extend `getRelationships` to include filters: `impactLevel`, `priority`, `status`, `ownerTeam`, `resolutionState`, `validatedBefore/After`.
2. Add helper APIs:
   - `getSpecCoverage(specId)` returning attached entities grouped by status.
   - `getSpecsAffectingEntity(entityId, { statusFilter })` for gating flows.
   - `getHighImpactSpecs({ limit, team })` to power dashboards.
3. Document additional parameters in API docs, providing sample queries for planning tools.
4. Provide GraphQL/trpc schema updates if relevant to front-end clients.

## 9. Temporal & Auditing
1. Integrate with history pipeline: when spec changes, append version snapshot, reopen edges as needed, set `validFrom/validTo` to mirror requirement lifecycle.
2. Track `validatedAt`, `reviewedAt`, and optionally a `statusHistory` array capturing decision events (manual approvals, waivers).
3. Provide timeline queries to show how requirements progressed over time, e.g., `getSpecTimeline(specId)` returning edges with version segments.

## 10. Migration & Backfill Plan
1. **Data Model Update**: Add new columns/properties; ensure backward compatibility until clients updated.
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
1. Implement normalization helper & tests.
2. Update persistence layer with new columns; migrate canonical ID with feature flag.
3. Extend querying APIs and document usage.
4. Deploy reingestion pipeline and validate metrics.
5. Roll out dashboards/alerts leveraging new data.

## 13. Open Questions
- Should we model `ownerTeam` as separate entity node to support richer queries (team hierarchies)?
- How do we reconcile spec edges across branches/environments? Do we maintain environment-specific relationships?
- What governance process is needed to manually override `priority`/`impactLevel` and keep history of changes?
- How should archived/retired specs be represented—deactivate edges or move to separate type?

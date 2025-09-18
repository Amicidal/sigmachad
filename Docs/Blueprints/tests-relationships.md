# Tests Relationship Blueprint

## 1. Overview
Testing edges (`TESTS`, `VALIDATES`) connect automated tests to code and specs so that impact analysis, coverage insights, and regression triage can be grounded in graph data. The goal is to elevate these edges to parity with code-edge richness—persisting structured metadata, supporting temporal history, and enabling precise querying.

## 2. Current Gaps
- Persistence only retains `from`, `to`, and `type`; fields such as `testType`, `coverage`, or `suiteId` emitted by `TestEngine` (`src/services/TestEngine.ts:317-350`) are dropped.
- Canonical IDs are purely `from|to|type`, so multiple suites targeting the same implementation overwrite each other, erasing granularity.
- Query helpers (`getRelationships`) expose only code-edge-centric filters, preventing clients from retrieving tests by type, suite, or coverage thresholds.
- Temporal helpers are stubs—no preserved history of when a test started or stopped covering an entity; flaky detection pipelines have nothing to build on.
- Integration suites (`tests/integration/api/*.integration.test.ts`) still depend on real FalkorDB/Qdrant/PostgreSQL instances via `tests/test-utils/database-helpers.ts`. In sandboxed or containerized runs the bootstrap fails with `EPERM connect ...:6380`, so there is no in-memory test double to validate these relationships offline.
- Admin API compatibility for legacy `/api/v1/admin/**` routes is undocumented; when aliases were trimmed, the integration suite started returning `404` and masked the intended `503` signal for critical health failures. Document and enforce the alias contract (including 503 semantics for unhealthy components) so routing refactors keep the admin coverage intact.
- Unit tests referencing legacy paths/response shapes (e.g., `tests/unit/api/routes/impact.test.ts:95-165`) will keep failing until they are updated to reflect the graph-backed APIs described here.
- Integration runs of `TestEngine` show core persistence gaps: bulk result ingestion fails with `null value in column "test_id"`, large-result-set scenarios short-circuit before asserting, and historical trend calculations don't emit any data. The current suite (`Test Result Recording > should record test suite results to database`, `Coverage Analysis > should aggregate coverage from multiple tests`, `File-based Test Processing > should parse and record test results from file`) returns `null` entities or zero assertions. The engine needs deterministic test ID assignment and fixture seeding before historical/test-impact edges can be relied upon.
- Flaky analysis persistence still expects the trimmed columns (`failureCount`, `lastFailure`, `failurePatterns`). `TestEngine` now emits richer analytics (score, rates, recommendations) and forwards them verbatim, so PostgreSQL writers must be updated to denormalise or map the extended schema instead of dropping data.
- `TestResultParser` still extracts suite metadata via regex heuristics and misses canonical names for JUnit inputs; align implementation with XML parsing so suite identifiers persist alongside per-test results.
- MCP integration currently leaks Fastify validation errors (`code: "FST_ERR_VALIDATION"`, string `message`s) instead of JSON-RPC-spec error objects. Invalid/batch requests and notification flows therefore fail the MCP compliance suite, which expects numeric `code` + `message` pairs and `200` responses for notifications. We need a transport adapter that wraps Fastify validation failures (and tool errors) in proper MCP error envelopes before these workflows can pass.
- Running the MCP protocol/compliance integration suite still assumes a local FalkorDB/Redis instance is listening on `redis://localhost:6380`. When the service is absent the health check in `setupTestDatabase` fails and Vitest skips the entire suite. Document the dependency in the test harness and provide either a lightweight stub or container recipe so the CI/DEV environments can bring FalkorDB up before exercising MCP tests.

## 3. Desired Capabilities
1. Persist test metadata (type, suite, run identifiers, coverage percentages, confidence) both as scalar properties and in structured metadata JSON.
2. Support multiple distinct edges per entity pair (e.g., integration test vs. unit test, different suites) without collisions.
3. Allow consumers to filter by test attributes (`testType`, `suiteId`, `lastSeenAt`, `coverageMin`, `flakyScore`, etc.).
4. Integrate with temporal pipeline: track first/last seen, detect when coverage disappears, and support historical queries.
5. Provide hooks for attaching evidence (test run artifacts, failure traces) and linking to checkpoints or sessions.

## 4. Inputs & Consumers
- **Ingestion Sources**: Test engine execution results, CI integrations, manual annotations for spec validation. Additional future sources include flaky-test detectors and telemetry from external services.
- **Downstream Consumers**: Impact API (`src/api/routes/impact.ts`), tests API (`src/api/routes/tests.ts`), admin dashboards, IDE integrations surfacing coverage, and automation (rerun impacted tests).

## 5. Schema & Metadata Requirements
| Field | Type | Notes |
| --- | --- | --- |
| `testType` | enum (`unit`, `integration`, `e2e`, `snapshot`, `perf`) | Normalize to canonical set; allow extensibility via metadata.
| `suiteId` | string | Stable identifier for test suite or group.
| `runId` | string | Optional reference to test run entity; should map to execution node.
| `coverage` | number (0-1) | Clamp and store two decimal precision; fallback to `null` when unknown.
| `flaky` | boolean | Derived from run history; optional.
| `confidence` | number (0-1) | Quality of mapping between test and entity/spec.
| `evidence` | array | Links to run artifacts, failure traces (reuse `EdgeEvidence`).
| `why` | string | Explanation (e.g., "matched via acceptance criterion A1").
| `metadata.additional` | object | Room for language/framework specifics (e.g., jest test path).

## 6. Normalization Strategy
1. **Dedicated Helper**: Implement `normalizeTestRelationship` called from `KnowledgeGraphService.normalizeRelationship` (`src/services/KnowledgeGraphService.ts:425-456`). Responsibilities:
   - Map incoming `testType` strings to enum; log/collect metrics for unknown values.
   - Sanitize `suiteId`, `runId` to max lengths (e.g., 256 chars), remove whitespace.
   - Clamp `coverage` to `[0,1]`, round to 3 decimals; if missing but `passed=true`, allow null.
   - Promote `confidence`, `flaky`, `runId` from metadata to top-level; maintain `metadata` copy.
   - Ensure `evidence` uses `EdgeEvidence` schema, merging with existing entries via `mergeEdgeEvidence`.
2. **Validation**: If required fields absent (e.g., `suiteId` missing for automated runs), emit warning and supply default (`unknown-suite`). Provide instrumentation counters.
3. **Site Hash Update**: Incorporate `suiteId` and test file path into `siteHash` computation to disambiguate edges coming from same test file but different suites.

## 7. Persistence & Merge Mechanics
1. **Canonical ID**: Extend `canonicalRelationshipId` for tests to include deterministic suffix derived from `suiteId` + `testName` (or upstream `testId`). Optionally guard behind env flag to ease migration.
2. **Cypher Writes**: Augment `createRelationship`/`createRelationshipsBulk` to project test-specific columns: `testType`, `suiteId`, `runId`, `coverage`, `flaky`, `confidence`, `why`, `evidence`, `locations`, `firstSeenAt`, `lastSeenAt`.
3. **Aggregation Rules**:
   - When merging duplicate edges (same canonical id), accumulate `occurrencesScan` per run and update coverage as weighted average (store `coverageSamples` count to compute).
   - Preserve best (max) confidence; maintain `statusHistory` array for test status (pass/fail counts) in metadata.
4. **Auxiliary Nodes**: Optionally dual-write `test_run` nodes to capture run-level metadata; link via `EVIDENCE_OF` edges. This mirrors existing evidence dual write for code edges.
5. **Indexes**: Create indexes on `(type, suiteId)`, `(type, testType)`, `(runId)` to keep queries fast.

## 8. Query & API Surface
1. **`getRelationships` Enhancements**: Add filters for `testType`, `suiteId`, `runId`, `coverageMin/Max`, `confidenceMin/Max`, `flaky`, `lastSeenSince`, `status`.
2. **Helper APIs**:
   - `getTestsForEntity(entityId, { includeSpecs?: boolean, limit?: number })` returning structured objects with test metadata.
   - `getCoverageSummary(entityId)` aggregating coverage values and run counts.
   - `getTestsBySuite(suiteId)` for dashboards.
   - `getFlakyTestAnalysis(entityId)` now retrieves execution history from PostgreSQL, scores flakiness via `TestEngine`, and powers `/api/tests/flaky-analysis/:entityId` responses.
3. **API Documentation**: Update `Docs/MementoAPIDesign.md` to describe parameters and example payloads.
4. **Caching**: Evaluate caching of frequent queries (e.g., impacted tests) with invalidation triggered by new edges.

## 9. Temporal & Auditing
1. On ingestion, call revised `openEdge`/`closeEdge` to maintain valid intervals for tests. When a test stops covering an entity (not emitted during scan), mark inactive and set `validTo`.
2. Keep `firstSeenAt`/`lastSeenAt` accurate using per-run timestamps; store `lastPassAt`, `lastFailAt` scalars for quick health checks.
3. Support timeline queries (`getTestCoverageTimeline`) returning historical `coverage` and status events for analytics.

## 10. Migration & Backfill Plan
1. **Phase 1**: Migrate schema to include new columns. Backfill existing edges with defaults (e.g., `testType='unknown'`, `coverage=null`, `suiteId='legacy'`).
2. **Phase 2**: Trigger re-run of `TestEngine` ingestion to republish edges with full metadata. Provide script to reconcile duplicates by generating suite/test IDs.
3. **Phase 3**: Populate historical data (if available) from CI logs to seed `statusHistory` and `lastPassAt` fields.
4. Provide idempotent scripts and record metrics during migration to catch anomalies.

## 11. Risks & Mitigations
| Risk | Mitigation |
| --- | --- |
| Canonical ID change causes duplicate edges | Use feature flag and cleanup job to retire old ids post-migration. |
| Coverage data missing for older runs | Default to `null`, add reprocessing job when coverage provider integrated. |
| Query complexity impacts performance | Add targeted indexes and caching; monitor query stats post-release. |
| Evidence arrays grow large | Enforce cap (20 items) and compress older artifacts into dedicated nodes. |

## 12. Implementation Milestones
1. **Milestone A**: Implement normalization helper + unit tests.
2. **Milestone B**: Update persistence layer & migrations; deploy behind feature flag.
3. **Milestone C**: Extend queries/APIs and document usage.
4. **Milestone D**: Enable temporal tracking and finalize migration.
5. **Milestone E**: Roll out dashboards and monitor instrumentation.

## 13. Open Questions
- Should manual QA or exploratory tests be represented differently (e.g., `testType='manual'`)?
- Do we need to model flaky probability explicitly (`flakyScore`) or infer from `statusHistory`?
- How should we handle parameterized tests that map to multiple entities—multiple edges or aggregated metadata?
- What retention policy is required for test evidence artifacts to balance storage and auditability?

# TODO

## Project Snapshot
- **Product**: Memento – local-first AI coding assistant with Fastify API, knowledge graph (FalkorDB), vector DB (Qdrant), and PostgreSQL metadata store.
- **Primary Modules**: `src/api` (REST/MCP/WebSocket layer), `src/services` (KnowledgeGraphService, TestEngine, Synchronization, SecurityScanner), `Docs/` (design + blueprints).
- **Key Documents to Review First**:
  - `Docs/MementoAPIDesign.md`
  - `Docs/Blueprints/tests-relationships.md`
  - `Docs/Blueprints/spec-relationships.md`
  - `MementoImplementationPlan.md`
- **Skill Stack**: TypeScript (ESM), Fastify, tRPC, Neo4j-like queries via FalkorDB, PostgreSQL, Vitest.
- **Known State**: Impact API and test-planning endpoints are stubbed; flaky-analysis endpoint ignores persisted data; several tests reference legacy responses; build artefacts tracked in git.

## How To Engage
1. **Set Up**: `pnpm install`, run services via `pnpm docker:up` if needed (FalkorDB/Qdrant/Postgres/Redis).
2. **Dev Commands**: `pnpm dev` (API), `pnpm test`, `pnpm test:integration` (after wiring integration suite), `pnpm smoke` for basic health.
3. **Docs First**: Skim the blueprints and API design sections cited in each task—they define expected shapes/behaviours.
4. **Testing Philosophy**: Update/extend Vitest suites under `tests/` alongside code changes; ensure failing legacy tests are reconciled.
5. **Deployment Goal**: Reach the “shippable” bar defined in `MementoImplementationPlan.md` Phase 6+.

## Task Backlog

### 1. Implement Graph-Backed Impact Analysis APIs
- **Context**: API design promises detailed impact results (`Docs/MementoAPIDesign.md:485-536`), but `src/api/routes/impact.ts` still responds with placeholders (mirrored in the updated spec blueprint).
- **Entry Points**:
  - REST handlers in `src/api/routes/impact.ts`
  - Graph orchestration in `src/services/KnowledgeGraphService.ts`
  - Supporting models in `Docs/Blueprints/spec-relationships.md`
- **Scope**:
  - Add graph traversal helpers (direct, cascading, test, documentation impacts) inside `KnowledgeGraphService` with corresponding unit tests under `tests/unit/services/`.
  - Replace placeholder route logic with real data assembly; expose consistent structures for REST + MCP.
  - Document the behaviour in `Docs/MementoAPIDesign.md` and `API_DOCUMENTATION.md` using actual sample payloads.
  - Create/refresh tests: update `tests/unit/api/routes/impact.test.ts`, add integration coverage under `tests/integration/impact/` hitting a seeded in-memory graph or test containers.
- **Acceptance**: Endpoint returns populated data, tests cover happy/pathological cases, documentation aligns with responses.

### 2. Deliver Spec-Aware Test Planning Output
- **Context**: `/api/tests/plan-and-generate` currently emits canned `// TODO` blocks (`src/api/routes/tests.ts:136-260`), violating the contract described in `Docs/MementoAPIDesign.md:163-196` and the enriched tests blueprint.
- **Entry Points**:
  - Consider adding `src/services/TestPlanningService.ts`
  - Review spec entities via `KnowledgeGraphService`
  - Update relevant docs (`Docs/Blueprints/tests-relationships.md`)
- **Scope**:
  - Build a planner that ingests specs, structural relationships, and acceptance criteria to produce concrete plans/code stubs.
  - Replace hard-coded payload with planner output; plumb coverage/test-type options.
  - Extend unit coverage (`tests/unit/api/routes/tests.test.ts`) plus new planner-specific tests; add fixtures under `tests/test-utils/` as needed.
  - Document heuristics/examples in API docs + blueprint.
- **Acceptance**: Endpoint generates spec-derived plans, tests assert on realistic content, docs updated.

### 3. Wire Flaky-Analysis Endpoint to Historical Test Data
- **Context**: Handler invokes `TestEngine.analyzeFlakyTests([])` with an empty array (`src/api/routes/tests.ts:604`), so blueprint expectations for persisted history aren’t met.
- **Entry Points**:
  - Data layer: `src/services/DatabaseService.ts`, `src/services/database/PostgreSQLService.ts`
  - Analytics: `src/services/TestEngine.ts`
  - REST handler in `src/api/routes/tests.ts`
- **Scope**:
  - Add DB queries to fetch recent executions by test ID, expose via `TestEngine`.
  - Update endpoint to call the new helper, emit results, and optionally create/refresh graph edges.
  - Expand unit tests (`tests/unit/services/TestEngine.test.ts`, `tests/unit/api/routes/tests.test.ts`) to cover flaky analytics fed by fixtures; consider adding a background job (e.g., `src/services/TestAnalyticsJob.ts`) if batch processing helps.
- **Acceptance**: Endpoint returns non-empty analytics when history exists; persistence and graph updates are validated by tests.

### 4. Realign Test Suites with Updated API Surface
- **Context**: Many Vitest cases reference legacy endpoints/response shapes (e.g., `tests/unit/api/routes/impact.test.ts:95-165`), masking regressions.
- **Entry Points**:
  - All `tests/unit/api/routes/*` files, plus supporting fixtures in `tests/test-utils/`
  - Integration test harness under `tests/integration/`
- **Scope**:
  - Audit each suite, update expectations to match the new API implementations from Tasks 1–3.
  - Add any missing mock factories/seed data to cover enriched payloads.
  - Ensure `pnpm test`, `pnpm test:integration` run cleanly; reflect progress in `MementoImplementationPlan.md` Phase 6 checkboxes.
- **Acceptance**: Test suites pass with assertions targeting the new data structures; plan doc status updated accordingly.

### 5. Repository Hygiene & Documentation Parity
- **Context**: Generated artefacts (`dist/`, `coverage/`) reside in git due to `.gitignore` gaps; documentation references features that aren’t yet live.
- **Entry Points**:
  - `.gitignore`
  - Build/test scripts (`package.json`, `scripts/`)
  - Documentation: `README.md`, `API_DOCUMENTATION.md`, `Docs/MementoAPIDesign.md`
- **Scope**:
  - Extend `.gitignore` to exclude build and coverage outputs, logs, temp assets.
  - Provide a reproducible build step (`pnpm build:dist` or similar) that regenerates artefacts without committing them.
  - Export an OpenAPI document via `trpc-openapi` (e.g., write to `docs/openapi.json`) and link it from documentation.
  - Update docs once Tasks 1–3 land so the narrative matches reality.
- **Acceptance**: Clean git status after builds/tests, generated spec available, documentation reflects delivered behaviour.

### 6. Enrich Structural Relationship Persistence
- **Context**: `Docs/Blueprints/structural-relationships.md` calls for storing import/export metadata (alias, type, namespace flag, re-export target, language, symbol kind, module path), but `KnowledgeGraphService` currently persists only minimal location details, and Falkor nodes reject nested JSON props.
- **Entry Points**:
  - `src/services/KnowledgeGraphService.ts`
  - `src/services/graph/FalkorDBService.ts`
  - Graph Cypher templates under `src/services/graph/queries/`
  - Parser emitters in `src/services/ASTParser.ts`
- **Scope**:
  - Design schema changes that persist each metadata field as first-class properties (or dedicated helper nodes) while respecting Falkor constraints, and extend persistence queries/templates with the new parameters.
  - Normalize property names/enums (e.g., `importType`, `symbolKind`) so multi-language ingestion can plug in.
  - Update entity/index definitions and validate query builders so the richer fields remain filterable without triggering RedisGraph serialization errors.
  - Refresh `KnowledgeGraphService` read helpers, API DTOs, and docs to surface the enriched metadata end-to-end.
  - Define and implement a migration/backfill strategy (plus verification checks) so existing structural edges pick up the new schema without data drift.
  - Add unit/integration coverage for persistence and read paths that exercises TypeScript and one additional language fixture, including migrated edges.
- **Acceptance**: Structural edges persist without runtime errors, metadata is retrievable with all fields populated, and tests lock in serialization behaviour.

### 7. Normalize Structural Relationships & Language Adapters
- **Context**: Relationship normalization still emits raw `USES` types with missing `resolved` flags and inconsistent `canonicalRelationshipId`. Blueprint section 6 mandates a `normalizeStructuralRelationship` helper plus per-language adapters.
- **Entry Points**:
  - `src/services/relationships/RelationshipNormalizer.ts`
  - Language adapters under `src/services/relationships/adapters/`
  - Parser pipelines in `src/services/ASTParser.ts`
- **Scope**:
  - Introduce a normalization path for structural edges that maps inferred types to canonical values, enforces `time-rel-*` IDs, and fills in `resolved`, `confidence`, and language metadata.
  - Implement adapters for at least TypeScript today, with scaffolding/tests for future languages (`py`, `go`).
  - Align `KnowledgeGraphService` ingestion with the new normalized payloads.
  - Cover with unit tests that future bulk operations re-use the single-edge normalization pipeline.
- **Acceptance**: Normalized structural edges are consistent across ingestion modes, IDs/flags conform to blueprint contracts, tests verify adapter behaviour and bulk ingestion regressions stay fixed.

### 8. Expand Structural Query Surface & Navigation APIs
- **Context**: Graph queries currently lack filters for structural fields, forcing clients to parse metadata manually. Blueprint section 8 specifies helper APIs (`listModuleChildren`, `listImports`, `findDefinition`) and new filter parameters.
- **Entry Points**:
  - `src/api/routes/graph.ts` (or relevant route handlers)
  - `src/services/KnowledgeGraphService.ts`
  - Query builders under `src/services/graph/queries/`
- **Scope**:
  - Add query filters for `importAlias`, `importType`, `isNamespace`, `language`, `symbolKind`, `modulePath` prefix.
  - Implement the navigation helpers, wiring them into REST/MCP endpoints and documenting usage.
  - Provide tests (unit + integration) exercising filtering and helper outputs using seeded structural data (see `tests/test-utils/realistic-kg.ts` and `tests/integration/services/KnowledgeGraphService.integration.test.ts`).
  - Update API docs and blueprint examples with the new query capabilities.
- **Acceptance**: Clients can query structural relationships with the new filters, helper APIs return populated data, and documentation mirrors the implementation.

### 9. Integrate Structural History & Index Management
- **Context**: Temporal handling, confidence metadata, and index bootstrapping remain inconsistent. Structural edges ignore `confidence`/`scope`, rely on `CREATE INDEX ... IF NOT EXISTS` (rejected by RedisGraph), and there’s no first-write bootstrap path to guarantee indices.
- **Entry Points**:
  - `src/services/graph/FalkorDBService.ts`
  - Index utilities in `src/services/graph/setupGraph.ts`
  - History pipeline modules (`src/services/history/`)
- **Scope**:
  - Capture `confidence`/`scope` on structural edges and persist them alongside `lastSeenAt`.
  - Replace unsupported index DDL with a compatible strategy (e.g., probe, then issue plain `CREATE INDEX` once) and expose a bootstrap path invoked during startup or first ingestion.
  - Ensure history records close/reopen edges on moves/removals and surface timeline queries (`getModuleHistory`).
  - Add integration coverage validating index bootstrap, confidence persistence, and history diffs when files move.
- **Acceptance**: Service bootstraps indices deterministically, structural edges carry confidence/history metadata, and regression tests cover file move scenarios.

### 10. Operationalize Temporal Relationship Lifecycle & Timelines
- **Context**: `Docs/Blueprints/temporal-relationships.md` notes that versioning helpers (`appendVersion`, `openEdge`, `closeEdge`) are stubbed, provenance edges are missing, and consumers lack timeline APIs; SynchronizationCoordinator & rollback tests highlight pending-state leaks during failures.
- **Entry Points**:
  - `src/services/KnowledgeGraphService.ts`
  - `src/services/SynchronizationCoordinator.ts`
  - `src/api/routes/history.ts`
  - History-related tests (`tests/unit/services/HistoryAndSchedulers.test.ts`, `tests/integration/history/` to be created)
- **Scope**:
  - [x] Persist provenance by creating/connecting `change` nodes via `MODIFIED_BY`/`MODIFIED_IN`/`CREATED_IN`/`REMOVED_IN` when `changeSetId` or session metadata is available; expose ingestion helpers so coordinators can pass context.
  - [x] Add timeline query helpers (`getEntityTimeline`, `getRelationshipTimeline`, `getChangesForSession/range`) and wire them into History API routes with pagination + filtering.
  - [x] Extend unit coverage for provenance and timeline flows (FalkorDB stubs capturing temporal metadata).
  - [x] Add a `runTemporalTransaction` helper in `KnowledgeGraphService` leveraging FalkorDB `MULTI`/`EXEC` so `appendVersion`, `openEdge`, and `closeEdge` persist all mutations atomically.
  - [x] Enforce `PREVIOUS_VERSION` continuity by verifying we link to the latest historical node inside the transaction and rejecting out-of-order writes with actionable errors.
  - [x] Introduce a `validateTemporalContinuity` maintenance job (`src/jobs/TemporalHistoryValidator.ts`) that scans for missing/duplicate version edges, repairs simple gaps, and reports irreparable ones.
  - [x] Harden SynchronizationCoordinator + rollback error handling so FalkorDB failures surface, pending states transition to `failed`, rollback tests assert on surfaced errors, and history fixtures avoid `clearTestData` hangs.
  - [x] Document the transactional behaviour + validation runbook in the blueprint/API docs, publish migration/backfill scripts, and seed integration tests covering the history endpoints.
- **Acceptance**: Temporal edges and versions persist with transactional guarantees, provenance relationships are populated, timeline endpoints return ordered history (unit + integration coverage), coordinator failure recovery is validated, rollback surfaces errors, and documentation/backfill plans cover the new pipelines.

### 11. Establish Performance Relationship Ingestion & Analytics
- **Context**: `Docs/Blueprints/performance-relationships.md` highlights missing ingestion contracts, metric-aware canonical IDs, absent history/trend storage, and failing perf suites due to undersized fixtures.
- **Entry Points**:
  - `Docs/Blueprints/performance-relationships.md` (contract)
  - `src/models/relationships.ts`, `src/utils/codeEdges.ts`, `src/services/KnowledgeGraphService.ts` (normalization + persistence)
  - `src/services/TestEngine.ts`, `src/services/database/PostgreSQLService.ts`, `tests/integration/services/TestEngine.integration.test.ts` (emission + history)
  - API surfaces in `src/api/routes/tests.ts`, `src/api/mcp-router.ts`
- **Scope**:
  - Define and enforce the performance ingestion schema (`normalizePerformanceRelationship`), including metric IDs, thresholds, severity, evidence, and derived deltas/trends.
  - Extend canonical relationship IDs and Falkor storage to disambiguate `metricId`/`environment`, persist metrics history, and expose risk/resolution markers for regressions.
  - Update TestEngine + bulk query fixtures to emit populated performance relationships, seed larger datasets for load tests, and document JSON/JSONB handling/opt-in raw mode.
  - Plumb metrics history through DatabaseService + API endpoints, add filtering helpers (metric/environment/severity), and cover workflows with unit/integration tests.
  - Capture follow-up instrumentation (batch sizing, backpressure, policy configs) and log any deferred work in TODO when scoped.
- **Follow-up (pending)**: Load-test instrumentation for performance ingestion is still missing. Problem: 50-row batch ingestion paths lack telemetry and validation, leaving `PostgreSQLService.bulkQuery` without timing/backpressure signals during `performance_metric_snapshots` writes. Proposed fix: instrument the bulk writer, then add an integration scenario that seeds ≥50 performance snapshots to exercise throttling logic. Follow-up steps: (1) add timing/backpressure metrics in `PostgreSQLService.bulkQuery`, (2) extend `tests/integration/services/TestEngine.integration.test.ts` with a high-volume snapshot fixture, (3) document configuration knobs for batch sizing/backpressure in the blueprint.
- **Acceptance**: Performance relationships ingest metric-rich data end-to-end, APIs return persisted metrics/history, load tests exercise 50-row batches, and docs/tests match the new contract.

## General Notes
- Keep changes ASCII unless files already contain Unicode.
- Prefer `pnpm` commands; respect ESM import paths.
- When touching database or graph logic, consider migration/backfill scripts and document them.
- Coordinate blueprint updates with code so design docs stay accurate.

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

## General Notes
- Keep changes ASCII unless files already contain Unicode.
- Prefer `pnpm` commands; respect ESM import paths.
- When touching database or graph logic, consider migration/backfill scripts and document them.
- Coordinate blueprint updates with code so design docs stay accurate.

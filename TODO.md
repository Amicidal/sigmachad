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

### 1. Establish Performance Relationship Ingestion & Analytics
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
- **Acceptance**: Performance relationships ingest metric-rich data end-to-end, APIs return persisted metrics/history, load tests exercise 50-row batches, and docs/tests match the new contract.

### 2. Implement Source Control Management Orchestration
- **Context**: Core SCM orchestration is live behind the `FEATURE_SCM` flag: `/api/v1/scm/*` routes call into `SCMService`, commits are persisted (`scm_commits`), and knowledge graph provenance is established. The only shipping provider is `LocalGitProvider`, so hosted PR creation (GitHub/GitLab) remains outstanding.
- **Entry Points**:
  - `Docs/Blueprints/source-control-management.md` (target behaviour)
  - `src/api/routes/scm.ts`, `src/api/APIGateway.ts` (HTTP wiring)
  - `src/services/GitService.ts`, `src/services` (git helpers + future orchestrators)
  - Persistence layers in `src/services/database/PostgreSQLService.ts`, knowledge graph adapters, and `tests/integration/api` (end-to-end coverage)
- **Scope**:
  - Design and implement an orchestration layer that stages changes, commits, and prepares push/PR payloads using `GitService` plus provider adapters (GitHub/GitLab abstraction) for branch pushes and PR creation.
  - Model commit metadata in Postgres (branch, author, summary, linked entities) and surface updates into the knowledge graph so downstream analytics understand code provenance.
  - Add request/response validation schemas for `/scm/commit-pr` and related endpoints, handling payload coercion and early error messaging before orchestration runs.
  - Replace the 501 stubs with feature-flagged handlers, update integration/unit tests to cover happy paths and failure cases, then remove the legacy stub assertions.
  - Document the new workflow in API docs and ensure Fastify route contracts align with the blueprint's structured responses.
- **Follow-up (pending)**: Remote provider adapters lack token/permission policy coverage. Problem: we do not yet audit provider capabilities or manage per-branch scopes, risking inconsistent push/PR behaviour. Proposed fix: build a provider capability matrix with token policy enforcement, then add integration smoke tests that exercise limited-scope tokens. Follow-up steps: (1) define capability schema + validation in provider adapters, (2) implement token policy enforcement hooks, (3) extend integration tests with mocked provider responses covering scope failures.
- **Follow-up (new)**: Implement hosted SCM providers (GitHub/GitLab). Problem: we cannot create real PRs or honour remote policies because only the local provider exists. Proposed fix: design provider interface extensions for OAuth/token management, implement GitHub + GitLab adapters that push feature branches, open PRs/merge requests, and surface provider IDs/status back into `SCMService`. Follow-up steps: (1) capture credential/config requirements and secrets handling, (2) build provider-specific API clients with retry + rate-limit handling, (3) extend integration tests with mocked provider APIs to validate PR creation and error escalation, (4) persist PR metadata (id, url, status) in Postgres for later sync jobs.
- **Acceptance**: `/api/v1/scm/*` endpoints execute end-to-end git + provider flows, persist commit metadata, expose validated responses, and the test suite asserts the real workflow under the feature flag.

### 3. Establish Session Relationship Ingestion & Persistence
- **Context**: `Docs/Blueprints/session-relationships.md` outlines that `SynchronizationCoordinator` emits rich session edges, but persistence drops session metadata, canonical IDs collide, and duplicate events overwrite each other.
- **Entry Points**:
  - `Docs/Blueprints/session-relationships.md` (contract)
  - `src/services/SynchronizationCoordinator.ts`, `src/services/relationships/RelationshipNormalizer.ts`, `src/services/relationships/structuralPersistence.ts`
  - `src/models/relationships.ts`, `src/services/KnowledgeGraphService.ts`, Falkor schema/migration utilities under `src/services/database`
- **Scope**:
  - Extend the session relationship normalizer to require `sessionId`/`sequenceNumber`, validate nested metadata (`changeInfo`, `stateTransition`, `impact`), and emit canonical IDs using `sha1(sessionId|sequenceNumber|type)` plus a computed `siteHash`.
  - Update persistence layers to store dedicated columns for session metadata, ensure merge paths compare `eventId`/`timestamp` before overwriting, and add indexes for `(sessionId, sequenceNumber)` and `(sessionId, type)`.
  - Wire sequence-order instrumentation so ingestion logs duplicates/out-of-order events, with metrics surfaced via `SynchronizationMonitoring`.
  - Create guarded migrations or feature-flagged schema updates so canonical changes roll out without breaking existing data, including scripts to backfill placeholder edges with derived sequence numbers when needed.
- **Follow-up (pending)**: Need a dry-run validator for legacy session logs before backfill imports. Proposed fix: build a CLI in `src/services/relationships` that replays stored JSON, reports normalization failures, and is safe to run in staging ahead of migration toggles.
- **Acceptance**: Session relationships persist all metadata fields without overwrites, canonical IDs remain unique per event, monitoring highlights sequence violations, and migrations can roll forward/back safely.

### 4. Expose Session Timeline & Impact APIs
- **Context**: Current query helpers cannot filter or reconstruct session timelines, leaving UIs and integration tests unable to consume ordered session data.
- **Entry Points**:
  - `src/services/KnowledgeGraphService.ts`, `src/services/database/FalkorDBService.ts`
  - `src/api/routes/history.ts`, `src/api/routes/impact.ts`, `src/api/APIGateway.ts`
  - `tests/integration/api/history.integration.test.ts`, `tests/integration/api/impact.integration.test.ts`
- **Scope**:
  - Extend graph/query services with filters for `sessionId`, `sequenceNumberRange`, `timestampRange`, `actor`, `impact.severity`, and `stateTransition.to` as defined in the blueprint.
  - Implement helper endpoints `getSessionTimeline`, `getSessionImpacts`, and `getSessionsAffectingEntity`, including pagination, summary aggregations, and standard Fastify schemas.
  - Update history/admin UI routes to consume the new helpers and return enriched timeline payloads that embed checkpoint references when present.
  - Add unit/integration coverage that seeds ordered events, verifies pagination/order guarantees, and guards regression scenarios for missing metadata.
- **Follow-up (pending)**: Align the History/Timeline UI spec with the new payloads. Proposed fix: author a doc update plus front-end contract tests once the session API shapes stabilize.
- **Acceptance**: APIs deliver ordered session data with the new filters, UIs/tests consume the timeline helpers without custom query hacks, and pagination/aggregation behaviours match blueprint expectations.

### 5. Integrate Session Checkpoint Workflow
- **Context**: `SESSION_CHECKPOINT` handling is synchronous and brittle—no async job exists, metadata enrichment is missing, and failures leave dangling edges.
- **Entry Points**:
  - `src/services/SynchronizationCoordinator.ts`, `src/jobs`, `src/services/KnowledgeGraphService.ts`
  - Checkpoint utilities in `src/services/RollbackCapabilities.ts`, `src/services/BackupService.ts`
  - `tests/integration/services` covering rollback/checkpoint flows
- **Scope**:
  - Introduce an asynchronous checkpoint job triggered by `SynchronizationCoordinator`, ensuring checkpoint creation, metadata enrichment (reason, hop count), and linkage via `CHECKPOINT_INCLUDES` edges.
  - Implement retry/DLQ handling for checkpoint failures and mark affected session edges for manual intervention when retries exhaust.
  - Persist checkpoint IDs in session relationships so timelines can navigate to snapshots, and update rollback services to consume the linkage.
  - Provide observability hooks (metrics/logging) around checkpoint success/failure counts and document the operational playbook.
- **Follow-up (pending)**: Decide on retention policy for checkpoint artifacts. Proposed fix: draft policy options in `Docs/Blueprints/session-relationships.md` appendix and prototype archival in `BackupService` once timelines are live.
- **Follow-up (pending)**: Document checkpoint operational playbook. Problem: runbooks remain undefined, leaving on-call responders without guidance when jobs hit retries or DLQ. Proposed fix: author a `Docs/Operations/session-checkpoints.md` guide covering metrics interpretation, manual remediation steps, and escalation paths.
- **Acceptance**: Checkpoints process asynchronously with retries, session timelines surface checkpoint metadata, and rollback tooling can resolve snapshot IDs without dangling edges.

### 6. Wire Session WebSocket Notifications
- **Context**: WebSocket session notifications never fire; keep-alives, file change broadcasts, and teardown events are absent, causing integration suites to fall back to zero-assert guards.
- **Entry Points**:
  - `src/api/websocket-router.ts`, `src/api/APIGateway.ts`, WebSocket middleware under `src/api/middleware`
  - `src/services/SynchronizationCoordinator.ts`, `src/services/logging/SessionEventLogger.ts` (or create adapter)
  - `tests/integration/api` WebSocket specs and any client simulators under `tests/utils`
- **Scope**:
  - Build a WebSocket adapter that subscribes to `SynchronizationCoordinator` events, streams session edges (including checkpoints) to connected clients, and enforces keep-alive/heartbeat semantics.
  - Implement subscription lifecycle management to clean up on disconnects and propagate teardown events, ensuring multiple sessions per client are handled.
  - Add broadcast throttling/backpressure controls plus logging to detect stalled clients, and surface metrics for active subscriptions.
  - Update integration tests to assert that session notifications, keep-alives, and teardown hooks fire as expected, replacing the zero-assert guards.
- **Follow-up (pending)**: Coordinate with client SDKs to adopt the new notification protocol. Proposed fix: version the WebSocket message schema, publish sample payloads, and update SDK contract tests once adapters land.
- **Acceptance**: WebSocket clients receive live session updates with reliable keep-alives, integration tests cover the event stream, and telemetry shows active subscription health.

## General Notes
- Keep changes ASCII unless files already contain Unicode.
- Prefer `pnpm` commands; respect ESM import paths.
- When touching database or graph logic, consider migration/backfill scripts and document them.
- Coordinate blueprint updates with code so design docs stay accurate.

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
5. **Deployment Goal**: Reach the "shippable" bar defined in `MementoImplementationPlan.md` Phase 6+.

## Task Backlog

### 1. Refresh Blueprint Documentation Against Current Implementation
- **Context**: Comprehensive audit revealed alignment gaps between aspirational blueprints and implemented features, particularly for multi-agent orchestration, high-throughput architecture, and test/security implementation patterns.
- **Entry Points**:
  - `/Users/Coding/Desktop/sigmachad/Docs/Blueprints/spec-relationships.md` (major refresh needed)
  - `/Users/Coding/Desktop/sigmachad/Docs/Blueprints/tests-relationships.md` (major refresh needed)
  - `/Users/Coding/Desktop/sigmachad/Docs/Blueprints/performance-relationships.md` (minor refresh)
  - `/Users/Coding/Desktop/sigmachad/Docs/Blueprints/temporal-relationships.md` (minor refresh)
  - `/Users/Coding/Desktop/sigmachad/Docs/Blueprints/synchronization-coordinator.md` (major refresh)
- **Scope**:
  - Update spec-relationships.md to align API references with MementoAPIDesign.md sections, integrate BusinessDomain/SemanticCluster concepts from KnowledgeGraphDesign.md.
  - Restructure tests-relationships.md to reflect graph-first approach rather than PostgreSQL-heavy design, align with test management APIs.
  - Update performance-relationships.md database references from PostgreSQL to Neo4j/FalkorDB focus, add PERFORMS_FOR relationship examples.
  - Update temporal-relationships.md transaction examples for current Neo4j/FalkorDB patterns, clarify ephemeral session integration.
  - Major update to synchronization-coordinator.md addressing embedding failures, scan scope configuration, and documenting single-threaded bottlenecks.
- **Acceptance**: Blueprints accurately reflect current implementation patterns, documented gaps have implementation tickets, and blueprint versioning tracks changes.

### 2. Implement Multi-Agent Orchestrator Foundation
- **Context**: Multi-agent orchestration is documented in blueprints but completely unimplemented. This blocks parallel agent execution and limits system velocity to single-agent sequential processing.
- **Entry Points**:
  - `/Users/Coding/Desktop/sigmachad/Docs/Blueprints/multi-agent-orchestration.md` (design spec)
  - `/Users/Coding/Desktop/sigmachad/application/multi-agent/Orchestrator.ts` (to create)
  - `/Users/Coding/Desktop/sigmachad/scripts/agent-parse.ts` (to create)
  - `/Users/Coding/Desktop/sigmachad/scripts/agent-test.ts` (to create)
  - `/Users/Coding/Desktop/sigmachad/scripts/agent-scm.ts` (to create)
- **Scope**:
  - Create MultiAgentOrchestrator class in application/multi-agent/ with worker spawning via child_process, task queue management, and KG event coordination.
  - Implement specialized agent scripts (parse, test, SCM, verification) that accept task payloads and update KG with progress events.
  - Add Redis pub-sub integration for multi-agent session handoffs with ephemeral TTL (15-60 min to checkpoint).
  - Create EventOrchestrator extensions for agent:start, agent:progress, agent:complete events with session correlation.
  - Implement basic task distribution algorithm with priority queuing and resource constraints.
  - Add integration tests for parallel agent execution with mocked KG updates and timing benchmarks.
- **Follow-up (pending)**: WebSocket integration for human-in-the-loop monitoring. Problem: No UI visibility into agent tasks. Proposed fix: Extend WebSocketRouter with /ui/agent-status endpoint, implement task board visualization.
- **Acceptance**: Orchestrator spawns multiple agents in parallel, KG events coordinate handoffs, integration tests verify parallel execution is faster than sequential.

### 3. Implement High-Throughput Ingestion Pipeline
- **Context**: HighThroughputKnowledgeGraph.md describes 10k LOC/minute target but current implementation has serial bottlenecks: 500ms + 1s debounce walls, single-threaded coordination, per-entity database writes.
- **Entry Points**:
  - `/Users/Coding/Desktop/sigmachad/Docs/HighThroughputKnowledgeGraph.md` (target architecture)
  - `/Users/Coding/Desktop/sigmachad/packages/sync/src/synchronization/SynchronizationCoordinator.ts` (current bottleneck)
  - `/Users/Coding/Desktop/sigmachad/packages/knowledge/src/core/FileWatcher.ts` (needs event bus)
  - `/Users/Coding/Desktop/sigmachad/packages/knowledge/src/embeddings/EmbeddingService.ts` (needs async plane)
- **Scope**:
  - Replace FileWatcher direct callbacks with Redis Streams or NATS event bus, partitioned by namespace/module.
  - Implement distributed parse workers consuming bus partitions with structural diff parsing (tree-sitter incremental).
  - Create ingestion orchestrator building dependency DAG, dispatching micro-batches to entity/relationship workers.
  - Implement streaming graph writes with Neo4j UNWIND statements and idempotent batch IDs.
  - Move embeddings to GPU-backed job queue with dynamic batching (100s-1000s entities per request).
  - Add comprehensive telemetry: queue depth, lag metrics, parse latency distributions, DB throughput.
- **Follow-up (pending)**: Autoscaling policies based on queue depth. Problem: No automatic scaling triggers. Proposed fix: Implement control loops monitoring lag metrics, triggering worker scaling.
- **Acceptance**: System sustains 10k LOC/minute ingestion rate, P95 latency <500ms for core updates, telemetry dashboard shows queue health.

### 4. Complete API Implementation Gaps
- **Context**: API implementation is ~65% complete compared to MementoAPIDesign.md. Missing: vector search, business domains, complete design management, security metadata endpoints.
- **Entry Points**:
  - `/Users/Coding/Desktop/sigmachad/Docs/MementoAPIDesign.md` (complete spec)
  - `/Users/Coding/Desktop/sigmachad/packages/api/src/routes/` (partial implementations)
  - `/Users/Coding/Desktop/sigmachad/packages/api/src/mcp-router.ts` (missing MCP tools)
- **Scope**:
  - Implement missing Design & Specification Management endpoints (GET/PUT/LIST for specs).
  - Create Documentation & Domain Analysis routes (/api/docs/sync, /api/domains, /api/clusters).
  - Implement Vector Database Operations routes (/api/graph/semantic-search using Neo4j native vectors).
  - Complete Security Operations metadata endpoints (/api/security/metadata/{entityId}).
  - Add missing MCP tools (scm.commit_pr, docs.sync, domains.*, clusters.*, business.*, security.*).
  - Implement consistent error handling with buildErrorResponse across all routes.
  - Add comprehensive Zod validation schemas for complex request types.
- **Acceptance**: All documented API endpoints return valid responses, MCP tools match documentation, consistent error handling and validation.

### 5. Add Comprehensive E2E and Integration Test Coverage
- **Context**: No E2E tests exist for critical flows. Integration tests fail without real databases. Unit tests appropriately use mocks for isolation, but higher-level tests need real implementations.
- **Entry Points**:
  - `/Users/Coding/Desktop/sigmachad/tests/unit/` (appropriately mocked for unit isolation)
  - `/Users/Coding/Desktop/sigmachad/tests/integration/` (needs real implementations)
  - `/Users/Coding/Desktop/sigmachad/tests/e2e/` (to create)
- **Scope**:
  - Create E2E test suite for critical user flows using real services: spec creation → test generation → implementation → validation → commit.
  - Ensure integration tests use real implementations (databases, services) via Docker containers for consistent state.
  - Implement test fixtures and data seeders for reproducible integration/E2E test environments.
  - Add XML parser for JUnit test results (replacing regex parsing).
  - Wire flaky test analysis into knowledge graph relationships.
  - Implement suite/run ID persistence to prevent relationship overwrites.
  - Document testing pyramid strategy: unit tests (with mocks) → integration tests (real services) → E2E tests (full stack).
- **Acceptance**: E2E tests cover 5+ critical flows, integration tests run reliably with real services, testing pyramid properly implemented.

### 6. Implement Security Scanning Integration
- **Context**: SecurityScanner exists but isn't integrated into sync workflows. Blueprint describes metadata-only approach but implementation creates dedicated nodes/edges.
- **Entry Points**:
  - `/Users/Coding/Desktop/sigmachad/Docs/Blueprints/security-metadata-integration.md` (design)
  - `/Users/Coding/Desktop/sigmachad/packages/testing/src/SecurityScanner.ts` (current implementation)
  - `/Users/Coding/Desktop/sigmachad/packages/sync/src/synchronization/SynchronizationCoordinator.ts` (integration point)
- **Scope**:
  - Implement SecurityEnhancer class as per blueprint, integrating with SynchronizationCoordinator.
  - Refactor SecurityScanner to append metadata to entities rather than creating dedicated nodes.
  - Add FileWatcher integration for automatic security scanning on file changes.
  - Implement MCP tool integration for critical vulnerability remediation.
  - Add OSV.dev and external tool integration (Snyk, ESLint-security).
  - Create security suppression configuration and documentation.
- **Follow-up (pending)**: Multi-agent coordination for security fixes. Problem: No automated fix generation. Proposed fix: Security agent that generates patches for critical vulnerabilities.
- **Acceptance**: Security scans run automatically during sync, vulnerabilities stored as metadata, critical issues trigger automated fixes.

### 7. Implement Redis Session Coordination
- **Context**: Sessions stored in graph DB instead of ephemeral Redis cache. No pub-sub for multi-agent handoffs. Missing real-time coordination capabilities.
- **Entry Points**:
  - `/Users/Coding/Desktop/sigmachad/Docs/Brainstorm.md` (ephemeral session design)
  - `/Users/Coding/Desktop/sigmachad/packages/sync/src/synchronization/SynchronizationCoordinator.ts` (current session management)
  - Redis integration points (to create)
- **Scope**:
  - Implement Redis session cache with TTL (15-60 min to checkpoint) for ephemeral events.
  - Add pub-sub channels for multi-agent handoffs (agent:session:*, agent:handoff:*).
  - Create SessionBridge service joining Redis cache with KG anchors for hybrid queries.
  - Implement session event batching and compression for high-volume agents.
  - Add checkpoint emission to KG as metadata anchors (no persistent session nodes).
  - Create monitoring for session cache health, handoff success rates.
- **Acceptance**: Sessions managed in Redis with TTL, multi-agent handoffs via pub-sub, KG anchors provide durable references.

### 8. Implement Durable Rollback Persistence
- **Context**: RollbackCapabilities uses in-memory storage (50-item cap), lost on restart. No distributed coordination or true datastore snapshots.
- **Entry Points**:
  - `/Users/Coding/Desktop/sigmachad/packages/sync/src/scm/RollbackCapabilities.ts` (current implementation)
  - `/Users/Coding/Desktop/sigmachad/Docs/Blueprints/rollback-capabilities.md` (design)
- **Scope**:
  - Migrate rollback points from memory to PostgreSQL with indexed lookups.
  - Implement true datastore snapshots (graph subgraph exports, database checkpoints).
  - Add distributed coordination for multi-process rollback operations.
  - Implement structured telemetry for rollback operations.
  - Create rollback point retention policies with automatic cleanup.
  - Add rollback verification tests with simulated failures.
- **Acceptance**: Rollback points persist across restarts, distributed rollback coordination works, telemetry tracks rollback operations.

### 9. Complete Test Relationship Temporal Tracking
- **Context**: Test relationships lack temporal history (validFrom/validTo), suite IDs don't persist causing overwrites, canonical IDs collide.
- **Entry Points**:
  - `/Users/Coding/Desktop/sigmachad/packages/testing/src/TestEngine.ts` (current implementation)
  - `/Users/Coding/Desktop/sigmachad/Docs/Blueprints/tests-relationships.md` (temporal design)
- **Scope**:
  - Add temporal validity intervals to test relationships (validFrom, validTo timestamps).
  - Implement suite/run ID persistence to prevent relationship overwrites.
  - Update canonical IDs to include suite context (sha1(suite|run|from|to|type)).
  - Create temporal query helpers for test history analysis.
  - Implement test coverage trend analysis using temporal data.
  - Add framework-specific error semantics for retries and hook failures.
- **Acceptance**: Test relationships track temporal history, multiple suites don't overwrite each other, coverage trends visible over time.

## General Notes
- Keep changes ASCII unless files already contain Unicode.
- Prefer `pnpm` commands; respect ESM import paths.
- When touching database or graph logic, consider migration/backfill scripts and document them.
- Coordinate blueprint updates with code so design docs stay accurate.
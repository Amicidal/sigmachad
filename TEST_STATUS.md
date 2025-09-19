# Test Status Tracker

## Worked on Tests
- 2025-09-19: `tests/unit/services/DatabaseService.test.ts` — PASS — Covers init sequencing, getter guards, and proxy methods with dependency-injected doubles; reads as high quality and still aligned with current surface area.
- 2025-09-19: `tests/unit/services/DatabaseService.errors.test.ts` — PASS — Realistic mocks exercise error paths, transactional propagation, and bulk query guardrails; remains a solid regression net.
- 2025-09-19: `tests/integration/services/DatabaseService.integration.test.ts` — PASS — End-to-end verification across Postgres/Falkor/Qdrant/Redis surfaced missing `Entity` graph label and JSONB handling; label fix documented under `Docs/Blueprints/knowledge-graph-service.md`.
- 2025-09-19: `tests/unit/services/KnowledgeGraphService.test.ts` — PASS — Exercise full entity lifecycle with rich mocks; assertions stay aligned with current API surface and remain high quality despite verbose fixture logging.
- 2025-09-19: `tests/unit/services/KnowledgeGraphService.noise.test.ts` — PASS — Focused gating check for inferred relationships; concise and still relevant after confidence threshold tweaks.
- 2025-09-19: `tests/unit/services/KnowledgeGraphService.impact.test.ts` — PASS — Validates composite impact aggregation across symbols, tests, docs, and specs; scenarios mirror production usage and remain high fidelity.
- 2025-09-19: `tests/integration/services/KnowledgeGraphService.integration.test.ts` — PASS — Added defensive entity cleanup before relationship fixtures so duplicates are not carried between cases; highlights missing `TestIsolationContext` wiring in the service (see blueprint note).
- 2025-09-19: `tests/unit/services/PostgreSQLService.test.ts` — PASS — Broad coverage across initialization, query/transaction/bulk flows, and defensive UUID validation keeps the suite high quality; mocks stay realistic via injected pools and type parsers.
- 2025-09-19: `tests/integration/services/PostgreSQLService.integration.test.ts` — PASS — Exercises schema setup, CRUD, transactions, analytics history, and load/error scenarios against live Docker services; tests remain representative and surfaced only environment readiness gaps (docker services must be started via `pnpm docker:test-up`).
- 2025-09-19: `tests/unit/services/SynchronizationCoordinator.test.ts` — PASS — Extensive happy-path and edge-case coverage (queueing, cancellation, partial/incremental modes) continues to read as high value; mocks remain realistic though the log stream is verbose.
- 2025-09-19: `tests/unit/services/SynchronizationCoordinator.resolver.test.ts` — PASS — Resolver helpers stay deterministic and provide good signal on relationship target resolution; compact but meaningful.
- 2025-09-19: `tests/integration/services/SynchronizationCoordinator.integration.test.ts` — PASS — Full-stack sync exercises (full/incremental/partial/conflict flows) now complete without Falkor map errors after sanitizer fix; still emits expected embedding warnings when `OPENAI_API_KEY` is absent (documented in the synchronization blueprint).
- 2025-09-19: `tests/unit/services/DocumentationParser.test.ts` — PASS — Revalidated heuristics-driven parsing across Markdown/RST/AsciiDoc; signal extraction continues to surface business domains and locales without regression.
- 2025-09-19: `tests/integration/services/DocumentationParser.integration.test.ts` — PASS — Cross-service ingest/search against Docker Postgres/Falkor/Qdrant/Redis still succeeds; section linkage and relationship freshness remain healthy.
- 2025-09-19: `tests/unit/api/routes/graph.test.ts` — PASS — Exercised new `buildErrorResponse` helper to guarantee graph endpoints emit `requestId`/`timestamp` metadata on server failures; aligned expectations with symbol-kind filters; captured follow-up in `Docs/Blueprints/api-error-handling.md`.
- 2025-09-19: `tests/integration/api/APIGateway.integration.test.ts` — PASS — Gateway now returns consistent error envelopes (code/message/details plus request metadata) when graph search fails, restoring parity with logging and client expectations; blueprint noted under `Docs/Blueprints/api-error-handling.md`.
- 2025-09-19: `tests/unit/services/SecurityScanner.test.ts` — PASS — Extensive coverage across scan orchestration, rule loading, monitoring config, and database interactions; tests remain high quality despite verbose mocks and validate resilience to errors like malformed package manifests.
- 2025-09-19: `tests/unit/services/SecurityScanner.issues-suppression.test.ts` — PASS — Focused suppression rule matching scenarios stay tightly scoped and continue to reflect current suppression semantics.
- 2025-09-19: `tests/integration/services/SecurityScanner.integration.test.ts` — PASS — Full-stack security ingest across Falkor/Qdrant/Postgres/Redis continues to validate scan orchestration and persistence; bootstrap now provisions unique constraints via `GRAPH.CONSTRAINT` with index preflight and only falls back when engines lack support (tracked in `Docs/Blueprints/security-relationships.md`).


## Failing Tests (to investigate)
- Services: LoggingService, BackupService, ConflictResolution
  API: AdminRestore, EndToEnd, MCPToolIntegration, Middleware, RESTEndpoints, SourceControlManagement, TRPC
  Models: entities
_(Last updated: 2025-09-19 03:49:27 UTC)_

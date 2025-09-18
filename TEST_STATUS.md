# Test Status Tracker

## Passing Tests
- `tests/unit/api/mcp-router.test.ts` *(broad coverage over MCP tool registration, tool handlers, and error paths; now aligned with UUID-based spec identifiers. Fallback planning still leans on DB hydration until KG exposure is fixed—see blueprint note.)*
- `tests/unit/services/PostgreSQLService.test.ts`
- `tests/unit/services/ASTParser.test.ts`
- `tests/unit/services/ASTParser.reexports-barrel.test.ts` *(verifies barrel re-exports resolve to underlying file symbols; now emits paired CALLS/REFERENCES for MCP tooling.)*
- `tests/unit/services/ASTParser.reference-confidence.test.ts` *(covers baseline confidence metadata for references and gating behaviour.)*
- `tests/unit/services/ASTParser.reference-confidence-detailed.test.ts` *(exercises confidence tiers for local/file/external dependencies; relies on 0.4 floor for unresolved references.)*
- `tests/unit/services/KnowledgeGraphService.test.ts`
- `tests/unit/api/routes/admin.test.ts`
- `tests/unit/api/routes/code.test.ts`
- `tests/unit/services/LoggingService.test.ts` *(high quality; validates broad log behaviors and statistics)*
- `tests/unit/api/middleware/rate-limiting.test.ts` *(solid coverage on burst handling and headers)*
- `tests/unit/services/SecurityScanner.test.ts` *(good breadth; noisy due to live OSV fallback—consider mock injection)*
- `tests/unit/services/BackupService.test.ts` *(excellent breadth; relies on heavy filesystem mocks but exercises critical flows)*
- `tests/unit/api/routes/graph.test.ts` *(covers both happy-path and edge-case responses; enforces lean payloads)*
- `tests/unit/api/routes/scm.test.ts` *(placeholder endpoints now respond consistently; schemas wired for diff/log queries)*
- `tests/unit/services/TestEngine.test.ts` *(now exercises coverage edges, flaky scoring, and incident gating; high-value behavioral suite)*
  - _Note_: Database persistence still expects legacy flaky-analysis columns; `TestEngine.storeFlakyTestAnalyses` forwards rich objects and needs downstream mapping update.
- `tests/unit/services/SynchronizationCoordinator.test.ts` *(covers end-to-end sync orchestration, cancellation, and telemetry; high complexity but now deterministic)*
- `tests/unit/services/SynchronizationCoordinator.resolver.test.ts` *(validates relationship target resolution heuristics; focused and useful)*
- `tests/unit/services/MaintenanceService.test.ts` *(covers task orchestration, stats, and concurrency; good regression net)*
- `tests/unit/services/SynchronizationMonitoring.test.ts` *(broad coverage of metrics/alerts lifecycle; high quality and still aligned with service behaviour)*
- `tests/unit/services/TestResultParser.test.ts` *(exercise for multi-framework parsing; highlights missing suite-name extraction in JUnit path—implementation gap logged in blueprint)*

## Failing Tests (to investigate)
- None pending
_(Last updated: 2025-09-18 01:42:00)_

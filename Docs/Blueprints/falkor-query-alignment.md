# Falkor Query Alignment Blueprint

## 1. Overview
Knowledge graph queries now support richer symbol taxonomy (graph node `type` versus `kind`) and enhanced evidence metadata, but downstream services and tests still assume the previous parameter contract. This drift surfaced as failing Falkor-facing tests: REST graph routes, MCP tooling, and direct `KnowledgeGraphService` calls assert against outdated payloads. The goal of this blueprint is to realign the query/persistence layer with client expectations so that filtering, payload shaping, and metadata merging behave consistently across the stack.

## 2. Current Gaps
- `KnowledgeGraphService.listEntities` (src/services/KnowledgeGraphService.ts:8221-8234) emits Cypher params `entityType`/`entityKind`, while mocks and REST handlers still expect `type`/`kind`. The mismatch makes tests assert on the wrong payload and risks breaking real integrations that replay recorded traffic.
- REST graph entities route (src/api/routes/graph.ts:712-733) maps `type=function` to `{ type: 'symbol', kind: 'function' }` but downstream tests still expect the legacy `{ type: 'function' }` contract. We need an explicit compatibility layer and documentation so clients understand the new taxonomy.
- Relationship merge pipeline (src/services/KnowledgeGraphService.ts:3120-3184) now feeds `mergeEdgeLocations` with concatenated history, so `metadata.locations` returns multiple path/line entries. Legacy callers (e.g., unit test `createRelationship > merges incoming code edges…`) assume a single canonical location (earliest line). We need to define whether metadata should surface primary-only, multi-location, or both representations.
- MCP `graph.examples` handler (src/api/mcp-router.ts:1067-1114) reports `totalExamples` as usage + test counts, but tests assume it only reflects `usageExamples`. Clarify the intended semantics and update clients/tests accordingly.
- Test fixtures for Falkor-adjacent services (graph routes, MCP router, Backup restore dry-run) stub out database interactions with the old resolve/throw contract. Implementation now prefers structured error objects. Without harmonising these expectations, unit tests will continue failing even after code fixes.

## 3. Desired Capabilities
1. A single, documented mapping from external filters (`type`, `entityTypes`, `symbolKind`) to Falkor query parameters that both REST and service-level callers reuse.
2. Stable response metadata for relationships: clearly defined primary location plus optional historical locations so prior consumers remain unaffected.
3. Consistent result counters (`totalExamples`, `totalUsageExamples`, `totalTestExamples`) across MCP and REST APIs.
4. Error handling contract for graph/backup operations that either throws or returns structured errors—chosen once and enforced across tests, mocks, and production code.

## 4. Workstreams
### 4.1 Filter & Parameter Normalisation
- Extract a helper (e.g., `mapEntityFilters`) that receives REST/MCP inputs and returns `{ type, kind, language, tags }` along with the exact Cypher parameter names. Use it inside `KnowledgeGraphService.listEntities` and REST/MCP handlers.
- Decide on parameter naming (`type` vs `entityType`) and update Cypher queries to match. Propagate changes to mocks (`tests/test-utils/mock-db-service.ts`, etc.) and adjust assertions accordingly.
- Update documentation (`Docs/KnowledgeGraphDesign.md`) describing the type/kind taxonomy and the mapping table used by clients.

### 4.2 Relationship Metadata Strategy
- Define desired shape: (a) keep earliest location as `metadata.primaryLocation`, (b) expose historical array under `metadata.locations`, and (c) keep `evidence` unchanged.
- Implement helper in `KnowledgeGraphService` that derives `primaryLocation` (earliest by line & column) and trims `metadata.locations` if legacy callers require single entry.
- Add regression tests validating merge scenarios (existing + new evidence, same path different line, multiple files).

### 4.3 Result Counting Semantics
- Align `getEntityExamples` return type so `totalExamples` reflects documented behaviour. Decide whether it equals `usageExamples.length` or `usage + test` and update both handler and tests.
- Audit other counters (e.g., `KnowledgeGraphService.listEntities` total) for parity between service and API surfaces.

### 4.4 Error Contract Harmonisation
- Pick a global approach: either throw for unrecoverable states (missing backup) or return `{ success: false, error }`. Update `BackupService.restoreBackup`, graph endpoints, and tests to enforce this contract.
- Extend mock DB/test helpers to mirror new behaviours, preventing drift between implementation and unit expectations.

### 4.5 Test & Tooling Updates
- Update unit tests (`tests/unit/services/KnowledgeGraphService.test.ts`, `tests/unit/api/routes/graph.test.ts`, `tests/unit/api/mcp-router.test.ts`, `tests/unit/services/BackupService.test.ts`) to assert against the normalised payloads.
- Add new test cases covering mixed `type/kind` filtering and multi-location metadata so future changes surface regressions early.

## 5. Risks & Mitigations
| Risk | Mitigation |
| --- | --- |
| Breaking existing clients that rely on legacy `type=function` contract | Provide compatibility shim + deprecation notice, ensure REST handler translates old inputs transparently. |
| Confusion over location metadata semantics | Document primary vs historical fields and keep tests asserting both. |
| Touching multiple modules increases regression surface | Incremental workstream rollout with dedicated test coverage per subsystem (service, REST, MCP, backup). |
| Mock/test drift recurring | Centralise shared helpers for mapping and error handling used by both production code and test doubles. |

## 6. Milestones
1. Finalise mapping + helper, update service/API/tests (filter normalisation).
2. Implement metadata strategy + regression tests (relationship merge).
3. Settle counter semantics and align MCP/REST handlers/tests.
4. Harmonise error contract across backup & graph paths.
5. Documentation refresh and announce changes to consuming teams.

## 7. Open Questions
- Should legacy query parameters like `type=function` continue to be accepted indefinitely, or should we introduce a versioned API path?
- Do clients need both `metadata.locations` and a separate `primaryLocation`, or can we retrofit UI components to use the new array?
- Are there downstream analytics relying on `totalExamples === usageExamples.length` that would need migration support?

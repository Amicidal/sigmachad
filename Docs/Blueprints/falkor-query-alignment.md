# Falkor Query Alignment Blueprint

## 1. Overview
Knowledge graph queries now support richer symbol taxonomy (graph node `type` versus `kind`) and enhanced evidence metadata. The REST layer and unit tests already translate legacy inputs such as `type=function` into the `{ type: 'symbol', kind: 'function' }` shape that `KnowledgeGraphService.listEntities` consumes, so baseline filtering paths have stabilised. The remaining work focuses on consolidating that mapping logic, documenting the contract, and finishing the surrounding consistency fixes (metadata, counters, error contracts) so every Falkor-facing surface behaves predictably.

## 2. Current Gaps
- `KnowledgeGraphService.listEntities` (in `@memento/knowledge`) now accepts `type`/`kind`, but the translation from legacy query params lives in two places: the REST handler (in `@memento/api`) and several test helpers. Without a shared helper or documented mapping table, future changes risk reintroducing drift.
- Relationship merge pipeline (in `@memento/knowledge`) now feeds `mergeEdgeLocations` with concatenated history, so `metadata.locations` returns multiple path/line entries. Legacy callers (e.g., unit test `createRelationship > merges incoming code edges…`) assume a single canonical location (earliest line). We need to define whether metadata should surface primary-only, multi-location, or both representations.
- MCP `graph.examples` handler (in `@memento/api`) reports `totalExamples` as usage + test counts, but tests assume it only reflects `usageExamples`. Clarify the intended semantics and update clients/tests accordingly.
- Test fixtures for Falkor-adjacent services (graph routes, MCP router, Backup restore dry-run) stub out database interactions with the old resolve/throw contract. Implementation now prefers structured error objects. Without harmonising these expectations, unit tests will continue failing even after code fixes.

## 3. Desired Capabilities
1. A single, documented mapping from external filters (`type`, `entityTypes`, `symbolKind`) to Falkor query parameters that both REST and service-level callers reuse.
2. Stable response metadata for relationships: clearly defined primary location plus optional historical locations so prior consumers remain unaffected.
3. Consistent result counters (`totalExamples`, `totalUsageExamples`, `totalTestExamples`) across MCP and REST APIs.
4. Error handling contract for graph/backup operations that either throws or returns structured errors—chosen once and enforced across tests, mocks, and production code.

## 4. Workstreams
### 4.1 Filter & Parameter Normalisation
- Extract a shared helper (e.g., `mapEntityFilters`) that receives REST/MCP inputs and returns `{ type, kind, language, tags }`, replacing the ad-hoc translation in `graph.ts` and duplicated test utilities.
- Publish a mapping table (in docs and shared types) so SDKs know how legacy inputs such as `type=function` map to `{ type: 'symbol', kind: 'function' }` and keep it versioned.
- Patch mocks (`tests/test-utils/mock-db-service.ts`, etc.) to call the helper so fixtures mirror production behaviour when new taxonomy values land.

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
| Breaking existing clients that rely on legacy `type=function` contract | Keep the translation helper accepting legacy strings, document the new taxonomy, and advertise a deprecation window before removing shims. |
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

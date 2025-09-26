# Synchronization Coordinator Blueprint

## 1. Overview
The Synchronization Coordinator orchestrates repository scans, AST ingestion, and graph persistence across FalkorDB, Qdrant, and PostgreSQL. Recent integration work hardened the service around initialization and testability, but the execution path still leaks infrastructure assertions (Falkor bulk upserts, embedding batches) and lacks configuration hooks that integration environments rely on. This blueprint catalogs the outstanding gaps that surfaced while getting `tests/integration/services/SynchronizationCoordinator.integration.test.ts` back to green.

## 2. Current Gaps
- **Falkor bulk upserts stringify maps when batched** — ✅ Addressed by teaching `FalkorDBService.parameterToCypherString` how to preserve `$rows` context and emit nested maps (implemented in `@memento/database`). Follow-ups: add regression coverage so future sanitizer tweaks keep honoring `UNWIND $rows` semantics, and consider centralising map serialization so `KnowledgeGraphService` doesn't need to pre-stringify JSON-ish fields.
- **Embedding batches hard fail without OpenAI credentials** – After full sync, the coordinator enqueues background embedding batches (in `@memento/sync`). In integration and CI runs we intentionally omit `OPENAI_API_KEY`, but `KnowledgeGraphService.createEmbeddingsBatch` throws and prints noisy stack traces. We need a guard that skips or degrades to a stub when embeddings are disabled, otherwise every sync hammers STDERR despite succeeding overall.
- **Scan scope not configurable** – `scanSourceFiles()` (in `@memento/sync`) always walks `src`, `lib`, `packages`, and `tests`. Integration suites had to monkey patch the private method to restrict scanning to a temp directory. Provide an explicit configuration hook (constructor option or `SyncOptions`) so callers/tests can scope the scan without spelunking private methods.

## 3. Desired Capabilities
1. Falkor parameter sanitization treats arrays-of-maps as maps, enabling batch upserts without errors.
2. Synchronization routines detect when embeddings are disabled (missing API key/feature flag) and skip the background jobs quietly.
3. Coordinators accept runtime configuration for source roots (and optionally ignore patterns), allowing deterministic fixture-based tests without private method overrides.
4. Test harnesses run without emitting high-volume infrastructure errors, keeping logs focused on actionable failures.

## 4. Proposed Steps
1. Update `FalkorDBService.parameterToCypherString` to accept an optional `contextKey` when recursing so array entries inherit the parent key; treat entries as Cypher maps when the context key matches `rows`, `props`, etc. Add unit coverage that exercises `createEntitiesBulk` end-to-end against Falkor.
2. Introduce a feature flag or capability check (e.g., `EmbeddingService.isEnabled()`) before spawning embedding batches; when disabled, record a recoverable sync error or telemetry but avoid throwing.
3. Extend `SynchronizationCoordinator` to accept a `scanRoots` array (constructor option or `SyncOptions`) and teach `scanSourceFiles` to respect it. Update integration tests to rely on the public hook instead of `vi.spyOn`.
4. Once the above are in place, tighten integration assertions to fail if Falkor batch errors or embedding warnings leak, ensuring regressions stay visible.

## 5. Open Questions
- Should we provide an in-memory Falkor substitute for tests to avoid docker dependencies, or is improving the sanitizer sufficient?
- Where should embedding disablement live (coordinator, `KnowledgeGraphService`, or a dedicated configuration service)?
- Do we need similar scan-scoping hooks for incremental/partial sync entry points, or is full-sync configurability enough for now?

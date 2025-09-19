# Structural Relationship Blueprint

## 1. Overview
Structural relationships (`CONTAINS`, `DEFINES`, `EXPORTS`, `IMPORTS`, optionally `BELONGS_TO`) encode the static architecture of the codebase—module hierarchies, symbol definitions, and import/export dependencies. They serve as the backbone for navigation, dependency analysis, and change impact scoping.

## 2. Current Gaps
- AST parser emits rich metadata (aliases, namespace imports, re-export info, language-specific details), but persistence only stores minimal fields (context/path/line) that piggyback on code-edge schema.
- Queries lack dedicated filters for structural attributes, forcing clients to rely on manual parsing or additional data sources.
- Temporal handling is inconsistent; structural edges are not tracked when files move or exports change.
- Multi-language support is limited; metadata is TypeScript-centric and not normalized for other languages.
- Integration tests (`FalkorDBService.integration`) now pass after hardening `FalkorDBService.setupGraph` for missing graphs and duplicate index DDL. We still need an explicit bootstrap path (or first-write hook) that guarantees index creation without relying on retries once data exists.
- Parameter handling for nested objects fails with "Property values can only be of primitive types or arrays of primitive types" when inserting JSON metadata into nodes; we need a safe serialization strategy (likely JSON string storage + decode in `decodeGraphValue`) that still supports `SET n += $props` flows.
- Falkor index DDL emitted by `KnowledgeGraphService.ensureIndices` uses `CREATE INDEX ... IF NOT EXISTS`, which RedisGraph rejects. Integration runs log repeated errors and rely on indexes already existing; update the DDL to an idiom the engine supports (or detect availability before issuing the statement).
- Relationship normalization still stores code edges with raw `USES` types and missing `resolved` flags; `canonicalRelationshipId` is also diverging from the expected `time-rel-*` style IDs. The normalization layer needs to map inferred types (`TYPE_USES`, etc.) and ensure canonical IDs/timestamps align with blueprint contracts (`KnowledgeGraphService Integration > Relationship Operations > normalizes code edges...`).
- Bulk creation previously failed (`KnowledgeGraphService Integration > Relationship Operations > bulk merges code edges when using createRelationshipsBulk`) because serialized payloads dropped metadata (e.g., `resolved`, secondary locations). Merge pipeline now shares the single-edge normalization path and preserves evidence/locations, but we must keep this guard to avoid future regressions when adjusting bulk ingestion.
- The MCP `graph.dependencies.analyze` tool currently returns an empty entity list even after recording specs and source files. Dependency edges are not persisted or indexed in a way that the analyzer can traverse, so integration tests expecting at least one dependent entity fail. We need to persist dependency relationships (and expose them via the MCP tool) before claiming graph analysis coverage.
- The vector search API (`POST /api/v1/vdb/search`) is missing entirely; the handler returns HTTP 404, so semantic search scenarios (type filtering, metadata queries, concurrency) all short-circuit. We need to surface the vector-store client through this route (or provide a meaningful stub) before integration tests can validate search behaviour.
- Confidence metadata for dependency edges now differentiates local (0.9), file-resolved (0.6), and unresolved external (0.4) references at parse time, but the persistence layer still ignores these fields and downstream analyses cannot consume them. Capture and expose confidence/`scope` in storage and consider whether the lowered default `MIN_INFERRED_CONFIDENCE` (0.4) warrants additional filtering in analytics.
- Entity listing previously ignored symbol-kind filters (e.g., `type=function`); the latest integration fix maps REST `type` parameters onto graph symbol kinds, but we still need a canonical taxonomy shared between Fastify schemas and graph queries so future clients and tooling stay aligned.

## 3. Desired Capabilities
1. Persist structural metadata that supports multi-language ingestion—import alias, import type (default/named/wildcard), namespace flags, re-export targets, symbol kind, and module path.
2. Provide efficient queries to navigate project structure (list children, find definitions, analyze dependencies) with filtering criteria.
3. Integrate with history to track structural changes over time (file moves, API surface modifications).
4. Maintain compatibility with different languages by using generic fields plus language-specific metadata namespaces.

## 4. Inputs & Consumers
- **Inputs**: AST parser (`src/services/ASTParser.ts`), language-specific parsers (future), manual overrides for legacy languages.
- **Consumers**: IDE integrations, dependency graph API, impact analysis, docs linking, code navigation features, build tooling analyzing module graphs.

## 5. Schema & Metadata Requirements
| Field | Type | Notes |
| --- | --- | --- |
| `importAlias` | string | Alias used in import/export; optional.
| `importType` | enum (`default`, `named`, `namespace`, `wildcard`, `side-effect`) | Normalized value.
| `importDepth` | integer | (Existing field) number of hops for resolved import; maintain for parity.
| `isReExport` | boolean | For exports re-exporting from another module.
| `reExportTarget` | string | Path/name of re-exported symbol.
| `isNamespace` | boolean | Indicates namespace import.
| `language` | string | Language of source file (TS, JS, Python, etc.).
| `symbolKind` | enum (`class`, `function`, `interface`, `module`, etc.) | For `DEFINES` edges.
| `modulePath` | string | Canonical module path normalized across languages.
| `metadata.languageSpecific` | object | Namespaced details (e.g., `ts.typeOnly`).

## 6. Normalization Strategy
1. Extend `normalizeRelationship` with `normalizeStructuralRelationship` when `type` is structural:
   - Map import/export types to canonical enums.
   - Normalize path separators and apply case sensitivity rules as needed.
   - Promote metadata fields (`importAlias`, `isReExport`, `reExportTarget`, `language`, `symbolKind`).
   - For languages lacking certain concepts (e.g., `importAlias`), default to `null`.
2. Provide language adapters to fill metadata (`ts`, `py`, `go`). For each adapter, ensure contributions align with generic fields and store language-specific extras in `metadata.languageSpecific`.
3. Validate presence of base node IDs and log when parser emits ambiguous edges (e.g., unresolved imports).

## 7. Persistence & Merge Mechanics
1. Keep canonical ID `from|to|type` (structural edges are unique by definition), but ensure metadata updates merge without losing previous information.
2. Extend Cypher queries to persist new fields: `importAlias`, `importType`, `isReExport`, `reExportTarget`, `isNamespace`, `language`, `symbolKind`, `modulePath`, plus existing location data.
3. When edges change (e.g., alias updated), update metadata while preserving history (set `lastSeenAt`, reuse `openEdge`/`closeEdge` logic).
4. For unresolved imports generating placeholders, maintain `resolutionState` metadata to track unresolved vs resolved state.
5. Index `(type, importAlias)`, `(type, modulePath)`, `(language, type)` for navigation queries.

## 8. Query & API Surface
1. Extend `getRelationships` filters for structural-specific fields: `importAlias`, `importType`, `isNamespace`, `symbolKind`, `language`, `modulePath` prefix.
2. Provide helper APIs:
   - `listModuleChildren(modulePath, { includeFiles, includeSymbols })` returning contained nodes sorted by kind.
   - `listImports(fileId, { includeResolved })` showing import details and resolution status.
   - `listExports(fileId)` with alias/re-export info.
   - `findDefinition(symbolId)` retrieving `DEFINES` edge metadata.
3. Update documentation and API design references to reflect new capabilities for code navigation.

## 9. Temporal & History Integration
1. Use history pipeline to track structural changes: when symbol moves, close old `DEFINES` edge and open new one with `validFrom/validTo`.
2. For `IMPORTS`, mark edges inactive when dependency removed; track `lastSeenAt` from parser scans.
3. Provide timeline queries for module evolution (e.g., `getModuleHistory(modulePath)`).

## 10. Migration & Backfill Plan
1. Expand schema to include new fields and indexes; ensure safe defaults for existing edges.
2. Re-run AST parser to repopulate structural edges with enriched metadata; verify counts remain consistent.
3. For languages beyond TypeScript, document ingestion requirements and plan incremental rollout.
4. Provide audit reports comparing before/after metadata to ensure no regressions in import/export detection.

## 11. Risks & Mitigations
| Risk | Mitigation |
| --- | --- |
| Metadata explosion for multi-language support | Use generic fields plus namespaced metadata; keep core schema lean. |
| Parser inconsistencies between languages | Define adapter interface and validation tests per language. |
| Query performance degrade with new filters | Add targeted indexes and query caching; measure using benchmarks. |
| Temporal updates increasing ingestion workload | Optimize parser diffing to emit only changed edges; batch history updates. |

## 12. Implementation Milestones
1. Implement normalization helper & language adapters.
2. Update persistence/query layers and add indexes.
3. Reingest structural data; validate with integration tests.
4. Integrate temporal tracking and update history APIs.
5. Roll out navigation improvements (IDE, UI) leveraging new metadata.

## 13. Open Questions
- Should we introduce dedicated `MODULE` nodes to represent directories/packages more explicitly?
- How do we model multi-language modules (e.g., TS + JS + wasm) sharing imports/exports?
- Do we need to track wildcard imports’ expanded symbol sets, or rely on runtime resolution? Could this be metadata referencing derived edges?
- What is the retention/archival policy for historical structural data, especially for large codebases with frequent refactors?

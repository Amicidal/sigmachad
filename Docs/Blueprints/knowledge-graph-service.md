# Knowledge Graph Service Blueprint

## 1. Overview
`KnowledgeGraphService` orchestrates graph persistence across FalkorDB, Qdrant, PostgreSQL, and Redis while normalising code/documentation relationships and caching hot queries. It is the primary entry point for CRUD operations on graph entities, relationship enrichment, and downstream analyses such as impact or traversal queries.

## 2. Current Gaps
- **Inbound namespace application is inconsistent.** Write paths prefix entity IDs with the active namespace, but many read/update/delete entrypoints (e.g. `getEntity`, `getRelationships`, `deleteEntity`, Qdrant deletes) expect callers to pass already-prefixed IDs. Test helpers mutate fixtures in-place so suites pass, yet any caller that builds IDs ad-hoc or stores raw identifiers will miss records silently.
- **Relationship fetches bypass namespace helpers.** `deleteRelationship` and `getRelationshipById` forward the raw ID directly to FalkorDB, so mixed callers (prefixed + raw) surface 404-like behaviour even after entity ID fixes land.
- **Redis namespace is unused.** `GraphNamespaceConfig.redisPrefix` is derived but never threaded into cache key generation or Redis lookups. If left idle it creates dead configuration surface; if retained it should drive deterministic key computation for any Redis-backed features.

## 3. Desired Capabilities
1. Make namespace-aware lookups transparent so callers can pass either raw or prefixed entity IDs and always hit the correct graph/vector records.
2. Thread namespace metadata through secondary stores (Redis, future Postgres helpers) with a single source of truth for key/collection generation.
3. Keep lifecycle ergonomics (`shutdown`, `withScopedInstance`, cache controls) simple enough that harnesses never need to new-up extra instances just to reset state.
4. Canonicalise relationship identifiers (including cache/event payloads) so deduping and deletes survive namespace expansion.

## 4. Immediate Follow-ups
- Add internal helpers to normalize entity and relationship IDs with the active namespace before every read/update/delete execution path.
- Extend vector cleanup and relationship deletion (graph + vector) to call the new helpers so Falkor/Qdrant deletes target the namespaced records.
- Decide whether `redisPrefix` should be wired into cache key calculations or trimmed from the API to avoid misleading consumers.
- Capture the namespace contract (inputs, outputs, cache behaviour) in developer docs so service consumers stop hard-coding prefixes.

_(Added: 2025-09-19 after resolving KnowledgeGraphService relationship test contamination.)_

## 5. Recent Fixes
- **2025-09-19:** All nodes now receive a shared `Entity` label alongside their specific type. Database integration searches rely on this base label when correlating relational fixtures with graph fixtures; without it Falkor queries returned zero rows even though typed labels existed, masking cross-database drift.

## 6. Backlog
- [ ] **Namespace scope utilities**: introduce a `NamespaceScope` helper (or equivalent module) that exposes `resolveEntityId`, `resolveRelationshipId`, `qualifyRedisKey`, and `qdrantCollectionFor(kind)` so all call sites consume the same contract.
- [ ] **Relationship operations alignment**: refactor `deleteRelationship`, `getRelationshipById`, relationship cache invalidation, and event payloads to rely on `resolveRelationshipId` before touching FalkorDB or Redis.
- [ ] **Query normalization sweep**: apply the namespace helpers across `getRelationships`, traversal/impact queries, ingestion validation, and bulk upsert code paths to eliminate ad-hoc prefix checks.
- [ ] **Redis strategy decision**: either drive cache key generation off `namespace.qualifyRedisKey()` (including warm-path caches and invalidation) or remove `redisPrefix` from `GraphNamespaceConfig` and document the rationale.
- [ ] **Consistency guards**: add unit + integration coverage that exercises reads/deletes with raw and prefixed IDs, validates Qdrant payload cleanup, and asserts cache key derivation per namespace.
- [ ] **Namespace contract docs**: publish developer guidance outlining caller expectations (inputs, outputs, cache semantics, migration playbook) once helpers ship.

## 7. Test Coverage Notes
- Add unit coverage for the new namespace helper to assert that raw IDs, already-prefixed inputs, and empty strings resolve deterministically.
- Extend integration tests to create entities/relationships via raw IDs, read/delete them using mixed input formats, and assert Qdrant as well as FalkorDB state is updated.
- Exercise Redis-backed features (once implemented) to confirm keys segregate by namespace and invalidation honours the helper contract.

## 8. Open Questions
- Should relationship identifiers embed the same namespace prefix as entities (e.g., `${entityPrefix}rel_*`) or derive from hashed inputs to avoid double-prefixing? Current implementations generate canonical IDs without a namespace component.
- Do we need backward compatibility shims for persisted Redis keys if we start applying `redisPrefix`, or can we force a cache bust/migration window?
- Where should the namespace helper live (`GraphNamespaceConfig`, a standalone util, or as part of the service constructor) so it is accessible to other services that need the same behaviour?

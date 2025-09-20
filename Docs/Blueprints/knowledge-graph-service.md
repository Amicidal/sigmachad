# Knowledge Graph Service Blueprint

## 1. Overview
`KnowledgeGraphService` orchestrates graph persistence across FalkorDB and Qdrant while maintaining in-memory caches for entity lookups and search. Each instance derives a `NamespaceScope` so every CRUD path consistently applies the active namespace prefix, normalises relationship identifiers, and targets the correct Qdrant collections. Although the wider `DatabaseService` can supply PostgreSQL and Redis clients, the current implementation does not issue calls to those stores; they remain expansion points for future features.

## 2. Current State
- Namespaces are applied automatically on every entity and relationship read/write/delete path. Callers can provide raw IDs or pre-prefixed values and always hit the canonically namespaced records.
- Relationship canonicalisation now threads through FalkorDB operations, event payloads, and vector clean-up, so either legacy `rel_` or temporal `time-rel_` identifiers resolve to the same record.
- Entity upserts assign a common `Entity` label alongside specialised types, enabling FalkorDB queries that span code, documentation, and semantic clusters without schema drift.
- Temporal lifecycle helpers and embedding maintenance reuse the scoped namespace, ensuring Qdrant deletes operate on the same namespaced identifiers as graph mutations.

## 3. Known Gaps
- Redis namespace bindings exist (`GraphNamespaceConfig.redisPrefix` and `NamespaceScope.qualifyRedisKey`), but no cache keys are generated yet. We need either an integration plan for Redis-backed features or a decision to drop the surface area.
- Service consumers still rely on tribal knowledge for namespace expectations. We owe them explicit guidance on valid inputs, emitted IDs, and cache semantics.
- Namespace-aware tests cover entity fetches, but relationship pathways and Qdrant clean-up with mixed ID formats remain thin.

## 4. Desired Capabilities
1. Make namespace behaviour self-service: callers should never care whether IDs are raw or prefixed and should have documentation that reflects that guarantee.
2. Thread namespace metadata through secondary stores (Redis, future PostgreSQL helpers) from a single source of truth, or intentionally trim unused configuration.
3. Keep lifecycle utilities (`initialize`, `shutdown`, scoped helpers) straightforward so harnesses do not need to instantiate multiple services to flush state.
4. Ensure relationship canonicalisation and cache invalidation stay resilient as new edge types, temporal states, or aggregation jobs are introduced.

## 5. Immediate Follow-ups
- Decide on the Redis story: either wire `namespaceScope.qualifyRedisKey()` into the caches we plan to keep warm, or remove the prefix fields and document the rationale.
- Publish namespace contract documentation that explains caller expectations (input shapes, ID normalisation, cache behaviour) and link it from service entry points.
- Add regression coverage for relationship reads/deletes via raw IDs and ensure Qdrant deletions honour both raw and prefixed identifiers.

_(Updated: 2025-09-23 to reflect NamespaceScope rollout and resolved namespace gaps.)_

## 6. Recent Fixes
- **2025-09-19:** All nodes now receive a shared `Entity` label alongside their specific type. Database integration searches rely on this base label when correlating relational fixtures with graph fixtures.
- **2025-09-22:** Introduced `NamespaceScope` and routed every read/update/delete path through it, eliminating the need for callers to pre-prefix IDs.

## 7. Backlog
- [x] **Namespace scope utilities**: expose helpers (`resolveEntityId`, `resolveRelationshipId`, `qualifyRedisKey`, `qdrantCollectionFor`) and consume them across CRUD paths.
- [x] **Relationship operations alignment**: ensure `deleteRelationship`, `getRelationshipById`, cache invalidation, and event payloads use canonical namespaced IDs.
- [x] **Query normalisation sweep**: migrate `getRelationships`, traversal/impact queries, ingestion validation, and bulk upsert code paths to the namespace helpers.
- [ ] **Redis strategy decision**: drive cache key generation off `namespaceScope.qualifyRedisKey()` (including warm-path caches and invalidation) or remove the Redis prefix from `GraphNamespaceConfig` and document the migration.
- [ ] **Consistency guards**: extend unit + integration coverage for relationship reads/deletes and Qdrant payload clean-up using mixed ID formats.
- [ ] **Namespace contract docs**: publish developer guidance outlining caller expectations (inputs, outputs, cache semantics, migration playbook) and reference it from onboarding materials.

## 8. Test Coverage Notes
- Integration tests already validate entity CRUD via both raw and namespaced IDs; reuse those patterns for relationships, embeddings, and cache invalidation events.
- Add unit tests for `NamespaceScope` that cover relationship ID helpers and Redis key qualification, including empty inputs and already-prefixed values.
- Introduce Qdrant integration smoke tests that assert deletes succeed when triggered with raw IDs, proving the namespace helpers resolve to the stored payloads.

## 9. Open Questions
- When Redis-backed features arrive, do we need a cache-busting window for any existing keys, or can we safely assume new namespaces and key derivations? (Currently moot while Redis remains unused.)
- Should we continue deriving canonical relationship IDs from `from/to/type`, or move to hashed identifiers to guarantee stability if namespace prefixes change again?

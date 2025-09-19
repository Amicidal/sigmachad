# Knowledge Graph Service Blueprint

## 1. Overview
`KnowledgeGraphService` orchestrates graph persistence across FalkorDB, Qdrant, PostgreSQL, and Redis while normalising code/documentation relationships and caching hot queries. It is the primary entry point for CRUD operations on graph entities, relationship enrichment, and downstream analyses such as impact or traversal queries.

## 2. Current Gaps
- **Test isolation plumbing is incomplete.** `tests/test-utils/database-helpers.ts` provisions a `TestIsolationContext` (unique Falkor graph, Qdrant prefix, Redis namespace), but `KnowledgeGraphService`/`DatabaseService` ignore it. All integration suites operate against the shared `memento` graph, so reusing entity IDs between tests keeps prior relationships alive until manually deleted (observed on 2025-09-19 when `Relationship Operations` accumulated extra edges).
- **Cache reset hooks are missing.** The service maintains private `entityCache` and `searchCache` instances. External callers cannot invalidate them wholesale, forcing tests to either re-instantiate the service or craft targeted deletions when fixtures change.
- **Auxiliary stores share global collections.** Qdrant upserts always target `code_embeddings` / `documentation_embeddings`; there is no prefixing strategy tied to isolation contexts, so vector artifacts linger even after graph cleanup.
- **Lifecycle helpers assume singleton usage.** There is no `shutdown`/`dispose` pathway to close event emitters, Redis listeners, or background timers; long-running test harnesses may leak listeners when they create multiple service instances to work around the gaps above.

## 3. Desired Capabilities
1. Accept a `TestIsolationContext` (or general `GraphNamespace` descriptor) when constructing the service so Falkor graph keys, Qdrant collection names, Redis prefixes, and entity ID prefixes are derived automatically.
2. Expose explicit cache management (`resetCaches`, `invalidateByPrefix`) for harnesses and background jobs that need deterministic state.
3. Provide lifecycle methods (`shutdown`, `withScopedInstance`) to allow callers to spin up ephemeral services without accumulating global listeners.
4. Ensure default behaviours remain backward compatible for production (no context supplied → use legacy graph/collection naming), but make isolation opt-in trivial for tests and sandboxes.

## 4. Immediate Follow-ups
- Introduce a light adapter in `setupIsolatedServiceTest` that passes context metadata into `KnowledgeGraphService` once the service exposes the hooks, eliminating the per-test entity deletion workaround.
- Cascade the context into `DatabaseService` so Falkor/Qdrant helpers can rewrite graph keys and collection names without manual string manipulation in each call site.
- Update integration suites to rely on the new isolation entrypoint and drop bespoke cleanup logic once the service honours contexts.

_(Added: 2025-09-19 after resolving KnowledgeGraphService relationship test contamination.)_

## 5. Recent Fixes
- **2025-09-19:** All nodes now receive a shared `Entity` label alongside their specific type. Database integration searches rely on this base label when correlating relational fixtures with graph fixtures; without it Falkor queries returned zero rows even though typed labels existed, masking cross-database drift.

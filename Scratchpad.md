KnowledgeGraphService.ts
    Modularize the Monolith:
        This file is doing everything (CRUD, search, embeddings, history, impact analysis). Split into focused modules:
        EntityManager.ts: CRUD for entities/relationships.
        EmbeddingService.ts: Vector ops (move createEmbedding etc. here).
        ImpactAnalyzer.ts: analyzeImpact and related (it's ~500 lines alone!).
        HistoryManager.ts: Checkpoint/prune methods.
        Keep KnowledgeGraphService as a thin orchestrator.
        Benefits: Easier testing (per rules), better reusability, reduced cognitive load.
    Error Handling & Observability:
        Add structured logging (e.g., via pino or your project's logger) instead of console. Emit more events (e.g., on prune failures).
        In try/catch blocks, propagate non-fatal errors via events or metrics rather than swallowing.
        Validate inputs more (e.g., createRelationship assumes fromEntityId exists—add optional async validation).
    Performance/Optimization:
        Cache invalidation: invalidateEntityCache clears everything—scope it (e.g., invalidate searches with matching entityIds).
        Bulk ops: Good start, but add transactions for atomicity (FalkorDB supports?).
        Embeddings: Batch size limits? Add retry logic for Qdrant failures.
        Queries: Some Cypher is complex (e.g., analyzeImpact traversals)—profile with runBenchmarks method.
    Consider swapping to Neo4j for dev velocity (APOC Library, Native Vector Indexes (no need for qdrant), GDS library, native versioning)

ASTParser.ts
    Integrate ts-morph more deeply (look into using Program for all resolutions)
    Add github CodeQL queries for validation/testing

src/api/websocket-router.ts
    Suggested Library: Socket.io (for pub/sub + fallbacks)
    Features: Built-in rooms/namespaces for subscriptions (your subscriptions Map → io.to('event').emit()), ack/retry for messages, automatic reconnections, and middleware for auth (e.g., io.use((socket, next) => authenticate(next))). Backpressure via socket.compress(false) or adapters; heartbeats are default (pings every 25s).
    Performance: Handles 100k+ connections; your manual buffering is reinvented (use socket.write with queues). Filters via namespaces or adapters.
    Maintenance: Abstracts browser compat (polls if WS fails); your custom handleUpgrade + auth parsing could be io.engine.use() middleware. Reduces code to ~300 lines.

pino for logging
socket.io
Neo4j with vectors
Postgres
Ts-Morph
Tree-sitter
Babel/parser
zod
simple-git
Graphology
Sigma.js
Github CodeQL
prometheus
opentelemetry
jsondiffpatch
deepmerge
automerge
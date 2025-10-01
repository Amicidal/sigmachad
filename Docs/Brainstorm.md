### Project Memento

    The goal of Memento is to create an agent-first MCP server for AI coding agents so they have full awareness of the changes they intend to make and have made. It builds a knowledge graph over the codebase and uses a vector index to prevent context drift and code quality issues. It acts as a validation gate to ensure quality and prevent current and future technical debt.  The development lifecycle should go from Docs -> Tests -> Implementation

### Problems to solve
    Pre-Tool
        - Agents tend to reimplement instead of reusing existing code.
        - Finding and selecting implementations via multi-hop grep wastes tokens and misses edge cases.
        - Incorrect API usage (wrong args/order, hallucinated options).
        - Little consideration for current architecture/policies due to massive token wastage of searching every time. 

    Post-Tool
        - Codebase state changes make docs/imports stale; cascades across files.
        - Partial updates leave inconsistencies that aren’t caught.
        - No validation via static tools or agent driven self-reflection that changes align with architecture/policies.
        - Coding Agents can be incredibly deceptive in that they constantly create mocks or simplified versions of intended sophisticated implementations that breaks everything. 
        
   
### Architecture
    Language: TypeScript (Node.js)
    Graph Database: Neo4j (with APOC procedures, GDS algorithms, native vectors for embeddings; Qdrant standby for advanced vector needs)
    Vector Database: Neo4j Native (fallback to Qdrant if scaling exceeds)
    Orchestration: Docker Compose

### Lifecycle Gates
    Overview: Docs -> Tests -> Implementation -> Validation -> Impact -> Commit
    Docs
        - Spec must include title, goals, acceptance criteria.
        - Stored with ID; linked to all subsequent changes.
    Tests
        - Generate or update tests from the spec; initially failing is acceptable.
        - Enforce minimum changed-lines coverage threshold (configurable).
    Implementation
        - Propose diffs only after spec and tests exist.
        - Prefer reuse via graph and examples; block stubs/simplified mocks.
        - Respect architecture and policy constraints.
    Validation
        - TypeScript type-check, ESLint, security lint.
        - Architecture policy engine (layering, banned imports/deps).
        - All tests must pass; coverage threshold must be met.
    Impact
        - Update KG with clusters (group implementations for specs) and attach benchmarks to track perf regressions.
        - Auto-detect stale links via node IDs; propose updates without doc maintenance.
    Commit
        - Create branch/commit/PR with links to spec, tests, and validation report.

### Graph Schema
    Entities
        - File, Directory, Module/Package, Symbol, Function, Class, Interface, TypeAlias, Test, Spec, SemanticCluster (for spec-attached implementation groups), Benchmark (perf tracking)
    Edges
        - imports, exports, re-exports, defines, declares, calls, references, implements, tested-by, belongs-to, IMPLEMENTS_CLUSTER (spec to group), PERFORMS_FOR (benchmark to cluster/spec)
    Properties
        - path, hash, language, signature, docstring, lastModified, owningModule, coverage, cohesionScore (for clusters), trend (for benchmarks)

### Tooling API
    Exposed as an MCP server (Claude Code) and mirrored via HTTP function-calls (OpenAI).
    Tools
        - design.create_spec: Create/validate a feature spec; returns spec ID and acceptance criteria.
        - tests.plan_and_generate: Generate/update tests for a spec; returns changed files.
        - graph.search: Path/usage queries over symbols/APIs; finds reuse candidates.
        - graph.examples: Canonical usages and tests for an API, with signatures and arg order.
        - code.propose_diff: Stage edits as diffs; returns affected graph nodes.
        - validate.run: Run type-check, lint, policy checks, security lint, tests, coverage.
        - impact.analyze: Cascade analysis for stale imports/exports; propose consistency edits.
        - vdb.search: Semantic retrieval joined to graph nodes.
        - scm.commit_pr: Create branch/commit/PR with links to spec/tests/validation.

### Validation Policy
    Configuration file: memento.yaml
        - layers: allowed import directions; banned cross-layer imports.
        - bannedDependencies: disallowed packages or paths.
        - coverageMin: overall and changed-lines thresholds.
        - forbiddenPatterns: e.g., TODO returns, throw new Error('Not Implemented').
        - security: Append external scan results (e.g., Snyk/ESLint) as metadata on entities during sync/gates; query metadata for vulns, refactor critical ones immediately. No dedicated KG nodes—keep lean.
        - sessions: Ephemeral Redis cache for live coordination—store events (sequences, changeInfo, stateTransitions like pass→break, impacts) with TTL to next checkpoint (15-60 min) or fixed (discard after). KG anchors summaries (metadata refs on entities/clusters: {sessionId, outcome, checkpointId, keyImpacts}). Bridge service (SessionQueryService) joins for graph-aware queries (e.g., "isolate changes in active session").
          - Scalability: Handles 100+ agents (5k sessions/day, 250k events/day) via Redis Cluster/sharding by agentId; zero long-term growth (TTL discards). KG <5% load (anchors only).
          - Multi-Agent: Shared keys/pub-sub for handoffs (e.g., Agent A emits, B subscribes real-time). Ephemerality maximizes velocity—no bloat, focus on active swarms.
          - Examples (Live Queries):
            - Transitions: Redis: ZRANGE events:{sessionId} BY SCORE | filter 'pass' to 'broke'; Bridge: JOIN KG for affected cluster/spec (e.g., "Broke benchmark in this session").
            - Isolation: Redis: HGET session:{id} | filter agentId; Bridge: Traverse KG anchors (e.g., "Session XYZ's impacts on spec Y").
          - Checkpoints: Persist ref-only summary to KG metadata on emit; use for recovery/handover. Opt-in Postgres snapshot for failures (<5%).

        - docTemplate/testTemplate: shared templates for spec and test generation.
    Enforcement
        - Block direct file edits unless prior gates pass.
        - Reject diffs that reduce coverage below threshold or violate architecture.

### Integration Guides
    Claude Code (MCP)
        - Register Memento as an MCP server; tools listed above.
        - Enforce step order in system prompt; refuse direct edits until spec+tests exist.
        - On violations, reply with next required tool invocation.
    OpenAI Tools (Assistants)
        - Mirror MCP tools via HTTP function-calls; identical names/schemas.
        - Use tool-calling flow to enforce gates; server rejects out-of-order actions.
        - Return actionable errors pointing to the next required step.

### Implementation Notes
    Indexing
        - TypeScript-first via ts-morph for precise symbols/types.
        - Polyglot path via tree-sitter/LSP adapters.
    Storage
        - Graph: Neo4j (exposed via legacy FalkorDB command layer); Vector: Qdrant with metadata keyed to graph node IDs.
    Ops
        - Docker Compose services: memento, neo4j, qdrant.
        - File watcher to resync graph/vector on file changes.
        - CLI: memento validate, memento impact.

### Key Behaviors and Anti-Deception
    Pre-Tool
        - Favor reuse with graph.search and graph.examples; prevent hallucinated options via signature checks.
        - Replace multi-hop grep with path queries through the graph.
    Post-Tool
        - Auto graph/vector sync on accepted diffs.
        - Consistency sweep for stale imports/exports; propose follow-ups via impact.analyze.
    Anti-Deception Heuristics
        - Detect trivial or stub implementations and block merging.
        - Require changed-lines coverage and diff-linked tests.

### No-Maintenance Benefits
- Specs link to clusters via IDs; refactors update cluster members automatically—no doc path edits needed.
- Benchmarks attach to clusters/specs for progress tracking; regressions link to changes for root-cause.

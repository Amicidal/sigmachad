# Knowledge Graph Blueprints

## Current Blueprints
- knowledge-graph-service.md
- spec-relationships.md
- structural-relationships.md
- temporal-relationships.md
- tests-relationships.md
- performance-relationships.md

## Recent Updates
- **Package Structure**: Knowledge graph services moved to `@memento/knowledge` package
- **Path Aliases**: Updated imports to use @memento/* aliases instead of relative paths
- **Service Organization**: Analysis, embeddings, graph, ingestion, orchestration, and parsing modules restructured
- **Shared Types**: Common types moved to @memento/shared-types package

## Related Packages
- `@memento/knowledge` - Main knowledge graph package
- `@memento/shared-types` - Shared type definitions for entities and relationships
- `@memento/database` - Database services used by knowledge graph
- `@memento/api` - API endpoints that consume knowledge graph services

## Notes
- Relationships docs cover different dimensions (spec, structural, temporal, tests, performance). These may be consolidated under a single relationships index later.


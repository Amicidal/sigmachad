# Blueprints Index

This directory contains system blueprints organized by package domains to improve discoverability and enforce consistency.

Structure
- knowledge-graph: core graph service, relationships, performance
- sessions: session modeling, Redis/KG anchors, handoffs
- security: security metadata, relationships
- rollback: rollback capabilities and architecture diagrams
- api: API error handling and gateway-facing concerns
- sync: synchronization coordinator, backfills
- operations: maintenance and ops routines
- orchestration: multi-agent orchestration
- testing: test parsers, temporal test relationships
- observability: logging/metrics/tracing
- scm: source control management
- mcp: model context protocol tooling
- database: Falkor/Neo4j specifics

Standards
- Required sections in every blueprint:
  - Overview
  - Desired Capabilities (or Next Steps/Backlog)
  - Metadata (must include Scope)
  - Working TODO (live checklist)
- Pre-commit auto-fixes missing sections and fails on incomplete docs if not fixable.

Getting Started
- Use the template at Docs/Blueprints/template.md to start a new blueprint.
- Keep scope names aligned with directory names (e.g., knowledge-graph, sessions, security).
- Link code touchpoints using workspace-relative paths like packages/<pkg>/src/<file>.

Domain Indices
- [knowledge-graph](knowledge-graph/README.md)
- [sessions](sessions/README.md)
- [security](security/README.md)
- [rollback](rollback/README.md)
- [api](api/README.md)
- [sync](sync/README.md)
- [operations](operations/README.md)
- [orchestration](orchestration/README.md)
- [testing](testing/README.md)
- [observability](observability/README.md)
- [scm](scm/README.md)
- [mcp](mcp/README.md)
- [database](database/README.md)

# Memento

A local-first AI coding assistant that provides comprehensive codebase awareness through a knowledge graph system.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development environment
pnpm dev

# Build the project
pnpm build

# Run tests
pnpm test
```

## Project Structure

This is a monorepo with the following structure:

- `apps/main/` - Main application entry point
- `packages/` - Shared packages and services
  - `@memento/api` - REST/tRPC/WebSocket API layer
  - `@memento/core` - Core services and types
  - `@memento/database` - Database services
  - `@memento/knowledge` - Knowledge graph operations
  - `@memento/sync` - Synchronization services
  - `@memento/testing` - Test execution services
  - `@memento/backup` - Backup operations

## Path Aliases

The project uses TypeScript path aliases for clean imports:

```typescript
// Instead of relative imports
import { KnowledgeGraphService } from "../../../dist/services/knowledge/index.js";

// Use path aliases
import { KnowledgeGraphService } from "@memento/knowledge";
```

Available aliases:
- `@memento/api` - API package
- `@memento/core` - Core package
- `@memento/database` - Database package
- `@memento/knowledge` - Knowledge package
- `@memento/sync` - Sync package
- `@memento/backup` - Backup package
- `@memento/testing` - Testing package

## Documentation

See the [Docs](./Docs/) directory for detailed documentation:

- [Architecture Overview](./Docs/MementoArchitecture.md)
- [API Design](./Docs/MementoAPIDesign.md)
- [Knowledge Graph Design](./Docs/KnowledgeGraphDesign.md)
- [Blueprints](./Docs/Blueprints/) - Technical specifications

## Development

Refer to [CLAUDE.md](./CLAUDE.md) for development guidelines and workflow instructions.
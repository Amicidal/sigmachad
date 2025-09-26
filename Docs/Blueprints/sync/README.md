# Sync Blueprints

## Current Blueprints
- synchronization-coordinator.md

## Recent Updates
- **Package Structure**: Sync services moved to `@memento/sync` package
- **Path Aliases**: Updated imports to use @memento/* aliases for cleaner dependencies
- **SCM Integration**: Source control management restructured under packages/sync/src/scm/
- **Type Safety**: Sync-related types moved to @memento/shared-types

## Related Packages
- `@memento/sync` - Main synchronization package
- `@memento/shared-types` - Shared type definitions for sync operations
- `@memento/knowledge` - Knowledge graph updates triggered by sync
- `@memento/database` - Database persistence for sync state


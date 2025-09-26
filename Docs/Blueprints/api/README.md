# API Blueprints

## Current Blueprints
- api-error-handling.md
- websocket-integration.md

## Recent Updates
- **Path Aliases**: API package now uses @memento/* imports instead of relative paths
- **Project Structure**: Moved from single src/ to packages/api/ structure
- **Import Changes**: Updated all API route handlers to use @memento/knowledge, @memento/database, etc.

## Related Packages
- `@memento/api` - Main API package with REST/tRPC/WebSocket endpoints
- `@memento/knowledge` - Knowledge graph operations used by API
- `@memento/database` - Database services used by API routes
- `@memento/shared-types` - Shared type definitions across packages

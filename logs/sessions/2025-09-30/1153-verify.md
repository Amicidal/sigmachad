Task & Definition
- Verify reported TypeScript build/config issues across monorepo (shared-types composite config, path alias resolution, missing exports/types, API mismatches, and missing deps).

Constraints/Risks
- Avoid noisy builds; restricted network; focus on static verification via code search. Build logs redirected if invoked.

Code Searches
- List dirs: ls packages, apps (verified structure)
- Inspect shared-types package.json/tsconfig/index.ts/core-types.ts
- Inspect tsconfig.base.json for '@memento/*' path aliases; graph/core tsconfigs and references
- Search for missing types: rg target names across repo
- Check database package exports for IDatabaseHealthCheck
- Look for KnowledgeGraphService.getDependencies and SecurityScanner.scanPath definitions + call sites
- Inspect APIGateway.ts for request.auth augmentation
- Inspect MCP server main.ts for RelationshipQuery usage and doc parser method
- Inspect backup storage provider imports and aws lib-storage dep

Web Searches
- None (offline verification).

Implementation Notes
- Confirmed shared-types package.json references src/*.d.ts while tsconfig outDir=dist (composite true). Dist contains dist/src/*.d.ts, mismatch likely causes TS6305.
- Path aliases present; graph tsconfig references core/shared-types/database; composite build depends on shared-types building first.
- Found SessionCheckpoint* types defined in core-types.ts but not exported from shared-types index.ts; others (RestoreResult, ComponentValidation, Postgres* types) not defined anywhere.
- Database package index.ts does not re-export IDatabaseHealthCheck; only exists in shared-types.
- KnowledgeGraphService exposes getEntityDependencies(); mcp-server calls getDependencies(); mismatch confirmed.
- SecurityScanner has no scanPath method; used by mcp-server.
- APIGateway assigns request.auth without FastifyRequest module augmentation.
- Backup Storage providers import types from './BackupStorageProvider.js' which doesn't re-export them; types originate in shared-types; import paths should be updated or re-export added.
- @aws-sdk/lib-storage not present in backup/package.json despite dynamic import usage.

Validation Evidence
- See code excerpts cited in chat and the following files: packages/shared-types/package.json, packages/shared-types/tsconfig.json, packages/shared-types/src/index.ts, packages/shared-types/src/core-types.ts, packages/database/src/interfaces.ts, packages/knowledge/src/orchestration/KnowledgeGraphService.ts, packages/testing/src/security/scanner.ts, packages/api/src/APIGateway.ts, apps/mcp-server/src/main.ts, packages/backup/src/BackupStorageProvider.ts, packages/backup/src/S3StorageProvider.ts, packages/backup/package.json.
- Optional compile run not executed (sufficient static evidence).

Open Follow-ups
- Decide fix strategy for shared-types distribution (point package.json main/types/exports to dist, or set declarationDir to src and disable composite).
- Export missing types via index.ts and define new types (RestoreResult, ComponentValidation, Postgres* types) or adjust call sites to existing types.
- Re-export IDatabaseHealthCheck from database package or update consumers to import from shared-types.
- Update mcp-server to use getEntityDependencies() and DocumentationParser.syncDocumentation().
- Add Fastify module augmentation for request.auth or refactor to reply.locals/session.
- Fix storage provider type imports; add '@aws-sdk/lib-storage' as dep or guard features.

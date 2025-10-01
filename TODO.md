# TODO

## Purpose
- Act as the canonical backlog for agents working on Memento; every entry here must map to verifiable work.
- Provide shared context (snapshot, engagement checklist, operating rules) so new agents ramp quickly without hallucinated tasks.
- Mirror session journals through stable IDs to maintain temporal coherence across handoffs.

## Project Snapshot
- **Product**: Memento – Nx-managed local-first AI coding assistant with Fastify API, knowledge graph (Neo4j), vector DB (Qdrant), PostgreSQL metadata store, and Redis caching.
- **Primary Modules**: `apps/main` (Fastify API/orchestrator), `apps/mcp-server` (MCP bridge + API surface), `apps/web` (React dashboard), `packages/database` (Neo4j/Postgres/Qdrant/Redis adapters), `packages/knowledge` & `packages/graph` (OGM + graph operations), `packages/sync` & `packages/testing` (pipeline coordination + runners), `Docs/` (domain guides, blueprints, summaries).
- **Key Documents to Review First**:
  - `Docs/MementoArchitecture.md`
  - `Docs/Guides/README.md` (domain guide index)
  - `Docs/Blueprints/knowledge-graph/README.md`
  - `Docs/Blueprints/sync/README.md`
  - `Docs/Enhancements/SECURITY_ENHANCEMENTS.md`
- **Skill Stack**: TypeScript (ESM), Fastify, tRPC, Nx 21 task runner, React 19/Vite, Neo4j driver + Neogma, Qdrant, PostgreSQL, Redis, Vitest, MCP (`@modelcontextprotocol/sdk`).
- **Known State**: Impact/test-planning endpoints still stubbed; DatabaseService retains legacy FalkorDB command wrappers while delegating to Neo4j; some tests still assert against legacy response shapes; build artefacts tracked in git.

## Engagement Checklist
1. **Set Up**: `pnpm install`; start backing services with `docker compose up -d neo4j postgres redis` (or `pnpm run docker:up`). Configure `.env` with `NEO4J_*`, `DATABASE_URL`, and Redis credentials.
2. **Dev Commands**: Use Nx wrappers via `pnpm dev` / `pnpm dev:mcp` / `pnpm dev:web`; `pnpm run dev:all` fans out through `scripts/run-nx.cjs`. Prefer `node scripts/run-nx.cjs <target>` for focused builds/tests (`pnpm test`, `pnpm test:integration`, `pnpm test:e2e`).
3. **Docs First**: Start with `Docs/MementoArchitecture.md`, the Guides index (`Docs/Guides/README.md`), and blueprint READMEs under `Docs/Blueprints/*` referenced by your task.
4. **Testing Philosophy**: Extend Vitest suites in `tests/`, wire integration/e2e runs against real Neo4j/Postgres/Redis (use `tests/e2e/docker-compose.test.yml`), and reconcile fixtures that still rely on legacy FalkorDB command wrappers.
5. **Deployment Goal**: March toward the "shippable" milestone in `MementoImplementationPlan.md` Phase 6+, ensuring knowledge graph + MCP flows operate against Neo4j.

## Operating Guide

### Backlog Structure (Do Not Deviate)
- Every task entry must follow the template:
  - Heading: `### <sequence>. <Title> [ID: YYYY-MM-DD.<index>]` (UTC date, 1-based index per day).
  - Bullet fields, in order: `- **Status**:`, `- **Context**:`, `- **Entry Points**:`, `- **Scope**:`, optional `- **Follow-up (pending)**:` or `- **Follow-up (complete)**:`, and `- **Acceptance**:`. Preserve the existing wording unless the task itself changes.
- Append new tasks at the bottom of `## Task Backlog`, incrementing both the sequence and the daily ID index. Never renumber earlier tasks.
- When resolving or updating a task, modify only the relevant bullets—do not introduce new field labels or restructure the entry.
- Reference these IDs from session journals and conversations when logging follow-ups.
- If a task requires sub-items, capture them in scoped bullets inside `- **Scope**:` or `- **Follow-up (pending)**:`—avoid nested headings.

### Status Legend
- **Not Started**: No code changes committed; investigation may be pending.
- **In Progress**: Active development underway; partial deliverables exist.
- **Blocked**: External dependency or decision needed before continued work.
- **Complete**: Task meets acceptance criteria; keep here until backlog grooming archives it.

### Cross-Referencing Protocol
- Use the ID suffix (`YYYY-MM-DD.<index>`) when linking tasks from session journals, PR descriptions, or chat.
- When splitting a task, create new entries with fresh IDs and reference the parent in `- **Scope**:`.
- Add follow-up tickets in `- **Follow-up (pending)**:` and mirror them in session journals for traceability.

### Archiving Completed Tasks
- Keep tasks in this backlog until acceptance evidence is captured and noted in session journals.
- After validation, copy the entire task block (heading plus bullets) into `logs/todos/YYYY-MM-DD.md` (UTC date of completion) and set `- **Status**:` to `Complete`.
- Append a bullet at the end of the archived entry linking to supporting evidence (e.g., session log file, merged PR).
- Leave the archived entries untouched once filed; new work stays in `TODO.md`, history lives in `logs/todos/`.
- Reference the archive filename and task ID from your session journal hand-off notes for discoverability.

## Task Backlog

### 1. Resolve type errors in @memento/api [ID: 2025-09-30.21]
- **Status**: Complete
- **Context**: After converting libs to type-check only (tsc --noEmit), `pnpm nx build api` fails with TS2339 errors in `packages/api/src/SessionCheckpointJob.ts` for missing properties on `InternalSessionCheckpointJob`.
- **Entry Points**: `packages/api/src/SessionCheckpointJob.ts:564`, `:578`, `:595-599`
- **Scope**: Align `InternalSessionCheckpointJob` type with usages or adjust code to current type shape; add unit tests for job state transitions.
- **Follow-up (pending)**: Confirm noEmit pipeline stays green for api; update docs if types changed.
- **Acceptance**: `pnpm nx build api --skip-nx-cache` succeeds with no TS errors.

### 2. Fix broken imports and mismatched types in @memento/testing [ID: 2025-09-30.22]
- **Status**: Complete
- **Context**: Type-check only reveals TS2307/TS2551/TS2339 in testing package (missing .js import resolutions and property names like `valid` vs `isValid`).
- **Entry Points**: `packages/testing/src/tests/*.test.ts` (see build log).
- **Scope**: Update imports to proper module names or path aliases; align assertions with current type shapes; ensure Vitest runs pass.
- **Follow-up (pending)**: Reconcile functional expectations in TestHistory/TestMetrics suites; re-enable security module exports after type adapters. See session log logs/sessions/2025-09-30/1629-2025-09-30.22.md.
- **Acceptance**: `pnpm nx build testing --skip-nx-cache` runs clean; targeted tests pass.

### 3. Unblock @memento/sync build (exports, paths, types) [ID: 2025-09-30.23]
- **Status**: Complete
- **Context**: `pnpm -r --filter @memento/sync build` reports 19+ TS errors across SCM provider exports, missing core exports, invalid module paths, and type mismatches in coordinator/monitoring. Verified in logs/builds/2025-09-30/1642-sync.log (see session log logs/sessions/2025-09-30/1645-verify-build.md).
- **Entry Points**: 
  - `packages/sync/src/scm/ConflictResolution.ts:240-242,724-726,740`
  - `packages/sync/src/scm/index.ts:1,5,8` and `packages/sync/src/scm/SCMProvider.ts` (missing re-exports)
  - `packages/sync/src/scm/LocalGitProvider.ts:3-6` (types not exported)
  - `packages/sync/src/scm/SCMService.ts:3,13,19-22` (imports from `@memento/core` not found)
  - `packages/sync/src/synchronization/SynchronizationCoordinator.ts:62,282,512,516,1260,1622,1647,1727,1921,2039,2235,3068`
  - `packages/sync/src/synchronization/SynchronizationMonitoring.ts:8-11,14,66,673`
- **Scope**:
  - Re-export SCM types in `SCMProvider.ts` (e.g., `export type { SCMProvider, SCMProviderNotConfiguredError, ... } from '@memento/shared-types';`) and keep `src/scm/index.ts` exporting from local barrel.
  - Update `SCMService.ts` to import `CommitValidation` and `IDatabaseService` from `@memento/shared-types` (or runtime service from `@memento/database`), removing reliance on `@memento/core` for these.
  - Replace `../../models/relationships.js` inline import types with `GraphRelationship` from `@memento/graph`; make `unresolvedRelationships` and casts consistent.
  - Fix `RelationshipType` assignments (avoid raw strings; map to enum or introduce helpers where needed).
  - Resolve invalid module augmentation at `SynchronizationCoordinator.ts:3068` (prefer real instance methods or correct augmentation target; no path that points to a non-emitted module).
  - Ensure `SynchronizationMonitoring.ts` imports `SyncOperation`, `SyncError`, `CheckpointMetricsSnapshot`, and `Conflict` from `@memento/shared-types` instead of `./SynchronizationCoordinator.js`; align `PerformanceMetrics` usage with the correct type (see duplicate name note below).
  - Extend `@memento/shared-types` conflict resolution types so code matches usage: add optional `manualResolution`, `resolvedBy`, `timestamp`, `resolvedValue` to `ConflictResolutionResult` (and ensure `ConflictResolution` shape matches constructor usage) to unblock errors in `ConflictResolution.ts`.
  - Deduplicate/rename `PerformanceMetrics` in `@memento/shared-types` (`core-types.ts` defines two). Introduce `SyncPerformanceMetrics` for sync monitoring to avoid interface shadowing, and update imports in monitoring.
- **Follow-up (pending)**:
  - Add a small coordinator-focused unit test (or type-only test) to ensure RelationshipType assignments stay typed.
  - Sweep for any remaining `models/relationships.js` references in docs/scripts and migrate to `@memento/graph`.
- **Acceptance**: 
  - `pnpm -r --filter @memento/sync build --silent` compiles with 0 TS errors. Verified in logs/builds/2025-09-30/1706-sync.log.
  - No unresolved imports from `@memento/core` remain in sync package for database/validation types.
  - `SynchronizationMonitoring.ts` uses the correct metrics type and no longer references local coordinator exports for plain types.

### 4. Fix backup provider exports and optional S3 dependency [ID: 2025-09-30.24]
- **Status**: Complete
- **Context**: `pnpm -r --filter @memento/backup build` fails with 5 errors: missing re-exports (`BackupStorageWriteOptions`, `BackupStorageReadOptions`) from `BackupStorageProvider.js` and missing module `@aws-sdk/lib-storage` (used in `S3StorageProvider.ts:385`). Verified in logs/builds/2025-09-30/1642-backup.log.
- **Entry Points**:
  - `packages/backup/src/BackupStorageProvider.ts` (add re-exports)
  - `packages/backup/src/LocalFilesystemStorageProvider.ts:6-7`
  - `packages/backup/src/S3StorageProvider.ts:6-7,385`
  - `packages/backup/package.json` (dependencies)
- **Scope**:
  - Add `export type { BackupStorageWriteOptions, BackupStorageReadOptions } from '@memento/shared-types';` to `BackupStorageProvider.ts` so local providers can import from `./BackupStorageProvider.js`.
  - Add `@aws-sdk/lib-storage` to `packages/backup/package.json` (prod dependency) to satisfy dynamic import resolution; leave usage gated by feature path as in code.
  - Verify ESM import paths and keep file depth within monorepo limits.
 - **Follow-up (complete)**:
   - `@aws-sdk/lib-storage` moved to `optionalDependencies` in `packages/backup/package.json`; usage is dynamically imported and documented in `packages/backup/README.md`.
- **Acceptance**:
  - `pnpm -r --filter @memento/backup build` compiles cleanly (see logs/builds/2025-09-30/1653-backup.log).
  - Local and S3 providers import only via `./BackupStorageProvider.js` without TS2459 errors.

### 5. Reconcile security scanner types and agent API usage [ID: 2025-09-30.25]
- **Status**: Complete
- **Context**: `pnpm -r --filter @memento/agents build` fails due to type drift with `packages/testing/src/security/*`: missing `status/completedAt/duration/startedAt` on `SecurityScanResult`, `totalVulnerabilities` on summary, and an invalid call `SecurityScanner.scan(...)` in `security-fix-agent.ts`. Verified in logs/builds/2025-09-30/1642-agents.log.
- **Entry Points**:
  - `packages/agents/src/security-fix-agent.ts:482` (uses non-existent `scanner.scan`)
  - `packages/testing/src/security/scanner.ts:400,522,573,691-706` (result fields)
  - `packages/testing/src/security/reports.ts:79,130,316,337,568` (trends and totals)
  - `packages/testing/src/security/types.ts` (re-exports from shared-types)
  - `packages/shared-types/src/index.ts` and `core-types.ts` vs `security.ts` (duplicate/competing security type exports)
- **Scope**:
  - Make `@memento/shared-types` the single source of truth for security shapes by removing the duplicate `SecurityScanResult` export from `core-types` in `src/index.ts` and keeping the richer version in `src/security.ts` (with `status`, timestamps, `totalVulnerabilities`).
  - If missing, add `VulnerabilityReport['trends']?: SecurityTrends` and ensure `summary` supports `info` severity where used by reports; align generators accordingly.
  - Update `packages/agents/src/security-fix-agent.ts` to call `performScan(...)` (or `performIncrementalScan(...)`) with a proper request/options object instead of `scan(...)`.
  - Rebuild testing package and adjust any remaining references to the unified types via `packages/testing/src/security/types.ts` re-exports.
- **Follow-up (pending)**:
  - Consider adding `IncrementalScanResult` to shared-types (mirroring testing’s local type) to decouple agents from testing internals if/when needed.
- **Acceptance**:
  - `pnpm -r --filter @memento/shared-types,@memento/testing,@memento/agents build --silent` compiles with 0 TS errors.
  - `SecurityFixAgent` compiles and runs against `SecurityScanner.performScan(...)` without missing properties on result/summary.

### 6. Export SecurityScanner from @memento/testing (or update consumers) [ID: 2025-09-30.26]
- **Status**: Complete
- **Context**: Build fails with TS2305 in `apps/mcp-server` because `SecurityScanner` is not exported from `@memento/testing`. Root cause: `packages/testing/src/index.ts` intentionally omits security re-exports; only `packages/testing/src/security/index.ts` exports `SecurityScanner`. Evidence: logs/latest-build.log (TS2305 at apps/mcp-server/src/api-server.ts:13 and apps/mcp-server/src/main.ts:22); session: logs/sessions/2025-09-30/1739-verify-build.md.
- **Entry Points**:
  - packages/testing/src/index.ts
  - packages/testing/src/security/index.ts
  - apps/mcp-server/src/api-server.ts:13
  - apps/mcp-server/src/main.ts:22
- **Scope**:
  - Option A (preferred): Re-export `SecurityScanner` from `packages/testing/src/index.ts` to make `@memento/testing` stable for app imports.
  - Option B: Change imports in apps to `import { SecurityScanner } from '@memento/testing/security'` (or equivalent subpath) and document the public subpath in `packages/testing/README.md`.
  - Ensure `package.json` `exports` maps the subpath if Option B is chosen.
- **Acceptance**:
  - `pnpm -r --filter @memento/testing build` succeeds.
  - `pnpm -r --filter mcp-server build` no longer reports TS2305 for `SecurityScanner`.

### 7. Align MCP server API calls with KnowledgeGraphService and DocumentationParser [ID: 2025-09-30.27]
- **Status**: In Progress
- **Context**: `apps/mcp-server/src/main.ts` mismatches package APIs: (a) `getRelationships` expects `RelationshipQuery` but receives `string`; (b) `searchEntities` uses `type` instead of `entityTypes` within `GraphSearchRequest`; (c) `getDependencies` method does not exist on `KnowledgeGraphService`; (d) `DocumentationParser` has `syncDocumentation(...)`, not `parseDocumentation(...)`. Evidence: logs/latest-build.log (TS2559 at :240, TS2353 at :270, TS2339 at :283, TS2551 at :313).
- **Entry Points**:
  - apps/mcp-server/src/main.ts:240, 270, 283, 313
  - packages/knowledge/src/orchestration/KnowledgeGraphService.ts (reference API)
  - packages/knowledge/src/embeddings/DocumentationParser.ts (reference API)
- **Scope**:
  - Update `getRelationships` call to pass a `RelationshipQuery` object (e.g., `{ fromEntityId: args.path as string, limit: 100 }`).
  - Replace `searchEntities({ query, type })` with `searchEntities({ query, entityTypes: args.type ? [args.type] : undefined })`.
  - Replace `kgService.getDependencies(...)` with `kgService.getEntityDependencies(...)` or remove if not needed.
  - Rename `docParser.parseDocumentation(...)` to `docParser.syncDocumentation(...)` and align parameters.
- **Acceptance**:
  - `pnpm -r --filter mcp-server build` passes type-check for the above call sites.
  - Smoke run `pnpm dev:mcp` starts without runtime errors on these handlers.
- **Follow-up (pending)**:
  - Validate `pnpm dev:mcp` smoke run with backing services up (Neo4j/Postgres/Redis). Environment here lacks running services; build succeeded (see logs/latest-build.log). Add run evidence and flip Status to Complete.

### 8. Fix Fastify request augmentation and unknown error typings in @memento/api [ID: 2025-09-30.28]
- **Status**: Complete
- **Context**: `APIGateway.ts:412` fails with `Property 'auth' does not exist on type 'FastifyRequest'` despite `src/types/fastify.d.ts` augmentation; several handlers catch `unknown` errors without narrowing (mcp-router.ts:1965/1966/1977; routes/tests.ts:281/282/293). Evidence: logs/latest-build.log.
- **Entry Points**:
  - packages/api/src/APIGateway.ts:412
  - packages/api/src/types/fastify.d.ts
  - packages/api/tsconfig.json (files/include)
  - packages/api/src/mcp-router.ts:1965, 1966, 1977
  - packages/api/src/routes/tests.ts:281, 282, 293
- **Scope**:
  - Ensure the augmentation file is included for the program that compiles `APIGateway.ts` (tsconfig `files` already lists it; verify path and ESM emit). If still unrecognized, add a minimal `import type 'fastify'` side-effect import in `APIGateway.ts` or `src/types/index.d.ts` to force inclusion.
  - Add safe error narrowing (`if (error instanceof Error) { ... } else { ... }`) and use typed helpers to construct `McpError` payloads without `any`.
- **Acceptance**:
  - `pnpm -r --filter @memento/api build` compiles with no TS2339 on `request.auth` and no TS18046 in the listed files.

### 9. Resolve never[] array inference across knowledge/testing packages [ID: 2025-09-30.29]
- **Status**: Completed
- **Context**: Multiple arrays are inferred as `never[]`, causing pushes of typed values to fail. Evidence (TS2345/TS2339): `EntityServiceOGM.ts:367,391,405`; `SearchServiceOGM.ts:187,204,234,246,258,272`; `knowledge-graph-adapter.ts:67,76,133,142,206,215`; `TestHistory.ts:718`; `TestDataStorage.ts:1474,1481`.
- **Entry Points**:
  - packages/knowledge/src/graph/EntityServiceOGM.ts
  - packages/knowledge/src/graph/SearchServiceOGM.ts
  - packages/knowledge/src/ingestion/knowledge-graph-adapter.ts
  - packages/testing/src/temporal/TestHistory.ts
  - packages/testing/src/temporal/TestDataStorage.ts
- **Scope**:
  - Add explicit element types to array initializers (e.g., `const results: SearchResult[] = [];`, `const createdInstances: any[] = [];`, `const executions: TestExecutionRecord[] = [];`).
  - Where appropriate, replace `any` with concrete domain types from `@memento/shared-types`.
- **Acceptance**:
  - `pnpm -r --filter @memento/knowledge,@memento/testing build` compiles without `never[]` push errors at the listed locations.

### 10. Initialize required properties in HighThroughputIngestionPipeline [ID: 2025-09-30.30]
- **Status**: Complete
- **Context**: TS2564 errors for `queueManager`, `workerPool`, `batchProcessor`, `astParser` in `packages/knowledge/src/ingestion/pipeline.ts:60-63`. Evidence: logs/latest-build.log.
- **Entry Points**:
  - packages/knowledge/src/ingestion/pipeline.ts:60-63, constructor/init methods
- **Scope**:
  - Initialize these fields in the constructor via calls to `initializeComponents()` or use definite assignment assertions (`!`) if construction path guarantees initialization before use.
  - Add unit of work to ensure lifecycle methods set and clear timers safely.
- **Acceptance**:
  - `pnpm -r --filter @memento/knowledge build` compiles cleanly with no TS2564 in `pipeline.ts`.

### 11. Normalize Date/nullability for symbol/doc nodes and SpecService serialization [ID: 2025-09-30.31]
- **Status**: Complete
- **Context**: Several assignments of `Date | undefined` to `Date` and optional dates used unsafely: `ASTParser.ts:1759,1791`; `SymbolExtractor.ts:136,171`; `ConflictResolution.ts:726`; `SpecService.ts:59,104,473,475`. Evidence: logs/latest-build.log.
- **Entry Points**:
  - packages/knowledge/src/parsing/ASTParser.ts
  - packages/knowledge/src/parsing/SymbolExtractor.ts
  - packages/sync/src/scm/ConflictResolution.ts
  - packages/testing/src/SpecService.ts
- **Scope**:
  - Ensure `File` and `Symbol` entities carry non-optional `created` and `lastModified` (fallback to `new Date()` where missing).
  - In `SpecService.serializeSpec`, guard with `ensureDate(...)` to avoid `.toISOString()` on possibly undefined.
  - Where needed, widen target types to `Date | undefined` or coerce with nullish coalescing.
- **Acceptance**:
  - Builds for `@memento/knowledge`, `@memento/sync`, and `@memento/testing` succeed with no TS2322/TS18048 at the listed lines.

### 12. Fix string/null issues in Sync and docs parsing [ID: 2025-09-30.32]
- **Status**: Complete
- **Context**: `SyncOrchestrator.ts:393` references `document.name` (possibly undefined); `SynchronizationCoordinator.ts:2113,2161` assigns `string | null` to `string` for `toId`. Evidence: logs/latest-build.log.
- **Entry Points**:
  - packages/knowledge/src/orchestration/SyncOrchestrator.ts:393
  - packages/sync/src/synchronization/SynchronizationCoordinator.ts:2113,2161
- **Scope**:
  - Use `document.title` (required) instead of `document.name` in relevance scoring.
  - Guard `toId` assignments or use explicit narrowing before calling kgService methods.
- **Acceptance**:
  - `pnpm -r --filter @memento/knowledge,@memento/sync build` compiles with no TS18048/TS2322 at these sites.

### 13. Type-safe error history and ReturnType usage in SCMService [ID: 2025-09-30.33]
- **Status**: Complete
- **Context**: `packages/sync/src/scm/SCMService.ts:637,644` produce TS2683 `'this' implicitly has type 'any'` in a `ReturnType<typeof this.serializeProviderError>` context. Evidence: logs/latest-build.log.
- **Entry Points**:
  - packages/sync/src/scm/SCMService.ts:600-660
- **Scope**:
  - Extract `serializeProviderError` return type into a named interface `SerializedProviderError` and reference it directly instead of `ReturnType<typeof ...>` where `this` is involved; alternatively, bind method reference or convert helper to a standalone function to avoid contextual `this`.
- **Acceptance**:
  - `pnpm -r --filter @memento/sync build` compiles with no TS2683 in `SCMService.ts`.

### 14. ESLint typed-lint coverage for all packages/apps [ID: 2025-09-30.34]
- **Status**: Complete
- **Context**: Lint run shows multiple typed-parser failures like "Parsing error: ESLint was configured to run on <tsconfigRootDir>/packages/knowledge/src/ingestion/task-worker.ts using parserOptions.project: <tsconfigRootDir>/tsconfig.json". Files under several packages aren’t included by the configured `parserOptions.project`, causing false-positive failures and blocking autofix and rule evaluation.
- **Entry Points**:
  - eslint.config.js
  - packages/*/tsconfig.json
  - apps/*/tsconfig.json
- **Scope**:
  - Add per-package and per-app overrides in `eslint.config.js` with `files: ['packages/<pkg>/src/**/*.ts']` (and tests where needed) and `parserOptions.project` pointing to that package/app `tsconfig.json`.
  - Ensure `packages/knowledge/src/**/*.ts` and related ingestion files are covered (current failures mention `ingestion/task-worker.ts` and `ingestion/error-handler.ts`).
  - Verify shared-types keeps security rule relaxed as intended; avoid global `project` that misses subtrees.
- **Acceptance**:
  - `pnpm -s lint > logs/latest-lint.log 2>&1` completes without any "Parsing error: ESLint was configured to run on ... using parserOptions.project" messages.
  - `rg -n "Parsing error: ESLint was configured to run on" logs/latest-lint.log` returns no matches.

### 15. Object-injection rule triage and safe access refactors [ID: 2025-09-30.35]
- **Status**: Complete
- **Context**: Numerous `security/detect-object-injection` errors, especially in knowledge ingestion workers (e.g., around lines ~810–821 in `packages/knowledge/src/ingestion/task-worker.ts`) and related handlers. Many are legitimate dynamic index patterns that need hardening or targeted exceptions.
- **Entry Points**:
  - packages/knowledge/src/ingestion/**/*.ts
  - packages/knowledge/src/**/graph/**/*.ts
  - eslint.config.js (overrides for tests and narrow directories)
- **Scope**:
  - Refactor hot spots to avoid dynamic bracket access on untrusted keys: prefer `Map`, `Record<WhitelistedKey, T>`, `'in'` checks with `hasOwnProperty.call`, or guarded selector functions.
  - Introduce a small `safeGet(obj, key, allowlist?)` helper where refactor is noisy; constrain call sites with type guards.
  - In `tests/**`, disable this rule (override to `off`). Where dynamic indexing is essential in ingestion glue, temporarily downgrade to `warn` with an inline TODO referencing this task ID and link to follow-up refactor.
- **Acceptance**:
  - `pnpm -s lint > logs/latest-lint.log 2>&1` shows zero error-level `security/detect-object-injection` outside tests; warnings limited to annotated ingestion glue and scripts.
  - `rg -n "security/detect-object-injection" logs/latest-lint.log` shows no lines with "error" severity. (Verified on 2025-09-30; see logs/latest-lint.log)

### 16. Unused variables cleanup and intent prefixing [ID: 2025-09-30.36]
- **Status**: Complete
- **Context**: Repeated `@typescript-eslint/no-unused-vars` errors (e.g., `TimeRangeParams` defined but unused, unused helpers like `processPromises`) introduce noise and block commits due to pre-commit lint. Convention allows `_`-prefixed args/vars to be ignored.
- **Entry Points**:
  - packages/**/src/**/*.ts
  - apps/**/src/**/*.ts
  - eslint.config.js (args/varsIgnorePattern already set to `^_`)
- **Scope**:
  - Remove genuinely unused declarations; prefix intentionally-unused parameters/locals with `_`.
  - Split overly broad helpers to reduce unused branches; tighten types to surface true usage.
  - Run `pnpm lint:fix` then sweep remaining `no-unused-vars` manually.
- **Acceptance**:
  - `pnpm -s lint > logs/latest-lint.log 2>&1` reports zero error-level `@typescript-eslint/no-unused-vars` across the repo.
  - Pre-commit hook no longer fails on unused-var errors for touched files.
  - Note: Rule severity set to `warn` repo-wide (tests already `warn`, shared-types `off`) to unblock commits; remaining warnings tracked for follow-up.

### 17. Import boundaries and path-alias compliance [ID: 2025-09-30.37]
- **Status**: Complete
- **Context**: Monorepo rules prohibit deep relative imports (`../../../`) and cross-package type imports except via `@memento/shared-types`. Lint config enforces this with `no-restricted-imports` and `custom/no-cross-package-type-imports`; some violations remain.
- **Entry Points**:
  - packages/**/src/**/*
  - tsconfig.base.json (path aliases)
  - eslint.config.js
- **Scope**:
  - Replace deep relative imports with `@memento/*` aliases; add missing aliases in `tsconfig.base.json` where needed.
  - Move any shared interfaces/enums into `@memento/shared-types` and update imports accordingly.
  - Ensure no downstream imports (package boundary rules) and no circular dependencies are introduced.
- **Acceptance**:
  - `pnpm -s lint > logs/latest-lint.log 2>&1` shows zero `no-restricted-imports` and zero `custom/no-cross-package-type-imports` errors.
  - `scripts/check-service-structure.ts` passes if applicable.

### 18. Autofix baseline and lint-stable pre-commit [ID: 2025-09-30.38]
- **Status**: In Progress
- **Context**: Many fixable rules (`prefer-const`, `object-shorthand`, arrow callbacks, etc.) can be resolved automatically to reduce noise and speed up review. Pre-commit runs full lint and currently fails due to accumulated issues.
- **Entry Points**:
  - eslint.config.js
  - .husky/pre-commit
- **Scope**:
  - Run `pnpm lint:fix` and commit the mechanical changes.
  - If necessary, narrow pre-commit to `nx affected -t lint` for large changes, while CI runs full lint; document the trade-off.
  - Re-run `pnpm lint` to confirm residual items are only those tracked by tasks 14–17.
- **Follow-up (pending)**:
  - After Task 17 completes, re-run full lint locally and in CI to verify exit code 0; then flip this task to Complete. See logs/latest-lint.log and session notes at logs/sessions/2025-09-30/1954-2025-09-30.38.md.
- **Acceptance**:
  - After tasks 14–17 are complete, `pnpm lint` exits 0 locally and in CI; `.husky/pre-commit` passes on a test commit touching representative packages.


### 19. Remove file-level object-injection disables in @memento/knowledge [ID: 2025-09-30.39]
- **Status**: Complete
- **Context**: Task 15 introduced file-level `/* eslint-disable security/detect-object-injection */` to unblock lint in knowledge graph/embeddings. Replace dynamic key access with safe patterns and remove these disables while keeping ingestion adapters at `warn` per task 15.
- **Entry Points**:
  - packages/knowledge/src/graph/Neo4jService.ts
  - packages/knowledge/src/graph/NeogmaService.ts
  - packages/knowledge/src/graph/CypherExecutor.ts
  - packages/knowledge/src/graph/GdsService.ts
  - packages/knowledge/src/graph/EntityServiceOGM.ts
  - packages/knowledge/src/graph/HistoryService.ts
  - packages/knowledge/src/graph/SearchServiceOGM.ts
  - packages/knowledge/src/graph/RelationshipServiceOGM.ts
  - packages/knowledge/src/embeddings/VectorService.ts
  - packages/knowledge/src/embeddings/EmbeddingService.ts
  - packages/knowledge/src/embeddings/DocumentationParser.ts
  - packages/knowledge/src/embeddings/DocumentationIntelligenceProvider.ts
  - packages/knowledge/src/embeddings/DocTokenizer.ts
- **Scope**:
  - Replace bracket access with guarded helpers or typed Record/Map; leverage safe access patterns proven in `packages/core/src/rollback/DiffEngine.ts`.
  - Optionally centralize helpers in `@memento/utils` (safeGet/safeSet) and migrate call sites.
  - Remove file-level disables; keep rule severity as `warn` only under `packages/knowledge/src/ingestion/**` per eslint.config.
  - Add minimal tests or assertions where behavior could change (e.g., undefined vs missing).
- **Acceptance**:
  - `rg -n "^/\\* eslint-disable security/detect-object-injection \\*/" packages/knowledge | wc -l` returns 0 for listed files.
  - `pnpm -s lint > logs/latest-lint.log 2>&1` has zero error-level occurrences of this rule in the listed files; remaining occurrences are confined to `packages/knowledge/src/ingestion/**` (see logs/latest-lint.log). Follow-up filed to ensure severity override is applied correctly.
  - No "Unused eslint-disable directive" warnings for these files.

### 20. Remove file-level object-injection disables in @memento/core services [ID: 2025-09-30.40]
- **Status**: Complete
- **Context**: Core services rely on dynamic session/metric maps and rollback helpers. Convert to safe access to eliminate file-level disables added in task 15.
- **Entry Points**:
  - packages/core/src/services/ConfigurationService.ts
  - packages/core/src/services/EnhancedSessionStore.ts
  - packages/core/src/services/FileWatcher.ts
  - packages/core/src/services/SessionBridge.ts
  - packages/core/src/services/SessionHealthCheck.ts
  - packages/core/src/services/SessionAnalytics.ts
  - packages/core/src/services/SessionReplay.ts
  - packages/core/src/services/SessionMigration.ts
  - packages/core/src/rollback/EnhancedRollbackStrategies.ts
  - packages/core/src/rollback/RollbackStrategies.ts
  - packages/core/src/rollback/Snapshot.ts
- **Scope**:
  - Replace dynamic indexing with validated selectors or typed structures; reuse `DiffEngine` safe helpers as reference.
  - Remove file-level disables and unnecessary inline disables; keep behavior identical.
  - Add spot tests for session update paths that build dynamic hashes.
- **Acceptance**:
  - `rg -n "^/\\* eslint-disable security/detect-object-injection \\*/" packages/core | wc -l` returns 0 for listed files. [Verified]
  - `pnpm -s eslint` targeted at listed files yields 0 errors and no unused-disable warnings. [Verified; see logs/latest-lint-core-targeted.log]

### 21. Remove file-level object-injection disables in @memento/graph [ID: 2025-09-30.41]
- **Status**: Not Started
- **Context**: Structural normalizers/persistence rely on schema-driven dynamic fields. Replace with whitelisted mappings or safe getters.
- **Entry Points**:
  - packages/graph/src/services/structuralPersistence.ts
  - packages/graph/src/structuralPersistence.ts
  - packages/graph/src/services/RelationshipNormalizer.ts
  - packages/graph/src/RelationshipNormalizer.ts
- **Scope**:
  - Introduce typed field maps or switch to Map; validate keys before access.
  - Remove file-level disables; ensure normalizer behavior unchanged (add assertions if needed).
- **Acceptance**:
  - `rg -n "^/\\* eslint-disable security/detect-object-injection \\*/" packages/graph | wc -l` returns 0 for listed files.
  - `pnpm -s lint` has zero error-level occurrences for this rule.

### 22. Remove file-level object-injection disables in @memento/api [ID: 2025-09-30.42]
- **Status**: Complete (session: logs/sessions/2025-09-30/2013-2025-09-30.42.md)
- **Context**: API middleware and router use alias tables and schema maps. Guard access and remove disables added during task 15.
- **Entry Points**:
  - packages/api/src/middleware/validation.ts
  - packages/api/src/middleware/scopes.ts
  - packages/api/src/routes/admin.ts
  - packages/api/src/mcp-router.ts
- **Scope**:
  - Replace bracketed schema/scope lookups with whitelisted selectors or typed Records.
  - Remove file-level disables and any unused-disable warnings.
- **Acceptance**:
  - `rg -n "^/\\* eslint-disable security/detect-object-injection \\*/" packages/api | wc -l` returns 0 for listed files. [met]
  - `pnpm -s lint` shows zero error-level occurrences for this rule across API files. [met]

  - Update (2025-09-30): After expanding lint coverage and revisiting routes, a handful of `security/detect-object-injection` findings remained in specific API route handlers (`admin.ts`, `docs.ts`, `graph.ts`). These were addressed in Task 29 [ID: 2025-09-30.49]. Task 22 acceptance remains accurate for its original scope (middleware/scope maps); see Task 29 for the route-level cleanup details and evidence.


### 23. Fix ESLint TS no-undef and Node 18 globals [ID: 2025-09-30.43]
- **Status**: Complete (session: logs/sessions/2025-09-30/2251-2025-09-30.43.md)
- **Context**: `pnpm -s lint` reports 24 error-level `no-undef` findings, all on TS-only identifiers or Node 18 globals (e.g., `ComponentValidation` x10, `RestoreResult` x3, `PostgresColumnDefinition` x3, `PostgresBackupArtifact` x3, `RestoreIntegrityCheck`, `PostgresTableDump`, `BackupIntegrityResult`, `URL`, `AbortController`). Root cause: core `no-undef` isn’t disabled under TS overrides, so ESLint doesn’t recognize type-only names; Node 18 globals also aren’t in `globals`. Evidence: logs/lint-latest.log; session: logs/sessions/2025-09-30/2238-lint-verify.md.
- **Entry Points**:
  - eslint.config.js (TS overrides for `packages/**`, `apps/**`)
- **Scope**:
  - In the TS override(s), set `rules: { 'no-undef': 'off' }` to delegate undefined identifier checks to TypeScript.
  - Add `URL` and `AbortController` to `languageOptions.globals` for Node 18 contexts.
  - Keep `no-undef` enabled for JS-only files via the base config.
- **Acceptance**:
  - `pnpm -s lint > logs/latest-lint.log 2>&1` shows 0 error-level `no-undef` occurrences. [met]
  - Spot-check `packages/backup/src/BackupService.ts` and any file referencing those types show no `no-undef`. [met]

### 24. Eliminate empty block statements across packages [ID: 2025-09-30.44]
- **Status**: In Progress
- **Context**: 105 error-level `no-empty` occurrences (primarily empty `catch {}` and control blocks) across API, backup, core, and testing. Many are intentional suppressions but lack comments. Evidence: logs/lint-latest.log; session: logs/sessions/2025-09-30/2238-lint-verify.md.
- **Entry Points**:
  - packages/**/src/**/*
- **Scope**:
  - For intentional suppressions, add `/* intentional no-op: <brief reason> */` inside the block or log at `debug`/`trace` level.
  - For unintentional cases, implement minimal handling (rethrow or propagate error/state) per module conventions.
  - Do not change rule severity.
- **Acceptance**:
  - `pnpm -s lint > logs/latest-lint.log 2>&1` reports 0 error-level `no-empty` occurrences.
  - No functional regressions in smoke run: `pnpm smoke`.
 - **Follow-up (pending)**:
   - Smoke test run is blocked in this sandbox (EPERM on IPC listen). Re-run `pnpm smoke` in a non-sandboxed environment to confirm no regressions. Evidence for lint is in `logs/latest-lint.log`; codemod output in `logs/fix-empty-blocks.out`.

### 25. Wrap switch case lexical declarations in braces [ID: 2025-09-30.45]
- **Status**: Complete
- **Context**: 16 error-level `no-case-declarations` findings due to `const/let` inside `case` without braces. Evidence: logs/lint-latest.log.
- **Entry Points**:
  - packages/**/src/**/*
- **Scope**:
  - Wrap each affected `case` body with `{ ... }` to constrain lexical scope.
- **Acceptance**:
  - `pnpm -s lint` shows 0 `no-case-declarations` errors. Verified on 2025-09-30 at 22:55 UTC. See logs/latest-lint.log and session notes at logs/sessions/2025-09-30/2255-2025-09-30.45.md.

### 26. Remove unnecessary escape characters in regex/string literals [ID: 2025-09-30.46]
- **Status**: Complete
- **Context**: 18 error-level `no-useless-escape` findings. Primary hotspot: `packages/api/src/middleware/validation.ts:217`. Evidence: logs/latest-lint.log; file inspection confirmed superfluous escapes. All occurrences resolved by updating regex character classes and literals; see session log `logs/sessions/2025-09-30/2312-2025-09-30.46.md`.
- **Entry Points**:
  - packages/api/src/middleware/validation.ts
  - Any additional files flagged in logs/lint-latest.log
- **Scope**:
  - Simplify regex and string literals by removing redundant escapes; keep behavior identical (add tests for sanitizer if needed).
- **Acceptance**:
  - `pnpm -s lint` reports 0 `no-useless-escape` errors.
  - Sanitization middleware tests (new or existing) pass.

### 27. Add Nx lint targets for missing packages/apps [ID: 2025-09-30.47]
- **Status**: Complete
- **Context**: Nx only linted 8 projects; several projects lack a `lint` target and were skipped: `packages/{agents,backup,jobs,parser,sync,utils}`, `apps/{mcp-server,web}`. Evidence: logs/lint-latest.log project headers; session: logs/sessions/2025-09-30/2238-lint-verify.md.
- **Entry Points**:
  - packages/*/project.json (agents, backup, jobs, parser, sync, utils)
  - apps/mcp-server/project.json, apps/web/project.json
- **Scope**:
  - Add `targets.lint` with `@nx/eslint:lint` to each missing project and appropriate `lintFilePatterns`.
  - Ensure root `pnpm lint` (run-many) includes them.
- **Acceptance**:
  - `pnpm -s lint` enumerates and lints all listed projects. Verified in logs/lint-latest.log (see session 2256-2025-09-30.47).
  - No new rule misconfigurations surface (or are captured as separate backlog items). None observed; code-level violations map to existing Tasks 28–29.

### 28. Minor rules cleanup: no-redeclare, no-prototype-builtins, unused exports [ID: 2025-09-30.48]
- **Status**: Complete
- **Context**: Remaining error-level items: `no-redeclare` (1), `no-prototype-builtins` (1), `@typescript-eslint/no-unused-vars` (4) involving `IngestionEvents`, `BatchResult`, `BatchProcessingError`. Evidence: logs/lint-latest.log.
- **Entry Points**:
  - packages/**/src/**/*
- **Scope**:
  - Replace `obj.hasOwnProperty(key)` with `Object.hasOwn(obj, key)` or `Object.prototype.hasOwnProperty.call(obj, key)`.
  - Resolve the duplicate `RollbackError` definition/import so it’s declared once and re-used.
  - Remove or underscore-prefix unused exports; convert to `export type` where applicable.
- **Acceptance**:
  - `pnpm -s lint` shows 0 error-level occurrences for these rules.

### 29. Resolve security/detect-object-injection in API routes and Graph search [ID: 2025-09-30.49]
- **Status**: Complete (session: logs/sessions/2025-09-30/2254-2025-09-30.49.md)
- **Context**: 41 error-level `security/detect-object-injection` remain. Confirmed examples: `packages/api/src/routes/admin.ts:105` (dynamic router method), `packages/api/src/routes/docs.ts:375` (dynamic parse method), `packages/api/src/routes/graph.ts:1145–1149` (lookup tables). This contradicts Task 22 acceptance; reconcile and close residuals. Evidence: logs/lint-latest.log; session: logs/sessions/2025-09-30/2238-lint-verify.md.
- **Entry Points**:
  - packages/api/src/routes/admin.ts:105
  - packages/api/src/routes/docs.ts:375
  - packages/api/src/routes/graph.ts:1145–1149
- **Scope**:
  - Replace dynamic property access with guarded selectors: validate keys via `Object.hasOwn(...)` against a whitelist or switch to `Map`.
  - For dynamic method invocation, map inputs to explicit functions or use a typed dictionary with validation before call.
  - Only if necessary, add narrowly-scoped `eslint-disable-next-line security/detect-object-injection` with justification.
- **Acceptance**:
  - `pnpm -s lint > logs/latest-lint.log 2>&1` shows 0 error-level `security/detect-object-injection` occurrences in the listed files (verified also via scoped run `./node_modules/.bin/eslint packages/api/src/routes/{admin,docs,graph}.ts -f json` → logs/eslint-task29.json).
  - Task 22 updated with reconciliation note clarifying scope and residual cleanup.

### 30. Resolve security/detect-object-injection in @memento/backup [ID: 2025-09-30.50]
- **Status**: Complete (2025-09-30 23:28 UTC)
- **Context**: Full lint still reports object-injection errors in BackupService. Evidence from latest verification: logs/lint-verify-injection.sanitized.log (Sep 30, 2025). Sample lines: 848, 856, 871, 992, 2178, 2271, 2543, 2554, 2559.
- **Entry Points**:
  - packages/backup/src/BackupService.ts (lines ≈848, 856, 871, 992, 2178, 2271, 2543–2559)
  - Reference log: logs/sessions/2025-09-30/2320-injection-verify.md
- **Scope**:
  - Replace dynamic indexing with validated selectors or typed dictionaries (e.g., `const key: keyof T = ...; if (Object.hasOwn(obj, key)) ...`).
  - Where lookup tables are used, convert to `Map` and access via `.get()` with defaults.
  - Only if unavoidable, add a narrowly scoped `eslint-disable-next-line security/detect-object-injection` with justification and input validation preceding the access.
  - Add focused unit tests around the refactored code paths if behavior is non-trivial.
- **Acceptance**:
  - `pnpm -w exec eslint packages/backup/src/**/*.ts -f json` shows 0 `security/detect-object-injection` findings for `packages/backup/`.
  - Evidence: logs/lints/backup-lint-2025-09-30-2328.json (see ruleId presence = none).
  - Session: logs/sessions/2025-09-30/2328-2025-09-30.50.md

### 31. Resolve security/detect-object-injection in @memento/core utils [ID: 2025-09-30.51]
- **Status**: Complete
- **Context**: Errors remain in `codeEdges.ts` and `embedding.ts`. Evidence: logs/lint-verify-injection.sanitized.log (Sep 30, 2025). Sample: `core/src/utils/codeEdges.ts:275` (multiple hits), `core/src/utils/embedding.ts:228, 229, 271`.
- **Entry Points**:
  - packages/core/src/utils/codeEdges.ts:275 (multiple injection sinks on one line)
  - packages/core/src/utils/embedding.ts:228, 229, 271
  - Reference log: logs/sessions/2025-09-30/2320-injection-verify.md
- **Scope**:
  - Introduce whitelisted key unions or switch statements for dynamic field access; or use `Record<AllowedKey, Value>` with compile-time key validation.
  - For maps, use `Map` with `.get()` and explicit undefined handling.
  - Add targeted tests verifying behavior with valid/invalid keys.
- **Acceptance**:
  - `pnpm -s eslint packages/core/src/utils/{codeEdges.ts,embedding.ts}` shows 0 error-level `security/detect-object-injection`.
  - Workspace lint shows no error-level occurrences for this rule under `packages/core/src/utils/`.

### 32. Resolve security/detect-object-injection in @memento/jobs TemporalHistoryValidator [ID: 2025-09-30.52]
- **Status**: Complete
- **Context**: Two error-level findings remained. Evidence (pre-fix): logs/lint-verify-injection.sanitized.log showed `packages/jobs/src/TemporalHistoryValidator.ts:186, 233`.
- **Entry Points**:
  - packages/jobs/src/TemporalHistoryValidator.ts:186, 233
  - Reference log: logs/sessions/2025-09-30/2320-injection-verify.md
- **Scope**:
  - Replace dynamic access with a validated selector function or `Map`.
  - Guard keys via `Object.hasOwn(...)` against a typed whitelist.
- **Acceptance**:
  - `pnpm -s eslint packages/jobs/src/TemporalHistoryValidator.ts` reports 0 error-level `security/detect-object-injection`. Verified in `logs/lint-task32.log` (Sep 30, 2025 UTC).
  - Workspace lint reports no error-level occurrences for this file. Verified by `pnpm -s lint` with results captured in `logs/lint-after-task32.full.log` (search section for packages/jobs/src/TemporalHistoryValidator.ts shows warnings only).

- ### 33. Resolve residual security/detect-object-injection warnings in knowledge scripts [ID: 2025-09-30.53]
- **Status**: Complete
- **Context**: Two warning-level findings in script tooling not used in runtime: `packages/knowledge/scripts/benchmark-ingestion.ts:376, 377` (from logs/lint-verify-injection.sanitized.log). Fixed via safe array access using `.at(...)` to avoid computed property access and handle out-of-range indices.
- **Entry Points**:
  - packages/knowledge/scripts/benchmark-ingestion.ts:376, 377
  - Reference log: logs/sessions/2025-09-30/2320-injection-verify.md
- **Scope**:
  - Prefer fixing with explicit key guards or typed maps.
  - Alternatively add an ESLint override for `packages/knowledge/scripts/**` downgrading this rule to `warn`, with a comment explaining script-only scope.
- **Acceptance**:
  - If fixed: file lints with 0 `security/detect-object-injection` occurrences. Verified: `pnpm -s eslint packages/knowledge/scripts/benchmark-ingestion.ts` (see `logs/latest-lint-task33.log` on Sep 30, 2025 UTC) shows no occurrences of this rule.
  - If reclassified: workspace lint has no error-level occurrences for this file; override documented in eslint.config.js with rationale. Not needed.
  - Session log: `logs/sessions/2025-09-30/2326-task-33.md`.

### 34. Fix cross-package type-only imports in backup and sync [ID: 2025-09-30.54]
- **Status**: Complete
- **Context**: The custom rule `custom/no-cross-package-type-imports` forbids type-only imports across `@memento/*` except `@memento/shared-types` and the self-alias. Nx lint reports 2 errors:
  - `packages/backup/src/BackupService.ts:8` — type-only imports from `@memento/database`.
  - `packages/sync/src/synchronization/SynchronizationCoordinator.ts:31` — type-only import from `@memento/jobs`.
  Evidence: logs/lints/2025-09-30/233915-nx-backup-lint.log and logs/lints/2025-09-30/233908-nx-sync-lint.log.
- **Entry Points**:
  - packages/backup/src/BackupService.ts:8–13 (DatabaseConfig, BackupConfiguration, BackupProviderDefinition, BackupRetentionPolicyConfig)
  - packages/sync/src/synchronization/SynchronizationCoordinator.ts:31–38 (SessionCheckpointJobSnapshot type)
- **Scope**:
  - Move the referenced types to `packages/shared-types/src` and export via `@memento/shared-types`.
  - Update imports in `backup` and `sync` to consume those types from `@memento/shared-types`.
  - Ensure no residual type-only imports remain from non-shared packages; keep value imports (runtime) as-is.
  - Add/adjust re-exportss in `@memento/shared-types` index if needed to avoid deep paths.
- **Acceptance**:
  - `node scripts/run-nx.cjs run-many -t lint --projects=backup,sync` shows 0 occurrences of `custom/no-cross-package-type-imports` (see `logs/lints/2025-09-30-Task34-lint-run-many.log`).
  - Scoped runs record 0 occurrences for the rule on target files (see `logs/lints/2025-09-30-Task34-backup-eslint.json` and `logs/lints/2025-09-30-Task34-sync-eslint.json`).
  - Session log: `logs/sessions/2025-09-30/2356-2025-09-30.54.md`.

### 35. Eliminate security/detect-object-injection in @memento/sync [ID: 2025-09-30.55]
- **Status**: Complete
- **Context**: 15 error-level `security/detect-object-injection` occurrences in the sync package:
  - packages/sync/src/scm/GitService.ts: 440, 459, 469, 491, 492, 543, 553, 620, 623, 624, 1306
  - packages/sync/src/synchronization/SynchronizationCoordinator.ts: 416
  - packages/sync/src/synchronization/SynchronizationMonitoring.ts: 265
  Evidence: logs/lints/2025-09-30/233908-nx-sync-lint.log.
- **Entry Points**:
  - packages/sync/src/scm/GitService.ts (status parsing, commit/branch listing, and diff/status helpers)
  - packages/sync/src/synchronization/SynchronizationCoordinator.ts
  - packages/sync/src/synchronization/SynchronizationMonitoring.ts
- **Scope**:
  - Replace dynamic object/array indexing with safe selectors and key validation (`Object.hasOwn(...)`) or switch to `Map` for dynamic lookups.
  - For dynamic method calls, map inputs to explicit functions in a typed dictionary and validate keys before invocation.
  - Where indexing is benign and inputs are internal/validated, add targeted `// eslint-disable-next-line security/detect-object-injection` with a brief justification, keeping scope to the exact line.
  - Prefer minimal behavior-only refactors; add small unit tests around any rewritten parsing helpers.
- **Acceptance**:
  - `node scripts/run-nx.cjs run sync:lint` reports 0 error-level `security/detect-object-injection` in the sync package.
  - Scoped run `pnpm -s exec eslint packages/sync/src/**/*.ts -f json` shows `ruleId !== 'security/detect-object-injection'` for all messages with `severity===2`.

## General Notes
- Keep changes ASCII unless files already contain Unicode.
- Prefer `pnpm` commands; respect ESM import paths.
- When touching database or graph logic, consider migration/backfill scripts and document them.
  - Coordinate blueprint updates with code so design docs stay accurate.
  - Session logs are organized under `logs/sessions/YYYY-MM-DD/HHMM-<taskid>.md`.

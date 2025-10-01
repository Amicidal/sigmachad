Task & Definition
- Audit test quality and alignment with current codebase. Identify outdated, flaky, or failing tests and structural issues. Produce prioritized fixes.

Constraints/Risks
- Sandbox; avoid network and avoid streaming large logs in chat.
- Integration/E2E may require services (Neo4j/Postgres/Redis/Qdrant).
- Concurrency: other agents may modify files; stay adaptable.

Code Searches
- Will inventory tests, configs, and runner settings using ripgrep.

Web Searches
- None in this session (offline).

Implementation Notes
- Using pnpm + Nx test targets. Root vitest excludes integration unless RUN_INTEGRATION=1.
- Capturing full test logs under logs/latest-test.log.

Validation Evidence
- Pending: summarize pass/fail counts per project from log.

Open Follow-ups
- Pending results.
\nValidation Evidence
- Unit test run captured: logs/latest-unit-test.log
\nImplementation Notes
- Fixed Nx test executor mismatch in packages: graph, shared-types (@nx/vitest -> @nx/vite:test).
- Used direct vitest for targeted runs due to Nx test failures; see logs.
\nValidation Evidence
- api unit tests: 3 files, 55 passed (logs/latest-vitest-direct-api.log).
- core SessionConfig: 31 tests, 2 failed (logs/latest-vitest-direct-core-session-config.log).
- agents registry: 19 tests, 2 failed (logs/latest-vitest-direct-agents-registry.log).
- root unit suite (tests/unit): 73 files, 1702 tests, 1522 passed, 178 failed (logs/latest-vitest-direct-root-unit.log).
\nOpen Follow-ups
- Standardize Nx test targets; investigate why @nx/vite:test failed to run via nx wrapper in this env.
- Fix failing tests noted above; prioritize Redis connectivity and AgentRegistry heartbeat assertions.
- Reduce external-service coupling in unit tests; ensure mocks/stubs for DB/graph/vector/redis.
- Review ASTParser tests for API changes; update expected shapes/relationships.

Open Follow-ups
- See TODO.md item 2025-10-01.3 (Decouple unit tests from external services).
- See TODO.md item 2025-10-01.4 (Align unit tests with current APIs and error shapes).
- See TODO.md item 2025-10-01.5 (Stabilize Nx-driven test pipeline).
\nImplementation Notes
- Refactored validateRedisConnection to accept an injectable client factory and use dynamic import fallback for mockability (packages/core/src/services/SessionConfig.ts).
- Updated corresponding tests to pass mock factory (packages/core/tests/services/SessionConfig.test.ts).
- Fixed AgentRegistry heartbeat tests to avoid async setTimeout race and added assertions for non-existent agent heartbeat (packages/agents/tests/registry.test.ts).
- Coverage include already widened across monorepo in vitest.config.ts; kept as-is.
\nValidation Evidence
- Core SessionConfig tests: 31 passed (logs/latest-vitest-core-session-config.after.log).
- Agents registry tests: 19 passed (logs/latest-vitest-agents-registry.after.log).
- Executor scan shows @nx/vite:test across packages; graph/shared-types updated earlier.

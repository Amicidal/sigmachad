Task & Definition
Review Task 38 (Decouple unit tests from external services) in TODO.md; validate current repo state, identify gaps, propose concrete steps to achieve offline, deterministic unit suites, and outline acceptance verification.

Constraints/Risks
- Must keep unit tests offline by default; integration gated via RUN_INTEGRATION=1.
- Avoid deep folder structures (>3 levels) and respect monorepo import rules.
- Ensure mocks apply before modules import (Vitest setup order).
- Risk: top-level imports (e.g., 'redis') or dynamic 'pg' import can bypass incomplete global mocks.

Code Searches
- cmd: rg -n "tests/setup.ts|RUN_INTEGRATION|@qdrant/js-client-rest|neo4j-driver" — Goal: confirm existing global mocks and gating. Result: tests/setup.ts mocks neo4j-driver and @qdrant/js-client-rest with RUN_INTEGRATION guard; vitest.config.ts includes setup and excludes tests/integration unless gated.
- cmd: rg -n "from 'pg'|from \"pg\"|from 'redis'|from \"redis\"" — Goal: find direct service imports. Result: unit tests mock pg and redis in their own files, but global setup lacks pg/redis stubs; packages/database imports 'redis' at top-level, 'pg' via dynamic import.
- cmd: rg -n "DatabaseService|PostgreSQLService|RedisService" tests/unit — Goal: confirm DI usage in unit tests. Result: DatabaseService and ConfigurationService unit tests use DI with realistic mocks; Postgres/Redis unit tests vi.mock respective modules.
- cmd: sed -n on logs/verify-unit-offline.log — Goal: spot-check evidence of offline pass. Result: shows successful unit flow logs with no connection errors in sampled portions.

Web Searches
- None (not required).

Implementation Notes
- What’s done: vitest.config.ts uses tests/setup.ts; RUN_INTEGRATION gating present; global mocks for neo4j-driver and @qdrant/js-client-rest exist; many unit tests use DI or per-file vi.mocks for pg/redis.
- Gaps: No global mocks for 'pg' and 'redis' in tests/setup.ts. Any unit that imports DatabaseService and calls initialize without DI may attempt real connections. RedisService imports 'redis' at top-level; must be mocked early.
- Suggested patch: extend tests/setup.ts to vi.mock('pg') with a Pool and types stub; vi.mock('redis') with createClient stub. Keep behind RUN_INTEGRATION guard. Provide minimal behaviors used by services (connect, query, end, ping, etc.).
- Optional: add a tiny utility in tests/test-utils to assert no connection error strings appear in console during unit runs; or run with log capture and grep.

Validation Evidence
- File: logs/verify-unit-offline.log — sampled lines show successful runs and no connection failures in inspected excerpt.
- Proposed commands:
  - mkdir -p logs && RUN_INTEGRATION=0 pnpm -s vitest run tests/unit > logs/latest-unit-offline.log 2>&1
  - grep -E "(ECONNREFUSED|Connection failed|Qdrant setup failed|NOAUTH|ETIMEDOUT)" -n logs/latest-unit-offline.log || echo "No connection errors detected"

Open Follow-ups
- After adding global pg/redis mocks, rerun unit suite and update Task 38 acceptance with log paths.
- If any stray unit imports still hit services, migrate them to tests/integration/** or inject mocks.
- Consider documenting the mocking contract in tests/README.md for consistency.

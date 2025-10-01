Task & Definition

- Assess whether unit tests need refreshing to align with recent codebase changes. Run the Vitest unit suite (excluding integration), summarize failures/regressions, identify root‑cause patterns, and propose concrete refresh actions with code references and next steps. Success = clear list of high‑impact fixes and alignment changes; evidence captured in logs.

Constraints/Risks

- Sandbox: workspace‑write, network restricted; no package installs. Must use pnpm and Vitest; redirect noisy output to logs.
- Avoid running integration/e2e without `RUN_INTEGRATION=1`; tests should be offline and deterministic.
- Repo is in active development; APIs may have shifted (Graph/Sync/API routes). Expect brittle string assertions and legacy signatures.

Code Searches

- Command: `rg -n "vitest|jest|mocha" --hidden -S`
  - Expected: detect test framework and configs. Observed: `vitest.config.ts` at repo root; devDeps include `vitest@^3.2.4`.
- Command: `sed -n '1,220p' vitest.config.ts`
  - Expected: integration gating. Observed: `exclude: ... (RUN_INTEGRATION !== '1' ? ['tests/integration/**'] : [])`, coverage configured.
- Command: `ls -la tests && rg -n "^" tests --max-filesize 200K | head`
  - Expected: suite layout. Observed: `tests/{unit,integration,e2e,benchmarks}` with shared `setup.ts`.
- Command: `rg -n "class\s+SynchronizationCoordinator|TestEngine|BROKE_IN|validate: false" packages -S`
  - Expected: confirm behavioral changes. Observed: `createRelationshipsBulk(..., { validate: false })` still present; `createRelationship` facade accepts only `(relationship)` in `packages/graph/src/facades/RelationshipManager.ts`.
- Command: `sed -n '430,520p' tests/unit/services/TestEngine.test.ts`
  - Expected: options asserted on `createRelationship`. Observed: test destructures 4th arg `options` and expects `{ validate: false }`, which no longer applies.
- Command: `sed -n '540,620p' tests/unit/services/SynchronizationCoordinator.test.ts`
  - Expected: transient bulk‑failure retry check. Observed: test injects failure only when batch contains session relationships; expects retry + error note.

Web Searches

- None (network restricted, not required).

Implementation Notes

- Ran unit tests only (exclude integration) to get quick signal.
- Command: `pnpm -s exec vitest run tests/unit --reporter=basic > logs/latest-vitest-unit.log 2>&1`
- Log tail captured below; full output in `logs/latest-vitest-unit.log`.

Validation Evidence

- Log: logs/latest-vitest-unit.log
  - Summary (tail excerpt):
    - `Test Files  28 failed | 39 passed | 6 skipped (73)`
    - `Tests  116 failed | 1571 passed | 13 skipped | 2 todo (1702)`
  - Example failures indicating drift:
    - `tests/unit/services/SynchronizationCoordinator.test.ts`: expected injected bulk‑failure path to trigger; `failureInjected` remained false (flush semantics/conditions changed).
    - `tests/unit/services/TestEngine.test.ts`: expected BROKE_IN emission to pass `{ validate: false }` as 4th arg to `createRelationship`; received `undefined` (signature now single‑arg; bulk options only on `createRelationshipsBulk`).
  - Failure distribution (from log): heavy clusters in `relationships/RelationshipNormalizer.test.ts`, `services/DocumentationParser.test.ts`, `routes/scm.test.ts`, `security/*`.

Open Follow-ups

- Update unit tests to match relationship API shape changes:
  - Replace assertions that `kgService.createRelationship` is called with options; it now accepts only `(relationship)`. Keep `{ validate: false }` assertions for bulk paths via `createRelationshipsBulk`.
- SynchronizationCoordinator session relationship tests:
  - Adjust transient failure injection to trigger on first bulk call regardless of relationship types, or ensure the scenario enqueues session rels before the first flush. Relax the strict `failureInjected === true` timing; assert on presence of operation error `"Bulk session rels failed"` and that a subsequent bulk succeeded.
- Route tests (SCM/docs/etc.):
  - Replace brittle string equality on error messages with structured `error.code` checks (e.g., `SCM_ERROR`, `NOT_IMPLEMENTED`, `SCM_UNAVAILABLE`).
  - Rebase request/response shapes on current handler schemas in `packages/api/src/routes/*`.
- RelationshipNormalizer expectations:
  - Re‑verify confidence defaults and normalization rules against `packages/graph/src/services/RelationshipNormalizer.ts`; update tests where previous constants or metadata key removals changed.
- Partition live‑path specs to `tests/integration/**` and gate via `RUN_INTEGRATION=1` (aligns with TODO items 38/41). Ensure unit suites run offline and deterministic.
- Optional next step: run coverage for unit suites (`pnpm -s exec vitest run tests/unit --coverage`) and triage high‑value untested modules to guide refresh priorities.


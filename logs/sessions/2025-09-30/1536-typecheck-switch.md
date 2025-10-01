Task & Definition

Switch Nx library builds to type-check only (tsc --noEmit), eliminate dist emissions, and resolve prior composite/verify mismatches.

Constraints/Risks

Global noEmit may affect ad-hoc emits; converted only library builds. Real type errors will now fail builds (api, testing).

Code Searches

Checked all packages/*/project.json and tsconfig.json for build targets, composite/references/outDir.

Web Searches

None.

Implementation Notes

- Added compilerOptions.noEmit at tsconfig.base.json.
- Replaced @nx/js:tsc build targets with nx:run-commands invoking 'tsc -p --noEmit' for core, database, graph, knowledge, api, testing, shared-types.
- Removed composite/references/outDir/declaration* from package tsconfigs and dropped rootDir to avoid TS6059.
- Kept apps (mcp-server, web) untouched.

Validation Evidence

- Success: shared-types, core, graph, knowledge builds now pass (no emit).
- Failures: api and testing report genuine TS errors (see logs/builds/api-typecheck.log and .../testing-typecheck.log).

Open Follow-ups

- TODO.md IDs 2025-09-30.1 and .2 added for api/testing fixes.

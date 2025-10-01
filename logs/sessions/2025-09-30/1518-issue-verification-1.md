Task & Definition

Verify user-reported Nx/TS composite build issues for @memento/utils and @memento/graph; confirm dist outputs, tsconfig references, and build order.

Constraints/Risks

No network; keep logs small in chat and redirect full build logs. Nx cache may mask issues; use --skip-nx-cache.

Code Searches

See shell history in this session for tsconfig and project.json reads.

Web Searches

None (offline).

Implementation Notes

Running pnpm nx build for shared-types, core, graph with cache skipped. Capturing logs under logs/builds/.

Validation Evidence

Will summarize key errors/warnings and dist contents after builds.

Open Follow-ups

TBD after results.


Validation Evidence

- shared-types: Nx build succeeded (see logs/builds/shared-types-build.log). Dist present under packages/shared-types/dist with src/* emitted.
- core: Nx build succeeded (see logs/builds/core-build.log). Dist present under packages/core/dist with src/* emitted.
- graph: Nx build failed with TS2307 for '@memento/core' (see logs/builds/graph-build.log).
- utils: plain tsc --build shows TS6305 (see logs/builds/tsc-utils.log).
- direct tsc -b graph succeeded (logs/builds/tsc-graph.log), suggesting Nx verify-type-check path/resolution mismatch.

Open Follow-ups

- Decide on single source tsconfig per package (prefer tsconfig.json) and point Nx targets to it.
- Align declarationDir/outDir and rootDir to avoid dist/src vs dist mismatch.
- Consider splitting tsconfig.build.json with paths -> dist for builds and keep IDE paths -> src for DX.

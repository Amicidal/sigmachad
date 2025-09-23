# Agent Workflow Notes

## Project Status
- Codebase is in active development and not serving production traffic; prioritize velocity and clarity over backward compatibility.
- The project has no existing persisted data; legacy-data preservation should not block refactors away from old implementations.
- Avoid compatibility shims or legacy pathways—apply necessary refactors immediately when feasible.
- If a refactor must wait, log a full-context entry (problem, proposed fix, follow-up steps) in the root backlog file (e.g., `TODO.md`) so it stays actionable.
- Expect concurrent agent sessions; unexpected working tree changes can happen—diff, sync, and adapt instead of reverting unseen work.

## Capturing Test Output
- Test suites produce high-volume output that WILL overflow Claude context. YOU MUST Redirect full logs to a file instead of streaming them to the assistant.
- Example: `pnpm vitest > logs/latest-test.log 2>&1` (create the `logs/` directory first if missing).
- Share only the relevant excerpts or summaries back in chat to keep the context focused.
- When debugging interactively, prefer quiet flags such as `pnpm vitest --run --reporter=basic` or target specific specs to minimize noise.

Following this convention keeps Claude responsive and preserves earlier conversation history.

## Monorepo Structure Rules

- **Depth Limit**: No file paths deeper than 3 levels from workspace root (e.g., `packages/graph/src/utils.ts` = 3 levels: `packages/`, `graph/`, `src/utils.ts`). Exceptions: `node_modules/`, `dist/`.

- **Import Restrictions**: No relative imports >3 `../` (e.g., `../../../` forbidden). Use path aliases for cross-package imports.

- **Package Boundaries**: Services/libs in `packages/` must not import "downstream" (e.g., `core/` can't depend on `graph/`). No circular dependencies.

- **File/Dir Limits**: No subdir >20 files (split if exceeded). Clean artifacts (e.g., `.backup` files) on commit.

- **Enforcement Levels**: Warn on PRs, fail CI for violations.

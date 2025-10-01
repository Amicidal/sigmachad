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

- **Depth Limit**: No file paths deeper than 3 (4 for packages) levels from workspace root (e.g., `packages/graph/src/utils.ts` = 4 levels: `packages/`, `graph/`, `src/`, `utils.ts`). Exceptions: `node_modules/`, `dist/`.

- **Import Restrictions**: No relative imports >3 `../` (e.g., `../../../` forbidden). Use path aliases for cross-package imports.

- **Package Boundaries**: Services/libs in `packages/` must not import "downstream" (e.g., `core/` can't depend on `graph/`). No circular dependencies.

- **File/Dir Limits**: No subdir >20 files (split if exceeded). Clean artifacts (e.g., `.backup` files) on commit.

- **Enforcement Levels**: Warn on PRs, fail CI for violations.

## Implementation & Debugging Loop

1. **Clarify Task & Success Criteria**: Restate the request in your own words, call out expected deliverables, acceptance signals, and deadlines. Surface blockers immediately. Ask the user for confirmation to ensure proper understanding. 
2. **Map Constraints & Risks**: Note policy boundaries, architectural limits, data availability, and any concurrency concerns before touching code.
3. **Research Inputs**: Perform targeted repo searches (`rg`, `fd`, etc.) and web searches for time-sensitive or uncertain topics—default to browsing when freshness matters (APIs, security, tooling updates). Capture command/query, rationale, and key takeaways.
4. **Develop Solution Options**: Sketch at least two viable approaches; assess trade-offs (complexity, blast radius, testability).
5. **Select Approach**: Choose the path that best balances scope, risk, and velocity; document why alternatives were dropped.
6. **Implement Incrementally**: Ship in coherent slices, keeping diffs reviewable. Mention any refactors you touch on the way.
7. **Validate Outcomes**: Run focused tests/linters; redirect full logs (e.g., `pnpm vitest --run > logs/latest.log 2>&1`) and summarize the evidence you inspected.
8. **Document & Handoff**: Record session details so the next agent can resume without guesswork.

### Session Journal Protocol

- Maintain per-session notes under `logs/sessions/YYYY-MM-DD/` named `HHMM-<taskid>.md` (UTC, 24-hour clock).
- Each append-only entry must include, in order, the headings: `Task & Definition`, `Constraints/Risks`, `Code Searches`, `Web Searches`, `Implementation Notes`, `Validation Evidence`, `Open Follow-ups`.
- For `Code Searches`/`Web Searches`, log the command or query, what you expected to learn, and the observed result. Cite URLs when applicable.
- Link validation evidence to the captured log file paths and specify the assertion checked.
- When working on a task, if the scope expands or the tasks becomes more challenging than expected, add additional tasks for other sessions to expand upon.
- When a follow-up is required, add an item to `TODO.md` using the enforced format (see file header) and note the reference ID inside the session entry (e.g., “See TODO.md item 2025-09-29.1”).
- Append new updates chronologically with fresh UTC timestamps; do not rewrite or delete prior journal content.

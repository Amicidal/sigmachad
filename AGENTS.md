# Agent Workflow Notes

## Project Status
- Codebase is in active development and not serving production traffic; prioritize velocity and clarity over backward compatibility.
- The project has no existing persisted data; legacy-data preservation should not block refactors away from old implementations.
- Avoid compatibility shims or legacy pathways—apply necessary refactors immediately when feasible.
- If a refactor must wait, log a full-context entry (problem, proposed fix, follow-up steps) in the root backlog file (e.g., `TODO.md`) so it stays actionable.
- Expect concurrent agent sessions; unexpected working tree changes can happen—diff, sync, and adapt instead of reverting unseen work.

## Capturing Test Output
- Test suites produce high-volume output that WILL overflow Codex context. YOU MUST Redirect full logs to a file instead of streaming them to the assistant.
- Example: `pnpm vitest > logs/latest-test.log 2>&1` (create the `logs/` directory first if missing).
- Share only the relevant excerpts or summaries back in chat to keep the context focused.
- When debugging interactively, prefer quiet flags such as `pnpm vitest --run --reporter=basic` or target specific specs to minimize noise.

Following this convention keeps Codex responsive and preserves earlier conversation history.

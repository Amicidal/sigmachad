# Agent Workflow Notes

## Project Status
- Codebase is in active development and not serving production traffic; prioritize velocity and clarity over backward compatibility.
- The project has no existing persisted data; legacy-data preservation should not block refactors away from old implementations.
- Avoid compatibility shims or legacy pathways—apply necessary refactors immediately when feasible.
- If a refactor must wait, log a full-context entry (problem, proposed fix, follow-up steps) in the root backlog file (e.g., `TODO.md`) so it stays actionable.
- Expect concurrent agent sessions; unexpected working tree changes can happen—diff, sync, and adapt instead of reverting unseen work.
- Use pnpm for all package management tasks; legacy Node package manager artifacts have been removed from the repo.

## Capturing Test Output
- Test suites produce high-volume output that WILL overflow Codex context. YOU MUST Redirect full logs to a file instead of streaming them to the assistant.
- Example: `pnpm vitest > logs/latest-test.log 2>&1` (create the `logs/` directory first if missing). 
- Share only the relevant excerpts or summaries back in chat to keep the context focused.
- When debugging interactively, prefer quiet flags such as `pnpm vitest --run --reporter=basic` or target specific specs to minimize noise.

Following this convention keeps Codex responsive and preserves earlier conversation history.

## Monorepo Structure Rules

- **Depth Limit**: No file paths deeper than 3 levels from workspace root (e.g., `packages/graph/src/utils.ts` = 3 levels: `packages/`, `graph/`, `src/utils.ts`). Exceptions: `node_modules/`, `dist/`.

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

## Rules of Engagement (Apps, Packages, Docs, Types)

Principles
- Favor reuse and integration over new implementations. Search existing packages before adding code. If functionality belongs to an existing package, extend it rather than duplicating logic in an app.
- Keep changes small and composable; prefer composition over inheritance.

### Principles (Quick Reference)
- DRY: Prefer reuse and extension of existing packages over new code; centralize cross-package types in `@memento/shared-types`.
- KISS: Keep apps thin and changes minimal; avoid clever abstractions and deep folder trees; honor path-depth and import ceilings.
- SRP: Each package/module should have one clear responsibility and a minimal, intentional public API.
- SoC: Apps orchestrate; packages implement capabilities; cross-cutting concerns live in dedicated packages, not apps.
- YAGNI: Don’t add capabilities or new packages until they’re needed and meet the New Package Criteria.

### How To Apply Here (TL;DR)
- Before coding, search for an existing capability; extend it if found (DRY, SRP).
- If logic is app-local but reusable, move it to a package; keep apps as glue (KISS, SoC).
- If a type is shared by more than one package/app, add it to `@memento/shared-types` and migrate imports (DRY, SRP).
- If you need more than `../../..` to import, add/use a path alias and/or refactor placement (KISS, SoC).
- Avoid speculative abstractions; build the simplest solution that satisfies today’s use case (KISS, YAGNI).
- Validate structure with repo scripts where relevant: `pnpm tsx scripts/validate-depth.ts`, `pnpm tsx scripts/check-service-structure.ts`, `pnpm tsx scripts/check-dist-imports.mjs`.

### Actionable Guidance by Principle

#### DRY (Don’t Repeat Yourself)
- Do: Extend an existing package when adding similar functionality; extract shared code into `packages/*` only after a second use case confirms reuse.
- Do: Move shared interfaces/enums to `packages/shared-types/src` and import via `@memento/shared-types`.
- Avoid: Copy-pasting utilities inside apps; duplicating domain types across packages.
- Checks: Search with `rg` for similar names before adding new files; 

#### KISS (Keep It Simple, Stupid)
- Do: Prefer small, composable modules; keep app files focused on wiring and routes/controllers.
- Do: Obey depth/import ceilings to reduce incidental complexity.
- Avoid: Over-engineered patterns or generalized abstractions without proven need; deep nesting beyond allowed depth.
- Checks: `pnpm tsx scripts/validate-depth.ts` to verify depth; keep PRs small and cohesive.

#### SRP (Single Responsibility Principle)
- Do: Give each package a single purpose with a minimal public API surface.
- Do: Split files when they start handling unrelated concerns; co-locate helpers privately inside the package.
- Avoid: “Kitchen-sink” packages or modules exporting many unrelated capabilities; leaking package internals to apps.
- Checks: Audit exports in each package `index.ts`; ensure only intentional, small surface is exported.

#### SoC (Separation of Concerns)
- Do: Keep apps as orchestrators and adapters; implement business logic inside packages.
- Do: Place cross-cutting concerns (e.g., logging, observability, testing helpers) in dedicated packages referenced via aliases.
- Avoid: Apps owning shared utilities or types; packages importing “downstream” packages; circular dependencies.
- Checks: Respect import boundaries and aliases; use `scripts/check-service-structure.ts` to spot structural issues.

#### YAGNI (You Aren’t Gonna Need It)
- Do: Implement only what current acceptance criteria require; postpone generalization until a concrete second use.
- Do: Use the “New Package Criteria” before adding a package; otherwise extend an existing one.
- Avoid: Adding configuration toggles, extensibility points, or layers until they’re justified by a real consumer.
- Checks: In PR descriptions, document the proven need (or second use case) for any new abstraction/package.

### Apps
- Keep apps thin: focus on wiring, orchestration, routes/controllers, and composition. Avoid app-local business logic when the logic could live in a package.
- Do not introduce cross-cutting utilities or domain models inside apps. If a type or helper is reused or likely reusable, move it to the appropriate package (or `@memento/shared-types` for types) and import it.
- When an app change requires new capabilities, first look to extend an existing package. Only create app-local adapters for integration glue.

### Packages
- Extend existing packages where the capability logically belongs; create a new package only when the capability is clearly novel, cross-cutting, and not a fit elsewhere.
- Respect monorepo rules: no downstream imports, no circular dependencies, and no relative imports deeper than three `../`.
- Keep public APIs intentional and minimal. Internal helper types and utilities remain package-internal; cross-package domain types belong in `@memento/shared-types`.

### Types
- Centralize shared, cross-package types in `packages/shared-types/src` and import them via the alias `@memento/shared-types`.
- Do not duplicate type definitions across packages or in apps. If a new shared type is needed, add it to `@memento/shared-types` and migrate usages.
- Keep `@memento/shared-types` free of runtime side effects. Prefer pure types, interfaces, and serializable constants/enums.
- Framework or tool augmentations (e.g., Fastify request/rep) live under `types/<lib>/*.d.ts`. If adding new global augmentations, ensure they are included by TypeScript configuration as needed in a related PR.

### Docs & Backlog
- When extending an existing package or adding a new one, document the rationale and usage in the package README and, if user-facing, in `Docs/`.
- If you must defer ideal placement (e.g., quick app-local fix), log a follow-up in `TODO.md` with context and a migration plan, per the Session Journal Protocol.

### New Package Criteria (create only if all apply)
- Capability does not fit existing packages after reasonable refactoring.
- Expected reuse by multiple apps/packages.
- Clear ownership, purpose, and boundaries defined in `project.json` and README.
- Adheres to import and depth rules; path aliases added to `tsconfig.base.json`.

Checklist (pre-merge)
- Reused or extended existing package(s) where appropriate.
- Centralized shared types in `@memento/shared-types` (no duplicates).
- App code remains thin; business logic resides in packages.
- Docs/TODO entries updated where necessary.

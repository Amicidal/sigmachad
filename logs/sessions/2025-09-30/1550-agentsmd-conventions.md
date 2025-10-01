Task & Definition
- Add clear conventions to AGENTS.md covering rules of engagement for apps, packages, docs, and types. Emphasize reuse/integration over new implementations and centralize types in shared-types.

Constraints/Risks
- Maintain alignment with existing monorepo rules (depth/import/boundaries).
- Avoid misleading guidance regarding ambient typings since root `types/` is not wired via `typeRoots` in tsconfig (note as follow-up if needed).
- Keep edits concise and non-breaking for current contributors.

Code Searches
- cmd: `ls -la` — confirm presence of AGENTS.md, apps/, packages/, types/ — observed all present.
- cmd: `sed -n '1,200p' AGENTS.md` — reviewed current structure to place new section.
- cmd: `ls -la types && rg -n "export|declare|interface|type" -S types` — observed empty `types/fastify/` with no declarations.
- cmd: `sed -n '1,200p' tsconfig.base.json` — confirmed path alias `@memento/shared-types -> packages/shared-types/src` exists.
- cmd: `ls -la packages && ls -la packages/shared-types && rg -n "export|interface|type" -S packages/shared-types` — verified shared-types package and exported types exist.
- cmd: `sed -n '1,200p' tsconfig.json` — noted `typeRoots` includes only `./node_modules/@types` (root `types/` not automatically picked up).

Web Searches
- none (network restricted; not required for this change).

Implementation Notes
- Appended a new section "Rules of Engagement (Apps, Packages, Docs, Types)" to AGENTS.md.
- Captured principles, app/package guidance, centralized types policy, docs/backlog expectations, new package criteria, and a short pre-merge checklist.

Validation Evidence
- File updated: AGENTS.md — new section appended and saved.
- Repo structure unchanged; no CI/config touches performed.

Open Follow-ups
- Consider adding `./types` to `typeRoots` or explicit inclusion if we start using ambient typings (create PR when first needed).
- Audit existing packages for duplicated domain types to migrate into `@memento/shared-types`.
- Add brief READMEs to `packages/shared-types` and any packages impacted by future moves.

---

Validation Evidence (Lint Rule)
- Command: `pnpm exec eslint "packages/{core,utils,api}/src/**/*.{ts,tsx}" -f stylish > logs/latest-lint.log 2>&1`
- Log: logs/latest-lint.log
- Assertion: custom rule fires on cross-package type-only imports.
- Result: 6 violations reported as `custom/no-cross-package-type-imports` (e.g., api importing types from @memento/core/knowledge/database). See lines matching the rule in the log.

Implementation Notes (Rule)
- Added `scripts/eslint-rules/no-cross-package-type-imports.js` to block type-only imports from `@memento/*` except `@memento/shared-types` and the current package alias (including subpaths).
- Wired in `eslint.config.js` under the `custom` plugin and enabled for `packages/**/*.ts`.

Open Follow-ups (Rule)
- Coordinate refactors to move shared types found in `packages/api` (and others) into `packages/shared-types`.
- Consider a codemod to migrate `import type { X } from '@memento/<pkg>'` to `@memento/shared-types` where applicable.

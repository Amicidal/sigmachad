Task & Definition
- Add a concise “Principles (Quick Reference)” to AGENTS.md and expand actionable, repo-specific guidance for KISS, SRP, SoC, and YAGNI (beyond existing DRY-oriented rules). Success = clear acronym mapping + concrete steps/checks without removing detailed rules.

Constraints/Risks
- Must preserve existing Rules of Engagement and monorepo guardrails.
- Keep guidance testable/operational (tie to existing scripts); avoid introducing contradictions.
- Network restricted; no external refs.

Code Searches
- Command: `rg -n --hidden --no-ignore-vcs --glob '!node_modules' 'AGENTS\.md' -S --files-with-matches`
  - Expect: Locate AGENTS.md at repo root.
  - Result: Found `AGENTS.md`.
- Command: `ls scripts/ && rg -n 'validate|check' scripts/` (via individual `sed` views)
  - Expect: Identify validation scripts to reference.
  - Result: Found `scripts/validate-depth.ts`, `scripts/check-dist-imports.mjs`, `scripts/check-service-structure.ts`.

Web Searches
- None (network access restricted). Not needed.

Implementation Notes
- Inserted new sections under Rules of Engagement:
  - `### Principles (Quick Reference)` mapping DRY, KISS, SRP, SoC, YAGNI to repo-specific practices.
  - `### How To Apply Here (TL;DR)` with concrete steps and validation commands.
  - `### Actionable Guidance by Principle` with Do/Avoid/Checks for each principle.
- Kept existing detailed sections (Apps/Packages/Types/Docs/New Package Criteria) intact.

Validation Evidence
- Command: `rg -n "^### Principles \(Quick Reference\)$|^### Actionable Guidance by Principle$" AGENTS.md`
  - Result: matches at lines 58 and 73 respectively.

Open Follow-ups
- Consider wiring the validation scripts into CI if not already (pre-merge job) to operationalize KISS/SRP/SoC/YAGNI checks alongside depth/import rules.

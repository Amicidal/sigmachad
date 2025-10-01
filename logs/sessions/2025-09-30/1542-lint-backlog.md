# Task & Definition
- Create structured TODO entries to tackle ESLint issues: typed-linting parser errors, security/detect-object-injection triage, deep relative imports, cross-package type imports, directory depth rule, and CI lint baselines. IDs added: 2025-09-30.41 through 2025-09-30.46.

# Constraints/Risks
- Active development; large lint diffs risk merge friction.
- Typed linting can be slow if misconfigured (`parserOptions.project` pointing at root).
- security/detect-object-injection may flag hot paths; refactors must not regress performance or safety.

# Code Searches
- Command: `rg -n "Parsing error:|detect-object-injection|no-restricted-imports|no-cross-package-type-imports" logs/latest-lint.log`
- Expectation: Identify most frequent rules and sample offending files.
- Result: Parser errors under `packages/knowledge/src/ingestion/**`; multiple object-injection errors and deep relative import hits.

# Web Searches
- None (repo-local task; used existing logs).

# Implementation Notes
- Appended six tasks to `TODO.md` following enforced template and incremented sequence/ID counters from .40 to .46.
- Tasks cover config fixes, refactor patterns, and CI scripts; avoided prescribing specific code moves to keep changes reviewable per package owner.

# Validation Evidence
- File updated: `TODO.md` (see tasks 21–26; IDs 2025-09-30.41..46).
- Lint baseline: `logs/latest-lint.log` (source for examples referenced in task contexts).

# Open Follow-ups
- Execute Task 21 first to remove parser errors, then rerun lint and reprioritize Task 22 scope based on residuals.

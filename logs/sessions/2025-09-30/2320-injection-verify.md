Task & Definition
Re-verify security/detect-object-injection is resolved across repo.

Constraints/Risks
Nx caching may hide/unhide findings between runs; using full pnpm lint with logs.

Code Searches
- pnpm -s lint > logs/lint-verify-injection.log 2>&1 (capture)
- sed sanitize -> logs/lint-verify-injection.sanitized.log

Implementation Notes
Parsed sanitized log and counted rule occurrences; extracted file paths adjacent to findings via perl one-liner.

Validation Evidence
- injection_total=39, injection_errors=37, injection_warnings=2
- Sample offenders: jobs/TemporalHistoryValidator.ts:186,233; core/utils/codeEdges.ts:275; core/utils/embedding.ts:228,229,271; backup/BackupService.ts:848,856,871,992,2178,2271,2543,2554,2559; knowledge/scripts/benchmark-ingestion.ts:376,377 (warnings).
- Logs: logs/lint-verify-injection.sanitized.log

Open Follow-ups
- Prior tasks marked as complete may have reduced but not eliminated findings; propose a scoped cleanup starting with backup/core runtime paths.

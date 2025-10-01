Task & Definition
Verify reported TS errors, Nx configs, and lint counts.

Constraints/Risks
No network; high output redirected to logs. Nx cache may affect counts.

Code Searches
- rg for files: rollback, docs route, DocumentationParser, parser/utils project.json

Implementation Notes
- Collected excerpts to logs/*.txt; ran focused builds and full lint

Validation Evidence
- Core TS error: logs/build-core.log (TS2322) and logs/rollback-integration-seg.txt around 762
- API TS error: logs/build-api.log (TS2341) and logs/documentation-parser-seg.txt around 206
- Nx project introspection: logs/nx-show-parser.log, logs/nx-show-utils.log
- Build cascade: logs/build-packages.log tail shows failed tasks list
- Lint counts: logs/lint-sanitized.log with counts parsed in this session

Open Follow-ups
- Decide resolution strategy for RollbackIssue vs RollbackError mapping
- Choose public API for plaintext parsing (rename or wrapper)
- Consider adding explicit build targets to parser/utils to avoid inference drift

# Code Edge Cleanup Backlog

Progress tracker for removing deprecated code-edge implementations and tightening schemas.

- [x] Remove legacy `occurrences` field usage; require `occurrencesScan` throughout ingestion and persistence.
- [x] Collapse duplicate `strength`/`confidence` fields by standardizing on `confidence` and pruning legacy mirroring.
- [x] Enforce `normalizeCodeEdge` in all ingestion paths before persistence.
- [x] Replace loose `fromRef`/`toRef` scalar mirrors with canonical structured references.
- [ ] Update downstream clients/APIs to surface typed enums for code-edge queries.
- [ ] Expand unit/integration coverage for enum filters and multi-value query handling.
- [ ] Migrate stored edge records to supported enum literals; backfill data inconsistencies.
- [ ] Document code-edge metadata contract and add lint-time validation.
- [ ] Introduce schema validation for evidence/location payloads before storage.
- [ ] Regenerate compiled artifacts post-cleanup to keep dist outputs aligned.
- [ ] Ensure `DEPENDS_ON` code edges emit a canonical `kind` for query filtering.
- [ ] Hoist `occurrencesScan`/`occurrencesTotal` from metadata during normalization so counters are accessible.

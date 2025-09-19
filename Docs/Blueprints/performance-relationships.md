# Performance Relationship Blueprint

## 1. Overview
Performance relationships (`PERFORMANCE_IMPACT`, `PERFORMANCE_REGRESSION`) capture how code changes affect benchmarks, latency budgets, and resource usage. They serve incident analysis, regression prevention, and optimization prioritization.

## 2. Current Gaps
- No end-to-end ingestion path exists; any emitted metadata (planned by perf monitors) would be reduced to base identifiers.
- Canonical IDs lack metric-specific disambiguation, so multiple benchmarks against the same entity would collide.
- Query APIs cannot filter by metrics or thresholds; no infrastructure for storing trends or run history.
- Temporal history is absent, hindering regression tracking and resolution workflows.
- Integration load tests for `DatabaseService` (`Performance and Load Testing > should handle large dataset operations`) highlight that our seeded bulk dataset tops out at 40 rows, so the suite expecting 50 rows from a `LIMIT 50` query currently fails. We need additional fixture seeding (or paging support) before the performance blueprint can claim coverage of larger batches.
- Postgres JSON/JSONB fields are returned as parsed objects in both test and integration modes; we still need to document this contract (and offer opt-in raw string handling) so API consumers do not double-parse payloads that now arrive as objects.
- `PostgreSQLService.bulkQuery` now performs real batched writes (integration suite confirmed), but lacks instrumentation and chunking strategies for very large payloads; track follow-up work to add metrics, backpressure, and configurable batch sizing so performance runs remain predictable beyond the current 50-row ceiling.
- History/analytics queries currently trip foreign key constraints because test suites aren't seeded alongside `test_results`; add fixture management or relax FK expectations before timeline/coverage reporting can be validated.
- Maintenance workflows still lack negative-path handling: `MaintenanceService Integration > Error Handling and Edge Cases > should handle database connection failures gracefully` exits without assertions because the service never surfaces simulated failures. Blueprint coverage should include deterministic failure injection so maintenance tasks can exercise and record recovery paths.
- The public `/api/v1/tests/performance/:entityId` endpoint never surfaces data after recording executions; newly created specs still return HTTP 404 because no performance metrics are persisted or projected back to the graph. End-to-end workflows expecting a nominal response (even with empty metrics) fail until the ingestion + persistence loop writes default performance summaries for recorded runs.

## 3. Desired Capabilities
1. Define a robust ingestion contract representing benchmarks, scenarios, and statistical metrics.
2. Persist metrics and context (baseline, current value, delta, unit, sample size, environment) without flattening to generic metadata.
3. Support multiple metrics per entity and scenario, enabling comparisons across benchmarks.
4. Provide query filters for metric IDs, threshold breaches, trend directions, and environment.
5. Integrate with history to track when regressions occurred/resolved and support reporting.

## 4. Inputs & Consumers
- **Ingestion Sources**: Benchmark harnesses, profiling tools, performance CI jobs, production telemetry summarizers.
- **Consumers**: Performance dashboards, regression detection bots, CI gates, release readiness checks, impact analysis features.

## 5. Schema & Metadata Requirements
| Field | Type | Notes |
| --- | --- | --- |
| `metricId` | string | Unique identifier for metric (e.g., `benchmark/api/login-latency`).
| `environment` | enum (`dev`, `staging`, `prod`, `perf-lab`, etc.) | Where measurement was taken.
| `baselineValue` | number | Baseline measurement (ms, MB, ops/s); stored with 4 decimals.
| `currentValue` | number | Current run measurement.
| `unit` | string | Measurement unit; standardize (ms, MB, req/s).
| `delta` | number | `currentValue - baselineValue`; convenience.
| `percentChange` | number | (current - baseline)/baseline * 100.
| `sampleSize` | integer | Number of samples/runs.
| `confidenceInterval` | object | Optional (lower, upper) values.
| `trend` | enum (`regression`, `improvement`, `neutral`) | Derived from delta.
| `severity` | enum (`critical`, `high`, `medium`, `low`) | Based on threshold policy.
| `evidence` | array | Link to benchmark run artifacts, flamegraphs.
| `runId` | string | Reference to run entity.
| `metadata.metrics` | array | Additional metrics (variance, percentiles).
| `detectedAt`, `resolvedAt` | timestamps | Lifecycle markers.

## 6. Normalization Strategy
1. Implement `normalizePerformanceRelationship`:
   - Require `metricId` and sanitize to lowercase with `/` separators; limit length.
   - Validate numeric fields; convert string numbers; clamp to sensible ranges.
   - Compute `delta`, `percentChange`, and `trend` if not provided.
   - Map severity using policy thresholds (config-driven). Optionally store `policyId` referencing threshold config.
   - Promote `environment`, `unit`, `sampleSize`, `confidenceInterval`, `runId`, `metrics` array.
   - Merge evidence entries referencing benchmark artifacts.
2. Validate that `baselineValue` is non-zero before computing percent change; handle zero baseline gracefully.
3. Derive `riskScore` to compare regressions; keep in metadata.

## 7. Persistence & Merge Mechanics
1. **Canonical ID**: Extend to include `metricId` and optionally `environment`. Example: `rel_perf_sha1(from|metricId|environment|type)`.
2. **Cypher Projections**: Add scalar fields for `metricId`, `environment`, `baselineValue`, `currentValue`, `delta`, `percentChange`, `unit`, `sampleSize`, `trend`, `severity`, `runId`, `confidenceInterval`, `detectedAt`, `resolvedAt`, `riskScore`, `metadata.metrics` JSON.
3. **Merge Rules**:
   - When new data arrives for same metric + environment, append to `metricsHistory` (bounded array) and update `currentValue`, `trend`, `severity`.
   - Maintain rolling statistics (e.g., exponential moving average) for trending analysis.
   - When regression resolves (values return within threshold), update `status` to `resolved`, set `resolvedAt`, but keep history for reporting.
4. **Auxiliary Entities**: Optionally create `benchmark_run` nodes to store detailed runs and link edges; re-use for dashboards.
5. **Indexes**: `(metricId)`, `(type, severity)`, `(environment)`, `(trend)`, optionally `(type, metricId, environment)` composite.

## 8. Query & API Surface
1. `getRelationships` should accept filters for `metricId`, `environment`, `severity`, `trend`, `percentChangeMin/Max`, `detectedBefore/After`, `resolved`.
2. Helper APIs:
   - `getPerformanceRegressions({ severityMin, limit, environment })` sorted by risk score.
   - `getMetricHistory(metricId, { environment, limit })` returning timeline of values.
   - `getEntityPerformanceSummary(entityId)` aggregating metrics, statuses, and suggestions.
3. Provide ready-to-use payloads for dashboards (e.g., top regressions, improvements, resolved items).

## 9. Temporal & Auditing
1. Integrate with history pipeline: open edges when regression detected, close when resolved; maintain `validFrom/validTo` reflecting active regression periods.
2. Store `metricsHistory` or project to version nodes for deeper timeline analytics.
3. Provide timeline queries to show metric performance over time for specific entities or metrics.

## 10. Migration & Backfill Plan
1. Develop ingestion spec and update instrumentation to emit performance edges; ensure compatibility with new schema.
2. Backfill from existing benchmark archives or telemetry (if available) to seed baseline data.
3. Provide script to import historical regression incidents (if tracked in spreadsheets or logs).
4. Validate by comparing new graph data against existing performance dashboards; align thresholds.

## 11. Risks & Mitigations
| Risk | Mitigation |
| --- | --- |
| Missing or inconsistent metric IDs across tools | Define shared catalog of metrics; enforce via ingestion contract. |
| Data volume (frequent benchmarks) causing large history | Cap history arrays; offload raw runs to storage with references. |
| Unit mismatches leading to incorrect trends | Normalize units at ingestion; reject edges with conflicting units. |
| Threshold policy drift | Store `policyId` and version; update edges when policy changes. |

## 12. Implementation Milestones
1. Finalize ingestion contract and update emitter tools.
2. Implement normalization/persistence updates + tests.
3. Extend queries/APIs and add indexes.
4. Roll out ingestion with feature flag; monitor metrics.
5. Build dashboards and alerting pipelines.

## 13. Open Questions
- Should regression detection happen upstream or within graph service (e.g., schedule job comparing metrics)?
- Do we need environment-specific nodes or metadata suffices?
- How will we manage baselines—per branch, per release, per environment?
- What retention/archival policy should apply to historical performance data to keep graph manageable?

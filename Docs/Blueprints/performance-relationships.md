# Performance Relationship Blueprint

## 1. Overview
Performance relationships (`PERFORMANCE_IMPACT`, `PERFORMANCE_REGRESSION`) capture how code changes affect benchmarks, latency budgets, and resource usage. They serve incident analysis, regression prevention, and optimization prioritization.

## 2. Current Gaps
- **Instrumentation depth**: Relationship ingestion, canonical IDs, metrics history, and the `/api/tests/performance/:entityId` endpoint are wired end-to-end, but we still lack operational insight (batch timings, queue pressure, failure telemetry) when large performance batches arrive. Extend `PostgreSQLService.bulkQuery` instrumentation and expose request-level logging so regression hunts remain debuggable under load.
- **Backpressure & sizing**: The current snapshot writer happily accepts 50-row batches, yet we have no adaptive throttling once runs cross that threshold. Add configuration knobs (max batch size, retry budget, queue length) and document the policy to prevent runaway ingestion loops.
- **Data lifecycle**: Temporal edges now persist with provenance, but we still need archival/retention guidance for high-volume metrics. Define rotation or downsampling strategies before perf dashboards grow beyond manageable storage size.
- **JSON/JSONB contracts**: API responses now surface parsed JSON objects for `metadata` and `metricsHistory`. Document how callers can opt into raw strings (if required) and keep the contract in sync across unit/integration suites.
- **Fixtures & load coverage**: Integration datasets should seed at least 50 snapshot rows so `DatabaseService` load tests reflect real ingestion behaviour. Track follow-up scenarios where higher-volume fixtures or pagination exercises the same code paths.

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
   - Map severity using policy thresholds (config-driven) while forcing improvements/negative deltas to settle at `low` severity so resolved trends no longer surface as regressions. Optionally store `policyId` referencing threshold config.
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
1. `getRelationships` now accepts `metricId`, `environment`, `severity`, `trend`, `detectedAfter`, `detectedBefore`, and resolution filters. Document combined usage patterns (e.g., “critical regressions in staging last 7 days”).
2. REST + MCP `tests.performance` endpoints return aggregate metrics **and** a `history` array of `performance_metric_snapshots` (see §8). Extend blueprints with concrete payloads so dashboard builders can align on shapes.
3. Follow-up helpers remain desirable: `getPerformanceRegressions`, `getMetricHistory`, and `getEntityPerformanceSummary` should reuse the snapshot storage once prioritised.

## 9. Temporal & Auditing
1. Integrate with history pipeline: open edges when regression detected, close when resolved; maintain `validFrom/validTo` reflecting active regression periods.
2. Store `metricsHistory` or project to version nodes for deeper timeline analytics.
3. Provide timeline queries to show metric performance over time for specific entities or metrics; leverage the persisted `metricsHistory` arrays as the compact historical trace.

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

# Maintenance Operations Blueprint

## 1. Overview
Admin maintenance endpoints (backup, restore, housekeeping) now coordinate FalkorDB, Qdrant, PostgreSQL, and pluggable storage providers via a centralized control plane. Backups store structured metadata in PostgreSQL, emit audit events through the shared logging service, and drive a two-step restore workflow (preview token → confirmation) that enforces dry-run validation and optional secondary approval before destructive changes are applied.

## 2. Current Gaps
- Unit coverage now exercises the preview/confirm flow, in-memory storage providers, retention pruning, and approval gating (see 2025-09-19 refresh), but we still lack end-to-end integration runs against real Docker services and remote storage adapters.
- Retention policy logic is only asserted via stubbed PostgreSQL responses; we still need an integration test that verifies pruning against a live `maintenance_backups` table and artifact cleanup.
- Only the local filesystem storage provider ships today. Remote providers (S3/GCS) and streaming restore remain TODO, limiting scalability for large datasets.
- Restore execution still stubs parts of the workflow (e.g., Qdrant snapshot replay merely verifies presence). We need real vendor API integrations to guarantee fidelity.
- Structured logging is in place, but there is no out-of-the-box metrics/alerting pipeline. SREs still have to wire dashboards and alerts manually.

## 3. Desired Capabilities
1. Extend unit/integration tests to cover preview token issuance, integrity failures, approval gating, and confirmation flows; add regression coverage for new admin endpoints.
2. Implement remote storage adapters (S3, GCS) with resumable upload/download and streaming restores for large backups.
3. Replace placeholder restore logic for Qdrant and other subsystems with real API-driven restores and reconciliation diffs.
4. Export maintenance telemetry to metrics/alerting stacks (Prometheus/OpenTelemetry) and document dashboard recipes for ops teams.
5. Broaden dependency readiness checks beyond DatabaseService by probing downstream services and surfacing structured failure codes to tooling/CLI clients.

## 4. Metrics & Observability
- **Endpoints**: Maintenance telemetry is exposed via `GET /maintenance/metrics` (JSON summary) and `GET /maintenance/metrics/prometheus` (Prometheus text format). The existing `/metrics` response now embeds the maintenance summary for consolidated dashboards.
- **Counters**:
  - `maintenance_backup_total{status,provider,type}` tracks backups by outcome, storage provider, and full vs. incremental mode.
  - `maintenance_restore_total{mode,status,requires_approval,provider}` captures both preview and apply phases alongside approval requirements.
  - `maintenance_task_total{task_type,status}` surfaces housekeeping/reindex/validation cadence and failure hotspots.
  - `maintenance_restore_approvals_total{status}` measures human approval throughput for audit/SOX reporting.
- **Histograms**:
  - `maintenance_backup_duration_seconds` and `maintenance_restore_duration_seconds` provide SLO-ready latency buckets (1s → 30m) for burn-rate alerts.
- **Gauges**:
  - `maintenance_metrics_age_seconds` reports exporter freshness; alert if it exceeds the scrape interval.
- **Dashboard recipe**:
  1. Success rate: `sum(rate(maintenance_backup_total{status="success"}[5m])) / sum(rate(maintenance_backup_total[5m]))`.
  2. Restore p95 latency: `histogram_quantile(0.95, sum by (le) (rate(maintenance_restore_duration_seconds_bucket[5m])))`.
  3. Outstanding approvals: `sum(maintenance_restore_total{status="failure",requires_approval="true"}) - sum(maintenance_restore_approvals_total{status="approved"})`.
- **Alerting cues**: Page on backup failure rate >5% over 15m, warn if approvals drop below one per hour during scheduled windows, and ensure exporter age stays <2 scrape intervals.

## 5. Decisions & Open Questions
- **Backup metadata store**: centralized in PostgreSQL (`maintenance_backups`) with transactional updates and queryable history.
- **Destructive restore guardrails**: enforced through RBAC scopes plus the two-step (preview + confirm) workflow; optional dual-approval is controlled via service policy.
- **Structured PostgreSQL artifacts**: backups now emit `*_postgres.json` alongside the schema-only `*_postgres.sql`. The JSON payload captures ordered column metadata, primary keys, and sanitized row data so restores can replay via parameterised inserts rather than brittle SQL strings. Legacy `.sql` dumps are still honoured as a fallback for older artifacts.
- **Legacy migration**: not required yet—the code has not produced production backups. Future schema/storage changes can skip migration of historical payloads.
- **Observability backend**: Standardise on Prometheus for maintenance KPIs (with optional OTLP fan-out downstream). Retention/expiration policies on `maintenance_backups` remain under evaluation as backup cadence scales.

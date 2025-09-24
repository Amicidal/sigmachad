# Logging Service Blueprint

## 1. Overview
The logging service captures runtime events across Memento, piping console output and process-level failures into an in-memory ring buffer with optional JSONL persistence. Downstream analytics expect aggregated statistics (`byLevel`, `byComponent`) and file exports to drive operational tooling.

## 2. Current Gaps
- Lifecycle notes in README/admin docs lag behind the hardened implementation (dispatcher singleton, rotation options, suppression behaviour), leaving operators without configuration guidance.
- The dispatcher currently relies on explicit `dispose()` calls; adopting `WeakRef`/`FinalizationRegistry` cleanup would protect against forgotten teardown in ad-hoc scripts.

## 3. Desired Capabilities
1. ✅ Introduce a singleton dispatcher that wires console/process hooks once and fans out events to active service instances using weak references (or expiring registrations) so instrumentation stays stable and self-cleans.
2. ✅ Provide explicit lifecycle management (`dispose()` / context manager) to unregister instances and restore console methods when instrumentation is no longer needed (particularly for test environments).
3. ✅ Harden file persistence: detect repeated failures, short-circuit additional writes, and use original console methods for internal diagnostics to avoid recursive logging.
4. ✅ Support resilient serialization by redacting or safely stringifying circular structures in `data` payloads.
5. ✅ Implement configurable log rotation (size- and age-based) with deterministic file naming and atomic swaps to keep JSONL outputs manageable.
6. ✅ Expose health metrics (dropped writes, suppressed file exports, listener counts) so observability tooling can surface regressions quickly.

## 4. Backlog
- [x] **Instrumentation dispatcher**: create `InstrumentationDispatcher` (in `@memento/core`) to wrap console/process hooks once, store original methods, cap listener counts, and broadcast structured events to registered consumers via weak references. Includes metrics for registered instance count and listener saturation.
- [x] **Lifecycle & registration API**: update `LoggingService` (in `@memento/core`) to register with the dispatcher, expose `dispose()` for tests/runtime cleanup, and ensure disposing the final consumer restores original console/process handlers.
- [x] **Persistence hardening**: replace raw `appendFile` calls with a guarded writer that honors retry backoff, stops after configurable failure thresholds, emits diagnostics via preserved console functions, and increments `droppedFileWrites` metrics.
- [x] **Serialization guardrail**: introduce a safe JSON serializer (in `@memento/core`) that handles circular references, trims oversized payloads, and annotates redactions so analytics can reason about omissions.
- [x] **Log rotation**: add size- and age-based rotation settings to `LoggingService` options (`maxFileSize`, `maxFileAgeMs`, `maxHistory`), implement atomic rollover with deterministic filenames (e.g., `.1`, `.2` suffixes), and document defaults.
- [x] **Health metrics surface**: expose `getHealthMetrics()` reporting dropped writes, suppressed exports, dispatcher listener count, and rotation events; thread through to admin routes (in `@memento/api`) for operational introspection.
- [ ] **Documentation alignment**: refresh `README.md` and admin docs with configuration instructions, metric semantics, and lifecycle guidance once implementation stabilises.
- [ ] **Automatic dispatcher cleanup**: explore adopting `WeakRef`/`FinalizationRegistry` support (or expiring registrations) so long-lived processes stay healthy even when consumers forget to call `dispose()`.

## 5. Test Coverage Notes
- `tests/unit/services/LoggingService.test.ts` now exercises disposal semantics and verifies dispatcher metrics reset; retain coverage as new lifecycle helpers (e.g., weak-reference cleanup) land.
- `tests/integration/services/LoggingService.integration.test.ts` validates multi-instance sharing, process instrumentation, and rotation. Keep the new `/logs/health` coverage in `tests/unit/api/routes/admin.test.ts` aligned with any schema or payload extensions.
- Ensure admin route tests continue exercising both healthy and failure modes for logging metrics, and keep persistence failure scenarios for FileSink suppression.

## 6. Next Steps
1. Publish updated operational docs (README, admin guide) covering dispatcher lifecycle, rotation defaults, and the `/logs/health` endpoint.
2. Investigate `WeakRef`/`FinalizationRegistry` support for `InstrumentationDispatcher` to remove forgotten consumers automatically and extend the test suite accordingly.
3. Integrate the new health metrics into observability dashboards and alerting so suppressed writes or listener saturation surface proactively.

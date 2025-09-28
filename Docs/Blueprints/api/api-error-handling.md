# API Error Handling Blueprint

## Metadata

- Scope: api
- Status: Draft
- Last Updated: 2025-09-27

## Working TODO

- [ ] Add/update Scope metadata (Scope: api).
- [ ] Confirm Desired Capabilities with acceptance tests.
- [ ] Link to code touchpoints (packages/, api routes).
- [ ] Add migration/backfill plan if needed.

## 1. Overview
The API Gateway exposes REST endpoints layered over Fastify. Consistent error envelopes (status code, machine-readable code, human message, request correlation metadata) are required so HTTP clients, web socket bridges, and observability pipelines can correlate failures with logs and retry policies.

## 2. Current Gaps
- **Route-specific catch blocks bypass the global handler.** Several routes build ad-hoc `{ success: false, error }` payloads without `requestId`/`timestamp`, breaking correlation in tests and production diagnostics. `tests/integration/api/APIGateway.integration.test.ts` previously caught this on `/api/v1/graph/search` when simulated database faults omitted metadata.
- **No shared utility for structured errors.** Without a helper, each route re-implements response shapes, increasing the odds of drift (missing fields, inconsistent `details` redaction behaviour) as new endpoints are added.
- **Limited coverage beyond graph routes.** Only the graph routes currently use the new `buildErrorResponse` helper; other modules (admin, middleware, spec ingestion) still emit bespoke envelopes and should be aligned to avoid regressions.

## 3. Desired Capabilities
1. Provide a reusable error response helper that attaches `requestId`, `timestamp`, and environment-appropriate `details` while preserving route-specific `code`/`message` semantics.
2. Ensure all route modules flow through the helper (or throw and defer to the global handler) so integration suites can assert on a single error contract.
3. Extend tests to cover representative endpoints per route grouping, verifying both success and failure payloads include correlation metadata.

## 4. Immediate Follow-ups
- Sweep remaining routes to either reuse `buildErrorResponse` or surface errors to the global handler; update unit tests to expect the enriched envelopes.
- Document the contract in developer docs and lint/new-route templates so future handlers do not regress.
- Consider centralising error logging (attach structured context before sending responses) so repetition in per-route catch blocks disappears.

## 5. Recent Fixes
- **2025-09-19:** Introduced `buildErrorResponse` in graph routes (now in `@memento/api`) and updated graph endpoints plus gateway integration tests to guarantee `requestId`/`timestamp` accompany server-side failures.

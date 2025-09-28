# MCP Tooling Blueprint

## Metadata

- Scope: mcp
- Status: Draft
- Last Updated: 2025-09-27

## Working TODO

- [ ] Add/update Scope metadata (Scope: mcp).
- [ ] Confirm Desired Capabilities with acceptance tests.
- [ ] Link to code touchpoints (packages/, api routes).
- [ ] Add migration/backfill plan if needed.

## 1. Overview
Model Context Protocol (MCP) tools expose key graph, design, and testing workflows over JSON-RPC. They back the `/mcp` endpoint, the MCP router (in `@memento/api`), and the integration suite. Recent fixes ensured the graph examples payload matches client expectations, preserved tool-specific error codes during validation failures, and introduced a heuristic fallback for `tests.plan_and_generate`—now short-circuiting Postgres lookups when spec identifiers are non-UUID strings to avoid spurious 500s.

## 2. Current Gaps
- **Heuristic planning only:** The new fallback returns structured unit/integration/E2E/performance plans, but they are generated from acceptance-criteria strings or title heuristics. They ignore existing KG relationships, historical tests, or dependency signals. This keeps the integration test green yet yields low-fidelity guidance for real users.
- **Specification lookup:** Non-UUID spec identifiers now bypass the Postgres lookup entirely, preventing invalid UUID errors but leaving the fallback with title/AC heuristics only. We still lack a slug-based or alternate-key index to hydrate richer context when the KG/document store is missing the spec record.
- **Coverage estimates:** The fallback projects coverage percentages via deterministic heuristics. Without baseline metrics from `TestPlanningService` or the KG, these numbers may overstate achievable coverage and should be treated as advisory only.
- **Graph examples contract:** MCP responses now surface `usageExamples`/`testExamples` at the top level while keeping the legacy nested `examples` object for backward compatibility. Downstream consumers should migrate to the flattened fields to avoid confusion.
- **Schema enforcement:** Input validation currently mirrors JSON schema definitions with hand-rolled checks inside `handleSimpleToolCall`. This duplication risks drift from the Fastify/AJV contracts; we should consolidate on a shared validator to keep MCP error codes authoritative.

## 3. Next Steps
1. **Enrich fallback planning:** Reuse `TestPlanningService` utilities where possible—e.g., fetch related entities/tests via KG queries even when the primary spec is absent, and seed heuristic plans with those signals.
2. **Spec hydration pipeline:** Ensure specs created through MCP or other channels populate both KG entities and the `documents` table. Provide a lightweight seed mechanism for tests so heuristics can rely on richer metadata.
3. **Coverage calibration:** Derive coverage projections from historical metrics (when available) and expose confidence intervals so MCP clients understand whether the estimate is heuristic or data-backed.
4. **Documentation alignment:** Update public MCP docs to state that `graph.examples` returns flattened arrays alongside the legacy `examples` object, and document the structure of heuristic test plans (fields, default assertions, performance testing trigger logic).

## 4. Test Coverage
- `tests/integration/api/MCPToolIntegration.integration.test.ts` now passes, exercising MCP plan generation (including the missing-spec path), graph examples, validation, impact analysis, and error handling.
- `tests/unit/api/mcp-router.test.ts` continues to cover registration metadata and per-tool validation logic, ensuring schema drift is caught early.

# Test Result Parser Blueprint

## Metadata

- Scope: testing
- Status: Draft
- Last Updated: 2025-09-27

## Working TODO

- [ ] Add/update Scope metadata (Scope: testing).
- [ ] Confirm Desired Capabilities with acceptance tests.
- [ ] Link to code touchpoints (packages/, api routes).
- [ ] Add migration/backfill plan if needed.

## 1. Overview
The TestResultParser service normalizes results emitted by common harnesses (JUnit, Jest, Mocha, Vitest, Cypress, Playwright) into `TestSuiteResult` payloads consumed by `TestEngine`. Recent fixes introduced an explicit `errorTests` counter alongside classic failure metrics and ensured malformed or empty JUnit payloads return a zeroed suite rather than throwing, keeping downstream ingestion resilient across flaky CI artifacts.

## 2. Current Gaps
- **Regex XML parsing:** JUnit parsing still relies on handcrafted regular expressions, leaving us vulnerable to nested suites, CDATA sections, and attribute edge cases. A dedicated XML parser (`fast-xml-parser` or `xml2js`) would improve fidelity and reduce maintenance risk.
- **Framework-specific error semantics:** Non-JUnit adapters (Mocha/Cypress/Playwright) now tally `errorTests` but still infer statuses from reporter-specific fields. We should validate against real reporter payloads (especially retries and hook failures) to ensure error classification is accurate.
- **Duration normalization:** We continue to accept reporter-provided durations verbatim. When suites mix seconds and milliseconds we risk skewed totals—consider normalizing via schema-aware conversions.

## 3. Next Steps
1. Replace regex-based JUnit parsing with a light XML parser that preserves nested suite structure, properties, and CDATA payloads.
2. Extend fixtures/tests to cover reporter edge cases (Mocha hook failures, Cypress retries, Playwright timeouts) and assert `errorTests` accuracy.
3. Add a normalization layer that harmonizes duration units and surfaces a confidence flag when parsing heuristics are applied.

## 4. Test Coverage
- `tests/unit/services/TestResultParser.test.ts` exercises parser internals, merge behaviour, and helper utilities.
- `tests/integration/services/TestResultParser.integration.test.ts` verifies end-to-end parsing across supported frameworks and now confirms error metrics plus invalid-input tolerance.

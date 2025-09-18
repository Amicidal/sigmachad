# Security Relationship Blueprint

## 1. Overview
Security relationships (`HAS_SECURITY_ISSUE`, `DEPENDS_ON_VULNERABLE`, `SECURITY_IMPACTS`) map code artifacts to vulnerability data, remediation plans, and security posture insights. They should capture severity, status, evidence, and provenance to support risk management workflows.

## 2. Current Gaps
- Security scanner emits severity, status, CVSS score, advisory IDs, and evidence paths but persistence only retains core identifiers.
- Canonical IDs collapse distinct findings affecting the same target, leading to data loss when multiple CVEs apply.
- No lifecycle tracking (open/fixed/accepted) exists; history stubs cannot capture remediation timelines.
- Query interfaces cannot filter by severity, status, or specific vulnerability identifiers, limiting dashboards and automation.
- Integration coverage shows the dependency advisory lookup returns GitHub Security Advisories (e.g., `GHSA-4xc9-xhrj-v574`) while tests expect normalized CVE IDs (`CVE-2021-23337`)—see `Security Scan Execution > should detect dependency vulnerabilities`. Add a normalization layer so the blueprint promises canonical identifiers.
- Remediation guidance is empty in the generated report (`immediate` + `planned` counts are zero), causing `Vulnerability Reporting > should provide remediation recommendations` to fail. Capture at least one recommendation per vulnerability before the blueprint can claim coverage.
- Security audit metadata currently stores ISO timestamps as strings; `Security Audit Functionality > should perform full security audit` expects `Date` objects. Decide on the canonical representation and update the contract accordingly.
- Dependency scanning routines require outbound calls to OSV during unit tests; lack of a mockable client makes offline runs noisy and potentially flaky. Introduce an injectable advisory provider with deterministic fixtures before claiming hermetic coverage.

## 3. Desired Capabilities
1. Persist vulnerability metadata (severity, status, CVSS, advisory ID, exploitability, CWE) with evidence and remediation references.
2. Track multiple findings per entity without collisions and maintain their lifecycle transitions.
3. Allow filtering by severity, status, vulnerability ID, exploitability, owning team, and evidence freshness.
4. Integrate with temporal history to audit remediation progress and enforce policies.
5. Reference external vulnerability sources (OSV, CVE) while storing local assessment state.

## 4. Inputs & Consumers
- **Ingestion Sources**: Static analysis scanners, dependency scanners (Snyk, OSS Index), manual security reviews, runtime telemetry.
- **Consumers**: Security dashboards, CI/CD gates, incident response tooling, dependency update automation, compliance reporting.

## 5. Schema & Metadata Requirements
| Field | Type | Notes |
| --- | --- | --- |
| `findingId` | string | Stable identifier (CVE, advisory ID, or generated hash); required to disambiguate.
| `severity` | enum (`critical`, `high`, `medium`, `low`, `info`) | Map upstream strings.
| `status` | enum (`open`, `fixed`, `accepted`, `false-positive`, `investigating`) | Lifecycle state.
| `cvssScore` | number (0-10) | Clamp and store with 2 decimals.
| `cvssVector` | string | Optional detailed vector string.
| `cweIds` | string[] | CWE identifiers; optional.
| `source` | enum (`scanner`, `manual`, `imported`) | Origin of finding.
| `evidence` | array | Reuse `EdgeEvidence` with additional context (file path, line, note).
| `remediation` | string | Summary of remediation guidance.
| `ownerTeam` | string | Responsible team.
| `statusHistory` | array | Chronological record of status transitions.
| `detectedAt`, `resolvedAt` | timestamps | Derived from status history.
| `metadata.external` | object | Links to external advisories, patches.

## 6. Normalization Strategy
1. **Helper `normalizeSecurityRelationship`**:
   - Require `findingId`; if missing, generate deterministic hash from advisory data.
   - Normalize `severity`, `status`, `source` to canonical enums; log unknown values.
   - Clamp `cvssScore`, parse `cvssVector` for validation, ensure `cweIds` sanitized.
   - Promote `remediation`, `ownerTeam`, `statusHistory`, `detectedAt`, `resolvedAt` from metadata.
   - Merge evidence arrays, ensuring they include file paths and note context.
2. **Validation**: Reject edges lacking `findingId` or `severity`; track metrics on missing fields. Validate chronological order in `statusHistory`.
3. **Risk Scoring**: Optionally derive `riskScore` based on severity, exploitability, coverage; store for quick sorting.

## 7. Persistence & Merge Mechanics
1. **Canonical ID**: Compute `rel_security_sha1(from|to|type|findingId)` ensuring unique edge per finding. Keep fallback to old scheme during migration.
2. **Cypher Writes**: Add columns for `findingId`, `severity`, `status`, `cvssScore`, `cvssVector`, `cweIds` JSON, `source`, `remediation`, `ownerTeam`, `riskScore`, `statusHistory`, `detectedAt`, `resolvedAt`.
3. **Merge Rules**:
   - When status updates arrive, append to `statusHistory` (dedupe by timestamp) and update `status`, `resolvedAt` accordingly.
   - Keep highest severity when scanners disagree (configurable precedence); preserve manual overrides with flag `isManualOverride`.
   - Maintain `metadata.origins` to track multiple scanners contributing evidence.
4. **Auxiliary Entities**: Model vulnerabilities as nodes (`vulnerability { id: findingId, source }`) linked via `HAS_SECURITY_ISSUE`. Security edge can then connect code -> vulnerability; ensures reusability across repos.
5. **Indexes**: `(findingId)`, `(type, severity)`, `(status)`, `(ownerTeam)`; optionally composite `(type, status, severity)` for dashboards.

## 8. Query & API Surface
1. Enhance `getRelationships` with filters for `findingId`, `severity`, `status`, `cvssScoreMin/Max`, `ownerTeam`, `detectedBefore/After`, `resolved` flag.
2. Provide helper APIs:
   - `getOpenVulnerabilities({ severityMin, team, limit })` returning prioritized list.
   - `getVulnerabilityTimeline(findingId)` showing status history and impacted entities.
   - `getVulnerableDependencies(entityId)` to drive dependency upgrades.
3. Integrate with admin/security routes to display aggregated counts and trending metrics.

## 9. Temporal & Auditing
1. Use `openEdge`/`closeEdge` semantics to reflect vulnerability lifecycle: edge is active while status is `open`/`investigating`; closing sets `validTo` when resolved or accepted.
2. Store `statusHistory` and optionally project events into dedicated timeline nodes for analytics.
3. Provide audit reports enumerating vulnerabilities resolved in time windows, reopens, and accepted exceptions.

## 10. Migration & Backfill Plan
1. **Schema Migration**: Add new properties and indexes; guard canonical ID change behind feature flag.
2. **Reingestion**: Re-run security scanners or ingest stored findings to populate new fields.
3. **Manual Import**: Provide tool to import accepted/waived vulnerabilities from security team spreadsheets.
4. **Cleanup**: Identify duplicates from old canonical ID scheme; merge or retire as appropriate.
5. **Validation**: Compare counts of open vulnerabilities pre/post migration; ensure severity distributions align.

## 11. Risks & Mitigations
| Risk | Mitigation |
| --- | --- |
| Scanner churn causing inconsistent finding IDs | Use deterministic hash fallback and maintain mapping table. |
| Manual overrides overwritten by automated scans | Apply precedence rules; require explicit flag to downgrade manual status. |
| Status history growth | Cap history for storage; move older events to separate timeline nodes if needed. |
| Query cost due to heavy filters | Add indexes and precomputed aggregates; monitor stats. |

## 12. Implementation Milestones
1. Build normalization helper/tests.
2. Update persistence and canonical ID; add migrations.
3. Extend query APIs and update security routes.
4. Reingest security data and validate dashboards.
5. Roll out temporal tracking and compliance reporting.

## 13. Open Questions
- How do we handle environment-specific findings (prod vs. staging)? Separate edges or metadata flag?
- Should we differentiate dependency vulnerabilities vs. code issues via additional relationship types or metadata fields?
- Do we need SLA tracking integrated (due dates per severity) and where should that live?
- How to integrate with external vulnerability management systems (bi-directional sync or read-only import)?

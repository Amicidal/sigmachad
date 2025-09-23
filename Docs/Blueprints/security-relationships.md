### Security Relationships (Stubbed for Efficiency)

## Overview
Security is handled via metadata on core entities (e.g., vulnerabilities array on File/Symbol) appended from external scans (Snyk, ESLint-security). No dedicated KG nodes/edges to avoid bloat—query metadata for quick checks, fix criticals via gates. Offload full reports to Postgres/Redis for audits.

## Recommendation
- Ingest: During sync, run scans and merge into `entity.metadata.vulnerabilities`.
- Query: `WHERE entity.metadata.vulnerabilities.severity = 'critical'`.
- Future: If multi-agent audits need traversals, add lightweight edges; else, keep external.

(No detailed schema/queries—aligns with velocity focus.)

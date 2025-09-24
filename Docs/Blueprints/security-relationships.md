# Security Relationships Blueprint

## 1. Overview
Security is handled via metadata on core entities (e.g., vulnerabilities array on File/Symbol) appended from external scans (Snyk, ESLint-security). No dedicated KG nodes/edges to avoid bloat—query metadata for quick checks, fix criticals via gates. Offload full reports to Postgres/Redis for audits.

## 2. Implementation Approach
- Ingest: During sync, run scans and merge into `entity.metadata.vulnerabilities`.
- Query: `WHERE entity.metadata.vulnerabilities.severity = 'critical'`.
- Future: If multi-agent audits need traversals, add lightweight edges; else, keep external.

## 3. Current Status
This blueprint is intentionally lightweight to align with velocity focus. No detailed schema or queries are needed at this time.

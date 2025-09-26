# Security Metadata Integration Blueprint

## 1. Overview
Security handling is lightweight and metadata-only: Append vulnerability results from external scans (e.g., Snyk for dependencies, ESLint-security for code) directly to core KG entities (File/Symbol/Cluster) during sync or validation gates. No dedicated nodes or edges to avoid bloat—enables fast prop-based queries (e.g., `WHERE metadata.vulnerabilities.severity = 'critical'`) and traversals (e.g., impacts on a spec's cluster). Critical/high-severity vulns (CVSS >7) trigger immediate refactors via MCP tools (`validate.run` or agent tasks). Full reports offload to external storage (Postgres/S3) for audits, referenced by ID. This integrates seamlessly with KG core (relationships/clusters/benchmarks), supporting multi-agent workflows (e.g., Agent 20 fixes, updates `fixed=true`).

Focus: Velocity for quick fixes (no schema overhead), scale for 100+ agents (parallel scans, idempotent merges), and lean queries (<50ms at 1M nodes).

## 2. Architectural Diagram
```
External Tools (Snyk/ESLint CI/CLI) → Sync Trigger (FileWatcher/SynchronizationCoordinator)
     │                                     │
     ▼                                     ▼
Postgres/S3 (Full Reports: JSON/Artifacts)  Lightweight Scan (JSON Parse/Merge)
     │                                     │
     └───── Ref ID ────────────────────────┼───→ KG Update (Cypher: SET metadata.vulnerabilities)
                                               │
                                               ▼
                                         Validation Gates (MCP 'validate.run')
                                               │
                                               └─ Critical? → Refactor Emit (Agent Task)
```

- Flow: Scans run async during file changes/gates; merge/dedupe vulns; update KG props; emit for multi-agent if critical.

## 3. Schema and Data Model (KG Metadata on CodebaseEntity)
No new node types; leverage existing entities for props (e.g., File, Symbol, SemanticCluster). Append during sync; cap/prune for efficiency.

```
CodebaseEntity.metadata: {
  vulnerabilities: Array<{  // Cap at 20; prune fixed/low >30 days via sync job
    id: string (unique: 'CVE-2023-1234' or 'eslint-high-severity-abc'),  // Dedupe key
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info' (from tool, normalized),
    tool: string (e.g., 'snyk-dep', 'eslint-security', 'semgrep'),
    description: string (max 500 chars, sanitized),
    affectedLines: number[] (e.g., [42, 45-50] for code vulns; null for deps),
    fixed: boolean (default false; set on refactor detect via hash change),
    remediation: string (max 200 chars, e.g., 'Update lodash to ^4.17.21'),
    externalRef: string (Postgres/S3 ID for full report: e.g., 'pg-report-uuid' or 's3://bucket/vuln-abc.json'),
    scannedAt: ISODate (timestamp from scan),
    confidence: number (0-1, tool score; e.g., 0.95 for high-confidence SAST),
    agentHandled?: string (optional: 'agent20-fixed' for multi-agent tracking)
  }>
}
```

- **Integration with Core KG**: Aggregate on clusters (from members via `MEMBER_OF_CLUSTER`); influence specs (`IMPACTS` checks debt) and benchmarks (flag regressions if vuln-affected). Multi-agent: `agentHandled` tracks fixes (e.g., Agent 20 claims via pub-sub).

## 4. Implementation Flow and Code Stubs
- **Ingestion Flow**:
  1. Trigger: File change (`FileWatcher`) or gate (`validate.run`).
  2. Scan: Async CLI (e.g., `snyk test --json`, `eslint --plugin security --format json`).
  3. Merge: Dedupe by `id`, add new/unfixed, cap array, offload full JSON to Postgres/S3.
  4. Update KG: Cypher SET on entity; emit MCP event for criticals (agent refactor task).
  5. Multi-Agent: Parallel scans; idempotent (e.g., if Agent 20 fixed, skip re-emit).

- **TS Stub** (`@memento/core/SecurityEnhancer.ts`, called from `SynchronizationCoordinator.updateEntity`):
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
import { generateUUID, hash } from 'utils/crypto';  // Assume helpers
import { normalizeSeverity } from 'utils/security';

class SecurityEnhancer {
  async appendVulns(entity: CodebaseEntity): Promise<void> {
    // Step 1: Run scans (parallel for multi-agent scale)
    const [depScan, codeScan] = await Promise.all([
      execAsync(`snyk test --json ${entity.path || 'package.json'}`),  // Deps
      execAsync(`eslint ${entity.path} --plugin security --format json`)  // Code
    ]);

    const newVulns = [...JSON.parse(depScan.stdout), ...JSON.parse(codeScan.stdout)]
      .map(v => ({
        id: v.id || `generated-${hash(v.description)}`,
        severity: normalizeSeverity(v.severity),  // e.g., 'high' → 'high'
        tool: v.tool || 'snyk',
        description: v.description.slice(0, 500),
        affectedLines: v.lineNumber ? [v.lineNumber] : null,
        fixed: false,
        remediation: v.remediation?.slice(0, 200) || 'Review and update',
        externalRef: await this.offloadReport(entity.id, [depScan.stdout, codeScan.stdout]),  // To Postgres/S3
        scannedAt: new Date().toISOString(),
        confidence: v.confidence || 0.8,
        agentHandled: null  // Multi-agent: Set on fix
      }))
      .filter(v => !this.isDuplicate(entity.metadata.vulnerabilities || [], v.id));  // Dedupe

    // Step 2: Offload full reports
    const reportId = await postgres.insert('security_reports', {
      entityId: entity.id,
      reports: JSON.stringify({ dep: depScan.stdout, code: codeScan.stdout }),
      scannedAt: new Date()
    });

    // Step 3: Update KG (cap/prune)
    const cypher = `
      MATCH (e:CodebaseEntity {id: $id})
      SET e.metadata.vulnerabilities = [
        vuln IN $newVulns | vuln
      ] + [
        v IN (e.metadata.vulnerabilities OR []) 
        WHERE not v.fixed AND v.severity != 'low' AND not $newIds CONTAINS v.id
      ]
      WITH e, e.metadata.vulnerabilities as updated
      SET e.metadata.vulnerabilities = updated[0..19]  // Cap 20
      REMOVE [i IN range(0, size(e.metadata.vulnerabilities)-1) | 
              CASE WHEN e.metadata.vulnerabilities[i].scannedAt < datetime() - duration('P30D') 
                   THEN e.metadata.vulnerabilities[i] ELSE null END]  // Prune old fixed/low
    `;
    await graphDb.query(cypher, { 
      id: entity.id, 
      newVulns, 
      newIds: newVulns.map(v => v.id),
      externalRef: reportId  // For new vulns
    });

    // Step 4: Gate/Refactor Trigger (Multi-Agent)
    const criticals = newVulns.filter(v => ['critical', 'high'].includes(v.severity));
    if (criticals.length > 0) {
      // Emit MCP event for agent refactor (priority task)
      mcp.emit('security_vuln', { entityId: entity.id, vulns: criticals, agentHandled: null });
      // Multi-agent: Pub-sub to available agents (e.g., Redis channel 'vulns-available')
    }
  }

  private isDuplicate(existing: any[], id: string): boolean {
    return existing.some(v => v.id === id && !v.fixed);
  }

  private async offloadReport(entityId: string, reports: string[]): Promise<string> {
    const id = generateUUID();
    // To S3 (or Postgres blob)
    await s3.putObject({ Bucket: 'memento-reports', Key: `vuln-${id}.json`, Body: JSON.stringify({ entityId, reports }) });
    return id;
  }
}
```
- Scale: Promise.all for parallel (100+ agents); <1s/entity. Dedupe prevents flood. Velocity: Gates block only criticals (~1% cases).

## 5. Query Integration with KG Core
- **Vuln Impact on Cluster/Spec/Benchmark**: Prop filters + traversals; aggregate metadata from members.
  ```
  // Cypher for Debt in Cluster (Prop Filter, <50ms at 1M nodes)
  MATCH (cluster:SemanticCluster {id: $clusterId}) -[:IMPLEMENTS_CLUSTER]-> (spec:Spec)
  OPTIONAL MATCH (cluster)<-[:MEMBER_OF_CLUSTER]-(entity:CodebaseEntity)
  WITH cluster, spec, collect(entity.metadata.vulnerabilities) as vulns
  UNWIND vulns as v
  WHERE v.severity IN ['critical', 'high'] AND not v.fixed
  RETURN cluster.name, spec.title, collect(DISTINCT v) as criticalVulns,
         size(criticalVulns) as debtCount,
         avg(v.confidence) as avgConfidence
  // Bridge: For each v.externalRef, fetch Postgres/S3 for remediation details
  ```
  - Integration: Use in `IMPACTS` traversals (e.g., "Vulns blocking this spec's impl?"); flag benchmarks if vuln-affected (e.g., "Perf regression + security debt").
- **Multi-Agent**: Queries filter `agentHandled` prop (e.g., "Who fixed this?"); pub-sub emits on refactor (e.g., set `fixed=true`, notify swarm).
- **Benchmark Tie-In**: If vuln on `PERFORMS_FOR` entity, query: `MATCH (bench:Benchmark) -[:PERFORMS_FOR]-> (entity) WHERE entity.metadata.vulnerabilities.severity = 'high' RETURN bench.trend` → "Regressions with debt?"

## 6. Scalability and Multi-Agent Notes
- **Scale**: Async scans (1k/day from 20 agents = <1s overhead); sharded Postgres/S3 for reports (TB+). Queries prop-only (<100ms); no edge traversals.
- **Multi-Agent**: Parallel scans per agent; idempotent merges (e.g., Agent 20 fixes, others see `fixed=true`). Pub-sub (Redis) for vuln emits ("New critical in cluster—claim?").
- **Ops**: Sync job prunes (weekly, <1% entities affected); monitor `vuln_count` in `SynchronizationMonitoring`.

## 7. Migration & Benefits
- **Migration**: Re-scan entities (script: `pnpm security:backfill --dry-run`), append metadata; drop legacy if any.
- **Benefits**: Lean (no schema bloat); fast queries (prop filters); velocity (gates trigger agents, <1% blocks). Aligns with no-prod: Fix criticals ASAP, ignore low via prune. Multi-agent: Collaborative fixes (e.g., swarm on debt in spec).

(No dedicated blueprint needed beyond this—integrates via services.)




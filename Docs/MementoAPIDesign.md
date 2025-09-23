# Memento API Design

## Overview

The Memento API provides comprehensive access to the knowledge graph system, enabling AI agents and developers to interact with codebase analysis, documentation, testing, and security capabilities. The API is exposed through multiple interfaces:

- **MCP Server** (Claude Code compatible)
- **HTTP REST API** (OpenAI function-calling compatible)
- **WebSocket API** (Real-time updates)
- **MCP API** (Model Context Protocol for AI assistants)

## Core Concepts

### Response Types
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    requestId: string;
    timestamp: Date;
    executionTime: number;
  };
}

interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}
```

### Common Parameters
```typescript
interface BaseQueryParams {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeMetadata?: boolean;
}

interface TimeRangeParams {
  since?: Date;
  until?: Date;
  timeRange?: '1h' | '24h' | '7d' | '30d' | '90d';
}
```

---

## 1. Design & Specification Management

### 1.1 Create Specification
**Endpoint:** `POST /api/design/create-spec`
**MCP Tool:** `design.create_spec`

Creates and validates a feature specification with acceptance criteria.

```typescript
interface CreateSpecRequest {
  title: string;
  description: string;
  goals: string[];
  acceptanceCriteria: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  tags?: string[];
  dependencies?: string[]; // Spec IDs this depends on
}

interface CreateSpecResponse {
  specId: string;
  spec: Spec;
  validationResults: {
    isValid: boolean;
    issues: ValidationIssue[];
    suggestions: string[];
  };
}

async function createSpec(params: CreateSpecRequest): Promise<CreateSpecResponse>
```

**Example:**
```typescript
const result = await createSpec({
  title: "User Authentication System",
  description: "Implement secure user login and registration",
  acceptanceCriteria: [
    "Users can register with email/password",
    "Users can login with valid credentials",
    "Invalid login attempts are rejected",
    "Passwords are securely hashed"
  ]
});
```

### 1.2 Get Specification
**Endpoint:** `GET /api/design/specs/{specId}`
**MCP Tool:** `design.get_spec`

Retrieves a specification with full details.

```typescript
interface GetSpecResponse {
  spec: Spec;
  relatedSpecs: Spec[];
  affectedEntities: CodebaseEntity[];
  testCoverage: TestCoverage;
  status: 'draft' | 'approved' | 'implemented' | 'deprecated';
}

async function getSpec(specId: string): Promise<GetSpecResponse>
```

### 1.3 Update Specification
**Endpoint:** `PUT /api/design/specs/{specId}`
**MCP Tool:** `design.update_spec`

Updates an existing specification.

```typescript
interface UpdateSpecRequest {
  title?: string;
  description?: string;
  acceptanceCriteria?: string[];
  status?: 'draft' | 'approved' | 'implemented' | 'deprecated';
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

async function updateSpec(specId: string, updates: UpdateSpecRequest): Promise<Spec>
```

### 1.4 List Specifications
**Endpoint:** `GET /api/design/specs`
**MCP Tool:** `design.list_specs`

Lists specifications with filtering options.

```typescript
interface ListSpecsParams extends BaseQueryParams {
  status?: string[];
  priority?: string[];
  assignee?: string;
  tags?: string[];
  search?: string;
}

async function listSpecs(params?: ListSpecsParams): Promise<PaginatedResponse<Spec>>
```

---

## 2. Test Management

### 2.1 Plan and Generate Tests
**Endpoint:** `POST /api/tests/plan-and-generate`
**MCP Tool:** `tests.plan_and_generate`

Generates test plans and implementations for a specification.

- Leverages knowledge graph relationships (`REQUIRES`, `IMPLEMENTS_SPEC`, `VALIDATES`) to map acceptance criteria to concrete code targets and existing tests.
- Generates `TestSpec` entries per criterion and test type, including assertions, target symbols, and data requirements.
- Estimates coverage uplift based on existing coverage history plus projected impact from newly generated tests.
- Returns a `changedFiles` list derived from impacted code and test artefacts so tooling can stage updates automatically.

```typescript
interface TestPlanRequest {
  specId: string;
  testTypes?: ('unit' | 'integration' | 'e2e')[];
  coverage?: {
    minLines?: number;
    minBranches?: number;
    minFunctions?: number;
  };
  includePerformanceTests?: boolean;
  includeSecurityTests?: boolean;
}

interface TestPlanResponse {
  testPlan: {
    unitTests: TestSpec[];
    integrationTests: TestSpec[];
    e2eTests: TestSpec[];
    performanceTests: TestSpec[];
  };
  estimatedCoverage: CoverageMetrics;
  changedFiles: string[];
}

async function planAndGenerateTests(params: TestPlanRequest): Promise<TestPlanResponse>
```

**Sample Response**

```json
{
  "testPlan": {
    "unitTests": [
      {
        "name": "[AC-1] Unit chargeCustomer happy path",
        "description": "Validate acceptance criterion AC-1 for Checkout Workflow.",
        "type": "unit",
        "targetFunction": "chargeCustomer",
        "assertions": [
          "Implements acceptance criterion AC-1: Order succeeds with valid payment",
          "Covers chargeCustomer core behaviour and edge conditions",
          "Establishes regression harness for new functionality"
        ],
        "dataRequirements": [
          "Include dataset covering valid payment tokens.",
          "Provide negative cases capturing rejection paths."
        ]
      }
    ],
    "integrationTests": [
      {
        "name": "[AC-1] Integration chargeCustomer ↔ ledger",
        "description": "Exercise system collaboration for Checkout Workflow. Cover integration between chargeCustomer, ledger writer, payments API.",
        "type": "integration",
        "targetFunction": "chargeCustomer & ledger",
        "assertions": [
          "Coordinates chargeCustomer, ledger writer, payments API end-to-end",
          "Verifies cross-cutting requirements for AC-1: Order succeeds with valid payment",
          "Document integration contract assumptions and fixtures"
        ],
        "dataRequirements": [
          "Provision upstream and downstream fixtures mirroring production.",
          "Include dataset covering declined card responses."
        ]
      },
      {
        "name": "Checkout Workflow security posture",
        "description": "Validate authentication, authorization, and data handling rules tied to Checkout Workflow.",
        "type": "integration",
        "targetFunction": "Checkout Workflow",
        "assertions": [
          "Rejects requests lacking required claims or tokens",
          "Enforces least privilege access for privileged operations",
          "Scrubs sensitive fields from logs and downstream payloads"
        ],
        "dataRequirements": [
          "Generate signed and tampered tokens",
          "Include role combinations from spec metadata",
          "Verify encryption-in-transit and at-rest paths"
        ]
      }
    ],
    "e2eTests": [
      {
        "name": "Checkout Workflow happy path flow",
        "description": "Exercise the primary workflow covering 2 acceptance criteria for Checkout Workflow.",
        "type": "e2e",
        "targetFunction": "Checkout Workflow",
        "assertions": [
          "Satisfies AC-1: Order succeeds with valid payment",
          "Satisfies AC-2: Order fails with declined card"
        ],
        "dataRequirements": [
          "Mirror production-like happy path data and environment.",
          "Enumerate rollback or recovery steps for failed stages."
        ]
      }
    ],
    "performanceTests": [
      {
        "name": "Checkout Workflow performance guardrail",
        "description": "Protect high priority specification against latency regressions by validating hot paths under load.",
        "type": "performance",
        "targetFunction": "chargeCustomer",
        "assertions": [
          "Throughput remains within baseline for chargeCustomer",
          "P95 latency does not regress beyond 10% of current benchmark",
          "Resource utilization stays below allocated service limits"
        ],
        "dataRequirements": [
          "Replay representative production workload",
          "Include peak load burst scenarios",
          "Capture CPU, memory, and downstream dependency timings"
        ]
      }
    ]
  },
  "estimatedCoverage": {
    "lines": 78,
    "branches": 70,
    "functions": 74,
    "statements": 77
  },
  "changedFiles": [
    "src/services/payments.ts",
    "tests/integration/checkout.test.ts"
  ]
}
```

### 2.2 Record Test Execution
**Endpoint:** `POST /api/tests/record-execution`
**MCP Tool:** `tests.record_execution`

Records test execution results and updates performance metrics.

```typescript
interface TestExecutionResult {
  testId: string;
  testSuite: string;
  testName: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  duration: number; // milliseconds
  errorMessage?: string;
  stackTrace?: string;
  coverage?: {
    lines: number;
    branches: number;
    functions: number;
    statements: number;
  };
  performance?: {
    memoryUsage?: number;
    cpuUsage?: number;
    networkRequests?: number;
  };
}

async function recordTestExecution(results: TestExecutionResult[]): Promise<void>
```

### 2.3 Get Performance Metrics
**Endpoint:** `GET /api/tests/performance/{entityId}`
**MCP Tool:** `tests.get_performance`

Retrieves aggregate performance metrics for a specific entity and the persisted snapshot history that backs the calculation.

**Query Parameters**
- `metricId` (optional) — narrow history to a particular metric key (e.g. `test/foo-latency/p95`).
- `environment` (optional) — sanitized automatically (`Production` → `prod`, etc.).
- `severity` (optional) — `critical | high | medium | low`.
- `limit` (optional) — max history rows per entity (default `100`).
- `days` (optional) — only include snapshots detected within the last N days.

```typescript
interface PerformanceMetrics {
  averageExecutionTime: number;
  p95ExecutionTime: number;
  successRate: number;
  trend: 'improving' | 'stable' | 'degrading';
  benchmarkComparisons: {
    benchmark: string;
    value: number;
    status: 'above' | 'below' | 'at';
    threshold: number;
  }[];
  historicalData: {
    timestamp: Date;
    executionTime: number;
    successRate: number;
    coveragePercentage: number;
  }[];
}

interface PerformanceSnapshot {
  metricId: string;
  scenario?: string;
  environment?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  trend?: 'regression' | 'improvement' | 'neutral';
  unit?: string;
  baselineValue?: number | null;
  currentValue?: number | null;
  delta?: number | null;
  percentChange?: number | null;
  sampleSize?: number | null;
  riskScore?: number | null;
  runId?: string;
  detectedAt?: Date | null;
  resolvedAt?: Date | null;
  metricsHistory?: {
    value: number;
    timestamp?: Date;
    runId?: string;
    environment?: string;
    unit?: string;
  }[];
  metadata?: Record<string, any> | null;
  source: 'snapshot' | 'legacy';
}

async function getPerformanceMetrics(
  entityId: string,
  opts?: {
    metricId?: string;
    environment?: string;
    severity?: 'critical' | 'high' | 'medium' | 'low';
    limit?: number;
    days?: number;
  }
): Promise<{ data: PerformanceMetrics; history: PerformanceSnapshot[] }>
```

**Response Example**

```json
{
  "success": true,
  "data": {
    "averageExecutionTime": 245.5,
    "p95ExecutionTime": 320,
    "successRate": 0.92,
    "trend": "improving",
    "benchmarkComparisons": [
      { "benchmark": "team-baseline", "value": 280, "status": "below", "threshold": 300 }
    ],
    "historicalData": [
      { "timestamp": "2024-08-01T00:00:00.000Z", "executionTime": 260, "successRate": 0.88, "coveragePercentage": 82 },
      { "timestamp": "2024-08-05T00:00:00.000Z", "executionTime": 240, "successRate": 0.94, "coveragePercentage": 85 }
    ]
  },
  "history": [
    {
      "metricId": "test/auth-login/latency/p95",
      "environment": "test",
      "severity": "medium",
      "trend": "regression",
      "unit": "ms",
      "baselineValue": 180,
      "currentValue": 215,
      "delta": 35,
      "percentChange": 19.44,
      "sampleSize": 12,
      "riskScore": 1.07,
      "runId": "run-123",
      "detectedAt": "2024-08-05T00:00:00.000Z",
      "metricsHistory": [
        { "value": 180, "timestamp": "2024-07-25T00:00:00.000Z", "environment": "test", "unit": "ms" },
        { "value": 215, "timestamp": "2024-08-05T00:00:00.000Z", "environment": "test", "unit": "ms" }
      ],
      "metadata": {
        "reason": "Latency threshold breached in latest run",
        "testId": "auth-login",
        "framework": "vitest"
      },
      "source": "snapshot"
    }
  ]
}
```

### 2.4 Get Test Coverage
**Endpoint:** `GET /api/tests/coverage/{entityId}`
**MCP Tool:** `tests.get_coverage`

Retrieves test coverage information for an entity.

```typescript
interface TestCoverage {
  entityId: string;
  overallCoverage: CoverageMetrics;
  testBreakdown: {
    unitTests: CoverageMetrics;
    integrationTests: CoverageMetrics;
    e2eTests: CoverageMetrics;
  };
  uncoveredLines: number[];
  uncoveredBranches: number[];
  testCases: {
    testId: string;
    testName: string;
    covers: string[]; // Lines/branches covered
  }[];
}

async function getTestCoverage(entityId: string): Promise<TestCoverage>
```

---

## 3. Graph Operations

### 3.1 Graph Search
**Endpoint:** `POST /api/graph/search`
**MCP Tool:** `graph.search`

Performs semantic and structural searches over the knowledge graph.

```typescript
interface GraphSearchRequest {
  query: string;
  entityTypes?: ('function' | 'class' | 'interface' | 'file' | 'module')[];
  searchType?: 'semantic' | 'structural' | 'usage' | 'dependency';
  filters?: {
    language?: string;
    path?: string;
    tags?: string[];
    lastModified?: TimeRangeParams;
  };
  includeRelated?: boolean;
  limit?: number;
}

interface GraphSearchResult {
  entities: CodebaseEntity[];
  relationships: GraphRelationship[];
  clusters: SemanticCluster[];
  relevanceScore: number;
}

async function graphSearch(params: GraphSearchRequest): Promise<GraphSearchResult>
```

### 3.2 Get Graph Examples
**Endpoint:** `GET /api/graph/examples/{entityId}`
**MCP Tool:** `graph.examples`

Retrieves canonical usage examples and tests for an entity.

```typescript
interface GraphExamples {
  entityId: string;
  signature: string;
  usageExamples: {
    context: string;
    code: string;
    file: string;
    line: number;
  }[];
  testExamples: {
    testId: string;
    testName: string;
    testCode: string;
    assertions: string[];
  }[];
  relatedPatterns: {
    pattern: string;
    frequency: number;
    confidence: number;
  }[];
}

async function getGraphExamples(entityId: string): Promise<GraphExamples>
```

### 3.3 Get Entity Dependencies
**Endpoint:** `GET /api/graph/dependencies/{entityId}`
**MCP Tool:** `graph.get_dependencies`

Analyzes dependency relationships for an entity.

```typescript
interface DependencyAnalysis {
  entityId: string;
  directDependencies: {
    entity: CodebaseEntity;
    relationship: string;
    strength: number;
  }[];
  indirectDependencies: {
    entity: CodebaseEntity;
    path: CodebaseEntity[];
    relationship: string;
    distance: number;
  }[];
  reverseDependencies: {
    entity: CodebaseEntity;
    relationship: string;
    impact: 'high' | 'medium' | 'low';
  }[];
  circularDependencies: {
    cycle: CodebaseEntity[];
    severity: 'critical' | 'warning' | 'info';
  }[];
}

async function getEntityDependencies(entityId: string): Promise<DependencyAnalysis>
```

### 3.4 List Module Children
**Endpoint:** `GET /api/graph/modules/children`
**MCP Tool:** `graph.list_module_children`

Returns the structural children (directories, files, and symbols) beneath a module or directory, preserving structural metadata so clients do not need to rehydrate nodes manually. Results are ordered by entity type and then name.

**Query Parameters**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `modulePath` | string | ✅ | Accepts a normalized path or entity id (`file:src/app.ts:module`). |
| `includeFiles` | boolean | ❌ | Defaults to `true`. When `false`, only non-file children are returned. |
| `includeSymbols` | boolean | ❌ | Defaults to `true`. When `false`, symbol children are omitted. |
| `language` | string &#124; string[] | ❌ | Case-insensitive match on relationship or child language. Comma separated or array input supported. |
| `symbolKind` | string &#124; string[] | ❌ | Filters symbol children by `kind` (e.g., `class`, `function`). |
| `modulePathPrefix` | string | ❌ | Restricts children whose `modulePath`/`path` starts with the prefix. |
| `limit` | number | ❌ | Page size (1-500). Defaults to 50. |

**Response**

```typescript
interface ModuleChildrenResult {
  modulePath: string;
  parentId: string;
  children: Array<{
    entity: Entity;
    relationship: GraphRelationship;
  }>;
}
```

`relationship` objects include structural metadata (`language`, `symbolKind`, `modulePath`, `importAlias`, etc.) when present so the client can render navigation context without additional lookups.

### 3.5 List Imports
**Endpoint:** `GET /api/graph/entity/{entityId}/imports`
**MCP Tool:** `graph.list_imports`

Returns the incoming/outgoing structural import edges for a file or module along with resolved targets. The response mirrors the MCP tool payload.

**Query Parameters**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `resolvedOnly` | boolean | ❌ | When `true`, filters out unresolved imports. |
| `language` | string &#124; string[] | ❌ | Case-insensitive language filter on the relationship or target entity. |
| `symbolKind` | string &#124; string[] | ❌ | Restricts results to specific target symbol kinds. |
| `importAlias` | string &#124; string[] | ❌ | Exact match on alias used in the import (`as AliasName`). |
| `importType` | string &#124; string[] | ❌ | Accepts `default`, `named`, `namespace`, `wildcard`, `side-effect`. |
| `isNamespace` | boolean | ❌ | Matches namespace (`import * as`) relationships. |
| `modulePath` | string &#124; string[] | ❌ | Exact match on the normalized module path. |
| `modulePathPrefix` | string | ❌ | Prefix filter for `modulePath`. |
| `limit` | number | ❌ | Page size (1-1000). Defaults to 200. |

**Response**

```typescript
interface ListImportsResult {
  entityId: string;
  imports: Array<{
    relationship: GraphRelationship;
    target?: Entity | null;
  }>;
}
```

Each relationship carries structural metadata (`importAlias`, `importType`, `language`, `modulePath`, `isNamespace`, timestamps, confidence) so clients can display import details without extra queries. When available, `target` is the resolved entity for the import.

### 3.6 Find Symbol Definition
**Endpoint:** `GET /api/graph/symbol/{symbolId}/definition`
**MCP Tool:** `graph.find_definition`

Resolves the defining entity for a symbol and returns the corresponding `DEFINES` relationship metadata. Useful for jumping to implementation while still surfacing graph confidence and provenance.

```typescript
interface DefinitionLookupResult {
  symbolId: string;
  relationship: GraphRelationship | null;
  source: Entity | null;
}
```

`relationship` is `null` when the symbol has not been linked to a defining entity.

---

## 4. Code Operations

### 4.1 Propose Code Changes
**Endpoint:** `POST /api/code/propose-diff`
**MCP Tool:** `code.propose_diff`

Analyzes proposed code changes and their impact.

```typescript
interface CodeChangeProposal {
  changes: {
    file: string;
    type: 'create' | 'modify' | 'delete' | 'rename';
    oldContent?: string;
    newContent?: string;
    lineStart?: number;
    lineEnd?: number;
  }[];
  description: string;
  relatedSpecId?: string;
}

interface CodeChangeAnalysis {
  affectedEntities: CodebaseEntity[];
  breakingChanges: {
    severity: 'breaking' | 'potentially-breaking' | 'safe';
    description: string;
    affectedEntities: string[];
  }[];
  impactAnalysis: {
    directImpact: CodebaseEntity[];
    indirectImpact: CodebaseEntity[];
    testImpact: Test[];
  };
  recommendations: {
    type: 'warning' | 'suggestion' | 'requirement';
    message: string;
    actions: string[];
  }[];
}

async function proposeCodeChanges(proposal: CodeChangeProposal): Promise<CodeChangeAnalysis>
```

### 4.2 Validate Code
**Endpoint:** `POST /api/code/validate`
**MCP Tool:** `validate.run`

Runs comprehensive validation on code.

```typescript
interface ValidationRequest {
  files?: string[];
  specId?: string;
  includeTypes?: ('typescript' | 'eslint' | 'security' | 'tests' | 'coverage' | 'architecture')[];
  failOnWarnings?: boolean;
}

interface ValidationResult {
  overall: {
    passed: boolean;
    score: number; // 0-100
    duration: number;
  };
  typescript: {
    errors: number;
    warnings: number;
    issues: ValidationIssue[];
  };
  eslint: {
    errors: number;
    warnings: number;
    issues: ValidationIssue[];
  };
  security: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    issues: SecurityIssue[];
  };
  tests: {
    passed: number;
    failed: number;
    skipped: number;
    coverage: CoverageMetrics;
  };
  architecture: {
    violations: number;
    issues: ValidationIssue[];
  };
}

async function validateCode(params: ValidationRequest): Promise<ValidationResult>
```

---

## 5. Impact Analysis

### 5.1 Analyze Change Impact
**Endpoint:** `POST /api/impact/analyze`
**MCP Tool:** `impact.analyze`

Performs cascading impact analysis for proposed changes.

```typescript
interface ImpactAnalysisRequest {
  changes: {
    entityId: string;
    changeType: 'modify' | 'delete' | 'rename';
    newName?: string;
    signatureChange?: boolean;
  }[];
  includeIndirect?: boolean;
  maxDepth?: number;
}

interface ImpactAnalysis {
  directImpact: {
    entities: CodebaseEntity[];
    severity: 'high' | 'medium' | 'low';
    reason: string;
  }[];
  cascadingImpact: {
    level: number;
    entities: CodebaseEntity[];
    relationship: string;
    confidence: number;
  }[];
  testImpact: {
    affectedTests: Test[];
    requiredUpdates: string[];
    coverageImpact: number;
  };
  documentationImpact: {
    staleDocs: DocumentationNode[];
    missingDocs: Array<{
      entityId: string;
      entityName: string;
      reason: string;
    }>;
    requiredUpdates: string[];
    freshnessPenalty: number;
  };
  specImpact: {
    relatedSpecs: Array<{
      specId: string;
      spec?: Pick<Spec, 'id' | 'title' | 'priority' | 'status' | 'assignee' | 'tags'>;
      priority?: 'critical' | 'high' | 'medium' | 'low';
      impactLevel?: 'critical' | 'high' | 'medium' | 'low';
      status?: Spec['status'] | 'unknown';
      ownerTeams: string[];
      acceptanceCriteriaIds: string[];
      relationships: Array<{
        type: RelationshipType;
        impactLevel?: 'critical' | 'high' | 'medium' | 'low';
        priority?: 'critical' | 'high' | 'medium' | 'low';
        acceptanceCriteriaIds?: string[];
        ownerTeam?: string;
        rationale?: string;
        confidence?: number;
        status?: Spec['status'] | 'unknown';
      }>;
    }>;
    requiredUpdates: string[];
    summary: {
      byPriority: Record<'critical' | 'high' | 'medium' | 'low', number>;
      byImpactLevel: Record<'critical' | 'high' | 'medium' | 'low', number>;
      statuses: Record<'draft' | 'approved' | 'implemented' | 'deprecated' | 'unknown', number>;
      acceptanceCriteriaReferences: number;
      pendingSpecs: number;
    };
  };
  deploymentGate: {
    blocked: boolean;
    level: 'none' | 'advisory' | 'required';
    reasons: string[];
    stats: {
      missingDocs: number;
      staleDocs: number;
      freshnessPenalty: number;
    };
  };
  recommendations: {
    priority: 'immediate' | 'planned' | 'optional';
    description: string;
    effort: 'low' | 'medium' | 'high';
    impact: 'breaking' | 'functional' | 'cosmetic';
    type?: 'warning' | 'requirement' | 'suggestion';
    actions?: string[];
  }[];
}

async function analyzeImpact(params: ImpactAnalysisRequest): Promise<ImpactAnalysis>
```

The handler normalises graph traversal depth (`maxDepth` 1–8) and aggregates secondary metrics for consumers (risk scoring, documentation gating). Documentation freshness drives the `deploymentGate` status: any missing documentation pushes the gate to `required`, while stale references escalate to `advisory`. Linked specifications influence both the risk level and recommendation feed—critical/high-priority specs trigger immediate actions, while acceptance-criteria references surface targeted follow-ups. Recommendations surface immediate remediation steps (e.g., update tests, resolve high-risk dependencies, close spec gaps) and include machine-generated context for MCP tooling.

---

## 6. Vector Database Operations (Neo4j Native)
### 6.1 Semantic Search
**Endpoint:** `POST /api/graph/semantic-search`  // Updated path for Neo4j native
**MCP Tool:** `graph.semantic_search`  // Renamed from vdb.search

Performs semantic search using Neo4j native vectors.

```typescript
interface VectorSearchRequest {
  query: string;
  entityTypes?: string[];
  similarity?: number;  // 0-1 threshold
  limit?: number;
  includeMetadata?: boolean;
  filters?: {
    language?: string;
    lastModified?: TimeRangeParams;
    tags?: string[];
  };
}

interface VectorSearchResult {
  results: {
    entity: CodebaseEntity;
    similarity: number;
    context: string;
    highlights: string[];
  }[];
  metadata: {
    totalResults: number;
    searchTime: number;
    indexSize: number;
  };
}

async function semanticSearch(params: VectorSearchRequest): Promise<VectorSearchResult>
```

**Note**: Uses Neo4j native vectors (db.index.vector.queryNodes); Qdrant on standby for advanced needs (e.g., >10M embeddings). Embeddings stored on entities (e.g., symbol vectors for semantic similarity).

---

## 7. Source Control Management

### 7.1 Create Commit/PR
**Endpoint:** `POST /api/v1/scm/commit-pr`
**MCP Tool:** `scm.commit_pr`

Creates a commit and optionally prepares a pull/merge request via the configured SCM provider. The handler stages requested files, commits with the provided metadata, pushes branches when `createPR !== false`, persists the commit in Postgres, and establishes provenance edges in the knowledge graph.

```typescript
interface CommitPRRequest {
  title: string;
  description: string;
  changes: string[];            // File paths to stage
  relatedSpecId?: string;
  testResults?: string[];       // Test entity IDs
  validationResults?: string | ValidationResult | Record<string, unknown>;
  createPR?: boolean;           // defaults to true
  branchName?: string;
  labels?: string[];
}

interface CommitPRResponse {
  commitHash: string;
  prUrl?: string;
  branch: string;
  status: "committed" | "pending" | "failed";
  provider?: string;
  retryAttempts?: number;
  escalationRequired?: boolean;
  escalationMessage?: string;
  providerError?: {
    message: string;
    code?: string;
    lastAttempt?: number;
  };
  relatedArtifacts: {
    spec: Spec | null;
    tests: Test[];
    validation: ValidationResult | Record<string, unknown> | null;
  };
}

async function createCommitPR(params: CommitPRRequest): Promise<CommitPRResponse>
```

> **Note:** The default provider is `local`, which pushes to the configured remote and returns a synthetic PR URL. Hosted providers (GitHub/GitLab) will extend this payload with real PR identifiers once implemented.

---

## 8. Documentation & Domain Analysis

### 8.1 Sync Documentation
**Endpoint:** `POST /api/docs/sync`
**MCP Tool:** `docs.sync`

Synchronizes documentation with the knowledge graph.

```typescript
interface SyncDocumentationResponse {
  processedFiles: number;
  newDomains: number;
  updatedClusters: number;
  errors: string[];
}

async function syncDocumentation(): Promise<SyncDocumentationResponse>
```

### 8.2 Get Business Domains
**Endpoint:** `GET /api/domains`
**MCP Tool:** `domains.get_business_domains`

Retrieves all business domains.

```typescript
interface BusinessDomain {
  id: string;
  name: string;
  description: string;
  criticality: 'core' | 'supporting' | 'utility';
  stakeholders: string[];
  keyProcesses: string[];
}

async function getBusinessDomains(): Promise<BusinessDomain[]>
```

### 8.3 Get Entities by Domain
**Endpoint:** `GET /api/domains/{domainName}/entities`
**MCP Tool:** `domains.get_entities`

Retrieves all code entities belonging to a business domain.

```typescript
async function getEntitiesByDomain(domainName: string): Promise<CodebaseEntity[]>
```

### 8.4 Get Semantic Clusters
**Endpoint:** `GET /api/clusters`
**MCP Tool:** `clusters.get_semantic_clusters`

Retrieves all semantic clusters.

```typescript
interface SemanticCluster {
  id: string;
  name: string;
  description: string;
  businessDomainId: string;
  clusterType: 'feature' | 'module' | 'capability' | 'service';
  cohesionScore: number;
  memberEntities: string[];
}

async function getSemanticClusters(): Promise<SemanticCluster[]>
```

### 8.5 Get Business Impact
**Endpoint:** `GET /api/business/impact/{domainName}`
**MCP Tool:** `business.get_impact`

Analyzes business impact of recent changes in a domain.

```typescript
interface BusinessImpact {
  domainName: string;
  timeRange: TimeRangeParams;
  changeVelocity: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  affectedCapabilities: string[];
  mitigationStrategies: string[];
}

async function getBusinessImpact(domainName: string, since?: Date): Promise<BusinessImpact>
```

---

## 9. Security Operations (Metadata-Only)
Security is handled via metadata on core entities (e.g., metadata.vulnerabilities array appended from external scans like Snyk/ESLint during sync/gates). No dedicated endpoints for full reports—query prop aggregates on entities/clusters. Critical vulns trigger refactors via gates (e.g., validate.run).

### 9.1 Get Security Metadata
**Endpoint:** `GET /api/security/metadata/{entityId}`
**MCP Tool:** `security.get_metadata`

Retrieves aggregated security metadata for an entity (e.g., vulns on File/Symbol/Cluster).

```typescript
interface SecurityMetadataRequest {
  severity?: ('critical' | 'high' | 'medium' | 'low')[];
  fixed?: boolean;  // false for open vulns
}

interface SecurityMetadata {
  entityId: string;
  vulnerabilities: Array<{
    id: string (e.g., 'CVE-123');
    severity: string;
    tool: string (e.g., 'snyk');
    description: string;
    fixed: boolean;
    remediation: string;
    scannedAt: string;
    confidence: number;
  }>;  // From entity.metadata.vulnerabilities
  summary: {
    total: number;
    bySeverity: Record<string, number>;
    unfixedCritical: number;
  };
}

async function getSecurityMetadata(entityId: string, params?: SecurityMetadataRequest): Promise<SecurityMetadata>
```

**Example:**
```typescript
const metadata = await getSecurityMetadata('file-abc', { severity: ['critical', 'high'], fixed: false });
// Returns aggregated from entity/clusters, e.g., { vulnerabilities: [{ id: 'CVE-123', severity: 'high', fixed: false }], summary: { total: 2, unfixedCritical: 1 } }
```

### 9.2 Scan and Append Security Metadata
**Endpoint:** `POST /api/security/scan-metadata`
**MCP Tool:** `security.scan_metadata`

Triggers lightweight scan and appends to entity metadata (integrated with validate.run; no dedicated return—use getSecurityMetadata post-scan).

```typescript
interface SecurityScanMetadataRequest {
  entityIds: string[];  // Or single ID
  scanTypes?: ('sast' | 'sca' | 'secrets')[];  // e.g., ESLint/Snyk
}

interface SecurityScanMetadataResponse {
  scannedEntities: number;
  newVulnsAppended: number;
  criticalCount: number;  // Triggers refactor if >0
}

async function scanAndAppendMetadata(params: SecurityScanMetadataRequest): Promise<SecurityScanMetadataResponse>
```

**Integration with Validation**:
- In `validate.run` (Section 4.2): Includes security metadata append (e.g., scan during validation, check `metadata.vulnerabilities` for criticals; block if unfixed high-severity).
- No full reports—offload to external (Postgres/S3) via ref in metadata (e.g., `externalRef: 'pg-report-uuid'`).

---

## 10. Administration & Monitoring

### 10.1 Get System Health
**Endpoint:** `GET /api/health`
**MCP Tool:** `admin.get_health`

Retrieves system health status.

```typescript
interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    graphDatabase: ComponentHealth;
    vectorDatabase: ComponentHealth;
    fileWatcher: ComponentHealth;
    apiServer: ComponentHealth;
  };
  metrics: {
    uptime: number;
    totalEntities: number;
    totalRelationships: number;
    syncLatency: number;
    errorRate: number;
  };
}

async function getSystemHealth(): Promise<SystemHealth>
```

### 10.2 Get Sync Status
**Endpoint:** `GET /api/admin/sync-status`
**MCP Tool:** `admin.get_sync_status`

Retrieves synchronization status and queue information.

```typescript
interface SyncStatus {
  isActive: boolean;
  lastSync: Date;
  queueDepth: number;
  processingRate: number;
  errors: {
    count: number;
    recent: string[];
  };
  performance: {
    syncLatency: number;
    throughput: number;
    successRate: number;
  };
}

async function getSyncStatus(): Promise<SyncStatus>
```

### 10.3 Trigger Full Sync
**Endpoint:** `POST /api/admin/sync`
**MCP Tool:** `admin.trigger_sync`

Triggers a full synchronization of the knowledge graph.

```typescript
interface SyncOptions {
  force?: boolean;
  includeEmbeddings?: boolean;
  includeTests?: boolean;
  includeSecurity?: boolean;
}

async function triggerFullSync(options?: SyncOptions): Promise<{ jobId: string }>
```

### 10.4 Get Analytics
**Endpoint:** `GET /api/analytics`
**MCP Tool:** `admin.get_analytics`

Retrieves system analytics and usage metrics.

```typescript
interface SystemAnalytics {
  period: TimeRangeParams;
  usage: {
    apiCalls: number;
    uniqueUsers: number;
    popularEndpoints: Record<string, number>;
  };
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
  };
  content: {
    totalEntities: number;
    totalRelationships: number;
    growthRate: number;
    mostActiveDomains: string[];
  };
}

async function getAnalytics(params?: TimeRangeParams): Promise<SystemAnalytics>
```

---

## Error Handling

All API endpoints follow consistent error handling:

```typescript
interface APIError {
  code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'PERMISSION_DENIED' | 'INTERNAL_ERROR' | 'RATE_LIMITED';
  message: string;
  details?: any;
  requestId: string;
  timestamp: Date;
}

// Common HTTP status codes:
// 200 - Success
// 400 - Bad Request (validation errors)
// 401 - Unauthorized
// 403 - Forbidden
// 404 - Not Found
// 429 - Too Many Requests
// 500 - Internal Server Error
```

## Authentication & Authorization

```typescript
interface AuthenticatedRequest {
  headers: {
    'Authorization': `Bearer ${token}`;
    'X-API-Key'?: string;
    'X-Request-ID'?: string;
  };
}

// Role-based permissions:
// - 'read' - Basic read access
// - 'write' - Create/modify operations
// - 'admin' - Administrative operations
// - 'security' - Security-related operations
```

> Current implementation: when either `JWT_SECRET` or `API_KEY_SECRET` is configured the integration layer enforces authentication on `/api/v1/admin*` routes. Admin endpoints require JWTs carrying the `admin` permission. API keys are limited to read-only scenarios and receive `INSUFFICIENT_PERMISSIONS` on admin routes.

### Token lifecycle

`POST /api/v1/auth/refresh` accepts `{ refreshToken }`
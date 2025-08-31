# Memento API Design

## Overview

The Memento API provides comprehensive access to the knowledge graph system, enabling AI agents and developers to interact with codebase analysis, documentation, testing, and security capabilities. The API is exposed through multiple interfaces:

- **MCP Server** (Claude Code compatible)
- **HTTP REST API** (OpenAI function-calling compatible)
- **WebSocket API** (Real-time updates)
- **GraphQL API** (Complex queries and subscriptions)

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

Retrieves performance metrics for a specific entity.

```typescript
interface PerformanceMetrics {
  entityId: string;
  averageExecutionTime: number;
  p95ExecutionTime: number;
  successRate: number;
  trend: 'improving' | 'stable' | 'degrading';
  benchmarkComparisons: {
    benchmark: string;
    value: number;
    status: 'above' | 'below' | 'at';
  }[];
  historicalData: {
    timestamp: Date;
    executionTime: number;
    successRate: number;
  }[];
}

async function getPerformanceMetrics(entityId: string): Promise<PerformanceMetrics>
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
    requiredUpdates: string[];
  };
  recommendations: {
    priority: 'immediate' | 'planned' | 'optional';
    description: string;
    effort: 'low' | 'medium' | 'high';
    impact: 'breaking' | 'functional' | 'cosmetic';
  }[];
}

async function analyzeImpact(params: ImpactAnalysisRequest): Promise<ImpactAnalysis>
```

---

## 6. Vector Database Operations

### 6.1 Semantic Search
**Endpoint:** `POST /api/vdb/search`
**MCP Tool:** `vdb.search`

Performs semantic search with vector similarity.

```typescript
interface VectorSearchRequest {
  query: string;
  entityTypes?: string[];
  similarity?: number; // 0-1, minimum similarity threshold
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

async function vectorSearch(params: VectorSearchRequest): Promise<VectorSearchResult>
```

---

## 7. Source Control Management

### 7.1 Create Commit/PR
**Endpoint:** `POST /api/scm/commit-pr`
**MCP Tool:** `scm.commit_pr`

Creates a commit and/or pull request with links to related artifacts.

```typescript
interface CommitPRRequest {
  title: string;
  description: string;
  changes: string[]; // File paths
  relatedSpecId?: string;
  testResults?: string[]; // Test IDs
  validationResults?: string; // Validation result ID
  createPR?: boolean;
  branchName?: string;
  labels?: string[];
}

interface CommitPRResponse {
  commitHash: string;
  prUrl?: string;
  branch: string;
  relatedArtifacts: {
    spec: Spec;
    tests: Test[];
    validation: ValidationResult;
  };
}

async function createCommitPR(params: CommitPRRequest): Promise<CommitPRResponse>
```

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

## 9. Security Operations

### 9.1 Scan for Security Issues
**Endpoint:** `POST /api/security/scan`
**MCP Tool:** `security.scan`

Scans entities for security vulnerabilities.

```typescript
interface SecurityScanRequest {
  entityIds?: string[];
  scanTypes?: ('sast' | 'sca' | 'secrets' | 'dependency')[];
  severity?: ('critical' | 'high' | 'medium' | 'low')[];
}

interface SecurityScanResult {
  issues: SecurityIssue[];
  vulnerabilities: Vulnerability[];
  summary: {
    totalIssues: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  };
}

async function scanForSecurityIssues(params?: SecurityScanRequest): Promise<SecurityScanResult>
```

### 9.2 Get Vulnerability Report
**Endpoint:** `GET /api/security/vulnerabilities`
**MCP Tool:** `security.get_vulnerability_report`

Retrieves vulnerability report for the entire codebase.

```typescript
interface VulnerabilityReport {
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  vulnerabilities: Vulnerability[];
  byPackage: Record<string, Vulnerability[]>;
  remediation: {
    immediate: string[];
    planned: string[];
    monitoring: string[];
  };
}

async function getVulnerabilityReport(): Promise<VulnerabilityReport>
```

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

## Rate Limiting

```typescript
interface RateLimit {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

// Headers returned:
// X-RateLimit-Limit
// X-RateLimit-Remaining
// X-RateLimit-Reset
// Retry-After (when limit exceeded)
```

## Webhooks & Real-time Updates

```typescript
interface WebhookConfig {
  url: string;
  events: ('sync.completed' | 'validation.failed' | 'security.alert')[];
  secret: string;
}

interface RealTimeSubscription {
  event: string;
  filter?: any;
  callback: (event: any) => void;
}

// WebSocket events:
// sync:update - Real-time sync progress
// validation:result - Validation completion
// security:alert - New security issues
// change:detected - Code changes detected
```

## Versioning

The API follows semantic versioning:

- **Major version** (v1, v2): Breaking changes
- **Minor version** (v1.1, v1.2): New features, backward compatible
- **Patch version** (v1.0.1): Bug fixes

Version is specified in:
- URL path: `/api/v1/design/create-spec`
- Header: `Accept-Version: v1`
- Query parameter: `?version=v1`

## SDKs & Client Libraries

Official client libraries available for:
- **JavaScript/TypeScript**: `npm install @memento-ai/sdk`
- **Python**: `pip install memento-ai`
- **Java**: Maven dependency
- **Go**: `go get github.com/memento-ai/go-sdk`

## Support & Documentation

- **Interactive API Documentation**: Available at `/api/docs`
- **OpenAPI Specification**: Available at `/api/openapi.json`
- **GraphQL Schema**: Available at `/api/graphql/schema`
- **Community Forums**: `https://community.memento.ai`
- **Support**: `support@memento.ai`

---

*This API design provides comprehensive access to all Memento knowledge graph capabilities, enabling seamless integration with AI agents, IDEs, CI/CD pipelines, and development workflows.*

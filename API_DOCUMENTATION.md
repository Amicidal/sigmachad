# Memento API Documentation

## Overview

Memento provides a comprehensive REST API for code analysis, knowledge graph operations, and system management. The API is organized around the following main areas:

- **Graph Operations**: Search, query, and analyze the knowledge graph
- **Code Analysis**: Validate, analyze, and refactor code
- **Administration**: Monitor system health and manage synchronization
- **Real-time Updates**: WebSocket support for live updates

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
- Development: no authentication required by default.
- Production (optional, recommended): set `ADMIN_API_TOKEN` env var to enforce a simple API key guard on `/api/v1/admin/*` and `/api/v1/history/*` endpoints.
  - Provide key via header `x-api-key: <token>` or `Authorization: Bearer <token>`.

## Rate Limiting
The API implements rate limiting with the following defaults:
- **Search endpoints**: 100 requests per minute
- **Admin endpoints**: 50 requests per minute
- **General endpoints**: 1000 requests per hour

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## Error Handling

All endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details"
  }
}
```

## Graph Operations API

### Search Entities
Search across the knowledge graph using semantic or structural queries.

```http
POST /api/v1/graph/search
```

**Request Body:**
```json
{
  "query": "user authentication",
  "entityTypes": ["function", "class"],
  "searchType": "semantic",
  "filters": {
    "language": "typescript",
    "path": "src/auth",
    "checkpointId": "chk_abc123"
  },
  "includeRelated": true,
  "limit": 20
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "entities": [...],
    "relationships": [...],
    "clusters": [],
    "relevanceScore": 0.85
  }
}
```

Notes:
- When `filters.checkpointId` is provided, semantic search applies a Qdrant `filter.must` on `checkpointId`. Structural search also restricts results to checkpoint members. If the checkpoint has no embedded vectors (e.g., `HISTORY_EMBED_VERSIONS=false`), results come from the structural filter only.

### List Entities
Retrieve entities with filtering and pagination.

```http
GET /api/v1/graph/entities?type=function&language=typescript&limit=50&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 150,
    "hasMore": true
  }
}
```

### Get Entity Examples
Retrieve usage examples and tests for a specific entity.

```http
GET /api/v1/graph/examples/{entityId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "entityId": "user-auth-123",
    "signature": "function authenticateUser(credentials)",
    "usageExamples": [...],
    "testExamples": [...],
    "relatedPatterns": [...]
  }
}
```

### Analyze Dependencies
Get dependency analysis for an entity.

```http
GET /api/v1/graph/dependencies/{entityId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "entityId": "user-auth-123",
    "directDependencies": [...],
    "indirectDependencies": [...],
    "reverseDependencies": [...],
    "circularDependencies": [...]
  }
}
```

### List Relationships
Retrieve relationships with filtering.

```http
GET /api/v1/graph/relationships?type=USES&limit=50
```

## Code Analysis API

### Validate Code
Run comprehensive code validation including TypeScript, ESLint, security, and architecture checks.

```http
POST /api/v1/code/validate
```

**Request Body:**
```json
{
  "files": ["src/auth/user.ts", "src/auth/session.ts"],
  "includeTypes": ["typescript", "eslint", "security"],
  "failOnWarnings": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": {
      "passed": true,
      "score": 92,
      "duration": 1250
    },
    "typescript": {
      "errors": 0,
      "warnings": 3,
      "issues": [...]
    },
    "eslint": {
      "errors": 0,
      "warnings": 2,
      "issues": [...]
    },
    "security": {
      "critical": 0,
      "high": 1,
      "medium": 2,
      "low": 0,
      "issues": [...]
    },
    "tests": {
      "passed": 85,
      "failed": 3,
      "skipped": 2,
      "coverage": {
        "lines": 87.5,
        "branches": 82.3,
        "functions": 91.2,
        "statements": 88.7
      }
    },
    "architecture": {
      "violations": 1,
      "issues": [...]
    }
  }
}
```

### Analyze Code
Perform various types of code analysis.

```http
POST /api/v1/code/analyze
```

**Request Body:**
```json
{
  "files": ["src/"],
  "analysisType": "complexity",
  "options": {}
}
```

**Supported Analysis Types:**
- `complexity`: Code complexity analysis
- `patterns`: Code pattern detection
- `duplicates`: Duplicate code detection
- `dependencies`: Dependency analysis

### Propose Code Changes
Analyze proposed code changes and their impact.

```http
POST /api/v1/code/propose-diff
```

**Request Body:**
```json
{
  "changes": [
    {
      "file": "src/auth/user.ts",
      "type": "modify",
      "oldContent": "...",
      "newContent": "...",
      "lineStart": 10,
      "lineEnd": 20
    }
  ],
  "description": "Add user authentication validation",
  "relatedSpecId": "auth-spec-123"
}
```

### Additional Code Utilities

List and analyze code symbols and suggestions.

```http
GET /api/v1/code/symbols
```

Response:
```json
{ "success": true, "data": [] }
```

```http
GET /api/v1/code/suggestions/{file}
```

Query Parameters:
- `lineStart` (optional)
- `lineEnd` (optional)
- `types` (optional): ["performance", "security", "maintainability", "best-practices"]

Response:
```json
{
  "success": true,
  "data": {
    "file": "src/path/to/file.ts",
    "lineRange": { "start": 1, "end": 200 },
    "suggestions": []
  }
}
```

```http
POST /api/v1/code/refactor
```

Request Body:
```json
{
  "files": ["src/a.ts", "src/b.ts"],
  "refactorType": "extract-function",
  "options": {}
}
```

Response:
```json
{
  "success": true,
  "data": { "refactorType": "extract-function", "files": ["src/a.ts"], "suggestedRefactorings": [] }
}
```

## Administration API

### System Health
Get comprehensive system health information.

```http
GET /api/v1/admin/admin-health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": "healthy",
    "components": {
      "graphDatabase": { "status": "healthy" },
      "vectorDatabase": { "status": "healthy" },
      "fileWatcher": { "status": "healthy" },
      "apiServer": { "status": "healthy" }
    },
    "metrics": {
      "uptime": 3600,
      "totalEntities": 15420,
      "totalRelationships": 45680,
      "syncLatency": 250,
      "errorRate": 0.02
    }
  }
}
```

### Synchronization Status
Get current synchronization status and metrics.

```http
GET /api/v1/admin/sync-status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isActive": true,
    "lastSync": "2024-01-15T10:30:00Z",
    "queueDepth": 5,
    "processingRate": 15.2,
    "errors": {
      "count": 2,
      "recent": ["Failed to parse file src/utils/helpers.ts"]
    },
    "performance": {
      "syncLatency": 245,
      "throughput": 15.2,
      "successRate": 0.98
    }
  }
}
```

### System Analytics
Get system usage and performance analytics.

```http
GET /api/v1/admin/analytics?since=2024-01-01T00:00:00Z&until=2024-01-15T23:59:59Z
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "since": "2024-01-01T00:00:00Z",
      "until": "2024-01-15T23:59:59Z"
    },
    "usage": {
      "apiCalls": 15420,
      "uniqueUsers": 12,
      "popularEndpoints": {
        "/api/v1/graph/search": 4520,
        "/api/v1/code/validate": 3210
      }
    },
    "performance": {
      "averageResponseTime": 245,
      "p95ResponseTime": 1200,
      "errorRate": 0.02
    },
    "content": {
      "totalEntities": 15420,
      "totalRelationships": 45680,
      "growthRate": 0.15,
      "mostActiveDomains": ["auth", "api", "utils"]
    }
  }
}
```

### Trigger Synchronization
Manually trigger a full system synchronization.

```http
POST /api/v1/admin/admin/sync
```

**Request Body:**
```json
{
  "force": false,
  "includeEmbeddings": true,
  "includeTests": true,
  "includeSecurity": true
}
```

Note: Convenience alias routes are also available within the same versioned prefix for ease-of-use in local development:
- `GET /api/v1/admin-health` (alias of `/api/v1/admin/admin-health`)
- `GET /api/v1/analytics` (alias of `/api/v1/admin/analytics`)
- `GET /api/v1/sync-status` (alias of `/api/v1/admin/sync-status`)
- `POST /api/v1/sync` (alias of `/api/v1/admin/admin/sync`)

## WebSocket API

### Real-time Updates
Connect to WebSocket for real-time file change notifications.

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

// Subscribe to file changes
ws.send(JSON.stringify({
  type: 'subscribe',
  event: 'file_change',
  filter: {
    path: 'src/',
    type: 'modify'
  }
}));

// Handle messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

## Health Check

Basic health check endpoint (no authentication required):

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "falkordb": { "status": "healthy" },
    "qdrant": { "status": "healthy" },
    "postgresql": { "status": "healthy" },
    "redis": { "status": "unknown" },
    "mcp": { "status": "healthy" }
  },
  "uptime": 3600,
  "mcp": {
    "tools": 15,
    "validation": { "isValid": true }
  }
}
```

## OpenAPI Documentation

Access the OpenAPI specification:

```http
GET /docs
```

This returns the complete OpenAPI 3.0 specification for the API.
The document is generated from tRPC routes via `trpc-openapi` and includes `info.title`, `info.version`, and tags for Graph Operations, Code Analysis, and Administration.

## Tests API

### Plan And Generate Tests
```http
POST /api/v1/tests/plan-and-generate
```

Request Body:
```json
{
  "specId": "spec_123",
  "testTypes": ["unit", "integration", "e2e"],
  "coverage": { "minLines": 80, "minBranches": 70, "minFunctions": 75 },
  "includePerformanceTests": false,
  "includeSecurityTests": false
}
```

Response:
```json
{
  "success": true,
  "data": {
    "testPlan": {
      "unitTests": [...],
      "integrationTests": [...],
      "e2eTests": [...],
      "performanceTests": [...]
    },
    "estimatedCoverage": { "lines": 85, "branches": 75, "functions": 80, "statements": 85 },
    "changedFiles": []
  }
}
```

### Record Test Execution
```http
POST /api/v1/tests/record-execution
```

Request Body (single or array):
```json
{
  "testId": "unit-1",
  "testSuite": "UserAuth",
  "testName": "should authenticate valid user",
  "status": "passed",
  "duration": 120,
  "coverage": { "lines": 90, "branches": 80, "functions": 95, "statements": 92 }
}
```

### Parse Test Results File
```http
POST /api/v1/tests/parse-results
```

Request Body:
```json
{ "filePath": "coverage/junit.xml", "format": "junit" }
```

### Get Performance Metrics
```http
GET /api/v1/tests/performance/{entityId}
```

### Get Coverage Analysis
```http
GET /api/v1/tests/coverage/{entityId}
```

### Get Flaky Test Analysis
```http
GET /api/v1/tests/flaky-analysis/{entityId}
```

## Security API

### Run Security Scan
```http
POST /api/v1/security/scan
```

Request Body (all fields optional):
```json
{
  "entityIds": ["src/auth/user.ts"],
  "scanTypes": ["sast", "sca", "secrets", "dependency"],
  "severity": ["critical", "high", "medium", "low"]
}
```

### Vulnerability Report
```http
GET /api/v1/security/vulnerabilities
```

### Security Audit
```http
POST /api/v1/security/audit
```

Request Body:
```json
{ "scope": "full", "includeDevDependencies": false, "includeTransitive": true }
```

### Generate Security Fix
```http
POST /api/v1/security/fix
```

Request Body (one of `issueId` or `vulnerabilityId` required):
```json
{ "issueId": "ISSUE-123" }
```

### Compliance Status
```http
GET /api/v1/security/compliance?framework=owasp&scope=full
```

### Setup Security Monitoring
```http
POST /api/v1/security/monitor
```

Request Body:
```json
{
  "alerts": [
    { "type": "vuln.new", "severity": "high", "threshold": 1, "channels": ["console"] }
  ],
  "schedule": "daily"
}
```

## SCM API

### Commit And/Or Create PR
```http
POST /api/v1/scm/commit-pr
```

Request Body:
```json
{
  "title": "Fix login validation",
  "description": "Add stricter checks",
  "changes": ["src/auth/user.ts"],
  "relatedSpecId": "spec_123",
  "createPR": true,
  "branchName": "feat/login-validation"
}
```

### SCM Status
```http
GET /api/v1/scm/status
```

### Branches
```http
GET /api/v1/scm/branches
```

### Create Branch
```http
POST /api/v1/scm/branch
```

Request Body:
```json
{ "name": "feature/new", "from": "main" }
```

### Recent Changes
```http
GET /api/v1/scm/changes
```

### Diff
```http
GET /api/v1/scm/diff?from=HEAD~1&to=HEAD&files=src/auth/user.ts
```

## History API

### Create Checkpoint
```http
POST /api/v1/history/checkpoints
```

Request Body:
```json
{
  "seedEntities": ["entity_1", "entity_2"],
  "reason": "manual",
  "hops": 2,
  "window": { "since": "2024-01-01T00:00:00Z", "until": "2024-01-31T23:59:59Z" }
}
```

### List Checkpoints
```http
GET /api/v1/history/checkpoints?limit=20&offset=0
```

### Export Checkpoint
```http
GET /api/v1/history/checkpoints/{id}/export?includeRelationships=true
```

### Import Checkpoint
```http
POST /api/v1/history/checkpoints/import
```

Request Body:
```json
{ "checkpoint": {"id": "chk_123", "createdAt": "..."}, "members": [], "relationships": [] }
```

### Get Checkpoint Members
```http
GET /api/v1/history/checkpoints/{id}?limit=50&offset=0
```

### Checkpoint Summary
```http
GET /api/v1/history/checkpoints/{id}/summary
```

### Time-Travel Graph Traversal
```http
POST /api/v1/graph/time-travel
```

Request Body:
```json
{ "startId": "entity_1", "since": "2024-01-01T00:00:00Z", "until": "2024-01-31T23:59:59Z", "maxDepth": 2 }
```

### Admin: History Prune
```http
POST /api/v1/admin/history/prune
```

Request Body:
```json
{ "retentionDays": 30, "dryRun": false }
```

## Graph Viewer Helpers

### Subgraph Snapshot
```http
GET /api/v1/graph/subgraph?limit=2000&type=symbol
```

Returns a snapshot suitable for visualization with fields:
```json
{ "success": true, "data": { "nodes": [...], "edges": [...] } }
```

### Neighbors
```http
GET /api/v1/graph/neighbors?id={entityId}&limit=1000
```

Errors:
- 400 INVALID_ID when `id` is missing

## Additional Admin Endpoints

### Create Backup
```http
POST /api/v1/admin/backup
```

Request Body:
```json
{ "type": "full", "includeData": true, "includeConfig": true, "compression": true, "destination": "./backups" }
```

### Restore From Backup
```http
POST /api/v1/admin/restore
```

Request Body:
```json
{ "backupId": "backup_2024_09_10", "dryRun": true }
```

### Query Logs
```http
GET /api/v1/admin/logs?level=info&since=2024-01-01T00:00:00Z&limit=100&component=api
```

## Development

### Running the API

```bash
# Start the development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Testing Endpoints

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test graph search
curl -X POST http://localhost:3000/api/v1/graph/search \
  -H "Content-Type: application/json" \
  -d '{"query": "user authentication", "limit": 10}'
```

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `GRAPH_SEARCH_FAILED` | Graph search operation failed |
| `DEPENDENCY_ANALYSIS_FAILED` | Dependency analysis failed |
| `CODE_ANALYSIS_FAILED` | Code analysis operation failed |
| `VALIDATION_FAILED` | Code validation failed |
| `SYNC_STATUS_FAILED` | Sync status retrieval failed |
| `ANALYTICS_FAILED` | Analytics generation failed |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded |

## Best Practices

1. **Use appropriate limits**: Always specify reasonable `limit` values for list endpoints
2. **Handle rate limits**: Implement exponential backoff for rate-limited requests
3. **Validate inputs**: Use the provided validation schemas when making requests
4. **Monitor health**: Check `/health` endpoint before making important requests
5. **Use WebSocket for real-time**: Subscribe to file changes for live updates

## Support

For API support and questions:
- Check the OpenAPI documentation at `/docs`
- Review the implementation plan in `MementoImplementationPlan.md`
- Create issues in the project repository
### Metrics Summary
Snapshot of graph, history, and synchronization metrics.

```http
GET /api/v1/admin/metrics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "graph": { "nodes": 12345, "relationships": 67890 },
    "history": {
      "versions": 4321,
      "checkpoints": 12,
      "checkpointMembers": { "avg": 145.3, "min": 2, "max": 1200 },
      "temporalEdges": { "open": 512, "closed": 2048 },
      "lastPrune": { "retentionDays": 30, "cutoff": "2025-09-01T00:00:00.000Z", "versions": 100, "closedEdges": 50, "checkpoints": 1, "dryRun": false }
    },
    "synchronization": {
      "operations": { "operationsTotal": 10, "operationsSuccessful": 9, "operationsFailed": 1, "averageSyncTime": 250, "throughput": 1.5 },
      "health": { "overallHealth": "healthy", "lastSyncTime": "2025-09-12T12:00:00Z", "consecutiveFailures": 0 }
    },
    "timestamp": "2025-09-12T12:34:56.789Z"
  }
}
```

### History Prune (Dry Run)
Preview pruning impact without deleting data.

```http
POST /api/v1/history/prune
{
  "retentionDays": 30,
  "dryRun": true
}
```

**Response:**
```json
{
  "success": true,
  "data": { "versionsDeleted": 100, "edgesClosed": 50, "checkpointsDeleted": 1, "retentionDays": 30, "dryRun": true }
}
```
### Index Health
Inspect graph database indexes and expected coverage for common queries.

```http
GET /api/v1/admin/index-health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "supported": true,
    "indexes": [/* database-specific rows */],
    "expected": {
      "file_path": true,
      "symbol_path": true,
      "version_entity": true,
      "checkpoint_id": true,
      "rel_validFrom": true,
      "rel_validTo": true
    },
    "notes": ["...optional information..."]
  }
}
```

### Benchmarks (Preliminary)
Run quick, non-destructive micro-benchmarks to gauge query timings.

```http
GET /api/v1/admin/benchmarks?mode=quick
```

Modes:
- `quick` (default): essential counts and lookups, basic time-travel traversal
- `full`: adds neighbor fanout checks

**Response:**
```json
{
  "success": true,
  "data": {
    "mode": "quick",
    "totals": { "nodes": 1000, "edges": 2500 },
    "timings": {
      "nodes.count": 12,
      "edges.count": 15,
      "sample.id.fetch": 2,
      "lookup.byId": 1,
      "versions.count": 3,
      "checkpoint.sample": 1,
      "checkpoint.members": 4,
      "temporal.open": 5,
      "temporal.closed": 5,
      "timetravel.depth2": 20
    },
    "samples": {
      "entityId": "file_src_index_ts",
      "checkpointId": "chk_abcd1234"
    }
  }
}
```

### Ensure Indexes
Create recommended indexes if missing (best-effort; idempotent).

```http
POST /api/v1/admin/indexes/ensure
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ensured": true,
    "health": { /* same shape as index-health */ }
  }
}
```

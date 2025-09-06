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
Currently, no authentication is required for development. In production, implement appropriate authentication mechanisms.

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
    "path": "src/auth"
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

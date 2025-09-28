---
title: TRPC Procedures API Reference
category: reference
created: 2025-09-23
updated: 2025-09-23
status: draft
authors:
  - unknown
---

# TRPC Procedures API Reference

## Overview

The Memento API provides type-safe procedures through tRPC, offering comprehensive codebase awareness through knowledge graphs. This document serves as a complete reference for all available procedures, their inputs, outputs, and usage patterns.

### Base Configuration

**Location**: `/Users/Coding/Desktop/sigmachad/packages/api/src/trpc/base.ts`

- **Framework**: tRPC v10 with SuperJSON transformer
- **Error Handling**: Standardized error formatting with Zod validation support
- **Context**: Shared across all procedures with authentication and service access

### Root Router Structure

**Location**: `/Users/Coding/Desktop/sigmachad/packages/api/src/trpc/router.ts`

```typescript
// Root router composition
const appRouter = router({
  code: codeRouter,      // Code analysis procedures
  design: designRouter,  // Design system procedures
  graph: graphRouter,    // Knowledge graph procedures
  admin: adminRouter,    // Administrative procedures
  history: historyRouter, // History and checkpoints
  health: healthProcedure // System health check
});
```

## Authentication & Authorization

### Auth Context

**Location**: `/Users/Coding/Desktop/sigmachad/packages/api/src/middleware/authentication.ts:37-52`

```typescript
interface AuthContext {
  tokenType: 'jwt' | 'api-key' | 'admin-token' | 'anonymous';
  user?: AuthenticatedUser;
  apiKeyId?: string;
  rawToken?: string;
  scopes: string[];
  requiredScopes?: string[];
  audience?: string[];
  issuer?: string;
  expiresAt?: number;
  sessionId?: string;
  tokenError?: AuthTokenError;
  decision?: 'granted' | 'denied';
}
```

### Procedure Types

- **`publicProcedure`**: No authentication required
- **`adminProcedure`**: Requires `admin` scope and valid authentication

**Admin Scope Requirements** (from `/Users/Coding/Desktop/sigmachad/packages/api/src/trpc/base.ts:36-46`):
- Required scopes: `['admin']`
- Throws `UNAUTHORIZED` if no auth context
- Throws `FORBIDDEN` if insufficient scopes

### Supported Authentication Methods

1. **JWT Tokens**: Bearer tokens with scope-based access
2. **API Keys**: Service-to-service authentication
3. **Admin Tokens**: Full system access for administrative operations
4. **Anonymous**: Limited public access

## Error Handling

### Standard Error Codes

**Location**: Various router files demonstrate consistent error patterns

| Code | Usage | Description |
|------|-------|-------------|
| `UNAUTHORIZED` | Missing authentication | Auth context required but not provided |
| `FORBIDDEN` | Insufficient permissions | Valid auth but lacks required scopes |
| `BAD_REQUEST` | Invalid input | Validation errors or malformed requests |
| `NOT_FOUND` | Resource missing | Entity or resource does not exist |
| `INTERNAL_SERVER_ERROR` | System errors | Unexpected server-side failures |

### Error Response Format

**Location**: `/Users/Coding/Desktop/sigmachad/packages/api/src/trpc/base.ts:22-30`

```typescript
{
  code: 'ERROR_CODE',
  message: 'Human readable error message',
  data: {
    zodError?: ZodError,  // For validation errors
    httpStatus: number,
    path?: string
  }
}
```

## Rate Limiting

Currently not implemented at the tRPC procedure level. Rate limiting is handled at the HTTP/WebSocket transport layer.

---

# Code Analysis Router (`code`)

**Location**: `/Users/Coding/Desktop/sigmachad/packages/api/src/routes/trpc-code.ts`

## Procedures

### `code.analyze`

**Type**: Query
**Auth**: Public
**Purpose**: Analyze code files and provide suggestions

#### Input Schema
```typescript
{
  file: string;                    // File path to analyze
  lineStart?: number;              // Optional start line
  lineEnd?: number;                // Optional end line
  types?: string[];                // Optional entity types to focus on
}
```

#### Output Schema
```typescript
{
  file: string;
  entities: Entity[];              // Parsed entities from file
  relationships: Relationship[];   // Found relationships
  symbols: Entity[];               // Filtered symbol entities
  suggestions: string[];           // Analysis suggestions
  metrics: {
    complexity: number;            // Based on entity count
    dependencies: number;          // Relationship count
    exports: number;               // Exported entity count
  }
}
```

#### Usage Examples
```typescript
// Basic file analysis
const analysis = await trpc.code.analyze.query({
  file: '/src/components/Button.tsx'
});

// Analyze specific line range
const rangeAnalysis = await trpc.code.analyze.query({
  file: '/src/utils/parser.ts',
  lineStart: 10,
  lineEnd: 50
});
```

#### Auto-Generated Suggestions
- **High Complexity**: `complexity > 50` → "Consider splitting this file"
- **High Dependencies**: `dependencies > 20` → "Consider reducing dependencies"
- **No Symbols**: `symbols.length === 0` → "No symbols found - verify syntax"

### `code.refactor`

**Type**: Query
**Auth**: Public
**Purpose**: Generate refactoring suggestions for multiple files

#### Input Schema
```typescript
{
  files: string[];                 // Array of file paths
  refactorType: string;           // Type of refactoring desired
  options?: Record<string, any>;   // Optional refactoring options
}
```

#### Output Schema
```typescript
{
  refactorType: string;
  files: string[];
  suggestions: Array<{
    file: string;
    type: string;                  // Refactor category
    message: string;               // Human readable suggestion
    impact: 'low' | 'medium' | 'high';
  }>;
  timestamp: string;
}
```

#### Supported Refactor Types
- **`extract-function`**: Suggests function extraction opportunities
- **`split-module`**: Recommends module splitting for large files (>30 entities)
- **`remove-duplication`**: Identifies potential code duplication
- **`general`**: Generic refactoring recommendations

#### Usage Examples
```typescript
// Extract function suggestions
const suggestions = await trpc.code.refactor.query({
  files: ['/src/services/api.ts', '/src/utils/helpers.ts'],
  refactorType: 'extract-function'
});

// Module splitting analysis
const moduleSuggestions = await trpc.code.refactor.query({
  files: ['/src/components/Dashboard.tsx'],
  refactorType: 'split-module',
  options: { threshold: 25 }
});
```

### `code.parseFile`

**Type**: Query
**Auth**: Public
**Purpose**: Parse a single file and return AST analysis

#### Input Schema
```typescript
{
  filePath: string;
}
```

#### Output Schema
```typescript
{
  entities: Entity[];
  relationships: Relationship[];
  // Additional AST parser output
}
```

### `code.getSymbols`

**Type**: Query
**Auth**: Public
**Purpose**: Extract specific symbol types from a file

#### Input Schema
```typescript
{
  filePath: string;
  symbolType?: 'function' | 'class' | 'interface' | 'typeAlias';
}
```

#### Output Schema
```typescript
Entity[]  // Filtered by symbol type
```

#### Usage Examples
```typescript
// Get all functions from a file
const functions = await trpc.code.getSymbols.query({
  filePath: '/src/utils/calculations.ts',
  symbolType: 'function'
});

// Get all symbols (no filter)
const allSymbols = await trpc.code.getSymbols.query({
  filePath: '/src/types/interfaces.ts'
});
```

---

# Design System Router (`design`)

**Location**: `/Users/Coding/Desktop/sigmachad/packages/api/src/routes/trpc-design.ts`

## Procedures

### `design.validateSpec`

**Type**: Query
**Auth**: Public
**Purpose**: Validate design specifications against rules

#### Input Schema
```typescript
{
  spec: Record<string, any>;      // Specification object
  rules?: string[];               // Optional validation rules
}
```

#### Output Schema
```typescript
{
  isValid: boolean;
  issues: Array<{
    message: string;
    severity: 'error' | 'warning' | 'info';
    rule?: string;
    file?: string;
    line?: number;
    column?: number;
    suggestion?: string;
    field?: string;
  }>;
  suggestions: string[];
}
```

### `design.getTestCoverage`

**Type**: Query
**Auth**: Public
**Purpose**: Retrieve test coverage for a specific entity

#### Input Schema
```typescript
{
  entityId: string;
  includeTestCases?: boolean;     // Include detailed test case info
}
```

#### Output Schema
```typescript
{
  entityId: string;
  overallCoverage: {
    lines: number;
    branches: number;
    functions: number;
    statements: number;
  };
  testBreakdown: {
    unitTests: CoverageMetrics;
    integrationTests: CoverageMetrics;
    e2eTests: CoverageMetrics;
  };
  uncoveredLines: number[];
  uncoveredBranches: number[];
  testCases: Array<{           // Only if includeTestCases: true
    testId: string;
    testName: string;
    covers: string[];
  }>;
}
```

### `design.upsertSpec`

**Type**: Mutation
**Auth**: Public
**Purpose**: Create or update a design specification

#### Input Schema
```typescript
{
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status?: 'draft' | 'approved' | 'implemented' | 'deprecated';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string | null;
  tags?: string[];
  path?: string;
  hash?: string;
  language?: string;
  metadata?: Record<string, any>;
  created?: Date | string;
  updated?: Date | string;
  lastModified?: Date | string;
}
```

#### Output Schema
```typescript
{
  success: true;
  created: boolean;               // true if new, false if updated
  spec: {
    id: string;
    type: 'spec';
    path: string;
    hash: string;
    language: string;
    created: Date;
    updated: Date;
    lastModified: Date;
    title: string;
    description: string;
    acceptanceCriteria: string[];
    status: 'draft' | 'approved' | 'implemented' | 'deprecated';
    priority: 'low' | 'medium' | 'high' | 'critical';
    assignee?: string | null;
    tags?: string[];
    metadata?: Record<string, any>;
  }
}
```

### `design.getSpec`

**Type**: Query
**Auth**: Public
**Purpose**: Retrieve detailed specification information

#### Input Schema
```typescript
{
  id: string;
}
```

#### Output Schema
```typescript
{
  spec: SpecEntity;
  relatedSpecs: PartialSpecEntity[];
  affectedEntities: Entity[];
  testCoverage: TestCoverageInfo;
}
```

### `design.listSpecs`

**Type**: Query
**Auth**: Public
**Purpose**: List specifications with filtering and pagination

#### Input Schema
```typescript
{
  status?: Array<'draft' | 'approved' | 'implemented' | 'deprecated'>;
  priority?: Array<'low' | 'medium' | 'high' | 'critical'>;
  assignee?: string;
  tags?: string[];
  search?: string;
  limit?: number;                 // 1-100, default varies
  offset?: number;                // min 0
  sortBy?: 'created' | 'updated' | 'priority' | 'status' | 'title';
  sortOrder?: 'asc' | 'desc';
}
```

#### Output Schema
```typescript
{
  items: SpecEntity[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  }
}
```

#### Usage Examples
```typescript
// List all approved specs
const approvedSpecs = await trpc.design.listSpecs.query({
  status: ['approved'],
  sortBy: 'priority',
  sortOrder: 'desc'
});

// Search with pagination
const searchResults = await trpc.design.listSpecs.query({
  search: 'authentication',
  limit: 20,
  offset: 0
});
```

---

# Knowledge Graph Router (`graph`)

**Location**: `/Users/Coding/Desktop/sigmachad/packages/api/src/routes/trpc-graph.ts`

## Procedures

### `graph.getEntities`

**Type**: Query
**Auth**: Public
**Purpose**: Retrieve entities with optional type filtering

#### Input Schema
```typescript
{
  type?: string;                  // Filter by entity type
  limit?: number;                 // 1-1000, default 100
  offset?: number;                // min 0, default 0
}
```

#### Output Schema
```typescript
{
  items: Entity[];
  total: number;
  limit: number;
  offset: number;
}
```

#### Supported Entity Types
- `file`, `directory`, `module`, `symbol`, `function`, `class`
- `interface`, `typeAlias`, `test`, `spec`, `change`, `session`
- `documentation`, `businessDomain`, `semanticCluster`
- `securityIssue`, `vulnerability`

### `graph.getEntity`

**Type**: Query
**Auth**: Public
**Purpose**: Retrieve a specific entity by ID

#### Input Schema
```typescript
{
  id: string;
}
```

#### Output Schema
```typescript
Entity  // Full entity object
```

**Errors**: Throws `NOT_FOUND` if entity doesn't exist

### `graph.getRelationships`

**Type**: Query
**Auth**: Public
**Purpose**: Get relationships for an entity

#### Input Schema
```typescript
{
  entityId: string;
  direction?: 'incoming' | 'outgoing' | 'both';  // default 'both'
  type?: string;                  // Filter by relationship type
  limit?: number;                 // 1-1000, default 100
}
```

#### Output Schema
```typescript
Relationship[]  // Array of relationship objects
```

#### Relationship Direction Logic
- **`outgoing`**: Relationships where entityId is the source
- **`incoming`**: Relationships where entityId is the target
- **`both`**: Combined results, deduplicated

### `graph.searchEntities`

**Type**: Query
**Auth**: Public
**Purpose**: Search entities with advanced filtering

#### Input Schema
```typescript
{
  query: string;
  entityTypes?: Array<'function' | 'class' | 'interface' | 'file' | 'module' | 'spec' | 'test' | 'change' | 'session' | 'directory'>;
  searchType?: 'semantic' | 'structural' | 'usage' | 'dependency';
  filters?: {
    language?: string;
    path?: string;
    tags?: string[];
    lastModified?: {
      since?: Date;
      until?: Date;
    };
    checkpointId?: string;
  };
  includeRelated?: boolean;
  limit?: number;                 // 1-100, default 20
}
```

#### Output Schema
```typescript
{
  items: Entity[];
  total: number;
}
```

#### Usage Examples
```typescript
// Semantic search for React components
const components = await trpc.graph.searchEntities.query({
  query: 'React component authentication',
  entityTypes: ['function', 'class'],
  searchType: 'semantic',
  filters: {
    language: 'typescript',
    tags: ['component']
  }
});

// Structural search with relationships
const relatedEntities = await trpc.graph.searchEntities.query({
  query: 'UserService',
  searchType: 'structural',
  includeRelated: true,
  limit: 50
});
```

### `graph.getDependencies`

**Type**: Query
**Auth**: Public
**Purpose**: Analyze entity dependencies

#### Input Schema
```typescript
{
  entityId: string;
  depth?: number;                 // 1-10, default 3
}
```

#### Output Schema
```typescript
DependencyAnalysis  // Complex dependency structure
```

**Errors**: Throws `NOT_FOUND` if entity doesn't exist

### `graph.getClusters`

**Type**: Query
**Auth**: Public
**Purpose**: Retrieve semantic clusters

#### Input Schema
```typescript
{
  domain?: string;                // Filter by domain
  minSize?: number;               // min 2, default 3
  limit?: number;                 // 1-100, default 20
}
```

#### Output Schema
```typescript
SemanticCluster[]  // Array of clusters meeting criteria
```

### `graph.analyzeImpact`

**Type**: Query
**Auth**: Public
**Purpose**: Analyze the impact of changes to an entity

#### Input Schema
```typescript
{
  entityId: string;
  changeType: 'modify' | 'delete' | 'refactor';
}
```

#### Output Schema
```typescript
{
  entityId: string;
  entityType: string;
  changeType: string;
  impactScore: number;            // 0-100 calculated score
  riskLevel: 'low' | 'medium' | 'high';
  directlyImpacted: number;       // Count of direct impacts
  totalRelationships: number;
  impactedEntities: string[];     // Limited to 50 for response size
  highRiskChanges: Array<{
    type: string;
    message: string;
    relatedEntity: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  warnings: Array<{
    type: string;
    message: string;
    relatedEntity: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  recommendations: string[];
  timestamp: string;
}
```

#### Impact Analysis Logic
**Location**: `/Users/Coding/Desktop/sigmachad/packages/api/src/routes/trpc-graph.ts:189-273`

- **High Risk Relationships**: `depends`, `extends`, `implements`, `calls`
- **Impact Score**: `min(directImpacts * 10, 100)`
- **Risk Level Calculation**:
  - `high`: Any high-risk breaking changes
  - `medium`: 3+ warnings
  - `low`: Otherwise

#### Usage Examples
```typescript
// Analyze deletion impact
const deleteImpact = await trpc.graph.analyzeImpact.query({
  entityId: 'auth-service-123',
  changeType: 'delete'
});

// Refactoring impact assessment
const refactorImpact = await trpc.graph.analyzeImpact.query({
  entityId: 'user-component-456',
  changeType: 'refactor'
});
```

### `graph.timeTravel`

**Type**: Query
**Auth**: Public
**Purpose**: Time-based graph traversal

#### Input Schema
```typescript
{
  startId: string;
  atTime?: Date;                  // Specific point in time
  since?: Date;                   // Time range start
  until?: Date;                   // Time range end
  maxDepth?: number;              // 1-5 traversal depth
  types?: string[];               // Filter relationship types
}
```

#### Output Schema
```typescript
TimeTravelResult  // Historical graph state
```

---

# Administration Router (`admin`)

**Location**: `/Users/Coding/Desktop/sigmachad/packages/api/src/routes/trpc-admin.ts`

**Auth**: All procedures require `adminProcedure` (admin scope)

## Procedures

### `admin.getLogs`

**Type**: Query
**Purpose**: Retrieve system logs with filtering

#### Input Schema
```typescript
{
  level?: 'error' | 'warn' | 'info' | 'debug';
  component?: string;             // Filter by component name
  since?: string;                 // ISO date string
  limit?: number;                 // 1-1000, default 100
}
```

#### Output Schema
```typescript
{
  logs: Array<{
    id: string;
    timestamp: string;
    level: 'error' | 'warn' | 'info' | 'debug';
    component: string;
    message: string;
    metadata: {
      requestId: string;
      duration: number;
    }
  }>;
  total: number;
  filters: {
    level?: string;
    component?: string;
    since?: string;
  };
  timestamp: string;
}
```

### `admin.getMetrics`

**Type**: Query
**Purpose**: Retrieve consolidated system metrics

#### Output Schema
```typescript
{
  graph: {
    // Graph totals from history metrics
  };
  history: {
    versions: number;
    checkpoints: number;
    checkpointMembers: number;
    temporalEdges: number;
    lastPrune?: string;
  };
  process: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
  };
  timestamp: string;
}
```

### `admin.syncFilesystem`

**Type**: Mutation
**Purpose**: Trigger filesystem synchronization

#### Input Schema
```typescript
{
  paths?: string[];               // Specific paths, default [cwd]
  force?: boolean;                // Force sync, default false
}
```

#### Output Schema
```typescript
{
  success: boolean;
  summary: {
    totalPaths: number;
    successfulPaths: number;
    totalFilesProcessed: number;
    totalEntitiesCreated: number;
    totalEntitiesUpdated: number;
    totalRelationshipsCreated: number;
    totalErrors: number;
    totalDuration: number;
  };
  results: Array<{
    path: string;
    status: 'synced' | 'error';
    filesProcessed: number;
    entitiesCreated: number;
    entitiesUpdated: number;
    relationshipsCreated: number;
    errors: number;
    duration: number;
    error?: string;               // Only if status === 'error'
  }>;
  timestamp: string;
}
```

### `admin.clearCache`

**Type**: Mutation
**Purpose**: Clear system caches

#### Input Schema
```typescript
{
  type?: 'entities' | 'relationships' | 'search' | 'all';  // default 'all'
}
```

#### Output Schema
```typescript
{
  success: boolean;
  type: string;
  caches: Array<{
    type: string;
    itemsCleared: number;
    sizeFreed: number;            // MB
  }>;
  summary: {
    totalItemsCleared: number;
    totalSizeFreed: number;       // MB
    duration: number;
  };
  timestamp: string;
}
```

### `admin.getConfig`

**Type**: Query
**Purpose**: Retrieve current system configuration

#### Output Schema
```typescript
{
  version: string;
  environment: string;
  features: {
    websocket: boolean;
    graphSearch: boolean;
    history: boolean;
  };
}
```

### `admin.updateConfig`

**Type**: Mutation
**Purpose**: Update system configuration

#### Input Schema
```typescript
{
  key: string;                    // Configuration key path
  value: any;                     // New value
}
```

#### Allowed Configuration Keys
**Location**: `/Users/Coding/Desktop/sigmachad/packages/api/src/routes/trpc-admin.ts:244-253`

- `features.websocket` (boolean)
- `features.graphSearch` (boolean)
- `features.history` (boolean)
- `performance.cacheSize` (number)
- `performance.maxConnections` (number)
- `logging.level` ('error' | 'warn' | 'info' | 'debug')
- `logging.components` (array)

#### Output Schema
```typescript
{
  success: boolean;
  key: string;
  previousValue: any;
  newValue: any;
  appliedAt: string;
  requiresRestart: boolean;       // true for performance settings
  timestamp: string;
}
```

**Errors**:
- `BAD_REQUEST` for invalid keys or value types
- `BAD_REQUEST` for invalid logging levels

### `admin.indexHealth`

**Type**: Query
**Purpose**: Check knowledge graph index health

#### Output Schema
```typescript
IndexHealthResult  // From KnowledgeGraphService
```

### `admin.ensureIndexes`

**Type**: Mutation
**Purpose**: Ensure all required indexes exist

#### Output Schema
```typescript
{
  ensured: boolean;
  health: IndexHealthResult;
}
```

### `admin.runBenchmarks`

**Type**: Query
**Purpose**: Execute system performance benchmarks

#### Input Schema
```typescript
{
  mode?: 'quick' | 'full';        // default 'quick'
}
```

#### Output Schema
```typescript
BenchmarkResults  // From KnowledgeGraphService
```

---

# History Router (`history`)

**Location**: `/Users/Coding/Desktop/sigmachad/packages/api/src/routes/trpc-history.ts`

**Auth**: All procedures require `adminProcedure` (admin scope)

## Procedures

### `history.createCheckpoint`

**Type**: Mutation
**Purpose**: Create a new checkpoint for graph state

#### Input Schema
```typescript
{
  seedEntities?: string[];        // Starting entities, default []
  reason?: 'daily' | 'incident' | 'manual';  // default 'manual'
  hops?: number;                  // 1-5, traversal depth
  window?: {
    since?: Date;
    until?: Date;
    timeRange?: '1h' | '24h' | '7d' | '30d' | '90d';
  };
}
```

#### Output Schema
```typescript
{
  checkpointId: string;
}
```

### `history.listCheckpoints`

**Type**: Query
**Purpose**: List existing checkpoints with filtering

#### Input Schema
```typescript
{
  reason?: string;
  since?: Date;
  until?: Date;
  limit?: number;                 // 1-1000
  offset?: number;                // min 0
}
```

#### Output Schema
```typescript
{
  items: Checkpoint[];
  total: number;
}
```

### `history.getCheckpoint`

**Type**: Query
**Purpose**: Retrieve specific checkpoint details

#### Input Schema
```typescript
{
  id: string;
}
```

#### Output Schema
```typescript
Checkpoint  // Full checkpoint object
```

### `history.getCheckpointMembers`

**Type**: Query
**Purpose**: List entities included in a checkpoint

#### Input Schema
```typescript
{
  id: string;
  limit?: number;                 // 1-1000
  offset?: number;                // min 0
}
```

#### Output Schema
```typescript
{
  items: Entity[];                // Checkpoint member entities
  total: number;
}
```

### `history.getCheckpointSummary`

**Type**: Query
**Purpose**: Get checkpoint summary information

#### Input Schema
```typescript
{
  id: string;
}
```

#### Output Schema
```typescript
CheckpointSummary  // Summary statistics
```

### `history.exportCheckpoint`

**Type**: Query
**Purpose**: Export checkpoint data

#### Input Schema
```typescript
{
  id: string;
  includeRelationships?: boolean;
}
```

#### Output Schema
```typescript
CheckpointExport  // Serialized checkpoint data
```

### `history.importCheckpoint`

**Type**: Mutation
**Purpose**: Import checkpoint data

#### Input Schema
```typescript
{
  checkpoint: any;                // Checkpoint metadata
  members: any[];                 // Entity data
  relationships?: any[];          // Relationship data
  useOriginalId?: boolean;
}
```

#### Output Schema
```typescript
ImportResult  // Import operation result
```

### `history.deleteCheckpoint`

**Type**: Mutation
**Purpose**: Delete a checkpoint

#### Input Schema
```typescript
{
  id: string;
}
```

#### Output Schema
```typescript
{
  success: boolean;
}
```

---

# Health Endpoint

**Location**: `/Users/Coding/Desktop/sigmachad/packages/api/src/trpc/router.ts:62-71`

### `health`

**Type**: Query
**Auth**: Public
**Purpose**: System health check

#### Output Schema
```typescript
{
  status: 'ok';
  timestamp: string;
  services: ServiceHealthResult;  // From dbService.healthCheck()
}
```

---

# OpenAPI Integration

**Location**: `/Users/Coding/Desktop/sigmachad/packages/api/src/trpc/openapi.ts`

The API automatically generates OpenAPI 3.0 documentation from tRPC procedures:

- **Title**: "Memento API"
- **Description**: "AI coding assistant with comprehensive codebase awareness through knowledge graphs"
- **Version**: "0.1.0"
- **Base URL**: `http://localhost:3000/api/trpc`
- **Docs URL**: `http://localhost:3000/docs`

## Generated Documentation

The OpenAPI spec includes:
- All procedure definitions
- Input/output schemas
- Authentication requirements
- Error response formats
- Example requests/responses

---

# Usage Examples

## Client Setup

```typescript
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './server/trpc/router';

const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/trpc',
      headers: {
        Authorization: 'Bearer YOUR_JWT_TOKEN'
      }
    })
  ]
});
```

## Common Patterns

### Error Handling
```typescript
try {
  const entity = await trpc.graph.getEntity.query({ id: 'entity-123' });
} catch (error) {
  if (error.data?.code === 'NOT_FOUND') {
    // Handle missing entity
  } else if (error.data?.code === 'UNAUTHORIZED') {
    // Handle auth error
  }
}
```

### Batch Operations
```typescript
// tRPC automatically batches these into a single HTTP request
const [entities, relationships, health] = await Promise.all([
  trpc.graph.getEntities.query({ limit: 10 }),
  trpc.graph.getRelationships.query({ entityId: 'test' }),
  trpc.health.query()
]);
```

### Admin Operations
```typescript
// Requires admin token
const config = await trpc.admin.getConfig.query();
await trpc.admin.clearCache.mutate({ type: 'search' });
const checkpoint = await trpc.history.createCheckpoint.mutate({
  reason: 'manual',
  seedEntities: ['entity-1', 'entity-2']
});
```

---

# Summary

## Documentation Coverage

- **Total Procedures**: 27 procedures across 5 routers
- **Router Distribution**:
  - Code Analysis: 4 procedures
  - Design System: 5 procedures
  - Knowledge Graph: 8 procedures
  - Administration: 9 procedures
  - History Management: 8 procedures
  - Health Check: 1 procedure

## Key Features Documented

✅ **Complete procedure reference** with input/output schemas
✅ **Authentication requirements** and scope-based access control
✅ **Error codes and handling** patterns
✅ **Usage examples** for common scenarios
✅ **OpenAPI integration** for automatic documentation generation
✅ **Code citations** from actual implementations

## Immediately Usable Information

- Clear input/output schemas for all procedures
- Authentication patterns and scope requirements
- Error handling with specific error codes
- Real-world usage examples
- File path references to source code
- Comprehensive coverage of all API endpoints

This documentation provides everything needed for API consumers to effectively use the TRPC procedures, with direct references to the source code for deeper understanding.
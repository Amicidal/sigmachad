# Knowledge Graph Design for Memento

## Overview

This document outlines the comprehensive knowledge graph schema for the Memento system, designed to provide full awareness of codebase changes and prevent context drift in AI coding agents.

## Core Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Codebase      │    │  Knowledge      │    │   Vector        │
│   Files         │────│   Graph         │────│   Index         │
│                 │    │  (FalkorDB)     │    │  (Qdrant)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Validation    │
                       │   Engine        │
                       └─────────────────┘
```

## Node Types (Entities)

### 1. CodebaseEntity
**Base node for all codebase elements**
```
{
  id: string (UUID)
  path: string (relative to project root)
  hash: string (content hash)
  language: string (typescript, javascript, etc.)
  lastModified: timestamp
  created: timestamp
  metadata: object (additional properties)
}
```

### 2. File
**Represents source files**
```
{
  ...CodebaseEntity,
  type: "file"
  extension: string
  size: number (bytes)
  lines: number
  isTest: boolean
  isConfig: boolean
  dependencies: string[] (external packages)
}
```

### 3. Directory
**Represents directory structure**
```
{
  ...CodebaseEntity,
  type: "directory"
  children: string[] (file/directory IDs)
  depth: number (from root)
}
```

### 4. Module
**Represents logical modules/packages**
```
{
  ...CodebaseEntity,
  type: "module"
  name: string
  version: string
  packageJson: object
  entryPoint: string (main file path)
}
```

### 5. Symbol
**Base for code symbols (functions, classes, etc.)**
```
{
  ...CodebaseEntity,
  type: "symbol"
  name: string
  kind: string (function, class, interface, etc.)
  signature: string (full type signature)
  docstring: string
  visibility: string (public, private, protected)
  isExported: boolean
  isDeprecated: boolean
}
```

### 6. Function
**Function definitions**
```
{
  ...Symbol,
  kind: "function"
  parameters: object[] (name, type, defaultValue, optional)
  returnType: string
  isAsync: boolean
  isGenerator: boolean
  complexity: number (cyclomatic complexity)
  calls: string[] (function IDs it calls)
}
```

### 7. Class
**Class definitions**
```
{
  ...Symbol,
  kind: "class"
  extends: string[] (class IDs)
  implements: string[] (interface IDs)
  methods: string[] (method IDs)
  properties: string[] (property IDs)
  isAbstract: boolean
}
```

### 8. Interface
**Interface definitions**
```
{
  ...Symbol,
  kind: "interface"
  extends: string[] (interface IDs)
  methods: string[] (method signatures)
  properties: string[] (property definitions)
}
```

### 9. TypeAlias
**Type alias definitions**
```
{
  ...Symbol,
  kind: "typeAlias"
  aliasedType: string
  isUnion: boolean
  isIntersection: boolean
}
```

### 10. Test
**Test entities**
```
{
  ...CodebaseEntity,
  type: "test"
  testType: string (unit, integration, e2e)
  targetSymbol: string (symbol ID being tested)
  framework: string (jest, vitest, etc.)
  coverage: object (lines, branches, functions)
}
```

### 11. Spec
**Feature specifications**
```
{
  ...CodebaseEntity,
  type: "spec"
  title: string
  description: string
  acceptanceCriteria: string[]
  status: string (draft, approved, implemented)
  priority: string (low, medium, high)
  assignee: string
  created: timestamp
  updated: timestamp
}
```

### 12. Change
**Tracks changes to codebase entities**
```
{
  id: string (UUID)
  type: "change"
  changeType: string (create, update, delete, rename, move)
  entityType: string (file, symbol, spec, etc.)
  entityId: string (ID of entity that changed)
  timestamp: timestamp
  author: string
  commitHash: string (optional)
  diff: string (change details)
  previousState: object (entity state before change)
  newState: object (entity state after change)
  sessionId: string (links to AI agent session)
  specId: string (optional, links to related spec)
}
```

### 13. Session
**Tracks AI agent interaction sessions and development activity**
```
{
  id: string (UUID)
  type: "session"
  startTime: timestamp
  endTime: timestamp
  agentType: string (claude, gpt, etc.)
  userId: string
  changes: string[] (change IDs from this session)
  specs: string[] (spec IDs created in this session)
  status: string (active, completed, failed)
  metadata: object (session context and parameters)
  
  // Event tracking for fine-grained changes
  events: Array<{
    timestamp: Date
    entityId: string
    changeType: 'modified' | 'added' | 'deleted' | 'tested' | 'built'
    elementType?: 'function' | 'class' | 'import' | 'test'
    elementName?: string
    operation?: 'added' | 'modified' | 'deleted' | 'renamed'
    testResult?: 'passed' | 'failed' | 'skipped'
    buildResult?: 'success' | 'failure'
  }>
  
  // Semantic snapshots at key moments
  snapshots: Map<string, {
    trigger: 'test_fail' | 'test_pass' | 'build_fail' | 'build_pass' | 'manual' | 'periodic'
    timestamp: Date
    workingState: boolean
    affectedEntities: Array<{
      entityId: string
      fullImplementation?: string  // Complete function/class at this moment
      context?: {
        imports: string[]
        callers: string[]
        callees: string[]
      }
    }>
  }>
  
  // Session-level state tracking
  lastKnownGoodState?: {
    timestamp: Date
    verifiedBy: 'test' | 'build' | 'manual'
  }
  currentState: 'working' | 'broken' | 'unknown'
}
```

### 14. Version
**Compact snapshot of an entity when its content changes (append-only)**
```
{
  id: string (UUID)
  type: "version"
  entityId: string           // id of the current/live entity node
  path?: string              // helpful for files/symbols
  hash: string               // content hash at this moment
  language?: string
  timestamp: timestamp       // when this snapshot was recorded
  metadata?: object          // minimal additional info (size, lines, metrics)
}
```

### 15. Checkpoint
**Materialized subgraph descriptor for fast, AI-ready retrieval**
```
{
  id: string (UUID)
  type: "checkpoint"
  checkpointId: string       // human-friendly id or derived hash
  timestamp: timestamp
  reason: 'daily' | 'incident' | 'manual'
  hops: number               // K-hop neighborhood captured
  seedEntities: string[]     // entities around which snapshot was built
  metadata?: object
}
```

## Relationship Types (Edges)

### Base Relationship Properties
All relationships include:
```
{
  created: timestamp
  lastModified: timestamp
  version: number (incrementing version for relationship changes)
  metadata: object (additional relationship-specific data)
  
  // Temporal validity interval (when history mode is enabled)
  validFrom?: timestamp      // when this edge became active
  validTo?: timestamp        // when this edge was deactivated (open interval if null)
}
```

### SessionRelationship Interface
**Specific interface for session-based temporal relationships**
```
{
  ...BaseRelationshipProperties,
  type: SESSION_MODIFIED | SESSION_IMPACTED | SESSION_CHECKPOINT | BROKE_IN | FIXED_IN | DEPENDS_ON_CHANGE
  
  // Session tracking
  sessionId: string
  timestamp: Date  // Precise timestamp of the event
  sequenceNumber: number  // Order within session
  
  // Semantic change information (for SESSION_MODIFIED)
  changeInfo?: {
    elementType: 'function' | 'class' | 'import' | 'test'
    elementName: string
    operation: 'added' | 'modified' | 'deleted' | 'renamed'
    semanticHash?: string  // Hash of the semantic unit, not full file
    affectedLines?: number  // Approximate lines changed
  }
  
  // State transition tracking (for BROKE_IN, FIXED_IN, SESSION_CHECKPOINT)
  stateTransition?: {
    from: 'working' | 'broken' | 'unknown'
    to: 'working' | 'broken' | 'unknown'
    verifiedBy: 'test' | 'build' | 'manual'
    confidence: number  // 0-1, confidence in state determination
    criticalChange?: {
      entityId: string
      beforeSnippet?: string  // Just the relevant lines before
      afterSnippet?: string   // Just the relevant lines after
    }
  }
  
  // Impact information (for SESSION_IMPACTED)
  impact?: {
    severity: 'high' | 'medium' | 'low'
    testsFailed?: string[]
    testsFixed?: string[]
    buildError?: string
    performanceImpact?: number  // Performance delta if measurable
  }
}
```

### Structural Relationships
- `BELONGS_TO`: File/Directory → Directory (hierarchy)
- `CONTAINS`: Directory → File/Directory
- `DEFINES`: File → Symbol (symbol defined in file)
- `EXPORTS`: File → Symbol (symbol exported from file)
- `IMPORTS`: File → Symbol (symbol imported by file)

### Code Relationships
- `CALLS`: Function → Function (function calls another)
- `REFERENCES`: Symbol → Symbol (symbol references another)
- `IMPLEMENTS`: Class → Interface (class implements interface)
- `EXTENDS`: Class → Class, Interface → Interface (inheritance)
- `DEPENDS_ON`: Symbol → Symbol (dependency relationship)
- `USES`: Symbol → Symbol (usage relationship)

### Test Relationships
- `TESTS`: Test → Symbol (test covers symbol)
- `VALIDATES`: Test → Spec (test validates spec criteria)

### Spec Relationships
- `REQUIRES`: Spec → Symbol (spec requires symbol implementation)
- `IMPACTS`: Spec → File/Directory (files impacted by spec)

### Temporal Relationships
- `PREVIOUS_VERSION`: Entity → Entity (links to previous version of same entity)
- `CHANGED_AT`: Entity → Timestamp (tracks when entity changed)
- `MODIFIED_BY`: Entity → Change (links entity to change that modified it)
- `CREATED_IN`: Entity → Commit/Session (links entity to creation context)
- `OF`: Version → Entity (version belongs to current/live entity)

### Change Tracking Relationships
- `INTRODUCED_IN`: Entity → Change (when entity was first introduced)
- `MODIFIED_IN`: Entity → Change (all changes that modified entity)
- `REMOVED_IN`: Entity → Change (when entity was removed/deleted)

### Session-Based Temporal Relationships
- `SESSION_MODIFIED`: Session → Entity (entity modified during session with timestamp/sequence)
- `SESSION_IMPACTED`: Session → Test/Build (test/build affected during session)
- `SESSION_CHECKPOINT`: Session → Entity (important state transition marked)
- `BROKE_IN`: Session → Test/Build (when test/build started failing)
- `FIXED_IN`: Session → Test/Build (when test/build was fixed)
- `DEPENDS_ON_CHANGE`: Entity → Entity (change dependency within session)

### Checkpoint Relationships
- `CHECKPOINT_INCLUDES`: Checkpoint → Entity/Version (members of the checkpoint subgraph)

## Graph Constraints and Indexes

### Unique Constraints
- File.path: unique file paths
- Symbol.name + Symbol.file: unique symbol names within files
- Spec.title: unique spec titles
- Module.name: unique module names

### Indexes
- File.path: for fast file lookups
- Symbol.name: for symbol name searches
- Symbol.kind: for filtering by symbol type
- Spec.status: for filtering specs by status

### Temporal Indexes
- Entity.lastModified: for recent changes queries
- Entity.created: for creation time queries
- Change.timestamp: for change history queries
- Session.startTime/endTime: for session queries
- Relationship.created: for relationship creation queries
- Relationship.lastModified: for relationship change queries
- Relationship.validFrom/validTo: for time-scoped graph traversal

### Composite Indexes
- (entityType + timestamp): for entity type change history
- (sessionId + timestamp): for session activity
- (specId + timestamp): for spec-related changes

## Vector Database Integration

### Embedding Strategy
- **Code Embeddings**: Functions, classes, interfaces
- **Documentation Embeddings**: Specs, comments, docstrings
- **Test Embeddings**: Test cases and assertions

### Metadata Mapping
```typescript
interface VectorMetadata {
  nodeId: string;           // Graph node ID
  nodeType: string;         // Entity type
  path: string;             // File path
  symbolName?: string;      // Symbol name if applicable
  symbolKind?: string;      // Symbol type if applicable
  language: string;         // Programming language
  created: timestamp;       // Creation time
  lastModified: timestamp;  // Last modification time
  version: number;          // Entity version
  changeFrequency: number;  // How often entity changes
  sessionId?: string;       // Last modifying session
  author?: string;          // Last modifying author
  tags: string[];           // Additional tags
}
```

### Temporal Search Patterns
- **Recent Code Search**: Find recently modified similar code
- **Temporal Code Similarity**: Compare code at different points in time
- **Change-aware Search**: Weight results by recency and change frequency
- **Session Context Search**: Find code modified in similar sessions

### Search Patterns
- **Semantic Code Search**: Find similar functions/classes
- **API Usage Examples**: Find usage patterns for symbols
- **Test Case Retrieval**: Find relevant tests for symbols
- **Spec Matching**: Find related specifications

## Query Patterns

### 1. Symbol Usage Analysis
```
MATCH (s:Symbol {name: $symbolName})
OPTIONAL MATCH (s)<-[:CALLS|REFERENCES|USES]-(caller:Symbol)
OPTIONAL MATCH (s)-[:CALLS|REFERENCES|USES]->(callee:Symbol)
OPTIONAL MATCH (s)<-[:TESTS]-(t:Test)
RETURN s, collect(caller) as callers, collect(callee) as callees, collect(t) as tests
```

### 2. File Dependency Graph
```
MATCH (f:File {path: $filePath})
OPTIONAL MATCH (f)-[:IMPORTS]->(s:Symbol)<-[:EXPORTS]-(ef:File)
OPTIONAL MATCH (f)-[:EXPORTS]->(es:Symbol)<-[:IMPORTS]-(if:File)
RETURN f, collect(DISTINCT ef) as importedFrom, collect(DISTINCT if) as importedBy
```

### 3. Impact Analysis
```
MATCH (s:Symbol {id: $symbolId})
MATCH (s)<-[:CALLS|REFERENCES|USES|IMPLEMENTS|EXTENDS*1..3]-(dependent:Symbol)
MATCH (dependent)-[:DEFINES]->(f:File)
RETURN DISTINCT f.path as affectedFiles, dependent.name as dependentSymbols
```

### 4. Test Coverage Analysis
```
MATCH (spec:Spec {id: $specId})
OPTIONAL MATCH (spec)<-[:VALIDATES]-(t:Test)
OPTIONAL MATCH (t)-[:TESTS]->(s:Symbol)
OPTIONAL MATCH (s)-[:DEFINES]->(f:File)
RETURN spec, collect(t) as tests, collect(DISTINCT s) as symbols, collect(DISTINCT f) as files
```

## Temporal Query Patterns

### 1. Recent Changes Query
**Find all entities modified within a time window**
```
MATCH (e:CodebaseEntity)
WHERE e.lastModified >= $startTime AND e.lastModified <= $endTime
RETURN e.path, e.type, e.lastModified, e.created
ORDER BY e.lastModified DESC
```

### 2. Entity Evolution History
**Track how a specific entity has changed over time**
```
MATCH (e {id: $entityId})
OPTIONAL MATCH (v:version)-[:OF]->(e)
OPTIONAL MATCH (e)-[:PREVIOUS_VERSION*]->(prev)
OPTIONAL MATCH (e)-[:MODIFIED_IN]->(changes:Change)
RETURN e, collect(DISTINCT v) as versions,
       collect(DISTINCT prev) as previousEntities,
       collect(changes {.*, .timestamp}) as changeHistory
ORDER BY coalesce(v.timestamp, changes.timestamp) DESC
```

### 3. Session Activity Analysis
**Find all changes made in a specific AI agent session**
```
MATCH (session:Session {id: $sessionId})
OPTIONAL MATCH (session)-[:CONTAINS]->(changes:Change)
OPTIONAL MATCH (changes)-[:AFFECTS]->(entities)
RETURN session, collect(changes) as changes,
       collect(DISTINCT entities) as affectedEntities
```

### 4. Temporal Impact Analysis
**Find entities affected by changes within a time window**
```
MATCH (change:Change)
WHERE change.timestamp >= $startTime AND change.timestamp <= $endTime
MATCH (change)-[:AFFECTS]->(affected:CodebaseEntity)
OPTIONAL MATCH (affected)-[:DEPENDS_ON|USES|CALLS*1..2]->(downstream:CodebaseEntity)
RETURN change, collect(DISTINCT affected) as directlyAffected,
       collect(DISTINCT downstream) as indirectlyAffected
```

### 9. Time-Scoped Traversal with Validity Intervals
**Traverse structure as it existed at time T**
```
MATCH (start {id: $entityId})
MATCH path = (start)-[r*1..3]-(connected)
WHERE ALL(rel IN r WHERE rel.validFrom <= $atTime AND (rel.validTo IS NULL OR rel.validTo > $atTime))
RETURN DISTINCT connected
```

### 10. Fetch a Checkpoint Neighborhood
```
MATCH (c:checkpoint {checkpointId: $checkpointId})-[:CHECKPOINT_INCLUDES]->(n)
RETURN c, collect(DISTINCT n) as members
```

### 5. Cascading Change Detection
**Detect breaking changes and their downstream impact**
```
MATCH (changed:Function {name: $functionName})
WHERE changed.lastModified >= $changeTime
// Find all direct callers
MATCH (caller:Function)-[:CALLS]->(changed)
// Find files that import and use this function
MATCH (caller)-[:DEFINES]->(file:File)
MATCH (file)-[:IMPORTS]->(changed)
// Find indirect dependents (functions that call the callers)
OPTIONAL MATCH (indirect:Function)-[:CALLS*1..3]->(caller)
// Find files containing indirect dependents
OPTIONAL MATCH (indirect)-[:DEFINES]->(indirectFile:File)
RETURN changed.name as changedFunction,
       collect(DISTINCT caller.name) as directCallers,
       collect(DISTINCT file.path) as directlyAffectedFiles,
       collect(DISTINCT indirect.name) as indirectCallers,
       collect(DISTINCT indirectFile.path) as indirectlyAffectedFiles
```

### 6. Signature Change Impact
**Analyze impact of function signature changes**
```
MATCH (func:Function {name: $functionName})
MATCH (func)-[:DEFINES]->(definingFile:File)
// Find all files that import this function
MATCH (importingFile:File)-[:IMPORTS]->(func)
// Find all usage sites within those files
MATCH (usage:Function)-[:DEFINES]->(importingFile)
WHERE usage.signature =~ ".*" + func.name + ".*"
// Check if usage matches current function signature
MATCH (func)-[:MODIFIED_IN]->(changes:Change)
WHERE changes.changeType = "signature_change"
RETURN importingFile.path as affectedFile,
       usage.name as usingFunction,
       func.signature as newSignature,
       changes.previousState.signature as oldSignature,
       changes.timestamp as changeTime
```

### 7. Breaking Change Propagation
**Find complete propagation path of breaking changes**
```
MATCH (breakingChange:Change {changeType: "breaking"})
WHERE breakingChange.timestamp >= $sinceTime
MATCH (breakingChange)-[:AFFECTS]->(primaryEntity:Symbol)
// Find cascading dependencies
MATCH path = (primaryEntity)-[:CALLS|REFERENCES|USES|IMPLEMENTS|EXTENDS*1..5]-(dependent:Symbol)
WHERE ALL(rel IN relationships(path) WHERE rel.created < breakingChange.timestamp)
MATCH (dependent)-[:DEFINES]->(affectedFile:File)
// Group by distance from breaking change
RETURN affectedFile.path,
       length(path) as distanceFromChange,
       collect(DISTINCT dependent.name) as affectedSymbols,
       breakingChange.changeType,
       breakingChange.timestamp
ORDER BY distanceFromChange, affectedFile.path
```

### 8. Change Pattern Analysis
**Analyze change patterns for a specific entity type**
```
MATCH (entity:CodebaseEntity)
WHERE entity.type = $entityType
MATCH (entity)-[:MODIFIED_IN]->(changes:Change)
RETURN entity.path, count(changes) as changeCount,
       min(changes.timestamp) as firstModified,
       max(changes.timestamp) as lastModified,
       collect(changes.changeType) as changeTypes
ORDER BY changeCount DESC
```

### 9. Relationship Evolution
**Track how relationships between entities have evolved**
```
MATCH (a:Symbol {name: $symbolA})-[r:CALLS|USES|REFERENCES]-(b:Symbol {name: $symbolB})
WHERE r.created >= $startTime
RETURN a.name, b.name, type(r) as relationshipType,
       r.created, r.lastModified, r.version
ORDER BY r.lastModified DESC
```

### 10. Codebase Age Analysis
**Analyze the age distribution of codebase entities**
```
MATCH (e:CodebaseEntity)
RETURN e.type,
       count(e) as totalCount,
       min(e.created) as oldest,
       max(e.created) as newest,
       avg(duration.between(e.created, datetime()).days) as avgAgeDays
ORDER BY avgAgeDays DESC
```

### 11. Recent Activity by Agent
**Find recent activity by specific AI agent type**
```
MATCH (session:Session {agentType: $agentType})
WHERE session.startTime >= $startTime
OPTIONAL MATCH (session)-[:CONTAINS]->(changes:Change)
OPTIONAL MATCH (changes)-[:AFFECTS]->(entities:CodebaseEntity)
RETURN session, count(changes) as changeCount,
       collect(DISTINCT entities.type) as affectedEntityTypes,
       collect(DISTINCT changes.changeType) as changeTypes
ORDER BY session.startTime DESC
```

## Session-Based Query Patterns

### 1. What Changed in the Last Hour
**Find all changes within a recent time window during active session**
```
MATCH (s:Session)
WHERE s.status = 'active' AND s.startTime > (now() - 1 hour)
MATCH (s)-[m:SESSION_MODIFIED]->(e:CodebaseEntity)
WHERE m.timestamp > (now() - 1 hour)
RETURN e.path, e.type, m.changeInfo.elementName, 
       m.changeInfo.operation, m.timestamp
ORDER BY m.sequenceNumber DESC
```

### 2. Find Last Working State
**Identify the last known good state and what broke it**
```
MATCH (s:Session)
WHERE s.lastKnownGoodState IS NOT NULL
MATCH (s)-[f:FIXED_IN|SESSION_CHECKPOINT]->(entity)
WHERE f.stateTransition.to = 'working'
WITH s, MAX(f.timestamp) as lastWorkingTime
MATCH (s)-[b:BROKE_IN]->(brokenEntity)
WHERE b.timestamp > lastWorkingTime
RETURN lastWorkingTime, brokenEntity.name, 
       b.stateTransition.criticalChange as breakingChange
```

### 3. Session State Transitions
**Track working/broken state transitions within a session**
```
MATCH (s:Session {id: $sessionId})
MATCH (s)-[r:BROKE_IN|FIXED_IN|SESSION_CHECKPOINT]->(entity)
WHERE r.stateTransition IS NOT NULL
RETURN entity.name, r.timestamp, 
       r.stateTransition.from as fromState,
       r.stateTransition.to as toState,
       r.stateTransition.verifiedBy as verification
ORDER BY r.timestamp
```

### 4. Impact Analysis Within Session
**Find cascading impacts of changes during a session**
```
MATCH (s:Session {id: $sessionId})
MATCH (s)-[m:SESSION_MODIFIED]->(changed:CodebaseEntity)
WHERE m.timestamp >= $sinceTime
MATCH (s)-[i:SESSION_IMPACTED]->(impacted:Test|Build)
WHERE i.timestamp > m.timestamp
RETURN changed.name, m.changeInfo.operation,
       impacted.name, i.impact.severity,
       i.impact.testsFailed
ORDER BY m.sequenceNumber, i.timestamp
```

### 5. Semantic Change Recovery
**Reconstruct semantic state at any point in session**
```
MATCH (s:Session {id: $sessionId})
WHERE $targetTime >= s.startTime AND $targetTime <= s.endTime
// Find the nearest snapshot before target time
WITH s, s.snapshots as snapshots
UNWIND snapshots as snapshot
WHERE snapshot.timestamp <= $targetTime
WITH s, snapshot ORDER BY snapshot.timestamp DESC LIMIT 1
// Get all changes between snapshot and target
MATCH (s)-[m:SESSION_MODIFIED]->(e:CodebaseEntity)
WHERE m.timestamp > snapshot.timestamp AND m.timestamp <= $targetTime
RETURN snapshot.affectedEntities as snapshotState,
       collect({
         entity: e.name,
         change: m.changeInfo,
         timestamp: m.timestamp
       }) as changesSinceSnapshot
```

### 6. Breaking Change Detection
**Find what specific change broke the tests**
```
MATCH (s:Session)
MATCH (s)-[broke:BROKE_IN]->(test:Test)
WHERE broke.timestamp >= $startTime
// Find the change that immediately preceded the break
MATCH (s)-[mod:SESSION_MODIFIED]->(entity:CodebaseEntity)
WHERE mod.timestamp < broke.timestamp
AND mod.sequenceNumber = (
  SELECT MAX(m2.sequenceNumber) 
  FROM (s)-[m2:SESSION_MODIFIED]->()
  WHERE m2.timestamp < broke.timestamp
)
RETURN test.name as brokenTest,
       entity.name as suspectEntity,
       mod.changeInfo as suspectChange,
       broke.impact.testsFailed as failedTests
```

### 7. Session Activity Timeline
**Get complete timeline of session activities**
```
MATCH (s:Session {id: $sessionId})
// Collect all session relationships with timestamps
MATCH (s)-[r]->(entity)
WHERE type(r) IN ['SESSION_MODIFIED', 'BROKE_IN', 'FIXED_IN', 
                  'SESSION_CHECKPOINT', 'SESSION_IMPACTED']
RETURN entity.name, type(r) as eventType, r.timestamp,
       CASE type(r)
         WHEN 'SESSION_MODIFIED' THEN r.changeInfo
         WHEN 'BROKE_IN' THEN r.impact
         WHEN 'FIXED_IN' THEN r.stateTransition
         ELSE r.metadata
       END as eventDetails
ORDER BY r.timestamp
```

### 8. Change Dependency Analysis
**Find dependencies between changes in a session**
```
MATCH (s:Session {id: $sessionId})
MATCH (e1:CodebaseEntity)-[d:DEPENDS_ON_CHANGE]->(e2:CodebaseEntity)
WHERE EXISTS((s)-[:SESSION_MODIFIED]->(e1))
AND EXISTS((s)-[:SESSION_MODIFIED]->(e2))
RETURN e1.name as dependent, e2.name as dependency,
       d.metadata.reason as dependencyReason
```

## Lifecycle Integration

### 1. Spec Creation Phase
- Create Spec node
- Link to affected files/symbols via `IMPACTS` relationships
- Generate initial vector embeddings

### 2. Test Generation Phase
- Create/update Test nodes
- Link tests to specs via `VALIDATES`
- Link tests to symbols via `TESTS`
- Update vector index with test embeddings

### 3. Implementation Phase
- Update/create Symbol nodes
- Create relationships (`CALLS`, `REFERENCES`, `IMPLEMENTS`, etc.)
- Update File nodes with new hashes
- Refresh vector embeddings

### 4. Validation Phase
- Query graph for dependency analysis
- Check architectural constraints
- Verify test coverage via graph traversals

### 5. Impact Analysis Phase
- Traverse dependency graph for cascading effects
- Identify stale imports/exports
- Propose follow-up changes

## Anti-Deception Mechanisms

### 1. Implementation Quality Checks
- Detect stub implementations via complexity metrics
- Validate against forbidden patterns
- Check for proper error handling

### 2. Architecture Compliance
- Enforce layer boundaries via graph queries
- Block banned dependency imports
- Verify proper abstraction usage

### 3. Coverage Validation
- Track test-to-code relationships
- Enforce coverage thresholds
- Detect uncovered code paths

## Synchronization Mechanisms

### File System Watcher
**Real-time synchronization with filesystem changes**
```
Event Types:
- File Created/Modified/Deleted
- Directory Created/Deleted
- Git Operations (commit, branch switch, merge)

Watcher Implementation:
- Node.js chokidar for cross-platform file watching
- Debounced events (500ms) to handle rapid changes
- Ignore patterns: node_modules/**, .git/**, *.log, build/**, dist/**
- Queue-based processing to prevent overwhelming the system
```

### Change Detection Strategy
**Incremental vs Full Synchronization**

#### Incremental Sync (Real-time)
```typescript
interface FileChange {
  path: string;
  type: 'create' | 'modify' | 'delete' | 'rename';
  oldPath?: string;
  mtime: Date;
  size: number;
  hash: string;
}

interface SyncContext {
  change: FileChange;
  affectedNodes: string[]; // Graph node IDs
  requiresFullReindex: boolean;
  priority: 'high' | 'medium' | 'low';
}
```

**Change Classification:**
- **High Priority**: Core files (.ts, .js, package.json)
- **Medium Priority**: Config files, documentation
- **Low Priority**: Generated files, logs

#### Full Sync (Scheduled/Batch)
- Weekly full re-indexing
- After major refactors or merges
- On-demand via CLI: `memento sync --full`

### Graph Update Process

#### 1. Change Ingestion
```
File Change Detected → Queue → Prioritize → Process
                                      ↓
                              Create Change Node
                                      ↓
                           Update Affected Entities
                                      ↓
                        Update Relationships
                                      ↓
                     Update Vector Embeddings
                                      ↓
                   Validate & Cache Results
```

#### 2. Entity Updates
```typescript
async function updateEntity(change: FileChange): Promise<void> {
  // 1. Parse file with ts-morph/tree-sitter
  const ast = await parseFile(change.path);

  // 2. Extract symbols and relationships
  const entities = extractEntities(ast);
  const relationships = extractRelationships(ast);

  // 3. Compare with existing graph state
  const diff = await computeGraphDiff(change.path, entities, relationships);

  // 4. Apply changes transactionally
  await applyGraphChanges(diff);

  // 5. Update vector embeddings
  await updateEmbeddings(diff.modifiedEntities);

  // 6. Trigger impact analysis
  await analyzeImpact(diff);
}
```

#### 3. Relationship Synchronization
**Bidirectional Relationship Updates:**
- **Forward**: When A changes, update A→B relationships
- **Reverse**: When A changes, update B→A relationships (imports, references)
- **Cascade**: When A changes, check if B→C relationships need updates

**Relationship Types Requiring Sync:**
- CALLS: Function call sites
- REFERENCES: Symbol references
- IMPORTS/EXPORTS: Module dependencies
- IMPLEMENTS/EXTENDS: Inheritance chains
- TESTS: Test-to-code relationships

### Vector Database Synchronization

#### Embedding Update Strategy
```typescript
interface EmbeddingUpdate {
  nodeId: string;
  content: string;
  metadata: VectorMetadata;
  operation: 'create' | 'update' | 'delete';
  priority: number;
}

Batch Processing:
- Group by priority and operation type
- Process high-priority updates immediately
- Batch low-priority updates (100 items/batch)
- Retry failed updates with exponential backoff
```

#### Content Extraction for Embeddings
- **Functions**: Full function signature + docstring + body summary
- **Classes**: Class definition + method signatures + properties
- **Interfaces**: Interface definition + method signatures
- **Files**: Import statements + key function signatures
- **Tests**: Test descriptions + assertions

### Synchronization Triggers

#### Automatic Triggers
- **File System Events**: Real-time via file watcher
- **Git Operations**: Post-commit, post-merge hooks
- **IDE Actions**: Save events, refactor operations
- **CI/CD Pipeline**: Post-deployment sync

#### Manual Triggers
```bash
# Full sync
memento sync --full

# Sync specific files
memento sync src/components/Button.tsx src/utils/helpers.ts

# Sync by pattern
memento sync --pattern "src/**/*.ts"

# Force re-index vector embeddings
memento sync --embeddings

# Dry run to see what would change
memento sync --dry-run
```

### Conflict Resolution

#### Concurrent Changes
**Optimistic Locking:**
- Each entity has version number
- Changes include expected version
- Conflicts detected and resolved via merge strategies

**Merge Strategies:**
- **Last Write Wins**: For simple metadata updates
- **Manual Resolution**: For conflicting code changes
- **Version Branching**: Create parallel versions for complex conflicts

#### Stale Data Detection
```typescript
interface StaleCheck {
  entityId: string;
  graphVersion: number;
  fileVersion: number;
  lastSync: Date;
  isStale: boolean;
}

// Check staleness every 5 minutes
setInterval(async () => {
  const staleEntities = await findStaleEntities();
  for (const entity of staleEntities) {
    await queueResync(entity);
  }
}, 5 * 60 * 1000);
```

### Performance Optimizations

#### Graph Database
- Use appropriate indexes for common query patterns
- Implement graph partitioning for large codebases
- Cache frequently accessed subgraphs
- Connection pooling for concurrent operations

#### Vector Database
- Batch embedding updates (50-100 items per batch)
- Use approximate nearest neighbor search for performance
- Implement metadata filtering for faster retrieval
- Cache frequently accessed embeddings

#### Caching Strategy
- Cache graph queries for recent changes (TTL: 10 minutes)
- Store computed impact analyses (TTL: 1 hour)
- Cache validation results (TTL: 30 minutes)
- Invalidate caches on related changes

### Monitoring and Observability

#### Synchronization Metrics
- Sync latency (file change to graph update)
- Queue depth and processing rate
- Error rates by sync type
- Vector embedding update success rate

#### Health Checks
- File watcher connectivity
- Graph database responsiveness
- Vector database synchronization status
- Queue processing health

#### Alerts
- Sync failures > 5% error rate
- Queue depth > 1000 items
- Sync latency > 30 seconds
- Vector embedding failures

### Recovery Mechanisms

#### Automatic Recovery
- Failed sync retries (3 attempts with backoff)
- Partial sync recovery (resume from last successful point)
- Database connection recovery with circuit breaker

#### Manual Recovery
```bash
# Reset sync state
memento sync --reset

# Rebuild from scratch
memento sync --rebuild

# Validate sync consistency
memento sync --validate
```

### Integration Points

#### Development Workflow Integration
- **Pre-commit hooks**: Validate sync state before commits
- **IDE plugins**: Real-time sync status in editor
- **CI/CD integration**: Sync validation in pipelines
- **Git integration**: Sync on branch switches and merges

#### External System Integration
- **Version Control**: Git hooks for sync triggers
- **CI/CD**: Pipeline steps for sync validation
- **Monitoring**: Metrics export to external systems
- **Backup**: Sync state included in backups

## Final System Architecture

### Complete Synchronization Flow
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   File System   │────│  File Watcher   │────│   Queue System  │
│   Changes       │    │   (chokidar)    │    │   (Priority)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Change Parser  │────│ Graph Database │────│Vector Database │
│ (ts-morph/tree- │    │  (FalkorDB)    │    │   (Qdrant)     │
│    sitter)      │    │                 │    │                │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Impact Analysis │────│   Validation    │────│   Caching      │
│                 │    │   Engine        │    │   Layer        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Synchronization Performance Targets
- **File Change Latency**: < 2 seconds from file save to graph update
- **Query Performance**: < 100ms for common graph queries
- **Vector Search**: < 50ms for semantic searches
- **Throughput**: 100+ file changes per minute
- **Reliability**: 99.9% sync success rate

### Disaster Recovery
- **Point-in-time Recovery**: Restore to any previous state
- **Incremental Backups**: Daily graph snapshots
- **Cross-region Replication**: Multi-zone database setup
- **Automated Failover**: Switch to backup systems automatically

## Enhanced Capabilities Integration

### Documentation-Centric Semantic Integration

#### Architecture Integration
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Code Parser   │────│   Doc Parser    │────│ Knowledge Graph │
│  (ts-morph)     │    │ (Markdown, etc) │    │   (FalkorDB)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Documentation   │────│   LLM Engine    │────│ Semantic Links  │
│   Extraction    │    │ (Optional)      │    │ & Clustering    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### Documentation Node Types

##### DocumentationNode
**Represents documentation files and their content**
```
{
  id: string (UUID)
  type: "documentation"
  filePath: string
  title: string
  content: string (full text content)
  docType: string ("readme", "api-docs", "design-doc", "architecture", "user-guide")
  lastModified: timestamp
  lastIndexed: timestamp
  businessDomains: string[] (extracted business domains)
  stakeholders: string[] (mentioned stakeholders)
  technologies: string[] (mentioned technologies/frameworks)
  status: string ("active", "deprecated", "draft")
}
```

##### BusinessDomain
**Represents business domains extracted from documentation**
```
{
  id: string (UUID)
  type: "businessDomain"
  name: string
  description: string
  parentDomain?: string (for hierarchical domains)
  criticality: string ("core", "supporting", "utility")
  stakeholders: string[] ("users", "admins", "developers", "business")
  keyProcesses: string[] (business processes this domain supports)
  extractedFrom: string[] (documentation source IDs)
}
```

##### SemanticCluster
**Groups related code entities by business functionality**
```
{
  id: string (UUID)
  type: "semanticCluster"
  name: string
  description: string
  businessDomainId: string
  clusterType: string ("feature", "module", "capability", "service")
  cohesionScore: number (0-1, how tightly related entities are)
  lastAnalyzed: timestamp
  memberEntities: string[] (IDs of entities in this cluster)
}
```

#### Documentation Relationship Types

##### DESCRIBES_DOMAIN
- **Source**: DocumentationNode → BusinessDomain
- **Properties**: confidence, extraction method, last validated

##### BELONGS_TO_DOMAIN
- **Source**: CodebaseEntity → BusinessDomain
- **Properties**: strength, inferred vs explicit, last validated

##### DOCUMENTED_BY
- **Source**: CodebaseEntity → DocumentationNode
- **Properties**: documentation quality, coverage completeness, last sync

##### CLUSTER_MEMBER
- **Source**: CodebaseEntity → SemanticCluster
- **Properties**: membership strength, role in cluster, join date

##### DOMAIN_RELATED
- **Source**: BusinessDomain → BusinessDomain
- **Properties**: relationship type, strength, business context

#### Documentation Processing Pipeline

**1. Documentation Discovery:**
```typescript
async function discoverDocumentation(rootPath: string): Promise<DocumentationNode[]> {
  const patterns = [
    'README.md', 'docs/**/*.md', 'api/**/*.md',
    'architecture/**/*.md', 'design/**/*.md'
  ];

  const docs: DocumentationNode[] = [];
  for (const pattern of patterns) {
    const files = await glob(pattern, { cwd: rootPath });
    for (const file of files) {
      const content = await readFile(file);
      const doc = await parseDocumentation(file, content);
      docs.push(doc);
    }
  }

  return docs;
}
```

**2. Domain Extraction (Optional LLM Enhancement):**
```typescript
async function extractBusinessDomains(doc: DocumentationNode): Promise<BusinessDomain[]> {
  // Primary: Extract from explicit sections and patterns
  const explicitDomains = extractExplicitDomains(doc.content);

  // Secondary: LLM-assisted extraction for complex docs
  if (needsLLM(doc)) {
    const llmDomains = await llm.extract(`
      Extract business domains from this documentation:
      ${doc.content}

      Focus on:
      1. Business capabilities described
      2. User roles and stakeholders
      3. Business processes mentioned
      4. Domain boundaries and relationships
    `);
    return [...explicitDomains, ...llmDomains];
  }

  return explicitDomains;
}
```

**3. Semantic Clustering:**
```typescript
async function createSemanticClusters(
  entities: CodebaseEntity[],
  domains: BusinessDomain[]
): Promise<SemanticCluster[]> {
  const clusters: SemanticCluster[] = [];

  // Group entities by shared imports, calls, and domains
  const entityGroups = groupBySharedRelationships(entities);

  for (const group of entityGroups) {
    const cluster = new SemanticCluster({
      name: inferClusterName(group),
      description: inferClusterDescription(group, domains),
      businessDomainId: findRelevantDomain(group, domains),
      memberEntities: group.map(e => e.id),
      cohesionScore: calculateCohesion(group)
    });
    clusters.push(cluster);
  }

  return clusters;
}
```

#### Documentation Synchronization

**1. Documentation Change Detection:**
```typescript
async function syncDocumentation() {
  const docs = await discoverDocumentation(projectRoot);

  for (const doc of docs) {
    const existing = await findDocumentationByPath(doc.filePath);

    if (!existing || existing.lastModified < doc.lastModified) {
      await updateDocumentation(doc);
      await updateDomainRelationships(doc);
      await updateSemanticClusters(doc);
    }
  }
}
```

**2. Cluster Maintenance:**
```typescript
async function maintainClusters() {
  // Remove stale clusters
  const staleClusters = await findClustersWithLowCohesion();
  for (const cluster of staleClusters) {
    await dissolveCluster(cluster);
  }

  // Merge overlapping clusters
  const overlapping = await findOverlappingClusters();
  for (const pair of overlapping) {
    await mergeClusters(pair.cluster1, pair.cluster2);
  }

  // Update cluster descriptions
  const clusters = await getAllClusters();
  for (const cluster of clusters) {
    await updateClusterDescription(cluster);
  }
}
```

#### Query Patterns for Documentation-Centric Analysis

**Find code by business domain:**
```cypher
MATCH (d:BusinessDomain {name: $domainName})
MATCH (c:CodebaseEntity)-[:BELONGS_TO_DOMAIN]->(d)
OPTIONAL MATCH (c)-[:CLUSTER_MEMBER]->(sc:SemanticCluster)
RETURN c, sc.name as clusterName, sc.description as clusterDescription
ORDER BY c.path
```

**Get documentation for a code entity:**
```cypher
MATCH (c:CodebaseEntity {id: $entityId})
MATCH (c)-[:DOCUMENTED_BY]->(doc:DocumentationNode)
MATCH (doc)-[:DESCRIBES_DOMAIN]->(d:BusinessDomain)
RETURN doc.title, doc.content, d.name as businessDomain
ORDER BY doc.lastModified DESC
```

**Find clusters by business capability:**
```cypher
MATCH (d:BusinessDomain)-[:DOMAIN_RELATED*0..2]->(related:BusinessDomain)
WHERE d.name = $capabilityName
MATCH (sc:SemanticCluster)-[:BELONGS_TO_DOMAIN]->(related)
MATCH (c:CodebaseEntity)-[:CLUSTER_MEMBER]->(sc)
RETURN sc.name, sc.description, collect(c.path) as entities
ORDER BY sc.cohesionScore DESC
```

**Business impact analysis:**
```cypher
MATCH (d:BusinessDomain {name: $domainName})
MATCH (d)<-[:BELONGS_TO_DOMAIN]-(c:CodebaseEntity)
MATCH (c)-[:MODIFIED_IN]->(changes:Change)
WHERE changes.timestamp >= $sinceTime
RETURN c.path, count(changes) as changeCount,
       collect(changes.changeType) as changeTypes
ORDER BY changeCount DESC
```

#### Benefits of Documentation-Centric Approach

**1. Staleness Prevention:**
- Documentation updates automatically propagate to code entities
- No need to maintain separate intent annotations
- Changes to docs invalidate and refresh related analyses

**2. Cluster-Level Analysis:**
- Business context lives at the appropriate granularity
- Clusters group related functionality naturally
- Easier to understand system architecture

**3. Maintainability:**
- Documentation is explicitly maintained by teams
- Clear ownership and update processes
- Easier to audit and verify accuracy

**4. Flexibility:**
- Can use simple pattern matching for most docs
- LLM enhancement only where needed
- Gradual adoption possible

#### API Integration Points

```typescript
interface DocumentationCentricAPI {
  // Documentation Management
  syncDocumentation(): Promise<void>;
  getDocumentationForEntity(entityId: string): Promise<DocumentationNode[]>;

  // Domain Analysis
  getBusinessDomains(): Promise<BusinessDomain[]>;
  getEntitiesByDomain(domainName: string): Promise<CodebaseEntity[]>;

  // Clustering
  getSemanticClusters(): Promise<SemanticCluster[]>;
  getClusterMembers(clusterId: string): Promise<CodebaseEntity[]>;

  // Business Intelligence
  getBusinessImpact(domainName: string, since: Date): Promise<BusinessImpact>;
  analyzeDomainDependencies(domainName: string): Promise<DomainDependencies>;
}
```

### Test Performance Integration

#### Test-to-Function Connection Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Test Runner   │────│  Test Parser    │────│ Knowledge Graph │
│ (Jest/Vitest)   │    │                 │    │   (FalkorDB)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Test Execution  │────│ Performance     │────│ Coverage Links  │
│   Results       │    │   Metrics       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### Enhanced Test Node Types

##### PerformanceTest
**Tracks test performance metrics**
```
{
  ...Test,
  type: "performanceTest"
  averageExecutionTime: number (ms)
  p95ExecutionTime: number (ms)
  successRate: number (0-1)
  isFlaky: boolean
  lastFailureReason: string
  performanceTrend: string ("improving", "stable", "degrading")
  benchmarkValue?: number
  benchmarkUnit?: string ("ms", "MB", "ops/sec")
}
```

##### TestCoverageLink
**Connects tests to specific functions/code paths**
```
{
  id: string (UUID)
  type: "testCoverageLink"
  testId: string
  functionId: string
  coverageType: string ("unit", "integration", "e2e")
  codePaths: string[] (specific code paths tested)
  assertions: string[] (what the test validates)
  performanceImpact: number (how much test affects performance)
  lastExecuted: timestamp
  executionCount: number
}
```

#### Performance Relationship Types

##### PERFORMANCE_IMPACT
- **Source**: Function → Test
- **Properties**: execution time impact, resource usage, scalability impact

##### COVERAGE_PROVIDES
- **Source**: Test → Function
- **Properties**: coverage percentage, test quality score, confidence level

##### PERFORMANCE_REGRESSION
- **Source**: Change → Function
- **Properties**: performance delta, regression severity, affected tests

#### Test Performance Queries

**Find performance bottlenecks:**
```cypher
MATCH (f:Function)-[:TESTED_BY]->(t:PerformanceTest)
WHERE t.averageExecutionTime > 1000
RETURN f.name, t.averageExecutionTime, t.successRate
ORDER BY t.averageExecutionTime DESC
```

**Identify flaky tests:**
```cypher
MATCH (t:PerformanceTest)
WHERE t.isFlaky = true AND t.successRate < 0.95
MATCH (t)-[:TESTS]->(f:Function)
RETURN t.name, f.name, t.successRate, t.lastFailureReason
```

**Performance regression detection:**
```cypher
MATCH (c:Change)-[:AFFECTS]->(f:Function)
MATCH (f)-[:TESTED_BY]->(t:PerformanceTest)
WHERE t.performanceTrend = "degrading"
RETURN c.changeType, f.name, t.performanceTrend, c.timestamp
```

### Security Tooling Integration

#### Security Integration Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Security Tools │────│ Security Parser │────│ Knowledge Graph │
│ (SAST, SCA, etc)│    │                 │    │   (FalkorDB)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Vulnerability   │────│ Security Issues │────│ Risk Assessment │
│   Scanner       │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### Security Node Types

##### SecurityIssue
**Security vulnerabilities and findings**
```
{
  id: string (UUID)
  type: "securityIssue"
  tool: string ("eslint-security", "semgrep", "snyk", "owasp-zap")
  ruleId: string
  severity: string ("critical", "high", "medium", "low", "info")
  title: string
  description: string
  cwe: string (Common Weakness Enumeration)
  owasp: string (OWASP category)
  affectedEntityId: string
  lineNumber: number
  codeSnippet: string
  remediation: string
  status: string ("open", "fixed", "accepted", "false-positive")
  discoveredAt: timestamp
  lastScanned: timestamp
  confidence: number (0-1)
}
```

##### Vulnerability
**Dependency vulnerabilities**
```
{
  id: string (UUID)
  type: "vulnerability"
  packageName: string
  version: string
  vulnerabilityId: string (CVE, GHSA, etc)
  severity: string
  description: string
  cvssScore: number
  affectedVersions: string
  fixedInVersion: string
  publishedAt: timestamp
  lastUpdated: timestamp
  exploitability: string ("high", "medium", "low")
}
```

#### Security Relationship Types

##### HAS_SECURITY_ISSUE
- **Source**: Entity → SecurityIssue
- **Properties**: severity, status, discovered date

##### DEPENDS_ON_VULNERABLE
- **Source**: Module → Vulnerability
- **Properties**: severity, exposure level, remediation status

##### SECURITY_IMPACTS
- **Source**: SecurityIssue → Function/File
- **Properties**: attack vector, potential impact, exploitability

#### Integrated Security Tools

**1. ESLint Security Rules:**
```javascript
// .eslintrc.js
{
  "plugins": ["security"],
  "extends": ["plugin:security/recommended"],
  "rules": {
    "security/detect-object-injection": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-no-csrf-before-method-override": "error"
  }
}
```

**2. SAST Tools (Semgrep, CodeQL):**
- Pattern-based vulnerability detection
- Custom rules for business-specific security issues
- Integration with CI/CD pipelines

**3. SCA Tools (Snyk, OWASP Dependency Check):**
- Dependency vulnerability scanning
- License compliance checking
- Outdated package detection

**4. Secret Detection:**
- API key detection
- Credential exposure prevention
- Integration with git hooks

#### Security Analysis Queries

**Critical security issues:**
```cypher
MATCH (si:SecurityIssue)
WHERE si.severity = "critical" AND si.status = "open"
MATCH (si)-[:HAS_SECURITY_ISSUE]->(entity)
RETURN si.title, entity.path, si.lineNumber, si.remediation
ORDER BY si.discoveredAt DESC
```

**Vulnerable dependencies:**
```cypher
MATCH (m:Module)-[:DEPENDS_ON_VULNERABLE]->(v:Vulnerability)
WHERE v.severity IN ["critical", "high"]
RETURN m.name, v.vulnerabilityId, v.cvssScore, v.fixedInVersion
ORDER BY v.cvssScore DESC
```

**Security debt by file:**
```cypher
MATCH (f:File)-[:HAS_SECURITY_ISSUE]->(si:SecurityIssue)
WHERE si.status = "open"
RETURN f.path,
       count(si) as issueCount,
       collect(si.severity) as severities,
       collect(si.title) as issues
ORDER BY issueCount DESC
```

### Integration Workflow

#### Combined Enhancement Pipeline
```
Code Change → Parse → LLM Analysis → Test Execution → Security Scan
      ↓            ↓            ↓            ↓            ↓
  Graph Update → Intent Store → Performance Record → Issue Creation → Risk Assessment
      ↓            ↓            ↓            ↓            ↓
  Impact Analysis → Business Context → Performance Alerts → Security Reports → Recommendations
```

#### API Integration Points
```typescript
interface EnhancedKnowledgeGraphAPI {
  // Documentation Integration
  syncDocumentation(): Promise<void>;
  getDocumentationForEntity(entityId: string): Promise<DocumentationNode[]>;

  // Domain Analysis
  getBusinessDomains(): Promise<BusinessDomain[]>;
  getEntitiesByDomain(domainName: string): Promise<CodebaseEntity[]>;

  // Test Integration
  recordTestExecution(testId: string, results: TestResults): Promise<void>;
  getPerformanceMetrics(functionId: string): Promise<PerformanceMetrics>;

  // Security Integration
  scanForSecurityIssues(entityId: string): Promise<SecurityIssue[]>;
  getVulnerabilityReport(): Promise<VulnerabilityReport>;

  // Clustering
  getSemanticClusters(): Promise<SemanticCluster[]>;
  getClusterMembers(clusterId: string): Promise<CodebaseEntity[]>;

  // Combined Analysis
  getEntityInsights(entityId: string): Promise<EntityInsights>;
}
```

#### Performance & Reliability Enhancements

**1. LLM Caching:**
- Cache LLM responses for similar code patterns
- Invalidate cache on code changes
- Fallback to rule-based analysis when LLM unavailable

**2. Test Performance Monitoring:**
- Track test execution times over time
- Alert on performance regressions
- Correlate test performance with code complexity

**3. Security Scan Scheduling:**
- Daily automated security scans
- On-demand scans for critical changes
- Incremental scans for modified files only

This enhanced knowledge graph would provide comprehensive insights into:
- **Business Context**: Why code exists and its business value
- **Performance Characteristics**: How code performs and scales
- **Security Posture**: Vulnerabilities and security issues
- **Quality Metrics**: Beyond structure to include semantic and performance quality

The system would transform from a structural code analyzer into a business-aware, performance-conscious, security-focused development intelligence platform.

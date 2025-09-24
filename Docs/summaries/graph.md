# Package: graph
Generated: 2025-09-23 07:07:22 PM EDT

## ⚠️ Quality Indicators

| Metric | Count | Status |
|--------|-------|--------|
| Total Warnings | 102 | ⚠️ |
| Critical Issues | 0 | ✅ |
| Stub Implementations | 0 | ✅ |
| Deception Risk | 0 | ✅ |
| Antipatterns | 0 | ✅ |

### Notable Issues

#### ℹ️ Informational
102 minor issues found (console.log usage, magic numbers, etc.) - not shown for brevity

#### 📖 Issue Types Explained

- **not-implemented-stub**: Function exists but just throws 'Not implemented' error
- **todo-comments**: Code marked with TODO/FIXME indicating incomplete work
- **hardcoded-credentials**: Passwords or API keys hardcoded in source
- **test-environment-bypass**: Code skips logic in tests - tests don't test real behavior!
- **always-true-validation**: Validation function that always returns true without checking
- **silent-error-handler**: Catches errors but doesn't log or handle them
- **unhandled-async-rejection**: Async function without try-catch error handling
- **sql-string-concatenation**: SQL queries built with string concat (injection risk)
- **unsafe-property-access**: Accessing nested properties without null checks
- **deceptive-security-function**: Security function that doesn't actually secure anything
- **console-log-in-production**: Using console.log instead of proper logging
- **empty-function**: Function defined but has no implementation
- **magic-numbers**: Unexplained numeric constants in code

---

## Code Summary (Comments Stripped)

This file is a merged representation of the entire codebase, combined into a single document by Repomix.
The content has been processed where comments have been removed.

================================================================
File Summary
================================================================

Purpose:
--------
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

File Format:
------------
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Multiple file entries, each consisting of:
  a. A separator line (================)
  b. The file path (File: path/to/file)
  c. Another separator line
  d. The full contents of the file
  e. A blank line

Usage Guidelines:
-----------------
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

Notes:
------
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Code comments have been removed from supported file types
- Files are sorted by Git change count (files with more changes are at the bottom)

Additional Info:
----------------

================================================================
Directory Structure
================================================================
facades/
  AnalysisManager.ts
  EntityManager.ts
  HistoryManager.ts
  index.ts
  RelationshipManager.ts
  SearchManager.ts
models/
  ogm/
    BaseModels.ts
    EntityModels.ts
    RelationshipModels.ts
  entities.ts
  index.ts
  relationships.ts
services/
  index.ts
  RelationshipNormalizer.ts
  structuralPersistence.ts
index.ts

================================================================
Files
================================================================

================
File: facades/AnalysisManager.ts
================
import {
  ImpactAnalysisRequest,
  ImpactAnalysis,
  DependencyAnalysis,
} from "@memento/core";
import { PathQuery } from "../models/relationships.js";

interface AnalysisService {
  analyzeImpact(request: ImpactAnalysisRequest): Promise<ImpactAnalysis>;
  getEntityDependencies(
    entityId: string,
    options?: any
  ): Promise<DependencyAnalysis>;
  findPaths(query: PathQuery): Promise<any>;
  computeAndStoreEdgeStats(entityId: string): Promise<void>;
}

export class AnalysisManager {
  private analysisService: AnalysisService;

  constructor(analysisService: AnalysisService) {
    this.analysisService = analysisService;
  }

  async analyzeImpact(request: ImpactAnalysisRequest): Promise<ImpactAnalysis> {
    return this.analysisService.analyzeImpact(request);
  }

  async getEntityDependencies(
    entityId: string,
    options?: any
  ): Promise<DependencyAnalysis> {
    return this.analysisService.getEntityDependencies(entityId, options);
  }

  async findPaths(query: PathQuery): Promise<any> {
    return this.analysisService.findPaths(query);
  }

  async computeAndStoreEdgeStats(entityId: string): Promise<void> {
    return this.analysisService.computeAndStoreEdgeStats(entityId);
  }
}

================
File: facades/EntityManager.ts
================
import { Entity } from "../models/entities.js";

interface EntityService {
  createEntity(entity: Entity): Promise<Entity>;
  updateEntity(id: string, updates: Partial<Entity>): Promise<Entity>;
  getEntity(id: string): Promise<Entity | null>;
  deleteEntity(id: string): Promise<void>;
  listEntities(
    options?: any
  ): Promise<{ entities?: Entity[]; items: Entity[]; total: number }>;
  createEntitiesBulk(entities: Entity[], options?: any): Promise<any>;
  getEntitiesByFile(filePath: string): Promise<Entity[]>;
  getEntitiesByType(entityType: string): Promise<Entity[]>;
}

interface EmbeddingService {
  generateAndStore(entity: Entity): Promise<any>;
  updateEmbedding(entityId: string, content?: string): Promise<void>;
  deleteEmbedding(entityId: string): Promise<void>;
  batchEmbed(entities: Entity[], options?: any): Promise<any>;
}

export class EntityManager {
  private entityService: EntityService;
  private embeddingService: EmbeddingService;

  constructor(
    entityService: EntityService,
    embeddingService: EmbeddingService
  ) {
    this.entityService = entityService;
    this.embeddingService = embeddingService;
  }

  async createEntity(
    entity: Entity,
    options?: { skipEmbedding?: boolean }
  ): Promise<Entity> {
    const created = await this.entityService.createEntity(entity);


    if (!options?.skipEmbedding) {
      this.embeddingService
        .generateAndStore(created)
        .catch((err) => console.warn("Failed to generate embedding:", err));
    }

    return created;
  }

  async updateEntity(id: string, updates: Partial<Entity>): Promise<Entity> {
    const updated = await this.entityService.updateEntity(id, updates);


    if (
      ("content" in updates && updates.content) ||
      ("name" in updates && updates.name) ||
      ("description" in updates && updates.description)
    ) {
      this.embeddingService
        .updateEmbedding(id)
        .catch((err) => console.warn("Failed to update embedding:", err));
    }

    return updated;
  }

  async createOrUpdateEntity(
    entity: Entity,
    options?: { skipEmbedding?: boolean }
  ): Promise<Entity> {

    const existing = await this.entityService.getEntity(entity.id);

    if (existing) {

      return this.updateEntity(entity.id, entity);
    } else {

      return this.createEntity(entity, options);
    }
  }

  async getEntity(id: string): Promise<Entity | null> {
    return this.entityService.getEntity(id);
  }

  async deleteEntity(id: string): Promise<void> {
    await this.embeddingService.deleteEmbedding(id);
    await this.entityService.deleteEntity(id);
  }

  async listEntities(
    options?: any
  ): Promise<{ entities?: Entity[]; items: Entity[]; total: number }> {
    const result = await this.entityService.listEntities(options);
    return {
      items: result.items,
      entities: result.items,
      total: result.total,
    };
  }

  async createEntitiesBulk(entities: Entity[], options?: any): Promise<any> {
    const result = await this.entityService.createEntitiesBulk(
      entities,
      options
    );


    this.embeddingService
      .batchEmbed(entities)
      .catch((err) => console.warn("Failed to generate bulk embeddings:", err));

    return result;
  }

  async getEntitiesByFile(filePath: string): Promise<Entity[]> {
    return this.entityService.getEntitiesByFile(filePath);
  }

  async findRecentEntityIds(limit?: number): Promise<string[]> {
    const result = await this.entityService.listEntities({
      limit: limit || 100,
      orderBy: "lastModified",
      orderDirection: "DESC",
    });
    return result.items.map((e) => e.id);
  }

  async findEntitiesByType(entityType: string): Promise<Entity[]> {
    return this.entityService.getEntitiesByType(entityType);
  }
}

================
File: facades/HistoryManager.ts
================
import { Entity } from "../models/entities.js";

interface HistoryService {
  appendVersion(entity: Entity, options?: any): Promise<string>;
  createCheckpoint(seedEntities: string[], options: any): Promise<any>;
  pruneHistory(retentionDays: number, options?: any): Promise<any>;
  listCheckpoints(options?: any): Promise<any>;
  getHistoryMetrics(): Promise<any>;
  timeTravelTraversal(query: any): Promise<any>;
  exportCheckpoint(checkpointId: string): Promise<any>;
  importCheckpoint(checkpointData: any): Promise<any>;
  getCheckpoint(checkpointId: string): Promise<any>;
  getCheckpointMembers(checkpointId: string): Promise<any>;
  getCheckpointSummary(checkpointId: string): Promise<any>;
  deleteCheckpoint(checkpointId: string): Promise<void>;
  getEntityTimeline(entityId: string, options?: any): Promise<any>;
  getRelationshipTimeline(relationshipId: string, options?: any): Promise<any>;
  getSessionTimeline(sessionId: string, options?: any): Promise<any>;
  getSessionImpacts(sessionId: string): Promise<any>;
  getSessionsAffectingEntity(entityId: string, options?: any): Promise<any>;
  getChangesForSession(sessionId: string, options?: any): Promise<any>;
  openEdge(
    fromId: string,
    toId: string,
    type: any,
    ts?: Date,
    changeSetId?: string
  ): Promise<void>;
  closeEdge(fromId: string, toId: string, type: any, ts?: Date): Promise<void>;
}

interface Neo4jService {
  executeCypher(query: string, params: any): Promise<any>;
}

export class HistoryManager {
  private historyService: HistoryService;
  private neo4jService: Neo4jService;

  constructor(historyService: HistoryService, neo4jService: Neo4jService) {
    this.historyService = historyService;
    this.neo4jService = neo4jService;
  }

  async appendVersion(entity: Entity, options?: any): Promise<string> {
    return this.historyService.appendVersion(entity, options);
  }

  async createCheckpoint(seedEntities: string[], options: any): Promise<any> {
    return this.historyService.createCheckpoint(seedEntities, options);
  }

  async pruneHistory(retentionDays: number, options?: any): Promise<any> {
    return this.historyService.pruneHistory(retentionDays, options);
  }

  async listCheckpoints(options?: any): Promise<any> {
    return this.historyService.listCheckpoints(options);
  }

  async getHistoryMetrics(): Promise<any> {
    return this.historyService.getHistoryMetrics();
  }

  async timeTravelTraversal(query: any): Promise<any> {
    return this.historyService.timeTravelTraversal(query);
  }

  async exportCheckpoint(checkpointId: string): Promise<any> {
    return this.historyService.exportCheckpoint(checkpointId);
  }

  async importCheckpoint(checkpointData: any): Promise<any> {
    return this.historyService.importCheckpoint(checkpointData);
  }

  async getCheckpoint(checkpointId: string): Promise<any> {
    return this.historyService.getCheckpoint(checkpointId);
  }

  async getCheckpointMembers(checkpointId: string): Promise<any> {
    return this.historyService.getCheckpointMembers(checkpointId);
  }

  async getCheckpointSummary(checkpointId: string): Promise<any> {
    return this.historyService.getCheckpointSummary(checkpointId);
  }

  async deleteCheckpoint(checkpointId: string): Promise<void> {
    return this.historyService.deleteCheckpoint(checkpointId);
  }

  async getEntityTimeline(entityId: string, options?: any): Promise<any> {
    return this.historyService.getEntityTimeline(entityId, options);
  }

  async getRelationshipTimeline(
    relationshipId: string,
    options?: any
  ): Promise<any> {
    return this.historyService.getRelationshipTimeline(relationshipId, options);
  }

  async getSessionTimeline(sessionId: string, options?: any): Promise<any> {
    return this.historyService.getSessionTimeline(sessionId, options);
  }

  async getSessionImpacts(sessionId: string): Promise<any> {
    return this.historyService.getSessionImpacts(sessionId);
  }

  async getSessionsAffectingEntity(
    entityId: string,
    options?: any
  ): Promise<any> {
    return this.historyService.getSessionsAffectingEntity(entityId, options);
  }

  async getChangesForSession(sessionId: string, options?: any): Promise<any> {
    return this.historyService.getChangesForSession(sessionId, options);
  }

  async openEdge(
    fromId: string,
    toId: string,
    type: any,
    ts?: Date,
    changeSetId?: string
  ): Promise<void> {
    return this.historyService.openEdge(fromId, toId, type, ts, changeSetId);
  }

  async closeEdge(
    fromId: string,
    toId: string,
    type: any,
    ts?: Date
  ): Promise<void> {
    return this.historyService.closeEdge(fromId, toId, type, ts);
  }

  async repairPreviousVersionLink(versionId: string): Promise<void> {


    const query = `
      MATCH (v:Version {id: $versionId})-[:VERSION_OF]->(e:Entity)
      MATCH (e)<-[:VERSION_OF]-(other:Version)
      WHERE other.id <> v.id AND other.timestamp < v.timestamp
      AND NOT (v)-[:PREVIOUS_VERSION]->(:Version)
      WITH v, other
      ORDER BY other.timestamp DESC
      LIMIT 1
      CREATE (v)-[:PREVIOUS_VERSION]->(other)
    `;

    await this.neo4jService.executeCypher(query, { versionId });
  }



  async annotateSessionRelationshipsWithCheckpoint(
    sessionId: string,
    checkpointId: string,
    relationshipIds?: string[],
    timestamp?: Date
  ): Promise<void> {


    const at = timestamp || new Date();

    let query: string;
    let params: any;

    if (relationshipIds && relationshipIds.length > 0) {

      query = `
        UNWIND $relationshipIds AS relId
        MATCH ()-[r]->()
        WHERE r.id = relId OR elementId(r) = relId
        SET r.checkpointId = $checkpointId
        SET r.sessionId = $sessionId
        SET r.annotatedAt = $timestamp
      `;
      params = {
        relationshipIds,
        checkpointId,
        sessionId,
        timestamp: at.toISOString(),
      };
    } else {

      query = `
        MATCH ()-[r]->()
        WHERE r.changeSetId = $sessionId
        SET r.checkpointId = $checkpointId
        SET r.annotatedAt = $timestamp
      `;
      params = { sessionId, checkpointId, timestamp: at.toISOString() };
    }

    await this.neo4jService.executeCypher(query, params);
  }

  async createSessionCheckpointLink(
    sessionId: string,
    checkpointId: string,
    metadata?: Record<string, any>
  ): Promise<void> {

    const query = `
      MERGE (s:Session {id: $sessionId})
      ON CREATE SET s.created = $timestamp
      MERGE (c:Checkpoint {id: $checkpointId})
      MERGE (s)-[r:CREATED_CHECKPOINT]->(c)
      SET r.linked = $timestamp
      SET r.metadata = $metadata
    `;

    await this.neo4jService.executeCypher(query, {
      sessionId,
      checkpointId,
      timestamp: new Date().toISOString(),
      metadata: JSON.stringify(metadata || {}),
    });
  }
}

================
File: facades/index.ts
================
export { EntityManager } from "./EntityManager.js";
export { RelationshipManager } from "./RelationshipManager.js";
export { SearchManager } from "./SearchManager.js";
export { HistoryManager } from "./HistoryManager.js";
export { AnalysisManager } from "./AnalysisManager.js";

================
File: facades/RelationshipManager.ts
================
import {
  GraphRelationship,
  RelationshipQuery,
} from "../models/relationships.js";

interface RelationshipService {
  createRelationship(
    relationship: GraphRelationship
  ): Promise<GraphRelationship>;
  createRelationshipsBulk(
    relationships: GraphRelationship[],
    options?: any
  ): Promise<any>;
  getRelationships(query: RelationshipQuery): Promise<GraphRelationship[]>;
  deleteRelationship(fromId: string, toId: string, type: any): Promise<void>;
  getRelationshipById(
    relationshipId: string
  ): Promise<GraphRelationship | null>;
  upsertEdgeEvidenceBulk(updates: any[]): Promise<void>;
  mergeNormalizedDuplicates(): Promise<number>;
  markInactiveEdgesNotSeenSince(since: Date): Promise<number>;
  getEdgeEvidenceNodes(relationshipId: string, limit?: number): Promise<any[]>;
  getEdgeSites(relationshipId: string, limit?: number): Promise<any[]>;
  getEdgeCandidates(relationshipId: string, limit?: number): Promise<any[]>;
}

export class RelationshipManager {
  private relationshipService: RelationshipService;

  constructor(relationshipService: RelationshipService) {
    this.relationshipService = relationshipService;
  }

  async createRelationship(
    relationship: GraphRelationship
  ): Promise<GraphRelationship> {
    return this.relationshipService.createRelationship(relationship);
  }

  async createRelationshipsBulk(
    relationships: GraphRelationship[],
    options?: any
  ): Promise<any> {
    return this.relationshipService.createRelationshipsBulk(
      relationships,
      options
    );
  }

  async getRelationships(
    query: RelationshipQuery
  ): Promise<GraphRelationship[]> {
    return this.relationshipService.getRelationships(query);
  }

  async queryRelationships(
    query: RelationshipQuery
  ): Promise<GraphRelationship[]> {

    return this.getRelationships(query);
  }

  async deleteRelationship(
    fromId: string,
    toId: string,
    type: any
  ): Promise<void> {
    return this.relationshipService.deleteRelationship(fromId, toId, type);
  }

  async listRelationships(
    query: RelationshipQuery
  ): Promise<{ relationships: GraphRelationship[]; total: number }> {
    const relationships = await this.relationshipService.getRelationships(
      query
    );
    return {
      relationships,
      total: relationships.length,
    };
  }

  async getRelationshipById(
    relationshipId: string
  ): Promise<GraphRelationship | null> {
    return this.relationshipService.getRelationshipById(relationshipId);
  }

  async upsertRelationship(
    relationship: GraphRelationship
  ): Promise<GraphRelationship> {

    const existing = await this.relationshipService.getRelationshipById(
      relationship.id
    );
    if (existing) {


      return existing;
    } else {
      return this.relationshipService.createRelationship(relationship);
    }
  }

  async canonicalizeRelationship(
    relationship: GraphRelationship
  ): Promise<GraphRelationship> {


    return relationship;
  }

  async upsertEdgeEvidenceBulk(updates: any[]): Promise<void> {
    return this.relationshipService.upsertEdgeEvidenceBulk(updates);
  }

  async mergeNormalizedDuplicates(): Promise<number> {
    return this.relationshipService.mergeNormalizedDuplicates();
  }

  async markInactiveEdgesNotSeenSince(since: Date): Promise<number> {
    return this.relationshipService.markInactiveEdgesNotSeenSince(since);
  }

  async getEdgeEvidenceNodes(
    relationshipId: string,
    limit?: number
  ): Promise<any[]> {
    return this.relationshipService.getEdgeEvidenceNodes(relationshipId, limit);
  }

  async getEdgeSites(relationshipId: string, limit?: number): Promise<any[]> {
    return this.relationshipService.getEdgeSites(relationshipId, limit);
  }

  async getEdgeCandidates(
    relationshipId: string,
    limit?: number
  ): Promise<any[]> {
    return this.relationshipService.getEdgeCandidates(relationshipId, limit);
  }

  async finalizeScan(scanStart: Date): Promise<void> {

    await this.relationshipService.markInactiveEdgesNotSeenSince(scanStart);
  }
}

================
File: facades/SearchManager.ts
================
import { Entity } from "../models/entities.js";
import { GraphSearchRequest } from "@memento/core";

interface SearchService {
  search(request: GraphSearchRequest): Promise<any[]>;
  semanticSearch(query: string, options?: any): Promise<any[]>;
  structuralSearch(query: string, options?: any): Promise<any[]>;
  findSymbolsByName(name: string, options?: any): Promise<Entity[]>;
  findNearbySymbols(
    filePath: string,
    position: any,
    options?: any
  ): Promise<Entity[]>;
  getEntityExamples(entityId: string): Promise<any>;
  clearCache(): void;
  invalidateCache(pattern?: any): void;
}

export class SearchManager {
  private searchService: SearchService;

  constructor(searchService: SearchService) {
    this.searchService = searchService;
  }

  async searchEntities(request: GraphSearchRequest): Promise<any[]> {
    return this.searchService.search(request);
  }

  async search(request: GraphSearchRequest): Promise<Entity[]> {
    const results = await this.searchService.search(request);
    return results.map((r) => r.entity);
  }

  async semanticSearch(query: string, options?: any): Promise<any[]> {
    return this.searchService.semanticSearch(query, options);
  }

  async structuralSearch(query: string, options?: any): Promise<any[]> {
    return this.searchService.structuralSearch(query, options);
  }

  async findSymbolsByName(name: string, options?: any): Promise<Entity[]> {
    return this.searchService.findSymbolsByName(name, options);
  }

  async findNearbySymbols(
    filePath: string,
    position: any,
    options?: any
  ): Promise<Entity[]> {
    return this.searchService.findNearbySymbols(filePath, position, options);
  }

  async getEntityExamples(entityId: string): Promise<any> {
    return this.searchService.getEntityExamples(entityId);
  }

  async clearSearchCache(): Promise<void> {
    this.searchService.clearCache();
  }

  async invalidateSearchCache(pattern?: any): Promise<void> {
    this.searchService.invalidateCache(pattern);
  }
}

================
File: models/ogm/BaseModels.ts
================
import { ModelFactory, Neogma } from 'neogma';
import { Entity } from '../entities.js';
import { Relationship } from '../relationships.js';




export const BaseEntitySchema = {
  id: {
    type: 'string',
    required: true,
  },
  path: {
    type: 'string',
    required: true,
  },
  hash: {
    type: 'string',
    required: false,
  },
  language: {
    type: 'string',
    required: false,
  },
  created: {
    type: 'datetime',
    required: false,
  },
  lastModified: {
    type: 'datetime',
    required: false,
  },
  metadata: {
    type: 'object',
    required: false,
  },
};




export const BaseRelationshipSchema = {
  id: {
    type: 'string',
    required: true,
  },
  created: {
    type: 'datetime',
    required: false,
  },
  lastModified: {
    type: 'datetime',
    required: false,
  },
  version: {
    type: 'number',
    required: false,
    minimum: 1,
  },
  metadata: {
    type: 'object',
    required: false,
  },
  evidence: {
    type: 'object[]',
    required: false,
  },
  locations: {
    type: 'object[]',
    required: false,
  },
  sites: {
    type: 'object[]',
    required: false,
  },

  validFrom: {
    type: 'datetime',
    required: false,
  },
  validTo: {
    type: 'datetime',
    required: false,
  },
};




export function createEntityModel<T extends Entity>(
  neogma: Neogma,
  config: {
    label: string;
    schema: Record<string, any>;
    additionalIndices?: Array<{ properties: string[]; type?: string }>;
  }
) {
  const fullSchema = {
    ...BaseEntitySchema,
    ...config.schema,
  };


  const indices = [
    { properties: ['id'], type: 'RANGE' },
    { properties: ['path'], type: 'RANGE' },
    { properties: ['hash'], type: 'RANGE' },
    ...(config.additionalIndices || []),
  ];

  return ModelFactory(
    {
      label: config.label,
      schema: fullSchema as any,
      primaryKeyField: 'id',
    } as any,
    neogma
  );
}




export function createRelationshipModel(
  neogma: Neogma,
  config: {
    label: string;
    schema?: Record<string, any>;
    sourceModel: any;
    targetModel: any;
  }
) {
  const fullSchema = {
    ...BaseRelationshipSchema,
    ...(config.schema || {}),
  };

  return {
    label: config.label,
    schema: fullSchema,
    source: config.sourceModel,
    target: config.targetModel,
  };
}




export function modelToEntity<T extends Entity>(model: any): T {
  const props = model.getDataValues();


  if (props.created && typeof props.created !== 'object') {
    props.created = new Date(props.created);
  }
  if (props.lastModified && typeof props.lastModified !== 'object') {
    props.lastModified = new Date(props.lastModified);
  }

  return props as T;
}




export function entityToModelProps(entity: Entity): Record<string, any> {
  const props: Record<string, any> = { ...entity };


  if ('created' in entity && entity.created instanceof Date) {
    props.created = entity.created.toISOString();
  }
  if ('lastModified' in entity && entity.lastModified instanceof Date) {
    props.lastModified = entity.lastModified.toISOString();
  }

  return props;
}




export class BatchOperationHelper {
  constructor(private batchSize: number = 100) {}




  async executeBatched<T, R>(
    items: T[],
    operation: (batch: T[]) => Promise<R[]>
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);
      const batchResults = await operation(batch);
      results.push(...batchResults);
    }

    return results;
  }
}

================
File: models/ogm/EntityModels.ts
================
import { Neogma } from 'neogma';
import { createEntityModel } from './BaseModels.js';




export function createEntityModels(neogma: Neogma) {

  const FileModel = createEntityModel(neogma, {
    label: 'File',
    schema: {
      type: {
        type: 'string',
        required: true,
        enum: ['file'],
      },
      extension: {
        type: 'string',
        required: false,
      },
      size: {
        type: 'number',
        required: false,
        minimum: 0,
      },
      lines: {
        type: 'number',
        required: false,
        minimum: 0,
      },
      isTest: {
        type: 'boolean',
        required: false,
      },
      isConfig: {
        type: 'boolean',
        required: false,
      },
      dependencies: {
        type: 'string[]',
        required: false,
      },
    },
    additionalIndices: [
      { properties: ['extension'], type: 'RANGE' },
      { properties: ['isTest'], type: 'RANGE' },
    ],
  });


  const DirectoryModel = createEntityModel(neogma, {
    label: 'Directory',
    schema: {
      type: {
        type: 'string',
        required: true,
        enum: ['directory'],
      },
      children: {
        type: 'string[]',
        required: false,
      },
      depth: {
        type: 'number',
        required: false,
        minimum: 0,
      },
    },
    additionalIndices: [{ properties: ['depth'], type: 'RANGE' }],
  });


  const ModuleModel = createEntityModel(neogma, {
    label: 'Module',
    schema: {
      type: {
        type: 'string',
        required: true,
        enum: ['module'],
      },
      name: {
        type: 'string',
        required: true,
      },
      version: {
        type: 'string',
        required: false,
      },
      packageJson: {
        type: 'object',
        required: false,
      },
      entryPoint: {
        type: 'string',
        required: false,
      },
    },
    additionalIndices: [
      { properties: ['name'], type: 'RANGE' },
      { properties: ['version'], type: 'RANGE' },
    ],
  });


  const SymbolModel = createEntityModel(neogma, {
    label: 'Symbol',
    schema: {
      type: {
        type: 'string',
        required: true,
        enum: ['symbol'],
      },
      name: {
        type: 'string',
        required: true,
      },
      kind: {
        type: 'string',
        required: true,
        enum: [
          'function',
          'class',
          'interface',
          'typeAlias',
          'variable',
          'property',
          'method',
          'unknown',
        ],
      },
      signature: {
        type: 'string',
        required: false,
      },
      docstring: {
        type: 'string',
        required: false,
      },
      visibility: {
        type: 'string',
        required: false,
        enum: ['public', 'private', 'protected'],
      },
      isExported: {
        type: 'boolean',
        required: false,
      },
      isDeprecated: {
        type: 'boolean',
        required: false,
      },
      location: {
        type: 'object',
        required: false,
      },
    },
    additionalIndices: [
      { properties: ['name'], type: 'RANGE' },
      { properties: ['kind'], type: 'RANGE' },
      { properties: ['isExported'], type: 'RANGE' },
    ],
  });


  const FunctionSymbolModel = createEntityModel(neogma, {
    label: 'FunctionSymbol',
    schema: {
      type: {
        type: 'string',
        required: true,
        enum: ['symbol'],
      },
      kind: {
        type: 'string',
        required: true,
        enum: ['function'],
      },
      name: {
        type: 'string',
        required: true,
      },
      signature: {
        type: 'string',
        required: false,
      },
      docstring: {
        type: 'string',
        required: false,
      },
      visibility: {
        type: 'string',
        required: false,
        enum: ['public', 'private', 'protected'],
      },
      isExported: {
        type: 'boolean',
        required: false,
      },
      isDeprecated: {
        type: 'boolean',
        required: false,
      },
      location: {
        type: 'object',
        required: false,
      },
      parameters: {
        type: 'object[]',
        required: false,
      },
      returnType: {
        type: 'string',
        required: false,
      },
      isAsync: {
        type: 'boolean',
        required: false,
      },
      isGenerator: {
        type: 'boolean',
        required: false,
      },
      complexity: {
        type: 'number',
        required: false,
        minimum: 0,
      },
      calls: {
        type: 'string[]',
        required: false,
      },
    },
    additionalIndices: [
      { properties: ['name'], type: 'RANGE' },
      { properties: ['isAsync'], type: 'RANGE' },
      { properties: ['complexity'], type: 'RANGE' },
    ],
  });


  const ClassSymbolModel = createEntityModel(neogma, {
    label: 'ClassSymbol',
    schema: {
      type: {
        type: 'string',
        required: true,
        enum: ['symbol'],
      },
      kind: {
        type: 'string',
        required: true,
        enum: ['class'],
      },
      name: {
        type: 'string',
        required: true,
      },
      signature: {
        type: 'string',
        required: false,
      },
      docstring: {
        type: 'string',
        required: false,
      },
      visibility: {
        type: 'string',
        required: false,
        enum: ['public', 'private', 'protected'],
      },
      isExported: {
        type: 'boolean',
        required: false,
      },
      isDeprecated: {
        type: 'boolean',
        required: false,
      },
      location: {
        type: 'object',
        required: false,
      },
      extends: {
        type: 'string[]',
        required: false,
      },
      implements: {
        type: 'string[]',
        required: false,
      },
      methods: {
        type: 'string[]',
        required: false,
      },
      properties: {
        type: 'string[]',
        required: false,
      },
      isAbstract: {
        type: 'boolean',
        required: false,
      },
    },
    additionalIndices: [
      { properties: ['name'], type: 'RANGE' },
      { properties: ['isAbstract'], type: 'RANGE' },
    ],
  });


  const InterfaceSymbolModel = createEntityModel(neogma, {
    label: 'InterfaceSymbol',
    schema: {
      type: {
        type: 'string',
        required: true,
        enum: ['symbol'],
      },
      kind: {
        type: 'string',
        required: true,
        enum: ['interface'],
      },
      name: {
        type: 'string',
        required: true,
      },
      signature: {
        type: 'string',
        required: false,
      },
      docstring: {
        type: 'string',
        required: false,
      },
      visibility: {
        type: 'string',
        required: false,
        enum: ['public', 'private', 'protected'],
      },
      isExported: {
        type: 'boolean',
        required: false,
      },
      isDeprecated: {
        type: 'boolean',
        required: false,
      },
      location: {
        type: 'object',
        required: false,
      },
      extends: {
        type: 'string[]',
        required: false,
      },
      properties: {
        type: 'string[]',
        required: false,
      },
      methods: {
        type: 'string[]',
        required: false,
      },
    },
    additionalIndices: [{ properties: ['name'], type: 'RANGE' }],
  });


  const TestModel = createEntityModel(neogma, {
    label: 'Test',
    schema: {
      type: {
        type: 'string',
        required: true,
        enum: ['test'],
      },
      name: {
        type: 'string',
        required: true,
      },
      testType: {
        type: 'string',
        required: false,
        enum: ['unit', 'integration', 'e2e', 'performance'],
      },
      status: {
        type: 'string',
        required: false,
        enum: ['passing', 'failing', 'skipped', 'pending'],
      },
      coverage: {
        type: 'number',
        required: false,
        minimum: 0,
        maximum: 100,
      },
    },
    additionalIndices: [
      { properties: ['name'], type: 'RANGE' },
      { properties: ['testType'], type: 'RANGE' },
      { properties: ['status'], type: 'RANGE' },
    ],
  });


  const SpecificationModel = createEntityModel(neogma, {
    label: 'Specification',
    schema: {
      type: {
        type: 'string',
        required: true,
        enum: ['specification'],
      },
      name: {
        type: 'string',
        required: true,
      },
      priority: {
        type: 'string',
        required: false,
        enum: ['low', 'medium', 'high', 'critical'],
      },
      status: {
        type: 'string',
        required: false,
        enum: ['draft', 'approved', 'implemented', 'deprecated'],
      },
      version: {
        type: 'string',
        required: false,
      },
    },
    additionalIndices: [
      { properties: ['name'], type: 'RANGE' },
      { properties: ['priority'], type: 'RANGE' },
      { properties: ['status'], type: 'RANGE' },
    ],
  });


  const DocumentationModel = createEntityModel(neogma, {
    label: 'Documentation',
    schema: {
      type: {
        type: 'string',
        required: true,
        enum: ['documentation'],
      },
      title: {
        type: 'string',
        required: true,
      },
      content: {
        type: 'string',
        required: false,
      },
      format: {
        type: 'string',
        required: false,
        enum: ['markdown', 'jsdoc', 'tsdoc', 'plain'],
      },
      tags: {
        type: 'string[]',
        required: false,
      },
    },
    additionalIndices: [
      { properties: ['title'], type: 'RANGE' },
      { properties: ['format'], type: 'RANGE' },
    ],
  });


  const EntityModel = createEntityModel(neogma, {
    label: 'Entity',
    schema: {
      type: {
        type: 'string',
        required: false,
      },
      name: {
        type: 'string',
        required: false,
      },

      properties: {
        type: 'object',
        required: false,
      },
    },
    additionalIndices: [{ properties: ['type'], type: 'RANGE' }],
  });

  return {
    FileModel,
    DirectoryModel,
    ModuleModel,
    SymbolModel,
    FunctionSymbolModel,
    ClassSymbolModel,
    InterfaceSymbolModel,
    TestModel,
    SpecificationModel,
    DocumentationModel,
    EntityModel,
  };
}

================
File: models/ogm/RelationshipModels.ts
================
import { Neogma } from 'neogma';
import { createRelationshipModel, BaseRelationshipSchema } from './BaseModels.js';
import { createEntityModels } from './EntityModels.js';
import { RelationshipType } from '../relationships.js';




export function createRelationshipModels(neogma: Neogma) {
  const entityModels = createEntityModels(neogma);


  const ContainsRelation = createRelationshipModel(neogma, {
    label: RelationshipType.CONTAINS,
    sourceModel: entityModels.DirectoryModel,
    targetModel: entityModels.EntityModel,
  });

  const DefinesRelation = createRelationshipModel(neogma, {
    label: RelationshipType.DEFINES,
    sourceModel: entityModels.FileModel,
    targetModel: entityModels.SymbolModel,
  });

  const ExportsRelation = createRelationshipModel(neogma, {
    label: RelationshipType.EXPORTS,
    schema: {
      exportType: {
        type: 'string',
        required: false,
        enum: ['default', 'named', 'namespace'],
      },
      exportName: {
        type: 'string',
        required: false,
      },
    },
    sourceModel: entityModels.FileModel,
    targetModel: entityModels.SymbolModel,
  });

  const ImportsRelation = createRelationshipModel(neogma, {
    label: RelationshipType.IMPORTS,
    schema: {
      importType: {
        type: 'string',
        required: false,
        enum: ['default', 'named', 'namespace', 'side-effect', 'dynamic'],
      },
      specifiers: {
        type: 'string[]',
        required: false,
      },
      source: {
        type: 'string',
        required: false,
      },
    },
    sourceModel: entityModels.FileModel,
    targetModel: entityModels.EntityModel,
  });


  const CallsRelation = createRelationshipModel(neogma, {
    label: RelationshipType.CALLS,
    schema: {
      callCount: {
        type: 'number',
        required: false,
        minimum: 0,
      },
      isAsync: {
        type: 'boolean',
        required: false,
      },
      callLocations: {
        type: 'object[]',
        required: false,
      },
    },
    sourceModel: entityModels.FunctionSymbolModel,
    targetModel: entityModels.FunctionSymbolModel,
  });

  const ReferencesRelation = createRelationshipModel(neogma, {
    label: RelationshipType.REFERENCES,
    schema: {
      referenceCount: {
        type: 'number',
        required: false,
        minimum: 0,
      },
      referenceType: {
        type: 'string',
        required: false,
        enum: ['read', 'write', 'call', 'type', 'import'],
      },
    },
    sourceModel: entityModels.SymbolModel,
    targetModel: entityModels.SymbolModel,
  });

  const ImplementsRelation = createRelationshipModel(neogma, {
    label: RelationshipType.IMPLEMENTS,
    sourceModel: entityModels.ClassSymbolModel,
    targetModel: entityModels.InterfaceSymbolModel,
  });

  const ExtendsRelation = createRelationshipModel(neogma, {
    label: RelationshipType.EXTENDS,
    sourceModel: entityModels.ClassSymbolModel,
    targetModel: entityModels.ClassSymbolModel,
  });

  const DependsOnRelation = createRelationshipModel(neogma, {
    label: RelationshipType.DEPENDS_ON,
    schema: {
      dependencyType: {
        type: 'string',
        required: false,
        enum: ['runtime', 'dev', 'peer', 'optional'],
      },
      version: {
        type: 'string',
        required: false,
      },
    },
    sourceModel: entityModels.EntityModel,
    targetModel: entityModels.EntityModel,
  });


  const TypeUsesRelation = createRelationshipModel(neogma, {
    label: RelationshipType.TYPE_USES,
    schema: {
      usageContext: {
        type: 'string',
        required: false,
        enum: ['parameter', 'return', 'property', 'extends', 'implements', 'generic'],
      },
    },
    sourceModel: entityModels.SymbolModel,
    targetModel: entityModels.SymbolModel,
  });

  const ReturnsTypeRelation = createRelationshipModel(neogma, {
    label: RelationshipType.RETURNS_TYPE,
    sourceModel: entityModels.FunctionSymbolModel,
    targetModel: entityModels.SymbolModel,
  });

  const ParamTypeRelation = createRelationshipModel(neogma, {
    label: RelationshipType.PARAM_TYPE,
    schema: {
      parameterName: {
        type: 'string',
        required: false,
      },
      parameterIndex: {
        type: 'number',
        required: false,
        minimum: 0,
      },
    },
    sourceModel: entityModels.FunctionSymbolModel,
    targetModel: entityModels.SymbolModel,
  });


  const TestsRelation = createRelationshipModel(neogma, {
    label: RelationshipType.TESTS,
    schema: {
      testCount: {
        type: 'number',
        required: false,
        minimum: 0,
      },
      coverage: {
        type: 'number',
        required: false,
        minimum: 0,
        maximum: 100,
      },
    },
    sourceModel: entityModels.TestModel,
    targetModel: entityModels.EntityModel,
  });

  const ValidatesRelation = createRelationshipModel(neogma, {
    label: RelationshipType.VALIDATES,
    sourceModel: entityModels.TestModel,
    targetModel: entityModels.SpecificationModel,
  });


  const RequiresRelation = createRelationshipModel(neogma, {
    label: RelationshipType.REQUIRES,
    schema: {
      requirementType: {
        type: 'string',
        required: false,
        enum: ['functional', 'performance', 'security', 'compatibility'],
      },
      priority: {
        type: 'string',
        required: false,
        enum: ['low', 'medium', 'high', 'critical'],
      },
    },
    sourceModel: entityModels.SpecificationModel,
    targetModel: entityModels.EntityModel,
  });

  const ImpactsRelation = createRelationshipModel(neogma, {
    label: RelationshipType.IMPACTS,
    schema: {
      impactLevel: {
        type: 'string',
        required: false,
        enum: ['low', 'medium', 'high', 'critical'],
      },
      impactType: {
        type: 'string',
        required: false,
        enum: ['breaking', 'non-breaking', 'enhancement', 'bugfix'],
      },
    },
    sourceModel: entityModels.EntityModel,
    targetModel: entityModels.EntityModel,
  });

  const ImplementsSpecRelation = createRelationshipModel(neogma, {
    label: RelationshipType.IMPLEMENTS_SPEC,
    sourceModel: entityModels.EntityModel,
    targetModel: entityModels.SpecificationModel,
  });


  const DocumentedByRelation = createRelationshipModel(neogma, {
    label: RelationshipType.DOCUMENTED_BY,
    sourceModel: entityModels.EntityModel,
    targetModel: entityModels.DocumentationModel,
  });

  const DocumentsSectionRelation = createRelationshipModel(neogma, {
    label: RelationshipType.DOCUMENTS_SECTION,
    schema: {
      sectionName: {
        type: 'string',
        required: false,
      },
      sectionOrder: {
        type: 'number',
        required: false,
        minimum: 0,
      },
    },
    sourceModel: entityModels.DocumentationModel,
    targetModel: entityModels.EntityModel,
  });


  const PreviousVersionRelation = createRelationshipModel(neogma, {
    label: RelationshipType.PREVIOUS_VERSION,
    schema: {
      versionNumber: {
        type: 'string',
        required: false,
      },
      changeType: {
        type: 'string',
        required: false,
        enum: ['major', 'minor', 'patch', 'refactor'],
      },
    },
    sourceModel: entityModels.EntityModel,
    targetModel: entityModels.EntityModel,
  });

  const ModifiedByRelation = createRelationshipModel(neogma, {
    label: RelationshipType.MODIFIED_BY,
    schema: {
      modificationTime: {
        type: 'datetime',
        required: false,
      },
      changeDescription: {
        type: 'string',
        required: false,
      },
    },
    sourceModel: entityModels.EntityModel,
    targetModel: entityModels.EntityModel,
  });

  return {

    ContainsRelation,
    DefinesRelation,
    ExportsRelation,
    ImportsRelation,

    CallsRelation,
    ReferencesRelation,
    ImplementsRelation,
    ExtendsRelation,
    DependsOnRelation,

    TypeUsesRelation,
    ReturnsTypeRelation,
    ParamTypeRelation,

    TestsRelation,
    ValidatesRelation,

    RequiresRelation,
    ImpactsRelation,
    ImplementsSpecRelation,

    DocumentedByRelation,
    DocumentsSectionRelation,

    PreviousVersionRelation,
    ModifiedByRelation,
  };
}

================
File: models/entities.ts
================
import {
  DocumentationIntent,
  DocumentationNodeType,
  DocumentationSource,
  DocumentationStatus,
} from "./relationships.js";

export interface CodebaseEntity {
  id: string;
  path: string;
  hash: string;
  language: string;
  lastModified: Date;
  created: Date;
  metadata?: Record<string, any>;
}

export interface File extends CodebaseEntity {
  type: "file";
  extension: string;
  size: number;
  lines: number;
  isTest: boolean;
  isConfig: boolean;
  dependencies: string[];
}

export interface Directory extends CodebaseEntity {
  type: "directory";
  children: string[];
  depth: number;
}

export interface Module extends CodebaseEntity {
  type: "module";
  name: string;
  version: string;
  packageJson: any;
  entryPoint: string;
}

export interface Symbol extends CodebaseEntity {
  type: "symbol";
  name: string;
  kind:
    | "function"
    | "class"
    | "interface"
    | "typeAlias"
    | "variable"
    | "property"
    | "method"
    | "unknown";
  signature: string;
  docstring: string;
  visibility: "public" | "private" | "protected";
  isExported: boolean;
  isDeprecated: boolean;
  location?: {
    line: number;
    column: number;
    start: number;
    end: number;
  };
}

export interface FunctionSymbol extends Symbol {
  kind: "function";
  parameters: FunctionParameter[];
  returnType: string;
  isAsync: boolean;
  isGenerator: boolean;
  complexity: number;
  calls: string[];
}

export interface FunctionParameter {
  name: string;
  type: string;
  defaultValue?: string;
  optional: boolean;
}

export interface ClassSymbol extends Symbol {
  kind: "class";
  extends: string[];
  implements: string[];
  methods: string[];
  properties: string[];
  isAbstract: boolean;
}

export interface InterfaceSymbol extends Symbol {
  kind: "interface";
  extends: string[];
  methods: string[];
  properties: string[];
}

export interface TypeAliasSymbol extends Symbol {
  kind: "typeAlias";
  aliasedType: string;
  isUnion: boolean;
  isIntersection: boolean;
}

export interface Test extends CodebaseEntity {
  type: "test";
  testType: "unit" | "integration" | "e2e";
  targetSymbol: string;
  framework: string;
  coverage: CoverageMetrics;
  status: "passing" | "failing" | "skipped" | "unknown";
  flakyScore: number;
  lastRunAt?: Date;
  lastDuration?: number;
  executionHistory: TestExecution[];
  performanceMetrics: TestPerformanceMetrics;
  dependencies: string[];
  tags: string[];
}

export interface CoverageMetrics {
  lines: number;
  branches: number;
  functions: number;
  statements: number;
}

export interface TestExecution {
  id: string;
  timestamp: Date;
  status: "passed" | "failed" | "skipped" | "error";
  duration: number;
  errorMessage?: string;
  stackTrace?: string;
  coverage?: CoverageMetrics;
  performance?: TestPerformanceData;
  environment?: Record<string, any>;
}

export interface TestPerformanceData {
  memoryUsage?: number;
  cpuUsage?: number;
  networkRequests?: number;
  databaseQueries?: number;
  fileOperations?: number;
}

export interface TestPerformanceMetrics {
  averageExecutionTime: number;
  p95ExecutionTime: number;
  successRate: number;
  trend: "improving" | "stable" | "degrading";
  benchmarkComparisons: TestBenchmark[];
  historicalData: TestHistoricalData[];
}

export interface TestBenchmark {
  benchmark: string;
  value: number;
  status: "above" | "below" | "at";
  threshold: number;
}

export interface TestHistoricalData {
  timestamp: Date;



  executionTime: number;



  averageExecutionTime: number;



  p95ExecutionTime: number;
  successRate: number;
  coveragePercentage: number;
  runId?: string;
}

export interface Spec extends CodebaseEntity {
  type: "spec";
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: "draft" | "approved" | "implemented" | "deprecated";
  priority: "low" | "medium" | "high" | "critical";
  assignee?: string;
  tags?: string[];
  updated: Date;
}

export interface Change {
  id: string;
  type: "change";
  changeType: "create" | "update" | "delete" | "rename" | "move";
  entityType: string;
  entityId: string;
  timestamp: Date;
  author?: string;
  commitHash?: string;
  diff?: string;
  previousState?: any;
  newState?: any;
  sessionId?: string;
  specId?: string;
}

export interface Session {
  id: string;
  type: "session";
  startTime: Date;
  endTime?: Date;
  agentType: string;
  userId?: string;
  changes: string[];
  specs: string[];
  status: "active" | "completed" | "failed";
  metadata?: Record<string, any>;
}


export interface Version {
  id: string;
  type: "version";
  entityId: string;
  path?: string;
  hash: string;
  language?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}


export interface Checkpoint {
  id: string;
  type: "checkpoint";
  checkpointId: string;
  timestamp: Date;
  reason: "daily" | "incident" | "manual";
  hops: number;
  seedEntities: string[];
  metadata?: Record<string, any>;
}


export interface DocumentationNode extends CodebaseEntity {
  type: "documentation";
  title: string;
  content: string;
  docType: DocumentationNodeType;
  businessDomains: string[];
  stakeholders: string[];
  technologies: string[];
  status: DocumentationStatus;
  docVersion: string;
  docHash: string;
  docIntent: DocumentationIntent;
  docSource: DocumentationSource;
  docLocale?: string;
  lastIndexed?: Date;
}

export interface BusinessDomain {
  id: string;
  type: "businessDomain";
  name: string;
  description: string;
  parentDomain?: string;
  criticality: "core" | "supporting" | "utility";
  stakeholders: string[];
  keyProcesses: string[];
  extractedFrom: string[];
}

export interface SemanticCluster {
  id: string;
  type: "semanticCluster";
  name: string;
  description: string;
  businessDomainId: string;
  clusterType: "feature" | "module" | "capability" | "service";
  cohesionScore: number;
  lastAnalyzed: Date;
  memberEntities: string[];
}


export interface SecurityIssue {
  id: string;
  type: "securityIssue";
  tool: string;
  ruleId: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  cwe?: string;
  owasp?: string;
  affectedEntityId: string;
  lineNumber: number;
  codeSnippet: string;
  remediation: string;
  status: "open" | "fixed" | "accepted" | "false-positive";
  discoveredAt: Date;
  lastScanned: Date;
  confidence: number;
}

export interface Vulnerability {
  id: string;
  type: "vulnerability";
  packageName: string;
  version: string;
  vulnerabilityId: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  description: string;
  cvssScore: number;
  affectedVersions: string;
  fixedInVersion: string;
  publishedAt: Date;
  lastUpdated: Date;
  exploitability: "high" | "medium" | "low";
}


export type Entity =
  | File
  | Directory
  | Module
  | Symbol
  | FunctionSymbol
  | ClassSymbol
  | InterfaceSymbol
  | TypeAliasSymbol
  | Test
  | Spec
  | Change
  | Session
  | Version
  | Checkpoint
  | DocumentationNode
  | BusinessDomain
  | SemanticCluster
  | SecurityIssue
  | Vulnerability;


export const isFile = (entity: Entity | null | undefined): entity is File =>
  entity != null && entity.type === "file";
export const isDirectory = (
  entity: Entity | null | undefined
): entity is Directory => entity != null && entity.type === "directory";
export const isSymbol = (entity: Entity | null | undefined): entity is Symbol =>
  entity != null && entity.type === "symbol";
export const isFunction = (
  entity: Entity | null | undefined
): entity is FunctionSymbol => isSymbol(entity) && entity.kind === "function";
export const isClass = (
  entity: Entity | null | undefined
): entity is ClassSymbol => isSymbol(entity) && entity.kind === "class";
export const isInterface = (
  entity: Entity | null | undefined
): entity is InterfaceSymbol => isSymbol(entity) && entity.kind === "interface";
export const isTest = (entity: Entity | null | undefined): entity is Test =>
  entity != null && entity.type === "test";
export const isSpec = (entity: Entity | null | undefined): entity is Spec =>
  entity != null && entity.type === "spec";


export { RelationshipType } from "./relationships.js";

================
File: models/index.ts
================
export * from './entities.js';
export * from './relationships.js';
export * from './ogm/BaseModels.js';
export * from './ogm/EntityModels.js';
export * from './ogm/RelationshipModels.js';

================
File: models/relationships.ts
================
export interface Relationship {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  type: RelationshipType;
  created: Date;
  lastModified: Date;
  version: number;
  metadata?: Record<string, any>;
  siteId?: string;
  siteHash?: string;
  evidence?: any[];
  locations?: any[];
  sites?: any[];

  validFrom?: Date;
  validTo?: Date | null;
}


export enum RelationshipType {

  CONTAINS = 'CONTAINS',
  DEFINES = 'DEFINES',
  EXPORTS = 'EXPORTS',
  IMPORTS = 'IMPORTS',


  CALLS = 'CALLS',
  REFERENCES = 'REFERENCES',
  IMPLEMENTS = 'IMPLEMENTS',
  EXTENDS = 'EXTENDS',
  DEPENDS_ON = 'DEPENDS_ON',
  OVERRIDES = 'OVERRIDES',
  READS = 'READS',
  WRITES = 'WRITES',
  THROWS = 'THROWS',

  TYPE_USES = 'TYPE_USES',
  RETURNS_TYPE = 'RETURNS_TYPE',
  PARAM_TYPE = 'PARAM_TYPE',


  TESTS = 'TESTS',
  VALIDATES = 'VALIDATES',


  REQUIRES = 'REQUIRES',
  IMPACTS = 'IMPACTS',
  IMPLEMENTS_SPEC = 'IMPLEMENTS_SPEC',


  PREVIOUS_VERSION = 'PREVIOUS_VERSION',
  MODIFIED_BY = 'MODIFIED_BY',
  CREATED_IN = 'CREATED_IN',
  MODIFIED_IN = 'MODIFIED_IN',
  REMOVED_IN = 'REMOVED_IN',
  OF = 'OF',


  DESCRIBES_DOMAIN = 'DESCRIBES_DOMAIN',
  BELONGS_TO_DOMAIN = 'BELONGS_TO_DOMAIN',
  DOCUMENTED_BY = 'DOCUMENTED_BY',
  CLUSTER_MEMBER = 'CLUSTER_MEMBER',
  DOMAIN_RELATED = 'DOMAIN_RELATED',
  GOVERNED_BY = 'GOVERNED_BY',
  DOCUMENTS_SECTION = 'DOCUMENTS_SECTION',


  HAS_SECURITY_ISSUE = 'HAS_SECURITY_ISSUE',
  DEPENDS_ON_VULNERABLE = 'DEPENDS_ON_VULNERABLE',
  SECURITY_IMPACTS = 'SECURITY_IMPACTS',


  PERFORMANCE_IMPACT = 'PERFORMANCE_IMPACT',
  PERFORMANCE_REGRESSION = 'PERFORMANCE_REGRESSION',
  COVERAGE_PROVIDES = 'COVERAGE_PROVIDES',


  SESSION_MODIFIED = 'SESSION_MODIFIED',
  SESSION_IMPACTED = 'SESSION_IMPACTED',
  SESSION_CHECKPOINT = 'SESSION_CHECKPOINT',
  BROKE_IN = 'BROKE_IN',
  FIXED_IN = 'FIXED_IN',
  DEPENDS_ON_CHANGE = 'DEPENDS_ON_CHANGE',


  CHECKPOINT_INCLUDES = 'CHECKPOINT_INCLUDES'
}


export type StructuralImportType =
  | "default"
  | "named"
  | "namespace"
  | "wildcard"
  | "side-effect";

export interface StructuralRelationship extends Relationship {
  type:
    | RelationshipType.CONTAINS
    | RelationshipType.DEFINES
    | RelationshipType.EXPORTS
    | RelationshipType.IMPORTS;
  importType?: StructuralImportType;
  importAlias?: string;
  importDepth?: number;
  isNamespace?: boolean;
  isReExport?: boolean;
  reExportTarget?: string | null;
  language?: string;
  symbolKind?: string;
  modulePath?: string;
  resolutionState?: "resolved" | "unresolved" | "partial";
  metadata?: Record<string, any> & {
    languageSpecific?: Record<string, any>;
  };
  confidence?: number;
  scope?: CodeScope;
  firstSeenAt?: Date;
  lastSeenAt?: Date;
}

const STRUCTURAL_RELATIONSHIP_TYPE_SET = new Set<RelationshipType>([
  RelationshipType.CONTAINS,
  RelationshipType.DEFINES,
  RelationshipType.EXPORTS,
  RelationshipType.IMPORTS,
]);

export const isStructuralRelationshipType = (
  type: RelationshipType
): type is StructuralRelationship["type"] =>
  STRUCTURAL_RELATIONSHIP_TYPE_SET.has(type);

export const PERFORMANCE_RELATIONSHIP_TYPES = [
  RelationshipType.PERFORMANCE_IMPACT,
  RelationshipType.PERFORMANCE_REGRESSION,
] as const;

const PERFORMANCE_RELATIONSHIP_TYPE_SET = new Set<RelationshipType>(
  PERFORMANCE_RELATIONSHIP_TYPES
);

export type PerformanceRelationshipType =
  (typeof PERFORMANCE_RELATIONSHIP_TYPES)[number];

export const isPerformanceRelationshipType = (
  type: RelationshipType
): type is PerformanceRelationshipType =>
  PERFORMANCE_RELATIONSHIP_TYPE_SET.has(type);

export const SESSION_RELATIONSHIP_TYPES = [
  RelationshipType.SESSION_MODIFIED,
  RelationshipType.SESSION_IMPACTED,
  RelationshipType.SESSION_CHECKPOINT,
  RelationshipType.BROKE_IN,
  RelationshipType.FIXED_IN,
  RelationshipType.DEPENDS_ON_CHANGE,
] as const;

const SESSION_RELATIONSHIP_TYPE_SET = new Set<RelationshipType>(
  SESSION_RELATIONSHIP_TYPES
);

export type SessionRelationshipType =
  (typeof SESSION_RELATIONSHIP_TYPES)[number];

export const isSessionRelationshipType = (
  type: RelationshipType
): type is SessionRelationshipType =>
  SESSION_RELATIONSHIP_TYPE_SET.has(type);



export type CodeEdgeSource = 'ast' | 'type-checker' | 'heuristic' | 'index' | 'runtime' | 'lsp';

export type CodeEdgeKind = 'call' | 'identifier' | 'instantiation' | 'type' | 'read' | 'write' | 'override' | 'inheritance' | 'return' | 'param' | 'decorator' | 'annotation' | 'throw' | 'dependency';


export const CODE_RELATIONSHIP_TYPES = [
  RelationshipType.CALLS,
  RelationshipType.REFERENCES,
  RelationshipType.IMPLEMENTS,
  RelationshipType.EXTENDS,
  RelationshipType.DEPENDS_ON,
  RelationshipType.OVERRIDES,
  RelationshipType.READS,
  RelationshipType.WRITES,
  RelationshipType.THROWS,
  RelationshipType.TYPE_USES,
  RelationshipType.RETURNS_TYPE,
  RelationshipType.PARAM_TYPE,
] as const;

export type CodeRelationshipType = (typeof CODE_RELATIONSHIP_TYPES)[number];


export const DOCUMENTATION_RELATIONSHIP_TYPES = [
  RelationshipType.DESCRIBES_DOMAIN,
  RelationshipType.BELONGS_TO_DOMAIN,
  RelationshipType.DOCUMENTED_BY,
  RelationshipType.CLUSTER_MEMBER,
  RelationshipType.DOMAIN_RELATED,
  RelationshipType.GOVERNED_BY,
  RelationshipType.DOCUMENTS_SECTION,
] as const;

export type DocumentationRelationshipType =
  (typeof DOCUMENTATION_RELATIONSHIP_TYPES)[number];

const DOCUMENTATION_RELATIONSHIP_TYPE_SET = new Set<RelationshipType>(
  DOCUMENTATION_RELATIONSHIP_TYPES,
);

export const isDocumentationRelationshipType = (
  type: RelationshipType,
): type is DocumentationRelationshipType =>
  DOCUMENTATION_RELATIONSHIP_TYPE_SET.has(type);

export type DocumentationSource =
  | 'parser'
  | 'manual'
  | 'llm'
  | 'imported'
  | 'sync'
  | 'other';

export type DocumentationIntent = 'ai-context' | 'governance' | 'mixed';

export type DocumentationNodeType =
  | 'readme'
  | 'api-docs'
  | 'design-doc'
  | 'architecture'
  | 'user-guide';

export type DocumentationStatus = 'active' | 'deprecated' | 'draft';

export type DocumentationCoverageScope =
  | 'api'
  | 'behavior'
  | 'operational'
  | 'security'
  | 'compliance';

export type DocumentationQuality = 'complete' | 'partial' | 'outdated';

export type DocumentationPolicyType =
  | 'adr'
  | 'runbook'
  | 'compliance'
  | 'manual'
  | 'decision-log';


export interface EdgeEvidence {
  source: CodeEdgeSource;
  confidence?: number;
  location?: { path?: string; line?: number; column?: number };
  note?: string;

  extractorVersion?: string;
}

export interface CodeRelationship extends Relationship {
  type: CodeRelationshipType;

  strength?: number;
  context?: string;



  occurrencesScan?: number;
  occurrencesTotal?: number;
  occurrencesRecent?: number;
  confidence?: number;
  inferred?: boolean;
  resolved?: boolean;
  source?: CodeEdgeSource;
  kind?: CodeEdgeKind;
  location?: { path?: string; line?: number; column?: number };

  usedTypeChecker?: boolean;
  isExported?: boolean;

  active?: boolean;


  evidence?: EdgeEvidence[];
  locations?: Array<{ path?: string; line?: number; column?: number }>;


  siteId?: string;
  sites?: string[];
  siteHash?: string;


  why?: string;


  callee?: string;
  paramName?: string;
  importDepth?: number;
  importAlias?: string;
  isMethod?: boolean;


  resolution?: CodeResolution;
  scope?: CodeScope;
  accessPath?: string;
  ambiguous?: boolean;
  candidateCount?: number;


  arity?: number;
  awaited?: boolean;
  receiverType?: string;
  dynamicDispatch?: boolean;
  overloadIndex?: number;
  genericArguments?: string[];


  operator?: string;


  dataFlowId?: string;
  purity?: 'pure' | 'impure' | 'unknown';


  fromRef?: { kind: 'entity' | 'fileSymbol' | 'external'; id?: string; file?: string; symbol?: string; name?: string };
  toRef?: { kind: 'entity' | 'fileSymbol' | 'external'; id?: string; file?: string; symbol?: string; name?: string };

  to_ref_kind?: 'entity' | 'fileSymbol' | 'external' | undefined;
  to_ref_file?: string;
  to_ref_symbol?: string;
  to_ref_name?: string;


  from_ref_kind?: 'entity' | 'fileSymbol' | 'external' | undefined;
  from_ref_file?: string;
  from_ref_symbol?: string;
  from_ref_name?: string;


  firstSeenAt?: Date;
  lastSeenAt?: Date;
}


export type CodeResolution = 'direct' | 'via-import' | 'type-checker' | 'heuristic';
export type CodeScope = 'local' | 'imported' | 'external' | 'unknown';

export interface TestRelationship extends Relationship {
  type: RelationshipType.TESTS | RelationshipType.VALIDATES;
  testType?: 'unit' | 'integration' | 'e2e';
  coverage?: number;
}

export interface SpecRelationship extends Relationship {
  type: RelationshipType.REQUIRES | RelationshipType.IMPACTS | RelationshipType.IMPLEMENTS_SPEC;
  impactLevel?: 'high' | 'medium' | 'low';
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

export interface TemporalRelationship extends Relationship {
  type: RelationshipType.PREVIOUS_VERSION |
        RelationshipType.MODIFIED_BY | RelationshipType.CREATED_IN |
        RelationshipType.MODIFIED_IN | RelationshipType.REMOVED_IN |
        RelationshipType.OF;
  changeType?: 'create' | 'update' | 'delete' | 'rename' | 'move';
  author?: string;
  commitHash?: string;
}

export interface DocumentationRelationship extends Relationship {
  type: DocumentationRelationshipType;
  confidence?: number;
  inferred?: boolean;
  source?: DocumentationSource;
  docIntent?: DocumentationIntent;
  sectionAnchor?: string;
  sectionTitle?: string;
  summary?: string;
  docVersion?: string;
  docHash?: string;
  documentationQuality?: DocumentationQuality;
  coverageScope?: DocumentationCoverageScope;
  evidence?: Array<{ type: 'heading' | 'snippet' | 'link'; value: string }>;
  tags?: string[];
  stakeholders?: string[];
  domainPath?: string;
  taxonomyVersion?: string;
  updatedFromDocAt?: Date;
  lastValidated?: Date;
  strength?: number;
  similarityScore?: number;
  clusterVersion?: string;
  role?: 'core' | 'supporting' | 'entry-point' | 'integration';
  docEvidenceId?: string;
  docAnchor?: string;
  embeddingVersion?: string;
  policyType?: DocumentationPolicyType;
  effectiveFrom?: Date;
  expiresAt?: Date | null;
  relationshipType?: 'depends_on' | 'overlaps' | 'shares_owner' | string;
  docLocale?: string;
}

export interface SecurityRelationship extends Relationship {
  type: RelationshipType.HAS_SECURITY_ISSUE | RelationshipType.DEPENDS_ON_VULNERABLE |
        RelationshipType.SECURITY_IMPACTS;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status?: 'open' | 'fixed' | 'accepted' | 'false-positive';
  cvssScore?: number;
}

export type PerformanceTrend = "regression" | "improvement" | "neutral";

export type PerformanceSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low";

export interface PerformanceConfidenceInterval {
  lower?: number;
  upper?: number;
}

export interface PerformanceMetricSample {
  timestamp?: Date;
  value: number;
  runId?: string;
  environment?: string;
  unit?: string;
}

export interface PerformanceRelationship extends Relationship {
  type: PerformanceRelationshipType;
  metricId: string;
  scenario?: string;
  environment?: string;
  baselineValue?: number;
  currentValue?: number;
  unit?: string;
  delta?: number;
  percentChange?: number;
  sampleSize?: number;
  confidenceInterval?: PerformanceConfidenceInterval | null;
  trend?: PerformanceTrend;
  severity?: PerformanceSeverity;
  riskScore?: number;
  runId?: string;
  policyId?: string;
  detectedAt?: Date;
  resolvedAt?: Date | null;
  metricsHistory?: PerformanceMetricSample[];
  evidence?: EdgeEvidence[];
  metadata?: Record<string, any> & {
    metrics?: Array<Record<string, any>>;
  };
}

export interface SessionRelationship extends Relationship {
  type: RelationshipType.SESSION_MODIFIED | RelationshipType.SESSION_IMPACTED |
        RelationshipType.SESSION_CHECKPOINT | RelationshipType.BROKE_IN |
        RelationshipType.FIXED_IN | RelationshipType.DEPENDS_ON_CHANGE;


  sessionId: string;
  timestamp: Date;
  sequenceNumber: number;
  eventId?: string;
  actor?: string;
  annotations?: string[];
  impactSeverity?: 'critical' | 'high' | 'medium' | 'low';
  stateTransitionTo?: 'working' | 'broken' | 'unknown';
  checkpointId?: string;
  checkpointStatus?: 'pending' | 'completed' | 'failed' | 'manual_intervention';
  checkpointDetails?: {
    reason?: 'daily' | 'incident' | 'manual';
    hopCount?: number;
    attempts?: number;
    seedEntityIds?: string[];
    jobId?: string;
    error?: string;
    updatedAt?: Date;
  };


  changeInfo?: {
    elementType: 'function' | 'class' | 'import' | 'test';
    elementName: string;
    operation: 'added' | 'modified' | 'deleted' | 'renamed';
    semanticHash?: string;
    affectedLines?: number;
  };


  stateTransition?: {
    from: 'working' | 'broken' | 'unknown';
    to: 'working' | 'broken' | 'unknown';
    verifiedBy: 'test' | 'build' | 'manual';
    confidence: number;
    criticalChange?: {
      entityId: string;
      beforeSnippet?: string;
      afterSnippet?: string;
    };
  };


  impact?: {
    severity: 'high' | 'medium' | 'low';
    testsFailed?: string[];
    testsFixed?: string[];
    buildError?: string;
    performanceImpact?: number;
  };
}


export type GraphRelationship =
  | StructuralRelationship
  | CodeRelationship
  | TestRelationship
  | SpecRelationship
  | TemporalRelationship
  | DocumentationRelationship
  | SecurityRelationship
  | PerformanceRelationship
  | SessionRelationship;


export interface RelationshipQuery {
  fromEntityId?: string;
  toEntityId?: string;
  type?: RelationshipType | RelationshipType[];
  entityTypes?: string[];
  since?: Date;
  until?: Date;
  limit?: number;
  offset?: number;
  domainPath?: string | string[];
  domainPrefix?: string | string[];
  docIntent?: DocumentationIntent | DocumentationIntent[];
  docType?: DocumentationNodeType | DocumentationNodeType[];
  docStatus?: DocumentationStatus | DocumentationStatus[];
  docLocale?: string | string[];
  coverageScope?: DocumentationCoverageScope | DocumentationCoverageScope[];
  embeddingVersion?: string | string[];
  clusterId?: string | string[];
  clusterVersion?: string | string[];
  stakeholder?: string | string[];
  tag?: string | string[];
  lastValidatedAfter?: Date;
  lastValidatedBefore?: Date;
  metricId?: string | string[];
  environment?: string | string[];
  severity?: PerformanceSeverity | PerformanceSeverity[];
  trend?: PerformanceTrend | PerformanceTrend[];
  detectedAfter?: Date;
  detectedBefore?: Date;
  resolvedAfter?: Date;
  resolvedBefore?: Date;

  kind?: CodeEdgeKind | CodeEdgeKind[];
  source?: CodeEdgeSource | CodeEdgeSource[];
  resolution?: CodeResolution | CodeResolution[];
  scope?: CodeScope | CodeScope[];
  confidenceMin?: number;
  confidenceMax?: number;
  inferred?: boolean;
  resolved?: boolean;
  active?: boolean;
  firstSeenSince?: Date;
  lastSeenSince?: Date;

  to_ref_kind?: 'entity' | 'fileSymbol' | 'external';
  to_ref_file?: string;
  to_ref_symbol?: string;
  to_ref_name?: string;

  from_ref_kind?: 'entity' | 'fileSymbol' | 'external';
  from_ref_file?: string;
  from_ref_symbol?: string;
  from_ref_name?: string;

  siteHash?: string;

  arityEq?: number;
  arityMin?: number;
  arityMax?: number;
  awaited?: boolean;
  isMethod?: boolean;

  operator?: string;
  callee?: string;
  importDepthMin?: number;
  importDepthMax?: number;
  importAlias?: string | string[];
  importType?: StructuralImportType | StructuralImportType[];
  isNamespace?: boolean;
  language?: string | string[];
  symbolKind?: string | string[];
  modulePath?: string | string[];
  modulePathPrefix?: string;

  sessionId?: string | string[];
  sessionIds?: string[];
  sequenceNumber?: number | number[];
  sequenceNumberMin?: number;
  sequenceNumberMax?: number;
  timestampFrom?: Date | string;
  timestampTo?: Date | string;
  actor?: string | string[];
  impactSeverity?:
    | 'critical'
    | 'high'
    | 'medium'
    | 'low'
    | Array<'critical' | 'high' | 'medium' | 'low'>;
  stateTransitionTo?:
    | 'working'
    | 'broken'
    | 'unknown'
    | Array<'working' | 'broken' | 'unknown'>;
}

export interface RelationshipFilter {
  types?: RelationshipType[];
  directions?: ('outgoing' | 'incoming')[];
  depths?: number[];
  weights?: {
    min?: number;
    max?: number;
  };
}


export interface PathQuery {
  startEntityId: string;
  endEntityId?: string;
  relationshipTypes?: RelationshipType[];
  maxDepth?: number;
  direction?: 'outgoing' | 'incoming' | 'both';
}

export interface PathResult {
  path: GraphRelationship[];
  totalLength: number;
  relationshipTypes: RelationshipType[];
  entities: string[];
}


export interface TraversalQuery {
  startEntityId: string;
  relationshipTypes: RelationshipType[];
  direction: 'outgoing' | 'incoming' | 'both';
  maxDepth?: number;
  limit?: number;
  filter?: {
    entityTypes?: string[];
    properties?: Record<string, any>;
  };
}

export interface TraversalResult {
  entities: any[];
  relationships: GraphRelationship[];
  paths: PathResult[];
  visited: string[];
}


export interface ImpactQuery {
  entityId: string;
  changeType: 'modify' | 'delete' | 'rename';
  includeIndirect?: boolean;
  maxDepth?: number;
  relationshipTypes?: RelationshipType[];
}

export interface ImpactResult {
  directImpact: {
    entities: any[];
    severity: 'high' | 'medium' | 'low';
    reason: string;
  }[];
  cascadingImpact: {
    level: number;
    entities: any[];
    relationship: RelationshipType;
    confidence: number;
  }[];
  totalAffectedEntities: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}

================
File: services/index.ts
================
export { default as RelationshipNormalizer } from './RelationshipNormalizer.js';
export * from './structuralPersistence.js';

================
File: services/RelationshipNormalizer.ts
================
import crypto from "crypto";
import {
  GraphRelationship,
  RelationshipType,
  StructuralImportType,
} from "../models/relationships.js";
import { canonicalRelationshipId } from "@memento/core";

export type StructuralLanguageAdapter = (
  relationship: GraphRelationship & { metadata?: Record<string, any> }
) => void;

const structuralAdapters: StructuralLanguageAdapter[] = [];

export function registerStructuralAdapter(adapter: StructuralLanguageAdapter): void {
  structuralAdapters.push(adapter);
}

function applyRegisteredAdapters(rel: GraphRelationship): void {
  for (const adapter of structuralAdapters) {
    try {
      adapter(rel);
    } catch (error) {

      if ((process.env.STRUCTURAL_ADAPTER_DEBUG || "0") === "1") {
        console.warn("Structural adapter failed", error);
      }
    }
  }
}

export function normalizeStructuralRelationship(
  relIn: GraphRelationship
): GraphRelationship {
  const rel: any = relIn;
  const md: Record<string, any> = { ...(rel.metadata || {}) };
  rel.metadata = md;

  const sanitizeString = (value: unknown, max = 512): string | undefined => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
  };

  const sanitizeBoolean = (value: unknown): boolean | undefined => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }
    return undefined;
  };

  const sanitizeNonNegativeInt = (value: unknown): number | undefined => {
    if (value === null || value === undefined) return undefined;
    const num = Number(value);
    if (!Number.isFinite(num)) return undefined;
    if (num < 0) return 0;
    return Math.floor(num);
  };

  const sanitizeConfidence = (value: unknown): number | undefined => {
    if (value === null || value === undefined) return undefined;
    const num = Number(value);
    if (!Number.isFinite(num)) return undefined;
    if (num < 0) return 0;
    if (num > 1) return 1;
    return num;
  };

  const normalizeLanguage = (value: unknown): string | undefined => {
    const sanitized = sanitizeString(value, 64);
    if (!sanitized) return undefined;
    return sanitized.toLowerCase();
  };

  const normalizeSymbolKind = (value: unknown): string | undefined => {
    const sanitized = sanitizeString(value, 64);
    if (!sanitized) return undefined;
    return sanitized.toLowerCase();
  };

  const normalizeModulePath = (value: unknown): string | undefined => {
    const sanitized = sanitizeString(value, 1024);
    if (!sanitized) return undefined;
    let normalized = sanitized.replace(/\\+/g, "/");
    if (normalized.length > 1) {
      normalized = normalized.replace(/\/+$/g, "");
      if (normalized.length === 0) {
        normalized = "/";
      }
    }
    normalized = normalized.replace(/\/{2,}/g, "/");
    return normalized;
  };

  type ResolutionState = "resolved" | "unresolved" | "partial";

  const normalizeResolutionState = (
    value: unknown
  ): ResolutionState | undefined => {
    if (typeof value === "boolean") {
      return value ? "resolved" : "unresolved";
    }
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "resolved") return "resolved";
      if (normalized === "unresolved") return "unresolved";
      if (normalized === "partial") return "partial";
    }
    return undefined;
  };

  const normalizeImportType = (
    value: unknown,
    namespaceHint: boolean,
    wildcardHint: boolean
  ): StructuralImportType | undefined => {
    const raw = sanitizeString(value, 32);
    if (!raw) {
      if (namespaceHint) return "namespace";
      if (wildcardHint) return "wildcard";
      return undefined;
    }
    const normalized = raw.toLowerCase().replace(/[_\s]+/g, "-");
    switch (normalized) {
      case "default":
      case "default-import":
      case "import-default":
        return "default";
      case "named":
      case "named-import":
      case "type":
      case "types":
        return "named";
      case "namespace":
      case "namespace-import":
      case "star-import":
        return "namespace";
      case "wildcard":
      case "all":
        return "wildcard";
      case "side-effect":
      case "sideeffect":
      case "side-effect-import":
        return "side-effect";
      default:
        if (normalized === "*") return "wildcard";
        if (normalized.includes("namespace")) return "namespace";
        if (normalized.includes("side")) return "side-effect";
        if (normalized.includes("default")) return "default";
        if (normalized.includes("wild")) return "wildcard";
        if (normalized.includes("star")) return "namespace";
        if (normalized.includes("type")) return "named";
        return undefined;
    }
  };

  const resolvedFlag =
    sanitizeBoolean(rel.resolved) ??
    sanitizeBoolean(md.resolved) ??
    sanitizeBoolean((md as any).isResolved);
  const hadResolvedInput = typeof resolvedFlag === "boolean";
  if (typeof resolvedFlag === "boolean") {
    rel.resolved = resolvedFlag;
    md.resolved = resolvedFlag;
  } else {
    delete rel.resolved;
    if (md.resolved !== undefined) delete md.resolved;
    if ((md as any).isResolved !== undefined) delete (md as any).isResolved;
  }

  const existingConfidence =
    sanitizeConfidence(rel.confidence) ??
    sanitizeConfidence(md.confidence);
  if (typeof existingConfidence === "number") {
    rel.confidence = existingConfidence;
    md.confidence = existingConfidence;
  }

  const initialResolutionState = normalizeResolutionState(
    (rel as any).resolutionState ??
      md.resolutionState ??
      (md.resolved ?? rel.resolved)
  );
  if (initialResolutionState) {
    (rel as any).resolutionState = initialResolutionState;
    md.resolutionState = initialResolutionState;
  }

  const rawModule =
    rel.modulePath ??
    md.modulePath ??
    md.module ??
    md.moduleSpecifier ??
    md.sourceModule;
  const modulePath = normalizeModulePath(rawModule);
  if (modulePath) {
    rel.modulePath = modulePath;
    md.modulePath = modulePath;
  } else {
    delete rel.modulePath;
    if (md.modulePath !== undefined) delete md.modulePath;
  }

  if (rel.type === RelationshipType.IMPORTS) {
    const alias =
      sanitizeString(rel.importAlias, 256) ??
      sanitizeString(md.importAlias, 256) ??
      sanitizeString(md.alias, 256);
    if (alias) {
      rel.importAlias = alias;
      md.importAlias = alias;
    } else {
      delete rel.importAlias;
    }

    const namespaceHint = Boolean(
      sanitizeBoolean(rel.isNamespace ?? md.isNamespace) ||
        (typeof modulePath === "string" && modulePath.endsWith("/*"))
    );
    const wildcardHint =
      typeof rawModule === "string" && rawModule.trim() === "*";
    const importType = normalizeImportType(
      rel.importType ?? md.importType ?? md.importKind ?? md.kind,
      namespaceHint,
      wildcardHint
    );
    if (importType) {
      rel.importType = importType;
      md.importType = importType;
    } else {
      delete rel.importType;
    }

    const isNamespace =
      sanitizeBoolean(rel.isNamespace ?? md.isNamespace) ??
      (importType === "namespace" ? true : undefined);
    if (typeof isNamespace === "boolean") {
      rel.isNamespace = isNamespace;
      md.isNamespace = isNamespace;
    } else {
      delete rel.isNamespace;
    }

    const importDepth = sanitizeNonNegativeInt(rel.importDepth ?? md.importDepth);
    if (importDepth !== undefined) {
      rel.importDepth = importDepth;
      md.importDepth = importDepth;
    }

    const resolutionState = normalizeResolutionState(
      (rel as any).resolutionState ??
        md.resolutionState ??
        rel.resolved ??
        md.resolved
    );
    if (resolutionState) {
      (rel as any).resolutionState = resolutionState;
      md.resolutionState = resolutionState;
    } else {
      delete (rel as any).resolutionState;
      if (md.resolutionState !== undefined) delete md.resolutionState;
    }
  }

  if (rel.type === RelationshipType.EXPORTS) {
    const reExportTarget = sanitizeString(
      rel.reExportTarget ?? md.reExportTarget ?? md.module ?? md.from,
      1024
    );
    const hasReExportTarget = Boolean(reExportTarget);

    const rawIsReExport = sanitizeBoolean(
      rel.isReExport ?? md.isReExport ?? md.reExport
    );
    const isReExport =
      rawIsReExport !== undefined
        ? rawIsReExport
        : hasReExportTarget
        ? true
        : undefined;

    if (typeof isReExport === "boolean") {
      rel.isReExport = isReExport;
      md.isReExport = isReExport;
    } else {
      delete rel.isReExport;
      if (md.isReExport !== undefined) delete md.isReExport;
    }

    if (hasReExportTarget && (isReExport === undefined || isReExport)) {
      rel.reExportTarget = reExportTarget!;
      md.reExportTarget = reExportTarget!;
    } else {
      delete rel.reExportTarget;
      if (md.reExportTarget !== undefined) delete md.reExportTarget;
    }
  }
  const language =
    normalizeLanguage(rel.language ?? md.language ?? md.lang) ?? undefined;
  if (language) {
    rel.language = language;
    md.language = language;
  } else {
    delete rel.language;
  }

  const symbolKind = normalizeSymbolKind(
    rel.symbolKind ?? md.symbolKind ?? md.kind
  );
  if (symbolKind) {
    rel.symbolKind = symbolKind;
    md.symbolKind = symbolKind;
    if (md.kind !== undefined) delete md.kind;
  } else {
    delete rel.symbolKind;
  }

  if (
    md.languageSpecific !== undefined &&
    (md.languageSpecific === null || typeof md.languageSpecific !== "object")
  ) {
    delete md.languageSpecific;
  }

  applyRegisteredAdapters(rel as GraphRelationship);

  const legacyMetadataKeys = [
    "alias",
    "module",
    "moduleSpecifier",
    "sourceModule",
    "importKind",
    "lang",
    "languageId",
    "language_id",
    "reExport",
  ];
  for (const key of legacyMetadataKeys) {
    if (Object.prototype.hasOwnProperty.call(md, key)) {
      delete (md as Record<string, unknown>)[key];
    }
  }

  const inferStructuralResolutionState = (): ResolutionState | undefined => {
    const classifyTarget = (): "entity" | "placeholder" | "external" | undefined => {
      const toRef: any = (rel as any).toRef;
      const refKind =
        toRef && typeof toRef.kind === "string"
          ? toRef.kind.toLowerCase()
          : undefined;
      if (
        refKind &&
        ["filesymbol", "entity", "file", "directory"].includes(refKind)
      ) {
        return "entity";
      }
      if (refKind === "external") {
        return "external";
      }
      if (refKind === "placeholder") {
        return "placeholder";
      }

      const toId = typeof rel.toEntityId === "string" ? rel.toEntityId : "";
      if (
        toId.startsWith("file:") ||
        toId.startsWith("sym:") ||
        toId.startsWith("dir:") ||
        toId.startsWith("entity:")
      ) {
        return "entity";
      }
      if (
        /^(import:|external:|package:|module:)/.test(toId) ||
        /^(class|interface|function|typealias):/.test(toId)
      ) {
        return "placeholder";
      }

      return undefined;
    };

    if (
      rel.type === RelationshipType.CONTAINS ||
      rel.type === RelationshipType.DEFINES
    ) {
      return "resolved";
    }

    const targetKind = classifyTarget();
    if (targetKind === "entity") return "resolved";
    if (targetKind === "external" || targetKind === "placeholder") {
      return "unresolved";
    }

    return undefined;
  };

  const resolutionStateFinal = normalizeResolutionState(
    (rel as any).resolutionState ??
      md.resolutionState ??
      inferStructuralResolutionState()
  );

  if (resolutionStateFinal) {
    (rel as any).resolutionState = resolutionStateFinal;
    md.resolutionState = resolutionStateFinal;
  } else if (typeof rel.resolved === "boolean") {
    const inferred = rel.resolved ? "resolved" : "unresolved";
    (rel as any).resolutionState = inferred;
    md.resolutionState = inferred;
  }

  const normalizedResolutionState = normalizeResolutionState(
    (rel as any).resolutionState ?? md.resolutionState
  );

  if (normalizedResolutionState) {
    (rel as any).resolutionState = normalizedResolutionState;
    md.resolutionState = normalizedResolutionState;
  } else {
    delete (rel as any).resolutionState;
    if (md.resolutionState !== undefined) delete md.resolutionState;
  }

  const resolvedFromState =
    normalizedResolutionState === "resolved"
      ? true
      : normalizedResolutionState === "unresolved"
      ? false
      : undefined;

  if (resolvedFromState !== undefined) {
    rel.resolved = resolvedFromState;
    md.resolved = resolvedFromState;
  } else if (!normalizedResolutionState && hadResolvedInput) {
    rel.resolved = resolvedFlag as boolean;
    md.resolved = resolvedFlag as boolean;
  } else if (!normalizedResolutionState && typeof rel.resolved === "boolean") {
    md.resolved = rel.resolved;
  } else {
    delete rel.resolved;
    if (md.resolved !== undefined) delete md.resolved;
  }

  if (typeof rel.confidence !== "number") {
    const resolutionState = (rel as any).resolutionState;
    const defaultConfidence = (() => {
      if (
        rel.type === RelationshipType.CONTAINS ||
        rel.type === RelationshipType.DEFINES
      ) {
        return 0.95;
      }
      if (resolutionState === "resolved") return 0.9;
      if (resolutionState === "partial") return 0.6;
      return 0.4;
    })();
    rel.confidence = defaultConfidence;
  }
  if (typeof md.confidence !== "number") {
    md.confidence = rel.confidence;
  }

  rel.id = canonicalStructuralRelationshipId(rel as GraphRelationship);
  return rel as GraphRelationship;
}

function canonicalStructuralRelationshipId(rel: GraphRelationship): string {
  const baseId = canonicalRelationshipId(rel.fromEntityId ?? "", rel);
  if (baseId.startsWith("time-rel_")) return baseId;
  if (baseId.startsWith("rel_")) {
    return `time-rel_${baseId.slice("rel_".length)}`;
  }
  return `time-rel_${crypto.createHash("sha1").update(baseId).digest("hex")}`;
}



registerStructuralAdapter(function typescriptAdapter(
  relationship: GraphRelationship & { metadata?: Record<string, any> }
) {
  const md = relationship.metadata || {};
  const candidates = collectLanguageCandidates(relationship);
  let detected = candidates.find((value) =>
    ["typescript", "ts", "tsx"].includes(value)
  );
  let detectionSource: string | undefined = detected;
  if (!detected) {
    detected = guessLanguageFromPathHints(relationship);
    detectionSource = detected;
  }

  let syntaxHint: string | undefined;
  if (detectionSource === "tsx") {
    syntaxHint = "tsx";
  } else if (detectionSource === "ts") {
    syntaxHint = "ts";
  }

  if (!syntaxHint) {
    const moduleCandidates = [
      relationship.modulePath,
      md.modulePath,
      md.module,
      md.sourceModule,
      md.path,
    ].filter((value): value is string => typeof value === "string");
    if (moduleCandidates.some((value) => value.toLowerCase().endsWith(".tsx"))) {
      syntaxHint = "tsx";
    } else if (
      moduleCandidates.some((value) => value.toLowerCase().endsWith(".ts"))
    ) {
      syntaxHint = "ts";
    }
  }

  if (detected && ["ts", "tsx", "typescript"].includes(detected)) {
    detected = "typescript";
    const existingLanguageSpecific =
      md.languageSpecific && typeof md.languageSpecific === "object"
        ? md.languageSpecific
        : {};
    const currentSyntax = existingLanguageSpecific?.syntax;
    const nextSyntax = ((): string | undefined => {
      if (typeof currentSyntax === "string" && currentSyntax.trim() !== "") {
        return currentSyntax.trim();
      }
      if (syntaxHint) return syntaxHint;
      return "ts";
    })();

    md.languageSpecific = {
      ...existingLanguageSpecific,
      ...(nextSyntax ? { syntax: nextSyntax } : {}),
    };
  }

  const applyLanguage = (value: string | undefined) => {
    if (!value) return;
    const normalized = value.trim().toLowerCase();
    if (!normalized) return;
    relationship.language = normalized;
    md.language = normalized;
  };

  if (detected) {
    applyLanguage(detected);
  } else {
    const fallback = [relationship.language, md.language].find(
      (value): value is string => typeof value === "string" && value.trim() !== ""
    );
    if (fallback) {
      applyLanguage(fallback);
    } else {
      delete relationship.language;
      delete md.language;
    }
  }

  if (
    (relationship.type === RelationshipType.IMPORTS ||
      relationship.type === RelationshipType.EXPORTS) &&
    !relationship.symbolKind
  ) {
    relationship.symbolKind = "module";
    md.symbolKind = "module";
  }
});

registerStructuralAdapter(function pythonAdapter(
  relationship: GraphRelationship & { metadata?: Record<string, any> }
) {
  const md = relationship.metadata || {};
  const candidates = collectLanguageCandidates(relationship);
  let detected = candidates.find((value) => ["python", "py"].includes(value));
  if (!detected) {
    detected = guessLanguageFromPathHints(relationship, "py");
  }
  if (detected) {
    relationship.language = "python";
    md.language = "python";
  }
});

registerStructuralAdapter(function goAdapter(
  relationship: GraphRelationship & { metadata?: Record<string, any> }
) {
  const md = relationship.metadata || {};
  const candidates = collectLanguageCandidates(relationship);
  let detected = candidates.find((value) => value === "go");
  if (!detected) {
    detected = guessLanguageFromPathHints(relationship, "go");
  }
  if (detected) {
    relationship.language = "go";
    md.language = "go";
  }
});

function collectLanguageCandidates(rel: GraphRelationship): string[] {
  const md: any = rel.metadata || {};
  const values = [
    rel.language,
    md.language,
    md.lang,
    md.languageId,
    md.language_id,
  ];
  return values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
}

function guessLanguageFromPathHints(
  rel: GraphRelationship,
  extensionHint?: string
): string | undefined {
  const md: any = rel.metadata || {};
  const candidates = [
    md.path,
    md.modulePath,
    rel.modulePath,
    rel.fromEntityId,
    rel.toEntityId,
  ]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLowerCase());

  const matchesExtension = (ext: string) =>
    candidates.some((candidate) => candidate.includes(`.${ext}`));

  if (!extensionHint && matchesExtension("ts")) return "typescript";
  if (!extensionHint && matchesExtension("tsx")) return "typescript";
  if (!extensionHint && matchesExtension("js")) return "javascript";
  if (extensionHint && matchesExtension(extensionHint)) {
    if (extensionHint === "py") return "python";
    if (extensionHint === "go") return "go";
  }
  return undefined;
}

================
File: services/structuralPersistence.ts
================
import {
  type GraphRelationship,
  RelationshipType,
  type StructuralImportType,
} from "../models/relationships.js";
import { normalizeStructuralRelationship } from "./RelationshipNormalizer.js";

export interface StructuralPersistenceFields {
  importAlias: string | null;
  importType: StructuralImportType | null;
  isNamespace: boolean | null;
  isReExport: boolean | null;
  reExportTarget: string | null;
  language: string | null;
  symbolKind: string | null;
  modulePath: string | null;
  resolutionState: string | null;
  importDepth: number | null;
  confidence: number | null;
  scope: string | null;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
}

const STRING_NORMALIZER = (value: unknown, max = 1024): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
};

const BOOLEAN_NORMALIZER = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  return null;
};

const NUMBER_NORMALIZER = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  return null;
};

const CONFIDENCE_NORMALIZER = (value: unknown): number | null => {
  let numeric: number | null = null;
  if (typeof value === "number" && Number.isFinite(value)) {
    numeric = value;
  } else if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) numeric = parsed;
  }
  if (numeric === null) return null;
  const clamped = Math.min(Math.max(numeric, 0), 1);
  return Number.isFinite(clamped) ? clamped : null;
};

const DATE_NORMALIZER = (value: unknown): string | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  return null;
};

const normalizeModulePathValue = (value: string | null): string | null => {
  if (!value) return null;
  let normalized = value.replace(/\\+/g, "/");
  normalized = normalized.replace(/\/{2,}/g, "/");
  if (normalized.length > 1) {
    normalized = normalized.replace(/\/+$/g, "");
    if (!normalized) {
      normalized = "/";
    }
  }
  return normalized;
};

const lowerCase = (value: string | null): string | null =>
  value ? value.toLowerCase() : null;

export const extractStructuralPersistenceFields = (
  topLevel: Record<string, any>,
  metadata: Record<string, any>
): StructuralPersistenceFields => {
  const pickString = (...keys: string[]): string | null => {
    for (const key of keys) {
      const candidate = STRING_NORMALIZER(topLevel[key] ?? metadata[key]);
      if (candidate) return candidate;
    }
    return null;
  };

  const pickBoolean = (...keys: string[]): boolean | null => {
    for (const key of keys) {
      const candidate = BOOLEAN_NORMALIZER(topLevel[key] ?? metadata[key]);
      if (candidate !== null) return candidate;
    }
    return null;
  };

  const pickNumber = (...keys: string[]): number | null => {
    for (const key of keys) {
      const candidate = NUMBER_NORMALIZER(topLevel[key] ?? metadata[key]);
      if (candidate !== null) return candidate;
    }
    return null;
  };

  const modulePathCandidate = pickString(
    "modulePath",
    "module",
    "moduleSpecifier",
    "sourceModule"
  );

  const resolutionStateCandidate = pickString("resolutionState");

  const importTypeCandidate = pickString("importType", "importKind", "kind");
  const importTypeNormalized = importTypeCandidate
    ? importTypeCandidate.toLowerCase() as StructuralImportType
    : null;
  const reExportTargetCandidate = pickString("reExportTarget");
  const reExportTargetNormalized = normalizeModulePathValue(
    reExportTargetCandidate
  );

  return {
    importAlias: pickString("importAlias", "alias"),
    importType: importTypeNormalized,
    isNamespace: pickBoolean("isNamespace"),
    isReExport: pickBoolean("isReExport", "reExport"),
    reExportTarget:
      reExportTargetNormalized !== null
        ? reExportTargetNormalized
        : reExportTargetCandidate,
    language: lowerCase(pickString("language", "lang", "languageId")),
    symbolKind: lowerCase(pickString("symbolKind", "kind")),
    modulePath: normalizeModulePathValue(modulePathCandidate),
    resolutionState: resolutionStateCandidate
      ? lowerCase(resolutionStateCandidate)
      : null,
    importDepth: pickNumber("importDepth"),
    confidence:
      CONFIDENCE_NORMALIZER(topLevel.confidence ?? metadata.confidence) ?? null,
    scope: lowerCase(pickString("scope")),
    firstSeenAt: DATE_NORMALIZER(topLevel.firstSeenAt ?? metadata.firstSeenAt),
    lastSeenAt: DATE_NORMALIZER(topLevel.lastSeenAt ?? metadata.lastSeenAt),
  };
};

const cloneMetadata = (value: unknown): Record<string, any> => {
  if (value == null) return {};

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return {};
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") {
        return JSON.parse(JSON.stringify(parsed));
      }
    } catch {
      return {};
    }
    return {};
  }

  if (typeof value === "object") {
    return JSON.parse(JSON.stringify(value));
  }

  return {};
};

const sortObject = (value: any): any => {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === "object") {
    const sorted = Object.keys(value)
      .sort()
      .reduce<Record<string, any>>((acc, key) => {
        acc[key] = sortObject(value[key]);
        return acc;
      }, {});
    return sorted;
  }
  return value;
};

export const stableStringifyMetadata = (value: Record<string, any>): string =>
  JSON.stringify(sortObject(value ?? {}));

export interface StructuralRelationshipSnapshot {
  id: string;
  type: RelationshipType | string;
  fromId: string;
  toId: string;
  created?: string | Date | null;
  lastModified?: string | Date | null;
  version?: number | null;
  importAlias?: unknown;
  importType?: unknown;
  isNamespace?: unknown;
  isReExport?: unknown;
  reExportTarget?: unknown;
  language?: unknown;
  symbolKind?: unknown;
  modulePath?: unknown;
  resolutionState?: unknown;
  importDepth?: unknown;
  confidence?: unknown;
  scope?: unknown;
  firstSeenAt?: unknown;
  lastSeenAt?: unknown;
  metadata?: unknown;
}

export interface StructuralBackfillUpdate {
  payload: {
    id: string;
    importAlias: string | null;
    importType: StructuralImportType | null;
    isNamespace: boolean | null;
    isReExport: boolean | null;
    reExportTarget: string | null;
    language: string | null;
    symbolKind: string | null;
    modulePath: string | null;
    resolutionState: string | null;
    importDepth: number | null;
    confidence: number | null;
    scope: string | null;
    firstSeenAt: string | null;
    lastSeenAt: string | null;
    metadata: string;
  };
  changedFields: string[];
}

const asDate = (value: string | Date | null | undefined): Date => {
  if (value instanceof Date) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
};

const stringOrNull = (value: unknown): string | null =>
  STRING_NORMALIZER(value) ?? null;

const booleanOrNull = (value: unknown): boolean | null =>
  BOOLEAN_NORMALIZER(value);

const numberOrNull = (value: unknown): number | null =>
  NUMBER_NORMALIZER(value);

export const computeStructuralBackfillUpdate = (
  snapshot: StructuralRelationshipSnapshot
): StructuralBackfillUpdate | null => {
  const metadataObject = cloneMetadata(snapshot.metadata);

  const relationship: GraphRelationship = {
    id: snapshot.id,
    fromEntityId: snapshot.fromId,
    toEntityId: snapshot.toId,
    type: (snapshot.type as RelationshipType) ?? RelationshipType.IMPORTS,
    created: asDate(snapshot.created ?? null),
    lastModified: asDate(snapshot.lastModified ?? null),
    version: typeof snapshot.version === "number" ? snapshot.version : 1,
    metadata: metadataObject,
  } as GraphRelationship;

  const assign = (key: string, value: unknown): void => {
    if (value !== undefined && value !== null) {
      (relationship as any)[key] = value;
    }
  };

  assign("importAlias", snapshot.importAlias);
  assign("importType", snapshot.importType);
  assign("isNamespace", snapshot.isNamespace);
  assign("isReExport", snapshot.isReExport);
  assign("reExportTarget", snapshot.reExportTarget);
  assign("language", snapshot.language);
  assign("symbolKind", snapshot.symbolKind);
  assign("modulePath", snapshot.modulePath);
  assign("resolutionState", snapshot.resolutionState);
  assign("importDepth", snapshot.importDepth);

  const normalized = normalizeStructuralRelationship(relationship);
  const normalizedMetadata = cloneMetadata(normalized.metadata);

  const expected = extractStructuralPersistenceFields(
    normalized as any,
    normalizedMetadata
  );

  const existing = {
    importAlias: stringOrNull(snapshot.importAlias),
    importType: stringOrNull(snapshot.importType) as StructuralImportType | null,
    isNamespace: booleanOrNull(snapshot.isNamespace),
    isReExport: booleanOrNull(snapshot.isReExport),
    reExportTarget: stringOrNull(snapshot.reExportTarget),
    language: lowerCase(stringOrNull(snapshot.language)),
    symbolKind: lowerCase(stringOrNull(snapshot.symbolKind)),
    modulePath: normalizeModulePathValue(stringOrNull(snapshot.modulePath)),
    resolutionState: lowerCase(stringOrNull(snapshot.resolutionState)),
    importDepth: numberOrNull(snapshot.importDepth),
    confidence: CONFIDENCE_NORMALIZER(snapshot.confidence ?? null),
    scope: lowerCase(stringOrNull(snapshot.scope)),
    firstSeenAt: DATE_NORMALIZER(snapshot.firstSeenAt ?? null),
    lastSeenAt: DATE_NORMALIZER(snapshot.lastSeenAt ?? null),
  } satisfies StructuralPersistenceFields;

  const changedFields: string[] = [];

  (Object.keys(expected) as Array<keyof StructuralPersistenceFields>).forEach(
    (key) => {
      if (expected[key] !== existing[key]) {
        changedFields.push(key);
      }
    }
  );

  const expectedMetadataJson = stableStringifyMetadata(normalizedMetadata);
  const existingMetadataJson = stableStringifyMetadata(metadataObject);
  if (expectedMetadataJson !== existingMetadataJson) {
    changedFields.push("metadata");
  }

  if (changedFields.length === 0) {
    return null;
  }

  return {
    payload: {
      id: snapshot.id,
      importAlias: expected.importAlias,
      importType: expected.importType,
      isNamespace: expected.isNamespace,
      isReExport: expected.isReExport,
      reExportTarget: expected.reExportTarget,
      language: expected.language,
      symbolKind: expected.symbolKind,
      modulePath: expected.modulePath,
      resolutionState: expected.resolutionState,
      importDepth: expected.importDepth,
      confidence: expected.confidence,
      scope: expected.scope,
      firstSeenAt: expected.firstSeenAt,
      lastSeenAt: expected.lastSeenAt,
      metadata: expectedMetadataJson,
    },
    changedFields,
  };
};

================
File: index.ts
================
export * from './facades/index.js';
export * from './models/entities.js';
export * from './models/relationships.js';
export * from './models/ogm/BaseModels.js';
export * from './models/ogm/EntityModels.js';
export * from './models/ogm/RelationshipModels.js';



================================================================
End of Codebase
================================================================

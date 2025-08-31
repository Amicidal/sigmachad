/**
 * Knowledge Graph Service for Memento
 * Manages graph operations, vector embeddings, and entity relationships
 */

import { DatabaseService } from './DatabaseService.js';
import {
  Entity,
  CodebaseEntity,
  Spec,
  Test,
  Change,
  Session,
  File,
  FunctionSymbol,
  ClassSymbol
} from '../models/entities.js';
import {
  GraphRelationship,
  RelationshipType,
  RelationshipQuery,
  PathQuery,
  TraversalQuery
} from '../models/relationships.js';
import { GraphSearchRequest, GraphExamples, DependencyAnalysis } from '../models/types.js';

export class KnowledgeGraphService {
  constructor(private db: DatabaseService) {}

  async initialize(): Promise<void> {
    // Ensure database is ready
    await this.db.initialize();
    
    // Verify graph indexes exist
    try {
      const indexCheck = await this.db.falkordbQuery(
        'CALL db.indexes()',
        {}
      );
      
      if (indexCheck && indexCheck.length > 0) {
        console.log(`✅ Graph indexes verified: ${indexCheck.length} indexes found`);
      } else {
        console.log('⚠️ No graph indexes found, they will be created on next setupDatabase call');
      }
    } catch (error) {
      // Indexes might not be queryable yet, this is okay
      console.log('📊 Graph indexes will be verified on first query');
    }
  }

  private hasCodebaseProperties(entity: Entity): boolean {
    return 'path' in entity && 'hash' in entity && 'language' in entity &&
           'lastModified' in entity && 'created' in entity;
  }

  // Entity CRUD operations
  async createEntity(entity: Entity): Promise<void> {
    const nodeId = entity.id;
    const labels = this.getEntityLabels(entity);
    const properties = this.sanitizeProperties(entity);

    // Create node in FalkorDB
    const createQuery = `
      CREATE (n${labels.join(':')} {
        id: $id,
        path: $path,
        hash: $hash,
        language: $language,
        lastModified: $lastModified,
        created: $created,
        metadata: $metadata
      })
    `;

    // Only include path/hash/language if the entity has them (codebase entities)
    const hasCodebaseProps = this.hasCodebaseProperties(entity);

    await this.db.falkordbQuery(createQuery, {
      id: nodeId,
      path: hasCodebaseProps ? (entity as any).path : '',
      hash: hasCodebaseProps ? (entity as any).hash : '',
      language: hasCodebaseProps ? (entity as any).language : '',
      lastModified: hasCodebaseProps ? (entity as any).lastModified.toISOString() : new Date().toISOString(),
      created: hasCodebaseProps ? (entity as any).created.toISOString() : new Date().toISOString(),
      metadata: JSON.stringify((entity as any).metadata || {}),
    });

    // Create vector embedding for semantic search
    await this.createEmbedding(entity);

    console.log(`✅ Created entity: ${hasCodebaseProps ? (entity as any).path : entity.id} (${entity.type})`);
  }

  async getEntity(entityId: string): Promise<Entity | null> {
    const query = `
      MATCH (n {id: $id})
      RETURN n
    `;

    const result = await this.db.falkordbQuery(query, { id: entityId });

    if (!result || result.length === 0) {
      return null;
    }

    return this.parseEntityFromGraph(result[0]);
  }

  async updateEntity(entityId: string, updates: Partial<Entity>): Promise<void> {
    const setClause = Object.keys(updates)
      .map(key => `n.${key} = $${key}`)
      .join(', ');

    const query = `
      MATCH (n {id: $id})
      SET ${setClause}
      RETURN n
    `;

    const params = { id: entityId, ...updates };
    await this.db.falkordbQuery(query, params);

    // Update vector embedding
    const updatedEntity = await this.getEntity(entityId);
    if (updatedEntity) {
      await this.updateEmbedding(updatedEntity);
    }
  }

  async deleteEntity(entityId: string): Promise<void> {
    // Delete relationships first
    await this.db.falkordbQuery(`
      MATCH (n {id: $id})-[r]-()
      DELETE r
    `, { id: entityId });

    // Delete node
    await this.db.falkordbQuery(`
      MATCH (n {id: $id})
      DELETE n
    `, { id: entityId });

    // Delete vector embedding
    await this.deleteEmbedding(entityId);
  }

  // Relationship operations
  async createRelationship(relationship: GraphRelationship): Promise<void> {
    const query = `
      MATCH (a {id: $fromId}), (b {id: $toId})
      CREATE (a)-[r:${relationship.type} {
        id: $id,
        created: $created,
        lastModified: $lastModified,
        version: $version,
        metadata: $metadata
      }]->(b)
    `;

    await this.db.falkordbQuery(query, {
      fromId: relationship.fromEntityId,
      toId: relationship.toEntityId,
      id: relationship.id,
      created: relationship.created.toISOString(),
      lastModified: relationship.lastModified.toISOString(),
      version: relationship.version,
      metadata: JSON.stringify(relationship.metadata || {}),
    });
  }

  async getRelationships(query: RelationshipQuery): Promise<GraphRelationship[]> {
    let matchClause = 'MATCH (a)-[r]-(b)';
    const whereClause = [];
    const params: any = {};

    if (query.fromEntityId) {
      whereClause.push('a.id = $fromId');
      params.fromId = query.fromEntityId;
    }

    if (query.toEntityId) {
      whereClause.push('b.id = $toId');
      params.toId = query.toEntityId;
    }

    if (query.type && query.type.length > 0) {
      const types = Array.isArray(query.type) ? query.type : [query.type];
      whereClause.push(`type(r) IN [${types.map(t => '$' + t).join(', ')}]`);
      types.forEach((type, index) => {
        params[type] = type;
      });
    }

    if (query.since) {
      whereClause.push('r.created >= $since');
      params.since = query.since.toISOString();
    }

    const fullQuery = `
      ${matchClause}
      ${whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : ''}
      RETURN r, a.id as fromId, b.id as toId
      ${query.limit ? 'LIMIT $limit' : ''}
      ${query.offset ? 'SKIP $offset' : ''}
    `;

    if (query.limit) params.limit = query.limit;
    if (query.offset) params.offset = query.offset;

    const result = await this.db.falkordbQuery(fullQuery, params);
    return result.map((row: any) => this.parseRelationshipFromGraph(row));
  }

  // Graph search operations
  async search(request: GraphSearchRequest): Promise<Entity[]> {
    // For semantic search, use vector similarity
    if (request.searchType === 'semantic') {
      return this.semanticSearch(request);
    }

    // For structural search, use graph traversal
    return this.structuralSearch(request);
  }

  private async semanticSearch(request: GraphSearchRequest): Promise<Entity[]> {
    // Get vector embeddings for the query
    const embeddings = await this.generateEmbedding({
      content: request.query,
      type: 'search_query'
    } as any);

    // Search in Qdrant
    const searchResult = await this.db.qdrant.search('code_embeddings', {
      vector: embeddings,
      limit: request.limit || 10,
      with_payload: true,
      with_vector: false,
    });

    // Get entities from graph database
    const searchResultData = searchResult as any;
    const points = searchResultData.points || searchResultData.results || [];
    const entities: Entity[] = [];

    for (const point of points) {
      // Get the actual entity ID from the payload, not the numeric ID
      const entityId = point.payload?.entityId;
      if (entityId) {
        const entity = await this.getEntity(entityId);
        if (entity) {
          entities.push(entity);
        }
      }
    }

    return entities;
  }

  private async structuralSearch(request: GraphSearchRequest): Promise<Entity[]> {
    let query = 'MATCH (n)';
    const whereClause = [];
    const params: any = {};

    // Add entity type filters
    if (request.entityTypes && request.entityTypes.length > 0) {
      whereClause.push(`n.type IN [${request.entityTypes.map(t => '$' + t).join(', ')}]`);
      request.entityTypes.forEach((type, index) => {
        params[type] = type;
      });
    }

    // Add path filters
    if (request.filters?.path) {
      whereClause.push('n.path CONTAINS $path');
      params.path = request.filters.path;
    }

    // Add language filters
    if (request.filters?.language) {
      whereClause.push('n.language = $language');
      params.language = request.filters.language;
    }

    // Add time filters
    if (request.filters?.lastModified?.since) {
      whereClause.push('n.lastModified >= $since');
      params.since = request.filters.lastModified.since.toISOString();
    }

    if (request.filters?.lastModified?.until) {
      whereClause.push('n.lastModified <= $until');
      params.until = request.filters.lastModified.until.toISOString();
    }

    const fullQuery = `
      ${query}
      ${whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : ''}
      RETURN n
      ${request.limit ? 'LIMIT $limit' : ''}
    `;

    if (request.limit) params.limit = request.limit;

    const result = await this.db.falkordbQuery(fullQuery, params);
    return result.map((row: any) => this.parseEntityFromGraph(row));
  }

  async getEntityExamples(entityId: string): Promise<GraphExamples> {
    const entity = await this.getEntity(entityId);
    if (!entity) {
      throw new Error(`Entity ${entityId} not found`);
    }

    // Get usage examples from relationships
    const usageRelationships = await this.getRelationships({
      toEntityId: entityId,
      type: [RelationshipType.CALLS, RelationshipType.REFERENCES, RelationshipType.USES],
      limit: 10,
    });

    const usageExamples = await Promise.all(
      usageRelationships.map(async (rel) => {
        const caller = await this.getEntity(rel.fromEntityId);
        if (caller && this.hasCodebaseProperties(caller)) {
          return {
            context: `${(caller as any).path}:${rel.type}`,
            code: `// Usage in ${(caller as any).path}`,
            file: (caller as any).path,
            line: 1, // Would need to be determined from AST
          };
        }
        return null;
      })
    ).then(examples => examples.filter((ex): ex is NonNullable<typeof ex> => ex !== null));

    // Get test examples
    const testRelationships = await this.getRelationships({
      toEntityId: entityId,
      type: RelationshipType.TESTS,
      limit: 5,
    });

    const testExamples = await Promise.all(
      testRelationships.map(async (rel) => {
        const test = await this.getEntity(rel.fromEntityId);
        if (test && test.type === 'test' && this.hasCodebaseProperties(entity)) {
          return {
            testId: test.id,
            testName: (test as Test).testType,
            testCode: `// Test for ${(entity as any).path}`,
            assertions: [],
          };
        }
        return null;
      })
    ).then(examples => examples.filter((ex): ex is NonNullable<typeof ex> => ex !== null));

    return {
      entityId,
      signature: this.getEntitySignature(entity),
      usageExamples,
      testExamples,
      relatedPatterns: [], // Would be populated from usage analysis
    };
  }

  async getEntityDependencies(entityId: string): Promise<DependencyAnalysis> {
    const entity = await this.getEntity(entityId);
    if (!entity) {
      throw new Error(`Entity ${entityId} not found`);
    }

    // Get direct dependencies
    const directDeps = await this.getRelationships({
      fromEntityId: entityId,
      type: [RelationshipType.CALLS, RelationshipType.REFERENCES, RelationshipType.USES, RelationshipType.DEPENDS_ON],
    });

    // Get reverse dependencies
    const reverseDeps = await this.getRelationships({
      toEntityId: entityId,
      type: [RelationshipType.CALLS, RelationshipType.REFERENCES, RelationshipType.USES, RelationshipType.DEPENDS_ON],
    });

    return {
      entityId,
      directDependencies: directDeps.map(rel => ({
        entity: null as any, // Would need to fetch entity
        relationship: rel.type,
        strength: 1,
      })),
      indirectDependencies: [],
      reverseDependencies: reverseDeps.map(rel => ({
        entity: null as any,
        relationship: rel.type,
        impact: 'medium' as const,
      })),
      circularDependencies: [],
    };
  }

  // Path finding and traversal
  async findPaths(query: PathQuery): Promise<any[]> {
    let cypherQuery: string;
    const params: any = { startId: query.startEntityId };
    
    // Build the query based on whether relationship types are specified
    if (query.relationshipTypes && query.relationshipTypes.length > 0) {
      // FalkorDB syntax for relationship types with depth
      const relTypes = query.relationshipTypes.join('|');
      cypherQuery = `
        MATCH path = (start {id: $startId})-[:${relTypes}*1..${query.maxDepth || 5}]-(end ${query.endEntityId ? '{id: $endId}' : ''})
        RETURN path
        LIMIT 10
      `;
    } else {
      // No specific relationship types
      cypherQuery = `
        MATCH path = (start {id: $startId})-[*1..${query.maxDepth || 5}]-(end ${query.endEntityId ? '{id: $endId}' : ''})
        RETURN path
        LIMIT 10
      `;
    }

    if (query.endEntityId) {
      params.endId = query.endEntityId;
    }

    const result = await this.db.falkordbQuery(cypherQuery, params);
    return result;
  }

  async traverseGraph(query: TraversalQuery): Promise<Entity[]> {
    let cypherQuery: string;
    const params: any = { startId: query.startEntityId };
    
    if (query.relationshipTypes && query.relationshipTypes.length > 0) {
      const relTypes = query.relationshipTypes.join('|');
      cypherQuery = `
        MATCH (start {id: $startId})-[:${relTypes}*1..${query.maxDepth || 3}]-(connected)
        RETURN DISTINCT connected
        LIMIT ${query.limit || 50}
      `;
    } else {
      cypherQuery = `
        MATCH (start {id: $startId})-[*1..${query.maxDepth || 3}]-(connected)
        RETURN DISTINCT connected
        LIMIT ${query.limit || 50}
      `;
    }

    const result = await this.db.falkordbQuery(cypherQuery, params);
    return result.map((row: any) => this.parseEntityFromGraph(row));
  }

  // Vector embedding operations
  private async createEmbedding(entity: Entity): Promise<void> {
    const content = this.getEntityContentForEmbedding(entity);
    const embedding = await this.generateEmbedding(content);

    const collection = this.getEmbeddingCollection(entity);
    const hasCodebaseProps = this.hasCodebaseProperties(entity);
    
    // Convert string ID to numeric ID for Qdrant
    const numericId = this.stringToNumericId(entity.id);
    
    await this.db.qdrant.upsert(collection, {
      points: [{
        id: numericId,
        vector: embedding,
        payload: {
          entityId: entity.id,
          type: entity.type,
          path: hasCodebaseProps ? (entity as any).path : '',
          language: hasCodebaseProps ? (entity as any).language : '',
          lastModified: hasCodebaseProps ? (entity as any).lastModified.toISOString() : new Date().toISOString(),
        },
      }],
    });
  }

  private async updateEmbedding(entity: Entity): Promise<void> {
    await this.deleteEmbedding(entity.id);
    await this.createEmbedding(entity);
  }

  private async deleteEmbedding(entityId: string): Promise<void> {
    // Use the same filter for both collections to delete by entityId in payload
    const filter = {
      filter: {
        must: [
          {
            key: 'entityId',
            match: { value: entityId },
          },
        ],
      },
    };
    
    try {
      await this.db.qdrant.delete('code_embeddings', filter);
    } catch (error) {
      // Collection might not exist or no matching points
    }
    
    try {
      await this.db.qdrant.delete('documentation_embeddings', filter);
    } catch (error) {
      // Collection might not exist or no matching points
    }
  }

  private async generateEmbedding(content: string): Promise<number[]> {
    // For now, return a mock embedding
    // In production, this would use OpenAI Ada or similar
    return Array.from({ length: 1536 }, () => Math.random() - 0.5);
  }

  // Helper methods
  private getEntityLabels(entity: Entity): string[] {
    const labels = [entity.type];

    // Add specific labels based on entity type
    if (entity.type === 'file') {
      const fileEntity = entity as File;
      if (fileEntity.isTest) labels.push('test' as any);
      if (fileEntity.isConfig) labels.push('config' as any);
    }

    return labels;
  }

  private sanitizeProperties(entity: Entity): Record<string, any> {
    const props = { ...entity };
    // Remove complex objects that can't be stored in graph database
    if ('metadata' in props) {
      delete props.metadata;
    }
    return props;
  }

  private parseEntityFromGraph(graphNode: any): Entity {
    // Parse entity from FalkorDB result format
    // This would need to be adapted based on actual FalkorDB response format
    return graphNode as Entity;
  }

  private parseRelationshipFromGraph(graphResult: any): GraphRelationship {
    // Parse relationship from FalkorDB result format
    return graphResult.r as GraphRelationship;
  }

  private getEntityContentForEmbedding(entity: Entity): string {
    const hasCodebaseProps = this.hasCodebaseProperties(entity);
    const path = hasCodebaseProps ? (entity as any).path : entity.id;

    switch (entity.type) {
      case 'symbol':
        const symbolEntity = entity as any;
        if (symbolEntity.kind === 'function') {
          return `${path} ${symbolEntity.signature}`;
        } else if (symbolEntity.kind === 'class') {
          return `${path} ${symbolEntity.name}`;
        }
        return `${path} ${symbolEntity.signature}`;
      case 'file':
        return `${path} ${(entity as File).extension}`;
      default:
        return `${path} ${entity.type}`;
    }
  }

  private getEmbeddingCollection(entity: Entity): string {
    return entity.type === 'documentation' ? 'documentation_embeddings' : 'code_embeddings';
  }

  private getEntitySignature(entity: Entity): string {
    switch (entity.type) {
      case 'symbol':
        const symbolEntity = entity as any;
        if (symbolEntity.kind === 'function') {
          return symbolEntity.signature;
        } else if (symbolEntity.kind === 'class') {
          return `class ${symbolEntity.name}`;
        }
        return symbolEntity.signature;
      default:
        return this.hasCodebaseProperties(entity) ? (entity as any).path : entity.id;
    }
  }
  
  private stringToNumericId(stringId: string): number {
    // Create a numeric hash from string ID for Qdrant compatibility
    let hash = 0;
    for (let i = 0; i < stringId.length; i++) {
      const char = stringId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Ensure positive number
    return Math.abs(hash);
  }
}

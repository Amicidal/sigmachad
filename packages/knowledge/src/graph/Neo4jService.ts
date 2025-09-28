/**
 * Neo4j Base Service
 * Facade that orchestrates Neo4j operations through modular components
 * Refactored into CypherExecutor, VectorService, and GdsService for better maintainability
 */

import { EventEmitter } from 'events';
import * as neo4j from 'neo4j-driver';
import {
  CypherExecutor,
  Neo4jConfig,
  CypherQueryOptions,
  BenchmarkOptions,
} from './CypherExecutor';
import { GdsService, GdsAlgorithmConfig, PathExpandConfig } from './GdsService';
import {
  VectorService,
  VectorSearchOptions,
  VectorIndexConfig,
} from '../embeddings/VectorService';

export {
  Neo4jConfig,
  CypherQueryOptions,
  VectorSearchOptions,
  GdsAlgorithmConfig,
  VectorIndexConfig,
  PathExpandConfig,
  BenchmarkOptions,
};

export class Neo4jService extends EventEmitter {
  private executor: CypherExecutor;
  private vectorService: VectorService;
  private gdsService: GdsService;

  constructor(config: Neo4jConfig) {
    super();

    // Initialize modular services
    this.executor = new CypherExecutor(config);
    this.vectorService = new VectorService(this.executor);
    this.gdsService = new GdsService(this.executor);

    // Forward events from sub-services
    this.executor.on('error', (data) => this.emit('error', data));
    this.executor.on('transaction:error', (data) =>
      this.emit('transaction:error', data)
    );
    this.executor.on('closed', () => this.emit('closed'));

    this.vectorService.on('vectorIndex:created', (data) =>
      this.emit('vectorIndex:created', data)
    );
    this.vectorService.on('vectors:upserted', (data) =>
      this.emit('vectors:upserted', data)
    );
    this.vectorService.on('embedding:deleted', (data) =>
      this.emit('embedding:deleted', data)
    );

    this.gdsService.on('algorithm:completed', (data) =>
      this.emit('algorithm:completed', data)
    );
    this.gdsService.on('algorithm:error', (data) =>
      this.emit('algorithm:error', data)
    );
    this.gdsService.on('pathExpansion:completed', (data) =>
      this.emit('pathExpansion:completed', data)
    );
    this.gdsService.on('pathExpansion:error', (data) =>
      this.emit('pathExpansion:error', data)
    );
    this.gdsService.on('shortestPath:found', (data) =>
      this.emit('shortestPath:found', data)
    );
    this.gdsService.on('shortestPath:error', (data) =>
      this.emit('shortestPath:error', data)
    );
    this.gdsService.on('namedGraph:created', (data) =>
      this.emit('namedGraph:created', data)
    );
    this.gdsService.on('namedGraph:dropped', (data) =>
      this.emit('namedGraph:dropped', data)
    );
  }

  /**
   * Execute a Cypher query with parameters
   */
  async executeCypher(
    query: string,
    params: Record<string, any> = {},
    options: CypherQueryOptions = {}
  ): Promise<any[]> {
    return this.executor.executeCypher(query, params, options);
  }

  /**
   * Execute multiple queries in a transaction
   */
  async executeTransaction(
    queries: Array<{ query: string; params?: Record<string, any> }>,
    options: CypherQueryOptions = {}
  ): Promise<any[]> {
    return this.executor.executeTransaction(queries, options);
  }

  /**
   * Call an APOC procedure
   */
  async callApoc(
    procedure: string,
    params: Record<string, any> = {},
    options: CypherQueryOptions = {}
  ): Promise<any[]> {
    const query = `CALL ${procedure}`;
    return this.executeCypher(query, params, options);
  }

  /**
   * Run a GDS algorithm
   */
  async runGdsAlgorithm(
    algorithm: string,
    config: GdsAlgorithmConfig & Record<string, any>,
    options: CypherQueryOptions = {}
  ): Promise<any[]> {
    const query = `CALL ${algorithm}(${this.buildGdsConfigString(config)})`;
    return this.executeCypher(query, {}, options);
  }

  /**
   * Create or update a vector index
   */
  async createVectorIndex(
    indexName: string,
    label: string,
    propertyKey: string,
    dimensions: number,
    similarity: 'euclidean' | 'cosine' = 'cosine'
  ): Promise<void> {
    const query = `
      CREATE VECTOR INDEX ${indexName} IF NOT EXISTS
      FOR (n:${label})
      ON (n.${propertyKey})
      OPTIONS {
        indexConfig: {
          \`vector.dimensions\`: ${dimensions},
          \`vector.similarity_function\`: '${similarity}'
        }
      }
    `;
    await this.executeCypher(query);
  }

  /**
   * Upsert vectors to Neo4j nodes
   */
  async upsertVectors(
    label: string,
    vectors: Array<{
      id: string;
      vector: number[];
      properties?: Record<string, any>;
    }>
  ): Promise<void> {
    const query = `
      UNWIND $vectors AS item
      MERGE (n:${label} {id: item.id})
      SET n.embedding = item.vector
      SET n += item.properties
    `;

    const params = {
      vectors: vectors.map((v) => ({
        id: v.id,
        vector: v.vector,
        properties: v.properties || {},
      })),
    };

    await this.executeCypher(query, params);
  }

  /**
   * Search vectors using Neo4j's native vector similarity
   */
  async searchVectors(
    indexName: string,
    queryVector: number[],
    options: VectorSearchOptions = {}
  ): Promise<any[]> {
    const limit = options.limit || 10;
    const minScore = options.minScore || 0.0;

    let query = `
      CALL db.index.vector.queryNodes($indexName, $k, $queryVector)
      YIELD node, score
      WHERE score >= $minScore
    `;

    if (options.filter) {
      const filterClauses = Object.entries(options.filter)
        .map(([key, value]) => `node.${key} = $filter_${key}`)
        .join(' AND ');
      query += ` AND ${filterClauses}`;
    }

    query += `
      RETURN node, score
      ORDER BY score DESC
      LIMIT $limit
    `;

    const params: any = {
      indexName,
      k: limit * 2, // Get more candidates for filtering
      queryVector,
      minScore,
      limit,
    };

    if (options.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        params[`filter_${key}`] = value;
      });
    }

    return this.executeCypher(query, params);
  }

  /**
   * Run APOC text search (fuzzy, full-text)
   */
  async apocTextSearch(
    label: string,
    property: string,
    searchText: string,
    options: { fuzzy?: boolean; limit?: number } = {}
  ): Promise<any[]> {
    if (options.fuzzy) {
      const query = `
        MATCH (n:${label})
        WITH n, apoc.text.levenshteinSimilarity(n.${property}, $searchText) AS similarity
        WHERE similarity > 0.7
        RETURN n, similarity
        ORDER BY similarity DESC
        LIMIT $limit
      `;
      return this.executeCypher(query, {
        searchText,
        limit: options.limit || 20,
      });
    } else {
      const query = `
        MATCH (n:${label})
        WHERE n.${property} CONTAINS $searchText
        RETURN n
        LIMIT $limit
      `;
      return this.executeCypher(query, {
        searchText,
        limit: options.limit || 50,
      });
    }
  }

  /**
   * Use APOC path expansion for traversals
   */
  async apocPathExpand(
    startNodeId: string,
    relationshipFilter: string,
    maxDepth: number,
    options: { labelFilter?: string; uniqueness?: string } = {}
  ): Promise<any[]> {
    const query = `
      MATCH (start {id: $startId})
      CALL apoc.path.expand(
        start,
        $relFilter,
        $labelFilter,
        1,
        $maxDepth,
        $uniqueness
      ) YIELD path
      RETURN path
    `;

    return this.executeCypher(query, {
      startId: startNodeId,
      relFilter: relationshipFilter,
      labelFilter: options.labelFilter || null,
      maxDepth,
      uniqueness: options.uniqueness || 'RELATIONSHIP_GLOBAL',
    });
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<any> {
    const queries = [
      { name: 'nodes', query: 'MATCH (n) RETURN count(n) as count' },
      {
        name: 'relationships',
        query: 'MATCH ()-[r]->() RETURN count(r) as count',
      },
      {
        name: 'labels',
        query: 'CALL db.labels() YIELD label RETURN collect(label) as labels',
      },
      {
        name: 'types',
        query:
          'CALL db.relationshipTypes() YIELD relationshipType RETURN collect(relationshipType) as types',
      },
      {
        name: 'indexes',
        query:
          'SHOW INDEXES YIELD name, type, labelsOrTypes, properties RETURN collect({name: name, type: type, labels: labelsOrTypes, properties: properties}) as indexes',
      },
    ];

    const stats: any = {};
    for (const { name, query } of queries) {
      try {
        const result = await this.executeCypher(query);
        stats[name] =
          result[0]?.[
            name === 'nodes' || name === 'relationships' ? 'count' : name
          ] || 0;
      } catch (error) {
        stats[name] = 'unavailable';
      }
    }
    return stats;
  }

  /**
   * Create indexes for common queries
   */
  async createCommonIndexes(): Promise<void> {
    const indexes = [
      'CREATE INDEX entity_id IF NOT EXISTS FOR (n:Entity) ON (n.id)',
      'CREATE INDEX entity_type IF NOT EXISTS FOR (n:Entity) ON (n.type)',
      'CREATE INDEX entity_path IF NOT EXISTS FOR (n:Entity) ON (n.path)',
      'CREATE INDEX entity_name IF NOT EXISTS FOR (n:Entity) ON (n.name)',
      'CREATE INDEX file_path IF NOT EXISTS FOR (n:File) ON (n.path)',
      'CREATE INDEX symbol_name IF NOT EXISTS FOR (n:Symbol) ON (n.name)',
      'CREATE INDEX symbol_path IF NOT EXISTS FOR (n:Symbol) ON (n.path)',
      'CREATE INDEX version_entity IF NOT EXISTS FOR (n:Version) ON (n.entityId)',
      'CREATE INDEX checkpoint_id IF NOT EXISTS FOR (n:Checkpoint) ON (n.id)',
    ];

    for (const index of indexes) {
      try {
        await this.executeCypher(index);
      } catch (error) {
        // Index might already exist or syntax might differ
        console.warn(`Failed to create index: ${index}`, error);
      }
    }
  }

  /**
   * Convert Neo4j values to JavaScript values
   */
  private convertNeo4jValue(value: any): any {
    if (value === null || value === undefined) return value;
    if (neo4j.isInt(value)) return value.toNumber();
    if (neo4j.isDate(value)) return value.toString();
    if (neo4j.isDateTime(value)) return new Date(value.toString());
    if (neo4j.isNode(value)) return this.convertNode(value);
    if (neo4j.isRelationship(value)) return this.convertRelationship(value);
    if (neo4j.isPath(value)) return this.convertPath(value);
    if (Array.isArray(value))
      return value.map((v) => this.convertNeo4jValue(v));
    if (typeof value === 'object') {
      const converted: any = {};
      for (const [k, v] of Object.entries(value)) {
        converted[k] = this.convertNeo4jValue(v);
      }
      return converted;
    }
    return value;
  }

  private convertNode(node: any): any {
    return {
      id: node.identity.toNumber(),
      labels: node.labels,
      properties: this.convertNeo4jValue(node.properties),
    };
  }

  private convertRelationship(rel: any): any {
    return {
      id: rel.identity.toNumber(),
      type: rel.type,
      startNodeId: rel.start.toNumber(),
      endNodeId: rel.end.toNumber(),
      properties: this.convertNeo4jValue(rel.properties),
    };
  }

  private convertPath(path: any): any {
    return {
      start: this.convertNode(path.start),
      end: this.convertNode(path.end),
      segments: path.segments.map((segment: any) => ({
        start: this.convertNode(segment.start),
        relationship: this.convertRelationship(segment.relationship),
        end: this.convertNode(segment.end),
      })),
      length: path.length,
    };
  }

  private buildGdsConfigString(config: Record<string, any>): string {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(config)) {
      if (value !== undefined) {
        if (typeof value === 'string') {
          parts.push(`${key}: '${value}'`);
        } else {
          parts.push(`${key}: ${JSON.stringify(value)}`);
        }
      }
    }
    return `{${parts.join(', ')}}`;
  }

  /**
   * Get index health status
   */
  async getIndexHealth(): Promise<{
    indexes: Array<{
      name: string;
      status: string;
      type: string;
      labels: string[];
      properties: string[];
      populationPercent?: number;
    }>;
    summary: {
      total: number;
      online: number;
      failed: number;
      populating: number;
    };
  }> {
    const query = `
      SHOW INDEXES
      YIELD name, type, labelsOrTypes, properties, state, populationPercent
      RETURN name, type, labelsOrTypes as labels, properties, state, populationPercent
    `;

    try {
      const result = await this.executeCypher(query);

      const indexes = result.map((row) => ({
        name: row.name,
        status: row.state || 'unknown',
        type: row.type,
        labels: Array.isArray(row.labels)
          ? row.labels
          : [row.labels].filter(Boolean),
        properties: Array.isArray(row.properties)
          ? row.properties
          : [row.properties].filter(Boolean),
        populationPercent: row.populationPercent,
      }));

      const summary = {
        total: indexes.length,
        online: indexes.filter((i) => i.status === 'ONLINE').length,
        failed: indexes.filter((i) => i.status === 'FAILED').length,
        populating: indexes.filter((i) => i.status === 'POPULATING').length,
      };

      return { indexes, summary };
    } catch (error) {
      console.warn('Failed to get index health:', error);
      return {
        indexes: [],
        summary: { total: 0, online: 0, failed: 0, populating: 0 },
      };
    }
  }

  /**
   * Ensure graph indexes are created
   */
  async ensureGraphIndexes(): Promise<void> {
    const advancedIndexes = [
      // Composite indexes for better query performance
      'CREATE INDEX entity_type_path IF NOT EXISTS FOR (n:Entity) ON (n.type, n.path)',
      'CREATE INDEX entity_name_type IF NOT EXISTS FOR (n:Entity) ON (n.name, n.type)',
      'CREATE INDEX file_path_modified IF NOT EXISTS FOR (n:File) ON (n.path, n.lastModified)',
      'CREATE INDEX symbol_name_file IF NOT EXISTS FOR (n:Symbol) ON (n.name, n.filePath)',

      // Full-text search indexes
      'CREATE FULLTEXT INDEX entity_content_search IF NOT EXISTS FOR (n:Entity) ON EACH [n.content, n.description, n.name]',
      'CREATE FULLTEXT INDEX symbol_search IF NOT EXISTS FOR (n:Symbol) ON EACH [n.name, n.signature, n.documentation]',

      // Temporal indexes for history
      'CREATE INDEX version_timestamp IF NOT EXISTS FOR (n:Version) ON (n.timestamp)',
      'CREATE INDEX checkpoint_timestamp IF NOT EXISTS FOR (n:Checkpoint) ON (n.timestamp)',
      'CREATE INDEX relationship_validity IF NOT EXISTS FOR ()-[r]-() ON (r.validFrom, r.validTo)',

      // Performance indexes for relationships
      'CREATE INDEX relationship_changeset IF NOT EXISTS FOR ()-[r]-() ON (r.changeSetId)',
      'CREATE INDEX relationship_active IF NOT EXISTS FOR ()-[r]-() ON (r.active)',
    ];

    for (const index of advancedIndexes) {
      try {
        await this.executeCypher(index);
        console.log(`✓ Created index: ${index.split(' ')[2]}`);
      } catch (error) {
        console.warn(`Failed to create index: ${index}`, error);
      }
    }

    // Create constraints for data integrity
    const constraints = [
      'CREATE CONSTRAINT entity_id_unique IF NOT EXISTS FOR (n:Entity) REQUIRE n.id IS UNIQUE',
      'CREATE CONSTRAINT version_id_unique IF NOT EXISTS FOR (n:Version) REQUIRE n.id IS UNIQUE',
      'CREATE CONSTRAINT checkpoint_id_unique IF NOT EXISTS FOR (n:Checkpoint) REQUIRE n.id IS UNIQUE',
    ];

    for (const constraint of constraints) {
      try {
        await this.executeCypher(constraint);
        console.log(`✓ Created constraint: ${constraint.split(' ')[2]}`);
      } catch (error) {
        console.warn(`Failed to create constraint: ${constraint}`, error);
      }
    }

    console.log('[Neo4jService] Graph indexes and constraints ensured');
  }

  /**
   * Run performance benchmarks
   */
  async runBenchmarks(options?: {
    includeWrites?: boolean;
    sampleSize?: number;
    timeout?: number;
  }): Promise<{
    readPerformance: {
      simpleNodeQuery: { avgMs: number; operations: number };
      relationshipTraversal: { avgMs: number; operations: number };
      indexLookup: { avgMs: number; operations: number };
      aggregationQuery: { avgMs: number; operations: number };
    };
    writePerformance?: {
      nodeCreation: { avgMs: number; operations: number };
      relationshipCreation: { avgMs: number; operations: number };
      bulkInsert: { avgMs: number; operations: number };
    };
    databaseStats: {
      nodeCount: number;
      relationshipCount: number;
      indexCount: number;
      memoryUsage?: string;
    };
  }> {
    const sampleSize = options?.sampleSize || 10;
    const includeWrites = options?.includeWrites || false;
    const timeout = options?.timeout || 5000;

    console.log('[Neo4jService] Running performance benchmarks...');

    // Helper function to time operations
    const timeOperation = async (
      operation: () => Promise<any>,
      iterations: number
    ) => {
      const start = Date.now();
      for (let i = 0; i < iterations; i++) {
        await operation();
      }
      const end = Date.now();
      return {
        avgMs: (end - start) / iterations,
        operations: iterations,
      };
    };

    // Read performance tests
    const readPerformance = {
      simpleNodeQuery: await timeOperation(async () => {
        await this.executeCypher(
          'MATCH (n:Entity) RETURN n LIMIT 1',
          {},
          { timeout }
        );
      }, sampleSize),

      relationshipTraversal: await timeOperation(async () => {
        await this.executeCypher(
          'MATCH (n:Entity)-[r]->() RETURN n, r LIMIT 5',
          {},
          { timeout }
        );
      }, sampleSize),

      indexLookup: await timeOperation(async () => {
        await this.executeCypher(
          'MATCH (n:Entity) WHERE n.type = $type RETURN n LIMIT 1',
          { type: 'File' },
          { timeout }
        );
      }, sampleSize),

      aggregationQuery: await timeOperation(async () => {
        await this.executeCypher(
          'MATCH (n:Entity) RETURN n.type, count(n) as count',
          {},
          { timeout }
        );
      }, sampleSize),
    };

    // Write performance tests (if enabled)
    let writePerformance: any = undefined;
    if (includeWrites) {
      const testNodeId = `benchmark_test_${Date.now()}`;

      writePerformance = {
        nodeCreation: await timeOperation(async () => {
          await this.executeCypher(
            'CREATE (n:BenchmarkTest {id: $id, timestamp: $timestamp})',
            {
              id: `${testNodeId}_${Math.random()}`,
              timestamp: new Date().toISOString(),
            },
            { timeout }
          );
        }, Math.min(sampleSize, 5)), // Limit writes

        relationshipCreation: await timeOperation(async () => {
          await this.executeCypher(
            `
            MATCH (a:BenchmarkTest), (b:BenchmarkTest)
            WHERE a.id <> b.id
            WITH a, b LIMIT 1
            CREATE (a)-[:BENCHMARK_REL {created: $timestamp}]->(b)
            `,
            { timestamp: new Date().toISOString() },
            { timeout }
          );
        }, Math.min(sampleSize, 3)),

        bulkInsert: await timeOperation(async () => {
          const nodes = Array.from({ length: 5 }, (_, i) => ({
            id: `bulk_${testNodeId}_${i}_${Math.random()}`,
            timestamp: new Date().toISOString(),
          }));
          await this.executeCypher(
            'UNWIND $nodes AS node CREATE (n:BenchmarkTest) SET n = node',
            { nodes },
            { timeout }
          );
        }, Math.min(sampleSize, 3)),
      };

      // Cleanup test data
      try {
        await this.executeCypher('MATCH (n:BenchmarkTest) DETACH DELETE n');
      } catch (error) {
        console.warn('Failed to cleanup benchmark test data:', error);
      }
    }

    // Get database stats
    const [nodeStats, relStats, indexStats] = await Promise.all([
      this.executeCypher('MATCH (n) RETURN count(n) as count'),
      this.executeCypher('MATCH ()-[r]->() RETURN count(r) as count'),
      this.executeCypher('SHOW INDEXES YIELD name RETURN count(name) as count'),
    ]);

    const databaseStats = {
      nodeCount: nodeStats[0]?.count || 0,
      relationshipCount: relStats[0]?.count || 0,
      indexCount: indexStats[0]?.count || 0,
    };

    console.log('[Neo4jService] Benchmarks completed');

    return {
      readPerformance,
      writePerformance,
      databaseStats,
    };
  }

  /**
   * Close the driver connection
   */
  async close(): Promise<void> {
    await this.driver.close();
  }
}

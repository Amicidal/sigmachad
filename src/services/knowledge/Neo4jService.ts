/**
 * Neo4j Base Service
 * Handles raw Neo4j interactions, APOC procedures, and GDS algorithms
 */

import neo4j, { Driver, Session, Result } from 'neo4j-driver';
import { EventEmitter } from 'events';

export interface Neo4jConfig {
  uri: string;
  username: string;
  password: string;
  database?: string;
  maxConnectionPoolSize?: number;
}

export interface CypherQueryOptions {
  timeout?: number;
  database?: string;
}

export interface VectorSearchOptions {
  limit?: number;
  minScore?: number;
  filter?: Record<string, any>;
}

export interface GdsAlgorithmConfig {
  nodeProjection?: string;
  relationshipProjection?: string;
  writeProperty?: string;
  maxIterations?: number;
  dampingFactor?: number;
}

export class Neo4jService extends EventEmitter {
  private driver: Driver;
  private database: string;
  private readonly defaultTimeout = 30000;

  constructor(config: Neo4jConfig) {
    super();
    this.driver = neo4j.driver(
      config.uri,
      neo4j.auth.basic(config.username, config.password),
      {
        maxConnectionPoolSize: config.maxConnectionPoolSize || 50,
        connectionTimeout: 30000,
        maxTransactionRetryTime: 30000,
      }
    );
    this.database = config.database || 'neo4j';
  }

  /**
   * Execute a Cypher query with parameters
   */
  async executeCypher(
    query: string,
    params: Record<string, any> = {},
    options: CypherQueryOptions = {}
  ): Promise<any[]> {
    const session = this.driver.session({
      database: options.database || this.database,
      defaultAccessMode: neo4j.session.WRITE,
    });

    try {
      const result = await session.run(query, params, {
        timeout: options.timeout || this.defaultTimeout,
      });

      return result.records.map(record => {
        const obj: any = {};
        record.keys.forEach(key => {
          const value = record.get(key);
          obj[key] = this.convertNeo4jValue(value);
        });
        return obj;
      });
    } catch (error) {
      this.emit('error', { query, params, error });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async executeTransaction(
    queries: Array<{ query: string; params?: Record<string, any> }>,
    options: CypherQueryOptions = {}
  ): Promise<any[]> {
    const session = this.driver.session({
      database: options.database || this.database,
      defaultAccessMode: neo4j.session.WRITE,
    });

    const results: any[] = [];

    try {
      await session.writeTransaction(async (tx) => {
        for (const { query, params = {} } of queries) {
          const result = await tx.run(query, params);
          results.push(
            result.records.map(record => {
              const obj: any = {};
              record.keys.forEach(key => {
                obj[key] = this.convertNeo4jValue(record.get(key));
              });
              return obj;
            })
          );
        }
      });
      return results;
    } catch (error) {
      this.emit('error', { queries, error });
      throw error;
    } finally {
      await session.close();
    }
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
    vectors: Array<{ id: string; vector: number[]; properties?: Record<string, any> }>
  ): Promise<void> {
    const query = `
      UNWIND $vectors AS item
      MERGE (n:${label} {id: item.id})
      SET n.embedding = item.vector
      SET n += item.properties
    `;

    const params = {
      vectors: vectors.map(v => ({
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
      { name: 'relationships', query: 'MATCH ()-[r]->() RETURN count(r) as count' },
      { name: 'labels', query: 'CALL db.labels() YIELD label RETURN collect(label) as labels' },
      { name: 'types', query: 'CALL db.relationshipTypes() YIELD relationshipType RETURN collect(relationshipType) as types' },
      { name: 'indexes', query: 'SHOW INDEXES YIELD name, type, labelsOrTypes, properties RETURN collect({name: name, type: type, labels: labelsOrTypes, properties: properties}) as indexes' },
    ];

    const stats: any = {};
    for (const { name, query } of queries) {
      try {
        const result = await this.executeCypher(query);
        stats[name] = result[0]?.[name === 'nodes' || name === 'relationships' ? 'count' : name] || 0;
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
    if (Array.isArray(value)) return value.map(v => this.convertNeo4jValue(v));
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
   * Close the driver connection
   */
  async close(): Promise<void> {
    await this.driver.close();
  }
}
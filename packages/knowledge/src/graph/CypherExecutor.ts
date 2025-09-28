/**
 * Cypher Executor
 * Handles raw Cypher execution, transactions, and database operations
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

export interface BenchmarkOptions {
  iterations?: number;
  queryCount?: number;
  includeMetrics?: boolean;
}

export class CypherExecutor extends EventEmitter {
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

      return result.records.map((record) => {
        const obj: any = {};
        record.keys.forEach((key) => {
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

    const transaction = session.beginTransaction();

    try {
      const results: any[] = [];
      for (const { query, params = {} } of queries) {
        const result = await transaction.run(query, params);
        const records = result.records.map((record) => {
          const obj: any = {};
          record.keys.forEach((key) => {
            const value = record.get(key);
            obj[key] = this.convertNeo4jValue(value);
          });
          return obj;
        });
        results.push(records);
      }

      await transaction.commit();
      return results;
    } catch (error) {
      await transaction.rollback();
      this.emit('transaction:error', { queries, error });
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
    const query = `CALL ${procedure}(${Object.keys(params)
      .map((k) => `$${k}`)
      .join(', ')})`;
    return this.executeCypher(query, params, options);
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<any> {
    const queries = [
      'MATCH ()-[r]->() RETURN count(r) as relationships',
      'MATCH (n) RETURN count(n) as nodes',
      'CALL db.labels() YIELD label RETURN collect(label) as labels',
      'CALL db.relationshipTypes() YIELD relationshipType RETURN collect(relationshipType) as relationshipTypes',
    ];

    const results = await Promise.all(
      queries.map((query) => this.executeCypher(query).catch(() => []))
    );

    return {
      nodes: results[1][0]?.nodes || 0,
      relationships: results[0][0]?.relationships || 0,
      labels: results[2][0]?.labels || [],
      relationshipTypes: results[3][0]?.relationshipTypes || [],
      // Note: connectionPoolSize removed as it accessed private properties
      connectionPoolSize: 0,
    };
  }

  /**
   * Create common database indexes
   */
  async createCommonIndexes(): Promise<void> {
    const indexQueries = [
      'CREATE INDEX entity_id IF NOT EXISTS FOR (n:Entity) ON (n.id)',
      'CREATE INDEX entity_type IF NOT EXISTS FOR (n:Entity) ON (n.type)',
      'CREATE INDEX entity_path IF NOT EXISTS FOR (n:Entity) ON (n.path)',
      'CREATE INDEX relationship_id IF NOT EXISTS FOR ()-[r]-() ON (r.id)',
      'CREATE INDEX version_id IF NOT EXISTS FOR (n:Version) ON (n.id)',
      'CREATE INDEX checkpoint_id IF NOT EXISTS FOR (n:Checkpoint) ON (n.id)',
      'CREATE INDEX documentation_hash IF NOT EXISTS FOR (n:Documentation) ON (n.docHash)',
    ];

    for (const query of indexQueries) {
      try {
        await this.executeCypher(query);
      } catch (error) {
        // Index might already exist, continue
        console.warn(`Failed to create index: ${query}`, error);
      }
    }
  }

  /**
   * Get index health information
   */
  async getIndexHealth(): Promise<any> {
    try {
      const result = await this.callApoc('db.indexes');
      return result;
    } catch (error) {
      // Fallback if APOC is not available
      return this.executeCypher('CALL db.indexes()');
    }
  }

  /**
   * Ensure graph-specific indexes exist
   */
  async ensureGraphIndexes(): Promise<void> {
    // Additional graph-specific indexes
    const graphIndexQueries = [
      'CREATE INDEX entity_name IF NOT EXISTS FOR (n:Entity) ON (n.name)',
      'CREATE INDEX entity_last_modified IF NOT EXISTS FOR (n:Entity) ON (n.lastModified)',
      'CREATE INDEX relationship_type IF NOT EXISTS FOR ()-[r]-() ON (r.type)',
      'CREATE INDEX temporal_edge_valid_from IF NOT EXISTS FOR ()-[r]-() ON (r.validFrom)',
      'CREATE INDEX temporal_edge_valid_to IF NOT EXISTS FOR ()-[r]-() ON (r.validTo)',
    ];

    for (const query of graphIndexQueries) {
      try {
        await this.executeCypher(query);
      } catch (error) {
        console.warn(`Failed to create graph index: ${query}`, error);
      }
    }
  }

  /**
   * Run benchmark operations
   */
  async runBenchmarks(options: BenchmarkOptions = {}): Promise<any> {
    const {
      iterations = 10,
      queryCount = 100,
      includeMetrics = true,
    } = options;

    const results = {
      iterations,
      queryCount,
      totalQueries: iterations * queryCount,
      executionTimes: [] as number[],
      averageTime: 0,
      minTime: 0,
      maxTime: 0,
      throughput: 0,
    };

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();

      // Run a batch of simple queries
      const queries = Array.from({ length: queryCount }, (_, idx) => ({
        query: 'MATCH (n) RETURN count(n) as count',
        params: { idx },
      }));

      await this.executeTransaction(queries);

      const endTime = Date.now();
      const executionTime = endTime - startTime;
      results.executionTimes.push(executionTime);
    }

    if (results.executionTimes.length > 0) {
      results.averageTime =
        results.executionTimes.reduce((a, b) => a + b, 0) /
        results.executionTimes.length;
      results.minTime = Math.min(...results.executionTimes);
      results.maxTime = Math.max(...results.executionTimes);
      results.throughput = results.totalQueries / (results.averageTime / 1000); // queries per second
    }

    return includeMetrics ? results : { completed: true };
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    await this.driver.close();
    this.emit('closed');
  }

  /**
   * Convert Neo4j values to JavaScript types
   */
  private convertNeo4jValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    // Handle Neo4j temporal types
    if (neo4j.isDate(value)) {
      return new Date(
        Number(value.year),
        Number(value.month) - 1,
        Number(value.day)
      );
    }
    if (neo4j.isDateTime(value)) {
      return new Date(value.toString());
    }
    if (neo4j.isLocalDateTime(value)) {
      return new Date(value.toString());
    }
    if (neo4j.isTime(value) || neo4j.isLocalTime(value)) {
      return value.toString();
    }

    // Handle Neo4j spatial types
    if (neo4j.isPoint(value)) {
      return { x: value.x, y: value.y, z: value.z, srid: value.srid };
    }

    // Handle arrays and objects
    if (Array.isArray(value)) {
      return value.map((item) => this.convertNeo4jValue(item));
    }
    if (typeof value === 'object' && value !== null) {
      const converted: any = {};
      for (const [key, val] of Object.entries(value)) {
        converted[key] = this.convertNeo4jValue(val);
      }
      return converted;
    }

    return value;
  }
}

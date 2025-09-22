/**
 * Neogma Service - OGM wrapper for Neo4j
 * Provides Neogma instance management and base configuration
 */

import { Neogma } from 'neogma';
import { EventEmitter } from 'events';
import { Neo4jConfig } from '../Neo4jService.js';

export class NeogmaService extends EventEmitter {
  private neogma: Neogma;

  constructor(config: Neo4jConfig) {
    super();

    // Initialize Neogma with existing Neo4j configuration
    this.neogma = new Neogma({
      url: config.uri,
      username: config.username,
      password: config.password,
      database: config.database || 'neo4j',
      // Additional Neogma-specific configuration
      logger: process.env.NODE_ENV === 'development' ? console.log : undefined,
    });

    // Verify connection
    this.verifyConnection();
  }

  /**
   * Verify the connection to Neo4j
   */
  private async verifyConnection(): Promise<void> {
    try {
      const result = await this.neogma.queryRunner.run('RETURN 1 as test');
      if (result.records[0]?.get('test') === 1) {
        this.emit('connected', { status: 'connected' });
      }
    } catch (error) {
      this.emit('error', { message: 'Failed to connect to Neo4j', error });
      throw error;
    }
  }

  /**
   * Get the Neogma instance for model creation
   */
  getNeogmaInstance(): Neogma {
    return this.neogma;
  }

  /**
   * Execute raw Cypher query (escape hatch for complex queries)
   */
  async executeCypher(
    query: string,
    params: Record<string, any> = {}
  ): Promise<any[]> {
    try {
      const result = await this.neogma.queryRunner.run(query, params);
      return result.records.map(record => {
        const obj: any = {};
        record.keys.forEach(key => {
          obj[key] = record.get(key);
        });
        return obj;
      });
    } catch (error) {
      this.emit('error', { query, params, error });
      throw error;
    }
  }

  /**
   * Close the connection
   */
  async close(): Promise<void> {
    await this.neogma.driver.close();
    this.emit('disconnected');
  }
}
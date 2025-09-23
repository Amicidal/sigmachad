/**
 * Graph Initializer
 * Handles database initialization, index creation, and setup operations
 */

import { EventEmitter } from "events";
import { Neo4jService } from "../Neo4jService.js";
import { EmbeddingService } from "../EmbeddingService.js";

export class GraphInitializer extends EventEmitter {
  constructor(
    private neo4j: Neo4jService,
    private embeddings: EmbeddingService
  ) {
    super();
  }

  /**
   * Initialize database with necessary indexes and constraints
   */
  async initializeDatabase(): Promise<void> {
    try {
      await this.neo4j.createCommonIndexes();
      await this.embeddings.initializeVectorIndex();

      // OGM models should handle their own indexes
      console.log("[GraphInitializer] OGM database setup completed");

      this.emit("database:initialized");
    } catch (error) {
      console.error(
        "[GraphInitializer] Database initialization failed:",
        error
      );
      this.emit("database:error", error);
      throw error;
    }
  }

  /**
   * Ensure all required indexes exist
   */
  async ensureIndices(): Promise<void> {
    await this.neo4j.createCommonIndexes();
  }

  /**
   * Ensure graph-specific indexes exist
   */
  async ensureGraphIndexes(): Promise<void> {
    await this.neo4j.ensureGraphIndexes();
  }

  /**
   * Run benchmark operations
   */
  async runBenchmarks(options?: any): Promise<any> {
    return this.neo4j.runBenchmarks(options);
  }
}

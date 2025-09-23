/**
 * Graph Initializer
 * Handles database initialization, index creation, and setup operations
 */
import { EventEmitter } from "events";
import { Neo4jService } from "../Neo4jService.js";
import { EmbeddingService } from "../EmbeddingService.js";
export declare class GraphInitializer extends EventEmitter {
    private neo4j;
    private embeddings;
    constructor(neo4j: Neo4jService, embeddings: EmbeddingService);
    /**
     * Initialize database with necessary indexes and constraints
     */
    initializeDatabase(): Promise<void>;
    /**
     * Ensure all required indexes exist
     */
    ensureIndices(): Promise<void>;
    /**
     * Ensure graph-specific indexes exist
     */
    ensureGraphIndexes(): Promise<void>;
    /**
     * Run benchmark operations
     */
    runBenchmarks(options?: any): Promise<any>;
}
//# sourceMappingURL=GraphInitializer.d.ts.map
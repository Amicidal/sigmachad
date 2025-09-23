/**
 * Graph Initializer
 * Handles database initialization, index creation, and setup operations
 */
import { EventEmitter } from "events";
export class GraphInitializer extends EventEmitter {
    constructor(neo4j, embeddings) {
        super();
        this.neo4j = neo4j;
        this.embeddings = embeddings;
    }
    /**
     * Initialize database with necessary indexes and constraints
     */
    async initializeDatabase() {
        try {
            await this.neo4j.createCommonIndexes();
            await this.embeddings.initializeVectorIndex();
            // OGM models should handle their own indexes
            console.log("[GraphInitializer] OGM database setup completed");
            this.emit("database:initialized");
        }
        catch (error) {
            console.error("[GraphInitializer] Database initialization failed:", error);
            this.emit("database:error", error);
            throw error;
        }
    }
    /**
     * Ensure all required indexes exist
     */
    async ensureIndices() {
        await this.neo4j.createCommonIndexes();
    }
    /**
     * Ensure graph-specific indexes exist
     */
    async ensureGraphIndexes() {
        await this.neo4j.ensureGraphIndexes();
    }
    /**
     * Run benchmark operations
     */
    async runBenchmarks(options) {
        return this.neo4j.runBenchmarks(options);
    }
}
//# sourceMappingURL=GraphInitializer.js.map
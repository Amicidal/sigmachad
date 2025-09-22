/**
 * Neogma Service - OGM wrapper for Neo4j
 * Provides Neogma instance management and base configuration
 */
import { Neogma } from 'neogma';
import { EventEmitter } from 'events';
import { Neo4jConfig } from '../Neo4jService.js';
export declare class NeogmaService extends EventEmitter {
    private neogma;
    constructor(config: Neo4jConfig);
    /**
     * Verify the connection to Neo4j
     */
    private verifyConnection;
    /**
     * Get the Neogma instance for model creation
     */
    getNeogmaInstance(): Neogma;
    /**
     * Execute raw Cypher query (escape hatch for complex queries)
     */
    executeCypher(query: string, params?: Record<string, any>): Promise<any[]>;
    /**
     * Close the connection
     */
    close(): Promise<void>;
}
//# sourceMappingURL=NeogmaService.d.ts.map
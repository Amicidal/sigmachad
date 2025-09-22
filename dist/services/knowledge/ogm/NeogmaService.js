/**
 * Neogma Service - OGM wrapper for Neo4j
 * Provides Neogma instance management and base configuration
 */
import { Neogma } from 'neogma';
import { EventEmitter } from 'events';
export class NeogmaService extends EventEmitter {
    constructor(config) {
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
    async verifyConnection() {
        var _a;
        try {
            const result = await this.neogma.queryRunner.run('RETURN 1 as test');
            if (((_a = result.records[0]) === null || _a === void 0 ? void 0 : _a.get('test')) === 1) {
                this.emit('connected', { status: 'connected' });
            }
        }
        catch (error) {
            this.emit('error', { message: 'Failed to connect to Neo4j', error });
            throw error;
        }
    }
    /**
     * Get the Neogma instance for model creation
     */
    getNeogmaInstance() {
        return this.neogma;
    }
    /**
     * Execute raw Cypher query (escape hatch for complex queries)
     */
    async executeCypher(query, params = {}) {
        try {
            const result = await this.neogma.queryRunner.run(query, params);
            return result.records.map(record => {
                const obj = {};
                record.keys.forEach(key => {
                    obj[key] = record.get(key);
                });
                return obj;
            });
        }
        catch (error) {
            this.emit('error', { query, params, error });
            throw error;
        }
    }
    /**
     * Close the connection
     */
    async close() {
        await this.neogma.driver.close();
        this.emit('disconnected');
    }
}
//# sourceMappingURL=NeogmaService.js.map
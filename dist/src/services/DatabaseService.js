/**
 * Database Service for Memento
 * Orchestrates specialized database services for FalkorDB, Qdrant, PostgreSQL, and Redis
 */
import { FalkorDBService } from './database/FalkorDBService';
import { QdrantService } from './database/QdrantService';
import { PostgreSQLService } from './database/PostgreSQLService';
import { RedisService } from './database/RedisService';
export class DatabaseService {
    config;
    falkorDBService;
    qdrantService;
    postgresqlService;
    redisService;
    initialized = false;
    initializing = false;
    initializationPromise;
    // Optional factories for dependency injection (testing and customization)
    falkorFactory;
    qdrantFactory;
    postgresFactory;
    redisFactory;
    constructor(config, deps = {}) {
        this.config = config;
        this.falkorFactory = deps.falkorFactory;
        this.qdrantFactory = deps.qdrantFactory;
        this.postgresFactory = deps.postgresFactory;
        this.redisFactory = deps.redisFactory;
    }
    getConfig() {
        return this.config;
    }
    getFalkorDBService() {
        if (!this.initialized) {
            throw new Error('Database not initialized');
        }
        return this.falkorDBService;
    }
    getQdrantService() {
        if (!this.initialized) {
            throw new Error('Database not initialized');
        }
        return this.qdrantService;
    }
    getPostgreSQLService() {
        if (!this.initialized) {
            throw new Error('Database not initialized');
        }
        return this.postgresqlService;
    }
    getRedisService() {
        if (!this.initialized) {
            throw new Error('Database not initialized');
        }
        return this.redisService;
    }
    // Direct client/pool getters for convenience
    getFalkorDBClient() {
        if (!this.initialized) {
            return undefined;
        }
        return this.falkorDBService.getClient();
    }
    getQdrantClient() {
        if (!this.initialized) {
            return undefined;
        }
        return this.qdrantService.getClient();
    }
    getPostgresPool() {
        if (!this.initialized) {
            return undefined;
        }
        return this.postgresqlService.getPool();
    }
    async initialize() {
        if (this.initialized) {
            return;
        }
        // Prevent concurrent initialization
        if (this.initializing) {
            if (this.initializationPromise) {
                return this.initializationPromise;
            }
            throw new Error('Initialization already in progress');
        }
        // Create the promise first, then set the flag
        this.initializationPromise = this._initialize();
        this.initializing = true;
        try {
            await this.initializationPromise;
        }
        finally {
            this.initializing = false;
            this.initializationPromise = undefined;
        }
    }
    async _initialize() {
        // Track initialized services for cleanup on failure
        const initializedServices = [];
        try {
            // Initialize specialized services
            this.falkorDBService = this.falkorFactory
                ? this.falkorFactory(this.config.falkordb)
                : new FalkorDBService(this.config.falkordb);
            this.qdrantService = this.qdrantFactory
                ? this.qdrantFactory(this.config.qdrant)
                : new QdrantService(this.config.qdrant);
            this.postgresqlService = this.postgresFactory
                ? this.postgresFactory(this.config.postgresql)
                : new PostgreSQLService(this.config.postgresql);
            // Initialize each service and track successful initializations
            await this.falkorDBService.initialize();
            initializedServices.push({ service: this.falkorDBService, close: () => this.falkorDBService.close() });
            await this.qdrantService.initialize();
            initializedServices.push({ service: this.qdrantService, close: () => this.qdrantService.close() });
            await this.postgresqlService.initialize();
            initializedServices.push({ service: this.postgresqlService, close: () => this.postgresqlService.close() });
            // Initialize Redis (optional, for caching)
            if (this.config.redis) {
                this.redisService = this.redisFactory
                    ? this.redisFactory(this.config.redis)
                    : new RedisService(this.config.redis);
                await this.redisService.initialize();
                initializedServices.push({ service: this.redisService, close: () => this.redisService.close() });
            }
            this.initialized = true;
            console.log('✅ All database connections established');
        }
        catch (error) {
            console.error('❌ Database initialization failed:', error);
            // Cleanup already initialized services
            const cleanupPromises = initializedServices.map(({ close }) => close().catch(cleanupError => console.error('❌ Error during cleanup:', cleanupError)));
            await Promise.allSettled(cleanupPromises);
            // Reset service references
            this.falkorDBService = undefined;
            this.qdrantService = undefined;
            this.postgresqlService = undefined;
            this.redisService = undefined;
            throw error;
        }
    }
    async close() {
        if (!this.initialized) {
            return;
        }
        // Collect all close operations
        const closePromises = [];
        if (this.falkorDBService && this.falkorDBService.isInitialized()) {
            closePromises.push(this.falkorDBService.close().catch(error => console.error('❌ Error closing FalkorDB service:', error)));
        }
        if (this.qdrantService && this.qdrantService.isInitialized()) {
            closePromises.push(this.qdrantService.close().catch(error => console.error('❌ Error closing Qdrant service:', error)));
        }
        if (this.postgresqlService && this.postgresqlService.isInitialized()) {
            closePromises.push(this.postgresqlService.close().catch(error => console.error('❌ Error closing PostgreSQL service:', error)));
        }
        if (this.redisService && this.redisService.isInitialized()) {
            closePromises.push(this.redisService.close().catch(error => console.error('❌ Error closing Redis service:', error)));
        }
        // Wait for all close operations to complete (or fail)
        await Promise.allSettled(closePromises);
        // Reset state
        this.initialized = false;
        this.falkorDBService = undefined;
        this.qdrantService = undefined;
        this.postgresqlService = undefined;
        this.redisService = undefined;
        // Clear singleton instance if this is the singleton
        if (typeof databaseService !== 'undefined' && databaseService === this) {
            databaseService = null;
        }
        console.log('✅ All database connections closed');
    }
    // FalkorDB operations
    async falkordbQuery(query, params = {}) {
        if (!this.initialized) {
            throw new Error('Database not initialized');
        }
        return this.falkorDBService.query(query, params);
    }
    async falkordbCommand(...args) {
        if (!this.initialized) {
            throw new Error('Database not initialized');
        }
        return this.falkorDBService.command(...args);
    }
    // Qdrant operations
    get qdrant() {
        if (!this.initialized) {
            throw new Error('Database not initialized');
        }
        return this.qdrantService.getClient();
    }
    // PostgreSQL operations
    async postgresQuery(query, params = [], options = {}) {
        if (!this.initialized) {
            throw new Error('Database not initialized');
        }
        return this.postgresqlService.query(query, params, options);
    }
    async postgresTransaction(callback, options = {}) {
        if (!this.initialized) {
            throw new Error('Database not initialized');
        }
        return this.postgresqlService.transaction(callback, options);
    }
    // Redis operations (optional caching)
    async redisGet(key) {
        if (!this.redisService) {
            throw new Error('Redis not configured');
        }
        return this.redisService.get(key);
    }
    async redisSet(key, value, ttl) {
        if (!this.redisService) {
            throw new Error('Redis not configured');
        }
        return this.redisService.set(key, value, ttl);
    }
    async redisDel(key) {
        if (!this.redisService) {
            throw new Error('Redis not configured');
        }
        return this.redisService.del(key);
    }
    // Health checks
    async healthCheck() {
        // Return early if not initialized
        if (!this.initialized) {
            return {
                falkordb: false,
                qdrant: false,
                postgresql: false,
                redis: undefined,
            };
        }
        // Run all health checks in parallel for better performance
        const healthCheckPromises = [
            this.falkorDBService.healthCheck().catch(() => false),
            this.qdrantService.healthCheck().catch(() => false),
            this.postgresqlService.healthCheck().catch(() => false),
            this.redisService?.healthCheck().catch(() => undefined) ?? Promise.resolve(undefined),
        ];
        const settledResults = await Promise.allSettled(healthCheckPromises);
        return {
            falkordb: settledResults[0].status === 'fulfilled' ? settledResults[0].value : false,
            qdrant: settledResults[1].status === 'fulfilled' ? settledResults[1].value : false,
            postgresql: settledResults[2].status === 'fulfilled' ? settledResults[2].value : false,
            redis: settledResults[3].status === 'fulfilled' ? settledResults[3].value : undefined,
        };
    }
    // Database setup and migrations
    async setupDatabase() {
        if (!this.initialized) {
            throw new Error('Database not initialized');
        }
        console.log('🔧 Setting up database schema...');
        // Setup each database service
        await Promise.all([
            this.postgresqlService.setupSchema(),
            this.falkorDBService.setupGraph(),
            this.qdrantService.setupCollections(),
        ]);
        console.log('✅ Database schema setup complete');
    }
    isInitialized() {
        return this.initialized;
    }
    /**
     * Store test suite execution results
     */
    async storeTestSuiteResult(suiteResult) {
        if (!this.initialized) {
            throw new Error('Database service not initialized');
        }
        return this.postgresqlService.storeTestSuiteResult(suiteResult);
    }
    /**
     * Store flaky test analyses
     */
    async storeFlakyTestAnalyses(analyses) {
        if (!this.initialized) {
            throw new Error('Database service not initialized');
        }
        return this.postgresqlService.storeFlakyTestAnalyses(analyses);
    }
    /**
     * Execute bulk PostgreSQL operations efficiently
     */
    async postgresBulkQuery(queries, options = {}) {
        if (!this.initialized) {
            throw new Error('Database not initialized');
        }
        return this.postgresqlService.bulkQuery(queries, options);
    }
    /**
     * Get test execution history for an entity
     */
    async getTestExecutionHistory(entityId, limit = 50) {
        if (!this.initialized) {
            throw new Error('Database service not initialized');
        }
        return this.postgresqlService.getTestExecutionHistory(entityId, limit);
    }
    /**
     * Get performance metrics history
     */
    async getPerformanceMetricsHistory(entityId, days = 30) {
        if (!this.initialized) {
            throw new Error('Database service not initialized');
        }
        return this.postgresqlService.getPerformanceMetricsHistory(entityId, days);
    }
    /**
     * Get coverage history
     */
    async getCoverageHistory(entityId, days = 30) {
        if (!this.initialized) {
            throw new Error('Database service not initialized');
        }
        return this.postgresqlService.getCoverageHistory(entityId, days);
    }
}
// Singleton instance
let databaseService = null;
export function getDatabaseService(config) {
    if (!databaseService) {
        if (!config) {
            throw new Error('Database config required for first initialization');
        }
        databaseService = new DatabaseService(config);
    }
    return databaseService;
}
export function createDatabaseConfig() {
    // Check if we're in test environment
    const isTest = process.env.NODE_ENV === 'test';
    return {
        falkordb: {
            url: process.env.FALKORDB_URL || (isTest ? 'redis://localhost:6380' : 'redis://localhost:6379'),
            database: isTest ? 1 : 0, // Use different database for tests
        },
        qdrant: {
            url: process.env.QDRANT_URL || (isTest ? 'http://localhost:6335' : 'http://localhost:6333'),
            apiKey: process.env.QDRANT_API_KEY,
        },
        postgresql: {
            connectionString: process.env.DATABASE_URL ||
                (isTest ? 'postgresql://memento_test:memento_test@localhost:5433/memento_test'
                    : 'postgresql://memento:memento@localhost:5432/memento'),
            max: parseInt(process.env.DB_MAX_CONNECTIONS || (isTest ? '5' : '20')), // Fewer connections for tests
            idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
        },
        redis: process.env.REDIS_URL ? {
            url: process.env.REDIS_URL,
        } : (isTest ? { url: 'redis://localhost:6381' } : undefined),
    };
}
export function createTestDatabaseConfig() {
    return {
        falkordb: {
            url: 'redis://localhost:6380',
            database: 1,
        },
        qdrant: {
            url: 'http://localhost:6335',
            apiKey: undefined,
        },
        postgresql: {
            connectionString: 'postgresql://memento_test:memento_test@localhost:5433/memento_test',
            max: 5,
            idleTimeoutMillis: 5000, // Reduced for tests
            connectionTimeoutMillis: 5000, // Add connection timeout
        },
        redis: {
            url: 'redis://localhost:6381',
        },
    };
}
//# sourceMappingURL=DatabaseService.js.map
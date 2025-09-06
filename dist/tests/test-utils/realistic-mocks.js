/**
 * Realistic mock implementations for testing
 * These mocks simulate real-world failure scenarios and edge cases
 */
/**
 * Realistic FalkorDB mock with configurable failure scenarios
 */
export class RealisticFalkorDBMock {
    initialized = false;
    config;
    queryCount = 0;
    failureCount = 0;
    rngState;
    rng() {
        // Simple LCG for deterministic pseudo-random numbers
        // https://en.wikipedia.org/wiki/Linear_congruential_generator
        this.rngState = (1664525 * this.rngState + 1013904223) >>> 0;
        return (this.rngState >>> 8) / 0x01000000; // [0,1)
    }
    constructor(config = {}) {
        this.config = {
            // Respect provided failure rate; default to 10%
            failureRate: config.failureRate ?? 10,
            latencyMs: config.latencyMs ?? 10,
            connectionFailures: config.connectionFailures ?? false,
            transactionFailures: config.transactionFailures ?? false,
            dataCorruption: config.dataCorruption ?? false,
        };
        this.rngState = (config.seed ?? 1) >>> 0;
    }
    async initialize() {
        if (this.config.connectionFailures && this.rng() * 100 < 50) {
            throw new Error('FalkorDB connection failed: Connection refused');
        }
        await this.simulateLatency();
        this.initialized = true;
    }
    async close() {
        await this.simulateLatency();
        this.initialized = false;
    }
    isInitialized() {
        return this.initialized;
    }
    getClient() {
        if (!this.initialized) {
            return undefined;
        }
        return {
            mockClient: true,
            queryCount: this.queryCount,
            sendCommand: vi.fn().mockResolvedValue('mock-command-result')
        };
    }
    async query(query, params) {
        if (!this.initialized) {
            throw new Error('FalkorDB not initialized');
        }
        await this.simulateLatency();
        if (this.shouldFail()) {
            this.failureCount++;
            const errors = [
                'Query timeout exceeded',
                'Connection lost during query execution',
                'Constraint violation: duplicate key',
                'Syntax error in Cypher query',
            ];
            throw new Error(errors[Math.floor(this.rng() * errors.length)]);
        }
        this.queryCount++;
        // Simulate data corruption
        if (this.config.dataCorruption && this.rng() < 0.1) {
            return {
                corrupted: true,
                error: 'Data integrity check failed',
                originalQuery: query,
            };
        }
        // Return realistic results based on query type
        if (query.includes('MATCH')) {
            return this.generateRealisticMatchResults();
        }
        else if (query.includes('CREATE')) {
            return { created: 1, properties: params };
        }
        else if (query.includes('DELETE')) {
            return { deleted: Math.floor(this.rng() * 10) };
        }
        return { query, params, result: 'success' };
    }
    async command(...args) {
        if (!this.initialized) {
            throw new Error('FalkorDB not initialized');
        }
        await this.simulateLatency();
        if (this.shouldFail()) {
            throw new Error('Command execution failed');
        }
        return { args, result: 'command-success' };
    }
    async setupGraph() {
        if (!this.initialized) {
            throw new Error('FalkorDB not initialized');
        }
        await this.simulateLatency();
    }
    async healthCheck() {
        if (!this.initialized) {
            return false;
        }
        // Simulate intermittent health check failures
        if (this.config.connectionFailures && this.rng() < 0.2) {
            return false;
        }
        return true;
    }
    // Helper methods for testing
    getQueryCount() {
        return this.queryCount;
    }
    getFailureCount() {
        return this.failureCount;
    }
    async simulateLatency() {
        if (this.config.latencyMs > 0) {
            await new Promise(resolve => setTimeout(resolve, this.config.latencyMs));
        }
    }
    shouldFail() {
        return this.rng() * 100 < (this.config.failureRate ?? 0);
    }
    generateRealisticMatchResults() {
        const count = Math.floor(this.rng() * 5);
        const results = [];
        for (let i = 0; i < count; i++) {
            results.push({
                id: `node-${i}`,
                type: ['file', 'function', 'class'][Math.floor(this.rng() * 3)],
                properties: {
                    name: `Entity${i}`,
                    created: new Date().toISOString(),
                }
            });
        }
        return results;
    }
}
/**
 * Realistic Qdrant mock with vector search simulation
 */
export class RealisticQdrantMock {
    initialized = false;
    config;
    collections = new Map();
    rngState;
    rng() {
        this.rngState = (1664525 * this.rngState + 1013904223) >>> 0;
        return (this.rngState >>> 8) / 0x01000000;
    }
    constructor(config = {}) {
        this.config = config;
        this.rngState = (config.seed ?? 1) >>> 0;
    }
    async initialize() {
        if (this.config.connectionFailures && this.rng() < 0.3) {
            throw new Error('Qdrant connection failed: Service unavailable');
        }
        await this.simulateLatency();
        this.initialized = true;
    }
    async close() {
        await this.simulateLatency();
        this.initialized = false;
        this.collections.clear();
    }
    isInitialized() {
        return this.initialized;
    }
    getClient() {
        if (!this.initialized) {
            return undefined;
        }
        return {
            search: async (collection, params) => {
                if (this.shouldFail()) {
                    throw new Error('Vector search failed: Index corrupted');
                }
                await this.simulateLatency();
                // Return realistic search results
                return {
                    points: [
                        {
                            id: 'vec-1',
                            score: 0.95,
                            payload: { type: 'document', content: 'test' }
                        },
                        {
                            id: 'vec-2',
                            score: 0.87,
                            payload: { type: 'code', language: 'typescript' }
                        }
                    ]
                };
            },
            upsert: async (collection, data) => {
                if (this.shouldFail()) {
                    throw new Error('Upsert failed: Collection locked');
                }
                await this.simulateLatency();
                if (!this.collections.has(collection)) {
                    this.collections.set(collection, []);
                }
                this.collections.get(collection).push(data);
                return { status: 'completed' };
            },
            createCollection: async (name, config) => {
                await this.simulateLatency();
                this.collections.set(name, []);
                return { status: 'created' };
            },
            deleteCollection: async (name) => {
                await this.simulateLatency();
                this.collections.delete(name);
                return { status: 'deleted' };
            },
            getCollections: async () => {
                await this.simulateLatency();
                return {
                    collections: Array.from(this.collections.keys()).map(name => ({ name }))
                };
            },
            createSnapshot: async (collectionName) => {
                await this.simulateLatency();
                return {
                    name: `${collectionName}_snapshot_${Date.now()}`,
                    collection: collectionName,
                    created_at: new Date().toISOString()
                };
            },
            scroll: async (collection, params) => {
                await this.simulateLatency();
                const data = this.collections.get(collection) || [];
                return { points: data.slice(0, params?.limit || 10) };
            }
        };
    }
    async setupCollections() {
        if (!this.initialized) {
            throw new Error('Qdrant not initialized');
        }
        await this.simulateLatency();
    }
    async healthCheck() {
        return this.initialized && this.rng() > 0.1;
    }
    async simulateLatency() {
        if (this.config.latencyMs) {
            await new Promise(resolve => setTimeout(resolve, this.config.latencyMs));
        }
    }
    shouldFail() {
        return this.rng() * 100 < (this.config.failureRate ?? 0);
    }
}
/**
 * Realistic PostgreSQL mock with transaction simulation
 */
export class RealisticPostgreSQLMock {
    initialized = false;
    config;
    transactionCount = 0;
    queryLog = [];
    rngState;
    rng() {
        this.rngState = (1664525 * this.rngState + 1013904223) >>> 0;
        return (this.rngState >>> 8) / 0x01000000;
    }
    constructor(config = {}) {
        // Enforce realistic defaults for testing
        this.config = {
            failureRate: config.failureRate ?? 8,
            latencyMs: config.latencyMs ?? 15,
            connectionFailures: config.connectionFailures ?? false,
            transactionFailures: config.transactionFailures ?? true, // Default to true for realism
            dataCorruption: config.dataCorruption ?? false,
        };
        this.rngState = (config.seed ?? 1) >>> 0;
    }
    async initialize() {
        if (this.config.connectionFailures && this.rng() < 0.25) {
            throw new Error('PostgreSQL connection failed: Max connections reached');
        }
        await this.simulateLatency();
        this.initialized = true;
    }
    async close() {
        await this.simulateLatency();
        this.initialized = false;
    }
    isInitialized() {
        return this.initialized;
    }
    getPool() {
        if (!this.initialized) {
            return undefined;
        }
        return {
            totalCount: 10,
            idleCount: 5,
            waitingCount: 0
        };
    }
    async query(query, params, options) {
        if (!this.initialized) {
            throw new Error('PostgreSQL not initialized');
        }
        // Simulate timeout
        if (options?.timeout && this.config.latencyMs && this.config.latencyMs > options.timeout) {
            throw new Error(`Query timeout after ${options.timeout}ms`);
        }
        await this.simulateLatency();
        this.queryLog.push(query);
        if (this.shouldFail()) {
            const errors = [
                'duplicate key value violates unique constraint',
                'deadlock detected',
                'connection terminated unexpectedly',
                'invalid input syntax for type',
            ];
            throw new Error(errors[Math.floor(this.rng() * errors.length)]);
        }
        // Return realistic query results
        if (query.toLowerCase().includes('select')) {
            return {
                rows: this.generateRealisticRows(),
                rowCount: Math.floor(this.rng() * 100)
            };
        }
        else if (query.toLowerCase().includes('insert')) {
            return {
                rows: [{ id: Math.floor(this.rng() * 1000) }],
                rowCount: 1
            };
        }
        else if (query.toLowerCase().includes('update')) {
            return {
                rowCount: Math.floor(this.rng() * 10)
            };
        }
        return { query, params, options, result: 'success' };
    }
    async transaction(callback, options) {
        if (!this.initialized) {
            throw new Error('PostgreSQL not initialized');
        }
        this.transactionCount++;
        // Simulate transaction failures
        if (this.config.transactionFailures && this.rng() < 0.3) {
            const txErrors = [
                'deadlock detected',
                'could not serialize access due to concurrent update',
                'current transaction is aborted',
                'unique constraint violation',
            ];
            throw new Error(txErrors[Math.floor(this.rng() * txErrors.length)]);
        }
        const mockClient = {
            query: async (q, p) => {
                this.queryLog.push(`TX: ${q}`);
                return this.query(q, p);
            }
        };
        await this.simulateLatency();
        return callback(mockClient);
    }
    async bulkQuery(queries, options) {
        const results = [];
        for (const q of queries) {
            try {
                const result = await this.query(q.query, q.params);
                results.push(result);
            }
            catch (error) {
                if (options?.continueOnError) {
                    results.push({ error: error.message });
                }
                else {
                    throw error;
                }
            }
        }
        return results;
    }
    async setupSchema() {
        if (!this.initialized) {
            throw new Error('PostgreSQL not initialized');
        }
        await this.simulateLatency();
    }
    async healthCheck() {
        return this.initialized && this.rng() > 0.05;
    }
    async storeTestSuiteResult(suiteResult) {
        await this.query('INSERT INTO test_suites (name, status, duration) VALUES ($1, $2, $3)', [suiteResult.name, suiteResult.status, suiteResult.duration]);
    }
    async storeFlakyTestAnalyses(analyses) {
        for (const analysis of analyses) {
            await this.query('INSERT INTO flaky_test_analyses (test_id, failure_count) VALUES ($1, $2)', [analysis.testId, analysis.failureCount]);
        }
    }
    async getTestExecutionHistory(entityId, limit) {
        await this.simulateLatency();
        const history = [];
        const count = Math.min(limit || 10, 5);
        for (let i = 0; i < count; i++) {
            history.push({
                test_id: `test-${entityId}-${i}`,
                test_name: `Test ${i}`,
                status: this.rng() > 0.3 ? 'passed' : 'failed',
                duration: Math.floor(this.rng() * 1000),
                timestamp: new Date(Date.now() - i * 86400000)
            });
        }
        return history;
    }
    async getPerformanceMetricsHistory(entityId, days) {
        await this.simulateLatency();
        const metrics = [];
        const count = days || 7;
        for (let i = 0; i < count; i++) {
            metrics.push({
                entity_id: entityId,
                metric_type: 'response_time',
                value: 50 + this.rng() * 200,
                timestamp: new Date(Date.now() - i * 86400000)
            });
        }
        return metrics;
    }
    async getCoverageHistory(entityId, days) {
        await this.simulateLatency();
        const coverage = [];
        const count = days || 7;
        for (let i = 0; i < count; i++) {
            const total = 1000 + Math.floor(this.rng() * 500);
            const covered = Math.floor(total * (0.6 + this.rng() * 0.35));
            coverage.push({
                entity_id: entityId,
                percentage: (covered / total) * 100,
                lines_covered: covered,
                lines_total: total,
                timestamp: new Date(Date.now() - i * 86400000)
            });
        }
        return coverage;
    }
    // Test helper methods
    getTransactionCount() {
        return this.transactionCount;
    }
    getQueryLog() {
        return this.queryLog;
    }
    async simulateLatency() {
        if (this.config.latencyMs) {
            await new Promise(resolve => setTimeout(resolve, this.config.latencyMs));
        }
    }
    shouldFail() {
        return this.rng() * 100 < (this.config.failureRate ?? 0);
    }
    generateRealisticRows() {
        const count = Math.floor(this.rng() * 10);
        const rows = [];
        for (let i = 0; i < count; i++) {
            rows.push({
                id: i + 1,
                name: `Item ${i}`,
                created_at: new Date(),
                metadata: { index: i }
            });
        }
        return rows;
    }
}
/**
 * Realistic Redis mock with TTL and memory simulation
 */
export class RealisticRedisMock {
    initialized = false;
    config;
    store = new Map();
    rngState = 1 >>> 0;
    rng() {
        this.rngState = (1664525 * this.rngState + 1013904223) >>> 0;
        return (this.rngState >>> 8) / 0x01000000;
    }
    constructor(config = {}) {
        this.config = config;
        if (typeof config.seed === 'number') {
            this.rngState = (config.seed >>> 0);
        }
    }
    async initialize() {
        if (this.config.connectionFailures && this.rng() < 0.2) {
            throw new Error('Redis connection failed: Connection timeout');
        }
        await this.simulateLatency();
        this.initialized = true;
    }
    async close() {
        await this.simulateLatency();
        this.initialized = false;
        this.store.clear();
    }
    isInitialized() {
        return this.initialized;
    }
    async get(key) {
        if (!this.initialized) {
            throw new Error('Redis not initialized');
        }
        await this.simulateLatency();
        if (this.shouldFail()) {
            throw new Error('Redis GET failed: Connection reset');
        }
        const item = this.store.get(key);
        if (!item) {
            return null;
        }
        // Check TTL expiry
        if (item.ttl && Date.now() - item.setAt > item.ttl * 1000) {
            this.store.delete(key);
            return null;
        }
        return item.value;
    }
    async set(key, value, ttl) {
        if (!this.initialized) {
            throw new Error('Redis not initialized');
        }
        await this.simulateLatency();
        if (this.shouldFail()) {
            throw new Error('Redis SET failed: Out of memory');
        }
        // Simulate memory limit
        if (this.store.size > 1000 && this.rng() < 0.1) {
            throw new Error('Redis memory limit exceeded');
        }
        this.store.set(key, {
            value,
            ttl,
            setAt: Date.now()
        });
    }
    async del(key) {
        if (!this.initialized) {
            throw new Error('Redis not initialized');
        }
        await this.simulateLatency();
        if (this.shouldFail()) {
            throw new Error('Redis DEL failed: Command timeout');
        }
        const existed = this.store.has(key);
        this.store.delete(key);
        return existed ? 1 : 0;
    }
    async healthCheck() {
        return this.initialized && this.rng() > 0.1;
    }
    // Test helper methods
    getStoreSize() {
        return this.store.size;
    }
    async simulateLatency() {
        if (this.config.latencyMs) {
            await new Promise(resolve => setTimeout(resolve, this.config.latencyMs));
        }
    }
    shouldFail() {
        return this.rng() * 100 < (this.config.failureRate ?? 0);
    }
}
//# sourceMappingURL=realistic-mocks.js.map
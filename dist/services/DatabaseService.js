/**
 * Database Service for Memento
 * Manages connections to FalkorDB, Qdrant, and PostgreSQL
 *
 */
import { createClient as createRedisClient } from 'redis';
import { QdrantClient } from '@qdrant/js-client-rest';
import { Pool } from 'pg';
export class DatabaseService {
    config;
    falkordbClient;
    qdrantClient;
    postgresPool;
    redisClient;
    initialized = false;
    constructor(config) {
        this.config = config;
    }
    async initialize() {
        if (this.initialized) {
            return;
        }
        try {
            // Initialize FalkorDB (Redis-based)
            this.falkordbClient = createRedisClient({
                url: this.config.falkordb.url,
                database: this.config.falkordb.database || 0,
            });
            await this.falkordbClient.connect();
            // Initialize Qdrant
            this.qdrantClient = new QdrantClient({
                url: this.config.qdrant.url,
                apiKey: this.config.qdrant.apiKey,
            });
            // Test Qdrant connection
            await this.qdrantClient.getCollections();
            // Initialize PostgreSQL
            this.postgresPool = new Pool({
                connectionString: this.config.postgresql.connectionString,
                max: this.config.postgresql.max || 20,
                idleTimeoutMillis: this.config.postgresql.idleTimeoutMillis || 30000,
            });
            // Test PostgreSQL connection
            const client = await this.postgresPool.connect();
            await client.query('SELECT NOW()');
            client.release();
            // Initialize Redis (optional, for caching)
            if (this.config.redis) {
                this.redisClient = createRedisClient({
                    url: this.config.redis.url,
                });
                await this.redisClient.connect();
            }
            this.initialized = true;
            console.log('✅ All database connections established');
        }
        catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }
    async close() {
        if (this.falkordbClient) {
            await this.falkordbClient.disconnect();
        }
        if (this.postgresPool) {
            await this.postgresPool.end();
        }
        if (this.redisClient) {
            await this.redisClient.disconnect();
        }
        this.initialized = false;
    }
    // FalkorDB operations
    async falkordbQuery(query, params = {}) {
        if (!this.initialized) {
            throw new Error('Database not initialized');
        }
        try {
            // FalkorDB doesn't support parameterized queries like traditional databases
            // We need to substitute parameters directly in the query string
            let processedQuery = query;
            // Replace $param placeholders with actual values
            for (const [key, value] of Object.entries(params)) {
                const placeholder = `$${key}`;
                let replacementValue;
                if (typeof value === 'string') {
                    // Escape single quotes in strings and wrap in quotes
                    replacementValue = `'${value.replace(/'/g, "\\'")}'`;
                }
                else if (typeof value === 'object' && value !== null) {
                    // For objects, convert to property format for Cypher
                    replacementValue = this.objectToCypherProperties(value);
                }
                else if (value === null || value === undefined) {
                    replacementValue = 'null';
                }
                else {
                    replacementValue = String(value);
                }
                processedQuery = processedQuery.replace(new RegExp(`\\${placeholder}`, 'g'), replacementValue);
            }
            const result = await this.falkordbClient.sendCommand(['GRAPH.QUERY', 'memento', processedQuery]);
            // FalkorDB returns results in a specific format:
            // [headers, data, statistics]
            if (result && Array.isArray(result)) {
                if (result.length === 3) {
                    // Standard query result format
                    const headers = result[0];
                    const data = result[1];
                    // If there's no data, return empty array
                    if (!data || (Array.isArray(data) && data.length === 0)) {
                        return [];
                    }
                    // Parse the data into objects using headers
                    if (Array.isArray(headers) && Array.isArray(data)) {
                        return data.map((row) => {
                            const obj = {};
                            if (Array.isArray(row)) {
                                headers.forEach((header, index) => {
                                    const headerName = String(header);
                                    obj[headerName] = row[index];
                                });
                            }
                            return obj;
                        });
                    }
                    return data;
                }
                else if (result.length === 1) {
                    // Write operation result (CREATE, SET, DELETE)
                    return result[0];
                }
            }
            return result;
        }
        catch (error) {
            console.error('FalkorDB query error:', error);
            console.error('Query was:', query);
            console.error('Params were:', params);
            throw error;
        }
    }
    objectToCypherProperties(obj) {
        const props = Object.entries(obj)
            .map(([key, value]) => {
            if (typeof value === 'string') {
                return `${key}: '${value.replace(/'/g, "\\'")}'`;
            }
            else if (Array.isArray(value)) {
                // Handle arrays properly for Cypher
                const arrayElements = value.map(item => {
                    if (typeof item === 'string') {
                        return `'${item.replace(/'/g, "\\'")}'`;
                    }
                    else if (item === null || item === undefined) {
                        return 'null';
                    }
                    else {
                        return String(item);
                    }
                });
                return `${key}: [${arrayElements.join(', ')}]`;
            }
            else if (value === null || value === undefined) {
                return `${key}: null`;
            }
            else if (typeof value === 'boolean' || typeof value === 'number') {
                return `${key}: ${value}`;
            }
            else {
                // For other types, convert to string and quote
                return `${key}: '${String(value).replace(/'/g, "\\'")}'`;
            }
        })
            .join(', ');
        return `{${props}}`;
    }
    async falkordbCommand(...args) {
        if (!this.initialized) {
            throw new Error('Database not initialized');
        }
        return this.falkordbClient.sendCommand(args);
    }
    // Qdrant operations
    get qdrant() {
        if (!this.initialized) {
            throw new Error('Database not initialized');
        }
        return this.qdrantClient;
    }
    // PostgreSQL operations
    async postgresQuery(query, params = []) {
        if (!this.initialized) {
            throw new Error('Database not initialized');
        }
        const client = await this.postgresPool.connect();
        try {
            const result = await client.query(query, params);
            return result;
        }
        finally {
            client.release();
        }
    }
    async postgresTransaction(callback) {
        if (!this.initialized) {
            throw new Error('Database not initialized');
        }
        const client = await this.postgresPool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    // Redis operations (optional caching)
    async redisGet(key) {
        if (!this.redisClient) {
            throw new Error('Redis not configured');
        }
        return this.redisClient.get(key);
    }
    async redisSet(key, value, ttl) {
        if (!this.redisClient) {
            throw new Error('Redis not configured');
        }
        if (ttl) {
            await this.redisClient.setEx(key, ttl, value);
        }
        else {
            await this.redisClient.set(key, value);
        }
    }
    async redisDel(key) {
        if (!this.redisClient) {
            throw new Error('Redis not configured');
        }
        return this.redisClient.del(key);
    }
    // Health checks
    async healthCheck() {
        const results = {
            falkordb: false,
            qdrant: false,
            postgresql: false,
            redis: undefined,
        };
        try {
            await this.falkordbClient.ping();
            results.falkordb = true;
        }
        catch (error) {
            console.error('FalkorDB health check failed:', error);
        }
        try {
            // Check if Qdrant is accessible by attempting to get collection info
            await this.qdrantClient.getCollections();
            results.qdrant = true;
        }
        catch (error) {
            console.error('Qdrant health check failed:', error);
        }
        try {
            const client = await this.postgresPool.connect();
            await client.query('SELECT 1');
            client.release();
            results.postgresql = true;
        }
        catch (error) {
            console.error('PostgreSQL health check failed:', error);
        }
        if (this.redisClient) {
            try {
                await this.redisClient.ping();
                results.redis = true;
            }
            catch (error) {
                console.error('Redis health check failed:', error);
                results.redis = false;
            }
        }
        return results;
    }
    // Database setup and migrations
    async setupDatabase() {
        if (!this.initialized) {
            throw new Error('Database not initialized');
        }
        console.log('🔧 Setting up database schema...');
        // PostgreSQL schema setup
        const postgresSchema = `
      -- Create extensions
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pg_trgm";

      -- Documents table for storing various document types
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        type VARCHAR(50) NOT NULL,
        content JSONB,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Indexes for documents
      CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
      CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
      CREATE INDEX IF NOT EXISTS idx_documents_content_gin ON documents USING GIN(content);

      -- Sessions table for tracking AI agent sessions
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        agent_type VARCHAR(50) NOT NULL,
        user_id VARCHAR(255),
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) DEFAULT 'active',
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Changes table for tracking codebase changes
      CREATE TABLE IF NOT EXISTS changes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        change_type VARCHAR(20) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        author VARCHAR(255),
        commit_hash VARCHAR(255),
        diff TEXT,
        previous_state JSONB,
        new_state JSONB,
        session_id UUID REFERENCES sessions(id),
        spec_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Indexes for changes
      CREATE INDEX IF NOT EXISTS idx_changes_entity_id ON changes(entity_id);
      CREATE INDEX IF NOT EXISTS idx_changes_timestamp ON changes(timestamp);
      CREATE INDEX IF NOT EXISTS idx_changes_session_id ON changes(session_id);

      -- Test results table
      CREATE TABLE IF NOT EXISTS test_results (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        test_id VARCHAR(255) NOT NULL,
        test_suite VARCHAR(255),
        test_name VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL,
        duration INTEGER,
        error_message TEXT,
        stack_trace TEXT,
        coverage JSONB,
        performance JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Indexes for test results
      CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON test_results(test_id);
      CREATE INDEX IF NOT EXISTS idx_test_results_timestamp ON test_results(timestamp);
      CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);

      -- Test suites table
      CREATE TABLE IF NOT EXISTS test_suites (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        suite_name VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        framework VARCHAR(50),
        total_tests INTEGER DEFAULT 0,
        passed_tests INTEGER DEFAULT 0,
        failed_tests INTEGER DEFAULT 0,
        skipped_tests INTEGER DEFAULT 0,
        duration INTEGER DEFAULT 0,
        coverage JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(suite_name, timestamp)
      );

      -- Test coverage table
      CREATE TABLE IF NOT EXISTS test_coverage (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        test_id VARCHAR(255) NOT NULL,
        suite_id UUID REFERENCES test_suites(id),
        lines DECIMAL(5,2) DEFAULT 0,
        branches DECIMAL(5,2) DEFAULT 0,
        functions DECIMAL(5,2) DEFAULT 0,
        statements DECIMAL(5,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Test performance table
      CREATE TABLE IF NOT EXISTS test_performance (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        test_id VARCHAR(255) NOT NULL,
        suite_id UUID REFERENCES test_suites(id),
        memory_usage BIGINT,
        cpu_usage DECIMAL(5,2),
        network_requests INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Flaky test analyses table
      CREATE TABLE IF NOT EXISTS flaky_test_analyses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        test_id VARCHAR(255) NOT NULL UNIQUE,
        test_name VARCHAR(255) NOT NULL,
        flaky_score DECIMAL(3,2) DEFAULT 0,
        total_runs INTEGER DEFAULT 0,
        failure_rate DECIMAL(5,4) DEFAULT 0,
        success_rate DECIMAL(5,4) DEFAULT 0,
        recent_failures INTEGER DEFAULT 0,
        patterns JSONB,
        recommendations JSONB,
        analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Indexes for test tables
      CREATE INDEX IF NOT EXISTS idx_test_suites_timestamp ON test_suites(timestamp);
      CREATE INDEX IF NOT EXISTS idx_test_suites_framework ON test_suites(framework);
      CREATE INDEX IF NOT EXISTS idx_test_coverage_test_id ON test_coverage(test_id);
      CREATE INDEX IF NOT EXISTS idx_test_coverage_suite_id ON test_coverage(suite_id);
      CREATE INDEX IF NOT EXISTS idx_test_performance_test_id ON test_performance(test_id);
      CREATE INDEX IF NOT EXISTS idx_test_performance_suite_id ON test_performance(suite_id);
      CREATE INDEX IF NOT EXISTS idx_flaky_test_analyses_test_id ON flaky_test_analyses(test_id);
      CREATE INDEX IF NOT EXISTS idx_flaky_test_analyses_flaky_score ON flaky_test_analyses(flaky_score);
    `;
        await this.postgresQuery(postgresSchema);
        // FalkorDB graph setup
        try {
            // Create graph if it doesn't exist
            await this.falkordbCommand('GRAPH.QUERY', 'memento', 'MATCH (n) RETURN count(n) LIMIT 1');
            console.log('📊 Setting up FalkorDB graph indexes...');
            // Create indexes for better query performance
            // Index on node ID for fast lookups
            await this.falkordbCommand('GRAPH.QUERY', 'memento', 'CREATE INDEX FOR (n:Entity) ON (n.id)');
            // Index on node type for filtering
            await this.falkordbCommand('GRAPH.QUERY', 'memento', 'CREATE INDEX FOR (n:Entity) ON (n.type)');
            // Index on node path for file-based queries
            await this.falkordbCommand('GRAPH.QUERY', 'memento', 'CREATE INDEX FOR (n:Entity) ON (n.path)');
            // Index on node language for language-specific queries
            await this.falkordbCommand('GRAPH.QUERY', 'memento', 'CREATE INDEX FOR (n:Entity) ON (n.language)');
            // Index on lastModified for temporal queries
            await this.falkordbCommand('GRAPH.QUERY', 'memento', 'CREATE INDEX FOR (n:Entity) ON (n.lastModified)');
            // Composite index for common query patterns
            await this.falkordbCommand('GRAPH.QUERY', 'memento', 'CREATE INDEX FOR (n:Entity) ON (n.type, n.path)');
            console.log('✅ FalkorDB graph indexes created');
        }
        catch (error) {
            // Graph doesn't exist, it will be created on first write
            console.log('📊 FalkorDB graph will be created on first write operation with indexes');
        }
        // Qdrant setup
        try {
            // Create collections if they don't exist
            const collections = await this.qdrantClient.getCollections();
            const existingCollections = collections.collections.map(c => c.name);
            if (!existingCollections.includes('code_embeddings')) {
                await this.qdrantClient.createCollection('code_embeddings', {
                    vectors: {
                        size: 1536, // OpenAI Ada-002 dimensions
                        distance: 'Cosine',
                    },
                });
            }
            if (!existingCollections.includes('documentation_embeddings')) {
                await this.qdrantClient.createCollection('documentation_embeddings', {
                    vectors: {
                        size: 1536,
                        distance: 'Cosine',
                    },
                });
            }
            console.log('✅ Database schema setup complete');
        }
        catch (error) {
            console.error('❌ Database setup failed:', error);
            throw error;
        }
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
        const client = await this.postgresPool.connect();
        try {
            await client.query('BEGIN');
            // Insert test suite result
            const suiteQuery = `
        INSERT INTO test_suites (suite_name, timestamp, framework, total_tests, passed_tests, failed_tests, skipped_tests, duration)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (suite_name, timestamp) DO NOTHING
        RETURNING id
      `;
            const suiteValues = [
                suiteResult.suiteName,
                suiteResult.timestamp,
                suiteResult.framework,
                suiteResult.totalTests,
                suiteResult.passedTests,
                suiteResult.failedTests,
                suiteResult.skippedTests,
                suiteResult.duration
            ];
            const suiteResultQuery = await client.query(suiteQuery, suiteValues);
            const suiteId = suiteResultQuery.rows[0]?.id;
            if (suiteId) {
                // Insert individual test results
                for (const result of suiteResult.results) {
                    const testQuery = `
            INSERT INTO test_results (suite_id, test_id, test_name, status, duration, error_message, stack_trace)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `;
                    await client.query(testQuery, [
                        suiteId,
                        result.testId,
                        result.testName,
                        result.status,
                        result.duration,
                        result.errorMessage,
                        result.stackTrace
                    ]);
                    // Insert coverage data if available
                    if (result.coverage) {
                        const coverageQuery = `
              INSERT INTO test_coverage (test_id, suite_id, lines, branches, functions, statements)
              VALUES ($1, $2, $3, $4, $5, $6)
            `;
                        await client.query(coverageQuery, [
                            result.testId,
                            suiteId,
                            result.coverage.lines,
                            result.coverage.branches,
                            result.coverage.functions,
                            result.coverage.statements
                        ]);
                    }
                    // Insert performance data if available
                    if (result.performance) {
                        const perfQuery = `
              INSERT INTO test_performance (test_id, suite_id, memory_usage, cpu_usage, network_requests)
              VALUES ($1, $2, $3, $4, $5)
            `;
                        await client.query(perfQuery, [
                            result.testId,
                            suiteId,
                            result.performance.memoryUsage,
                            result.performance.cpuUsage,
                            result.performance.networkRequests
                        ]);
                    }
                }
            }
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Store flaky test analyses
     */
    async storeFlakyTestAnalyses(analyses) {
        if (!this.initialized) {
            throw new Error('Database service not initialized');
        }
        const client = await this.postgresPool.connect();
        try {
            await client.query('BEGIN');
            for (const analysis of analyses) {
                const query = `
          INSERT INTO flaky_test_analyses (test_id, test_name, flaky_score, total_runs, failure_rate, success_rate, recent_failures, patterns, recommendations, analyzed_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (test_id) DO UPDATE SET
            flaky_score = EXCLUDED.flaky_score,
            total_runs = EXCLUDED.total_runs,
            failure_rate = EXCLUDED.failure_rate,
            success_rate = EXCLUDED.success_rate,
            recent_failures = EXCLUDED.recent_failures,
            patterns = EXCLUDED.patterns,
            recommendations = EXCLUDED.recommendations,
            analyzed_at = EXCLUDED.analyzed_at
        `;
                await client.query(query, [
                    analysis.testId,
                    analysis.testName,
                    analysis.flakyScore,
                    analysis.totalRuns,
                    analysis.failureRate,
                    analysis.successRate,
                    analysis.recentFailures,
                    JSON.stringify(analysis.patterns),
                    JSON.stringify(analysis.recommendations),
                    new Date()
                ]);
            }
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Get test execution history for an entity
     */
    async getTestExecutionHistory(entityId, limit = 50) {
        if (!this.initialized) {
            throw new Error('Database service not initialized');
        }
        const client = await this.postgresPool.connect();
        try {
            const query = `
        SELECT tr.*, ts.suite_name, ts.framework, ts.timestamp as suite_timestamp
        FROM test_results tr
        JOIN test_suites ts ON tr.suite_id = ts.id
        WHERE tr.test_id = $1
        ORDER BY ts.timestamp DESC
        LIMIT $2
      `;
            const result = await client.query(query, [entityId, limit]);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
    /**
     * Get performance metrics history
     */
    async getPerformanceMetricsHistory(entityId, days = 30) {
        if (!this.initialized) {
            throw new Error('Database service not initialized');
        }
        const client = await this.postgresPool.connect();
        try {
            const query = `
        SELECT tp.*, ts.timestamp
        FROM test_performance tp
        JOIN test_suites ts ON tp.suite_id = ts.id
        WHERE tp.test_id = $1 AND ts.timestamp >= NOW() - INTERVAL '${days} days'
        ORDER BY ts.timestamp DESC
      `;
            const result = await client.query(query, [entityId]);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
    /**
     * Get coverage history
     */
    async getCoverageHistory(entityId, days = 30) {
        if (!this.initialized) {
            throw new Error('Database service not initialized');
        }
        const client = await this.postgresPool.connect();
        try {
            const query = `
        SELECT tc.*, ts.timestamp
        FROM test_coverage tc
        JOIN test_suites ts ON tc.suite_id = ts.id
        WHERE tc.test_id = $1 AND ts.timestamp >= NOW() - INTERVAL '${days} days'
        ORDER BY ts.timestamp DESC
      `;
            const result = await client.query(query, [entityId]);
            return result.rows;
        }
        finally {
            client.release();
        }
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
    return {
        falkordb: {
            url: process.env.FALKORDB_URL || 'redis://localhost:6379',
            database: 0,
        },
        qdrant: {
            url: process.env.QDRANT_URL || 'http://localhost:6333',
            apiKey: process.env.QDRANT_API_KEY,
        },
        postgresql: {
            connectionString: process.env.DATABASE_URL || 'postgresql://memento:memento@localhost:5432/memento',
            max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
            idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
        },
        redis: process.env.REDIS_URL ? {
            url: process.env.REDIS_URL,
        } : undefined,
    };
}
//# sourceMappingURL=DatabaseService.js.map
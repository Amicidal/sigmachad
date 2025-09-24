import { normalizeMetricIdForId } from "../../utils/codeEdges.js";
import { sanitizeEnvironment } from "../../utils/environment.js";
import { performance } from "node:perf_hooks";
export class PostgreSQLService {
    constructor(config, options) {
        this.initialized = false;
        this.bulkMetrics = {
            activeBatches: 0,
            maxConcurrentBatches: 0,
            totalBatches: 0,
            totalQueries: 0,
            totalDurationMs: 0,
            maxBatchSize: 0,
            maxQueueDepth: 0,
            maxDurationMs: 0,
            averageDurationMs: 0,
            lastBatch: null,
            history: [],
            slowBatches: [],
        };
        this.bulkInstrumentationConfig = {
            warnOnLargeBatchSize: 50,
            slowBatchThresholdMs: 750,
            queueDepthWarningThreshold: 3,
            historyLimit: 10,
        };
        this.config = config;
        this.poolFactory = options === null || options === void 0 ? void 0 : options.poolFactory;
        if (options === null || options === void 0 ? void 0 : options.bulkConfig) {
            this.bulkInstrumentationConfig = {
                ...this.bulkInstrumentationConfig,
                ...options.bulkConfig,
            };
        }
        this.bulkTelemetryEmitter = options === null || options === void 0 ? void 0 : options.bulkTelemetryEmitter;
        // Sanitize instrumentation config values
        this.bulkInstrumentationConfig.historyLimit = Math.max(0, Math.floor(this.bulkInstrumentationConfig.historyLimit));
        this.bulkInstrumentationConfig.warnOnLargeBatchSize = Math.max(1, Math.floor(this.bulkInstrumentationConfig.warnOnLargeBatchSize));
        this.bulkInstrumentationConfig.slowBatchThresholdMs = Math.max(0, this.bulkInstrumentationConfig.slowBatchThresholdMs);
        this.bulkInstrumentationConfig.queueDepthWarningThreshold = Math.max(0, Math.floor(this.bulkInstrumentationConfig.queueDepthWarningThreshold));
    }
    async initialize() {
        if (this.initialized) {
            return;
        }
        try {
            // Use injected poolFactory when provided (for tests) else create Pool
            if (this.poolFactory) {
                this.postgresPool = this.poolFactory();
                // Also configure type parsers for test pools
                const { types } = await import("pg");
                // Configure numeric type parsing for test environments
                types.setTypeParser(1700, (value) => parseFloat(value)); // numeric/decimal
                types.setTypeParser(701, (value) => parseFloat(value)); // real/float4
                types.setTypeParser(700, (value) => parseFloat(value)); // float8/double precision
                types.setTypeParser(21, (value) => parseInt(value, 10)); // int2/smallint
                types.setTypeParser(23, (value) => parseInt(value, 10)); // int4/integer
                types.setTypeParser(20, (value) => parseInt(value, 10)); // int8/bigint
            }
            else {
                // Dynamically import pg so test mocks (vi.mock) reliably intercept
                const { Pool, types } = await import("pg");
                // Configure JSONB parsing based on environment
                if (process.env.NODE_ENV === "test" ||
                    process.env.RUN_INTEGRATION === "1") {
                    // In tests, parse JSONB as objects for easier assertions (callers can re-stringify if needed)
                    types.setTypeParser(3802, (value) => JSON.parse(value)); // JSONB oid = 3802
                }
                else {
                    // In production, return raw string for performance
                    types.setTypeParser(3802, (value) => value); // JSONB oid = 3802
                }
                // Configure numeric type parsing for all environments
                // Parse numeric, decimal, real, and double precision as numbers
                types.setTypeParser(1700, (value) => parseFloat(value)); // numeric/decimal
                types.setTypeParser(701, (value) => parseFloat(value)); // real/float4
                types.setTypeParser(700, (value) => parseFloat(value)); // float8/double precision
                types.setTypeParser(21, (value) => parseInt(value, 10)); // int2/smallint
                types.setTypeParser(23, (value) => parseInt(value, 10)); // int4/integer
                types.setTypeParser(20, (value) => parseInt(value, 10)); // int8/bigint
                this.postgresPool = new Pool({
                    connectionString: this.config.connectionString,
                    max: this.config.max || 20,
                    idleTimeoutMillis: this.config.idleTimeoutMillis || 30000,
                    connectionTimeoutMillis: this.config.connectionTimeoutMillis || 10000,
                });
            }
            // Always validate the connection using a client
            const client = await this.postgresPool.connect();
            try {
                await client.query("SELECT NOW()");
            }
            finally {
                client.release();
            }
            this.initialized = true;
            console.log("✅ PostgreSQL connection established");
        }
        catch (error) {
            console.error("❌ PostgreSQL initialization failed:", error);
            throw error;
        }
    }
    async close() {
        try {
            if (this.postgresPool &&
                typeof this.postgresPool.end === "function") {
                await this.postgresPool.end();
            }
        }
        catch (err) {
            // Swallow pool close errors to align with graceful shutdown expectations
        }
        finally {
            // Ensure subsequent close calls are no-ops
            // and prevent using a stale pool after close
            this.postgresPool = undefined;
            this.initialized = false;
        }
    }
    isInitialized() {
        return this.initialized;
    }
    getPool() {
        if (!this.initialized) {
            throw new Error("PostgreSQL not initialized");
        }
        return this.postgresPool;
    }
    validateUuid(id) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
    }
    validateQueryParams(params) {
        for (let i = 0; i < params.length; i++) {
            const param = params[i];
            if (typeof param === "string" && param.length === 36) {
                // Only validate strings that look like UUIDs (contain hyphens in UUID format)
                // This avoids false positives with JSON strings that happen to be 36 characters
                if (param.includes("-") && !this.validateUuid(param)) {
                    throw new Error(`Parameter at index ${i} appears to be a UUID but is invalid: ${param}`);
                }
            }
        }
    }
    async query(query, params = [], options = {}) {
        if (!this.initialized) {
            throw new Error("PostgreSQL not initialized");
        }
        const client = await this.postgresPool.connect();
        const timeout = options.timeout || 30000; // 30 second default timeout
        // Validate parameters for UUID format
        this.validateQueryParams(params);
        try {
            // Set statement timeout to prevent hanging queries
            await client.query(`SET statement_timeout = ${timeout}`);
            const result = await client.query(query, params);
            return result;
        }
        catch (error) {
            console.error("PostgreSQL query error:", error);
            console.error("Query was:", query);
            console.error("Params were:", params);
            throw error;
        }
        finally {
            try {
                client.release();
            }
            catch (releaseError) {
                console.error("Error releasing PostgreSQL client:", releaseError);
            }
        }
    }
    async transaction(callback, options = {}) {
        if (!this.initialized) {
            throw new Error("PostgreSQL not initialized");
        }
        const client = await this.postgresPool.connect();
        const timeout = options.timeout || 30000; // 30 second default timeout
        try {
            // Set transaction timeout
            await client.query(`SET statement_timeout = ${timeout}`);
            // Start transaction with proper isolation level
            if (options.isolationLevel) {
                await client.query(`BEGIN ISOLATION LEVEL ${options.isolationLevel}`);
            }
            else {
                await client.query("BEGIN");
            }
            // Note: We can't validate parameters here since they're passed to the callback
            // The callback should handle its own parameter validation
            const result = await callback(client);
            await client.query("COMMIT");
            return result;
        }
        catch (error) {
            console.error("Transaction error:", error);
            try {
                await client.query("ROLLBACK");
            }
            catch (rollbackError) {
                console.error("Error during rollback:", rollbackError);
                // Don't throw rollback error, throw original error instead
            }
            throw error;
        }
        finally {
            try {
                client.release();
            }
            catch (releaseError) {
                console.error("Error releasing PostgreSQL client in transaction:", releaseError);
            }
        }
    }
    async bulkQuery(queries, options = {}) {
        var _a;
        if (!this.initialized) {
            throw new Error("PostgreSQL not initialized");
        }
        // Validate all query parameters
        for (const query of queries) {
            this.validateQueryParams(query.params);
        }
        const batchSize = queries.length;
        const continueOnError = (_a = options === null || options === void 0 ? void 0 : options.continueOnError) !== null && _a !== void 0 ? _a : false;
        const results = [];
        const startedAtIso = new Date().toISOString();
        const startTime = performance.now();
        let client = null;
        let transactionStarted = false;
        let capturedError;
        const activeAtStart = ++this.bulkMetrics.activeBatches;
        if (this.bulkMetrics.activeBatches > this.bulkMetrics.maxConcurrentBatches) {
            this.bulkMetrics.maxConcurrentBatches = this.bulkMetrics.activeBatches;
        }
        const queueDepthAtStart = Math.max(0, activeAtStart - 1);
        if (queueDepthAtStart > this.bulkMetrics.maxQueueDepth) {
            this.bulkMetrics.maxQueueDepth = queueDepthAtStart;
        }
        try {
            client = await this.postgresPool.connect();
            if (continueOnError) {
                // Execute queries independently to avoid aborting the whole transaction
                for (const { query, params } of queries) {
                    try {
                        const result = await client.query(query, params);
                        results.push(result);
                    }
                    catch (error) {
                        console.warn("Bulk query error (continuing):", error);
                        results.push({ error });
                    }
                }
                return results;
            }
            await client.query("BEGIN");
            transactionStarted = true;
            for (const { query, params } of queries) {
                const result = await client.query(query, params);
                results.push(result);
            }
            await client.query("COMMIT");
            transactionStarted = false;
            return results;
        }
        catch (error) {
            capturedError = error;
            if (transactionStarted && client) {
                try {
                    await client.query("ROLLBACK");
                }
                catch (_b) { }
            }
            throw error;
        }
        finally {
            const durationMs = performance.now() - startTime;
            if (client) {
                try {
                    client.release();
                }
                catch (releaseError) {
                    console.error("Error releasing PostgreSQL client in bulk operation:", releaseError);
                }
            }
            this.bulkMetrics.activeBatches = Math.max(0, this.bulkMetrics.activeBatches - 1);
            this.recordBulkOperationTelemetry({
                batchSize,
                continueOnError,
                durationMs,
                startedAt: startedAtIso,
                queueDepth: queueDepthAtStart,
                error: capturedError,
            });
        }
    }
    recordBulkOperationTelemetry(params) {
        const safeDuration = Number.isFinite(params.durationMs)
            ? Math.max(0, params.durationMs)
            : 0;
        const roundedDuration = Number(safeDuration.toFixed(3));
        const entry = {
            batchSize: params.batchSize,
            continueOnError: params.continueOnError,
            durationMs: roundedDuration,
            startedAt: params.startedAt,
            finishedAt: new Date().toISOString(),
            queueDepth: Math.max(0, params.queueDepth || 0),
            mode: params.continueOnError ? "independent" : "transaction",
            success: !params.error,
            error: params.error
                ? params.error instanceof Error
                    ? params.error.message
                    : String(params.error)
                : undefined,
        };
        this.bulkMetrics.totalBatches += 1;
        this.bulkMetrics.totalQueries += params.batchSize;
        this.bulkMetrics.totalDurationMs += roundedDuration;
        this.bulkMetrics.averageDurationMs =
            this.bulkMetrics.totalBatches === 0
                ? 0
                : this.bulkMetrics.totalDurationMs / this.bulkMetrics.totalBatches;
        this.bulkMetrics.maxBatchSize = Math.max(this.bulkMetrics.maxBatchSize, params.batchSize);
        this.bulkMetrics.maxDurationMs = Math.max(this.bulkMetrics.maxDurationMs, roundedDuration);
        this.bulkMetrics.maxQueueDepth = Math.max(this.bulkMetrics.maxQueueDepth, entry.queueDepth);
        this.bulkMetrics.lastBatch = entry;
        this.appendTelemetryRecord(this.bulkMetrics.history, entry);
        const shouldTrackSlowBatch = !entry.success ||
            entry.durationMs >= this.bulkInstrumentationConfig.slowBatchThresholdMs ||
            entry.batchSize >= this.bulkInstrumentationConfig.warnOnLargeBatchSize ||
            entry.queueDepth >=
                this.bulkInstrumentationConfig.queueDepthWarningThreshold;
        if (shouldTrackSlowBatch) {
            this.appendTelemetryRecord(this.bulkMetrics.slowBatches, entry);
        }
        const snapshot = this.createBulkTelemetrySnapshot();
        this.emitBulkTelemetry(entry, snapshot);
        this.logBulkTelemetry(entry);
    }
    appendTelemetryRecord(collection, entry) {
        const rawLimit = this.bulkInstrumentationConfig.historyLimit;
        const limit = Number.isFinite(rawLimit)
            ? Math.max(0, Math.floor(rawLimit))
            : 10;
        if (limit === 0) {
            collection.length = 0;
            return;
        }
        collection.push(entry);
        if (collection.length > limit) {
            collection.splice(0, collection.length - limit);
        }
    }
    createBulkTelemetrySnapshot() {
        return {
            activeBatches: this.bulkMetrics.activeBatches,
            maxConcurrentBatches: this.bulkMetrics.maxConcurrentBatches,
            totalBatches: this.bulkMetrics.totalBatches,
            totalQueries: this.bulkMetrics.totalQueries,
            totalDurationMs: this.bulkMetrics.totalDurationMs,
            maxBatchSize: this.bulkMetrics.maxBatchSize,
            maxQueueDepth: this.bulkMetrics.maxQueueDepth,
            maxDurationMs: this.bulkMetrics.maxDurationMs,
            averageDurationMs: this.bulkMetrics.averageDurationMs,
            lastBatch: this.bulkMetrics.lastBatch
                ? { ...this.bulkMetrics.lastBatch }
                : null,
        };
    }
    emitBulkTelemetry(entry, snapshot) {
        if (!this.bulkTelemetryEmitter) {
            return;
        }
        try {
            this.bulkTelemetryEmitter({
                entry: { ...entry },
                metrics: {
                    ...snapshot,
                    lastBatch: snapshot.lastBatch ? { ...snapshot.lastBatch } : null,
                },
            });
        }
        catch (error) {
            console.error("Bulk telemetry emitter threw an error:", error);
        }
    }
    logBulkTelemetry(entry) {
        var _a;
        const baseMessage = `[PostgreSQLService.bulkQuery] batch=${entry.batchSize} ` +
            `duration=${entry.durationMs.toFixed(2)}ms ` +
            `mode=${entry.mode} queueDepth=${entry.queueDepth}`;
        if (!entry.success) {
            console.error(`${baseMessage} failed: ${(_a = entry.error) !== null && _a !== void 0 ? _a : "unknown error"}`);
            return;
        }
        const isLargeBatch = entry.batchSize >= this.bulkInstrumentationConfig.warnOnLargeBatchSize;
        const isSlow = entry.durationMs >= this.bulkInstrumentationConfig.slowBatchThresholdMs;
        const hasBackpressure = entry.queueDepth >=
            this.bulkInstrumentationConfig.queueDepthWarningThreshold;
        if (isLargeBatch || isSlow || hasBackpressure) {
            const flags = [
                isLargeBatch ? "large-batch" : null,
                isSlow ? "slow" : null,
                hasBackpressure ? "backpressure" : null,
            ]
                .filter(Boolean)
                .join(", ");
            console.warn(`${baseMessage}${flags.length ? ` flags=[${flags}]` : ""}`);
            return;
        }
        console.debug(baseMessage);
    }
    getBulkWriterMetrics() {
        return {
            activeBatches: this.bulkMetrics.activeBatches,
            maxConcurrentBatches: this.bulkMetrics.maxConcurrentBatches,
            totalBatches: this.bulkMetrics.totalBatches,
            totalQueries: this.bulkMetrics.totalQueries,
            totalDurationMs: this.bulkMetrics.totalDurationMs,
            maxBatchSize: this.bulkMetrics.maxBatchSize,
            maxQueueDepth: this.bulkMetrics.maxQueueDepth,
            maxDurationMs: this.bulkMetrics.maxDurationMs,
            averageDurationMs: this.bulkMetrics.averageDurationMs,
            lastBatch: this.bulkMetrics.lastBatch
                ? { ...this.bulkMetrics.lastBatch }
                : null,
            history: this.bulkMetrics.history.map((entry) => ({ ...entry })),
            slowBatches: this.bulkMetrics.slowBatches.map((entry) => ({ ...entry })),
        };
    }
    async setupSchema() {
        if (!this.initialized) {
            throw new Error("PostgreSQL not initialized");
        }
        console.log("🔧 Setting up PostgreSQL schema...");
        // Create extensions first
        try {
            await this.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
            await this.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');
        }
        catch (error) {
            console.warn("Warning: Could not create extensions:", error);
        }
        // Simplified schema setup - create all tables in correct dependency order
        const schemaQueries = [
            // Core tables
            `CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        type VARCHAR(50) NOT NULL,
        content JSONB,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
            `CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        agent_type VARCHAR(50) NOT NULL,
        user_id VARCHAR(255),
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'timeout')),
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
            // Test tables (must be created before changes due to FK)
            `CREATE TABLE IF NOT EXISTS test_suites (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        suite_name VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        framework VARCHAR(50),
        total_tests INTEGER DEFAULT 0,
        passed_tests INTEGER DEFAULT 0,
        failed_tests INTEGER DEFAULT 0,
        skipped_tests INTEGER DEFAULT 0,
        duration INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'unknown',
        coverage JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
            `CREATE TABLE IF NOT EXISTS test_results (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        suite_id UUID REFERENCES test_suites(id),
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
      )`,
            `CREATE TABLE IF NOT EXISTS test_coverage (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        test_id VARCHAR(255) NOT NULL,
        suite_id UUID REFERENCES test_suites(id),
        lines DOUBLE PRECISION DEFAULT 0,
        branches DOUBLE PRECISION DEFAULT 0,
        functions DOUBLE PRECISION DEFAULT 0,
        statements DOUBLE PRECISION DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
            `CREATE TABLE IF NOT EXISTS test_performance (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        test_id VARCHAR(255) NOT NULL,
        suite_id UUID REFERENCES test_suites(id),
        memory_usage INTEGER,
        cpu_usage DOUBLE PRECISION,
        network_requests INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
            `CREATE TABLE IF NOT EXISTS flaky_test_analyses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        test_id VARCHAR(255) NOT NULL UNIQUE,
        test_name VARCHAR(255) NOT NULL,
        failure_count INTEGER DEFAULT 0,
        flaky_score DECIMAL(6,2) DEFAULT 0,
        total_runs INTEGER DEFAULT 0,
        failure_rate DECIMAL(6,4) DEFAULT 0,
        success_rate DECIMAL(6,4) DEFAULT 0,
        recent_failures INTEGER DEFAULT 0,
        patterns JSONB,
        recommendations JSONB,
        analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
            `ALTER TABLE flaky_test_analyses ALTER COLUMN flaky_score TYPE DECIMAL(6,2)`,
            `ALTER TABLE flaky_test_analyses ALTER COLUMN failure_rate TYPE DECIMAL(6,4)`,
            `ALTER TABLE flaky_test_analyses ALTER COLUMN success_rate TYPE DECIMAL(6,4)`,
            `CREATE TABLE IF NOT EXISTS maintenance_backups (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
        size_bytes BIGINT DEFAULT 0,
        checksum TEXT,
        status TEXT NOT NULL,
        components JSONB NOT NULL,
        storage_provider TEXT,
        destination TEXT,
        labels TEXT[] DEFAULT ARRAY[]::TEXT[],
        metadata JSONB NOT NULL,
        error TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
            // Changes table (depends on sessions)
            `CREATE TABLE IF NOT EXISTS changes (
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
      )`,
            `CREATE TABLE IF NOT EXISTS scm_commits (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        commit_hash TEXT NOT NULL UNIQUE,
        branch TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        author TEXT,
        metadata JSONB,
        changes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        related_spec_id TEXT,
        test_results TEXT[] DEFAULT ARRAY[]::TEXT[],
        validation_results JSONB,
        pr_url TEXT,
        provider TEXT,
        status TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
            `CREATE TABLE IF NOT EXISTS performance_metric_snapshots (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        test_id TEXT NOT NULL,
        target_id TEXT,
        metric_id TEXT NOT NULL,
        scenario TEXT,
        environment TEXT,
        severity TEXT,
        trend TEXT,
        unit TEXT,
        baseline_value DOUBLE PRECISION,
        current_value DOUBLE PRECISION,
        delta DOUBLE PRECISION,
        percent_change DOUBLE PRECISION,
        sample_size INTEGER,
        risk_score DOUBLE PRECISION,
        run_id TEXT,
        detected_at TIMESTAMP WITH TIME ZONE,
        resolved_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB,
        metrics_history JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
            `CREATE TABLE IF NOT EXISTS coverage_history (
        entity_id UUID NOT NULL,
        lines_covered INTEGER NOT NULL,
        lines_total INTEGER NOT NULL,
        percentage DOUBLE PRECISION NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
        ];
        // Execute schema creation queries
        for (const query of schemaQueries) {
            try {
                await this.query(query);
            }
            catch (error) {
                console.warn("Warning: Could not execute schema query:", error);
                console.warn("Query was:", query);
            }
        }
        // Add UNIQUE constraints safely
        const constraintQueries = [
            `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'test_suites_suite_name_timestamp_key' AND conrelid = 'test_suites'::regclass) THEN
          ALTER TABLE test_suites ADD CONSTRAINT test_suites_suite_name_timestamp_key UNIQUE (suite_name, timestamp);
        END IF;
      END $$;`,
            `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'test_results_test_id_suite_id_key' AND conrelid = 'test_results'::regclass) THEN
          ALTER TABLE test_results ADD CONSTRAINT test_results_test_id_suite_id_key UNIQUE (test_id, suite_id);
        END IF;
      END $$;`,
            `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'test_coverage_test_id_suite_id_key' AND conrelid = 'test_coverage'::regclass) THEN
          ALTER TABLE test_coverage ADD CONSTRAINT test_coverage_test_id_suite_id_key UNIQUE (test_id, suite_id);
        END IF;
      END $$;`,
            `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'test_performance_test_id_suite_id_key' AND conrelid = 'test_performance'::regclass) THEN
          ALTER TABLE test_performance ADD CONSTRAINT test_performance_test_id_suite_id_key UNIQUE (test_id, suite_id);
        END IF;
      END $$;`,
        ];
        for (const query of constraintQueries) {
            try {
                await this.query(query);
            }
            catch (error) {
                console.warn("Warning: Could not add constraint:", error);
            }
        }
        // Create indexes
        const indexQueries = [
            "CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type)",
            "CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at)",
            "CREATE INDEX IF NOT EXISTS idx_documents_content_gin ON documents USING GIN(content)",
            "CREATE INDEX IF NOT EXISTS idx_changes_entity_id ON changes(entity_id)",
            "CREATE INDEX IF NOT EXISTS idx_changes_timestamp ON changes(timestamp)",
            "CREATE INDEX IF NOT EXISTS idx_changes_session_id ON changes(session_id)",
            "CREATE INDEX IF NOT EXISTS idx_scm_commits_branch ON scm_commits(branch)",
            "CREATE INDEX IF NOT EXISTS idx_scm_commits_created_at ON scm_commits(created_at)",
            "CREATE INDEX IF NOT EXISTS idx_test_suites_timestamp ON test_suites(timestamp)",
            "CREATE INDEX IF NOT EXISTS idx_test_suites_framework ON test_suites(framework)",
            "CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON test_results(test_id)",
            "CREATE INDEX IF NOT EXISTS idx_test_results_timestamp ON test_results(timestamp)",
            "CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status)",
            "CREATE INDEX IF NOT EXISTS idx_test_results_suite_id ON test_results(suite_id)",
            "CREATE INDEX IF NOT EXISTS idx_test_coverage_test_id ON test_coverage(test_id)",
            "CREATE INDEX IF NOT EXISTS idx_test_coverage_suite_id ON test_coverage(suite_id)",
            "CREATE INDEX IF NOT EXISTS idx_test_performance_test_id ON test_performance(test_id)",
            "CREATE INDEX IF NOT EXISTS idx_test_performance_suite_id ON test_performance(suite_id)",
            "CREATE INDEX IF NOT EXISTS idx_flaky_test_analyses_test_id ON flaky_test_analyses(test_id)",
            "CREATE INDEX IF NOT EXISTS idx_flaky_test_analyses_flaky_score ON flaky_test_analyses(flaky_score)",
            "CREATE INDEX IF NOT EXISTS idx_perf_metric_snapshots_test_id ON performance_metric_snapshots(test_id)",
            "CREATE INDEX IF NOT EXISTS idx_perf_metric_snapshots_metric_id ON performance_metric_snapshots(metric_id)",
            "CREATE INDEX IF NOT EXISTS idx_perf_metric_snapshots_environment ON performance_metric_snapshots(environment)",
            "CREATE INDEX IF NOT EXISTS idx_perf_metric_snapshots_severity ON performance_metric_snapshots(severity)",
            "CREATE INDEX IF NOT EXISTS idx_perf_metric_snapshots_trend ON performance_metric_snapshots(trend)",
            "CREATE INDEX IF NOT EXISTS idx_perf_metric_snapshots_metric_env ON performance_metric_snapshots(metric_id, environment)",
            "CREATE INDEX IF NOT EXISTS idx_perf_metric_snapshots_detected ON performance_metric_snapshots(detected_at)",
            "CREATE INDEX IF NOT EXISTS idx_coverage_history_entity_id ON coverage_history(entity_id)",
            "CREATE INDEX IF NOT EXISTS idx_coverage_history_timestamp ON coverage_history(timestamp)",
        ];
        for (const query of indexQueries) {
            try {
                await this.query(query);
            }
            catch (error) {
                console.warn("Warning: Could not create index:", error);
            }
        }
        console.log("✅ PostgreSQL schema setup complete");
    }
    async healthCheck() {
        let client = null;
        try {
            client = await this.postgresPool.connect();
            await client.query("SELECT 1");
            return true;
        }
        catch (error) {
            console.error("PostgreSQL health check failed:", error);
            return false;
        }
        finally {
            if (client) {
                try {
                    client.release();
                }
                catch (releaseError) {
                    console.error("Error releasing PostgreSQL client:", releaseError);
                }
            }
        }
    }
    async storeTestSuiteResult(suiteResult) {
        if (!this.initialized) {
            throw new Error("PostgreSQL service not initialized");
        }
        const result = await this.transaction(async (client) => {
            var _a, _b;
            // First, check if suite already exists
            const existingSuiteQuery = `
        SELECT id FROM test_suites
        WHERE suite_name = $1 AND timestamp = $2
      `;
            const existingSuiteValues = [
                suiteResult.suiteName || suiteResult.name,
                suiteResult.timestamp,
            ];
            const existingSuiteResult = await client.query(existingSuiteQuery, existingSuiteValues);
            let suiteId = (_a = existingSuiteResult.rows[0]) === null || _a === void 0 ? void 0 : _a.id;
            // Insert test suite result if it doesn't exist
            if (!suiteId) {
                const suiteQuery = `
          INSERT INTO test_suites (suite_name, timestamp, framework, total_tests, passed_tests, failed_tests, skipped_tests, duration, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `;
                const suiteValues = [
                    suiteResult.suiteName || suiteResult.name,
                    suiteResult.timestamp,
                    suiteResult.framework,
                    suiteResult.totalTests,
                    suiteResult.passedTests,
                    suiteResult.failedTests,
                    suiteResult.skippedTests,
                    suiteResult.duration,
                    suiteResult.status,
                ];
                const suiteResultQuery = await client.query(suiteQuery, suiteValues);
                suiteId = (_b = suiteResultQuery.rows[0]) === null || _b === void 0 ? void 0 : _b.id;
            }
            if (suiteId) {
                // Insert individual test results
                const resultsArray = Array.isArray(suiteResult.results)
                    ? suiteResult.results
                    : suiteResult.testResults || [];
                let insertedResults = 0;
                for (const result of resultsArray) {
                    const testQuery = `
            INSERT INTO test_results (suite_id, test_id, test_name, status, duration, error_message, stack_trace)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (test_id, suite_id) DO NOTHING
          `;
                    await client.query(testQuery, [
                        suiteId,
                        result.testId,
                        result.testName || result.name,
                        result.status,
                        result.duration,
                        result.errorMessage || result.error,
                        result.stackTrace,
                    ]);
                    insertedResults++;
                    // Insert coverage data if available
                    if (result.coverage) {
                        const coverageQuery = `
              INSERT INTO test_coverage (test_id, suite_id, lines, branches, functions, statements)
              VALUES ($1, $2, $3, $4, $5, $6)
              ON CONFLICT (test_id, suite_id) DO NOTHING
            `;
                        await client.query(coverageQuery, [
                            result.testId,
                            suiteId,
                            result.coverage.lines,
                            result.coverage.branches,
                            result.coverage.functions,
                            result.coverage.statements,
                        ]);
                    }
                    // Insert performance data if available
                    if (result.performance) {
                        const perfQuery = `
              INSERT INTO test_performance (test_id, suite_id, memory_usage, cpu_usage, network_requests)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (test_id, suite_id) DO NOTHING
            `;
                        await client.query(perfQuery, [
                            result.testId,
                            suiteId,
                            result.performance.memoryUsage,
                            result.performance.cpuUsage,
                            result.performance.networkRequests,
                        ]);
                    }
                }
                return {
                    suiteId,
                    suiteName: suiteResult.suiteName || suiteResult.name,
                    insertedResults,
                    timestamp: suiteResult.timestamp,
                };
            }
            return {
                suiteId: null,
                message: "Failed to create or find test suite",
            };
        });
        return result;
    }
    async storeFlakyTestAnalyses(analyses) {
        if (!this.initialized) {
            throw new Error("PostgreSQL service not initialized");
        }
        const result = await this.transaction(async (client) => {
            let insertedCount = 0;
            let updatedCount = 0;
            const processedAnalyses = [];
            for (const analysis of analyses) {
                // First check if the record exists
                const existingQuery = `
          SELECT test_id FROM flaky_test_analyses WHERE test_id = $1
        `;
                const existingResult = await client.query(existingQuery, [
                    analysis.testId,
                ]);
                const exists = existingResult.rows.length > 0;
                const query = `
          INSERT INTO flaky_test_analyses (test_id, test_name, failure_count, flaky_score, total_runs, failure_rate, success_rate, recent_failures, patterns, recommendations, analyzed_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (test_id) DO UPDATE SET
            test_name = EXCLUDED.test_name,
            failure_count = EXCLUDED.failure_count,
            flaky_score = EXCLUDED.flaky_score,
            total_runs = EXCLUDED.total_runs,
            failure_rate = EXCLUDED.failure_rate,
            success_rate = EXCLUDED.success_rate,
            recent_failures = EXCLUDED.recent_failures,
            patterns = EXCLUDED.patterns,
            recommendations = EXCLUDED.recommendations,
            analyzed_at = EXCLUDED.analyzed_at
          RETURNING test_id
        `;
                const result = await client.query(query, [
                    analysis.testId,
                    analysis.testName,
                    Number(analysis.failureCount || analysis.failure_count || 0),
                    Number(analysis.flakyScore || analysis.flaky_score || 0),
                    Number(analysis.totalRuns || analysis.total_runs || 0),
                    Number(analysis.failureRate || analysis.failure_rate || 0),
                    Number(analysis.successRate || analysis.success_rate || 0),
                    Number(analysis.recentFailures || analysis.recent_failures || 0),
                    JSON.stringify(analysis.patterns || analysis.failurePatterns || {}),
                    JSON.stringify(analysis.recommendations || {}),
                    analysis.analyzedAt ||
                        analysis.analyzed_at ||
                        new Date().toISOString(),
                ]);
                if (result.rows.length > 0) {
                    if (exists) {
                        updatedCount++;
                    }
                    else {
                        insertedCount++;
                    }
                    processedAnalyses.push({
                        testId: analysis.testId,
                        testName: analysis.testName,
                        inserted: !exists,
                    });
                }
            }
            return {
                totalProcessed: analyses.length,
                insertedCount,
                updatedCount,
                processedAnalyses,
            };
        });
        return result;
    }
    async recordPerformanceMetricSnapshot(snapshot) {
        var _a, _b, _c, _d, _e, _f, _g;
        if (!this.initialized) {
            throw new Error("PostgreSQL service not initialized");
        }
        const client = await this.postgresPool.connect();
        try {
            const sanitizeNumber = (value) => {
                if (value === null || value === undefined)
                    return null;
                const num = Number(value);
                return Number.isFinite(num) ? num : null;
            };
            const sanitizeInt = (value) => {
                const num = sanitizeNumber(value);
                if (num === null)
                    return null;
                return Math.round(num);
            };
            const metricsHistory = Array.isArray(snapshot.metricsHistory)
                ? snapshot.metricsHistory
                    .slice(-50)
                    .map((entry) => ({
                    ...entry,
                    timestamp: entry.timestamp
                        ? new Date(entry.timestamp).toISOString()
                        : undefined,
                }))
                : null;
            const metadata = {
                ...(snapshot.metadata || {}),
                evidence: snapshot.evidence,
            };
            const query = `
        INSERT INTO performance_metric_snapshots (
          test_id,
          target_id,
          metric_id,
          scenario,
          environment,
          severity,
          trend,
          unit,
          baseline_value,
          current_value,
          delta,
          percent_change,
          sample_size,
          risk_score,
          run_id,
          detected_at,
          resolved_at,
          metadata,
          metrics_history
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `;
            await client.query(query, [
                snapshot.fromEntityId,
                (_a = snapshot.toEntityId) !== null && _a !== void 0 ? _a : null,
                snapshot.metricId,
                (_b = snapshot.scenario) !== null && _b !== void 0 ? _b : null,
                (_c = snapshot.environment) !== null && _c !== void 0 ? _c : null,
                (_d = snapshot.severity) !== null && _d !== void 0 ? _d : null,
                (_e = snapshot.trend) !== null && _e !== void 0 ? _e : null,
                (_f = snapshot.unit) !== null && _f !== void 0 ? _f : null,
                sanitizeNumber(snapshot.baselineValue),
                sanitizeNumber(snapshot.currentValue),
                sanitizeNumber(snapshot.delta),
                sanitizeNumber(snapshot.percentChange),
                sanitizeInt(snapshot.sampleSize),
                sanitizeNumber(snapshot.riskScore),
                (_g = snapshot.runId) !== null && _g !== void 0 ? _g : null,
                snapshot.detectedAt ? new Date(snapshot.detectedAt) : null,
                snapshot.resolvedAt ? new Date(snapshot.resolvedAt) : null,
                metadata ? JSON.stringify(metadata) : null,
                metricsHistory ? JSON.stringify(metricsHistory) : null,
            ]);
        }
        finally {
            client.release();
        }
    }
    async recordSCMCommit(commit) {
        var _a, _b, _c, _d, _e, _f;
        if (!this.initialized) {
            throw new Error("PostgreSQL service not initialized");
        }
        const changes = Array.isArray(commit.changes)
            ? commit.changes.map((c) => String(c))
            : [];
        const testResults = Array.isArray(commit.testResults)
            ? commit.testResults.map((t) => String(t))
            : [];
        const metadata = commit.metadata ? JSON.stringify(commit.metadata) : null;
        const validationResults = commit.validationResults !== undefined && commit.validationResults !== null
            ? JSON.stringify(commit.validationResults)
            : null;
        const query = `
      INSERT INTO scm_commits (
        commit_hash,
        branch,
        title,
        description,
        author,
        metadata,
        changes,
        related_spec_id,
        test_results,
        validation_results,
        pr_url,
        provider,
        status,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        COALESCE($14, NOW()),
        COALESCE($15, NOW())
      )
      ON CONFLICT (commit_hash)
      DO UPDATE SET
        branch = EXCLUDED.branch,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        author = EXCLUDED.author,
        metadata = EXCLUDED.metadata,
        changes = EXCLUDED.changes,
        related_spec_id = EXCLUDED.related_spec_id,
        test_results = EXCLUDED.test_results,
        validation_results = EXCLUDED.validation_results,
        pr_url = EXCLUDED.pr_url,
        provider = EXCLUDED.provider,
        status = EXCLUDED.status,
        updated_at = NOW();
    `;
        await this.query(query, [
            commit.commitHash,
            commit.branch,
            commit.title,
            (_a = commit.description) !== null && _a !== void 0 ? _a : null,
            (_b = commit.author) !== null && _b !== void 0 ? _b : null,
            metadata,
            changes,
            (_c = commit.relatedSpecId) !== null && _c !== void 0 ? _c : null,
            testResults,
            validationResults,
            (_d = commit.prUrl) !== null && _d !== void 0 ? _d : null,
            (_e = commit.provider) !== null && _e !== void 0 ? _e : "local",
            (_f = commit.status) !== null && _f !== void 0 ? _f : "committed",
            commit.createdAt ? new Date(commit.createdAt) : null,
            commit.updatedAt ? new Date(commit.updatedAt) : null,
        ]);
    }
    async getSCMCommitByHash(commitHash) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (!this.initialized) {
            throw new Error("PostgreSQL service not initialized");
        }
        const result = await this.query(`
        SELECT
          id,
          commit_hash,
          branch,
          title,
          description,
          author,
          metadata,
          changes,
          related_spec_id,
          test_results,
          validation_results,
          pr_url,
          provider,
          status,
          created_at,
          updated_at
        FROM scm_commits
        WHERE commit_hash = $1
      `, [commitHash]);
        if (!((_a = result === null || result === void 0 ? void 0 : result.rows) === null || _a === void 0 ? void 0 : _a.length)) {
            return null;
        }
        const row = result.rows[0];
        const parseJson = (value) => {
            if (value == null)
                return undefined;
            if (typeof value === "object")
                return value;
            try {
                return JSON.parse(String(value));
            }
            catch (_a) {
                return undefined;
            }
        };
        return {
            id: (_b = row.id) !== null && _b !== void 0 ? _b : undefined,
            commitHash: row.commit_hash,
            branch: row.branch,
            title: row.title,
            description: (_c = row.description) !== null && _c !== void 0 ? _c : undefined,
            author: (_d = row.author) !== null && _d !== void 0 ? _d : undefined,
            changes: Array.isArray(row.changes) ? row.changes : [],
            relatedSpecId: (_e = row.related_spec_id) !== null && _e !== void 0 ? _e : undefined,
            testResults: Array.isArray(row.test_results) ? row.test_results : undefined,
            validationResults: parseJson(row.validation_results),
            prUrl: (_f = row.pr_url) !== null && _f !== void 0 ? _f : undefined,
            provider: (_g = row.provider) !== null && _g !== void 0 ? _g : undefined,
            status: (_h = row.status) !== null && _h !== void 0 ? _h : undefined,
            metadata: parseJson(row.metadata),
            createdAt: row.created_at ? new Date(row.created_at) : undefined,
            updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
        };
    }
    async listSCMCommits(limit = 50) {
        var _a;
        if (!this.initialized) {
            throw new Error("PostgreSQL service not initialized");
        }
        const sanitizedLimit = Math.max(1, Math.min(Math.floor(limit), 200));
        const result = await this.query(`
        SELECT
          id,
          commit_hash,
          branch,
          title,
          description,
          author,
          metadata,
          changes,
          related_spec_id,
          test_results,
          validation_results,
          pr_url,
          provider,
          status,
          created_at,
          updated_at
        FROM scm_commits
        ORDER BY created_at DESC
        LIMIT $1
      `, [sanitizedLimit]);
        if (!((_a = result === null || result === void 0 ? void 0 : result.rows) === null || _a === void 0 ? void 0 : _a.length)) {
            return [];
        }
        const parseJson = (value) => {
            if (value == null)
                return undefined;
            if (typeof value === "object")
                return value;
            try {
                return JSON.parse(String(value));
            }
            catch (_a) {
                return undefined;
            }
        };
        return result.rows.map((row) => {
            var _a, _b, _c, _d, _e, _f, _g;
            return ({
                id: (_a = row.id) !== null && _a !== void 0 ? _a : undefined,
                commitHash: row.commit_hash,
                branch: row.branch,
                title: row.title,
                description: (_b = row.description) !== null && _b !== void 0 ? _b : undefined,
                author: (_c = row.author) !== null && _c !== void 0 ? _c : undefined,
                changes: Array.isArray(row.changes) ? row.changes : [],
                relatedSpecId: (_d = row.related_spec_id) !== null && _d !== void 0 ? _d : undefined,
                testResults: Array.isArray(row.test_results)
                    ? row.test_results
                    : undefined,
                validationResults: parseJson(row.validation_results),
                prUrl: (_e = row.pr_url) !== null && _e !== void 0 ? _e : undefined,
                provider: (_f = row.provider) !== null && _f !== void 0 ? _f : undefined,
                status: (_g = row.status) !== null && _g !== void 0 ? _g : undefined,
                metadata: parseJson(row.metadata),
                createdAt: row.created_at ? new Date(row.created_at) : undefined,
                updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
            });
        });
    }
    async getTestExecutionHistory(entityId, limit = 50) {
        if (!this.initialized) {
            throw new Error("PostgreSQL service not initialized");
        }
        const client = await this.postgresPool.connect();
        try {
            let query;
            let params;
            if (entityId && entityId.trim() !== "") {
                // If entityId is provided, search for specific test
                query = `
          SELECT tr.*, ts.suite_name, ts.framework, ts.timestamp as suite_timestamp
          FROM test_results tr
          JOIN test_suites ts ON tr.suite_id = ts.id
          WHERE tr.test_id = $1
          ORDER BY ts.timestamp DESC
          LIMIT $2
        `;
                params = [entityId, limit];
            }
            else {
                // If no entityId, return all test results
                query = `
          SELECT tr.*, ts.suite_name, ts.framework, ts.timestamp as suite_timestamp
          FROM test_results tr
          JOIN test_suites ts ON tr.suite_id = ts.id
          ORDER BY ts.timestamp DESC
          LIMIT $1
        `;
                params = [limit];
            }
            const result = await client.query(query, params);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
    async getPerformanceMetricsHistory(entityId, options = {}) {
        if (!this.initialized) {
            throw new Error("PostgreSQL service not initialized");
        }
        const normalizedOptions = typeof options === "number"
            ? { days: options }
            : options !== null && options !== void 0 ? options : {};
        const { days = 30, metricId, environment, severity, limit = 100, } = normalizedOptions;
        const sanitizedMetricId = typeof metricId === "string" && metricId.trim().length > 0
            ? normalizeMetricIdForId(metricId)
            : undefined;
        const sanitizedEnvironment = typeof environment === "string" && environment.trim().length > 0
            ? sanitizeEnvironment(environment)
            : undefined;
        const sanitizedSeverity = (() => {
            if (typeof severity !== "string")
                return undefined;
            const normalized = severity.trim().toLowerCase();
            switch (normalized) {
                case "critical":
                case "high":
                case "medium":
                case "low":
                    return normalized;
                default:
                    return undefined;
            }
        })();
        const safeLimit = Number.isFinite(limit)
            ? Math.min(500, Math.max(1, Math.floor(limit)))
            : 100;
        const safeDays = typeof days === "number" && Number.isFinite(days)
            ? Math.min(365, Math.max(1, Math.floor(days)))
            : undefined;
        const client = await this.postgresPool.connect();
        try {
            const conditions = ["(pm.test_id = $1 OR pm.target_id = $1)"];
            const params = [entityId];
            let paramIndex = 2;
            if (sanitizedMetricId) {
                conditions.push(`pm.metric_id = $${paramIndex}`);
                params.push(sanitizedMetricId);
                paramIndex += 1;
            }
            if (sanitizedEnvironment) {
                conditions.push(`pm.environment = $${paramIndex}`);
                params.push(sanitizedEnvironment);
                paramIndex += 1;
            }
            if (sanitizedSeverity) {
                conditions.push(`pm.severity = $${paramIndex}`);
                params.push(sanitizedSeverity);
                paramIndex += 1;
            }
            if (typeof safeDays === "number") {
                conditions.push(`(pm.detected_at IS NULL OR pm.detected_at >= NOW() - $${paramIndex} * INTERVAL '1 day')`);
                params.push(safeDays);
                paramIndex += 1;
            }
            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
            params.push(safeLimit);
            const snapshotQuery = `
        SELECT
          pm.id,
          pm.test_id,
          pm.target_id,
          pm.metric_id,
          pm.scenario,
          pm.environment,
          pm.severity,
          pm.trend,
          pm.unit,
          pm.baseline_value,
          pm.current_value,
          pm.delta,
          pm.percent_change,
          pm.sample_size,
          pm.risk_score,
          pm.run_id,
          pm.detected_at,
          pm.resolved_at,
          pm.metadata,
          pm.metrics_history,
          pm.created_at
        FROM performance_metric_snapshots pm
        ${whereClause}
        ORDER BY COALESCE(pm.detected_at, pm.created_at) DESC
        LIMIT $${paramIndex}
      `;
            const snapshotResult = await client.query(snapshotQuery, params);
            const parseJson = (value) => {
                if (value == null)
                    return null;
                if (typeof value === "object")
                    return value;
                if (typeof value === "string" && value.trim().length > 0) {
                    try {
                        return JSON.parse(value);
                    }
                    catch (_a) {
                        return null;
                    }
                }
                return null;
            };
            const toDateOrNull = (value) => {
                if (!value)
                    return null;
                const date = new Date(value);
                return Number.isNaN(date.getTime()) ? null : date;
            };
            const normalizeSnapshot = (row) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                const metadata = (_a = parseJson(row.metadata)) !== null && _a !== void 0 ? _a : undefined;
                const historyRaw = parseJson(row.metrics_history);
                const metricsHistory = Array.isArray(historyRaw)
                    ? historyRaw
                        .map((entry) => {
                        if (!entry || typeof entry !== "object")
                            return null;
                        const normalized = { ...entry };
                        if (normalized.timestamp) {
                            const ts = toDateOrNull(normalized.timestamp);
                            normalized.timestamp = ts !== null && ts !== void 0 ? ts : undefined;
                        }
                        return normalized;
                    })
                        .filter(Boolean)
                    : undefined;
                return {
                    id: (_b = row.id) !== null && _b !== void 0 ? _b : undefined,
                    testId: (_c = row.test_id) !== null && _c !== void 0 ? _c : undefined,
                    targetId: (_d = row.target_id) !== null && _d !== void 0 ? _d : undefined,
                    metricId: row.metric_id,
                    scenario: (_e = row.scenario) !== null && _e !== void 0 ? _e : undefined,
                    environment: (_f = row.environment) !== null && _f !== void 0 ? _f : undefined,
                    severity: (_g = row.severity) !== null && _g !== void 0 ? _g : undefined,
                    trend: (_h = row.trend) !== null && _h !== void 0 ? _h : undefined,
                    unit: (_j = row.unit) !== null && _j !== void 0 ? _j : undefined,
                    baselineValue: row.baseline_value !== null ? Number(row.baseline_value) : null,
                    currentValue: row.current_value !== null ? Number(row.current_value) : null,
                    delta: row.delta !== null ? Number(row.delta) : null,
                    percentChange: row.percent_change !== null ? Number(row.percent_change) : null,
                    sampleSize: row.sample_size !== null ? Number(row.sample_size) : null,
                    riskScore: row.risk_score !== null ? Number(row.risk_score) : null,
                    runId: (_k = row.run_id) !== null && _k !== void 0 ? _k : undefined,
                    detectedAt: toDateOrNull(row.detected_at),
                    resolvedAt: toDateOrNull(row.resolved_at),
                    metricsHistory: metricsHistory !== null && metricsHistory !== void 0 ? metricsHistory : undefined,
                    metadata,
                    createdAt: toDateOrNull(row.created_at),
                    source: "snapshot",
                };
            };
            const snapshots = snapshotResult.rows.map(normalizeSnapshot);
            return snapshots;
        }
        finally {
            client.release();
        }
    }
    async getCoverageHistory(entityId, days = 30) {
        if (!this.initialized) {
            throw new Error("PostgreSQL service not initialized");
        }
        const client = await this.postgresPool.connect();
        try {
            // Use a simpler query to avoid parameter binding issues
            const query = `
        SELECT ch.*
        FROM coverage_history ch
        WHERE ch.entity_id = $1::uuid
        AND (ch.timestamp IS NULL OR ch.timestamp >= NOW() - INTERVAL '${days} days')
        ORDER BY COALESCE(ch.timestamp, NOW()) DESC
      `;
            const result = await client.query(query, [entityId]);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
}
//# sourceMappingURL=PostgreSQLService.js.map
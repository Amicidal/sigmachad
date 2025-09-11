import type { Pool as PgPool } from "pg";
import { IPostgreSQLService } from "./interfaces.js";

export class PostgreSQLService implements IPostgreSQLService {
  private postgresPool!: PgPool;
  private initialized = false;
  private poolFactory?: () => PgPool;
  private config: {
    connectionString: string;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  };

  constructor(
    config: {
      connectionString: string;
      max?: number;
      idleTimeoutMillis?: number;
      connectionTimeoutMillis?: number;
    },
    options?: { poolFactory?: () => PgPool }
  ) {
    this.config = config;
    this.poolFactory = options?.poolFactory;
  }

  async initialize(): Promise<void> {
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
        types.setTypeParser(1700, (value: string) => parseFloat(value)); // numeric/decimal
        types.setTypeParser(701, (value: string) => parseFloat(value)); // real/float4
        types.setTypeParser(700, (value: string) => parseFloat(value)); // float8/double precision
        types.setTypeParser(21, (value: string) => parseInt(value, 10)); // int2/smallint
        types.setTypeParser(23, (value: string) => parseInt(value, 10)); // int4/integer
        types.setTypeParser(20, (value: string) => parseInt(value, 10)); // int8/bigint
      } else {
        // Dynamically import pg so test mocks (vi.mock) reliably intercept
        const { Pool, types } = await import("pg");

        // Configure JSONB parsing based on environment
        if (
          process.env.NODE_ENV === "test" ||
          process.env.RUN_INTEGRATION === "1"
        ) {
          // In tests, parse JSONB as objects for easier testing
          types.setTypeParser(3802, (value: string) => JSON.parse(value)); // JSONB oid = 3802
        } else {
          // In production, return as string for performance
          types.setTypeParser(3802, (value: string) => value); // JSONB oid = 3802
        }

        // Configure numeric type parsing for all environments
        // Parse numeric, decimal, real, and double precision as numbers
        types.setTypeParser(1700, (value: string) => parseFloat(value)); // numeric/decimal
        types.setTypeParser(701, (value: string) => parseFloat(value)); // real/float4
        types.setTypeParser(700, (value: string) => parseFloat(value)); // float8/double precision
        types.setTypeParser(21, (value: string) => parseInt(value, 10)); // int2/smallint
        types.setTypeParser(23, (value: string) => parseInt(value, 10)); // int4/integer
        types.setTypeParser(20, (value: string) => parseInt(value, 10)); // int8/bigint

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
      } finally {
        client.release();
      }

      this.initialized = true;
      console.log("✅ PostgreSQL connection established");
    } catch (error) {
      console.error("❌ PostgreSQL initialization failed:", error);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      if (
        this.postgresPool &&
        typeof (this.postgresPool as any).end === "function"
      ) {
        await this.postgresPool.end();
      }
    } catch (err) {
      // Swallow pool close errors to align with graceful shutdown expectations
    } finally {
      // Ensure subsequent close calls are no-ops
      // and prevent using a stale pool after close
      this.postgresPool = undefined as any;
      this.initialized = false;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getPool() {
    if (!this.initialized) {
      throw new Error("PostgreSQL not initialized");
    }
    return this.postgresPool;
  }

  private validateUuid(id: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  private validateQueryParams(params: any[]): void {
    for (let i = 0; i < params.length; i++) {
      const param = params[i];
      if (typeof param === "string" && param.length === 36) {
        // Only validate strings that look like UUIDs (contain hyphens in UUID format)
        // This avoids false positives with JSON strings that happen to be 36 characters
        if (param.includes("-") && !this.validateUuid(param)) {
          throw new Error(
            `Parameter at index ${i} appears to be a UUID but is invalid: ${param}`
          );
        }
      }
    }
  }

  async query(
    query: string,
    params: any[] = [],
    options: { timeout?: number } = {}
  ): Promise<any> {
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
    } catch (error) {
      console.error("PostgreSQL query error:", error);
      console.error("Query was:", query);
      console.error("Params were:", params);
      throw error;
    } finally {
      try {
        client.release();
      } catch (releaseError) {
        console.error("Error releasing PostgreSQL client:", releaseError);
      }
    }
  }

  async transaction<T>(
    callback: (client: any) => Promise<T>,
    options: { timeout?: number; isolationLevel?: string } = {}
  ): Promise<T> {
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
      } else {
        await client.query("BEGIN");
      }

      // Note: We can't validate parameters here since they're passed to the callback
      // The callback should handle its own parameter validation

      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      console.error("Transaction error:", error);
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Error during rollback:", rollbackError);
        // Don't throw rollback error, throw original error instead
      }
      throw error;
    } finally {
      try {
        client.release();
      } catch (releaseError) {
        console.error(
          "Error releasing PostgreSQL client in transaction:",
          releaseError
        );
      }
    }
  }

  async bulkQuery(
    queries: Array<{ query: string; params: any[] }>,
    options: { continueOnError?: boolean } = {}
  ): Promise<any[]> {
    if (!this.initialized) {
      throw new Error("PostgreSQL not initialized");
    }

    // Validate all query parameters
    for (const query of queries) {
      this.validateQueryParams(query.params);
    }

    const results: any[] = [];
    const client = await this.postgresPool.connect();

    try {
      if (options.continueOnError) {
        // Execute queries independently to avoid aborting the whole transaction
        for (const { query, params } of queries) {
          try {
            const result = await client.query(query, params);
            results.push(result);
          } catch (error) {
            console.warn("Bulk query error (continuing):", error);
            results.push({ error });
          }
        }
        return results;
      } else {
        await client.query("BEGIN");
        for (const { query, params } of queries) {
          const result = await client.query(query, params);
          results.push(result);
        }
        await client.query("COMMIT");
        return results;
      }
    } catch (error) {
      // Only attempt rollback if a transaction was opened
      try {
        await client.query("ROLLBACK");
      } catch {}
      throw error;
    } finally {
      try {
        client.release();
      } catch (releaseError) {
        console.error(
          "Error releasing PostgreSQL client in bulk operation:",
          releaseError
        );
      }
    }
  }

  async setupSchema(): Promise<void> {
    if (!this.initialized) {
      throw new Error("PostgreSQL not initialized");
    }

    console.log("🔧 Setting up PostgreSQL schema...");

    // Create extensions first
    try {
      await this.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      await this.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');
    } catch (error) {
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

      // Compatibility tables for integration tests
      `CREATE TABLE IF NOT EXISTS performance_metrics (
        entity_id UUID NOT NULL,
        metric_type VARCHAR(64) NOT NULL,
        value DOUBLE PRECISION NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
      } catch (error) {
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
      } catch (error) {
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
      "CREATE INDEX IF NOT EXISTS idx_performance_metrics_entity_id ON performance_metrics(entity_id)",
      "CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp)",
      "CREATE INDEX IF NOT EXISTS idx_coverage_history_entity_id ON coverage_history(entity_id)",
      "CREATE INDEX IF NOT EXISTS idx_coverage_history_timestamp ON coverage_history(timestamp)",
    ];

    for (const query of indexQueries) {
      try {
        await this.query(query);
      } catch (error) {
        console.warn("Warning: Could not create index:", error);
      }
    }

    console.log("✅ PostgreSQL schema setup complete");
  }

  async healthCheck(): Promise<boolean> {
    let client: any = null;
    try {
      client = await this.postgresPool.connect();
      await client.query("SELECT 1");
      return true;
    } catch (error) {
      console.error("PostgreSQL health check failed:", error);
      return false;
    } finally {
      if (client) {
        try {
          client.release();
        } catch (releaseError) {
          console.error("Error releasing PostgreSQL client:", releaseError);
        }
      }
    }
  }

  async storeTestSuiteResult(suiteResult: any): Promise<any> {
    if (!this.initialized) {
      throw new Error("PostgreSQL service not initialized");
    }

    const result = await this.transaction(async (client) => {
      // First, check if suite already exists
      const existingSuiteQuery = `
        SELECT id FROM test_suites
        WHERE suite_name = $1 AND timestamp = $2
      `;
      const existingSuiteValues = [
        suiteResult.suiteName || suiteResult.name,
        suiteResult.timestamp,
      ];

      const existingSuiteResult = await client.query(
        existingSuiteQuery,
        existingSuiteValues
      );
      let suiteId = existingSuiteResult.rows[0]?.id;

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
        suiteId = suiteResultQuery.rows[0]?.id;
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

  async storeFlakyTestAnalyses(analyses: any[]): Promise<any> {
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
          } else {
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

  async getTestExecutionHistory(
    entityId: string,
    limit: number = 50
  ): Promise<any[]> {
    if (!this.initialized) {
      throw new Error("PostgreSQL service not initialized");
    }

    const client = await this.postgresPool.connect();
    try {
      let query: string;
      let params: any[];

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
      } else {
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
    } finally {
      client.release();
    }
  }

  async getPerformanceMetricsHistory(
    entityId: string,
    days: number = 30
  ): Promise<any[]> {
    if (!this.initialized) {
      throw new Error("PostgreSQL service not initialized");
    }

    const client = await this.postgresPool.connect();
    try {
      // Use a simpler query to avoid parameter binding issues
      const query = `
        SELECT pm.*
        FROM performance_metrics pm
        WHERE pm.entity_id = $1::uuid
        AND (pm.timestamp IS NULL OR pm.timestamp >= NOW() - INTERVAL '${days} days')
        ORDER BY COALESCE(pm.timestamp, NOW()) DESC
      `;
      const result = await client.query(query, [entityId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getCoverageHistory(
    entityId: string,
    days: number = 30
  ): Promise<any[]> {
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
    } finally {
      client.release();
    }
  }
}

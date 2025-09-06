import type { Pool as PgPool } from 'pg';
import { IPostgreSQLService } from './interfaces';

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

  constructor(config: {
    connectionString: string;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  }, options?: { poolFactory?: () => PgPool }) {
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
      } else {
        // Dynamically import pg so test mocks (vi.mock) reliably intercept
        const { Pool } = await import('pg');
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
        await client.query('SELECT NOW()');
      } finally {
        client.release();
      }

      this.initialized = true;
      console.log('✅ PostgreSQL connection established');
    } catch (error) {
      console.error('❌ PostgreSQL initialization failed:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.postgresPool && typeof (this.postgresPool as any).end === 'function') {
        await this.postgresPool.end();
      }
    } catch (err) {
      // Swallow pool close errors to align with graceful shutdown expectations
    } finally {
      // Ensure subsequent close calls are no-ops
      // and prevent using a stale pool after close
      // @ts-expect-error allow clearing for runtime safety
      this.postgresPool = undefined as any;
      this.initialized = false;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getPool() {
    if (!this.initialized) {
      throw new Error('PostgreSQL not initialized');
    }
    return this.postgresPool;
  }

  async query(query: string, params: any[] = [], options: { timeout?: number } = {}): Promise<any> {
    if (!this.initialized) {
      throw new Error('PostgreSQL not initialized');
    }

    const client = await this.postgresPool.connect();
    const timeout = options.timeout || 30000; // 30 second default timeout

    try {
      // Set statement timeout to prevent hanging queries
      await client.query(`SET statement_timeout = ${timeout}`);

      const result = await client.query(query, params);
      return result;
    } catch (error) {
      console.error('PostgreSQL query error:', error);
      console.error('Query was:', query);
      console.error('Params were:', params);
      throw error;
    } finally {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Error releasing PostgreSQL client:', releaseError);
      }
    }
  }

  async transaction<T>(
    callback: (client: any) => Promise<T>,
    options: { timeout?: number; isolationLevel?: string } = {}
  ): Promise<T> {
    if (!this.initialized) {
      throw new Error('PostgreSQL not initialized');
    }

    const client = await this.postgresPool.connect();
    const timeout = options.timeout || 30000; // 30 second default timeout

    try {
      // Set transaction timeout and isolation level
      await client.query(`SET statement_timeout = ${timeout}`);
      if (options.isolationLevel) {
        await client.query(`SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`);
      }

      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      console.error('Transaction error:', error);
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
        // Don't throw rollback error, throw original error instead
      }
      throw error;
    } finally {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Error releasing PostgreSQL client in transaction:', releaseError);
      }
    }
  }

  async bulkQuery(
    queries: Array<{ query: string; params: any[] }>,
    options: { continueOnError?: boolean } = {}
  ): Promise<any[]> {
    if (!this.initialized) {
      throw new Error('PostgreSQL not initialized');
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
            console.warn('Bulk query error (continuing):', error);
            results.push({ error });
          }
        }
        return results;
      } else {
        await client.query('BEGIN');
        for (const { query, params } of queries) {
          const result = await client.query(query, params);
          results.push(result);
        }
        await client.query('COMMIT');
        return results;
      }
    } catch (error) {
      // Only attempt rollback if a transaction was opened
      try { await client.query('ROLLBACK'); } catch {}
      throw error;
    } finally {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Error releasing PostgreSQL client in bulk operation:', releaseError);
      }
    }
  }

  async setupSchema(): Promise<void> {
    if (!this.initialized) {
      throw new Error('PostgreSQL not initialized');
    }

    console.log('🔧 Setting up PostgreSQL schema...');

    // PostgreSQL schema setup
    const postgresSchema = `
      -- Create extensions
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pg_trgm";

      -- Documents table for storing various document types
      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(255) PRIMARY KEY,
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
        id VARCHAR(255) PRIMARY KEY,
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
        session_id VARCHAR(255) REFERENCES sessions(id),
        spec_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Indexes for changes
      CREATE INDEX IF NOT EXISTS idx_changes_entity_id ON changes(entity_id);
      CREATE INDEX IF NOT EXISTS idx_changes_timestamp ON changes(timestamp);
      CREATE INDEX IF NOT EXISTS idx_changes_session_id ON changes(session_id);

      -- Test suites table (created before results due to FK)
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

      -- Test results table
      CREATE TABLE IF NOT EXISTS test_results (
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
      );

      -- Indexes for test results
      CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON test_results(test_id);
      CREATE INDEX IF NOT EXISTS idx_test_results_timestamp ON test_results(timestamp);
      CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);

      -- Test coverage table
      CREATE TABLE IF NOT EXISTS test_coverage (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        test_id VARCHAR(255) NOT NULL,
        suite_id UUID REFERENCES test_suites(id),
        lines DOUBLE PRECISION DEFAULT 0,
        branches DOUBLE PRECISION DEFAULT 0,
        functions DOUBLE PRECISION DEFAULT 0,
        statements DOUBLE PRECISION DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Test performance table
      CREATE TABLE IF NOT EXISTS test_performance (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        test_id VARCHAR(255) NOT NULL,
        suite_id UUID REFERENCES test_suites(id),
        memory_usage INTEGER,
        cpu_usage DOUBLE PRECISION,
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

      -- Compatibility tables for integration tests
      CREATE TABLE IF NOT EXISTS performance_metrics (
        entity_id VARCHAR(255) NOT NULL,
        metric_type VARCHAR(64) NOT NULL,
        value DOUBLE PRECISION NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_performance_metrics_entity_id ON performance_metrics(entity_id);
      CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);

      CREATE TABLE IF NOT EXISTS coverage_history (
        entity_id VARCHAR(255) NOT NULL,
        lines_covered INTEGER NOT NULL,
        lines_total INTEGER NOT NULL,
        percentage DOUBLE PRECISION NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_coverage_history_entity_id ON coverage_history(entity_id);
      CREATE INDEX IF NOT EXISTS idx_coverage_history_timestamp ON coverage_history(timestamp);
    `;

    await this.query(postgresSchema);

    // Ensure column types match expected app/test behavior even if tables pre-exist
    // Safely migrate FK on changes.session_id -> sessions.id from uuid to varchar
    await this.query("ALTER TABLE IF EXISTS changes DROP CONSTRAINT IF EXISTS changes_session_id_fkey;");
    // IDs as strings for documents and sessions (tests and API provide custom IDs)
    await this.query("ALTER TABLE IF EXISTS documents ALTER COLUMN id TYPE VARCHAR(255) USING id::text;");
    await this.query("ALTER TABLE IF EXISTS sessions ALTER COLUMN id TYPE VARCHAR(255) USING id::text;");
    await this.query("ALTER TABLE IF EXISTS changes ALTER COLUMN session_id TYPE VARCHAR(255) USING session_id::text;");
    await this.query("ALTER TABLE IF EXISTS changes ADD CONSTRAINT changes_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions(id);");

    // Coverage metrics as numeric types (avoid pg numeric -> string mapping)
    await this.query("ALTER TABLE test_coverage ALTER COLUMN lines TYPE DOUBLE PRECISION USING lines::double precision;");
    await this.query("ALTER TABLE test_coverage ALTER COLUMN branches TYPE DOUBLE PRECISION USING branches::double precision;");
    await this.query("ALTER TABLE test_coverage ALTER COLUMN functions TYPE DOUBLE PRECISION USING functions::double precision;");
    await this.query("ALTER TABLE test_coverage ALTER COLUMN statements TYPE DOUBLE PRECISION USING statements::double precision;");

    // Performance metrics numeric types
    await this.query("ALTER TABLE test_performance ALTER COLUMN memory_usage TYPE INTEGER USING memory_usage::integer;");
    await this.query("ALTER TABLE test_performance ALTER COLUMN cpu_usage TYPE DOUBLE PRECISION USING cpu_usage::double precision;");

    // Flaky analyses numeric types (allow realistic ranges and return numbers)
    await this.query("ALTER TABLE flaky_test_analyses ALTER COLUMN flaky_score TYPE DOUBLE PRECISION USING flaky_score::double precision;");
    await this.query("ALTER TABLE flaky_test_analyses ALTER COLUMN failure_rate TYPE DOUBLE PRECISION USING failure_rate::double precision;");
    await this.query("ALTER TABLE flaky_test_analyses ALTER COLUMN success_rate TYPE DOUBLE PRECISION USING success_rate::double precision;");

    // Ensure suite_id column exists on test_results for backward compatibility
    await this.query('ALTER TABLE test_results ADD COLUMN IF NOT EXISTS suite_id UUID REFERENCES test_suites(id);');
    await this.query('CREATE INDEX IF NOT EXISTS idx_test_results_suite_id ON test_results(suite_id);');
    console.log('✅ PostgreSQL schema setup complete');
  }

  async healthCheck(): Promise<boolean> {
    let client: any = null;
    try {
      client = await this.postgresPool.connect();
      await client.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('PostgreSQL health check failed:', error);
      return false;
    } finally {
      if (client) {
        try {
          client.release();
        } catch (releaseError) {
          console.error('Error releasing PostgreSQL client:', releaseError);
        }
      }
    }
  }

  async storeTestSuiteResult(suiteResult: any): Promise<void> {
    if (!this.initialized) {
      throw new Error('PostgreSQL service not initialized');
    }

    await this.transaction(async (client) => {
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
    });
  }

  async storeFlakyTestAnalyses(analyses: any[]): Promise<void> {
    if (!this.initialized) {
      throw new Error('PostgreSQL service not initialized');
    }

    await this.transaction(async (client) => {
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
    });
  }

  async getTestExecutionHistory(entityId: string, limit: number = 50): Promise<any[]> {
    if (!this.initialized) {
      throw new Error('PostgreSQL service not initialized');
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
    } finally {
      client.release();
    }
  }

  async getPerformanceMetricsHistory(entityId: string, days: number = 30): Promise<any[]> {
    if (!this.initialized) {
      throw new Error('PostgreSQL service not initialized');
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
    } finally {
      client.release();
    }
  }

  async getCoverageHistory(entityId: string, days: number = 30): Promise<any[]> {
    if (!this.initialized) {
      throw new Error('PostgreSQL service not initialized');
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
    } finally {
      client.release();
    }
  }
}

/**
 * Database test utilities and helpers
 * Provides common setup and teardown functions for database tests
 */
import { DatabaseService, DatabaseConfig } from "../../src/services/DatabaseService";
export declare const TEST_DATABASE_CONFIG: DatabaseConfig;
/**
 * Setup database service for testing
 * Initializes and sets up the database schema
 */
export declare function setupTestDatabase(): Promise<DatabaseService>;
/**
 * Cleanup database service after testing
 */
export declare function cleanupTestDatabase(dbService: DatabaseService): Promise<void>;
/**
 * Clear all test data from databases
 * Useful for ensuring clean state between tests
 */
export declare function clearTestData(dbService: DatabaseService): Promise<void>;
/**
 * Wait for database to be ready
 * Useful for ensuring test containers are fully started
 */
export declare function waitForDatabaseReady(dbService: DatabaseService, timeoutMs?: number): Promise<void>;
/**
 * Create test data fixtures
 */
export declare const TEST_FIXTURES: {
    documents: ({
        type: string;
        content: {
            language: string;
            code: string;
            title?: undefined;
            content?: undefined;
        };
        metadata: {
            file: string;
            author: string;
            version?: undefined;
        };
    } | {
        type: string;
        content: {
            title: string;
            content: string;
            language?: undefined;
            code?: undefined;
        };
        metadata: {
            version: string;
            author: string;
            file?: undefined;
        };
    })[];
    sessions: {
        agent_type: string;
        user_id: string;
        start_time: Date;
        end_time: null;
        status: string;
        metadata: {
            test: boolean;
        };
    }[];
    changes: {
        change_type: string;
        entity_type: string;
        entity_id: string;
        timestamp: Date;
        author: string;
        commit_hash: string;
        diff: string;
        previous_state: null;
        new_state: {
            content: string;
        };
        session_id: null;
        spec_id: null;
    }[];
    testSuites: {
        suiteName: string;
        timestamp: Date;
        framework: string;
        totalTests: number;
        passedTests: number;
        failedTests: number;
        skippedTests: number;
        duration: number;
    }[];
    testResults: ({
        test_id: string;
        test_suite: string;
        test_name: string;
        status: string;
        duration: number;
        error_message: null;
        stack_trace: null;
        coverage: {
            lines: number;
            branches: number;
            functions: number;
            statements: number;
        };
        performance: {
            memoryUsage: number;
            cpuUsage: number;
            networkRequests: number;
        };
        timestamp: Date;
    } | {
        test_id: string;
        test_suite: string;
        test_name: string;
        status: string;
        duration: number;
        error_message: string;
        stack_trace: string;
        coverage: null;
        performance: null;
        timestamp: Date;
    })[];
    testPerformance: {
        test_id: string;
        memory_usage: number;
        cpu_usage: number;
        network_requests: number;
        timestamp: Date;
    }[];
    flakyAnalyses: {
        testId: string;
        testName: string;
        flakyScore: number;
        totalRuns: number;
        failureRate: number;
        successRate: number;
        recentFailures: number;
        patterns: {
            intermittent: boolean;
            timing_dependent: boolean;
        };
        recommendations: {
            increase_timeout: boolean;
            add_retry: boolean;
        };
    }[];
};
/**
 * Insert test fixtures into database
 */
export declare function insertTestFixtures(dbService: DatabaseService): Promise<void>;
/**
 * Test database connection health
 */
export declare function checkDatabaseHealth(dbService: DatabaseService): Promise<boolean>;
//# sourceMappingURL=database-helpers.d.ts.map
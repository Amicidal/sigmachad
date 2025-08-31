/**
 * Database Test Utilities
 * Common utilities for database testing setup, teardown, and data generation
 */
import { DatabaseService } from '../src/services/DatabaseService.js';
export declare class TestDataGenerator {
    private counter;
    generateId(prefix?: string): string;
    generateVector(size?: number): number[];
    generateCodeEntity(overrides?: Partial<any>): {
        id: string;
        type: string;
        name: string;
        language: string;
        content: string;
        file_path: string;
    };
    generateDocument(overrides?: Partial<any>): {
        id: string;
        type: string;
        content: any;
        metadata: any;
    };
    generateEmbedding(entityId: string, overrides?: Partial<any>): {
        id: number;
        vector: number[];
        payload: {
            entity_id: string;
            type: string;
            language: string;
        };
    };
    generateGraphNode(label: string, overrides?: Partial<any>): {
        id: string;
        label: string;
        properties: {
            name: string;
            type: string;
            created_at: string;
        };
    };
}
export declare class DatabaseTestHelper {
    private dbService;
    private dataGenerator;
    constructor();
    setup(): Promise<DatabaseService>;
    teardown(): Promise<void>;
    getDataGenerator(): TestDataGenerator;
    cleanupTestData(testPrefix?: string): Promise<void>;
    createTestDocuments(count: number, overrides?: Partial<any>): Promise<any[]>;
    createTestGraphNodes(count: number, label: string, overrides?: Partial<any>): Promise<any[]>;
    createTestEmbeddings(count: number, collectionName: string, overrides?: Partial<any>): Promise<any[]>;
    createComplexTestScenario(scenarioName: string): Promise<any>;
}
export declare class PerformanceMonitor {
    private startTime;
    private measurements;
    start(operation: string): void;
    end(operation: string): number;
    getMeasurement(operation: string): number;
    getAllMeasurements(): {
        [key: string]: number;
    };
    assertPerformance(operation: string, maxDuration: number): void;
}
export declare function getTestHelper(): DatabaseTestHelper;
export declare function globalTestSetup(): Promise<DatabaseService>;
export declare function globalTestTeardown(): Promise<void>;
export declare function withDatabaseCleanup<T>(testFn: () => Promise<T>, cleanupPattern?: string): Promise<T>;
//# sourceMappingURL=database-test-utils.d.ts.map
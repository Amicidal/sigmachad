/**
 * Migration Compatibility Test
 * Tests backward compatibility and API consistency between OGM and legacy implementations
 */
import { EventEmitter } from 'events';
import { KnowledgeGraphService } from '../KnowledgeGraphService.js';
export interface CompatibilityTestResult {
    testName: string;
    passed: boolean;
    error?: string;
    ogmResult?: any;
    legacyResult?: any;
    responseTime: {
        ogm?: number;
        legacy?: number;
    };
}
export interface CompatibilityReport {
    overallStatus: 'pass' | 'fail' | 'warning';
    totalTests: number;
    passedTests: number;
    failedTests: number;
    tests: CompatibilityTestResult[];
    summary: {
        apiCompatibility: number;
        performanceRatio: number;
        errorRate: {
            ogm: number;
            legacy: number;
        };
    };
}
export declare class MigrationCompatibilityTest extends EventEmitter {
    private featureFlags;
    private tracker;
    constructor();
    /**
     * Run comprehensive compatibility tests
     */
    runCompatibilityTests(knowledgeGraphService: KnowledgeGraphService): Promise<CompatibilityReport>;
    /**
     * Test entity creation consistency
     */
    private testEntityCreation;
    /**
     * Test entity retrieval consistency
     */
    private testEntityRetrieval;
    /**
     * Test entity update consistency
     */
    private testEntityUpdate;
    /**
     * Test entity listing consistency
     */
    private testEntityListing;
    /**
     * Test entity deletion consistency
     */
    private testEntityDeletion;
    /**
     * Test bulk creation consistency
     */
    private testBulkCreation;
    /**
     * Test entity search consistency
     */
    private testEntitySearch;
    /**
     * Test file entity listing consistency
     */
    private testFileEntityListing;
    /**
     * Test error handling consistency
     */
    private testErrorHandling;
    /**
     * Test event consistency
     */
    private testEventConsistency;
    /**
     * Compare entity results for consistency
     */
    private compareEntityResults;
    /**
     * Generate compatibility report
     */
    private generateReport;
}
//# sourceMappingURL=MigrationCompatibilityTest.d.ts.map
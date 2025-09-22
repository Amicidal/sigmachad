/**
 * Migration Compatibility Test
 * Tests backward compatibility and API consistency between OGM and legacy implementations
 */
import { EventEmitter } from 'events';
import { getFeatureFlagService } from './FeatureFlags.js';
import { getMigrationTracker } from './MigrationTracker.js';
export class MigrationCompatibilityTest extends EventEmitter {
    constructor() {
        super();
        this.featureFlags = getFeatureFlagService();
        this.tracker = getMigrationTracker();
    }
    /**
     * Run comprehensive compatibility tests
     */
    async runCompatibilityTests(knowledgeGraphService) {
        console.log('[CompatibilityTest] Starting migration compatibility tests...');
        const testResults = [];
        // Test basic entity operations
        testResults.push(await this.testEntityCreation(knowledgeGraphService));
        testResults.push(await this.testEntityRetrieval(knowledgeGraphService));
        testResults.push(await this.testEntityUpdate(knowledgeGraphService));
        testResults.push(await this.testEntityListing(knowledgeGraphService));
        testResults.push(await this.testEntityDeletion(knowledgeGraphService));
        // Test bulk operations
        testResults.push(await this.testBulkCreation(knowledgeGraphService));
        // Test search and filtering
        testResults.push(await this.testEntitySearch(knowledgeGraphService));
        testResults.push(await this.testFileEntityListing(knowledgeGraphService));
        // Test error handling
        testResults.push(await this.testErrorHandling(knowledgeGraphService));
        // Test event consistency
        testResults.push(await this.testEventConsistency(knowledgeGraphService));
        // Calculate summary metrics
        const report = this.generateReport(testResults);
        console.log('[CompatibilityTest] Tests completed:', report.summary);
        this.emit('tests:completed', report);
        return report;
    }
    /**
     * Test entity creation consistency
     */
    async testEntityCreation(kgs) {
        const testEntity = {
            id: `test-entity-${Date.now()}`,
            type: 'test',
            name: 'Test Entity',
            description: 'Test entity for compatibility testing',
            created: new Date(),
            lastModified: new Date(),
        };
        try {
            // Test with OGM
            const originalConfig = this.featureFlags.getConfig();
            this.featureFlags.updateConfig({ useOGMEntityService: true });
            const startOGM = Date.now();
            const ogmResult = await kgs.createEntity(testEntity);
            const ogmTime = Date.now() - startOGM;
            // Test with Legacy
            this.featureFlags.updateConfig({ useOGMEntityService: false });
            const testEntity2 = { ...testEntity, id: `${testEntity.id}-legacy` };
            const startLegacy = Date.now();
            const legacyResult = await kgs.createEntity(testEntity2);
            const legacyTime = Date.now() - startLegacy;
            // Restore original config
            this.featureFlags.updateConfig(originalConfig);
            // Compare results
            const passed = this.compareEntityResults(ogmResult, legacyResult, ['id']);
            // Clean up
            await kgs.deleteEntity(ogmResult.id);
            await kgs.deleteEntity(legacyResult.id);
            return {
                testName: 'Entity Creation',
                passed,
                ogmResult,
                legacyResult,
                responseTime: { ogm: ogmTime, legacy: legacyTime },
            };
        }
        catch (error) {
            return {
                testName: 'Entity Creation',
                passed: false,
                error: error instanceof Error ? error.message : String(error),
                responseTime: {},
            };
        }
    }
    /**
     * Test entity retrieval consistency
     */
    async testEntityRetrieval(kgs) {
        const testEntity = {
            id: `test-retrieve-${Date.now()}`,
            type: 'test',
            name: 'Test Retrieve Entity',
            created: new Date(),
            lastModified: new Date(),
        };
        try {
            // Create entity first
            const created = await kgs.createEntity(testEntity);
            // Test retrieval with both implementations
            const originalConfig = this.featureFlags.getConfig();
            // Test with OGM
            this.featureFlags.updateConfig({ useOGMEntityService: true });
            const startOGM = Date.now();
            const ogmResult = await kgs.getEntity(created.id);
            const ogmTime = Date.now() - startOGM;
            // Test with Legacy
            this.featureFlags.updateConfig({ useOGMEntityService: false });
            const startLegacy = Date.now();
            const legacyResult = await kgs.getEntity(created.id);
            const legacyTime = Date.now() - startLegacy;
            // Restore original config
            this.featureFlags.updateConfig(originalConfig);
            const passed = this.compareEntityResults(ogmResult, legacyResult);
            // Clean up
            await kgs.deleteEntity(created.id);
            return {
                testName: 'Entity Retrieval',
                passed,
                ogmResult,
                legacyResult,
                responseTime: { ogm: ogmTime, legacy: legacyTime },
            };
        }
        catch (error) {
            return {
                testName: 'Entity Retrieval',
                passed: false,
                error: error instanceof Error ? error.message : String(error),
                responseTime: {},
            };
        }
    }
    /**
     * Test entity update consistency
     */
    async testEntityUpdate(kgs) {
        const testEntity = {
            id: `test-update-${Date.now()}`,
            type: 'test',
            name: 'Test Update Entity',
            created: new Date(),
            lastModified: new Date(),
        };
        try {
            // Create entity first
            const created = await kgs.createEntity(testEntity);
            const originalConfig = this.featureFlags.getConfig();
            // Test update with OGM
            this.featureFlags.updateConfig({ useOGMEntityService: true });
            const startOGM = Date.now();
            const ogmResult = await kgs.updateEntity(created.id, { name: 'Updated OGM' });
            const ogmTime = Date.now() - startOGM;
            // Test update with Legacy
            this.featureFlags.updateConfig({ useOGMEntityService: false });
            const startLegacy = Date.now();
            const legacyResult = await kgs.updateEntity(created.id, { name: 'Updated Legacy' });
            const legacyTime = Date.now() - startLegacy;
            // Restore config
            this.featureFlags.updateConfig(originalConfig);
            const passed = ogmResult && legacyResult &&
                ogmResult.id === legacyResult.id &&
                legacyResult.name === 'Updated Legacy';
            // Clean up
            await kgs.deleteEntity(created.id);
            return {
                testName: 'Entity Update',
                passed,
                ogmResult,
                legacyResult,
                responseTime: { ogm: ogmTime, legacy: legacyTime },
            };
        }
        catch (error) {
            return {
                testName: 'Entity Update',
                passed: false,
                error: error instanceof Error ? error.message : String(error),
                responseTime: {},
            };
        }
    }
    /**
     * Test entity listing consistency
     */
    async testEntityListing(kgs) {
        var _a, _b;
        try {
            const originalConfig = this.featureFlags.getConfig();
            // Test with OGM
            this.featureFlags.updateConfig({ useOGMEntityService: true });
            const startOGM = Date.now();
            const ogmResult = await kgs.listEntities({ limit: 5 });
            const ogmTime = Date.now() - startOGM;
            // Test with Legacy
            this.featureFlags.updateConfig({ useOGMEntityService: false });
            const startLegacy = Date.now();
            const legacyResult = await kgs.listEntities({ limit: 5 });
            const legacyTime = Date.now() - startLegacy;
            // Restore config
            this.featureFlags.updateConfig(originalConfig);
            const passed = ogmResult && legacyResult &&
                Array.isArray(ogmResult.items) &&
                Array.isArray(legacyResult.items) &&
                typeof ogmResult.total === 'number' &&
                typeof legacyResult.total === 'number';
            return {
                testName: 'Entity Listing',
                passed,
                ogmResult: { itemCount: (_a = ogmResult === null || ogmResult === void 0 ? void 0 : ogmResult.items) === null || _a === void 0 ? void 0 : _a.length, total: ogmResult === null || ogmResult === void 0 ? void 0 : ogmResult.total },
                legacyResult: { itemCount: (_b = legacyResult === null || legacyResult === void 0 ? void 0 : legacyResult.items) === null || _b === void 0 ? void 0 : _b.length, total: legacyResult === null || legacyResult === void 0 ? void 0 : legacyResult.total },
                responseTime: { ogm: ogmTime, legacy: legacyTime },
            };
        }
        catch (error) {
            return {
                testName: 'Entity Listing',
                passed: false,
                error: error instanceof Error ? error.message : String(error),
                responseTime: {},
            };
        }
    }
    /**
     * Test entity deletion consistency
     */
    async testEntityDeletion(kgs) {
        try {
            // Create test entities
            const ogmEntity = await kgs.createEntity({
                id: `test-delete-ogm-${Date.now()}`,
                type: 'test',
                name: 'Delete Test OGM',
                created: new Date(),
                lastModified: new Date(),
            });
            const legacyEntity = await kgs.createEntity({
                id: `test-delete-legacy-${Date.now()}`,
                type: 'test',
                name: 'Delete Test Legacy',
                created: new Date(),
                lastModified: new Date(),
            });
            const originalConfig = this.featureFlags.getConfig();
            // Test deletion with OGM
            this.featureFlags.updateConfig({ useOGMEntityService: true });
            const startOGM = Date.now();
            await kgs.deleteEntity(ogmEntity.id);
            const ogmDeleted = await kgs.getEntity(ogmEntity.id);
            const ogmTime = Date.now() - startOGM;
            // Test deletion with Legacy
            this.featureFlags.updateConfig({ useOGMEntityService: false });
            const startLegacy = Date.now();
            await kgs.deleteEntity(legacyEntity.id);
            const legacyDeleted = await kgs.getEntity(legacyEntity.id);
            const legacyTime = Date.now() - startLegacy;
            // Restore config
            this.featureFlags.updateConfig(originalConfig);
            const passed = ogmDeleted === null && legacyDeleted === null;
            return {
                testName: 'Entity Deletion',
                passed,
                ogmResult: { deleted: ogmDeleted === null },
                legacyResult: { deleted: legacyDeleted === null },
                responseTime: { ogm: ogmTime, legacy: legacyTime },
            };
        }
        catch (error) {
            return {
                testName: 'Entity Deletion',
                passed: false,
                error: error instanceof Error ? error.message : String(error),
                responseTime: {},
            };
        }
    }
    /**
     * Test bulk creation consistency
     */
    async testBulkCreation(kgs) {
        const testEntities = Array.from({ length: 3 }, (_, i) => ({
            id: `test-bulk-${Date.now()}-${i}`,
            type: 'test-bulk',
            name: `Bulk Test Entity ${i}`,
            created: new Date(),
            lastModified: new Date(),
        }));
        try {
            const originalConfig = this.featureFlags.getConfig();
            // Test with OGM
            this.featureFlags.updateConfig({ useOGMEntityService: true });
            const startOGM = Date.now();
            const ogmResult = await kgs.createEntitiesBulk(testEntities);
            const ogmTime = Date.now() - startOGM;
            // Test with Legacy (different entities to avoid conflicts)
            const legacyEntities = testEntities.map(e => ({ ...e, id: `${e.id}-legacy` }));
            this.featureFlags.updateConfig({ useOGMEntityService: false });
            const startLegacy = Date.now();
            const legacyResult = await kgs.createEntitiesBulk(legacyEntities);
            const legacyTime = Date.now() - startLegacy;
            // Restore config
            this.featureFlags.updateConfig(originalConfig);
            const passed = ogmResult && legacyResult &&
                (ogmResult.created > 0 || ogmResult.updated > 0) &&
                (legacyResult.created > 0 || legacyResult.updated > 0);
            // Clean up
            for (const entity of testEntities) {
                try {
                    await kgs.deleteEntity(entity.id);
                }
                catch (_a) { }
            }
            for (const entity of legacyEntities) {
                try {
                    await kgs.deleteEntity(entity.id);
                }
                catch (_b) { }
            }
            return {
                testName: 'Bulk Creation',
                passed,
                ogmResult,
                legacyResult,
                responseTime: { ogm: ogmTime, legacy: legacyTime },
            };
        }
        catch (error) {
            return {
                testName: 'Bulk Creation',
                passed: false,
                error: error instanceof Error ? error.message : String(error),
                responseTime: {},
            };
        }
    }
    /**
     * Test entity search consistency
     */
    async testEntitySearch(kgs) {
        try {
            const originalConfig = this.featureFlags.getConfig();
            // Test with OGM
            this.featureFlags.updateConfig({ useOGMEntityService: true });
            const startOGM = Date.now();
            const ogmResult = await kgs.findEntitiesByType('test', 5);
            const ogmTime = Date.now() - startOGM;
            // Test with Legacy
            this.featureFlags.updateConfig({ useOGMEntityService: false });
            const startLegacy = Date.now();
            const legacyResult = await kgs.findEntitiesByType('test', 5);
            const legacyTime = Date.now() - startLegacy;
            // Restore config
            this.featureFlags.updateConfig(originalConfig);
            const passed = Array.isArray(ogmResult) && Array.isArray(legacyResult);
            return {
                testName: 'Entity Search',
                passed,
                ogmResult: { count: ogmResult === null || ogmResult === void 0 ? void 0 : ogmResult.length },
                legacyResult: { count: legacyResult === null || legacyResult === void 0 ? void 0 : legacyResult.length },
                responseTime: { ogm: ogmTime, legacy: legacyTime },
            };
        }
        catch (error) {
            return {
                testName: 'Entity Search',
                passed: false,
                error: error instanceof Error ? error.message : String(error),
                responseTime: {},
            };
        }
    }
    /**
     * Test file entity listing consistency
     */
    async testFileEntityListing(kgs) {
        try {
            const originalConfig = this.featureFlags.getConfig();
            // Test with OGM
            this.featureFlags.updateConfig({ useOGMEntityService: true });
            const startOGM = Date.now();
            const ogmResult = await kgs.getEntitiesByFile('/test/path');
            const ogmTime = Date.now() - startOGM;
            // Test with Legacy
            this.featureFlags.updateConfig({ useOGMEntityService: false });
            const startLegacy = Date.now();
            const legacyResult = await kgs.getEntitiesByFile('/test/path');
            const legacyTime = Date.now() - startLegacy;
            // Restore config
            this.featureFlags.updateConfig(originalConfig);
            const passed = Array.isArray(ogmResult) && Array.isArray(legacyResult);
            return {
                testName: 'File Entity Listing',
                passed,
                ogmResult: { count: ogmResult === null || ogmResult === void 0 ? void 0 : ogmResult.length },
                legacyResult: { count: legacyResult === null || legacyResult === void 0 ? void 0 : legacyResult.length },
                responseTime: { ogm: ogmTime, legacy: legacyTime },
            };
        }
        catch (error) {
            return {
                testName: 'File Entity Listing',
                passed: false,
                error: error instanceof Error ? error.message : String(error),
                responseTime: {},
            };
        }
    }
    /**
     * Test error handling consistency
     */
    async testErrorHandling(kgs) {
        try {
            const originalConfig = this.featureFlags.getConfig();
            let ogmError = null;
            let legacyError = null;
            // Test with OGM - try to get non-existent entity
            this.featureFlags.updateConfig({ useOGMEntityService: true });
            try {
                await kgs.getEntity('non-existent-entity-12345');
            }
            catch (error) {
                ogmError = error;
            }
            // Test with Legacy
            this.featureFlags.updateConfig({ useOGMEntityService: false });
            try {
                await kgs.getEntity('non-existent-entity-12345');
            }
            catch (error) {
                legacyError = error;
            }
            // Restore config
            this.featureFlags.updateConfig(originalConfig);
            // Both should return null for non-existent entities, not throw errors
            const passed = ogmError === null && legacyError === null;
            return {
                testName: 'Error Handling',
                passed,
                ogmResult: { errorThrown: ogmError !== null },
                legacyResult: { errorThrown: legacyError !== null },
                responseTime: {},
            };
        }
        catch (error) {
            return {
                testName: 'Error Handling',
                passed: false,
                error: error instanceof Error ? error.message : String(error),
                responseTime: {},
            };
        }
    }
    /**
     * Test event consistency
     */
    async testEventConsistency(kgs) {
        try {
            const originalConfig = this.featureFlags.getConfig();
            const events = { ogm: [], legacy: [] };
            // Set up event listeners
            const eventListener = (eventName, implementation) => {
                return () => events[implementation].push(eventName);
            };
            kgs.on('entity:created', eventListener('entity:created', 'ogm'));
            kgs.on('entity:deleted', eventListener('entity:deleted', 'ogm'));
            // Test with OGM
            this.featureFlags.updateConfig({ useOGMEntityService: true });
            const testEntity = {
                id: `test-events-ogm-${Date.now()}`,
                type: 'test',
                name: 'Event Test OGM',
                created: new Date(),
                lastModified: new Date(),
            };
            const created = await kgs.createEntity(testEntity);
            await kgs.deleteEntity(created.id);
            // Switch to legacy and test
            this.featureFlags.updateConfig({ useOGMEntityService: false });
            const legacyEntity = {
                id: `test-events-legacy-${Date.now()}`,
                type: 'test',
                name: 'Event Test Legacy',
                created: new Date(),
                lastModified: new Date(),
            };
            const legacyCreated = await kgs.createEntity(legacyEntity);
            await kgs.deleteEntity(legacyCreated.id);
            // Restore config
            this.featureFlags.updateConfig(originalConfig);
            // Both implementations should emit the same events
            const passed = events.ogm.length > 0 && events.legacy.length > 0;
            return {
                testName: 'Event Consistency',
                passed,
                ogmResult: { events: events.ogm },
                legacyResult: { events: events.legacy },
                responseTime: {},
            };
        }
        catch (error) {
            return {
                testName: 'Event Consistency',
                passed: false,
                error: error instanceof Error ? error.message : String(error),
                responseTime: {},
            };
        }
    }
    /**
     * Compare entity results for consistency
     */
    compareEntityResults(ogm, legacy, excludeFields = []) {
        if (!ogm || !legacy)
            return false;
        const ogmFields = Object.keys(ogm).filter(k => !excludeFields.includes(k));
        const legacyFields = Object.keys(legacy).filter(k => !excludeFields.includes(k));
        // Check if both have the same fields (ignoring excluded)
        const commonFields = ogmFields.filter(f => legacyFields.includes(f));
        // At least basic fields should match
        const requiredFields = ['type', 'name'];
        return requiredFields.every(field => commonFields.includes(field));
    }
    /**
     * Generate compatibility report
     */
    generateReport(testResults) {
        const passedTests = testResults.filter(t => t.passed).length;
        const failedTests = testResults.length - passedTests;
        // Calculate API compatibility percentage
        const apiCompatibility = (passedTests / testResults.length) * 100;
        // Calculate performance ratio
        const performanceTests = testResults.filter(t => t.responseTime.ogm && t.responseTime.legacy);
        const avgOGMTime = performanceTests.reduce((sum, t) => sum + (t.responseTime.ogm || 0), 0) / Math.max(performanceTests.length, 1);
        const avgLegacyTime = performanceTests.reduce((sum, t) => sum + (t.responseTime.legacy || 0), 0) / Math.max(performanceTests.length, 1);
        const performanceRatio = avgLegacyTime > 0 ? avgOGMTime / avgLegacyTime : 1;
        // Calculate error rates
        const ogmErrors = testResults.filter(t => t.error && t.ogmResult).length;
        const legacyErrors = testResults.filter(t => t.error && t.legacyResult).length;
        const overallStatus = apiCompatibility >= 90 ? 'pass' :
            apiCompatibility >= 70 ? 'warning' : 'fail';
        return {
            overallStatus,
            totalTests: testResults.length,
            passedTests,
            failedTests,
            tests: testResults,
            summary: {
                apiCompatibility,
                performanceRatio,
                errorRate: {
                    ogm: (ogmErrors / testResults.length) * 100,
                    legacy: (legacyErrors / testResults.length) * 100,
                },
            },
        };
    }
}
//# sourceMappingURL=MigrationCompatibilityTest.js.map
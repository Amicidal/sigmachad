/**
 * Global test setup for Jest
 * Ensures proper test isolation and cleanup between test suites
 */
import { DatabaseService, createDatabaseConfig } from '../src/services/DatabaseService';
// Global database service instance for cleanup
let globalDbService = null;
// Jest setup function (called before each test file)
export default async function () {
    try {
        // Call the setup function
        await setup();
    }
    catch (error) {
        console.warn('Test setup failed:', error);
    }
}
// Setup function for each test file
async function setup() {
    try {
        // Initialize database service if not already done
        if (!globalDbService) {
            const dbConfig = createDatabaseConfig();
            globalDbService = new DatabaseService(dbConfig);
            await globalDbService.initialize();
        }
        // Clean up test data before each test file
        await cleanupTestData();
    }
    catch (error) {
        console.warn('Test setup failed:', error);
    }
}
async function cleanupTestData() {
    if (!globalDbService)
        return;
    try {
        // PostgreSQL cleanup - remove all test data
        await globalDbService.postgresQuery('DELETE FROM documents WHERE id LIKE $1', ['test_%']);
        await globalDbService.postgresQuery('DELETE FROM sessions WHERE id LIKE $1', ['test_%']);
        await globalDbService.postgresQuery('DELETE FROM test_results WHERE test_id LIKE $1', ['test_%']);
        // FalkorDB cleanup - remove all test nodes and relationships
        await globalDbService.falkordbQuery('MATCH (n) WHERE n.id STARTS WITH "test_" DELETE n');
        await globalDbService.falkordbQuery('MATCH (n) WHERE n.id STARTS WITH "search_" DELETE n');
        await globalDbService.falkordbQuery('MATCH (n) WHERE n.id STARTS WITH "event_" DELETE n');
        await globalDbService.falkordbQuery('MATCH (n) WHERE n.id STARTS WITH "multi_" DELETE n');
        await globalDbService.falkordbQuery('MATCH (n) WHERE n.id STARTS WITH "rollback_" DELETE n');
        await globalDbService.falkordbQuery('MATCH (n) WHERE n.id STARTS WITH "conflict_" DELETE n');
        await globalDbService.falkordbQuery('MATCH ()-[r]-() WHERE r.id STARTS WITH "test_" DELETE r');
        await globalDbService.falkordbQuery('MATCH ()-[r]-() WHERE r.id STARTS WITH "rollback_" DELETE r');
        await globalDbService.falkordbQuery('MATCH ()-[r]-() WHERE r.id STARTS WITH "conflict_" DELETE r');
        // Qdrant cleanup - remove test collections
        const collections = await globalDbService.qdrant.getCollections();
        for (const collection of collections.collections || []) {
            if (collection.name.startsWith('test_') ||
                collection.name.startsWith('search_') ||
                collection.name.startsWith('rollback_') ||
                collection.name.startsWith('conflict_')) {
                try {
                    await globalDbService.qdrant.deleteCollection(collection.name);
                }
                catch (error) {
                    console.warn(`Failed to delete collection ${collection.name}:`, error);
                }
            }
        }
    }
    catch (error) {
        console.warn('Test data cleanup failed:', error);
    }
}
// Export for use in individual test files
export { globalDbService as dbService };
//# sourceMappingURL=setup.js.map
/**
 * Database Test Utilities
 * Common utilities for database testing setup, teardown, and data generation
 */
import { DatabaseService, createDatabaseConfig } from '../src/services/DatabaseService.js';
// Test data generators
export class TestDataGenerator {
    counter = 0;
    generateId(prefix = 'test') {
        return `${prefix}_${Date.now()}_${++this.counter}`;
    }
    generateVector(size = 1536) {
        return Array.from({ length: size }, () => Math.random());
    }
    generateCodeEntity(overrides = {}) {
        const id = this.generateId('code');
        return {
            id,
            type: 'code_entity',
            name: `TestEntity${this.counter}`,
            language: 'typescript',
            content: `class TestEntity${this.counter} { constructor() {} }`,
            file_path: `src/test/TestEntity${this.counter}.ts`,
            ...overrides
        };
    }
    generateDocument(overrides = {}) {
        const id = this.generateId('doc');
        return {
            id,
            type: 'test_document',
            content: {
                title: `Test Document ${this.counter}`,
                description: `Generated test document ${this.counter}`,
                tags: ['test', 'generated'],
                ...overrides.content
            },
            metadata: {
                source: 'test_generator',
                priority: 'low',
                ...overrides.metadata
            }
        };
    }
    generateEmbedding(entityId, overrides = {}) {
        return {
            id: Date.now() + Math.random(),
            vector: this.generateVector(),
            payload: {
                entity_id: entityId,
                type: 'code_embedding',
                language: 'typescript',
                ...overrides
            }
        };
    }
    generateGraphNode(label, overrides = {}) {
        const id = this.generateId('node');
        return {
            id,
            label,
            properties: {
                name: `Test${label}${this.counter}`,
                type: label.toLowerCase(),
                created_at: new Date().toISOString(),
                ...overrides
            }
        };
    }
}
// Database test setup and teardown
export class DatabaseTestHelper {
    dbService = null;
    dataGenerator;
    constructor() {
        this.dataGenerator = new TestDataGenerator();
    }
    async setup() {
        if (!this.dbService) {
            const dbConfig = createDatabaseConfig();
            this.dbService = new DatabaseService(dbConfig);
            await this.dbService.initialize();
            await this.dbService.setupDatabase();
        }
        return this.dbService;
    }
    async teardown() {
        if (this.dbService) {
            await this.dbService.close();
            this.dbService = null;
        }
    }
    getDataGenerator() {
        return this.dataGenerator;
    }
    async cleanupTestData(testPrefix = 'test') {
        if (!this.dbService)
            return;
        try {
            // PostgreSQL cleanup
            await this.dbService.postgresQuery('DELETE FROM documents WHERE id LIKE $1', [`${testPrefix}_%`]);
            await this.dbService.postgresQuery('DELETE FROM sessions WHERE id LIKE $1', [`${testPrefix}_%`]);
            await this.dbService.postgresQuery('DELETE FROM test_results WHERE test_id LIKE $1', [`${testPrefix}_%`]);
            // FalkorDB cleanup
            await this.dbService.falkordbQuery(`MATCH (n) WHERE n.id STARTS WITH "${testPrefix}_" DELETE n`);
            // Qdrant cleanup (delete test collections)
            const collections = await this.dbService.qdrant.getCollections();
            for (const collection of collections.collections) {
                if (collection.name.startsWith(testPrefix)) {
                    try {
                        await this.dbService.qdrant.deleteCollection(collection.name);
                    }
                    catch (error) {
                        console.warn(`Failed to delete collection ${collection.name}:`, error);
                    }
                }
            }
        }
        catch (error) {
            console.warn('Cleanup failed:', error);
        }
    }
    async createTestDocuments(count, overrides = {}) {
        if (!this.dbService)
            throw new Error('Database not initialized');
        const documents = [];
        for (let i = 0; i < count; i++) {
            const doc = this.dataGenerator.generateDocument(overrides);
            documents.push(doc);
            await this.dbService.postgresQuery('INSERT INTO documents (id, type, content, metadata) VALUES ($1, $2, $3, $4)', [doc.id, doc.type, JSON.stringify(doc.content), JSON.stringify(doc.metadata)]);
        }
        return documents;
    }
    async createTestGraphNodes(count, label, overrides = {}) {
        if (!this.dbService)
            throw new Error('Database not initialized');
        const nodes = [];
        for (let i = 0; i < count; i++) {
            const node = this.dataGenerator.generateGraphNode(label, overrides);
            nodes.push(node);
            const properties = Object.entries(node.properties)
                .map(([key, value]) => `${key}: ${typeof value === 'string' ? `"${value}"` : value}`)
                .join(', ');
            await this.dbService.falkordbQuery(`CREATE (n:${label} {${properties}, id: "${node.id}"})`);
        }
        return nodes;
    }
    async createTestEmbeddings(count, collectionName, overrides = {}) {
        if (!this.dbService)
            throw new Error('Database not initialized');
        // Create collection if it doesn't exist
        try {
            await this.dbService.qdrant.getCollection(collectionName);
        }
        catch (error) {
            await this.dbService.qdrant.createCollection(collectionName, {
                vectors: { size: 1536, distance: 'Cosine' }
            });
        }
        const embeddings = [];
        const points = [];
        for (let i = 0; i < count; i++) {
            const entityId = this.dataGenerator.generateId('entity');
            const embedding = this.dataGenerator.generateEmbedding(entityId, overrides);
            embeddings.push(embedding);
            points.push({
                id: embedding.id,
                vector: embedding.vector,
                payload: embedding.payload
            });
        }
        await this.dbService.qdrant.upsert(collectionName, { points });
        return embeddings;
    }
    async createComplexTestScenario(scenarioName) {
        if (!this.dbService)
            throw new Error('Database not initialized');
        const scenarioId = this.dataGenerator.generateId(scenarioName);
        // Create a file in PostgreSQL
        const fileDoc = await this.createTestDocuments(1, {
            type: 'source_file',
            content: {
                file_path: `src/${scenarioName}/TestFile.ts`,
                language: 'typescript',
                content: `class TestFile { constructor() { console.log('Hello from ${scenarioName}'); } }`
            }
        });
        // Create corresponding graph nodes
        const fileNode = await this.createTestGraphNodes(1, 'File', {
            path: fileDoc[0].content.file_path,
            language: fileDoc[0].content.language
        });
        const classNode = await this.createTestGraphNodes(1, 'Class', {
            name: 'TestFile',
            file_id: fileNode[0].id
        });
        // Create relationship
        await this.dbService.falkordbQuery(`
      MATCH (f:File {id: "${fileNode[0].id}"}), (c:Class {id: "${classNode[0].id}"})
      CREATE (f)-[:CONTAINS]->(c)
    `);
        // Create embeddings
        const embeddings = await this.createTestEmbeddings(2, 'test_embeddings', {
            scenario: scenarioName,
            file_id: fileNode[0].id
        });
        return {
            scenarioId,
            file: fileDoc[0],
            graphNodes: {
                file: fileNode[0],
                class: classNode[0]
            },
            embeddings
        };
    }
}
// Performance measurement utilities
export class PerformanceMonitor {
    startTime = 0;
    measurements = {};
    start(operation) {
        this.startTime = Date.now();
        console.log(`🚀 Starting ${operation}...`);
    }
    end(operation) {
        const duration = Date.now() - this.startTime;
        this.measurements[operation] = duration;
        console.log(`✅ ${operation} completed in ${duration}ms`);
        return duration;
    }
    getMeasurement(operation) {
        return this.measurements[operation] || 0;
    }
    getAllMeasurements() {
        return { ...this.measurements };
    }
    assertPerformance(operation, maxDuration) {
        const duration = this.getMeasurement(operation);
        if (duration > maxDuration) {
            throw new Error(`${operation} took ${duration}ms, exceeding limit of ${maxDuration}ms`);
        }
    }
}
// Singleton instance for test helpers
let testHelper = null;
export function getTestHelper() {
    if (!testHelper) {
        testHelper = new DatabaseTestHelper();
    }
    return testHelper;
}
// Global test setup
export async function globalTestSetup() {
    const helper = getTestHelper();
    return await helper.setup();
}
// Global test teardown
export async function globalTestTeardown() {
    if (testHelper) {
        await testHelper.teardown();
        testHelper = null;
    }
}
// Utility for running tests with automatic cleanup
export async function withDatabaseCleanup(testFn, cleanupPattern = 'test') {
    const helper = getTestHelper();
    try {
        const result = await testFn();
        return result;
    }
    finally {
        await helper.cleanupTestData(cleanupPattern);
    }
}
//# sourceMappingURL=database-test-utils.js.map
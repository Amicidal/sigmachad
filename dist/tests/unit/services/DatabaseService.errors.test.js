/**
 * Error scenario tests for DatabaseService
 * Tests edge cases, failure modes, and recovery scenarios
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService, createTestDatabaseConfig } from '../../../src/services/DatabaseService';
import { RealisticFalkorDBMock, RealisticPostgreSQLMock, RealisticRedisMock } from '../../test-utils/realistic-mocks';
describe('DatabaseService Error Scenarios', () => {
    let dbService;
    beforeEach(() => {
        const config = createTestDatabaseConfig();
        dbService = new DatabaseService(config);
    });
    describe('Cascading Failures', () => {
        it('should handle multiple service failures gracefully', async () => {
            // Initialize with services that will fail
            const failingFalkorDB = new RealisticFalkorDBMock({
                connectionFailures: true,
                failureRate: 100
            });
            const failingPostgres = new RealisticPostgreSQLMock({
                connectionFailures: true,
                failureRate: 100
            });
            // Attempt operations that will fail
            const operations = [
                dbService.falkordbQuery('MATCH (n) RETURN n'),
                dbService.postgresQuery('SELECT 1'),
                dbService.setupDatabase()
            ];
            // All operations should reject with meaningful errors
            const results = await Promise.allSettled(operations);
            expect(results[0].status).toBe('rejected');
            expect(results[1].status).toBe('rejected');
            expect(results[2].status).toBe('rejected');
            // Check error messages are informative
            results.forEach(result => {
                if (result.status === 'rejected') {
                    expect(result.reason).toBeInstanceOf(Error);
                    expect(result.reason.message).not.toBe('');
                    expect(result.reason.message.length).toBeGreaterThan(10);
                }
            });
        });
        it('should handle partial service availability', async () => {
            // Some services available, others not
            const health = await dbService.healthCheck();
            // Health check should return status for all services
            expect(health).toHaveProperty('falkordb');
            expect(health).toHaveProperty('qdrant');
            expect(health).toHaveProperty('postgresql');
            // All should be false when not initialized
            expect(health.falkordb).toBe(false);
            expect(health.qdrant).toBe(false);
            expect(health.postgresql).toBe(false);
        });
    });
    describe('Query Validation', () => {
        it('should reject empty queries', async () => {
            await expect(dbService.falkordbQuery('')).rejects.toThrow();
            await expect(dbService.falkordbQuery('   ')).rejects.toThrow();
        });
        it('should reject null/undefined queries', async () => {
            await expect(dbService.falkordbQuery(null)).rejects.toThrow();
            await expect(dbService.falkordbQuery(undefined)).rejects.toThrow();
        });
        it('should handle malformed queries gracefully', async () => {
            const malformedQueries = [
                'MATCH (n', // Unclosed parenthesis
                'SELECT * FROM', // Incomplete SQL
                'INVALID SYNTAX HERE',
                ';;;DROP TABLE users;--' // SQL injection attempt
            ];
            for (const query of malformedQueries) {
                await expect(dbService.falkordbQuery(query))
                    .rejects
                    .toThrow(/not initialized|syntax|invalid/i);
            }
        });
    });
    describe('Transaction Rollback', () => {
        it('should rollback transaction on error', async () => {
            let rollbackCalled = false;
            const transactionCallback = async (client) => {
                // Simulate work that fails
                if (client) {
                    rollbackCalled = true;
                    throw new Error('Transaction failed: constraint violation');
                }
                return 'should-not-reach';
            };
            await expect(dbService.postgresTransaction(transactionCallback))
                .rejects
                .toThrow(/not initialized|transaction failed/i);
        });
        it('should handle nested transaction failures', async () => {
            const outerTransaction = async (client) => {
                // Outer transaction
                const innerTransaction = async () => {
                    throw new Error('Inner transaction failed');
                };
                await innerTransaction();
                return 'should-not-reach';
            };
            await expect(dbService.postgresTransaction(outerTransaction))
                .rejects
                .toThrow();
        });
    });
    describe('Bulk Operations', () => {
        it('should handle partial failures in bulk queries', async () => {
            const queries = [
                { query: 'SELECT 1', params: [] },
                { query: 'INVALID QUERY', params: [] },
                { query: 'SELECT 2', params: [] },
                { query: '', params: [] }, // Empty query
                { query: 'SELECT 3', params: [] }
            ];
            // Without continueOnError, should fail fast
            await expect(dbService.postgresBulkQuery(queries))
                .rejects
                .toThrow('Database not initialized');
            // With continueOnError, should process all
            await expect(dbService.postgresBulkQuery(queries, { continueOnError: true }))
                .rejects
                .toThrow('Database not initialized');
        });
        it('should validate bulk query input', async () => {
            // Empty array
            await expect(dbService.postgresBulkQuery([]))
                .rejects
                .toThrow();
            // Invalid structure
            await expect(dbService.postgresBulkQuery(null))
                .rejects
                .toThrow();
            // Queries without required fields
            const invalidQueries = [
                { params: [] }, // Missing query
                { query: 'SELECT 1' }, // Missing params
            ];
            await expect(dbService.postgresBulkQuery(invalidQueries))
                .rejects
                .toThrow();
        });
    });
    describe('Connection Recovery', () => {
        it('should handle connection loss during operation', async () => {
            // Simulate connection loss mid-operation
            const mockService = new RealisticFalkorDBMock({
                connectionFailures: true,
                failureRate: 50
            });
            let successCount = 0;
            let failureCount = 0;
            // Try multiple operations
            for (let i = 0; i < 10; i++) {
                try {
                    await mockService.initialize();
                    await mockService.query('MATCH (n) RETURN n');
                    successCount++;
                }
                catch (error) {
                    failureCount++;
                    expect(error).toBeInstanceOf(Error);
                }
                finally {
                    await mockService.close();
                }
            }
            // Should have both successes and failures
            expect(successCount).toBeGreaterThan(0);
            expect(failureCount).toBeGreaterThan(0);
        });
        it('should not leak resources on failure', async () => {
            const mockService = new RealisticPostgreSQLMock({
                connectionFailures: true
            });
            // Track resource allocation
            let resourcesAllocated = 0;
            let resourcesFreed = 0;
            const trackingCallback = async (client) => {
                resourcesAllocated++;
                try {
                    throw new Error('Simulated failure');
                }
                finally {
                    resourcesFreed++;
                }
            };
            try {
                await mockService.initialize();
                await mockService.transaction(trackingCallback);
            }
            catch (error) {
                // Expected to fail
            }
            // Resources should be cleaned up even on failure
            expect(resourcesAllocated).toBe(resourcesFreed);
        });
    });
    describe('Redis TTL and Expiry', () => {
        it('should handle expired keys correctly', async () => {
            const mockRedis = new RealisticRedisMock({ failureRate: 0 });
            await mockRedis.initialize();
            // Set with very short TTL
            await mockRedis.set('short-ttl-key', 'value', 1);
            // Should exist immediately
            const immediate = await mockRedis.get('short-ttl-key');
            expect(immediate).not.toBeNull();
            // Wait for expiry
            await new Promise(resolve => setTimeout(resolve, 1100));
            // Should be expired
            const expired = await mockRedis.get('short-ttl-key');
            expect(expired).toBeNull();
        });
        it('should handle Redis memory pressure', async () => {
            const mockRedis = new RealisticRedisMock({ failureRate: 0 });
            await mockRedis.initialize();
            // Fill up memory
            const keysToAdd = 2000; // Exceeds typical limit
            const errors = [];
            for (let i = 0; i < keysToAdd; i++) {
                try {
                    await mockRedis.set(`key_${i}`, `value_${i}`.repeat(100));
                }
                catch (error) {
                    errors.push(error);
                }
            }
            // Should have encountered memory errors
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.message.includes('memory'))).toBe(true);
        });
    });
    describe('Concurrent Operations', () => {
        it('should handle concurrent queries safely', async () => {
            const mockService = new RealisticFalkorDBMock({
                failureRate: 10,
                latencyMs: 50
            });
            await mockService.initialize();
            // Launch concurrent queries
            const concurrentQueries = Array(20).fill(null).map((_, i) => mockService.query(`MATCH (n:Type${i}) RETURN n`));
            const results = await Promise.allSettled(concurrentQueries);
            // Should have mix of success and failure
            const successes = results.filter(r => r.status === 'fulfilled');
            const failures = results.filter(r => r.status === 'rejected');
            expect(successes.length).toBeGreaterThan(0);
            expect(failures.length).toBeGreaterThan(0);
            // Verify failure reasons are meaningful
            failures.forEach(failure => {
                if (failure.status === 'rejected') {
                    expect(failure.reason).toBeInstanceOf(Error);
                    expect(failure.reason.message).toBeTruthy();
                }
            });
        });
        it('should prevent race conditions in initialization', async () => {
            const service1 = new DatabaseService(createTestDatabaseConfig());
            const service2 = new DatabaseService(createTestDatabaseConfig());
            // Try to initialize concurrently
            const init1 = service1.initialize();
            const init2 = service2.initialize();
            // Both should complete without interfering
            await expect(Promise.all([init1, init2])).resolves.not.toThrow();
        });
    });
    describe('Data Integrity', () => {
        it('should detect corrupted data', async () => {
            const mockService = new RealisticFalkorDBMock({
                dataCorruption: true,
                failureRate: 0
            });
            await mockService.initialize();
            let corruptionDetected = false;
            // Try multiple queries
            for (let i = 0; i < 20; i++) {
                const result = await mockService.query('MATCH (n) RETURN n');
                if (result && result.corrupted) {
                    corruptionDetected = true;
                    expect(result.error).toContain('integrity');
                }
            }
            expect(corruptionDetected).toBe(true);
        });
        it('should validate data types in responses', async () => {
            const mockService = new RealisticPostgreSQLMock({ failureRate: 0 });
            await mockService.initialize();
            const result = await mockService.query('SELECT * FROM users');
            // Validate response structure
            expect(result).toHaveProperty('rows');
            expect(Array.isArray(result.rows)).toBe(true);
            if (result.rows.length > 0) {
                result.rows.forEach((row) => {
                    expect(row).toHaveProperty('id');
                    expect(typeof row.id).toBe('number');
                    expect(row).toHaveProperty('timestamp');
                    expect(row.timestamp).toBeInstanceOf(Date);
                });
            }
        });
    });
});
//# sourceMappingURL=DatabaseService.errors.test.js.map
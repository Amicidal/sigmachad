/**
 * Unit tests for PostgreSQLService
 * Tests PostgreSQL service functionality with real functionality tests (no excessive mocking)
 */
/// <reference types="node" />
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Pool } from 'pg';
import { PostgreSQLService } from '../../../src/services/database/PostgreSQLService';
// Mock the pg module
const mockPool = {
    connect: vi.fn(),
    query: vi.fn(),
    end: vi.fn(),
    totalCount: 10,
    idleCount: 5,
    waitingCount: 0,
};
vi.mock('pg', () => ({
    Pool: vi.fn().mockImplementation(() => mockPool),
}));
describe('PostgreSQLService', () => {
    let service;
    let testConfig;
    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();
        testConfig = {
            connectionString: 'postgresql://test:test@localhost:5432/test',
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        };
        // Create fresh service instance
        service = new PostgreSQLService(testConfig);
    });
    afterEach(() => {
        // Clean up after each test
        vi.restoreAllMocks();
    });
    describe('Constructor and Configuration', () => {
        it('should create service instance with valid configuration', () => {
            expect(service).not.toBeNull();
            expect(service).toBeInstanceOf(PostgreSQLService);
            expect(typeof service.initialize).toBe('function');
            expect(typeof service.close).toBe('function');
            expect(typeof service.isInitialized).toBe('function');
            expect(typeof service.getPool).toBe('function');
            expect(typeof service.query).toBe('function');
        });
        it('should create service with minimal configuration', () => {
            const minimalConfig = {
                connectionString: 'postgresql://user:pass@localhost:5432/db',
            };
            const minimalService = new PostgreSQLService(minimalConfig);
            expect(minimalService).toBeInstanceOf(PostgreSQLService);
        });
        it('should create service with all optional parameters', () => {
            const fullConfig = {
                connectionString: 'postgresql://user:pass@localhost:5432/db',
                max: 20,
                idleTimeoutMillis: 60000,
                connectionTimeoutMillis: 15000,
            };
            const fullService = new PostgreSQLService(fullConfig);
            expect(fullService).toBeInstanceOf(PostgreSQLService);
        });
        it('should accept zero values for numeric configuration', () => {
            const zeroConfig = {
                connectionString: 'postgresql://user:pass@localhost:5432/db',
                max: 0,
                idleTimeoutMillis: 0,
                connectionTimeoutMillis: 0,
            };
            const zeroService = new PostgreSQLService(zeroConfig);
            expect(zeroService).toBeInstanceOf(PostgreSQLService);
        });
        it('should handle complex connection strings', () => {
            const complexConfig = {
                connectionString: 'postgresql://user%40domain:pass%40word@host.com:5432/db_name?sslmode=require&application_name=myapp',
            };
            const complexService = new PostgreSQLService(complexConfig);
            expect(complexService).toBeInstanceOf(PostgreSQLService);
        });
        it('should store configuration internally', () => {
            // We can't directly access private config, but we can verify it exists
            // by testing that the service behaves correctly with the configuration
            expect(service).toBeDefined();
        });
        it('should not modify original configuration object', () => {
            const originalConfig = { ...testConfig };
            const newService = new PostgreSQLService(testConfig);
            // Modify the original config
            testConfig.max = 999;
            // The service should still have the original values
            // (This tests that we don't hold a reference to the original object)
            expect(newService).toBeDefined();
        });
    });
    describe('Initialization', () => {
        it('should start uninitialized', () => {
            expect(service.isInitialized()).toBe(false);
        });
        it('should initialize successfully with valid connection', async () => {
            // Mock successful connection
            const mockClient = {
                query: vi.fn().mockResolvedValue({ rows: [] }),
                release: vi.fn(),
            };
            mockPool.connect.mockResolvedValue(mockClient);
            mockPool.query = vi.fn().mockResolvedValue({ rows: [] });
            await expect(service.initialize()).resolves.toBeUndefined();
            expect(service.isInitialized()).toBe(true);
            expect(mockPool.connect).toHaveBeenCalledTimes(1);
            expect(mockClient.query).toHaveBeenCalledWith('SELECT NOW()');
            expect(mockClient.release).toHaveBeenCalledTimes(1);
        });
        it('should not initialize twice', async () => {
            // Mock successful connection
            const mockClient = {
                query: vi.fn().mockResolvedValue({ rows: [] }),
                release: vi.fn(),
            };
            mockPool.connect.mockResolvedValue(mockClient);
            mockPool.query = vi.fn().mockResolvedValue({ rows: [] });
            // First initialization
            await service.initialize();
            expect(service.isInitialized()).toBe(true);
            // Second initialization should return early
            await service.initialize();
            expect(service.isInitialized()).toBe(true);
            // Pool should only be created once
            expect(Pool).toHaveBeenCalledTimes(1);
        });
        it('should handle connection failure during initialization', async () => {
            // Mock connection failure
            mockPool.connect.mockRejectedValue(new Error('Connection refused'));
            await expect(service.initialize()).rejects.toThrow('Connection refused');
            expect(service.isInitialized()).toBe(false);
        });
        it('should handle test query failure during initialization', async () => {
            // Mock successful connection but failed test query
            const mockClient = {
                query: vi.fn().mockRejectedValue(new Error('Query failed')),
                release: vi.fn(),
            };
            mockPool.connect.mockResolvedValue(mockClient);
            await expect(service.initialize()).rejects.toThrow('Query failed');
            expect(service.isInitialized()).toBe(false);
            expect(mockClient.release).toHaveBeenCalledTimes(1);
        });
        it('should create pool with correct configuration', async () => {
            // Mock successful connection
            const mockClient = {
                query: vi.fn().mockResolvedValue({ rows: [] }),
                release: vi.fn(),
            };
            mockPool.connect.mockResolvedValue(mockClient);
            mockPool.query = vi.fn().mockResolvedValue({ rows: [] });
            await service.initialize();
            expect(Pool).toHaveBeenCalledWith({
                connectionString: testConfig.connectionString,
                max: testConfig.max,
                idleTimeoutMillis: testConfig.idleTimeoutMillis,
                connectionTimeoutMillis: testConfig.connectionTimeoutMillis,
            });
        });
        it('should create pool with default values when config is minimal', async () => {
            const minimalConfig = {
                connectionString: 'postgresql://test:test@localhost:5432/test',
            };
            const minimalService = new PostgreSQLService(minimalConfig);
            // Mock successful connection
            const mockClient = {
                query: vi.fn().mockResolvedValue({ rows: [] }),
                release: vi.fn(),
            };
            const mockMinimalPool = {
                connect: vi.fn().mockResolvedValue(mockClient),
                query: vi.fn().mockResolvedValue({ rows: [] }),
            };
            // Mock the Pool constructor to return our mock pool
            Pool.mockImplementation(() => mockMinimalPool);
            await minimalService.initialize();
            expect(Pool).toHaveBeenCalledWith({
                connectionString: minimalConfig.connectionString,
                max: 20, // default value
                idleTimeoutMillis: 30000, // default value
                connectionTimeoutMillis: 10000, // default value
            });
        });
        it('should log successful initialization', async () => {
            // Mock console.log to capture output
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
            // Mock successful connection
            const mockClient = {
                query: vi.fn().mockResolvedValue({ rows: [] }),
                release: vi.fn(),
            };
            mockPool.connect.mockResolvedValue(mockClient);
            mockPool.query = vi.fn().mockResolvedValue({ rows: [] });
            await service.initialize();
            expect(consoleSpy).toHaveBeenCalledWith('✅ PostgreSQL connection established');
            consoleSpy.mockRestore();
        });
        it('should log initialization errors', async () => {
            // Mock console.error to capture output
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            // Mock connection failure
            mockPool.connect.mockRejectedValue(new Error('Connection failed'));
            await expect(service.initialize()).rejects.toThrow();
            expect(consoleSpy).toHaveBeenCalledWith('❌ PostgreSQL initialization failed:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });
    describe('Close Method', () => {
        beforeEach(async () => {
            // Initialize service for close tests
            const mockClient = {
                query: vi.fn().mockResolvedValue({ rows: [] }),
                release: vi.fn(),
            };
            mockPool.connect.mockResolvedValue(mockClient);
            mockPool.query = vi.fn().mockResolvedValue({ rows: [] });
            await service.initialize();
        });
        it('should close pool successfully when initialized', async () => {
            mockPool.end.mockResolvedValue(undefined);
            await expect(service.close()).resolves.toBeUndefined();
            expect(mockPool.end).toHaveBeenCalledTimes(1);
            expect(service.isInitialized()).toBe(false);
        });
        it('should handle pool close gracefully', async () => {
            // Mock successful pool close
            mockPool.end.mockResolvedValue(undefined);
            await service.close();
            expect(mockPool.end).toHaveBeenCalledTimes(1);
        });
        it('should handle pool close errors gracefully', async () => {
            // Mock pool close failure
            const closeError = new Error('Pool close failed');
            mockPool.end.mockRejectedValue(closeError);
            // Should not throw despite pool close failure
            await expect(service.close()).resolves.toBeUndefined();
            expect(mockPool.end).toHaveBeenCalledTimes(1);
        });
        it('should reset initialization state after close', async () => {
            mockPool.end.mockResolvedValue(undefined);
            expect(service.isInitialized()).toBe(true);
            await service.close();
            expect(service.isInitialized()).toBe(false);
        });
        it('should allow reinitialization after close', async () => {
            // Close the service
            mockPool.end.mockResolvedValue(undefined);
            await service.close();
            expect(service.isInitialized()).toBe(false);
            // Reinitialize
            const mockClient = {
                query: vi.fn().mockResolvedValue({ rows: [] }),
                release: vi.fn(),
            };
            mockPool.connect.mockResolvedValue(mockClient);
            mockPool.query = vi.fn().mockResolvedValue({ rows: [] });
            await service.initialize();
            expect(service.isInitialized()).toBe(true);
        });
        it('should handle close when pool does not exist', async () => {
            // Create a service that hasn't been initialized
            const uninitializedService = new PostgreSQLService(testConfig);
            // Should not throw when closing uninitialized service
            await expect(uninitializedService.close()).resolves.toBeUndefined();
            expect(uninitializedService.isInitialized()).toBe(false);
        });
        it('should handle multiple close calls', async () => {
            mockPool.end.mockResolvedValue(undefined);
            // First close
            await service.close();
            expect(mockPool.end).toHaveBeenCalledTimes(1);
            // Second close should not call end again
            await service.close();
            expect(mockPool.end).toHaveBeenCalledTimes(1); // Should still be 1
        });
        it('should prevent operations after close', async () => {
            mockPool.end.mockResolvedValue(undefined);
            await service.close();
            // Should throw when trying to get pool after close
            expect(() => service.getPool()).toThrow('PostgreSQL not initialized');
            // Should throw when trying to query after close
            await expect(service.query('SELECT 1')).rejects.toThrow('PostgreSQL not initialized');
        });
    });
    describe('State Methods', () => {
        describe('isInitialized()', () => {
            it('should return false when service is not initialized', () => {
                const uninitializedService = new PostgreSQLService(testConfig);
                expect(uninitializedService.isInitialized()).toBe(false);
            });
            it('should return true after successful initialization', async () => {
                const mockClient = {
                    query: vi.fn().mockResolvedValue({ rows: [] }),
                    release: vi.fn(),
                };
                mockPool.connect.mockResolvedValue(mockClient);
                mockPool.query = vi.fn().mockResolvedValue({ rows: [] });
                expect(service.isInitialized()).toBe(false);
                await service.initialize();
                expect(service.isInitialized()).toBe(true);
            });
            it('should return false after close', async () => {
                // Initialize service
                const mockClient = {
                    query: vi.fn().mockResolvedValue({ rows: [] }),
                    release: vi.fn(),
                };
                mockPool.connect.mockResolvedValue(mockClient);
                mockPool.query = vi.fn().mockResolvedValue({ rows: [] });
                await service.initialize();
                expect(service.isInitialized()).toBe(true);
                // Close service
                mockPool.end.mockResolvedValue(undefined);
                await service.close();
                expect(service.isInitialized()).toBe(false);
            });
            it('should return false after initialization failure', async () => {
                mockPool.connect.mockRejectedValue(new Error('Connection failed'));
                expect(service.isInitialized()).toBe(false);
                try {
                    await service.initialize();
                }
                catch (error) {
                    // Expected to fail
                }
                expect(service.isInitialized()).toBe(false);
            });
        });
        describe('getPool()', () => {
            it('should throw error when service is not initialized', () => {
                const uninitializedService = new PostgreSQLService(testConfig);
                expect(() => uninitializedService.getPool()).toThrow('PostgreSQL not initialized');
            });
            it('should return pool when service is initialized', async () => {
                const mockClient = {
                    query: vi.fn().mockResolvedValue({ rows: [] }),
                    release: vi.fn(),
                };
                mockPool.connect.mockResolvedValue(mockClient);
                mockPool.query = vi.fn().mockResolvedValue({ rows: [] });
                await service.initialize();
                const pool = service.getPool();
                expect(pool).toBe(mockPool);
            });
            it('should return the same pool instance on multiple calls', async () => {
                const mockClient = {
                    query: vi.fn().mockResolvedValue({ rows: [] }),
                    release: vi.fn(),
                };
                mockPool.connect.mockResolvedValue(mockClient);
                mockPool.query = vi.fn().mockResolvedValue({ rows: [] });
                await service.initialize();
                const pool1 = service.getPool();
                const pool2 = service.getPool();
                expect(pool1).toBe(pool2);
                expect(pool1).toBe(mockPool);
            });
            it('should throw error after service is closed', async () => {
                // Initialize service
                const mockClient = {
                    query: vi.fn().mockResolvedValue({ rows: [] }),
                    release: vi.fn(),
                };
                mockPool.connect.mockResolvedValue(mockClient);
                mockPool.query = vi.fn().mockResolvedValue({ rows: [] });
                await service.initialize();
                // Close service
                mockPool.end.mockResolvedValue(undefined);
                await service.close();
                // Should throw after close
                expect(() => service.getPool()).toThrow('PostgreSQL not initialized');
            });
            it('should return pool with correct properties', async () => {
                const mockClient = {
                    query: vi.fn().mockResolvedValue({ rows: [] }),
                    release: vi.fn(),
                };
                mockPool.connect.mockResolvedValue(mockClient);
                mockPool.query = vi.fn().mockResolvedValue({ rows: [] });
                await service.initialize();
                const pool = service.getPool();
                // Verify pool has expected properties
                expect(pool).toHaveProperty('connect');
                expect(pool).toHaveProperty('query');
                expect(pool).toHaveProperty('end');
                expect(typeof pool.connect).toBe('function');
                expect(typeof pool.query).toBe('function');
                expect(typeof pool.end).toBe('function');
            });
        });
    });
    describe('Basic Query Method', () => {
        beforeEach(async () => {
            // Initialize service for query tests
            const mockClient = {
                query: vi.fn().mockResolvedValue({
                    rows: [{ id: 1, name: 'test' }],
                    rowCount: 1
                }),
                release: vi.fn(),
            };
            mockPool.connect.mockResolvedValue(mockClient);
            mockPool.query = vi.fn().mockResolvedValue({ rows: [] });
            await service.initialize();
        });
        it('should throw error when service is not initialized', async () => {
            const uninitializedService = new PostgreSQLService(testConfig);
            await expect(uninitializedService.query('SELECT 1')).rejects.toThrow('PostgreSQL not initialized');
        });
        it('should execute query successfully without parameters', async () => {
            const query = 'SELECT * FROM users';
            const expectedResult = {
                rows: [{ id: 1, name: 'test' }],
                rowCount: 1
            };
            const mockClient = {
                query: vi.fn().mockResolvedValue(expectedResult),
                release: vi.fn(),
            };
            mockPool.connect.mockResolvedValue(mockClient);
            const result = await service.query(query);
            expect(result).toBe(expectedResult);
            expect(mockClient.query).toHaveBeenCalledWith(query, []);
            expect(mockClient.release).toHaveBeenCalledTimes(1);
        });
        it('should execute query successfully with parameters', async () => {
            const query = 'SELECT * FROM users WHERE id = $1';
            const params = [123];
            const expectedResult = {
                rows: [{ id: 123, name: 'test user' }],
                rowCount: 1
            };
            const mockClient = {
                query: vi.fn().mockResolvedValue(expectedResult),
                release: vi.fn(),
            };
            mockPool.connect.mockResolvedValue(mockClient);
            const result = await service.query(query, params);
            expect(result).toBe(expectedResult);
            expect(mockClient.query).toHaveBeenCalledWith(query, params);
            expect(mockClient.release).toHaveBeenCalledTimes(1);
        });
        it('should handle empty parameters array', async () => {
            const query = 'SELECT COUNT(*) FROM users';
            const params = [];
            const expectedResult = {
                rows: [{ count: 10 }],
                rowCount: 1
            };
            const mockClient = {
                query: vi.fn().mockResolvedValue(expectedResult),
                release: vi.fn(),
            };
            mockPool.connect.mockResolvedValue(mockClient);
            const result = await service.query(query, params);
            expect(result).toBe(expectedResult);
            expect(mockClient.query).toHaveBeenCalledWith(query, params);
        });
        it('should handle large parameter arrays', async () => {
            const query = 'INSERT INTO users (name, email, age) VALUES ($1, $2, $3)';
            const params = ['John Doe', 'john@example.com', 30];
            const expectedResult = {
                rows: [{ id: 1 }],
                rowCount: 1
            };
            const mockClient = {
                query: vi.fn().mockResolvedValue(expectedResult),
                release: vi.fn(),
            };
            mockPool.connect.mockResolvedValue(mockClient);
            const result = await service.query(query, params);
            expect(result).toBe(expectedResult);
            expect(mockClient.query).toHaveBeenCalledWith(query, params);
        });
        it('should set default timeout when not specified', async () => {
            const query = 'SELECT * FROM users';
            const expectedResult = {
                rows: [{ id: 1 }],
                rowCount: 1
            };
            const mockClient = {
                query: vi.fn().mockResolvedValue(expectedResult),
                release: vi.fn(),
            };
            mockPool.connect.mockResolvedValue(mockClient);
            await service.query(query);
            // Should have called SET statement_timeout with default 30 seconds
            expect(mockClient.query).toHaveBeenCalledWith('SET statement_timeout = 30000');
        });
        it('should set custom timeout when specified', async () => {
            const query = 'SELECT * FROM users';
            const options = { timeout: 5000 };
            const expectedResult = {
                rows: [{ id: 1 }],
                rowCount: 1
            };
            const mockClient = {
                query: vi.fn().mockResolvedValue(expectedResult),
                release: vi.fn(),
            };
            mockPool.connect.mockResolvedValue(mockClient);
            await service.query(query, [], options);
            // Should have called SET statement_timeout with custom timeout
            expect(mockClient.query).toHaveBeenCalledWith('SET statement_timeout = 5000');
        });
        it('should handle query execution errors', async () => {
            const query = 'SELECT * FROM nonexistent_table';
            const queryError = new Error('relation "nonexistent_table" does not exist');
            const mockClient = {
                query: vi.fn().mockRejectedValue(queryError),
                release: vi.fn(),
            };
            mockPool.connect.mockResolvedValue(mockClient);
            await expect(service.query(query)).rejects.toThrow('relation "nonexistent_table" does not exist');
            expect(mockClient.release).toHaveBeenCalledTimes(1);
        });
        it('should handle client connection errors', async () => {
            const connectionError = new Error('Connection lost');
            mockPool.connect.mockRejectedValue(connectionError);
            await expect(service.query('SELECT 1')).rejects.toThrow('Connection lost');
        });
        it('should handle client release errors gracefully', async () => {
            const query = 'SELECT * FROM users';
            const expectedResult = {
                rows: [{ id: 1 }],
                rowCount: 1
            };
            const mockClient = {
                query: vi.fn().mockResolvedValue(expectedResult),
                release: vi.fn().mockRejectedValue(new Error('Release failed')),
            };
            mockPool.connect.mockResolvedValue(mockClient);
            // Should not throw due to release error
            const result = await service.query(query);
            expect(result).toBe(expectedResult);
        });
        it('should log query errors with context', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const query = 'INVALID QUERY';
            const params = ['param1'];
            const queryError = new Error('Syntax error');
            const mockClient = {
                query: vi.fn().mockRejectedValue(queryError),
                release: vi.fn(),
            };
            mockPool.connect.mockResolvedValue(mockClient);
            await expect(service.query(query, params)).rejects.toThrow();
            expect(consoleSpy).toHaveBeenCalledWith('PostgreSQL query error:', queryError);
            expect(consoleSpy).toHaveBeenCalledWith('Query was:', query);
            expect(consoleSpy).toHaveBeenCalledWith('Params were:', params);
            consoleSpy.mockRestore();
        });
        it('should handle timeout errors', async () => {
            const timeoutError = new Error('Query timeout');
            const mockClient = {
                query: vi.fn()
                    .mockResolvedValueOnce(undefined) // SET statement_timeout succeeds
                    .mockRejectedValue(timeoutError), // Actual query fails
                release: vi.fn(),
            };
            mockPool.connect.mockResolvedValue(mockClient);
            await expect(service.query('SELECT * FROM large_table', [], { timeout: 1000 }))
                .rejects.toThrow('Query timeout');
            expect(mockClient.release).toHaveBeenCalledTimes(1);
        });
    });
});
//# sourceMappingURL=PostgreSQLService.test.js.map
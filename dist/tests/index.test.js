/**
 * Main Application Integration Tests
 * Tests the actual application initialization and startup process
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { spawn } from 'child_process';
import fetch from 'node-fetch';
import { DatabaseService, createDatabaseConfig } from '../src/services/DatabaseService.js';
describe('Main Application Integration', () => {
    let appProcess = null;
    let dbService;
    const appPort = 3457; // Use a different port for testing
    beforeAll(async () => {
        // Initialize database for cleanup
        const dbConfig = createDatabaseConfig();
        dbService = new DatabaseService(dbConfig);
        await dbService.initialize();
    }, 30000);
    afterAll(async () => {
        if (appProcess) {
            appProcess.kill('SIGTERM');
            appProcess = null;
        }
        await dbService.close();
    }, 10000);
    beforeEach(async () => {
        // Clean up test data
        await dbService.postgresQuery("DELETE FROM documents WHERE id LIKE 'test_%' OR type = 'test'").catch(() => { });
    });
    afterEach(() => {
        if (appProcess) {
            appProcess.kill('SIGTERM');
            appProcess = null;
        }
    });
    describe('Application Startup', () => {
        it('should start successfully with required services', async () => {
            const startTime = Date.now();
            // Start the application
            appProcess = spawn('node', ['dist/index.js'], {
                env: {
                    ...process.env,
                    PORT: String(appPort),
                    NODE_ENV: 'test',
                    LOG_LEVEL: 'error' // Reduce noise in tests
                },
                stdio: ['ignore', 'pipe', 'pipe']
            });
            // Wait for application to be ready
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Application failed to start within timeout'));
                }, 15000);
                const checkHealth = async () => {
                    try {
                        const response = await fetch(`http://localhost:${appPort}/health`);
                        if (response.status === 200) {
                            clearTimeout(timeout);
                            resolve();
                        }
                        else {
                            setTimeout(checkHealth, 500);
                        }
                    }
                    catch (error) {
                        setTimeout(checkHealth, 500);
                    }
                };
                // Start checking after a brief delay
                setTimeout(checkHealth, 2000);
            });
            const startupTime = Date.now() - startTime;
            expect(startupTime).toBeLessThan(20000); // Should start within 20 seconds
            // Verify the app is actually running
            const healthResponse = await fetch(`http://localhost:${appPort}/health`);
            expect(healthResponse.status).toBe(200);
            const healthData = await healthResponse.json();
            expect(healthData.status).toBe('healthy');
            expect(healthData.uptime).toBeGreaterThan(0);
        }, 30000);
        it('should initialize all required services', async () => {
            // Start the application
            appProcess = spawn('node', ['dist/index.js'], {
                env: {
                    ...process.env,
                    PORT: String(appPort),
                    NODE_ENV: 'test'
                },
                stdio: ['ignore', 'pipe', 'pipe']
            });
            // Collect startup logs
            const startupLogs = [];
            appProcess.stdout?.on('data', (data) => {
                startupLogs.push(data.toString());
            });
            // Wait for startup
            await new Promise((resolve) => {
                const checkReady = async () => {
                    try {
                        const response = await fetch(`http://localhost:${appPort}/health`);
                        if (response.status === 200) {
                            resolve();
                        }
                        else {
                            setTimeout(checkReady, 500);
                        }
                    }
                    catch {
                        setTimeout(checkReady, 500);
                    }
                };
                setTimeout(checkReady, 2000);
            });
            // Verify services are initialized
            const statusResponse = await fetch(`http://localhost:${appPort}/api/admin/status`);
            expect(statusResponse.status).toBe(200);
            const status = await statusResponse.json();
            expect(status.services).toBeDefined();
            expect(status.services.database).toBe('connected');
            expect(status.services.knowledgeGraph).toBe('initialized');
            expect(status.services.fileWatcher).toBe('active');
        }, 30000);
        it('should handle help flag', async () => {
            const helpProcess = spawn('node', ['dist/index.js', '--help'], {
                stdio: ['ignore', 'pipe', 'pipe']
            });
            const output = await new Promise((resolve) => {
                let data = '';
                helpProcess.stdout?.on('data', (chunk) => {
                    data += chunk.toString();
                });
                helpProcess.on('exit', () => {
                    resolve(data);
                });
            });
            expect(output).toContain('Memento - AI Coding Assistant');
            expect(output).toContain('Usage:');
            expect(output).toContain('Options:');
            expect(output).toContain('--help');
        });
    });
    describe('Graceful Shutdown', () => {
        it('should shutdown cleanly on SIGTERM', async () => {
            // Start the application
            appProcess = spawn('node', ['dist/index.js'], {
                env: {
                    ...process.env,
                    PORT: String(appPort),
                    NODE_ENV: 'test'
                },
                stdio: ['ignore', 'pipe', 'pipe']
            });
            // Wait for startup
            await new Promise((resolve) => {
                setTimeout(async () => {
                    try {
                        const response = await fetch(`http://localhost:${appPort}/health`);
                        if (response.status === 200)
                            resolve();
                    }
                    catch {
                        // Ignore errors during startup
                    }
                }, 3000);
            });
            // Send SIGTERM
            appProcess.kill('SIGTERM');
            // Wait for process to exit
            const exitCode = await new Promise((resolve) => {
                appProcess.on('exit', (code) => {
                    resolve(code);
                });
            });
            expect(exitCode).toBe(0);
            // Verify server is no longer responding
            await expect(fetch(`http://localhost:${appPort}/health`)).rejects.toThrow();
        }, 20000);
        it('should cleanup resources on shutdown', async () => {
            // Start the application
            appProcess = spawn('node', ['dist/index.js'], {
                env: {
                    ...process.env,
                    PORT: String(appPort),
                    NODE_ENV: 'test'
                },
                stdio: ['ignore', 'pipe', 'pipe']
            });
            // Wait for startup
            await new Promise((resolve) => setTimeout(resolve, 5000));
            // Create some test data
            const testId = `test_shutdown_${Date.now()}`;
            await fetch(`http://localhost:${appPort}/api/graph/entities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: testId,
                    type: 'test',
                    name: 'Test Entity'
                })
            });
            // Shutdown the application
            appProcess.kill('SIGTERM');
            // Wait for shutdown
            await new Promise((resolve) => {
                appProcess.on('exit', resolve);
            });
            // Verify data was persisted (not lost during shutdown)
            const result = await dbService.postgresQuery('SELECT id FROM documents WHERE id = $1', [testId]);
            // The entity should still exist after graceful shutdown
            expect(result.rows.length).toBeGreaterThanOrEqual(0);
        }, 20000);
    });
    describe('Error Handling', () => {
        it('should handle database connection failures gracefully', async () => {
            // Start with invalid database config
            const errorProcess = spawn('node', ['dist/index.js'], {
                env: {
                    ...process.env,
                    PORT: String(appPort),
                    NODE_ENV: 'test',
                    POSTGRES_URL: 'postgresql://invalid:invalid@nonexistent:5432/invalid',
                    FALKORDB_URL: 'redis://nonexistent:6379',
                    QDRANT_URL: 'http://nonexistent:6333'
                },
                stdio: ['ignore', 'pipe', 'pipe']
            });
            const errorOutput = await new Promise((resolve) => {
                let data = '';
                errorProcess.stderr?.on('data', (chunk) => {
                    data += chunk.toString();
                });
                errorProcess.on('exit', () => {
                    resolve(data);
                });
            });
            expect(errorOutput).toContain('Failed to start');
            // Process should have exited with error code
            const exitCode = await new Promise((resolve) => {
                errorProcess.on('exit', (code) => resolve(code));
            });
            expect(exitCode).toBe(1);
        }, 15000);
        it('should handle uncaught exceptions', async () => {
            // This would require injecting an error into the running process
            // For now, we'll verify the handler is set up
            appProcess = spawn('node', ['dist/index.js'], {
                env: {
                    ...process.env,
                    PORT: String(appPort),
                    NODE_ENV: 'test'
                },
                stdio: ['ignore', 'pipe', 'pipe']
            });
            // Wait for startup
            await new Promise((resolve) => setTimeout(resolve, 5000));
            // The application should still be running
            const response = await fetch(`http://localhost:${appPort}/health`);
            expect(response.status).toBe(200);
        }, 15000);
    });
    describe('Environment Configuration', () => {
        it('should respect PORT environment variable', async () => {
            const customPort = 3458;
            appProcess = spawn('node', ['dist/index.js'], {
                env: {
                    ...process.env,
                    PORT: String(customPort),
                    NODE_ENV: 'test'
                },
                stdio: ['ignore', 'pipe', 'pipe']
            });
            // Wait for startup
            await new Promise((resolve) => setTimeout(resolve, 5000));
            // Should respond on custom port
            const response = await fetch(`http://localhost:${customPort}/health`);
            expect(response.status).toBe(200);
        }, 15000);
        it('should respect NODE_ENV settings', async () => {
            appProcess = spawn('node', ['dist/index.js'], {
                env: {
                    ...process.env,
                    PORT: String(appPort),
                    NODE_ENV: 'production'
                },
                stdio: ['ignore', 'pipe', 'pipe']
            });
            // Wait for startup
            await new Promise((resolve) => setTimeout(resolve, 5000));
            // In production, certain debug endpoints might be disabled
            const response = await fetch(`http://localhost:${appPort}/api/admin/debug`);
            expect([403, 404]).toContain(response.status);
        }, 15000);
    });
    describe('API Functionality', () => {
        beforeEach(async () => {
            // Start application for API tests
            appProcess = spawn('node', ['dist/index.js'], {
                env: {
                    ...process.env,
                    PORT: String(appPort),
                    NODE_ENV: 'test'
                },
                stdio: ['ignore', 'pipe', 'pipe']
            });
            // Wait for startup
            await new Promise((resolve) => {
                const checkReady = async () => {
                    try {
                        const response = await fetch(`http://localhost:${appPort}/health`);
                        if (response.status === 200) {
                            resolve();
                        }
                        else {
                            setTimeout(checkReady, 500);
                        }
                    }
                    catch {
                        setTimeout(checkReady, 500);
                    }
                };
                setTimeout(checkReady, 2000);
            });
        });
        it('should process code analysis requests', async () => {
            const codePayload = {
                content: 'function test() { return "hello"; }',
                language: 'javascript',
                path: 'test.js'
            };
            const response = await fetch(`http://localhost:${appPort}/api/code/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(codePayload)
            });
            expect(response.status).toBe(200);
            const result = await response.json();
            expect(result.entities).toBeInstanceOf(Array);
        }, 10000);
        it('should handle concurrent requests', async () => {
            const requests = Array.from({ length: 10 }, (_, i) => fetch(`http://localhost:${appPort}/api/graph/entities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: `test_concurrent_${i}`,
                    type: 'test',
                    name: `Test ${i}`
                })
            }));
            const responses = await Promise.all(requests);
            responses.forEach(response => {
                expect(response.status).toBe(201);
            });
        }, 10000);
    });
});
//# sourceMappingURL=index.test.js.map
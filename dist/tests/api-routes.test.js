/**
 * API Routes Functional Tests
 * Tests actual API endpoint functionality with real requests and responses
 */
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import fastify from 'fastify';
import { tmpdir } from 'os';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
// Import route handlers
import { codeRoutes } from '../src/api/routes/code.js';
import { docsRoutes } from '../src/api/routes/docs.js';
import { testRoutes } from '../src/api/routes/tests.js';
import { designRoutes } from '../src/api/routes/design.js';
import { graphRoutes } from '../src/api/routes/graph.js';
import { impactRoutes } from '../src/api/routes/impact.js';
import { scmRoutes } from '../src/api/routes/scm.js';
import { securityRoutes } from '../src/api/routes/security.js';
// Mock services to avoid real database/service calls
jest.mock('../src/services/DatabaseService.js', () => ({
    DatabaseService: jest.fn().mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined),
        postgresQuery: jest.fn().mockResolvedValue({ rows: [] }),
        qdrantQuery: jest.fn().mockResolvedValue({ points: [] }),
        falkordbQuery: jest.fn().mockResolvedValue({ data: [] }),
        close: jest.fn().mockResolvedValue(undefined)
    }))
}));
jest.mock('../src/services/KnowledgeGraphService.js', () => ({
    KnowledgeGraphService: jest.fn().mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined),
        query: jest.fn().mockResolvedValue({ nodes: [], edges: [] }),
        addNode: jest.fn().mockResolvedValue({ id: 'node-1' }),
        addEdge: jest.fn().mockResolvedValue({ id: 'edge-1' })
    }))
}));
jest.mock('../src/services/ASTParser.js', () => ({
    ASTParser: jest.fn().mockImplementation(() => ({
        parseFile: jest.fn().mockResolvedValue({
            entities: [
                { id: '1', type: 'function', name: 'testFunction' }
            ],
            relationships: [],
            errors: []
        })
    }))
}));
describe('API Routes Functional Tests', () => {
    let app;
    let tempDir;
    beforeAll(async () => {
        // Create temp directory for test files
        tempDir = path.join(tmpdir(), `api-test-${uuidv4()}`);
        await fs.mkdir(tempDir, { recursive: true });
        // Initialize Fastify app
        app = fastify({ logger: false });
        // Register routes
        await app.register(codeRoutes, { prefix: '/api/code' });
        await app.register(docsRoutes, { prefix: '/api/docs' });
        await app.register(testRoutes, { prefix: '/api/tests' });
        await app.register(designRoutes, { prefix: '/api/design' });
        await app.register(graphRoutes, { prefix: '/api/graph' });
        await app.register(impactRoutes, { prefix: '/api/impact' });
        await app.register(scmRoutes, { prefix: '/api/scm' });
        await app.register(securityRoutes, { prefix: '/api/security' });
        await app.ready();
    });
    afterAll(async () => {
        await app.close();
        await fs.rm(tempDir, { recursive: true, force: true });
    });
    describe('Code Routes (/api/code)', () => {
        it('should analyze code changes', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/code/analyze',
                payload: {
                    changes: [
                        {
                            file: 'test.ts',
                            type: 'modify',
                            oldContent: 'const x = 1;',
                            newContent: 'const x = 2;'
                        }
                    ],
                    description: 'Update constant value'
                }
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('affectedEntities');
            expect(body).toHaveProperty('breakingChanges');
            expect(body).toHaveProperty('impactAnalysis');
            expect(body).toHaveProperty('recommendations');
        });
        it('should validate code', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/code/validate',
                payload: {
                    files: ['test.ts'],
                    includeTypes: ['typescript', 'security']
                }
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('valid');
            expect(body).toHaveProperty('issues');
            expect(Array.isArray(body.issues)).toBe(true);
        });
        it('should handle invalid code change requests', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/code/analyze',
                payload: {
                    // Missing required 'changes' field
                    description: 'Invalid request'
                }
            });
            expect(response.statusCode).toBe(400);
        });
    });
    describe('Documentation Routes (/api/docs)', () => {
        it('should parse documentation', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/docs/parse',
                payload: {
                    files: ['README.md'],
                    format: 'markdown'
                }
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('sections');
            expect(body).toHaveProperty('apis');
            expect(body).toHaveProperty('examples');
        });
        it('should generate documentation', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/docs/generate',
                payload: {
                    entities: ['function:testFunction'],
                    format: 'markdown',
                    includeExamples: true
                }
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('content');
            expect(body).toHaveProperty('format');
            expect(body.format).toBe('markdown');
        });
        it('should search documentation', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/docs/search?query=test&limit=10'
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('results');
            expect(Array.isArray(body.results)).toBe(true);
            expect(body).toHaveProperty('total');
        });
    });
    describe('Test Routes (/api/tests)', () => {
        it('should run tests', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/tests/run',
                payload: {
                    files: ['test.spec.ts'],
                    framework: 'jest'
                }
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('passed');
            expect(body).toHaveProperty('failed');
            expect(body).toHaveProperty('skipped');
            expect(body).toHaveProperty('results');
        });
        it('should generate tests', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/tests/generate',
                payload: {
                    file: 'src/utils.ts',
                    functions: ['calculateSum'],
                    framework: 'jest'
                }
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('tests');
            expect(Array.isArray(body.tests)).toBe(true);
            expect(body).toHaveProperty('framework');
        });
        it('should get test coverage', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/tests/coverage'
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('overall');
            expect(body).toHaveProperty('files');
            expect(body).toHaveProperty('uncoveredLines');
        });
    });
    describe('Design Routes (/api/design)', () => {
        it('should get design patterns', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/design/patterns'
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('patterns');
            expect(Array.isArray(body.patterns)).toBe(true);
        });
        it('should analyze architecture', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/design/analyze',
                payload: {
                    scope: 'full',
                    includeMetrics: true
                }
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('components');
            expect(body).toHaveProperty('dependencies');
            expect(body).toHaveProperty('metrics');
        });
        it('should suggest refactoring', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/design/refactor/suggest',
                payload: {
                    file: 'src/complex.ts',
                    types: ['extract-method', 'simplify-conditionals']
                }
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('suggestions');
            expect(Array.isArray(body.suggestions)).toBe(true);
        });
    });
    describe('Graph Routes (/api/graph)', () => {
        it('should query the knowledge graph', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/graph/query',
                payload: {
                    query: 'MATCH (n:Function) RETURN n LIMIT 10',
                    parameters: {}
                }
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('nodes');
            expect(body).toHaveProperty('edges');
            expect(Array.isArray(body.nodes)).toBe(true);
        });
        it('should get entity relationships', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/graph/entity/function:test/relationships'
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('incoming');
            expect(body).toHaveProperty('outgoing');
        });
        it('should find dependencies', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/graph/dependencies?entity=module:app&depth=2'
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('dependencies');
            expect(body).toHaveProperty('graph');
        });
    });
    describe('Impact Analysis Routes (/api/impact)', () => {
        it('should analyze change impact', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/impact/analyze',
                payload: {
                    entity: 'function:calculate',
                    changeType: 'signature',
                    includeTests: true
                }
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('direct');
            expect(body).toHaveProperty('indirect');
            expect(body).toHaveProperty('tests');
            expect(body).toHaveProperty('riskLevel');
        });
        it('should calculate blast radius', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/impact/blast-radius',
                payload: {
                    entities: ['function:process', 'class:Handler'],
                    maxDepth: 3
                }
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('affectedEntities');
            expect(body).toHaveProperty('totalCount');
            expect(body).toHaveProperty('byType');
        });
    });
    describe('SCM Routes (/api/scm)', () => {
        it('should get repository status', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/scm/status'
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('branch');
            expect(body).toHaveProperty('ahead');
            expect(body).toHaveProperty('behind');
            expect(body).toHaveProperty('changes');
        });
        it('should get commit history', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/scm/commits?limit=10'
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('commits');
            expect(Array.isArray(body.commits)).toBe(true);
        });
        it('should analyze file changes', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/scm/diff?file=src/app.ts'
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('additions');
            expect(body).toHaveProperty('deletions');
            expect(body).toHaveProperty('hunks');
        });
    });
    describe('Security Routes (/api/security)', () => {
        it('should scan for vulnerabilities', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/security/scan',
                payload: {
                    files: ['src/api.ts'],
                    scanTypes: ['sql-injection', 'xss', 'secrets']
                }
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('vulnerabilities');
            expect(body).toHaveProperty('summary');
            expect(Array.isArray(body.vulnerabilities)).toBe(true);
        });
        it('should check dependencies', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/security/dependencies'
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('vulnerable');
            expect(body).toHaveProperty('outdated');
            expect(body).toHaveProperty('recommendations');
        });
        it('should validate security policies', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/security/validate-policies',
                payload: {
                    policies: ['no-eval', 'no-hardcoded-secrets'],
                    scope: 'full'
                }
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('compliant');
            expect(body).toHaveProperty('violations');
        });
    });
    describe('Error Handling', () => {
        it('should handle 404 for unknown routes', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/unknown/route'
            });
            expect(response.statusCode).toBe(404);
        });
        it('should handle malformed JSON', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/code/analyze',
                payload: 'invalid json{',
                headers: {
                    'content-type': 'application/json'
                }
            });
            expect(response.statusCode).toBe(400);
        });
        it('should handle method not allowed', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/code/analyze'
            });
            expect([404, 405]).toContain(response.statusCode);
        });
    });
    describe('Request Validation', () => {
        it('should validate required fields', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/tests/run',
                payload: {
                    // Missing required 'files' field
                    framework: 'jest'
                }
            });
            expect(response.statusCode).toBe(400);
        });
        it('should validate field types', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/impact/analyze',
                payload: {
                    entity: 123, // Should be string
                    changeType: 'signature'
                }
            });
            expect(response.statusCode).toBe(400);
        });
        it('should validate enum values', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/tests/generate',
                payload: {
                    file: 'test.ts',
                    framework: 'invalid-framework' // Not a valid framework
                }
            });
            expect(response.statusCode).toBe(400);
        });
    });
    describe('Query Parameters', () => {
        it('should handle pagination parameters', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/docs/search?query=test&page=2&limit=20'
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('page');
            expect(body).toHaveProperty('limit');
        });
        it('should handle filtering parameters', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/graph/nodes?type=function&namespace=utils'
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('nodes');
        });
        it('should validate query parameter types', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/scm/commits?limit=invalid'
            });
            expect(response.statusCode).toBe(400);
        });
    });
    describe('Response Headers', () => {
        it('should set correct content-type', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/design/patterns'
            });
            expect(response.headers['content-type']).toContain('application/json');
        });
        it('should include CORS headers if configured', async () => {
            const response = await app.inject({
                method: 'OPTIONS',
                url: '/api/code/analyze'
            });
            // CORS headers would be present if configured
            // This test assumes CORS is not configured by default
            expect(response.statusCode).toBeLessThan(500);
        });
    });
    describe('Performance and Timeouts', () => {
        it('should handle large payloads', async () => {
            const largePayload = {
                changes: Array(100).fill({
                    file: 'test.ts',
                    type: 'modify',
                    oldContent: 'x'.repeat(1000),
                    newContent: 'y'.repeat(1000)
                }),
                description: 'Large change set'
            };
            const response = await app.inject({
                method: 'POST',
                url: '/api/code/analyze',
                payload: largePayload
            });
            expect(response.statusCode).toBeLessThan(500);
        });
        it('should respect timeout settings', async () => {
            // This would test actual timeout behavior
            // For now, just verify the endpoint responds
            const response = await app.inject({
                method: 'POST',
                url: '/api/graph/query',
                payload: {
                    query: 'MATCH (n) RETURN n',
                    timeout: 100
                }
            });
            expect(response.statusCode).toBeLessThan(500);
        });
    });
});
//# sourceMappingURL=api-routes.test.js.map
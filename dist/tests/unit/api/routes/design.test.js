/**
 * Unit tests for Design Routes
 * Tests design and specification management endpoints
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { registerDesignRoutes } from '../../../../src/api/routes/design.js';
import { createMockRequest, createMockReply } from '../../../test-utils.js';
import { makeRealisticKgService } from '../../../test-utils/kg-realistic';
import { makeRealisticDbService } from '../../../test-utils/db-realistic';
// Mock external dependencies
vi.mock('../../../../src/services/KnowledgeGraphService.js');
vi.mock('../../../../src/services/DatabaseService.js');
// Helper function to create mock Spec entities
function createMockSpec(overrides = {}) {
    return {
        id: overrides.id || 'spec_123',
        type: 'spec',
        path: overrides.path || 'specs/spec_123',
        hash: overrides.hash || 'mock-hash',
        language: overrides.language || 'text',
        lastModified: overrides.lastModified || new Date(),
        created: overrides.created || new Date(),
        title: overrides.title || 'Test Specification',
        description: overrides.description || 'Test description',
        acceptanceCriteria: overrides.acceptanceCriteria || ['Test criterion 1'],
        status: overrides.status || 'draft',
        priority: overrides.priority || 'medium',
        assignee: overrides.assignee || 'user@example.com',
        tags: overrides.tags || ['test', 'spec'],
        updated: overrides.updated || new Date(),
        metadata: overrides.metadata || {},
        ...overrides
    };
}
// Helper function to create mock CreateSpecRequest
function createMockCreateSpecRequest(overrides = {}) {
    return {
        title: overrides.title || 'New Specification',
        description: overrides.description || 'Specification description',
        goals: overrides.goals || ['Goal 1', 'Goal 2'],
        acceptanceCriteria: overrides.acceptanceCriteria || ['Criterion 1', 'Criterion 2'],
        priority: overrides.priority || 'medium',
        assignee: overrides.assignee || 'user@example.com',
        tags: overrides.tags || ['tag1', 'tag2'],
        dependencies: overrides.dependencies || [],
        ...overrides
    };
}
describe('Design Routes', () => {
    let mockApp;
    let mockKgService;
    let mockDbService;
    let mockRequest;
    let mockReply;
    // Create a properly mocked Fastify app that tracks registered routes
    const createMockApp = () => {
        const routes = new Map();
        const registerRoute = (method, path, handler, _options) => {
            const key = `${method}:${path}`;
            routes.set(key, handler);
        };
        return {
            post: vi.fn((path, optionsOrHandler, handler) => {
                if (typeof optionsOrHandler === 'function') {
                    registerRoute('post', path, optionsOrHandler);
                }
                else if (handler) {
                    registerRoute('post', path, handler);
                }
            }),
            get: vi.fn((path, handler) => {
                registerRoute('get', path, handler);
            }),
            put: vi.fn((path, handler) => {
                registerRoute('put', path, handler);
            }),
            getRegisteredRoutes: () => routes
        };
    };
    beforeEach(() => {
        // Create fresh mocks for each test
        mockApp = createMockApp();
        // Use a realistic KG mock; tests still stub specifics where needed
        mockKgService = makeRealisticKgService();
        mockDbService = makeRealisticDbService();
        mockRequest = createMockRequest();
        mockReply = createMockReply();
        // Reset all mocks
        vi.clearAllMocks();
    });
    afterEach(() => {
        vi.resetAllMocks();
    });
    describe('Route Registration', () => {
        it('should register all design routes correctly', async () => {
            await registerDesignRoutes(mockApp, mockKgService, mockDbService);
            const routes = mockApp.getRegisteredRoutes();
            expect(routes.has('post:/design/create-spec')).toBe(true);
            expect(routes.has('get:/design/specs/:specId')).toBe(true);
            expect(routes.has('put:/design/specs/:specId')).toBe(true);
            expect(routes.has('get:/design/specs')).toBe(true);
        });
        it('should call registerDesignRoutes with correct dependencies', async () => {
            await registerDesignRoutes(mockApp, mockKgService, mockDbService);
            expect(mockApp.post).toHaveBeenCalled();
            expect(mockApp.get).toHaveBeenCalled();
            expect(mockApp.put).toHaveBeenCalled();
        });
    });
    describe('POST /design/create-spec', () => {
        let createSpecHandler;
        beforeEach(async () => {
            await registerDesignRoutes(mockApp, mockKgService, mockDbService);
            const routes = mockApp.getRegisteredRoutes();
            createSpecHandler = routes.get('post:/design/create-spec');
        });
        it('should create specification successfully', async () => {
            const mockSpecRequest = createMockCreateSpecRequest();
            mockRequest.body = mockSpecRequest;
            const mockSpec = createMockSpec({
                title: mockSpecRequest.title,
                description: mockSpecRequest.description,
                acceptanceCriteria: mockSpecRequest.acceptanceCriteria
            });
            mockDbService.postgresQuery.mockResolvedValue([{ content: JSON.stringify(mockSpec) }]);
            await createSpecHandler(mockRequest, mockReply);
            expect(mockReply.send).toHaveBeenCalled();
            const callArgs = mockReply.send.mock.calls[0][0];
            expect(callArgs).toEqual(expect.objectContaining({ success: true }));
            expect(callArgs.data).toHaveProperty('specId');
            expect(callArgs.data).toHaveProperty('spec');
            expect(callArgs.data).toHaveProperty('validationResults');
            expect(callArgs.data.spec.title).toBe(mockSpecRequest.title);
            expect(mockDbService.postgresQuery).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO documents'), expect.any(Array));
            expect(mockKgService.createEntity).toHaveBeenCalled();
        });
        it('should handle validation warnings in specification creation', async () => {
            const mockSpecRequest = createMockCreateSpecRequest({
                title: 'Hi', // Short title - should generate warning
                description: 'Short', // Short description - should generate warning
                acceptanceCriteria: ['OK'] // Short criterion - should generate warning
            });
            mockRequest.body = mockSpecRequest;
            const mockSpec = createMockSpec({
                title: mockSpecRequest.title,
                description: mockSpecRequest.description,
                acceptanceCriteria: mockSpecRequest.acceptanceCriteria
            });
            mockDbService.postgresQuery.mockResolvedValue([{ content: JSON.stringify(mockSpec) }]);
            await createSpecHandler(mockRequest, mockReply);
            expect(mockReply.send).toHaveBeenCalled();
            const callArgs = mockReply.send.mock.calls[0][0];
            expect(callArgs).toEqual(expect.objectContaining({ success: true }));
            expect(callArgs.data).toHaveProperty('validationResults');
            expect(callArgs.data.validationResults.isValid).toBe(true); // Warnings don't make it invalid
            expect(callArgs.data.validationResults.issues).toBeDefined();
            expect(callArgs.data.validationResults.suggestions).toBeDefined();
        });
    });
});
//# sourceMappingURL=design.test.js.map
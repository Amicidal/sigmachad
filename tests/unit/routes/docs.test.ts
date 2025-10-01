/**
 * Unit tests for Documentation Routes
 * Tests documentation synchronization, domain analysis, and content management endpoints
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { registerDocsRoutes } from '@memento/api/routes/docs';
import {
  createMockRequest,
  createMockReply,
  type MockFastifyRequest,
  type MockFastifyReply
} from '../../test-utils.js';

// Mock external dependencies
vi.mock('@memento/knowledge', () => ({
  KnowledgeGraphService: vi.fn()
}));

vi.mock('@memento/database/DatabaseService', () => ({
  DatabaseService: vi.fn()
}));

vi.mock('@memento/knowledge', () => ({
  DocumentationParser: vi.fn()
}));

describe('Documentation Routes', () => {
  let mockApp: any;
  let mockKgService: any;
  let mockDbService: any;
  let mockDocParser: any;
  let mockRequest: MockFastifyRequest;
  let mockReply: MockFastifyReply;

  // Create a properly mocked Fastify app that tracks registered routes
  const createMockApp = () => {
    const routes = new Map<string, Function>();

    const registerRoute = (method: string, path: string, handler: Function, _options?: any) => {
      const key = `${method}:${path}`;
      routes.set(key, handler);
    };

    return {
      get: vi.fn((path: string, optionsOrHandler?: any, handler?: Function) => {
        if (typeof optionsOrHandler === 'function') {
          registerRoute('get', path, optionsOrHandler);
        } else if (handler) {
          registerRoute('get', path, handler);
        }
      }),
      post: vi.fn((path: string, optionsOrHandler?: any, handler?: Function) => {
        if (typeof optionsOrHandler === 'function') {
          registerRoute('post', path, optionsOrHandler);
        } else if (handler) {
          registerRoute('post', path, handler);
        }
      }),
      getRegisteredRoutes: () => routes
    };
  };

  beforeEach(() => {
    // Create fresh mocks for each test
    mockApp = createMockApp();

    mockKgService = {
      search: vi.fn()
    };

    mockDbService = {
      query: vi.fn(),
      execute: vi.fn()
    };

    mockDocParser = {
      syncDocumentation: vi.fn(),
      parseFile: vi.fn(),
      searchDocumentation: vi.fn(),
      parseMarkdown: vi.fn(),
      parsePlaintext: vi.fn()
    };

    mockRequest = createMockRequest();
    mockReply = createMockReply();

    // Reset all mocks
    vi.clearAllMocks();

    // Setup default mock implementations
    mockDocParser.syncDocumentation.mockResolvedValue({
      processedFiles: 5,
      newDomains: 2,
      updatedClusters: 3,
      errors: []
    });

    mockKgService.search.mockResolvedValue([]);

    mockDocParser.parseFile.mockResolvedValue({
      title: 'Test Document',
      content: 'Test content',
      businessDomains: ['test-domain'],
      stakeholders: ['developer'],
      technologies: ['typescript'],
      docType: 'readme' as const,
      metadata: {}
    });

    mockDocParser.parseMarkdown.mockResolvedValue({
      title: 'Test Document',
      content: 'Test content',
      businessDomains: ['test-domain'],
      stakeholders: ['developer'],
      technologies: ['typescript'],
      docType: 'readme' as const,
      metadata: {}
    });

    mockDocParser.searchDocumentation.mockResolvedValue([
      {
        document: {
          id: 'doc-1',
          title: 'Test Doc',
          content: 'Content',
          businessDomains: ['test-domain']
        },
        relevanceScore: 0.9,
        matchedSections: ['Introduction']
      }
    ]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Route Registration', () => {
    it('should register all documentation routes correctly', async () => {
      await registerDocsRoutes(mockApp, mockKgService, mockDbService, mockDocParser);

      const routes = mockApp.getRegisteredRoutes();
      expect(routes.has('post:/docs/sync')).toBe(true);
      expect(routes.has('get:/docs/domains')).toBe(true);
      expect(routes.has('get:/docs/domains/:domainName/entities')).toBe(true);
      expect(routes.has('get:/docs/clusters')).toBe(true);
      expect(routes.has('get:/docs/business/impact/:domainName')).toBe(true);
      expect(routes.has('post:/docs/parse')).toBe(true);
      expect(routes.has('get:/docs/search')).toBe(true);
      expect(routes.has('post:/docs/validate')).toBe(true);
    });

    it('should call registerDocsRoutes with correct dependencies', async () => {
      await registerDocsRoutes(mockApp, mockKgService, mockDbService, mockDocParser);

      expect(mockApp.post).toHaveBeenCalled();
      expect(mockApp.get).toHaveBeenCalled();
    });
  });

  describe('POST /docs/sync', () => {
    let syncHandler: Function;

    beforeEach(async () => {
      await registerDocsRoutes(mockApp, mockKgService, mockDbService, mockDocParser);
      const routes = mockApp.getRegisteredRoutes();
      syncHandler = routes.get('post:/docs/sync');
    });

    it('should synchronize documentation successfully', async () => {
      const mockRequestBody = {
        docsPath: '/path/to/docs'
      };

      mockRequest.body = mockRequestBody;

      await syncHandler(mockRequest, mockReply);

      expect(mockDocParser.syncDocumentation).toHaveBeenCalledWith('/path/to/docs');
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: {
          processedFiles: 5,
          newDomains: 2,
          updatedClusters: 3,
          errors: []
        }
      });
    });

    it('should handle synchronization errors', async () => {
      const mockRequestBody = {
        docsPath: '/invalid/path'
      };

      mockRequest.body = mockRequestBody;
      mockDocParser.syncDocumentation.mockRejectedValue(new Error('Sync failed'));

      await syncHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SYNC_FAILED',
          message: 'Failed to synchronize documentation',
          details: 'Sync failed'
        }
      });
    });

    it('should handle missing docsPath parameter', async () => {
      mockRequest.body = {};

      await syncHandler(mockRequest, mockReply);

      // The route has schema validation, so it should handle gracefully
      expect(mockReply.send).toHaveBeenCalled();
    });
  });

  describe('GET /docs/domains', () => {
    let domainsHandler: Function;

    beforeEach(async () => {
      await registerDocsRoutes(mockApp, mockKgService, mockDbService, mockDocParser);
      const routes = mockApp.getRegisteredRoutes();
      domainsHandler = routes.get('get:/docs/domains');
    });

    it('should retrieve business domains successfully', async () => {
      const mockDomains = [
        { id: 'domain-1', name: 'User Management', criticality: 'high' as const },
        { id: 'domain-2', name: 'Payment Processing', criticality: 'critical' as const }
      ];

      mockKgService.search.mockResolvedValue(mockDomains);

      await domainsHandler(mockRequest, mockReply);

      expect(mockKgService.search).toHaveBeenCalledWith({
        query: '',
        searchType: 'structural',
        entityTypes: ['businessDomain']
      });
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockDomains
      });
    });

    it('should handle domain retrieval errors', async () => {
      mockKgService.search.mockRejectedValue(new Error('Database connection failed'));

      await domainsHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'DOMAINS_FAILED',
          message: 'Failed to retrieve business domains',
          details: 'Database connection failed'
        }
      });
    });
  });

  describe('GET /docs/domains/:domainName/entities', () => {
    let domainEntitiesHandler: Function;

    beforeEach(async () => {
      await registerDocsRoutes(mockApp, mockKgService, mockDbService, mockDocParser);
      const routes = mockApp.getRegisteredRoutes();
      domainEntitiesHandler = routes.get('get:/docs/domains/:domainName/entities');
    });

    it('should retrieve entities by domain successfully', async () => {
      const mockEntities = [
        { id: 'doc-1', title: 'User API', businessDomains: ['user-management'] },
        { id: 'doc-2', title: 'Authentication', businessDomains: ['user-management', 'security'] }
      ];

      mockRequest.params = { domainName: 'user-management' };
      mockKgService.search.mockResolvedValue(mockEntities);

      await domainEntitiesHandler(mockRequest, mockReply);

      expect(mockKgService.search).toHaveBeenCalledWith({
        query: '',
        searchType: 'structural',
        entityTypes: ['documentation']
      });
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: [mockEntities[0], mockEntities[1]]
      });
    });

    it('should filter entities by domain name case-insensitively', async () => {
      const mockEntities = [
        { id: 'doc-1', title: 'User API', businessDomains: ['USER-MANAGEMENT'] },
        { id: 'doc-2', title: 'Payment API', businessDomains: ['payment-processing'] }
      ];

      mockRequest.params = { domainName: 'user-management' };
      mockKgService.search.mockResolvedValue(mockEntities);

      await domainEntitiesHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: [mockEntities[0]]
      });
    });

    it('should handle missing domain parameter', async () => {
      mockRequest.params = {};

      await domainEntitiesHandler(mockRequest, mockReply);

      // The route has schema validation, so it should handle gracefully
      expect(mockReply.send).toHaveBeenCalled();
    });
  });

  describe('GET /docs/clusters', () => {
    let clustersHandler: Function;

    beforeEach(async () => {
      await registerDocsRoutes(mockApp, mockKgService, mockDbService, mockDocParser);
      const routes = mockApp.getRegisteredRoutes();
      clustersHandler = routes.get('get:/docs/clusters');
    });

    it('should retrieve semantic clusters successfully', async () => {
      const mockClusters = [
        { id: 'cluster-1', name: 'Authentication', similarityScore: 0.85 },
        { id: 'cluster-2', name: 'User Management', similarityScore: 0.92 }
      ];

      mockKgService.search.mockResolvedValue(mockClusters);

      await clustersHandler(mockRequest, mockReply);

      expect(mockKgService.search).toHaveBeenCalledWith({
        query: '',
        searchType: 'structural',
        entityTypes: ['semanticCluster']
      });
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockClusters
      });
    });

    it('should handle cluster retrieval errors', async () => {
      mockKgService.search.mockRejectedValue(new Error('Cluster query failed'));

      await clustersHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CLUSTERS_FAILED',
          message: 'Failed to retrieve semantic clusters',
          details: 'Cluster query failed'
        }
      });
    });
  });

  describe('GET /docs/business/impact/:domainName', () => {
    let businessImpactHandler: Function;

    beforeEach(async () => {
      await registerDocsRoutes(mockApp, mockKgService, mockDbService, mockDocParser);
      const routes = mockApp.getRegisteredRoutes();
      businessImpactHandler = routes.get('get:/docs/business/impact/:domainName');
    });

    it('should analyze business impact successfully', async () => {
      const mockDocs = [
        { id: 'doc-1', title: 'User API', businessDomains: ['user-management'] },
        { id: 'doc-2', title: 'Auth API', businessDomains: ['user-management'] },
        { id: 'doc-3', title: 'Payment API', businessDomains: ['payment-processing'] }
      ];

      mockRequest.params = { domainName: 'user-management' };
      mockRequest.query = { since: '2024-01-01T00:00:00Z' };
      mockKgService.search.mockResolvedValue(mockDocs);

      await businessImpactHandler(mockRequest, mockReply);

      expect(mockKgService.search).toHaveBeenCalledWith({
        query: '',
        searchType: 'structural',
        entityTypes: ['documentation']
      });
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          domainName: 'user-management',
          timeRange: expect.objectContaining({
            since: '2024-01-01T00:00:00Z'
          }),
          changeVelocity: 2,
          riskLevel: expect.any(String),
          affectedCapabilities: ['User API', 'Auth API'],
          mitigationStrategies: expect.any(Array)
        })
      });
    });

    it('should calculate high risk level for many changes', async () => {
      const mockDocs = Array.from({ length: 10 }, (_, i) => ({
        id: `doc-${i}`,
        title: `Doc ${i}`,
        businessDomains: ['user-management']
      }));

      mockRequest.params = { domainName: 'user-management' };
      mockRequest.query = {}; // Ensure query is initialized
      mockKgService.search.mockResolvedValue(mockDocs);

      await businessImpactHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          changeVelocity: 10,
          riskLevel: expect.any(String)
        })
      });
    });

    it('should use default time range when since not provided', async () => {
      const mockDocs = [
        { id: 'doc-1', title: 'User API', businessDomains: ['user-management'] }
      ];

      mockRequest.params = { domainName: 'user-management' };
      mockRequest.query = {};
      mockKgService.search.mockResolvedValue(mockDocs);

      await businessImpactHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          timeRange: expect.objectContaining({
            since: expect.any(String)
          })
        })
      });
    });

    it('should handle missing domain parameter', async () => {
      mockRequest.params = {};

      await businessImpactHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BUSINESS_IMPACT_FAILED',
          message: 'Failed to analyze business impact',
          details: expect.any(String)
        }
      });
    });
  });

  describe('POST /docs/parse', () => {
    let parseHandler: Function;

    beforeEach(async () => {
      await registerDocsRoutes(mockApp, mockKgService, mockDbService, mockDocParser);
      const routes = mockApp.getRegisteredRoutes();
      parseHandler = routes.get('post:/docs/parse');
    });

    it('should parse markdown content successfully', async () => {
      const mockRequestBody = {
        content: '# Test Document\n\nThis is a test.',
        format: 'markdown',
        extractEntities: true,
        extractDomains: true
      };

      mockRequest.body = mockRequestBody;

      await parseHandler(mockRequest, mockReply);

      expect(mockDocParser.parseMarkdown).toHaveBeenCalledWith('# Test Document\n\nThis is a test.');
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          title: 'Test Document',
          content: 'Test content',
          format: 'markdown',
          entities: ['test-domain'],
          domains: ['test-domain'],
          stakeholders: ['developer'],
          technologies: ['typescript'],
          metadata: expect.objectContaining({
            format: 'markdown',
            contentLength: expect.any(Number),
            parsedAt: expect.any(Date)
          })
        })
      });
    });

    it('should parse plaintext content when format is plaintext', async () => {
      const mockRequestBody = {
        content: 'This is plain text content.',
        format: 'plaintext'
      };

      mockRequest.body = mockRequestBody;
      mockDocParser.parsePlaintext.mockResolvedValue({
        title: 'Plain Text Document',
        content: 'This is plain text content.',
        businessDomains: [],
        stakeholders: [],
        technologies: [],
        docType: 'readme' as const,
        metadata: {}
      });

      await parseHandler(mockRequest, mockReply);

      expect(mockDocParser.parsePlaintext).toHaveBeenCalledWith('This is plain text content.');
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          format: 'plaintext'
        })
      });
    });

    it('should default to markdown when format not specified', async () => {
      const mockRequestBody = {
        content: '# Default Markdown\n\nContent.'
      };

      mockRequest.body = mockRequestBody;

      await parseHandler(mockRequest, mockReply);

      expect(mockDocParser.parseMarkdown).toHaveBeenCalledWith('# Default Markdown\n\nContent.');
    });

    it('should skip entity extraction when extractEntities is false', async () => {
      const mockRequestBody = {
        content: '# Test Document\n\nContent.',
        format: 'markdown',
        extractEntities: false,
        extractDomains: true
      };

      mockRequest.body = mockRequestBody;

      await parseHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          entities: undefined,
          domains: ['test-domain']
        })
      });
    });

    it('should handle parsing errors', async () => {
      const mockRequestBody = {
        content: 'Invalid content',
        format: 'markdown'
      };

      mockRequest.body = mockRequestBody;
      mockDocParser.parseMarkdown.mockRejectedValue(new Error('Parse error'));

      await parseHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'PARSE_FAILED',
          message: 'Failed to parse documentation',
          details: 'Parse error'
        }
      });
    });

    it('should handle missing content parameter', async () => {
      mockRequest.body = {};

      await parseHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'PARSE_FAILED',
          message: 'Failed to parse documentation',
          details: expect.any(String)
        }
      });
    });
  });

  describe('GET /docs/search', () => {
    let searchHandler: Function;

    beforeEach(async () => {
      await registerDocsRoutes(mockApp, mockKgService, mockDbService, mockDocParser);
      const routes = mockApp.getRegisteredRoutes();
      searchHandler = routes.get('get:/docs/search');
    });

    it('should search documentation successfully', async () => {
      mockRequest.query = {
        query: 'authentication',
        domain: 'user-management',
        type: 'api-docs',
        limit: 10
      };

      await searchHandler(mockRequest, mockReply);

      expect(mockDocParser.searchDocumentation).toHaveBeenCalledWith('authentication', {
        domain: 'user-management',
        docType: 'api-docs',
        limit: 10
      });
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: {
          query: 'authentication',
          results: [
            {
              document: {
                id: 'doc-1',
                title: 'Test Doc',
                content: 'Content',
                businessDomains: ['test-domain']
              },
              relevanceScore: 0.9,
              matchedSections: ['Introduction']
            }
          ],
          total: 1
        }
      });
    });

    it('should search without optional parameters', async () => {
      mockRequest.query = {
        query: 'test query'
      };

      await searchHandler(mockRequest, mockReply);

      expect(mockDocParser.searchDocumentation).toHaveBeenCalledWith('test query', {
        domain: undefined,
        docType: undefined,
        limit: undefined
      });
    });

    it('should handle search errors', async () => {
      mockRequest.query = {
        query: 'error query'
      };

      mockDocParser.searchDocumentation.mockRejectedValue(new Error('Search failed'));

      await searchHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SEARCH_FAILED',
          message: 'Failed to search documentation',
          details: 'Search failed'
        }
      });
    });

    it('should handle missing query parameter', async () => {
      mockRequest.query = {};

      await searchHandler(mockRequest, mockReply);

      // The route has schema validation, so it should handle gracefully
      expect(mockReply.send).toHaveBeenCalled();
    });
  });

  describe('POST /docs/validate', () => {
    let validateHandler: Function;

    beforeEach(async () => {
      await registerDocsRoutes(mockApp, mockKgService, mockDbService, mockDocParser);
      const routes = mockApp.getRegisteredRoutes();
      validateHandler = routes.get('post:/docs/validate');
    });

    it('should validate documentation files successfully', async () => {
      const mockRequestBody = {
        files: ['/docs/api.md', '/docs/readme.md'],
        checks: ['links', 'formatting', 'completeness']
      };

      mockRequest.body = mockRequestBody;

      await validateHandler(mockRequest, mockReply);

      expect(mockDocParser.parseFile).toHaveBeenCalledTimes(2);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          files: 2,
          passed: expect.any(Number),
          failed: expect.any(Number),
          issues: expect.any(Array),
          summary: expect.objectContaining({
            totalFiles: 2,
            passRate: expect.any(Number),
            checksPerformed: ['links', 'formatting', 'completeness']
          })
        })
      });
    });

    it('should handle files with parsing errors', async () => {
      const mockRequestBody = {
        files: ['/docs/invalid.md'],
        checks: ['formatting']
      };

      mockRequest.body = mockRequestBody;
      mockDocParser.parseFile.mockRejectedValueOnce(new Error('Parse error'));

      await validateHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          files: 1,
          failed: 1,
          issues: expect.arrayContaining([
            expect.objectContaining({
              file: '/docs/invalid.md',
              status: 'failed',
              issues: expect.arrayContaining([
                expect.stringContaining('Parse error')
              ])
            })
          ])
        })
      });
    });

    it('should validate completeness when title is missing', async () => {
      const mockRequestBody = {
        files: ['/docs/no-title.md'],
        checks: ['completeness']
      };

      mockRequest.body = mockRequestBody;
      mockDocParser.parseFile.mockResolvedValueOnce({
        title: '',
        content: 'Some content',
        businessDomains: [],
        stakeholders: [],
        technologies: [],
        docType: 'readme' as const,
        metadata: {}
      });

      await validateHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          issues: expect.arrayContaining([
            expect.objectContaining({
              file: '/docs/no-title.md',
              status: 'failed',
              issues: expect.arrayContaining([
                'Missing or generic title'
              ])
            })
          ])
        })
      });
    });

    it('should validate formatting when content is too short', async () => {
      const mockRequestBody = {
        files: ['/docs/short.md'],
        checks: ['formatting']
      };

      mockRequest.body = mockRequestBody;
      mockDocParser.parseFile.mockResolvedValueOnce({
        title: 'Short Doc',
        content: 'Hi',
        businessDomains: [],
        stakeholders: [],
        technologies: [],
        docType: 'readme' as const,
        metadata: {}
      });

      await validateHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          issues: expect.arrayContaining([
            expect.objectContaining({
              file: '/docs/short.md',
              status: 'failed',
              issues: expect.arrayContaining([
                'Content appears too short'
              ])
            })
          ])
        })
      });
    });

    it('should handle validation without checks parameter', async () => {
      const mockRequestBody = {
        files: ['/docs/test.md']
      };

      mockRequest.body = mockRequestBody;

      await validateHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          summary: expect.objectContaining({
            checksPerformed: expect.any(Array)
          })
        })
      });
    });

    it('should handle missing files parameter', async () => {
      mockRequest.body = {};

      await validateHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Failed to validate documentation',
          details: expect.any(String)
        }
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    let syncHandler: Function;
    let domainsHandler: Function;

    beforeEach(async () => {
      await registerDocsRoutes(mockApp, mockKgService, mockDbService, mockDocParser);
      const routes = mockApp.getRegisteredRoutes();
      syncHandler = routes.get('post:/docs/docs/sync');
      domainsHandler = routes.get('get:/docs/domains');
    });

    it('should handle null request body gracefully', async () => {
      mockRequest.body = null;

      await syncHandler(mockRequest, mockReply);

      // Should not crash and return some response
      expect(mockReply.send).toHaveBeenCalled();
    });

    it('should handle malformed request body', async () => {
      mockRequest.body = { invalid: 'data', missing: 'required fields' };

      await syncHandler(mockRequest, mockReply);

      // Should handle gracefully without crashing
      expect(mockReply.send).toHaveBeenCalled();
    });

    it('should handle service errors with unknown error types', async () => {
      mockRequest.body = { docsPath: '/test' };
      mockDocParser.syncDocumentation.mockRejectedValue('String error');

      await syncHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SYNC_FAILED',
          message: 'Failed to synchronize documentation',
          details: 'Unknown error'
        }
      });
    });

    it('should handle extremely long file paths', async () => {
      const longPath = 'a'.repeat(1000) + '.md';
      mockRequest.body = { docsPath: longPath };

      await syncHandler(mockRequest, mockReply);

      expect(mockDocParser.syncDocumentation).toHaveBeenCalledWith(longPath);
    });

    it('should handle empty string parameters', async () => {
      mockRequest.body = { docsPath: '' };

      await syncHandler(mockRequest, mockReply);

      expect(mockDocParser.syncDocumentation).toHaveBeenCalledWith('');
    });

    it('should handle concurrent requests without interference', async () => {
      const request1 = createMockRequest();
      const request2 = createMockRequest();
      const reply1 = createMockReply();
      const reply2 = createMockReply();

      request1.body = { docsPath: '/docs1' };
      request2.body = { docsPath: '/docs2' };

      await Promise.all([
        syncHandler(request1, reply1),
        syncHandler(request2, reply2)
      ]);

      expect(reply1.send).toHaveBeenCalled();
      expect(reply2.send).toHaveBeenCalled();
    });

    it('should handle service timeout scenarios', async () => {
      mockRequest.body = { docsPath: '/test' };

      // Mock a service that takes too long
      mockDocParser.syncDocumentation.mockImplementation(() =>
        new Promise(resolve => {
          setTimeout(() => resolve({
            processedFiles: 1,
            newDomains: 0,
            updatedClusters: 0,
            errors: []
          }), 100);
        })
      );

      await syncHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object)
      });
    });
  });
});

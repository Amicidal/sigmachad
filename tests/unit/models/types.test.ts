/**
 * Unit tests for models/types.ts
 * Tests API types, interfaces, and validation logic
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Import all types from types.ts
import type {
  // Base API response types
  APIResponse,
  PaginatedResponse,

  // Common query parameters
  BaseQueryParams,
  TimeRangeParams,

  // Design & Specification Management Types
  CreateSpecRequest,
  CreateSpecResponse,
  GetSpecResponse,
  UpdateSpecRequest,
  ListSpecsParams,

  // Test Management Types
  TestPlanRequest,
  TestPlanResponse,
  TestSpec,
  TestExecutionResult,
  PerformanceMetrics,
  TestCoverage,

  // Graph Operations Types
  GraphSearchRequest,
  GraphSearchResult,
  GraphExamples,
  DependencyAnalysis,

  // Code Operations Types
  CodeChangeProposal,
  CodeChangeAnalysis,
  ValidationRequest,
  ValidationResult,
  ValidationIssue,

  // Impact Analysis Types
  ImpactAnalysisRequest,
  ImpactAnalysis,

  // Vector Database Types
  VectorSearchRequest,
  VectorSearchResult,

  // Source Control Management Types
  CommitPRRequest,
  CommitPRResponse,

  // Security Types
  SecurityScanRequest,
  SecurityScanResult,
  VulnerabilityReport,

  // Administration Types
  SystemHealth,
  ComponentHealth,
  SyncStatus,
  SyncOptions,
  SystemAnalytics,

  // Error handling
  APIError,

  // Authentication types
  AuthenticatedRequest,

  // Rate limiting
  RateLimit,

  // WebSocket and real-time types
  WebhookConfig,
  RealTimeSubscription,

  // MCP Types
  MCPTool,
  MCPRequest,
  MCPResponse,
} from '@/models/types';

import type {
  Entity,
  Spec,
  Test,
  SecurityIssue,
  Vulnerability,
  CoverageMetrics,
  GraphRelationship,
  RelationshipType,
} from '@/models/entities';

describe('API Types and Interfaces', () => {
  let testDate: Date;

  beforeEach(() => {
    testDate = new Date('2024-01-01T00:00:00Z');
  });

  describe('Base API Response Types', () => {
    describe('APIResponse', () => {
      it('should create a successful APIResponse with data', () => {
        const response: APIResponse<string> = {
          success: true,
          data: 'test data',
          metadata: {
            requestId: 'req-123',
            timestamp: testDate,
            executionTime: 150,
          },
        };

        expect(response.success).toBe(true);
        expect(response.data).toBe('test data');
        expect(response.error).toBeUndefined();
        expect(response.metadata?.requestId).toBe('req-123');
        expect(response.metadata?.timestamp).toEqual(testDate);
        expect(response.metadata?.executionTime).toBe(150);
      });

      it('should create a failed APIResponse with error', () => {
        const response: APIResponse<null> = {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input provided',
            details: { field: 'email', issue: 'invalid format' },
          },
          metadata: {
            requestId: 'req-456',
            timestamp: testDate,
            executionTime: 50,
          },
        };

        expect(response.success).toBe(false);
        expect(response.data).toBeNull();
        expect(response.error?.code).toBe('VALIDATION_ERROR');
        expect(response.error?.message).toBe('Invalid input provided');
        expect(response.error?.details).toEqual({ field: 'email', issue: 'invalid format' });
      });

      it('should handle APIResponse without metadata', () => {
        const response: APIResponse<number> = {
          success: true,
          data: 42,
        };

        expect(response.success).toBe(true);
        expect(response.data).toBe(42);
        expect(response.metadata).toBeUndefined();
      });

      it('should handle complex data types in APIResponse', () => {
        const complexData = {
          id: 'test-id',
          items: [1, 2, 3],
          nested: { key: 'value' },
        };

        const response: APIResponse<typeof complexData> = {
          success: true,
          data: complexData,
        };

        expect(response.data?.id).toBe('test-id');
        expect(response.data?.items).toEqual([1, 2, 3]);
        expect(response.data?.nested).toEqual({ key: 'value' });
      });
    });

    describe('PaginatedResponse', () => {
      it('should create a valid PaginatedResponse', () => {
        const paginatedResponse: PaginatedResponse<string> = {
          success: true,
          data: ['item1', 'item2', 'item3'],
          pagination: {
            page: 1,
            pageSize: 10,
            total: 25,
            hasMore: true,
          },
        };

        expect(paginatedResponse.success).toBe(true);
        expect(paginatedResponse.data).toEqual(['item1', 'item2', 'item3']);
        expect(paginatedResponse.pagination.page).toBe(1);
        expect(paginatedResponse.pagination.pageSize).toBe(10);
        expect(paginatedResponse.pagination.total).toBe(25);
        expect(paginatedResponse.pagination.hasMore).toBe(true);
      });

      it('should handle empty pagination', () => {
        const emptyResponse: PaginatedResponse<any[]> = {
          success: true,
          data: [],
          pagination: {
            page: 1,
            pageSize: 20,
            total: 0,
            hasMore: false,
          },
        };

        expect(emptyResponse.data).toEqual([]);
        expect(emptyResponse.pagination.total).toBe(0);
        expect(emptyResponse.pagination.hasMore).toBe(false);
      });

      it('should handle last page pagination', () => {
        const lastPageResponse: PaginatedResponse<number[]> = {
          success: true,
          data: [1, 2, 3],
          pagination: {
            page: 3,
            pageSize: 10,
            total: 23,
            hasMore: false,
          },
        };

        expect(lastPageResponse.pagination.page).toBe(3);
        expect(lastPageResponse.pagination.hasMore).toBe(false);
      });
    });
  });

  describe('Common Query Parameters', () => {
    describe('BaseQueryParams', () => {
      it('should create valid BaseQueryParams with all fields', () => {
        const params: BaseQueryParams = {
          limit: 50,
          offset: 100,
          sortBy: 'createdAt',
          sortOrder: 'desc',
          includeMetadata: true,
        };

        expect(params.limit).toBe(50);
        expect(params.offset).toBe(100);
        expect(params.sortBy).toBe('createdAt');
        expect(params.sortOrder).toBe('desc');
        expect(params.includeMetadata).toBe(true);
      });

      it('should handle minimal BaseQueryParams', () => {
        const minimalParams: BaseQueryParams = {};

        expect(minimalParams.limit).toBeUndefined();
        expect(minimalParams.offset).toBeUndefined();
        expect(minimalParams.sortBy).toBeUndefined();
        expect(minimalParams.sortOrder).toBeUndefined();
        expect(minimalParams.includeMetadata).toBeUndefined();
      });

      it('should handle ascending sort order', () => {
        const ascParams: BaseQueryParams = {
          sortBy: 'name',
          sortOrder: 'asc',
        };

        expect(ascParams.sortOrder).toBe('asc');
      });

      it('should handle different sort fields', () => {
        const sortFields = ['id', 'name', 'createdAt', 'updatedAt', 'priority'];

        sortFields.forEach(field => {
          const params: BaseQueryParams = {
            sortBy: field,
            sortOrder: 'asc',
          };

          expect(params.sortBy).toBe(field);
        });
      });
    });

    describe('TimeRangeParams', () => {
      it('should create valid TimeRangeParams with date objects', () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        const params: TimeRangeParams = {
          since: startDate,
          until: endDate,
        };

        expect(params.since).toEqual(startDate);
        expect(params.until).toEqual(endDate);
        expect(params.timeRange).toBeUndefined();
      });

      it('should handle TimeRangeParams with time range string', () => {
        const params: TimeRangeParams = {
          timeRange: '7d',
        };

        expect(params.timeRange).toBe('7d');
        expect(params.since).toBeUndefined();
        expect(params.until).toBeUndefined();
      });

      it('should handle all time range options', () => {
        const timeRanges: Array<'1h' | '24h' | '7d' | '30d' | '90d'> = ['1h', '24h', '7d', '30d', '90d'];

        timeRanges.forEach(timeRange => {
          const params: TimeRangeParams = {
            timeRange,
          };

          expect(params.timeRange).toBe(timeRange);
        });
      });

      it('should handle mixed date and time range (though typically one or the other)', () => {
        const params: TimeRangeParams = {
          since: new Date(),
          timeRange: '30d',
        };

        expect(params.since).toBeInstanceOf(Date);
        expect(params.timeRange).toBe('30d');
      });
    });
  });

  describe('Design & Specification Management Types', () => {
    describe('CreateSpecRequest', () => {
      it('should create a valid CreateSpecRequest', () => {
        const request: CreateSpecRequest = {
          title: 'User Authentication Feature',
          description: 'Implement secure user login and registration',
          goals: ['Secure authentication', 'User-friendly interface'],
          acceptanceCriteria: [
            'User can log in with valid credentials',
            'User gets appropriate error messages',
            'Session persists across browser sessions',
          ],
          priority: 'high',
          assignee: 'john.doe@example.com',
          tags: ['authentication', 'security'],
          dependencies: ['user-service', 'auth-middleware'],
        };

        expect(request.title).toBe('User Authentication Feature');
        expect(request.description).toBe('Implement secure user login and registration');
        expect(request.goals).toEqual(['Secure authentication', 'User-friendly interface']);
        expect(request.acceptanceCriteria).toHaveLength(3);
        expect(request.priority).toBe('high');
        expect(request.assignee).toBe('john.doe@example.com');
        expect(request.tags).toEqual(['authentication', 'security']);
        expect(request.dependencies).toEqual(['user-service', 'auth-middleware']);
      });

      it('should handle minimal CreateSpecRequest', () => {
        const minimalRequest: CreateSpecRequest = {
          title: 'Simple Feature',
          description: 'Basic implementation',
          goals: ['Basic functionality'],
          acceptanceCriteria: ['Works correctly'],
        };

        expect(minimalRequest.title).toBe('Simple Feature');
        expect(minimalRequest.priority).toBeUndefined();
        expect(minimalRequest.assignee).toBeUndefined();
        expect(minimalRequest.tags).toBeUndefined();
        expect(minimalRequest.dependencies).toBeUndefined();
      });

      it('should handle different priority levels', () => {
        const priorities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];

        priorities.forEach(priority => {
          const request: CreateSpecRequest = {
            title: 'Test Spec',
            description: 'Test',
            goals: ['test'],
            acceptanceCriteria: ['test'],
            priority,
          };

          expect(request.priority).toBe(priority);
        });
      });
    });

    describe('CreateSpecResponse', () => {
      let mockSpec: Spec;

      beforeEach(() => {
        mockSpec = {
          id: 'spec-123',
          path: '/specs/auth.spec',
          hash: 'hash123',
          language: 'markdown',
          lastModified: testDate,
          created: testDate,
          type: 'spec',
          title: 'User Auth Spec',
          description: 'Auth implementation',
          acceptanceCriteria: ['User can login'],
          status: 'draft',
          priority: 'high',
          updated: testDate,
        };
      });

      it('should create a valid CreateSpecResponse', () => {
        const response: CreateSpecResponse = {
          specId: 'spec-123',
          spec: mockSpec,
          validationResults: {
            isValid: true,
            issues: [],
            suggestions: ['Consider adding security requirements'],
          },
        };

        expect(response.specId).toBe('spec-123');
        expect(response.spec).toEqual(mockSpec);
        expect(response.validationResults.isValid).toBe(true);
        expect(response.validationResults.issues).toEqual([]);
        expect(response.validationResults.suggestions).toEqual(['Consider adding security requirements']);
      });

      it('should handle CreateSpecResponse with validation issues', () => {
        const validationIssue: ValidationIssue = {
          file: '/specs/auth.spec',
          line: 10,
          column: 5,
          rule: 'missing-description',
          severity: 'warning',
          message: 'Acceptance criteria should be more specific',
        };

        const response: CreateSpecResponse = {
          specId: 'spec-456',
          spec: mockSpec,
          validationResults: {
            isValid: false,
            issues: [validationIssue],
            suggestions: ['Add more detailed acceptance criteria'],
          },
        };

        expect(response.validationResults.isValid).toBe(false);
        expect(response.validationResults.issues).toHaveLength(1);
        expect(response.validationResults.issues[0]).toEqual(validationIssue);
      });
    });

    describe('GetSpecResponse', () => {
      let mockSpec: Spec;
      let mockEntities: Entity[];

      beforeEach(() => {
        mockSpec = {
          id: 'spec-123',
          path: '/specs/auth.spec',
          hash: 'hash123',
          language: 'markdown',
          lastModified: testDate,
          created: testDate,
          type: 'spec',
          title: 'User Auth Spec',
          description: 'Auth implementation',
          acceptanceCriteria: ['User can login'],
          status: 'approved',
          priority: 'high',
          updated: testDate,
        };

        mockEntities = [
          {
            id: 'entity-1',
            path: '/src/auth.ts',
            hash: 'hash1',
            language: 'typescript',
            lastModified: testDate,
            created: testDate,
            type: 'file',
            extension: '.ts',
            size: 2048,
            lines: 100,
            isTest: false,
            isConfig: false,
            dependencies: [],
          },
        ];
      });

      it('should create a valid GetSpecResponse', () => {
        const response: GetSpecResponse = {
          spec: mockSpec,
          relatedSpecs: [mockSpec],
          affectedEntities: mockEntities,
          testCoverage: {
            entityId: 'spec-123',
            overallCoverage: {
              lines: 85,
              branches: 90,
              functions: 95,
              statements: 88,
            },
            testBreakdown: {
              unitTests: { lines: 90, branches: 95, functions: 100, statements: 92 },
              integrationTests: { lines: 80, branches: 85, functions: 90, statements: 82 },
              e2eTests: { lines: 75, branches: 80, functions: 85, statements: 78 },
            },
            uncoveredLines: [15, 23, 67],
            uncoveredBranches: [5, 12],
            testCases: [
              {
                testId: 'test-1',
                testName: 'User login test',
                covers: ['/src/auth.ts:10-20', '/src/auth.ts:30-40'],
              },
            ],
          },
        };

        expect(response.spec).toEqual(mockSpec);
        expect(response.relatedSpecs).toHaveLength(1);
        expect(response.affectedEntities).toEqual(mockEntities);
        expect(response.testCoverage.overallCoverage.lines).toBe(85);
      });
    });

    describe('UpdateSpecRequest', () => {
      it('should create a valid UpdateSpecRequest with partial updates', () => {
        const request: UpdateSpecRequest = {
          title: 'Updated Authentication Feature',
          acceptanceCriteria: [
            'User can log in with valid credentials',
            'User can register new account',
            'User can reset password',
          ],
          status: 'implemented',
          priority: 'critical',
        };

        expect(request.title).toBe('Updated Authentication Feature');
        expect(request.description).toBeUndefined();
        expect(request.acceptanceCriteria).toHaveLength(3);
        expect(request.status).toBe('implemented');
        expect(request.priority).toBe('critical');
      });

      it('should handle empty UpdateSpecRequest', () => {
        const emptyRequest: UpdateSpecRequest = {};

        expect(Object.keys(emptyRequest)).toHaveLength(0);
      });

      it('should handle different status values', () => {
        const statuses: Array<'draft' | 'approved' | 'implemented' | 'deprecated'> = ['draft', 'approved', 'implemented', 'deprecated'];

        statuses.forEach(status => {
          const request: UpdateSpecRequest = {
            status,
          };

          expect(request.status).toBe(status);
        });
      });
    });

    describe('ListSpecsParams', () => {
      it('should create valid ListSpecsParams with filters', () => {
        const params: ListSpecsParams = {
          limit: 20,
          offset: 40,
          sortBy: 'priority',
          sortOrder: 'desc',
          status: ['approved', 'implemented'],
          priority: ['high', 'critical'],
          assignee: 'john.doe@example.com',
          tags: ['authentication', 'security'],
          search: 'user login',
        };

        expect(params.limit).toBe(20);
        expect(params.offset).toBe(40);
        expect(params.sortBy).toBe('priority');
        expect(params.sortOrder).toBe('desc');
        expect(params.status).toEqual(['approved', 'implemented']);
        expect(params.priority).toEqual(['high', 'critical']);
        expect(params.assignee).toBe('john.doe@example.com');
        expect(params.tags).toEqual(['authentication', 'security']);
        expect(params.search).toBe('user login');
      });

      it('should handle minimal ListSpecsParams', () => {
        const minimalParams: ListSpecsParams = {};

        expect(Object.keys(minimalParams)).toHaveLength(0);
      });

      it('should handle single value arrays', () => {
        const params: ListSpecsParams = {
          status: ['draft'],
          priority: ['low'],
          tags: ['simple'],
        };

        expect(params.status).toEqual(['draft']);
        expect(params.priority).toEqual(['low']);
        expect(params.tags).toEqual(['simple']);
      });
    });
  });

  describe('Test Management Types', () => {
    describe('TestPlanRequest', () => {
      it('should create a valid TestPlanRequest with coverage requirements', () => {
        const request: TestPlanRequest = {
          specId: 'spec-123',
          testTypes: ['unit', 'integration', 'e2e'],
          coverage: {
            minLines: 80,
            minBranches: 75,
            minFunctions: 85,
          },
          includePerformanceTests: true,
          includeSecurityTests: true,
        };

        expect(request.specId).toBe('spec-123');
        expect(request.testTypes).toEqual(['unit', 'integration', 'e2e']);
        expect(request.coverage?.minLines).toBe(80);
        expect(request.coverage?.minBranches).toBe(75);
        expect(request.coverage?.minFunctions).toBe(85);
        expect(request.includePerformanceTests).toBe(true);
        expect(request.includeSecurityTests).toBe(true);
      });

      it('should handle TestPlanRequest with minimal options', () => {
        const minimalRequest: TestPlanRequest = {
          specId: 'spec-456',
        };

        expect(minimalRequest.specId).toBe('spec-456');
        expect(minimalRequest.testTypes).toBeUndefined();
        expect(minimalRequest.coverage).toBeUndefined();
        expect(minimalRequest.includePerformanceTests).toBeUndefined();
        expect(minimalRequest.includeSecurityTests).toBeUndefined();
      });

      it('should handle different test type combinations', () => {
        const testTypeCombinations = [
          ['unit'],
          ['integration'],
          ['e2e'],
          ['unit', 'integration'],
          ['unit', 'e2e'],
          ['integration', 'e2e'],
          ['unit', 'integration', 'e2e'],
        ];

        testTypeCombinations.forEach(testTypes => {
          const request: TestPlanRequest = {
            specId: 'spec-test',
            testTypes: testTypes as Array<'unit' | 'integration' | 'e2e'>,
          };

          expect(request.testTypes).toEqual(testTypes);
        });
      });
    });

    describe('TestPlanResponse', () => {
      it('should create a valid TestPlanResponse', () => {
        const response: TestPlanResponse = {
          testPlan: {
            unitTests: [
              {
                name: 'UserService.createUser',
                description: 'Test user creation functionality',
                type: 'unit',
                targetFunction: 'createUser',
                assertions: ['Should create user with valid data', 'Should validate input'],
                dataRequirements: ['valid user data', 'invalid user data'],
              },
            ],
            integrationTests: [],
            e2eTests: [],
            performanceTests: [],
          },
          estimatedCoverage: {
            lines: 85,
            branches: 80,
            functions: 90,
            statements: 85,
          },
          changedFiles: ['/src/userService.ts', '/tests/userService.test.ts'],
        };

        expect(response.testPlan.unitTests).toHaveLength(1);
        expect(response.testPlan.unitTests[0].name).toBe('UserService.createUser');
        expect(response.estimatedCoverage.lines).toBe(85);
        expect(response.changedFiles).toEqual(['/src/userService.ts', '/tests/userService.test.ts']);
      });
    });

    describe('TestExecutionResult', () => {
      it('should create a valid TestExecutionResult for passed test', () => {
        const result: TestExecutionResult = {
          testId: 'test-123',
          testSuite: 'UserService',
          testName: 'createUser_validData',
          status: 'passed',
          duration: 145,
          coverage: {
            lines: 90,
            branches: 85,
            functions: 95,
            statements: 88,
          },
          performance: {
            memoryUsage: 50,
            cpuUsage: 20,
            networkRequests: 2,
            databaseQueries: 1,
            fileOperations: 0,
          },
        };

        expect(result.testId).toBe('test-123');
        expect(result.status).toBe('passed');
        expect(result.duration).toBe(145);
        expect(result.errorMessage).toBeUndefined();
        expect(result.stackTrace).toBeUndefined();
        expect(result.coverage?.lines).toBe(90);
        expect(result.performance?.memoryUsage).toBe(50);
      });

      it('should create a TestExecutionResult for failed test', () => {
        const result: TestExecutionResult = {
          testId: 'test-456',
          testSuite: 'UserService',
          testName: 'createUser_invalidData',
          status: 'failed',
          duration: 200,
          errorMessage: 'Expected user to be created but was null',
          stackTrace: 'at UserService.createUser (/src/userService.ts:25:10)',
          coverage: {
            lines: 75,
            branches: 70,
            functions: 80,
            statements: 72,
          },
        };

        expect(result.status).toBe('failed');
        expect(result.errorMessage).toBe('Expected user to be created but was null');
        expect(result.stackTrace).toBe('at UserService.createUser (/src/userService.ts:25:10)');
      });

      it('should handle different test statuses', () => {
        const statuses: Array<'passed' | 'failed' | 'skipped' | 'error'> = ['passed', 'failed', 'skipped', 'error'];

        statuses.forEach(status => {
          const result: TestExecutionResult = {
            testId: `test-${status}`,
            testSuite: 'TestSuite',
            testName: `test${status}`,
            status,
            duration: 100,
          };

          expect(result.status).toBe(status);
        });
      });
    });

    describe('PerformanceMetrics', () => {
      it('should create a valid PerformanceMetrics object', () => {
        const metrics: PerformanceMetrics = {
          entityId: 'user-service',
          averageExecutionTime: 145,
          p95ExecutionTime: 200,
          successRate: 0.95,
          trend: 'stable',
          benchmarkComparisons: [
            {
              benchmark: 'response-time',
              value: 145,
              status: 'below',
            },
            {
              benchmark: 'memory-usage',
              value: 50,
              status: 'at',
            },
          ],
          historicalData: [
            {
              timestamp: new Date('2024-01-01'),
              executionTime: 140,
              successRate: 0.96,
            },
            {
              timestamp: new Date('2024-01-02'),
              executionTime: 150,
              successRate: 0.94,
            },
          ],
        };

        expect(metrics.entityId).toBe('user-service');
        expect(metrics.averageExecutionTime).toBe(145);
        expect(metrics.p95ExecutionTime).toBe(200);
        expect(metrics.successRate).toBe(0.95);
        expect(metrics.trend).toBe('stable');
        expect(metrics.benchmarkComparisons).toHaveLength(2);
        expect(metrics.historicalData).toHaveLength(2);
      });

      it('should handle different trend values', () => {
        const trends: Array<'improving' | 'stable' | 'degrading'> = ['improving', 'stable', 'degrading'];

        trends.forEach(trend => {
          const metrics: PerformanceMetrics = {
            entityId: 'test-entity',
            averageExecutionTime: 100,
            p95ExecutionTime: 150,
            successRate: 0.9,
            trend,
            benchmarkComparisons: [],
            historicalData: [],
          };

          expect(metrics.trend).toBe(trend);
        });
      });

      it('should handle benchmark comparison statuses', () => {
        const statuses: Array<'above' | 'below' | 'at'> = ['above', 'below', 'at'];

        statuses.forEach(status => {
          const comparison = {
            benchmark: 'test-benchmark',
            value: 100,
            status,
          };

          expect(comparison.status).toBe(status);
        });
      });
    });

    describe('TestCoverage', () => {
      it('should create a valid TestCoverage object', () => {
        const coverage: TestCoverage = {
          entityId: 'user-service',
          overallCoverage: {
            lines: 85,
            branches: 80,
            functions: 90,
            statements: 82,
          },
          testBreakdown: {
            unitTests: {
              lines: 90,
              branches: 85,
              functions: 95,
              statements: 88,
            },
            integrationTests: {
              lines: 75,
              branches: 70,
              functions: 80,
              statements: 72,
            },
            e2eTests: {
              lines: 70,
              branches: 65,
              functions: 75,
              statements: 68,
            },
          },
          uncoveredLines: [15, 23, 45, 67],
          uncoveredBranches: [5, 12, 18],
          testCases: [
            {
              testId: 'test-1',
              testName: 'User creation test',
              covers: ['userService.ts:10-20', 'userService.ts:30-40'],
            },
            {
              testId: 'test-2',
              testName: 'User validation test',
              covers: ['userService.ts:50-60'],
            },
          ],
        };

        expect(coverage.entityId).toBe('user-service');
        expect(coverage.overallCoverage.lines).toBe(85);
        expect(coverage.testBreakdown.unitTests.lines).toBe(90);
        expect(coverage.uncoveredLines).toEqual([15, 23, 45, 67]);
        expect(coverage.uncoveredBranches).toEqual([5, 12, 18]);
        expect(coverage.testCases).toHaveLength(2);
      });
    });
  });

  describe('Graph Operations Types', () => {
    describe('GraphSearchRequest', () => {
      it('should create a valid GraphSearchRequest with semantic search', () => {
        const request: GraphSearchRequest = {
          query: 'user authentication service',
          entityTypes: ['function', 'class'],
          searchType: 'semantic',
          filters: {
            language: 'typescript',
            path: '/src/services/',
            tags: ['authentication', 'security'],
            lastModified: {
              since: new Date('2024-01-01'),
              until: new Date('2024-01-31'),
            },
          },
          includeRelated: true,
          limit: 50,
        };

        expect(request.query).toBe('user authentication service');
        expect(request.entityTypes).toEqual(['function', 'class']);
        expect(request.searchType).toBe('semantic');
        expect(request.filters?.language).toBe('typescript');
        expect(request.filters?.path).toBe('/src/services/');
        expect(request.filters?.tags).toEqual(['authentication', 'security']);
        expect(request.includeRelated).toBe(true);
        expect(request.limit).toBe(50);
      });

      it('should handle structural search type', () => {
        const request: GraphSearchRequest = {
          query: 'class UserService',
          searchType: 'structural',
          entityTypes: ['class'],
        };

        expect(request.searchType).toBe('structural');
        expect(request.query).toBe('class UserService');
      });

      it('should handle usage search type', () => {
        const request: GraphSearchRequest = {
          query: 'authenticateUser',
          searchType: 'usage',
          entityTypes: ['function'],
        };

        expect(request.searchType).toBe('usage');
      });

      it('should handle dependency search type', () => {
        const request: GraphSearchRequest = {
          query: 'database',
          searchType: 'dependency',
          entityTypes: ['module'],
        };

        expect(request.searchType).toBe('dependency');
      });
    });

    describe('GraphSearchResult', () => {
      let mockEntity: Entity;

      beforeEach(() => {
        mockEntity = {
          id: 'entity-1',
          path: '/src/userService.ts',
          hash: 'hash123',
          language: 'typescript',
          lastModified: testDate,
          created: testDate,
          type: 'file',
          extension: '.ts',
          size: 2048,
          lines: 100,
          isTest: false,
          isConfig: false,
          dependencies: [],
        };
      });

      it('should create a valid GraphSearchResult', () => {
        const result: GraphSearchResult = {
          entities: [mockEntity],
          relationships: [
            {
              id: 'rel-1',
              sourceId: 'entity-1',
              targetId: 'entity-2',
              type: 'calls',
              strength: 0.8,
              metadata: { line: 15 },
            },
          ],
          clusters: [
            {
              id: 'cluster-1',
              name: 'Authentication',
              entities: ['entity-1', 'entity-2'],
              cohesionScore: 0.85,
            },
          ],
          relevanceScore: 0.92,
        };

        expect(result.entities).toHaveLength(1);
        expect(result.relationships).toHaveLength(1);
        expect(result.clusters).toHaveLength(1);
        expect(result.relevanceScore).toBe(0.92);
      });
    });

    describe('DependencyAnalysis', () => {
      let mockEntity: Entity;

      beforeEach(() => {
        mockEntity = {
          id: 'user-service',
          path: '/src/userService.ts',
          hash: 'hash123',
          language: 'typescript',
          lastModified: testDate,
          created: testDate,
          type: 'file',
          extension: '.ts',
          size: 2048,
          lines: 100,
          isTest: false,
          isConfig: false,
          dependencies: [],
        };
      });

      it('should create a valid DependencyAnalysis', () => {
        const analysis: DependencyAnalysis = {
          entityId: 'user-service',
          directDependencies: [
            {
              entity: mockEntity,
              relationship: 'imports',
              strength: 0.9,
            },
          ],
          indirectDependencies: [
            {
              entity: mockEntity,
              path: [mockEntity],
              relationship: 'imports',
              distance: 2,
            },
          ],
          reverseDependencies: [
            {
              entity: mockEntity,
              relationship: 'imports',
              impact: 'high',
            },
          ],
          circularDependencies: [
            {
              cycle: [mockEntity],
              severity: 'warning',
            },
          ],
        };

        expect(analysis.entityId).toBe('user-service');
        expect(analysis.directDependencies).toHaveLength(1);
        expect(analysis.indirectDependencies).toHaveLength(1);
        expect(analysis.reverseDependencies).toHaveLength(1);
        expect(analysis.circularDependencies).toHaveLength(1);
      });

      it('should handle different relationship types', () => {
        const relationships: RelationshipType[] = ['imports', 'calls', 'implements', 'extends', 'uses'];

        relationships.forEach(relationship => {
          const dep = {
            entity: mockEntity,
            relationship,
            strength: 0.8,
          };

          expect(dep.relationship).toBe(relationship);
        });
      });

      it('should handle different impact levels', () => {
        const impacts: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];

        impacts.forEach(impact => {
          const reverseDep = {
            entity: mockEntity,
            relationship: 'imports' as RelationshipType,
            impact,
          };

          expect(reverseDep.impact).toBe(impact);
        });
      });

      it('should handle circular dependency severities', () => {
        const severities: Array<'critical' | 'warning' | 'info'> = ['critical', 'warning', 'info'];

        severities.forEach(severity => {
          const circularDep = {
            cycle: [mockEntity],
            severity,
          };

          expect(circularDep.severity).toBe(severity);
        });
      });
    });
  });

  describe('Security Types', () => {
    describe('SecurityScanRequest', () => {
      it('should create a valid SecurityScanRequest', () => {
        const request: SecurityScanRequest = {
          entityIds: ['user-service', 'auth-middleware'],
          scanTypes: ['sast', 'sca', 'secrets'],
          severity: ['high', 'critical'],
        };

        expect(request.entityIds).toEqual(['user-service', 'auth-middleware']);
        expect(request.scanTypes).toEqual(['sast', 'sca', 'secrets']);
        expect(request.severity).toEqual(['high', 'critical']);
      });

      it('should handle minimal SecurityScanRequest', () => {
        const minimalRequest: SecurityScanRequest = {};

        expect(minimalRequest.entityIds).toBeUndefined();
        expect(minimalRequest.scanTypes).toBeUndefined();
        expect(minimalRequest.severity).toBeUndefined();
      });

      it('should handle all scan types', () => {
        const scanTypes: Array<'sast' | 'sca' | 'secrets' | 'dependency'> = ['sast', 'sca', 'secrets', 'dependency'];

        scanTypes.forEach(scanType => {
          const request: SecurityScanRequest = {
            scanTypes: [scanType],
          };

          expect(request.scanTypes).toEqual([scanType]);
        });
      });
    });

    describe('SecurityScanResult', () => {
      let mockSecurityIssue: SecurityIssue;

      beforeEach(() => {
        mockSecurityIssue = {
          id: 'sec-1',
          type: 'securityIssue',
          tool: 'eslint-plugin-security',
          ruleId: 'no-eval',
          severity: 'high',
          title: 'Use of eval() function detected',
          description: 'The eval() function can be dangerous',
          cwe: 'CWE-95',
          owasp: 'A1:2017-Injection',
          affectedEntityId: 'file-123',
          lineNumber: 25,
          codeSnippet: 'const result = eval(userInput);',
          remediation: 'Replace eval() with safe alternative',
          status: 'open',
          discoveredAt: testDate,
          lastScanned: testDate,
          confidence: 0.9,
        };
      });

      it('should create a valid SecurityScanResult', () => {
        const result: SecurityScanResult = {
          issues: [mockSecurityIssue],
          vulnerabilities: [
            {
              id: 'vuln-1',
              type: 'vulnerability',
              packageName: 'lodash',
              version: '4.17.20',
              vulnerabilityId: 'CVE-2021-23337',
              severity: 'high',
              description: 'Prototype pollution in lodash',
              cvssScore: 7.4,
              affectedVersions: '<4.17.31',
              fixedInVersion: '4.17.31',
              publishedAt: testDate,
              lastUpdated: testDate,
              exploitability: 'medium',
            },
          ],
          summary: {
            totalIssues: 5,
            bySeverity: { high: 3, medium: 2 },
            byType: { sast: 3, sca: 2 },
          },
        };

        expect(result.issues).toHaveLength(1);
        expect(result.vulnerabilities).toHaveLength(1);
        expect(result.summary.totalIssues).toBe(5);
        expect(result.summary.bySeverity.high).toBe(3);
        expect(result.summary.byType.sast).toBe(3);
      });
    });

    describe('VulnerabilityReport', () => {
      let mockVulnerability: Vulnerability;

      beforeEach(() => {
        mockVulnerability = {
          id: 'vuln-1',
          type: 'vulnerability',
          packageName: 'lodash',
          version: '4.17.20',
          vulnerabilityId: 'CVE-2021-23337',
          severity: 'high',
          description: 'Prototype pollution in lodash',
          cvssScore: 7.4,
          affectedVersions: '<4.17.31',
          fixedInVersion: '4.17.31',
          publishedAt: testDate,
          lastUpdated: testDate,
          exploitability: 'medium',
        };
      });

      it('should create a valid VulnerabilityReport', () => {
        const report: VulnerabilityReport = {
          summary: {
            total: 15,
            critical: 2,
            high: 5,
            medium: 6,
            low: 2,
          },
          vulnerabilities: [mockVulnerability],
          byPackage: {
            'lodash': [mockVulnerability],
            'express': [],
          },
          remediation: {
            immediate: ['Update lodash to 4.17.31'],
            planned: ['Review express dependencies'],
            monitoring: ['Monitor for new lodash vulnerabilities'],
          },
        };

        expect(report.summary.total).toBe(15);
        expect(report.summary.critical).toBe(2);
        expect(report.summary.high).toBe(5);
        expect(report.vulnerabilities).toHaveLength(1);
        expect(report.byPackage['lodash']).toHaveLength(1);
        expect(report.remediation.immediate).toEqual(['Update lodash to 4.17.31']);
        expect(report.remediation.planned).toEqual(['Review express dependencies']);
        expect(report.remediation.monitoring).toEqual(['Monitor for new lodash vulnerabilities']);
      });
    });
  });

  describe('Error Handling Types', () => {
    describe('APIError', () => {
      it('should create valid APIError instances for all error codes', () => {
        const errorCodes: Array<'VALIDATION_ERROR' | 'NOT_FOUND' | 'PERMISSION_DENIED' | 'INTERNAL_ERROR' | 'RATE_LIMITED'> = [
          'VALIDATION_ERROR',
          'NOT_FOUND',
          'PERMISSION_DENIED',
          'INTERNAL_ERROR',
          'RATE_LIMITED',
        ];

        errorCodes.forEach(code => {
          const error: APIError = {
            code,
            message: `Test ${code} error`,
            details: { field: 'test' },
            requestId: 'req-123',
            timestamp: testDate,
          };

          expect(error.code).toBe(code);
          expect(error.message).toBe(`Test ${code} error`);
          expect(error.details).toEqual({ field: 'test' });
          expect(error.requestId).toBe('req-123');
          expect(error.timestamp).toEqual(testDate);
        });
      });

      it('should handle APIError without details', () => {
        const error: APIError = {
          code: 'NOT_FOUND',
          message: 'Resource not found',
          requestId: 'req-456',
          timestamp: testDate,
        };

        expect(error.details).toBeUndefined();
      });
    });

    describe('ValidationIssue', () => {
      it('should create valid ValidationIssue for different severities', () => {
        const severities: Array<'error' | 'warning' | 'info'> = ['error', 'warning', 'info'];

        severities.forEach(severity => {
          const issue: ValidationIssue = {
            file: '/src/userService.ts',
            line: 25,
            column: 10,
            rule: 'missing-return-type',
            severity,
            message: 'Function is missing return type annotation',
            suggestion: 'Add return type annotation',
          };

          expect(issue.file).toBe('/src/userService.ts');
          expect(issue.line).toBe(25);
          expect(issue.column).toBe(10);
          expect(issue.rule).toBe('missing-return-type');
          expect(issue.severity).toBe(severity);
          expect(issue.message).toBe('Function is missing return type annotation');
          expect(issue.suggestion).toBe('Add return type annotation');
        });
      });

      it('should handle ValidationIssue without suggestion', () => {
        const issue: ValidationIssue = {
          file: '/src/test.ts',
          line: 5,
          column: 1,
          rule: 'unused-variable',
          severity: 'warning',
          message: 'Variable is declared but never used',
        };

        expect(issue.suggestion).toBeUndefined();
      });
    });
  });

  describe('Authentication and Rate Limiting Types', () => {
    describe('AuthenticatedRequest', () => {
      it('should create a valid AuthenticatedRequest with Bearer token', () => {
        const request: AuthenticatedRequest = {
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            'X-API-Key': 'api-key-123',
            'X-Request-ID': 'req-456',
          },
        };

        expect(request.headers.Authorization).toBe('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
        expect(request.headers['X-API-Key']).toBe('api-key-123');
        expect(request.headers['X-Request-ID']).toBe('req-456');
      });

      it('should handle minimal AuthenticatedRequest', () => {
        const minimalRequest: AuthenticatedRequest = {
          headers: {
            'Authorization': 'Bearer token123',
          },
        };

        expect(minimalRequest.headers.Authorization).toBe('Bearer token123');
        expect(minimalRequest.headers['X-API-Key']).toBeUndefined();
        expect(minimalRequest.headers['X-Request-ID']).toBeUndefined();
      });
    });

    describe('RateLimit', () => {
      it('should create a valid RateLimit object', () => {
        const rateLimit: RateLimit = {
          limit: 1000,
          remaining: 750,
          resetTime: new Date(testDate.getTime() + 3600000), // 1 hour from now
          retryAfter: 300,
        };

        expect(rateLimit.limit).toBe(1000);
        expect(rateLimit.remaining).toBe(750);
        expect(rateLimit.resetTime).toBeInstanceOf(Date);
        expect(rateLimit.retryAfter).toBe(300);
      });

      it('should handle RateLimit without retryAfter', () => {
        const rateLimit: RateLimit = {
          limit: 100,
          remaining: 50,
          resetTime: testDate,
        };

        expect(rateLimit.retryAfter).toBeUndefined();
      });
    });
  });

  describe('WebSocket and Real-time Types', () => {
    describe('WebhookConfig', () => {
      it('should create a valid WebhookConfig', () => {
        const config: WebhookConfig = {
          url: 'https://example.com/webhook',
          events: ['sync.completed', 'validation.failed', 'security.alert'],
          secret: 'webhook-secret-123',
        };

        expect(config.url).toBe('https://example.com/webhook');
        expect(config.events).toEqual(['sync.completed', 'validation.failed', 'security.alert']);
        expect(config.secret).toBe('webhook-secret-123');
      });

      it('should handle single event', () => {
        const config: WebhookConfig = {
          url: 'https://example.com/hook',
          events: ['sync.completed'],
          secret: 'secret',
        };

        expect(config.events).toEqual(['sync.completed']);
      });
    });

    describe('RealTimeSubscription', () => {
      it('should create a valid RealTimeSubscription', () => {
        const subscription: RealTimeSubscription = {
          event: 'entity.updated',
          filter: { entityType: 'file' },
          callback: (event: any) => console.log('Event received:', event),
        };

        expect(subscription.event).toBe('entity.updated');
        expect(subscription.filter).toEqual({ entityType: 'file' });
        expect(typeof subscription.callback).toBe('function');
      });

      it('should handle RealTimeSubscription without filter', () => {
        const subscription: RealTimeSubscription = {
          event: 'sync.completed',
          callback: () => {},
        };

        expect(subscription.filter).toBeUndefined();
      });
    });
  });

  describe('MCP Types', () => {
    describe('MCPTool', () => {
      it('should create a valid MCPTool', () => {
        const tool: MCPTool = {
          name: 'analyzeCode',
          description: 'Analyze code for issues and improvements',
          inputSchema: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              language: { type: 'string' },
            },
            required: ['code'],
          },
          handler: async (params: any) => ({ result: 'analysis complete' }),
        };

        expect(tool.name).toBe('analyzeCode');
        expect(tool.description).toBe('Analyze code for issues and improvements');
        expect(tool.inputSchema.type).toBe('object');
        expect(typeof tool.handler).toBe('function');
      });
    });

    describe('MCPRequest', () => {
      it('should create a valid MCPRequest with id', () => {
        const request: MCPRequest = {
          method: 'analyzeCode',
          params: { code: 'const x = 1;', language: 'javascript' },
          id: 'req-123',
        };

        expect(request.method).toBe('analyzeCode');
        expect(request.params).toEqual({ code: 'const x = 1;', language: 'javascript' });
        expect(request.id).toBe('req-123');
      });

      it('should handle MCPRequest without id', () => {
        const request: MCPRequest = {
          method: 'getEntities',
          params: { limit: 10 },
        };

        expect(request.id).toBeUndefined();
      });
    });

    describe('MCPResponse', () => {
      it('should create a successful MCPResponse', () => {
        const response: MCPResponse = {
          result: { entities: [], total: 0 },
          id: 'req-123',
        };

        expect(response.result).toEqual({ entities: [], total: 0 });
        expect(response.error).toBeUndefined();
        expect(response.id).toBe('req-123');
      });

      it('should create an error MCPResponse', () => {
        const response: MCPResponse = {
          error: {
            code: -32603,
            message: 'Internal error',
          },
          id: 'req-456',
        };

        expect(response.result).toBeUndefined();
        expect(response.error?.code).toBe(-32603);
        expect(response.error?.message).toBe('Internal error');
        expect(response.id).toBe('req-456');
      });
    });
  });

  describe('Edge Cases and Validation', () => {
    describe('Empty and Invalid Values', () => {
      it('should handle empty strings in required fields', () => {
        const response: APIResponse<string> = {
          success: true,
          data: '',
        };

        expect(response.data).toBe('');
      });

      it('should handle zero values for numeric fields', () => {
        const coverage: CoverageMetrics = {
          lines: 0,
          branches: 0,
          functions: 0,
          statements: 0,
        };

        expect(coverage.lines).toBe(0);
        expect(coverage.branches).toBe(0);
        expect(coverage.functions).toBe(0);
        expect(coverage.statements).toBe(0);
      });

      it('should handle negative values where they might be invalid', () => {
        const performance: PerformanceMetrics = {
          entityId: 'test',
          averageExecutionTime: -100, // This might be invalid but should be handled
          p95ExecutionTime: 200,
          successRate: 0.9,
          trend: 'stable',
          benchmarkComparisons: [],
          historicalData: [],
        };

        expect(performance.averageExecutionTime).toBe(-100);
      });
    });

    describe('Complex Nested Objects', () => {
      it('should handle deeply nested metadata objects', () => {
        const complexMetadata = {
          nested: {
            deeply: {
              nested: {
                value: 'test',
                array: [1, 2, { key: 'value' }],
                date: testDate,
              },
            },
          },
          specialValues: {
            regex: /test/gi,
            bigint: BigInt('12345678901234567890'),
            symbol: Symbol('test'),
          },
        };

        const response: APIResponse<typeof complexMetadata> = {
          success: true,
          data: complexMetadata,
        };

        expect(response.data?.nested.deeply.nested.value).toBe('test');
        expect(response.data?.nested.deeply.nested.array).toEqual([1, 2, { key: 'value' }]);
        expect(response.data?.nested.deeply.nested.date).toEqual(testDate);
        expect(response.data?.specialValues.regex).toEqual(/test/gi);
        expect(response.data?.specialValues.bigint).toEqual(BigInt('12345678901234567890'));
        expect(typeof response.data?.specialValues.symbol).toBe('symbol');
      });
    });

    describe('Large Arrays and Collections', () => {
      it('should handle large arrays of entities', () => {
        const largeEntityArray = Array.from({ length: 1000 }, (_, i) => ({
          id: `entity-${i}`,
          path: `/path/to/entity${i}.ts`,
          hash: `hash${i}`,
          language: 'typescript',
          lastModified: testDate,
          created: testDate,
          type: 'file' as const,
          extension: '.ts',
          size: 1024,
          lines: 50,
          isTest: false,
          isConfig: false,
          dependencies: [],
        }));

        const response: PaginatedResponse<Entity> = {
          success: true,
          data: largeEntityArray,
          pagination: {
            page: 1,
            pageSize: 1000,
            total: 1000,
            hasMore: false,
          },
        };

        expect(response.data).toHaveLength(1000);
        expect(response.pagination.total).toBe(1000);
        expect(response.pagination.hasMore).toBe(false);
      });

      it('should handle arrays with special characters and unicode', () => {
        const specialStrings = [
          'file-with-dashes',
          'file_with_underscores',
          'file.with.dots',
          'file/with/slashes',
          'file\\with\\backslashes',
          'file with spaces',
          'file-with-unicode-🚀-🌟-💻',
          'file-with-emoji-😀-🎉',
          'file-with-special-!@#$%^&*()',
        ];

        const entities: Entity[] = specialStrings.map((path, i) => ({
          id: `entity-${i}`,
          path,
          hash: `hash${i}`,
          language: 'typescript',
          lastModified: testDate,
          created: testDate,
          type: 'file' as const,
          extension: '.ts',
          size: 1024,
          lines: 50,
          isTest: false,
          isConfig: false,
          dependencies: [],
        }));

        expect(entities).toHaveLength(specialStrings.length);
        entities.forEach((entity, i) => {
          expect(entity.path).toBe(specialStrings[i]);
        });
      });
    });

    describe('Type Safety and Validation', () => {
      it('should enforce literal types for union types', () => {
        // Test that TypeScript would catch invalid values at compile time
        // These would cause compilation errors if invalid values were used
        const validMethods: Array<'GET' | 'POST' | 'PUT' | 'DELETE'> = ['GET', 'POST', 'PUT', 'DELETE'];
        const validSeverities: Array<'critical' | 'high' | 'medium' | 'low' | 'info'> = ['critical', 'high', 'medium', 'low', 'info'];
        const validStatuses: Array<'passed' | 'failed' | 'skipped' | 'error'> = ['passed', 'failed', 'skipped', 'error'];

        expect(validMethods).toHaveLength(4);
        expect(validSeverities).toHaveLength(5);
        expect(validStatuses).toHaveLength(4);
      });

      it('should validate type discrimination in discriminated unions', () => {
        const responses: Array<APIResponse<string> | APIResponse<number>> = [
          { success: true, data: 'string response' },
          { success: false, error: { code: 'NOT_FOUND', message: 'Not found' } },
          { success: true, data: 42 },
        ];

        responses.forEach(response => {
          if (response.success && typeof response.data === 'string') {
            expect(typeof response.data).toBe('string');
          } else if (response.success && typeof response.data === 'number') {
            expect(typeof response.data).toBe('number');
          } else if (!response.success) {
            expect(response.error).toBeDefined();
          }
        });
      });
    });
  });
});

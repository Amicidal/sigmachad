/**
 * Advanced Entity Tests
 * Tests for Module, Test, Spec, and other advanced entity types
 */

import { describe, it, expect } from '@jest/globals';
import {
  Module,
  Test,
  Spec,
  Change,
  Session,
  DocumentationNode,
  BusinessDomain,
  SemanticCluster,
  SecurityIssue,
  Vulnerability,
  isTest,
  isSpec,
} from '../src/models/entities.js';

describe('Advanced Entity Types', () => {
  describe('Module Entity', () => {
    it('should create a valid Module entity', () => {
      const module: Module = {
        id: 'module_1',
        type: 'module',
        name: 'UserManagement',
        path: '/src/modules/user',
        files: ['index.ts', 'UserService.ts', 'UserModel.ts'],
        dependencies: ['Database', 'Logger'],
        exports: ['UserService', 'UserModel', 'UserTypes'],
        entryPoint: 'index.ts',
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        hash: 'module123'
      };

      expect(module.type).toBe('module');
      expect(module.files).toHaveLength(3);
      expect(module.exports).toHaveLength(3);
      expect(module.entryPoint).toBe('index.ts');
    });

    it('should support different module structures', () => {
      const npmModule: Module = {
        id: 'npm_module',
        type: 'module',
        name: 'react-components',
        path: '/node_modules/react-components',
        files: ['index.js', 'Button.js', 'Input.js'],
        dependencies: ['react', 'prop-types'],
        exports: ['Button', 'Input'],
        entryPoint: 'index.js',
        language: 'javascript',
        lastModified: new Date(),
        created: new Date(),
        hash: 'npm456'
      };

      expect(npmModule.files).toContain('index.js');
      expect(npmModule.dependencies).toContain('react');
    });
  });

  describe('Test Entity', () => {
    it('should create a valid Test entity', () => {
      const test: Test = {
        id: 'test_1',
        type: 'test',
        name: 'UserService Tests',
        path: '/tests/UserService.test.ts',
        testFramework: 'jest',
        targetFile: '/src/services/UserService.ts',
        testCases: [
          'should create user',
          'should get user by id',
          'should update user',
          'should delete user'
        ],
        coverage: {
          lines: 85,
          functions: 90,
          branches: 75,
          statements: 82
        },
        status: 'passed',
        duration: 1250,
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        hash: 'test789'
      };

      expect(test.type).toBe('test');
      expect(test.testFramework).toBe('jest');
      expect(test.testCases).toHaveLength(4);
      expect(test.coverage.lines).toBe(85);
      expect(test.status).toBe('passed');
    });

    it('should support different test statuses', () => {
      const statuses = ['passed', 'failed', 'skipped', 'pending'] as const;

      statuses.forEach(status => {
        const test: Test = {
          id: `test_${status}`,
          type: 'test',
          name: `Test ${status}`,
          path: `/tests/test.${status}.ts`,
          testFramework: 'jest',
          targetFile: '/src/code.ts',
          testCases: ['should work'],
          coverage: { lines: 100, functions: 100, branches: 100, statements: 100 },
          status,
          duration: 100,
          language: 'typescript',
          lastModified: new Date(),
          created: new Date(),
          hash: `${status}123`
        };

        expect(test.status).toBe(status);
      });
    });

    it('should track test coverage metrics', () => {
      const comprehensiveTest: Test = {
        id: 'coverage_test',
        type: 'test',
        name: 'Coverage Test',
        path: '/tests/coverage.test.ts',
        testFramework: 'jest',
        targetFile: '/src/service.ts',
        testCases: ['should test all paths'],
        coverage: {
          lines: 95,
          functions: 100,
          branches: 85,
          statements: 93
        },
        status: 'passed',
        duration: 800,
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        hash: 'coverage456'
      };

      expect(comprehensiveTest.coverage.lines).toBe(95);
      expect(comprehensiveTest.coverage.functions).toBe(100);
      expect(comprehensiveTest.coverage.branches).toBe(85);
      expect(comprehensiveTest.coverage.statements).toBe(93);
    });
  });

  describe('Spec Entity', () => {
    it('should create a valid Spec entity', () => {
      const spec: Spec = {
        id: 'spec_1',
        type: 'spec',
        name: 'User API Specification',
        path: '/docs/api/user-api.spec.yaml',
        format: 'openapi',
        version: '3.0.0',
        endpoints: [
          { path: '/users', method: 'GET', description: 'Get all users' },
          { path: '/users/{id}', method: 'GET', description: 'Get user by ID' },
          { path: '/users', method: 'POST', description: 'Create user' }
        ],
        schemas: ['User', 'UserCreate', 'UserUpdate'],
        language: 'yaml',
        lastModified: new Date(),
        created: new Date(),
        hash: 'spec123'
      };

      expect(spec.type).toBe('spec');
      expect(spec.format).toBe('openapi');
      expect(spec.version).toBe('3.0.0');
      expect(spec.endpoints).toHaveLength(3);
      expect(spec.schemas).toHaveLength(3);
    });

    it('should support different specification formats', () => {
      const formats = ['openapi', 'swagger', 'raml', 'api-blueprint'] as const;

      formats.forEach(format => {
        const spec: Spec = {
          id: `spec_${format}`,
          type: 'spec',
          name: `API ${format}`,
          path: `/docs/api.${format}`,
          format,
          version: '1.0.0',
          endpoints: [{ path: '/test', method: 'GET', description: 'Test endpoint' }],
          schemas: ['Test'],
          language: format === 'raml' ? 'yaml' : 'json',
          lastModified: new Date(),
          created: new Date(),
          hash: `${format}789`
        };

        expect(spec.format).toBe(format);
      });
    });
  });

  describe('Change Entity', () => {
    it('should create a valid Change entity', () => {
      const change: Change = {
        id: 'change_1',
        type: 'change',
        description: 'Added user authentication',
        author: 'john.doe@example.com',
        timestamp: new Date('2024-01-15T10:30:00Z'),
        files: ['/src/auth.ts', '/src/middleware.ts'],
        type: 'feature',
        impact: 'medium',
        breaking: false,
        relatedIssues: ['ISSUE-123', 'ISSUE-124'],
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        hash: 'change456'
      };

      expect(change.type).toBe('change');
      expect(change.author).toContain('john.doe');
      expect(change.files).toHaveLength(2);
      expect(change.type).toBe('feature');
      expect(change.breaking).toBe(false);
    });

    it('should support different change types', () => {
      const changeTypes = ['feature', 'bugfix', 'refactor', 'documentation', 'performance'] as const;

      changeTypes.forEach(type => {
        const change: Change = {
          id: `change_${type}`,
          type: 'change',
          description: `A ${type} change`,
          author: 'developer@example.com',
          timestamp: new Date(),
          files: ['/src/file.ts'],
          type,
          impact: 'low',
          breaking: false,
          relatedIssues: [],
          language: 'typescript',
          lastModified: new Date(),
          created: new Date(),
          hash: `${type}123`
        };

        expect(change.type).toBe(type);
      });
    });
  });

  describe('Session Entity', () => {
    it('should create a valid Session entity', () => {
      const session: Session = {
        id: 'session_1',
        type: 'session',
        userId: 'user_123',
        startTime: new Date('2024-01-15T09:00:00Z'),
        endTime: new Date('2024-01-15T17:30:00Z'),
        duration: 30600000, // 8.5 hours in milliseconds
        activities: [
          { type: 'coding', duration: 25200000, files: ['/src/feature.ts'] },
          { type: 'testing', duration: 3600000, files: ['/tests/feature.test.ts'] },
          { type: 'debugging', duration: 1800000, files: ['/src/feature.ts'] }
        ],
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        hash: 'session789'
      };

      expect(session.type).toBe('session');
      expect(session.userId).toBe('user_123');
      expect(session.activities).toHaveLength(3);
      expect(session.duration).toBe(30600000);
    });

    it('should track different activity types', () => {
      const activities = ['coding', 'testing', 'debugging', 'reviewing', 'planning'] as const;

      activities.forEach(activityType => {
        const session: Session = {
          id: `session_${activityType}`,
          type: 'session',
          userId: 'user_456',
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000), // 1 hour later
          duration: 3600000,
          activities: [{ type: activityType, duration: 3600000, files: ['/src/file.ts'] }],
          language: 'typescript',
          lastModified: new Date(),
          created: new Date(),
          hash: `${activityType}456`
        };

        expect(session.activities[0].type).toBe(activityType);
      });
    });
  });

  describe('DocumentationNode Entity', () => {
    it('should create a valid DocumentationNode entity', () => {
      const docNode: DocumentationNode = {
        id: 'doc_1',
        type: 'documentation',
        title: 'Getting Started Guide',
        path: '/docs/getting-started.md',
        content: '# Getting Started\n\nThis guide will help you...',
        format: 'markdown',
        tags: ['guide', 'beginner', 'setup'],
        relatedFiles: ['/src/index.ts', '/README.md'],
        language: 'markdown',
        lastModified: new Date(),
        created: new Date(),
        hash: 'doc123'
      };

      expect(docNode.type).toBe('documentation');
      expect(docNode.format).toBe('markdown');
      expect(docNode.tags).toContain('guide');
      expect(docNode.relatedFiles).toHaveLength(2);
    });

    it('should support different documentation formats', () => {
      const formats = ['markdown', 'html', 'plaintext', 'rst'] as const;

      formats.forEach(format => {
        const docNode: DocumentationNode = {
          id: `doc_${format}`,
          type: 'documentation',
          title: `Documentation in ${format}`,
          path: `/docs/doc.${format}`,
          content: `Content in ${format} format`,
          format,
          tags: [`${format}`],
          relatedFiles: [],
          language: format,
          lastModified: new Date(),
          created: new Date(),
          hash: `${format}789`
        };

        expect(docNode.format).toBe(format);
      });
    });
  });

  describe('BusinessDomain Entity', () => {
    it('should create a valid BusinessDomain entity', () => {
      const domain: BusinessDomain = {
        id: 'domain_1',
        type: 'business_domain',
        name: 'User Management',
        description: 'Handles user registration, authentication, and profile management',
        entities: ['User', 'Profile', 'Role'],
        services: ['UserService', 'AuthService', 'ProfileService'],
        boundedContext: 'Identity and Access Management',
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        hash: 'domain456'
      };

      expect(domain.type).toBe('business_domain');
      expect(domain.name).toBe('User Management');
      expect(domain.entities).toHaveLength(3);
      expect(domain.services).toHaveLength(3);
      expect(domain.boundedContext).toBe('Identity and Access Management');
    });
  });

  describe('SecurityIssue Entity', () => {
    it('should create a valid SecurityIssue entity', () => {
      const securityIssue: SecurityIssue = {
        id: 'security_1',
        type: 'security_issue',
        title: 'SQL Injection Vulnerability',
        description: 'User input is not properly sanitized in database queries',
        severity: 'high',
        cwe: 'CWE-89',
        file: '/src/database.ts',
        line: 45,
        code: "query = `SELECT * FROM users WHERE id = ${userId}`",
        recommendation: 'Use parameterized queries or prepared statements',
        status: 'open',
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        hash: 'security123'
      };

      expect(securityIssue.type).toBe('security_issue');
      expect(securityIssue.severity).toBe('high');
      expect(securityIssue.cwe).toBe('CWE-89');
      expect(securityIssue.status).toBe('open');
    });

    it('should support different severity levels', () => {
      const severities = ['critical', 'high', 'medium', 'low', 'info'] as const;

      severities.forEach(severity => {
        const securityIssue: SecurityIssue = {
          id: `security_${severity}`,
          type: 'security_issue',
          title: `${severity} severity issue`,
          description: 'Test security issue',
          severity,
          cwe: 'CWE-123',
          file: '/src/test.ts',
          line: 1,
          code: 'test code',
          recommendation: 'Fix it',
          status: 'open',
          language: 'typescript',
          lastModified: new Date(),
          created: new Date(),
          hash: `${severity}456`
        };

        expect(securityIssue.severity).toBe(severity);
      });
    });
  });

  describe('Type Guards', () => {
    it('should identify test entities', () => {
      const test: Test = {
        id: 'test_1',
        type: 'test',
        name: 'Test Entity',
        path: '/tests/test.ts',
        testFramework: 'jest',
        targetFile: '/src/code.ts',
        testCases: ['should work'],
        coverage: { lines: 100, functions: 100, branches: 100, statements: 100 },
        status: 'passed',
        duration: 100,
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        hash: 'test123'
      };

      expect(isTest(test)).toBe(true);
    });

    it('should identify spec entities', () => {
      const spec: Spec = {
        id: 'spec_1',
        type: 'spec',
        name: 'API Spec',
        path: '/docs/api.yaml',
        format: 'openapi',
        version: '3.0.0',
        endpoints: [{ path: '/test', method: 'GET', description: 'Test' }],
        schemas: ['Test'],
        language: 'yaml',
        lastModified: new Date(),
        created: new Date(),
        hash: 'spec123'
      };

      expect(isSpec(spec)).toBe(true);
    });
  });
});

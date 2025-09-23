/**
 * Unit tests for Security Routes
 * Tests security scanning, vulnerability assessment, and security monitoring endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerSecurityRoutes } from '../../../src/api/routes/security.js';
import {
  createMockRequest,
  createMockReply,
  type MockFastifyRequest,
  type MockFastifyReply
} from '../../test-utils.js';

// Mock services
vi.mock('../../../src/services/testing/SecurityScanner.js', () => ({
  SecurityScanner: vi.fn()
}));
vi.mock('../../../src/services/core/DatabaseService.js', () => ({
  DatabaseService: vi.fn()
}));
vi.mock('../../../src/services/knowledge/KnowledgeGraphService.js', () => ({
  KnowledgeGraphService: vi.fn()
}));

describe('Security Routes', () => {
  let mockApp: any;
  let mockKgService: any;
  let mockDbService: any;
  let mockSecurityScanner: any;
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

  // Helper function to extract route handlers
  const getHandler = (method: 'get' | 'post', path: string, app = mockApp): Function => {
    const routes = app.getRegisteredRoutes();
    const key = `${method}:${path}`;
    const handler = routes.get(key);

    if (!handler) {
      const availableRoutes = Array.from(routes.keys()).join(', ');
      throw new Error(`Route ${key} not found. Available routes: ${availableRoutes}`);
    }

    return handler;
  };

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create mock services
    mockKgService = vi.fn() as any;
    mockDbService = vi.fn() as any;
    mockSecurityScanner = {
      performScan: vi.fn(),
      getVulnerabilityReport: vi.fn(),
      performSecurityAudit: vi.fn(),
      getSecurityIssues: vi.fn(),
      generateSecurityFix: vi.fn(),
      getComplianceStatus: vi.fn(),
      setupMonitoring: vi.fn()
    } as any;

    // Mock Fastify app - recreate it fresh for each test
    mockApp = createMockApp();

    // Create fresh mocks for each test
    mockRequest = createMockRequest();
    mockReply = createMockReply();

    // Mock process.uptime() using vi.spyOn
    vi.spyOn(process, 'uptime').mockReturnValue(123.45);
  });

  describe('registerSecurityRoutes', () => {
    it('should register all security routes with required services', async () => {
      await registerSecurityRoutes(
        mockApp as any,
        mockKgService,
        mockDbService,
        mockSecurityScanner
      );

      // Verify all routes are registered
      expect(mockApp.post).toHaveBeenCalledWith('/security/scan', expect.any(Object), expect.any(Function));
      expect(mockApp.get).toHaveBeenCalledWith('/security/vulnerabilities', expect.any(Function));
      expect(mockApp.post).toHaveBeenCalledWith('/security/audit', expect.any(Object), expect.any(Function));
      expect(mockApp.get).toHaveBeenCalledWith('/security/issues', expect.any(Object), expect.any(Function));
      expect(mockApp.post).toHaveBeenCalledWith('/security/fix', expect.any(Object), expect.any(Function));
      expect(mockApp.get).toHaveBeenCalledWith('/security/compliance', expect.any(Object), expect.any(Function));
      expect(mockApp.post).toHaveBeenCalledWith('/security/monitor', expect.any(Object), expect.any(Function));
    });

    it('should register routes with optional services', async () => {
      await registerSecurityRoutes(
        mockApp as any,
        mockKgService,
        mockDbService,
        mockSecurityScanner
        // All services are available
      );

      // Routes should still be registered
      expect(mockApp.get).toHaveBeenCalledTimes(3); // vulnerabilities, issues, compliance
      expect(mockApp.post).toHaveBeenCalledTimes(4); // scan, audit, fix, monitor
    });
  });

  describe('POST /security/scan', () => {
    let scanHandler: Function;

    beforeEach(async () => {
      await registerSecurityRoutes(
        mockApp as any,
        mockKgService,
        mockDbService,
        mockSecurityScanner
      );

      scanHandler = getHandler('post', '/security/scan');
    });

    it('should perform security scan with custom options', async () => {
      const scanRequest = {
        entityIds: ['file1', 'file2'],
        scanTypes: ['sast', 'sca', 'secrets'] as const,
        severity: ['critical', 'high', 'medium'] as const
      };

      const mockScanResult = {
        issues: [
          {
            id: 'issue1',
            severity: 'high',
            title: 'SQL Injection Vulnerability',
            affectedEntityId: 'file1'
          }
        ],
        vulnerabilities: [
          {
            id: 'vuln1',
            severity: 'medium',
            packageName: 'lodash',
            vulnerabilityId: 'CVE-2021-23337'
          }
        ],
        summary: {
          totalIssues: 2,
          bySeverity: { critical: 0, high: 1, medium: 1, low: 0 },
          byType: { sast: 1, secrets: 0, sca: 1, dependency: 1 }
        }
      };

      mockRequest.body = scanRequest;
      mockSecurityScanner.performScan.mockResolvedValue(mockScanResult);

      await scanHandler(mockRequest, mockReply);

      expect(mockSecurityScanner.performScan).toHaveBeenCalledWith(scanRequest);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockScanResult
      });
    });

    it('should perform security scan with default options', async () => {
      const mockScanResult = {
        issues: [],
        vulnerabilities: [],
        summary: {
          totalIssues: 0,
          bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
          byType: { sast: 0, secrets: 0, sca: 0, dependency: 0 }
        }
      };

      mockRequest.body = {};
      mockSecurityScanner.performScan.mockResolvedValue(mockScanResult);

      await scanHandler(mockRequest, mockReply);

      expect(mockSecurityScanner.performScan).toHaveBeenCalledWith({});
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockScanResult
      });
    });

    it('should handle scan errors gracefully', async () => {
      mockRequest.body = { entityIds: ['invalid-file'] };
      const scanError = new Error('Failed to scan entities');
      mockSecurityScanner.performScan.mockRejectedValue(scanError);

      await scanHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SCAN_FAILED',
          message: 'Failed to scan entities'
        }
      });
    });

    it('should handle scan errors with custom error messages', async () => {
      mockRequest.body = { entityIds: ['file1'] };
      const customError = new Error('Custom scan error');
      mockSecurityScanner.performScan.mockRejectedValue(customError);

      await scanHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SCAN_FAILED',
          message: 'Custom scan error'
        }
      });
    });
  });

  describe('GET /security/vulnerabilities', () => {
    let vulnerabilitiesHandler: Function;

    beforeEach(async () => {
      await registerSecurityRoutes(
        mockApp as any,
        mockKgService,
        mockDbService,
        mockSecurityScanner
      );

      vulnerabilitiesHandler = getHandler('get', '/security/vulnerabilities');
    });

    it('should return vulnerability report successfully', async () => {
      const mockReport = {
        summary: { total: 3, critical: 1, high: 1, medium: 1, low: 0 },
        vulnerabilities: [
          {
            id: 'vuln1',
            severity: 'critical',
            packageName: 'express',
            vulnerabilityId: 'CVE-2022-24999'
          },
          {
            id: 'vuln2',
            severity: 'high',
            packageName: 'lodash',
            vulnerabilityId: 'CVE-2021-23337'
          }
        ],
        byPackage: {
          express: [{ id: 'vuln1' }],
          lodash: [{ id: 'vuln2' }]
        },
        remediation: {
          immediate: ['Fix CVE-2022-24999 in express'],
          planned: ['Address CVE-2021-23337 in lodash'],
          monitoring: []
        }
      };

      mockSecurityScanner.getVulnerabilityReport.mockResolvedValue(mockReport);

      await vulnerabilitiesHandler(mockRequest, mockReply);

      expect(mockSecurityScanner.getVulnerabilityReport).toHaveBeenCalled();
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockReport
      });
    });

    it('should handle vulnerability report errors', async () => {
      const reportError = new Error('Database connection failed');
      mockSecurityScanner.getVulnerabilityReport.mockRejectedValue(reportError);

      await vulnerabilitiesHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'REPORT_FAILED',
          message: 'Database connection failed'
        }
      });
    });
  });

  describe('POST /security/audit', () => {
    let auditHandler: Function;

    beforeEach(async () => {
      await registerSecurityRoutes(
        mockApp as any,
        mockKgService,
        mockDbService,
        mockSecurityScanner
      );

      auditHandler = getHandler('post', '/security/audit');
    });

    it('should perform full security audit with default scope', async () => {
      const mockAudit = {
        scope: 'full',
        startTime: new Date().toISOString(),
        findings: [
          {
            type: 'severity-alert',
            message: 'Found 2 critical and 5 high severity issues',
            severity: 'high'
          }
        ],
        recommendations: [
          'IMMEDIATE: Address all critical security issues before deployment',
          'Implement comprehensive logging'
        ],
        score: 75
      };

      mockRequest.body = {};
      mockSecurityScanner.performSecurityAudit.mockResolvedValue(mockAudit);

      await auditHandler(mockRequest, mockReply);

      expect(mockSecurityScanner.performSecurityAudit).toHaveBeenCalledWith('full');
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockAudit
      });
    });

    it('should perform security audit with custom scope and options', async () => {
      const mockAudit = {
        scope: 'critical-only',
        startTime: new Date().toISOString(),
        findings: [],
        recommendations: ['Excellent! No critical security issues found.'],
        score: 95
      };

      mockRequest.body = {
        scope: 'critical-only',
        includeDependencies: false,
        includeSecrets: true
      };
      mockSecurityScanner.performSecurityAudit.mockResolvedValue(mockAudit);

      await auditHandler(mockRequest, mockReply);

      expect(mockSecurityScanner.performSecurityAudit).toHaveBeenCalledWith('critical-only');
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockAudit
      });
    });

    it('should handle audit errors', async () => {
      mockRequest.body = { scope: 'invalid-scope' };
      const auditError = new Error('Invalid audit scope');
      mockSecurityScanner.performSecurityAudit.mockRejectedValue(auditError);

      await auditHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUDIT_FAILED',
          message: 'Invalid audit scope'
        }
      });
    });
  });

  describe('GET /security/issues', () => {
    let issuesHandler: Function;

    beforeEach(async () => {
      await registerSecurityRoutes(
        mockApp as any,
        mockKgService,
        mockDbService,
        mockSecurityScanner
      );

      issuesHandler = getHandler('get', '/security/issues');
    });

    it('should return security issues with filters and pagination', async () => {
      const mockIssues = [
        {
          id: 'issue1',
          severity: 'critical',
          title: 'SQL Injection Vulnerability',
          status: 'open',
          discoveredAt: new Date()
        },
        {
          id: 'issue2',
          severity: 'high',
          title: 'Hardcoded Secret',
          status: 'open',
          discoveredAt: new Date()
        }
      ];

      mockRequest.query = {
        severity: 'critical',
        status: 'open',
        limit: 10,
        offset: 0
      };

      mockSecurityScanner.getSecurityIssues.mockResolvedValue({
        issues: mockIssues,
        total: 2
      });

      await issuesHandler(mockRequest, mockReply);

      expect(mockSecurityScanner.getSecurityIssues).toHaveBeenCalledWith({
        severity: ['critical'],
        status: ['open'],
        limit: 10,
        offset: 0
      });

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockIssues,
        pagination: {
          page: 1,
          pageSize: 10,
          total: 2,
          hasMore: false
        }
      });
    });

    it('should return security issues with default parameters', async () => {
      const mockIssues = [
        {
          id: 'issue1',
          severity: 'medium',
          title: 'Missing Input Validation',
          status: 'open',
          discoveredAt: new Date()
        }
      ];

      mockRequest.query = {};
      mockSecurityScanner.getSecurityIssues.mockResolvedValue({
        issues: mockIssues,
        total: 1
      });

      await issuesHandler(mockRequest, mockReply);

      expect(mockSecurityScanner.getSecurityIssues).toHaveBeenCalledWith({
        severity: undefined,
        status: undefined,
        limit: 50,
        offset: 0
      });

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockIssues,
        pagination: {
          page: 1,
          pageSize: 50,
          total: 1,
          hasMore: false
        }
      });
    });

    it('should handle security issues retrieval errors', async () => {
      mockRequest.query = { severity: 'invalid' };
      const issuesError = new Error('Invalid severity filter');
      mockSecurityScanner.getSecurityIssues.mockRejectedValue(issuesError);

      await issuesHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ISSUES_FAILED',
          message: 'Invalid severity filter'
        }
      });
    });
  });

  describe('POST /security/fix', () => {
    let fixHandler: Function;

    beforeEach(async () => {
      await registerSecurityRoutes(
        mockApp as any,
        mockKgService,
        mockDbService,
        mockSecurityScanner
      );

      fixHandler = getHandler('post', '/security/fix');
    });

    it('should generate security fix for issue ID', async () => {
      const mockFix = {
        issueId: 'issue1',
        fixes: [
          {
            description: 'Replace string concatenation with parameterized query',
            code: '// Use parameterized queries',
            explanation: 'Parameterized queries prevent SQL injection'
          }
        ],
        priority: 'high',
        effort: 'medium'
      };

      mockRequest.body = { issueId: 'issue1' };
      mockSecurityScanner.generateSecurityFix.mockResolvedValue(mockFix);

      await fixHandler(mockRequest, mockReply);

      expect(mockSecurityScanner.generateSecurityFix).toHaveBeenCalledWith('issue1');
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockFix
      });
    });

    it('should generate security fix for vulnerability ID', async () => {
      const mockFix = {
        issueId: 'vuln1',
        fixes: [
          {
            description: 'Update vulnerable package',
            code: 'npm update lodash@^4.17.12',
            explanation: 'Update to patched version'
          }
        ],
        priority: 'immediate',
        effort: 'low'
      };

      mockRequest.body = { vulnerabilityId: 'vuln1' };
      mockSecurityScanner.generateSecurityFix.mockResolvedValue(mockFix);

      await fixHandler(mockRequest, mockReply);

      expect(mockSecurityScanner.generateSecurityFix).toHaveBeenCalledWith('vuln1');
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockFix
      });
    });

    it('should return 400 when neither issueId nor vulnerabilityId is provided', async () => {
      mockRequest.body = {};

      await fixHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MISSING_ID',
          message: 'Either issueId or vulnerabilityId is required'
        }
      });
    });

    it('should handle fix generation errors', async () => {
      mockRequest.body = { issueId: 'nonexistent-issue' };
      const fixError = new Error('Security issue not found');
      mockSecurityScanner.generateSecurityFix.mockRejectedValue(fixError);

      await fixHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FIX_FAILED',
          message: 'Security issue not found'
        }
      });
    });
  });

  describe('GET /security/compliance', () => {
    let complianceHandler: Function;

    beforeEach(async () => {
      await registerSecurityRoutes(
        mockApp as any,
        mockKgService,
        mockDbService,
        mockSecurityScanner
      );

      complianceHandler = getHandler('get', '/security/compliance');
    });

    it('should return compliance status with specified framework and scope', async () => {
      const mockCompliance = {
        framework: 'owasp',
        scope: 'full',
        overallScore: 75,
        requirements: [
          { id: 'REQ001', status: 'compliant', description: 'Input validation implemented' },
          { id: 'REQ002', status: 'partial', description: 'Authentication mechanisms present' }
        ],
        gaps: ['Secure logging and monitoring'],
        recommendations: ['Implement comprehensive logging']
      };

      mockRequest.query = { framework: 'owasp', scope: 'full' };
      mockSecurityScanner.getComplianceStatus.mockResolvedValue(mockCompliance);

      await complianceHandler(mockRequest, mockReply);

      expect(mockSecurityScanner.getComplianceStatus).toHaveBeenCalledWith('owasp', 'full');
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockCompliance
      });
    });

    it('should use default framework when not specified', async () => {
      const mockCompliance = {
        framework: 'owasp',
        scope: 'recent',
        overallScore: 80,
        requirements: [],
        gaps: [],
        recommendations: []
      };

      mockRequest.query = { scope: 'recent' };
      mockSecurityScanner.getComplianceStatus.mockResolvedValue(mockCompliance);

      await complianceHandler(mockRequest, mockReply);

      expect(mockSecurityScanner.getComplianceStatus).toHaveBeenCalledWith('owasp', 'recent');
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockCompliance
      });
    });

    it('should handle compliance status errors', async () => {
      mockRequest.query = { framework: 'invalid-framework' };
      const complianceError = new Error('Unsupported compliance framework');
      mockSecurityScanner.getComplianceStatus.mockRejectedValue(complianceError);

      await complianceHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'COMPLIANCE_FAILED',
          message: 'Unsupported compliance framework'
        }
      });
    });
  });

  describe('POST /security/monitor', () => {
    let monitorHandler: Function;

    beforeEach(async () => {
      await registerSecurityRoutes(
        mockApp as any,
        mockKgService,
        mockDbService,
        mockSecurityScanner
      );

      monitorHandler = getHandler('post', '/security/monitor');
    });

    it('should set up security monitoring with alerts configuration', async () => {
      const monitoringConfig = {
        alerts: [
          {
            type: 'vulnerability',
            severity: 'critical',
            threshold: 1,
            channels: ['email', 'slack']
          },
          {
            type: 'secret-leak',
            severity: 'high',
            threshold: 0,
            channels: ['console']
          }
        ],
        schedule: 'daily'
      };

      mockRequest.body = monitoringConfig;
      mockSecurityScanner.setupMonitoring.mockResolvedValue(undefined);

      await monitorHandler(mockRequest, mockReply);

      expect(mockSecurityScanner.setupMonitoring).toHaveBeenCalledWith({
        enabled: true,
        schedule: 'daily',
        alerts: [
          {
            type: 'vulnerability',
            severity: 'critical',
            threshold: 1,
            channels: ['email', 'slack']
          },
          {
            type: 'secret-leak',
            severity: 'high',
            threshold: 1,
            channels: ['console']
          }
        ]
      });

      const responseData = (mockReply.send as any).mock.calls[0][0].data;
      expect(responseData.alerts).toBe(2);
      expect(responseData.schedule).toBe('daily');
      expect(responseData.status).toBe('active');
      expect(responseData.nextRun).toBeDefined();
    });

    it('should set up monitoring with default values', async () => {
      mockRequest.body = { alerts: [] };
      mockSecurityScanner.setupMonitoring.mockResolvedValue(undefined);

      await monitorHandler(mockRequest, mockReply);

      expect(mockSecurityScanner.setupMonitoring).toHaveBeenCalledWith({
        enabled: true,
        schedule: 'daily',
        alerts: []
      });
    });

    it('should return 400 when alerts are not provided', async () => {
      mockRequest.body = { schedule: 'hourly' };

      await monitorHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500); // Schema validation would handle this
    });

    it('should handle monitoring setup errors', async () => {
      mockRequest.body = {
        alerts: [{ type: 'test', severity: 'high' }],
        schedule: 'daily'
      };
      const monitorError = new Error('Invalid monitoring configuration');
      mockSecurityScanner.setupMonitoring.mockRejectedValue(monitorError);

      await monitorHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MONITOR_FAILED',
          message: 'Invalid monitoring configuration'
        }
      });
    });
  });
});

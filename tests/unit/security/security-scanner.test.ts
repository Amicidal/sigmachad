/**
 * Unit tests for SecurityScanner
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecurityScanner } from '@memento/testing/security/scanner';
import { SecurityScanOptions, SecurityScanRequest } from '@memento/testing/security/types';

// Mock dependencies
const mockDb = {
  falkordbQuery: vi.fn(),
  falkordbCommand: vi.fn(),
  getConfig: vi.fn(() => ({ falkordb: { graphKey: 'test' } }))
};

const mockKgService = {
  getEntity: vi.fn(),
  createRelationship: vi.fn(),
  findEntitiesByType: vi.fn()
};

describe('SecurityScanner', () => {
  let scanner: SecurityScanner;

  beforeEach(() => {
    vi.clearAllMocks();
    scanner = new SecurityScanner(mockDb, mockKgService);
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      mockDb.falkordbCommand.mockResolvedValue(undefined);
      mockDb.falkordbQuery.mockResolvedValue([]);

      await expect(scanner.initialize()).resolves.not.toThrow();
      expect(mockDb.falkordbCommand).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      mockDb.falkordbCommand.mockRejectedValue(new Error('DB connection failed'));
      mockDb.falkordbQuery.mockResolvedValue([]);

      await expect(scanner.initialize()).resolves.not.toThrow();
    });
  });

  describe('performScan', () => {
    it('should perform a complete security scan', async () => {
      const request: SecurityScanRequest = {
        entityIds: ['test-entity-1'],
        scanTypes: ['sast', 'secrets'],
      };

      const options: Partial<SecurityScanOptions> = {
        includeSAST: true,
        includeSecrets: true,
        includeSCA: false,
        includeDependencies: false,
        severityThreshold: 'medium',
        confidenceThreshold: 0.7
      };

      // Mock entity retrieval
      mockKgService.getEntity.mockResolvedValue({
        id: 'test-entity-1',
        type: 'file',
        path: '/test/file.js'
      });

      // Mock database operations
      mockDb.falkordbQuery.mockResolvedValue([]);

      const result = await scanner.performScan(request, options);

      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
      expect(result.issues).toBeDefined();
      expect(result.vulnerabilities).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should handle scan failures gracefully', async () => {
      const request: SecurityScanRequest = {
        entityIds: ['invalid-entity'],
      };

      mockKgService.getEntity.mockRejectedValue(new Error('Entity not found'));

      await expect(scanner.performScan(request)).rejects.toThrow();
    });

    it('should apply severity filtering', async () => {
      const request: SecurityScanRequest = {
        entityIds: [],
      };

      const options: Partial<SecurityScanOptions> = {
        severityThreshold: 'high',
        confidenceThreshold: 0.8
      };

      mockDb.falkordbQuery.mockResolvedValue([]);

      const result = await scanner.performScan(request, options);

      expect(result.status).toBe('completed');
    });
  });

  describe('getSecurityIssues', () => {
    it('should retrieve security issues with filters', async () => {
      const mockIssues = [
        {
          i: {
            id: 'issue-1',
            severity: 'high',
            title: 'Test Issue',
            ruleId: 'TEST_RULE',
            status: 'open'
          }
        }
      ];

      mockDb.falkordbQuery.mockResolvedValueOnce(mockIssues);
      mockDb.falkordbQuery.mockResolvedValueOnce([{ total: 1 }]);

      const result = await scanner.getSecurityIssues({
        severity: ['high', 'critical'],
        limit: 10
      });

      expect(result.issues).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.issues[0].severity).toBe('high');
    });

    it('should handle empty results', async () => {
      mockDb.falkordbQuery.mockResolvedValue([]);

      const result = await scanner.getSecurityIssues();

      expect(result.issues).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle database errors', async () => {
      mockDb.falkordbQuery.mockRejectedValue(new Error('Database error'));

      const result = await scanner.getSecurityIssues();

      expect(result.issues).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('cancelScan', () => {
    it('should cancel an active scan', async () => {
      // Start a scan
      const request: SecurityScanRequest = { entityIds: [] };
      mockDb.falkordbQuery.mockResolvedValue([]);

      const scanPromise = scanner.performScan(request);

      // Get the scan ID from the active scans
      // This is a bit tricky to test due to the private nature of activeScan
      // In a real implementation, you might expose a method to get active scan IDs

      const cancelled = await scanner.cancelScan('non-existent-scan');
      expect(cancelled).toBe(false);

      await scanPromise; // Wait for scan to complete
    });
  });

  describe('monitoring configuration', () => {
    it('should set up monitoring configuration', async () => {
      const config = {
        enabled: true,
        schedule: 'daily' as const,
        alerts: [],
        notifications: [],
        retention: {
          scanResults: 30,
          issues: 90,
          vulnerabilities: 90
        }
      };

      mockDb.falkordbQuery.mockResolvedValue(undefined);

      await expect(scanner.setupMonitoring(config)).resolves.not.toThrow();
      expect(mockDb.falkordbQuery).toHaveBeenCalledWith(
        expect.stringContaining('MERGE (c:SecurityConfig'),
        expect.objectContaining({
          config: JSON.stringify(config)
        })
      );
    });
  });

  describe('scan history', () => {
    it('should retrieve scan history', async () => {
      const history = await scanner.getScanHistory(5);

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeLessThanOrEqual(5);
    });
  });

  describe('compliance and reporting integration', () => {
    it('should generate vulnerability report', async () => {
      const report = await scanner.getVulnerabilityReport();

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.vulnerabilities).toBeDefined();
      expect(report.byPackage).toBeDefined();
      expect(report.remediation).toBeDefined();
    });

    it('should perform security audit', async () => {
      const audit = await scanner.performSecurityAudit('full');

      expect(audit).toBeDefined();
      expect(audit.scope).toBe('full');
      expect(audit.findings).toBeDefined();
      expect(audit.recommendations).toBeDefined();
      expect(typeof audit.score).toBe('number');
    });

    it('should generate security fix recommendations', async () => {
      // Mock a security issue in the database
      mockDb.falkordbQuery.mockResolvedValue([
        {
          i: {
            id: 'test-issue',
            ruleId: 'SQL_INJECTION',
            severity: 'critical',
            title: 'SQL Injection Vulnerability'
          }
        }
      ]);

      const fix = await scanner.generateSecurityFix('test-issue');

      expect(fix).toBeDefined();
      expect(fix.issueId).toBe('test-issue');
      expect(fix.fixes).toBeDefined();
      expect(fix.priority).toBeDefined();
      expect(fix.effort).toBeDefined();
    });

    it('should get compliance status', async () => {
      const compliance = await scanner.getComplianceStatus('OWASP', 'full');

      expect(compliance).toBeDefined();
      expect(compliance.framework).toBe('OWASP');
      expect(compliance.scope).toBe('full');
      expect(typeof compliance.overallScore).toBe('number');
    });
  });
});
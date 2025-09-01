/**
 * Security Operations Routes
 * Handles security scanning, vulnerability assessment, and security monitoring
 */

import { FastifyInstance } from 'fastify';
import { KnowledgeGraphService } from '../../services/KnowledgeGraphService.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { SecurityScanner } from '../../services/SecurityScanner.js';

interface SecurityScanRequest {
  entityIds?: string[];
  scanTypes?: ('sast' | 'sca' | 'secrets' | 'dependency')[];
  severity?: ('critical' | 'high' | 'medium' | 'low')[];
}

interface SecurityScanResult {
  issues: any[];
  vulnerabilities: any[];
  summary: {
    totalIssues: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  };
}

interface VulnerabilityReport {
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  vulnerabilities: any[];
  byPackage: Record<string, any[]>;
  remediation: {
    immediate: string[];
    planned: string[];
    monitoring: string[];
  };
}

export async function registerSecurityRoutes(
  app: FastifyInstance,
  kgService: KnowledgeGraphService,
  dbService: DatabaseService,
  securityScanner: SecurityScanner
): Promise<void> {

  // POST /api/security/scan - Scan for security issues
  app.post('/security/scan', {
    schema: {
      body: {
        type: 'object',
        properties: {
          entityIds: { type: 'array', items: { type: 'string' } },
          scanTypes: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['sast', 'sca', 'secrets', 'dependency']
            }
          },
          severity: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low']
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const params: SecurityScanRequest = request.body as SecurityScanRequest;

      const result = await securityScanner.performScan(params);

      reply.send({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Security scan error:', error);
      reply.status(500).send({
        success: false,
        error: {
          code: 'SCAN_FAILED',
          message: error instanceof Error ? error.message : 'Failed to perform security scan'
        }
      });
    }
  });

  // GET /api/security/vulnerabilities - Get vulnerability report
  app.get('/security/vulnerabilities', async (request, reply) => {
    try {
      const report = await securityScanner.getVulnerabilityReport();

      reply.send({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Vulnerability report error:', error);
      reply.status(500).send({
        success: false,
        error: {
          code: 'REPORT_FAILED',
          message: error instanceof Error ? error.message : 'Failed to generate vulnerability report'
        }
      });
    }
  });

  // POST /api/security/audit - Perform security audit
  app.post('/security/audit', {
    schema: {
      body: {
        type: 'object',
        properties: {
          scope: {
            type: 'string',
            enum: ['full', 'recent', 'critical-only'],
            default: 'full'
          },
          includeDependencies: { type: 'boolean', default: true },
          includeSecrets: { type: 'boolean', default: true }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { scope, includeDependencies, includeSecrets } = request.body as {
        scope?: string;
        includeDependencies?: boolean;
        includeSecrets?: boolean;
      };

      const auditScope = (scope as 'full' | 'recent' | 'critical-only') || 'full';
      const audit = await securityScanner.performSecurityAudit(auditScope);

      reply.send({
        success: true,
        data: audit
      });
    } catch (error) {
      console.error('Security audit error:', error);
      reply.status(500).send({
        success: false,
        error: {
          code: 'AUDIT_FAILED',
          message: error instanceof Error ? error.message : 'Failed to perform security audit'
        }
      });
    }
  });

  // GET /api/security/issues - Get security issues with filtering
  app.get('/security/issues', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          severity: {
            type: 'string',
            enum: ['critical', 'high', 'medium', 'low']
          },
          type: { type: 'string' },
          status: {
            type: 'string',
            enum: ['open', 'resolved', 'acknowledged', 'false-positive']
          },
          limit: { type: 'number', default: 50 },
          offset: { type: 'number', default: 0 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { severity, type, status, limit, offset } = request.query as {
        severity?: string;
        type?: string;
        status?: string;
        limit?: number;
        offset?: number;
      };

      const filters = {
        severity: severity ? [severity] : undefined,
        status: status ? [status as 'open' | 'resolved' | 'acknowledged' | 'false-positive'] : undefined,
        limit: limit || 50,
        offset: offset || 0
      };

      const { issues, total } = await securityScanner.getSecurityIssues(filters);

      reply.send({
        success: true,
        data: issues,
        pagination: {
          page: Math.floor((offset || 0) / (limit || 50)) + 1,
          pageSize: limit || 50,
          total,
          hasMore: (offset || 0) + (limit || 50) < total
        }
      });
    } catch (error) {
      console.error('Security issues retrieval error:', error);
      reply.status(500).send({
        success: false,
        error: {
          code: 'ISSUES_FAILED',
          message: error instanceof Error ? error.message : 'Failed to retrieve security issues'
        }
      });
    }
  });

  // POST /api/security/fix - Generate security fix suggestions
  app.post('/security/fix', {
    schema: {
      body: {
        type: 'object',
        properties: {
          issueId: { type: 'string' },
          vulnerabilityId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { issueId, vulnerabilityId } = request.body as {
        issueId?: string;
        vulnerabilityId?: string;
      };

      if (!issueId && !vulnerabilityId) {
        reply.status(400).send({
          success: false,
          error: {
            code: 'MISSING_ID',
            message: 'Either issueId or vulnerabilityId is required'
          }
        });
        return;
      }

      const targetId = issueId || vulnerabilityId!;
      const fix = await securityScanner.generateSecurityFix(targetId);

      reply.send({
        success: true,
        data: fix
      });
    } catch (error) {
      console.error('Security fix generation error:', error);
      reply.status(500).send({
        success: false,
        error: {
          code: 'FIX_FAILED',
          message: error instanceof Error ? error.message : 'Failed to generate security fix'
        }
      });
    }
  });

  // GET /api/security/compliance - Get compliance status
  app.get('/security/compliance', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          framework: {
            type: 'string',
            enum: ['owasp', 'nist', 'iso27001', 'gdpr']
          },
          scope: { type: 'string', enum: ['full', 'recent'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { framework, scope } = request.query as {
        framework?: string;
        scope?: string;
      };

      const frameworkName = framework || 'owasp';
      const complianceScope = scope || 'full';

      const compliance = await securityScanner.getComplianceStatus(frameworkName, complianceScope);

      reply.send({
        success: true,
        data: compliance
      });
    } catch (error) {
      console.error('Compliance status error:', error);
      reply.status(500).send({
        success: false,
        error: {
          code: 'COMPLIANCE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to generate compliance report'
        }
      });
    }
  });

  // POST /api/security/monitor - Set up security monitoring
  app.post('/security/monitor', {
    schema: {
      body: {
        type: 'object',
        properties: {
          alerts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                threshold: { type: 'number' },
                channels: { type: 'array', items: { type: 'string' } }
              },
              required: ['type', 'severity']
            }
          },
          schedule: { type: 'string', default: 'daily' }
        },
        required: ['alerts']
      }
    }
  }, async (request, reply) => {
    try {
      const { alerts, schedule } = request.body as {
        alerts: any[];
        schedule?: string;
      };

      const monitoringConfig = {
        enabled: true,
        schedule: (schedule as 'hourly' | 'daily' | 'weekly') || 'daily',
        alerts: alerts.map(alert => ({
          type: alert.type,
          severity: alert.severity,
          threshold: alert.threshold || 1,
          channels: alert.channels || ['console']
        }))
      };

      await securityScanner.setupMonitoring(monitoringConfig);

      const monitoring = {
        alerts: alerts.length,
        schedule: monitoringConfig.schedule,
        status: 'active',
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Next daily run
      };

      reply.send({
        success: true,
        data: monitoring
      });
    } catch (error) {
      console.error('Security monitoring setup error:', error);
      reply.status(500).send({
        success: false,
        error: {
          code: 'MONITOR_FAILED',
          message: error instanceof Error ? error.message : 'Failed to set up security monitoring'
        }
      });
    }
  });
}

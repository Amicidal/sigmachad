import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecurityScanner } from '@memento/testing/security/scanner';

describe('SecurityScanner issue suppression', () => {
  let scanner: SecurityScanner;
  const mockDb: any = { falkordbQuery: async () => [] };
  const mockKg: any = {
    createRelationship: async () => {},
    getEntity: async (id: string) => (id === 'file1' ? {
      id: 'file1',
      type: 'file',
      path: 'src/legacy/old.ts',
    } : null)
  };

  beforeEach(() => {
    scanner = new SecurityScanner(mockDb as any, mockKg as any);
    // Add suppression rule via policies: suppress XSS by ruleId
    (scanner as any).policies.addSuppressionRule({
      type: 'issue',
      target: { ruleId: 'XSS_VULNERABILITY' },
      reason: 'unit-test',
      createdBy: 'test'
    });
  });

  it('suppresses matching issues by ruleId and path', async () => {
    // Stub code scanner to emit an XSS issue that should be suppressed
    const xssIssue = {
      id: 'iss-1',
      type: 'securityIssue' as const,
      tool: 'SecurityScanner',
      ruleId: 'XSS_VULNERABILITY',
      severity: 'high' as const,
      title: 'XSS',
      description: 'Potential XSS',
      affectedEntityId: 'file1',
      lineNumber: 1,
      codeSnippet: 'el.innerHTML = userInput',
      remediation: 'sanitize',
      status: 'open' as const,
      discoveredAt: new Date(),
      lastScanned: new Date(),
      confidence: 0.9
    };

    const codeScanSpy = vi.spyOn((scanner as any).codeScanner, 'scan').mockResolvedValue([xssIssue]);

    const result = await scanner.performScan({ entityIds: ['file1'] }, {
      includeSAST: true,
      includeSCA: false,
      includeSecrets: false,
      includeDependencies: false,
      includeCompliance: false,
      severityThreshold: 'low',
      confidenceThreshold: 0,
    });

    expect(Array.isArray(result.issues)).toBe(true);
    // Suppression by ruleId should remove the emitted issue
    expect(result.issues.length).toBe(0);
    codeScanSpy.mockRestore();
  });
});

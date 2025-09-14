import { describe, it, expect, beforeEach } from 'vitest';
import { SecurityScanner } from '../../../src/services/SecurityScanner';

describe('SecurityScanner issue suppression', () => {
  let scanner: SecurityScanner;
  const mockDb: any = { falkordbQuery: async () => [] };
  const mockKg: any = { createRelationship: async () => {} };

  beforeEach(() => {
    scanner = new SecurityScanner(mockDb as any, mockKg as any);
    // Inject suppression rule: suppress XSS in src/legacy/**
    (scanner as any).issueSuppressionRules = [
      { ruleId: 'XSS_VULNERABILITY', path: 'src/legacy/*' }
    ];
  });

  it('suppresses matching issues by ruleId and path', async () => {
    const file: any = {
      id: 'file1',
      type: 'file',
      path: 'src/legacy/old.ts',
    };
    const content = 'document.getElementById("x").innerHTML = userInput;';
    const opts: any = {
      includeSAST: true,
      includeSCA: false,
      includeSecrets: false,
      includeDependencies: false,
      severityThreshold: 'low',
      confidenceThreshold: 0,
    };

    const issues = (scanner as any).scanFileForIssues(content, file, opts);
    expect(Array.isArray(issues)).toBe(true);
    expect(issues.length).toBe(0);
  });
});


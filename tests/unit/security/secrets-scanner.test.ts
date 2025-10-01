/**
 * Unit tests for SecretsScanner
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import { SecretsScanner } from '@memento/testing/security/secrets-scanner';
import { SecurityScanOptions } from '@memento/testing/security/types';

// Mock fs module
vi.mock('fs');

describe('SecretsScanner', () => {
  let scanner: SecretsScanner;

  beforeEach(() => {
    vi.clearAllMocks();
    scanner = new SecretsScanner();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(scanner.initialize()).resolves.not.toThrow();
    });
  });

  describe('scanning', () => {
    const mockOptions: SecurityScanOptions = {
      includeSAST: false,
      includeSCA: false,
      includeSecrets: true,
      includeDependencies: false,
      includeCompliance: false,
      severityThreshold: 'medium',
      confidenceThreshold: 0.7
    };

    it('should detect AWS access keys', async () => {
      const entities = [
        {
          id: 'test-file-1',
          type: 'file',
          path: '/test/aws-config.js'
        }
      ];

      const codeWithSecret = `
        const AWS = require('aws-sdk');
        const accessKeyId = 'AKIAIOSFODNN7EXAMPLE';
        const secretAccessKey = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(codeWithSecret);

      const issues = await scanner.scan(entities, mockOptions);

      expect(issues.length).toBeGreaterThan(0);
      const awsKeyIssue = issues.find(issue => issue.ruleId === 'AWS_ACCESS_KEY');
      expect(awsKeyIssue).toBeDefined();
      expect(awsKeyIssue?.severity).toBe('critical');
    });

    it('should detect GitHub tokens', async () => {
      const entities = [
        {
          id: 'test-file-2',
          type: 'file',
          path: '/test/github-config.js'
        }
      ];

      const codeWithSecret = `
        const githubToken = 'ghp_1234567890abcdef1234567890abcdef12345678';
        const headers = {
          'Authorization': \`Bearer \${githubToken}\`
        };
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(codeWithSecret);

      const issues = await scanner.scan(entities, mockOptions);

      expect(issues.length).toBeGreaterThan(0);
      const githubTokenIssue = issues.find(issue => issue.ruleId === 'GITHUB_TOKEN');
      expect(githubTokenIssue).toBeDefined();
      expect(githubTokenIssue?.severity).toBe('high');
    });

    it('should detect Google API keys', async () => {
      const entities = [
        {
          id: 'test-file-3',
          type: 'file',
          path: '/test/google-config.js'
        }
      ];

      const codeWithSecret = `
        const googleApiKey = 'AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI';
        const mapsUrl = \`https://maps.googleapis.com/maps/api?key=\${googleApiKey}\`;
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(codeWithSecret);

      const issues = await scanner.scan(entities, mockOptions);

      expect(issues.length).toBeGreaterThan(0);
      const googleKeyIssue = issues.find(issue => issue.ruleId === 'GOOGLE_API_KEY');
      expect(googleKeyIssue).toBeDefined();
      expect(googleKeyIssue?.severity).toBe('high');
    });

    it('should detect hardcoded passwords', async () => {
      const entities = [
        {
          id: 'test-file-4',
          type: 'file',
          path: '/test/db-config.js'
        }
      ];

      const codeWithSecret = `
        const dbConfig = {
          host: 'localhost',
          user: 'admin',
          password: 'supersecretpassword123',
          database: 'myapp'
        };
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(codeWithSecret);

      const issues = await scanner.scan(entities, mockOptions);

      expect(issues.length).toBeGreaterThan(0);
      const passwordIssue = issues.find(issue =>
        issue.ruleId === 'HARDCODED_SECRET' || issue.ruleId === 'PASSWORD_IN_CONFIG'
      );
      expect(passwordIssue).toBeDefined();
    });

    it('should detect SSH private keys', async () => {
      const entities = [
        {
          id: 'test-file-5',
          type: 'file',
          path: '/test/ssh-key.txt'
        }
      ];

      const codeWithSecret = `
        -----BEGIN RSA PRIVATE KEY-----
        MIIEpAIBAAKCAQEA7yn3bRHob4ljjHdwztfTazQGFqGUH...
        -----END RSA PRIVATE KEY-----
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(codeWithSecret);

      const issues = await scanner.scan(entities, mockOptions);

      expect(issues.length).toBeGreaterThan(0);
      const sshKeyIssue = issues.find(issue => issue.ruleId === 'SSH_PRIVATE_KEY');
      expect(sshKeyIssue).toBeDefined();
      expect(sshKeyIssue?.severity).toBe('critical');
    });

    it('should detect database URLs with credentials', async () => {
      const entities = [
        {
          id: 'test-file-6',
          type: 'file',
          path: '/test/database.js'
        }
      ];

      const codeWithSecret = `
        const dbUrl = 'postgresql://username:password@localhost:5432/mydb';
        const mongoUrl = 'mongodb://admin:secret@cluster.mongodb.net/database';
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(codeWithSecret);

      const issues = await scanner.scan(entities, mockOptions);

      expect(issues.length).toBeGreaterThan(0);
      const dbUrlIssue = issues.find(issue => issue.ruleId === 'DATABASE_URL');
      expect(dbUrlIssue).toBeDefined();
      expect(dbUrlIssue?.severity).toBe('high');
    });

    it('should detect JWT tokens', async () => {
      const entities = [
        {
          id: 'test-file-7',
          type: 'file',
          path: '/test/jwt.js'
        }
      ];

      const codeWithSecret = `
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(codeWithSecret);

      const issues = await scanner.scan(entities, mockOptions);

      expect(issues.length).toBeGreaterThan(0);
      const jwtIssue = issues.find(issue => issue.ruleId === 'JWT_TOKEN');
      expect(jwtIssue).toBeDefined();
      expect(jwtIssue?.severity).toBe('medium');
    });

    it('should detect Slack tokens', async () => {
      const entities = [
        {
          id: 'test-file-8',
          type: 'file',
          path: '/test/slack.js'
        }
      ];

      const codeWithSecret = `
        const slackToken = 'xoxb-123456789012-123456789012-abcdefghijklmnopqrstuvwx';
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(codeWithSecret);

      const issues = await scanner.scan(entities, mockOptions);

      expect(issues.length).toBeGreaterThan(0);
      const slackTokenIssue = issues.find(issue => issue.ruleId === 'SLACK_TOKEN');
      expect(slackTokenIssue).toBeDefined();
      expect(slackTokenIssue?.severity).toBe('high');
    });

    it('should skip placeholder values', async () => {
      const entities = [
        {
          id: 'test-file-9',
          type: 'file',
          path: '/test/placeholders.js'
        }
      ];

      const codeWithPlaceholders = `
        // Example configuration - replace with your actual values
        const apiKey = 'your-api-key-here';
        const password = 'your-password-here';
        const secret = 'replace-this-secret';
        const token = 'xxx-placeholder-token';
        const dummy = 'example-value';
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(codeWithPlaceholders);

      const issues = await scanner.scan(entities, mockOptions);

      // Should not detect placeholder values as secrets
      expect(issues).toHaveLength(0);
    });

    it('should calculate entropy for better confidence', async () => {
      const entities = [
        {
          id: 'test-file-10',
          type: 'file',
          path: '/test/entropy.js'
        }
      ];

      const codeWithSecret = `
        const highEntropySecret = 'sk_test_4eC39HqLyjWDarjtT1zdp7dc';
        const lowEntropySecret = 'password123';
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(codeWithSecret);

      const issues = await scanner.scan(entities, mockOptions);

      expect(issues.length).toBeGreaterThan(0);

      // Check that issues have metadata about entropy
      for (const issue of issues) {
        expect(issue.metadata).toBeDefined();
        expect(typeof issue.metadata?.entropy).toBe('number');
      }
    });

    it('should skip binary and large files', async () => {
      const entities = [
        {
          id: 'test-file-11',
          type: 'file',
          path: '/test/large-file.txt'
        }
      ];

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 10 * 1024 * 1024 } as any); // 10MB

      const issues = await scanner.scan(entities, mockOptions);

      expect(issues).toHaveLength(0);
    });

    it('should skip node_modules and other ignored directories', async () => {
      const entities = [
        {
          id: 'test-file-12',
          type: 'file',
          path: '/test/node_modules/package/config.js'
        }
      ];

      const codeWithSecret = `
        const secret = 'AKIAIOSFODNN7EXAMPLE';
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(codeWithSecret);

      const issues = await scanner.scan(entities, mockOptions);

      expect(issues).toHaveLength(0);
    });

    it('should handle file read errors gracefully', async () => {
      const entities = [
        {
          id: 'test-file-13',
          type: 'file',
          path: '/test/nonexistent.js'
        }
      ];

      vi.mocked(fs.existsSync).mockReturnValue(false);

      const issues = await scanner.scan(entities, mockOptions);

      expect(issues).toHaveLength(0);
    });

    it('should redact secret values in metadata', async () => {
      const entities = [
        {
          id: 'test-file-14',
          type: 'file',
          path: '/test/redacted.js'
        }
      ];

      const codeWithSecret = `
        const apiKey = 'sk_live_abcdefghijklmnopqrstuvwxyz1234567890';
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(codeWithSecret);

      const issues = await scanner.scan(entities, mockOptions);

      expect(issues.length).toBeGreaterThan(0);
      const issue = issues[0];
      expect(issue.metadata?.redactedValue).toBeDefined();
      expect(issue.metadata?.redactedValue).not.toContain('abcdefghijklmnopqrstuvwxyz1234567890');
      expect(issue.metadata?.redactedValue).toMatch(/^sk_.*\*+.*90$/);
    });

    it('should detect credit card numbers with caution', async () => {
      const entities = [
        {
          id: 'test-file-15',
          type: 'file',
          path: '/test/payment.js'
        }
      ];

      const codeWithPII = `
        const testCard = '4111 1111 1111 1111';
        const visa = '4532-1234-5678-9012';
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(codeWithPII);

      const issues = await scanner.scan(entities, mockOptions);

      // Credit card detection should have lower confidence due to false positives
      const ccIssues = issues.filter(issue => issue.ruleId === 'CREDIT_CARD');
      for (const issue of ccIssues) {
        expect(issue.confidence).toBeLessThan(0.7);
      }
    });

    it('should skip non-file entities', async () => {
      const entities = [
        {
          id: 'test-class-1',
          type: 'class',
          name: 'TestClass'
        }
      ];

      const issues = await scanner.scan(entities, mockOptions);

      expect(issues).toHaveLength(0);
    });
  });
});
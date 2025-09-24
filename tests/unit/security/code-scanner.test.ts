/**
 * Unit tests for CodeScanner
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import { CodeScanner } from '../../../packages/testing/src/security/code-scanner.js';
import { SecurityScanOptions } from '../../../packages/testing/src/security/types.js';

// Mock fs module
vi.mock('fs');

describe('CodeScanner', () => {
  let scanner: CodeScanner;

  beforeEach(() => {
    vi.clearAllMocks();
    scanner = new CodeScanner();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(scanner.initialize()).resolves.not.toThrow();
    });
  });

  describe('scanning', () => {
    const mockOptions: SecurityScanOptions = {
      includeSAST: true,
      includeSCA: false,
      includeSecrets: false,
      includeDependencies: false,
      includeCompliance: false,
      severityThreshold: 'medium',
      confidenceThreshold: 0.7
    };

    it('should scan JavaScript files for SQL injection', async () => {
      const entities = [
        {
          id: 'test-file-1',
          type: 'file',
          path: '/test/vulnerable.js'
        }
      ];

      const vulnerableCode = `
        const userId = req.params.id;
        const query = "SELECT * FROM users WHERE id = " + userId;
        db.execute(query);
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(vulnerableCode);

      const issues = await scanner.scan(entities, mockOptions);

      expect(issues).toHaveLength(1);
      expect(issues[0].ruleId).toBe('SQL_INJECTION');
      expect(issues[0].severity).toBe('critical');
      expect(issues[0].affectedEntityId).toBe('test-file-1');
    });

    it('should scan for XSS vulnerabilities', async () => {
      const entities = [
        {
          id: 'test-file-2',
          type: 'file',
          path: '/test/xss.js'
        }
      ];

      const vulnerableCode = `
        const userInput = req.body.content;
        document.getElementById('content').innerHTML = userInput;
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(vulnerableCode);

      const issues = await scanner.scan(entities, mockOptions);

      expect(issues).toHaveLength(1);
      expect(issues[0].ruleId).toBe('XSS_VULNERABILITY');
      expect(issues[0].severity).toBe('high');
    });

    it('should scan for command injection', async () => {
      const entities = [
        {
          id: 'test-file-3',
          type: 'file',
          path: '/test/command.js'
        }
      ];

      const vulnerableCode = `
        const { exec } = require('child_process');
        const userPath = req.query.path;
        exec("ls " + userPath, (error, stdout) => {
          console.log(stdout);
        });
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(vulnerableCode);

      const issues = await scanner.scan(entities, mockOptions);

      expect(issues).toHaveLength(1);
      expect(issues[0].ruleId).toBe('COMMAND_INJECTION');
      expect(issues[0].severity).toBe('critical');
    });

    it('should scan for weak cryptography', async () => {
      const entities = [
        {
          id: 'test-file-4',
          type: 'file',
          path: '/test/crypto.js'
        }
      ];

      const vulnerableCode = `
        const crypto = require('crypto');
        const hash = crypto.createHash('md5');
        hash.update(password);
        const hashedPassword = hash.digest('hex');
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(vulnerableCode);

      const issues = await scanner.scan(entities, mockOptions);

      expect(issues).toHaveLength(1);
      expect(issues[0].ruleId).toBe('WEAK_CRYPTO');
      expect(issues[0].severity).toBe('medium');
    });

    it('should scan for insecure random number generation', async () => {
      const entities = [
        {
          id: 'test-file-5',
          type: 'file',
          path: '/test/random.js'
        }
      ];

      const vulnerableCode = `
        function generateToken() {
          return Math.random().toString(36).substring(2);
        }
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(vulnerableCode);

      const issues = await scanner.scan(entities, mockOptions);

      expect(issues).toHaveLength(1);
      expect(issues[0].ruleId).toBe('INSECURE_RANDOM');
      expect(issues[0].severity).toBe('medium');
    });

    it('should apply severity threshold filtering', async () => {
      const entities = [
        {
          id: 'test-file-6',
          type: 'file',
          path: '/test/mixed.js'
        }
      ];

      const codeWithMixedIssues = `
        // Critical issue
        const query = "SELECT * FROM users WHERE id = " + userId;

        // Medium issue
        const randomValue = Math.random();
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(codeWithMixedIssues);

      const highThresholdOptions = {
        ...mockOptions,
        severityThreshold: 'high' as const
      };

      const issues = await scanner.scan(entities, highThresholdOptions);

      // Should only find critical issues, not medium
      expect(issues).toHaveLength(1);
      expect(issues[0].ruleId).toBe('SQL_INJECTION');
      expect(issues[0].severity).toBe('critical');
    });

    it('should apply confidence threshold filtering', async () => {
      const entities = [
        {
          id: 'test-file-7',
          type: 'file',
          path: '/test/confidence.js'
        }
      ];

      const vulnerableCode = `
        const query = "SELECT * FROM users WHERE id = " + userId;
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(vulnerableCode);

      const highConfidenceOptions = {
        ...mockOptions,
        confidenceThreshold: 0.95
      };

      const issues = await scanner.scan(entities, highConfidenceOptions);

      // SQL injection rule has confidence 0.9, so should still be included
      expect(issues).toHaveLength(1);
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

    it('should handle file read errors gracefully', async () => {
      const entities = [
        {
          id: 'test-file-8',
          type: 'file',
          path: '/test/nonexistent.js'
        }
      ];

      vi.mocked(fs.existsSync).mockReturnValue(false);

      const issues = await scanner.scan(entities, mockOptions);

      expect(issues).toHaveLength(0);
    });

    it('should skip large files', async () => {
      const entities = [
        {
          id: 'test-file-9',
          type: 'file',
          path: '/test/large.js'
        }
      ];

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 15 * 1024 * 1024 } as any); // 15MB

      const issues = await scanner.scan(entities, mockOptions);

      expect(issues).toHaveLength(0);
    });

    it('should generate proper code snippets with context', async () => {
      const entities = [
        {
          id: 'test-file-10',
          type: 'file',
          path: '/test/context.js'
        }
      ];

      const vulnerableCode = `
        function getUserData(userId) {
          // This is a vulnerable query
          const query = "SELECT * FROM users WHERE id = " + userId;
          return db.execute(query);
        }
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(vulnerableCode);

      const issues = await scanner.scan(entities, mockOptions);

      expect(issues).toHaveLength(1);
      expect(issues[0].codeSnippet).toContain('function getUserData');
      expect(issues[0].codeSnippet).toContain('vulnerable query');
      expect(issues[0].lineNumber).toBeGreaterThan(0);
    });

    it('should apply file type filtering', async () => {
      const entities = [
        {
          id: 'test-file-11',
          type: 'file',
          path: '/test/image.png'
        }
      ];

      const issues = await scanner.scan(entities, mockOptions);

      expect(issues).toHaveLength(0);
    });

    it('should detect XXE vulnerabilities in XML content', async () => {
      const entities = [
        {
          id: 'test-file-12',
          type: 'file',
          path: '/test/xxe.xml'
        }
      ];

      const vulnerableXml = `
        <?xml version="1.0"?>
        <!DOCTYPE root [
          <!ENTITY xxe SYSTEM "file:///etc/passwd">
        ]>
        <root>&xxe;</root>
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(vulnerableXml);

      const issues = await scanner.scan(entities, mockOptions);

      expect(issues).toHaveLength(1);
      expect(issues[0].ruleId).toBe('XXE_INJECTION');
      expect(issues[0].severity).toBe('high');
    });
  });
});
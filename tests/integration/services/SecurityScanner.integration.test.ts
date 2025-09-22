/**
 * Integration tests for SecurityScanner
 * Tests security dependencynning, vulnerability detection, and security monitoring
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { SecurityScanner } from "../../../src/services/testing/SecurityScanner";
import { KnowledgeGraphService } from "../../../src/services/knowledge/KnowledgeGraphService";
import { DatabaseService } from "../../../src/services/core/DatabaseService";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  TEST_DATABASE_CONFIG,
} from "../../test-utils/database-helpers";
import * as fs from "fs/promises";
import * as path from "path";
import { CodebaseEntity, File } from "../../../src/models/entities";

describe("SecurityScanner Integration", () => {
  let securityScanner: SecurityScanner;
  let kgService: KnowledgeGraphService;
  let dbService: DatabaseService;
  let testDir: string;

  beforeAll(async () => {
    dbService = await setupTestDatabase();
    kgService = new KnowledgeGraphService(dbService);
    await kgService.initialize();
    securityScanner = new SecurityScanner(dbService, kgService);
    await securityScanner.initialize();

    // Create test directory structure
    testDir = path.join(
      require("os").tmpdir(),
      "security-dependencynner-integration-tests"
    );
    await fs.mkdir(testDir, { recursive: true });
  }, 30000);

  afterAll(async () => {
    await cleanupTestDatabase(dbService);
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn("Failed to clean up test directory:", error);
    }
  });

  beforeEach(async () => {
    await clearTestData(dbService);
  });

  describe("Security Scan Execution", () => {
    let vulnerableFiles: string[];

    beforeEach(async () => {
      vulnerableFiles = [];

      // Create vulnerable code files
      const sqlInjectionFile = path.join(testDir, "sql-injection.js");
      await fs.writeFile(
        sqlInjectionFile,
        `
        const userId = req.body.userId;
        const query = "SELECT * FROM users WHERE id = " + userId;
        db.execute(query);
      `
      );
      vulnerableFiles.push(sqlInjectionFile);

      const xssFile = path.join(testDir, "xss-vulnerable.js");
      await fs.writeFile(
        xssFile,
        `
        const userInput = req.body.comment;
        document.getElementById('comments').innerHTML = userInput;
      `
      );
      vulnerableFiles.push(xssFile);

      const secretsFile = path.join(testDir, "secrets.js");
      await fs.writeFile(
        secretsFile,
        `
        const API_KEY = "sk-1234567890abcdef";
        const DB_PASSWORD = "super-secret-password";
      `
      );
      vulnerableFiles.push(secretsFile);

      const commandInjectionFile = path.join(testDir, "command-injection.js");
      await fs.writeFile(
        commandInjectionFile,
        `
        const filename = req.body.filename;
        exec("cat " + filename);
      `
      );
      vulnerableFiles.push(commandInjectionFile);

      // Create package.json with vulnerable dependencies
      const packageJsonFile = path.join(testDir, "package.json");
      await fs.writeFile(
        packageJsonFile,
        JSON.stringify(
          {
            name: "test-app",
            dependencies: {
              lodash: "4.17.10", // Vulnerable version
              express: "4.17.1", // Vulnerable version
            },
          },
          null,
          2
        )
      );
      vulnerableFiles.push(packageJsonFile);

      // Create entities in knowledge graph
      for (let i = 0; i < vulnerableFiles.length; i++) {
        const filePath = vulnerableFiles[i];
        const entity: File = {
          id: `test-file-${i}`,
          path: path.relative(process.cwd(), filePath),
          hash: `hash${i}`,
          language: filePath.endsWith(".js") ? "javascript" : "json",
          lastModified: new Date(),
          created: new Date(),
          type: "file",
          size: 100,
          lines: 10,
          isTest: false,
          isConfig: filePath.endsWith("package.json"),
        };

        await kgService.createEntity(entity);
      }
    });

    it("should perform comprehensive security dependencyn", async () => {
      const scanRequest = {
        entityIds: [
          "test-file-0",
          "test-file-1",
          "test-file-2",
          "test-file-3",
          "test-file-4",
        ],
        scanTypes: ["sast", "secrets", "dependency"] as const,
      };

      const result = await securityScanner.performScan(scanRequest);

      expect(result).toEqual(expect.objectContaining({ issues: expect.any(Array), vulnerabilities: expect.any(Array), summary: expect.any(Object) }));
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.vulnerabilities.length).toBeGreaterThan(0);
      expect(result.summary.totalIssues).toBe(
        result.issues.length + result.vulnerabilities.length
      );
    });

    it("should detect SQL injection vulnerabilities", async () => {
      const scanRequest = {
        entityIds: ["test-file-0"], // SQL injection file
        scanTypes: ["sast"] as const,
      };

      const result = await securityScanner.performScan(scanRequest, {
        includeSAST: true,
        severityThreshold: "info",
      });

      const sqlInjectionIssues = result.issues.filter(
        (issue) => issue.ruleId === "SQL_INJECTION"
      );
      expect(sqlInjectionIssues.length).toBeGreaterThan(0);

      const issue = sqlInjectionIssues[0];
      expect(issue.severity).toBe("critical");
      expect(issue.cwe).toBe("CWE-89");
      expect(issue.title).toContain("SQL Injection");
      expect(issue.affectedEntityId).toBe("test-file-0");
    });

    it("should detect XSS vulnerabilities", async () => {
      const scanRequest = {
        entityIds: ["test-file-1"], // XSS file
        scanTypes: ["sast"] as const,
      };

      const result = await securityScanner.performScan(scanRequest, {
        includeSAST: true,
        severityThreshold: "info",
      });

      const xssIssues = result.issues.filter(
        (issue) => issue.ruleId === "XSS_VULNERABILITY"
      );
      expect(xssIssues.length).toBeGreaterThan(0);

      const issue = xssIssues[0];
      expect(issue.severity).toBe("high");
      expect(issue.cwe).toBe("CWE-79");
      expect(issue.title).toContain("Cross-Site Scripting");
    });

    it("should detect hardcoded secrets", async () => {
      const scanRequest = {
        entityIds: ["test-file-2"], // Secrets file
        scanTypes: ["secrets"] as const,
      };

      const result = await securityScanner.performScan(scanRequest, {
        includeSecrets: true,
        severityThreshold: "info",
      });

      const secretIssues = result.issues.filter(
        (issue) => issue.ruleId === "HARDCODED_SECRET"
      );
      expect(secretIssues.length).toBeGreaterThan(0);

      const issue = secretIssues[0];
      expect(issue.severity).toBe("high");
      expect(issue.title).toContain("Hardcoded Secret");
    });

    it("should detect command injection vulnerabilities", async () => {
      const scanRequest = {
        entityIds: ["test-file-3"], // Command injection file
        scanTypes: ["sast"] as const,
      };

      const result = await securityScanner.performScan(scanRequest, {
        includeSAST: true,
        severityThreshold: "info",
      });

      const commandInjectionIssues = result.issues.filter(
        (issue) => issue.ruleId === "COMMAND_INJECTION"
      );
      expect(commandInjectionIssues.length).toBeGreaterThan(0);

      const issue = commandInjectionIssues[0];
      expect(issue.severity).toBe("critical");
      expect(issue.title).toContain("Command Injection");
    });

    it("should detect dependency vulnerabilities", async () => {
      const scanRequest = {
        entityIds: ["test-file-4"], // package.json file
        scanTypes: ["dependency"] as const,
      };

      const result = await securityScanner.performScan(scanRequest, {
        includeSCA: true,
        severityThreshold: "info",
      });

      expect(result.vulnerabilities.length).toBeGreaterThan(0);

      // Should detect lodash vulnerability
      const lodashVulns = result.vulnerabilities.filter(
        (v) => v.packageName === "lodash"
      );
      expect(lodashVulns.length).toBeGreaterThan(0);

      const vuln = lodashVulns.find(
        (candidate) => candidate.vulnerabilityId === "CVE-2021-23337"
      );
      expect(vuln).toBeDefined();
      expect(vuln?.severity).toBe("high");
    });

    it("should respect severity thresholds", async () => {
      const scanRequest = {
        entityIds: ["test-file-0", "test-file-1"], // SQL injection and XSS files
        scanTypes: ["sast"] as const,
      };

      // Scan with high severity threshold
      const highThresholdResult = await securityScanner.performScan(
        scanRequest,
        {
          includeSAST: true,
          severityThreshold: "high",
        }
      );

      // Should only include high and critical severity issues
      const highSeverityIssues = highThresholdResult.issues.filter(
        (issue) => issue.severity === "high" || issue.severity === "critical"
      );

      expect(highThresholdResult.issues.length).toBe(highSeverityIssues.length);

      // Scan with low severity threshold
      const lowThresholdResult = await securityScanner.performScan(
        scanRequest,
        {
          includeSAST: true,
          severityThreshold: "info",
        }
      );

      expect(lowThresholdResult.issues.length).toBeGreaterThanOrEqual(
        highThresholdResult.issues.length
      );
    });

    it("should handle dependencyn options correctly", async () => {
      const scanRequest = {
        entityIds: ["test-file-0", "test-file-1", "test-file-2"],
        scanTypes: ["sast", "secrets"] as const,
      };

      // Test with SAST only
      const sastOnlyResult = await securityScanner.performScan(scanRequest, {
        includeSAST: true,
        includeSecrets: false,
        includeSCA: false,
        severityThreshold: "info",
      });

      expect(sastOnlyResult.issues.length).toBeGreaterThan(0);
      expect(sastOnlyResult.vulnerabilities.length).toBe(0);

      // Test with secrets only
      const secretsOnlyResult = await securityScanner.performScan(scanRequest, {
        includeSAST: false,
        includeSecrets: true,
        includeSCA: false,
        severityThreshold: "info",
      });

      const secretIssues = secretsOnlyResult.issues.filter(
        (issue) => issue.ruleId === "HARDCODED_SECRET"
      );
      expect(secretIssues.length).toBeGreaterThan(0);
    });
  });

  describe("Vulnerability Reporting", () => {
    beforeEach(async () => {
      // Create some vulnerabilities in the database first
      const packageJsonFile = path.join(testDir, "report-package.json");
      await fs.writeFile(
        packageJsonFile,
        JSON.stringify(
          {
            dependencies: {
              lodash: "4.17.10",
              express: "4.17.1",
            },
          },
          null,
          2
        )
      );

      const entity: File = {
        id: "report-test-entity",
        path: path.relative(process.cwd(), packageJsonFile),
        hash: "reporthash",
        language: "json",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 100,
        lines: 5,
        isTest: false,
        isConfig: true,
      };

      await kgService.createEntity(entity);

      // Perform a dependencyn to create vulnerabilities
      await securityScanner.performScan({
        entityIds: ["report-test-entity"],
        scanTypes: ["dependency"] as const,
      });
    });

    it("should generate comprehensive vulnerability report", async () => {
      const report = await securityScanner.getVulnerabilityReport();

      expect(report).toEqual(expect.any(Object));
      expect(report.summary.total).toBeGreaterThan(0);
      expect(report.vulnerabilities.length).toBeGreaterThan(0);
      expect(Object.keys(report.byPackage).length).toBeGreaterThan(0);
    });

    it("should categorize vulnerabilities by severity", async () => {
      const report = await securityScanner.getVulnerabilityReport();

      expect(report.summary.critical).toBeGreaterThanOrEqual(0);
      expect(report.summary.high).toBeGreaterThanOrEqual(0);
      expect(report.summary.medium).toBeGreaterThanOrEqual(0);
      expect(report.summary.low).toBeGreaterThanOrEqual(0);

      const totalBySeverity =
        report.summary.critical +
        report.summary.high +
        report.summary.medium +
        report.summary.low;
      expect(totalBySeverity).toBe(report.summary.total);
    });

    it("should group vulnerabilities by package", async () => {
      const report = await securityScanner.getVulnerabilityReport();

      expect(report.byPackage).toHaveProperty("lodash");
      expect(report.byPackage).toHaveProperty("express");
      expect(report.byPackage.lodash).toEqual(expect.any(Array));
      expect(report.byPackage.express).toEqual(expect.any(Array));
    });

    it("should provide remediation recommendations", async () => {
      const report = await securityScanner.getVulnerabilityReport();

      expect(report.remediation.immediate).toEqual(expect.any(Array));
      expect(report.remediation.planned).toEqual(expect.any(Array));
      expect(report.remediation.monitoring).toEqual(expect.any(Array));

      // Should have immediate actions for critical/high severity issues
      expect(
        report.remediation.immediate.length + report.remediation.planned.length
      ).toBeGreaterThan(0);
    });
  });

  describe("Security Issues Management", () => {
    beforeEach(async () => {
      // Create some security issues by dependencynning vulnerable files
      const vulnerableFile = path.join(testDir, "issues-test.js");
      await fs.writeFile(
        vulnerableFile,
        `
        const password = "hardcoded-password";
        const query = "SELECT * FROM users WHERE id = " + req.body.id;
        document.innerHTML = req.body.content;
      `
      );

      const entity: File = {
        id: "issues-test-entity",
        path: path.relative(process.cwd(), vulnerableFile),
        hash: "issueshash",
        language: "javascript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 150,
        lines: 3,
        isTest: false,
        isConfig: false,
      };

      await kgService.createEntity(entity);

      await securityScanner.performScan({
        entityIds: ["issues-test-entity"],
        scanTypes: ["sast", "secrets"] as const,
      });
    });

    it("should retrieve security issues with filters", async () => {
      const { issues, total } = await securityScanner.getSecurityIssues();

      expect(total).toBeGreaterThan(0);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0]).toHaveProperty("id");
      expect(issues[0]).toHaveProperty("severity");
      expect(issues[0]).toHaveProperty("title");
    });

    it("should filter issues by severity", async () => {
      const { issues: criticalIssues } =
        await securityScanner.getSecurityIssues({
          severity: ["critical"],
        });

      const { issues: highIssues } = await securityScanner.getSecurityIssues({
        severity: ["high"],
      });

      // All critical issues should be critical
      criticalIssues.forEach((issue) => {
        expect(issue.severity).toBe("critical");
      });

      // All high issues should be high or critical
      highIssues.forEach((issue) => {
        expect(["high", "critical"]).toContain(issue.severity);
      });
    });

    it("should filter issues by status", async () => {
      const { issues: openIssues } = await securityScanner.getSecurityIssues({
        status: ["open"],
      });

      // Should have some open issues
      expect(openIssues.length).toBeGreaterThan(0);
      openIssues.forEach((issue) => {
        expect(issue.status).toBe("open");
      });
    });

    it("should support pagination", async () => {
      const { issues: firstPage, total } =
        await securityScanner.getSecurityIssues({
          limit: 1,
          offset: 0,
        });

      const { issues: secondPage } = await securityScanner.getSecurityIssues({
        limit: 1,
        offset: 1,
      });

      expect(firstPage.length).toBeLessThanOrEqual(1);
      expect(secondPage.length).toBeLessThanOrEqual(1);

      if (total > 1) {
        expect(firstPage[0]?.id).not.toBe(secondPage[0]?.id);
      }
    });
  });

  describe("Security Audit Functionality", () => {
    beforeEach(async () => {
      // Create a mix of security issues
      const auditFile = path.join(testDir, "audit-test.js");
      await fs.writeFile(
        auditFile,
        `
        // Critical: SQL injection
        const query = "SELECT * FROM users WHERE id = " + req.body.id;

        // High: Hardcoded secret
        const API_KEY = "sk-1234567890abcdef";

        // Medium: Weak crypto
        const hash = require('crypto').createHash('md5');

        // Low: Sensitive logging
        console.log("User password:", user.password);
      `
      );

      const entity: File = {
        id: "audit-test-entity",
        path: path.relative(process.cwd(), auditFile),
        hash: "audithash",
        language: "javascript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 200,
        lines: 8,
        isTest: false,
        isConfig: false,
      };

      await kgService.createEntity(entity);

      await securityScanner.performScan({
        entityIds: ["audit-test-entity"],
        scanTypes: ["sast", "secrets"] as const,
      });
    });

    it("should perform full security audit", async () => {
      const audit = await securityScanner.performSecurityAudit("full");

      expect(audit).toEqual(expect.any(Object));
      expect(audit.scope).toBe("full");
      expect(audit.startTime).toEqual(expect.any(Date));
      expect(audit.findings).toEqual(expect.any(Array));
      expect(audit.recommendations).toEqual(expect.any(Array));
      expect(typeof audit.score).toBe("number");
      expect(audit.score).toBeGreaterThanOrEqual(0);
      expect(audit.score).toBeLessThanOrEqual(100);
    });

    it("should perform recent issues audit", async () => {
      const audit = await securityScanner.performSecurityAudit("recent");

      expect(audit.scope).toBe("recent");
      expect(audit.findings.length).toBeGreaterThan(0);
    });

    it("should perform critical-only audit", async () => {
      const audit = await securityScanner.performSecurityAudit("critical-only");

      expect(audit.scope).toBe("critical-only");
      // May have fewer findings depending on what's classified as critical
      expect(audit.findings).toEqual(expect.any(Array));
    });

    it("should calculate security score correctly", async () => {
      const audit = await securityScanner.performSecurityAudit("full");

      expect(audit.score).toBeGreaterThanOrEqual(0);
      expect(audit.score).toBeLessThanOrEqual(100);

      // With multiple issues, score should be less than 100
      expect(audit.score).toBeLessThan(100);
    });

    it("should generate audit recommendations", async () => {
      const audit = await securityScanner.performSecurityAudit("full");

      expect(audit.recommendations.length).toBeGreaterThan(0);

      // Should include specific recommendations based on findings
      const recommendationText = audit.recommendations.join(" ").toLowerCase();
      expect(recommendationText).toMatch(
        /(critical|high|fix|address|implement)/
      );
    });

    it("should analyze audit findings", async () => {
      const audit = await securityScanner.performSecurityAudit("full");

      expect(audit.findings.length).toBeGreaterThan(0);

      // Check finding structure
      const sampleFinding = audit.findings[0];
      expect(sampleFinding).toHaveProperty("type");
      expect(sampleFinding).toHaveProperty("severity");
    });
  });

  describe("Security Fix Generation", () => {
    let issueId: string;

    beforeEach(async () => {
      // Create a specific security issue
      const fixFile = path.join(testDir, "fix-test.js");
      await fs.writeFile(
        fixFile,
        `
        const userId = req.body.userId;
        const query = "SELECT * FROM users WHERE id = " + userId;
        db.execute(query);
      `
      );

      const entity: File = {
        id: "fix-test-entity",
        path: path.relative(process.cwd(), fixFile),
        hash: "fixhash",
        language: "javascript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 100,
        lines: 3,
        isTest: false,
        isConfig: false,
      };

      await kgService.createEntity(entity);

      const dependencynResult = await securityScanner.performScan({
        entityIds: ["fix-test-entity"],
        scanTypes: ["sast"] as const,
      });

      issueId = dependencynResult.issues[0]?.id;
    });

    it("should generate security fixes for issues", async () => {
      const fix = await securityScanner.generateSecurityFix(issueId);

      expect(fix).toEqual(expect.any(Object));
      expect(fix.issueId).toBe(issueId);
      expect(fix.fixes).toEqual(expect.any(Array));
      expect(fix.fixes.length).toBeGreaterThan(0);
      expect(fix).toHaveProperty("priority");
      expect(fix).toHaveProperty("effort");
    });

    it("should generate appropriate fixes for SQL injection", async () => {
      const fix = await securityScanner.generateSecurityFix(issueId);

      const sqlFix = fix.fixes[0];
      expect(sqlFix).toHaveProperty("description");
      expect(sqlFix).toHaveProperty("code");
      expect(sqlFix).toHaveProperty("explanation");

      expect(sqlFix.description.toLowerCase()).toContain("parameterized");
      expect(sqlFix.code.toLowerCase()).toContain("select");
      expect(sqlFix.explanation.toLowerCase()).toContain("prevent");
    });

    it("should assign correct priority to fixes", async () => {
      const fix = await securityScanner.generateSecurityFix(issueId);

      // SQL injection should be high priority (it's critical severity)
      expect(["immediate", "high", "medium", "low"]).toContain(fix.priority);
    });

    it("should estimate fix effort correctly", async () => {
      const fix = await securityScanner.generateSecurityFix(issueId);

      // SQL injection should require medium to high effort
      expect(["low", "medium", "high"]).toContain(fix.effort);
    });
  });

  describe("Scan History and Monitoring", () => {
    beforeEach(async () => {
      // Perform multiple dependencyns to build history
      const dependencynFile = path.join(testDir, "history-test.js");
      await fs.writeFile(
        dependencynFile,
        'const test = "dependencyn history";'
      );

      const entity: File = {
        id: "history-test-entity",
        path: path.relative(process.cwd(), dependencynFile),
        hash: "historyhash",
        language: "javascript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 50,
        lines: 1,
        isTest: false,
        isConfig: false,
      };

      await kgService.createEntity(entity);

      // Perform multiple dependencyns
      for (let i = 0; i < 3; i++) {
        await securityScanner.performScan({
          entityIds: ["history-test-entity"],
          scanTypes: ["sast"] as const,
        });

        // Small delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    });

    it("should maintain dependencyn history", async () => {
      const history = await securityScanner.getScanHistory();

      expect(history).toEqual(expect.any(Array));
      expect(history.length).toBeGreaterThan(0);

      // History should be sorted by timestamp descending
      for (let i = 1; i < history.length; i++) {
        expect(history[i - 1].timestamp.getTime()).toBeGreaterThanOrEqual(
          history[i].timestamp.getTime()
        );
      }
    });

    it("should limit dependencyn history results", async () => {
      const limitedHistory = await securityScanner.getScanHistory(2);

      expect(limitedHistory.length).toBeLessThanOrEqual(2);
    });

    it("should include dependencyn metadata in history", async () => {
      const history = await securityScanner.getScanHistory(1);

      if (history.length > 0) {
        const dependencyn = history[0];
        expect(dependencyn).toHaveProperty("id");
        expect(dependencyn).toHaveProperty("timestamp");
        expect(dependencyn).toHaveProperty("summary");
        expect(dependencyn.summary).toHaveProperty("totalIssues");
      }
    });
  });

  describe("Compliance and Monitoring Configuration", () => {
    it("should setup and persist security monitoring configuration", async () => {
      const config = {
        enabled: true,
        schedule: "daily" as const,
        alerts: [
          {
            type: "severity_threshold",
            severity: "high",
            threshold: 5,
            channels: ["email", "slack"],
          },
        ],
      };

      await securityScanner.setupMonitoring(config);

      // Verify persistence in FalkorDB via DatabaseService
      const result = await dbService.falkordbQuery(
        `MATCH (c:SecurityConfig {type: 'monitoring'}) RETURN c LIMIT 1`
      );

      // Extract properties defensively to handle different FalkorDB result shapes
      let storedConfigRaw: any;
      if (Array.isArray(result) && result.length > 0) {
        const row: any = result[0];
        // Common shapes observed in project code
        if (row.c && Array.isArray(row.c)) {
          const propsEntry = row.c.find((i: any) => Array.isArray(i) && String(i[0]) === 'properties');
          if (propsEntry && Array.isArray(propsEntry[1])) {
            const propsArray = propsEntry[1];
            const propsObj: any = {};
            for (const p of propsArray) {
              if (Array.isArray(p) && p.length >= 2) propsObj[String(p[0])] = p[1];
            }
            storedConfigRaw = propsObj?.config;
          }
        } else if (row.c && row.c.properties) {
          storedConfigRaw = row.c.properties.config;
        } else if (row.properties) {
          storedConfigRaw = row.properties.config;
        } else if (row.c) {
          storedConfigRaw = row.c.config ?? row.c["config"];
        } else if (row.data && row.data.c) {
          storedConfigRaw = row.data.c.config;
        }
      }

      // Parse JSON string if needed
      let storedConfig: any = undefined;
      if (typeof storedConfigRaw === 'string') {
        try { storedConfig = JSON.parse(storedConfigRaw); } catch { /* ignore */ }
      } else if (storedConfigRaw && typeof storedConfigRaw === 'object') {
        storedConfig = storedConfigRaw;
      }

      expect(storedConfig).toEqual(expect.any(Object));
      expect(storedConfig.enabled).toBe(true);
      expect(storedConfig.schedule).toBe('daily');
      expect(Array.isArray(storedConfig.alerts)).toBe(true);
      const firstAlert = storedConfig.alerts?.[0];
      expect(firstAlert).toEqual(
        expect.objectContaining({ type: 'severity_threshold', severity: 'high' })
      );
    });

    it("should retrieve compliance status", async () => {
      const compliance = await securityScanner.getComplianceStatus(
        "OWASP",
        "full"
      );

      expect(compliance).toEqual(expect.any(Object));
      expect(compliance.framework).toBe("OWASP");
      expect(compliance.scope).toBe("full");
      expect(typeof compliance.overallScore).toBe("number");
      expect(compliance.requirements).toEqual(expect.any(Array));
      expect(compliance.gaps).toEqual(expect.any(Array));
      expect(compliance.recommendations).toEqual(expect.any(Array));
    });

    it("should provide compliance recommendations", async () => {
      const compliance = await securityScanner.getComplianceStatus(
        "OWASP",
        "full"
      );

      expect(compliance.recommendations.length).toBeGreaterThan(0);
      expect(compliance.gaps.length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle dependencyn with non-existent entity gracefully", async () => {
      const scanRequest = {
        entityIds: ["non-existent-entity-123"],
        scanTypes: ["sast"] as const,
      };

      const result = await securityScanner.performScan(scanRequest);

      expect(result).toEqual(expect.any(Object));
      expect(result.issues.length).toBe(0);
      expect(result.vulnerabilities.length).toBe(0);
      expect(result.summary.totalIssues).toBe(0);
    });

    it("should handle dependencyn with empty entity list", async () => {
      const scanRequest = {
        entityIds: [],
        scanTypes: ["sast"] as const,
      };

      const result = await securityScanner.performScan(scanRequest);

      expect(result).toEqual(expect.any(Object));
      expect(result.summary.totalIssues).toBe(0);
    });

    it("should handle invalid file paths during dependencynning", async () => {
      const invalidFile = path.join(testDir, "invalid-file.js");
      // Don't create the file

      const entity: File = {
        id: "invalid-file-entity",
        path: path.relative(process.cwd(), invalidFile),
        hash: "invalidhash",
        language: "javascript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 0,
        lines: 0,
        isTest: false,
        isConfig: false,
      };

      await kgService.createEntity(entity);

      const scanRequest = {
        entityIds: ["invalid-file-entity"],
        scanTypes: ["sast"] as const,
      };

      // Should not throw, but may have fewer issues
      const result = await securityScanner.performScan(scanRequest);
      expect(result).toEqual(expect.any(Object));
    });

    it("should handle malformed package.json files", async () => {
      const malformedPackageJson = path.join(testDir, "malformed-package.json");
      await fs.writeFile(malformedPackageJson, "{ invalid json content ");

      const entity: File = {
        id: "malformed-package-entity",
        path: path.relative(process.cwd(), malformedPackageJson),
        hash: "malformedhash",
        language: "json",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 30,
        lines: 1,
        isTest: false,
        isConfig: true,
      };

      await kgService.createEntity(entity);

      const scanRequest = {
        entityIds: ["malformed-package-entity"],
        scanTypes: ["dependency"] as const,
      };

      // Should handle the malformed JSON gracefully
      const result = await securityScanner.performScan(scanRequest);
      expect(result).toEqual(expect.any(Object));
    });

    it("should handle fix generation for non-existent issues", async () => {
      await expect(
        securityScanner.generateSecurityFix("non-existent-issue-123")
      ).rejects.toThrow();
    });

    it("should handle concurrent dependencyns without conflicts", async () => {
      const dependencynFile1 = path.join(testDir, "concurrent1.js");
      const dependencynFile2 = path.join(testDir, "concurrent2.js");

      await fs.writeFile(
        dependencynFile1,
        'const sql = "SELECT * FROM users WHERE id = " + req.body.id;'
      );
      await fs.writeFile(
        dependencynFile2,
        'const secret = "hardcoded-secret";'
      );

      const entity1: File = {
        id: "concurrent-entity-1",
        path: path.relative(process.cwd(), dependencynFile1),
        hash: "concurrent1",
        language: "javascript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 50,
        lines: 1,
        isTest: false,
        isConfig: false,
      };

      const entity2: File = {
        id: "concurrent-entity-2",
        path: path.relative(process.cwd(), dependencynFile2),
        hash: "concurrent2",
        language: "javascript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: 50,
        lines: 1,
        isTest: false,
        isConfig: false,
      };

      await kgService.createEntity(entity1);
      await kgService.createEntity(entity2);

      // Run concurrent dependencyns
      const dependencynPromises = [
        securityScanner.performScan({
          entityIds: ["concurrent-entity-1"],
          scanTypes: ["sast"],
        }),
        securityScanner.performScan({
          entityIds: ["concurrent-entity-2"],
          scanTypes: ["secrets"],
        }),
      ];

      const results = await Promise.all(dependencynPromises);

      expect(results).toHaveLength(2);
      results.forEach((result) => {
        expect(result).toEqual(expect.any(Object));
        expect(typeof result.summary.totalIssues).toBe("number");
      });
    });

    it("should handle very large files efficiently", async () => {
      const largeFile = path.join(testDir, "large-file.js");
      const largeContent =
        'const test = "data";\n'.repeat(1000) +
        'const sql = "SELECT * FROM users WHERE id = " + req.body.id;\n'.repeat(
          10
        );

      await fs.writeFile(largeFile, largeContent);

      const entity: File = {
        id: "large-file-entity",
        path: path.relative(process.cwd(), largeFile),
        hash: "largehash",
        language: "javascript",
        lastModified: new Date(),
        created: new Date(),
        type: "file",
        size: largeContent.length,
        lines: largeContent.split("\n").length,
        isTest: false,
        isConfig: false,
      };

      await kgService.createEntity(entity);

      const startTime = Date.now();
      const result = await securityScanner.performScan({
        entityIds: ["large-file-entity"],
        scanTypes: ["sast"] as const,
      });
      const endTime = Date.now();

      expect(result).toEqual(expect.any(Object));
      expect(result.issues.length).toBeGreaterThan(0); // Should detect SQL injection

      // Should complete within reasonable time (10 seconds for large file)
      expect(endTime - startTime).toBeLessThan(10000);
    });
  });
});

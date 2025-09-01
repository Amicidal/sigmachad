/**
 * Security Scanner Service Unit Tests
 * Tests for security scanning, vulnerability detection, and monitoring
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { SecurityScanner } from '../src/services/SecurityScanner.js';
import { DatabaseService, createDatabaseConfig } from '../src/services/DatabaseService.js';
import { KnowledgeGraphService } from '../src/services/KnowledgeGraphService.js';
describe('SecurityScanner', () => {
    let dbService;
    let kgService;
    let securityScanner;
    beforeAll(async () => {
        const dbConfig = createDatabaseConfig();
        dbService = new DatabaseService(dbConfig);
        await dbService.initialize();
        kgService = new KnowledgeGraphService(dbService);
        await kgService.initialize();
        securityScanner = new SecurityScanner(dbService, kgService);
    }, 30000);
    afterAll(async () => {
        await dbService.close();
    }, 10000);
    beforeEach(async () => {
        // Clean up test data
        await dbService.falkordbQuery('MATCH (n) WHERE n.id STARTS WITH "security_test_" DELETE n').catch(() => { });
        await dbService.falkordbQuery('MATCH ()-[r]-() WHERE r.id STARTS WITH "security_test_" DELETE r').catch(() => { });
    });
    describe('Initialization', () => {
        it('should initialize successfully', () => {
            expect(securityScanner).toBeDefined();
            expect(securityScanner).toBeInstanceOf(SecurityScanner);
        });
    });
    describe('Security Scan Execution', () => {
        const testFile = {
            id: 'security_test_file_1',
            type: 'file',
            path: '/test/vulnerable.js',
            hash: 'test_hash',
            language: 'javascript',
            lastModified: new Date(),
            created: new Date(),
            extension: '.js',
            size: 1024,
            lines: 50,
            isTest: false,
            isConfig: false,
            dependencies: []
        };
        it('should execute a security scan', async () => {
            await kgService.createEntity(testFile);
            const result = await securityScanner.performScan({
                entityIds: [testFile.id],
                scanTypes: ['sast'],
                severity: ['low', 'medium', 'high', 'critical']
            });
            expect(result).toBeDefined();
            expect(Array.isArray(result.issues)).toBe(true);
            expect(Array.isArray(result.vulnerabilities)).toBe(true);
            expect(result.summary).toBeDefined();
            expect(typeof result.summary.totalIssues).toBe('number');
        });
        it('should handle scan with no issues found', async () => {
            const result = await securityScanner.performScan({
                entityIds: [],
                scanTypes: ['sast'],
                severity: ['critical']
            });
            expect(result).toBeDefined();
            expect(result.issues.length).toBe(0);
            expect(result.vulnerabilities.length).toBe(0);
        });
        it('should get vulnerability report', async () => {
            const report = await securityScanner.getVulnerabilityReport();
            expect(report).toBeDefined();
            expect(report.summary).toBeDefined();
            expect(typeof report.summary.total).toBe('number');
            expect(Array.isArray(report.vulnerabilities)).toBe(true);
        });
        it('should perform security audit', async () => {
            const auditResult = await securityScanner.performSecurityAudit();
            expect(auditResult).toBeDefined();
            expect(auditResult.score).toBeDefined();
            expect(typeof auditResult.score).toBe('number');
            expect(auditResult.score).toBeGreaterThanOrEqual(0);
            expect(auditResult.score).toBeLessThanOrEqual(100);
            expect(Array.isArray(auditResult.findings)).toBe(true);
        });
        it('should get scan history', async () => {
            const history = await securityScanner.getScanHistory();
            expect(Array.isArray(history)).toBe(true);
        });
        it('should get compliance status', async () => {
            const compliance = await securityScanner.getComplianceStatus('owasp', 'full');
            expect(compliance).toBeDefined();
            expect(compliance.framework).toBe('owasp');
            expect(typeof compliance.overallScore).toBe('number');
            expect(Array.isArray(compliance.gaps)).toBe(true);
        });
        it('should setup security monitoring', async () => {
            const config = {
                enabled: true,
                schedule: 'daily',
                alerts: [{
                        type: 'vulnerability',
                        severity: 'high',
                        threshold: 5,
                        channels: ['email']
                    }]
            };
            await expect(securityScanner.setupMonitoring(config)).resolves.not.toThrow();
        });
        it('should get security issues', async () => {
            const issuesResult = await securityScanner.getSecurityIssues({
                severity: ['critical', 'high'],
                limit: 10
            });
            expect(issuesResult).toBeDefined();
            expect(typeof issuesResult.total).toBe('number');
            expect(Array.isArray(issuesResult.issues)).toBe(true);
            issuesResult.issues.forEach((issue) => {
                expect(['critical', 'high', 'medium', 'low', 'info']).toContain(issue.severity);
            });
        });
        it('should handle database errors gracefully', async () => {
            // Mock database failure
            const originalQuery = dbService.falkordbQuery;
            dbService.falkordbQuery = jest.fn().mockImplementation(() => {
                throw new Error('Database error');
            });
            const scanOptions = {
                entityIds: [testFile.id],
                scanTypes: ['sast'],
                severity: ['low', 'medium', 'high', 'critical']
            };
            await expect(securityScanner.performScan(scanOptions)).rejects.toThrow('Database error');
            // Restore original method
            dbService.falkordbQuery = originalQuery;
        });
        it('should handle concurrent security scans', async () => {
            const scanOptions = {
                entityIds: [],
                scanTypes: ['sast'],
                severity: ['low', 'medium', 'high', 'critical']
            };
            // Run multiple scans concurrently
            const scanPromises = [
                securityScanner.performScan(scanOptions),
                securityScanner.performScan(scanOptions),
                securityScanner.performScan(scanOptions)
            ];
            const results = await Promise.all(scanPromises);
            expect(results.length).toBe(3);
            results.forEach(result => {
                expect(result).toBeDefined();
                expect(Array.isArray(result.issues)).toBe(true);
            });
        });
    });
});
//# sourceMappingURL=security-scanner.test.js.map
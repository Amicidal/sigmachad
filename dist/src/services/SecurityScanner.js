/**
 * Security Scanner Service for Memento
 * Performs security scanning, vulnerability detection, and security monitoring
 */
import { EventEmitter } from 'events';
import * as fs from 'fs';
export class SecurityScanner extends EventEmitter {
    db;
    kgService;
    rules = [];
    monitoringConfig = null;
    scanHistory = new Map();
    constructor(db, kgService) {
        super();
        this.db = db;
        this.kgService = kgService;
        this.initializeSecurityRules();
    }
    async initialize() {
        console.log('🔒 Initializing Security Scanner...');
        // Ensure security-related graph schema exists
        await this.ensureSecuritySchema();
        // Load monitoring configuration if exists
        await this.loadMonitoringConfig();
        console.log('✅ Security Scanner initialized');
    }
    initializeSecurityRules() {
        // SAST Rules - Static Application Security Testing
        this.rules = [
            // SQL Injection patterns
            {
                id: 'SQL_INJECTION',
                name: 'SQL Injection Vulnerability',
                description: 'Potential SQL injection vulnerability detected',
                severity: 'critical',
                cwe: 'CWE-89',
                owasp: 'A03:2021-Injection',
                pattern: /\b(execute|query|raw)\s*\(\s*.*\+.*\)/gi,
                category: 'sast',
                remediation: 'Use parameterized queries or prepared statements instead of string concatenation'
            },
            // Cross-Site Scripting patterns
            {
                id: 'XSS_VULNERABILITY',
                name: 'Cross-Site Scripting (XSS)',
                description: 'Potential XSS vulnerability in user input handling',
                severity: 'high',
                cwe: 'CWE-79',
                owasp: 'A03:2021-Injection',
                pattern: /\b(innerHTML|outerHTML|document\.write)\s*.*\+.*\)/gi,
                category: 'sast',
                remediation: 'Use textContent or properly sanitize HTML input'
            },
            // Hardcoded secrets patterns
            {
                id: 'HARDCODED_SECRET',
                name: 'Hardcoded Secret',
                description: 'Potential hardcoded secret or credential',
                severity: 'high',
                cwe: 'CWE-798',
                owasp: 'A05:2021-Security Misconfiguration',
                pattern: /(password|secret|key|token)\s*[:=]\s*['"][^'"]{10,}['"]/gi,
                category: 'secrets',
                remediation: 'Move secrets to environment variables or secure key management system'
            },
            // Command injection patterns
            {
                id: 'COMMAND_INJECTION',
                name: 'Command Injection',
                description: 'Potential command injection vulnerability',
                severity: 'critical',
                cwe: 'CWE-78',
                owasp: 'A03:2021-Injection',
                pattern: /\b(exec|spawn|eval)\s*\(\s*.*\+.*\)/gi,
                category: 'sast',
                remediation: 'Validate and sanitize input, use safe APIs'
            },
            // Path traversal patterns
            {
                id: 'PATH_TRAVERSAL',
                name: 'Path Traversal',
                description: 'Potential path traversal vulnerability',
                severity: 'high',
                cwe: 'CWE-22',
                owasp: 'A01:2021-Broken Access Control',
                pattern: /\.\.[\/\\]/gi,
                category: 'sast',
                remediation: 'Validate file paths and use path.join with proper validation'
            },
            // Insecure random number generation
            {
                id: 'INSECURE_RANDOM',
                name: 'Insecure Random Number Generation',
                description: 'Use of insecure random number generation',
                severity: 'medium',
                cwe: 'CWE-338',
                owasp: 'A02:2021-Cryptographic Failures',
                pattern: /\bMath\.random\(\)/gi,
                category: 'sast',
                remediation: 'Use crypto.randomBytes() or crypto.randomInt() for secure random generation'
            },
            // Console.log with sensitive data
            {
                id: 'SENSITIVE_LOGGING',
                name: 'Sensitive Data in Logs',
                description: 'Potential logging of sensitive information',
                severity: 'medium',
                cwe: 'CWE-532',
                owasp: 'A09:2021-Security Logging and Monitoring Failures',
                pattern: /console\.(log|info|debug)\s*\(\s*.*(?:password|secret|token|key).*\)/gi,
                category: 'sast',
                remediation: 'Remove sensitive data from logs or use structured logging with filtering'
            },
            // Weak cryptography
            {
                id: 'WEAK_CRYPTO',
                name: 'Weak Cryptographic Algorithm',
                description: 'Use of weak cryptographic algorithms',
                severity: 'medium',
                cwe: 'CWE-327',
                owasp: 'A02:2021-Cryptographic Failures',
                pattern: /\b(md5|sha1)\s*\(/gi,
                category: 'sast',
                remediation: 'Use strong cryptographic algorithms like SHA-256, AES-256'
            },
            // Missing input validation
            {
                id: 'MISSING_VALIDATION',
                name: 'Missing Input Validation',
                description: 'Potential missing input validation',
                severity: 'medium',
                cwe: 'CWE-20',
                owasp: 'A03:2021-Injection',
                pattern: /\b(req\.body|req\.query|req\.params)\s*\[\s*['"][^'"]*['"]\s*\]/gi,
                category: 'sast',
                remediation: 'Add proper input validation and sanitization'
            }
        ];
    }
    async ensureSecuritySchema() {
        // Create graph constraints for security entities
        try {
            await this.db.falkordbQuery(`
        CREATE CONSTRAINT ON (si:SecurityIssue) ASSERT si.id IS UNIQUE
      `, {});
            await this.db.falkordbQuery(`
        CREATE CONSTRAINT ON (v:Vulnerability) ASSERT v.id IS UNIQUE
      `, {});
        }
        catch (error) {
            // Constraints might already exist, continue
            console.log('Security schema constraints check completed');
        }
    }
    async loadMonitoringConfig() {
        try {
            const config = await this.db.falkordbQuery(`
        MATCH (c:SecurityConfig {type: 'monitoring'})
        RETURN c.config as config
      `, {});
            if (config && config.length > 0) {
                this.monitoringConfig = JSON.parse(config[0].config);
            }
        }
        catch (error) {
            console.log('No existing monitoring configuration found');
        }
    }
    async performScan(request, options = {}) {
        const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`🔍 Starting security scan: ${scanId}`);
        const scanOptions = {
            includeSAST: true,
            includeSCA: true,
            includeSecrets: true,
            includeDependencies: true,
            severityThreshold: 'info',
            confidenceThreshold: 0.5,
            ...options
        };
        const result = {
            issues: [],
            vulnerabilities: [],
            summary: {
                totalIssues: 0,
                bySeverity: {},
                byType: {}
            }
        };
        try {
            // Get entities to scan
            const entities = await this.getEntitiesToScan(request.entityIds);
            // Perform different types of scans
            if (scanOptions.includeSAST) {
                const sastIssues = await this.performSASTScan(entities, scanOptions);
                result.issues.push(...sastIssues);
            }
            if (scanOptions.includeSCA) {
                const scaVulnerabilities = await this.performSCAScan(entities, scanOptions);
                result.vulnerabilities.push(...scaVulnerabilities);
            }
            if (scanOptions.includeSecrets) {
                const secretIssues = await this.performSecretsScan(entities, scanOptions);
                result.issues.push(...secretIssues);
            }
            if (scanOptions.includeDependencies) {
                const depVulnerabilities = await this.performDependencyScan(entities, scanOptions);
                result.vulnerabilities.push(...depVulnerabilities);
            }
            // Generate summary
            this.generateScanSummary(result);
            // Store scan results
            await this.storeScanResults(scanId, request, result);
            // Emit scan completed event
            this.emit('scan.completed', { scanId, result });
            console.log(`✅ Security scan completed: ${scanId} - Found ${result.summary.totalIssues} issues`);
            return result;
        }
        catch (error) {
            console.error(`❌ Security scan failed: ${scanId}`, error);
            this.emit('scan.failed', { scanId, error });
            throw error;
        }
    }
    async getEntitiesToScan(entityIds) {
        if (entityIds && entityIds.length > 0) {
            // Get entities one by one since getEntitiesByIds doesn't exist
            const entities = [];
            for (const id of entityIds) {
                const entity = await this.kgService.getEntity(id);
                if (entity) {
                    entities.push(entity);
                }
            }
            return entities;
        }
        // Get all file entities
        const query = `
      MATCH (f:File)
      RETURN f
      LIMIT 100
    `;
        const results = await this.db.falkordbQuery(query, {});
        return results.map((result) => ({
            ...result.f,
            type: 'file'
        }));
    }
    async performSASTScan(entities, options) {
        const issues = [];
        for (const entity of entities) {
            // Type guard for File entities
            if (!('type' in entity) || entity.type !== 'file' || !entity.path)
                continue;
            const fileEntity = entity;
            try {
                const content = await this.readFileContent(fileEntity.path);
                if (!content)
                    continue;
                const fileIssues = this.scanFileForIssues(content, fileEntity, options);
                issues.push(...fileIssues);
            }
            catch (error) {
                console.warn(`Failed to scan file ${fileEntity.path}:`, error);
            }
        }
        return issues;
    }
    async performSCAScan(entities, options) {
        // For now, perform basic SCA on package.json files
        const vulnerabilities = [];
        for (const entity of entities) {
            // Type guard for File entities
            if (!('type' in entity) || entity.type !== 'file' || !entity.path?.endsWith('package.json'))
                continue;
            const fileEntity = entity;
            try {
                const content = await this.readFileContent(fileEntity.path);
                if (!content)
                    continue;
                const deps = JSON.parse(content).dependencies || {};
                const devDeps = JSON.parse(content).devDependencies || {};
                const allDeps = { ...deps, ...devDeps };
                for (const [packageName, version] of Object.entries(allDeps)) {
                    const vulns = await this.checkPackageVulnerabilities(packageName, version);
                    vulnerabilities.push(...vulns);
                }
            }
            catch (error) {
                console.warn(`Failed to scan dependencies in ${fileEntity.path}:`, error);
            }
        }
        return vulnerabilities;
    }
    async performSecretsScan(entities, options) {
        const issues = [];
        for (const entity of entities) {
            // Type guard for File entities
            if (!('type' in entity) || entity.type !== 'file' || !entity.path)
                continue;
            const fileEntity = entity;
            try {
                const content = await this.readFileContent(fileEntity.path);
                if (!content)
                    continue;
                const secretRules = this.rules.filter(rule => rule.category === 'secrets');
                const fileIssues = this.scanFileForIssues(content, fileEntity, options, secretRules);
                issues.push(...fileIssues);
            }
            catch (error) {
                console.warn(`Failed to scan file ${fileEntity.path} for secrets:`, error);
            }
        }
        return issues;
    }
    async performDependencyScan(entities, options) {
        // This is similar to SCA but focuses on dependency analysis
        return await this.performSCAScan(entities, options);
    }
    scanFileForIssues(content, entity, options, rules) {
        const issues = [];
        const applicableRules = rules || this.rules.filter(rule => this.shouldIncludeRule(rule, options));
        const lines = content.split('\n');
        for (const rule of applicableRules) {
            const matches = Array.from(content.matchAll(rule.pattern));
            for (const match of matches) {
                const lineNumber = this.getLineNumber(lines, match.index || 0);
                const codeSnippet = this.getCodeSnippet(lines, lineNumber);
                const issue = {
                    id: `${entity.id}_${rule.id}_${lineNumber}_${Date.now()}`,
                    type: 'securityIssue',
                    tool: 'SecurityScanner',
                    ruleId: rule.id,
                    severity: rule.severity,
                    title: rule.name,
                    description: rule.description,
                    cwe: rule.cwe,
                    owasp: rule.owasp,
                    affectedEntityId: entity.id,
                    lineNumber,
                    codeSnippet,
                    remediation: rule.remediation,
                    status: 'open',
                    discoveredAt: new Date(),
                    lastScanned: new Date(),
                    confidence: 0.8 // Basic confidence score
                };
                issues.push(issue);
            }
        }
        return issues;
    }
    shouldIncludeRule(rule, options) {
        const severityLevels = ['info', 'low', 'medium', 'high', 'critical'];
        const ruleSeverityIndex = severityLevels.indexOf(rule.severity);
        const thresholdIndex = severityLevels.indexOf(options.severityThreshold);
        return ruleSeverityIndex >= thresholdIndex;
    }
    getLineNumber(lines, charIndex) {
        let currentChar = 0;
        for (let i = 0; i < lines.length; i++) {
            currentChar += lines[i].length + 1; // +1 for newline
            if (currentChar > charIndex) {
                return i + 1;
            }
        }
        return lines.length;
    }
    getCodeSnippet(lines, lineNumber, context = 2) {
        const start = Math.max(0, lineNumber - context - 1);
        const end = Math.min(lines.length, lineNumber + context);
        return lines.slice(start, end).join('\n');
    }
    async readFileContent(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                return null;
            }
            return fs.readFileSync(filePath, 'utf-8');
        }
        catch (error) {
            console.warn(`Failed to read file ${filePath}:`, error);
            return null;
        }
    }
    async checkPackageVulnerabilities(packageName, version) {
        // Mock vulnerability checking - in production, this would query vulnerability databases
        const vulnerabilities = [];
        // Example: Check for known vulnerable versions
        const knownVulnerabilities = {
            'lodash': [
                {
                    id: 'CVE-2021-23337',
                    severity: 'high',
                    description: 'Prototype pollution in lodash',
                    affectedVersions: '<4.17.12',
                    cwe: 'CWE-1321',
                    fixedInVersion: '4.17.12'
                }
            ],
            'express': [
                {
                    id: 'CVE-2022-24999',
                    severity: 'medium',
                    description: 'Open redirect vulnerability',
                    affectedVersions: '<4.17.2',
                    cwe: 'CWE-601',
                    fixedInVersion: '4.17.2'
                }
            ]
        };
        if (knownVulnerabilities[packageName]) {
            for (const vuln of knownVulnerabilities[packageName]) {
                // Simple version comparison (in production, use proper semver)
                if (this.isVersionVulnerable(version, vuln.affectedVersions)) {
                    vulnerabilities.push({
                        id: `${packageName}_${vuln.id}`,
                        type: 'vulnerability',
                        packageName,
                        version,
                        vulnerabilityId: vuln.id,
                        severity: vuln.severity,
                        description: vuln.description,
                        cvssScore: 7.5, // Mock CVSS score
                        affectedVersions: vuln.affectedVersions,
                        fixedInVersion: vuln.fixedInVersion || '',
                        publishedAt: new Date(),
                        lastUpdated: new Date(),
                        exploitability: 'medium'
                    });
                }
            }
        }
        return vulnerabilities;
    }
    isVersionVulnerable(version, affectedVersions) {
        // Simple mock version comparison
        // In production, use proper semver comparison
        if (affectedVersions.includes('<4.17.12') && version.includes('4.17.10')) {
            return true; // Mock: 4.17.10 is vulnerable to <4.17.12
        }
        if (affectedVersions.includes('<4.17.2') && version.includes('4.17.1')) {
            return true; // Mock: 4.17.1 is vulnerable to <4.17.2
        }
        if (affectedVersions.includes('<1.0.0') && version.startsWith('0.')) {
            return true; // Mock: 0.x.x versions are vulnerable to <1.0.0
        }
        return false;
    }
    generateScanSummary(result) {
        result.summary.totalIssues = result.issues.length + result.vulnerabilities.length;
        // Count by severity
        const severityCount = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
        for (const issue of result.issues) {
            severityCount[issue.severity] = (severityCount[issue.severity] || 0) + 1;
        }
        for (const vuln of result.vulnerabilities) {
            severityCount[vuln.severity] = (severityCount[vuln.severity] || 0) + 1;
        }
        result.summary.bySeverity = severityCount;
        // Count by type
        result.summary.byType = {
            sast: result.issues.filter(i => i.ruleId.startsWith('SQL_') || i.ruleId.startsWith('XSS_') || i.ruleId.startsWith('COMMAND_')).length,
            secrets: result.issues.filter(i => i.ruleId.startsWith('HARDCODED_')).length,
            sca: result.vulnerabilities.length,
            dependency: result.vulnerabilities.length
        };
    }
    async storeScanResults(scanId, request, result) {
        // Store scan metadata - convert arrays to JSON strings for FalkorDB
        await this.db.falkordbQuery(`
      CREATE (s:SecurityScan {
        id: $scanId,
        timestamp: $timestamp,
        entityIds: $entityIds,
        scanTypes: $scanTypes,
        summary: $summary
      })
    `, {
            scanId,
            timestamp: new Date().toISOString(),
            entityIds: JSON.stringify(request.entityIds || []),
            scanTypes: JSON.stringify(request.scanTypes || []),
            summary: JSON.stringify(result.summary)
        });
        // Store individual issues
        for (const issue of result.issues) {
            await this.db.falkordbQuery(`
        CREATE (i:SecurityIssue {
          id: $id,
          tool: $tool,
          ruleId: $ruleId,
          severity: $severity,
          title: $title,
          description: $description,
          cwe: $cwe,
          owasp: $owasp,
          affectedEntityId: $affectedEntityId,
          lineNumber: $lineNumber,
          codeSnippet: $codeSnippet,
          remediation: $remediation,
          status: $status,
          discoveredAt: $discoveredAt,
          lastScanned: $lastScanned,
          confidence: $confidence
        })
        WITH i
        MATCH (s:SecurityScan {id: $scanId})
        CREATE (i)-[:PART_OF_SCAN]->(s)
      `, {
                ...issue,
                discoveredAt: issue.discoveredAt.toISOString(),
                lastScanned: issue.lastScanned.toISOString()
            });
        }
        // Store vulnerabilities
        for (const vuln of result.vulnerabilities) {
            await this.db.falkordbQuery(`
        CREATE (v:Vulnerability {
          id: $id,
          packageName: $packageName,
          version: $version,
          vulnerabilityId: $vulnerabilityId,
          severity: $severity,
          description: $description,
          cvssScore: $cvssScore,
          affectedVersions: $affectedVersions,
          fixedInVersion: $fixedInVersion,
          publishedAt: $publishedAt,
          lastUpdated: $lastUpdated,
          exploitability: $exploitability
        })
        WITH v
        MATCH (s:SecurityScan {id: $scanId})
        CREATE (v)-[:PART_OF_SCAN]->(s)
      `, {
                ...vuln,
                publishedAt: vuln.publishedAt.toISOString(),
                lastUpdated: vuln.lastUpdated.toISOString()
            });
        }
    }
    async getVulnerabilityReport() {
        const report = {
            summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
            vulnerabilities: [],
            byPackage: {},
            remediation: { immediate: [], planned: [], monitoring: [] }
        };
        try {
            const vulnerabilities = await this.db.falkordbQuery(`
        MATCH (v:Vulnerability)
        WHERE v.status = 'open'
        RETURN v
        ORDER BY v.severity DESC, v.discoveredAt DESC
      `, {});
            for (const vuln of vulnerabilities) {
                report.vulnerabilities.push(vuln);
                report.summary.total++;
                // Count by severity
                switch (vuln.severity) {
                    case 'critical':
                        report.summary.critical++;
                        break;
                    case 'high':
                        report.summary.high++;
                        break;
                    case 'medium':
                        report.summary.medium++;
                        break;
                    case 'low':
                        report.summary.low++;
                        break;
                }
                // Group by package
                if (!report.byPackage[vuln.packageName]) {
                    report.byPackage[vuln.packageName] = [];
                }
                report.byPackage[vuln.packageName].push(vuln);
                // Categorize remediation
                if (vuln.severity === 'critical') {
                    report.remediation.immediate.push(`Fix ${vuln.vulnerabilityId} in ${vuln.packageName}`);
                }
                else if (vuln.severity === 'high') {
                    report.remediation.planned.push(`Address ${vuln.vulnerabilityId} in ${vuln.packageName}`);
                }
                else {
                    report.remediation.monitoring.push(`Monitor ${vuln.vulnerabilityId} in ${vuln.packageName}`);
                }
            }
        }
        catch (error) {
            console.error('Failed to generate vulnerability report:', error);
        }
        return report;
    }
    async getSecurityIssues(filters = {}) {
        try {
            let query = `
        MATCH (i:SecurityIssue)
        WHERE 1=1
      `;
            const params = {};
            if (filters.severity && filters.severity.length > 0) {
                query += ` AND i.severity IN $severity`;
                params.severity = filters.severity;
            }
            if (filters.status && filters.status.length > 0) {
                query += ` AND i.status IN $status`;
                params.status = filters.status;
            }
            query += `
        RETURN i
        ORDER BY i.severity DESC, i.discoveredAt DESC
      `;
            if (filters.limit) {
                query += ` LIMIT $limit`;
                params.limit = filters.limit;
            }
            if (filters.offset) {
                query += ` SKIP $offset`;
                params.offset = filters.offset;
            }
            const results = await this.db.falkordbQuery(query, params);
            const issues = results.map((result) => ({
                ...result,
                discoveredAt: new Date(result.discoveredAt),
                lastScanned: new Date(result.lastScanned)
            }));
            // Get total count
            const countQuery = query.replace('RETURN i', 'RETURN count(i) as total');
            const countResult = await this.db.falkordbQuery(countQuery, params);
            const total = countResult[0]?.total || 0;
            return { issues, total };
        }
        catch (error) {
            console.error('Failed to get security issues:', error);
            return { issues: [], total: 0 };
        }
    }
    async performSecurityAudit(scope = 'full') {
        console.log(`🔍 Starting security audit: ${scope}`);
        const audit = {
            scope,
            startTime: new Date().toISOString(),
            findings: [],
            recommendations: [],
            score: 0
        };
        try {
            // Get all security issues
            const { issues } = await this.getSecurityIssues();
            // Filter based on scope
            let filteredIssues = issues;
            if (scope === 'recent') {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                filteredIssues = issues.filter(issue => issue.discoveredAt > weekAgo);
            }
            else if (scope === 'critical-only') {
                filteredIssues = issues.filter(issue => issue.severity === 'critical');
            }
            // Analyze findings
            const findings = this.analyzeAuditFindings(filteredIssues);
            audit.findings = findings;
            // Generate recommendations
            audit.recommendations = this.generateAuditRecommendations(filteredIssues);
            // Calculate security score (0-100, higher is better)
            audit.score = this.calculateSecurityScore(filteredIssues);
            console.log(`✅ Security audit completed: ${scope} - Score: ${audit.score}/100`);
        }
        catch (error) {
            console.error(`❌ Security audit failed: ${scope}`, error);
            audit.findings = [{ type: 'error', message: 'Audit failed due to internal error' }];
        }
        return audit;
    }
    analyzeAuditFindings(issues) {
        const findings = [];
        // Group issues by type
        const issuesByType = issues.reduce((acc, issue) => {
            acc[issue.ruleId] = (acc[issue.ruleId] || 0) + 1;
            return acc;
        }, {});
        // Analyze most common issues
        const sortedTypes = Object.entries(issuesByType)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
        for (const [ruleId, count] of sortedTypes) {
            const rule = this.rules.find(r => r.id === ruleId);
            if (rule) {
                findings.push({
                    type: 'common-issue',
                    rule: rule.name,
                    count,
                    severity: rule.severity,
                    description: `${count} instances of ${rule.name} found`
                });
            }
        }
        // Analyze severity distribution
        const severityCount = issues.reduce((acc, issue) => {
            acc[issue.severity] = (acc[issue.severity] || 0) + 1;
            return acc;
        }, {});
        if (severityCount.critical || severityCount.high) {
            findings.push({
                type: 'severity-alert',
                message: `Found ${severityCount.critical || 0} critical and ${severityCount.high || 0} high severity issues`,
                severity: 'high'
            });
        }
        return findings;
    }
    generateAuditRecommendations(issues) {
        const recommendations = [];
        const criticalIssues = issues.filter(i => i.severity === 'critical');
        const highIssues = issues.filter(i => i.severity === 'high');
        if (criticalIssues.length > 0) {
            recommendations.push('IMMEDIATE: Address all critical security issues before deployment');
        }
        if (highIssues.length > 0) {
            recommendations.push('HIGH PRIORITY: Fix high-severity security issues within the next sprint');
        }
        // Check for common patterns
        const sqlInjection = issues.filter(i => i.ruleId === 'SQL_INJECTION');
        if (sqlInjection.length > 0) {
            recommendations.push('Implement parameterized queries for all database operations');
        }
        const xssIssues = issues.filter(i => i.ruleId === 'XSS_VULNERABILITY');
        if (xssIssues.length > 0) {
            recommendations.push('Implement proper input sanitization and use safe DOM manipulation methods');
        }
        const hardcodedSecrets = issues.filter(i => i.ruleId === 'HARDCODED_SECRET');
        if (hardcodedSecrets.length > 0) {
            recommendations.push('Move all secrets to environment variables or secure key management');
        }
        if (issues.length === 0) {
            recommendations.push('Excellent! No security issues found. Continue regular security monitoring.');
        }
        return recommendations;
    }
    calculateSecurityScore(issues) {
        if (issues.length === 0)
            return 100;
        // Base score starts at 100
        let score = 100;
        // Deduct points based on severity
        const severityWeights = {
            critical: 20,
            high: 10,
            medium: 5,
            low: 2,
            info: 1
        };
        for (const issue of issues) {
            score -= severityWeights[issue.severity] || 1;
        }
        // Ensure score doesn't go below 0
        return Math.max(0, score);
    }
    async generateSecurityFix(issueId) {
        try {
            const issue = await this.db.falkordbQuery(`
        MATCH (i:SecurityIssue {id: $issueId})
        RETURN i
      `, { issueId });
            if (!issue || issue.length === 0) {
                throw new Error(`Security issue ${issueId} not found`);
            }
            const securityIssue = {
                ...issue[0],
                discoveredAt: new Date(issue[0].discoveredAt),
                lastScanned: new Date(issue[0].lastScanned)
            };
            // Generate fix suggestions based on the issue type
            const fix = this.generateFixForIssue(securityIssue);
            return {
                issueId,
                fixes: [fix],
                priority: this.getFixPriority(securityIssue.severity),
                effort: this.getFixEffort(securityIssue.ruleId)
            };
        }
        catch (error) {
            console.error(`Failed to generate fix for issue ${issueId}:`, error);
            throw new Error(`Failed to generate security fix: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    generateFixForIssue(issue) {
        const rule = this.rules.find(r => r.id === issue.ruleId);
        if (!rule) {
            return {
                description: 'Manual review required',
                code: '',
                explanation: 'No automated fix available for this issue type'
            };
        }
        // Generate specific fixes based on rule type
        switch (issue.ruleId) {
            case 'SQL_INJECTION':
                return {
                    description: 'Replace string concatenation with parameterized query',
                    code: `// Instead of:
const query = "SELECT * FROM users WHERE id = " + userId;

// Use:
const query = "SELECT * FROM users WHERE id = ?";
const params = [userId];`,
                    explanation: 'Parameterized queries prevent SQL injection by separating SQL code from data'
                };
            case 'XSS_VULNERABILITY':
                return {
                    description: 'Use textContent instead of innerHTML',
                    code: `// Instead of:
element.innerHTML = userInput;

// Use:
element.textContent = userInput;

// Or if HTML is needed:
element.innerHTML = this.sanitizeHtml(userInput);`,
                    explanation: 'textContent prevents XSS by treating input as plain text'
                };
            case 'HARDCODED_SECRET':
                return {
                    description: 'Move secret to environment variable',
                    code: `// Instead of:
const API_KEY = "hardcoded-secret";

// Use:
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error('API_KEY environment variable is required');
}`,
                    explanation: 'Environment variables keep secrets out of source code'
                };
            case 'COMMAND_INJECTION':
                return {
                    description: 'Validate input and use safe command execution',
                    code: `// Instead of:
exec("ls " + userPath);

// Use:
const safePath = path.resolve(userPath);
if (!safePath.startsWith('/safe/directory/')) {
  throw new Error('Invalid path');
}
exec("ls " + safePath, { cwd: '/safe/directory' });`,
                    explanation: 'Input validation and path restrictions prevent command injection'
                };
            default:
                return {
                    description: rule.remediation,
                    code: '// Manual implementation required',
                    explanation: 'Follow the security best practice described in the remediation'
                };
        }
    }
    getFixPriority(severity) {
        switch (severity) {
            case 'critical': return 'immediate';
            case 'high': return 'high';
            case 'medium': return 'medium';
            case 'low': return 'low';
            default: return 'low';
        }
    }
    getFixEffort(ruleId) {
        // Estimate fix effort based on rule type
        const highEffortRules = ['COMMAND_INJECTION', 'SQL_INJECTION'];
        const mediumEffortRules = ['XSS_VULNERABILITY', 'PATH_TRAVERSAL'];
        if (highEffortRules.includes(ruleId)) {
            return 'high';
        }
        else if (mediumEffortRules.includes(ruleId)) {
            return 'medium';
        }
        else {
            return 'low';
        }
    }
    async setupMonitoring(config) {
        this.monitoringConfig = config;
        // Store configuration in database
        await this.db.falkordbQuery(`
      MERGE (c:SecurityConfig {type: 'monitoring'})
      SET c.config = $config, c.updatedAt = $updatedAt
    `, {
            config: JSON.stringify(config),
            updatedAt: new Date().toISOString()
        });
        if (config.enabled) {
            console.log(`🔒 Security monitoring enabled with ${config.schedule} schedule`);
            // In production, this would set up cron jobs or scheduled tasks
        }
        else {
            console.log('🔒 Security monitoring disabled');
        }
    }
    async getComplianceStatus(framework, scope) {
        // Mock compliance checking - in production, this would implement specific framework checks
        const compliance = {
            framework,
            scope,
            overallScore: 75,
            requirements: [
                { id: 'REQ001', status: 'compliant', description: 'Input validation implemented' },
                { id: 'REQ002', status: 'partial', description: 'Authentication mechanisms present' },
                { id: 'REQ003', status: 'non-compliant', description: 'Secure logging not fully implemented' }
            ],
            gaps: [
                'Secure logging and monitoring',
                'Regular security updates',
                'Access control mechanisms'
            ],
            recommendations: [
                'Implement comprehensive logging',
                'Set up automated dependency updates',
                'Review and enhance access controls'
            ]
        };
        return compliance;
    }
    // Helper method to get scan history
    async getScanHistory(limit = 10) {
        try {
            const results = await this.db.falkordbQuery(`
        MATCH (s:SecurityScan)
        RETURN s
        ORDER BY s.timestamp DESC
        LIMIT $limit
      `, { limit });
            return results.map((result) => ({
                ...result,
                timestamp: new Date(result.timestamp),
                summary: result.summary ? JSON.parse(result.summary) : {}
            }));
        }
        catch (error) {
            console.error('Failed to get scan history:', error);
            return [];
        }
    }
}
//# sourceMappingURL=SecurityScanner.js.map
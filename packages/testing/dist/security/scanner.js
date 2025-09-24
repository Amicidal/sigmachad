/**
 * Main Security Scanner Service
 * Orchestrates all security scanning activities including SAST, SCA, secrets detection, and compliance checks
 */
import { EventEmitter } from "events";
import { CodeScanner } from "./code-scanner.js";
import { DependencyScanner } from "./dependency-scanner.js";
import { SecretsScanner } from "./secrets-scanner.js";
import { VulnerabilityDatabase } from "./vulnerability-db.js";
import { SecurityPolicies } from "./policies.js";
import { SecurityReports } from "./reports.js";
import { IncrementalScanner } from "./incremental-scanner.js";
export class SecurityScanner extends EventEmitter {
    constructor(db, kgService, config = {}) {
        super();
        this.db = db;
        this.kgService = kgService;
        this.config = config;
        this.activeScan = new Map();
        this.scanHistory = new Map();
        this.monitoringConfig = null;
        this.codeScanner = new CodeScanner();
        this.dependencyScanner = new DependencyScanner();
        this.secretsScanner = new SecretsScanner();
        this.vulnerabilityDb = new VulnerabilityDatabase();
        this.policies = new SecurityPolicies();
        this.reports = new SecurityReports();
        this.incrementalScanner = new IncrementalScanner(this.db);
    }
    async initialize() {
        console.log("🔒 Initializing Security Scanner...");
        // Initialize all components
        await this.codeScanner.initialize();
        await this.dependencyScanner.initialize();
        await this.secretsScanner.initialize();
        await this.vulnerabilityDb.initialize();
        await this.policies.initialize(this.config.policies);
        await this.reports.initialize();
        await this.incrementalScanner.initialize();
        // Ensure security-related graph schema exists
        await this.ensureSecuritySchema();
        // Load monitoring configuration if exists
        await this.loadMonitoringConfig();
        console.log("✅ Security Scanner initialized");
    }
    async performIncrementalScan(request, options = {}) {
        const scanId = this.generateScanId();
        const startedAt = new Date();
        console.log(`🔍 Starting incremental security scan: ${scanId}`);
        const scanOptions = {
            includeSAST: true,
            includeSCA: true,
            includeSecrets: true,
            includeDependencies: true,
            includeCompliance: false,
            severityThreshold: "info",
            confidenceThreshold: 0.5,
            ...options,
        };
        const result = {
            scanId,
            status: "running",
            startedAt,
            issues: [],
            vulnerabilities: [],
            summary: this.createEmptySummary(),
            changedFiles: 0,
            skippedFiles: 0,
            incrementalScan: true,
            baselineScanId: request.baselineScanId,
        };
        this.activeScan.set(scanId, result);
        try {
            // Get all entities to consider
            const allEntities = await this.getEntitiesToScan(request.entityIds);
            // Perform incremental analysis
            const { changedEntities, skippedEntities, scanState } = await this.incrementalScanner.performIncrementalScan(allEntities, scanOptions, request.baselineScanId);
            result.changedFiles = changedEntities.length;
            result.skippedFiles = skippedEntities.length;
            // Scan only changed files
            if (changedEntities.length > 0) {
                const useParallel = changedEntities.length > 10 || this.config.maxConcurrentScans || false;
                if (useParallel) {
                    await this.performParallelScan(changedEntities, scanOptions, result);
                }
                else {
                    await this.performSequentialScan(changedEntities, scanOptions, result);
                }
            }
            // Retrieve previous results for unchanged files
            if (skippedEntities.length > 0 && request.baselineScanId) {
                const previousResults = await this.incrementalScanner.getPreviousScanIssues(skippedEntities, request.baselineScanId);
                result.issues.push(...previousResults.issues);
                result.vulnerabilities.push(...previousResults.vulnerabilities);
                console.log(`📋 Reused ${previousResults.issues.length} previous issues and ${previousResults.vulnerabilities.length} vulnerabilities`);
            }
            // Apply policies and filters
            result.issues = await this.policies.filterIssues(result.issues);
            result.vulnerabilities = await this.policies.filterVulnerabilities(result.vulnerabilities);
            // Generate summary
            result.summary = this.generateScanSummary(result);
            result.status = "completed";
            result.completedAt = new Date();
            result.duration = result.completedAt.getTime() - startedAt.getTime();
            // Store scan results
            await this.storeScanResults(result);
            // Save incremental scan state
            await this.incrementalScanner.saveScanState(scanId, scanState);
            // Emit scan completed event
            this.emit("scan.completed", { scanId, result });
            console.log(`✅ Incremental scan completed: ${scanId} - Scanned ${result.changedFiles} changed files, skipped ${result.skippedFiles} unchanged files`);
            console.log(`📊 Found ${result.summary.totalIssues} issues and ${result.summary.totalVulnerabilities} vulnerabilities`);
            return result;
        }
        catch (error) {
            result.status = "failed";
            result.completedAt = new Date();
            result.duration = result.completedAt.getTime() - startedAt.getTime();
            console.error(`❌ Incremental scan failed: ${scanId}`, error);
            this.emit("scan.failed", { scanId, error });
            throw error;
        }
        finally {
            this.activeScan.delete(scanId);
            this.scanHistory.set(scanId, result);
        }
    }
    async performScan(request, options = {}) {
        const scanId = this.generateScanId();
        const startedAt = new Date();
        console.log(`🔍 Starting security scan: ${scanId}`);
        const scanOptions = {
            includeSAST: true,
            includeSCA: true,
            includeSecrets: true,
            includeDependencies: true,
            includeCompliance: false,
            severityThreshold: "info",
            confidenceThreshold: 0.5,
            ...options,
        };
        const result = {
            scanId,
            status: "running",
            startedAt,
            issues: [],
            vulnerabilities: [],
            summary: this.createEmptySummary(),
        };
        this.activeScan.set(scanId, result);
        try {
            // Get entities to scan
            const entities = await this.getEntitiesToScan(request.entityIds);
            // Determine if we should use parallel processing
            const useParallel = entities.length > 10 || this.config.maxConcurrentScans || false;
            if (useParallel) {
                await this.performParallelScan(entities, scanOptions, result);
            }
            else {
                await this.performSequentialScan(entities, scanOptions, result);
            }
            // Apply policies and filters
            result.issues = await this.policies.filterIssues(result.issues);
            result.vulnerabilities = await this.policies.filterVulnerabilities(result.vulnerabilities);
            // Generate summary
            result.summary = this.generateScanSummary(result);
            result.status = "completed";
            result.completedAt = new Date();
            result.duration = result.completedAt.getTime() - startedAt.getTime();
            // Store scan results
            await this.storeScanResults(result);
            // Emit scan completed event
            this.emit("scan.completed", { scanId, result });
            console.log(`✅ Security scan completed: ${scanId} - Found ${result.summary.totalIssues} issues and ${result.summary.totalVulnerabilities} vulnerabilities`);
            return result;
        }
        catch (error) {
            result.status = "failed";
            result.completedAt = new Date();
            result.duration = result.completedAt.getTime() - startedAt.getTime();
            console.error(`❌ Security scan failed: ${scanId}`, error);
            this.emit("scan.failed", { scanId, error });
            throw error;
        }
        finally {
            this.activeScan.delete(scanId);
            this.scanHistory.set(scanId, result);
        }
    }
    async performSequentialScan(entities, scanOptions, result) {
        // Perform different types of scans in parallel (but files sequentially)
        const scanPromises = [];
        if (scanOptions.includeSAST) {
            scanPromises.push(this.codeScanner.scan(entities, scanOptions)
                .then(issues => result.issues.push(...issues)));
        }
        if (scanOptions.includeSecrets) {
            scanPromises.push(this.secretsScanner.scan(entities, scanOptions)
                .then(issues => result.issues.push(...issues)));
        }
        if (scanOptions.includeSCA || scanOptions.includeDependencies) {
            scanPromises.push(this.dependencyScanner.scan(entities, scanOptions)
                .then(vulnerabilities => result.vulnerabilities.push(...vulnerabilities)));
        }
        await Promise.all(scanPromises);
    }
    async performParallelScan(entities, scanOptions, result) {
        const maxConcurrent = this.config.maxConcurrentScans || 4;
        const chunkSize = Math.ceil(entities.length / maxConcurrent);
        const entityChunks = this.chunkArray(entities, chunkSize);
        console.log(`🔍 Running parallel scan with ${entityChunks.length} chunks (${maxConcurrent} max concurrent)`);
        // Process each chunk in parallel
        const chunkPromises = entityChunks.map(async (chunk, index) => {
            console.log(`🔍 Processing chunk ${index + 1}/${entityChunks.length} (${chunk.length} entities)`);
            const chunkResults = {
                issues: [],
                vulnerabilities: []
            };
            const chunkScanPromises = [];
            if (scanOptions.includeSAST) {
                chunkScanPromises.push(this.codeScanner.scan(chunk, scanOptions)
                    .then(issues => chunkResults.issues.push(...issues)));
            }
            if (scanOptions.includeSecrets) {
                chunkScanPromises.push(this.secretsScanner.scan(chunk, scanOptions)
                    .then(issues => chunkResults.issues.push(...issues)));
            }
            if (scanOptions.includeSCA || scanOptions.includeDependencies) {
                chunkScanPromises.push(this.dependencyScanner.scan(chunk, scanOptions)
                    .then(vulnerabilities => chunkResults.vulnerabilities.push(...vulnerabilities)));
            }
            await Promise.all(chunkScanPromises);
            // Merge chunk results into main result (with mutex-like behavior)
            this.mergeChunkResults(result, chunkResults);
            console.log(`✅ Completed chunk ${index + 1}/${entityChunks.length}`);
        });
        await Promise.all(chunkPromises);
    }
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
    mergeChunkResults(mainResult, chunkResult) {
        // Simple mutex-like behavior using synchronous operations
        mainResult.issues.push(...chunkResult.issues);
        mainResult.vulnerabilities.push(...chunkResult.vulnerabilities);
    }
    async getScanResult(scanId) {
        return this.activeScan.get(scanId) || this.scanHistory.get(scanId) || null;
    }
    async cancelScan(scanId) {
        const scan = this.activeScan.get(scanId);
        if (!scan) {
            return false;
        }
        scan.status = "cancelled";
        scan.completedAt = new Date();
        scan.duration = scan.completedAt.getTime() - scan.startedAt.getTime();
        this.activeScan.delete(scanId);
        this.scanHistory.set(scanId, scan);
        this.emit("scan.cancelled", { scanId });
        return true;
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
            if (filters.offset) {
                query += ` SKIP ${filters.offset}`;
            }
            if (filters.limit) {
                query += ` LIMIT ${filters.limit}`;
            }
            const results = await this.db.falkordbQuery(query, params);
            const issues = results.map((result) => this.validateSecurityIssue(this.extractIssueData(result)));
            // Get total count
            let countQuery = `
        MATCH (i:SecurityIssue)
        WHERE 1=1
      `;
            if (filters.severity && filters.severity.length > 0) {
                countQuery += ` AND i.severity IN $severity`;
            }
            if (filters.status && filters.status.length > 0) {
                countQuery += ` AND i.status IN $status`;
            }
            countQuery += ` RETURN count(i) as total`;
            const countResult = await this.db.falkordbQuery(countQuery, params);
            const total = this.extractCountFromResult(countResult);
            return { issues, total };
        }
        catch (error) {
            console.error("Failed to get security issues:", error);
            return { issues: [], total: 0 };
        }
    }
    async getVulnerabilityReport() {
        return this.reports.generateVulnerabilityReport();
    }
    async performSecurityAudit(scope = "full") {
        return this.reports.generateAuditReport(scope);
    }
    async generateSecurityFix(issueId) {
        return this.reports.generateSecurityFix(issueId);
    }
    async setupMonitoring(config) {
        this.monitoringConfig = config;
        // Store configuration in database
        await this.db.falkordbQuery(`
      MERGE (c:SecurityConfig {type: 'monitoring'})
      SET c.config = $config, c.updatedAt = $updatedAt
    `, {
            config: JSON.stringify(config),
            updatedAt: new Date().toISOString(),
        });
        if (config.enabled) {
            console.log(`🔒 Security monitoring enabled with ${config.schedule} schedule`);
        }
        else {
            console.log("🔒 Security monitoring disabled");
        }
    }
    async getComplianceStatus(framework, scope) {
        return this.reports.generateComplianceReport(framework, scope);
    }
    async getScanHistory(limit = 10) {
        const history = Array.from(this.scanHistory.values())
            .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
            .slice(0, limit);
        return history.map(scan => ({
            id: scan.scanId,
            timestamp: scan.startedAt,
            duration: scan.duration,
            status: scan.status,
            summary: scan.summary,
        }));
    }
    generateScanId() {
        return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    createEmptySummary() {
        return {
            totalIssues: 0,
            totalVulnerabilities: 0,
            bySeverity: {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
                info: 0
            },
            byCategory: {
                sast: 0,
                secrets: 0,
                dependency: 0,
                configuration: 0,
                compliance: 0
            },
            byStatus: {
                open: 0,
                closed: 0,
                in_progress: 0,
                resolved: 0,
                suppressed: 0
            },
            filesScanned: 0,
            linesAnalyzed: 0,
            scanDuration: 0
        };
    }
    generateScanSummary(result) {
        const summary = this.createEmptySummary();
        summary.totalIssues = result.issues.length;
        summary.totalVulnerabilities = result.vulnerabilities.length;
        summary.scanDuration = result.duration || 0;
        // Count by severity
        for (const issue of result.issues) {
            summary.bySeverity[issue.severity]++;
            summary.byStatus[issue.status]++;
        }
        for (const vuln of result.vulnerabilities) {
            summary.bySeverity[vuln.severity]++;
        }
        return summary;
    }
    async getEntitiesToScan(entityIds) {
        if (entityIds && entityIds.length > 0) {
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
            type: "file",
        }));
    }
    async ensureSecuritySchema() {
        const config = this.db.getConfig?.();
        const graphKey = config?.falkordb?.graphKey ?? "memento";
        const constraints = [
            { label: "SecurityIssue", property: "id" },
            { label: "Vulnerability", property: "id" },
            { label: "SecurityScan", property: "id" },
        ];
        for (const constraint of constraints) {
            await this.ensureUniqueConstraint(graphKey, constraint.label, constraint.property);
        }
        console.log("Security schema constraints check completed");
    }
    async ensureUniqueConstraint(graphKey, label, property) {
        try {
            await this.db.falkordbCommand("GRAPH.CONSTRAINT", graphKey, "CREATE", "UNIQUE", "NODE", label, "PROPERTIES", "1", property);
        }
        catch (error) {
            const message = String(error);
            if (message.toLowerCase().includes("already exists")) {
                return;
            }
            console.warn(`Failed to create security constraint for ${label}.${property}:`, error);
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
            console.log("No existing monitoring configuration found");
        }
    }
    async storeScanResults(result) {
        // Store scan metadata
        await this.db.falkordbQuery(`
      CREATE (s:SecurityScan {
        id: $scanId,
        status: $status,
        startedAt: $startedAt,
        completedAt: $completedAt,
        duration: $duration,
        summary: $summary
      })
    `, {
            scanId: result.scanId,
            status: result.status,
            startedAt: result.startedAt.toISOString(),
            completedAt: result.completedAt?.toISOString(),
            duration: result.duration,
            summary: JSON.stringify(result.summary),
        });
        // Store individual issues and vulnerabilities
        for (const issue of result.issues) {
            await this.storeSecurityIssue(issue, result.scanId);
        }
        for (const vuln of result.vulnerabilities) {
            await this.storeVulnerability(vuln, result.scanId);
        }
    }
    async storeSecurityIssue(issue, scanId) {
        await this.db.falkordbQuery(`
      MERGE (i:SecurityIssue { id: $id })
      SET i.tool = $tool,
          i.ruleId = $ruleId,
          i.severity = $severity,
          i.title = $title,
          i.description = $description,
          i.cwe = $cwe,
          i.owasp = $owasp,
          i.affectedEntityId = $affectedEntityId,
          i.lineNumber = $lineNumber,
          i.codeSnippet = $codeSnippet,
          i.remediation = $remediation,
          i.status = $status,
          i.lastScanned = $lastScanned,
          i.confidence = $confidence
      SET i.discoveredAt = coalesce(i.discoveredAt, $discoveredAt)
      WITH i
      MATCH (s:SecurityScan {id: $scanId})
      MERGE (i)-[:PART_OF_SCAN]->(s)
    `, {
            ...issue,
            scanId,
            discoveredAt: issue.discoveredAt.toISOString(),
            lastScanned: issue.lastScanned.toISOString(),
        });
    }
    async storeVulnerability(vuln, scanId) {
        await this.db.falkordbQuery(`
      MERGE (v:Vulnerability { id: $id })
      SET v.packageName = $packageName,
          v.version = $version,
          v.vulnerabilityId = $vulnerabilityId,
          v.severity = $severity,
          v.description = $description,
          v.cvssScore = $cvssScore,
          v.affectedVersions = $affectedVersions,
          v.fixedInVersion = $fixedInVersion,
          v.publishedAt = $publishedAt,
          v.lastUpdated = $lastUpdated,
          v.exploitability = $exploitability
      WITH v
      MATCH (s:SecurityScan {id: $scanId})
      MERGE (v)-[:PART_OF_SCAN]->(s)
    `, {
            ...vuln,
            scanId,
            publishedAt: vuln.publishedAt.toISOString(),
            lastUpdated: vuln.lastUpdated.toISOString(),
        });
    }
    validateSecurityIssue(issueData) {
        return {
            id: issueData.id || issueData._id || "",
            type: "securityIssue",
            tool: issueData.tool || "SecurityScanner",
            ruleId: issueData.ruleId || issueData.rule_id || "",
            severity: this.validateSeverity(issueData.severity),
            title: issueData.title || "",
            description: issueData.description || "",
            cwe: issueData.cwe || "",
            owasp: issueData.owasp || "",
            affectedEntityId: issueData.affectedEntityId || issueData.affected_entity_id || "",
            lineNumber: typeof issueData.lineNumber === "number" ? issueData.lineNumber : 0,
            codeSnippet: issueData.codeSnippet || issueData.code_snippet || "",
            remediation: issueData.remediation || "",
            status: this.validateIssueStatus(issueData.status),
            discoveredAt: this.parseDate(issueData.discoveredAt || issueData.discovered_at),
            lastScanned: this.parseDate(issueData.lastScanned || issueData.last_scanned),
            confidence: typeof issueData.confidence === "number" ? issueData.confidence : 0.8,
        };
    }
    validateSeverity(severity) {
        const validSeverities = ["critical", "high", "medium", "low", "info"];
        return validSeverities.includes(severity) ? severity : "medium";
    }
    validateIssueStatus(status) {
        const validStatuses = ["open", "closed", "in_progress", "resolved"];
        return validStatuses.includes(status) ? status : "open";
    }
    parseDate(dateValue) {
        if (dateValue instanceof Date) {
            return dateValue;
        }
        if (typeof dateValue === "string" || typeof dateValue === "number") {
            const parsed = new Date(dateValue);
            return isNaN(parsed.getTime()) ? new Date() : parsed;
        }
        return new Date();
    }
    extractIssueData(result) {
        if (result.i) {
            return result.i;
        }
        if (result.properties) {
            return result.properties;
        }
        if (result.data?.i) {
            return result.data.i;
        }
        if (result.data?.properties) {
            return result.data.properties;
        }
        return result;
    }
    extractCountFromResult(countResult) {
        if (!countResult || countResult.length === 0) {
            return 0;
        }
        const firstResult = countResult[0];
        if (typeof firstResult === "number") {
            return firstResult;
        }
        if (firstResult.total !== undefined) {
            return firstResult.total;
        }
        if (firstResult["count(i)"] !== undefined) {
            return firstResult["count(i)"];
        }
        if (firstResult.data?.total !== undefined) {
            return firstResult.data.total;
        }
        if (firstResult.data?.["count(i)"] !== undefined) {
            return firstResult.data["count(i)"];
        }
        return 0;
    }
}
//# sourceMappingURL=scanner.js.map
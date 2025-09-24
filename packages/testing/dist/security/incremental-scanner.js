/**
 * Incremental Security Scanner
 * Performs security scanning only on changed files since last scan
 */
import * as fs from "fs";
import { createHash } from "crypto";
export class IncrementalScanner {
    constructor(database) {
        this.scanStateCache = new Map();
        this.db = database;
    }
    async initialize() {
        // Load previous scan states from database
        await this.loadScanStates();
    }
    async performIncrementalScan(entities, options, baselineScanId) {
        const currentTimestamp = new Date();
        // Get or create scan state
        const scanState = await this.getScanState(baselineScanId);
        // Determine which files have changed
        const { changedEntities, skippedEntities } = await this.detectChangedFiles(entities, scanState, options);
        console.log(`📊 Incremental scan analysis: ${changedEntities.length} changed, ${skippedEntities.length} unchanged`);
        // Update scan state with current file checksums
        await this.updateScanState(scanState, entities, currentTimestamp);
        return {
            changedEntities,
            skippedEntities,
            scanState
        };
    }
    async detectChangedFiles(entities, scanState, options) {
        const changedEntities = [];
        const skippedEntities = [];
        for (const entity of entities) {
            if (!this.isFileEntity(entity)) {
                changedEntities.push(entity);
                continue;
            }
            try {
                const currentChecksum = await this.calculateFileChecksum(entity.path);
                const previousChecksum = scanState.fileChecksums.get(entity.path);
                // File is new or changed
                if (!previousChecksum ||
                    previousChecksum.checksum !== currentChecksum.checksum ||
                    previousChecksum.lastModified < currentChecksum.lastModified) {
                    changedEntities.push({
                        ...entity,
                        incrementalStatus: previousChecksum ? 'modified' : 'new'
                    });
                }
                else {
                    // File hasn't changed, but check if we should re-scan based on options
                    if (this.shouldForceRescan(entity, options, scanState)) {
                        changedEntities.push({
                            ...entity,
                            incrementalStatus: 'forced-rescan'
                        });
                    }
                    else {
                        skippedEntities.push({
                            ...entity,
                            incrementalStatus: 'unchanged'
                        });
                    }
                }
            }
            catch (error) {
                console.warn(`Failed to check file changes for ${entity.path}:`, error);
                // Treat as changed if we can't determine
                changedEntities.push({
                    ...entity,
                    incrementalStatus: 'error-check-failed'
                });
            }
        }
        return { changedEntities, skippedEntities };
    }
    shouldForceRescan(entity, options, scanState) {
        // Force rescan if:
        // 1. Last scan was too long ago (configurable threshold)
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        if (Date.now() - scanState.lastScanTimestamp.getTime() > maxAge) {
            return true;
        }
        // 2. Security rules have been updated (would need rule versioning)
        // 3. Confidence threshold has changed significantly
        // 4. New vulnerability patterns available
        return false;
    }
    async calculateFileChecksum(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File does not exist: ${filePath}`);
            }
            const stats = fs.statSync(filePath);
            const content = fs.readFileSync(filePath);
            const checksum = createHash('sha256').update(content).digest('hex');
            return {
                path: filePath,
                checksum,
                lastModified: stats.mtime,
                size: stats.size
            };
        }
        catch (error) {
            throw new Error(`Failed to calculate checksum for ${filePath}: ${error}`);
        }
    }
    async getPreviousScanIssues(skippedEntities, baselineScanId) {
        if (!baselineScanId || skippedEntities.length === 0) {
            return { issues: [], vulnerabilities: [] };
        }
        try {
            // Get previous issues for unchanged files
            const skippedPaths = skippedEntities.map(e => e.path);
            const issuesQuery = `
        MATCH (i:SecurityIssue)-[:PART_OF_SCAN]->(s:SecurityScan {id: $scanId})
        MATCH (i)-[:AFFECTS]->(f:File)
        WHERE f.path IN $paths
        RETURN i
      `;
            const vulnerabilitiesQuery = `
        MATCH (v:Vulnerability)-[:PART_OF_SCAN]->(s:SecurityScan {id: $scanId})
        MATCH (v)-[:FOUND_IN]->(f:File)
        WHERE f.path IN $paths
        RETURN v
      `;
            const [issueResults, vulnResults] = await Promise.all([
                this.db.falkordbQuery(issuesQuery, { scanId: baselineScanId, paths: skippedPaths }),
                this.db.falkordbQuery(vulnerabilitiesQuery, { scanId: baselineScanId, paths: skippedPaths })
            ]);
            const issues = issueResults.map((result) => this.parseSecurityIssue(result.i));
            const vulnerabilities = vulnResults.map((result) => this.parseVulnerability(result.v));
            console.log(`📋 Retrieved ${issues.length} previous issues and ${vulnerabilities.length} vulnerabilities for unchanged files`);
            return { issues, vulnerabilities };
        }
        catch (error) {
            console.warn(`Failed to retrieve previous scan results: ${error}`);
            return { issues: [], vulnerabilities: [] };
        }
    }
    async getScanState(baselineScanId) {
        if (baselineScanId && this.scanStateCache.has(baselineScanId)) {
            return this.scanStateCache.get(baselineScanId);
        }
        if (baselineScanId) {
            // Try to load from database
            const savedState = await this.loadScanStateFromDb(baselineScanId);
            if (savedState) {
                this.scanStateCache.set(baselineScanId, savedState);
                return savedState;
            }
        }
        // Create new scan state
        const newState = {
            lastScanTimestamp: new Date(0), // Unix epoch
            fileChecksums: new Map(),
            lastScanId: baselineScanId || ''
        };
        return newState;
    }
    async updateScanState(scanState, entities, timestamp) {
        scanState.lastScanTimestamp = timestamp;
        // Update checksums for all entities
        for (const entity of entities) {
            if (this.isFileEntity(entity)) {
                try {
                    const checksum = await this.calculateFileChecksum(entity.path);
                    scanState.fileChecksums.set(entity.path, checksum);
                }
                catch (error) {
                    console.warn(`Failed to update checksum for ${entity.path}:`, error);
                }
            }
        }
    }
    async saveScanState(scanId, scanState) {
        try {
            // Save to cache
            this.scanStateCache.set(scanId, scanState);
            // Save to database
            await this.db.falkordbQuery(`
        MERGE (state:ScanState {scanId: $scanId})
        SET state.lastScanTimestamp = $timestamp,
            state.fileChecksumsJson = $checksums,
            state.lastScanId = $lastScanId
      `, {
                scanId,
                timestamp: scanState.lastScanTimestamp.toISOString(),
                checksums: JSON.stringify(Array.from(scanState.fileChecksums.entries())),
                lastScanId: scanState.lastScanId
            });
        }
        catch (error) {
            console.error(`Failed to save scan state for ${scanId}:`, error);
        }
    }
    async loadScanStates() {
        try {
            const results = await this.db.falkordbQuery(`
        MATCH (state:ScanState)
        RETURN state
      `, {});
            for (const result of results) {
                const state = result.state;
                const scanState = {
                    lastScanTimestamp: new Date(state.lastScanTimestamp),
                    fileChecksums: new Map(JSON.parse(state.fileChecksumsJson || '[]')),
                    lastScanId: state.lastScanId || ''
                };
                this.scanStateCache.set(state.scanId, scanState);
            }
            console.log(`📊 Loaded ${this.scanStateCache.size} previous scan states`);
        }
        catch (error) {
            console.warn('Failed to load previous scan states:', error);
        }
    }
    async loadScanStateFromDb(scanId) {
        try {
            const results = await this.db.falkordbQuery(`
        MATCH (state:ScanState {scanId: $scanId})
        RETURN state
        LIMIT 1
      `, { scanId });
            if (results.length === 0) {
                return null;
            }
            const state = results[0].state;
            return {
                lastScanTimestamp: new Date(state.lastScanTimestamp),
                fileChecksums: new Map(JSON.parse(state.fileChecksumsJson || '[]')),
                lastScanId: state.lastScanId || ''
            };
        }
        catch (error) {
            console.warn(`Failed to load scan state for ${scanId}:`, error);
            return null;
        }
    }
    isFileEntity(entity) {
        return entity && entity.type === "file" && entity.path;
    }
    parseSecurityIssue(issueData) {
        return {
            id: issueData.id || '',
            type: "securityIssue",
            tool: issueData.tool || '',
            ruleId: issueData.ruleId || '',
            severity: issueData.severity || 'medium',
            title: issueData.title || '',
            description: issueData.description || '',
            cwe: issueData.cwe,
            owasp: issueData.owasp,
            affectedEntityId: issueData.affectedEntityId || '',
            lineNumber: issueData.lineNumber || 0,
            codeSnippet: issueData.codeSnippet || '',
            remediation: issueData.remediation || '',
            status: issueData.status || 'open',
            discoveredAt: new Date(issueData.discoveredAt),
            lastScanned: new Date(issueData.lastScanned),
            confidence: issueData.confidence || 0.8,
        };
    }
    parseVulnerability(vulnData) {
        return {
            id: vulnData.id || '',
            type: "vulnerability",
            packageName: vulnData.packageName || '',
            version: vulnData.version || '',
            vulnerabilityId: vulnData.vulnerabilityId || '',
            severity: vulnData.severity || 'medium',
            description: vulnData.description || '',
            cvssScore: vulnData.cvssScore || 0,
            affectedVersions: vulnData.affectedVersions || '',
            fixedInVersion: vulnData.fixedInVersion || '',
            publishedAt: new Date(vulnData.publishedAt),
            lastUpdated: new Date(vulnData.lastUpdated),
            exploitability: vulnData.exploitability || 'medium',
        };
    }
    async cleanupOldScanStates(maxAge = 30 * 24 * 60 * 60 * 1000) {
        const cutoff = new Date(Date.now() - maxAge);
        // Clean up from cache
        for (const [scanId, state] of this.scanStateCache) {
            if (state.lastScanTimestamp < cutoff) {
                this.scanStateCache.delete(scanId);
            }
        }
        // Clean up from database
        try {
            await this.db.falkordbQuery(`
        MATCH (state:ScanState)
        WHERE datetime(state.lastScanTimestamp) < datetime($cutoff)
        DELETE state
      `, { cutoff: cutoff.toISOString() });
        }
        catch (error) {
            console.warn('Failed to clean up old scan states:', error);
        }
    }
    getScanStateStats() {
        const states = Array.from(this.scanStateCache.values());
        return {
            cachedStates: states.length,
            oldestScan: states.length > 0
                ? new Date(Math.min(...states.map(s => s.lastScanTimestamp.getTime())))
                : null,
            newestScan: states.length > 0
                ? new Date(Math.max(...states.map(s => s.lastScanTimestamp.getTime())))
                : null
        };
    }
}
//# sourceMappingURL=incremental-scanner.js.map
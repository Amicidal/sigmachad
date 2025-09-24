/**
 * Incremental Security Scanner
 * Performs security scanning only on changed files since last scan
 */
import { SecurityScanOptions, SecurityScanResult, SecurityIssue, Vulnerability } from "./types.js";
export interface FileChecksum {
    path: string;
    checksum: string;
    lastModified: Date;
    size: number;
}
export interface IncrementalScanState {
    lastScanTimestamp: Date;
    fileChecksums: Map<string, FileChecksum>;
    lastScanId: string;
}
export interface IncrementalScanResult extends SecurityScanResult {
    changedFiles: number;
    skippedFiles: number;
    incrementalScan: boolean;
    baselineScanId?: string;
}
export declare class IncrementalScanner {
    private scanStateCache;
    private db;
    constructor(database: any);
    initialize(): Promise<void>;
    performIncrementalScan(entities: any[], options: SecurityScanOptions, baselineScanId?: string): Promise<{
        changedEntities: any[];
        skippedEntities: any[];
        scanState: IncrementalScanState;
    }>;
    private detectChangedFiles;
    private shouldForceRescan;
    private calculateFileChecksum;
    getPreviousScanIssues(skippedEntities: any[], baselineScanId?: string): Promise<{
        issues: SecurityIssue[];
        vulnerabilities: Vulnerability[];
    }>;
    private getScanState;
    private updateScanState;
    saveScanState(scanId: string, scanState: IncrementalScanState): Promise<void>;
    private loadScanStates;
    private loadScanStateFromDb;
    private isFileEntity;
    private parseSecurityIssue;
    private parseVulnerability;
    cleanupOldScanStates(maxAge?: number): Promise<void>;
    getScanStateStats(): {
        cachedStates: number;
        oldestScan: Date | null;
        newestScan: Date | null;
    };
}
//# sourceMappingURL=incremental-scanner.d.ts.map
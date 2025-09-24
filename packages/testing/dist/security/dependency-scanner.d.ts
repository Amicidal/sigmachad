/**
 * Dependency Scanner (SCA - Software Composition Analysis)
 * Scans dependencies for known vulnerabilities and security issues
 */
import { SecurityScanOptions, Vulnerability, DependencyInfo } from "./types.js";
export declare class DependencyScanner {
    private vulnerabilityDb;
    private packageCache;
    constructor();
    initialize(): Promise<void>;
    scan(entities: any[], options: SecurityScanOptions): Promise<Vulnerability[]>;
    scanPackageFile(filePath: string): Promise<DependencyInfo[]>;
    getLicenseInfo(dependencies: DependencyInfo[]): Promise<Map<string, string[]>>;
    private collectDependencies;
    private deduplicateDependencies;
    private filterVulnerabilities;
    private meetsSeverityThreshold;
    private parsePackageJson;
    private parseRequirementsTxt;
    private parsePipfile;
    private parseGemfile;
    private parsePomXml;
    private parseBuildGradle;
    private parseGoMod;
    private parseCargoToml;
    private parseComposerJson;
    private isFileEntity;
    private isPackageFile;
}
//# sourceMappingURL=dependency-scanner.d.ts.map
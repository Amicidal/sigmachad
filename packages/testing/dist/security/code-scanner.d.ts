/**
 * Static Application Security Testing (SAST) Code Scanner
 * Analyzes source code for security vulnerabilities and issues
 */
import { SecurityScanOptions, SecurityIssue } from "./types.js";
export declare class CodeScanner {
    private rules;
    initialize(): Promise<void>;
    scan(entities: any[], options: SecurityScanOptions): Promise<SecurityIssue[]>;
    private loadSecurityRules;
    private scanFileForIssues;
    private getApplicableRules;
    private isRuleApplicableToFile;
    private meetsSeverityThreshold;
    private getLineNumber;
    private getColumnNumber;
    private getCodeSnippet;
    private getContextLines;
    private isFileEntity;
    private readFileContent;
}
//# sourceMappingURL=code-scanner.d.ts.map
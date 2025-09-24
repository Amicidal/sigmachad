/**
 * Secrets Scanner
 * Detects exposed secrets, credentials, and sensitive information in code
 */
import { SecurityScanOptions, SecurityIssue } from "./types.js";
export declare class SecretsScanner {
    private rules;
    private patterns;
    initialize(): Promise<void>;
    scan(entities: any[], options: SecurityScanOptions): Promise<SecurityIssue[]>;
    private loadSecretPatterns;
    private scanForSecrets;
    private convertSecretsToIssues;
    private getLineNumber;
    private getCodeSnippet;
    private calculateEntropy;
    private verifySecret;
    private isPlaceholder;
    private redactSecret;
    private shouldSkipFile;
    private isFileEntity;
    private readFileContent;
}
//# sourceMappingURL=secrets-scanner.d.ts.map
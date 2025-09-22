/**
 * Test Result Parser
 * Parses various test framework output formats into standardized test results
 */
import { TestSuiteResult } from "./testing/TestEngine.js";
export interface ParsedTestSuite {
    suiteName: string;
    timestamp: Date;
    framework: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    errorTests: number;
    skippedTests: number;
    duration: number;
    results: ParsedTestResult[];
    coverage?: {
        lines: number;
        branches: number;
        functions: number;
        statements: number;
    };
}
export interface ParsedTestResult {
    testId: string;
    testSuite: string;
    testName: string;
    status: "passed" | "failed" | "skipped" | "error";
    duration: number;
    errorMessage?: string;
    stackTrace?: string;
    coverage?: {
        lines: number;
        branches: number;
        functions: number;
        statements: number;
    };
    performance?: {
        memoryUsage?: number;
        cpuUsage?: number;
        networkRequests?: number;
    };
    environment?: string;
}
export declare class TestResultParser {
    /**
     * Parse test results from a file
     */
    parseFile(filePath: string, format: "junit" | "jest" | "mocha" | "vitest" | "cypress" | "playwright"): Promise<TestSuiteResult>;
    /**
     * Parse test results from content string
     */
    parseContent(content: string, format: "junit" | "jest" | "mocha" | "vitest" | "cypress" | "playwright"): Promise<TestSuiteResult>;
    /**
     * Parse JUnit XML format
     */
    private parseJUnitXML;
    /**
     * Parse Jest JSON format
     */
    private parseJestJSON;
    /**
     * Parse Mocha JSON format
     */
    private parseMochaJSON;
    /**
     * Parse Vitest JSON format (similar to Jest)
     */
    private parseVitestJSON;
    /**
     * Parse Cypress JSON format
     */
    private parseCypressJSON;
    /**
     * Parse Playwright JSON format
     */
    private parsePlaywrightJSON;
    private parseXMLAttributes;
    private stripXMLTags;
    private mergeTestSuites;
    private mapJestStatus;
    private mapPlaywrightStatus;
}
//# sourceMappingURL=TestResultParser.d.ts.map
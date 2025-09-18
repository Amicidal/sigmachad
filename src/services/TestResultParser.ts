/**
 * Test Result Parser
 * Parses various test framework output formats into standardized test results
 */

import { TestSuiteResult, TestResult } from "./TestEngine.js";
import * as fs from "fs/promises";

export interface ParsedTestSuite {
  suiteName: string;
  timestamp: Date;
  framework: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
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
}

export class TestResultParser {
  /**
   * Parse test results from a file
   */
  async parseFile(
    filePath: string,
    format: "junit" | "jest" | "mocha" | "vitest" | "cypress" | "playwright"
  ): Promise<TestSuiteResult> {
    const content = await fs.readFile(filePath, "utf-8");
    return this.parseContent(content, format);
  }

  /**
   * Parse test results from content string
   */
  async parseContent(
    content: string,
    format: "junit" | "jest" | "mocha" | "vitest" | "cypress" | "playwright"
  ): Promise<TestSuiteResult> {
    switch (format) {
      case "junit":
        return this.parseJUnitXML(content);
      case "jest":
        return this.parseJestJSON(content);
      case "mocha":
        return this.parseMochaJSON(content);
      case "vitest":
        return this.parseVitestJSON(content);
      case "cypress":
        return this.parseCypressJSON(content);
      case "playwright":
        return this.parsePlaywrightJSON(content);
      default:
        throw new Error(`Unsupported test format: ${format}`);
    }
  }

  /**
   * Parse JUnit XML format
   */
  private parseJUnitXML(content: string): TestSuiteResult {
    // Simple XML parsing without external dependencies
    // In production, you'd want to use a proper XML parser like xml2js

    // Empty content should be treated as an error
    if (!content || content.trim().length === 0) {
      throw new Error("Empty test result content");
    }

    const testSuites: ParsedTestSuite[] = [];
    const suiteRegex = /<testsuite[^>]*>(.*?)<\/testsuite>/gs;

    let suiteMatch;
    while ((suiteMatch = suiteRegex.exec(content)) !== null) {
      const suiteContent = suiteMatch[1];
      const suiteAttrs = this.parseXMLAttributes(suiteMatch[0]);

      const suite: ParsedTestSuite = {
        suiteName: suiteAttrs.name || "Unknown Suite",
        timestamp: new Date(suiteAttrs.timestamp || Date.now()),
        framework: "junit",
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        duration: parseFloat(suiteAttrs.time || "0") * 1000, // Convert to milliseconds
        results: [],
      };

      const testcaseStartRegex = /<testcase\b[^>]*\/?>/g;
      let testMatch;
      while ((testMatch = testcaseStartRegex.exec(suiteContent)) !== null) {
        const startTag = testMatch[0];
        const attrs = this.parseXMLAttributes(startTag);
        const trimmedStart = startTag.trimEnd();
        const isSelfClosing = trimmedStart.endsWith('/>');

        let testContent = "";
        if (!isSelfClosing) {
          const closeTag = "</testcase>";
          const closeIndex = suiteContent.indexOf(closeTag, testcaseStartRegex.lastIndex);
          if (closeIndex === -1) {
            continue; // malformed XML; skip
          }
          testContent = suiteContent.substring(testcaseStartRegex.lastIndex, closeIndex);
          testcaseStartRegex.lastIndex = closeIndex + closeTag.length;
        }

        const testResult: ParsedTestResult = {
          testId: `${suite.suiteName}:${attrs.name}`,
          testSuite: suite.suiteName,
          testName: attrs.name || "Unknown Test",
          duration: parseFloat(attrs.time || "0") * 1000,
          status: "passed",
        };

        if (!isSelfClosing) {
          if (/<failure\b/.test(testContent)) {
            testResult.status = "failed";
            const failureMatch = testContent.match(/<failure[^>]*>([\s\S]*?)<\/failure>/);
            if (failureMatch) {
              testResult.errorMessage = this.stripXMLTags(failureMatch[1]);
            }
          }

          if (/<error\b/.test(testContent)) {
            testResult.status = "error";
            const errorMatch = testContent.match(/<error[^>]*>([\s\S]*?)<\/error>/);
            if (errorMatch) {
              testResult.errorMessage = this.stripXMLTags(errorMatch[1]);
            }
          }

          if (/<skipped\b/.test(testContent)) {
            testResult.status = "skipped";
          }
        }

        suite.results.push(testResult);

        switch (testResult.status) {
          case "passed":
            suite.passedTests++;
            break;
          case "failed":
          case "error":
            suite.failedTests++;
            break;
          case "skipped":
            suite.skippedTests++;
            break;
        }
      }

      // Ensure totalTests reflects parsed results if attribute missing or incorrect
      suite.totalTests = suite.results.length;
      testSuites.push(suite);
    }

    // Merge multiple test suites if present
    return this.mergeTestSuites(testSuites);
  }

  /**
   * Parse Jest JSON format
   */
  private parseJestJSON(content: string): TestSuiteResult {
    const data = JSON.parse(content);

    const results: ParsedTestResult[] = [];
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    let totalDuration = 0;

    if (data.testResults) {
      for (const testFile of data.testResults) {
        const suiteName =
          testFile.testFilePath || testFile.name || "Jest Suite";

        for (const test of testFile.testResults || []) {
          const testResult: ParsedTestResult = {
            testId: `${suiteName}:${test.title}`,
            testSuite: suiteName,
            testName: test.title,
            status: this.mapJestStatus(test.status),
            duration: test.duration || 0,
          };

          if (test.failureMessages && test.failureMessages.length > 0) {
            testResult.errorMessage = test.failureMessages.join("\n");
            testResult.stackTrace = test.failureMessages.join("\n");
          }

          results.push(testResult);
          totalTests++;
          totalDuration += testResult.duration;

          switch (testResult.status) {
            case "passed":
              passedTests++;
              break;
            case "failed":
              failedTests++;
              break;
            case "skipped":
              skippedTests++;
              break;
          }
        }
      }
    }

    return {
      suiteName: data.testResults?.[0]?.name || "Jest Test Suite",
      timestamp: new Date(),
      framework: "jest",
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      duration: totalDuration,
      results: results.map((r) => ({
        testId: r.testId,
        testSuite: r.testSuite,
        testName: r.testName,
        status: r.status,
        duration: r.duration,
        errorMessage: r.errorMessage,
        stackTrace: r.stackTrace,
      })),
    };
  }

  /**
   * Parse Mocha JSON format
   */
  private parseMochaJSON(content: string): TestSuiteResult {
    const data = JSON.parse(content);

    const results: ParsedTestResult[] = [];
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    let totalDuration = 0;

    const processSuite = (suite: any, parentName = "") => {
      const suiteName = parentName
        ? `${parentName} > ${suite.title}`
        : suite.title;

      for (const test of suite.tests || []) {
        const testResult: ParsedTestResult = {
          testId: `${suiteName}:${test.title}`,
          testSuite: suiteName,
          testName: test.title,
          status:
            test.state === "passed"
              ? "passed"
              : test.state === "failed"
              ? "failed"
              : "skipped",
          duration: test.duration || 0,
        };

        if (test.err) {
          testResult.errorMessage = test.err.message;
          testResult.stackTrace = test.err.stack;
        }

        results.push(testResult);
        totalTests++;
        totalDuration += testResult.duration;

        switch (testResult.status) {
          case "passed":
            passedTests++;
            break;
          case "failed":
            failedTests++;
            break;
          case "skipped":
            skippedTests++;
            break;
        }
      }

      for (const childSuite of suite.suites || []) {
        processSuite(childSuite, suiteName);
      }
    };

    if (data.suites) {
      for (const suite of data.suites) {
        processSuite(suite);
      }
    }

    return {
      suiteName: data.title || "Mocha Test Suite",
      timestamp: new Date(data.stats?.start || Date.now()),
      framework: "mocha",
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      duration: data.stats?.duration || totalDuration,
      results: results.map((r) => ({
        testId: r.testId,
        testSuite: r.testSuite,
        testName: r.testName,
        status: r.status,
        duration: r.duration,
        errorMessage: r.errorMessage,
        stackTrace: r.stackTrace,
      })),
    };
  }

  /**
   * Parse Vitest JSON format (similar to Jest)
   */
  private parseVitestJSON(content: string): TestSuiteResult {
    // Vitest output is very similar to Jest
    return this.parseJestJSON(content);
  }

  /**
   * Parse Cypress JSON format
   */
  private parseCypressJSON(content: string): TestSuiteResult {
    const data = JSON.parse(content);

    const results: ParsedTestResult[] = [];
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    let totalDuration = 0;

    const processRun = (run: any) => {
      // Cypress JSON reporter outputs one spec per run
      const spec = run.spec || run.specs?.[0];
      if (!spec) return;
      for (const test of run.tests || spec.tests || []) {
        const title = Array.isArray(test.title)
          ? test.title.join(" > ")
          : String(test.title ?? "");
        const specPath = spec.relative || spec.file || "unknown.spec";

        const testResult: ParsedTestResult = {
          testId: `${specPath}:${title}`,
          testSuite: specPath,
          testName: title,
          status:
            test.state === "passed"
              ? "passed"
              : test.state === "failed"
              ? "failed"
              : "skipped",
          duration: test.duration || 0,
        };

        if (test.err) {
          testResult.errorMessage = test.err.message;
          testResult.stackTrace = test.err.stack;
        }

        results.push(testResult);
        totalTests++;
        totalDuration += testResult.duration;

        switch (testResult.status) {
          case "passed":
            passedTests++;
            break;
          case "failed":
            failedTests++;
            break;
          case "skipped":
            skippedTests++;
            break;
        }
      }
    };

    if (data.runs) {
      for (const run of data.runs) {
        processRun(run);
      }
    }

    return {
      suiteName: data.runUrl || "Cypress Test Suite",
      timestamp: new Date(),
      framework: "cypress",
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      duration: totalDuration,
      results: results.map((r) => ({
        testId: r.testId,
        testSuite: r.testSuite,
        testName: r.testName,
        status: r.status,
        duration: r.duration,
        errorMessage: r.errorMessage,
        stackTrace: r.stackTrace,
      })),
    };
  }

  /**
   * Parse Playwright JSON format
   */
  private parsePlaywrightJSON(content: string): TestSuiteResult {
    const data = JSON.parse(content);

    const results: ParsedTestResult[] = [];
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    let totalDuration = 0;

    const processSuite = (suite: any) => {
      const suiteTitle = suite.title || "Playwright Suite";

      for (const spec of suite.specs || []) {
        for (const test of spec.tests || []) {
          for (const result of test.results || []) {
            const testResult: ParsedTestResult = {
              testId: `${spec.file}:${test.title}`,
              testSuite: suiteTitle,
              testName: test.title,
              status: this.mapPlaywrightStatus(result.status),
              duration: result.duration || 0,
            };

            if (result.error) {
              testResult.errorMessage = result.error.message;
              testResult.stackTrace = result.error.stack;
            }

            results.push(testResult);
            totalTests++;
            totalDuration += testResult.duration;

            switch (testResult.status) {
              case "passed":
                passedTests++;
                break;
              case "failed":
                failedTests++;
                break;
              case "skipped":
                skippedTests++;
                break;
            }
          }
        }
      }

      for (const childSuite of suite.suites || []) {
        processSuite(childSuite);
      }
    };

    if (data.suites) {
      for (const suite of data.suites) {
        processSuite(suite);
      }
    }

    return {
      suiteName: data.config?.name || "Playwright Test Suite",
      timestamp: new Date(),
      framework: "playwright",
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      duration: totalDuration,
      results: results.map((r) => ({
        testId: r.testId,
        testSuite: r.testSuite,
        testName: r.testName,
        status: r.status,
        duration: r.duration,
        errorMessage: r.errorMessage,
        stackTrace: r.stackTrace,
      })),
    };
  }

  // Helper methods

  private parseXMLAttributes(xmlString: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const attrRegex = /(\w+)="([^"]*)"/g;
    let match;
    while ((match = attrRegex.exec(xmlString)) !== null) {
      attrs[match[1]] = match[2];
    }
    return attrs;
  }

  private stripXMLTags(content: string): string {
    return content.replace(/<[^>]*>/g, "").trim();
  }

  private mergeTestSuites(suites: ParsedTestSuite[]): TestSuiteResult {
    if (suites.length === 0) {
      throw new Error("No test suites found");
    }

    if (suites.length === 1) {
      return suites[0] as TestSuiteResult;
    }

    // Merge multiple suites
    const merged: TestSuiteResult = {
      suiteName: "Merged Test Suite",
      timestamp: suites[0].timestamp,
      framework: suites[0].framework,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      duration: 0,
      results: [],
    };

    for (const suite of suites) {
      merged.totalTests += suite.totalTests;
      merged.passedTests += suite.passedTests;
      merged.failedTests += suite.failedTests;
      merged.skippedTests += suite.skippedTests;
      merged.duration += suite.duration;
      merged.results.push(...suite.results);
    }

    return merged;
  }

  private mapJestStatus(
    status: string
  ): "passed" | "failed" | "skipped" | "error" {
    switch (status) {
      case "passed":
        return "passed";
      case "failed":
        return "failed";
      case "pending":
      case "todo":
        return "skipped";
      default:
        return "error";
    }
  }

  private mapPlaywrightStatus(
    status: string
  ): "passed" | "failed" | "skipped" | "error" {
    switch (status) {
      case "passed":
        return "passed";
      case "failed":
        return "failed";
      case "skipped":
      case "pending":
        return "skipped";
      case "timedOut":
        return "error";
      default:
        return "error";
    }
  }
}

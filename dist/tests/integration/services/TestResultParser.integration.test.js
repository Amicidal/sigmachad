/**
 * Integration tests for TestResultParser service
 * Tests parsing of various test framework output formats
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { TestResultParser } from '../../../src/services/TestResultParser';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';
describe('TestResultParser Integration', () => {
    let parser;
    let testDir;
    beforeAll(async () => {
        parser = new TestResultParser();
        // Create a temporary directory for test files
        testDir = path.join(tmpdir(), 'test-result-parser-integration-tests');
        await fs.mkdir(testDir, { recursive: true });
    }, 10000);
    afterAll(async () => {
        // Clean up test directory
        try {
            await fs.rm(testDir, { recursive: true, force: true });
        }
        catch (error) {
            console.warn('Failed to clean up test directory:', error);
        }
    });
    beforeEach(async () => {
        // Clean up any existing test files
        try {
            const files = await fs.readdir(testDir);
            await Promise.all(files.map(file => fs.unlink(path.join(testDir, file))));
        }
        catch (error) {
            // Directory might not exist yet, that's okay
        }
    });
    describe('JUnit XML Parsing Integration', () => {
        it('should parse JUnit XML file with multiple test suites successfully', async () => {
            const junitXml = `<?xml version="1.0" encoding="UTF-8"?>
      <testsuites>
        <testsuite name="Authentication Tests" tests="3" failures="1" errors="0" skipped="0" time="2.5" timestamp="2024-01-01T10:00:00">
          <testcase name="should login successfully" time="0.8" classname="AuthTest">
            <system-out>Login test passed</system-out>
          </testcase>
          <testcase name="should handle invalid credentials" time="1.2" classname="AuthTest">
            <failure message="Expected status 401 but got 200">Invalid credentials test failed</failure>
          </testcase>
          <testcase name="should logout successfully" time="0.5" classname="AuthTest">
            <system-out>Logout test passed</system-out>
          </testcase>
        </testsuite>
        <testsuite name="User Management Tests" tests="2" failures="0" errors="0" skipped="1" time="1.8" timestamp="2024-01-01T10:02:00">
          <testcase name="should create user" time="0.9" classname="UserTest">
            <system-out>User creation test passed</system-out>
          </testcase>
          <testcase name="should delete user" time="0.9" classname="UserTest">
            <skipped>Delete user test skipped</skipped>
          </testcase>
        </testsuite>
      </testsuites>`;
            const filePath = path.join(testDir, 'junit-results.xml');
            await fs.writeFile(filePath, junitXml, 'utf-8');
            const result = await parser.parseFile(filePath, 'junit');
            expect(result).toBeDefined();
            expect(result.framework).toBe('junit');
            expect(result.totalTests).toBe(5);
            expect(result.passedTests).toBe(3);
            expect(result.failedTests).toBe(1);
            expect(result.skippedTests).toBe(1);
            expect(result.duration).toBeGreaterThan(4); // Combined duration
            expect(result.results).toHaveLength(5);
            // Check specific test results
            const failedTest = result.results.find(test => test.status === 'failed');
            expect(failedTest).toBeDefined();
            expect(failedTest?.testName).toBe('should handle invalid credentials');
            expect(failedTest?.errorMessage).toContain('Invalid credentials test failed');
            const skippedTest = result.results.find(test => test.status === 'skipped');
            expect(skippedTest).toBeDefined();
            expect(skippedTest?.testName).toBe('should delete user');
        });
        it('should handle JUnit XML with error cases', async () => {
            const junitXml = `<?xml version="1.0" encoding="UTF-8"?>
      <testsuites>
        <testsuite name="Error Tests" tests="2" failures="0" errors="1" skipped="1" time="1.5">
          <testcase name="should handle network timeout" time="0.8" classname="NetworkTest">
            <error message="Network timeout occurred">Connection timeout after 30 seconds</error>
          </testcase>
          <testcase name="should validate input" time="0.7" classname="ValidationTest">
            <skipped>Validation test temporarily disabled</skipped>
          </testcase>
        </testsuite>
      </testsuites>`;
            const filePath = path.join(testDir, 'junit-errors.xml');
            await fs.writeFile(filePath, junitXml, 'utf-8');
            const result = await parser.parseFile(filePath, 'junit');
            expect(result).toBeDefined();
            expect(result.totalTests).toBe(2);
            expect(result.failedTests).toBe(0); // Errors are counted as failed in our implementation
            expect(result.skippedTests).toBe(1);
            const errorTest = result.results.find(test => test.errorMessage?.includes('timeout'));
            expect(errorTest).toBeDefined();
            expect(errorTest?.status).toBe('error');
        });
    });
    describe('Jest JSON Parsing Integration', () => {
        it('should parse Jest JSON results with comprehensive test data', async () => {
            const jestJson = {
                numTotalTests: 4,
                numPassedTests: 3,
                numFailedTests: 1,
                numPendingTests: 0,
                testResults: [
                    {
                        testFilePath: '/tests/auth.test.js',
                        testResults: [
                            {
                                title: 'should authenticate user',
                                status: 'passed',
                                duration: 150
                            },
                            {
                                title: 'should reject invalid password',
                                status: 'failed',
                                duration: 200,
                                failureMessages: [
                                    'expect(received).toBe(expected)',
                                    'Expected: 401',
                                    'Received: 200'
                                ]
                            },
                            {
                                title: 'should handle expired token',
                                status: 'passed',
                                duration: 100
                            }
                        ]
                    },
                    {
                        testFilePath: '/tests/user.test.js',
                        testResults: [
                            {
                                title: 'should create new user',
                                status: 'passed',
                                duration: 180
                            }
                        ]
                    }
                ]
            };
            const filePath = path.join(testDir, 'jest-results.json');
            await fs.writeFile(filePath, JSON.stringify(jestJson, null, 2), 'utf-8');
            const result = await parser.parseFile(filePath, 'jest');
            expect(result).toBeDefined();
            expect(result.framework).toBe('jest');
            expect(result.totalTests).toBe(4);
            expect(result.passedTests).toBe(3);
            expect(result.failedTests).toBe(1);
            expect(result.skippedTests).toBe(0);
            expect(result.results).toHaveLength(4);
            // Check failed test details
            const failedTest = result.results.find(test => test.status === 'failed');
            expect(failedTest).toBeDefined();
            expect(failedTest?.testName).toBe('should reject invalid password');
            expect(failedTest?.errorMessage).toContain('expect(received).toBe(expected)');
            expect(failedTest?.stackTrace).toContain('Expected: 401');
        });
        it('should handle Jest results with pending tests', async () => {
            const jestJson = {
                numTotalTests: 3,
                numPassedTests: 1,
                numFailedTests: 0,
                numPendingTests: 2,
                testResults: [
                    {
                        testFilePath: '/tests/integration.test.js',
                        testResults: [
                            {
                                title: 'should integrate with API',
                                status: 'passed',
                                duration: 500
                            },
                            {
                                title: 'should handle offline mode',
                                status: 'pending',
                                duration: 0
                            },
                            {
                                title: 'should cache responses',
                                status: 'todo',
                                duration: 0
                            }
                        ]
                    }
                ]
            };
            const filePath = path.join(testDir, 'jest-pending.json');
            await fs.writeFile(filePath, JSON.stringify(jestJson, null, 2), 'utf-8');
            const result = await parser.parseFile(filePath, 'jest');
            expect(result.totalTests).toBe(3);
            expect(result.passedTests).toBe(1);
            expect(result.failedTests).toBe(0);
            expect(result.skippedTests).toBe(2);
            const pendingTests = result.results.filter(test => test.status === 'skipped');
            expect(pendingTests).toHaveLength(2);
        });
    });
    describe('Mocha JSON Parsing Integration', () => {
        it('should parse Mocha JSON results with nested suites', async () => {
            const mochaJson = {
                stats: {
                    suites: 2,
                    tests: 5,
                    passes: 3,
                    pending: 1,
                    failures: 1,
                    start: '2024-01-01T10:00:00.000Z',
                    duration: 2500
                },
                suites: [
                    {
                        title: 'Authentication',
                        tests: [
                            {
                                title: 'should login',
                                state: 'passed',
                                duration: 500
                            },
                            {
                                title: 'should logout',
                                state: 'passed',
                                duration: 300
                            }
                        ]
                    },
                    {
                        title: 'User Management',
                        suites: [
                            {
                                title: 'Profile Management',
                                tests: [
                                    {
                                        title: 'should update profile',
                                        state: 'failed',
                                        duration: 400,
                                        err: {
                                            message: 'Profile update failed',
                                            stack: 'Error: Profile update failed\n    at test.js:25:10'
                                        }
                                    },
                                    {
                                        title: 'should view profile',
                                        state: 'passed',
                                        duration: 200
                                    },
                                    {
                                        title: 'should delete profile',
                                        state: 'pending',
                                        duration: 0
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };
            const filePath = path.join(testDir, 'mocha-results.json');
            await fs.writeFile(filePath, JSON.stringify(mochaJson, null, 2), 'utf-8');
            const result = await parser.parseFile(filePath, 'mocha');
            expect(result).toBeDefined();
            expect(result.framework).toBe('mocha');
            expect(result.totalTests).toBe(5);
            expect(result.passedTests).toBe(3);
            expect(result.failedTests).toBe(1);
            expect(result.skippedTests).toBe(1);
            expect(result.duration).toBe(2500);
            expect(result.results).toHaveLength(5);
            // Check nested suite structure
            const nestedTests = result.results.filter(test => test.testSuite.includes('Profile Management'));
            expect(nestedTests).toHaveLength(3);
            // Check failed test
            const failedTest = result.results.find(test => test.status === 'failed');
            expect(failedTest).toBeDefined();
            expect(failedTest?.errorMessage).toBe('Profile update failed');
            expect(failedTest?.stackTrace).toContain('at test.js:25:10');
        });
    });
    describe('Vitest JSON Parsing Integration', () => {
        it('should parse Vitest JSON results (similar to Jest)', async () => {
            const vitestJson = {
                numTotalTests: 3,
                numPassedTests: 2,
                numFailedTests: 1,
                numPendingTests: 0,
                testResults: [
                    {
                        testFilePath: '/tests/component.test.ts',
                        testResults: [
                            {
                                title: 'should render component',
                                status: 'passed',
                                duration: 120
                            },
                            {
                                title: 'should handle user interaction',
                                status: 'passed',
                                duration: 180
                            },
                            {
                                title: 'should validate form input',
                                status: 'failed',
                                duration: 150,
                                failureMessages: [
                                    'ValidationError: Invalid email format',
                                    'Expected valid email but got: invalid-email'
                                ]
                            }
                        ]
                    }
                ]
            };
            const filePath = path.join(testDir, 'vitest-results.json');
            await fs.writeFile(filePath, JSON.stringify(vitestJson, null, 2), 'utf-8');
            const result = await parser.parseFile(filePath, 'vitest');
            expect(result).toBeDefined();
            expect(result.framework).toBe('jest'); // Vitest uses Jest parser internally
            expect(result.totalTests).toBe(3);
            expect(result.passedTests).toBe(2);
            expect(result.failedTests).toBe(1);
            expect(result.results).toHaveLength(3);
        });
    });
    describe('Cypress JSON Parsing Integration', () => {
        it('should parse Cypress JSON results with spec structure', async () => {
            const cypressJson = {
                runUrl: 'https://dashboard.cypress.io/projects/abc123/runs/456',
                runs: [
                    {
                        spec: {
                            relative: 'integration/auth.spec.js'
                        },
                        tests: [
                            {
                                title: ['Login', 'should login with valid credentials'],
                                state: 'passed',
                                duration: 2500
                            },
                            {
                                title: ['Login', 'should show error for invalid credentials'],
                                state: 'failed',
                                duration: 1800,
                                err: {
                                    message: 'expected 401 but got 200',
                                    stack: 'AssertionError: expected 401 but got 200\n    at auth.spec.js:45:12'
                                }
                            }
                        ]
                    },
                    {
                        spec: {
                            relative: 'integration/user.spec.js'
                        },
                        tests: [
                            {
                                title: ['User Profile', 'should display user information'],
                                state: 'passed',
                                duration: 1200
                            }
                        ]
                    }
                ]
            };
            const filePath = path.join(testDir, 'cypress-results.json');
            await fs.writeFile(filePath, JSON.stringify(cypressJson, null, 2), 'utf-8');
            const result = await parser.parseFile(filePath, 'cypress');
            expect(result).toBeDefined();
            expect(result.framework).toBe('cypress');
            expect(result.totalTests).toBe(3);
            expect(result.passedTests).toBe(2);
            expect(result.failedTests).toBe(1);
            expect(result.results).toHaveLength(3);
            // Check nested test titles
            const loginTests = result.results.filter(test => test.testSuite === 'integration/auth.spec.js');
            expect(loginTests).toHaveLength(2);
            const failedTest = result.results.find(test => test.status === 'failed');
            expect(failedTest?.testName).toBe('Login > should show error for invalid credentials');
        });
    });
    describe('Playwright JSON Parsing Integration', () => {
        it('should parse Playwright JSON results with complex structure', async () => {
            const playwrightJson = {
                config: {
                    name: 'Playwright Tests'
                },
                suites: [
                    {
                        title: 'Authentication',
                        specs: [
                            {
                                file: 'auth.spec.ts',
                                tests: [
                                    {
                                        title: 'should login successfully',
                                        results: [
                                            {
                                                status: 'passed',
                                                duration: 1200
                                            }
                                        ]
                                    },
                                    {
                                        title: 'should handle login errors',
                                        results: [
                                            {
                                                status: 'failed',
                                                duration: 800,
                                                error: {
                                                    message: 'Login failed: Invalid credentials',
                                                    stack: 'Error: Login failed: Invalid credentials\n    at auth.spec.ts:67:8'
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };
            const filePath = path.join(testDir, 'playwright-results.json');
            await fs.writeFile(filePath, JSON.stringify(playwrightJson, null, 2), 'utf-8');
            const result = await parser.parseFile(filePath, 'playwright');
            expect(result).toBeDefined();
            expect(result.framework).toBe('playwright');
            expect(result.totalTests).toBe(2);
            expect(result.passedTests).toBe(1);
            expect(result.failedTests).toBe(1);
            expect(result.results).toHaveLength(2);
            // Check error handling
            const failedTest = result.results.find(test => test.status === 'failed');
            expect(failedTest).toBeDefined();
            expect(failedTest?.errorMessage).toContain('Login failed');
            expect(failedTest?.stackTrace).toContain('auth.spec.ts:67:8');
        });
    });
    describe('Content Parsing Integration', () => {
        it('should parse content directly without file I/O', async () => {
            const junitXml = `<?xml version="1.0" encoding="UTF-8"?>
      <testsuites>
        <testsuite name="Direct Parse Test" tests="2" failures="0" errors="0" skipped="0" time="1.0">
          <testcase name="test one" time="0.5" classname="DirectTest" />
          <testcase name="test two" time="0.5" classname="DirectTest" />
        </testsuite>
      </testsuites>`;
            const result = await parser.parseContent(junitXml, 'junit');
            expect(result).toBeDefined();
            expect(result.framework).toBe('junit');
            expect(result.totalTests).toBe(2);
            expect(result.passedTests).toBe(2);
            expect(result.results).toHaveLength(2);
        });
        it('should handle malformed content gracefully', async () => {
            const malformedJson = '{"incomplete": "json"';
            await expect(parser.parseContent(malformedJson, 'jest')).rejects.toThrow();
        });
    });
    describe('Error Handling Integration', () => {
        it('should handle non-existent files gracefully', async () => {
            const nonExistentPath = path.join(testDir, 'non-existent.xml');
            await expect(parser.parseFile(nonExistentPath, 'junit')).rejects.toThrow();
        });
        it('should handle empty files gracefully', async () => {
            const emptyFilePath = path.join(testDir, 'empty.xml');
            await fs.writeFile(emptyFilePath, '', 'utf-8');
            await expect(parser.parseFile(emptyFilePath, 'junit')).rejects.toThrow();
        });
        it('should handle unsupported formats', async () => {
            const validXml = '<?xml version="1.0"?><testsuites></testsuites>';
            const filePath = path.join(testDir, 'valid.xml');
            await fs.writeFile(filePath, validXml, 'utf-8');
            await expect(parser.parseFile(filePath, 'unsupported')).rejects.toThrow('Unsupported test format');
        });
        it('should handle invalid XML structure', async () => {
            const invalidXml = '<not-testsuites><invalid></invalid></not-testsuites>';
            const filePath = path.join(testDir, 'invalid.xml');
            await fs.writeFile(filePath, invalidXml, 'utf-8');
            const result = await parser.parseFile(filePath, 'junit');
            // Should still return a result, even if empty
            expect(result).toBeDefined();
            expect(result.results).toBeDefined();
        });
    });
    describe('Performance and Load Testing', () => {
        it('should handle large test result files efficiently', async () => {
            // Create a large JUnit XML with many test cases
            let largeXml = '<?xml version="1.0" encoding="UTF-8"?><testsuites><testsuite name="Load Test" tests="100" failures="0" errors="0" skipped="0" time="50.0">';
            for (let i = 0; i < 100; i++) {
                largeXml += `<testcase name="test_${i}" time="0.5" classname="LoadTest"><system-out>Test ${i} passed</system-out></testcase>`;
            }
            largeXml += '</testsuite></testsuites>';
            const filePath = path.join(testDir, 'large-results.xml');
            await fs.writeFile(filePath, largeXml, 'utf-8');
            const startTime = Date.now();
            const result = await parser.parseFile(filePath, 'junit');
            const endTime = Date.now();
            const duration = endTime - startTime;
            // Should complete within reasonable time
            expect(duration).toBeLessThan(5000); // 5 seconds max
            expect(result.totalTests).toBe(100);
            expect(result.results).toHaveLength(100);
        });
        it('should handle concurrent parsing requests', async () => {
            const testFiles = [];
            // Create multiple test files
            for (let i = 0; i < 5; i++) {
                const junitXml = `<?xml version="1.0" encoding="UTF-8"?>
        <testsuites>
          <testsuite name="Concurrent Test ${i}" tests="3" failures="0" errors="0" skipped="0" time="1.5">
            <testcase name="test_1" time="0.5" classname="ConcurrentTest" />
            <testcase name="test_2" time="0.5" classname="ConcurrentTest" />
            <testcase name="test_3" time="0.5" classname="ConcurrentTest" />
          </testsuite>
        </testsuites>`;
                const filePath = path.join(testDir, `concurrent-${i}.xml`);
                await fs.writeFile(filePath, junitXml, 'utf-8');
                testFiles.push(filePath);
            }
            const startTime = Date.now();
            // Parse all files concurrently
            const promises = testFiles.map(file => parser.parseFile(file, 'junit'));
            const results = await Promise.all(promises);
            const endTime = Date.now();
            const duration = endTime - startTime;
            // Should complete within reasonable time
            expect(duration).toBeLessThan(3000); // 3 seconds max for 5 concurrent files
            expect(results).toHaveLength(5);
            // All results should be valid
            results.forEach(result => {
                expect(result.totalTests).toBe(3);
                expect(result.passedTests).toBe(3);
            });
        });
    });
    describe('Real-world Scenario Testing', () => {
        it('should handle CI/CD pipeline test results', async () => {
            // Simulate a typical CI/CD test result with multiple formats
            const jestResults = {
                numTotalTests: 25,
                numPassedTests: 22,
                numFailedTests: 2,
                numPendingTests: 1,
                testResults: [
                    {
                        testFilePath: 'src/components/__tests__/Button.test.js',
                        testResults: [
                            { title: 'renders correctly', status: 'passed', duration: 45 },
                            { title: 'handles click events', status: 'passed', duration: 67 },
                            { title: 'shows loading state', status: 'failed', duration: 89, failureMessages: ['Expected loading spinner but was hidden'] },
                            { title: 'supports custom styles', status: 'pending', duration: 0 }
                        ]
                    },
                    {
                        testFilePath: 'src/api/__tests__/userApi.test.js',
                        testResults: [
                            { title: 'fetches user data', status: 'passed', duration: 234 },
                            { title: 'handles network errors', status: 'passed', duration: 156 },
                            { title: 'validates response format', status: 'failed', duration: 198, failureMessages: ['Expected user object but got null'] },
                            { title: 'caches responses', status: 'passed', duration: 123 }
                        ]
                    }
                ]
            };
            const filePath = path.join(testDir, 'ci-results.json');
            await fs.writeFile(filePath, JSON.stringify(jestResults, null, 2), 'utf-8');
            const result = await parser.parseFile(filePath, 'jest');
            expect(result.totalTests).toBe(8); // 4 + 4 tests
            expect(result.passedTests).toBe(5);
            expect(result.failedTests).toBe(2);
            expect(result.skippedTests).toBe(1);
            // Verify test file paths are preserved
            const buttonTests = result.results.filter(test => test.testSuite.includes('Button'));
            const apiTests = result.results.filter(test => test.testSuite.includes('userApi'));
            expect(buttonTests).toHaveLength(4);
            expect(apiTests).toHaveLength(4);
        });
        it('should handle integration test results with performance metrics', async () => {
            const mochaResults = {
                stats: {
                    suites: 1,
                    tests: 3,
                    passes: 2,
                    pending: 0,
                    failures: 1,
                    duration: 5000
                },
                suites: [
                    {
                        title: 'Integration Tests',
                        tests: [
                            {
                                title: 'should complete API workflow',
                                state: 'passed',
                                duration: 1200,
                                performance: {
                                    memoryUsage: 45.2,
                                    cpuUsage: 12.5,
                                    networkRequests: 15
                                }
                            },
                            {
                                title: 'should handle database operations',
                                state: 'passed',
                                duration: 1800,
                                performance: {
                                    memoryUsage: 67.8,
                                    cpuUsage: 23.1,
                                    networkRequests: 8
                                }
                            },
                            {
                                title: 'should process large datasets',
                                state: 'failed',
                                duration: 2000,
                                err: {
                                    message: 'Memory limit exceeded',
                                    stack: 'Error: Memory limit exceeded\n    at integration.test.js:123:45'
                                },
                                performance: {
                                    memoryUsage: 95.5,
                                    cpuUsage: 78.9,
                                    networkRequests: 25
                                }
                            }
                        ]
                    }
                ]
            };
            const filePath = path.join(testDir, 'integration-results.json');
            await fs.writeFile(filePath, JSON.stringify(mochaResults, null, 2), 'utf-8');
            const result = await parser.parseFile(filePath, 'mocha');
            expect(result.totalTests).toBe(3);
            expect(result.passedTests).toBe(2);
            expect(result.failedTests).toBe(1);
            expect(result.duration).toBe(5000);
            // Check that all tests have duration information
            result.results.forEach(testResult => {
                expect(testResult.duration).toBeGreaterThan(0);
            });
        });
    });
});
//# sourceMappingURL=TestResultParser.integration.test.js.map
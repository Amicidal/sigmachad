/**
 * Services Functional Tests
 * Tests actual service functionality and behavior
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
describe('Service Functionality Tests', () => {
    let tempDir;
    beforeEach(async () => {
        // Create a temporary directory for test files
        tempDir = path.join(tmpdir(), `test-${uuidv4()}`);
        await fs.mkdir(tempDir, { recursive: true });
    });
    afterEach(async () => {
        // Clean up temporary directory
        await fs.rm(tempDir, { recursive: true, force: true });
    });
    describe('ASTParser Service', () => {
        let ASTParser;
        beforeEach(async () => {
            const module = await import('../src/services/ASTParser.js');
            ASTParser = module.ASTParser;
        });
        it('should parse TypeScript file and extract entities', async () => {
            const parser = new ASTParser();
            // Create a test TypeScript file
            const testFile = path.join(tempDir, 'test.ts');
            const testCode = `
        export class TestClass {
          private value: number;
          
          constructor(value: number) {
            this.value = value;
          }
          
          getValue(): number {
            return this.value;
          }
        }
        
        export interface TestInterface {
          id: string;
          name: string;
        }
        
        export function testFunction(param: string): void {
          console.log(param);
        }
        
        export type TestType = string | number;
      `;
            await fs.writeFile(testFile, testCode);
            const result = await parser.parseFile(testFile);
            expect(result).toBeDefined();
            expect(result.entities).toBeInstanceOf(Array);
            expect(result.entities.length).toBeGreaterThan(0);
            // Check for specific entities
            const classEntity = result.entities.find((e) => e.entityType === 'class' && e.name === 'TestClass');
            expect(classEntity).toBeDefined();
            const interfaceEntity = result.entities.find((e) => e.entityType === 'interface' && e.name === 'TestInterface');
            expect(interfaceEntity).toBeDefined();
            const functionEntity = result.entities.find((e) => e.entityType === 'function' && e.name === 'testFunction');
            expect(functionEntity).toBeDefined();
        });
        it('should handle parse errors gracefully', async () => {
            const parser = new ASTParser();
            // Create a file with syntax errors
            const testFile = path.join(tempDir, 'error.ts');
            const invalidCode = `
        export class TestClass {
          // Missing closing brace
          getValue() {
            return this.value
      `;
            await fs.writeFile(testFile, invalidCode);
            const result = await parser.parseFile(testFile);
            expect(result).toBeDefined();
            expect(result.errors).toBeDefined();
            expect(result.errors.length).toBeGreaterThan(0);
        });
        it('should extract relationships between entities', async () => {
            const parser = new ASTParser();
            const testFile = path.join(tempDir, 'relationships.ts');
            const testCode = `
        class BaseClass {
          baseMethod() {}
        }
        
        class DerivedClass extends BaseClass {
          derivedMethod() {
            this.baseMethod();
          }
        }
        
        interface IService {
          process(): void;
        }
        
        class ServiceImpl implements IService {
          process() {
            console.log('Processing');
          }
        }
      `;
            await fs.writeFile(testFile, testCode);
            const result = await parser.parseFile(testFile);
            expect(result.relationships).toBeDefined();
            expect(result.relationships.length).toBeGreaterThan(0);
            // Check for inheritance relationship
            const inheritanceRel = result.relationships.find((r) => r.type === 'extends');
            expect(inheritanceRel).toBeDefined();
            // Check for implementation relationship
            const implementsRel = result.relationships.find((r) => r.type === 'implements');
            expect(implementsRel).toBeDefined();
        });
    });
    describe('DocumentationParser Service', () => {
        let DocumentationParser;
        beforeEach(async () => {
            const module = await import('../src/services/DocumentationParser.js');
            DocumentationParser = module.DocumentationParser;
        });
        it('should parse markdown documentation', async () => {
            const parser = new DocumentationParser();
            const testFile = path.join(tempDir, 'README.md');
            const testContent = `
        # Test Project
        
        ## Installation
        \`\`\`bash
        npm install
        \`\`\`
        
        ## API Reference
        
        ### Function: processData
        Processes input data and returns results.
        
        **Parameters:**
        - \`input\` (string): The input data
        - \`options\` (object): Processing options
        
        **Returns:** ProcessedResult
        
        ## Examples
        
        \`\`\`typescript
        const result = processData('test', { verbose: true });
        \`\`\`
      `;
            await fs.writeFile(testFile, testContent);
            const result = await parser.parseDocumentation(testFile);
            expect(result).toBeDefined();
            expect(result.sections).toBeDefined();
            expect(result.sections.length).toBeGreaterThan(0);
            // Check for specific sections
            const installSection = result.sections.find((s) => s.title === 'Installation');
            expect(installSection).toBeDefined();
            const apiSection = result.sections.find((s) => s.title === 'API Reference');
            expect(apiSection).toBeDefined();
        });
        it('should extract code blocks from documentation', async () => {
            const parser = new DocumentationParser();
            const testFile = path.join(tempDir, 'docs.md');
            const testContent = `
        # Code Examples
        
        \`\`\`javascript
        const example = 'test';
        console.log(example);
        \`\`\`
        
        \`\`\`python
        def hello():
            print("Hello, World!")
        \`\`\`
      `;
            await fs.writeFile(testFile, testContent);
            const result = await parser.parseDocumentation(testFile);
            expect(result.codeBlocks).toBeDefined();
            expect(result.codeBlocks.length).toBe(2);
            expect(result.codeBlocks[0].language).toBe('javascript');
            expect(result.codeBlocks[1].language).toBe('python');
        });
    });
    describe('FileWatcher Service', () => {
        let FileWatcher;
        beforeEach(async () => {
            const module = await import('../src/services/FileWatcher.js');
            FileWatcher = module.FileWatcher;
        });
        it('should detect file changes', async () => {
            const watcher = new FileWatcher({
                paths: [tempDir],
                ignore: ['node_modules', '.git']
            });
            const changePromise = new Promise((resolve) => {
                watcher.on('change', (file) => {
                    resolve(file);
                });
            });
            await watcher.start();
            // Create a file to trigger change event
            const testFile = path.join(tempDir, 'trigger.txt');
            await fs.writeFile(testFile, 'initial content');
            // Modify the file
            await fs.writeFile(testFile, 'modified content');
            const changedFile = await Promise.race([
                changePromise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]);
            expect(changedFile).toBeDefined();
            await watcher.stop();
        });
        it('should ignore specified patterns', async () => {
            const watcher = new FileWatcher({
                paths: [tempDir],
                ignore: ['*.tmp', 'temp_*']
            });
            const changes = [];
            watcher.on('change', (file) => {
                changes.push(file);
            });
            await watcher.start();
            // Create files that should be ignored
            await fs.writeFile(path.join(tempDir, 'test.tmp'), 'ignored');
            await fs.writeFile(path.join(tempDir, 'temp_file.txt'), 'ignored');
            // Create a file that should be watched
            await fs.writeFile(path.join(tempDir, 'watched.txt'), 'content');
            // Wait a bit for events to process
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Only the non-ignored file should trigger changes
            const watchedChanges = changes.filter(f => !f.includes('.tmp') && !f.includes('temp_'));
            expect(watchedChanges.length).toBeGreaterThan(0);
            await watcher.stop();
        });
    });
    describe('SecurityScanner Service', () => {
        let SecurityScanner;
        beforeEach(async () => {
            const module = await import('../src/services/SecurityScanner.js');
            SecurityScanner = module.SecurityScanner;
        });
        it('should detect security vulnerabilities in code', async () => {
            const scanner = new SecurityScanner();
            await scanner.initialize();
            const testFile = path.join(tempDir, 'vulnerable.js');
            const vulnerableCode = `
        const mysql = require('mysql');
        const express = require('express');
        const app = express();
        
        app.get('/user', (req, res) => {
          const userId = req.query.id;
          // SQL Injection vulnerability
          const query = "SELECT * FROM users WHERE id = " + userId;
          connection.query(query, (err, results) => {
            res.json(results);
          });
        });
        
        app.get('/eval', (req, res) => {
          const code = req.query.code;
          // Code injection vulnerability
          eval(code);
          res.send('Executed');
        });
        
        // Hardcoded credentials
        const apiKey = 'sk-1234567890abcdef';
        const password = 'admin123';
      `;
            await fs.writeFile(testFile, vulnerableCode);
            const results = await scanner.scanFile(testFile);
            expect(results).toBeDefined();
            expect(results.vulnerabilities).toBeDefined();
            expect(results.vulnerabilities.length).toBeGreaterThan(0);
            // Check for specific vulnerability types
            const sqlInjection = results.vulnerabilities.find((v) => v.type === 'SQL_INJECTION' || v.message.toLowerCase().includes('sql'));
            expect(sqlInjection).toBeDefined();
            const codeInjection = results.vulnerabilities.find((v) => v.type === 'CODE_INJECTION' || v.message.toLowerCase().includes('eval'));
            expect(codeInjection).toBeDefined();
            const hardcodedSecret = results.vulnerabilities.find((v) => v.type === 'HARDCODED_SECRET' || v.message.toLowerCase().includes('credential'));
            expect(hardcodedSecret).toBeDefined();
        });
        it('should provide severity levels for vulnerabilities', async () => {
            const scanner = new SecurityScanner();
            await scanner.initialize();
            const testFile = path.join(tempDir, 'test-severity.js');
            const code = `
        // High severity - eval with user input
        eval(userInput);
        
        // Medium severity - weak crypto
        const crypto = require('crypto');
        crypto.createHash('md5');
        
        // Low severity - console.log in production
        console.log(sensitiveData);
      `;
            await fs.writeFile(testFile, code);
            const results = await scanner.scanFile(testFile);
            expect(results.vulnerabilities).toBeDefined();
            const severities = results.vulnerabilities.map((v) => v.severity);
            expect(severities).toContain('high');
            expect(severities).toContain('medium');
        });
    });
    describe('TestEngine Service', () => {
        let TestEngine;
        beforeEach(async () => {
            const module = await import('../src/services/TestEngine.js');
            TestEngine = module.TestEngine;
        });
        it('should generate test cases for functions', async () => {
            const engine = new TestEngine();
            const functionCode = `
        function calculateDiscount(price: number, percentage: number): number {
          if (price <= 0) {
            throw new Error('Price must be positive');
          }
          if (percentage < 0 || percentage > 100) {
            throw new Error('Percentage must be between 0 and 100');
          }
          return price * (1 - percentage / 100);
        }
      `;
            const testCases = await engine.generateTestCases({
                code: functionCode,
                functionName: 'calculateDiscount',
                parameters: [
                    { name: 'price', type: 'number' },
                    { name: 'percentage', type: 'number' }
                ]
            });
            expect(testCases).toBeDefined();
            expect(testCases.length).toBeGreaterThan(0);
            // Should generate edge cases
            const edgeCases = testCases.filter((tc) => tc.type === 'edge');
            expect(edgeCases.length).toBeGreaterThan(0);
            // Should generate error cases
            const errorCases = testCases.filter((tc) => tc.type === 'error');
            expect(errorCases.length).toBeGreaterThan(0);
        });
        it('should run tests and report results', async () => {
            const engine = new TestEngine();
            // Create a simple test file
            const testFile = path.join(tempDir, 'sample.test.js');
            const testCode = `
        describe('Sample Test', () => {
          it('should pass', () => {
            expect(1 + 1).toBe(2);
          });
          
          it('should handle arrays', () => {
            expect([1, 2, 3]).toContain(2);
          });
        });
      `;
            await fs.writeFile(testFile, testCode);
            const results = await engine.runTests({
                testFiles: [testFile],
                framework: 'jest'
            });
            expect(results).toBeDefined();
            expect(results.passed).toBeDefined();
            expect(results.failed).toBeDefined();
            expect(results.totalTests).toBe(2);
        });
    });
    describe('KnowledgeGraphService', () => {
        let KnowledgeGraphService;
        let service;
        beforeEach(async () => {
            const module = await import('../src/services/KnowledgeGraphService.js');
            KnowledgeGraphService = module.KnowledgeGraphService;
            service = new KnowledgeGraphService();
        });
        it('should add and retrieve entities from the graph', async () => {
            await service.initialize();
            const entity = {
                id: uuidv4(),
                type: 'function',
                name: 'testFunction',
                metadata: {
                    parameters: ['param1', 'param2'],
                    returnType: 'string'
                }
            };
            await service.addEntity(entity);
            const retrieved = await service.getEntity(entity.id);
            expect(retrieved).toBeDefined();
            expect(retrieved.name).toBe('testFunction');
            expect(retrieved.metadata.parameters).toEqual(['param1', 'param2']);
        });
        it('should create and query relationships', async () => {
            await service.initialize();
            const func1 = {
                id: uuidv4(),
                type: 'function',
                name: 'caller'
            };
            const func2 = {
                id: uuidv4(),
                type: 'function',
                name: 'callee'
            };
            await service.addEntity(func1);
            await service.addEntity(func2);
            await service.addRelationship({
                from: func1.id,
                to: func2.id,
                type: 'calls'
            });
            const relationships = await service.getRelationships(func1.id);
            expect(relationships).toBeDefined();
            expect(relationships.length).toBe(1);
            expect(relationships[0].type).toBe('calls');
            expect(relationships[0].to).toBe(func2.id);
        });
        it('should perform graph traversal queries', async () => {
            await service.initialize();
            // Create a simple dependency graph
            const entities = [
                { id: '1', type: 'module', name: 'moduleA' },
                { id: '2', type: 'module', name: 'moduleB' },
                { id: '3', type: 'module', name: 'moduleC' },
                { id: '4', type: 'module', name: 'moduleD' }
            ];
            for (const entity of entities) {
                await service.addEntity(entity);
            }
            // Create relationships: A -> B -> C, A -> D
            await service.addRelationship({ from: '1', to: '2', type: 'imports' });
            await service.addRelationship({ from: '2', to: '3', type: 'imports' });
            await service.addRelationship({ from: '1', to: '4', type: 'imports' });
            // Query all dependencies of moduleA
            const dependencies = await service.getDependencies('1');
            expect(dependencies).toBeDefined();
            expect(dependencies.length).toBe(3); // B, C, D
            // Query direct dependencies only
            const directDeps = await service.getDependencies('1', { depth: 1 });
            expect(directDeps.length).toBe(2); // B, D
        });
    });
    describe('SynchronizationCoordinator Service', () => {
        let SynchronizationCoordinator;
        beforeEach(async () => {
            const module = await import('../src/services/SynchronizationCoordinator.js');
            SynchronizationCoordinator = module.SynchronizationCoordinator;
        });
        it('should coordinate file change synchronization', async () => {
            const coordinator = new SynchronizationCoordinator();
            const changes = [
                {
                    type: 'modified',
                    path: '/src/test.ts',
                    timestamp: new Date()
                },
                {
                    type: 'added',
                    path: '/src/new.ts',
                    timestamp: new Date()
                }
            ];
            const operationId = await coordinator.synchronizeFileChanges(changes);
            expect(operationId).toBeDefined();
            expect(typeof operationId).toBe('string');
            const status = coordinator.getOperationStatus(operationId);
            expect(status).toBeDefined();
            expect(['pending', 'in_progress', 'completed', 'failed']).toContain(status.status);
        });
        it('should handle synchronization conflicts', async () => {
            const coordinator = new SynchronizationCoordinator();
            // Simulate conflicting changes
            const changes = [
                {
                    type: 'modified',
                    path: '/src/shared.ts',
                    timestamp: new Date(),
                    source: 'user1'
                },
                {
                    type: 'modified',
                    path: '/src/shared.ts',
                    timestamp: new Date(),
                    source: 'user2'
                }
            ];
            const operationId = await coordinator.synchronizeFileChanges(changes);
            const status = coordinator.getOperationStatus(operationId);
            if (status.conflicts && status.conflicts.length > 0) {
                expect(status.conflicts[0].path).toBe('/src/shared.ts');
                expect(status.conflicts[0].resolution).toBeDefined();
            }
        });
        it('should emit synchronization events', async () => {
            const coordinator = new SynchronizationCoordinator();
            const events = [];
            coordinator.on('operationStarted', (data) => events.push({ type: 'started', data }));
            coordinator.on('operationCompleted', (data) => events.push({ type: 'completed', data }));
            coordinator.on('operationFailed', (data) => events.push({ type: 'failed', data }));
            const changes = [{ type: 'modified', path: '/src/test.ts', timestamp: new Date() }];
            await coordinator.synchronizeFileChanges(changes);
            // Wait for async events
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(events.length).toBeGreaterThan(0);
            expect(events.some(e => e.type === 'started')).toBe(true);
        });
    });
    describe('ConflictResolution Service', () => {
        let ConflictResolution;
        beforeEach(async () => {
            const module = await import('../src/services/ConflictResolution.js');
            ConflictResolution = module.ConflictResolution;
        });
        it('should detect conflicts between changes', async () => {
            const resolver = new ConflictResolution();
            const change1 = {
                file: '/src/shared.ts',
                line: 10,
                content: 'const value = 1;',
                timestamp: new Date('2024-01-01T10:00:00Z')
            };
            const change2 = {
                file: '/src/shared.ts',
                line: 10,
                content: 'const value = 2;',
                timestamp: new Date('2024-01-01T10:00:01Z')
            };
            const conflict = resolver.detectConflict(change1, change2);
            expect(conflict).toBeDefined();
            expect(conflict.hasConflict).toBe(true);
            expect(conflict.type).toBe('content');
        });
        it('should resolve conflicts using different strategies', async () => {
            const resolver = new ConflictResolution();
            const conflict = {
                file: '/src/test.ts',
                line: 5,
                local: 'const x = 1;',
                remote: 'const x = 2;',
                base: 'const x = 0;'
            };
            // Test "ours" strategy
            const oursResolution = await resolver.resolveConflict(conflict, 'ours');
            expect(oursResolution.content).toBe('const x = 1;');
            // Test "theirs" strategy
            const theirsResolution = await resolver.resolveConflict(conflict, 'theirs');
            expect(theirsResolution.content).toBe('const x = 2;');
            // Test "merge" strategy (if implemented)
            const mergeResolution = await resolver.resolveConflict(conflict, 'merge');
            expect(mergeResolution).toBeDefined();
        });
        it('should track conflict resolution history', async () => {
            const resolver = new ConflictResolution();
            const conflict = {
                id: uuidv4(),
                file: '/src/test.ts',
                line: 10,
                local: 'local content',
                remote: 'remote content'
            };
            const resolution = await resolver.resolveConflict(conflict, 'ours');
            const history = resolver.getResolutionHistory(conflict.file);
            expect(history).toBeDefined();
            expect(history.length).toBeGreaterThan(0);
            expect(history[0].conflictId).toBe(conflict.id);
            expect(history[0].strategy).toBe('ours');
        });
    });
    describe('RollbackCapabilities Service', () => {
        let RollbackCapabilities;
        beforeEach(async () => {
            const module = await import('../src/services/RollbackCapabilities.js');
            RollbackCapabilities = module.RollbackCapabilities;
        });
        it('should create and manage rollback points', async () => {
            const rollback = new RollbackCapabilities();
            const pointId = await rollback.createRollbackPoint('before-refactor', 'Before major refactoring');
            expect(pointId).toBeDefined();
            expect(typeof pointId).toBe('string');
            const points = rollback.listRollbackPoints();
            expect(points).toBeDefined();
            expect(points.some((p) => p.id === pointId)).toBe(true);
        });
        it('should capture system state at rollback point', async () => {
            const rollback = new RollbackCapabilities();
            // Simulate current system state
            const currentState = {
                files: [
                    { path: '/src/app.ts', hash: 'abc123' },
                    { path: '/src/utils.ts', hash: 'def456' }
                ],
                database: {
                    version: '1.2.3',
                    entities: 150
                }
            };
            const pointId = await rollback.createRollbackPoint('test-point', 'Test rollback point', currentState);
            const point = rollback.getRollbackPoint(pointId);
            expect(point).toBeDefined();
            expect(point.state).toEqual(currentState);
        });
        it('should perform rollback to a specific point', async () => {
            const rollback = new RollbackCapabilities();
            // Create initial state
            const initialState = {
                version: '1.0.0',
                files: ['file1.ts', 'file2.ts']
            };
            const point1 = await rollback.createRollbackPoint('v1', 'Version 1', initialState);
            // Simulate changes
            const newState = {
                version: '2.0.0',
                files: ['file1.ts', 'file2.ts', 'file3.ts']
            };
            const point2 = await rollback.createRollbackPoint('v2', 'Version 2', newState);
            // Rollback to first point
            const result = await rollback.rollbackToPoint(point1);
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.restoredState).toEqual(initialState);
        });
        it('should clean up old rollback points', async () => {
            const rollback = new RollbackCapabilities();
            // Create multiple rollback points
            const points = [];
            for (let i = 0; i < 10; i++) {
                const id = await rollback.createRollbackPoint(`point-${i}`, `Test point ${i}`);
                points.push(id);
            }
            // Clean up old points (keep last 5)
            rollback.cleanupOldPoints(5);
            const remainingPoints = rollback.listRollbackPoints();
            expect(remainingPoints.length).toBeLessThanOrEqual(5);
            // Newest points should be kept
            expect(remainingPoints.some((p) => p.id === points[9])).toBe(true);
        });
    });
    describe('SynchronizationMonitoring Service', () => {
        let SynchronizationMonitoring;
        beforeEach(async () => {
            const module = await import('../src/services/SynchronizationMonitoring.js');
            SynchronizationMonitoring = module.SynchronizationMonitoring;
        });
        it('should monitor synchronization operations', async () => {
            const monitor = new SynchronizationMonitoring();
            const operation = {
                id: uuidv4(),
                type: 'file_sync',
                timestamp: new Date()
            };
            monitor.recordOperationStart(operation);
            // Simulate operation completion
            await new Promise(resolve => setTimeout(resolve, 100));
            monitor.recordOperationComplete({
                ...operation,
                duration: 100,
                status: 'success'
            });
            const metrics = monitor.getMetrics();
            expect(metrics).toBeDefined();
            expect(metrics.totalOperations).toBe(1);
            expect(metrics.successfulOperations).toBe(1);
        });
        it('should track operation failures and errors', async () => {
            const monitor = new SynchronizationMonitoring();
            const operation = {
                id: uuidv4(),
                type: 'database_sync',
                timestamp: new Date()
            };
            monitor.recordOperationStart(operation);
            const error = new Error('Connection timeout');
            monitor.recordOperationFailed(operation, error);
            const metrics = monitor.getMetrics();
            expect(metrics.failedOperations).toBe(1);
            expect(metrics.errors).toBeDefined();
            expect(metrics.errors.length).toBe(1);
            expect(metrics.errors[0].message).toBe('Connection timeout');
        });
        it('should calculate performance statistics', async () => {
            const monitor = new SynchronizationMonitoring();
            // Record multiple operations with different durations
            const durations = [100, 200, 150, 300, 250];
            for (const duration of durations) {
                const op = { id: uuidv4(), type: 'sync', timestamp: new Date() };
                monitor.recordOperationStart(op);
                await new Promise(resolve => setTimeout(resolve, duration));
                monitor.recordOperationComplete({ ...op, duration, status: 'success' });
            }
            const stats = monitor.getPerformanceStats();
            expect(stats).toBeDefined();
            expect(stats.averageDuration).toBe(200); // (100+200+150+300+250)/5
            expect(stats.minDuration).toBe(100);
            expect(stats.maxDuration).toBe(300);
        });
        it('should monitor conflict occurrences', async () => {
            const monitor = new SynchronizationMonitoring();
            const conflict1 = {
                id: uuidv4(),
                file: '/src/test.ts',
                type: 'content',
                timestamp: new Date()
            };
            const conflict2 = {
                id: uuidv4(),
                file: '/src/utils.ts',
                type: 'merge',
                timestamp: new Date()
            };
            monitor.recordConflict(conflict1);
            monitor.recordConflict(conflict2);
            const metrics = monitor.getMetrics();
            expect(metrics.conflicts).toBeDefined();
            expect(metrics.conflicts.total).toBe(2);
            expect(metrics.conflicts.byType.content).toBe(1);
            expect(metrics.conflicts.byType.merge).toBe(1);
        });
    });
    describe('TestResultParser Service', () => {
        let TestResultParser;
        beforeEach(async () => {
            const module = await import('../src/services/TestResultParser.js');
            TestResultParser = module.TestResultParser;
        });
        it('should parse Jest test results', async () => {
            const parser = new TestResultParser();
            const jestOutput = `
        PASS  src/utils.test.ts
          Math utilities
            ✓ should add numbers correctly (5 ms)
            ✓ should multiply numbers correctly (2 ms)
          String utilities
            ✓ should capitalize strings (1 ms)
            ✗ should trim whitespace
        
        Test Suites: 1 passed, 1 total
        Tests:       3 passed, 1 failed, 4 total
        Snapshots:   0 total
        Time:        2.456 s
      `;
            const results = parser.parseJestOutput(jestOutput);
            expect(results).toBeDefined();
            expect(results.totalTests).toBe(4);
            expect(results.passedTests).toBe(3);
            expect(results.failedTests).toBe(1);
            expect(results.testSuites).toBe(1);
            expect(results.duration).toBe(2.456);
        });
        it('should parse test coverage reports', async () => {
            const parser = new TestResultParser();
            const coverageData = {
                total: {
                    lines: { total: 100, covered: 85, percentage: 85 },
                    statements: { total: 120, covered: 102, percentage: 85 },
                    functions: { total: 30, covered: 25, percentage: 83.33 },
                    branches: { total: 40, covered: 32, percentage: 80 }
                },
                files: [
                    {
                        path: 'src/utils.ts',
                        lines: { total: 50, covered: 45, percentage: 90 }
                    },
                    {
                        path: 'src/app.ts',
                        lines: { total: 50, covered: 40, percentage: 80 }
                    }
                ]
            };
            const report = parser.parseCoverageReport(coverageData);
            expect(report).toBeDefined();
            expect(report.totalCoverage).toBe(85);
            expect(report.lineCoverage).toBe(85);
            expect(report.functionCoverage).toBe(83.33);
            expect(report.branchCoverage).toBe(80);
            expect(report.files).toHaveLength(2);
        });
        it('should identify test failures and errors', async () => {
            const parser = new TestResultParser();
            const failureOutput = `
        FAIL  src/api.test.ts
          ● API Client › should handle errors
        
            expect(received).toBe(expected)
        
            Expected: 200
            Received: 404
        
              15 |   const response = await client.get('/users');
            > 16 |   expect(response.status).toBe(200);
                 |                            ^
              17 | });
        
            at Object.<anonymous> (src/api.test.ts:16:28)
      `;
            const failures = parser.parseTestFailures(failureOutput);
            expect(failures).toBeDefined();
            expect(failures.length).toBeGreaterThan(0);
            expect(failures[0].test).toBe('API Client › should handle errors');
            expect(failures[0].file).toBe('src/api.test.ts');
            expect(failures[0].line).toBe(16);
            expect(failures[0].expected).toBe('200');
            expect(failures[0].received).toBe('404');
        });
    });
});
//# sourceMappingURL=services-coverage.test.js.map
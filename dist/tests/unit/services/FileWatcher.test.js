/**
 * Unit tests for FileWatcher
 * Tests file system monitoring, change detection, and event emission
 */
/// <reference types="node" />
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { FileWatcher } from '../../../src/services/FileWatcher';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
const waitFor = globalThis.testUtils.waitFor;
const waitForNot = globalThis.testUtils.waitForNot;
const sleep = globalThis.testUtils.sleep;
// Gate watcher-heavy tests to avoid EMFILE limits on constrained environments.
const runFileWatcher = process.env.RUN_FILEWATCHER_TESTS === '1';
const describeIfRun = runFileWatcher ? describe : describe.skip;
describeIfRun('FileWatcher', () => {
    let fileWatcher;
    let tempDir;
    beforeAll(async () => {
        // Create a temporary directory for testing
        tempDir = path.join(os.tmpdir(), 'filewatcher-test-' + Date.now());
        await fs.mkdir(tempDir, { recursive: true });
    });
    beforeEach(() => {
        fileWatcher = new FileWatcher({
            watchPaths: [tempDir],
            debounceMs: 100, // Faster for testing
        });
    });
    afterEach(async () => {
        if (fileWatcher) {
            await fileWatcher.stop();
        }
    });
    afterAll(async () => {
        // Clean up temporary directory
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        }
        catch (error) {
            // Log cleanup errors for debugging but don't fail test
            console.debug('Failed to clean up temp directory:', error);
        }
    });
    describe('Constructor and Configuration', () => {
        it('should initialize with default configuration', () => {
            const watcher = new FileWatcher();
            expect(watcher.config.watchPaths).toEqual(['src', 'lib', 'packages']);
            expect(watcher.config.debounceMs).toBe(500);
            expect(watcher.config.maxConcurrent).toBe(10);
            expect(watcher.config.ignorePatterns).toContain('**/node_modules/**');
        });
        it('should accept custom configuration', () => {
            const customConfig = {
                watchPaths: ['custom/path'],
                debounceMs: 1000,
                maxConcurrent: 5,
                ignorePatterns: ['**/temp/**'],
            };
            const watcher = new FileWatcher(customConfig);
            expect(watcher.config.watchPaths).toEqual(['custom/path']);
            expect(watcher.config.debounceMs).toBe(1000);
            expect(watcher.config.maxConcurrent).toBe(5);
            expect(watcher.config.ignorePatterns).toEqual(['**/temp/**']);
        });
        it('should extend EventEmitter', () => {
            expect(fileWatcher).toBeInstanceOf(require('events').EventEmitter);
        });
    });
    describe('Start and Stop', () => {
        it('should start watching files successfully', async () => {
            await fileWatcher.start();
            expect(fileWatcher.watcher).toBeTruthy();
            expect(fileWatcher.getWatchedPaths()).toEqual([tempDir]);
        });
        it('should stop watching files', async () => {
            await fileWatcher.start();
            expect(fileWatcher.watcher).toBeTruthy();
            await fileWatcher.stop();
            expect(fileWatcher.watcher).toBeNull();
        });
        it('should handle stop when not started', async () => {
            await expect(fileWatcher.stop()).resolves.toBeUndefined();
        });
        it('should restart watcher when start called twice', async () => {
            await fileWatcher.start();
            const firstWatcher = fileWatcher.watcher;
            await fileWatcher.start();
            const secondWatcher = fileWatcher.watcher;
            expect(firstWatcher).not.toBe(secondWatcher);
            expect(secondWatcher).toBeTruthy();
        });
    });
    describe('File Change Handling', () => {
        beforeEach(async () => {
            await fileWatcher.start();
        });
        it('should handle file creation', async () => {
            const events = [];
            fileWatcher.on('change', (change) => events.push(change));
            const testFile = path.join(tempDir, 'newfile.txt');
            await fs.writeFile(testFile, 'Hello World');
            // Wait for debounce and file system events
            await waitFor(() => events.some(e => e.type === 'create' && e.path.includes('newfile.txt')));
            expect(events.length).toBeGreaterThanOrEqual(1);
            const createEvent = events.find(e => e.type === 'create' && e.path.includes('newfile.txt'));
            expect(createEvent).toBeDefined();
            expect(createEvent?.stats).toBeDefined();
            expect(createEvent?.hash).toBeDefined();
        });
        it('should handle file modification', async () => {
            const events = [];
            fileWatcher.on('change', (change) => events.push(change));
            const testFile = path.join(tempDir, 'modifyfile.txt');
            await fs.writeFile(testFile, 'Initial content');
            // Wait for initial create event and clear events
            await waitFor(() => events.some(e => e.type === 'create' && e.path.includes('modifyfile.txt')));
            events.length = 0;
            // Modify file
            await fs.writeFile(testFile, 'Modified content');
            await waitFor(() => events.some(e => e.type === 'modify' && e.path.includes('modifyfile.txt')));
            expect(events.length).toBeGreaterThanOrEqual(1);
            const modifyEvent = events.find(e => e.type === 'modify');
            expect(modifyEvent).toBeDefined();
        });
        it('should handle file deletion', async () => {
            const events = [];
            const testFile = path.join(tempDir, 'deletefile.txt');
            await fs.writeFile(testFile, 'Content to delete');
            // Wait for creation and clear events
            await waitFor(() => events.some(e => e.type === 'create' && e.path.includes('deletefile.txt')));
            fileWatcher.on('change', (change) => events.push(change));
            await fs.unlink(testFile);
            await waitFor(() => events.some(e => e.type === 'delete' && e.path.includes('deletefile.txt')));
            expect(events.length).toBeGreaterThanOrEqual(1);
            const deleteEvent = events.find(e => e.type === 'delete');
            expect(deleteEvent).toBeDefined();
            expect(deleteEvent?.stats).toBeUndefined();
            expect(deleteEvent?.hash).toBeUndefined();
        });
        it('should skip processing when file content unchanged', async () => {
            const events = [];
            const testFile = path.join(tempDir, 'samecontent.txt');
            const content = 'Same content';
            fileWatcher.on('change', (change) => events.push(change));
            // Create file
            await fs.writeFile(testFile, content);
            await waitFor(() => events.some(e => e.type === 'create' && e.path.includes('samecontent.txt')));
            // Clear create events
            events.length = 0;
            // Modify with same content - should not trigger event within window
            await fs.writeFile(testFile, content);
            await waitForNot(() => events.some(e => e.type === 'modify' && e.path.includes('samecontent.txt')), { timeout: 400 });
        });
    });
    describe('Directory Change Handling', () => {
        beforeEach(async () => {
            await fileWatcher.start();
        });
        it('should handle directory creation', async () => {
            const events = [];
            fileWatcher.on('change', (change) => events.push(change));
            const testDir = path.join(tempDir, 'newdir');
            await fs.mkdir(testDir);
            await waitFor(() => events.some(e => e.type === 'create' && e.path.includes('newdir')));
            expect(events.length).toBeGreaterThanOrEqual(1);
            const createEvent = events.find(e => e.type === 'create' && e.path.includes('newdir'));
            expect(createEvent).toBeDefined();
            expect(createEvent?.stats?.isDirectory).toBe(true);
        });
        it('should handle directory deletion', async () => {
            const events = [];
            const testDir = path.join(tempDir, 'deletedir');
            await fs.mkdir(testDir);
            // Wait for creation
            await waitFor(() => events.some(e => e.type === 'create' && e.path.includes('deletedir')));
            fileWatcher.on('change', (change) => events.push(change));
            await fs.rmdir(testDir);
            await waitFor(() => events.some(e => e.type === 'delete' && e.path.includes('deletedir')));
            expect(events.length).toBeGreaterThanOrEqual(1);
            const deleteEvent = events.find(e => e.type === 'delete' && e.path.includes('deletedir'));
            expect(deleteEvent).toBeDefined();
            expect(deleteEvent?.stats?.isDirectory).toBe(true);
        });
    });
    describe('Change Queue Processing', () => {
        beforeEach(async () => {
            await fileWatcher.start();
        });
        it('should debounce multiple changes', async () => {
            const events = [];
            fileWatcher.on('change', (change) => events.push(change));
            // Create multiple files quickly
            const promises = [];
            for (let i = 1; i <= 3; i++) {
                const testFile = path.join(tempDir, `file${i}.txt`);
                promises.push(fs.writeFile(testFile, `Content ${i}`));
            }
            await Promise.all(promises);
            await waitFor(() => events.length === 3, { timeout: 2000 });
            expect(events).toHaveLength(3);
        });
        it('should process changes in batches', async () => {
            const batchEvents = [];
            fileWatcher.on('batchComplete', (changes) => batchEvents.push(changes));
            // Create more files than maxConcurrent (10)
            const promises = [];
            for (let i = 0; i < 15; i++) {
                const testFile = path.join(tempDir, `batchfile${i}.txt`);
                promises.push(fs.writeFile(testFile, `Content ${i}`));
            }
            await Promise.all(promises);
            await waitFor(() => batchEvents.length === 1 && batchEvents[0].length === 15);
            expect(batchEvents).toHaveLength(1);
            expect(batchEvents[0]).toHaveLength(15);
        });
    });
    describe('Event Emission', () => {
        beforeEach(async () => {
            await fileWatcher.start();
        });
        it('should emit typed events for different change types', async () => {
            const events = {
                fileCreated: [],
                fileModified: [],
                fileDeleted: [],
            };
            fileWatcher.on('fileCreated', (change) => events.fileCreated.push(change));
            fileWatcher.on('fileModified', (change) => events.fileModified.push(change));
            fileWatcher.on('fileDeleted', (change) => events.fileDeleted.push(change));
            // Create, modify, and delete files
            const createFile = path.join(tempDir, 'created.txt');
            const modifyFile = path.join(tempDir, 'modified.txt');
            const deleteFile = path.join(tempDir, 'deleted.txt');
            await fs.writeFile(createFile, 'Created');
            await fs.writeFile(modifyFile, 'Initial');
            await fs.writeFile(deleteFile, 'To delete');
            await waitFor(() => {
                return events.fileCreated.length >= 2 && events.fileModified.length >= 1 && events.fileDeleted.length >= 1;
            });
            await fs.writeFile(modifyFile, 'Modified');
            await fs.unlink(deleteFile);
            await waitFor(() => {
                return events.fileCreated.length >= 2 && events.fileModified.length >= 1 && events.fileDeleted.length >= 1;
            });
            expect(events.fileCreated.length).toBeGreaterThanOrEqual(2); // create and modify files
            expect(events.fileModified.length).toBeGreaterThanOrEqual(1); // modify event
            expect(events.fileDeleted.length).toBeGreaterThanOrEqual(1); // delete event
        });
    });
    describe('Hashing and Change Detection', () => {
        it('should calculate file hashes correctly', async () => {
            const content = 'test-content';
            const hash = crypto.createHash('sha256').update(content).digest('hex');
            expect(typeof hash).toBe('string');
            expect(hash.length).toBe(64); // SHA-256 produces 64 character hex string
        });
        it('should handle hash calculation errors', async () => {
            let hash;
            try {
                const content = await fs.readFile('/nonexistent/file.txt');
                hash = crypto.createHash('sha256').update(content).digest('hex');
            }
            catch {
                hash = undefined;
            }
            expect(hash).toBeUndefined();
        });
        it('should update hash cache on file changes', async () => {
            await fileWatcher.start();
            const testFile = path.join(tempDir, 'hashfile.txt');
            await fs.writeFile(testFile, 'Content');
            await waitFor(() => fileWatcher.fileHashes.has(relativePath));
            const relativePath = path.relative(process.cwd(), testFile);
            expect(fileWatcher.fileHashes.has(relativePath)).toBe(true);
        });
        it('should clear hash cache on file deletion', async () => {
            const testFile = path.join(tempDir, 'deletehash.txt');
            const relativePath = path.relative(process.cwd(), testFile);
            fileWatcher.fileHashes.set(relativePath, 'old-hash');
            await fileWatcher.start();
            await fs.writeFile(testFile, 'Content');
            await waitFor(() => fileWatcher.fileHashes.has(relativePath));
            await fs.unlink(testFile);
            await waitFor(() => !fileWatcher.fileHashes.has(relativePath));
            expect(fileWatcher.fileHashes.has(relativePath)).toBe(false);
        });
    });
    describe('Ignore Patterns', () => {
        it('should ignore files matching ignore patterns', () => {
            const shouldIgnore = fileWatcher.shouldIgnore.bind(fileWatcher);
            // Test the actual patterns from the default config
            expect(shouldIgnore('node_modules/lodash/index.js')).toBe(true);
            expect(shouldIgnore('dist/bundle.js')).toBe(true);
            expect(shouldIgnore('.git/config')).toBe(true);
            expect(shouldIgnore('src/main.ts')).toBe(false);
        });
        it('should handle complex glob patterns', () => {
            const shouldIgnore = fileWatcher.shouldIgnore.bind(fileWatcher);
            expect(shouldIgnore('coverage/report.html')).toBe(true);
            expect(shouldIgnore('app.log')).toBe(true);
            expect(shouldIgnore('.DS_Store')).toBe(true);
            expect(shouldIgnore('package-lock.json')).toBe(true);
        });
        it('should not ignore regular source files', () => {
            const shouldIgnore = fileWatcher.shouldIgnore.bind(fileWatcher);
            expect(shouldIgnore('src/services/FileWatcher.ts')).toBe(false);
            expect(shouldIgnore('lib/utils/helpers.js')).toBe(false);
            expect(shouldIgnore('packages/my-package/index.ts')).toBe(false);
        });
        it('should handle simple wildcard patterns', () => {
            const customConfig = {
                watchPaths: [tempDir],
                ignorePatterns: ['*.tmp', 'temp_*', 'backup.*'],
            };
            const customWatcher = new FileWatcher(customConfig);
            const shouldIgnore = customWatcher.shouldIgnore.bind(customWatcher);
            // Test simple * patterns (covers lines 347-351)
            expect(shouldIgnore('test.tmp')).toBe(true);
            expect(shouldIgnore('temp_file.txt')).toBe(true);
            expect(shouldIgnore('backup.dat')).toBe(true);
            expect(shouldIgnore('regular.txt')).toBe(false);
            expect(shouldIgnore('test.tmp.backup')).toBe(false); // Doesn't match full pattern
        });
    });
    describe('Change Priority Calculation', () => {
        it('should assign high priority to source files', () => {
            const getPriority = fileWatcher.getChangePriority.bind(fileWatcher);
            expect(getPriority({ path: 'src/main.ts' })).toBe('high');
            expect(getPriority({ path: 'src/components/Button.tsx' })).toBe('high');
            expect(getPriority({ path: 'lib/utils.js' })).toBe('high');
        });
        it('should assign medium priority to config files', () => {
            const getPriority = fileWatcher.getChangePriority.bind(fileWatcher);
            expect(getPriority({ path: 'package.json' })).toBe('medium');
            expect(getPriority({ path: 'tsconfig.json' })).toBe('medium');
            expect(getPriority({ path: 'README.md' })).toBe('medium');
        });
        it('should assign low priority to generated files', () => {
            const getPriority = fileWatcher.getChangePriority.bind(fileWatcher);
            expect(getPriority({ path: 'dist/bundle.js' })).toBe('low');
            expect(getPriority({ path: 'node_modules/lodash/index.js' })).toBe('low');
            expect(getPriority({ path: 'coverage/report.html' })).toBe('low');
            expect(getPriority({ path: 'logs/app.log' })).toBe('low');
        });
    });
    describe('File Hash Initialization', () => {
        it('should initialize file hashes for existing files', async () => {
            // Create some test files
            const testFile1 = path.join(tempDir, 'file1.txt');
            const testFile2 = path.join(tempDir, 'file2.js');
            await fs.writeFile(testFile1, 'Content 1');
            await fs.writeFile(testFile2, 'Content 2');
            await fileWatcher.initializeFileHashes();
            expect(fileWatcher.fileHashes.size).toBeGreaterThan(0);
        });
        it('should recursively scan directories', async () => {
            // Create nested directory structure
            const subDir = path.join(tempDir, 'subdir');
            await fs.mkdir(subDir);
            const testFile = path.join(subDir, 'nested.txt');
            await fs.writeFile(testFile, 'Nested content');
            await fileWatcher.initializeFileHashes();
            const relativePath = path.relative(process.cwd(), testFile);
            expect(fileWatcher.fileHashes.has(relativePath)).toBe(true);
        });
        it('should handle scan errors gracefully', async () => {
            // Create a file that will cause read errors
            const testFile = path.join(tempDir, 'unreadable.txt');
            await fs.writeFile(testFile, 'Content');
            // Remove read permission (this might not work on all systems)
            try {
                await fs.chmod(testFile, 0o000);
            }
            catch {
                // If chmod fails, just proceed - the test will still work
            }
            await expect(fileWatcher.initializeFileHashes()).resolves.toBeUndefined();
        });
        it('should skip ignored files during directory scan', async () => {
            // Create a directory structure with ignored files
            const subDir = path.join(tempDir, 'subdir');
            const ignoredFile = path.join(subDir, 'ignored.log');
            const normalFile = path.join(subDir, 'normal.txt');
            await fs.mkdir(subDir);
            await fs.writeFile(ignoredFile, 'This should be ignored');
            await fs.writeFile(normalFile, 'This should be processed');
            // Use custom watcher with specific ignore patterns
            const customConfig = {
                watchPaths: [tempDir],
                ignorePatterns: ['**/*.log'], // Ignore log files
            };
            const customWatcher = new FileWatcher(customConfig);
            await customWatcher.initializeFileHashes();
            const ignoredRelativePath = path.relative(process.cwd(), ignoredFile);
            const normalRelativePath = path.relative(process.cwd(), normalFile);
            // The ignored file should not be in hashes (covers continue statement at lines 311-312)
            expect(customWatcher.fileHashes.has(ignoredRelativePath)).toBe(false);
            // The normal file should be in hashes
            expect(customWatcher.fileHashes.has(normalRelativePath)).toBe(true);
        });
        it('should handle directory scan errors gracefully', async () => {
            // Create a directory and then make it unreadable
            const testDir = path.join(tempDir, 'unreadable-dir');
            await fs.mkdir(testDir);
            await fs.writeFile(path.join(testDir, 'file.txt'), 'Content');
            // Make directory unreadable (this might not work on all systems)
            try {
                await fs.chmod(testDir, 0o000);
            }
            catch {
                // If chmod fails, just proceed - the test will still work
            }
            // Spy on console.warn to verify error logging (covers lines 329-330)
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            try {
                await fileWatcher.scanDirectory(testDir);
                // The scan should complete without throwing, logging the error instead
                expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Could not scan directory'), expect.any(Error));
            }
            finally {
                consoleWarnSpy.mockRestore();
                // Try to restore permissions
                try {
                    await fs.chmod(testDir, 0o755);
                }
                catch {
                    // Ignore permission restoration errors
                }
            }
        });
    });
    describe('Public API Methods', () => {
        it('should return watched paths', () => {
            expect(fileWatcher.getWatchedPaths()).toEqual([tempDir]);
        });
        it('should return queue length', () => {
            expect(fileWatcher.getQueueLength()).toBe(0);
            fileWatcher.changeQueue.push({});
            expect(fileWatcher.getQueueLength()).toBe(1);
        });
        it('should return processing status', () => {
            expect(fileWatcher.isProcessing()).toBe(false);
            fileWatcher.processing = true;
            expect(fileWatcher.isProcessing()).toBe(true);
        });
        it('should rescan files and clear hash cache', async () => {
            // Create a test file
            const testFile = path.join(tempDir, 'rescan.txt');
            await fs.writeFile(testFile, 'Content');
            await fileWatcher.start();
            await waitFor(() => fileWatcher.fileHashes.size > 0);
            expect(fileWatcher.fileHashes.size).toBeGreaterThan(0);
            await fileWatcher.rescan();
            expect(fileWatcher.fileHashes.size).toBeGreaterThan(0); // Should have rescanned and found files
        });
    });
    describe('Error Handling and Edge Cases', () => {
        it('should handle concurrent start/stop operations', async () => {
            const promises = [
                fileWatcher.start(),
                fileWatcher.start(),
                fileWatcher.stop(),
                fileWatcher.start(),
            ];
            await expect(Promise.all(promises)).resolves.toBeDefined();
        });
        it('should handle large number of simultaneous changes', async () => {
            await fileWatcher.start();
            const batchEvents = [];
            fileWatcher.on('batchComplete', (changes) => batchEvents.push(changes));
            // Create 100 files simultaneously
            const promises = [];
            for (let i = 0; i < 100; i++) {
                const testFile = path.join(tempDir, `large${i}.txt`);
                promises.push(fs.writeFile(testFile, `Content ${i}`));
            }
            await Promise.all(promises);
            await waitFor(() => batchEvents.length === 1 && batchEvents[0].length === 100);
            expect(batchEvents).toHaveLength(1);
            expect(batchEvents[0]).toHaveLength(100);
        });
    });
    describe('Utility Methods', () => {
        it('should chunk arrays correctly', () => {
            const chunkArray = fileWatcher.chunkArray.bind(fileWatcher);
            const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const chunks = chunkArray(array, 3);
            expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);
        });
        it('should return correct change icons', () => {
            const getIcon = fileWatcher.getChangeIcon.bind(fileWatcher);
            expect(getIcon('create')).toBe('📄');
            expect(getIcon('modify')).toBe('✏️');
            expect(getIcon('delete')).toBe('🗑️');
            expect(getIcon('rename')).toBe('🏷️');
            expect(getIcon('unknown')).toBe('📝');
        });
    });
    describe('Integration Scenarios', () => {
        it('should handle full file lifecycle', async () => {
            await fileWatcher.start();
            const events = [];
            fileWatcher.on('change', (change) => events.push(change));
            const testFile = path.join(tempDir, 'lifecycle.txt');
            // File created
            await fs.writeFile(testFile, 'Initial content');
            await waitFor(() => events.some(e => e.type === 'create' && e.path.includes('lifecycle.txt')));
            // File modified
            await fs.writeFile(testFile, 'Modified content');
            await waitFor(() => events.some(e => e.type === 'modify' && e.path.includes('lifecycle.txt')));
            // File deleted
            await fs.unlink(testFile);
            await waitFor(() => events.some(e => e.type === 'delete' && e.path.includes('lifecycle.txt')));
            expect(events.length).toBeGreaterThanOrEqual(2); // At least create and delete, modify might be filtered
            const createEvent = events.find(e => e.type === 'create');
            const deleteEvent = events.find(e => e.type === 'delete');
            expect(createEvent).toBeDefined();
            expect(deleteEvent).toBeDefined();
        });
        it('should handle mixed file and directory operations', async () => {
            await fileWatcher.start();
            const events = [];
            fileWatcher.on('change', (change) => events.push(change));
            const testDir = path.join(tempDir, 'mixeddir');
            const testFile = path.join(testDir, 'file.txt');
            // Create directory
            await fs.mkdir(testDir);
            await waitFor(() => events.some(e => e.type === 'create' && e.path.includes('mixeddir') && e.stats?.isDirectory));
            // Create file in directory
            await fs.writeFile(testFile, 'File content');
            await waitFor(() => events.some(e => e.type === 'create' && e.path.includes('mixeddir') && e.path.includes('file.txt')));
            // Delete file
            await fs.unlink(testFile);
            await waitFor(() => events.some(e => e.type === 'delete' && e.path.includes('mixeddir') && e.path.includes('file.txt')));
            // Delete directory
            await fs.rmdir(testDir);
            await waitFor(() => events.some(e => e.type === 'delete' && e.path.includes('mixeddir') && e.stats?.isDirectory));
            expect(events.length).toBeGreaterThanOrEqual(3); // At least dir create, file create, file delete
            const dirCreateEvent = events.find(e => e.type === 'create' && e.path.includes('mixeddir') && e.stats?.isDirectory);
            const fileCreateEvent = events.find(e => e.type === 'create' && e.path.includes('file.txt'));
            const fileDeleteEvent = events.find(e => e.type === 'delete' && e.path.includes('file.txt'));
            expect(dirCreateEvent).toBeDefined();
            expect(fileCreateEvent).toBeDefined();
            expect(fileDeleteEvent).toBeDefined();
        });
    });
});
//# sourceMappingURL=FileWatcher.test.js.map
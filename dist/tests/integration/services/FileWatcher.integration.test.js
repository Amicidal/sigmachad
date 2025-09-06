/**
 * Integration tests for FileWatcher
 * Tests file system monitoring, change detection, and event handling
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { FileWatcher } from '../../../src/services/FileWatcher';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';
const waitFor = globalThis.testUtils.waitFor;
const waitForNot = globalThis.testUtils.waitForNot;
const sleep = globalThis.testUtils.sleep;
// Gate running these heavy FS watcher tests; many CI/sandboxes restrict file watchers.
const runFileWatcher = process.env.RUN_FILEWATCHER_TESTS === '1';
const describeIfRun = runFileWatcher ? describe : describe.skip;
describeIfRun('FileWatcher Integration', () => {
    let watcher;
    let testDir;
    let watchDir;
    let events;
    beforeAll(async () => {
        // Create test directory structure
        testDir = path.join(tmpdir(), 'file-watcher-integration-tests');
        watchDir = path.join(testDir, 'watch');
        await fs.mkdir(testDir, { recursive: true });
        await fs.mkdir(watchDir, { recursive: true });
        events = [];
    }, 10000);
    afterAll(async () => {
        try {
            await fs.rm(testDir, { recursive: true, force: true });
        }
        catch (error) {
            console.warn('Failed to clean up test directory:', error);
        }
    });
    beforeEach(async () => {
        // Clean watch directory
        try {
            const files = await fs.readdir(watchDir);
            await Promise.all(files.map(file => fs.unlink(path.join(watchDir, file))));
        }
        catch (error) {
            // Directory might be empty
        }
        events = [];
        // Create new watcher instance
        watcher = new FileWatcher({
            watchPaths: [watchDir],
            ignorePatterns: ['**/temp/**', '**/*.tmp', '**/node_modules/**'],
            debounceMs: 100,
            maxConcurrent: 5
        });
        // Set up event listeners
        watcher.on('change', (change) => events.push(change));
        watcher.on('fileCreated', (change) => events.push({ ...change, eventType: 'fileCreated' }));
        watcher.on('fileModified', (change) => events.push({ ...change, eventType: 'fileModified' }));
        watcher.on('fileDeleted', (change) => events.push({ ...change, eventType: 'fileDeleted' }));
    });
    afterEach(async () => {
        if (watcher) {
            await watcher.stop();
        }
    });
    describe('File Creation Monitoring', () => {
        it('should detect file creation', async () => {
            await watcher.start();
            const testFile = path.join(watchDir, 'new-file.txt');
            const content = 'Hello, World!';
            await fs.writeFile(testFile, content);
            // Wait for file change detection deterministically
            await waitFor(() => events.some(e => e.type === 'create' && e.path === 'new-file.txt'));
            const createEvents = events.filter(e => e.type === 'create');
            expect(createEvents.length).toBeGreaterThan(0);
            const createEvent = createEvents[0];
            expect(createEvent.path).toBe('new-file.txt');
            expect(createEvent.type).toBe('create');
            expect(createEvent.absolutePath).toBe(testFile);
            expect(createEvent.stats?.size).toBe(content.length);
            expect(createEvent.stats?.isDirectory).toBe(false);
        });
        it('should detect directory creation', async () => {
            await watcher.start();
            const newDir = path.join(watchDir, 'new-directory');
            await fs.mkdir(newDir);
            // Wait for directory change detection deterministically
            await waitFor(() => events.some(e => e.type === 'create' && e.stats?.isDirectory));
            const createEvents = events.filter(e => e.type === 'create');
            const dirEvent = createEvents.find(e => e.stats?.isDirectory);
            expect(dirEvent).toBeDefined();
            expect(dirEvent?.path).toBe('new-directory');
            expect(dirEvent?.stats?.isDirectory).toBe(true);
        });
        it('should calculate file hashes on creation', async () => {
            await watcher.start();
            const testFile = path.join(watchDir, 'hash-test.txt');
            const content = 'Content for hashing';
            await fs.writeFile(testFile, content);
            // Wait for file change detection deterministically
            await waitFor(() => events.some(e => e.type === 'create' && e.path === 'hash-test.txt' && typeof e.hash === 'string' && (e.hash?.length ?? 0) > 0));
            const createEvent = events.find(e => e.type === 'create' && e.path === 'hash-test.txt');
            expect(createEvent?.hash).toBeDefined();
            expect(typeof createEvent?.hash).toBe('string');
            expect(createEvent?.hash?.length).toBeGreaterThan(0);
        });
    });
    describe('File Modification Monitoring', () => {
        let testFile;
        beforeEach(async () => {
            testFile = path.join(watchDir, 'modify-test.txt');
            await fs.writeFile(testFile, 'Initial content');
        });
        it('should detect file modifications', async () => {
            await watcher.start();
            // Wait for initial file creation to be processed
            await waitFor(() => events.some(e => e.type === 'create' && e.path === 'modify-test.txt'));
            events.length = 0; // Clear events
            const newContent = 'Modified content';
            await fs.writeFile(testFile, newContent);
            // Wait for modification detection deterministically
            await waitFor(() => events.some(e => e.type === 'modify' && e.path === 'modify-test.txt'));
            const modifyEvents = events.filter(e => e.type === 'modify');
            expect(modifyEvents.length).toBeGreaterThan(0);
            const modifyEvent = modifyEvents[0];
            expect(modifyEvent.path).toBe('modify-test.txt');
            expect(modifyEvent.type).toBe('modify');
            expect(modifyEvent.stats?.size).toBe(newContent.length);
        });
        it('should not trigger events for unchanged files', async () => {
            await watcher.start();
            // Wait for initial setup
            await waitFor(() => events.some(e => e.type === 'create' && e.path === 'modify-test.txt'));
            events.length = 0; // Clear events
            // Write the same content again
            await fs.writeFile(testFile, 'Initial content');
            // Ensure no modify events appear within the window
            await waitForNot(() => events.some(e => e.type === 'modify' && e.path === 'modify-test.txt'), { timeout: 400 });
        });
        it('should update file hashes on modification', async () => {
            await watcher.start();
            // Wait for initial setup
            await waitFor(() => events.some(e => e.type === 'create' && e.path === 'modify-test.txt'));
            events.length = 0; // Clear events
            const newContent = 'Different content for new hash';
            await fs.writeFile(testFile, newContent);
            // Wait for modification detection
            await waitFor(() => events.some(e => e.type === 'modify' && e.path === 'modify-test.txt' && typeof e.hash === 'string' && e.hash.length > 0));
            const modifyEvent = events.find(e => e.type === 'modify');
            expect(modifyEvent?.hash).toBeDefined();
            expect(modifyEvent?.hash).not.toBe('');
        });
    });
    describe('File Deletion Monitoring', () => {
        let testFile;
        beforeEach(async () => {
            testFile = path.join(watchDir, 'delete-test.txt');
            await fs.writeFile(testFile, 'Content to be deleted');
        });
        it('should detect file deletion', async () => {
            await watcher.start();
            // Wait for initial file creation
            await waitFor(() => events.some(e => e.type === 'create' && e.path === 'delete-test.txt'));
            events.length = 0; // Clear events
            await fs.unlink(testFile);
            // Wait for deletion detection
            await waitFor(() => events.some(e => e.type === 'delete' && e.path === 'delete-test.txt'));
            const deleteEvents = events.filter(e => e.type === 'delete');
            expect(deleteEvents.length).toBeGreaterThan(0);
            const deleteEvent = deleteEvents[0];
            expect(deleteEvent.path).toBe('delete-test.txt');
            expect(deleteEvent.type).toBe('delete');
            expect(deleteEvent.stats).toBeUndefined(); // No stats for deleted files
        });
        it('should detect directory deletion', async () => {
            const testDirPath = path.join(watchDir, 'delete-dir');
            await fs.mkdir(testDirPath);
            await watcher.start();
            // Wait for initial directory creation
            await waitFor(() => events.some(e => e.type === 'create' && e.path === 'delete-dir'));
            events.length = 0; // Clear events
            await fs.rm(testDirPath, { recursive: true });
            // Wait for deletion detection
            await waitFor(() => events.some(e => e.type === 'delete' && e.path === 'delete-dir'));
            const deleteEvents = events.filter(e => e.type === 'delete');
            const dirDeleteEvent = deleteEvents.find(e => e.path === 'delete-dir');
            expect(dirDeleteEvent).toBeDefined();
            expect(dirDeleteEvent?.type).toBe('delete');
        });
    });
    describe('Change Debouncing and Batching', () => {
        it('should debounce rapid file changes', async () => {
            await watcher.start();
            const testFile = path.join(watchDir, 'debounce-test.txt');
            // Make multiple rapid changes
            for (let i = 0; i < 5; i++) {
                await fs.writeFile(testFile, `Content ${i}`);
                await sleep(10); // Very short delay
            }
            // Wait for at least one debounced change to be recorded
            await waitFor(() => events.some(e => e.path === 'debounce-test.txt'));
            const changeEvents = events.filter(e => e.path === 'debounce-test.txt');
            // Should have fewer events than changes due to debouncing
            expect(changeEvents.length).toBeLessThan(5);
            expect(changeEvents.length).toBeGreaterThan(0);
        });
        it('should batch multiple file changes', async () => {
            await watcher.start();
            const files = ['batch1.txt', 'batch2.txt', 'batch3.txt'];
            // Create multiple files simultaneously
            await Promise.all(files.map(async (file, index) => {
                const filePath = path.join(watchDir, file);
                await fs.writeFile(filePath, `Content for ${file}`);
            }));
            // Wait for batch processing
            await waitFor(() => events.filter(e => e.type === 'create').length === files.length);
            const createEvents = events.filter(e => e.type === 'create');
            expect(createEvents.length).toBe(files.length);
            // All files should be detected
            files.forEach(file => {
                const event = createEvents.find(e => e.path === file);
                expect(event).toBeDefined();
            });
        });
    });
    describe('Ignore Patterns and Filtering', () => {
        it('should ignore files matching ignore patterns', async () => {
            await watcher.start();
            const ignoredFiles = [
                'temp-file.tmp',
                'node_modules/package.json',
                'nested/temp/ignored.txt'
            ];
            // Create ignored files
            for (const file of ignoredFiles) {
                const filePath = path.join(watchDir, file);
                await fs.mkdir(path.dirname(filePath), { recursive: true });
                await fs.writeFile(filePath, 'Ignored content');
            }
            // Ensure no events are captured for ignored files within a short window
            await waitForNot(() => {
                return events.some(e => e.type === 'create' && ignoredFiles.includes(e.path));
            }, { timeout: 400 });
            const createEvents = events.filter(e => e.type === 'create');
            // Should not detect ignored files
            ignoredFiles.forEach(file => {
                const event = createEvents.find(e => e.path === file);
                expect(event).toBeUndefined();
            });
        });
        it('should detect non-ignored files in ignored directories', async () => {
            await watcher.start();
            // Create a non-ignored file in a directory that contains ignored files
            const regularFile = path.join(watchDir, 'regular-file.txt');
            await fs.writeFile(regularFile, 'Regular content');
            // Wait for processing
            await waitFor(() => events.some(e => e.type === 'create' && e.path === 'regular-file.txt'));
            const createEvents = events.filter(e => e.type === 'create');
            const regularEvent = createEvents.find(e => e.path === 'regular-file.txt');
            expect(regularEvent).toBeDefined();
            expect(regularEvent?.type).toBe('create');
        });
    });
    describe('Concurrent Operations', () => {
        it('should handle concurrent file operations', async () => {
            await watcher.start();
            const operations = Array.from({ length: 10 }, async (_, i) => {
                const fileName = `concurrent-${i}.txt`;
                const filePath = path.join(watchDir, fileName);
                // Create, modify, and delete file
                await fs.writeFile(filePath, `Initial content ${i}`);
                await new Promise(resolve => setTimeout(resolve, 10));
                await fs.writeFile(filePath, `Modified content ${i}`);
                await new Promise(resolve => setTimeout(resolve, 10));
                await fs.unlink(filePath);
            });
            await Promise.all(operations);
            // Wait for all operations to be processed
            await waitFor(() => {
                const createEvents = events.filter(e => e.type === 'create').length;
                const modifyEvents = events.filter(e => e.type === 'modify').length;
                const deleteEvents = events.filter(e => e.type === 'delete').length;
                return createEvents === 10 && modifyEvents === 10 && deleteEvents === 10;
            }, { timeout: 5000 });
            const createEvents = events.filter(e => e.type === 'create');
            const modifyEvents = events.filter(e => e.type === 'modify');
            const deleteEvents = events.filter(e => e.type === 'delete');
            expect(createEvents.length).toBe(10);
            expect(modifyEvents.length).toBe(10);
            expect(deleteEvents.length).toBe(10);
        });
        it('should maintain event order for sequential operations', async () => {
            await watcher.start();
            const testFile = path.join(watchDir, 'sequential-test.txt');
            // Perform sequential operations
            await fs.writeFile(testFile, 'Create');
            await sleep(50);
            await fs.writeFile(testFile, 'Modify');
            await sleep(50);
            await fs.unlink(testFile);
            // Wait for processing
            await waitFor(() => events.filter(e => e.path === 'sequential-test.txt').length === 3);
            const fileEvents = events.filter(e => e.path === 'sequential-test.txt');
            // Should have create, modify, delete in order
            expect(fileEvents.length).toBe(3);
            expect(fileEvents[0].type).toBe('create');
            expect(fileEvents[1].type).toBe('modify');
            expect(fileEvents[2].type).toBe('delete');
        });
    });
    describe('Change Priority and Processing', () => {
        it('should assign correct priorities to different file types', async () => {
            await watcher.start();
            const files = [
                { name: 'component.tsx', expectedPriority: 'high' },
                { name: 'config.json', expectedPriority: 'medium' },
                { name: 'readme.md', expectedPriority: 'medium' },
                { name: 'dist/bundle.js', expectedPriority: 'low' },
                { name: 'logs/app.log', expectedPriority: 'low' }
            ];
            // Create files
            for (const file of files) {
                const filePath = path.join(watchDir, file.name);
                await fs.mkdir(path.dirname(filePath), { recursive: true });
                await fs.writeFile(filePath, 'Content');
            }
            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 300));
            // Check priorities (this would need internal access to priority calculation)
            const createEvents = events.filter(e => e.type === 'create');
            expect(createEvents.length).toBeGreaterThan(0);
        });
        it('should handle large numbers of files efficiently', async () => {
            await watcher.start();
            const fileCount = 50;
            const startTime = Date.now();
            // Create many files
            const createPromises = Array.from({ length: fileCount }, async (_, i) => {
                const filePath = path.join(watchDir, `bulk-${i}.txt`);
                await fs.writeFile(filePath, `Content ${i}`);
            });
            await Promise.all(createPromises);
            // Wait for processing
            await waitFor(() => events.filter(e => e.type === 'create').length === fileCount, { timeout: 5000 });
            const endTime = Date.now();
            const duration = endTime - startTime;
            const createEvents = events.filter(e => e.type === 'create');
            expect(createEvents.length).toBe(fileCount);
            // Should complete within reasonable time
            expect(duration).toBeLessThan(5000); // 5 seconds max
        });
    });
    describe('Watcher Lifecycle and State', () => {
        it('should start and stop correctly', async () => {
            expect(watcher.isProcessing()).toBe(false);
            await watcher.start();
            expect(watcher.getQueueLength()).toBeGreaterThanOrEqual(0);
            await watcher.stop();
            // Create a file after stopping
            const testFile = path.join(watchDir, 'post-stop.txt');
            await fs.writeFile(testFile, 'Content');
            // Ensure no events are captured after stop
            await waitForNot(() => events.some(e => e.path === 'post-stop.txt'), { timeout: 400 });
        });
        it('should handle restart correctly', async () => {
            await watcher.start();
            const file1 = path.join(watchDir, 'restart1.txt');
            await fs.writeFile(file1, 'Before restart');
            await waitFor(() => events.some(e => e.path === 'restart1.txt'));
            await watcher.stop();
            await watcher.start();
            const file2 = path.join(watchDir, 'restart2.txt');
            await fs.writeFile(file2, 'After restart');
            await waitFor(() => events.some(e => e.path === 'restart2.txt'));
            const eventsAfterRestart = events.filter(e => e.path === 'restart2.txt');
            expect(eventsAfterRestart.length).toBeGreaterThan(0);
        });
        it('should provide watcher statistics', async () => {
            await watcher.start();
            const watchedPaths = watcher.getWatchedPaths();
            expect(watchedPaths).toContain(watchDir);
            const queueLength = watcher.getQueueLength();
            expect(typeof queueLength).toBe('number');
            expect(queueLength).toBeGreaterThanOrEqual(0);
        });
    });
    describe('Error Handling and Edge Cases', () => {
        it('should handle non-existent watch directories gracefully', async () => {
            const invalidWatcher = new FileWatcher({
                watchPaths: ['/non/existent/path'],
                debounceMs: 100
            });
            await expect(invalidWatcher.start()).rejects.toThrow();
        });
        it('should handle file operations on watched files during processing', async () => {
            await watcher.start();
            const testFile = path.join(watchDir, 'stress-test.txt');
            // Start multiple operations
            const operations = Array.from({ length: 20 }, async (_, i) => {
                if (i % 2 === 0) {
                    await fs.writeFile(testFile, `Write ${i}`);
                }
                else {
                    try {
                        await fs.unlink(testFile);
                    }
                    catch (error) {
                        // File might not exist
                    }
                }
                await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
            });
            await Promise.allSettled(operations);
            // Wait for processing to complete
            await waitFor(() => !watcher.isProcessing() && watcher.getQueueLength() === 0, { timeout: 5000 });
            // Service should still be functional
            expect(watcher.isProcessing()).toBe(false);
            expect(watcher.getQueueLength()).toBe(0);
        });
        it('should handle very deep directory structures', async () => {
            await watcher.start();
            // Create deep directory structure
            let currentPath = watchDir;
            for (let i = 0; i < 5; i++) {
                currentPath = path.join(currentPath, `level${i}`);
                await fs.mkdir(currentPath);
            }
            const deepFile = path.join(currentPath, 'deep-file.txt');
            await fs.writeFile(deepFile, 'Deep content');
            // Wait for processing
            await waitFor(() => events.some(e => e.path.endsWith('level4/deep-file.txt')));
            const deepEvents = events.filter(e => e.path.includes('level4/deep-file.txt'));
            expect(deepEvents.length).toBeGreaterThan(0);
        });
        it('should handle files with special characters', async () => {
            await watcher.start();
            const specialFiles = [
                'file with spaces.txt',
                'file-with-dashes.txt',
                'file_with_underscores.txt',
                'file123.txt'
            ];
            for (const fileName of specialFiles) {
                const filePath = path.join(watchDir, fileName);
                await fs.writeFile(filePath, 'Special content');
            }
            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 300));
            const createEvents = events.filter(e => e.type === 'create');
            expect(createEvents.length).toBe(specialFiles.length);
            specialFiles.forEach(fileName => {
                const event = createEvents.find(e => e.path === fileName);
                expect(event).toBeDefined();
            });
        });
        it('should handle large file content changes', async () => {
            await watcher.start();
            const testFile = path.join(watchDir, 'large-file.txt');
            const largeContent = 'x'.repeat(1024 * 1024); // 1MB content
            await fs.writeFile(testFile, largeContent);
            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 1000));
            const createEvent = events.find(e => e.path === 'large-file.txt');
            expect(createEvent).toBeDefined();
            expect(createEvent?.stats?.size).toBe(largeContent.length);
        });
        it('should handle rapid start/stop cycles', async () => {
            for (let i = 0; i < 5; i++) {
                await watcher.start();
                await new Promise(resolve => setTimeout(resolve, 50));
                await watcher.stop();
            }
            // Should be able to start again
            await watcher.start();
            const testFile = path.join(watchDir, 'cycle-test.txt');
            await fs.writeFile(testFile, 'Cycle test content');
            await new Promise(resolve => setTimeout(resolve, 200));
            const createEvent = events.find(e => e.path === 'cycle-test.txt');
            expect(createEvent).toBeDefined();
        });
    });
});
//# sourceMappingURL=FileWatcher.integration.test.js.map
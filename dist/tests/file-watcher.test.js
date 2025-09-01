/**
 * File Watcher Unit Tests
 * Comprehensive tests for file system monitoring, change detection, and event handling
 */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { FileWatcher } from '../src/services/FileWatcher.js';
import chokidar from 'chokidar';
import fs from 'fs/promises';
import crypto from 'crypto';
import path from 'path';
// Mock all dependencies
jest.mock('chokidar');
jest.mock('fs/promises');
jest.mock('crypto');
jest.mock('path');
describe('FileWatcher', () => {
    let mockWatcher;
    let mockFs;
    let mockCrypto;
    let fileWatcher;
    beforeEach(() => {
        // Create mock chokidar watcher
        mockWatcher = jest.fn();
        chokidar.watch.mockReturnValue({
            on: jest.fn(),
            close: jest.fn().mockResolvedValue(undefined),
        });
        // Mock fs operations
        mockFs = fs;
        mockFs.stat = jest.fn().mockResolvedValue({
            mtime: new Date(),
            size: 100,
            isFile: () => true,
            isDirectory: () => false
        });
        mockFs.readFile = jest.fn().mockResolvedValue(Buffer.from('test content'));
        mockFs.readdir = jest.fn().mockResolvedValue([]);
        // Mock crypto
        const mockHash = {
            update: jest.fn().mockReturnThis(),
            digest: jest.fn().mockReturnValue('mockhash123')
        };
        mockCrypto = crypto;
        mockCrypto.createHash = jest.fn().mockReturnValue(mockHash);
        // Mock path operations
        path.resolve = jest.fn().mockImplementation((p) => `/absolute/${p}`);
        path.relative = jest.fn().mockImplementation((from, to) => {
            if (typeof to === 'string') {
                return to.replace('/absolute/', '');
            }
            return '';
        });
        path.join = jest.fn().mockImplementation((...args) => args.join('/'));
        // Mock process.cwd
        Object.defineProperty(process, 'cwd', {
            value: jest.fn().mockReturnValue('/test/project'),
            writable: true
        });
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('Constructor and Configuration', () => {
        it('should initialize with default configuration', () => {
            fileWatcher = new FileWatcher();
            expect(fileWatcher).toBeDefined();
            // Should have default watch paths
            expect(fileWatcher.getWatchedPaths()).toEqual(['src', 'lib', 'packages']);
        });
        it('should initialize with custom configuration', () => {
            const config = {
                watchPaths: ['custom/path'],
                ignorePatterns: ['**/custom/**'],
                debounceMs: 1000,
                maxConcurrent: 5
            };
            fileWatcher = new FileWatcher(config);
            expect(fileWatcher.getWatchedPaths()).toEqual(['custom/path']);
        });
        it('should merge custom config with defaults', () => {
            const config = {
                watchPaths: ['custom/path']
                // Other defaults should remain
            };
            fileWatcher = new FileWatcher(config);
            expect(fileWatcher.getWatchedPaths()).toEqual(['custom/path']);
        });
    });
    describe('Starting and Stopping', () => {
        beforeEach(() => {
            fileWatcher = new FileWatcher();
        });
        it('should start watcher successfully', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            // Mock fs operations for initialization
            mockFs.readdir.mockResolvedValue([]);
            mockFs.stat.mockResolvedValue({
                size: 100,
                mtime: new Date(),
                isDirectory: () => false
            });
            await fileWatcher.start();
            expect(chokidar.watch).toHaveBeenCalledWith(['src', 'lib', 'packages'], expect.any(Object));
            expect(mockWatcher.on).toHaveBeenCalledWith('add', expect.any(Function));
            expect(mockWatcher.on).toHaveBeenCalledWith('change', expect.any(Function));
            expect(mockWatcher.on).toHaveBeenCalledWith('unlink', expect.any(Function));
            expect(mockWatcher.on).toHaveBeenCalledWith('error', expect.any(Function));
            consoleSpy.mockRestore();
        });
        it('should stop watcher successfully', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            // Start first
            mockFs.readdir.mockResolvedValue([]);
            mockFs.stat.mockResolvedValue({
                size: 100,
                mtime: new Date(),
                isDirectory: () => false
            });
            await fileWatcher.start();
            // Stop
            await fileWatcher.stop();
            expect(mockWatcher.close).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
        it('should handle restart gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            // Mock fs operations
            mockFs.readdir.mockResolvedValue([]);
            mockFs.stat.mockResolvedValue({
                size: 100,
                mtime: new Date(),
                isDirectory: () => false
            });
            await fileWatcher.start();
            await fileWatcher.start(); // Should stop first, then start again
            expect(mockWatcher.close).toHaveBeenCalled();
            expect(chokidar.watch).toHaveBeenCalledTimes(2);
            consoleSpy.mockRestore();
        });
    });
    describe('File Change Handling', () => {
        beforeEach(async () => {
            fileWatcher = new FileWatcher();
            mockFs.readdir.mockResolvedValue([]);
            mockFs.stat.mockResolvedValue({
                size: 100,
                mtime: new Date(),
                isDirectory: () => false
            });
            await fileWatcher.start();
        });
        it('should handle file creation', async () => {
            const changeSpy = jest.fn();
            fileWatcher.on('change', changeSpy);
            // Mock file creation
            mockFs.stat.mockResolvedValue({
                size: 100,
                mtime: new Date(),
                isDirectory: () => false
            });
            mockFs.readFile.mockResolvedValue(Buffer.from('test content'));
            // Trigger file creation event
            const addHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'add')[1];
            await addHandler('src/test.ts');
            // Should emit change event
            expect(changeSpy).toHaveBeenCalledWith(expect.objectContaining({
                path: 'src/test.ts',
                type: 'create',
                hash: 'mockhash123'
            }));
        });
        it('should handle file modification', async () => {
            const changeSpy = jest.fn();
            fileWatcher.on('change', changeSpy);
            // Mock file modification
            mockFs.stat.mockResolvedValue({
                size: 200,
                mtime: new Date(),
                isDirectory: () => false
            });
            mockFs.readFile.mockResolvedValue(Buffer.from('modified content'));
            // Trigger file change event
            const changeHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'change')[1];
            await changeHandler('src/test.ts');
            expect(changeSpy).toHaveBeenCalledWith(expect.objectContaining({
                path: 'src/test.ts',
                type: 'modify',
                hash: 'mockhash123'
            }));
        });
        it('should handle file deletion', async () => {
            const changeSpy = jest.fn();
            fileWatcher.on('change', changeSpy);
            // Trigger file deletion event
            const unlinkHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'unlink')[1];
            await unlinkHandler('src/test.ts');
            expect(changeSpy).toHaveBeenCalledWith(expect.objectContaining({
                path: 'src/test.ts',
                type: 'delete'
            }));
        });
        it('should handle directory changes', async () => {
            const changeSpy = jest.fn();
            fileWatcher.on('change', changeSpy);
            // Trigger directory creation
            const addDirHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'addDir')[1];
            await addDirHandler('src/components');
            expect(changeSpy).toHaveBeenCalledWith(expect.objectContaining({
                path: 'src/components',
                type: 'create',
                stats: expect.objectContaining({
                    isDirectory: true
                })
            }));
        });
        it('should detect actual file changes using hash comparison', async () => {
            const changeSpy = jest.fn();
            fileWatcher.on('change', changeSpy);
            // First modification - should trigger
            mockFs.stat.mockResolvedValue({
                size: 100,
                mtime: new Date(),
                isDirectory: () => false
            });
            mockFs.readFile.mockResolvedValue(Buffer.from('content 1'));
            const changeHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'change')[1];
            await changeHandler('src/test.ts');
            expect(changeSpy).toHaveBeenCalledTimes(1);
            // Second modification with same content - should not trigger
            mockCrypto.createHash.mockReturnValue({
                update: jest.fn().mockReturnValue({
                    digest: jest.fn().mockReturnValue('samehash123') // Same hash
                })
            });
            mockFs.readFile.mockResolvedValue(Buffer.from('content 1')); // Same content
            await changeHandler('src/test.ts');
            expect(changeSpy).toHaveBeenCalledTimes(1); // Should not trigger again
        });
        it('should handle file read errors gracefully', async () => {
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            const changeSpy = jest.fn();
            fileWatcher.on('change', changeSpy);
            // Mock file read error
            mockFs.readFile.mockRejectedValue(new Error('File read error'));
            const addHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'add')[1];
            await addHandler('src/test.ts');
            // Should not emit change event due to error
            expect(changeSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalled();
            errorSpy.mockRestore();
        });
    });
    describe('Change Processing and Queuing', () => {
        beforeEach(async () => {
            fileWatcher = new FileWatcher({ debounceMs: 50 }); // Faster debounce for tests
            mockFs.readdir.mockResolvedValue([]);
            mockFs.stat.mockResolvedValue({
                size: 100,
                mtime: new Date(),
                isDirectory: () => false
            });
            await fileWatcher.start();
        });
        it('should queue changes for processing', async () => {
            const changeSpy = jest.fn();
            fileWatcher.on('change', changeSpy);
            // Trigger multiple changes quickly
            const addHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'add')[1];
            mockFs.readFile.mockResolvedValue(Buffer.from('content'));
            await addHandler('src/file1.ts');
            await addHandler('src/file2.ts');
            // Wait for debounced processing
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(changeSpy).toHaveBeenCalledTimes(2);
        });
        it('should process changes in batches', async () => {
            const batchCompleteSpy = jest.fn();
            fileWatcher.on('batchComplete', batchCompleteSpy);
            // Trigger changes
            const addHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'add')[1];
            mockFs.readFile.mockResolvedValue(Buffer.from('content'));
            await addHandler('src/file1.ts');
            await addHandler('src/file2.ts');
            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(batchCompleteSpy).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({ path: 'src/file1.ts' }),
                expect.objectContaining({ path: 'src/file2.ts' })
            ]));
        });
        it('should respect max concurrent limit', async () => {
            fileWatcher = new FileWatcher({ debounceMs: 50, maxConcurrent: 2 });
            mockFs.readdir.mockResolvedValue([]);
            mockFs.stat.mockResolvedValue({
                size: 100,
                mtime: new Date(),
                isDirectory: () => false
            });
            await fileWatcher.start();
            const changeSpy = jest.fn();
            fileWatcher.on('change', changeSpy);
            // Trigger many changes
            const addHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'add')[1];
            mockFs.readFile.mockResolvedValue(Buffer.from('content'));
            for (let i = 0; i < 5; i++) {
                await addHandler(`src/file${i}.ts`);
            }
            await new Promise(resolve => setTimeout(resolve, 200));
            expect(changeSpy).toHaveBeenCalledTimes(5);
        });
        it('should handle processing errors gracefully', async () => {
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            const changeErrorSpy = jest.fn();
            fileWatcher.on('changeError', changeErrorSpy);
            // Mock processing error
            const addHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'add')[1];
            mockFs.stat.mockRejectedValue(new Error('Stat error'));
            await addHandler('src/test.ts');
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(changeErrorSpy).toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalled();
            errorSpy.mockRestore();
        });
    });
    describe('Event Emission', () => {
        beforeEach(async () => {
            fileWatcher = new FileWatcher();
            mockFs.readdir.mockResolvedValue([]);
            mockFs.stat.mockResolvedValue({
                size: 100,
                mtime: new Date(),
                isDirectory: () => false
            });
            await fileWatcher.start();
        });
        it('should emit typed events for different change types', async () => {
            const fileCreatedSpy = jest.fn();
            const fileModifiedSpy = jest.fn();
            const fileDeletedSpy = jest.fn();
            fileWatcher.on('fileCreated', fileCreatedSpy);
            fileWatcher.on('fileModified', fileModifiedSpy);
            fileWatcher.on('fileDeleted', fileDeletedSpy);
            // Trigger different change types
            const addHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'add')[1];
            const changeHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'change')[1];
            const unlinkHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'unlink')[1];
            mockFs.readFile.mockResolvedValue(Buffer.from('content'));
            await addHandler('src/newfile.ts');
            await changeHandler('src/modified.ts');
            await unlinkHandler('src/deleted.ts');
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(fileCreatedSpy).toHaveBeenCalledWith(expect.objectContaining({
                type: 'create',
                path: 'src/newfile.ts'
            }));
            expect(fileModifiedSpy).toHaveBeenCalledWith(expect.objectContaining({
                type: 'modify',
                path: 'src/modified.ts'
            }));
            expect(fileDeletedSpy).toHaveBeenCalledWith(expect.objectContaining({
                type: 'delete',
                path: 'src/deleted.ts'
            }));
        });
        it('should emit error events for watcher errors', () => {
            const errorSpy = jest.fn();
            fileWatcher.on('error', errorSpy);
            const errorHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'error')[1];
            const testError = new Error('Watcher error');
            errorHandler(testError);
            expect(errorSpy).toHaveBeenCalledWith(testError);
        });
    });
    describe('Change Priority and Utilities', () => {
        beforeEach(() => {
            fileWatcher = new FileWatcher();
        });
        it('should assign correct priorities to different file types', () => {
            const highPriorityChange = {
                path: 'src/main.ts',
                absolutePath: '/absolute/src/main.ts',
                type: 'modify'
            };
            const mediumPriorityChange = {
                path: 'package.json',
                absolutePath: '/absolute/package.json',
                type: 'modify'
            };
            const lowPriorityChange = {
                path: 'dist/bundle.js',
                absolutePath: '/absolute/dist/bundle.js',
                type: 'modify'
            };
            // Test priority logic through private method access
            const getPriority = (watcher, change) => watcher.getChangePriority(change);
            expect(getPriority(fileWatcher, highPriorityChange)).toBe('high');
            expect(getPriority(fileWatcher, mediumPriorityChange)).toBe('medium');
            expect(getPriority(fileWatcher, lowPriorityChange)).toBe('low');
        });
        it('should provide correct change icons', () => {
            const getIcon = (watcher, type) => watcher.getChangeIcon(type);
            expect(getIcon(fileWatcher, 'create')).toBe('📄');
            expect(getIcon(fileWatcher, 'modify')).toBe('✏️');
            expect(getIcon(fileWatcher, 'delete')).toBe('🗑️');
            expect(getIcon(fileWatcher, 'rename')).toBe('🏷️');
            expect(getIcon(fileWatcher, 'unknown')).toBe('📝');
        });
        it('should chunk arrays correctly', () => {
            const chunkArray = (watcher, array, size) => watcher.chunkArray(array, size);
            const array = [1, 2, 3, 4, 5, 6, 7];
            const chunks = chunkArray(fileWatcher, array, 3);
            expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
        });
    });
    describe('File Hash Management', () => {
        beforeEach(async () => {
            fileWatcher = new FileWatcher();
            mockFs.readdir.mockResolvedValue([]);
        });
        it('should initialize file hashes on start', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            // Mock directory structure
            mockFs.readdir.mockResolvedValue([
                { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
                { name: 'file2.ts', isDirectory: () => false, isFile: () => true }
            ]);
            mockFs.stat.mockResolvedValue({
                size: 100,
                mtime: new Date(),
                isDirectory: () => false
            });
            mockFs.readFile.mockResolvedValue(Buffer.from('test content'));
            await fileWatcher.start();
            expect(mockFs.readFile).toHaveBeenCalledTimes(2);
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Initialized hashes for 2 files'));
            consoleSpy.mockRestore();
        });
        it('should skip ignored files during hash initialization', async () => {
            // Mock directory with ignored files
            mockFs.readdir.mockResolvedValue([
                { name: 'node_modules', isDirectory: () => true, isFile: () => false },
                { name: 'package-lock.json', isDirectory: () => false, isFile: () => true },
                { name: 'valid.ts', isDirectory: () => false, isFile: () => true }
            ]);
            mockFs.stat.mockResolvedValue({
                size: 100,
                mtime: new Date(),
                isDirectory: () => false
            });
            mockFs.readFile.mockResolvedValue(Buffer.from('content'));
            // Access private method
            const shouldIgnore = (watcher, path) => watcher.shouldIgnore(path);
            expect(shouldIgnore(fileWatcher, 'node_modules/package.json')).toBe(true);
            expect(shouldIgnore(fileWatcher, 'package-lock.json')).toBe(true);
            expect(shouldIgnore(fileWatcher, 'src/valid.ts')).toBe(false);
        });
        it('should handle hash initialization errors gracefully', async () => {
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
            mockFs.readdir.mockRejectedValue(new Error('Directory read error'));
            // Access private method
            const scanDirectory = (watcher, dir) => watcher.scanDirectory(dir);
            await scanDirectory(fileWatcher, 'invalid/path');
            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });
    });
    describe('Public API Methods', () => {
        beforeEach(() => {
            fileWatcher = new FileWatcher();
        });
        it('should return watched paths', () => {
            expect(fileWatcher.getWatchedPaths()).toEqual(['src', 'lib', 'packages']);
        });
        it('should return queue length', () => {
            expect(fileWatcher.getQueueLength()).toBe(0);
        });
        it('should return processing status', () => {
            expect(fileWatcher.isProcessing()).toBe(false);
        });
        it('should rescan files', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            mockFs.readdir.mockResolvedValue([]);
            mockFs.stat.mockResolvedValue({
                size: 100,
                mtime: new Date(),
                isDirectory: () => false
            });
            await fileWatcher.rescan();
            expect(consoleSpy).toHaveBeenCalledWith('🔄 File rescan complete');
            consoleSpy.mockRestore();
        });
    });
    describe('Error Handling', () => {
        beforeEach(async () => {
            fileWatcher = new FileWatcher();
            mockFs.readdir.mockResolvedValue([]);
            mockFs.stat.mockResolvedValue({
                size: 100,
                mtime: new Date(),
                isDirectory: () => false
            });
            await fileWatcher.start();
        });
        it('should handle watcher errors', () => {
            const errorSpy = jest.fn();
            fileWatcher.on('error', errorSpy);
            const errorHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'error')[1];
            const watcherError = new Error('Chokidar error');
            errorHandler(watcherError);
            expect(errorSpy).toHaveBeenCalledWith(watcherError);
        });
        it('should handle file system errors during change processing', async () => {
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            // Mock fs.stat to throw error
            mockFs.stat.mockRejectedValue(new Error('File system error'));
            const addHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'add')[1];
            await addHandler('src/error.ts');
            expect(errorSpy).toHaveBeenCalled();
            errorSpy.mockRestore();
        });
        it('should handle hash calculation errors', async () => {
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
            // Mock crypto to throw error
            mockCrypto.createHash.mockImplementation(() => {
                throw new Error('Hash calculation error');
            });
            const addHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'add')[1];
            mockFs.readFile.mockResolvedValue(Buffer.from('content'));
            await addHandler('src/hash-error.ts');
            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });
    });
    describe('Integration Scenarios', () => {
        it('should handle complex file operations sequence', async () => {
            fileWatcher = new FileWatcher({ debounceMs: 50 });
            mockFs.readdir.mockResolvedValue([]);
            mockFs.stat.mockResolvedValue({
                size: 100,
                mtime: new Date(),
                isDirectory: () => false
            });
            await fileWatcher.start();
            const changeSpy = jest.fn();
            fileWatcher.on('change', changeSpy);
            const addHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'add')[1];
            const changeHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'change')[1];
            const unlinkHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'unlink')[1];
            // Sequence: create -> modify -> delete
            mockFs.readFile.mockResolvedValue(Buffer.from('initial'));
            await addHandler('src/test.ts');
            mockFs.readFile.mockResolvedValue(Buffer.from('modified'));
            await changeHandler('src/test.ts');
            await unlinkHandler('src/test.ts');
            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 200));
            expect(changeSpy).toHaveBeenCalledTimes(3);
            expect(changeSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({ type: 'create' }));
            expect(changeSpy).toHaveBeenNthCalledWith(2, expect.objectContaining({ type: 'modify' }));
            expect(changeSpy).toHaveBeenNthCalledWith(3, expect.objectContaining({ type: 'delete' }));
        });
        it('should handle concurrent file operations', async () => {
            fileWatcher = new FileWatcher({ debounceMs: 50, maxConcurrent: 3 });
            mockFs.readdir.mockResolvedValue([]);
            mockFs.stat.mockResolvedValue({
                size: 100,
                mtime: new Date(),
                isDirectory: () => false
            });
            await fileWatcher.start();
            const changeSpy = jest.fn();
            fileWatcher.on('change', changeSpy);
            const addHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'add')[1];
            mockFs.readFile.mockResolvedValue(Buffer.from('content'));
            // Add multiple files concurrently
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(addHandler(`src/file${i}.ts`));
            }
            await Promise.all(promises);
            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 200));
            expect(changeSpy).toHaveBeenCalledTimes(5);
        });
    });
});
//# sourceMappingURL=file-watcher.test.js.map
/**
 * File Watcher Integration Tests
 * Tests real file operations and event emission
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { FileWatcher } from '../src/services/FileWatcher.js';
import { promises as fs } from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';

// Skip these tests if running in CI to avoid file system issues
const testIntegration = process.env.CI ? describe.skip : describe;

testIntegration('FileWatcher Integration', () => {
  let fileWatcher: FileWatcher;
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = path.join(tmpdir(), `file-watcher-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    // Create FileWatcher instance with temp directory
    fileWatcher = new FileWatcher({
      watchPaths: [tempDir],
      ignorePatterns: [],
      debounceMs: 50 // Faster for tests
    });
  });

  afterEach(async () => {
    if (fileWatcher) {
      await fileWatcher.stop();
    }
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should detect file creation', async () => {
    const changeSpy = jest.fn();
    fileWatcher.on('change', changeSpy);

    await fileWatcher.start();

    // Wait for watcher to be fully ready
    await new Promise(resolve => setTimeout(resolve, 200));

    // Create a real file
    const testFile = path.join(tempDir, 'test.txt');
    await fs.writeFile(testFile, 'Hello World');

    // Wait for the change to be processed (longer for reliability)
    await new Promise(resolve => setTimeout(resolve, 300));

    // Should emit change event
    expect(changeSpy).toHaveBeenCalledWith(expect.objectContaining({
      path: expect.stringContaining('test.txt'),
      type: 'create'
    }));
  });

  it('should detect file modification', async () => {
    const changeSpy = jest.fn();
    fileWatcher.on('change', changeSpy);

    await fileWatcher.start();

    // Wait for watcher to be fully ready
    await new Promise(resolve => setTimeout(resolve, 200));

    // Create and then modify a real file
    const testFile = path.join(tempDir, 'modify-test.txt');
    await fs.writeFile(testFile, 'Original content');

    // Wait for initial creation to be processed
    await new Promise(resolve => setTimeout(resolve, 300));

    // Clear previous calls
    changeSpy.mockClear();

    // Modify the file
    await fs.writeFile(testFile, 'Modified content');

    // Wait for the modification to be processed
    await new Promise(resolve => setTimeout(resolve, 300));

    // Should emit change event for modification
    const modifyCalls = changeSpy.mock.calls.filter(call =>
      call[0].type === 'modify' && call[0].path.includes('modify-test.txt')
    );
    expect(modifyCalls.length).toBeGreaterThan(0);
  });

  it('should detect file deletion', async () => {
    const changeSpy = jest.fn();
    fileWatcher.on('change', changeSpy);

    await fileWatcher.start();

    // Wait for watcher to be fully ready
    await new Promise(resolve => setTimeout(resolve, 200));

    // Create and then delete a real file
    const testFile = path.join(tempDir, 'delete-test.txt');
    await fs.writeFile(testFile, 'Content to delete');

    // Wait for creation to be processed
    await new Promise(resolve => setTimeout(resolve, 300));

    // Clear previous calls
    changeSpy.mockClear();

    // Delete the file
    await fs.unlink(testFile);

    // Wait for the deletion to be processed
    await new Promise(resolve => setTimeout(resolve, 300));

    // Should emit change event for deletion
    const deleteCalls = changeSpy.mock.calls.filter(call =>
      call[0].type === 'delete' && call[0].path.includes('delete-test.txt')
    );
    expect(deleteCalls.length).toBeGreaterThan(0);
  });

  it('should handle multiple file operations', async () => {
    const changeSpy = jest.fn();
    fileWatcher.on('change', changeSpy);

    await fileWatcher.start();

    // Wait for watcher to be fully ready
    await new Promise(resolve => setTimeout(resolve, 200));

    // Perform multiple operations
    const file1 = path.join(tempDir, 'multi1.txt');
    const file2 = path.join(tempDir, 'multi2.txt');

    // Create files
    await fs.writeFile(file1, 'Content 1');
    await fs.writeFile(file2, 'Content 2');

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 300));

    // Modify one file
    await fs.writeFile(file1, 'Modified Content 1');

    // Delete one file
    await fs.unlink(file2);

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check that all operations were detected
    const createCalls = changeSpy.mock.calls.filter(call => call[0].type === 'create');
    const modifyCalls = changeSpy.mock.calls.filter(call => call[0].type === 'modify');
    const deleteCalls = changeSpy.mock.calls.filter(call => call[0].type === 'delete');

    expect(createCalls.length).toBeGreaterThanOrEqual(2);
    expect(modifyCalls.length).toBeGreaterThanOrEqual(1);
    expect(deleteCalls.length).toBeGreaterThanOrEqual(1);
  });

  it('should start and stop properly', async () => {
    expect(fileWatcher.getWatchedPaths()).toEqual([tempDir]);

    await fileWatcher.start();
    expect(fileWatcher.getQueueLength()).toBe(0);

    await fileWatcher.stop();
    // Should not throw
  });
});

/**
 * File Watcher Integration Tests
 * Tests for file system monitoring with real file operations
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { FileWatcher } from '../src/services/FileWatcher.js';
import { promises as fs } from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';

describe('FileWatcher Integration', () => {
  let fileWatcher: FileWatcher;
  let tempDir: string;
  let testFile: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = path.join(tmpdir(), `file-watcher-test-${Date.now()}`);
    testFile = path.join(tempDir, 'test.txt');
    await fs.mkdir(tempDir, { recursive: true });

    // Create FileWatcher instance
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

  describe('Basic Functionality', () => {
    it('should initialize successfully', () => {
      expect(fileWatcher).toBeDefined();
    });

    it('should watch file creation', async () => {
      let fileCreated = false;

      fileWatcher.onFileChange((change) => {
        if (change.type === 'create' && change.path === 'test.txt') {
          fileCreated = true;
        }
      });

      await fileWatcher.start();

      // Create a test file
      await fs.writeFile(testFile, 'test content');

      // Wait for the change to be detected
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(fileCreated).toBe(true);
    });

    it('should watch file modification', async () => {
      let fileModified = false;

      // Create initial file
      await fs.writeFile(testFile, 'initial content');

      fileWatcher.onFileChange((change) => {
        if (change.type === 'update' && change.path === 'test.txt') {
          fileModified = true;
        }
      });

      await fileWatcher.start();

      // Modify the file
      await fs.writeFile(testFile, 'modified content');

      // Wait for the change to be detected
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(fileModified).toBe(true);
    });

    it('should watch file deletion', async () => {
      let fileDeleted = false;

      // Create initial file
      await fs.writeFile(testFile, 'content');

      fileWatcher.onFileChange((change) => {
        if (change.type === 'delete' && change.path === 'test.txt') {
          fileDeleted = true;
        }
      });

      await fileWatcher.start();

      // Delete the file
      await fs.unlink(testFile);

      // Wait for the change to be detected
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(fileDeleted).toBe(true);
    });

    it('should stop watching', async () => {
      await fileWatcher.start();
      await fileWatcher.stop();
      // Test passes if no errors are thrown
      expect(true).toBe(true);
    });
  });
});

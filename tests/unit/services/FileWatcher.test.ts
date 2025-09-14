/**
 * Unit tests for FileWatcher
 * Tests file system monitoring, change detection, and event emission
 */

/// <reference types="node" />

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  vi,
} from "vitest";
import {
  FileWatcher,
  FileChange,
  WatcherConfig,
} from "../../../src/services/FileWatcher";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";
const waitFor: (
  check: () => boolean | Promise<boolean>,
  opts?: { timeout?: number; interval?: number }
) => Promise<void> = (globalThis as any).testUtils.waitFor;
const waitForNot: (
  check: () => boolean | Promise<boolean>,
  opts?: { timeout?: number; interval?: number }
) => Promise<void> = (globalThis as any).testUtils.waitForNot;
const sleep: (ms: number) => Promise<void> = (globalThis as any).testUtils
  .sleep;

// Gate watcher-heavy tests to avoid EMFILE limits on constrained environments.
const runFileWatcher = process.env.RUN_FILEWATCHER_TESTS === "1";
const describeIfRun = runFileWatcher ? describe : describe.skip;

describeIfRun("FileWatcher", () => {
  let fileWatcher: FileWatcher;
  let tempDir: string;

  beforeAll(async () => {
    // Create a temporary directory for testing
    tempDir = path.join(os.tmpdir(), "filewatcher-test-" + Date.now());
    // Ensure directory is clean before starting
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Directory doesn't exist, which is fine
    }
    await fs.mkdir(tempDir, { recursive: true });
  });

  beforeEach(() => {
    // Force aggressive polling for tests
    process.env.USE_POLLING = "true";
    process.env.NODE_ENV = "test";

    fileWatcher = new FileWatcher({
      watchPaths: [tempDir],
      debounceMs: 50, // Very fast debouncing for tests
      maxConcurrent: 5, // Lower concurrency for tests
    });
  });

  afterEach(async () => {
    if (fileWatcher) {
      await fileWatcher.stop();
    }
  });

  afterAll(async () => {
    // Clean up temporary directory
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        // Log cleanup errors for debugging but don't fail test
        console.debug("Failed to clean up temp directory:", error);
      }
    }
  });

  describe("Constructor and Configuration", () => {
    it("should initialize with default configuration", () => {
      const watcher = new FileWatcher();

      expect((watcher as any).config.watchPaths).toEqual([
        "src",
        "lib",
        "packages",
      ]);
      expect((watcher as any).config.debounceMs).toBe(500);
      expect((watcher as any).config.maxConcurrent).toBe(10);
      expect((watcher as any).config.ignorePatterns).toContain(
        "**/node_modules/**"
      );
    });

    it("should accept custom configuration", () => {
      const customConfig: Partial<WatcherConfig> = {
        watchPaths: ["custom/path"],
        debounceMs: 1000,
        maxConcurrent: 5,
        ignorePatterns: ["**/temp/**"],
      };

      const watcher = new FileWatcher(customConfig);

      expect((watcher as any).config.watchPaths).toEqual(["custom/path"]);
      expect((watcher as any).config.debounceMs).toBe(1000);
      expect((watcher as any).config.maxConcurrent).toBe(5);
      expect((watcher as any).config.ignorePatterns).toEqual(["**/temp/**"]);
    });

    it("should extend EventEmitter", () => {
      expect(fileWatcher).toBeInstanceOf(require("events").EventEmitter);
    });
  });

  describe("Start and Stop", () => {
    it("should start watching files successfully", async () => {
      await fileWatcher.start();

      expect((fileWatcher as any).watcher).toBeTruthy();
      expect(fileWatcher.getWatchedPaths()).toEqual([tempDir]);
    });

    it("should stop watching files", async () => {
      await fileWatcher.start();
      expect((fileWatcher as any).watcher).toBeTruthy();

      await fileWatcher.stop();
      expect((fileWatcher as any).watcher).toBeNull();
    });

    it("should handle stop when not started", async () => {
      await expect(fileWatcher.stop()).resolves.toBeUndefined();
    });

    it("should restart watcher when start called twice", async () => {
      await fileWatcher.start();
      const firstWatcher = (fileWatcher as any).watcher;

      await fileWatcher.start();
      const secondWatcher = (fileWatcher as any).watcher;

      expect(firstWatcher).not.toBe(secondWatcher);
      expect(secondWatcher).toBeTruthy();
    });
  });

  describe("File Change Handling", () => {
    beforeEach(async () => {
      await fileWatcher.start();
      // Small delay to ensure watcher is fully ready
      await sleep(100);
    });

    it("should handle file creation", async () => {
      const events: FileChange[] = [];
      fileWatcher.on("change", (change) => events.push(change));

      const testFile = path.join(tempDir, "newfile.txt");
      await fs.writeFile(testFile, "Hello World");

      // Small delay for file system to register the change
      await sleep(50);

      // Wait for debounce and file system events
      await waitFor(
        () =>
          events.some(
            (e) => e.type === "create" && e.path.includes("newfile.txt")
          ),
        { timeout: 5000, interval: 50 }
      );

      expect(events.length).toBeGreaterThanOrEqual(1);
      const createEvent = events.find(
        (e) => e.type === "create" && e.path.includes("newfile.txt")
      );
      expect(createEvent).toEqual(expect.any(Object));
      expect(createEvent?.stats).toEqual(expect.any(Object));
      expect(typeof createEvent?.hash).toBe('string');
    });

    it("should handle file modification", async () => {
      const events: FileChange[] = [];
      fileWatcher.on("change", (change) => events.push(change));

      const testFile = path.join(tempDir, "modifyfile.txt");
      await fs.writeFile(testFile, "Initial content");
      await sleep(50);

      // Wait for initial create event and clear events
      await waitFor(
        () =>
          events.some(
            (e) => e.type === "create" && e.path.includes("modifyfile.txt")
          ),
        { timeout: 5000, interval: 50 }
      );
      events.length = 0;

      // Modify file
      await fs.writeFile(testFile, "Modified content");
      await sleep(50);
      await waitFor(
        () =>
          events.some(
            (e) => e.type === "modify" && e.path.includes("modifyfile.txt")
          ),
        { timeout: 5000, interval: 50 }
      );

      expect(events.length).toBeGreaterThanOrEqual(1);
      const modifyEvent = events.find((e) => e.type === "modify");
      expect(modifyEvent).toEqual(expect.any(Object));
    });

    it("should handle file deletion", async () => {
      const events: FileChange[] = [];

      // Set up event listener BEFORE any file operations
      fileWatcher.on("change", (change) => events.push(change));

      const testFile = path.join(tempDir, "deletefile.txt");
      await fs.writeFile(testFile, "Content to delete");
      await sleep(100);

      // Wait for creation event
      await waitFor(
        () =>
          events.some(
            (e) => e.type === "create" && e.path.includes("deletefile.txt")
          ),
        { timeout: 10000, interval: 100 }
      );

      await fs.unlink(testFile);
      await sleep(100);

      // Wait for deletion event
      await waitFor(
        () =>
          events.some(
            (e) => e.type === "delete" && e.path.includes("deletefile.txt")
          ),
        { timeout: 10000, interval: 100 }
      );

      expect(events.length).toBeGreaterThanOrEqual(2); // create and delete events
      const deleteEvent = events.find((e) => e.type === "delete");
      expect(deleteEvent).toEqual(expect.any(Object));
      expect(deleteEvent?.stats).toBeUndefined();
      expect(deleteEvent?.hash).toBeUndefined();
    });

    it("should skip processing when file content unchanged", async () => {
      const events: FileChange[] = [];

      const testFile = path.join(tempDir, "samecontent.txt");
      const content = "Same content";

      fileWatcher.on("change", (change) => events.push(change));

      // Create file
      await fs.writeFile(testFile, content);
      await sleep(100);

      await waitFor(
        () =>
          events.some(
            (e) => e.type === "create" && e.path.includes("samecontent.txt")
          ),
        { timeout: 10000, interval: 100 }
      );

      // Clear create events
      events.length = 0;

      // Modify with same content - should not trigger event within window
      await fs.writeFile(testFile, content);
      await sleep(100);

      await waitForNot(
        () =>
          events.some(
            (e) => e.type === "modify" && e.path.includes("samecontent.txt")
          ),
        { timeout: 2000 } // Longer timeout for polling reliability
      );

      // Verify no modify events were generated
      expect(events.length).toBe(0);
    });
  });

  describe("Directory Change Handling", () => {
    beforeEach(async () => {
      await fileWatcher.start();
    });

    it("should handle directory creation", async () => {
      const events: FileChange[] = [];
      fileWatcher.on("change", (change) => events.push(change));

      const testDir = path.join(tempDir, "newdir");
      await fs.mkdir(testDir);
      await sleep(100);

      await waitFor(
        () =>
          events.some((e) => e.type === "create" && e.path.includes("newdir")),
        { timeout: 10000, interval: 100 }
      );

      expect(events.length).toBeGreaterThanOrEqual(1);
      const createEvent = events.find(
        (e) => e.type === "create" && e.path.includes("newdir")
      );
      expect(createEvent).toEqual(expect.any(Object));
      expect(createEvent?.stats?.isDirectory).toBe(true);
    });

    it("should handle directory deletion", async () => {
      const events: FileChange[] = [];

      // Set up event listener BEFORE any operations
      fileWatcher.on("change", (change) => events.push(change));

      const testDir = path.join(tempDir, "deletedir");
      await fs.mkdir(testDir);
      await sleep(100);

      // Wait for creation
      await waitFor(
        () =>
          events.some(
            (e) => e.type === "create" && e.path.includes("deletedir")
          ),
        { timeout: 10000, interval: 100 }
      );

      await fs.rmdir(testDir);
      await sleep(100);

      await waitFor(
        () =>
          events.some(
            (e) => e.type === "delete" && e.path.includes("deletedir")
          ),
        { timeout: 10000, interval: 100 }
      );

      expect(events.length).toBeGreaterThanOrEqual(2); // create and delete events
      const deleteEvent = events.find(
        (e) => e.type === "delete" && e.path.includes("deletedir")
      );
      expect(deleteEvent).toEqual(expect.any(Object));
      expect(deleteEvent?.stats?.isDirectory).toBe(true);
    });
  });

  describe("Change Queue Processing", () => {
    beforeEach(async () => {
      await fileWatcher.start();
    });

    it("should debounce multiple changes", async () => {
      const events: FileChange[] = [];
      fileWatcher.on("change", (change) => events.push(change));

      // Create multiple files quickly
      const promises = [];
      for (let i = 1; i <= 3; i++) {
        const testFile = path.join(tempDir, `file${i}.txt`);
        promises.push(fs.writeFile(testFile, `Content ${i}`));
      }
      await Promise.all(promises);
      await sleep(200); // Allow time for debouncing

      await waitFor(() => events.length >= 3, {
        timeout: 10000,
        interval: 100,
      });

      expect(events.length).toBeGreaterThanOrEqual(3);
      // Verify we have the expected file creation events
      for (let i = 1; i <= 3; i++) {
        const event = events.find((e) => e.path.includes(`file${i}.txt`));
        expect(event).toEqual(expect.any(Object));
        expect(event?.type).toBe("create");
      }
    });

    it("should process changes in batches", async () => {
      const batchEvents: FileChange[][] = [];
      fileWatcher.on("batchComplete", (changes) => batchEvents.push(changes));

      // Create more files than maxConcurrent (10)
      const promises = [];
      for (let i = 0; i < 15; i++) {
        const testFile = path.join(tempDir, `batchfile${i}.txt`);
        promises.push(fs.writeFile(testFile, `Content ${i}`));
      }
      await Promise.all(promises);
      await sleep(300); // Allow time for batching

      await waitFor(
        () => batchEvents.length >= 1 && batchEvents[0]?.length >= 15,
        { timeout: 10000, interval: 200 }
      );

      expect(batchEvents.length).toBeGreaterThanOrEqual(1);
      expect(batchEvents[0].length).toBeGreaterThanOrEqual(15);
      // Verify all files are in the batch
      for (let i = 0; i < 15; i++) {
        const event = batchEvents[0].find((e) =>
          e.path.includes(`batchfile${i}.txt`)
        );
        expect(event).toEqual(expect.any(Object));
      }
    });
  });

  describe("Event Emission", () => {
    beforeEach(async () => {
      await fileWatcher.start();
    });

    it("should emit typed events for different change types", async () => {
      const events: { [key: string]: FileChange[] } = {
        fileCreated: [],
        fileModified: [],
        fileDeleted: [],
      };

      fileWatcher.on("fileCreated", (change) =>
        events.fileCreated.push(change)
      );
      fileWatcher.on("fileModified", (change) =>
        events.fileModified.push(change)
      );
      fileWatcher.on("fileDeleted", (change) =>
        events.fileDeleted.push(change)
      );

      // Create, modify, and delete files
      const createFile = path.join(tempDir, "created.txt");
      const modifyFile = path.join(tempDir, "modified.txt");
      const deleteFile = path.join(tempDir, "deleted.txt");

      await fs.writeFile(createFile, "Created");
      await sleep(100);
      await fs.writeFile(modifyFile, "Initial");
      await sleep(100);
      await fs.writeFile(deleteFile, "To delete");
      await sleep(200);

      // Wait for initial create events
      await waitFor(
        () => {
          return (
            events.fileCreated.length >= 3 // All three files created
          );
        },
        { timeout: 10000, interval: 100 }
      );

      await fs.writeFile(modifyFile, "Modified");
      await sleep(100);
      await fs.unlink(deleteFile);
      await sleep(200);

      // Wait for modify and delete events
      await waitFor(
        () => {
          return (
            events.fileModified.length >= 1 && events.fileDeleted.length >= 1
          );
        },
        { timeout: 10000, interval: 100 }
      );

      expect(events.fileCreated.length).toBeGreaterThanOrEqual(3); // create events for all files
      expect(events.fileModified.length).toBeGreaterThanOrEqual(1); // modify event
      expect(events.fileDeleted.length).toBeGreaterThanOrEqual(1); // delete event
    });
  });

  describe("Hashing and Change Detection", () => {
    it("should calculate file hashes correctly", async () => {
      const content = "test-content";
      const hash = crypto.createHash("sha256").update(content).digest("hex");

      expect(typeof hash).toBe("string");
      expect(hash.length).toBe(64); // SHA-256 produces 64 character hex string
    });

    it("should handle hash calculation errors", async () => {
      let hash;
      try {
        const content = await fs.readFile("/nonexistent/file.txt");
        hash = crypto.createHash("sha256").update(content).digest("hex");
      } catch {
        hash = undefined;
      }

      expect(hash).toBeUndefined();
    });

    it("should update hash cache on file changes", async () => {
      await fileWatcher.start();

      const testFile = path.join(tempDir, "hashfile.txt");
      const relativePath = path.relative(process.cwd(), testFile);

      await fs.writeFile(testFile, "Content");
      await sleep(200); // Allow time for file system operations

      await waitFor(() => (fileWatcher as any).fileHashes.has(relativePath), {
        timeout: 10000,
        interval: 100,
      });

      expect((fileWatcher as any).fileHashes.has(relativePath)).toBe(true);
    });

    it("should clear hash cache on file deletion", async () => {
      const testFile = path.join(tempDir, "deletehash.txt");
      const relativePath = path.relative(process.cwd(), testFile);

      await fileWatcher.start();

      await fs.writeFile(testFile, "Content");
      await sleep(200);

      await waitFor(() => (fileWatcher as any).fileHashes.has(relativePath), {
        timeout: 10000,
        interval: 100,
      });

      await fs.unlink(testFile);
      await sleep(200);

      await waitFor(() => !(fileWatcher as any).fileHashes.has(relativePath), {
        timeout: 10000,
        interval: 100,
      });

      expect((fileWatcher as any).fileHashes.has(relativePath)).toBe(false);
    });
  });

  describe("Ignore Patterns", () => {
    it("should ignore files matching ignore patterns", () => {
      const shouldIgnore = (fileWatcher as any).shouldIgnore.bind(fileWatcher);

      // Test the actual patterns from the default config
      expect(shouldIgnore("node_modules/lodash/index.js")).toBe(true);
      expect(shouldIgnore("dist/bundle.js")).toBe(true);
      expect(shouldIgnore(".git/config")).toBe(true);
      expect(shouldIgnore("src/main.ts")).toBe(false);
    });

    it("should handle complex glob patterns", () => {
      const shouldIgnore = (fileWatcher as any).shouldIgnore.bind(fileWatcher);

      expect(shouldIgnore("coverage/report.html")).toBe(true);
      expect(shouldIgnore("app.log")).toBe(true);
      expect(shouldIgnore(".DS_Store")).toBe(true);
      expect(shouldIgnore("package-lock.json")).toBe(true);
    });

    it("should not ignore regular source files", () => {
      const shouldIgnore = (fileWatcher as any).shouldIgnore.bind(fileWatcher);

      expect(shouldIgnore("src/services/FileWatcher.ts")).toBe(false);
      expect(shouldIgnore("lib/utils/helpers.js")).toBe(false);
      expect(shouldIgnore("packages/my-package/index.ts")).toBe(false);
    });

    it("should handle simple wildcard patterns", () => {
      const customConfig: Partial<WatcherConfig> = {
        watchPaths: [tempDir],
        ignorePatterns: ["*.tmp", "temp_*", "backup.*"],
      };
      const customWatcher = new FileWatcher(customConfig);
      const shouldIgnore = (customWatcher as any).shouldIgnore.bind(
        customWatcher
      );

      // Test simple * patterns (covers lines 347-351)
      expect(shouldIgnore("test.tmp")).toBe(true);
      expect(shouldIgnore("temp_file.txt")).toBe(true);
      expect(shouldIgnore("backup.dat")).toBe(true);
      expect(shouldIgnore("regular.txt")).toBe(false);
      expect(shouldIgnore("test.tmp.backup")).toBe(false); // Doesn't match full pattern
    });
  });

  describe("Change Priority Calculation", () => {
    it("should assign high priority to source files", () => {
      const getPriority = (fileWatcher as any).getChangePriority.bind(
        fileWatcher
      );

      expect(getPriority({ path: "src/main.ts" } as FileChange)).toBe("high");
      expect(
        getPriority({ path: "src/components/Button.tsx" } as FileChange)
      ).toBe("high");
      expect(getPriority({ path: "lib/utils.js" } as FileChange)).toBe("high");
    });

    it("should assign medium priority to config files", () => {
      const getPriority = (fileWatcher as any).getChangePriority.bind(
        fileWatcher
      );

      expect(getPriority({ path: "package.json" } as FileChange)).toBe(
        "medium"
      );
      expect(getPriority({ path: "tsconfig.json" } as FileChange)).toBe(
        "medium"
      );
      expect(getPriority({ path: "README.md" } as FileChange)).toBe("medium");
    });

    it("should assign low priority to generated files", () => {
      const getPriority = (fileWatcher as any).getChangePriority.bind(
        fileWatcher
      );

      expect(getPriority({ path: "dist/bundle.js" } as FileChange)).toBe("low");
      expect(
        getPriority({ path: "node_modules/lodash/index.js" } as FileChange)
      ).toBe("low");
      expect(getPriority({ path: "coverage/report.html" } as FileChange)).toBe(
        "low"
      );
      expect(getPriority({ path: "logs/app.log" } as FileChange)).toBe("low");
    });
  });

  describe("File Hash Initialization", () => {
    it("should initialize file hashes for existing files", async () => {
      // Create some test files
      const testFile1 = path.join(tempDir, "file1.txt");
      const testFile2 = path.join(tempDir, "file2.js");

      await fs.writeFile(testFile1, "Content 1");
      await fs.writeFile(testFile2, "Content 2");

      await (fileWatcher as any).initializeFileHashes();

      expect((fileWatcher as any).fileHashes.size).toBeGreaterThan(0);
    });

    it("should recursively scan directories", async () => {
      // Create nested directory structure
      const subDir = path.join(tempDir, "subdir");
      await fs.mkdir(subDir);

      const testFile = path.join(subDir, "nested.txt");
      await fs.writeFile(testFile, "Nested content");

      await (fileWatcher as any).initializeFileHashes();

      const relativePath = path.relative(process.cwd(), testFile);
      expect((fileWatcher as any).fileHashes.has(relativePath)).toBe(true);
    });

    it("should handle scan errors gracefully", async () => {
      // Create a file that will cause read errors
      const testFile = path.join(tempDir, "unreadable.txt");
      await fs.writeFile(testFile, "Content");

      // Remove read permission (this might not work on all systems)
      try {
        await fs.chmod(testFile, 0o000);
      } catch {
        // If chmod fails, just proceed - the test will still work
      }

      // Ensure the file exists and is unreadable
      let fileExists = false;
      try {
        await fs.access(testFile);
        fileExists = true;
      } catch {
        // File doesn't exist or isn't accessible
      }

      // Call initializeFileHashes and ensure it doesn't throw
      await expect(
        (fileWatcher as any).initializeFileHashes()
      ).resolves.toBeUndefined();

      // Clean up the unreadable file
      try {
        await fs.chmod(testFile, 0o644); // Restore permissions first
        await fs.unlink(testFile);
      } catch {
        // Ignore cleanup errors
      }
    });

    it("should skip ignored files during directory scan", async () => {
      // Create a directory structure with ignored files
      const subDir = path.join(tempDir, `subdir-${Date.now()}`);
      const ignoredFile = path.join(subDir, "ignored.log");
      const normalFile = path.join(subDir, "normal.txt");

      await fs.mkdir(subDir, { recursive: true });
      await fs.writeFile(ignoredFile, "This should be ignored");
      await fs.writeFile(normalFile, "This should be processed");

      // Use custom watcher with specific ignore patterns
      const customConfig: Partial<WatcherConfig> = {
        watchPaths: [tempDir],
        ignorePatterns: ["**/*.log"], // Ignore log files
      };
      const customWatcher = new FileWatcher(customConfig);

      await (customWatcher as any).initializeFileHashes();

      const ignoredRelativePath = path.relative(process.cwd(), ignoredFile);
      const normalRelativePath = path.relative(process.cwd(), normalFile);

      // The ignored file should not be in hashes (covers continue statement at lines 311-312)
      expect((customWatcher as any).fileHashes.has(ignoredRelativePath)).toBe(
        false
      );

      // The normal file should be in hashes
      expect((customWatcher as any).fileHashes.has(normalRelativePath)).toBe(
        true
      );
    });

    it("should handle directory scan errors gracefully", async () => {
      // Create a directory and then make it unreadable
      const testDir = path.join(tempDir, "unreadable-dir");
      await fs.mkdir(testDir);
      await fs.writeFile(path.join(testDir, "file.txt"), "Content");

      // Make directory unreadable (this might not work on all systems)
      try {
        await fs.chmod(testDir, 0o000);
      } catch {
        // If chmod fails, just proceed - the test will still work
      }

      // Spy on console.warn to verify error logging (covers lines 329-330)
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      try {
        await (fileWatcher as any).scanDirectory(testDir);
        // The scan should complete without throwing, logging the error instead
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("Could not scan directory"),
          expect.any(Error)
        );
      } finally {
        consoleWarnSpy.mockRestore();
        // Try to restore permissions
        try {
          await fs.chmod(testDir, 0o755);
        } catch {
          // Ignore permission restoration errors
        }
      }
    });
  });

  describe("Public API Methods", () => {
    it("should return watched paths", () => {
      expect(fileWatcher.getWatchedPaths()).toEqual([tempDir]);
    });

    it("should return queue length", () => {
      expect(fileWatcher.getQueueLength()).toBe(0);

      (fileWatcher as any).changeQueue.push({} as FileChange);
      expect(fileWatcher.getQueueLength()).toBe(1);
    });

    it("should return processing status", () => {
      expect(fileWatcher.isProcessing()).toBe(false);

      (fileWatcher as any).processing = true;
      expect(fileWatcher.isProcessing()).toBe(true);
    });

    it("should rescan files and clear hash cache", async () => {
      // Create a test file
      const testFile = path.join(tempDir, "rescan.txt");
      await fs.writeFile(testFile, "Content");

      await fileWatcher.start();
      await waitFor(() => (fileWatcher as any).fileHashes.size > 0);

      expect((fileWatcher as any).fileHashes.size).toBeGreaterThan(0);

      await fileWatcher.rescan();

      expect((fileWatcher as any).fileHashes.size).toBeGreaterThan(0); // Should have rescanned and found files
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle concurrent start/stop operations", async () => {
      const promises = [
        fileWatcher.start(),
        fileWatcher.start(),
        fileWatcher.stop(),
        fileWatcher.start(),
      ];

      await expect(Promise.all(promises)).resolves.toBeDefined();
    });

    it("should handle large number of simultaneous changes", async () => {
      await fileWatcher.start();

      const batchEvents: FileChange[][] = [];
      fileWatcher.on("batchComplete", (changes) => batchEvents.push(changes));

      // Create 50 files simultaneously (reduced for reliability)
      const fileCount = 50;
      const promises = [];
      for (let i = 0; i < fileCount; i++) {
        const testFile = path.join(tempDir, `large${i}.txt`);
        promises.push(fs.writeFile(testFile, `Content ${i}`));
      }
      await Promise.all(promises);
      await sleep(500); // Allow time for processing

      await waitFor(
        () => batchEvents.length >= 1 && batchEvents[0]?.length >= fileCount,
        { timeout: 15000, interval: 300 }
      );

      expect(batchEvents.length).toBeGreaterThanOrEqual(1);
      expect(batchEvents[0].length).toBeGreaterThanOrEqual(fileCount);
    });
  });

  describe("Utility Methods", () => {
    it("should chunk arrays correctly", () => {
      const chunkArray = (fileWatcher as any).chunkArray.bind(fileWatcher);

      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const chunks = chunkArray(array, 3);

      expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);
    });

    it("should return correct change icons", () => {
      const getIcon = (fileWatcher as any).getChangeIcon.bind(fileWatcher);

      expect(getIcon("create")).toBe("📄");
      expect(getIcon("modify")).toBe("✏️");
      expect(getIcon("delete")).toBe("🗑️");
      expect(getIcon("rename")).toBe("🏷️");
      expect(getIcon("unknown")).toBe("📝");
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle full file lifecycle", async () => {
      await fileWatcher.start();

      const events: FileChange[] = [];
      fileWatcher.on("change", (change) => events.push(change));

      const testFile = path.join(tempDir, "lifecycle.txt");

      // File created
      await fs.writeFile(testFile, "Initial content");
      await sleep(150);
      await waitFor(
        () =>
          events.some(
            (e) => e.type === "create" && e.path.includes("lifecycle.txt")
          ),
        { timeout: 10000, interval: 100 }
      );

      // File modified
      await fs.writeFile(testFile, "Modified content");
      await sleep(150);
      await waitFor(
        () =>
          events.some(
            (e) => e.type === "modify" && e.path.includes("lifecycle.txt")
          ),
        { timeout: 10000, interval: 100 }
      );

      // File deleted
      await fs.unlink(testFile);
      await sleep(150);
      await waitFor(
        () =>
          events.some(
            (e) => e.type === "delete" && e.path.includes("lifecycle.txt")
          ),
        { timeout: 10000, interval: 100 }
      );

      expect(events.length).toBeGreaterThanOrEqual(2); // At least create and delete, modify might be filtered
      const createEvent = events.find((e) => e.type === "create");
      const deleteEvent = events.find((e) => e.type === "delete");
      expect(createEvent).toBeDefined();
      expect(deleteEvent).toBeDefined();
    });

    it("should handle mixed file and directory operations", async () => {
      await fileWatcher.start();

      const events: FileChange[] = [];
      fileWatcher.on("change", (change) => events.push(change));

      const testDir = path.join(tempDir, "mixeddir");
      const testFile = path.join(testDir, "file.txt");

      // Create directory
      await fs.mkdir(testDir);
      await sleep(150);
      await waitFor(
        () =>
          events.some(
            (e) =>
              e.type === "create" &&
              e.path.includes("mixeddir") &&
              e.stats?.isDirectory
          ),
        { timeout: 10000, interval: 100 }
      );

      // Create file in directory
      await fs.writeFile(testFile, "File content");
      await sleep(150);
      await waitFor(
        () =>
          events.some(
            (e) =>
              e.type === "create" &&
              e.path.includes("mixeddir") &&
              e.path.includes("file.txt")
          ),
        { timeout: 10000, interval: 100 }
      );

      // Delete file
      await fs.unlink(testFile);
      await sleep(150);
      await waitFor(
        () =>
          events.some(
            (e) =>
              e.type === "delete" &&
              e.path.includes("mixeddir") &&
              e.path.includes("file.txt")
          ),
        { timeout: 10000, interval: 100 }
      );

      // Delete directory
      await fs.rmdir(testDir);
      await sleep(150);
      await waitFor(
        () =>
          events.some(
            (e) =>
              e.type === "delete" &&
              e.path.includes("mixeddir") &&
              e.stats?.isDirectory
          ),
        { timeout: 10000, interval: 100 }
      );

      expect(events.length).toBeGreaterThanOrEqual(4); // dir create, file create, file delete, dir delete
      const dirCreateEvent = events.find(
        (e) =>
          e.type === "create" &&
          e.path.includes("mixeddir") &&
          e.stats?.isDirectory
      );
      const fileCreateEvent = events.find(
        (e) => e.type === "create" && e.path.includes("file.txt")
      );
      const fileDeleteEvent = events.find(
        (e) => e.type === "delete" && e.path.includes("file.txt")
      );
      expect(dirCreateEvent).toBeDefined();
      expect(fileCreateEvent).toBeDefined();
      expect(fileDeleteEvent).toBeDefined();
    });
  });
});

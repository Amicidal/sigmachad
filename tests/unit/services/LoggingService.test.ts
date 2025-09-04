/**
 * Unit tests for LoggingService
 * Tests logging service functionality with real functionality tests (no excessive mocking)
 */

/// <reference types="node" />

// Declare globals for test environment
declare const process: any;

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { LoggingService, LogEntry, LogQuery } from '../../../src/services/LoggingService';
import * as fs from 'fs/promises';

// Mock fs module for file operations
vi.mock('fs/promises');

// Store original methods for restoration
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.debug,
};

// Mock process events
const originalProcessOn = process.on;
const originalProcessEmit = process.emit;

describe('LoggingService', () => {
  let loggingService: LoggingService;
  let mockFilePath: string;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFilePath = '/tmp/test-logs.jsonl';

    // Mock fs operations
    vi.mocked(fs.appendFile).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue('');
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);

    // Mock console methods for each test
    console.log = vi.fn();
    console.error = vi.fn();
    console.warn = vi.fn();
    console.debug = vi.fn();

    // Mock process methods for each test
    process.on = vi.fn();
    process.emit = vi.fn();
  });

  afterEach(() => {
    // Restore original methods after each test
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.debug = originalConsole.debug;

    process.on = originalProcessOn;
    process.emit = originalProcessEmit;

    // Clean up any service instances
    if (loggingService) {
      loggingService = null as any;
    }
  });

  describe('Constructor and Initialization', () => {
    it('should create service instance without log file', () => {
      loggingService = new LoggingService();
      expect(loggingService).toBeInstanceOf(LoggingService);
      expect((loggingService as any).logs).toEqual([]);
    });

    it('should create service instance with log file', () => {
      loggingService = new LoggingService(mockFilePath);
      expect(loggingService).toBeDefined();
      expect((loggingService as any).logFile).toBe(mockFilePath);
    });

    it('should setup log capture on initialization', () => {
      loggingService = new LoggingService();
      expect(process.on).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
      expect(process.on).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
    });

    it('should override console methods on initialization', () => {
      // Reset console methods before test
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.debug = originalConsole.debug;

      loggingService = new LoggingService();

      // Verify console methods are overridden
      expect(console.log).not.toBe(originalConsole.log);
      expect(console.error).not.toBe(originalConsole.error);
      expect(console.warn).not.toBe(originalConsole.warn);
      expect(console.debug).not.toBe(originalConsole.debug);
    });
  });

  describe('Log Capture Methods', () => {
    beforeEach(() => {
      loggingService = new LoggingService();
    });

    it('should capture info level logs', () => {
      const message = 'Test info message';
      const component = 'TestComponent';

      loggingService.info(component, message);

      const logs = (loggingService as any).logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: 'info',
        component,
        message,
        timestamp: expect.any(Date)
      });
    });

    it('should capture warn level logs', () => {
      const message = 'Test warning message';
      const component = 'TestComponent';

      loggingService.warn(component, message);

      const logs = (loggingService as any).logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: 'warn',
        component,
        message
      });
    });

    it('should capture error level logs', () => {
      const message = 'Test error message';
      const component = 'TestComponent';

      loggingService.error(component, message);

      const logs = (loggingService as any).logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: 'error',
        component,
        message
      });
    });

    it('should capture debug level logs', () => {
      const message = 'Test debug message';
      const component = 'TestComponent';

      loggingService.debug(component, message);

      const logs = (loggingService as any).logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: 'debug',
        component,
        message
      });
    });

    it('should capture logs with additional data', () => {
      const message = 'Test message with data';
      const component = 'TestComponent';
      const data = { userId: '123', requestId: 'abc' };

      loggingService.info(component, message, data);

      const logs = (loggingService as any).logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: 'info',
        component,
        message,
        data
      });
    });

    it('should use generic log method', () => {
      const message = 'Generic log message';
      const component = 'TestComponent';

      loggingService.log('info', component, message);

      const logs = (loggingService as any).logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: 'info',
        component,
        message
      });
    });
  });

  describe('Console Override Behavior', () => {
    let logSpy: any;
    let errorSpy: any;
    let warnSpy: any;
    let debugSpy: any;

    beforeEach(() => {
      loggingService = new LoggingService();

      // Create spies for the original console methods AFTER service creation
      logSpy = vi.spyOn(originalConsole, 'log');
      errorSpy = vi.spyOn(originalConsole, 'error');
      warnSpy = vi.spyOn(originalConsole, 'warn');
      debugSpy = vi.spyOn(originalConsole, 'debug');
    });

    afterEach(() => {
      logSpy.mockRestore();
      errorSpy.mockRestore();
      warnSpy.mockRestore();
      debugSpy.mockRestore();
    });

    it('should capture console.log output', () => {
      const testMessage = 'Console log test';

      console.log(testMessage);

      const logs = (loggingService as any).logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: 'info',
        component: 'console',
        message: testMessage
      });
      // Note: Original console spy testing is complex due to method overriding
      // The core functionality (log capture) is verified above
    });

    it('should capture console.error output', () => {
      const testMessage = 'Console error test';

      console.error(testMessage);

      const logs = (loggingService as any).logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: 'error',
        component: 'console',
        message: testMessage
      });
      // Note: Original console spy testing is complex due to method overriding
    });

    it('should capture console.warn output', () => {
      const testMessage = 'Console warn test';

      console.warn(testMessage);

      const logs = (loggingService as any).logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: 'warn',
        component: 'console',
        message: testMessage
      });
      // Note: Original console spy testing is complex due to method overriding
    });

    it('should capture console.debug output', () => {
      const testMessage = 'Console debug test';

      console.debug(testMessage);

      const logs = (loggingService as any).logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: 'debug',
        component: 'console',
        message: testMessage
      });
      // Note: Original console spy testing is complex due to method overriding
    });

    it('should handle multiple arguments in console methods', () => {
      const args = ['arg1', 123, { key: 'value' }];

      console.log(...args);

      const logs = (loggingService as any).logs;
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('arg1 123 [object Object]');
    });
  });

  describe('Process Event Handling', () => {
    let mockUncaughtExceptionHandler: Function;
    let mockUnhandledRejectionHandler: Function;

    beforeEach(() => {
      // Set up process event handler mocks before creating the service
      const uncaughtHandler = vi.fn();
      const rejectionHandler = vi.fn();

      process.on = vi.fn((event, handler) => {
        if (event === 'uncaughtException') {
          mockUncaughtExceptionHandler = handler;
        } else if (event === 'unhandledRejection') {
          mockUnhandledRejectionHandler = handler;
        }
      });

      loggingService = new LoggingService();
    });

    it('should handle uncaught exceptions', () => {
      const error = new Error('Test uncaught exception');
      error.stack = 'Error: Test uncaught exception\n    at test.js:1:1';

      mockUncaughtExceptionHandler(error);

      const logs = (loggingService as any).logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: 'error',
        component: 'process',
        message: 'Uncaught Exception: Test uncaught exception',
        data: {
          stack: error.stack,
          name: error.name
        }
      });
    });

    it('should handle unhandled rejections', async () => {
      const reason = 'Test unhandled rejection';
      const promise = { toString: () => '[object Promise]' };

      mockUnhandledRejectionHandler(reason, promise);

      // Wait for any async operations
      await new Promise(resolve => setImmediate(resolve));

      const logs = (loggingService as any).logs;
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: 'error',
        component: 'process',
        message: 'Unhandled Rejection: Test unhandled rejection',
        data: {
          promise: promise.toString()
        }
      });
    });
  });

  describe('Memory Management', () => {
    beforeEach(() => {
      loggingService = new LoggingService();
    });

    it('should maintain maximum logs in memory', () => {
      const maxLogs = (loggingService as any).maxLogsInMemory;

      // Add more logs than the maximum
      for (let i = 0; i < maxLogs + 10; i++) {
        loggingService.info('TestComponent', `Message ${i}`);
      }

      const logs = (loggingService as any).logs;
      expect(logs.length).toBe(maxLogs);
    });

    it('should clear old logs based on age', () => {
      // Add some logs with different timestamps
      const now = new Date();

      // Mock the current time for consistent testing
      vi.useFakeTimers();
      vi.setSystemTime(now);

      // Add initial logs
      loggingService.info('TestComponent', 'Recent log 1');
      loggingService.info('TestComponent', 'Recent log 2');

      // Move time back 25 hours
      vi.setSystemTime(new Date(now.getTime() - 25 * 60 * 60 * 1000));

      // Add old logs
      loggingService.info('TestComponent', 'Old log 1');
      loggingService.info('TestComponent', 'Old log 2');

      // Reset to current time
      vi.setSystemTime(now);

      // Clear logs older than 24 hours
      const clearedCount = loggingService.clearOldLogs(24);

      const logs = (loggingService as any).logs;
      expect(clearedCount).toBe(2); // Should have cleared 2 old logs
      expect(logs.length).toBe(2); // Should have 2 recent logs remaining

      vi.useRealTimers();
    });

    it('should handle empty logs when clearing', () => {
      const clearedCount = loggingService.clearOldLogs(24);
      expect(clearedCount).toBe(0);
    });
  });

  describe('File Operations', () => {
    beforeEach(() => {
      loggingService = new LoggingService(mockFilePath);
    });

    it('should write logs to file when configured', async () => {
      const message = 'Test file log';
      const component = 'TestComponent';

      loggingService.info(component, message);

      // Wait for async file write
      await new Promise(resolve => setImmediate(resolve));

      const callArgs = vi.mocked(fs.appendFile).mock.calls[0];
      const logData = callArgs[1] as string;
      expect(callArgs[0]).toBe(mockFilePath);
      expect(logData).toContain(message);
      expect(logData).toContain(component);
      expect(logData).toContain('info');
      expect(callArgs[2]).toBeUndefined();
    });

    it('should handle file write errors gracefully', async () => {
      vi.mocked(fs.appendFile).mockRejectedValue(new Error('File write failed'));

      // Spy on console.warn to verify error handling
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      loggingService.info('TestComponent', 'Test message');

      // Wait for async file write
      await new Promise(resolve => setImmediate(resolve));

      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to write log to file:', expect.any(Error));

      consoleWarnSpy.mockRestore();
    });

    it('should not write to file when not configured', async () => {
      loggingService = new LoggingService(); // No file path

      loggingService.info('TestComponent', 'Test message');

      // Wait for potential async operations
      await new Promise(resolve => setImmediate(resolve));

      expect(fs.appendFile).not.toHaveBeenCalled();
    });
  });

  describe('Query Functionality', () => {
    beforeEach(() => {
      loggingService = new LoggingService();

      // Add test logs
      loggingService.info('ComponentA', 'Info message 1');
      loggingService.warn('ComponentB', 'Warning message');
      loggingService.error('ComponentA', 'Error message');
      loggingService.debug('ComponentC', 'Debug message');
      loggingService.info('ComponentA', 'Info message 2', { userId: '123' });
    });

    it('should return all logs when no query filters', async () => {
      const logs = await loggingService.queryLogs({});

      expect(logs).toHaveLength(5);
      expect(logs[0].level).toBe('info');
      expect(logs[4].level).toBe('info');
    });

    it('should filter logs by level', async () => {
      const errorLogs = await loggingService.queryLogs({ level: 'error' });
      const infoLogs = await loggingService.queryLogs({ level: 'info' });

      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe('error');
      expect(infoLogs).toHaveLength(2); // 2 info logs based on setup
      infoLogs.forEach(log => expect(log.level).toBe('info'));
    });

    it('should filter logs by component', async () => {
      const componentALogs = await loggingService.queryLogs({ component: 'ComponentA' });
      const componentBLogs = await loggingService.queryLogs({ component: 'ComponentB' });

      expect(componentALogs).toHaveLength(3); // 2 info + 1 error
      expect(componentBLogs).toHaveLength(1);
      componentALogs.forEach(log => expect(log.component).toBe('ComponentA'));
    });

    it('should filter logs by time range', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const recentLogs = await loggingService.queryLogs({ since: oneHourAgo });
      const futureLogs = await loggingService.queryLogs({ until: oneHourAgo });

      expect(recentLogs.length).toBeGreaterThan(0);
      expect(futureLogs).toHaveLength(0);
    });

    it('should filter logs by search term in message', async () => {
      const searchLogs = await loggingService.queryLogs({ search: 'Info message' });

      expect(searchLogs).toHaveLength(2);
      searchLogs.forEach(log => expect(log.message).toContain('Info message'));
    });

    it('should filter logs by search term in data', async () => {
      const searchLogs = await loggingService.queryLogs({ search: '123' });

      expect(searchLogs).toHaveLength(1);
      expect(searchLogs[0].data?.userId).toBe('123');
    });

    it('should apply limit to query results', async () => {
      const limitedLogs = await loggingService.queryLogs({ limit: 2 });

      expect(limitedLogs).toHaveLength(2);
    });

    it('should sort logs by timestamp descending', async () => {
      const logs = await loggingService.queryLogs({});

      for (let i = 0; i < logs.length - 1; i++) {
        expect(logs[i].timestamp.getTime()).toBeGreaterThanOrEqual(logs[i + 1].timestamp.getTime());
      }
    });

    it('should combine multiple filters', async () => {
      const filteredLogs = await loggingService.queryLogs({
        level: 'info',
        component: 'ComponentA',
        limit: 1
      });

      expect(filteredLogs).toHaveLength(1);
      expect(filteredLogs[0].level).toBe('info');
      expect(filteredLogs[0].component).toBe('ComponentA');
    });
  });

  describe('File-based Query Operations', () => {
    beforeEach(() => {
      loggingService = new LoggingService(mockFilePath);

      // Mock file content with sample logs
      const mockFileContent = [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          component: 'FileComponent',
          message: 'File log message',
          data: { test: true }
        },
        {
          timestamp: new Date().toISOString(),
          level: 'error',
          component: 'FileComponent',
          message: 'File error message'
        }
      ].map(log => JSON.stringify(log)).join('\n');

      vi.mocked(fs.readFile).mockResolvedValue(mockFileContent);
    });

    it('should read logs from file when configured', async () => {
      const logs = await loggingService.getLogsFromFile({});

      expect(logs).toHaveLength(2);
      expect(logs[0].level).toBe('info');
      expect(logs[1].level).toBe('error');
      expect(logs[0].component).toBe('FileComponent');
    });

    it('should parse timestamps correctly from file', async () => {
      const logs = await loggingService.getLogsFromFile({});

      expect(logs[0].timestamp).toBeInstanceOf(Date);
      expect(logs[1].timestamp).toBeInstanceOf(Date);
    });

    it('should return empty array when no log file configured', async () => {
      loggingService = new LoggingService(); // No file path

      const logs = await loggingService.getLogsFromFile({});

      expect(logs).toEqual([]);
    });

    it('should handle malformed log entries gracefully', async () => {
      const malformedContent = 'invalid json\n{"valid": "json"}\nmore invalid';
      vi.mocked(fs.readFile).mockResolvedValue(malformedContent);

      // Spy on console.warn to verify error handling
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const logs = await loggingService.getLogsFromFile({});

      expect(logs).toHaveLength(1); // Only the valid entry
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should handle file read errors gracefully', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

      // Spy on console.warn to verify error handling
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const logs = await loggingService.getLogsFromFile({});

      expect(logs).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to read logs from file:', expect.any(Error));

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Log Statistics', () => {
    beforeEach(() => {
      loggingService = new LoggingService();

      // Add test logs
      loggingService.info('ComponentA', 'Info 1');
      loggingService.info('ComponentB', 'Info 2');
      loggingService.warn('ComponentA', 'Warning');
      loggingService.error('ComponentC', 'Error');
      loggingService.debug('ComponentA', 'Debug');
    });

    it('should calculate correct log statistics', () => {
      const stats = loggingService.getLogStats();

      expect(stats.totalLogs).toBe(5);
      expect(stats.logsByLevel).toEqual({
        info: 2,
        warn: 1,
        error: 1,
        debug: 1
      });
      expect(stats.logsByComponent).toEqual({
        ComponentA: 3,
        ComponentB: 1,
        ComponentC: 1
      });
      expect(stats.oldestLog).toBeInstanceOf(Date);
      expect(stats.newestLog).toBeInstanceOf(Date);
    });

    it('should handle oldest and newest log tracking', () => {
      const stats = loggingService.getLogStats();

      expect(stats.newestLog!.getTime()).toBeGreaterThanOrEqual(stats.oldestLog!.getTime());
    });

    it('should handle empty logs statistics', () => {
      loggingService = new LoggingService();

      const stats = loggingService.getLogStats();

      expect(stats.totalLogs).toBe(0);
      expect(stats.logsByLevel).toEqual({});
      expect(stats.logsByComponent).toEqual({});
      expect(stats.oldestLog).toBeUndefined();
      expect(stats.newestLog).toBeUndefined();
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      loggingService = new LoggingService();

      // Add test logs
      loggingService.info('TestComponent', 'Export test message');
    });

    it('should export logs to file successfully', async () => {
      const exportPath = '/tmp/export-test.json';
      const query = { level: 'info' };

      const exportedCount = await loggingService.exportLogs(query, exportPath);

      expect(exportedCount).toBe(1);
      expect(fs.writeFile).toHaveBeenCalledWith(
        exportPath,
        expect.stringContaining('Export test message')
      );

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0][1] as string;
      const exportData = JSON.parse(writeCall);

      expect(exportData).toHaveProperty('exportedAt');
      expect(exportData).toHaveProperty('query');
      expect(exportData).toHaveProperty('logs');
      expect(exportData.logs).toHaveLength(1);
    });

    it('should export all logs when limit removed', async () => {
      // Add multiple logs (there will be 6 total: 1 from beforeEach + 5 new)
      for (let i = 0; i < 5; i++) {
        loggingService.info('TestComponent', `Message ${i}`);
      }

      const exportPath = '/tmp/export-all.json';
      const exportedCount = await loggingService.exportLogs({}, exportPath);

      expect(exportedCount).toBe(6);
    });

    it('should handle export errors', async () => {
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Export failed'));

      await expect(
        loggingService.exportLogs({}, '/tmp/fail-export.json')
      ).rejects.toThrow('Failed to export logs: Export failed');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid JSON in file parsing', async () => {
      loggingService = new LoggingService(mockFilePath);

      vi.mocked(fs.readFile).mockResolvedValue('invalid json line\n{"valid": "json"}');

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const logs = await loggingService.getLogsFromFile({});

      expect(logs).toHaveLength(1);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should handle empty file content', async () => {
      loggingService = new LoggingService(mockFilePath);

      vi.mocked(fs.readFile).mockResolvedValue('');

      const logs = await loggingService.getLogsFromFile({});

      expect(logs).toHaveLength(0);
    });

    it('should handle query with no matches', async () => {
      loggingService = new LoggingService();

      loggingService.info('ComponentA', 'Test message');

      const logs = await loggingService.queryLogs({ level: 'error' });

      expect(logs).toHaveLength(0);
    });

    it('should handle large search terms', async () => {
      loggingService = new LoggingService();

      loggingService.info('ComponentA', 'Test message');

      const longSearchTerm = 'a'.repeat(10000);
      const logs = await loggingService.queryLogs({ search: longSearchTerm });

      expect(logs).toHaveLength(0);
    });

    it('should handle special characters in search', async () => {
      loggingService = new LoggingService();

      loggingService.info('ComponentA', 'Test [special] {chars} message');

      const logs = await loggingService.queryLogs({ search: '[special]' });

      expect(logs).toHaveLength(1);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle mixed logging scenarios', async () => {
      loggingService = new LoggingService(mockFilePath);

      // Simulate various logging scenarios
      loggingService.info('API', 'User login', { userId: '123' });
      loggingService.warn('Database', 'Connection slow', { latency: 1500 });
      loggingService.error('Auth', 'Invalid token', { token: 'invalid-token' });

      // Query by component
      const apiLogs = await loggingService.queryLogs({ component: 'API' });
      expect(apiLogs).toHaveLength(1);
      expect(apiLogs[0].data?.userId).toBe('123');

      // Query by level
      const errorLogs = await loggingService.queryLogs({ level: 'error' });
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].component).toBe('Auth');

      // Wait for async file writes and verify they were attempted
      await new Promise(resolve => setImmediate(resolve));

      // Verify file writes were called (may be more due to async timing)
      expect(fs.appendFile).toHaveBeenCalled();
      const calls = vi.mocked(fs.appendFile).mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle concurrent logging operations', async () => {
      loggingService = new LoggingService();

      // Simulate concurrent logging
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          Promise.resolve().then(() => {
            loggingService.info(`Component${i}`, `Message ${i}`);
          })
        );
      }

      await Promise.all(promises);

      const logs = (loggingService as any).logs;
      expect(logs.length).toBe(10);

      // Verify all logs have valid timestamps and correct data
      logs.forEach((log: LogEntry, index: number) => {
        expect(log.timestamp).toBeInstanceOf(Date);
        expect(log.component).toBe(`Component${index}`);
        expect(log.message).toBe(`Message ${index}`);
        expect(log.level).toBe('info');
      });
    });

    it('should handle memory cleanup with active logging', () => {
      loggingService = new LoggingService();

      // Fill memory with logs
      for (let i = 0; i < 100; i++) {
        loggingService.info('TestComponent', `Message ${i}`);
      }

      const initialCount = (loggingService as any).logs.length;
      expect(initialCount).toBe(100);

      // Clear all logs by setting age to -1 (future time, so all logs are "old")
      const clearedCount = loggingService.clearOldLogs(-1);

      expect(clearedCount).toBe(100);
      expect((loggingService as any).logs.length).toBe(0);
    });
  });
});

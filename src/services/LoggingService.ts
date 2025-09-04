/**
 * Logging Service for Memento
 * Captures and manages system logs with querying capabilities
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface LogEntry {
  timestamp: Date;
  level: 'error' | 'warn' | 'info' | 'debug';
  component: string;
  message: string;
  data?: any;
  userId?: string;
  requestId?: string;
  ip?: string;
}

export interface LogQuery {
  level?: string;
  component?: string;
  since?: Date;
  until?: Date;
  limit?: number;
  search?: string;
}

export class LoggingService {
  private logs: LogEntry[] = [];
  private maxLogsInMemory = 10000;
  private logFile?: string;

  constructor(logFile?: string) {
    this.logFile = logFile;
    this.setupLogCapture();
  }

  private setupLogCapture(): void {
    // Override console methods to capture logs
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleDebug = console.debug;

    console.log = (...args) => {
      this.captureLog('info', 'console', args.join(' '));
      originalConsoleLog(...args);
    };

    console.error = (...args) => {
      this.captureLog('error', 'console', args.join(' '));
      originalConsoleError(...args);
    };

    console.warn = (...args) => {
      this.captureLog('warn', 'console', args.join(' '));
      originalConsoleWarn(...args);
    };

    console.debug = (...args) => {
      this.captureLog('debug', 'console', args.join(' '));
      originalConsoleDebug(...args);
    };

    // Also capture uncaught exceptions and unhandled rejections
    process.on('uncaughtException', (error) => {
      this.captureLog('error', 'process', `Uncaught Exception: ${error.message}`, {
        stack: error.stack,
        name: error.name
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.captureLog('error', 'process', `Unhandled Rejection: ${reason}`, {
        promise: promise.toString()
      });
    });
  }

  private captureLog(level: LogEntry['level'], component: string, message: string, data?: any): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      component,
      message,
      data
    };

    this.logs.push(logEntry);

    // Maintain max logs in memory
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs.shift();
    }

    // Write to file if configured
    if (this.logFile) {
      this.writeToFile(logEntry);
    }
  }

  private async writeToFile(entry: LogEntry): Promise<void> {
    try {
      const fsModule = await import('fs/promises');
      const logLine = JSON.stringify(entry) + '\n';
      await fsModule.appendFile(this.logFile!, logLine);
    } catch (error) {
      // Don't recursively log file write errors
      console.warn('Failed to write log to file:', error);
    }
  }

  async queryLogs(query: LogQuery): Promise<LogEntry[]> {
    let filteredLogs = [...this.logs];

    // Filter by level
    if (query.level) {
      filteredLogs = filteredLogs.filter(log => log.level === query.level);
    }

    // Filter by component
    if (query.component) {
      filteredLogs = filteredLogs.filter(log => log.component === query.component);
    }

    // Filter by time range
    if (query.since) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= query.since!);
    }

    if (query.until) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= query.until!);
    }

    // Search in message and data
    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log =>
        log.message.toLowerCase().includes(searchTerm) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(searchTerm))
      );
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    const limit = query.limit || 100;
    return filteredLogs.slice(0, limit);
  }

  async getLogsFromFile(query: LogQuery): Promise<LogEntry[]> {
    if (!this.logFile) {
      return [];
    }

    try {
      const fsModule = await import('fs/promises');
      const content = await fsModule.readFile(this.logFile, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.trim());

      const fileLogs: LogEntry[] = [];
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          // Convert timestamp string back to Date
          if (entry.timestamp) {
            entry.timestamp = new Date(entry.timestamp);
          }
          fileLogs.push(entry);
        } catch (parseError) {
          // Skip malformed log entries
          console.warn('Skipping malformed log entry:', line.substring(0, 100));
        }
      }

      // Apply the same filtering as in-memory logs
      let filteredLogs = fileLogs;

      if (query.level) {
        filteredLogs = filteredLogs.filter(log => log.level === query.level);
      }

      if (query.component) {
        filteredLogs = filteredLogs.filter(log => log.component === query.component);
      }

      if (query.since) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= query.since!);
      }

      if (query.until) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= query.until!);
      }

      if (query.search) {
        const searchTerm = query.search.toLowerCase();
        filteredLogs = filteredLogs.filter(log =>
          log.message.toLowerCase().includes(searchTerm) ||
          (log.data && JSON.stringify(log.data).toLowerCase().includes(searchTerm))
        );
      }

      filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      const limit = query.limit || 100;
      return filteredLogs.slice(0, limit);

    } catch (error) {
      console.warn('Failed to read logs from file:', error);
      return [];
    }
  }

  log(level: LogEntry['level'], component: string, message: string, data?: any): void {
    this.captureLog(level, component, message, data);
  }

  info(component: string, message: string, data?: any): void {
    this.captureLog('info', component, message, data);
  }

  warn(component: string, message: string, data?: any): void {
    this.captureLog('warn', component, message, data);
  }

  error(component: string, message: string, data?: any): void {
    this.captureLog('error', component, message, data);
  }

  debug(component: string, message: string, data?: any): void {
    this.captureLog('debug', component, message, data);
  }

  // Get log statistics
  getLogStats(): {
    totalLogs: number;
    logsByLevel: Record<string, number>;
    logsByComponent: Record<string, number>;
    oldestLog?: Date;
    newestLog?: Date;
  } {
    const stats = {
      totalLogs: this.logs.length,
      logsByLevel: {} as Record<string, number>,
      logsByComponent: {} as Record<string, number>,
      oldestLog: undefined as Date | undefined,
      newestLog: undefined as Date | undefined
    };

    for (const log of this.logs) {
      // Count by level
      stats.logsByLevel[log.level] = (stats.logsByLevel[log.level] || 0) + 1;

      // Count by component
      stats.logsByComponent[log.component] = (stats.logsByComponent[log.component] || 0) + 1;

      // Track oldest and newest
      if (!stats.oldestLog || log.timestamp < stats.oldestLog) {
        stats.oldestLog = log.timestamp;
      }
      if (!stats.newestLog || log.timestamp > stats.newestLog) {
        stats.newestLog = log.timestamp;
      }
    }

    return stats;
  }

  // Clear old logs from memory (useful for memory management)
  clearOldLogs(olderThanHours: number = 24): number {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const initialCount = this.logs.length;

    this.logs = this.logs.filter(log => log.timestamp >= cutoffTime);

    return initialCount - this.logs.length;
  }

  // Export logs to a file
  async exportLogs(query: LogQuery, exportPath: string): Promise<number> {
    const logs = await this.queryLogs({ ...query, limit: undefined }); // Remove limit for export

    try {
      const fsModule = await import('fs/promises');
      const exportData = {
        exportedAt: new Date().toISOString(),
        query,
        logs
      };

      await fsModule.writeFile(exportPath, JSON.stringify(exportData, null, 2));
      return logs.length;
    } catch (error) {
      throw new Error(`Failed to export logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}







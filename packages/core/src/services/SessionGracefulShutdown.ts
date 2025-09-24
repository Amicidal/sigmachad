/**
 * Session Graceful Shutdown Service
 *
 * Provides comprehensive graceful shutdown capabilities for Redis session coordination:
 * - Graceful session closure with checkpoints
 * - Connection cleanup and resource management
 * - Signal handling for different shutdown scenarios
 * - Data preservation and recovery preparation
 */

import { EventEmitter } from 'events';
import type { RedisClientType } from 'redis';
import { SessionManager } from './SessionManager.js';
import { SessionStore } from './SessionStore.js';
import { SessionReplay } from './SessionReplay.js';
import { SessionMigration } from './SessionMigration.js';
import { SessionHealthCheck } from './SessionHealthCheck.js';

export interface GracefulShutdownConfig {
  gracePeriod: number; // milliseconds to wait for graceful shutdown
  forceCloseAfter: number; // milliseconds before forcing shutdown
  checkpointActiveSessions: boolean;
  preserveReplays: boolean;
  enableRecoveryData: boolean;
  shutdownSignals: string[];
}

export interface ShutdownStatus {
  phase: 'initiated' | 'draining' | 'checkpointing' | 'cleanup' | 'complete' | 'forced';
  startTime: string;
  progress: {
    sessionsCheckpointed: number;
    totalSessions: number;
    connectionsClosedf: number;
    totalConnections: number;
    componentsShutdown: number;
    totalComponents: number;
  };
  errors: Array<{
    component: string;
    error: string;
    timestamp: string;
  }>;
  estimatedTimeRemaining?: number;
}

export interface ShutdownOptions {
  reason: string;
  graceful: boolean;
  preserveData: boolean;
  timeout?: number;
}

export interface RecoveryData {
  timestamp: string;
  activeSessions: Array<{
    sessionId: string;
    agentIds: string[];
    state: string;
    lastActivity: string;
    eventCount: number;
  }>;
  configuration: any;
  statistics: any;
  errors: any[];
}

export class SessionGracefulShutdown extends EventEmitter {
  private config: GracefulShutdownConfig;
  private sessionManager?: SessionManager;
  private redis?: RedisClientType;
  private sessionStore?: SessionStore;
  private sessionReplay?: SessionReplay;
  private sessionMigration?: SessionMigration;
  private healthCheck?: SessionHealthCheck;

  private shutdownStatus?: ShutdownStatus;
  private shutdownTimer?: NodeJS.Timeout;
  private forceTimer?: NodeJS.Timeout;
  private isShuttingDown = false;
  private signalHandlers: Map<string, () => void> = new Map();

  constructor(config: Partial<GracefulShutdownConfig> = {}) {
    super();
    this.config = {
      gracePeriod: config.gracePeriod || 30000, // 30 seconds
      forceCloseAfter: config.forceCloseAfter || 60000, // 60 seconds
      checkpointActiveSessions: config.checkpointActiveSessions ?? true,
      preserveReplays: config.preserveReplays ?? true,
      enableRecoveryData: config.enableRecoveryData ?? true,
      shutdownSignals: config.shutdownSignals || ['SIGTERM', 'SIGINT', 'SIGQUIT'],
    };
  }

  /**
   * Initialize graceful shutdown service
   */
  async initialize(services: {
    sessionManager?: SessionManager;
    redis?: RedisClientType;
    sessionStore?: SessionStore;
    sessionReplay?: SessionReplay;
    sessionMigration?: SessionMigration;
    healthCheck?: SessionHealthCheck;
  }): Promise<void> {
    this.sessionManager = services.sessionManager;
    this.redis = services.redis;
    this.sessionStore = services.sessionStore;
    this.sessionReplay = services.sessionReplay;
    this.sessionMigration = services.sessionMigration;
    this.healthCheck = services.healthCheck;

    // Setup signal handlers
    this.setupSignalHandlers();

    // Setup process event handlers
    process.on('uncaughtException', this.handleUncaughtException.bind(this));
    process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));

    this.emit('initialized');
  }

  /**
   * Initiate graceful shutdown
   */
  async shutdown(options: Partial<ShutdownOptions> = {}): Promise<void> {
    if (this.isShuttingDown) {
      console.log('[GracefulShutdown] Shutdown already in progress');
      return;
    }

    const shutdownOptions: ShutdownOptions = {
      reason: options.reason || 'Manual shutdown',
      graceful: options.graceful ?? true,
      preserveData: options.preserveData ?? true,
      timeout: options.timeout || this.config.gracePeriod,
    };

    console.log(`[GracefulShutdown] Initiating shutdown: ${shutdownOptions.reason}`);
    this.isShuttingDown = true;

    this.shutdownStatus = {
      phase: 'initiated',
      startTime: new Date().toISOString(),
      progress: {
        sessionsCheckpointed: 0,
        totalSessions: 0,
        connectionsClosedf: 0,
        totalConnections: 0,
        componentsShutdown: 0,
        totalComponents: this.getTotalComponents(),
      },
      errors: [],
    };

    this.emit('shutdown:started', { options: shutdownOptions, status: this.shutdownStatus });

    try {
      if (shutdownOptions.graceful) {
        await this.performGracefulShutdown(shutdownOptions);
      } else {
        await this.performForceShutdown();
      }
    } catch (error) {
      console.error('[GracefulShutdown] Error during shutdown:', error);
      await this.performForceShutdown();
    }
  }

  /**
   * Get current shutdown status
   */
  getShutdownStatus(): ShutdownStatus | null {
    return this.shutdownStatus || null;
  }

  /**
   * Check if shutdown is in progress
   */
  isShutdownInProgress(): boolean {
    return this.isShuttingDown;
  }

  /**
   * Perform graceful shutdown
   */
  private async performGracefulShutdown(options: ShutdownOptions): Promise<void> {
    const startTime = Date.now();

    // Set force shutdown timer
    this.forceTimer = setTimeout(() => {
      console.log('[GracefulShutdown] Grace period exceeded, forcing shutdown');
      this.performForceShutdown().catch(console.error);
    }, this.config.forceCloseAfter);

    try {
      // Phase 1: Stop accepting new connections/sessions
      await this.drainConnections();

      // Phase 2: Checkpoint active sessions
      if (this.config.checkpointActiveSessions) {
        await this.checkpointActiveSessions();
      }

      // Phase 3: Preserve recovery data
      if (this.config.enableRecoveryData && options.preserveData) {
        await this.createRecoveryData();
      }

      // Phase 4: Cleanup components
      await this.cleanupComponents();

      // Phase 5: Complete shutdown
      this.completeShutdown();

    } catch (error) {
      this.recordError('graceful-shutdown', error);
      throw error;
    } finally {
      if (this.forceTimer) {
        clearTimeout(this.forceTimer);
      }
    }
  }

  /**
   * Drain connections and stop accepting new requests
   */
  private async drainConnections(): Promise<void> {
    this.updatePhase('draining');
    console.log('[GracefulShutdown] Draining connections...');

    const drainPromises: Promise<void>[] = [];

    // Stop session manager from accepting new sessions
    if (this.sessionManager) {
      drainPromises.push(this.drainSessionManager());
    }

    // Stop health checks
    if (this.healthCheck) {
      drainPromises.push(this.healthCheck.shutdown());
    }

    await Promise.allSettled(drainPromises);
    this.updateProgress({ componentsShutdown: this.shutdownStatus!.progress.componentsShutdown + 1 });
  }

  /**
   * Drain session manager
   */
  private async drainSessionManager(): Promise<void> {
    if (!this.sessionManager) return;

    try {
      // Get list of active sessions
      const activeSessions = await this.sessionManager.listActiveSessions();
      this.updateProgress({ totalSessions: activeSessions.length });

      console.log(`[GracefulShutdown] Found ${activeSessions.length} active sessions to drain`);

      // Set short TTL on all sessions to prevent new events
      for (const sessionId of activeSessions) {
        try {
          if (this.sessionStore) {
            await this.sessionStore.setTTL(sessionId, 10); // 10 seconds
          }
        } catch (error) {
          this.recordError(`session-${sessionId}`, error);
        }
      }
    } catch (error) {
      this.recordError('session-manager-drain', error);
    }
  }

  /**
   * Checkpoint all active sessions
   */
  private async checkpointActiveSessions(): Promise<void> {
    this.updatePhase('checkpointing');
    console.log('[GracefulShutdown] Checkpointing active sessions...');

    if (!this.sessionManager) return;

    try {
      const activeSessions = await this.sessionManager.listActiveSessions();
      const checkpointPromises = activeSessions.map(async (sessionId) => {
        try {
          await this.sessionManager!.checkpoint(sessionId, {
            graceTTL: this.config.gracePeriod / 1000,
            includeFailureSnapshot: true,
          });
          this.updateProgress({
            sessionsCheckpointed: this.shutdownStatus!.progress.sessionsCheckpointed + 1,
          });
          console.log(`[GracefulShutdown] Checkpointed session: ${sessionId}`);
        } catch (error) {
          this.recordError(`checkpoint-${sessionId}`, error);
        }
      });

      await Promise.allSettled(checkpointPromises);
      console.log(`[GracefulShutdown] Completed checkpointing ${activeSessions.length} sessions`);
    } catch (error) {
      this.recordError('checkpoint-sessions', error);
    }
  }

  /**
   * Create recovery data for restart
   */
  private async createRecoveryData(): Promise<void> {
    console.log('[GracefulShutdown] Creating recovery data...');

    try {
      const recoveryData: RecoveryData = {
        timestamp: new Date().toISOString(),
        activeSessions: [],
        configuration: this.config,
        statistics: {},
        errors: this.shutdownStatus?.errors || [],
      };

      // Collect active session data
      if (this.sessionManager) {
        try {
          const sessionIds = await this.sessionManager.listActiveSessions();
          for (const sessionId of sessionIds) {
            try {
              const session = await this.sessionManager.getSession(sessionId);
              if (session) {
                recoveryData.activeSessions.push({
                  sessionId,
                  agentIds: session.agentIds,
                  state: session.state,
                  lastActivity: session.events.length > 0
                    ? session.events[session.events.length - 1].timestamp
                    : new Date().toISOString(),
                  eventCount: session.events.length,
                });
              }
            } catch (error) {
              this.recordError(`recovery-session-${sessionId}`, error);
            }
          }
        } catch (error) {
          this.recordError('recovery-sessions', error);
        }
      }

      // Collect statistics
      if (this.sessionManager) {
        try {
          recoveryData.statistics = await this.sessionManager.getStats();
        } catch (error) {
          this.recordError('recovery-stats', error);
        }
      }

      // Store recovery data in Redis
      if (this.redis) {
        await this.redis.set(
          'session:recovery:data',
          JSON.stringify(recoveryData),
          { EX: 24 * 60 * 60 } // 24 hours TTL
        );
        console.log('[GracefulShutdown] Recovery data stored');
      }

    } catch (error) {
      this.recordError('create-recovery-data', error);
    }
  }

  /**
   * Cleanup all components
   */
  private async cleanupComponents(): Promise<void> {
    this.updatePhase('cleanup');
    console.log('[GracefulShutdown] Cleaning up components...');

    const cleanupPromises: Array<{ name: string; promise: Promise<void> }> = [];

    // Stop replay recording
    if (this.sessionReplay) {
      cleanupPromises.push({
        name: 'sessionReplay',
        promise: this.sessionReplay.shutdown(),
      });
    }

    // Stop migration tasks
    if (this.sessionMigration) {
      cleanupPromises.push({
        name: 'sessionMigration',
        promise: this.sessionMigration.shutdown(),
      });
    }

    // Close session manager
    if (this.sessionManager) {
      cleanupPromises.push({
        name: 'sessionManager',
        promise: this.sessionManager.close(),
      });
    }

    // Close session store
    if (this.sessionStore) {
      cleanupPromises.push({
        name: 'sessionStore',
        promise: this.sessionStore.close(),
      });
    }

    // Close Redis connection last
    if (this.redis) {
      cleanupPromises.push({
        name: 'redis',
        promise: this.redis.quit(),
      });
    }

    // Execute cleanup with error handling
    for (const { name, promise } of cleanupPromises) {
      try {
        await promise;
        console.log(`[GracefulShutdown] Cleaned up: ${name}`);
        this.updateProgress({
          componentsShutdown: this.shutdownStatus!.progress.componentsShutdown + 1,
        });
      } catch (error) {
        this.recordError(name, error);
      }
    }
  }

  /**
   * Perform force shutdown
   */
  private async performForceShutdown(): Promise<void> {
    console.log('[GracefulShutdown] Performing force shutdown...');
    this.updatePhase('forced');

    // Force close all connections
    const forcePromises: Promise<void>[] = [];

    [this.sessionReplay, this.sessionMigration, this.sessionManager, this.sessionStore].forEach(service => {
      if (service && typeof service.close === 'function') {
        forcePromises.push(
          service.close().catch((error: any) => {
            console.error(`[GracefulShutdown] Force close error:`, error);
          })
        );
      }
    });

    if (this.redis) {
      forcePromises.push(
        this.redis.quit().catch((error) => {
          console.error('[GracefulShutdown] Force Redis close error:', error);
        })
      );
    }

    // Wait a maximum of 5 seconds for force cleanup
    await Promise.race([
      Promise.all(forcePromises),
      new Promise(resolve => setTimeout(resolve, 5000)),
    ]);

    this.completeShutdown();
  }

  /**
   * Complete the shutdown process
   */
  private completeShutdown(): void {
    this.updatePhase('complete');
    console.log('[GracefulShutdown] Shutdown complete');

    this.cleanupSignalHandlers();

    this.emit('shutdown:complete', {
      status: this.shutdownStatus,
      duration: Date.now() - new Date(this.shutdownStatus!.startTime).getTime(),
    });

    // Exit process after a brief delay to ensure event handlers complete
    setTimeout(() => {
      process.exit(0);
    }, 100);
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    this.config.shutdownSignals.forEach(signal => {
      const handler = () => {
        console.log(`[GracefulShutdown] Received ${signal}, initiating graceful shutdown`);
        this.shutdown({
          reason: `Process signal: ${signal}`,
          graceful: true,
          preserveData: true,
        }).catch(console.error);
      };

      this.signalHandlers.set(signal, handler);
      process.on(signal as NodeJS.Signals, handler);
    });
  }

  /**
   * Cleanup signal handlers
   */
  private cleanupSignalHandlers(): void {
    this.signalHandlers.forEach((handler, signal) => {
      process.removeListener(signal as NodeJS.Signals, handler);
    });
    this.signalHandlers.clear();
  }

  /**
   * Handle uncaught exceptions
   */
  private handleUncaughtException(error: Error): void {
    console.error('[GracefulShutdown] Uncaught exception:', error);
    this.shutdown({
      reason: `Uncaught exception: ${error.message}`,
      graceful: false,
      preserveData: true,
    }).catch(() => {
      process.exit(1);
    });
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection(reason: any, promise: Promise<any>): void {
    console.error('[GracefulShutdown] Unhandled rejection:', reason);
    this.shutdown({
      reason: `Unhandled rejection: ${reason}`,
      graceful: false,
      preserveData: true,
    }).catch(() => {
      process.exit(1);
    });
  }

  /**
   * Update shutdown phase
   */
  private updatePhase(phase: ShutdownStatus['phase']): void {
    if (this.shutdownStatus) {
      this.shutdownStatus.phase = phase;
      this.emit('shutdown:phase', { phase, status: this.shutdownStatus });
    }
  }

  /**
   * Update shutdown progress
   */
  private updateProgress(updates: Partial<ShutdownStatus['progress']>): void {
    if (this.shutdownStatus) {
      Object.assign(this.shutdownStatus.progress, updates);
      this.emit('shutdown:progress', { progress: this.shutdownStatus.progress });
    }
  }

  /**
   * Record shutdown error
   */
  private recordError(component: string, error: any): void {
    const errorRecord = {
      component,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };

    if (this.shutdownStatus) {
      this.shutdownStatus.errors.push(errorRecord);
    }

    this.emit('shutdown:error', errorRecord);
  }

  /**
   * Get total number of components to shutdown
   */
  private getTotalComponents(): number {
    let count = 0;
    if (this.sessionManager) count++;
    if (this.sessionStore) count++;
    if (this.sessionReplay) count++;
    if (this.sessionMigration) count++;
    if (this.healthCheck) count++;
    if (this.redis) count++;
    return count;
  }

  /**
   * Get recovery data from previous shutdown
   */
  async getRecoveryData(): Promise<RecoveryData | null> {
    if (!this.redis) return null;

    try {
      const data = await this.redis.get('session:recovery:data');
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('[GracefulShutdown] Failed to retrieve recovery data:', error);
    }

    return null;
  }

  /**
   * Clear recovery data
   */
  async clearRecoveryData(): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.del('session:recovery:data');
    } catch (error) {
      console.error('[GracefulShutdown] Failed to clear recovery data:', error);
    }
  }
}
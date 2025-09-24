/**
 * Session Replay Service
 *
 * Provides session replay capabilities for Redis-backed sessions
 * enabling historical analysis, debugging, and session reconstruction
 */

import { EventEmitter } from 'events';
import type { RedisClientType } from 'redis';
import {
  SessionDocument,
  SessionEvent,
  SessionState,
  ISessionStore,
} from './SessionTypes.js';

export interface ReplayConfig {
  compressionEnabled: boolean;
  snapshotInterval: number; // seconds
  maxReplayDuration: number; // seconds
  enableStateValidation: boolean;
  enableDeltaCompression: boolean;
}

export interface SessionSnapshot {
  sessionId: string;
  timestamp: string;
  sequenceNumber: number;
  state: SessionState;
  agentIds: string[];
  eventCount: number;
  metadata?: Record<string, any>;
  checksum?: string;
}

export interface ReplayFrame {
  timestamp: string;
  sequenceNumber: number;
  event?: SessionEvent;
  snapshot?: SessionSnapshot;
  deltaData?: Record<string, any>;
}

export interface ReplaySession {
  sessionId: string;
  originalSessionId: string;
  startTime: string;
  endTime?: string;
  frames: ReplayFrame[];
  metadata: {
    totalFrames: number;
    duration: number;
    compressionRatio?: number;
    validationPassed: boolean;
  };
}

export interface ReplayOptions {
  startFromSequence?: number;
  endAtSequence?: number;
  speed?: number; // playback speed multiplier
  includeSnapshots?: boolean;
  validationMode?: boolean;
  filterEventTypes?: string[];
  onlyAgents?: string[];
}

export interface ReplayStats {
  totalSessions: number;
  totalFrames: number;
  storageUsed: number; // bytes
  compressionRatio: number;
  averageSessionDuration: number;
  oldestReplay: string;
  newestReplay: string;
}

export class SessionReplay extends EventEmitter {
  private redis: RedisClientType;
  private config: ReplayConfig;
  private activeReplays = new Map<string, ReplaySession>();
  private snapshotTimer?: NodeJS.Timeout;

  constructor(redis: RedisClientType, config: Partial<ReplayConfig> = {}) {
    super();
    this.redis = redis;
    this.config = {
      compressionEnabled: config.compressionEnabled ?? true,
      snapshotInterval: config.snapshotInterval ?? 300, // 5 minutes
      maxReplayDuration: config.maxReplayDuration ?? 3600, // 1 hour
      enableStateValidation: config.enableStateValidation ?? true,
      enableDeltaCompression: config.enableDeltaCompression ?? true,
    };

    this.startSnapshotTimer();
  }

  /**
   * Start recording a session for replay
   */
  async startRecording(sessionId: string, initialState?: SessionDocument): Promise<void> {
    const replayId = `replay:${sessionId}:${Date.now()}`;

    const replaySession: ReplaySession = {
      sessionId: replayId,
      originalSessionId: sessionId,
      startTime: new Date().toISOString(),
      frames: [],
      metadata: {
        totalFrames: 0,
        duration: 0,
        validationPassed: false,
      },
    };

    // Create initial snapshot if state provided
    if (initialState) {
      const snapshot = await this.createSnapshot(sessionId, initialState);
      replaySession.frames.push({
        timestamp: snapshot.timestamp,
        sequenceNumber: 0,
        snapshot,
      });
    }

    this.activeReplays.set(sessionId, replaySession);

    // Store replay metadata in Redis
    await this.redis.hSet(`replay:meta:${replayId}`, {
      originalSessionId: sessionId,
      startTime: replaySession.startTime,
      status: 'recording',
    });

    this.emit('recording:started', { sessionId, replayId });
  }

  /**
   * Record an event in the replay
   */
  async recordEvent(sessionId: string, event: SessionEvent, sessionState?: SessionDocument): Promise<void> {
    const replaySession = this.activeReplays.get(sessionId);
    if (!replaySession) return;

    const frame: ReplayFrame = {
      timestamp: event.timestamp,
      sequenceNumber: event.seq,
      event,
    };

    // Add delta compression if enabled
    if (this.config.enableDeltaCompression && sessionState) {
      frame.deltaData = await this.calculateDelta(sessionId, sessionState);
    }

    replaySession.frames.push(frame);
    replaySession.metadata.totalFrames++;

    // Store frame in Redis
    await this.redis.zAdd(
      `replay:frames:${replaySession.sessionId}`,
      { score: event.seq, value: JSON.stringify(frame) }
    );

    // Create periodic snapshots
    if (replaySession.frames.length % 50 === 0) { // Every 50 events
      await this.createPeriodicSnapshot(sessionId, sessionState);
    }

    this.emit('event:recorded', { sessionId, event, frame });
  }

  /**
   * Stop recording and finalize replay
   */
  async stopRecording(sessionId: string): Promise<string> {
    const replaySession = this.activeReplays.get(sessionId);
    if (!replaySession) {
      throw new Error(`No active replay found for session: ${sessionId}`);
    }

    replaySession.endTime = new Date().toISOString();
    replaySession.metadata.duration =
      new Date(replaySession.endTime).getTime() - new Date(replaySession.startTime).getTime();

    // Validate replay if enabled
    if (this.config.enableStateValidation) {
      replaySession.metadata.validationPassed = await this.validateReplay(replaySession);
    }

    // Calculate compression ratio
    if (this.config.compressionEnabled) {
      replaySession.metadata.compressionRatio = await this.calculateCompressionRatio(replaySession);
    }

    // Store final metadata
    await this.redis.hSet(`replay:meta:${replaySession.sessionId}`, {
      endTime: replaySession.endTime,
      duration: replaySession.metadata.duration.toString(),
      totalFrames: replaySession.metadata.totalFrames.toString(),
      validationPassed: replaySession.metadata.validationPassed.toString(),
      status: 'completed',
    });

    // Add to replay index
    await this.redis.zAdd(
      'replay:index',
      { score: Date.now(), value: replaySession.sessionId }
    );

    const replayId = replaySession.sessionId;
    this.activeReplays.delete(sessionId);

    this.emit('recording:stopped', { sessionId, replayId, metadata: replaySession.metadata });
    return replayId;
  }

  /**
   * Start replaying a session
   */
  async startReplay(replayId: string, options: ReplayOptions = {}): Promise<ReplaySession> {
    const metadata = await this.redis.hGetAll(`replay:meta:${replayId}`);
    if (!metadata.originalSessionId) {
      throw new Error(`Replay not found: ${replayId}`);
    }

    // Load frames from Redis
    const frameData = await this.redis.zRange(`replay:frames:${replayId}`, 0, -1);
    const frames: ReplayFrame[] = frameData.map(data => JSON.parse(data));

    // Apply filters if specified
    let filteredFrames = frames;

    if (options.startFromSequence !== undefined) {
      filteredFrames = filteredFrames.filter(f =>
        !f.event || f.event.seq >= options.startFromSequence!);
    }

    if (options.endAtSequence !== undefined) {
      filteredFrames = filteredFrames.filter(f =>
        !f.event || f.event.seq <= options.endAtSequence!);
    }

    if (options.filterEventTypes?.length) {
      filteredFrames = filteredFrames.filter(f =>
        !f.event || options.filterEventTypes!.includes(f.event.type));
    }

    if (options.onlyAgents?.length) {
      filteredFrames = filteredFrames.filter(f =>
        !f.event || options.onlyAgents!.includes(f.event.actor));
    }

    const replaySession: ReplaySession = {
      sessionId: `playback:${replayId}:${Date.now()}`,
      originalSessionId: metadata.originalSessionId,
      startTime: metadata.startTime,
      endTime: metadata.endTime,
      frames: filteredFrames,
      metadata: {
        totalFrames: filteredFrames.length,
        duration: parseInt(metadata.duration || '0'),
        compressionRatio: parseFloat(metadata.compressionRatio || '1'),
        validationPassed: metadata.validationPassed === 'true',
      },
    };

    this.emit('replay:started', { replayId, replaySession, options });
    return replaySession;
  }

  /**
   * Play replay frames with timing
   */
  async playReplay(
    replaySession: ReplaySession,
    onFrame: (frame: ReplayFrame, index: number) => Promise<void> | void,
    options: ReplayOptions = {}
  ): Promise<void> {
    const speed = options.speed || 1;
    const frames = replaySession.frames;

    this.emit('replay:play:started', { sessionId: replaySession.sessionId, frameCount: frames.length });

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const nextFrame = frames[i + 1];

      // Execute frame callback
      await onFrame(frame, i);

      this.emit('replay:frame:played', {
        sessionId: replaySession.sessionId,
        frame,
        index: i,
        total: frames.length
      });

      // Calculate delay until next frame
      if (nextFrame && speed > 0) {
        const currentTime = new Date(frame.timestamp).getTime();
        const nextTime = new Date(nextFrame.timestamp).getTime();
        const delay = (nextTime - currentTime) / speed;

        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    this.emit('replay:play:completed', { sessionId: replaySession.sessionId });
  }

  /**
   * Get replay by ID
   */
  async getReplay(replayId: string): Promise<ReplaySession | null> {
    const metadata = await this.redis.hGetAll(`replay:meta:${replayId}`);
    if (!metadata.originalSessionId) return null;

    const frameData = await this.redis.zRange(`replay:frames:${replayId}`, 0, -1);
    const frames: ReplayFrame[] = frameData.map(data => JSON.parse(data));

    return {
      sessionId: replayId,
      originalSessionId: metadata.originalSessionId,
      startTime: metadata.startTime,
      endTime: metadata.endTime,
      frames,
      metadata: {
        totalFrames: frames.length,
        duration: parseInt(metadata.duration || '0'),
        compressionRatio: parseFloat(metadata.compressionRatio || '1'),
        validationPassed: metadata.validationPassed === 'true',
      },
    };
  }

  /**
   * List available replays
   */
  async listReplays(limit: number = 100): Promise<Array<{ replayId: string; metadata: any }>> {
    const replayIds = await this.redis.zRevRange('replay:index', 0, limit - 1);

    const replays = await Promise.all(
      replayIds.map(async (replayId) => {
        const metadata = await this.redis.hGetAll(`replay:meta:${replayId}`);
        return { replayId, metadata };
      })
    );

    return replays.filter(r => r.metadata.originalSessionId);
  }

  /**
   * Get replay statistics
   */
  async getReplayStats(): Promise<ReplayStats> {
    const allReplays = await this.redis.zRange('replay:index', 0, -1);

    let totalFrames = 0;
    let totalDuration = 0;
    let storageUsed = 0;
    let compressionSum = 0;
    let compressionCount = 0;
    let oldestTime = Date.now();
    let newestTime = 0;

    for (const replayId of allReplays) {
      const metadata = await this.redis.hGetAll(`replay:meta:${replayId}`);
      const frameCount = await this.redis.zCard(`replay:frames:${replayId}`);

      totalFrames += frameCount;
      totalDuration += parseInt(metadata.duration || '0');

      if (metadata.compressionRatio) {
        compressionSum += parseFloat(metadata.compressionRatio);
        compressionCount++;
      }

      const startTime = new Date(metadata.startTime).getTime();
      oldestTime = Math.min(oldestTime, startTime);
      newestTime = Math.max(newestTime, startTime);

      // Estimate storage (rough approximation)
      storageUsed += frameCount * 200; // ~200 bytes per frame
    }

    return {
      totalSessions: allReplays.length,
      totalFrames,
      storageUsed,
      compressionRatio: compressionCount > 0 ? compressionSum / compressionCount : 1,
      averageSessionDuration: allReplays.length > 0 ? totalDuration / allReplays.length : 0,
      oldestReplay: new Date(oldestTime).toISOString(),
      newestReplay: new Date(newestTime).toISOString(),
    };
  }

  /**
   * Delete a replay
   */
  async deleteReplay(replayId: string): Promise<void> {
    await Promise.all([
      this.redis.del(`replay:meta:${replayId}`),
      this.redis.del(`replay:frames:${replayId}`),
      this.redis.zRem('replay:index', replayId),
    ]);

    this.emit('replay:deleted', { replayId });
  }

  /**
   * Clean up old replays
   */
  async cleanupOldReplays(olderThanDays: number): Promise<number> {
    const cutoff = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    const oldReplays = await this.redis.zRangeByScore('replay:index', 0, cutoff);

    for (const replayId of oldReplays) {
      await this.deleteReplay(replayId);
    }

    this.emit('cleanup:completed', { removedReplays: oldReplays.length, cutoff });
    return oldReplays.length;
  }

  /**
   * Create a session snapshot
   */
  private async createSnapshot(sessionId: string, sessionState: SessionDocument): Promise<SessionSnapshot> {
    const snapshot: SessionSnapshot = {
      sessionId,
      timestamp: new Date().toISOString(),
      sequenceNumber: sessionState.events.length,
      state: sessionState.state,
      agentIds: [...sessionState.agentIds],
      eventCount: sessionState.events.length,
      metadata: sessionState.metadata ? { ...sessionState.metadata } : undefined,
    };

    // Calculate checksum for validation
    if (this.config.enableStateValidation) {
      snapshot.checksum = await this.calculateChecksum(snapshot);
    }

    return snapshot;
  }

  /**
   * Create periodic snapshot during recording
   */
  private async createPeriodicSnapshot(sessionId: string, sessionState?: SessionDocument): Promise<void> {
    if (!sessionState) return;

    const replaySession = this.activeReplays.get(sessionId);
    if (!replaySession) return;

    const snapshot = await this.createSnapshot(sessionId, sessionState);
    const frame: ReplayFrame = {
      timestamp: snapshot.timestamp,
      sequenceNumber: snapshot.sequenceNumber,
      snapshot,
    };

    replaySession.frames.push(frame);

    // Store snapshot frame
    await this.redis.zAdd(
      `replay:frames:${replaySession.sessionId}`,
      { score: snapshot.sequenceNumber, value: JSON.stringify(frame) }
    );
  }

  /**
   * Calculate delta between states
   */
  private async calculateDelta(sessionId: string, currentState: SessionDocument): Promise<Record<string, any>> {
    // Simple delta calculation - in practice this would be more sophisticated
    const lastSnapshot = await this.getLastSnapshot(sessionId);
    if (!lastSnapshot) return {};

    const delta: Record<string, any> = {};

    if (lastSnapshot.state !== currentState.state) {
      delta.stateChange = { from: lastSnapshot.state, to: currentState.state };
    }

    if (lastSnapshot.agentIds.length !== currentState.agentIds.length) {
      delta.agentChange = {
        added: currentState.agentIds.filter(id => !lastSnapshot.agentIds.includes(id)),
        removed: lastSnapshot.agentIds.filter(id => !currentState.agentIds.includes(id)),
      };
    }

    return delta;
  }

  /**
   * Get last snapshot for a session
   */
  private async getLastSnapshot(sessionId: string): Promise<SessionSnapshot | null> {
    const replaySession = this.activeReplays.get(sessionId);
    if (!replaySession) return null;

    // Find the most recent snapshot frame
    for (let i = replaySession.frames.length - 1; i >= 0; i--) {
      if (replaySession.frames[i].snapshot) {
        return replaySession.frames[i].snapshot!;
      }
    }

    return null;
  }

  /**
   * Validate replay integrity
   */
  private async validateReplay(replaySession: ReplaySession): Promise<boolean> {
    try {
      // Validate frame sequence
      let lastSequence = -1;
      for (const frame of replaySession.frames) {
        if (frame.event && frame.event.seq <= lastSequence) {
          return false; // Sequence out of order
        }
        if (frame.event) {
          lastSequence = frame.event.seq;
        }
      }

      // Validate snapshot checksums
      for (const frame of replaySession.frames) {
        if (frame.snapshot?.checksum) {
          const calculatedChecksum = await this.calculateChecksum(frame.snapshot);
          if (calculatedChecksum !== frame.snapshot.checksum) {
            return false; // Checksum mismatch
          }
        }
      }

      return true;
    } catch (error) {
      this.emit('validation:error', { replaySession, error });
      return false;
    }
  }

  /**
   * Calculate checksum for state validation
   */
  private async calculateChecksum(snapshot: SessionSnapshot): Promise<string> {
    const crypto = await import('crypto');
    const data = JSON.stringify({
      state: snapshot.state,
      agentIds: snapshot.agentIds.sort(),
      eventCount: snapshot.eventCount,
      metadata: snapshot.metadata,
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Calculate compression ratio
   */
  private async calculateCompressionRatio(replaySession: ReplaySession): Promise<number> {
    if (!this.config.compressionEnabled) return 1;

    // Simple compression ratio calculation
    const uncompressedSize = JSON.stringify(replaySession).length;
    const compressedFrames = replaySession.frames.filter(f => f.deltaData);
    const compressionSavings = compressedFrames.length * 0.3; // Estimate 30% savings

    return Math.max(0.1, 1 - compressionSavings);
  }

  /**
   * Start snapshot timer
   */
  private startSnapshotTimer(): void {
    this.snapshotTimer = setInterval(() => {
      this.emit('snapshot:timer:tick');
    }, this.config.snapshotInterval * 1000);
  }

  /**
   * Shutdown replay service
   */
  async shutdown(): Promise<void> {
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
    }

    // Stop all active recordings
    for (const sessionId of this.activeReplays.keys()) {
      try {
        await this.stopRecording(sessionId);
      } catch (error) {
        this.emit('error', error);
      }
    }

    this.emit('shutdown');
  }
}
// TODO(2025-09-30.35): Gate dynamic property access behind validation.
/**
 * Session Analytics Service
 *
 * Provides advanced analytics and metrics for Redis session coordination
 * including performance tracking, agent collaboration metrics, and session insights
 */

import { EventEmitter } from 'events';
import type { RedisClientType } from 'redis';
import { SessionEvent } from './SessionTypes.js';
import type {
  SessionAnalyticsConfig,
  SessionAnalyticsData,
  AgentCollaborationMetrics,
  SessionPerformanceMetrics,
  SessionTrendAnalysis,
} from '@memento/shared-types';

export class SessionAnalytics extends EventEmitter {
  private redis: RedisClientType;
  private config: SessionAnalyticsConfig;
  // Internal metrics extend the shared shape with optional fields used internally
  private activeSessionMetrics = new Map<
    string,
    SessionPerformanceMetrics & {
      startTime?: string;
      endTime?: string;
      duration?: number;
      eventCount?: number;
      averageEventProcessingTime?: number;
      peakMemoryUsage?: number;
    }
  >();
  private analyticsTimer?: NodeJS.Timeout;

  constructor(
    redis: RedisClientType,
    config: Partial<SessionAnalyticsConfig> = {}
  ) {
    super();
    this.redis = redis;
    this.config = {
      enabled: config.enabled ?? true,
      retentionDays: config.retentionDays ?? 30,
      sampleRate: config.sampleRate ?? 1.0,
      metricsInterval: config.metricsInterval ?? 300, // seconds
      enableRealTimeAnalytics: config.enableRealTimeAnalytics ?? true,
    } as SessionAnalyticsConfig;

    if (this.config.enableRealTimeAnalytics) {
      this.startRealTimeTracking();
    }
  }

  /**
   * Start tracking a session for analytics
   */
  async startSessionTracking(sessionId: string): Promise<void> {
    if (!this.config.enabled) return;

    const metrics: SessionPerformanceMetrics & {
      startTime?: string;
      endTime?: string;
      duration?: number;
      eventCount?: number;
      averageEventProcessingTime?: number;
      peakMemoryUsage?: number;
    } = {
      sessionId,
      timestamp: new Date().toISOString(),
      memoryUsage: 0,
      cpuUsage: 0,
      networkLatency: 0,
      operationCount: 0,
      averageOperationTime: 0,
      errorRate: 0,
      throughput: 0,
      // internal fields for backwards-compatible calculations
      startTime: new Date().toISOString(),
      duration: 0,
      eventCount: 0,
      averageEventProcessingTime: 0,
      peakMemoryUsage: 0,
    };

    this.activeSessionMetrics.set(sessionId, metrics);

    // Store initial tracking data in Redis
    await this.redis.hSet(`analytics:session:${sessionId}`, [
      'startTime', metrics.startTime || new Date().toISOString(),
      'status', 'active',
    ]);

    this.emit('session:tracking:started', { sessionId, metrics });
  }

  /**
   * Record an event for analytics
   */
  async recordEvent(
    sessionId: string,
    event: SessionEvent,
    processingTime?: number
  ): Promise<void> {
    const metrics = this.activeSessionMetrics.get(sessionId);
    if (!metrics) return;

    // Update session metrics
    metrics.eventCount = (metrics.eventCount || 0) + 1;
    if (processingTime) {
      const currentAvg = metrics.averageEventProcessingTime || 0;
      const eventCount = metrics.eventCount || 1;
      metrics.averageEventProcessingTime =
        (currentAvg * (eventCount - 1) + processingTime) /
        eventCount;
    }

    // Store event analytics
    const eventAnalytics = {
      sessionId,
      eventType: event.type,
      timestamp: event.timestamp,
      processingTime: processingTime || 0,
      actor: event.actor,
    };

    await this.redis.zAdd(`analytics:events:${sessionId}`, {
      score: Date.now(),
      value: JSON.stringify(eventAnalytics),
    });

    // Update global event type counters
    await this.redis.hIncrBy('analytics:global:event_types', event.type, 1);

    this.emit('event:recorded', { sessionId, event, processingTime });
  }

  /**
   * End session tracking and finalize analytics
   */
  async endSessionTracking(sessionId: string): Promise<SessionAnalyticsData> {
    const metrics = this.activeSessionMetrics.get(sessionId);
    if (!metrics) {
      throw new Error(`Session tracking not found: ${sessionId}`);
    }

    const endTime = new Date().toISOString();
    const startTime = metrics.startTime || metrics.timestamp;
    const duration = startTime ? Date.now() - new Date(startTime).getTime() : 0;

    metrics.endTime = endTime;
    metrics.duration = duration;

    // Calculate final analytics matching shared type
    const analyticsData: SessionAnalyticsData = {
      sessionId,
      startTime: startTime || new Date().toISOString(),
      endTime,
      duration,
      eventCount: metrics.eventCount || 0,
      entityCount: 0,
      relationshipCount: 0,
      agentCount: await this.getSessionAgentCount(sessionId),
      errorCount: 0,
      performanceScore: 0,
      userInteractions: 0,
      metadata: {},
    };

    // Store final analytics in Redis
    await this.redis.hSet(`analytics:session:${sessionId}`, [
      'endTime', endTime,
      'duration', duration.toString(),
      'eventCount', (metrics.eventCount || 0).toString(),
      'agentCount', analyticsData.agentCount.toString(),
      'status', 'completed',
    ]);

    // Add to time-series data for trend analysis
    await this.redis.zAdd('analytics:timeseries:sessions', {
      score: Date.now(),
      value: JSON.stringify(analyticsData),
    });

    // Cleanup active tracking
    this.activeSessionMetrics.delete(sessionId);

    this.emit('session:tracking:ended', { sessionId, analyticsData });
    return analyticsData;
  }

  /**
   * Get agent collaboration metrics
   */
  async getAgentCollaborationMetrics(
    agentId: string
  ): Promise<AgentCollaborationMetrics> {
    const agentData = await this.redis.hGetAll(`analytics:agent:${agentId}`);

    return {
      agentId,
      sessionsParticipated: parseInt(agentData.sessionsParticipated || '0'),
      totalInteractions: parseInt(agentData.totalInteractions || '0'),
      averageResponseTime: parseFloat(
        agentData.averageResponseTime || '0'
      ),
      successRate: parseFloat(agentData.successRate || '0'),
      errorRate: parseFloat(agentData.errorRate || '0'),
      collaborationScore: parseFloat(agentData.collaborationScore || '0'),
    };
  }

  /**
   * Update agent collaboration metrics
   */
  async updateAgentMetrics(
    agentId: string,
    updates: Partial<AgentCollaborationMetrics>
  ): Promise<void> {
    const entries = (Object.entries(updates) as Array<[
      keyof AgentCollaborationMetrics,
      AgentCollaborationMetrics[keyof AgentCollaborationMetrics] | undefined
    ]>)
      .filter(([key, value]) => key !== 'agentId' && value !== undefined)
      .map(([key, value]) => [String(key), String(value)] as [string, string]);

    if (entries.length > 0) {
      await this.redis.hSet(
        `analytics:agent:${agentId}`,
        Object.fromEntries(entries) as Record<string, string>
      );
    }
  }

  /**
   * Get session trend analysis
   */
  async getTrendAnalysis(
    timeframe: 'hour' | 'day' | 'week' | 'month'
  ): Promise<SessionTrendAnalysis> {
    const now = Date.now();
    let windowMs: number;
    switch (timeframe) {
      case 'hour':
        windowMs = 60 * 60 * 1000;
        break;
      case 'day':
        windowMs = 24 * 60 * 60 * 1000;
        break;
      case 'week':
        windowMs = 7 * 24 * 60 * 60 * 1000;
        break;
      case 'month':
        windowMs = 30 * 24 * 60 * 60 * 1000;
        break;
    }

    const since = now - windowMs;

    // Get sessions from timeframe
    const sessionData = await this.redis.zRangeByScore(
      'analytics:timeseries:sessions',
      since,
      now
    );

    const sessions = sessionData.map(
      (data) => JSON.parse(data) as SessionAnalyticsData
    );

    // Calculate trends
    const sessionCount = sessions.length;
    const averageDuration =
      sessions.reduce((sum, s) => sum + s.duration, 0) / sessionCount || 0;
    const _averageAgentsPerSession =
      sessions.reduce((sum, s) => sum + s.agentCount, 0) / sessionCount || 0;

    // Get most active agents
    const agentCounts = new Map<string, number>();
    await Promise.all(
      sessions.map(async (session) => {
        const events = await this.redis.zRange(
          `analytics:events:${session.sessionId}`,
          0,
          -1
        );
        events.forEach((eventStr) => {
          const event = JSON.parse(eventStr);
          agentCounts.set(event.actor, (agentCounts.get(event.actor) || 0) + 1);
        });
      })
    );

    const mostActiveAgents = Array.from(agentCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([agent]) => agent);

    // Get common event types
    const eventTypes = await this.redis.hGetAll('analytics:global:event_types');
    const _commonEventTypes = Object.entries(eventTypes)
      .map(([type, count]) => ({ type, count: parseInt(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const startTime = new Date(since).toISOString();
    const endTime = new Date(now).toISOString();

    return {
      period: timeframe,
      startTime,
      endTime,
      trends: {
        sessionCount,
        averageDuration,
        averageEventCount: sessions.reduce((s, d) => s + d.eventCount, 0) / sessionCount || 0,
        errorRate: 0,
        performanceScore: 0,
      },
      patterns: [
        // Simple example patterns derived from most active agents or events
        ...mostActiveAgents.map((a) => ({
          pattern: `active-agent:${a}`,
          frequency: agentCounts.get(a) || 0,
          impact: 'neutral' as const,
        })),
      ],
    };
  }

  /**
   * Get session performance metrics
   */
  async getSessionPerformanceMetrics(
    sessionId: string
  ): Promise<SessionPerformanceMetrics | null> {
    const stored = await this.redis.hGetAll(`analytics:session:${sessionId}`);
    if (!stored.sessionId && !stored.timestamp) return null;

    return {
      sessionId,
      timestamp: stored.timestamp || new Date().toISOString(),
      memoryUsage: parseFloat(stored.memoryUsage || '0'),
      cpuUsage: parseFloat(stored.cpuUsage || '0'),
      networkLatency: parseFloat(stored.networkLatency || '0'),
      operationCount: parseInt(stored.operationCount || '0'),
      averageOperationTime: parseFloat(stored.averageOperationTime || '0'),
      errorRate: parseFloat(stored.errorRate || '0'),
      throughput: parseFloat(stored.throughput || '0'),
    };
  }

  /**
   * Clean up old analytics data
   */
  async cleanupOldData(): Promise<void> {
    const cutoff = Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000;

    // Remove old session analytics
    await this.redis.zRemRangeByScore(
      'analytics:timeseries:sessions',
      0,
      cutoff
    );

    // Remove old event analytics for completed sessions
    const oldSessions = await this.redis.zRangeByScore(
      'analytics:timeseries:sessions',
      0,
      cutoff
    );

    for (const sessionStr of oldSessions) {
      const session = JSON.parse(sessionStr) as SessionAnalyticsData;
      await this.redis.del(`analytics:session:${session.sessionId}`);
      await this.redis.del(`analytics:events:${session.sessionId}`);
    }

    this.emit('cleanup:completed', {
      cutoff,
      removedSessions: oldSessions.length,
    });
  }

  /**
   * Start real-time tracking
   */
  private startRealTimeTracking(): void {
    this.analyticsTimer = setInterval(async () => {
      try {
        await this.updateRealTimeMetrics();
      } catch (error) {
        this.emit('error', error);
      }
    }, this.config.metricsInterval * 1000);
  }

  /**
   * Update real-time metrics
   */
  private async updateRealTimeMetrics(): Promise<void> {
    // Update memory usage for active sessions
    for (const [sessionId, metrics] of Array.from(
      this.activeSessionMetrics.entries()
    )) {
      const memoryUsage = process.memoryUsage();
      metrics.peakMemoryUsage = Math.max(
        metrics.peakMemoryUsage || 0,
        memoryUsage.heapUsed / 1024 / 1024 // MB
      );

      // Update in Redis
      await this.redis.hSet(`analytics:session:${sessionId}`, {
        peakMemoryUsage: (metrics.peakMemoryUsage || 0).toString(),
        duration: (
          Date.now() - new Date(metrics.startTime || metrics.timestamp).getTime()
        ).toString(),
      });
    }

    this.emit('realtime:updated', {
      activeSessions: this.activeSessionMetrics.size,
      totalMemory: process.memoryUsage().heapUsed / 1024 / 1024,
    });
  }

  /**
   * Helper: Get session agent count
   */
  private async getSessionAgentCount(sessionId: string): Promise<number> {
    const sessionData = await this.redis.hGetAll(`session:${sessionId}`);
    if (!sessionData.agentIds) return 0;

    try {
      const agents = JSON.parse(sessionData.agentIds);
      return Array.isArray(agents) ? agents.length : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Helper: Get session state transitions count
   */
  private async getSessionStateTransitions(sessionId: string): Promise<number> {
    const events = await this.redis.zRange(`events:${sessionId}`, 0, -1);
    return events.filter((eventStr) => {
      try {
        const event = JSON.parse(eventStr);
        return event.stateTransition !== undefined;
      } catch {
        return false;
      }
    }).length;
  }

  /**
   * Helper: Calculate collaboration score
   */
  private async calculateCollaborationScore(
    sessionId: string
  ): Promise<number> {
    const events = await this.redis.zRange(
      `analytics:events:${sessionId}`,
      0,
      -1
    );
    if (events.length === 0) return 0;

    const agentEventCounts = new Map<string, number>();
    events.forEach((eventStr) => {
      try {
        const event = JSON.parse(eventStr);
        agentEventCounts.set(
          event.actor,
          (agentEventCounts.get(event.actor) || 0) + 1
        );
      } catch {
        // Skip invalid events
      }
    });

    // Collaboration score based on event distribution among agents
    const agentCounts = Array.from(agentEventCounts.values());
    if (agentCounts.length <= 1) return 0;

    const mean =
      agentCounts.reduce((sum, count) => sum + count, 0) / agentCounts.length;
    const variance =
      agentCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) /
      agentCounts.length;

    // Higher score for more even distribution (lower variance)
    return Math.max(0, 1 - variance / (mean * mean));
  }

  /**
   * Helper: Calculate performance impact
   */
  private async calculatePerformanceImpact(sessionId: string): Promise<number> {
    const events = await this.redis.zRange(
      `analytics:events:${sessionId}`,
      0,
      -1
    );
    if (events.length === 0) return 0;

    let totalProcessingTime = 0;
    let count = 0;

    events.forEach((eventStr) => {
      try {
        const event = JSON.parse(eventStr);
        if (event.processingTime > 0) {
          totalProcessingTime += event.processingTime;
          count++;
        }
      } catch {
        // Skip invalid events
      }
    });

    return count > 0 ? totalProcessingTime / count : 0;
  }

  /**
   * Shutdown analytics service
   */
  async shutdown(): Promise<void> {
    if (this.analyticsTimer) {
      clearInterval(this.analyticsTimer);
    }

    // Finalize all active sessions
    for (const sessionId of Array.from(this.activeSessionMetrics.keys())) {
      try {
        await this.endSessionTracking(sessionId);
      } catch (error) {
        this.emit('error', error);
      }
    }

    this.emit('shutdown');
  }
}
 
// TODO(2025-09-30.35): Gate dynamic property access behind validation.

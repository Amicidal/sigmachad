/**
 * Session Analytics Service
 *
 * Provides advanced analytics and metrics for Redis session coordination
 * including performance tracking, agent collaboration metrics, and session insights
 */

import { EventEmitter } from 'events';
import type { RedisClientType } from 'redis';
import {
  SessionDocument,
  SessionEvent,
  SessionState,
  SessionMetrics,
  SessionStats,
  ISessionStore,
} from './SessionTypes.js';
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
  private activeSessionMetrics = new Map<string, SessionPerformanceMetrics>();
  private analyticsTimer?: NodeJS.Timeout;

  constructor(
    redis: RedisClientType,
    config: Partial<SessionAnalyticsConfig> = {}
  ) {
    super();
    this.redis = redis;
    this.config = {
      metricsRetentionDays: config.metricsRetentionDays ?? 30,
      aggregationInterval: config.aggregationInterval ?? 300, // 5 minutes
      enableRealTimeTracking: config.enableRealTimeTracking ?? true,
      enableAgentCollaborationMetrics:
        config.enableAgentCollaborationMetrics ?? true,
      enablePerformanceTracking: config.enablePerformanceTracking ?? true,
    };

    if (this.config.enableRealTimeTracking) {
      this.startRealTimeTracking();
    }
  }

  /**
   * Start tracking a session for analytics
   */
  async startSessionTracking(sessionId: string): Promise<void> {
    if (!this.config.enablePerformanceTracking) return;

    const metrics: SessionPerformanceMetrics = {
      sessionId,
      startTime: new Date().toISOString(),
      duration: 0,
      eventCount: 0,
      averageEventProcessingTime: 0,
      peakMemoryUsage: 0,
      networkLatency: 0,
      errorCount: 0,
    };

    this.activeSessionMetrics.set(sessionId, metrics);

    // Store initial tracking data in Redis
    await this.redis.hSet(`analytics:session:${sessionId}`, {
      startTime: metrics.startTime,
      status: 'active',
    });

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
    metrics.eventCount++;
    if (processingTime) {
      const currentAvg = metrics.averageEventProcessingTime;
      metrics.averageEventProcessingTime =
        (currentAvg * (metrics.eventCount - 1) + processingTime) /
        metrics.eventCount;
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
    const duration = Date.now() - new Date(metrics.startTime).getTime();

    metrics.endTime = endTime;
    metrics.duration = duration;

    // Calculate final analytics
    const analyticsData: SessionAnalyticsData = {
      sessionId,
      duration,
      eventCount: metrics.eventCount,
      agentCount: await this.getSessionAgentCount(sessionId),
      stateTransitions: await this.getSessionStateTransitions(sessionId),
      averageEventInterval:
        metrics.eventCount > 1 ? duration / (metrics.eventCount - 1) : 0,
      collaborationScore: await this.calculateCollaborationScore(sessionId),
      performanceImpact: await this.calculatePerformanceImpact(sessionId),
      timestamp: endTime,
    };

    // Store final analytics in Redis
    await this.redis.hSet(`analytics:session:${sessionId}`, {
      endTime,
      duration: duration.toString(),
      eventCount: metrics.eventCount.toString(),
      agentCount: analyticsData.agentCount.toString(),
      collaborationScore: analyticsData.collaborationScore.toString(),
      status: 'completed',
    });

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
      sessionsJoined: parseInt(agentData.sessionsJoined || '0'),
      eventsContributed: parseInt(agentData.eventsContributed || '0'),
      averageSessionDuration: parseFloat(
        agentData.averageSessionDuration || '0'
      ),
      collaborationEfficiency: parseFloat(
        agentData.collaborationEfficiency || '0'
      ),
      handoffsInitiated: parseInt(agentData.handoffsInitiated || '0'),
      handoffsReceived: parseInt(agentData.handoffsReceived || '0'),
    };
  }

  /**
   * Update agent collaboration metrics
   */
  async updateAgentMetrics(
    agentId: string,
    updates: Partial<AgentCollaborationMetrics>
  ): Promise<void> {
    const updateData: Record<string, string> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'agentId') {
        updateData[key] = value.toString();
      }
    });

    if (Object.keys(updateData).length > 0) {
      await this.redis.hSet(`analytics:agent:${agentId}`, updateData);
    }
  }

  /**
   * Get session trend analysis
   */
  async getTrendAnalysis(
    timeframe: 'hour' | 'day' | 'week' | 'month'
  ): Promise<SessionTrendAnalysis> {
    const now = Date.now();
    const timeframes = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };

    const since = now - timeframes[timeframe];

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
    const averageAgentsPerSession =
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
    const commonEventTypes = Object.entries(eventTypes)
      .map(([type, count]) => ({ type, count: parseInt(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      timeframe,
      sessionCount,
      averageDuration,
      averageAgentsPerSession,
      mostActiveAgents,
      commonEventTypes,
      performanceTrends: [], // TODO: Implement trend calculation
    };
  }

  /**
   * Get session performance metrics
   */
  async getSessionPerformanceMetrics(
    sessionId: string
  ): Promise<SessionPerformanceMetrics | null> {
    const stored = await this.redis.hGetAll(`analytics:session:${sessionId}`);
    if (!stored.startTime) return null;

    return {
      sessionId,
      startTime: stored.startTime,
      endTime: stored.endTime,
      duration: parseInt(stored.duration || '0'),
      eventCount: parseInt(stored.eventCount || '0'),
      averageEventProcessingTime: parseFloat(
        stored.averageEventProcessingTime || '0'
      ),
      peakMemoryUsage: parseFloat(stored.peakMemoryUsage || '0'),
      networkLatency: parseFloat(stored.networkLatency || '0'),
      errorCount: parseInt(stored.errorCount || '0'),
    };
  }

  /**
   * Clean up old analytics data
   */
  async cleanupOldData(): Promise<void> {
    const cutoff =
      Date.now() - this.config.metricsRetentionDays * 24 * 60 * 60 * 1000;

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
    }, this.config.aggregationInterval * 1000);
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
        metrics.peakMemoryUsage,
        memoryUsage.heapUsed / 1024 / 1024 // MB
      );

      // Update in Redis
      await this.redis.hSet(`analytics:session:${sessionId}`, {
        peakMemoryUsage: metrics.peakMemoryUsage.toString(),
        duration: (
          Date.now() - new Date(metrics.startTime).getTime()
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

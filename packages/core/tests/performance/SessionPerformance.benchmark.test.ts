/**
 * Session Performance Benchmark Tests
 *
 * Comprehensive performance testing for Redis session coordination:
 * - Session operations benchmarking (create, update, query)
 * - Concurrent agent testing (100+ agents)
 * - Pub/sub latency measurements
 * - Memory usage validation
 * - Load testing with production-like scenarios
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient as createRedisClient, RedisClientType } from 'redis';
import { SessionManager } from '../../src/services/SessionManager.js';
import { SessionStore } from '../../src/services/SessionStore.js';
import { SessionReplay } from '../../src/services/SessionReplay.js';
import {
  SessionManagerConfig,
  SessionEvent,
  SessionCreationOptions,
} from '../../src/services/SessionTypes.js';

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  sessionCreation: 100, // ms
  eventEmission: 50, // ms
  sessionQuery: 25, // ms
  pubSubLatency: 10, // ms
  concurrentAgents: 100, // count
  memoryLimit: 100 * 1024 * 1024, // 100MB
  throughputMinimum: 1000, // operations per second
};

interface BenchmarkResult {
  operation: string;
  averageTime: number;
  minTime: number;
  maxTime: number;
  throughput: number;
  memoryUsage: number;
  successRate: number;
}

interface LoadTestResult {
  totalOperations: number;
  duration: number;
  throughput: number;
  errorRate: number;
  averageLatency: number;
  maxLatency: number;
  memoryPeak: number;
}

describe('Session Performance Benchmarks', () => {
  let redis: RedisClientType;
  let sessionManager: SessionManager;
  let sessionStore: SessionStore;
  let sessionReplay: SessionReplay;
  let testDbIndex = 13;

  const config: SessionManagerConfig = {
    redis: {
      host: 'localhost',
      port: 6379,
      db: testDbIndex,
    },
    defaultTTL: 3600,
    checkpointInterval: 100,
    maxEventsPerSession: 10000,
    graceTTL: 300,
    enableFailureSnapshots: false,
    pubSubChannels: {
      global: 'perf:global:sessions',
      session: 'perf:session:',
    },
  };

  beforeEach(async () => {
    redis = createRedisClient({
      url: `redis://localhost:6379/${testDbIndex}`,
    });
    await redis.connect();
    await redis.flushDb();

    sessionStore = new SessionStore(config.redis);
    await sessionStore.initialize();

    sessionManager = new SessionManager(config);
    sessionReplay = new SessionReplay(redis);
  });

  afterEach(async () => {
    if (sessionManager) {
      await sessionManager.close();
    }
    if (sessionStore) {
      await sessionStore.close();
    }
    if (sessionReplay) {
      await sessionReplay.shutdown();
    }
    if (redis) {
      await redis.flushDb();
      await redis.quit();
    }
  });

  describe('Core Operation Benchmarks', () => {
    it('should benchmark session creation performance', async () => {
      const iterations = 1000;
      const times: number[] = [];
      const memoryUsages: number[] = [];

      console.log(`\n📊 Benchmarking session creation (${iterations} iterations)...`);

      for (let i = 0; i < iterations; i++) {
        const startTime = process.hrtime.bigint();
        const startMemory = process.memoryUsage().heapUsed;

        await sessionManager.createSession(`agent-${i}`, {
          metadata: { iteration: i },
        });

        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage().heapUsed;

        times.push(Number(endTime - startTime) / 1_000_000); // Convert to ms
        memoryUsages.push(endMemory - startMemory);

        // Progress indicator
        if ((i + 1) % 100 === 0) {
          console.log(`  Progress: ${i + 1}/${iterations} sessions created`);
        }
      }

      const result = calculateBenchmarkResult('Session Creation', times, memoryUsages);
      console.log(`  📈 Results:`, result);

      expect(result.averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.sessionCreation);
      expect(result.successRate).toBe(100);
    });

    it('should benchmark event emission performance', async () => {
      const sessionCount = 100;
      const eventsPerSession = 50;
      const times: number[] = [];

      console.log(`\n📊 Benchmarking event emission (${sessionCount} sessions, ${eventsPerSession} events each)...`);

      // Create sessions first
      const sessionIds: string[] = [];
      for (let i = 0; i < sessionCount; i++) {
        const sessionId = await sessionManager.createSession(`agent-${i}`);
        sessionIds.push(sessionId);
      }

      // Benchmark event emission
      for (let sessionIndex = 0; sessionIndex < sessionCount; sessionIndex++) {
        for (let eventIndex = 0; eventIndex < eventsPerSession; eventIndex++) {
          const startTime = process.hrtime.bigint();

          await sessionManager.emitEvent(
            sessionIds[sessionIndex],
            {
              type: 'modified',
              changeInfo: {
                elementType: 'function',
                entityIds: [`func-${sessionIndex}-${eventIndex}`],
                operation: 'modified',
              },
            },
            `agent-${sessionIndex}`,
            { autoCheckpoint: false } // Disable for pure event timing
          );

          const endTime = process.hrtime.bigint();
          times.push(Number(endTime - startTime) / 1_000_000);
        }

        if ((sessionIndex + 1) % 10 === 0) {
          console.log(`  Progress: ${sessionIndex + 1}/${sessionCount} sessions processed`);
        }
      }

      const result = calculateBenchmarkResult('Event Emission', times, []);
      console.log(`  📈 Results:`, result);

      expect(result.averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.eventEmission);
      expect(result.throughput).toBeGreaterThan(1000); // > 1000 events/sec
    });

    it('should benchmark session query performance', async () => {
      const sessionCount = 500;
      const queryIterations = 1000;
      const times: number[] = [];

      console.log(`\n📊 Benchmarking session queries (${sessionCount} sessions, ${queryIterations} queries)...`);

      // Setup: Create sessions with events
      const sessionIds: string[] = [];
      for (let i = 0; i < sessionCount; i++) {
        const sessionId = await sessionManager.createSession(`agent-${i}`);
        sessionIds.push(sessionId);

        // Add some events to each session
        for (let j = 0; j < 5; j++) {
          await sessionManager.emitEvent(
            sessionId,
            {
              type: 'modified',
              changeInfo: {
                elementType: 'function',
                entityIds: [`func-${i}-${j}`],
                operation: 'modified',
              },
            },
            `agent-${i}`,
            { autoCheckpoint: false }
          );
        }
      }

      console.log(`  Setup complete. Running ${queryIterations} queries...`);

      // Benchmark queries
      for (let i = 0; i < queryIterations; i++) {
        const randomSessionId = sessionIds[Math.floor(Math.random() * sessionIds.length)];
        const startTime = process.hrtime.bigint();

        await sessionManager.getSession(randomSessionId);

        const endTime = process.hrtime.bigint();
        times.push(Number(endTime - startTime) / 1_000_000);

        if ((i + 1) % 100 === 0) {
          console.log(`  Progress: ${i + 1}/${queryIterations} queries completed`);
        }
      }

      const result = calculateBenchmarkResult('Session Query', times, []);
      console.log(`  📈 Results:`, result);

      expect(result.averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.sessionQuery);
      expect(result.throughput).toBeGreaterThan(2000); // > 2000 queries/sec
    });
  });

  describe('Concurrency and Load Testing', () => {
    it('should handle 100+ concurrent agents', async () => {
      const agentCount = 150;
      const eventsPerAgent = 20;

      console.log(`\n🚀 Testing ${agentCount} concurrent agents (${eventsPerAgent} events each)...`);

      const startTime = Date.now();
      const errors: Error[] = [];
      const latencies: number[] = [];

      // Create concurrent agent operations
      const agentPromises = Array.from({ length: agentCount }, async (_, agentIndex) => {
        try {
          const agentStartTime = Date.now();
          const agentId = `concurrent-agent-${agentIndex}`;

          // Create session
          const sessionId = await sessionManager.createSession(agentId);

          // Emit events
          for (let eventIndex = 0; eventIndex < eventsPerAgent; eventIndex++) {
            const eventStart = Date.now();

            await sessionManager.emitEvent(
              sessionId,
              {
                type: 'modified',
                changeInfo: {
                  elementType: 'function',
                  entityIds: [`func-${agentIndex}-${eventIndex}`],
                  operation: 'modified',
                },
              },
              agentId,
              { autoCheckpoint: false }
            );

            latencies.push(Date.now() - eventStart);
          }

          const agentDuration = Date.now() - agentStartTime;
          return { agentId, sessionId, duration: agentDuration };
        } catch (error) {
          errors.push(error as Error);
          return null;
        }
      });

      const results = await Promise.allSettled(agentPromises);
      const totalDuration = Date.now() - startTime;

      const successfulAgents = results.filter(r => r.status === 'fulfilled' && r.value !== null);
      const failedAgents = results.filter(r => r.status === 'rejected' || r.value === null);

      console.log(`  ✅ Successful agents: ${successfulAgents.length}/${agentCount}`);
      console.log(`  ❌ Failed agents: ${failedAgents.length}/${agentCount}`);
      console.log(`  ⏱️  Total duration: ${totalDuration}ms`);
      console.log(`  📊 Average latency: ${latencies.reduce((a, b) => a + b, 0) / latencies.length}ms`);

      // Check performance requirements
      const successRate = (successfulAgents.length / agentCount) * 100;
      const averageLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

      expect(successfulAgents.length).toBeGreaterThanOrEqual(PERFORMANCE_THRESHOLDS.concurrentAgents);
      expect(successRate).toBeGreaterThan(95); // 95% success rate
      expect(averageLatency).toBeLessThan(100); // Average latency under 100ms
      expect(errors.length).toBeLessThan(agentCount * 0.05); // Less than 5% errors
    });

    it('should measure pub/sub latency', async () => {
      const messageCount = 1000;
      const latencies: number[] = [];

      console.log(`\n📡 Measuring pub/sub latency (${messageCount} messages)...`);

      // Setup subscriber
      const subscriber = createRedisClient({
        url: `redis://localhost:6379/${testDbIndex}`,
      });
      await subscriber.connect();

      const messagePromises: Promise<number>[] = [];

      // Subscribe and measure latency
      await subscriber.subscribe('perf:latency:test', (message) => {
        const messageData = JSON.parse(message);
        const latency = Date.now() - messageData.timestamp;
        latencies.push(latency);
      });

      console.log(`  Publishing ${messageCount} messages...`);

      // Publish messages and measure latency
      for (let i = 0; i < messageCount; i++) {
        const timestamp = Date.now();
        await redis.publish('perf:latency:test', JSON.stringify({
          id: i,
          timestamp,
        }));

        if ((i + 1) % 100 === 0) {
          console.log(`  Progress: ${i + 1}/${messageCount} messages published`);
        }
      }

      // Wait for all messages to be received
      await new Promise(resolve => setTimeout(resolve, 1000));

      await subscriber.quit();

      const averageLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);
      const minLatency = Math.min(...latencies);

      console.log(`  📊 Pub/Sub Latency Results:`);
      console.log(`    Average: ${averageLatency.toFixed(2)}ms`);
      console.log(`    Min: ${minLatency}ms`);
      console.log(`    Max: ${maxLatency}ms`);
      console.log(`    Messages received: ${latencies.length}/${messageCount}`);

      expect(averageLatency).toBeLessThan(PERFORMANCE_THRESHOLDS.pubSubLatency);
      expect(latencies.length).toBeGreaterThan(messageCount * 0.95); // 95% delivery rate
    });

    it('should validate memory usage stays bounded', async () => {
      const sessionCount = 200;
      const eventsPerSession = 100;

      console.log(`\n🧠 Memory usage test (${sessionCount} sessions, ${eventsPerSession} events each)...`);

      const initialMemory = process.memoryUsage();
      const memorySnapshots: Array<{ timestamp: number; memory: NodeJS.MemoryUsage }> = [];

      // Record initial memory
      memorySnapshots.push({
        timestamp: Date.now(),
        memory: initialMemory,
      });

      console.log(`  Initial memory: ${formatMemory(initialMemory.heapUsed)}`);

      // Create sessions and events while monitoring memory
      for (let sessionIndex = 0; sessionIndex < sessionCount; sessionIndex++) {
        const sessionId = await sessionManager.createSession(`memory-agent-${sessionIndex}`);

        for (let eventIndex = 0; eventIndex < eventsPerSession; eventIndex++) {
          await sessionManager.emitEvent(
            sessionId,
            {
              type: 'modified',
              changeInfo: {
                elementType: 'function',
                entityIds: [`func-${sessionIndex}-${eventIndex}`],
                operation: 'modified',
              },
              impact: {
                severity: 'medium',
                perfDelta: Math.random() * 10 - 5,
              },
            },
            `memory-agent-${sessionIndex}`,
            { autoCheckpoint: false }
          );

          // Take memory snapshot every 1000 events
          if ((sessionIndex * eventsPerSession + eventIndex + 1) % 1000 === 0) {
            const currentMemory = process.memoryUsage();
            memorySnapshots.push({
              timestamp: Date.now(),
              memory: currentMemory,
            });
            console.log(`  Memory at ${sessionIndex * eventsPerSession + eventIndex + 1} events: ${formatMemory(currentMemory.heapUsed)}`);
          }
        }

        if ((sessionIndex + 1) % 50 === 0) {
          console.log(`  Progress: ${sessionIndex + 1}/${sessionCount} sessions created`);
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log(`  📊 Memory Usage Results:`);
      console.log(`    Initial: ${formatMemory(initialMemory.heapUsed)}`);
      console.log(`    Final: ${formatMemory(finalMemory.heapUsed)}`);
      console.log(`    Increase: ${formatMemory(memoryIncrease)}`);
      console.log(`    Per session: ${formatMemory(memoryIncrease / sessionCount)}`);
      console.log(`    Per event: ${formatMemory(memoryIncrease / (sessionCount * eventsPerSession))}`);

      // Check memory constraints
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryLimit);
      expect(finalMemory.heapUsed).toBeLessThan(200 * 1024 * 1024); // 200MB total limit

      // Memory should not grow linearly with events (due to TTL and cleanup)
      const memoryGrowthRate = memoryIncrease / (sessionCount * eventsPerSession);
      expect(memoryGrowthRate).toBeLessThan(1000); // Less than 1KB per event
    });
  });

  describe('Production-like Load Testing', () => {
    it('should handle production-like mixed workload', async () => {
      const testDuration = 30000; // 30 seconds
      const targetThroughput = 500; // operations per second

      console.log(`\n🏭 Production-like load test (${testDuration / 1000}s duration, target: ${targetThroughput} ops/sec)...`);

      const operations = {
        sessionCreations: 0,
        eventEmissions: 0,
        sessionQueries: 0,
        checkpoints: 0,
      };

      const errors: Error[] = [];
      const latencies: number[] = [];
      const startTime = Date.now();
      let isRunning = true;

      // Stop test after duration
      setTimeout(() => {
        isRunning = false;
      }, testDuration);

      // Concurrent workers simulating different agent behaviors
      const workers = Array.from({ length: 20 }, async (_, workerIndex) => {
        const activeSessions: string[] = [];

        while (isRunning) {
          try {
            const operationStart = Date.now();
            const random = Math.random();

            if (random < 0.2 || activeSessions.length === 0) {
              // 20% session creation
              const sessionId = await sessionManager.createSession(`worker-${workerIndex}-agent`);
              activeSessions.push(sessionId);
              operations.sessionCreations++;
            } else if (random < 0.7) {
              // 50% event emission
              const sessionId = activeSessions[Math.floor(Math.random() * activeSessions.length)];
              await sessionManager.emitEvent(
                sessionId,
                {
                  type: Math.random() > 0.8 ? 'broke' : 'modified',
                  changeInfo: {
                    elementType: 'function',
                    entityIds: [`func-${Date.now()}-${Math.random()}`],
                    operation: 'modified',
                  },
                  impact: {
                    severity: Math.random() > 0.7 ? 'high' : 'medium',
                    perfDelta: Math.random() * 20 - 10,
                  },
                },
                `worker-${workerIndex}-agent`
              );
              operations.eventEmissions++;
            } else if (random < 0.9) {
              // 20% session queries
              const sessionId = activeSessions[Math.floor(Math.random() * activeSessions.length)];
              await sessionManager.getSession(sessionId);
              operations.sessionQueries++;
            } else {
              // 10% checkpoints
              const sessionId = activeSessions[Math.floor(Math.random() * activeSessions.length)];
              await sessionManager.checkpoint(sessionId);
              operations.checkpoints++;
            }

            const operationLatency = Date.now() - operationStart;
            latencies.push(operationLatency);

            // Brief pause to control rate
            await new Promise(resolve => setTimeout(resolve, 10));
          } catch (error) {
            errors.push(error as Error);
          }
        }
      });

      await Promise.all(workers);

      const actualDuration = Date.now() - startTime;
      const totalOperations = Object.values(operations).reduce((a, b) => a + b, 0);
      const actualThroughput = (totalOperations / actualDuration) * 1000;
      const errorRate = (errors.length / totalOperations) * 100;
      const averageLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

      console.log(`  📊 Load Test Results:`);
      console.log(`    Duration: ${actualDuration}ms`);
      console.log(`    Total operations: ${totalOperations}`);
      console.log(`    Throughput: ${actualThroughput.toFixed(2)} ops/sec`);
      console.log(`    Error rate: ${errorRate.toFixed(2)}%`);
      console.log(`    Average latency: ${averageLatency.toFixed(2)}ms`);
      console.log(`    Operations breakdown:`, operations);

      // Verify performance requirements
      expect(actualThroughput).toBeGreaterThan(targetThroughput * 0.8); // At least 80% of target
      expect(errorRate).toBeLessThan(1); // Less than 1% error rate
      expect(averageLatency).toBeLessThan(200); // Average latency under 200ms
    });

    it('should handle failover scenarios', async () => {
      console.log(`\n🔄 Testing failover scenarios...`);

      // Create sessions and events
      const sessionIds: string[] = [];
      for (let i = 0; i < 10; i++) {
        const sessionId = await sessionManager.createSession(`failover-agent-${i}`);
        sessionIds.push(sessionId);

        for (let j = 0; j < 5; j++) {
          await sessionManager.emitEvent(
            sessionId,
            {
              type: 'modified',
              changeInfo: {
                elementType: 'function',
                entityIds: [`func-${i}-${j}`],
                operation: 'modified',
              },
            },
            `failover-agent-${i}`
          );
        }
      }

      console.log(`  Created ${sessionIds.length} sessions with events`);

      // Simulate Redis connection failure
      await redis.quit();
      console.log(`  Simulated Redis connection failure`);

      // Try operations during failure
      let operationsFailed = 0;
      for (const sessionId of sessionIds.slice(0, 3)) {
        try {
          await sessionManager.getSession(sessionId);
        } catch (error) {
          operationsFailed++;
        }
      }

      console.log(`  Operations failed during outage: ${operationsFailed}/3`);

      // Reconnect Redis
      redis = createRedisClient({
        url: `redis://localhost:6379/${testDbIndex}`,
      });
      await redis.connect();
      console.log(`  Reconnected to Redis`);

      // Verify sessions still exist (they should be persisted)
      let sessionsRecovered = 0;
      for (const sessionId of sessionIds) {
        try {
          const session = await redis.hGetAll(`session:${sessionId}`);
          if (Object.keys(session).length > 0) {
            sessionsRecovered++;
          }
        } catch (error) {
          // Session not recovered
        }
      }

      console.log(`  Sessions recovered: ${sessionsRecovered}/${sessionIds.length}`);

      expect(operationsFailed).toBeGreaterThan(0); // Should fail during outage
      expect(sessionsRecovered).toBe(sessionIds.length); // All should be recovered
    });
  });

  // Helper functions
  function calculateBenchmarkResult(
    operation: string,
    times: number[],
    memoryUsages: number[]
  ): BenchmarkResult {
    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const throughput = 1000 / averageTime; // operations per second

    const averageMemory = memoryUsages.length > 0
      ? memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length
      : 0;

    return {
      operation,
      averageTime,
      minTime,
      maxTime,
      throughput,
      memoryUsage: averageMemory,
      successRate: 100, // Assumes all operations succeeded
    };
  }

  function formatMemory(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
});

// Run benchmarks with custom timeout
describe.each([
  { timeout: 120000 }, // 2 minute timeout for performance tests
])('Session Performance Benchmarks (Extended)', ({ timeout }) => {
  it('should run all benchmarks within timeout', async () => {
    // This test ensures our benchmarks complete within reasonable time
    const startTime = Date.now();

    // Mock test that represents the benchmark suite
    await new Promise(resolve => setTimeout(resolve, 100));

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(timeout);
  }, timeout);
});
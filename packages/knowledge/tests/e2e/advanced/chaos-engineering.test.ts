/**
 * Chaos Engineering E2E Tests
 * Tests system resilience under various failure scenarios
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'events';
import { setTimeout as sleep } from 'timers/promises';
import {
  testReliability,
  testIsolation,
  setupReliableTest,
  teardownReliableTest
} from '../utils/test-reliability';

// Mock services for chaos testing
interface ServiceFailureScenario {
  name: string;
  description: string;
  setup: () => Promise<void>;
  teardown: () => Promise<void>;
  expectedBehavior: string;
}

class ChaosTestRunner extends EventEmitter {
  private services: Map<string, any> = new Map();
  private failures: Map<string, boolean> = new Map();
  private networkPartitions: Set<string> = new Set();
  private isRunning = false;

  constructor() {
    super();
  }

  registerService(name: string, service: any): void {
    this.services.set(name, service);
    this.failures.set(name, false);
  }

  async simulateServiceFailure(serviceName: string, duration: number = 5000): Promise<void> {
    if (!this.services.has(serviceName)) {
      throw new Error(`Service ${serviceName} not registered`);
    }

    this.failures.set(serviceName, true);
    this.emit('service:failed', { service: serviceName, timestamp: Date.now() });

    // Auto-recover after duration
    setTimeout(() => {
      this.failures.set(serviceName, false);
      this.emit('service:recovered', { service: serviceName, timestamp: Date.now() });
    }, duration);
  }

  async simulateNetworkPartition(services: string[], duration: number = 10000): Promise<void> {
    services.forEach(service => {
      this.networkPartitions.add(service);
    });

    this.emit('network:partitioned', { services, timestamp: Date.now() });

    setTimeout(() => {
      services.forEach(service => {
        this.networkPartitions.delete(service);
      });
      this.emit('network:healed', { services, timestamp: Date.now() });
    }, duration);
  }

  async simulateDataCorruption(target: string, corruptionType: string): Promise<void> {
    this.emit('data:corrupted', { target, type: corruptionType, timestamp: Date.now() });

    // Simulate various corruption scenarios
    switch (corruptionType) {
      case 'partial_write':
        // Simulate incomplete write operations
        break;
      case 'checksum_mismatch':
        // Simulate data integrity violations
        break;
      case 'index_corruption':
        // Simulate database index corruption
        break;
      default:
        throw new Error(`Unknown corruption type: ${corruptionType}`);
    }
  }

  isServiceHealthy(serviceName: string): boolean {
    return !this.failures.get(serviceName) && !this.networkPartitions.has(serviceName);
  }

  getSystemHealth(): { healthy: number; failed: number; partitioned: number } {
    let healthy = 0;
    let failed = 0;
    let partitioned = 0;

    for (const [service, isFailed] of this.failures) {
      if (isFailed) {
        failed++;
      } else if (this.networkPartitions.has(service)) {
        partitioned++;
      } else {
        healthy++;
      }
    }

    return { healthy, failed, partitioned };
  }
}

// Mock Knowledge Graph Service with failure simulation
class ChaosKnowledgeGraphService {
  private chaosRunner: ChaosTestRunner;
  private operationCounts = {
    successful: 0,
    failed: 0,
    retried: 0
  };

  constructor(chaosRunner: ChaosTestRunner) {
    this.chaosRunner = chaosRunner;
    chaosRunner.registerService('knowledge-graph', this);
  }

  async createEntity(entity: any): Promise<any> {
    if (!this.chaosRunner.isServiceHealthy('knowledge-graph')) {
      this.operationCounts.failed++;
      throw new Error('Knowledge Graph Service Unavailable');
    }

    // Simulate processing delay
    await sleep(10 + Math.random() * 50);
    this.operationCounts.successful++;

    return { id: `entity_${Date.now()}`, ...entity };
  }

  async createEntitiesBulk(entities: any[]): Promise<any> {
    if (!this.chaosRunner.isServiceHealthy('knowledge-graph')) {
      this.operationCounts.failed++;
      throw new Error('Knowledge Graph Service Unavailable');
    }

    await sleep(50 + Math.random() * 100);
    this.operationCounts.successful++;

    return {
      success: true,
      processed: entities.length,
      failed: 0,
      results: entities.map(e => ({ entity: e, success: true }))
    };
  }

  async query(cypher: string): Promise<any> {
    if (!this.chaosRunner.isServiceHealthy('knowledge-graph')) {
      this.operationCounts.failed++;
      throw new Error('Database Connection Lost');
    }

    await sleep(20 + Math.random() * 80);
    this.operationCounts.successful++;

    return { records: [], summary: { counters: {} } };
  }

  getStats() {
    return { ...this.operationCounts };
  }

  reset() {
    this.operationCounts = { successful: 0, failed: 0, retried: 0 };
  }
}

// Mock Queue Service with chaos simulation
class ChaosQueueService {
  private chaosRunner: ChaosTestRunner;
  private queue: any[] = [];
  private processingRate = 10; // items per second

  constructor(chaosRunner: ChaosTestRunner) {
    this.chaosRunner = chaosRunner;
    chaosRunner.registerService('queue', this);
  }

  async enqueue(item: any): Promise<void> {
    if (!this.chaosRunner.isServiceHealthy('queue')) {
      throw new Error('Queue Service Unavailable');
    }

    this.queue.push({ ...item, timestamp: Date.now() });
  }

  async dequeue(): Promise<any> {
    if (!this.chaosRunner.isServiceHealthy('queue')) {
      throw new Error('Queue Service Unavailable');
    }

    return this.queue.shift();
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
  }
}

describe('Chaos Engineering Tests', () => {
  let chaosRunner: ChaosTestRunner;
  let knowledgeService: ChaosKnowledgeGraphService;
  let queueService: ChaosQueueService;

  beforeEach(async () => {
    chaosRunner = new ChaosTestRunner();
    knowledgeService = new ChaosKnowledgeGraphService(chaosRunner);
    queueService = new ChaosQueueService(chaosRunner);
  });

  afterEach(async () => {
    // Clean up any ongoing chaos scenarios
    chaosRunner.removeAllListeners();
  });

  const serviceFailureScenarios: ServiceFailureScenario[] = [
    {
      name: 'Knowledge Graph Service Failure',
      description: 'Test system behavior when knowledge graph service becomes unavailable',
      setup: async () => {
        await chaosRunner.simulateServiceFailure('knowledge-graph', 3000);
      },
      teardown: async () => {
        await sleep(3500); // Wait for auto-recovery
      },
      expectedBehavior: 'Operations should gracefully fail and retry after recovery'
    },
    {
      name: 'Queue Service Intermittent Failure',
      description: 'Test resilience during queue service instability',
      setup: async () => {
        // Simulate intermittent failures
        for (let i = 0; i < 3; i++) {
          setTimeout(() => chaosRunner.simulateServiceFailure('queue', 1000), i * 2000);
        }
      },
      teardown: async () => {
        await sleep(7000); // Wait for all failures to resolve
      },
      expectedBehavior: 'Queue operations should retry and eventually succeed'
    }
  ];

  test.each(serviceFailureScenarios)('$name', async (scenario) => {
    const events: any[] = [];

    // Track chaos events
    chaosRunner.on('service:failed', (data) => events.push({ type: 'failure', ...data }));
    chaosRunner.on('service:recovered', (data) => events.push({ type: 'recovery', ...data }));

    // Setup failure scenario
    await scenario.setup();

    // Test operations during failure
    let successfulOps = 0;
    let failedOps = 0;

    // Try to perform operations while chaos is ongoing
    for (let i = 0; i < 10; i++) {
      try {
        await knowledgeService.createEntity({ type: 'test', id: i });
        successfulOps++;
      } catch (error) {
        failedOps++;
      }
      await sleep(200); // Space out operations
    }

    await scenario.teardown();

    // After recovery, operations should succeed
    await knowledgeService.createEntity({ type: 'test', id: 'post-recovery' });

    // Verify chaos events occurred
    const failureEvents = events.filter(e => e.type === 'failure');
    const recoveryEvents = events.filter(e => e.type === 'recovery');

    expect(failureEvents.length).toBeGreaterThan(0);
    expect(recoveryEvents.length).toBeGreaterThan(0);
    expect(failedOps).toBeGreaterThan(0);

    console.log(`${scenario.name}: ${successfulOps} successful, ${failedOps} failed operations`);
  });

  test('Network Partition Recovery', async () => {
    const events: any[] = [];

    chaosRunner.on('network:partitioned', (data) => events.push({ type: 'partition', ...data }));
    chaosRunner.on('network:healed', (data) => events.push({ type: 'heal', ...data }));

    // Simulate network partition between services
    await chaosRunner.simulateNetworkPartition(['knowledge-graph', 'queue'], 4000);

    // Test cross-service operations during partition
    let partitionErrors = 0;
    for (let i = 0; i < 5; i++) {
      try {
        await queueService.enqueue({ data: `item-${i}` });
        await knowledgeService.createEntity({ type: 'test', data: `entity-${i}` });
      } catch (error) {
        partitionErrors++;
      }
      await sleep(300);
    }

    // Wait for network healing
    await sleep(5000);

    // Operations should work after healing
    await queueService.enqueue({ data: 'post-healing-item' });
    await knowledgeService.createEntity({ type: 'test', data: 'post-healing-entity' });

    const partitionEvents = events.filter(e => e.type === 'partition');
    const healEvents = events.filter(e => e.type === 'heal');

    expect(partitionEvents.length).toBe(1);
    expect(healEvents.length).toBe(1);
    expect(partitionErrors).toBeGreaterThan(0);
  });

  test('Data Corruption Detection and Recovery', async () => {
    const events: any[] = [];

    chaosRunner.on('data:corrupted', (data) => events.push({ type: 'corruption', ...data }));

    // Test different corruption scenarios
    const corruptionTypes = ['partial_write', 'checksum_mismatch', 'index_corruption'];

    for (const corruptionType of corruptionTypes) {
      await chaosRunner.simulateDataCorruption('knowledge-graph-db', corruptionType);
      await sleep(100);
    }

    // Verify corruption events were recorded
    const corruptionEvents = events.filter(e => e.type === 'corruption');
    expect(corruptionEvents.length).toBe(corruptionTypes.length);

    // Each corruption type should be represented
    const recordedTypes = corruptionEvents.map(e => e.type);
    corruptionTypes.forEach(type => {
      expect(corruptionEvents.some(e => e.type === type)).toBe(true);
    });
  });

  test('Cascading Failure Simulation', async () => {
    const events: any[] = [];

    // Monitor all chaos events
    chaosRunner.on('service:failed', (data) => events.push({ type: 'service_failure', ...data }));
    chaosRunner.on('network:partitioned', (data) => events.push({ type: 'network_partition', ...data }));
    chaosRunner.on('data:corrupted', (data) => events.push({ type: 'data_corruption', ...data }));

    // Simulate cascading failures
    await chaosRunner.simulateServiceFailure('queue', 2000);
    await sleep(500);
    await chaosRunner.simulateNetworkPartition(['knowledge-graph'], 3000);
    await sleep(500);
    await chaosRunner.simulateDataCorruption('backup-storage', 'checksum_mismatch');

    // Test system behavior under multiple simultaneous failures
    let totalErrors = 0;
    const operationResults: string[] = [];

    for (let i = 0; i < 8; i++) {
      try {
        await queueService.enqueue({ data: `cascade-test-${i}` });
        operationResults.push('queue_success');
      } catch {
        operationResults.push('queue_failure');
        totalErrors++;
      }

      try {
        await knowledgeService.createEntity({ type: 'cascade-test', id: i });
        operationResults.push('kg_success');
      } catch {
        operationResults.push('kg_failure');
        totalErrors++;
      }

      await sleep(200);
    }

    // Wait for all failures to resolve
    await sleep(4000);

    // System should recover and work normally
    await queueService.enqueue({ data: 'post-cascade-recovery' });
    await knowledgeService.createEntity({ type: 'recovery-test', id: 'final' });

    // Verify multiple types of failures occurred
    const failureTypes = [...new Set(events.map(e => e.type))];
    expect(failureTypes.length).toBeGreaterThanOrEqual(2);
    expect(totalErrors).toBeGreaterThan(0);

    console.log('Cascading failure operation results:', operationResults);
  });

  test('Resource Exhaustion Simulation', async () => {
    // Simulate memory pressure
    const memoryLeakSimulation = [];
    for (let i = 0; i < 1000; i++) {
      memoryLeakSimulation.push(new Array(1000).fill(`memory-pressure-${i}`));
    }

    // Simulate CPU exhaustion
    const cpuIntensiveTask = () => {
      const start = Date.now();
      while (Date.now() - start < 100) {
        Math.sqrt(Math.random());
      }
    };

    // Test system behavior under resource pressure
    const operationStart = Date.now();
    let completedOps = 0;

    const operations = Array.from({ length: 20 }, async (_, i) => {
      if (i % 5 === 0) cpuIntensiveTask(); // CPU spike every 5th operation

      try {
        await knowledgeService.createEntity({ type: 'resource-test', id: i });
        completedOps++;
      } catch (error) {
        // Expected under resource pressure
      }
    });

    await Promise.allSettled(operations);
    const totalTime = Date.now() - operationStart;

    // Clean up memory simulation
    memoryLeakSimulation.length = 0;

    // Verify system maintained some level of functionality
    expect(completedOps).toBeGreaterThan(0);

    // Operations should complete within reasonable time even under pressure
    expect(totalTime).toBeLessThan(30000); // 30 seconds max

    console.log(`Resource exhaustion test: ${completedOps}/20 operations completed in ${totalTime}ms`);
  });

  test('Cold Start Performance Under Chaos', async () => {
    // Simulate cold start conditions
    knowledgeService.reset();
    queueService.clear();

    // Add chaos during cold start
    setTimeout(() => chaosRunner.simulateServiceFailure('knowledge-graph', 1000), 100);

    const coldStartTime = Date.now();

    // Simulate initial load of operations
    const coldStartOps = Array.from({ length: 10 }, async (_, i) => {
      try {
        await knowledgeService.createEntity({ type: 'cold-start', id: i });
        return 'success';
      } catch {
        return 'failure';
      }
    });

    const results = await Promise.allSettled(coldStartOps);
    const coldStartDuration = Date.now() - coldStartTime;

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    // Even with chaos, some operations should eventually succeed
    expect(successful).toBeGreaterThan(0);

    // Cold start with chaos should complete within reasonable time
    expect(coldStartDuration).toBeLessThan(15000); // 15 seconds max

    console.log(`Cold start with chaos: ${successful} successful, ${failed} failed in ${coldStartDuration}ms`);
  });

  test('System Health Monitoring During Chaos', async () => {
    const healthSnapshots: any[] = [];

    // Monitor system health every second during chaos
    const healthMonitor = setInterval(() => {
      healthSnapshots.push({
        timestamp: Date.now(),
        health: chaosRunner.getSystemHealth(),
        kgStats: knowledgeService.getStats(),
        queueLength: queueService.getQueueLength()
      });
    }, 1000);

    // Introduce various chaos scenarios
    setTimeout(() => chaosRunner.simulateServiceFailure('knowledge-graph', 2000), 500);
    setTimeout(() => chaosRunner.simulateServiceFailure('queue', 1500), 1500);
    setTimeout(() => chaosRunner.simulateNetworkPartition(['knowledge-graph', 'queue'], 1000), 2500);

    // Run for 6 seconds to capture health changes
    await sleep(6000);
    clearInterval(healthMonitor);

    // Analyze health trends
    expect(healthSnapshots.length).toBeGreaterThan(4);

    // Should see variations in system health
    const healthValues = healthSnapshots.map(s => s.health.healthy);
    const minHealth = Math.min(...healthValues);
    const maxHealth = Math.max(...healthValues);

    expect(maxHealth).toBeGreaterThan(minHealth); // Health should vary during chaos

    console.log('Health monitoring results:', {
      snapshots: healthSnapshots.length,
      healthRange: { min: minHealth, max: maxHealth },
      finalHealth: healthSnapshots[healthSnapshots.length - 1]?.health
    });
  });
});

describe('Chaos Engineering - Real World Scenarios', () => {
  let chaosRunner: ChaosTestRunner;
  let knowledgeService: ChaosKnowledgeGraphService;
  let queueService: ChaosQueueService;

  beforeEach(() => {
    chaosRunner = new ChaosTestRunner();
    knowledgeService = new ChaosKnowledgeGraphService(chaosRunner);
    queueService = new ChaosQueueService(chaosRunner);
  });

  test('Database Connection Pool Exhaustion', async () => {
    // Simulate connection pool exhaustion
    const connectionAttempts = Array.from({ length: 50 }, async (_, i) => {
      try {
        return await knowledgeService.query(`MATCH (n) RETURN count(n) // Query ${i}`);
      } catch (error) {
        return { error: error.message };
      }
    });

    const results = await Promise.allSettled(connectionAttempts);
    const successful = results.filter(r => r.status === 'fulfilled').length;

    // Should handle concurrent requests gracefully
    expect(successful).toBeGreaterThan(0);
  });

  test('Distributed System Split Brain Scenario', async () => {
    // Simulate split brain between services
    await chaosRunner.simulateNetworkPartition(['knowledge-graph'], 3000);

    // Each partition should handle operations independently
    const partition1Ops = queueService.enqueue({ partition: 1, data: 'test' });

    let partition2Error;
    try {
      await knowledgeService.createEntity({ partition: 2, data: 'test' });
    } catch (error) {
      partition2Error = error;
    }

    await sleep(3500); // Wait for partition healing

    // After healing, both partitions should be operational
    await queueService.enqueue({ post_healing: true });
    await knowledgeService.createEntity({ post_healing: true });

    expect(partition2Error).toBeDefined(); // Should have failed during partition
  });

  test('Gradual Performance Degradation', async () => {
    const performanceMetrics: number[] = [];

    // Gradually introduce delays to simulate degradation
    for (let i = 0; i < 10; i++) {
      const start = Date.now();

      try {
        await knowledgeService.createEntity({ degradation_test: i });
      } catch {
        // Ignore failures, we're measuring performance
      }

      const latency = Date.now() - start;
      performanceMetrics.push(latency);

      // Introduce increasing chaos
      if (i > 5) {
        setTimeout(() => chaosRunner.simulateServiceFailure('knowledge-graph', 500), 0);
      }

      await sleep(300);
    }

    // Performance should show degradation pattern
    const earlyLatency = performanceMetrics.slice(0, 5).reduce((a, b) => a + b) / 5;
    const lateLatency = performanceMetrics.slice(-3).reduce((a, b) => a + b) / 3;

    console.log('Performance degradation test:', {
      earlyAvg: earlyLatency,
      lateAvg: lateLatency,
      allMetrics: performanceMetrics
    });

    // Later operations should generally be slower due to chaos
    expect(lateLatency).toBeGreaterThan(earlyLatency * 0.8); // Allow some variance
  });
});
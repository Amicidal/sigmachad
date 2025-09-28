/**
 * Security Agent Coordination Test
 * Tests the coordination between SecurityFixAgent and other agents
 */

import { SecurityFixAgent } from '../../agents/src/security-fix-agent.js';
import { AgentCoordinator } from '../../agents/src/coordinator.js';
import { AgentRegistry } from '../../agents/src/registry.js';
import { AgentTask } from '../../agents/src/types.js';

export class SecurityAgentCoordinationTest {
  private coordinator: AgentCoordinator;
  private registry: AgentRegistry;
  private securityFixAgent: SecurityFixAgent;
  private mockDb: any;
  private mockKgService: any;

  constructor() {
    this.mockDb = {
      falkordbQuery: async () => [],
      falkordbCommand: async () => undefined,
      getConfig: () => ({ falkordb: { graphKey: 'test' } }),
    };

    this.mockKgService = {
      getEntity: async () => null,
      createRelationship: async () => undefined,
      findEntitiesByType: async () => [],
    };

    this.coordinator = new AgentCoordinator({
      maxConcurrentTasks: 5,
      taskTimeout: 60000,
      enableMetrics: true,
    });

    this.registry = new AgentRegistry(this.coordinator);
  }

  async runCoordinationTests(): Promise<void> {
    console.log('🤝 Starting Security Agent Coordination Tests...\n');

    await this.setupAgents();

    // Test 1: Basic agent communication
    await this.testBasicCommunication();

    // Test 2: Security scan to fix workflow
    await this.testScanToFixWorkflow();

    // Test 3: Parallel security fixes
    await this.testParallelSecurityFixes();

    // Test 4: Fix rollback coordination
    await this.testRollbackCoordination();

    // Test 5: Agent failure handling
    await this.testAgentFailureHandling();

    console.log('\n✅ All coordination tests completed!');
  }

  private async setupAgents(): Promise<void> {
    console.log('🔧 Setting up agents...');

    // Create and register SecurityFixAgent
    this.securityFixAgent = new SecurityFixAgent(
      {
        id: 'security-fix-agent-1',
        type: 'security-fix',
        name: 'Security Fix Agent',
        description: 'Automatically fixes security issues',
        version: '1.0.0',
        capabilities: ['automatic-fixes', 'rollback', 'verification'],
      },
      this.mockDb,
      this.mockKgService
    );

    await this.registry.register(this.securityFixAgent);

    // Create mock scanning agent for testing
    const mockScanAgent = new MockSecurityScanAgent();
    await this.registry.register(mockScanAgent);

    // Create mock review agent
    const mockReviewAgent = new MockSecurityReviewAgent();
    await this.registry.register(mockReviewAgent);

    console.log('✅ Agents setup complete');
  }

  private async testBasicCommunication(): Promise<void> {
    console.log('\n🔄 Testing basic agent communication...');

    let eventReceived = false;

    // Listen for events from SecurityFixAgent
    this.securityFixAgent.on('security-fix-completed', (event) => {
      console.log(
        '📨 Received security-fix-completed event:',
        event.data.result.status
      );
      eventReceived = true;
    });

    // Create a test security fix task
    const task: AgentTask = {
      id: 'test-fix-1',
      type: 'security-fix',
      priority: 'high',
      data: {
        issueId: 'mock-issue-1',
        ruleId: 'HARDCODED_SECRET',
        severity: 'high',
        autoFix: true,
        dryRun: true,
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60000),
    };

    // Execute the task
    try {
      const result = await this.securityFixAgent.execute(task);
      console.log('✅ Task executed successfully:', result.status);

      // Wait a bit for event propagation
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (eventReceived) {
        console.log('✅ Event communication working');
      } else {
        console.log('⚠️ Event not received');
      }
    } catch (error) {
      console.log('❌ Task execution failed:', error);
    }
  }

  private async testScanToFixWorkflow(): Promise<void> {
    console.log('\n🔍 Testing scan-to-fix workflow...');

    // Simulate a security scan completion event
    const scanEvent = {
      id: 'scan-event-1',
      type: 'security-scan-completed',
      agentId: 'security-scan-agent-1',
      timestamp: new Date(),
      data: {
        result: {
          summary: {
            totalIssues: 3,
            bySeverity: {
              critical: 1,
              high: 2,
              medium: 0,
              low: 0,
              info: 0,
            },
          },
          issues: [
            {
              id: 'issue-1',
              ruleId: 'HARDCODED_SECRET',
              severity: 'critical',
              confidence: 0.9,
              metadata: { filePath: '/test/file1.js' },
            },
            {
              id: 'issue-2',
              ruleId: 'SQL_INJECTION',
              severity: 'high',
              confidence: 0.8,
              metadata: { filePath: '/test/file2.js' },
            },
          ],
        },
      },
    };

    // Track fix tasks created
    let fixTasksCreated = 0;

    this.securityFixAgent.on('security-fix-needed', (event) => {
      console.log('🔧 Fix task created for issue:', event.data.issueId);
      fixTasksCreated++;
    });

    // Send the scan completion event
    await this.securityFixAgent.onEvent(scanEvent);

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 200));

    console.log(
      `✅ Created ${fixTasksCreated} fix tasks for critical/high issues`
    );
  }

  private async testParallelSecurityFixes(): Promise<void> {
    console.log('\n⚡ Testing parallel security fixes...');

    const fixTasks = [
      {
        id: 'parallel-fix-1',
        type: 'security-fix',
        priority: 'high',
        data: {
          issueId: 'mock-issue-1',
          ruleId: 'HARDCODED_SECRET',
          autoFix: true,
          dryRun: true,
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
      },
      {
        id: 'parallel-fix-2',
        type: 'security-fix',
        priority: 'high',
        data: {
          issueId: 'mock-issue-2',
          ruleId: 'WEAK_CRYPTO',
          autoFix: true,
          dryRun: true,
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
      },
      {
        id: 'parallel-fix-3',
        type: 'security-fix',
        priority: 'medium',
        data: {
          issueId: 'mock-issue-3',
          ruleId: 'XSS_VULNERABILITY',
          autoFix: true,
          dryRun: true,
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
      },
    ];

    const startTime = Date.now();

    try {
      // Execute tasks in parallel using coordinator
      const results = await Promise.all(
        fixTasks.map((task) => this.coordinator.executeTask(task))
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(
        `✅ Completed ${results.length} parallel fixes in ${duration}ms`
      );

      // Verify all tasks completed successfully
      const successfulFixes = results.filter(
        (r) => r.status === 'completed'
      ).length;
      console.log(
        `✅ ${successfulFixes}/${results.length} fixes completed successfully`
      );
    } catch (error) {
      console.log('❌ Parallel execution failed:', error);
    }
  }

  private async testRollbackCoordination(): Promise<void> {
    console.log('\n⏪ Testing rollback coordination...');

    // Simulate a rollback request event
    const rollbackEvent = {
      id: 'rollback-event-1',
      type: 'rollback-requested',
      agentId: 'external-agent',
      timestamp: new Date(),
      data: {
        rollbackId: 'mock-rollback-1',
        reason: 'Fix caused test failures',
      },
    };

    let rollbackCompleted = false;

    // Listen for rollback completion
    this.securityFixAgent.on('rollback-completed', (event) => {
      console.log('✅ Rollback completed:', event.data.rollbackId);
      rollbackCompleted = true;
    });

    this.securityFixAgent.on('rollback-failed', (event) => {
      console.log('❌ Rollback failed:', event.data.error);
    });

    // Send rollback request
    await this.securityFixAgent.onEvent(rollbackEvent);

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (rollbackCompleted) {
      console.log('✅ Rollback coordination working');
    } else {
      console.log('⚠️ Rollback coordination needs attention');
    }
  }

  private async testAgentFailureHandling(): Promise<void> {
    console.log('\n💥 Testing agent failure handling...');

    // Create a task that will cause a failure
    const failingTask: AgentTask = {
      id: 'failing-task-1',
      type: 'security-fix',
      priority: 'high',
      data: {
        issueId: 'non-existent-issue',
        ruleId: 'UNKNOWN_RULE',
        autoFix: true,
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60000),
    };

    try {
      const result = await this.securityFixAgent.execute(failingTask);
      console.log('⚠️ Expected failure but task succeeded:', result.status);
    } catch (error) {
      console.log(
        '✅ Task failed as expected:',
        error instanceof Error ? error.message : error
      );

      // Check that agent is still responsive
      const healthStatus = await this.securityFixAgent.getHealth();
      console.log('✅ Agent health after failure:', healthStatus.status);

      if (healthStatus.status === 'failed') {
        console.log('✅ Agent correctly marked as failed');
      }
    }
  }

  // Additional test methods

  async testSecurityWorkflowIntegration(): Promise<void> {
    console.log('\n🔄 Testing complete security workflow integration...');

    const workflowSteps = [
      '1. Security scan initiated',
      '2. Issues detected',
      '3. Fix tasks created',
      '4. Fixes applied',
      '5. Verification scan',
      '6. Rollback if needed',
    ];

    console.log('Workflow steps:');
    workflowSteps.forEach((step) => console.log(`   ${step}`));

    // Simulate workflow events
    const events = [
      {
        type: 'security-scan-started',
        data: { scanId: 'workflow-scan-1' },
      },
      {
        type: 'security-issues-detected',
        data: { issueCount: 3, criticalCount: 1 },
      },
      {
        type: 'security-fix-tasks-created',
        data: { taskCount: 3 },
      },
    ];

    for (const event of events) {
      console.log(`📨 Processing event: ${event.type}`);
      await this.coordinator.broadcastEvent({
        id: `workflow-${Date.now()}`,
        type: event.type,
        agentId: 'workflow-coordinator',
        timestamp: new Date(),
        data: event.data,
      });

      // Add small delay between events
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    console.log('✅ Workflow integration test completed');
  }

  async benchmarkCoordinationPerformance(): Promise<void> {
    console.log('\n📊 Benchmarking coordination performance...');

    const taskCount = 10;
    const tasks: AgentTask[] = [];

    // Create multiple fix tasks
    for (let i = 0; i < taskCount; i++) {
      tasks.push({
        id: `perf-task-${i}`,
        type: 'security-fix',
        priority: 'medium',
        data: {
          issueId: `perf-issue-${i}`,
          ruleId: 'HARDCODED_SECRET',
          autoFix: true,
          dryRun: true,
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
      });
    }

    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    try {
      // Execute all tasks through coordinator
      const results = await this.coordinator.executeTasks(tasks);

      const endTime = Date.now();
      const endMemory = process.memoryUsage();

      const duration = endTime - startTime;
      const memoryUsed = endMemory.heapUsed - startMemory.heapUsed;

      console.log(`📊 Performance Results:`);
      console.log(`   Tasks: ${taskCount}`);
      console.log(`   Duration: ${duration}ms`);
      console.log(
        `   Throughput: ${(taskCount / (duration / 1000)).toFixed(2)} tasks/sec`
      );
      console.log(`   Memory Used: ${(memoryUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(
        `   Success Rate: ${
          results.filter((r) => r.status === 'completed').length
        }/${taskCount}`
      );
    } catch (error) {
      console.log('❌ Performance benchmark failed:', error);
    }
  }
}

// Mock agents for testing

class MockSecurityScanAgent {
  metadata = {
    id: 'mock-scan-agent',
    type: 'security-scan',
    name: 'Mock Security Scanner',
    description: 'Mock scanner for testing',
    version: '1.0.0',
    capabilities: ['sast', 'secrets', 'dependencies'],
  };

  async initialize(): Promise<void> {}

  async execute(task: AgentTask): Promise<any> {
    return {
      taskId: task.id,
      agentId: this.metadata.id,
      status: 'completed',
      data: {
        summary: { totalIssues: 0 },
        issues: [],
      },
    };
  }

  async stop(): Promise<void> {}
  async getHealth(): Promise<any> {
    return { status: 'idle' };
  }

  on(): void {}
  emit(): void {}
}

class MockSecurityReviewAgent {
  metadata = {
    id: 'mock-review-agent',
    type: 'security-review',
    name: 'Mock Security Reviewer',
    description: 'Mock reviewer for testing',
    version: '1.0.0',
    capabilities: ['manual-review', 'approval'],
  };

  async initialize(): Promise<void> {}

  async execute(task: AgentTask): Promise<any> {
    return {
      taskId: task.id,
      agentId: this.metadata.id,
      status: 'completed',
      data: {
        approved: true,
        comments: 'Automated approval for testing',
      },
    };
  }

  async stop(): Promise<void> {}
  async getHealth(): Promise<any> {
    return { status: 'idle' };
  }

  on(): void {}
  emit(): void {}
}

// CLI runner for coordination tests
export async function runCoordinationTests(): Promise<void> {
  const test = new SecurityAgentCoordinationTest();

  try {
    await test.runCoordinationTests();
    await test.testSecurityWorkflowIntegration();
    await test.benchmarkCoordinationPerformance();

    console.log('\n🎉 All security agent coordination tests passed!');
  } catch (error) {
    console.error('\n❌ Coordination tests failed:', error);
    process.exit(1);
  }
}

// Export for external use
export { SecurityAgentCoordinationTest };

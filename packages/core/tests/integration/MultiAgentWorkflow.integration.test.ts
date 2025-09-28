/**
 * Multi-Agent Workflow Integration Tests
 *
 * Tests for complex multi-agent scenarios including:
 * - Agent coordination and load balancing
 * - Session handoffs and recovery
 * - Pub/sub message delivery
 * - Failover scenarios
 * - Agent collaboration workflows
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient as createRedisClient, RedisClientType } from 'redis';
import { SessionManager } from '../../src/services/SessionManager.js';
import { SessionStore } from '../../src/services/SessionStore.js';
import {
  SessionManagerConfig,
  SessionEvent,
  SessionDocument,
} from '../../src/services/SessionTypes.js';

describe('Multi-Agent Workflow Integration Tests', () => {
  let redis: RedisClientType;
  let sessionManager1: SessionManager;
  let sessionManager2: SessionManager;
  let sessionManager3: SessionManager;
  const testDbIndex = 12;

  const baseConfig: SessionManagerConfig = {
    redis: {
      host: 'localhost',
      port: 6379,
      db: testDbIndex,
    },
    defaultTTL: 3600,
    checkpointInterval: 10,
    maxEventsPerSession: 1000,
    graceTTL: 300,
    enableFailureSnapshots: true,
    pubSubChannels: {
      global: 'multi:global:sessions',
      session: 'multi:session:',
    },
  };

  beforeEach(async () => {
    redis = createRedisClient({
      url: `redis://localhost:6379/${testDbIndex}`,
    });
    await redis.connect();
    await redis.flushDb();

    // Create multiple session managers to simulate different agent processes
    sessionManager1 = new SessionManager(baseConfig);
    sessionManager2 = new SessionManager(baseConfig);
    sessionManager3 = new SessionManager(baseConfig);
  });

  afterEach(async () => {
    if (sessionManager1) await sessionManager1.close();
    if (sessionManager2) await sessionManager2.close();
    if (sessionManager3) await sessionManager3.close();
    if (redis) {
      await redis.flushDb();
      await redis.quit();
    }
  });

  describe('Agent Coordination', () => {
    it('should coordinate multiple agents on single session', async () => {
      const agentIds = ['agent-1', 'agent-2', 'agent-3'];
      const sessionEvents: SessionEvent[] = [];

      // Listen for events from all managers
      const eventPromises: Promise<void>[] = [];

      [sessionManager1, sessionManager2, sessionManager3].forEach((manager, index) => {
        const promise = new Promise<void>((resolve) => {
          let eventCount = 0;
          manager.on('event:added', (data) => {
            sessionEvents.push(data.event);
            eventCount++;
            if (eventCount >= 3) resolve(); // Each manager will emit 3 events
          });
        });
        eventPromises.push(promise);
      });

      // Agent 1 creates session
      const sessionId = await sessionManager1.createSession(agentIds[0], {
        metadata: { workflow: 'multi-agent-coordination' },
      });

      // Agent 2 and 3 join the session
      await sessionManager2.joinSession(sessionId, agentIds[1]);
      await sessionManager3.joinSession(sessionId, agentIds[2]);

      // All agents work on different parts
      const workPromises = [
        // Agent 1: Frontend modifications
        sessionManager1.emitEvent(
          sessionId,
          {
            type: 'modified',
            changeInfo: {
              elementType: 'component',
              entityIds: ['frontend/LoginForm.tsx'],
              operation: 'modified',
            },
            impact: { severity: 'medium', perfDelta: 2 },
          },
          agentIds[0]
        ),

        // Agent 2: Backend API changes
        sessionManager2.emitEvent(
          sessionId,
          {
            type: 'modified',
            changeInfo: {
              elementType: 'function',
              entityIds: ['api/auth/login.ts'],
              operation: 'modified',
            },
            impact: { severity: 'high', perfDelta: -5 },
          },
          agentIds[1]
        ),

        // Agent 3: Database migrations
        sessionManager3.emitEvent(
          sessionId,
          {
            type: 'modified',
            changeInfo: {
              elementType: 'schema',
              entityIds: ['db/migrations/add_user_table.sql'],
              operation: 'created',
            },
            impact: { severity: 'critical', perfDelta: 0 },
          },
          agentIds[2]
        ),
      ];

      await Promise.all(workPromises);

      // Wait for all events to be received
      await Promise.race([
        Promise.all(eventPromises),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);

      // Verify coordination
      const finalSession = await sessionManager1.getSession(sessionId);
      expect(finalSession).toBeDefined();
      expect(finalSession!.agentIds).toHaveLength(3);
      expect(finalSession!.agentIds).toEqual(expect.arrayContaining(agentIds));
      expect(finalSession!.events).toHaveLength(6); // 3 work events + 2 handoff events + initial

      // Verify all agents participated
      const actors = finalSession!.events.map(e => e.actor);
      agentIds.forEach(agentId => {
        expect(actors).toContain(agentId);
      });
    });

    it('should handle agent load balancing', async () => {
      const agentCount = 5;
      const sessionCount = 20;
      const agentWorkloads: Record<string, number> = {};

      console.log(`\n⚖️ Testing load balancing across ${agentCount} agents with ${sessionCount} sessions...`);

      // Create agents
      const agents = Array.from({ length: agentCount }, (_, i) => `load-agent-${i}`);
      const sessionManagers = [sessionManager1, sessionManager2, sessionManager3];

      // Track workloads
      agents.forEach(agent => {
        agentWorkloads[agent] = 0;
      });

      // Create sessions and assign them to agents based on load balancing
      for (let i = 0; i < sessionCount; i++) {
        // Find agent with least workload
        const leastLoadedAgent = agents.reduce((min, agent) =>
          agentWorkloads[agent] < agentWorkloads[min] ? agent : min
        );

        const managerIndex = i % sessionManagers.length;
        const sessionId = await sessionManagers[managerIndex].createSession(leastLoadedAgent, {
          metadata: { sessionIndex: i, assignedAgent: leastLoadedAgent },
        });

        // Simulate work for this agent
        agentWorkloads[leastLoadedAgent]++;

        // Add some events to make the session "active"
        await sessionManagers[managerIndex].emitEvent(
          sessionId,
          {
            type: 'modified',
            changeInfo: {
              elementType: 'function',
              entityIds: [`task-${i}`],
              operation: 'modified',
            },
          },
          leastLoadedAgent
        );

        if ((i + 1) % 5 === 0) {
          console.log(`  Created ${i + 1}/${sessionCount} sessions`);
        }
      }

      // Verify load distribution
      const workloadValues = Object.values(agentWorkloads);
      const avgWorkload = workloadValues.reduce((a, b) => a + b, 0) / agentCount;
      const maxWorkload = Math.max(...workloadValues);
      const minWorkload = Math.min(...workloadValues);
      const loadVariance = maxWorkload - minWorkload;

      console.log(`  📊 Load distribution:`, agentWorkloads);
      console.log(`  Average workload: ${avgWorkload}`);
      console.log(`  Load variance: ${loadVariance}`);

      // Load should be relatively balanced
      expect(loadVariance).toBeLessThanOrEqual(2); // No agent should have more than 2 extra sessions
      expect(minWorkload).toBeGreaterThan(0); // All agents should have some work
      workloadValues.forEach(workload => {
        expect(workload).toBeGreaterThanOrEqual(avgWorkload - 1);
        expect(workload).toBeLessThanOrEqual(avgWorkload + 1);
      });
    });
  });

  describe('Session Handoffs', () => {
    it('should handle graceful agent handoffs', async () => {
      const primaryAgent = 'primary-agent';
      const backupAgent = 'backup-agent';

      // Primary agent creates session and does initial work
      const sessionId = await sessionManager1.createSession(primaryAgent, {
        metadata: { workflow: 'handoff-test' },
      });

      // Primary agent does some work
      for (let i = 0; i < 5; i++) {
        await sessionManager1.emitEvent(
          sessionId,
          {
            type: 'modified',
            changeInfo: {
              elementType: 'function',
              entityIds: [`primary-work-${i}`],
              operation: 'modified',
            },
          },
          primaryAgent
        );
      }

      // Check session state before handoff
      const preHandoffSession = await sessionManager1.getSession(sessionId);
      expect(preHandoffSession!.events).toHaveLength(5);
      expect(preHandoffSession!.agentIds).toEqual([primaryAgent]);

      // Backup agent joins for handoff
      await sessionManager2.joinSession(sessionId, backupAgent);

      // Both agents work together briefly
      await Promise.all([
        sessionManager1.emitEvent(
          sessionId,
          {
            type: 'modified',
            changeInfo: {
              elementType: 'function',
              entityIds: ['collaboration-task-1'],
              operation: 'modified',
            },
          },
          primaryAgent
        ),
        sessionManager2.emitEvent(
          sessionId,
          {
            type: 'modified',
            changeInfo: {
              elementType: 'function',
              entityIds: ['collaboration-task-2'],
              operation: 'modified',
            },
          },
          backupAgent
        ),
      ]);

      // Primary agent leaves (simulating failure or completion)
      await sessionManager1.leaveSession(sessionId, primaryAgent);

      // Backup agent continues work
      for (let i = 0; i < 3; i++) {
        await sessionManager2.emitEvent(
          sessionId,
          {
            type: 'modified',
            changeInfo: {
              elementType: 'function',
              entityIds: [`backup-work-${i}`],
              operation: 'modified',
            },
          },
          backupAgent
        );
      }

      // Verify handoff completed successfully
      const postHandoffSession = await sessionManager2.getSession(sessionId);
      expect(postHandoffSession!.agentIds).toEqual([backupAgent]);
      expect(postHandoffSession!.events.length).toBeGreaterThan(8); // Original + collaboration + backup work + handoff events

      // Verify work continuity
      const allActors = postHandoffSession!.events.map(e => e.actor);
      expect(allActors).toContain(primaryAgent);
      expect(allActors).toContain(backupAgent);
    });

    it('should recover from agent failures during handoff', async () => {
      const primaryAgent = 'failing-agent';
      const recoveryAgent = 'recovery-agent';

      // Create session and do initial work
      const sessionId = await sessionManager1.createSession(primaryAgent);

      await sessionManager1.emitEvent(
        sessionId,
        {
          type: 'modified',
          changeInfo: {
            elementType: 'function',
            entityIds: ['initial-work'],
            operation: 'modified',
          },
        },
        primaryAgent
      );

      // Simulate primary agent failure (close session manager)
      await sessionManager1.close();

      // Recovery agent detects the session and takes over
      await sessionManager2.joinSession(sessionId, recoveryAgent);

      // Recovery agent continues the work
      await sessionManager2.emitEvent(
        sessionId,
        {
          type: 'recovery',
          changeInfo: {
            elementType: 'session',
            entityIds: [sessionId],
            operation: 'recovered',
          },
        },
        recoveryAgent
      );

      // Verify recovery
      const recoveredSession = await sessionManager2.getSession(sessionId);
      expect(recoveredSession).toBeDefined();
      expect(recoveredSession!.agentIds).toContain(recoveryAgent);

      const recoveryEvents = recoveredSession!.events.filter(e => e.type === 'recovery');
      expect(recoveryEvents).toHaveLength(1);
      expect(recoveryEvents[0].actor).toBe(recoveryAgent);
    });
  });

  describe('Pub/Sub Message Delivery', () => {
    it('should deliver session updates to all subscribers', async () => {
      const receivedMessages: Array<{ managerId: string; message: any }> = [];
      const messagePromises: Promise<void>[] = [];

      // Setup message listeners
      [sessionManager1, sessionManager2, sessionManager3].forEach((manager, index) => {
        const promise = new Promise<void>((resolve) => {
          let messageCount = 0;
          manager.on('session:update', (data) => {
            receivedMessages.push({
              managerId: `manager-${index + 1}`,
              message: data,
            });
            messageCount++;
            if (messageCount >= 2) resolve(); // Expect 2 messages per manager
          });
        });
        messagePromises.push(promise);
      });

      // Create session and subscribe all managers
      const sessionId = await sessionManager1.createSession('pub-sub-agent');

      await sessionManager2.joinSession(sessionId, 'subscriber-agent-1');
      await sessionManager3.joinSession(sessionId, 'subscriber-agent-2');

      // Generate events that should trigger pub/sub messages
      await sessionManager1.emitEvent(
        sessionId,
        {
          type: 'modified',
          changeInfo: {
            elementType: 'function',
            entityIds: ['pub-sub-test-1'],
            operation: 'modified',
          },
        },
        'pub-sub-agent'
      );

      await sessionManager2.emitEvent(
        sessionId,
        {
          type: 'checkpoint',
          changeInfo: {
            elementType: 'session',
            entityIds: [sessionId],
            operation: 'checkpoint',
          },
        },
        'subscriber-agent-1'
      );

      // Wait for all messages to be received
      await Promise.race([
        Promise.all(messagePromises),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Pub/sub timeout')), 5000))
      ]);

      // Verify message delivery
      expect(receivedMessages.length).toBeGreaterThan(0);

      // Each manager should have received messages
      const managerMessages = {
        'manager-1': receivedMessages.filter(m => m.managerId === 'manager-1'),
        'manager-2': receivedMessages.filter(m => m.managerId === 'manager-2'),
        'manager-3': receivedMessages.filter(m => m.managerId === 'manager-3'),
      };

      Object.values(managerMessages).forEach(messages => {
        expect(messages.length).toBeGreaterThan(0);
      });
    });

    it('should handle pub/sub message ordering', async () => {
      const receivedMessages: Array<{ sequence: number; timestamp: string; type: string }> = [];
      const messageCount = 10;

      // Setup ordered message listener
      sessionManager2.on('session:update', (data) => {
        if (data.message && data.message.seq) {
          receivedMessages.push({
            sequence: data.message.seq,
            timestamp: data.message.timestamp || new Date().toISOString(),
            type: data.message.type,
          });
        }
      });

      const sessionId = await sessionManager1.createSession('ordering-agent');
      await sessionManager2.joinSession(sessionId, 'ordering-subscriber');

      // Send multiple events in sequence
      for (let i = 0; i < messageCount; i++) {
        await sessionManager1.emitEvent(
          sessionId,
          {
            type: 'modified',
            changeInfo: {
              elementType: 'function',
              entityIds: [`ordered-task-${i}`],
              operation: 'modified',
            },
          },
          'ordering-agent'
        );

        // Small delay to ensure ordering
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Wait for all messages
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify ordering
      expect(receivedMessages.length).toBeGreaterThan(0);

      for (let i = 1; i < receivedMessages.length; i++) {
        const current = receivedMessages[i];
        const previous = receivedMessages[i - 1];

        // Sequence numbers should be in order
        expect(current.sequence).toBeGreaterThan(previous.sequence);

        // Timestamps should be in order (approximately)
        const currentTime = new Date(current.timestamp).getTime();
        const previousTime = new Date(previous.timestamp).getTime();
        expect(currentTime).toBeGreaterThanOrEqual(previousTime);
      }
    });
  });

  describe('Complex Workflow Scenarios', () => {
    it('should handle feature development workflow', async () => {
      const developers = ['dev-frontend', 'dev-backend', 'dev-testing'];
      const feature = 'user-authentication';

      console.log(`\n🛠️ Testing feature development workflow: ${feature}`);

      // Phase 1: Planning (Frontend dev creates session)
      const sessionId = await sessionManager1.createSession(developers[0], {
        metadata: {
          workflow: 'feature-development',
          feature,
          phase: 'planning',
        },
      });

      await sessionManager1.emitEvent(
        sessionId,
        {
          type: 'created',
          changeInfo: {
            elementType: 'design',
            entityIds: [`design/${feature}-wireframes.md`],
            operation: 'created',
          },
        },
        developers[0]
      );

      // Phase 2: Backend development (Backend dev joins)
      await sessionManager2.joinSession(sessionId, developers[1]);

      const backendTasks = [
        'api/auth/register.ts',
        'api/auth/login.ts',
        'api/auth/logout.ts',
        'models/User.ts',
      ];

      for (const task of backendTasks) {
        await sessionManager2.emitEvent(
          sessionId,
          {
            type: 'modified',
            changeInfo: {
              elementType: 'function',
              entityIds: [task],
              operation: 'created',
            },
          },
          developers[1]
        );
      }

      // Phase 3: Frontend implementation (concurrent with backend)
      const frontendTasks = [
        'components/LoginForm.tsx',
        'components/RegisterForm.tsx',
        'hooks/useAuth.ts',
        'pages/Login.tsx',
      ];

      for (const task of frontendTasks) {
        await sessionManager1.emitEvent(
          sessionId,
          {
            type: 'modified',
            changeInfo: {
              elementType: 'component',
              entityIds: [task],
              operation: 'created',
            },
          },
          developers[0]
        );
      }

      // Phase 4: Testing (Testing dev joins)
      await sessionManager3.joinSession(sessionId, developers[2]);

      const testTasks = [
        'tests/auth/register.test.ts',
        'tests/auth/login.test.ts',
        'tests/components/LoginForm.test.tsx',
        'tests/e2e/auth-flow.spec.ts',
      ];

      for (const task of testTasks) {
        await sessionManager3.emitEvent(
          sessionId,
          {
            type: 'modified',
            changeInfo: {
              elementType: 'test',
              entityIds: [task],
              operation: 'created',
            },
          },
          developers[2]
        );
      }

      // Phase 5: Bug fixes (all developers collaborate)
      await sessionManager3.emitEvent(
        sessionId,
        {
          type: 'broke',
          changeInfo: {
            elementType: 'test',
            entityIds: ['tests/auth/login.test.ts'],
            operation: 'failed',
          },
          stateTransition: {
            from: 'working',
            to: 'broken',
            verifiedBy: 'test-suite',
            confidence: 0.95,
          },
        },
        developers[2]
      );

      // Frontend fix
      await sessionManager1.emitEvent(
        sessionId,
        {
          type: 'fixed',
          changeInfo: {
            elementType: 'component',
            entityIds: ['components/LoginForm.tsx'],
            operation: 'modified',
          },
          stateTransition: {
            from: 'broken',
            to: 'working',
            verifiedBy: 'manual-test',
            confidence: 0.9,
          },
        },
        developers[0]
      );

      // Phase 6: Completion checkpoint
      await sessionManager1.checkpoint(sessionId);

      // Verify workflow completion
      const finalSession = await sessionManager1.getSession(sessionId);
      expect(finalSession).toBeDefined();
      expect(finalSession!.agentIds).toHaveLength(3);
      expect(finalSession!.agentIds).toEqual(expect.arrayContaining(developers));

      // Verify all phases were completed
      const events = finalSession!.events;
      const eventTypes = events.map(e => e.type);

      expect(eventTypes).toContain('created'); // Planning phase
      expect(eventTypes).toContain('modified'); // Development phases
      expect(eventTypes).toContain('broke'); // Testing phase
      expect(eventTypes).toContain('fixed'); // Bug fix phase

      // Verify all developers contributed
      const allActors = events.map(e => e.actor);
      developers.forEach(dev => {
        expect(allActors).toContain(dev);
      });

      console.log(`  ✅ Feature development completed with ${events.length} events`);
    });

    it('should handle emergency hotfix workflow', async () => {
      const oncallAgent = 'oncall-agent';
      const reviewerAgent = 'reviewer-agent';
      const deployerAgent = 'deployer-agent';

      console.log(`\n🚨 Testing emergency hotfix workflow...`);

      // Emergency detected
      const sessionId = await sessionManager1.createSession(oncallAgent, {
        metadata: {
          workflow: 'emergency-hotfix',
          priority: 'critical',
          incident: 'PROD-001',
        },
      });

      // Rapid diagnosis and fix
      await sessionManager1.emitEvent(
        sessionId,
        {
          type: 'broke',
          changeInfo: {
            elementType: 'function',
            entityIds: ['api/payment/process.ts'],
            operation: 'critical-bug',
          },
          impact: {
            severity: 'critical',
            perfDelta: -100,
          },
          stateTransition: {
            from: 'working',
            to: 'broken',
            verifiedBy: 'production-monitoring',
            confidence: 1.0,
          },
        },
        oncallAgent
      );

      // Quick fix implementation
      await sessionManager1.emitEvent(
        sessionId,
        {
          type: 'fixed',
          changeInfo: {
            elementType: 'function',
            entityIds: ['api/payment/process.ts'],
            operation: 'hotfix',
          },
          impact: {
            severity: 'critical',
            perfDelta: 100,
          },
          stateTransition: {
            from: 'broken',
            to: 'working',
            verifiedBy: 'unit-tests',
            confidence: 0.85,
          },
        },
        oncallAgent
      );

      // Emergency review (reviewer joins immediately)
      await sessionManager2.joinSession(sessionId, reviewerAgent);

      await sessionManager2.emitEvent(
        sessionId,
        {
          type: 'reviewed',
          changeInfo: {
            elementType: 'changeset',
            entityIds: ['hotfix/payment-bug-fix'],
            operation: 'approved',
          },
          impact: {
            severity: 'medium',
            perfDelta: 0,
          },
        },
        reviewerAgent
      );

      // Emergency deployment (deployer joins)
      await sessionManager3.joinSession(sessionId, deployerAgent);

      await sessionManager3.emitEvent(
        sessionId,
        {
          type: 'deployed',
          changeInfo: {
            elementType: 'deployment',
            entityIds: ['production/hotfix-v1.2.1'],
            operation: 'deployed',
          },
          impact: {
            severity: 'high',
            perfDelta: 5,
          },
        },
        deployerAgent
      );

      // Verify hotfix workflow
      const session = await sessionManager1.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session!.agentIds).toHaveLength(3);

      const events = session!.events;
      const workflow = events.map(e => ({ type: e.type, actor: e.actor }));

      // Verify emergency workflow sequence
      expect(workflow.some(w => w.type === 'broke')).toBe(true);
      expect(workflow.some(w => w.type === 'fixed')).toBe(true);
      expect(workflow.some(w => w.type === 'reviewed')).toBe(true);
      expect(workflow.some(w => w.type === 'deployed')).toBe(true);

      // Verify rapid response (all events should be recent)
      const now = Date.now();
      events.forEach(event => {
        const eventTime = new Date(event.timestamp).getTime();
        const ageInMinutes = (now - eventTime) / (1000 * 60);
        expect(ageInMinutes).toBeLessThan(5); // All events within 5 minutes
      });

      console.log(`  ✅ Emergency hotfix completed in ${events.length} steps`);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle Redis connection failures gracefully', async () => {
      const sessionId = await sessionManager1.createSession('resilient-agent');

      // Add some events
      for (let i = 0; i < 3; i++) {
        await sessionManager1.emitEvent(
          sessionId,
          {
            type: 'modified',
            changeInfo: {
              elementType: 'function',
              entityIds: [`task-${i}`],
              operation: 'modified',
            },
          },
          'resilient-agent'
        );
      }

      // Simulate Redis failure
      await redis.quit();

      // Operations should fail gracefully
      let operationsFailed = 0;
      const failedOperations = [];

      try {
        await sessionManager1.emitEvent(
          sessionId,
          {
            type: 'modified',
            changeInfo: {
              elementType: 'function',
              entityIds: ['failed-task'],
              operation: 'modified',
            },
          },
          'resilient-agent'
        );
      } catch (error) {
        operationsFailed++;
        failedOperations.push('emitEvent');
      }

      try {
        await sessionManager1.getSession(sessionId);
      } catch (error) {
        operationsFailed++;
        failedOperations.push('getSession');
      }

      // Reconnect Redis
      redis = createRedisClient({
        url: `redis://localhost:6379/${testDbIndex}`,
      });
      await redis.connect();

      // Operations should work again
      const session = await sessionManager1.getSession(sessionId);
      expect(session).toBeDefined();
      expect(operationsFailed).toBeGreaterThan(0);
      expect(failedOperations).toContain('emitEvent');
    });

    it('should handle concurrent agent failures', async () => {
      const agents = ['agent-1', 'agent-2', 'agent-3', 'agent-4'];
      const sessionId = await sessionManager1.createSession(agents[0]);

      // All agents join the session
      await sessionManager2.joinSession(sessionId, agents[1]);
      await sessionManager3.joinSession(sessionId, agents[2]);

      // Simulate partial system failure (2 out of 3 managers fail)
      await sessionManager2.close();
      await sessionManager3.close();

      // Remaining manager should still function
      await sessionManager1.emitEvent(
        sessionId,
        {
          type: 'recovery',
          changeInfo: {
            elementType: 'session',
            entityIds: [sessionId],
            operation: 'recovered',
          },
        },
        agents[0]
      );

      // Verify session integrity
      const session = await sessionManager1.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session!.events.length).toBeGreaterThan(2); // Initial + handoffs + recovery

      const recoveryEvents = session!.events.filter(e => e.type === 'recovery');
      expect(recoveryEvents).toHaveLength(1);
    });
  });
});
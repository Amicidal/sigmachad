import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AgentCoordinator } from '../src/coordinator.js';
import { AgentRegistry } from '../src/registry.js';
import { BaseAgent } from '../src/agent-base.js';
import { AgentMetadata, AgentTask, AgentEvent, CoordinationContext } from '../src/types.js';

// Mock agent for testing
class MockAgent extends BaseAgent {
  private mockExecuteTask = vi.fn();

  constructor(metadata: AgentMetadata) {
    super(metadata);
  }

  protected async onInitialize(): Promise<void> {}

  protected async executeTask(task: AgentTask): Promise<any> {
    return await this.mockExecuteTask(task);
  }

  protected async onPause(): Promise<void> {}
  protected async onResume(): Promise<void> {}
  protected async onStop(): Promise<void> {}
  protected async handleEvent(event: AgentEvent): Promise<void> {}

  // Expose mock for testing
  get mockExecute() {
    return this.mockExecuteTask;
  }
}

describe('AgentCoordinator', () => {
  let registry: AgentRegistry;
  let coordinator: AgentCoordinator;
  let parseAgent: MockAgent;
  let testAgent: MockAgent;

  beforeEach(() => {
    registry = new AgentRegistry();
    coordinator = new AgentCoordinator(registry);

    parseAgent = new MockAgent({
      id: 'parse-agent-1',
      type: 'parse',
      name: 'Parse Agent',
      description: 'Test parse agent',
      version: '1.0.0',
      capabilities: ['typescript'],
      dependencies: []
    });

    testAgent = new MockAgent({
      id: 'test-agent-1',
      type: 'test',
      name: 'Test Agent',
      description: 'Test test agent',
      version: '1.0.0',
      capabilities: ['vitest'],
      dependencies: []
    });
  });

  afterEach(async () => {
    await coordinator.shutdown();
    await registry.shutdown();
  });

  describe('session management', () => {
    it('should create a new session', async () => {
      const sessionId = 'test-session-1';
      const initiatorId = 'coordinator';
      const participants = ['agent-1', 'agent-2'];
      const sharedState = { key: 'value' };

      const context = await coordinator.createSession(
        sessionId,
        initiatorId,
        participants,
        sharedState
      );

      expect(context.sessionId).toBe(sessionId);
      expect(context.initiatorId).toBe(initiatorId);
      expect(context.participants).toEqual([...participants, initiatorId]);
      expect(context.sharedState).toEqual(sharedState);
    });

    it('should prevent duplicate session creation', async () => {
      const sessionId = 'test-session-1';

      await coordinator.createSession(sessionId, 'coordinator');

      await expect(
        coordinator.createSession(sessionId, 'coordinator')
      ).rejects.toThrow('Coordination session test-session-1 already exists');
    });

    it('should allow joining existing session', async () => {
      const sessionId = 'test-session-1';
      await coordinator.createSession(sessionId, 'coordinator');

      const context = await coordinator.joinSession(sessionId, 'new-agent');

      expect(context.participants).toContain('new-agent');
      expect(context.participants).toContain('coordinator');
    });

    it('should fail to join non-existent session', async () => {
      await expect(
        coordinator.joinSession('non-existent', 'agent-1')
      ).rejects.toThrow('Coordination session non-existent not found');
    });

    it('should allow leaving session', async () => {
      const sessionId = 'test-session-1';
      await coordinator.createSession(sessionId, 'coordinator', ['agent-1']);

      await coordinator.leaveSession(sessionId, 'agent-1');

      const activeSessions = coordinator.getActiveSessions();
      const session = activeSessions.find(s => s.sessionId === sessionId);
      expect(session?.participants).not.toContain('agent-1');
    });

    it('should end session when all participants leave', async () => {
      const sessionId = 'test-session-1';
      await coordinator.createSession(sessionId, 'coordinator');

      await coordinator.leaveSession(sessionId, 'coordinator');

      const activeSessions = coordinator.getActiveSessions();
      expect(activeSessions.find(s => s.sessionId === sessionId)).toBeUndefined();
    });

    it('should end session explicitly', async () => {
      const sessionId = 'test-session-1';
      await coordinator.createSession(sessionId, 'coordinator');

      await coordinator.endSession(sessionId);

      const activeSessions = coordinator.getActiveSessions();
      expect(activeSessions.find(s => s.sessionId === sessionId)).toBeUndefined();
    });
  });

  describe('shared state management', () => {
    let sessionId: string;

    beforeEach(async () => {
      sessionId = 'test-session-1';
      await coordinator.createSession(sessionId, 'coordinator');
    });

    it('should update shared state', async () => {
      await coordinator.updateSharedState('agent-1', 'testKey', 'testValue', sessionId);

      const value = await coordinator.getSharedState('testKey', sessionId);
      expect(value).toBe('testValue');
    });

    it('should create default session if none specified', async () => {
      await coordinator.updateSharedState('agent-1', 'testKey', 'testValue');

      const value = await coordinator.getSharedState('testKey', 'default');
      expect(value).toBe('testValue');
    });

    it('should return undefined for non-existent key', async () => {
      const value = await coordinator.getSharedState('nonExistentKey', sessionId);
      expect(value).toBeUndefined();
    });

    it('should return undefined for non-existent session', async () => {
      const value = await coordinator.getSharedState('key', 'non-existent-session');
      expect(value).toBeUndefined();
    });
  });

  describe('task orchestration', () => {
    beforeEach(async () => {
      await registry.register(parseAgent);
      await registry.register(testAgent);
    });

    it('should orchestrate tasks sequentially', async () => {
      const tasks: AgentTask[] = [
        {
          id: 'task-1',
          type: 'parse',
          params: { file: 'test.ts' },
          priority: 1,
          createdAt: new Date()
        },
        {
          id: 'task-2',
          type: 'test',
          params: { suite: 'unit' },
          priority: 2,
          createdAt: new Date()
        }
      ];

      parseAgent.mockExecute.mockResolvedValue({ parsed: true });
      testAgent.mockExecute.mockResolvedValue({ tested: true });

      const results = await coordinator.orchestrate('session-1', tasks, {
        parallel: false
      });

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('completed');
      expect(results[1].status).toBe('completed');
      expect(parseAgent.mockExecute).toHaveBeenCalledWith(tasks[0]);
      expect(testAgent.mockExecute).toHaveBeenCalledWith(tasks[1]);
    });

    it('should orchestrate tasks in parallel', async () => {
      const tasks: AgentTask[] = [
        {
          id: 'task-1',
          type: 'parse',
          params: { file: 'test.ts' },
          priority: 1,
          createdAt: new Date()
        },
        {
          id: 'task-2',
          type: 'test',
          params: { suite: 'unit' },
          priority: 2,
          createdAt: new Date()
        }
      ];

      parseAgent.mockExecute.mockResolvedValue({ parsed: true });
      testAgent.mockExecute.mockResolvedValue({ tested: true });

      const startTime = Date.now();
      const results = await coordinator.orchestrate('session-1', tasks, {
        parallel: true
      });
      const endTime = Date.now();

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('completed');
      expect(results[1].status).toBe('completed');

      // Parallel execution should be faster than sequential
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle task execution failures', async () => {
      const task: AgentTask = {
        id: 'task-1',
        type: 'parse',
        params: { file: 'test.ts' },
        priority: 1,
        createdAt: new Date()
      };

      parseAgent.mockExecute.mockRejectedValue(new Error('Execution failed'));

      await expect(
        coordinator.orchestrate('session-1', [task])
      ).rejects.toThrow('Execution failed');
    });

    it('should retry failed tasks', async () => {
      const task: AgentTask = {
        id: 'task-1',
        type: 'parse',
        params: { file: 'test.ts' },
        priority: 1,
        createdAt: new Date()
      };

      parseAgent.mockExecute
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce({ parsed: true });

      const results = await coordinator.orchestrate('session-1', [task], {
        retryAttempts: 2
      });

      expect(results[0].status).toBe('completed');
      expect(parseAgent.mockExecute).toHaveBeenCalledTimes(2);
    });

    it('should fail when no agents available for task type', async () => {
      const task: AgentTask = {
        id: 'task-1',
        type: 'scm', // No SCM agents registered
        params: {},
        priority: 1,
        createdAt: new Date()
      };

      await expect(
        coordinator.orchestrate('session-1', [task])
      ).rejects.toThrow('No available agents found for task type: scm');
    });

    it('should timeout long-running tasks', async () => {
      const task: AgentTask = {
        id: 'task-1',
        type: 'parse',
        params: { file: 'test.ts' },
        priority: 1,
        createdAt: new Date()
      };

      parseAgent.mockExecute.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 2000))
      );

      await expect(
        coordinator.orchestrate('session-1', [task], { timeout: 100 })
      ).rejects.toThrow('timed out after 100ms');
    });
  });

  describe('event handling', () => {
    it('should forward events to session participants', async () => {
      const sessionId = 'test-session';
      await coordinator.createSession(sessionId, 'coordinator', ['agent-1']);

      const event: AgentEvent = {
        id: 'event-1',
        type: 'test:event',
        agentId: 'coordinator',
        sessionId,
        timestamp: new Date(),
        data: { message: 'test' }
      };

      // Should not throw when forwarding events
      await coordinator.forwardEvent(event);

      const events = coordinator.getSessionEvents(sessionId);
      expect(events).toContain(event);
    });

    it('should store events in buffer', async () => {
      const sessionId = 'test-session';
      await coordinator.createSession(sessionId, 'coordinator');

      const event: AgentEvent = {
        id: 'event-1',
        type: 'test:event',
        agentId: 'coordinator',
        sessionId,
        timestamp: new Date(),
        data: {}
      };

      await coordinator.forwardEvent(event);

      const events = coordinator.getSessionEvents(sessionId);
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(event);
    });
  });

  describe('active sessions', () => {
    it('should return active sessions', async () => {
      await coordinator.createSession('session-1', 'coordinator');
      await coordinator.createSession('session-2', 'coordinator');

      const activeSessions = coordinator.getActiveSessions();
      expect(activeSessions).toHaveLength(2);

      const sessionIds = activeSessions.map(s => s.sessionId);
      expect(sessionIds).toContain('session-1');
      expect(sessionIds).toContain('session-2');
    });

    it('should return empty array when no active sessions', () => {
      const activeSessions = coordinator.getActiveSessions();
      expect(activeSessions).toHaveLength(0);
    });
  });

  describe('configuration', () => {
    it('should accept custom configuration', () => {
      const customConfig = {
        sessionTtl: 7200,
        eventBuffer: 500,
        pubSubChannels: {
          events: 'custom:events',
          coordination: 'custom:coordination',
          heartbeat: 'custom:heartbeat'
        }
      };

      const customCoordinator = new AgentCoordinator(registry, customConfig);

      // Configuration is used internally, we can't directly test it
      // but the important thing is that it doesn't throw
      expect(customCoordinator).toBeInstanceOf(AgentCoordinator);
    });
  });
});
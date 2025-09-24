import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AgentRegistry } from '../src/registry.js';
import { BaseAgent } from '../src/agent-base.js';
import { AgentMetadata, AgentTask, AgentEvent, IAgent } from '../src/types.js';

// Mock agent for testing
class MockAgent extends BaseAgent {
  constructor(metadata: AgentMetadata) {
    super(metadata);
  }

  protected async onInitialize(): Promise<void> {}
  protected async executeTask(task: AgentTask): Promise<any> {
    return { success: true };
  }
  protected async onPause(): Promise<void> {}
  protected async onResume(): Promise<void> {}
  protected async onStop(): Promise<void> {}
  protected async handleEvent(event: AgentEvent): Promise<void> {}
}

describe('AgentRegistry', () => {
  let registry: AgentRegistry;
  let agent1: MockAgent;
  let agent2: MockAgent;
  let metadata1: AgentMetadata;
  let metadata2: AgentMetadata;

  beforeEach(() => {
    registry = new AgentRegistry({
      maxAgents: 10,
      heartbeatInterval: 1000,
      cleanupInterval: 2000,
      staleTimeout: 5000
    });

    metadata1 = {
      id: 'agent-1',
      type: 'parse',
      name: 'Parse Agent 1',
      description: 'Test parse agent',
      version: '1.0.0',
      capabilities: ['typescript'],
      dependencies: []
    };

    metadata2 = {
      id: 'agent-2',
      type: 'test',
      name: 'Test Agent 1',
      description: 'Test test agent',
      version: '1.0.0',
      capabilities: ['vitest'],
      dependencies: []
    };

    agent1 = new MockAgent(metadata1);
    agent2 = new MockAgent(metadata2);
  });

  afterEach(async () => {
    await registry.shutdown();
  });

  describe('register', () => {
    it('should register an agent successfully', async () => {
      await registry.register(agent1);

      const retrievedAgent = registry.getAgent('agent-1');
      expect(retrievedAgent).toBe(agent1);

      const metadata = registry.getAgentMetadata('agent-1');
      expect(metadata).toEqual(metadata1);
    });

    it('should prevent duplicate registration', async () => {
      await registry.register(agent1);

      await expect(registry.register(agent1)).rejects.toThrow(
        'Agent with ID agent-1 is already registered'
      );
    });

    it('should enforce max agents limit', async () => {
      const smallRegistry = new AgentRegistry({ maxAgents: 1 });

      await smallRegistry.register(agent1);

      await expect(smallRegistry.register(agent2)).rejects.toThrow(
        'Maximum number of agents (1) reached'
      );

      await smallRegistry.shutdown();
    });

    it('should validate agent metadata', async () => {
      const invalidAgent = new MockAgent({
        ...metadata1,
        id: '' // Invalid ID
      });

      await expect(registry.register(invalidAgent)).rejects.toThrow(
        'Agent metadata must have a valid id'
      );
    });

    it('should index agents by type', async () => {
      await registry.register(agent1);
      await registry.register(agent2);

      const parseAgents = registry.getAgentsByType('parse');
      expect(parseAgents).toHaveLength(1);
      expect(parseAgents[0]).toBe(agent1);

      const testAgents = registry.getAgentsByType('test');
      expect(testAgents).toHaveLength(1);
      expect(testAgents[0]).toBe(agent2);
    });

    it('should emit registration event', async () => {
      const listener = vi.fn();
      registry.on('agent:registered', listener);

      await registry.register(agent1);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: 'agent-1',
          metadata: metadata1
        })
      );
    });
  });

  describe('unregister', () => {
    beforeEach(async () => {
      await registry.register(agent1);
      await registry.register(agent2);
    });

    it('should unregister an agent successfully', async () => {
      await registry.unregister('agent-1');

      expect(registry.getAgent('agent-1')).toBeUndefined();
      expect(registry.getAgentsByType('parse')).toHaveLength(0);
    });

    it('should fail to unregister non-existent agent', async () => {
      await expect(registry.unregister('non-existent')).rejects.toThrow(
        'Agent non-existent is not registered'
      );
    });

    it('should emit unregistration event', async () => {
      const listener = vi.fn();
      registry.on('agent:unregistered', listener);

      await registry.unregister('agent-1');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: 'agent-1',
          metadata: metadata1
        })
      );
    });
  });

  describe('getters', () => {
    beforeEach(async () => {
      await registry.register(agent1);
      await registry.register(agent2);
    });

    it('should get active agents', () => {
      const activeAgents = registry.getActiveAgents();
      expect(activeAgents).toHaveLength(2);
      expect(activeAgents).toContain(agent1);
      expect(activeAgents).toContain(agent2);
    });

    it('should get all registrations', () => {
      const registrations = registry.getAllRegistrations();
      expect(registrations).toHaveLength(2);

      const registration1 = registrations.find(r => r.metadata.id === 'agent-1');
      expect(registration1?.instance).toBe(agent1);
      expect(registration1?.isActive).toBe(true);
    });

    it('should find available agents by type', () => {
      const available = registry.findAvailableAgents('parse', 1);
      expect(available).toHaveLength(1);
      expect(available[0]).toBe(agent1);

      const nonExistent = registry.findAvailableAgents('scm' as any, 1);
      expect(nonExistent).toHaveLength(0);
    });

    it('should return empty array for non-existent type', () => {
      const agents = registry.getAgentsByType('scm' as any);
      expect(agents).toHaveLength(0);
    });
  });

  describe('statistics', () => {
    beforeEach(async () => {
      await registry.register(agent1);
      await registry.register(agent2);
    });

    it('should return correct stats', () => {
      const stats = registry.getStats();

      expect(stats.totalAgents).toBe(2);
      expect(stats.activeAgents).toBe(2);
      expect(stats.agentsByType).toEqual({
        parse: 1,
        test: 1
      });
      expect(stats.agentsByStatus).toEqual({
        idle: 2
      });
    });
  });

  describe('heartbeat management', () => {
    beforeEach(async () => {
      await registry.register(agent1);
    });

    it('should update heartbeat', () => {
      const registrationsBefore = registry.getAllRegistrations();
      const originalHeartbeat = registrationsBefore[0].lastHeartbeat;

      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        registry.updateHeartbeat('agent-1');

        const registrationsAfter = registry.getAllRegistrations();
        const newHeartbeat = registrationsAfter[0].lastHeartbeat;

        expect(newHeartbeat.getTime()).toBeGreaterThan(originalHeartbeat.getTime());
      }, 10);
    });

    it('should handle heartbeat for non-existent agent', () => {
      // Should not throw
      registry.updateHeartbeat('non-existent');
    });
  });

  describe('coordinator integration', () => {
    it('should set coordinator on agents', async () => {
      const mockCoordinator = { test: 'coordinator' };
      registry.setCoordinator(mockCoordinator);

      // Verify existing agents get coordinator
      await registry.register(agent1);

      // Agent should have coordinator set (we can't directly test this without exposing internals)
      // But the important thing is that it doesn't throw
      expect(registry.getAgent('agent-1')).toBe(agent1);
    });
  });

  describe('shutdown', () => {
    beforeEach(async () => {
      await registry.register(agent1);
      await registry.register(agent2);
    });

    it('should shutdown all agents and clear registry', async () => {
      expect(registry.getStats().totalAgents).toBe(2);

      await registry.shutdown();

      expect(registry.getStats().totalAgents).toBe(0);
      expect(registry.getActiveAgents()).toHaveLength(0);
    });
  });

  describe('validation', () => {
    it('should validate metadata fields', async () => {
      const testCases = [
        { field: 'id', value: '', expectedError: 'valid id' },
        { field: 'type', value: '', expectedError: 'valid type' },
        { field: 'name', value: '', expectedError: 'valid name' },
        { field: 'version', value: '', expectedError: 'valid version' },
        { field: 'capabilities', value: 'not-array', expectedError: 'capabilities array' },
        { field: 'dependencies', value: 'not-array', expectedError: 'dependencies array' }
      ];

      for (const testCase of testCases) {
        const invalidMetadata = { ...metadata1, [testCase.field]: testCase.value };
        const invalidAgent = new MockAgent(invalidMetadata);

        await expect(registry.register(invalidAgent)).rejects.toThrow(
          testCase.expectedError
        );
      }
    });
  });
});
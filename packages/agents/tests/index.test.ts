import { describe, it, expect, afterEach } from 'vitest';
import {
  BaseAgent,
  AgentRegistry,
  AgentCoordinator,
  createAgentSystem,
  createSessionId,
  createTaskId,
  createAgentId,
  AgentEventTypes
} from '../src/index.js';

describe('Package Exports', () => {
  it('should export core classes', () => {
    expect(BaseAgent).toBeDefined();
    expect(AgentRegistry).toBeDefined();
    expect(AgentCoordinator).toBeDefined();
  });

  it('should export utility functions', () => {
    expect(createAgentSystem).toBeDefined();
    expect(createSessionId).toBeDefined();
    expect(createTaskId).toBeDefined();
    expect(createAgentId).toBeDefined();
  });

  it('should export constants', () => {
    expect(AgentEventTypes).toBeDefined();
    expect(AgentEventTypes.TASK_STARTED).toBe('task:started');
    expect(AgentEventTypes.TASK_COMPLETED).toBe('task:completed');
    expect(AgentEventTypes.AGENT_REGISTERED).toBe('agent:registered');
  });
});

describe('createAgentSystem', () => {
  let system: { registry: AgentRegistry; coordinator: AgentCoordinator };

  afterEach(async () => {
    if (system) {
      await system.coordinator.shutdown();
      await system.registry.shutdown();
    }
  });

  it('should create a complete agent system', () => {
    system = createAgentSystem();

    expect(system.registry).toBeInstanceOf(AgentRegistry);
    expect(system.coordinator).toBeInstanceOf(AgentCoordinator);
  });

  it('should accept custom configuration', () => {
    const config = {
      registry: {
        maxAgents: 50,
        heartbeatInterval: 15000
      },
      coordinator: {
        sessionTtl: 7200
      }
    };

    system = createAgentSystem(config);

    expect(system.registry).toBeInstanceOf(AgentRegistry);
    expect(system.coordinator).toBeInstanceOf(AgentCoordinator);
  });
});

describe('ID generators', () => {
  describe('createSessionId', () => {
    it('should generate unique session IDs', () => {
      const id1 = createSessionId();
      const id2 = createSessionId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^session-\d+-[a-z0-9]+$/);
    });

    it('should accept custom prefix', () => {
      const id = createSessionId('custom');
      expect(id).toMatch(/^custom-\d+-[a-z0-9]+$/);
    });
  });

  describe('createTaskId', () => {
    it('should generate unique task IDs', () => {
      const id1 = createTaskId('parse');
      const id2 = createTaskId('parse');

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^task-parse-\d+-[a-z0-9]+$/);
    });

    it('should include task type', () => {
      const parseId = createTaskId('parse');
      const testId = createTaskId('test');

      expect(parseId).toContain('-parse-');
      expect(testId).toContain('-test-');
    });

    it('should accept custom prefix', () => {
      const id = createTaskId('parse', 'custom');
      expect(id).toMatch(/^custom-parse-\d+-[a-z0-9]+$/);
    });
  });

  describe('createAgentId', () => {
    it('should generate agent IDs with type and instance', () => {
      const id = createAgentId('parse', 1);
      expect(id).toBe('parse-agent-1');
    });

    it('should default to instance 1', () => {
      const id = createAgentId('test');
      expect(id).toBe('test-agent-1');
    });

    it('should handle different types', () => {
      const parseId = createAgentId('parse', 2);
      const testId = createAgentId('test', 3);

      expect(parseId).toBe('parse-agent-2');
      expect(testId).toBe('test-agent-3');
    });
  });
});

describe('Event Types', () => {
  it('should provide all standard event types', () => {
    const expectedTypes = [
      'task:started',
      'task:completed',
      'task:failed',
      'agent:registered',
      'agent:unregistered',
      'coordination:request',
      'coordination:response',
      'state:updated',
      'heartbeat',
      'error'
    ];

    const actualTypes = Object.values(AgentEventTypes);

    for (const expectedType of expectedTypes) {
      expect(actualTypes).toContain(expectedType);
    }
  });

  it('should have consistent naming convention', () => {
    const eventTypes = Object.values(AgentEventTypes);

    for (const eventType of eventTypes) {
      expect(eventType).toMatch(/^[a-z]+:[a-z]+$/);
    }
  });
});
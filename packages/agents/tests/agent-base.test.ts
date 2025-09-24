import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseAgent } from '../src/agent-base.js';
import { AgentMetadata, AgentTask, AgentEvent, AgentStatus } from '../src/types.js';

// Mock agent implementation for testing
class TestAgent extends BaseAgent {
  private mockExecuteTask = vi.fn();
  private mockHandleEvent = vi.fn();
  private mockOnInitialize = vi.fn();
  private mockOnPause = vi.fn();
  private mockOnResume = vi.fn();
  private mockOnStop = vi.fn();

  protected async onInitialize(config?: Record<string, any>): Promise<void> {
    await this.mockOnInitialize(config);
  }

  protected async executeTask(task: AgentTask): Promise<any> {
    return await this.mockExecuteTask(task);
  }

  protected async onPause(): Promise<void> {
    await this.mockOnPause();
  }

  protected async onResume(): Promise<void> {
    await this.mockOnResume();
  }

  protected async onStop(): Promise<void> {
    await this.mockOnStop();
  }

  protected async handleEvent(event: AgentEvent): Promise<void> {
    await this.mockHandleEvent(event);
  }

  // Expose mocks for testing
  get mocks() {
    return {
      executeTask: this.mockExecuteTask,
      handleEvent: this.mockHandleEvent,
      onInitialize: this.mockOnInitialize,
      onPause: this.mockOnPause,
      onResume: this.mockOnResume,
      onStop: this.mockOnStop
    };
  }
}

describe('BaseAgent', () => {
  let agent: TestAgent;
  let metadata: AgentMetadata;

  beforeEach(() => {
    metadata = {
      id: 'test-agent-1',
      type: 'test',
      name: 'Test Agent',
      description: 'A test agent',
      version: '1.0.0',
      capabilities: ['testing'],
      dependencies: []
    };

    agent = new TestAgent(metadata);
  });

  describe('constructor', () => {
    it('should initialize with provided metadata', () => {
      expect(agent.metadata).toEqual(metadata);
      expect(agent.status).toBe('idle');
    });

    it('should set max listeners to 100', () => {
      expect(agent.getMaxListeners()).toBe(100);
    });
  });

  describe('initialize', () => {
    it('should call onInitialize and set status to idle', async () => {
      const config = { test: 'value' };

      await agent.initialize(config);

      expect(agent.mocks.onInitialize).toHaveBeenCalledWith(config);
      expect(agent.status).toBe('idle');
    });

    it('should emit initialized event', async () => {
      const listener = vi.fn();
      agent.on('initialized', listener);

      await agent.initialize();

      expect(listener).toHaveBeenCalledWith({
        agentId: metadata.id,
        config: undefined
      });
    });
  });

  describe('execute', () => {
    let task: AgentTask;

    beforeEach(() => {
      task = {
        id: 'task-1',
        type: 'test',
        params: { test: 'param' },
        priority: 1,
        createdAt: new Date()
      };
    });

    it('should execute task successfully', async () => {
      const expectedResult = { success: true };
      agent.mocks.executeTask.mockResolvedValue(expectedResult);

      const result = await agent.execute(task);

      expect(agent.mocks.executeTask).toHaveBeenCalledWith(task);
      expect(result.taskId).toBe(task.id);
      expect(result.agentId).toBe(metadata.id);
      expect(result.status).toBe('completed');
      expect(result.data).toEqual(expectedResult);
      expect(result.metrics).toBeDefined();
      expect(result.metrics!.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle task execution error', async () => {
      const error = new Error('Execution failed');
      agent.mocks.executeTask.mockRejectedValue(error);

      await expect(agent.execute(task)).rejects.toThrow('Execution failed');
      expect(agent.status).toBe('failed');
    });

    it('should not allow concurrent execution', async () => {
      agent.mocks.executeTask.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const promise1 = agent.execute(task);
      const promise2 = agent.execute({ ...task, id: 'task-2' });

      await expect(promise1).resolves.toBeDefined();
      await expect(promise2).rejects.toThrow('already running a task');
    });

    it('should track task completion count', async () => {
      agent.mocks.executeTask.mockResolvedValue({});

      await agent.execute(task);
      await agent.execute({ ...task, id: 'task-2' });

      const health = await agent.getHealth();
      expect(health.tasksCompleted).toBe(2);
    });
  });

  describe('pause and resume', () => {
    it('should pause when running', async () => {
      // Start a long-running task
      agent.mocks.executeTask.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      const task: AgentTask = {
        id: 'task-1',
        type: 'test',
        params: {},
        priority: 1,
        createdAt: new Date()
      };

      const executePromise = agent.execute(task);

      // Wait a bit for task to start
      await new Promise(resolve => setTimeout(resolve, 10));

      await agent.pause();
      expect(agent.status).toBe('paused');
      expect(agent.mocks.onPause).toHaveBeenCalled();

      // Clean up
      agent.mocks.executeTask.mockResolvedValue({});
      await executePromise;
    });

    it('should resume when paused', async () => {
      // Start a long-running task and pause
      agent.mocks.executeTask.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      const task: AgentTask = {
        id: 'task-1',
        type: 'test',
        params: {},
        priority: 1,
        createdAt: new Date()
      };

      const executePromise = agent.execute(task);
      await new Promise(resolve => setTimeout(resolve, 10));
      await agent.pause();

      await agent.resume();
      expect(agent.status).toBe('running');
      expect(agent.mocks.onResume).toHaveBeenCalled();

      // Clean up
      agent.mocks.executeTask.mockResolvedValue({});
      await executePromise;
    });
  });

  describe('stop', () => {
    it('should stop agent and cleanup', async () => {
      await agent.stop();

      expect(agent.status).toBe('idle');
      expect(agent.mocks.onStop).toHaveBeenCalled();
    });

    it('should emit stopped event', async () => {
      const listener = vi.fn();
      agent.on('stopped', listener);

      await agent.stop();

      expect(listener).toHaveBeenCalledWith({
        agentId: metadata.id
      });
    });
  });

  describe('getHealth', () => {
    it('should return health status', async () => {
      const health = await agent.getHealth();

      expect(health.status).toBe('idle');
      expect(health.uptime).toBeGreaterThanOrEqual(0);
      expect(health.tasksCompleted).toBe(0);
      expect(health.lastError).toBeUndefined();
    });

    it('should track last error', async () => {
      const error = new Error('Test error');
      agent.mocks.executeTask.mockRejectedValue(error);

      const task: AgentTask = {
        id: 'task-1',
        type: 'test',
        params: {},
        priority: 1,
        createdAt: new Date()
      };

      await expect(agent.execute(task)).rejects.toThrow();

      const health = await agent.getHealth();
      expect(health.lastError).toBe(error);
    });
  });

  describe('onEvent', () => {
    it('should handle events', async () => {
      const event: AgentEvent = {
        id: 'event-1',
        type: 'test:event',
        agentId: 'other-agent',
        timestamp: new Date(),
        data: { test: 'data' }
      };

      await agent.onEvent(event);

      expect(agent.mocks.handleEvent).toHaveBeenCalledWith(event);
    });

    it('should handle event errors', async () => {
      const error = new Error('Event handling failed');
      agent.mocks.handleEvent.mockRejectedValue(error);

      const event: AgentEvent = {
        id: 'event-1',
        type: 'test:event',
        agentId: 'other-agent',
        timestamp: new Date(),
        data: {}
      };

      // Should not throw, errors are handled internally
      await agent.onEvent(event);
    });
  });

  describe('utility methods', () => {
    it('should check if agent can handle task', () => {
      const task: AgentTask = {
        id: 'task-1',
        type: 'test',
        params: {},
        priority: 1,
        createdAt: new Date()
      };

      expect((agent as any).canHandle(task)).toBe(true);

      const wrongTypeTask = { ...task, type: 'other' };
      expect((agent as any).canHandle(wrongTypeTask)).toBe(false);
    });

    it('should track current task', async () => {
      const task: AgentTask = {
        id: 'task-1',
        type: 'test',
        params: {},
        priority: 1,
        createdAt: new Date()
      };

      agent.mocks.executeTask.mockImplementation(async () => {
        expect((agent as any).getCurrentTask()).toEqual(task);
        return {};
      });

      await agent.execute(task);
      expect((agent as any).getCurrentTask()).toBeUndefined();
    });
  });
});
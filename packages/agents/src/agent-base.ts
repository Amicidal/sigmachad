import { EventEmitter } from 'events';
import {
  IAgent,
  AgentMetadata,
  AgentStatus,
  AgentTask,
  AgentResult,
  AgentEvent,
  AgentEventTypes
} from './types.js';

/**
 * Abstract base class for all agents in the multi-agent system.
 * Provides common functionality for lifecycle management, event handling,
 * and coordination with other agents.
 */
export abstract class BaseAgent extends EventEmitter implements IAgent {
  private _status: AgentStatus = 'idle';
  private _tasksCompleted = 0;
  private _startTime = Date.now();
  private _lastError?: Error;
  private _currentTask?: AgentTask;
  private _coordinator?: any; // Will be injected by registry

  constructor(public readonly metadata: AgentMetadata) {
    super();
    this.setMaxListeners(100); // Allow many concurrent listeners
  }

  get status(): AgentStatus {
    return this._status;
  }

  /**
   * Initialize the agent with configuration.
   * Subclasses should override this to perform specific initialization.
   */
  async initialize(config?: Record<string, any>): Promise<void> {
    this._status = 'idle';
    await this.onInitialize(config);
    this.emit('initialized', { agentId: this.metadata.id, config });
  }

  /**
   * Execute a task. This is the main entry point for task execution.
   */
  async execute(task: AgentTask): Promise<AgentResult> {
    if (this._status === 'running') {
      throw new Error(`Agent ${this.metadata.id} is already running a task`);
    }

    this._status = 'running';
    this._currentTask = task;
    const startTime = new Date();

    try {
      // Emit task started event
      await this.emitAgentEvent(AgentEventTypes.TASK_STARTED, {
        taskId: task.id,
        agentId: this.metadata.id,
        task
      });

      // Execute the actual task logic
      const data = await this.executeTask(task);

      const endTime = new Date();
      const result: AgentResult = {
        taskId: task.id,
        agentId: this.metadata.id,
        status: 'completed',
        data,
        metrics: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime()
        }
      };

      this._status = 'idle';
      this._tasksCompleted++;
      this._currentTask = undefined;

      // Emit task completed event
      await this.emitAgentEvent(AgentEventTypes.TASK_COMPLETED, {
        taskId: task.id,
        agentId: this.metadata.id,
        result
      });

      return result;

    } catch (error) {
      this._lastError = error instanceof Error ? error : new Error(String(error));
      this._status = 'failed';
      this._currentTask = undefined;

      const endTime = new Date();
      const result: AgentResult = {
        taskId: task.id,
        agentId: this.metadata.id,
        status: 'failed',
        error: this._lastError,
        metrics: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime()
        }
      };

      // Emit task failed event
      await this.emitAgentEvent(AgentEventTypes.TASK_FAILED, {
        taskId: task.id,
        agentId: this.metadata.id,
        error: this._lastError,
        result
      });

      throw this._lastError;
    }
  }

  /**
   * Pause the agent's current execution
   */
  async pause(): Promise<void> {
    if (this._status === 'running') {
      this._status = 'paused';
      await this.onPause();
      this.emit('paused', { agentId: this.metadata.id });
    }
  }

  /**
   * Resume the agent's execution
   */
  async resume(): Promise<void> {
    if (this._status === 'paused') {
      this._status = 'running';
      await this.onResume();
      this.emit('resumed', { agentId: this.metadata.id });
    }
  }

  /**
   * Stop the agent and cleanup resources
   */
  async stop(): Promise<void> {
    this._status = 'idle';
    this._currentTask = undefined;
    await this.onStop();
    this.emit('stopped', { agentId: this.metadata.id });
    this.removeAllListeners();
  }

  /**
   * Get current agent health status
   */
  async getHealth(): Promise<{
    status: AgentStatus;
    uptime: number;
    tasksCompleted: number;
    lastError?: Error;
  }> {
    return {
      status: this._status,
      uptime: Date.now() - this._startTime,
      tasksCompleted: this._tasksCompleted,
      lastError: this._lastError
    };
  }

  /**
   * Handle coordination events from other agents
   */
  async onEvent(event: AgentEvent): Promise<void> {
    try {
      await this.handleEvent(event);
    } catch (error) {
      this._lastError = error instanceof Error ? error : new Error(String(error));
      await this.emitAgentEvent(AgentEventTypes.ERROR, {
        agentId: this.metadata.id,
        error: this._lastError,
        originalEvent: event
      });
    }
  }

  /**
   * Emit an event to the coordination system
   */
  async emitEvent(type: string, data: any): Promise<void> {
    await this.emitAgentEvent(type, data);
  }

  /**
   * Internal method to emit events through the coordinator
   */
  private async emitAgentEvent(type: string, data: any): Promise<void> {
    const event: AgentEvent = {
      id: `${this.metadata.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      agentId: this.metadata.id,
      timestamp: new Date(),
      data
    };

    // Emit locally first
    super.emit(type, event);

    // Forward to coordinator if available
    if (this._coordinator) {
      await this._coordinator.forwardEvent(event);
    }
  }

  /**
   * Set the coordinator reference (called by registry)
   */
  setCoordinator(coordinator: any): void {
    this._coordinator = coordinator;
  }

  // Abstract methods that subclasses must implement

  /**
   * Perform agent-specific initialization
   */
  protected abstract onInitialize(config?: Record<string, any>): Promise<void>;

  /**
   * Execute the actual task logic
   */
  protected abstract executeTask(task: AgentTask): Promise<any>;

  /**
   * Handle pause operation
   */
  protected abstract onPause(): Promise<void>;

  /**
   * Handle resume operation
   */
  protected abstract onResume(): Promise<void>;

  /**
   * Handle stop operation and cleanup
   */
  protected abstract onStop(): Promise<void>;

  /**
   * Handle coordination events from other agents
   */
  protected abstract handleEvent(event: AgentEvent): Promise<void>;

  // Utility methods for subclasses

  /**
   * Log a message with agent context
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logData = {
      timestamp: new Date().toISOString(),
      agentId: this.metadata.id,
      agentType: this.metadata.type,
      level,
      message,
      data
    };

    console.log(JSON.stringify(logData));
  }

  /**
   * Check if agent can handle a specific task type
   */
  protected canHandle(task: AgentTask): boolean {
    return task.type === this.metadata.type;
  }

  /**
   * Get current task information
   */
  protected getCurrentTask(): AgentTask | undefined {
    return this._currentTask;
  }

  /**
   * Update shared state through coordinator
   */
  protected async updateSharedState(key: string, value: any, sessionId?: string): Promise<void> {
    if (this._coordinator) {
      await this._coordinator.updateSharedState(this.metadata.id, key, value, sessionId);
    }
  }

  /**
   * Get shared state through coordinator
   */
  protected async getSharedState(key: string, sessionId?: string): Promise<any> {
    if (this._coordinator) {
      return await this._coordinator.getSharedState(key, sessionId);
    }
    return undefined;
  }
}
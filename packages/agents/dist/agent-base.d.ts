import { EventEmitter } from 'events';
import { IAgent, AgentMetadata, AgentStatus, AgentTask, AgentResult, AgentEvent } from './types.js';
/**
 * Abstract base class for all agents in the multi-agent system.
 * Provides common functionality for lifecycle management, event handling,
 * and coordination with other agents.
 */
export declare abstract class BaseAgent extends EventEmitter implements IAgent {
    readonly metadata: AgentMetadata;
    private _status;
    private _tasksCompleted;
    private _startTime;
    private _lastError?;
    private _currentTask?;
    private _coordinator?;
    constructor(metadata: AgentMetadata);
    get status(): AgentStatus;
    /**
     * Initialize the agent with configuration.
     * Subclasses should override this to perform specific initialization.
     */
    initialize(config?: Record<string, any>): Promise<void>;
    /**
     * Execute a task. This is the main entry point for task execution.
     */
    execute(task: AgentTask): Promise<AgentResult>;
    /**
     * Pause the agent's current execution
     */
    pause(): Promise<void>;
    /**
     * Resume the agent's execution
     */
    resume(): Promise<void>;
    /**
     * Stop the agent and cleanup resources
     */
    stop(): Promise<void>;
    /**
     * Get current agent health status
     */
    getHealth(): Promise<{
        status: AgentStatus;
        uptime: number;
        tasksCompleted: number;
        lastError?: Error;
    }>;
    /**
     * Handle coordination events from other agents
     */
    onEvent(event: AgentEvent): Promise<void>;
    /**
     * Emit an event to the coordination system
     */
    emitEvent(type: string, data: any): Promise<void>;
    /**
     * Internal method to emit events through the coordinator
     */
    private emitAgentEvent;
    /**
     * Set the coordinator reference (called by registry)
     */
    setCoordinator(coordinator: any): void;
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
    /**
     * Log a message with agent context
     */
    protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void;
    /**
     * Check if agent can handle a specific task type
     */
    protected canHandle(task: AgentTask): boolean;
    /**
     * Get current task information
     */
    protected getCurrentTask(): AgentTask | undefined;
    /**
     * Update shared state through coordinator
     */
    protected updateSharedState(key: string, value: any, sessionId?: string): Promise<void>;
    /**
     * Get shared state through coordinator
     */
    protected getSharedState(key: string, sessionId?: string): Promise<any>;
}
//# sourceMappingURL=agent-base.d.ts.map
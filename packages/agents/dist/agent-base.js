import { EventEmitter } from 'events';
import { AgentEventTypes } from './types.js';
/**
 * Abstract base class for all agents in the multi-agent system.
 * Provides common functionality for lifecycle management, event handling,
 * and coordination with other agents.
 */
export class BaseAgent extends EventEmitter {
    constructor(metadata) {
        super();
        this.metadata = metadata;
        this._status = 'idle';
        this._tasksCompleted = 0;
        this._startTime = Date.now();
        this.setMaxListeners(100); // Allow many concurrent listeners
    }
    get status() {
        return this._status;
    }
    /**
     * Initialize the agent with configuration.
     * Subclasses should override this to perform specific initialization.
     */
    async initialize(config) {
        this._status = 'idle';
        await this.onInitialize(config);
        this.emit('initialized', { agentId: this.metadata.id, config });
    }
    /**
     * Execute a task. This is the main entry point for task execution.
     */
    async execute(task) {
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
            const result = {
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
        }
        catch (error) {
            this._lastError = error instanceof Error ? error : new Error(String(error));
            this._status = 'failed';
            this._currentTask = undefined;
            const endTime = new Date();
            const result = {
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
    async pause() {
        if (this._status === 'running') {
            this._status = 'paused';
            await this.onPause();
            this.emit('paused', { agentId: this.metadata.id });
        }
    }
    /**
     * Resume the agent's execution
     */
    async resume() {
        if (this._status === 'paused') {
            this._status = 'running';
            await this.onResume();
            this.emit('resumed', { agentId: this.metadata.id });
        }
    }
    /**
     * Stop the agent and cleanup resources
     */
    async stop() {
        this._status = 'idle';
        this._currentTask = undefined;
        await this.onStop();
        this.emit('stopped', { agentId: this.metadata.id });
        this.removeAllListeners();
    }
    /**
     * Get current agent health status
     */
    async getHealth() {
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
    async onEvent(event) {
        try {
            await this.handleEvent(event);
        }
        catch (error) {
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
    async emitEvent(type, data) {
        await this.emitAgentEvent(type, data);
    }
    /**
     * Internal method to emit events through the coordinator
     */
    async emitAgentEvent(type, data) {
        const event = {
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
    setCoordinator(coordinator) {
        this._coordinator = coordinator;
    }
    // Utility methods for subclasses
    /**
     * Log a message with agent context
     */
    log(level, message, data) {
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
    canHandle(task) {
        return task.type === this.metadata.type;
    }
    /**
     * Get current task information
     */
    getCurrentTask() {
        return this._currentTask;
    }
    /**
     * Update shared state through coordinator
     */
    async updateSharedState(key, value, sessionId) {
        if (this._coordinator) {
            await this._coordinator.updateSharedState(this.metadata.id, key, value, sessionId);
        }
    }
    /**
     * Get shared state through coordinator
     */
    async getSharedState(key, sessionId) {
        if (this._coordinator) {
            return await this._coordinator.getSharedState(key, sessionId);
        }
        return undefined;
    }
}
//# sourceMappingURL=agent-base.js.map
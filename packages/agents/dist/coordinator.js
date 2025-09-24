import { EventEmitter } from 'events';
import { AgentEventTypes } from './types.js';
/**
 * Coordinates communication and task orchestration between agents.
 * Manages shared state, event distribution, and multi-agent workflows.
 */
export class AgentCoordinator extends EventEmitter {
    constructor(registry, config = {}) {
        var _a, _b, _c;
        super();
        this.contexts = new Map();
        this.eventBuffer = new Map();
        this.registry = registry;
        this.config = {
            redis: config.redis,
            sessionTtl: (_a = config.sessionTtl) !== null && _a !== void 0 ? _a : 3600, // 1 hour
            eventBuffer: (_b = config.eventBuffer) !== null && _b !== void 0 ? _b : 1000,
            pubSubChannels: (_c = config.pubSubChannels) !== null && _c !== void 0 ? _c : {
                events: 'agent:events',
                coordination: 'agent:coordination',
                heartbeat: 'agent:heartbeat'
            }
        };
        // Set coordinator reference in registry
        this.registry.setCoordinator(this);
        // Set up event forwarding from registry
        this.setupRegistryEventForwarding();
        // Start cleanup timer for expired contexts
        this.startContextCleanup();
        // Initialize Redis if configured
        if (this.config.redis) {
            this.initializeRedis();
        }
    }
    /**
     * Create a new coordination session
     */
    async createSession(sessionId, initiatorId, participants = [], sharedState = {}, ttl) {
        if (this.contexts.has(sessionId)) {
            throw new Error(`Coordination session ${sessionId} already exists`);
        }
        const context = {
            sessionId,
            initiatorId,
            participants: [...participants, initiatorId],
            sharedState,
            events: [],
            ttl: ttl !== null && ttl !== void 0 ? ttl : this.config.sessionTtl
        };
        this.contexts.set(sessionId, context);
        this.eventBuffer.set(sessionId, []);
        // Notify participants about new session
        await this.broadcastEvent({
            id: `session-${sessionId}-${Date.now()}`,
            type: 'session:created',
            agentId: 'coordinator',
            sessionId,
            timestamp: new Date(),
            data: { context }
        });
        this.log('info', `Created coordination session: ${sessionId}`, { participants, ttl: context.ttl });
        return context;
    }
    /**
     * Join an existing coordination session
     */
    async joinSession(sessionId, agentId) {
        const context = this.contexts.get(sessionId);
        if (!context) {
            throw new Error(`Coordination session ${sessionId} not found`);
        }
        if (!context.participants.includes(agentId)) {
            context.participants.push(agentId);
            // Notify other participants
            await this.broadcastEvent({
                id: `session-${sessionId}-join-${Date.now()}`,
                type: 'session:joined',
                agentId: 'coordinator',
                sessionId,
                timestamp: new Date(),
                data: { joinedAgentId: agentId, participants: context.participants }
            });
            this.log('info', `Agent ${agentId} joined session: ${sessionId}`);
        }
        return context;
    }
    /**
     * Leave a coordination session
     */
    async leaveSession(sessionId, agentId) {
        const context = this.contexts.get(sessionId);
        if (!context) {
            return; // Session doesn't exist, nothing to do
        }
        const index = context.participants.indexOf(agentId);
        if (index > -1) {
            context.participants.splice(index, 1);
            // Notify other participants
            await this.broadcastEvent({
                id: `session-${sessionId}-leave-${Date.now()}`,
                type: 'session:left',
                agentId: 'coordinator',
                sessionId,
                timestamp: new Date(),
                data: { leftAgentId: agentId, participants: context.participants }
            });
            this.log('info', `Agent ${agentId} left session: ${sessionId}`);
            // Clean up session if no participants left
            if (context.participants.length === 0) {
                await this.endSession(sessionId);
            }
        }
    }
    /**
     * End a coordination session
     */
    async endSession(sessionId) {
        const context = this.contexts.get(sessionId);
        if (!context) {
            return; // Session doesn't exist
        }
        // Notify all participants
        await this.broadcastEvent({
            id: `session-${sessionId}-end-${Date.now()}`,
            type: 'session:ended',
            agentId: 'coordinator',
            sessionId,
            timestamp: new Date(),
            data: { context }
        });
        // Clean up session data
        this.contexts.delete(sessionId);
        this.eventBuffer.delete(sessionId);
        this.log('info', `Ended coordination session: ${sessionId}`);
    }
    /**
     * Orchestrate a multi-agent task workflow
     */
    async orchestrate(sessionId, tasks, options = {}) {
        const { parallel = false, timeout = 300000, retryAttempts = 3 } = options;
        // Create session if it doesn't exist
        if (!this.contexts.has(sessionId)) {
            await this.createSession(sessionId, 'coordinator');
        }
        this.log('info', `Starting orchestration for session ${sessionId}`, {
            taskCount: tasks.length,
            parallel,
            timeout
        });
        const results = [];
        try {
            if (parallel) {
                // Execute tasks in parallel
                const taskPromises = tasks.map(task => this.executeTaskWithRetry(task, retryAttempts, timeout));
                const parallelResults = await Promise.all(taskPromises);
                results.push(...parallelResults);
            }
            else {
                // Execute tasks sequentially
                for (const task of tasks) {
                    const result = await this.executeTaskWithRetry(task, retryAttempts, timeout);
                    results.push(result);
                    // Stop if task failed and no retry succeeded
                    if (result.status === 'failed') {
                        this.log('warn', `Task ${task.id} failed, stopping sequential execution`);
                        break;
                    }
                }
            }
            // Update session with results
            await this.updateSharedState('coordinator', 'orchestration_results', results, sessionId);
            return results;
        }
        catch (error) {
            this.log('error', `Orchestration failed for session ${sessionId}:`, error);
            throw error;
        }
    }
    /**
     * Execute a single task with retry logic
     */
    async executeTaskWithRetry(task, retryAttempts, timeout) {
        let lastError;
        for (let attempt = 1; attempt <= retryAttempts; attempt++) {
            try {
                return await this.executeTask(task, timeout);
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                this.log('warn', `Task ${task.id} failed (attempt ${attempt}/${retryAttempts}):`, lastError);
                if (attempt < retryAttempts) {
                    // Wait before retry with exponential backoff
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        // All retries failed
        throw lastError || new Error(`Task ${task.id} failed after ${retryAttempts} attempts`);
    }
    /**
     * Execute a single task by finding and delegating to appropriate agent
     */
    async executeTask(task, timeout) {
        // Find available agent for task type
        const availableAgents = this.registry.findAvailableAgents(task.type, 1);
        if (availableAgents.length === 0) {
            throw new Error(`No available agents found for task type: ${task.type}`);
        }
        const agent = availableAgents[0];
        // Execute task with timeout
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Task ${task.id} timed out after ${timeout}ms`));
            }, timeout);
            agent.execute(task)
                .then(result => {
                clearTimeout(timeoutId);
                resolve(result);
            })
                .catch(error => {
                clearTimeout(timeoutId);
                reject(error);
            });
        });
    }
    /**
     * Forward an event from an agent to other participants
     */
    async forwardEvent(event) {
        // Store in event buffer
        if (event.sessionId) {
            const buffer = this.eventBuffer.get(event.sessionId);
            if (buffer) {
                buffer.push(event);
                // Trim buffer if it exceeds limit
                if (buffer.length > this.config.eventBuffer) {
                    buffer.splice(0, buffer.length - this.config.eventBuffer);
                }
            }
        }
        // Broadcast to other agents
        await this.broadcastEvent(event);
        // Publish to Redis if available
        if (this.redisClient) {
            await this.publishToRedis(this.config.pubSubChannels.events, event);
        }
    }
    /**
     * Update shared state for a session
     */
    async updateSharedState(agentId, key, value, sessionId) {
        if (!sessionId) {
            // Use default session or create one
            sessionId = 'default';
            if (!this.contexts.has(sessionId)) {
                await this.createSession(sessionId, agentId);
            }
        }
        const context = this.contexts.get(sessionId);
        if (!context) {
            throw new Error(`Session ${sessionId} not found`);
        }
        context.sharedState[key] = value;
        // Notify participants about state update
        await this.broadcastEvent({
            id: `state-update-${sessionId}-${Date.now()}`,
            type: AgentEventTypes.STATE_UPDATED,
            agentId,
            sessionId,
            timestamp: new Date(),
            data: { key, value, sharedState: context.sharedState }
        });
    }
    /**
     * Get shared state from a session
     */
    async getSharedState(key, sessionId) {
        sessionId = sessionId || 'default';
        const context = this.contexts.get(sessionId);
        if (!context) {
            return undefined;
        }
        return context.sharedState[key];
    }
    /**
     * Get all events for a session
     */
    getSessionEvents(sessionId) {
        return this.eventBuffer.get(sessionId) || [];
    }
    /**
     * Get active coordination contexts
     */
    getActiveSessions() {
        return Array.from(this.contexts.values());
    }
    /**
     * Broadcast an event to all relevant agents
     */
    async broadcastEvent(event) {
        const context = event.sessionId ? this.contexts.get(event.sessionId) : null;
        if (context) {
            // Send to session participants
            for (const agentId of context.participants) {
                if (agentId !== event.agentId) { // Don't send back to sender
                    const agent = this.registry.getAgent(agentId);
                    if (agent) {
                        try {
                            await agent.onEvent(event);
                        }
                        catch (error) {
                            this.log('warn', `Error sending event to agent ${agentId}:`, error);
                        }
                    }
                }
            }
        }
        else {
            // Broadcast to all agents if no session context
            const allAgents = this.registry.getActiveAgents();
            for (const agent of allAgents) {
                if (agent.metadata.id !== event.agentId) {
                    try {
                        await agent.onEvent(event);
                    }
                    catch (error) {
                        this.log('warn', `Error broadcasting event to agent ${agent.metadata.id}:`, error);
                    }
                }
            }
        }
        // Emit locally for any listeners
        this.emit('event', event);
    }
    /**
     * Set up event forwarding from registry
     */
    setupRegistryEventForwarding() {
        // Forward registry events through coordinator
        this.registry.on(AgentEventTypes.AGENT_REGISTERED, (data) => {
            this.emit(AgentEventTypes.AGENT_REGISTERED, data);
        });
        this.registry.on(AgentEventTypes.AGENT_UNREGISTERED, (data) => {
            this.emit(AgentEventTypes.AGENT_UNREGISTERED, data);
        });
        this.registry.on('stale-agents-detected', (data) => {
            this.emit('stale-agents-detected', data);
        });
    }
    /**
     * Start cleanup timer for expired contexts
     */
    startContextCleanup() {
        this.cleanupTimer = setInterval(() => {
            this.cleanupExpiredContexts();
        }, 60000); // Check every minute
    }
    /**
     * Clean up expired coordination contexts
     */
    cleanupExpiredContexts() {
        var _a;
        const now = Date.now();
        const sessionsToEnd = [];
        for (const [sessionId, context] of this.contexts.entries()) {
            // Calculate context age (assuming contexts track creation time)
            const contextAge = now - new Date(((_a = context.events[0]) === null || _a === void 0 ? void 0 : _a.timestamp) || now).getTime();
            if (contextAge > context.ttl * 1000) {
                sessionsToEnd.push(sessionId);
            }
        }
        // End expired sessions
        for (const sessionId of sessionsToEnd) {
            this.endSession(sessionId).catch(error => {
                this.log('error', `Error ending expired session ${sessionId}:`, error);
            });
        }
        if (sessionsToEnd.length > 0) {
            this.log('info', `Cleaned up ${sessionsToEnd.length} expired sessions`);
        }
    }
    /**
     * Initialize Redis for distributed coordination
     */
    async initializeRedis() {
        if (!this.config.redis)
            return;
        try {
            // In a real implementation, you would import and initialize Redis client here
            // For now, we'll just log that Redis would be initialized
            this.log('info', 'Redis coordination enabled', this.config.redis);
            // Example Redis initialization (commented out as we don't have redis dependency):
            // const Redis = require('ioredis');
            // this.redisClient = new Redis(this.config.redis);
            //
            // // Subscribe to coordination channels
            // await this.redisClient.subscribe(this.config.pubSubChannels.events);
            // await this.redisClient.subscribe(this.config.pubSubChannels.coordination);
            //
            // this.redisClient.on('message', (channel, message) => {
            //   this.handleRedisMessage(channel, message);
            // });
        }
        catch (error) {
            this.log('error', 'Failed to initialize Redis:', error);
        }
    }
    /**
     * Publish event to Redis (placeholder)
     */
    async publishToRedis(channel, data) {
        if (!this.redisClient)
            return;
        try {
            // await this.redisClient.publish(channel, JSON.stringify(data));
            this.log('debug', `Published to Redis channel ${channel}`, data);
        }
        catch (error) {
            this.log('error', `Error publishing to Redis channel ${channel}:`, error);
        }
    }
    /**
     * Shutdown the coordinator
     */
    async shutdown() {
        this.log('info', 'Shutting down agent coordinator...');
        // Stop cleanup timer
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        // End all active sessions
        const activeSessions = Array.from(this.contexts.keys());
        for (const sessionId of activeSessions) {
            await this.endSession(sessionId);
        }
        // Close Redis connection if exists
        if (this.redisClient) {
            // await this.redisClient.quit();
            this.log('info', 'Redis connection closed');
        }
        this.log('info', 'Agent coordinator shutdown complete');
    }
    /**
     * Log a message with coordinator context
     */
    log(level, message, data) {
        const logData = {
            timestamp: new Date().toISOString(),
            component: 'AgentCoordinator',
            level,
            message,
            data
        };
        if (level !== 'debug') {
            console.log(JSON.stringify(logData));
        }
    }
}
//# sourceMappingURL=coordinator.js.map
import { EventEmitter } from 'events';
import { AgentEventTypes } from './types.js';
/**
 * Central registry for managing agent instances in the multi-agent system.
 * Handles agent registration, discovery, lifecycle management, and health monitoring.
 */
export class AgentRegistry extends EventEmitter {
    constructor(config = {}) {
        var _a, _b, _c, _d;
        super();
        this.agents = new Map();
        this.agentsByType = new Map();
        this.config = {
            maxAgents: (_a = config.maxAgents) !== null && _a !== void 0 ? _a : 100,
            heartbeatInterval: (_b = config.heartbeatInterval) !== null && _b !== void 0 ? _b : 30000, // 30 seconds
            cleanupInterval: (_c = config.cleanupInterval) !== null && _c !== void 0 ? _c : 60000, // 1 minute
            staleTimeout: (_d = config.staleTimeout) !== null && _d !== void 0 ? _d : 120000 // 2 minutes
        };
        this.startHeartbeatMonitoring();
        this.startCleanupMonitoring();
    }
    /**
     * Register a new agent instance
     */
    async register(agent) {
        const { id, type } = agent.metadata;
        // Check if agent is already registered
        if (this.agents.has(id)) {
            throw new Error(`Agent with ID ${id} is already registered`);
        }
        // Check max agents limit
        if (this.agents.size >= this.config.maxAgents) {
            throw new Error(`Maximum number of agents (${this.config.maxAgents}) reached`);
        }
        // Validate agent metadata
        this.validateAgentMetadata(agent.metadata);
        // Create registration entry
        const registration = {
            metadata: agent.metadata,
            instance: agent,
            registeredAt: new Date(),
            lastHeartbeat: new Date(),
            isActive: true
        };
        // Store registration
        this.agents.set(id, registration);
        // Index by type
        if (!this.agentsByType.has(type)) {
            this.agentsByType.set(type, new Set());
        }
        this.agentsByType.get(type).add(id);
        // Set coordinator reference on agent
        if (this.coordinator) {
            agent.setCoordinator(this.coordinator);
        }
        // Set up agent event forwarding
        this.setupAgentEventForwarding(agent);
        this.emit(AgentEventTypes.AGENT_REGISTERED, {
            agentId: id,
            metadata: agent.metadata,
            timestamp: new Date()
        });
        this.log('info', `Agent registered: ${id} (${type})`);
    }
    /**
     * Unregister an agent instance
     */
    async unregister(agentId) {
        const registration = this.agents.get(agentId);
        if (!registration) {
            throw new Error(`Agent ${agentId} is not registered`);
        }
        // Stop the agent
        try {
            await registration.instance.stop();
        }
        catch (error) {
            this.log('warn', `Error stopping agent ${agentId}:`, error);
        }
        // Remove from type index
        const typeSet = this.agentsByType.get(registration.metadata.type);
        if (typeSet) {
            typeSet.delete(agentId);
            if (typeSet.size === 0) {
                this.agentsByType.delete(registration.metadata.type);
            }
        }
        // Remove registration
        this.agents.delete(agentId);
        this.emit(AgentEventTypes.AGENT_UNREGISTERED, {
            agentId,
            metadata: registration.metadata,
            timestamp: new Date()
        });
        this.log('info', `Agent unregistered: ${agentId}`);
    }
    /**
     * Get an agent instance by ID
     */
    getAgent(agentId) {
        var _a;
        return (_a = this.agents.get(agentId)) === null || _a === void 0 ? void 0 : _a.instance;
    }
    /**
     * Get agent metadata by ID
     */
    getAgentMetadata(agentId) {
        var _a;
        return (_a = this.agents.get(agentId)) === null || _a === void 0 ? void 0 : _a.metadata;
    }
    /**
     * Get all agents of a specific type
     */
    getAgentsByType(type) {
        const agentIds = this.agentsByType.get(type);
        if (!agentIds) {
            return [];
        }
        return Array.from(agentIds)
            .map(id => { var _a; return (_a = this.agents.get(id)) === null || _a === void 0 ? void 0 : _a.instance; })
            .filter((agent) => agent !== undefined);
    }
    /**
     * Get all active agents
     */
    getActiveAgents() {
        return Array.from(this.agents.values())
            .filter(reg => reg.isActive)
            .map(reg => reg.instance);
    }
    /**
     * Get all agent registrations
     */
    getAllRegistrations() {
        return Array.from(this.agents.values());
    }
    /**
     * Find available agents for a task type
     */
    findAvailableAgents(type, count = 1) {
        const agents = this.getAgentsByType(type);
        const available = agents.filter(agent => agent.status === 'idle');
        return available.slice(0, count);
    }
    /**
     * Get registry statistics
     */
    getStats() {
        const agentsByType = {};
        const agentsByStatus = {};
        let activeCount = 0;
        for (const registration of this.agents.values()) {
            const { type } = registration.metadata;
            const status = registration.instance.status;
            agentsByType[type] = (agentsByType[type] || 0) + 1;
            agentsByStatus[status] = (agentsByStatus[status] || 0) + 1;
            if (registration.isActive) {
                activeCount++;
            }
        }
        return {
            totalAgents: this.agents.size,
            activeAgents: activeCount,
            agentsByType: agentsByType,
            agentsByStatus: agentsByStatus
        };
    }
    /**
     * Update agent heartbeat
     */
    updateHeartbeat(agentId) {
        const registration = this.agents.get(agentId);
        if (registration) {
            registration.lastHeartbeat = new Date();
            registration.isActive = true;
        }
    }
    /**
     * Set coordinator reference
     */
    setCoordinator(coordinator) {
        this.coordinator = coordinator;
        // Update existing agents with coordinator reference
        for (const registration of this.agents.values()) {
            registration.instance.setCoordinator(coordinator);
        }
    }
    /**
     * Shutdown the registry and all agents
     */
    async shutdown() {
        this.log('info', 'Shutting down agent registry...');
        // Stop monitoring timers
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        // Stop all agents
        const stopPromises = Array.from(this.agents.values()).map(async (registration) => {
            try {
                await registration.instance.stop();
            }
            catch (error) {
                this.log('warn', `Error stopping agent ${registration.metadata.id}:`, error);
            }
        });
        await Promise.all(stopPromises);
        // Clear all registrations
        this.agents.clear();
        this.agentsByType.clear();
        this.log('info', 'Agent registry shutdown complete');
    }
    /**
     * Validate agent metadata
     */
    validateAgentMetadata(metadata) {
        if (!metadata.id || typeof metadata.id !== 'string') {
            throw new Error('Agent metadata must have a valid id');
        }
        if (!metadata.type || typeof metadata.type !== 'string') {
            throw new Error('Agent metadata must have a valid type');
        }
        if (!metadata.name || typeof metadata.name !== 'string') {
            throw new Error('Agent metadata must have a valid name');
        }
        if (!metadata.version || typeof metadata.version !== 'string') {
            throw new Error('Agent metadata must have a valid version');
        }
        if (!Array.isArray(metadata.capabilities)) {
            throw new Error('Agent metadata must have capabilities array');
        }
        if (!Array.isArray(metadata.dependencies)) {
            throw new Error('Agent metadata must have dependencies array');
        }
    }
    /**
     * Set up event forwarding from agent to registry
     */
    setupAgentEventForwarding(agent) {
        // Forward all agent events through the registry
        const forwardEvent = (eventName) => {
            agent.on(eventName, (data) => {
                this.emit(eventName, {
                    ...data,
                    source: 'agent',
                    agentId: agent.metadata.id
                });
            });
        };
        // Set up forwarding for key events
        forwardEvent('initialized');
        forwardEvent('paused');
        forwardEvent('resumed');
        forwardEvent('stopped');
        forwardEvent(AgentEventTypes.TASK_STARTED);
        forwardEvent(AgentEventTypes.TASK_COMPLETED);
        forwardEvent(AgentEventTypes.TASK_FAILED);
        forwardEvent(AgentEventTypes.ERROR);
    }
    /**
     * Start heartbeat monitoring
     */
    startHeartbeatMonitoring() {
        this.heartbeatTimer = setInterval(() => {
            this.checkHeartbeats();
        }, this.config.heartbeatInterval);
    }
    /**
     * Start cleanup monitoring
     */
    startCleanupMonitoring() {
        this.cleanupTimer = setInterval(() => {
            this.cleanupStaleAgents();
        }, this.config.cleanupInterval);
    }
    /**
     * Check agent heartbeats and mark stale agents as inactive
     */
    checkHeartbeats() {
        const now = Date.now();
        let staleCount = 0;
        for (const [agentId, registration] of this.agents.entries()) {
            const timeSinceHeartbeat = now - registration.lastHeartbeat.getTime();
            if (timeSinceHeartbeat > this.config.staleTimeout) {
                if (registration.isActive) {
                    registration.isActive = false;
                    staleCount++;
                    this.log('warn', `Agent ${agentId} marked as stale (no heartbeat for ${timeSinceHeartbeat}ms)`);
                }
            }
        }
        if (staleCount > 0) {
            this.emit('stale-agents-detected', { count: staleCount, timestamp: new Date() });
        }
    }
    /**
     * Clean up stale agents that haven't been active for too long
     */
    async cleanupStaleAgents() {
        const now = Date.now();
        const agentsToRemove = [];
        for (const [agentId, registration] of this.agents.entries()) {
            const timeSinceHeartbeat = now - registration.lastHeartbeat.getTime();
            // Remove agents that have been stale for twice the stale timeout
            if (!registration.isActive && timeSinceHeartbeat > this.config.staleTimeout * 2) {
                agentsToRemove.push(agentId);
            }
        }
        for (const agentId of agentsToRemove) {
            try {
                await this.unregister(agentId);
                this.log('info', `Cleaned up stale agent: ${agentId}`);
            }
            catch (error) {
                this.log('error', `Error cleaning up stale agent ${agentId}:`, error);
            }
        }
    }
    /**
     * Log a message with registry context
     */
    log(level, message, data) {
        const logData = {
            timestamp: new Date().toISOString(),
            component: 'AgentRegistry',
            level,
            message,
            data
        };
        console.log(JSON.stringify(logData));
    }
}
//# sourceMappingURL=registry.js.map
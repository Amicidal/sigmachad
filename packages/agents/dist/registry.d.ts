import { EventEmitter } from 'events';
import { IAgent, AgentRegistration, AgentMetadata, AgentType, AgentStatus, RegistryConfig } from './types.js';
/**
 * Central registry for managing agent instances in the multi-agent system.
 * Handles agent registration, discovery, lifecycle management, and health monitoring.
 */
export declare class AgentRegistry extends EventEmitter {
    private agents;
    private agentsByType;
    private heartbeatTimer?;
    private cleanupTimer?;
    private coordinator?;
    private readonly config;
    constructor(config?: RegistryConfig);
    /**
     * Register a new agent instance
     */
    register(agent: IAgent): Promise<void>;
    /**
     * Unregister an agent instance
     */
    unregister(agentId: string): Promise<void>;
    /**
     * Get an agent instance by ID
     */
    getAgent(agentId: string): IAgent | undefined;
    /**
     * Get agent metadata by ID
     */
    getAgentMetadata(agentId: string): AgentMetadata | undefined;
    /**
     * Get all agents of a specific type
     */
    getAgentsByType(type: AgentType): IAgent[];
    /**
     * Get all active agents
     */
    getActiveAgents(): IAgent[];
    /**
     * Get all agent registrations
     */
    getAllRegistrations(): AgentRegistration[];
    /**
     * Find available agents for a task type
     */
    findAvailableAgents(type: AgentType, count?: number): IAgent[];
    /**
     * Get registry statistics
     */
    getStats(): {
        totalAgents: number;
        activeAgents: number;
        agentsByType: Record<AgentType, number>;
        agentsByStatus: Record<AgentStatus, number>;
    };
    /**
     * Update agent heartbeat
     */
    updateHeartbeat(agentId: string): void;
    /**
     * Set coordinator reference
     */
    setCoordinator(coordinator: any): void;
    /**
     * Shutdown the registry and all agents
     */
    shutdown(): Promise<void>;
    /**
     * Validate agent metadata
     */
    private validateAgentMetadata;
    /**
     * Set up event forwarding from agent to registry
     */
    private setupAgentEventForwarding;
    /**
     * Start heartbeat monitoring
     */
    private startHeartbeatMonitoring;
    /**
     * Start cleanup monitoring
     */
    private startCleanupMonitoring;
    /**
     * Check agent heartbeats and mark stale agents as inactive
     */
    private checkHeartbeats;
    /**
     * Clean up stale agents that haven't been active for too long
     */
    private cleanupStaleAgents;
    /**
     * Log a message with registry context
     */
    private log;
}
//# sourceMappingURL=registry.d.ts.map
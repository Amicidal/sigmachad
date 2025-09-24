import { EventEmitter } from 'events';
import { AgentEvent, AgentTask, AgentResult, CoordinationContext, CoordinatorConfig } from './types.js';
import { AgentRegistry } from './registry.js';
/**
 * Coordinates communication and task orchestration between agents.
 * Manages shared state, event distribution, and multi-agent workflows.
 */
export declare class AgentCoordinator extends EventEmitter {
    private registry;
    private contexts;
    private eventBuffer;
    private redisClient?;
    private cleanupTimer?;
    private readonly config;
    constructor(registry: AgentRegistry, config?: CoordinatorConfig);
    /**
     * Create a new coordination session
     */
    createSession(sessionId: string, initiatorId: string, participants?: string[], sharedState?: Record<string, any>, ttl?: number): Promise<CoordinationContext>;
    /**
     * Join an existing coordination session
     */
    joinSession(sessionId: string, agentId: string): Promise<CoordinationContext>;
    /**
     * Leave a coordination session
     */
    leaveSession(sessionId: string, agentId: string): Promise<void>;
    /**
     * End a coordination session
     */
    endSession(sessionId: string): Promise<void>;
    /**
     * Orchestrate a multi-agent task workflow
     */
    orchestrate(sessionId: string, tasks: AgentTask[], options?: {
        parallel?: boolean;
        timeout?: number;
        retryAttempts?: number;
    }): Promise<AgentResult[]>;
    /**
     * Execute a single task with retry logic
     */
    private executeTaskWithRetry;
    /**
     * Execute a single task by finding and delegating to appropriate agent
     */
    private executeTask;
    /**
     * Forward an event from an agent to other participants
     */
    forwardEvent(event: AgentEvent): Promise<void>;
    /**
     * Update shared state for a session
     */
    updateSharedState(agentId: string, key: string, value: any, sessionId?: string): Promise<void>;
    /**
     * Get shared state from a session
     */
    getSharedState(key: string, sessionId?: string): Promise<any>;
    /**
     * Get all events for a session
     */
    getSessionEvents(sessionId: string): AgentEvent[];
    /**
     * Get active coordination contexts
     */
    getActiveSessions(): CoordinationContext[];
    /**
     * Broadcast an event to all relevant agents
     */
    private broadcastEvent;
    /**
     * Set up event forwarding from registry
     */
    private setupRegistryEventForwarding;
    /**
     * Start cleanup timer for expired contexts
     */
    private startContextCleanup;
    /**
     * Clean up expired coordination contexts
     */
    private cleanupExpiredContexts;
    /**
     * Initialize Redis for distributed coordination
     */
    private initializeRedis;
    /**
     * Publish event to Redis (placeholder)
     */
    private publishToRedis;
    /**
     * Shutdown the coordinator
     */
    shutdown(): Promise<void>;
    /**
     * Log a message with coordinator context
     */
    private log;
}
//# sourceMappingURL=coordinator.d.ts.map
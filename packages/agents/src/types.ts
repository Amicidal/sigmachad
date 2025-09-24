/**
 * Core types for the multi-agent orchestration system
 */

export type AgentType = 'parse' | 'test' | 'scm' | 'verification' | 'analysis';

export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'paused';

export interface AgentMetadata {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  version: string;
  capabilities: string[];
  dependencies: string[];
}

export interface AgentTask {
  id: string;
  type: AgentType;
  params: Record<string, any>;
  priority: number;
  sessionId?: string;
  createdAt: Date;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface AgentResult {
  taskId: string;
  agentId: string;
  status: AgentStatus;
  data?: any;
  error?: Error;
  metrics?: {
    startTime: Date;
    endTime: Date;
    duration: number;
    memoryUsage?: number;
    kgQueries?: number;
  };
}

export interface AgentEvent {
  id: string;
  type: string;
  agentId: string;
  sessionId?: string;
  timestamp: Date;
  data: any;
}

export interface CoordinationContext {
  sessionId: string;
  initiatorId: string;
  participants: string[];
  sharedState: Record<string, any>;
  events: AgentEvent[];
  ttl: number; // TTL in seconds
}

export interface AgentRegistration {
  metadata: AgentMetadata;
  instance: IAgent;
  registeredAt: Date;
  lastHeartbeat: Date;
  isActive: boolean;
}

/**
 * Base interface that all agents must implement
 */
export interface IAgent {
  readonly metadata: AgentMetadata;
  readonly status: AgentStatus;

  /**
   * Initialize the agent with configuration
   */
  initialize(config?: Record<string, any>): Promise<void>;

  /**
   * Execute a task
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
   * Set coordinator reference (used by registry)
   */
  setCoordinator(coordinator: any): void;

  /**
   * Event listener methods for registry integration
   */
  on(event: string, listener: (...args: any[]) => void): this;
  removeAllListeners(): this;
}

/**
 * Configuration for the agent registry
 */
export interface RegistryConfig {
  maxAgents?: number;
  heartbeatInterval?: number; // in milliseconds
  cleanupInterval?: number; // in milliseconds
  staleTimeout?: number; // in milliseconds
}

/**
 * Configuration for the coordination system
 */
export interface CoordinatorConfig {
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
  sessionTtl?: number; // in seconds
  eventBuffer?: number; // max events to keep in memory
  pubSubChannels?: {
    events: string;
    coordination: string;
    heartbeat: string;
  };
}

/**
 * Event types for agent coordination
 */
export const AgentEventTypes = {
  TASK_STARTED: 'task:started',
  TASK_COMPLETED: 'task:completed',
  TASK_FAILED: 'task:failed',
  AGENT_REGISTERED: 'agent:registered',
  AGENT_UNREGISTERED: 'agent:unregistered',
  COORDINATION_REQUEST: 'coordination:request',
  COORDINATION_RESPONSE: 'coordination:response',
  STATE_UPDATED: 'state:updated',
  HEARTBEAT: 'heartbeat',
  ERROR: 'error'
} as const;

export type AgentEventType = typeof AgentEventTypes[keyof typeof AgentEventTypes];
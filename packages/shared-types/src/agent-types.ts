/**
 * Agent and Coordination Types for Memento
 * Common types for multi-agent orchestration system
 */

/**
 * Types of agents in the system
 */
export type AgentType = 'parse' | 'test' | 'scm' | 'verification' | 'analysis';

/**
 * Status of an agent
 */
export type AgentStatus =
  | 'idle'
  | 'running'
  | 'completed'
  | 'failed'
  | 'paused';

/**
 * Metadata for an agent
 */
export interface AgentMetadata {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  version: string;
  capabilities: string[];
  dependencies: string[];
}

/**
 * Task to be executed by an agent
 */
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

/**
 * Result of an agent task execution
 */
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

/**
 * Event in the agent coordination system
 */
export interface AgentEvent {
  id: string;
  type: string;
  agentId: string;
  sessionId?: string;
  timestamp: Date;
  data: any;
}

/**
 * Context for agent coordination
 */
export interface CoordinationContext {
  sessionId: string;
  initiatorId: string;
  participants: string[];
  sharedState: Record<string, any>;
  events: AgentEvent[];
  ttl: number; // TTL in seconds
  createdAt: Date;
}

/**
 * Agent registration information
 */
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
  ERROR: 'error',
} as const;

export type AgentEventType =
  (typeof AgentEventTypes)[keyof typeof AgentEventTypes];

/**
 * Agent execution metrics
 */
export interface AgentMetrics {
  agentId: string;
  taskCount: number;
  successRate: number;
  averageExecutionTime: number;
  totalExecutionTime: number;
  lastExecutionTime: Date;
  errorCount: number;
  memoryUsage?: number;
}

/**
 * Agent queue information
 */
export interface AgentQueueInfo {
  agentId: string;
  queueLength: number;
  oldestTaskAge: number;
  averageTaskAge: number;
  processingRate: number; // tasks per minute
}

/**
 * Agent system statistics
 */
export interface AgentSystemStats {
  totalAgents: number;
  activeAgents: number;
  agentsByType: Record<AgentType, number>;
  agentsByStatus: Record<AgentStatus, number>;
  averageAgentUptime: number;
  totalTasksProcessed: number;
  systemLoad: number;
  memoryUsage: number;
  errorRate: number;
}



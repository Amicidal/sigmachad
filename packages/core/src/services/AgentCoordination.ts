/**
 * Enhanced Agent Coordination Service
 *
 * Provides advanced multi-agent coordination with priority queuing,
 * load balancing, dead agent detection, and enhanced handoff capabilities
 */

import { EventEmitter } from 'events';
import type { RedisClientType } from 'redis';
import { SessionDocument, SessionEvent, SessionError } from './SessionTypes.js';
import type {
  AgentInfo,
  TaskInfo,
  LoadBalancingStrategy,
  HandoffContext,
  CoordinationMetrics,
  DeadAgentConfig,
} from '@memento/shared-types';

export class AgentCoordination extends EventEmitter {
  private redis: RedisClientType;
  private agents = new Map<string, AgentInfo>();
  private tasks = new Map<string, TaskInfo>();
  private loadBalancingStrategy: LoadBalancingStrategy;
  private deadAgentConfig: DeadAgentConfig;
  private heartbeatTimer?: NodeJS.Timeout;
  private loadBalancingTimer?: NodeJS.Timeout;
  private deadAgentDetectionTimer?: NodeJS.Timeout;

  constructor(
    redis: RedisClientType,
    loadBalancingStrategy: LoadBalancingStrategy = {
      type: 'least-loaded',
      config: {},
    },
    deadAgentConfig: Partial<DeadAgentConfig> = {}
  ) {
    super();
    this.redis = redis;
    this.loadBalancingStrategy = loadBalancingStrategy;
    this.deadAgentConfig = {
      heartbeatInterval: deadAgentConfig.heartbeatInterval ?? 30,
      heartbeatTimeout: deadAgentConfig.heartbeatTimeout ?? 90,
      maxMissedHeartbeats: deadAgentConfig.maxMissedHeartbeats ?? 3,
      enableAutoRecovery: deadAgentConfig.enableAutoRecovery ?? true,
      recoveryDelay: deadAgentConfig.recoveryDelay ?? 60,
    };

    this.initializeTimers();
  }

  /**
   * Register an agent with the coordination system
   */
  async registerAgent(
    agentInfo: Omit<
      AgentInfo,
      | 'lastHeartbeat'
      | 'currentSessions'
      | 'totalTasksCompleted'
      | 'averageTaskDuration'
      | 'errorRate'
    >
  ): Promise<void> {
    const agent: AgentInfo = {
      ...agentInfo,
      lastHeartbeat: new Date().toISOString(),
      currentSessions: [],
      totalTasksCompleted: 0,
      averageTaskDuration: 0,
      errorRate: 0,
    };

    this.agents.set(agent.id, agent);

    // Store agent info in Redis
    await this.redis.hSet(`agent:${agent.id}`, {
      type: agent.type,
      capabilities: JSON.stringify(agent.capabilities),
      priority: agent.priority.toString(),
      load: agent.load.toString(),
      maxLoad: agent.maxLoad.toString(),
      status: agent.status,
      lastHeartbeat: agent.lastHeartbeat,
      metadata: JSON.stringify(agent.metadata),
      currentSessions: JSON.stringify(agent.currentSessions),
      totalTasksCompleted: agent.totalTasksCompleted.toString(),
      averageTaskDuration: agent.averageTaskDuration.toString(),
      errorRate: agent.errorRate.toString(),
    });

    // Add to agent priority queue
    await this.redis.zAdd('agent:priority:queue', {
      score: agent.priority,
      value: agent.id,
    });

    this.emit('agent:registered', agent);
  }

  /**
   * Unregister an agent
   */
  async unregisterAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Reassign any running tasks
    await this.reassignAgentTasks(agentId);

    // Remove from Redis
    await Promise.all([
      this.redis.del(`agent:${agentId}`),
      this.redis.zRem('agent:priority:queue', agentId),
      this.redis.zRem('agent:load:queue', agentId),
    ]);

    this.agents.delete(agentId);
    this.emit('agent:unregistered', { agentId, agent });
  }

  /**
   * Submit a task to the coordination system
   */
  async submitTask(
    taskInfo: Omit<TaskInfo, 'id' | 'status' | 'createdAt' | 'attempts'>
  ): Promise<string> {
    const taskId = `task-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const task: TaskInfo = {
      ...taskInfo,
      id: taskId,
      status: 'queued',
      createdAt: new Date().toISOString(),
      attempts: 0,
    };

    this.tasks.set(taskId, task);

    // Store task in Redis
    await this.redis.hSet(`task:${taskId}`, {
      type: task.type,
      priority: task.priority.toString(),
      sessionId: task.sessionId,
      requiredCapabilities: JSON.stringify(task.requiredCapabilities),
      estimatedDuration: task.estimatedDuration.toString(),
      deadline: task.deadline || '',
      status: task.status,
      createdAt: task.createdAt,
      attempts: task.attempts.toString(),
      maxAttempts: task.maxAttempts.toString(),
      metadata: JSON.stringify(task.metadata),
    });

    // Add to priority queue
    await this.redis.zAdd('task:priority:queue', {
      score: task.priority,
      value: taskId,
    });

    this.emit('task:submitted', task);

    // Try to assign immediately
    await this.assignTasks();

    return taskId;
  }

  /**
   * Assign tasks to available agents using load balancing
   */
  async assignTasks(): Promise<void> {
    const queuedTasks = await this.getQueuedTasks();
    const availableAgents = await this.getAvailableAgents();

    for (const task of queuedTasks) {
      const suitableAgents = this.findSuitableAgents(task, availableAgents);
      if (suitableAgents.length === 0) continue;

      const selectedAgent = this.selectAgent(suitableAgents, task);
      if (selectedAgent) {
        await this.assignTaskToAgent(task.id, selectedAgent.id);
      }
    }
  }

  /**
   * Assign a specific task to a specific agent
   */
  async assignTaskToAgent(taskId: string, agentId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    const agent = this.agents.get(agentId);

    if (!task || !agent) {
      throw new Error(`Task ${taskId} or agent ${agentId} not found`);
    }

    if (agent.status !== 'active' && agent.status !== 'idle') {
      throw new Error(`Agent ${agentId} is not available for task assignment`);
    }

    // Update task
    task.assignedAgent = agentId;
    task.status = 'assigned';
    task.assignedAt = new Date().toISOString();
    task.attempts++;

    // Update agent
    agent.load += 1;
    agent.currentSessions.push(task.sessionId);
    if (agent.load >= agent.maxLoad) {
      agent.status = 'busy';
    }

    // Update in Redis
    await Promise.all([
      this.redis.hSet(`task:${taskId}`, {
        assignedAgent: agentId,
        status: task.status,
        assignedAt: task.assignedAt,
        attempts: task.attempts.toString(),
      }),
      this.redis.hSet(`agent:${agentId}`, {
        load: agent.load.toString(),
        status: agent.status,
        currentSessions: JSON.stringify(agent.currentSessions),
      }),
      this.redis.zRem('task:priority:queue', taskId),
      this.redis.zAdd('task:assigned:queue', {
        score: Date.now(),
        value: taskId,
      }),
    ]);

    this.emit('task:assigned', { task, agent });
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string, result?: any): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task || !task.assignedAgent) {
      throw new Error(`Task ${taskId} not found or not assigned`);
    }

    const agent = this.agents.get(task.assignedAgent);
    if (!agent) {
      throw new Error(`Agent ${task.assignedAgent} not found`);
    }

    // Update task
    task.status = 'completed';
    task.completedAt = new Date().toISOString();

    // Update agent metrics
    agent.load = Math.max(0, agent.load - 1);
    agent.currentSessions = agent.currentSessions.filter(
      (s) => s !== task.sessionId
    );
    agent.totalTasksCompleted++;

    if (task.assignedAt) {
      const duration =
        new Date(task.completedAt).getTime() -
        new Date(task.assignedAt).getTime();
      agent.averageTaskDuration =
        (agent.averageTaskDuration * (agent.totalTasksCompleted - 1) +
          duration) /
        agent.totalTasksCompleted;
    }

    if (agent.status === 'busy' && agent.load < agent.maxLoad) {
      agent.status = 'active';
    }

    // Update in Redis
    await Promise.all([
      this.redis.hSet(`task:${taskId}`, {
        status: task.status,
        completedAt: task.completedAt,
        result: result ? JSON.stringify(result) : '',
      }),
      this.redis.hSet(`agent:${agent.id}`, {
        load: agent.load.toString(),
        status: agent.status,
        currentSessions: JSON.stringify(agent.currentSessions),
        totalTasksCompleted: agent.totalTasksCompleted.toString(),
        averageTaskDuration: agent.averageTaskDuration.toString(),
      }),
      this.redis.zRem('task:assigned:queue', taskId),
    ]);

    this.emit('task:completed', { task, agent, result });

    // Try to assign more tasks
    await this.assignTasks();
  }

  /**
   * Fail a task
   */
  async failTask(taskId: string, error: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task || !task.assignedAgent) {
      throw new Error(`Task ${taskId} not found or not assigned`);
    }

    const agent = this.agents.get(task.assignedAgent);
    if (agent) {
      // Update agent error rate
      const totalTasks = agent.totalTasksCompleted + 1;
      agent.errorRate =
        (agent.errorRate * agent.totalTasksCompleted + 1) / totalTasks;

      // Reduce agent load
      agent.load = Math.max(0, agent.load - 1);
      agent.currentSessions = agent.currentSessions.filter(
        (s) => s !== task.sessionId
      );

      if (agent.status === 'busy' && agent.load < agent.maxLoad) {
        agent.status = 'active';
      }

      await this.redis.hSet(`agent:${agent.id}`, {
        load: agent.load.toString(),
        status: agent.status,
        currentSessions: JSON.stringify(agent.currentSessions),
        errorRate: agent.errorRate.toString(),
      });
    }

    // Check if task should be retried
    if (task.attempts < task.maxAttempts) {
      // Retry task
      task.status = 'queued';
      task.assignedAgent = undefined;
      task.assignedAt = undefined;

      await Promise.all([
        this.redis.hSet(`task:${taskId}`, {
          status: task.status,
          assignedAgent: '',
          assignedAt: '',
        }),
        this.redis.zRem('task:assigned:queue', taskId),
        this.redis.zAdd('task:priority:queue', {
          score: task.priority,
          value: taskId,
        }),
      ]);

      this.emit('task:retry', { task, error });
    } else {
      // Mark as failed
      task.status = 'failed';

      await Promise.all([
        this.redis.hSet(`task:${taskId}`, {
          status: task.status,
          error,
        }),
        this.redis.zRem('task:assigned:queue', taskId),
      ]);

      this.emit('task:failed', { task, error });
    }

    // Try to assign more tasks
    await this.assignTasks();
  }

  /**
   * Initiate agent handoff
   */
  async initiateHandoff(handoffContext: HandoffContext): Promise<void> {
    const fromAgent = this.agents.get(handoffContext.fromAgent);
    const toAgent = this.agents.get(handoffContext.toAgent);

    if (!fromAgent || !toAgent) {
      throw new Error('Source or target agent not found');
    }

    if (toAgent.status !== 'active' && toAgent.status !== 'idle') {
      throw new Error('Target agent is not available for handoff');
    }

    // Store handoff context in Redis
    const handoffId = `handoff-${Date.now()}`;
    await this.redis.hSet(`handoff:${handoffId}`, {
      sessionId: handoffContext.sessionId,
      fromAgent: handoffContext.fromAgent,
      toAgent: handoffContext.toAgent,
      reason: handoffContext.reason,
      context: JSON.stringify(handoffContext.context),
      timestamp: handoffContext.timestamp,
      priority: handoffContext.priority.toString(),
      estimatedDuration: handoffContext.estimatedDuration?.toString() || '',
    });

    // Update agent sessions
    fromAgent.currentSessions = fromAgent.currentSessions.filter(
      (s) => s !== handoffContext.sessionId
    );
    toAgent.currentSessions.push(handoffContext.sessionId);

    // Update loads
    fromAgent.load = Math.max(0, fromAgent.load - 1);
    toAgent.load += 1;

    // Update status
    if (fromAgent.status === 'busy' && fromAgent.load < fromAgent.maxLoad) {
      fromAgent.status = 'active';
    }
    if (toAgent.load >= toAgent.maxLoad) {
      toAgent.status = 'busy';
    }

    // Update in Redis
    await Promise.all([
      this.redis.hSet(`agent:${fromAgent.id}`, {
        load: fromAgent.load.toString(),
        status: fromAgent.status,
        currentSessions: JSON.stringify(fromAgent.currentSessions),
      }),
      this.redis.hSet(`agent:${toAgent.id}`, {
        load: toAgent.load.toString(),
        status: toAgent.status,
        currentSessions: JSON.stringify(toAgent.currentSessions),
      }),
    ]);

    this.emit('handoff:initiated', handoffContext);
  }

  /**
   * Send heartbeat for an agent
   */
  async sendHeartbeat(
    agentId: string,
    status?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.lastHeartbeat = new Date().toISOString();
    if (status) agent.status = status as any;
    if (metadata) agent.metadata = { ...agent.metadata, ...metadata };

    await this.redis.hSet(`agent:${agentId}`, {
      lastHeartbeat: agent.lastHeartbeat,
      status: agent.status,
      metadata: JSON.stringify(agent.metadata),
    });

    this.emit('agent:heartbeat', { agentId, agent });
  }

  /**
   * Get coordination metrics
   */
  async getMetrics(): Promise<CoordinationMetrics> {
    const totalAgents = this.agents.size;
    const activeAgents = Array.from(this.agents.values()).filter(
      (a) => a.status === 'active' || a.status === 'busy'
    ).length;

    const queuedTasks = await this.redis.zCard('task:priority:queue');
    const runningTasks = await this.redis.zCard('task:assigned:queue');

    const allTasks = Array.from(this.tasks.values());
    const completedTasks = allTasks.filter(
      (t) => t.status === 'completed'
    ).length;
    const failedTasks = allTasks.filter((t) => t.status === 'failed').length;

    const totalDuration = Array.from(this.agents.values()).reduce(
      (sum, a) => sum + a.averageTaskDuration,
      0
    );
    const averageTaskDuration =
      activeAgents > 0 ? totalDuration / activeAgents : 0;

    const totalLoad = Array.from(this.agents.values()).reduce(
      (sum, a) => sum + a.load,
      0
    );
    const totalCapacity = Array.from(this.agents.values()).reduce(
      (sum, a) => sum + a.maxLoad,
      0
    );
    const systemLoad = totalCapacity > 0 ? totalLoad / totalCapacity : 0;

    const deadAgentCount = Array.from(this.agents.values()).filter(
      (a) => a.status === 'dead'
    ).length;
    const handoffCount = (await this.redis.zCard('handoff:*')) || 0;

    return {
      totalAgents,
      activeAgents,
      queuedTasks,
      runningTasks,
      completedTasks,
      failedTasks,
      averageTaskDuration,
      systemLoad,
      deadAgentCount,
      handoffCount,
    };
  }

  /**
   * Get queued tasks sorted by priority
   */
  private async getQueuedTasks(): Promise<TaskInfo[]> {
    const taskIds = await this.redis.zRange('task:priority:queue', 0, -1, {
      REV: true,
    });
    return taskIds
      .map((id) => this.tasks.get(id))
      .filter(Boolean) as TaskInfo[];
  }

  /**
   * Get available agents
   */
  private async getAvailableAgents(): Promise<AgentInfo[]> {
    return Array.from(this.agents.values()).filter(
      (agent) =>
        (agent.status === 'active' || agent.status === 'idle') &&
        agent.load < agent.maxLoad
    );
  }

  /**
   * Find suitable agents for a task
   */
  private findSuitableAgents(
    task: TaskInfo,
    availableAgents: AgentInfo[]
  ): AgentInfo[] {
    return availableAgents.filter((agent) => {
      // Check capabilities
      const hasRequiredCapabilities = task.requiredCapabilities.every((cap) =>
        agent.capabilities.includes(cap)
      );

      // Check if agent can handle the estimated duration
      const canHandleDuration =
        !task.deadline ||
        new Date(task.deadline).getTime() > Date.now() + task.estimatedDuration;

      return hasRequiredCapabilities && canHandleDuration;
    });
  }

  /**
   * Select best agent using load balancing strategy
   */
  private selectAgent(
    suitableAgents: AgentInfo[],
    task: TaskInfo
  ): AgentInfo | null {
    if (suitableAgents.length === 0) return null;

    switch (this.loadBalancingStrategy.type) {
      case 'round-robin':
        return this.selectAgentRoundRobin(suitableAgents);

      case 'least-loaded':
        return this.selectAgentLeastLoaded(suitableAgents);

      case 'priority-based':
        return this.selectAgentPriorityBased(suitableAgents);

      case 'capability-weighted':
        return this.selectAgentCapabilityWeighted(suitableAgents, task);

      case 'dynamic':
        return this.selectAgentDynamic(suitableAgents, task);

      default:
        return suitableAgents[0];
    }
  }

  /**
   * Round-robin agent selection
   */
  private selectAgentRoundRobin(agents: AgentInfo[]): AgentInfo {
    // Simple round-robin based on total tasks completed
    return agents.reduce((selected, current) =>
      current.totalTasksCompleted < selected.totalTasksCompleted
        ? current
        : selected
    );
  }

  /**
   * Least-loaded agent selection
   */
  private selectAgentLeastLoaded(agents: AgentInfo[]): AgentInfo {
    return agents.reduce((selected, current) => {
      const selectedLoadRatio = selected.load / selected.maxLoad;
      const currentLoadRatio = current.load / current.maxLoad;
      return currentLoadRatio < selectedLoadRatio ? current : selected;
    });
  }

  /**
   * Priority-based agent selection
   */
  private selectAgentPriorityBased(agents: AgentInfo[]): AgentInfo {
    return agents.reduce((selected, current) =>
      current.priority > selected.priority ? current : selected
    );
  }

  /**
   * Capability-weighted agent selection
   */
  private selectAgentCapabilityWeighted(
    agents: AgentInfo[],
    task: TaskInfo
  ): AgentInfo {
    return agents.reduce((selected, current) => {
      const selectedScore = this.calculateCapabilityScore(selected, task);
      const currentScore = this.calculateCapabilityScore(current, task);
      return currentScore > selectedScore ? current : selected;
    });
  }

  /**
   * Dynamic agent selection based on multiple factors
   */
  private selectAgentDynamic(agents: AgentInfo[], task: TaskInfo): AgentInfo {
    return agents.reduce((selected, current) => {
      const selectedScore = this.calculateDynamicScore(selected, task);
      const currentScore = this.calculateDynamicScore(current, task);
      return currentScore > selectedScore ? current : selected;
    });
  }

  /**
   * Calculate capability score for an agent
   */
  private calculateCapabilityScore(agent: AgentInfo, task: TaskInfo): number {
    const requiredCaps = new Set(task.requiredCapabilities);
    const agentCaps = new Set(agent.capabilities);
    const matchingCaps = task.requiredCapabilities.filter((cap) =>
      agentCaps.has(cap)
    ).length;
    const extraCaps = agent.capabilities.filter(
      (cap) => !requiredCaps.has(cap)
    ).length;

    return matchingCaps * 2 + extraCaps * 0.5;
  }

  /**
   * Calculate dynamic score considering multiple factors
   */
  private calculateDynamicScore(agent: AgentInfo, task: TaskInfo): number {
    const loadFactor = 1 - agent.load / agent.maxLoad;
    const priorityFactor = agent.priority / 10;
    const reliabilityFactor = 1 - agent.errorRate;
    const speedFactor =
      agent.averageTaskDuration > 0
        ? 1 / (agent.averageTaskDuration / 1000)
        : 1;
    const capabilityFactor = this.calculateCapabilityScore(agent, task) / 10;

    return (
      loadFactor * 0.3 +
      priorityFactor * 0.2 +
      reliabilityFactor * 0.2 +
      speedFactor * 0.15 +
      capabilityFactor * 0.15
    );
  }

  /**
   * Reassign tasks from a failed/dead agent
   */
  private async reassignAgentTasks(agentId: string): Promise<void> {
    const agentTasks = Array.from(this.tasks.values()).filter(
      (task) => task.assignedAgent === agentId && task.status === 'assigned'
    );

    for (const task of agentTasks) {
      task.status = 'queued';
      task.assignedAgent = undefined;
      task.assignedAt = undefined;

      await Promise.all([
        this.redis.hSet(`task:${task.id}`, {
          status: task.status,
          assignedAgent: '',
          assignedAt: '',
        }),
        this.redis.zRem('task:assigned:queue', task.id),
        this.redis.zAdd('task:priority:queue', {
          score: task.priority,
          value: task.id,
        }),
      ]);
    }

    this.emit('tasks:reassigned', { agentId, taskCount: agentTasks.length });
  }

  /**
   * Detect dead agents
   */
  private async detectDeadAgents(): Promise<void> {
    const now = Date.now();
    const timeout = this.deadAgentConfig.heartbeatTimeout * 1000;

    for (const agent of this.agents.values()) {
      const lastHeartbeat = new Date(agent.lastHeartbeat).getTime();
      const timeSinceHeartbeat = now - lastHeartbeat;

      if (timeSinceHeartbeat > timeout && agent.status !== 'dead') {
        agent.status = 'dead';

        // Reassign agent's tasks
        await this.reassignAgentTasks(agent.id);

        // Update in Redis
        await this.redis.hSet(`agent:${agent.id}`, {
          status: agent.status,
        });

        this.emit('agent:dead', { agentId: agent.id, timeSinceHeartbeat });

        // Schedule recovery if enabled
        if (this.deadAgentConfig.enableAutoRecovery) {
          setTimeout(() => {
            this.recoverDeadAgent(agent.id);
          }, this.deadAgentConfig.recoveryDelay * 1000);
        }
      }
    }
  }

  /**
   * Attempt to recover a dead agent
   */
  private async recoverDeadAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent || agent.status !== 'dead') return;

    // Try to ping the agent (implementation would depend on agent communication)
    try {
      // Send recovery signal to agent
      await this.redis.publish(`agent:${agentId}:recovery`, 'ping');

      this.emit('agent:recovery:attempted', { agentId });
    } catch (error) {
      this.emit('agent:recovery:failed', { agentId, error });
    }
  }

  /**
   * Initialize timers for various coordination tasks
   */
  private initializeTimers(): void {
    // Heartbeat monitoring timer
    this.deadAgentDetectionTimer = setInterval(() => {
      this.detectDeadAgents().catch((error) => {
        this.emit('error', error);
      });
    }, this.deadAgentConfig.heartbeatInterval * 1000);

    // Load balancing timer
    this.loadBalancingTimer = setInterval(() => {
      this.assignTasks().catch((error) => {
        this.emit('error', error);
      });
    }, 5000); // Every 5 seconds
  }

  /**
   * Shutdown coordination service
   */
  async shutdown(): Promise<void> {
    // Clear timers
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.loadBalancingTimer) clearInterval(this.loadBalancingTimer);
    if (this.deadAgentDetectionTimer)
      clearInterval(this.deadAgentDetectionTimer);

    // Unregister all agents
    for (const agentId of this.agents.keys()) {
      await this.unregisterAgent(agentId);
    }

    this.emit('shutdown');
  }
}

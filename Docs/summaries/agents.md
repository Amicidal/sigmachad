# Package: agents
Generated: 2025-09-23 07:06:53 PM EDT

## ⚠️ Quality Indicators

| Metric | Count | Status |
|--------|-------|--------|
| Total Warnings | 159 | ⚠️ |
| Critical Issues | 1 | ❌ |
| Stub Implementations | 0 | ✅ |
| Deception Risk | 0 | ✅ |
| Antipatterns | 22 | 🔍 |

### Notable Issues

#### 🔴 Critical Issues (1)
These are serious problems that could lead to security vulnerabilities or system failures:

- `agent-base.ts:48` - **Status check and modification aren't atomic - potential race condition**

#### ⚠️ Warnings (5)
Issues that should be addressed but aren't critical:

- `agent-base.ts:27` - Magic number should be extracted to a named constant
- `agent-base.ts:220` - External setter creates temporal coupling - consider constructor injection
- `agent-base.ts:271` - Direct console.log in class - use proper logging abstraction
- `coordinator.ts:563` - Direct console.log in class - use proper logging abstraction
- `registry.ts:406` - Direct console.log in class - use proper logging abstraction

#### 🔍 Code Antipatterns (22)
Design and architecture issues that should be refactored:

- `agent-base.ts:27` - **Magic number should be extracted to a named constant** [magic-number]
- `agent-base.ts:41` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `agent-base.ts:48` - **Status check and modification aren't atomic - potential race condition** [race-condition]
- `agent-base.ts:130` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `agent-base.ts:141` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `agent-base.ts:152` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `agent-base.ts:201` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `agent-base.ts:209` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `agent-base.ts:220` - **External setter creates temporal coupling - consider constructor injection** [temporal-coupling]
- `agent-base.ts:271` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `coordinator.ts:424` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `coordinator.ts:433` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `coordinator.ts:437` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `coordinator.ts:441` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `coordinator.ts:563` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `index.ts:102` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `index.ts:111` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `registry.ts:83` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `registry.ts:120` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `registry.ts:307` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `registry.ts:364` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `registry.ts:406` - **Direct console.log in class - use proper logging abstraction** [direct-console]

#### ℹ️ Informational
153 minor issues found (console.log usage, magic numbers, etc.) - not shown for brevity

#### 📖 Issue Types Explained

- **not-implemented-stub**: Function exists but just throws 'Not implemented' error
- **todo-comments**: Code marked with TODO/FIXME indicating incomplete work
- **hardcoded-credentials**: Passwords or API keys hardcoded in source
- **test-environment-bypass**: Code skips logic in tests - tests don't test real behavior!
- **always-true-validation**: Validation function that always returns true without checking
- **silent-error-handler**: Catches errors but doesn't log or handle them
- **unhandled-async-rejection**: Async function without try-catch error handling
- **sql-string-concatenation**: SQL queries built with string concat (injection risk)
- **unsafe-property-access**: Accessing nested properties without null checks
- **deceptive-security-function**: Security function that doesn't actually secure anything
- **console-log-in-production**: Using console.log instead of proper logging
- **empty-function**: Function defined but has no implementation
- **magic-numbers**: Unexplained numeric constants in code

---

## Code Summary (Comments Stripped)

This file is a merged representation of the entire codebase, combined into a single document by Repomix.
The content has been processed where comments have been removed.

================================================================
File Summary
================================================================

Purpose:
--------
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

File Format:
------------
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Multiple file entries, each consisting of:
  a. A separator line (================)
  b. The file path (File: path/to/file)
  c. Another separator line
  d. The full contents of the file
  e. A blank line

Usage Guidelines:
-----------------
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

Notes:
------
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Code comments have been removed from supported file types
- Files are sorted by Git change count (files with more changes are at the bottom)

Additional Info:
----------------

================================================================
Directory Structure
================================================================
agent-base.ts
coordinator.ts
index.ts
registry.ts
security-fix-agent.ts
types.ts

================================================================
Files
================================================================

================
File: agent-base.ts
================
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






export abstract class BaseAgent extends EventEmitter implements IAgent {
  private _status: AgentStatus = 'idle';
  private _tasksCompleted = 0;
  private _startTime = Date.now();
  private _lastError?: Error;
  private _currentTask?: AgentTask;
  private _coordinator?: any;

  constructor(public readonly metadata: AgentMetadata) {
    super();
    this.setMaxListeners(100);
  }

  get status(): AgentStatus {
    return this._status;
  }





  async initialize(config?: Record<string, any>): Promise<void> {
    this._status = 'idle';
    await this.onInitialize(config);
    this.emit('initialized', { agentId: this.metadata.id, config });
  }




  async execute(task: AgentTask): Promise<AgentResult> {
    if (this._status === 'running') {
      throw new Error(`Agent ${this.metadata.id} is already running a task`);
    }

    this._status = 'running';
    this._currentTask = task;
    const startTime = new Date();

    try {

      await this.emitAgentEvent(AgentEventTypes.TASK_STARTED, {
        taskId: task.id,
        agentId: this.metadata.id,
        task
      });


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


      await this.emitAgentEvent(AgentEventTypes.TASK_FAILED, {
        taskId: task.id,
        agentId: this.metadata.id,
        error: this._lastError,
        result
      });

      throw this._lastError;
    }
  }




  async pause(): Promise<void> {
    if (this._status === 'running') {
      this._status = 'paused';
      await this.onPause();
      this.emit('paused', { agentId: this.metadata.id });
    }
  }




  async resume(): Promise<void> {
    if (this._status === 'paused') {
      this._status = 'running';
      await this.onResume();
      this.emit('resumed', { agentId: this.metadata.id });
    }
  }




  async stop(): Promise<void> {
    this._status = 'idle';
    this._currentTask = undefined;
    await this.onStop();
    this.emit('stopped', { agentId: this.metadata.id });
    this.removeAllListeners();
  }




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




  async emitEvent(type: string, data: any): Promise<void> {
    await this.emitAgentEvent(type, data);
  }




  private async emitAgentEvent(type: string, data: any): Promise<void> {
    const event: AgentEvent = {
      id: `${this.metadata.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      agentId: this.metadata.id,
      timestamp: new Date(),
      data
    };


    super.emit(type, event);


    if (this._coordinator) {
      await this._coordinator.forwardEvent(event);
    }
  }




  setCoordinator(coordinator: any): void {
    this._coordinator = coordinator;
  }






  protected abstract onInitialize(config?: Record<string, any>): Promise<void>;




  protected abstract executeTask(task: AgentTask): Promise<any>;




  protected abstract onPause(): Promise<void>;




  protected abstract onResume(): Promise<void>;




  protected abstract onStop(): Promise<void>;




  protected abstract handleEvent(event: AgentEvent): Promise<void>;






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




  protected canHandle(task: AgentTask): boolean {
    return task.type === this.metadata.type;
  }




  protected getCurrentTask(): AgentTask | undefined {
    return this._currentTask;
  }




  protected async updateSharedState(key: string, value: any, sessionId?: string): Promise<void> {
    if (this._coordinator) {
      await this._coordinator.updateSharedState(this.metadata.id, key, value, sessionId);
    }
  }




  protected async getSharedState(key: string, sessionId?: string): Promise<any> {
    if (this._coordinator) {
      return await this._coordinator.getSharedState(key, sessionId);
    }
    return undefined;
  }
}

================
File: coordinator.ts
================
import { EventEmitter } from 'events';
import {
  AgentEvent,
  AgentTask,
  AgentResult,
  CoordinationContext,
  CoordinatorConfig,
  AgentEventTypes,
  AgentType
} from './types.js';
import { AgentRegistry } from './registry.js';





export class AgentCoordinator extends EventEmitter {
  private registry: AgentRegistry;
  private contexts = new Map<string, CoordinationContext>();
  private eventBuffer = new Map<string, AgentEvent[]>();
  private redisClient?: any;
  private cleanupTimer?: NodeJS.Timeout;

  private readonly config: Required<CoordinatorConfig>;

  constructor(registry: AgentRegistry, config: CoordinatorConfig = {}) {
    super();
    this.registry = registry;
    this.config = {
      redis: config.redis,
      sessionTtl: config.sessionTtl ?? 3600,
      eventBuffer: config.eventBuffer ?? 1000,
      pubSubChannels: config.pubSubChannels ?? {
        events: 'agent:events',
        coordination: 'agent:coordination',
        heartbeat: 'agent:heartbeat'
      }
    };


    this.registry.setCoordinator(this);


    this.setupRegistryEventForwarding();


    this.startContextCleanup();


    if (this.config.redis) {
      this.initializeRedis();
    }
  }




  async createSession(
    sessionId: string,
    initiatorId: string,
    participants: string[] = [],
    sharedState: Record<string, any> = {},
    ttl?: number
  ): Promise<CoordinationContext> {
    if (this.contexts.has(sessionId)) {
      throw new Error(`Coordination session ${sessionId} already exists`);
    }

    const context: CoordinationContext = {
      sessionId,
      initiatorId,
      participants: [...participants, initiatorId],
      sharedState,
      events: [],
      ttl: ttl ?? this.config.sessionTtl
    };

    this.contexts.set(sessionId, context);
    this.eventBuffer.set(sessionId, []);


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




  async joinSession(sessionId: string, agentId: string): Promise<CoordinationContext> {
    const context = this.contexts.get(sessionId);
    if (!context) {
      throw new Error(`Coordination session ${sessionId} not found`);
    }

    if (!context.participants.includes(agentId)) {
      context.participants.push(agentId);


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




  async leaveSession(sessionId: string, agentId: string): Promise<void> {
    const context = this.contexts.get(sessionId);
    if (!context) {
      return;
    }

    const index = context.participants.indexOf(agentId);
    if (index > -1) {
      context.participants.splice(index, 1);


      await this.broadcastEvent({
        id: `session-${sessionId}-leave-${Date.now()}`,
        type: 'session:left',
        agentId: 'coordinator',
        sessionId,
        timestamp: new Date(),
        data: { leftAgentId: agentId, participants: context.participants }
      });

      this.log('info', `Agent ${agentId} left session: ${sessionId}`);


      if (context.participants.length === 0) {
        await this.endSession(sessionId);
      }
    }
  }




  async endSession(sessionId: string): Promise<void> {
    const context = this.contexts.get(sessionId);
    if (!context) {
      return;
    }


    await this.broadcastEvent({
      id: `session-${sessionId}-end-${Date.now()}`,
      type: 'session:ended',
      agentId: 'coordinator',
      sessionId,
      timestamp: new Date(),
      data: { context }
    });


    this.contexts.delete(sessionId);
    this.eventBuffer.delete(sessionId);

    this.log('info', `Ended coordination session: ${sessionId}`);
  }




  async orchestrate(
    sessionId: string,
    tasks: AgentTask[],
    options: {
      parallel?: boolean;
      timeout?: number;
      retryAttempts?: number;
    } = {}
  ): Promise<AgentResult[]> {
    const { parallel = false, timeout = 300000, retryAttempts = 3 } = options;


    if (!this.contexts.has(sessionId)) {
      await this.createSession(sessionId, 'coordinator');
    }

    this.log('info', `Starting orchestration for session ${sessionId}`, {
      taskCount: tasks.length,
      parallel,
      timeout
    });

    const results: AgentResult[] = [];

    try {
      if (parallel) {

        const taskPromises = tasks.map(task => this.executeTaskWithRetry(task, retryAttempts, timeout));
        const parallelResults = await Promise.all(taskPromises);
        results.push(...parallelResults);
      } else {

        for (const task of tasks) {
          const result = await this.executeTaskWithRetry(task, retryAttempts, timeout);
          results.push(result);


          if (result.status === 'failed') {
            this.log('warn', `Task ${task.id} failed, stopping sequential execution`);
            break;
          }
        }
      }


      await this.updateSharedState('coordinator', 'orchestration_results', results, sessionId);

      return results;

    } catch (error) {
      this.log('error', `Orchestration failed for session ${sessionId}:`, error);
      throw error;
    }
  }




  private async executeTaskWithRetry(
    task: AgentTask,
    retryAttempts: number,
    timeout: number
  ): Promise<AgentResult> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        return await this.executeTask(task, timeout);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.log('warn', `Task ${task.id} failed (attempt ${attempt}/${retryAttempts}):`, lastError);

        if (attempt < retryAttempts) {

          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }


    throw lastError || new Error(`Task ${task.id} failed after ${retryAttempts} attempts`);
  }




  private async executeTask(task: AgentTask, timeout: number): Promise<AgentResult> {

    const availableAgents = this.registry.findAvailableAgents(task.type, 1);

    if (availableAgents.length === 0) {
      throw new Error(`No available agents found for task type: ${task.type}`);
    }

    const agent = availableAgents[0];


    return new Promise<AgentResult>((resolve, reject) => {
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




  async forwardEvent(event: AgentEvent): Promise<void> {

    if (event.sessionId) {
      const buffer = this.eventBuffer.get(event.sessionId);
      if (buffer) {
        buffer.push(event);


        if (buffer.length > this.config.eventBuffer) {
          buffer.splice(0, buffer.length - this.config.eventBuffer);
        }
      }
    }


    await this.broadcastEvent(event);


    if (this.redisClient) {
      await this.publishToRedis(this.config.pubSubChannels.events, event);
    }
  }




  async updateSharedState(
    agentId: string,
    key: string,
    value: any,
    sessionId?: string
  ): Promise<void> {
    if (!sessionId) {

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


    await this.broadcastEvent({
      id: `state-update-${sessionId}-${Date.now()}`,
      type: AgentEventTypes.STATE_UPDATED,
      agentId,
      sessionId,
      timestamp: new Date(),
      data: { key, value, sharedState: context.sharedState }
    });
  }




  async getSharedState(key: string, sessionId?: string): Promise<any> {
    sessionId = sessionId || 'default';
    const context = this.contexts.get(sessionId);

    if (!context) {
      return undefined;
    }

    return context.sharedState[key];
  }




  getSessionEvents(sessionId: string): AgentEvent[] {
    return this.eventBuffer.get(sessionId) || [];
  }




  getActiveSessions(): CoordinationContext[] {
    return Array.from(this.contexts.values());
  }




  private async broadcastEvent(event: AgentEvent): Promise<void> {
    const context = event.sessionId ? this.contexts.get(event.sessionId) : null;

    if (context) {

      for (const agentId of context.participants) {
        if (agentId !== event.agentId) {
          const agent = this.registry.getAgent(agentId);
          if (agent) {
            try {
              await agent.onEvent(event);
            } catch (error) {
              this.log('warn', `Error sending event to agent ${agentId}:`, error);
            }
          }
        }
      }
    } else {

      const allAgents = this.registry.getActiveAgents();
      for (const agent of allAgents) {
        if (agent.metadata.id !== event.agentId) {
          try {
            await agent.onEvent(event);
          } catch (error) {
            this.log('warn', `Error broadcasting event to agent ${agent.metadata.id}:`, error);
          }
        }
      }
    }


    this.emit('event', event);
  }




  private setupRegistryEventForwarding(): void {

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




  private startContextCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredContexts();
    }, 60000);
  }




  private cleanupExpiredContexts(): void {
    const now = Date.now();
    const sessionsToEnd: string[] = [];

    for (const [sessionId, context] of this.contexts.entries()) {

      const contextAge = now - new Date(context.events[0]?.timestamp || now).getTime();

      if (contextAge > context.ttl * 1000) {
        sessionsToEnd.push(sessionId);
      }
    }


    for (const sessionId of sessionsToEnd) {
      this.endSession(sessionId).catch(error => {
        this.log('error', `Error ending expired session ${sessionId}:`, error);
      });
    }

    if (sessionsToEnd.length > 0) {
      this.log('info', `Cleaned up ${sessionsToEnd.length} expired sessions`);
    }
  }




  private async initializeRedis(): Promise<void> {
    if (!this.config.redis) return;

    try {


      this.log('info', 'Redis coordination enabled', this.config.redis);













    } catch (error) {
      this.log('error', 'Failed to initialize Redis:', error);
    }
  }




  private async publishToRedis(channel: string, data: any): Promise<void> {
    if (!this.redisClient) return;

    try {

      this.log('debug', `Published to Redis channel ${channel}`, data);
    } catch (error) {
      this.log('error', `Error publishing to Redis channel ${channel}:`, error);
    }
  }




  async shutdown(): Promise<void> {
    this.log('info', 'Shutting down agent coordinator...');


    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }


    const activeSessions = Array.from(this.contexts.keys());
    for (const sessionId of activeSessions) {
      await this.endSession(sessionId);
    }


    if (this.redisClient) {

      this.log('info', 'Redis connection closed');
    }

    this.log('info', 'Agent coordinator shutdown complete');
  }




  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any): void {
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

================
File: index.ts
================
export { BaseAgent } from './agent-base.js';
export { AgentRegistry } from './registry.js';
export { AgentCoordinator } from './coordinator.js';


import { AgentRegistry } from './registry.js';
import { AgentCoordinator } from './coordinator.js';


export type {

  AgentType,
  AgentStatus,
  AgentMetadata,
  AgentTask,
  AgentResult,
  AgentEvent,
  AgentEventType,


  CoordinationContext,
  AgentRegistration,


  RegistryConfig,
  CoordinatorConfig,


  IAgent
} from './types.js';


export { AgentEventTypes } from './types.js';




export function createAgentSystem(config?: {
  registry?: import('./types.js').RegistryConfig;
  coordinator?: import('./types.js').CoordinatorConfig;
}) {
  const registry = new AgentRegistry(config?.registry);
  const coordinator = new AgentCoordinator(registry, config?.coordinator);

  return { registry, coordinator };
}




export function createSessionId(prefix = 'session'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}-${timestamp}-${random}`;
}




export function createTaskId(type: import('./types.js').AgentType, prefix = 'task'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 6);
  return `${prefix}-${type}-${timestamp}-${random}`;
}




export function createAgentId(type: import('./types.js').AgentType, instance = 1): string {
  return `${type}-agent-${instance}`;
}

================
File: registry.ts
================
import { EventEmitter } from 'events';
import {
  IAgent,
  AgentRegistration,
  AgentMetadata,
  AgentType,
  AgentStatus,
  RegistryConfig,
  AgentEventTypes
} from './types.js';





export class AgentRegistry extends EventEmitter {
  private agents = new Map<string, AgentRegistration>();
  private agentsByType = new Map<AgentType, Set<string>>();
  private heartbeatTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;
  private coordinator?: any;

  private readonly config: Required<RegistryConfig>;

  constructor(config: RegistryConfig = {}) {
    super();
    this.config = {
      maxAgents: config.maxAgents ?? 100,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
      cleanupInterval: config.cleanupInterval ?? 60000,
      staleTimeout: config.staleTimeout ?? 120000
    };

    this.startHeartbeatMonitoring();
    this.startCleanupMonitoring();
  }




  async register(agent: IAgent): Promise<void> {
    const { id, type } = agent.metadata;


    if (this.agents.has(id)) {
      throw new Error(`Agent with ID ${id} is already registered`);
    }


    if (this.agents.size >= this.config.maxAgents) {
      throw new Error(`Maximum number of agents (${this.config.maxAgents}) reached`);
    }


    this.validateAgentMetadata(agent.metadata);


    const registration: AgentRegistration = {
      metadata: agent.metadata,
      instance: agent,
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
      isActive: true
    };


    this.agents.set(id, registration);


    if (!this.agentsByType.has(type)) {
      this.agentsByType.set(type, new Set());
    }
    this.agentsByType.get(type)!.add(id);


    if (this.coordinator) {
      agent.setCoordinator(this.coordinator);
    }


    this.setupAgentEventForwarding(agent);

    this.emit(AgentEventTypes.AGENT_REGISTERED, {
      agentId: id,
      metadata: agent.metadata,
      timestamp: new Date()
    });

    this.log('info', `Agent registered: ${id} (${type})`);
  }




  async unregister(agentId: string): Promise<void> {
    const registration = this.agents.get(agentId);
    if (!registration) {
      throw new Error(`Agent ${agentId} is not registered`);
    }


    try {
      await registration.instance.stop();
    } catch (error) {
      this.log('warn', `Error stopping agent ${agentId}:`, error);
    }


    const typeSet = this.agentsByType.get(registration.metadata.type);
    if (typeSet) {
      typeSet.delete(agentId);
      if (typeSet.size === 0) {
        this.agentsByType.delete(registration.metadata.type);
      }
    }


    this.agents.delete(agentId);

    this.emit(AgentEventTypes.AGENT_UNREGISTERED, {
      agentId,
      metadata: registration.metadata,
      timestamp: new Date()
    });

    this.log('info', `Agent unregistered: ${agentId}`);
  }




  getAgent(agentId: string): IAgent | undefined {
    return this.agents.get(agentId)?.instance;
  }




  getAgentMetadata(agentId: string): AgentMetadata | undefined {
    return this.agents.get(agentId)?.metadata;
  }




  getAgentsByType(type: AgentType): IAgent[] {
    const agentIds = this.agentsByType.get(type);
    if (!agentIds) {
      return [];
    }

    return Array.from(agentIds)
      .map(id => this.agents.get(id)?.instance)
      .filter((agent): agent is IAgent => agent !== undefined);
  }




  getActiveAgents(): IAgent[] {
    return Array.from(this.agents.values())
      .filter(reg => reg.isActive)
      .map(reg => reg.instance);
  }




  getAllRegistrations(): AgentRegistration[] {
    return Array.from(this.agents.values());
  }




  findAvailableAgents(type: AgentType, count: number = 1): IAgent[] {
    const agents = this.getAgentsByType(type);
    const available = agents.filter(agent => agent.status === 'idle');
    return available.slice(0, count);
  }




  getStats(): {
    totalAgents: number;
    activeAgents: number;
    agentsByType: Record<AgentType, number>;
    agentsByStatus: Record<AgentStatus, number>;
  } {
    const agentsByType: Record<string, number> = {};
    const agentsByStatus: Record<string, number> = {};

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
      agentsByType: agentsByType as Record<AgentType, number>,
      agentsByStatus: agentsByStatus as Record<AgentStatus, number>
    };
  }




  updateHeartbeat(agentId: string): void {
    const registration = this.agents.get(agentId);
    if (registration) {
      registration.lastHeartbeat = new Date();
      registration.isActive = true;
    }
  }




  setCoordinator(coordinator: any): void {
    this.coordinator = coordinator;


    for (const registration of this.agents.values()) {
      registration.instance.setCoordinator(coordinator);
    }
  }




  async shutdown(): Promise<void> {
    this.log('info', 'Shutting down agent registry...');


    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }


    const stopPromises = Array.from(this.agents.values()).map(async (registration) => {
      try {
        await registration.instance.stop();
      } catch (error) {
        this.log('warn', `Error stopping agent ${registration.metadata.id}:`, error);
      }
    });

    await Promise.all(stopPromises);


    this.agents.clear();
    this.agentsByType.clear();

    this.log('info', 'Agent registry shutdown complete');
  }




  private validateAgentMetadata(metadata: AgentMetadata): void {
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




  private setupAgentEventForwarding(agent: IAgent): void {

    const forwardEvent = (eventName: string) => {
      agent.on(eventName, (data) => {
        this.emit(eventName, {
          ...data,
          source: 'agent',
          agentId: agent.metadata.id
        });
      });
    };


    forwardEvent('initialized');
    forwardEvent('paused');
    forwardEvent('resumed');
    forwardEvent('stopped');
    forwardEvent(AgentEventTypes.TASK_STARTED);
    forwardEvent(AgentEventTypes.TASK_COMPLETED);
    forwardEvent(AgentEventTypes.TASK_FAILED);
    forwardEvent(AgentEventTypes.ERROR);
  }




  private startHeartbeatMonitoring(): void {
    this.heartbeatTimer = setInterval(() => {
      this.checkHeartbeats();
    }, this.config.heartbeatInterval);
  }




  private startCleanupMonitoring(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupStaleAgents();
    }, this.config.cleanupInterval);
  }




  private checkHeartbeats(): void {
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




  private async cleanupStaleAgents(): Promise<void> {
    const now = Date.now();
    const agentsToRemove: string[] = [];

    for (const [agentId, registration] of this.agents.entries()) {
      const timeSinceHeartbeat = now - registration.lastHeartbeat.getTime();


      if (!registration.isActive && timeSinceHeartbeat > this.config.staleTimeout * 2) {
        agentsToRemove.push(agentId);
      }
    }

    for (const agentId of agentsToRemove) {
      try {
        await this.unregister(agentId);
        this.log('info', `Cleaned up stale agent: ${agentId}`);
      } catch (error) {
        this.log('error', `Error cleaning up stale agent ${agentId}:`, error);
      }
    }
  }




  private log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
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

================
File: security-fix-agent.ts
================
import { BaseAgent } from './agent-base.js';
import { AgentMetadata, AgentTask, AgentEvent } from './types.js';
import { SecurityScanner } from '../../testing/src/security/scanner.js';
import { SecurityReports } from '../../testing/src/security/reports.js';
import * as fs from 'fs';
import * as path from 'path';

export interface SecurityFixTask {
  id: string;
  type: 'security-fix';
  issueId?: string;
  filePath?: string;
  ruleId?: string;
  severity?: string;
  autoFix?: boolean;
  dryRun?: boolean;
  priority: 'immediate' | 'high' | 'medium' | 'low';
}

export interface SecurityFixResult {
  issueId: string;
  filePath: string;
  ruleId: string;
  status: 'fixed' | 'partial' | 'failed' | 'skipped';
  fixes: SecurityFix[];
  rollbackData?: RollbackData;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

export interface SecurityFix {
  type: 'code-replacement' | 'configuration' | 'dependency-update' | 'manual-review';
  description: string;
  originalCode?: string;
  fixedCode?: string;
  explanation: string;
  confidence: number;
  testable: boolean;
}

export interface RollbackData {
  originalContent: string;
  backupPath: string;
  timestamp: Date;
  checksum: string;
}





export class SecurityFixAgent extends BaseAgent {
  private securityScanner: SecurityScanner;
  private securityReports: SecurityReports;
  private rollbackService: RollbackService;

  constructor(
    metadata: AgentMetadata,
    private db: any,
    private kgService: any,
    private rollbackConfig: any = {}
  ) {
    super(metadata);
    this.securityScanner = new SecurityScanner(this.db, this.kgService);
    this.securityReports = new SecurityReports(this.db);
    this.rollbackService = new RollbackService(rollbackConfig);
  }

  protected async onInitialize(config?: Record<string, any>): Promise<void> {
    await this.securityScanner.initialize();
    await this.securityReports.initialize();
    await this.rollbackService.initialize();

    this.log('info', 'SecurityFixAgent initialized', {
      config,
      capabilities: this.getCapabilities()
    });
  }

  protected async executeTask(task: AgentTask): Promise<SecurityFixResult> {
    const securityTask = task as SecurityFixTask;

    this.log('info', 'Executing security fix task', {
      taskId: task.id,
      issueId: securityTask.issueId,
      ruleId: securityTask.ruleId,
      autoFix: securityTask.autoFix
    });


    const issue = await this.getSecurityIssue(securityTask);
    if (!issue) {
      throw new Error(`Security issue not found: ${securityTask.issueId}`);
    }


    const fixSuggestion = await this.securityReports.generateSecurityFix(issue.id);
    const fixes = await this.generateFixes(issue, fixSuggestion);

    let result: SecurityFixResult = {
      issueId: issue.id,
      filePath: issue.metadata?.filePath || 'unknown',
      ruleId: issue.ruleId,
      status: 'skipped',
      fixes,
      confidence: this.calculateOverallConfidence(fixes),
      impact: this.assessImpact(issue)
    };


    if (securityTask.autoFix && !securityTask.dryRun) {
      result = await this.applyFixes(issue, fixes, result);
    }


    await this.emitEvent('security-fix-completed', {
      taskId: task.id,
      result,
      autoFixed: securityTask.autoFix && !securityTask.dryRun
    });

    return result;
  }

  protected async onPause(): Promise<void> {
    this.log('info', 'SecurityFixAgent paused');
  }

  protected async onResume(): Promise<void> {
    this.log('info', 'SecurityFixAgent resumed');
  }

  protected async onStop(): Promise<void> {
    this.log('info', 'SecurityFixAgent stopped');
  }

  protected async handleEvent(event: AgentEvent): Promise<void> {
    switch (event.type) {
      case 'security-scan-completed':
        await this.handleScanCompleted(event);
        break;

      case 'rollback-requested':
        await this.handleRollbackRequest(event);
        break;

      case 'security-issue-created':
        await this.handleNewSecurityIssue(event);
        break;

      default:
        this.log('info', 'Unhandled event', { eventType: event.type });
    }
  }

  private async getSecurityIssue(task: SecurityFixTask): Promise<any> {
    if (task.issueId) {

      const results = await this.db.falkordbQuery(
        'MATCH (i:SecurityIssue {id: $id}) RETURN i',
        { id: task.issueId }
      );
      return results.length > 0 ? results[0].i : null;
    }

    if (task.filePath && task.ruleId) {

      const results = await this.db.falkordbQuery(
        `MATCH (i:SecurityIssue {ruleId: $ruleId})
         WHERE i.filePath CONTAINS $filePath
         RETURN i
         ORDER BY i.severity DESC
         LIMIT 1`,
        { ruleId: task.ruleId, filePath: task.filePath }
      );
      return results.length > 0 ? results[0].i : null;
    }

    throw new Error('Insufficient task information to identify security issue');
  }

  private async generateFixes(issue: any, fixSuggestion: any): Promise<SecurityFix[]> {
    const fixes: SecurityFix[] = [];


    const fixTemplates = this.getFixTemplates();
    const template = fixTemplates[issue.ruleId];

    if (template) {

      const codeFix = await this.generateCodeFix(issue, template);
      if (codeFix) {
        fixes.push(codeFix);
      }


      const configFix = await this.generateConfigurationFix(issue, template);
      if (configFix) {
        fixes.push(configFix);
      }


      if (issue.ruleId.includes('DEPENDENCY')) {
        const depFix = await this.generateDependencyFix(issue, template);
        if (depFix) {
          fixes.push(depFix);
        }
      }
    }


    fixes.push({
      type: 'manual-review',
      description: 'Manual code review and fix required',
      explanation: fixSuggestion.fixes?.[0]?.explanation || issue.remediation,
      confidence: 0.5,
      testable: true
    });

    return fixes;
  }

  private async generateCodeFix(issue: any, template: any): Promise<SecurityFix | null> {
    try {
      const filePath = issue.metadata?.filePath;
      if (!filePath || !fs.existsSync(filePath)) {
        return null;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const lineIndex = Math.max(0, issue.lineNumber - 1);
      const originalLine = lines[lineIndex];


      const fixedLine = this.applySecurityTransformation(originalLine, issue.ruleId);

      if (fixedLine && fixedLine !== originalLine) {
        return {
          type: 'code-replacement',
          description: `Fix ${issue.ruleId} on line ${issue.lineNumber}`,
          originalCode: originalLine.trim(),
          fixedCode: fixedLine.trim(),
          explanation: template.explanation || issue.remediation,
          confidence: template.confidence || 0.8,
          testable: true
        };
      }
    } catch (error) {
      this.log('error', 'Failed to generate code fix', { issue: issue.id, error });
    }

    return null;
  }

  private async generateConfigurationFix(issue: any, template: any): Promise<SecurityFix | null> {

    const configFixes: Record<string, any> = {
      CORS_MISCONFIGURATION: {
        description: 'Configure CORS with specific origins',
        fixedCode: `// app.js\napp.use(cors({\n  origin: ['https://yourdomain.com'],\n  credentials: true\n}));`,
        explanation: 'Restrict CORS to specific trusted origins instead of using wildcard'
      },

      DEBUG_MODE_ENABLED: {
        description: 'Disable debug mode in production',
        fixedCode: `// Environment configuration\nNODE_ENV=production\nDEBUG=false`,
        explanation: 'Ensure debug mode is disabled in production environments'
      },

      WEAK_SESSION_CONFIG: {
        description: 'Configure secure session settings',
        fixedCode: `session({\n  secret: process.env.SESSION_SECRET,\n  secure: true,\n  httpOnly: true,\n  sameSite: 'strict'\n})`,
        explanation: 'Use secure session configuration with proper flags'
      }
    };

    const configFix = configFixes[issue.ruleId];
    if (configFix) {
      return {
        type: 'configuration',
        description: configFix.description,
        fixedCode: configFix.fixedCode,
        explanation: configFix.explanation,
        confidence: 0.9,
        testable: true
      };
    }

    return null;
  }

  private async generateDependencyFix(issue: any, template: any): Promise<SecurityFix | null> {

    if (issue.packageName && issue.fixedInVersion) {
      return {
        type: 'dependency-update',
        description: `Update ${issue.packageName} to ${issue.fixedInVersion}`,
        originalCode: `"${issue.packageName}": "${issue.version}"`,
        fixedCode: `"${issue.packageName}": "${issue.fixedInVersion}"`,
        explanation: `Update dependency to fix ${issue.vulnerabilityId}`,
        confidence: 0.95,
        testable: true
      };
    }

    return null;
  }

  private async applyFixes(
    issue: any,
    fixes: SecurityFix[],
    result: SecurityFixResult
  ): Promise<SecurityFixResult> {
    const applicableFixes = fixes.filter(fix =>
      fix.type !== 'manual-review' &&
      fix.confidence >= 0.7
    );

    if (applicableFixes.length === 0) {
      result.status = 'skipped';
      return result;
    }

    try {

      const rollbackData = await this.createRollbackData(issue.metadata?.filePath);
      result.rollbackData = rollbackData;

      let appliedFixes = 0;

      for (const fix of applicableFixes) {
        const applied = await this.applyIndividualFix(issue, fix);
        if (applied) {
          appliedFixes++;
        }
      }

      if (appliedFixes === applicableFixes.length) {
        result.status = 'fixed';
      } else if (appliedFixes > 0) {
        result.status = 'partial';
      } else {
        result.status = 'failed';
      }


      await this.verifyFix(issue, result);

      this.log('info', 'Security fixes applied', {
        issueId: issue.id,
        appliedFixes,
        totalFixes: applicableFixes.length,
        status: result.status
      });

    } catch (error) {
      result.status = 'failed';
      this.log('error', 'Failed to apply security fixes', {
        issueId: issue.id,
        error: error instanceof Error ? error.message : error
      });


      if (result.rollbackData) {
        await this.rollbackService.performRollback(result.rollbackData);
      }
    }

    return result;
  }

  private async applyIndividualFix(issue: any, fix: SecurityFix): Promise<boolean> {
    try {
      switch (fix.type) {
        case 'code-replacement':
          return await this.applyCodeReplacement(issue, fix);

        case 'configuration':
          return await this.applyConfigurationFix(issue, fix);

        case 'dependency-update':
          return await this.applyDependencyUpdate(issue, fix);

        default:
          return false;
      }
    } catch (error) {
      this.log('error', 'Failed to apply individual fix', {
        issueId: issue.id,
        fixType: fix.type,
        error
      });
      return false;
    }
  }

  private async applyCodeReplacement(issue: any, fix: SecurityFix): Promise<boolean> {
    const filePath = issue.metadata?.filePath;
    if (!filePath || !fix.originalCode || !fix.fixedCode) {
      return false;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const updatedContent = content.replace(fix.originalCode, fix.fixedCode);

      if (updatedContent !== content) {
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        this.log('info', 'Applied code replacement', {
          filePath,
          original: fix.originalCode,
          fixed: fix.fixedCode
        });
        return true;
      }
    } catch (error) {
      this.log('error', 'Code replacement failed', { filePath, error });
    }

    return false;
  }

  private async applyConfigurationFix(issue: any, fix: SecurityFix): Promise<boolean> {


    this.log('info', 'Configuration fix recommended', {
      issueId: issue.id,
      description: fix.description,
      recommendation: fix.fixedCode
    });
    return true;
  }

  private async applyDependencyUpdate(issue: any, fix: SecurityFix): Promise<boolean> {


    this.log('info', 'Dependency update recommended', {
      issueId: issue.id,
      description: fix.description,
      update: fix.fixedCode
    });
    return true;
  }

  private async createRollbackData(filePath: string): Promise<RollbackData> {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const backupPath = await this.rollbackService.createBackup(filePath, content);

    return {
      originalContent: content,
      backupPath,
      timestamp: new Date(),
      checksum: this.calculateChecksum(content)
    };
  }

  private async verifyFix(issue: any, result: SecurityFixResult): Promise<void> {

    try {
      const filePath = issue.metadata?.filePath;
      if (!filePath) return;

      const entities = [{
        id: path.basename(filePath),
        type: 'file',
        path: filePath
      }];

      const scanResult = await this.securityScanner.scan(entities, {
        includeSAST: true,
        includeSecrets: true,
        includeSCA: false,
        includeDependencies: false,
        includeCompliance: false,
        severityThreshold: 'info',
        confidenceThreshold: 0.5
      });


      const stillExists = scanResult.some(newIssue =>
        newIssue.ruleId === issue.ruleId &&
        Math.abs(newIssue.lineNumber - issue.lineNumber) <= 2
      );

      if (!stillExists) {
        this.log('info', 'Fix verification successful - issue resolved', {
          issueId: issue.id,
          ruleId: issue.ruleId
        });
      } else {
        this.log('warn', 'Fix verification failed - issue still present', {
          issueId: issue.id,
          ruleId: issue.ruleId
        });
        result.status = 'failed';
      }

    } catch (error) {
      this.log('error', 'Fix verification error', { issueId: issue.id, error });
    }
  }

  private applySecurityTransformation(line: string, ruleId: string): string | null {
    const transformations: Record<string, (line: string) => string> = {
      SQL_INJECTION: (line: string) => {

        return line
          .replace(/(['"])([^'"]*)\1\s*\+\s*(\w+)/g, '?, [$3]')
          .replace(/`([^`]*)\$\{([^}]+)\}([^`]*)`/g, '"$1?$3", [$2]');
      },

      XSS_VULNERABILITY: (line: string) => {
        // Transform innerHTML to textContent
        return line
          .replace(/\.innerHTML\s*=/g, '.textContent =')
          .replace(/\$\([^)]+\)\.html\(/g, '$(element).text(');
      },

      HARDCODED_SECRET: (line: string) => {
        // Transform hardcoded values to environment variables
        if (line.includes('=')) {
          const [left, right] = line.split('=', 2);
          const varName = left.trim().replace(/^(const|let|var)\s+/, '').toUpperCase();
          return `${left} = process.env.${varName};`;
        }
        return line;
      },

      WEAK_CRYPTO: (line: string) => {
        // Transform weak crypto algorithms
        return line
          .replace(/createHash\s*\(\s*['"]md5['"]\s*\)/g, "createHash('sha256')")
          .replace(/createHash\s*\(\s*['"]sha1['"]\s*\)/g, "createHash('sha256')");
      },

      INSECURE_RANDOM: (line: string) => {
        // Transform Math.random() to crypto.randomBytes()
        return line.replace(/Math\.random\(\)/g, 'crypto.randomBytes(16).toString("hex")');
      }
    };

    const transformer = transformations[ruleId];
    return transformer ? transformer(line) : null;
  }

  private calculateOverallConfidence(fixes: SecurityFix[]): number {
    if (fixes.length === 0) return 0;

    const totalConfidence = fixes.reduce((sum, fix) => sum + fix.confidence, 0);
    return totalConfidence / fixes.length;
  }

  private assessImpact(issue: any): 'high' | 'medium' | 'low' {
    switch (issue.severity) {
      case 'critical':
        return 'high';
      case 'high':
        return 'medium';
      default:
        return 'low';
    }
  }

  private calculateChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private getFixTemplates(): Record<string, any> {
    return {
      SQL_INJECTION: {
        confidence: 0.9,
        explanation: 'Replace string concatenation with parameterized queries'
      },
      XSS_VULNERABILITY: {
        confidence: 0.8,
        explanation: 'Use safe DOM manipulation methods'
      },
      HARDCODED_SECRET: {
        confidence: 0.7,
        explanation: 'Move secrets to environment variables'
      },
      WEAK_CRYPTO: {
        confidence: 0.9,
        explanation: 'Use strong cryptographic algorithms'
      },
      INSECURE_RANDOM: {
        confidence: 0.9,
        explanation: 'Use cryptographically secure random generation'
      }
    };
  }

  private getCapabilities(): string[] {
    return [
      'automatic-code-fixes',
      'configuration-recommendations',
      'dependency-updates',
      'rollback-support',
      'fix-verification',
      'impact-assessment'
    ];
  }



  private async handleScanCompleted(event: AgentEvent): Promise<void> {
    const scanResult = event.data.result;

    if (scanResult.summary.bySeverity.critical > 0) {

      const criticalIssues = scanResult.issues.filter(
        (issue: any) => issue.severity === 'critical'
      );

      for (const issue of criticalIssues) {
        await this.emitEvent('security-fix-needed', {
          issueId: issue.id,
          priority: 'immediate',
          autoFix: true
        });
      }
    }
  }

  private async handleRollbackRequest(event: AgentEvent): Promise<void> {
    const { rollbackId } = event.data;

    try {
      await this.rollbackService.performRollback(rollbackId);
      await this.emitEvent('rollback-completed', {
        rollbackId,
        status: 'success'
      });
    } catch (error) {
      await this.emitEvent('rollback-failed', {
        rollbackId,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  private async handleNewSecurityIssue(event: AgentEvent): Promise<void> {
    const issue = event.data.issue;


    const autoFixRules = [
      'HARDCODED_SECRET',
      'WEAK_CRYPTO',
      'INSECURE_RANDOM',
      'DEBUG_MODE_ENABLED'
    ];

    if (autoFixRules.includes(issue.ruleId) && issue.confidence > 0.8) {
      await this.emitEvent('security-fix-needed', {
        issueId: issue.id,
        priority: issue.severity === 'critical' ? 'immediate' : 'high',
        autoFix: true
      });
    }
  }
}




class RollbackService {
  private backupDir: string;

  constructor(private config: any = {}) {
    this.backupDir = config.backupDir || './.security-backups';
  }

  async initialize(): Promise<void> {
    const fs = require('fs');
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup(filePath: string, content: string): Promise<string> {
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `${path.basename(filePath)}.${timestamp}.backup`;
    const backupPath = path.join(this.backupDir, backupFileName);

    fs.writeFileSync(backupPath, content, 'utf8');
    return backupPath;
  }

  async performRollback(rollbackData: RollbackData | string): Promise<void> {
    const fs = require('fs');

    if (typeof rollbackData === 'string') {

      const backupPath = rollbackData;
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupPath}`);
      }


      throw new Error('Rollback by path requires additional metadata');
    } else {

      const originalPath = rollbackData.backupPath.replace(/\.[\d-T]+\.backup$/, '');

      // Verify backup exists
      if (!fs.existsSync(rollbackData.backupPath)) {
        throw new Error(`Backup file not found: ${rollbackData.backupPath}`);
      }

      // Restore original content
      fs.writeFileSync(originalPath, rollbackData.originalContent, 'utf8');
    }
  }

  async cleanupOldBackups(olderThanDays: number = 7): Promise<void> {
    const fs = require('fs');
    const files = fs.readdirSync(this.backupDir);
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

    for (const file of files) {
      const filePath = path.join(this.backupDir, file);
      const stats = fs.statSync(filePath);

      if (stats.mtime.getTime() < cutoffTime) {
        fs.unlinkSync(filePath);
      }
    }
  }
}

================
File: types.ts
================
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
  ttl: number;
}

export interface AgentRegistration {
  metadata: AgentMetadata;
  instance: IAgent;
  registeredAt: Date;
  lastHeartbeat: Date;
  isActive: boolean;
}




export interface IAgent {
  readonly metadata: AgentMetadata;
  readonly status: AgentStatus;




  initialize(config?: Record<string, any>): Promise<void>;




  execute(task: AgentTask): Promise<AgentResult>;




  pause(): Promise<void>;




  resume(): Promise<void>;




  stop(): Promise<void>;




  getHealth(): Promise<{
    status: AgentStatus;
    uptime: number;
    tasksCompleted: number;
    lastError?: Error;
  }>;




  onEvent(event: AgentEvent): Promise<void>;




  emitEvent(type: string, data: any): Promise<void>;




  setCoordinator(coordinator: any): void;




  on(event: string, listener: (...args: any[]) => void): this;
  removeAllListeners(): this;
}




export interface RegistryConfig {
  maxAgents?: number;
  heartbeatInterval?: number;
  cleanupInterval?: number;
  staleTimeout?: number;
}




export interface CoordinatorConfig {
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
  sessionTtl?: number;
  eventBuffer?: number;
  pubSubChannels?: {
    events: string;
    coordination: string;
    heartbeat: string;
  };
}




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



================================================================
End of Codebase
================================================================

/**
 * @fileoverview Multi-Agent Orchestration Package
 *
 * This package provides the foundation for a multi-agent system that coordinates
 * specialized agents for different tasks like parsing, testing, SCM operations,
 * and verification. The system uses a knowledge graph for shared state and
 * Redis for real-time coordination.
 *
 * Key Components:
 * - BaseAgent: Abstract base class for all agents
 * - AgentRegistry: Central registry for agent management
 * - AgentCoordinator: Handles communication and orchestration
 * - Types: TypeScript interfaces and types for the system
 *
 * @example
 * ```typescript
 * import { AgentRegistry, AgentCoordinator, BaseAgent } from '@memento/agents';
 *
 * // Create the core system
 * const registry = new AgentRegistry();
 * const coordinator = new AgentCoordinator(registry);
 *
 * // Create and register a custom agent
 * class ParseAgent extends BaseAgent {
 *   protected async onInitialize() { ... }
 *   protected async executeTask(task) { ... }
 *   // ... implement other abstract methods
 * }
 *
 * const parseAgent = new ParseAgent({
 *   id: 'parse-agent-1',
 *   type: 'parse',
 *   name: 'Parse Agent',
 *   description: 'Handles file parsing tasks',
 *   version: '1.0.0',
 *   capabilities: ['typescript', 'javascript'],
 *   dependencies: []
 * });
 *
 * await registry.register(parseAgent);
 *
 * // Orchestrate tasks
 * const results = await coordinator.orchestrate('session-1', [
 *   { id: 'task-1', type: 'parse', params: { filePath: './src/app.ts' }, priority: 1 }
 * ]);
 * ```
 */
export { BaseAgent } from './agent-base.js';
export { AgentRegistry } from './registry.js';
export { AgentCoordinator } from './coordinator.js';
import { AgentRegistry } from './registry.js';
import { AgentCoordinator } from './coordinator.js';
export type { AgentType, AgentStatus, AgentMetadata, AgentTask, AgentResult, AgentEvent, AgentEventType, CoordinationContext, AgentRegistration, RegistryConfig, CoordinatorConfig, IAgent } from './types.js';
export { AgentEventTypes } from './types.js';
/**
 * Utility function to create a basic multi-agent system
 */
export declare function createAgentSystem(config?: {
    registry?: import('./types.js').RegistryConfig;
    coordinator?: import('./types.js').CoordinatorConfig;
}): {
    registry: AgentRegistry;
    coordinator: AgentCoordinator;
};
/**
 * Create a session ID for coordination
 */
export declare function createSessionId(prefix?: string): string;
/**
 * Create a task ID
 */
export declare function createTaskId(type: import('./types.js').AgentType, prefix?: string): string;
/**
 * Create an agent ID
 */
export declare function createAgentId(type: import('./types.js').AgentType, instance?: number): string;
//# sourceMappingURL=index.d.ts.map
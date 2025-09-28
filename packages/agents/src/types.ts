/**
 * Core types for the multi-agent orchestration system
 */

import {
  AgentType,
  AgentStatus,
  AgentMetadata,
  AgentTask,
  AgentResult,
  AgentEvent,
  CoordinationContext,
  AgentRegistration,
  IAgent,
  RegistryConfig,
  CoordinatorConfig,
  AgentEventType,
  AgentEventTypes,
} from '@memento/shared-types.js';

// Re-export agent types
export type {
  AgentType,
  AgentStatus,
  AgentMetadata,
  AgentTask,
  AgentResult,
  AgentEvent,
  CoordinationContext,
  AgentRegistration,
  IAgent,
  RegistryConfig,
  CoordinatorConfig,
  AgentEventType,
};

export { AgentEventTypes };

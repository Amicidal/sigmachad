/**
 * Core Session Management Type Definitions
 *
 * Additional types specific to the core package session management
 * Most common session types have been moved to @memento/shared-types
 */

import {
  SessionState,
  EventType,
  ElementType,
  Operation,
  Severity,
  Outcome,
  VerifiedBy,
  SessionChangeInfo,
  SessionStateTransition,
  SessionImpact,
  SessionEvent,
  SessionCheckpoint,
  SessionDocument,
  SessionAnchor,
  SessionQuery,
  TransitionResult,
  SessionCreationOptions,
  SessionEventOptions,
  CheckpointOptions,
  HandoffContext,
  IsolationResult,
  RedisSessionData,
  RedisEventData,
  SessionPubSubMessage,
  RedisConfig,
  SessionManagerConfig,
  SessionError,
  SessionNotFoundError,
  SessionExpiredError,
  ISessionStore,
  ISessionManager,
  ISessionBridge,
  SessionStats,
  SessionMetrics,
} from '@memento/shared-types';

// Re-export shared session types for convenience
export type {
  SessionState,
  EventType,
  ElementType,
  Operation,
  Severity,
  Outcome,
  VerifiedBy,
  SessionChangeInfo,
  SessionStateTransition,
  SessionImpact,
  SessionEvent,
  SessionCheckpoint,
  SessionDocument,
  SessionAnchor,
  SessionQuery,
  TransitionResult,
  SessionCreationOptions,
  SessionEventOptions,
  CheckpointOptions,
  HandoffContext,
  IsolationResult,
  RedisSessionData,
  RedisEventData,
  SessionPubSubMessage,
  RedisConfig,
  SessionManagerConfig,
  ISessionStore,
  ISessionManager,
  ISessionBridge,
  SessionStats,
  SessionMetrics,
};

// Export error classes as values for instantiation
export { SessionError, SessionNotFoundError, SessionExpiredError };

// Re-export as legacy aliases for backward compatibility
export type {
  SessionDocument as RedisSession,
  SessionEvent as RedisEvent,
  SessionAnchor as RedisAnchor,
  SessionQuery as RedisQuery,
  HandoffContext as RedisHandoff,
  IsolationResult as RedisIsolation,
  TransitionResult as RedisTransition,
};

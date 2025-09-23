import { TimeRangeParams } from "@memento/graph";

export type SessionCheckpointStatus =
  | "pending"
  | "completed"
  | "failed"
  | "manual_intervention";

export type SessionCheckpointJobRuntimeStatus =
  | SessionCheckpointStatus
  | "queued"
  | "running"
  | "pending";

export interface SessionCheckpointJobPayload {
  sessionId: string;
  seedEntityIds: string[];
  reason: "daily" | "incident" | "manual";
  hopCount: number;
  operationId?: string;
  sequenceNumber?: number;
  eventId?: string;
  actor?: string;
  annotations?: string[];
  triggeredBy?: string;
  window?: TimeRangeParams;
}

export interface SessionCheckpointJobSnapshot {
  id: string;
  payload: SessionCheckpointJobPayload;
  attempts: number;
  status: SessionCheckpointJobRuntimeStatus;
  lastError?: string;
  queuedAt?: Date;
  updatedAt?: Date;
}

export interface SessionCheckpointJobPersistence {
  initialize(): Promise<void>;
  loadPending(): Promise<SessionCheckpointJobSnapshot[]>;
  upsert(job: SessionCheckpointJobSnapshot): Promise<void>;
  delete(jobId: string): Promise<void>;
  loadDeadLetters(): Promise<SessionCheckpointJobSnapshot[]>;
}

import {
  WorkerMessageType,
  WorkerResponseType,
  WorkerTaskMessage,
  WorkerTaskResult,
} from '@memento/shared-types';

// Re-export for backward compatibility
export type {
  WorkerMessageType,
  WorkerResponseType,
  WorkerTaskMessage,
  WorkerTaskResult,
};

export const createWorkerTaskMessage = <T>(
  taskId: string,
  payload: T,
  metadata: Record<string, unknown> = {}
): WorkerTaskMessage<T> => ({
  type: 'task',
  taskId,
  payload,
  metadata,
});

export const createWorkerShutdownMessage = (): WorkerTaskMessage => ({
  type: 'shutdown',
});

export const isWorkerTaskResult = <T = unknown>(
  message: unknown
): message is WorkerTaskResult<T> =>
  Boolean(
    message &&
      typeof message === 'object' &&
      (message as WorkerTaskResult<T>).type === 'task_result' &&
      typeof (message as WorkerTaskResult<T>).taskId === 'string'
  );

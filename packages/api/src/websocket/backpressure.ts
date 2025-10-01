import type { BackpressureConfig } from "@memento/shared-types";

export class BackpressureManager {
  private attempts = new Map<string, number>();
  private readonly thresholdBytes: number;
  private readonly retryDelayMs: number;
  private readonly maxRetries: number;

  constructor(config: BackpressureConfig) {
    this.thresholdBytes = config.thresholdBytes;
    this.retryDelayMs = config.retryDelayMs;
    this.maxRetries = config.maxRetries;
  }

  getThreshold(): number {
    return this.thresholdBytes;
  }

  getRetryDelay(): number {
    return this.retryDelayMs;
  }

  getMaxRetries(): number {
    return this.maxRetries;
  }

  registerThrottle(connectionId: string): { attempts: number; exceeded: boolean } {
    const next = (this.attempts.get(connectionId) ?? 0) + 1;
    this.attempts.set(connectionId, next);
    return {
      attempts: next,
      exceeded: next > this.maxRetries,
    };
  }

  clear(connectionId: string): void {
    this.attempts.delete(connectionId);
  }

  getAttempts(connectionId: string): number {
    return this.attempts.get(connectionId) ?? 0;
  }
}

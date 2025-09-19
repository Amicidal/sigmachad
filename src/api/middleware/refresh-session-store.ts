import crypto from "crypto";

interface SessionState {
  activeRotationId: string;
  expiresAt?: number;
}

export interface RefreshTokenValidationOutcome {
  ok: boolean;
  reason?: "missing_session" | "missing_rotation" | "token_replayed";
}

export class RefreshSessionStore {
  private static instance: RefreshSessionStore | null = null;
  private sessions = new Map<string, SessionState>();

  static getInstance(): RefreshSessionStore {
    if (!this.instance) {
      this.instance = new RefreshSessionStore();
    }
    return this.instance;
  }

  private constructor() {}

  private pruneExpired(nowEpochSeconds: number): void {
    for (const [sessionId, state] of this.sessions.entries()) {
      if (state.expiresAt && state.expiresAt <= nowEpochSeconds) {
        this.sessions.delete(sessionId);
      }
    }
  }

  validatePresentedToken(
    sessionId: string | undefined,
    rotationId: string | undefined,
    expiresAt?: number
  ): RefreshTokenValidationOutcome {
    const now = Math.floor(Date.now() / 1000);
    this.pruneExpired(now);

    if (!sessionId) {
      return { ok: true, reason: "missing_session" };
    }

    if (!rotationId) {
      const existing = this.sessions.get(sessionId);
      if (!existing) {
        this.sessions.set(sessionId, {
          activeRotationId: this.generateRotationId(),
          expiresAt,
        });
      }
      return { ok: true, reason: "missing_rotation" };
    }

    const sessionState = this.sessions.get(sessionId);
    if (!sessionState) {
      this.sessions.set(sessionId, { activeRotationId: rotationId, expiresAt });
      return { ok: true };
    }

    if (sessionState.activeRotationId !== rotationId) {
      return { ok: false, reason: "token_replayed" };
    }

    return { ok: true };
  }

  rotate(sessionId: string, expiresAt?: number, nextRotationId?: string): string {
    const rotationId = nextRotationId ?? this.generateRotationId();
    this.sessions.set(sessionId, { activeRotationId: rotationId, expiresAt });
    return rotationId;
  }

  generateRotationId(): string {
    return crypto.randomUUID();
  }
}

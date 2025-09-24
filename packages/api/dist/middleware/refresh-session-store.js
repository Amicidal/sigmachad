import crypto from "crypto";
export class RefreshSessionStore {
    static getInstance() {
        if (!this.instance) {
            this.instance = new RefreshSessionStore();
        }
        return this.instance;
    }
    constructor() {
        this.sessions = new Map();
    }
    pruneExpired(nowEpochSeconds) {
        for (const [sessionId, state] of this.sessions.entries()) {
            if (state.expiresAt && state.expiresAt <= nowEpochSeconds) {
                this.sessions.delete(sessionId);
            }
        }
    }
    validatePresentedToken(sessionId, rotationId, expiresAt) {
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
    rotate(sessionId, expiresAt, nextRotationId) {
        const rotationId = nextRotationId !== null && nextRotationId !== void 0 ? nextRotationId : this.generateRotationId();
        this.sessions.set(sessionId, { activeRotationId: rotationId, expiresAt });
        return rotationId;
    }
    generateRotationId() {
        return crypto.randomUUID();
    }
}
RefreshSessionStore.instance = null;
//# sourceMappingURL=refresh-session-store.js.map
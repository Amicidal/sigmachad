export interface RefreshTokenValidationOutcome {
    ok: boolean;
    reason?: "missing_session" | "missing_rotation" | "token_replayed";
}
export declare class RefreshSessionStore {
    private static instance;
    private sessions;
    static getInstance(): RefreshSessionStore;
    private constructor();
    private pruneExpired;
    validatePresentedToken(sessionId: string | undefined, rotationId: string | undefined, expiresAt?: number): RefreshTokenValidationOutcome;
    rotate(sessionId: string, expiresAt?: number, nextRotationId?: string): string;
    generateRotationId(): string;
}
//# sourceMappingURL=refresh-session-store.d.ts.map
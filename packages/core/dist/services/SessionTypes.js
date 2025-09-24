/**
 * Session Management Type Definitions
 *
 * Type definitions for Redis-based session coordination system
 * Supporting multi-agent workflows with ephemeral session storage
 */
// ========== Error Types ==========
export class SessionError extends Error {
    constructor(message, code, sessionId, context) {
        super(message);
        this.code = code;
        this.sessionId = sessionId;
        this.context = context;
        this.name = 'SessionError';
    }
}
export class SessionNotFoundError extends SessionError {
    constructor(sessionId) {
        super(`Session not found: ${sessionId}`, 'SESSION_NOT_FOUND', sessionId);
        this.name = 'SessionNotFoundError';
    }
}
export class SessionExpiredError extends SessionError {
    constructor(sessionId) {
        super(`Session expired: ${sessionId}`, 'SESSION_EXPIRED', sessionId);
        this.name = 'SessionExpiredError';
    }
}
//# sourceMappingURL=SessionTypes.js.map
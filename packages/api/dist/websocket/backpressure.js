export class BackpressureManager {
    constructor(config) {
        this.attempts = new Map();
        this.thresholdBytes = config.thresholdBytes;
        this.retryDelayMs = config.retryDelayMs;
        this.maxRetries = config.maxRetries;
    }
    getThreshold() {
        return this.thresholdBytes;
    }
    getRetryDelay() {
        return this.retryDelayMs;
    }
    getMaxRetries() {
        return this.maxRetries;
    }
    registerThrottle(connectionId) {
        var _a;
        const next = ((_a = this.attempts.get(connectionId)) !== null && _a !== void 0 ? _a : 0) + 1;
        this.attempts.set(connectionId, next);
        return {
            attempts: next,
            exceeded: next > this.maxRetries,
        };
    }
    clear(connectionId) {
        this.attempts.delete(connectionId);
    }
    getAttempts(connectionId) {
        var _a;
        return (_a = this.attempts.get(connectionId)) !== null && _a !== void 0 ? _a : 0;
    }
}
//# sourceMappingURL=backpressure.js.map
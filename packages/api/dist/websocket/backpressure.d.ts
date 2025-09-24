import type { BackpressureConfig } from "./types.js";
export declare class BackpressureManager {
    private attempts;
    private readonly thresholdBytes;
    private readonly retryDelayMs;
    private readonly maxRetries;
    constructor(config: BackpressureConfig);
    getThreshold(): number;
    getRetryDelay(): number;
    getMaxRetries(): number;
    registerThrottle(connectionId: string): {
        attempts: number;
        exceeded: boolean;
    };
    clear(connectionId: string): void;
    getAttempts(connectionId: string): number;
}
//# sourceMappingURL=backpressure.d.ts.map
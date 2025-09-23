import { LogEntry } from "../core/LoggingService.js";
export type InstrumentationSource = "console" | "process";
export interface InstrumentationEvent {
    source: InstrumentationSource;
    level: LogEntry["level"];
    component: string;
    message: string;
    data?: unknown;
    consoleArgs?: unknown[];
    error?: unknown;
}
export interface InstrumentationConsumer {
    handleEvent(event: InstrumentationEvent): void;
}
export interface InstrumentationSubscription {
    dispose(): void;
}
export interface DispatcherMetrics {
    registeredConsumers: number;
    consoleOverridesActive: boolean;
    processListenersAttached: number;
    dispatchedEvents: number;
    droppedEvents: number;
}
export interface OriginalConsoleMethods {
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
    debug: typeof console.debug;
}
export declare class InstrumentationDispatcher {
    private consumers;
    private nextConsumerId;
    private consoleOverridesActive;
    private dispatchedEvents;
    private droppedEvents;
    private processListenersAttached;
    private originalConsole;
    private uncaughtExceptionHandler?;
    private unhandledRejectionHandler?;
    register(consumer: InstrumentationConsumer): InstrumentationSubscription;
    handleConsole(level: LogEntry["level"], args: unknown[]): void;
    handleProcessEvent(type: "uncaughtException" | "unhandledRejection", payload: unknown): void;
    getOriginalConsole(): OriginalConsoleMethods;
    getMetrics(): DispatcherMetrics;
    private dispatch;
    private ensureInstrumentation;
    private teardownInstrumentation;
    private safeStringifyInline;
    private formatConsoleArg;
}
export declare function getInstrumentationDispatcher(): InstrumentationDispatcher;
//# sourceMappingURL=InstrumentationDispatcher.d.ts.map
const GLOBAL_DISPATCHER_KEY = "__mementoLoggingDispatcher__";
export class InstrumentationDispatcher {
    constructor() {
        this.consumers = new Map();
        this.nextConsumerId = 1;
        this.consoleOverridesActive = false;
        this.dispatchedEvents = 0;
        this.droppedEvents = 0;
        this.processListenersAttached = 0;
        this.originalConsole = null;
    }
    register(consumer) {
        const record = {
            id: this.nextConsumerId++,
            consumer,
        };
        this.consumers.set(record.id, record);
        this.ensureInstrumentation();
        return {
            dispose: () => {
                this.consumers.delete(record.id);
                if (this.consumers.size === 0) {
                    this.teardownInstrumentation();
                }
            },
        };
    }
    handleConsole(level, args) {
        const message = args.map((part) => this.formatConsoleArg(part)).join(" ");
        this.dispatch({
            source: "console",
            level,
            component: "console",
            message,
            consoleArgs: args,
        });
    }
    handleProcessEvent(type, payload) {
        if (type === "uncaughtException") {
            const error = payload;
            this.dispatch({
                source: "process",
                level: "error",
                component: "process",
                message: `Uncaught Exception: ${error instanceof Error ? error.message : String(error)}`,
                data: error instanceof Error
                    ? { stack: error.stack, name: error.name }
                    : undefined,
                error,
            });
        }
        else {
            const [reason, promise] = Array.isArray(payload)
                ? payload
                : [payload, undefined];
            this.dispatch({
                source: "process",
                level: "error",
                component: "process",
                message: `Unhandled Rejection: ${reason instanceof Error ? reason.message : String(reason)}`,
                data: {
                    promise: this.safeStringifyInline(promise !== null && promise !== void 0 ? promise : "[unknown promise]"),
                    reason: reason instanceof Error ? { name: reason.name, stack: reason.stack } : reason,
                },
                error: reason,
            });
        }
    }
    getOriginalConsole() {
        if (this.originalConsole) {
            return this.originalConsole;
        }
        return {
            log: console.log,
            error: console.error,
            warn: console.warn,
            debug: console.debug,
        };
    }
    getMetrics() {
        return {
            registeredConsumers: this.consumers.size,
            consoleOverridesActive: this.consoleOverridesActive,
            processListenersAttached: this.processListenersAttached,
            dispatchedEvents: this.dispatchedEvents,
            droppedEvents: this.droppedEvents,
        };
    }
    dispatch(event) {
        if (this.consumers.size === 0) {
            this.droppedEvents++;
            return;
        }
        this.dispatchedEvents++;
        for (const record of this.consumers.values()) {
            try {
                record.consumer.handleEvent(event);
            }
            catch (error) {
                this.getOriginalConsole().error("Logging dispatcher consumer threw an error", error);
            }
        }
    }
    ensureInstrumentation() {
        if (this.consoleOverridesActive) {
            return;
        }
        this.originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            debug: console.debug,
        };
        console.log = (...args) => {
            this.handleConsole("info", args);
            Reflect.apply(this.originalConsole.log, console, args);
        };
        console.error = (...args) => {
            this.handleConsole("error", args);
            Reflect.apply(this.originalConsole.error, console, args);
        };
        console.warn = (...args) => {
            this.handleConsole("warn", args);
            Reflect.apply(this.originalConsole.warn, console, args);
        };
        console.debug = (...args) => {
            this.handleConsole("debug", args);
            Reflect.apply(this.originalConsole.debug, console, args);
        };
        this.uncaughtExceptionHandler = (error) => {
            this.handleProcessEvent("uncaughtException", error);
            const originalConsole = this.getOriginalConsole();
            const consoleArgs = error instanceof Error
                ? [error]
                : ["Uncaught exception (non-error value):", error];
            Reflect.apply(originalConsole.error, console, consoleArgs);
            // Ensure the process reports a failure while allowing other listeners to run.
            if (typeof process.exitCode !== "number" || process.exitCode === 0) {
                process.exitCode = 1;
            }
        };
        this.unhandledRejectionHandler = (reason, promise) => {
            this.handleProcessEvent("unhandledRejection", [reason, promise]);
        };
        process.on("uncaughtException", this.uncaughtExceptionHandler);
        process.on("unhandledRejection", this.unhandledRejectionHandler);
        this.processListenersAttached = 2;
        this.consoleOverridesActive = true;
    }
    teardownInstrumentation() {
        if (!this.consoleOverridesActive || !this.originalConsole) {
            return;
        }
        console.log = this.originalConsole.log;
        console.error = this.originalConsole.error;
        console.warn = this.originalConsole.warn;
        console.debug = this.originalConsole.debug;
        if (this.uncaughtExceptionHandler) {
            process.removeListener("uncaughtException", this.uncaughtExceptionHandler);
            this.uncaughtExceptionHandler = undefined;
        }
        if (this.unhandledRejectionHandler) {
            process.removeListener("unhandledRejection", this.unhandledRejectionHandler);
            this.unhandledRejectionHandler = undefined;
        }
        this.processListenersAttached = 0;
        this.consoleOverridesActive = false;
    }
    safeStringifyInline(value) {
        var _a;
        if (typeof value === "string") {
            return value;
        }
        try {
            const serialized = JSON.stringify(value);
            return typeof serialized === "string" ? serialized : String(value);
        }
        catch (error) {
            return `[unserializable: ${(_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : "error"}]`;
        }
    }
    formatConsoleArg(part) {
        var _a;
        if (typeof part === "string") {
            return part;
        }
        if (part instanceof Error) {
            return (_a = part.stack) !== null && _a !== void 0 ? _a : part.toString();
        }
        if (typeof part === "number" || typeof part === "boolean") {
            return String(part);
        }
        if (typeof part === "bigint") {
            return part.toString();
        }
        if (typeof part === "symbol") {
            return part.toString();
        }
        if (typeof part === "function") {
            return part.name ? `[Function: ${part.name}]` : "[Function]";
        }
        if (part === null) {
            return "null";
        }
        if (part === undefined) {
            return "undefined";
        }
        return this.safeStringifyInline(part);
    }
}
export function getInstrumentationDispatcher() {
    const globalWithDispatcher = globalThis;
    if (!globalWithDispatcher[GLOBAL_DISPATCHER_KEY]) {
        globalWithDispatcher[GLOBAL_DISPATCHER_KEY] = new InstrumentationDispatcher();
    }
    return globalWithDispatcher[GLOBAL_DISPATCHER_KEY];
}
//# sourceMappingURL=InstrumentationDispatcher.js.map
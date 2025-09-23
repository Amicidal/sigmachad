import { LogEntry } from "../services/LoggingService.js";

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

interface ConsumerRecord {
  id: number;
  consumer: InstrumentationConsumer;
}

const GLOBAL_DISPATCHER_KEY = "__mementoLoggingDispatcher__";

export class InstrumentationDispatcher {
  private consumers: Map<number, ConsumerRecord> = new Map();
  private nextConsumerId = 1;
  private consoleOverridesActive = false;
  private dispatchedEvents = 0;
  private droppedEvents = 0;
  private processListenersAttached = 0;

  private originalConsole: OriginalConsoleMethods | null = null;
  private uncaughtExceptionHandler?: (error: unknown) => void;
  private unhandledRejectionHandler?: (reason: unknown, promise: unknown) => void;

  register(consumer: InstrumentationConsumer): InstrumentationSubscription {
    const record: ConsumerRecord = {
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

  handleConsole(level: LogEntry["level"], args: unknown[]): void {
    const message = args.map((part) => this.formatConsoleArg(part)).join(" ");

    this.dispatch({
      source: "console",
      level,
      component: "console",
      message,
      consoleArgs: args,
    });
  }

  handleProcessEvent(
    type: "uncaughtException" | "unhandledRejection",
    payload: unknown
  ): void {
    if (type === "uncaughtException") {
      const error = payload as Error;
      this.dispatch({
        source: "process",
        level: "error",
        component: "process",
        message: `Uncaught Exception: ${error instanceof Error ? error.message : String(error)}`,
        data:
          error instanceof Error
            ? { stack: error.stack, name: error.name }
            : undefined,
        error,
      });
    } else {
      const [reason, promise] = Array.isArray(payload)
        ? (payload as [unknown, unknown])
        : [payload, undefined];
      this.dispatch({
        source: "process",
        level: "error",
        component: "process",
        message: `Unhandled Rejection: ${
          reason instanceof Error ? reason.message : String(reason)
        }`,
        data: {
          promise: this.safeStringifyInline(promise ?? "[unknown promise]"),
          reason: reason instanceof Error ? { name: reason.name, stack: reason.stack } : reason,
        },
        error: reason,
      });
    }
  }

  getOriginalConsole(): OriginalConsoleMethods {
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

  getMetrics(): DispatcherMetrics {
    return {
      registeredConsumers: this.consumers.size,
      consoleOverridesActive: this.consoleOverridesActive,
      processListenersAttached: this.processListenersAttached,
      dispatchedEvents: this.dispatchedEvents,
      droppedEvents: this.droppedEvents,
    };
  }

  private dispatch(event: InstrumentationEvent): void {
    if (this.consumers.size === 0) {
      this.droppedEvents++;
      return;
    }

    this.dispatchedEvents++;

    for (const record of this.consumers.values()) {
      try {
        record.consumer.handleEvent(event);
      } catch (error) {
        this.getOriginalConsole().error(
          "Logging dispatcher consumer threw an error",
          error
        );
      }
    }
  }

  private ensureInstrumentation(): void {
    if (this.consoleOverridesActive) {
      return;
    }

    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      debug: console.debug,
    };

    console.log = (...args: unknown[]) => {
      this.handleConsole("info", args);
      Reflect.apply(this.originalConsole!.log, console, args);
    };

    console.error = (...args: unknown[]) => {
      this.handleConsole("error", args);
      Reflect.apply(this.originalConsole!.error, console, args);
    };

    console.warn = (...args: unknown[]) => {
      this.handleConsole("warn", args);
      Reflect.apply(this.originalConsole!.warn, console, args);
    };

    console.debug = (...args: unknown[]) => {
      this.handleConsole("debug", args);
      Reflect.apply(this.originalConsole!.debug, console, args);
    };

    this.uncaughtExceptionHandler = (error: unknown) => {
      this.handleProcessEvent("uncaughtException", error);

      const originalConsole = this.getOriginalConsole();
      const consoleArgs =
        error instanceof Error
          ? [error]
          : ["Uncaught exception (non-error value):", error];

      Reflect.apply(originalConsole.error, console, consoleArgs);

      // Ensure the process reports a failure while allowing other listeners to run.
      if (typeof process.exitCode !== "number" || process.exitCode === 0) {
        process.exitCode = 1;
      }

    };

    this.unhandledRejectionHandler = (reason: unknown, promise: unknown) => {
      this.handleProcessEvent("unhandledRejection", [reason, promise]);
    };

    process.on("uncaughtException", this.uncaughtExceptionHandler);
    process.on("unhandledRejection", this.unhandledRejectionHandler);
    this.processListenersAttached = 2;

    this.consoleOverridesActive = true;
  }

  private teardownInstrumentation(): void {
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

  private safeStringifyInline(value: unknown): string {
    if (typeof value === "string") {
      return value;
    }

    try {
      const serialized = JSON.stringify(value);
      return typeof serialized === "string" ? serialized : String(value);
    } catch (error) {
      return `[unserializable: ${(error as Error)?.message ?? "error"}]`;
    }
  }

  private formatConsoleArg(part: unknown): string {
    if (typeof part === "string") {
      return part;
    }

    if (part instanceof Error) {
      return part.stack ?? part.toString();
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

export function getInstrumentationDispatcher(): InstrumentationDispatcher {
  const globalWithDispatcher = globalThis as typeof globalThis & {
    [GLOBAL_DISPATCHER_KEY]?: InstrumentationDispatcher;
  };

  if (!globalWithDispatcher[GLOBAL_DISPATCHER_KEY]) {
    globalWithDispatcher[GLOBAL_DISPATCHER_KEY] = new InstrumentationDispatcher();
  }

  return globalWithDispatcher[GLOBAL_DISPATCHER_KEY];
}

import { LogEntry } from "../core/LoggingService.js";

export interface SerializationOptions {
  maxDepth?: number;
  maxStringLength?: number;
  maxArrayLength?: number;
}

const DEFAULT_MAX_DEPTH = 6;
const DEFAULT_MAX_STRING_LENGTH = 10_000;
const DEFAULT_MAX_ARRAY_LENGTH = 1_000;

export function sanitizeData(
  value: unknown,
  options: SerializationOptions = {}
): unknown {
  const { maxDepth, maxStringLength, maxArrayLength } = {
    maxDepth: options.maxDepth ?? DEFAULT_MAX_DEPTH,
    maxStringLength: options.maxStringLength ?? DEFAULT_MAX_STRING_LENGTH,
    maxArrayLength: options.maxArrayLength ?? DEFAULT_MAX_ARRAY_LENGTH,
  };

  const seen = new WeakSet<object>();

  const sanitize = (input: unknown, depth: number): unknown => {
    if (input === null || typeof input !== "object") {
      if (typeof input === "string" && input.length > maxStringLength) {
        return `${input.slice(0, maxStringLength)}…[truncated ${input.length - maxStringLength} chars]`;
      }
      if (typeof input === "bigint") {
        return `${input.toString()}n`;
      }
      if (typeof input === "symbol") {
        return input.description ? `Symbol(${input.description})` : "Symbol()";
      }
      if (typeof input === "function") {
        return `[Function ${input.name || 'anonymous'}]`;
      }
      return input;
    }

    if (seen.has(input as object)) {
      return "[Circular]";
    }

    if (depth >= maxDepth) {
      return `[Truncated depth ${depth}]`;
    }

    seen.add(input as object);

    if (Array.isArray(input)) {
      const limited = input.slice(0, maxArrayLength).map((item) =>
        sanitize(item, depth + 1)
      );
      if (input.length > maxArrayLength) {
        limited.push(`…[${input.length - maxArrayLength} more items truncated]`);
      }
      return limited;
    }

    if (input instanceof Date) {
      return input.toISOString();
    }

    if (input instanceof Error) {
      return {
        name: input.name,
        message: input.message,
        stack: input.stack,
      };
    }

    const output: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      output[key] = sanitize(value, depth + 1);
    }
    return output;
  };

  return sanitize(value, 0);
}

export function serializeLogEntry(
  entry: LogEntry,
  options: SerializationOptions = {}
): string {
  const serializable = {
    ...entry,
    timestamp: entry.timestamp.toISOString(),
    data: entry.data ? sanitizeData(entry.data, options) : undefined,
  };

  return JSON.stringify(serializable);
}

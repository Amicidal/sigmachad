import { LogEntry } from "../services/LoggingService.js";
export interface SerializationOptions {
    maxDepth?: number;
    maxStringLength?: number;
    maxArrayLength?: number;
}
export declare function sanitizeData(value: unknown, options?: SerializationOptions): unknown;
export declare function serializeLogEntry(entry: LogEntry, options?: SerializationOptions): string;
//# sourceMappingURL=serialization.d.ts.map
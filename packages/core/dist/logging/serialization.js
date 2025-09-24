const DEFAULT_MAX_DEPTH = 6;
const DEFAULT_MAX_STRING_LENGTH = 10000;
const DEFAULT_MAX_ARRAY_LENGTH = 1000;
export function sanitizeData(value, options = {}) {
    var _a, _b, _c;
    const { maxDepth, maxStringLength, maxArrayLength } = {
        maxDepth: (_a = options.maxDepth) !== null && _a !== void 0 ? _a : DEFAULT_MAX_DEPTH,
        maxStringLength: (_b = options.maxStringLength) !== null && _b !== void 0 ? _b : DEFAULT_MAX_STRING_LENGTH,
        maxArrayLength: (_c = options.maxArrayLength) !== null && _c !== void 0 ? _c : DEFAULT_MAX_ARRAY_LENGTH,
    };
    const seen = new WeakSet();
    const sanitize = (input, depth) => {
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
        if (seen.has(input)) {
            return "[Circular]";
        }
        if (depth >= maxDepth) {
            return `[Truncated depth ${depth}]`;
        }
        seen.add(input);
        if (Array.isArray(input)) {
            const limited = input.slice(0, maxArrayLength).map((item) => sanitize(item, depth + 1));
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
        const output = {};
        for (const [key, value] of Object.entries(input)) {
            output[key] = sanitize(value, depth + 1);
        }
        return output;
    };
    return sanitize(value, 0);
}
export function serializeLogEntry(entry, options = {}) {
    const serializable = {
        ...entry,
        timestamp: entry.timestamp.toISOString(),
        data: entry.data ? sanitizeData(entry.data, options) : undefined,
    };
    return JSON.stringify(serializable);
}
//# sourceMappingURL=serialization.js.map
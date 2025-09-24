import { createClient as createRedisClient } from "redis";
export class FalkorDBService {
    constructor(config) {
        this.initialized = false;
        this.config = config;
    }
    async initialize() {
        if (this.initialized) {
            return;
        }
        try {
            this.falkordbClient = createRedisClient({
                url: this.config.url,
                database: this.config.database || 0,
            });
            await this.falkordbClient.connect();
            this.initialized = true;
            console.log("✅ FalkorDB connection established");
        }
        catch (error) {
            console.error("❌ FalkorDB initialization failed:", error);
            throw error;
        }
    }
    async close() {
        if (this.falkordbClient) {
            await this.falkordbClient.disconnect();
        }
        this.initialized = false;
    }
    isInitialized() {
        return this.initialized;
    }
    getClient() {
        if (!this.initialized) {
            throw new Error("FalkorDB not initialized");
        }
        return this.falkordbClient;
    }
    async query(query, params = {}, graphKeyOverride) {
        if (!this.initialized) {
            throw new Error("FalkorDB not initialized");
        }
        let processedQuery = query;
        try {
            // FalkorDB doesn't support parameterized queries like traditional databases
            // We need to substitute parameters directly in the query string
            // Validate and sanitize parameters to prevent injection
            const sanitizedParams = {};
            for (const [key, value] of Object.entries(params)) {
                if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
                    throw new Error(`Invalid parameter name: ${key}. Only alphanumeric characters and underscores are allowed.`);
                }
                // Deep clone and sanitize the value
                sanitizedParams[key] = this.sanitizeParameterValue(value);
            }
            // Replace $param placeholders with actual values using sanitized parameters
            for (const [key, value] of Object.entries(sanitizedParams)) {
                const placeholder = `$${key}`;
                const replacementValue = this.parameterToCypherString(value, key, query);
                // Use word boundaries to ensure exact matches
                const regex = new RegExp(`\\$${key}\\b`, "g");
                processedQuery = processedQuery.replace(regex, replacementValue);
            }
            const result = await this.falkordbClient.sendCommand([
                "GRAPH.QUERY",
                graphKeyOverride || this.config.graphKey || "memento",
                processedQuery,
            ]);
            // FalkorDB returns results in a specific format:
            // [headers, data, statistics]
            if (result && Array.isArray(result)) {
                if (result.length === 3) {
                    // Standard query result format
                    const headers = result[0];
                    const data = result[1];
                    // If there's no data, return empty array
                    if (!data || (Array.isArray(data) && data.length === 0)) {
                        return [];
                    }
                    // Parse the data into objects using headers
                    if (Array.isArray(headers) && Array.isArray(data)) {
                        return data.map((row) => {
                            const obj = {};
                            if (Array.isArray(row)) {
                                headers.forEach((header, index) => {
                                    const headerName = String(header);
                                    obj[headerName] = this.decodeGraphValue(row[index]);
                                });
                            }
                            return obj;
                        });
                    }
                    return data;
                }
                else if (result.length === 1) {
                    // Write operation result (CREATE, SET, DELETE)
                    return result[0];
                }
            }
            return result;
        }
        catch (error) {
            console.error("FalkorDB query error:", error);
            console.error("Original query was:", query);
            console.error("Processed query was:", processedQuery);
            console.error("Params were:", params);
            throw error;
        }
    }
    async command(...args) {
        var _a;
        if (!this.initialized) {
            throw new Error("FalkorDB not initialized");
        }
        // Normalize args to a flat string array. If last arg is params object, substitute.
        let argv = [];
        if (args.length === 1 && Array.isArray(args[0])) {
            argv = args[0];
        }
        else {
            argv = [...args];
        }
        let processedQuery = "";
        if (argv.length >= 3 &&
            typeof argv[0] === "string" &&
            typeof argv[1] === "string" &&
            typeof argv[2] === "string" &&
            typeof argv[argv.length - 1] === "object" &&
            argv[argv.length - 1] !== null &&
            !Array.isArray(argv[argv.length - 1])) {
            const params = argv.pop();
            processedQuery = await this.buildProcessedQuery(argv[2], params);
            argv[2] = processedQuery;
        }
        const flat = argv.map((v) => typeof v === "string" ? v : String(v));
        const result = await this.falkordbClient.sendCommand(flat);
        // Handle different command types differently
        const command = (_a = flat[0]) === null || _a === void 0 ? void 0 : _a.toUpperCase();
        // For simple Redis commands (PING, etc.), return raw result
        if (command === "PING" || flat.length === 1) {
            return result;
        }
        if (command === "EXEC" || command === "DISCARD" || command === "MULTI") {
            return result;
        }
        // For GRAPH.QUERY commands, parse and return structured data
        if (command === "GRAPH.QUERY") {
            // FalkorDB GRAPH.QUERY returns [header, ...dataRows, stats]
            if (result && Array.isArray(result) && result.length >= 2) {
                const headers = result[0];
                const data = result[1];
                // If there's no data, return empty array
                if (!data || (Array.isArray(data) && data.length === 0)) {
                    return { data: [], headers: headers || [] };
                }
                // Parse the data into objects using headers
                if (Array.isArray(headers) && Array.isArray(data)) {
                    const processedData = data.map((row) => {
                        const obj = {};
                        if (Array.isArray(row)) {
                            headers.forEach((header, index) => {
                                const headerName = String(header);
                                obj[headerName] = this.decodeGraphValue(row[index]);
                            });
                        }
                        return obj;
                    });
                    return { data: processedData, headers: headers };
                }
                // If we can't parse, return raw data in expected format
                return { data: data || [], headers: headers || [] };
            }
            // Fallback if result doesn't match expected format
            return { data: [], headers: [] };
        }
        // For other commands, use the structured format
        if (result && Array.isArray(result)) {
            if (result.length === 3) {
                // Standard query result format
                const headers = result[0];
                const data = result[1];
                // If there's no data, return empty array
                if (!data || (Array.isArray(data) && data.length === 0)) {
                    return { data: [], headers: headers || [] };
                }
                // Parse the data into objects using headers
                if (Array.isArray(headers) && Array.isArray(data)) {
                    const processedData = data.map((row) => {
                        const obj = {};
                        if (Array.isArray(row)) {
                            headers.forEach((header, index) => {
                                const headerName = String(header);
                                obj[headerName] = this.decodeGraphValue(row[index]);
                            });
                        }
                        return obj;
                    });
                    return { data: processedData, headers: headers };
                }
                // If we can't parse the data, return the raw data
                return { data: data || [], headers: headers || [] };
            }
            else if (result.length === 1) {
                // Write operation result (CREATE, SET, DELETE)
                return { data: result[0] || [], headers: [] };
            }
        }
        return { data: result || [], headers: [] };
    }
    async setupGraph() {
        if (!this.initialized) {
            throw new Error("FalkorDB not initialized");
        }
        const graphKey = this.config.graphKey || "memento";
        try {
            await this.command("GRAPH.QUERY", graphKey, "MATCH (n) RETURN count(n) LIMIT 1");
        }
        catch (error) {
            if (this.isGraphMissingError(error)) {
                console.log("📊 FalkorDB graph will be created on first write operation; index creation deferred");
                return;
            }
            console.error("FalkorDB graph warmup failed:", error);
            return;
        }
        console.log("📊 Setting up FalkorDB graph indexes...");
        const stats = {
            created: 0,
            exists: 0,
            deferred: 0,
            failed: 0,
        };
        const bump = (outcome) => {
            stats[outcome] += 1;
        };
        const primaryIndexQueries = [
            "CREATE INDEX ON :Entity(id)",
            "CREATE INDEX ON :Entity(type)",
            "CREATE INDEX ON :Entity(path)",
            "CREATE INDEX ON :Entity(language)",
            "CREATE INDEX ON :Entity(lastModified)",
        ];
        for (const query of primaryIndexQueries) {
            const outcome = await this.ensureGraphIndex(graphKey, query);
            bump(outcome);
            if (outcome === "deferred" || outcome === "failed") {
                console.log("📊 FalkorDB graph index bootstrap deferred; remaining indexes will be attempted later", { outcome, query });
                return;
            }
        }
        const legacyIndexQueries = [
            "CREATE INDEX ON :file(path)",
            "CREATE INDEX ON :symbol(path)",
            "CREATE INDEX ON :version(entityId)",
            "CREATE INDEX ON :checkpoint(checkpointId)",
        ];
        for (const query of legacyIndexQueries) {
            const outcome = await this.ensureGraphIndex(graphKey, query);
            bump(outcome);
            if (outcome === "deferred" || outcome === "failed") {
                console.log("📊 FalkorDB legacy index bootstrap halted", { outcome, query });
                return;
            }
        }
        console.log("✅ FalkorDB graph index bootstrap complete", {
            created: stats.created,
            alreadyPresent: stats.exists,
            attempts: stats.created + stats.exists + stats.deferred + stats.failed,
        });
    }
    async healthCheck() {
        if (!this.initialized || !this.falkordbClient) {
            return false;
        }
        try {
            await this.falkordbClient.ping();
            return true;
        }
        catch (error) {
            console.error("FalkorDB health check failed:", error);
            return false;
        }
    }
    async ensureGraphIndex(graphKey, query) {
        try {
            await this.command("GRAPH.QUERY", graphKey, query);
            return "created";
        }
        catch (error) {
            if (this.isIndexAlreadyExistsError(error)) {
                return "exists";
            }
            if (this.isGraphMissingError(error)) {
                return "deferred";
            }
            console.warn(`FalkorDB index creation failed for query "${query}":`, error);
            return "failed";
        }
    }
    sanitizeParameterValue(value) {
        // Deep clone to prevent mutations of original object
        if (value === null || value === undefined) {
            return value;
        }
        if (typeof value === "string") {
            // Strip control characters that Falkor/Redis refuse while preserving the original content
            return value.replace(/[\u0000-\u001f\u007f]/g, "");
        }
        if (Array.isArray(value)) {
            return value.map((item) => this.sanitizeParameterValue(item));
        }
        if (typeof value === "object") {
            const sanitized = {};
            for (const [key, val] of Object.entries(value)) {
                if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
                    sanitized[key] = this.sanitizeParameterValue(val);
                }
                // Skip invalid keys
            }
            return sanitized;
        }
        // For primitives, return as-is
        return value;
    }
    parameterToCypherString(value, key, queryForContext) {
        if (value === null || value === undefined) {
            return "null";
        }
        if (typeof value === "string") {
            const escaped = value
                .replace(/\\/g, "\\\\")
                .replace(/'/g, "\\'");
            return `'${escaped}'`;
        }
        if (typeof value === "boolean" || typeof value === "number") {
            return String(value);
        }
        if (Array.isArray(value)) {
            const childKey = key
                ? key.endsWith("s")
                    ? key.slice(0, -1)
                    : key
                : undefined;
            const elements = value.map((item) => this.parameterToCypherString(item, childKey, queryForContext));
            return `[${elements.join(", ")}]`;
        }
        if (typeof value === "object") {
            if (this.shouldTreatObjectAsMap(key, queryForContext) ||
                (!key && this.shouldTreatObjectAsMap("row", queryForContext))) {
                return this.objectToCypherProperties(value);
            }
            const json = JSON.stringify(value);
            const escaped = json.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
            return `'${escaped}'`;
        }
        // For other types, convert to string and quote
        return `'${String(value)}'`;
    }
    shouldTreatObjectAsMap(key, queryForContext) {
        if (!key) {
            return false;
        }
        const normalized = key.toLowerCase();
        if (normalized === "props" ||
            normalized === "row" ||
            normalized === "rows" ||
            normalized.endsWith("props") ||
            normalized.endsWith("properties") ||
            normalized.endsWith("map")) {
            return true;
        }
        if (queryForContext &&
            new RegExp(`UNWIND\\s+\\$${key}\\s+AS\\s+`, "i").test(queryForContext)) {
            return true;
        }
        if (!queryForContext) {
            return false;
        }
        const mapPatterns = [
            new RegExp(`SET\\s+\\w+\\s*\\+=\\s*\\$${key}\\b`, "i"),
            new RegExp(`SET\\s+\\w+\\.\\w+\\s*\\+=\\s*\\$${key}\\b`, "i"),
            new RegExp(`ON\\s+MATCH\\s+SET\\s+\\w+\\s*\\+=\\s*\\$${key}\\b`, "i"),
            new RegExp(`ON\\s+CREATE\\s+SET\\s+\\w+\\s*\\+=\\s*\\$${key}\\b`, "i"),
        ];
        return mapPatterns.some((pattern) => pattern.test(queryForContext));
    }
    objectToCypherProperties(obj) {
        const props = Object.entries(obj)
            .map(([key, value]) => {
            // Validate property key
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
                throw new Error(`Invalid property name: ${key}`);
            }
            if (typeof value === "string") {
                return `${key}: ${this.parameterToCypherString(value, key, undefined)}`;
            }
            else if (Array.isArray(value)) {
                // Handle arrays properly for Cypher
                const childKey = key.endsWith("s")
                    ? key.slice(0, -1)
                    : key;
                const arrayElements = value.map((item) => this.parameterToCypherString(item, childKey, undefined));
                return `${key}: [${arrayElements.join(", ")}]`;
            }
            else if (value === null || value === undefined) {
                return `${key}: null`;
            }
            else if (typeof value === "boolean" || typeof value === "number") {
                return `${key}: ${value}`;
            }
            else {
                // Treat nested objects as maps so callers can pass structured props
                return `${key}: ${this.objectToCypherProperties(value)}`;
            }
        })
            .join(", ");
        return `{${props}}`;
    }
    normalizeErrorMessage(error) {
        if (error instanceof Error) {
            return error.message.toLowerCase();
        }
        if (typeof error === "string") {
            return error.toLowerCase();
        }
        if (error && typeof error === "object") {
            const message = error.message;
            if (typeof message === "string") {
                return message.toLowerCase();
            }
        }
        return String(error !== null && error !== void 0 ? error : "").toLowerCase();
    }
    isIndexAlreadyExistsError(error) {
        const message = this.normalizeErrorMessage(error);
        return (message.includes("already indexed") ||
            message.includes("already exists"));
    }
    isGraphMissingError(error) {
        const message = this.normalizeErrorMessage(error);
        if (!message) {
            return false;
        }
        return ((message.includes("graph") && message.includes("does not exist")) ||
            message.includes("unknown graph") ||
            message.includes("graph not found"));
    }
    async buildProcessedQuery(query, params) {
        let processedQuery = query;
        const sanitizedParams = {};
        for (const [key, value] of Object.entries(params)) {
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
                throw new Error(`Invalid parameter name: ${key}. Only alphanumeric characters and underscores are allowed.`);
            }
            sanitizedParams[key] = this.sanitizeParameterValue(value);
        }
        for (const [key, value] of Object.entries(sanitizedParams)) {
            const regex = new RegExp(`\\$${key}\\b`, "g");
            const replacement = this.parameterToCypherString(value, key, query);
            processedQuery = processedQuery.replace(regex, replacement);
        }
        return processedQuery;
    }
    decodeGraphValue(value) {
        if (value === null || value === undefined)
            return null;
        if (Array.isArray(value))
            return value.map((v) => this.decodeGraphValue(v));
        if (typeof value === "object") {
            const out = {};
            for (const [k, v] of Object.entries(value))
                out[k] = this.decodeGraphValue(v);
            return out;
        }
        if (typeof value !== "string")
            return value;
        const t = value.trim();
        if (t === "null")
            return null;
        if (t === "true")
            return true;
        if (t === "false")
            return false;
        if (/^-?\d+(?:\.\d+)?$/.test(t))
            return Number(t);
        if ((t.startsWith("{") && t.endsWith("}")) ||
            (t.startsWith("[") && t.endsWith("]"))) {
            try {
                return JSON.parse(t);
            }
            catch (_a) {
                if (t.startsWith("[") && t.endsWith("]")) {
                    const inner = t.slice(1, -1).trim();
                    if (!inner)
                        return [];
                    const parts = inner.split(",").map((s) => s.trim());
                    return parts.map((p) => {
                        const unq = p.replace(/^['"]|['"]$/g, "");
                        if (/^-?\d+(?:\.\d+)?$/.test(unq))
                            return Number(unq);
                        if (unq === "true")
                            return true;
                        if (unq === "false")
                            return false;
                        if (unq === "null")
                            return null;
                        return unq;
                    });
                }
            }
        }
        return value;
    }
}
//# sourceMappingURL=FalkorDBService.js.map
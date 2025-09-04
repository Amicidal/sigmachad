import { createClient as createRedisClient } from 'redis';
export class FalkorDBService {
    falkordbClient;
    initialized = false;
    config;
    constructor(config) {
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
            console.log('✅ FalkorDB connection established');
        }
        catch (error) {
            console.error('❌ FalkorDB initialization failed:', error);
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
            throw new Error('FalkorDB not initialized');
        }
        return this.falkordbClient;
    }
    async query(query, params = {}) {
        if (!this.initialized) {
            throw new Error('FalkorDB not initialized');
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
                const replacementValue = this.parameterToCypherString(value);
                // Use word boundaries to ensure exact matches
                const regex = new RegExp(`\\$${key}\\b`, 'g');
                processedQuery = processedQuery.replace(regex, replacementValue);
            }
            const result = await this.falkordbClient.sendCommand(['GRAPH.QUERY', 'memento', processedQuery]);
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
                                    obj[headerName] = row[index];
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
            console.error('FalkorDB query error:', error);
            console.error('Original query was:', query);
            console.error('Processed query was:', processedQuery);
            console.error('Params were:', params);
            throw error;
        }
    }
    async command(...args) {
        if (!this.initialized) {
            throw new Error('FalkorDB not initialized');
        }
        return this.falkordbClient.sendCommand(args);
    }
    async setupGraph() {
        if (!this.initialized) {
            throw new Error('FalkorDB not initialized');
        }
        try {
            // Create graph if it doesn't exist
            await this.command('GRAPH.QUERY', 'memento', 'MATCH (n) RETURN count(n) LIMIT 1');
            console.log('📊 Setting up FalkorDB graph indexes...');
            // Create indexes for better query performance
            // Index on node ID for fast lookups
            await this.command('GRAPH.QUERY', 'memento', 'CREATE INDEX FOR (n:Entity) ON (n.id)');
            // Index on node type for filtering
            await this.command('GRAPH.QUERY', 'memento', 'CREATE INDEX FOR (n:Entity) ON (n.type)');
            // Index on node path for file-based queries
            await this.command('GRAPH.QUERY', 'memento', 'CREATE INDEX FOR (n:Entity) ON (n.path)');
            // Index on node language for language-specific queries
            await this.command('GRAPH.QUERY', 'memento', 'CREATE INDEX FOR (n:Entity) ON (n.language)');
            // Index on lastModified for temporal queries
            await this.command('GRAPH.QUERY', 'memento', 'CREATE INDEX FOR (n:Entity) ON (n.lastModified)');
            // Composite index for common query patterns
            await this.command('GRAPH.QUERY', 'memento', 'CREATE INDEX FOR (n:Entity) ON (n.type, n.path)');
            console.log('✅ FalkorDB graph indexes created');
        }
        catch (error) {
            // Graph doesn't exist, it will be created on first write
            console.log('📊 FalkorDB graph will be created on first write operation with indexes');
        }
    }
    async healthCheck() {
        try {
            await this.falkordbClient.ping();
            return true;
        }
        catch (error) {
            console.error('FalkorDB health check failed:', error);
            return false;
        }
    }
    sanitizeParameterValue(value) {
        // Deep clone to prevent mutations of original object
        if (value === null || value === undefined) {
            return value;
        }
        if (typeof value === 'string') {
            // Remove or escape potentially dangerous characters
            return value.replace(/['"`\\]/g, '\\$&');
        }
        if (Array.isArray(value)) {
            return value.map(item => this.sanitizeParameterValue(item));
        }
        if (typeof value === 'object') {
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
    parameterToCypherString(value) {
        if (value === null || value === undefined) {
            return 'null';
        }
        if (typeof value === 'string') {
            return `'${value}'`;
        }
        if (typeof value === 'boolean' || typeof value === 'number') {
            return String(value);
        }
        if (Array.isArray(value)) {
            const elements = value.map(item => this.parameterToCypherString(item));
            return `[${elements.join(', ')}]`;
        }
        if (typeof value === 'object') {
            return this.objectToCypherProperties(value);
        }
        // For other types, convert to string and quote
        return `'${String(value)}'`;
    }
    objectToCypherProperties(obj) {
        const props = Object.entries(obj)
            .map(([key, value]) => {
            // Validate property key
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
                throw new Error(`Invalid property name: ${key}`);
            }
            if (typeof value === 'string') {
                return `${key}: '${value}'`;
            }
            else if (Array.isArray(value)) {
                // Handle arrays properly for Cypher
                const arrayElements = value.map(item => {
                    if (typeof item === 'string') {
                        return `'${item}'`;
                    }
                    else if (item === null || item === undefined) {
                        return 'null';
                    }
                    else {
                        return String(item);
                    }
                });
                return `${key}: [${arrayElements.join(', ')}]`;
            }
            else if (value === null || value === undefined) {
                return `${key}: null`;
            }
            else if (typeof value === 'boolean' || typeof value === 'number') {
                return `${key}: ${value}`;
            }
            else {
                // For other types, convert to string and quote
                return `${key}: '${String(value)}'`;
            }
        })
            .join(', ');
        return `{${props}}`;
    }
}
//# sourceMappingURL=FalkorDBService.js.map
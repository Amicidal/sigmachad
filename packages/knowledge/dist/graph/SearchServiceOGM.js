/**
 * Search Service OGM Implementation
 * Uses Neogma for structural searches while keeping embedding service for semantic search
 */
import { EventEmitter } from 'events';
import { createEntityModels } from '../../models/ogm/EntityModels.js';
// Simple cache for search results (reused from original)
class SearchCache {
    constructor(maxSize = 100, ttl = 300000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl;
    }
    generateKey(obj) {
        return JSON.stringify(obj, Object.keys(obj).sort());
    }
    get(key) {
        const cacheKey = this.generateKey(key);
        const entry = this.cache.get(cacheKey);
        if (!entry)
            return null;
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(cacheKey);
            return null;
        }
        return entry.data;
    }
    set(key, value) {
        const cacheKey = this.generateKey(key);
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey)
                this.cache.delete(firstKey);
        }
        this.cache.set(cacheKey, {
            data: value,
            timestamp: Date.now(),
        });
    }
    clear() {
        this.cache.clear();
    }
    invalidate(pattern) {
        if (!pattern) {
            this.clear();
            return;
        }
        for (const [key] of this.cache) {
            if (pattern(key)) {
                this.cache.delete(key);
            }
        }
    }
    get size() {
        return this.cache.size;
    }
}
export class SearchServiceOGM extends EventEmitter {
    constructor(neogmaService, embeddingService) {
        super();
        this.neogmaService = neogmaService;
        this.embeddingService = embeddingService;
        const neogma = this.neogmaService.getNeogmaInstance();
        this.models = createEntityModels(neogma);
        this.searchCache = new SearchCache(500, 300000); // 5 min TTL
        // Forward NeogmaService events
        this.neogmaService.on('error', (data) => {
            this.emit('error', { source: 'neogma', ...data });
        });
    }
    /**
     * Unified search combining structural and semantic
     */
    async search(request) {
        // Check cache
        const cached = this.searchCache.get(request);
        if (cached) {
            this.emit('search:cache:hit', { query: request.query });
            return cached;
        }
        let results = [];
        // Determine search strategy based on request
        const strategy = this.determineSearchStrategy(request);
        switch (strategy) {
            case 'structural':
                results = await this.structuralSearch(request.query, {
                    limit: request.limit,
                    filter: request.filters,
                    fuzzy: false,
                });
                break;
            case 'semantic':
                results = await this.semanticSearch(request.query, {
                    limit: request.limit,
                    filter: request.filters,
                });
                break;
            case 'hybrid':
                results = await this.hybridSearch(request);
                break;
        }
        // Apply post-processing (if needed)
        // Note: sortBy and groupBy are not part of GraphSearchRequest interface
        // These would be handled by the API layer if needed
        // Cache and return
        this.searchCache.set(request, results);
        this.emit('search:completed', {
            query: request.query,
            strategy,
            count: results.length,
        });
        return results;
    }
    /**
     * Structural search using Neogma query builder
     */
    async structuralSearch(query, options = {}) {
        var _a, _b, _c, _d, _e;
        const limit = options.limit || 50;
        const results = [];
        try {
            // Search across different entity types using their specific models
            const searchPromises = [];
            // Search in files
            if (!((_a = options.filter) === null || _a === void 0 ? void 0 : _a.type) || options.filter.type === 'file') {
                searchPromises.push(this.searchInModel(this.models.FileModel, query, options, 'file').catch(() => []));
            }
            // Search in symbols
            if (!((_b = options.filter) === null || _b === void 0 ? void 0 : _b.type) || ['symbol', 'function', 'class', 'interface'].includes(options.filter.type)) {
                searchPromises.push(this.searchInModel(this.models.SymbolModel, query, options, 'symbol').catch(() => []), this.searchInModel(this.models.FunctionSymbolModel, query, options, 'symbol').catch(() => []), this.searchInModel(this.models.ClassSymbolModel, query, options, 'symbol').catch(() => []), this.searchInModel(this.models.InterfaceSymbolModel, query, options, 'symbol').catch(() => []));
            }
            // Search in modules
            if (!((_c = options.filter) === null || _c === void 0 ? void 0 : _c.type) || options.filter.type === 'module') {
                searchPromises.push(this.searchInModel(this.models.ModuleModel, query, options, 'module').catch(() => []));
            }
            // Search in tests
            if (!((_d = options.filter) === null || _d === void 0 ? void 0 : _d.type) || options.filter.type === 'test') {
                searchPromises.push(this.searchInModel(this.models.TestModel, query, options, 'test').catch(() => []));
            }
            // Search in specifications
            if (!((_e = options.filter) === null || _e === void 0 ? void 0 : _e.type) || options.filter.type === 'specification') {
                searchPromises.push(this.searchInModel(this.models.SpecificationModel, query, options, 'specification').catch(() => []));
            }
            // Execute all searches in parallel
            const searchResults = await Promise.all(searchPromises);
            // Flatten and combine results
            for (const modelResults of searchResults) {
                results.push(...modelResults);
            }
            // Sort by score and limit
            results.sort((a, b) => b.score - a.score);
            return results.slice(0, limit);
        }
        catch (error) {
            this.emit('error', { operation: 'structuralSearch', error, query, options });
            throw error;
        }
    }
    /**
     * Search within a specific Neogma model
     */
    async searchInModel(Model, query, options, entityType) {
        try {
            if (options.fuzzy) {
                // For fuzzy search, we need to fall back to raw Cypher with APOC
                // Since Neogma doesn't have built-in fuzzy text search
                return this.fuzzySearchInModel(Model, query, options, entityType);
            }
            else {
                // Fallback to raw Cypher for now since Neogma query builder has issues
                const label = Model.label || 'Entity';
                const cypherQuery = `
          MATCH (n:${label})
          WHERE (n.name CONTAINS $query OR n.path CONTAINS $query OR n.id CONTAINS $query)
          ${this.buildFilterClause(options.filter)}
          RETURN n
          LIMIT $limit
        `;
                const params = {
                    query: options.caseInsensitive ? query.toLowerCase() : query,
                    limit: options.limit || 50,
                    ...this.buildFilterParams(options.filter),
                };
                const results = await this.neogmaService.executeCypher(cypherQuery, params);
                return results.map(row => ({
                    entity: this.parseEntity(row.n),
                    score: 1.0, // Exact match score
                    type: 'structural',
                }));
            }
        }
        catch (error) {
            // Log error but don't fail the entire search
            console.warn(`Search failed in ${entityType} model:`, error);
            return [];
        }
    }
    /**
     * Fuzzy search using raw Cypher with APOC (fallback when Neogma doesn't support it)
     */
    async fuzzySearchInModel(Model, query, options, entityType) {
        try {
            const label = Model.label || 'Entity';
            const cypherQuery = `
        MATCH (n:${label})
        WITH n, apoc.text.levenshteinSimilarity(
          coalesce(n.name, ''),
          $query
        ) AS nameSimilarity,
        apoc.text.levenshteinSimilarity(
          coalesce(n.path, ''),
          $query
        ) AS pathSimilarity
        WITH n, GREATEST(nameSimilarity, pathSimilarity) AS similarity
        WHERE similarity > 0.6
        ${this.buildFilterClause(options.filter)}
        RETURN n, similarity AS score
        ORDER BY score DESC
        LIMIT $limit
      `;
            const params = {
                query,
                limit: options.limit || 50,
                ...this.buildFilterParams(options.filter),
            };
            const results = await this.neogmaService.executeCypher(cypherQuery, params);
            return results.map(row => ({
                entity: this.parseEntity(row.n),
                score: row.score,
                type: 'structural',
            }));
        }
        catch (error) {
            // If APOC is not available, fall back to exact search
            console.warn(`Fuzzy search failed in ${entityType} model, falling back to exact search:`, error);
            return this.searchInModel(Model, query, { ...options, fuzzy: false }, entityType);
        }
    }
    /**
     * Semantic search using embeddings
     */
    async semanticSearch(query, options = {}) {
        const results = await this.embeddingService.search(query, options);
        return results.map(result => ({
            entity: result.entity,
            score: result.score,
            type: 'semantic',
            metadata: result.metadata,
        }));
    }
    /**
     * Hybrid search combining structural and semantic
     */
    async hybridSearch(request) {
        const [structural, semantic] = await Promise.all([
            this.structuralSearch(request.query, {
                limit: request.limit ? Math.ceil(request.limit / 2) : 25,
                filter: request.filters,
                fuzzy: false,
            }),
            this.semanticSearch(request.query, {
                limit: request.limit ? Math.ceil(request.limit / 2) : 25,
                filter: request.filters,
            }),
        ]);
        // Merge and deduplicate results
        const merged = new Map();
        // Add structural results with boost
        structural.forEach(result => {
            merged.set(result.entity.id, {
                ...result,
                score: result.score * 1.2, // Boost structural matches
                type: 'hybrid',
            });
        });
        // Add or merge semantic results
        semantic.forEach(result => {
            const existing = merged.get(result.entity.id);
            if (existing) {
                // Average the scores if found in both
                existing.score = (existing.score + result.score) / 2;
            }
            else {
                merged.set(result.entity.id, {
                    ...result,
                    type: 'hybrid',
                });
            }
        });
        // Sort by score and limit
        const results = Array.from(merged.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, request.limit || 50);
        return results;
    }
    /**
     * Find symbols by name using Neogma models
     */
    async findSymbolsByName(name, options = {}) {
        const results = await this.structuralSearch(name, {
            fuzzy: options.fuzzy,
            limit: options.limit,
            filter: { type: 'symbol' },
        });
        return results.map(r => r.entity);
    }
    /**
     * Find nearby symbols in the same file
     */
    async findNearbySymbols(filePath, position, options = {}) {
        const range = options.range || 50; // Default 50 lines range
        const limit = options.limit || 10;
        try {
            // Use raw Cypher for location-based queries as Neogma doesn't have built-in support for this
            const query = `
        MATCH (n:Entity)
        WHERE n.path = $filePath
          AND n.line >= $minLine
          AND n.line <= $maxLine
        RETURN n
        ORDER BY abs(n.line - $targetLine)
        LIMIT $limit
      `;
            const params = {
                filePath,
                minLine: Math.max(0, position.line - range),
                maxLine: position.line + range,
                targetLine: position.line,
                limit,
            };
            const results = await this.neogmaService.executeCypher(query, params);
            return results.map(row => this.parseEntity(row.n));
        }
        catch (error) {
            this.emit('error', { operation: 'findNearbySymbols', error, filePath, position });
            throw error;
        }
    }
    /**
     * Advanced pattern search using regex or glob patterns
     */
    async patternSearch(pattern, options = {}) {
        const limit = options.limit || 50;
        let query;
        let params = { pattern, limit };
        if (options.type === 'regex') {
            query = `
        MATCH (n:Entity)
        WHERE n.name =~ $pattern
           OR n.path =~ $pattern
        RETURN n
        LIMIT $limit
      `;
        }
        else {
            // Glob pattern - convert to regex
            const regexPattern = pattern
                .replace(/\*/g, '.*')
                .replace(/\?/g, '.');
            query = `
        MATCH (n:Entity)
        WHERE n.name =~ $regexPattern
           OR n.path =~ $regexPattern
        RETURN n
        LIMIT $limit
      `;
            params.regexPattern = regexPattern;
        }
        try {
            const results = await this.neogmaService.executeCypher(query, params);
            return results.map(row => this.parseEntity(row.n));
        }
        catch (error) {
            this.emit('error', { operation: 'patternSearch', error, pattern, options });
            throw error;
        }
    }
    /**
     * Get entity examples with code snippets
     */
    async getEntityExamples(entityId) {
        try {
            // First get the entity
            const entityQuery = `
        MATCH (n:Entity {id: $id})
        RETURN n
      `;
            const entityResult = await this.neogmaService.executeCypher(entityQuery, {
                id: entityId,
            });
            if (entityResult.length === 0) {
                return {
                    entityId,
                    signature: '',
                    usageExamples: [],
                    testExamples: [],
                    relatedPatterns: []
                };
            }
            const entity = this.parseEntity(entityResult[0].n);
            // Find usage examples through relationships
            const usageQuery = `
        MATCH (n:Entity {id: $id})<-[:CALLS|REFERENCES|USES]-(caller)
        RETURN caller
        LIMIT 5
      `;
            const usageResults = await this.neogmaService.executeCypher(usageQuery, {
                id: entityId,
            });
            const usageExamples = usageResults.map(row => {
                const caller = this.parseEntity(row.caller);
                return {
                    context: `Used in ${caller.type}: ${caller.name}`,
                    code: caller.content || '',
                    file: caller.path || 'unknown',
                    line: caller.line || 0,
                };
            });
            return {
                entityId,
                signature: entity.signature || '',
                usageExamples,
                testExamples: [], // TODO: Add test examples logic
                relatedPatterns: [], // TODO: Add pattern analysis
            };
        }
        catch (error) {
            this.emit('error', { operation: 'getEntityExamples', error, entityId });
            throw error;
        }
    }
    /**
     * Get search statistics
     */
    async getSearchStats() {
        // This would normally track actual metrics
        // For now, return basic cache data
        return {
            cacheSize: this.searchCache.size,
            cacheHitRate: 0.75, // Would track this
            topSearches: [], // Would track this
        };
    }
    /**
     * Clear search cache
     */
    clearCache() {
        this.searchCache.clear();
        this.emit('cache:cleared');
    }
    /**
     * Invalidate cache entries matching a pattern
     */
    invalidateCache(pattern) {
        this.searchCache.invalidate(pattern);
        this.emit('cache:invalidated');
    }
    /**
     * Determine optimal search strategy
     */
    determineSearchStrategy(request) {
        // If query looks like a path or ID, use structural
        if (request.query.includes('/') || request.query.includes(':')) {
            return 'structural';
        }
        // If filter is complex, use structural
        if (request.filters && Object.keys(request.filters).length > 2) {
            return 'structural';
        }
        // If semantic search is explicitly requested
        if (request.searchType === 'semantic') {
            return 'semantic';
        }
        // If structural search is explicitly requested
        if (request.searchType === 'structural') {
            return 'structural';
        }
        // Default to hybrid for general queries
        return 'hybrid';
    }
    /**
     * Build filter clause for Cypher queries
     */
    buildFilterClause(filter) {
        if (!filter || Object.keys(filter).length === 0) {
            return '';
        }
        const clauses = Object.entries(filter).map(([key, value]) => {
            if (value === null) {
                return `n.${key} IS NULL`;
            }
            else if (typeof value === 'object' && value.$ne !== undefined) {
                return `n.${key} <> $filter_${key}_ne`;
            }
            else {
                return `n.${key} = $filter_${key}`;
            }
        });
        return `AND ${clauses.join(' AND ')}`;
    }
    /**
     * Build filter parameters for Cypher queries
     */
    buildFilterParams(filter) {
        const params = {};
        if (!filter)
            return params;
        Object.entries(filter).forEach(([key, value]) => {
            if (typeof value === 'object' && value.$ne !== undefined) {
                params[`filter_${key}_ne`] = value.$ne;
            }
            else {
                params[`filter_${key}`] = value;
            }
        });
        return params;
    }
    /**
     * Sort search results
     */
    sortResults(results, sortBy) {
        return results.sort((a, b) => {
            const aVal = a.entity[sortBy];
            const bVal = b.entity[sortBy];
            if (aVal < bVal)
                return -1;
            if (aVal > bVal)
                return 1;
            return b.score - a.score; // Fall back to score
        });
    }
    /**
     * Group search results
     */
    groupResults(results, groupBy) {
        const grouped = new Map();
        results.forEach(result => {
            const key = result.entity[groupBy] || 'unknown';
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key).push(result);
        });
        // Flatten groups, keeping best from each
        const flattened = [];
        grouped.forEach(group => {
            group.sort((a, b) => b.score - a.score);
            flattened.push(...group.slice(0, 3)); // Top 3 from each group
        });
        return flattened;
    }
    /**
     * Parse entity from Neo4j result
     */
    parseEntity(node) {
        const properties = node.properties || node;
        const entity = {};
        for (const [key, value] of Object.entries(properties)) {
            if (value === null || value === undefined)
                continue;
            if (key === 'created' || key === 'lastModified' || key.endsWith('At')) {
                entity[key] = new Date(value);
            }
            else if (typeof value === 'string' &&
                (value.startsWith('[') || value.startsWith('{'))) {
                try {
                    entity[key] = JSON.parse(value);
                }
                catch (_a) {
                    entity[key] = value;
                }
            }
            else {
                entity[key] = value;
            }
        }
        return entity;
    }
}
//# sourceMappingURL=SearchServiceOGM.js.map
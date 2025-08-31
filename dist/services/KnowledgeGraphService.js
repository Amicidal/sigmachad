/**
 * Knowledge Graph Service for Memento
 * Manages graph operations, vector embeddings, and entity relationships
 */
import { RelationshipType } from '../models/relationships.js';
import { embeddingService } from '../utils/embedding.js';
export class KnowledgeGraphService {
    db;
    constructor(db) {
        this.db = db;
    }
    async initialize() {
        // Ensure database is ready
        await this.db.initialize();
        // Verify graph indexes exist
        try {
            const indexCheck = await this.db.falkordbQuery('CALL db.indexes()', {});
            if (indexCheck && indexCheck.length > 0) {
                console.log(`✅ Graph indexes verified: ${indexCheck.length} indexes found`);
            }
            else {
                console.log('⚠️ No graph indexes found, they will be created on next setupDatabase call');
            }
        }
        catch (error) {
            // Indexes might not be queryable yet, this is okay
            console.log('📊 Graph indexes will be verified on first query');
        }
    }
    hasCodebaseProperties(entity) {
        return 'path' in entity && 'hash' in entity && 'language' in entity &&
            'lastModified' in entity && 'created' in entity;
    }
    // Entity CRUD operations
    async createEntity(entity) {
        const nodeId = entity.id;
        const labels = this.getEntityLabels(entity);
        const properties = this.sanitizeProperties(entity);
        // Create node in FalkorDB with type as both label and property
        const createQuery = `
      CREATE (n${labels.join(':')}:${entity.type} {
        id: $id,
        type: $type,
        path: $path,
        hash: $hash,
        language: $language,
        lastModified: $lastModified,
        created: $created,
        metadata: $metadata
      })
    `;
        // Only include path/hash/language if the entity has them (codebase entities)
        const hasCodebaseProps = this.hasCodebaseProperties(entity);
        const queryParams = {
            id: nodeId,
            type: entity.type,
            path: hasCodebaseProps ? entity.path : '',
            hash: hasCodebaseProps ? entity.hash : '',
            language: hasCodebaseProps ? entity.language : '',
            lastModified: hasCodebaseProps ? entity.lastModified.toISOString() : new Date().toISOString(),
            created: hasCodebaseProps ? entity.created.toISOString() : new Date().toISOString(),
            metadata: JSON.stringify(entity.metadata || {}),
        };
        await this.db.falkordbQuery(createQuery, queryParams);
        // Create vector embedding for semantic search
        await this.createEmbedding(entity);
        console.log(`✅ Created entity: ${hasCodebaseProps ? entity.path : entity.id} (${entity.type})`);
    }
    async getEntity(entityId) {
        const query = `
      MATCH (n {id: $id})
      RETURN n
    `;
        const result = await this.db.falkordbQuery(query, { id: entityId });
        if (!result || result.length === 0) {
            return null;
        }
        return this.parseEntityFromGraph(result[0]);
    }
    async updateEntity(entityId, updates) {
        const setClause = Object.keys(updates)
            .map(key => `n.${key} = $${key}`)
            .join(', ');
        const query = `
      MATCH (n {id: $id})
      SET ${setClause}
      RETURN n
    `;
        const params = { id: entityId, ...updates };
        await this.db.falkordbQuery(query, params);
        // Update vector embedding
        const updatedEntity = await this.getEntity(entityId);
        if (updatedEntity) {
            await this.updateEmbedding(updatedEntity);
        }
    }
    async deleteEntity(entityId) {
        // Delete relationships first
        await this.db.falkordbQuery(`
      MATCH (n {id: $id})-[r]-()
      DELETE r
    `, { id: entityId });
        // Delete node
        await this.db.falkordbQuery(`
      MATCH (n {id: $id})
      DELETE n
    `, { id: entityId });
        // Delete vector embedding
        await this.deleteEmbedding(entityId);
    }
    // Relationship operations
    async createRelationship(relationship) {
        const query = `
      MATCH (a {id: $fromId}), (b {id: $toId})
      CREATE (a)-[r:${relationship.type} {
        id: $id,
        created: $created,
        lastModified: $lastModified,
        version: $version,
        metadata: $metadata
      }]->(b)
    `;
        await this.db.falkordbQuery(query, {
            fromId: relationship.fromEntityId,
            toId: relationship.toEntityId,
            id: relationship.id,
            created: relationship.created.toISOString(),
            lastModified: relationship.lastModified.toISOString(),
            version: relationship.version,
            metadata: JSON.stringify(relationship.metadata || {}),
        });
    }
    async getRelationships(query) {
        let matchClause = 'MATCH (a)-[r]-(b)';
        const whereClause = [];
        const params = {};
        if (query.fromEntityId) {
            whereClause.push('a.id = $fromId');
            params.fromId = query.fromEntityId;
        }
        if (query.toEntityId) {
            whereClause.push('b.id = $toId');
            params.toId = query.toEntityId;
        }
        if (query.type && query.type.length > 0) {
            const types = Array.isArray(query.type) ? query.type : [query.type];
            whereClause.push(`type(r) IN [${types.map(t => '$' + t).join(', ')}]`);
            types.forEach((type, index) => {
                params[type] = type;
            });
        }
        if (query.since) {
            whereClause.push('r.created >= $since');
            params.since = query.since.toISOString();
        }
        const fullQuery = `
      ${matchClause}
      ${whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : ''}
      RETURN r, a.id as fromId, b.id as toId
      ${query.limit ? 'LIMIT $limit' : ''}
      ${query.offset ? 'SKIP $offset' : ''}
    `;
        if (query.limit)
            params.limit = query.limit;
        if (query.offset)
            params.offset = query.offset;
        const result = await this.db.falkordbQuery(fullQuery, params);
        return result.map((row) => this.parseRelationshipFromGraph(row));
    }
    // Graph search operations
    async search(request) {
        // For semantic search, use vector similarity
        if (request.searchType === 'semantic') {
            return this.semanticSearch(request);
        }
        // For structural search, use graph traversal
        return this.structuralSearch(request);
    }
    async semanticSearch(request) {
        // Get vector embeddings for the query
        const embeddings = await this.generateEmbedding({
            content: request.query,
            type: 'search_query'
        });
        // Search in Qdrant
        const searchResult = await this.db.qdrant.search('code_embeddings', {
            vector: embeddings,
            limit: request.limit || 10,
            with_payload: true,
            with_vector: false,
        });
        // Get entities from graph database
        const searchResultData = searchResult;
        const points = searchResultData.points || searchResultData.results || [];
        const entities = [];
        for (const point of points) {
            // Get the actual entity ID from the payload, not the numeric ID
            const entityId = point.payload?.entityId;
            if (entityId) {
                const entity = await this.getEntity(entityId);
                if (entity) {
                    entities.push(entity);
                }
            }
        }
        return entities;
    }
    async structuralSearch(request) {
        let query = 'MATCH (n)';
        const whereClause = [];
        const params = {};
        // Add entity type filters
        if (request.entityTypes && request.entityTypes.length > 0) {
            whereClause.push(`n.type IN [${request.entityTypes.map(t => '$' + t).join(', ')}]`);
            request.entityTypes.forEach((type, index) => {
                params[type] = type;
            });
        }
        // Add path filters
        if (request.filters?.path) {
            whereClause.push('n.path CONTAINS $path');
            params.path = request.filters.path;
        }
        // Add language filters
        if (request.filters?.language) {
            whereClause.push('n.language = $language');
            params.language = request.filters.language;
        }
        // Add time filters
        if (request.filters?.lastModified?.since) {
            whereClause.push('n.lastModified >= $since');
            params.since = request.filters.lastModified.since.toISOString();
        }
        if (request.filters?.lastModified?.until) {
            whereClause.push('n.lastModified <= $until');
            params.until = request.filters.lastModified.until.toISOString();
        }
        const fullQuery = `
      ${query}
      ${whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : ''}
      RETURN n
      ${request.limit ? 'LIMIT $limit' : ''}
    `;
        if (request.limit)
            params.limit = request.limit;
        const result = await this.db.falkordbQuery(fullQuery, params);
        return result.map((row) => this.parseEntityFromGraph(row));
    }
    async getEntityExamples(entityId) {
        const entity = await this.getEntity(entityId);
        if (!entity) {
            throw new Error(`Entity ${entityId} not found`);
        }
        // Get usage examples from relationships
        const usageRelationships = await this.getRelationships({
            toEntityId: entityId,
            type: [RelationshipType.CALLS, RelationshipType.REFERENCES, RelationshipType.USES],
            limit: 10,
        });
        const usageExamples = await Promise.all(usageRelationships.map(async (rel) => {
            const caller = await this.getEntity(rel.fromEntityId);
            if (caller && this.hasCodebaseProperties(caller)) {
                return {
                    context: `${caller.path}:${rel.type}`,
                    code: `// Usage in ${caller.path}`,
                    file: caller.path,
                    line: 1, // Would need to be determined from AST
                };
            }
            return null;
        })).then(examples => examples.filter((ex) => ex !== null));
        // Get test examples
        const testRelationships = await this.getRelationships({
            toEntityId: entityId,
            type: RelationshipType.TESTS,
            limit: 5,
        });
        const testExamples = await Promise.all(testRelationships.map(async (rel) => {
            const test = await this.getEntity(rel.fromEntityId);
            if (test && test.type === 'test' && this.hasCodebaseProperties(entity)) {
                return {
                    testId: test.id,
                    testName: test.testType,
                    testCode: `// Test for ${entity.path}`,
                    assertions: [],
                };
            }
            return null;
        })).then(examples => examples.filter((ex) => ex !== null));
        return {
            entityId,
            signature: this.getEntitySignature(entity),
            usageExamples,
            testExamples,
            relatedPatterns: [], // Would be populated from usage analysis
        };
    }
    async getEntityDependencies(entityId) {
        const entity = await this.getEntity(entityId);
        if (!entity) {
            throw new Error(`Entity ${entityId} not found`);
        }
        // Get direct dependencies
        const directDeps = await this.getRelationships({
            fromEntityId: entityId,
            type: [RelationshipType.CALLS, RelationshipType.REFERENCES, RelationshipType.USES, RelationshipType.DEPENDS_ON],
        });
        // Get reverse dependencies
        const reverseDeps = await this.getRelationships({
            toEntityId: entityId,
            type: [RelationshipType.CALLS, RelationshipType.REFERENCES, RelationshipType.USES, RelationshipType.DEPENDS_ON],
        });
        return {
            entityId,
            directDependencies: directDeps.map(rel => ({
                entity: null, // Would need to fetch entity
                relationship: rel.type,
                strength: 1,
            })),
            indirectDependencies: [],
            reverseDependencies: reverseDeps.map(rel => ({
                entity: null,
                relationship: rel.type,
                impact: 'medium',
            })),
            circularDependencies: [],
        };
    }
    // Path finding and traversal
    async findPaths(query) {
        let cypherQuery;
        const params = { startId: query.startEntityId };
        // Build the query based on whether relationship types are specified
        if (query.relationshipTypes && query.relationshipTypes.length > 0) {
            // FalkorDB syntax for relationship types with depth
            const relTypes = query.relationshipTypes.join('|');
            cypherQuery = `
        MATCH path = (start {id: $startId})-[:${relTypes}*1..${query.maxDepth || 5}]-(end ${query.endEntityId ? '{id: $endId}' : ''})
        RETURN path
        LIMIT 10
      `;
        }
        else {
            // No specific relationship types
            cypherQuery = `
        MATCH path = (start {id: $startId})-[*1..${query.maxDepth || 5}]-(end ${query.endEntityId ? '{id: $endId}' : ''})
        RETURN path
        LIMIT 10
      `;
        }
        if (query.endEntityId) {
            params.endId = query.endEntityId;
        }
        const result = await this.db.falkordbQuery(cypherQuery, params);
        return result;
    }
    async traverseGraph(query) {
        let cypherQuery;
        const params = { startId: query.startEntityId };
        if (query.relationshipTypes && query.relationshipTypes.length > 0) {
            const relTypes = query.relationshipTypes.join('|');
            cypherQuery = `
        MATCH (start {id: $startId})-[:${relTypes}*1..${query.maxDepth || 3}]-(connected)
        RETURN DISTINCT connected
        LIMIT ${query.limit || 50}
      `;
        }
        else {
            cypherQuery = `
        MATCH (start {id: $startId})-[*1..${query.maxDepth || 3}]-(connected)
        RETURN DISTINCT connected
        LIMIT ${query.limit || 50}
      `;
        }
        const result = await this.db.falkordbQuery(cypherQuery, params);
        return result.map((row) => this.parseEntityFromGraph(row));
    }
    // Vector embedding operations
    async createEmbeddingsBatch(entities) {
        try {
            const inputs = entities.map(entity => ({
                content: this.getEntityContentForEmbedding(entity),
                entityId: entity.id,
            }));
            const batchResult = await embeddingService.generateEmbeddingsBatch(inputs);
            // Store embeddings in Qdrant
            for (let i = 0; i < entities.length; i++) {
                const entity = entities[i];
                const embedding = batchResult.results[i].embedding;
                const collection = this.getEmbeddingCollection(entity);
                const hasCodebaseProps = this.hasCodebaseProperties(entity);
                // Convert string ID to numeric ID for Qdrant
                const numericId = this.stringToNumericId(entity.id);
                await this.db.qdrant.upsert(collection, {
                    points: [{
                            id: numericId,
                            vector: embedding,
                            payload: {
                                entityId: entity.id,
                                type: entity.type,
                                path: hasCodebaseProps ? entity.path : '',
                                language: hasCodebaseProps ? entity.language : '',
                                lastModified: hasCodebaseProps ? entity.lastModified.toISOString() : new Date().toISOString(),
                            },
                        }],
                });
            }
            console.log(`✅ Created embeddings for ${entities.length} entities (${batchResult.totalTokens} tokens, $${batchResult.totalCost.toFixed(4)})`);
        }
        catch (error) {
            console.error('Failed to create batch embeddings:', error);
            // Fallback to individual processing
            for (const entity of entities) {
                await this.createEmbedding(entity);
            }
        }
    }
    async createEmbedding(entity) {
        const content = this.getEntityContentForEmbedding(entity);
        const embedding = await this.generateEmbedding(content);
        const collection = this.getEmbeddingCollection(entity);
        const hasCodebaseProps = this.hasCodebaseProperties(entity);
        // Convert string ID to numeric ID for Qdrant
        const numericId = this.stringToNumericId(entity.id);
        await this.db.qdrant.upsert(collection, {
            points: [{
                    id: numericId,
                    vector: embedding,
                    payload: {
                        entityId: entity.id,
                        type: entity.type,
                        path: hasCodebaseProps ? entity.path : '',
                        language: hasCodebaseProps ? entity.language : '',
                        lastModified: hasCodebaseProps ? entity.lastModified.toISOString() : new Date().toISOString(),
                    },
                }],
        });
    }
    async updateEmbedding(entity) {
        await this.deleteEmbedding(entity.id);
        await this.createEmbedding(entity);
    }
    async deleteEmbedding(entityId) {
        // Use the same filter for both collections to delete by entityId in payload
        const filter = {
            filter: {
                must: [
                    {
                        key: 'entityId',
                        match: { value: entityId },
                    },
                ],
            },
        };
        try {
            await this.db.qdrant.delete('code_embeddings', filter);
        }
        catch (error) {
            // Collection might not exist or no matching points
        }
        try {
            await this.db.qdrant.delete('documentation_embeddings', filter);
        }
        catch (error) {
            // Collection might not exist or no matching points
        }
    }
    async generateEmbedding(content) {
        try {
            const result = await embeddingService.generateEmbedding(content);
            return result.embedding;
        }
        catch (error) {
            console.error('Failed to generate embedding:', error);
            // Fallback to mock embedding
            return Array.from({ length: 1536 }, () => Math.random() - 0.5);
        }
    }
    // Helper methods
    getEntityLabels(entity) {
        const labels = [entity.type];
        // Add specific labels based on entity type
        if (entity.type === 'file') {
            const fileEntity = entity;
            if (fileEntity.isTest)
                labels.push('test');
            if (fileEntity.isConfig)
                labels.push('config');
        }
        return labels;
    }
    sanitizeProperties(entity) {
        const props = { ...entity };
        // Remove complex objects that can't be stored in graph database
        if ('metadata' in props) {
            delete props.metadata;
        }
        return props;
    }
    parseEntityFromGraph(graphNode) {
        // Parse entity from FalkorDB result format
        // FalkorDB returns data in this format: { n: [ [key1, value1], [key2, value2], ... ] }
        if (graphNode && graphNode.n) {
            const properties = {};
            // Convert FalkorDB array format to object
            for (const [key, value] of graphNode.n) {
                if (key === 'properties') {
                    // Parse nested properties which contain the actual entity data
                    if (Array.isArray(value)) {
                        const nestedProps = {};
                        for (const [propKey, propValue] of value) {
                            nestedProps[propKey] = propValue;
                        }
                        // The actual entity properties are stored in the nested properties
                        Object.assign(properties, nestedProps);
                    }
                }
                else if (key === 'labels') {
                    // Extract type from labels (first label is usually the type)
                    if (Array.isArray(value) && value.length > 0) {
                        properties.type = value[0];
                    }
                }
                else {
                    // Store other direct node properties
                    properties[key] = value;
                }
            }
            // Convert date strings back to Date objects
            if (properties.lastModified && typeof properties.lastModified === 'string') {
                properties.lastModified = new Date(properties.lastModified);
            }
            if (properties.created && typeof properties.created === 'string') {
                properties.created = new Date(properties.created);
            }
            // Parse metadata if it's a JSON string
            if (properties.metadata && typeof properties.metadata === 'string') {
                try {
                    properties.metadata = JSON.parse(properties.metadata);
                }
                catch (e) {
                    // If parsing fails, keep as string
                }
            }
            return properties;
        }
        // Fallback for other formats
        return graphNode;
    }
    parseRelationshipFromGraph(graphResult) {
        // Parse relationship from FalkorDB result format
        // FalkorDB returns: { r: [...relationship data...], fromId: "string", toId: "string" }
        if (graphResult && graphResult.r) {
            const relData = graphResult.r;
            // If it's an array format, parse it
            if (Array.isArray(relData)) {
                const properties = {};
                for (const [key, value] of relData) {
                    if (key === 'properties' && Array.isArray(value)) {
                        // Parse nested properties
                        const nestedProps = {};
                        for (const [propKey, propValue] of value) {
                            nestedProps[propKey] = propValue;
                        }
                        Object.assign(properties, nestedProps);
                    }
                    else if (key === 'type') {
                        // Store the relationship type
                        properties.type = value;
                    }
                    // Skip src_node and dest_node as we use fromId/toId from top level
                }
                // Use the string IDs from the top level instead of numeric node IDs
                properties.fromEntityId = graphResult.fromId;
                properties.toEntityId = graphResult.toId;
                // Parse dates and metadata
                if (properties.created && typeof properties.created === 'string') {
                    properties.created = new Date(properties.created);
                }
                if (properties.lastModified && typeof properties.lastModified === 'string') {
                    properties.lastModified = new Date(properties.lastModified);
                }
                if (properties.metadata && typeof properties.metadata === 'string') {
                    try {
                        properties.metadata = JSON.parse(properties.metadata);
                    }
                    catch (e) {
                        // Keep as string if parsing fails
                    }
                }
                return properties;
            }
        }
        // Fallback to original format
        return graphResult.r;
    }
    getEntityContentForEmbedding(entity) {
        return embeddingService.generateEntityContent(entity);
    }
    getEmbeddingCollection(entity) {
        return entity.type === 'documentation' ? 'documentation_embeddings' : 'code_embeddings';
    }
    getEntitySignature(entity) {
        switch (entity.type) {
            case 'symbol':
                const symbolEntity = entity;
                if (symbolEntity.kind === 'function') {
                    return symbolEntity.signature;
                }
                else if (symbolEntity.kind === 'class') {
                    return `class ${symbolEntity.name}`;
                }
                return symbolEntity.signature;
            default:
                return this.hasCodebaseProperties(entity) ? entity.path : entity.id;
        }
    }
    stringToNumericId(stringId) {
        // Create a numeric hash from string ID for Qdrant compatibility
        let hash = 0;
        for (let i = 0; i < stringId.length; i++) {
            const char = stringId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        // Ensure positive number
        return Math.abs(hash);
    }
}
//# sourceMappingURL=KnowledgeGraphService.js.map
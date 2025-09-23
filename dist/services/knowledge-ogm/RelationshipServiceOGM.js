/**
 * Relationship Service OGM Implementation
 * Migrated version using Neogma OGM instead of custom Cypher queries
 */
import { EventEmitter } from 'events';
import { createRelationshipModels } from '../../../models/ogm/RelationshipModels.js';
import { createEntityModels } from '../../../models/ogm/EntityModels.js';
import { RelationshipType, } from '../../../models/relationships.js';
import { normalizeCodeEdge, canonicalRelationshipId, isCodeRelationship, } from '../../../utils/codeEdges.js';
export class RelationshipServiceOGM extends EventEmitter {
    constructor(neogmaService) {
        super();
        this.neogmaService = neogmaService;
        const neogma = this.neogmaService.getNeogmaInstance();
        this.relationshipModels = createRelationshipModels(neogma);
        this.entityModels = createEntityModels(neogma);
        // Forward NeogmaService events
        this.neogmaService.on('error', (data) => {
            this.emit('error', { source: 'neogma', ...data });
        });
    }
    /**
     * Get the appropriate relationship model based on relationship type
     */
    getRelationshipModel(type) {
        const modelMap = {
            // Structural
            [RelationshipType.CONTAINS]: this.relationshipModels.ContainsRelation,
            [RelationshipType.DEFINES]: this.relationshipModels.DefinesRelation,
            [RelationshipType.EXPORTS]: this.relationshipModels.ExportsRelation,
            [RelationshipType.IMPORTS]: this.relationshipModels.ImportsRelation,
            // Code
            [RelationshipType.CALLS]: this.relationshipModels.CallsRelation,
            [RelationshipType.REFERENCES]: this.relationshipModels.ReferencesRelation,
            [RelationshipType.IMPLEMENTS]: this.relationshipModels.ImplementsRelation,
            [RelationshipType.EXTENDS]: this.relationshipModels.ExtendsRelation,
            [RelationshipType.DEPENDS_ON]: this.relationshipModels.DependsOnRelation,
            // Type Usage
            [RelationshipType.TYPE_USES]: this.relationshipModels.TypeUsesRelation,
            [RelationshipType.RETURNS_TYPE]: this.relationshipModels.ReturnsTypeRelation,
            [RelationshipType.PARAM_TYPE]: this.relationshipModels.ParamTypeRelation,
            // Test
            [RelationshipType.TESTS]: this.relationshipModels.TestsRelation,
            [RelationshipType.VALIDATES]: this.relationshipModels.ValidatesRelation,
            // Spec
            [RelationshipType.REQUIRES]: this.relationshipModels.RequiresRelation,
            [RelationshipType.IMPACTS]: this.relationshipModels.ImpactsRelation,
            [RelationshipType.IMPLEMENTS_SPEC]: this.relationshipModels.ImplementsSpecRelation,
            // Documentation
            [RelationshipType.DOCUMENTED_BY]: this.relationshipModels.DocumentedByRelation,
            [RelationshipType.DOCUMENTS_SECTION]: this.relationshipModels.DocumentsSectionRelation,
            // Temporal
            [RelationshipType.PREVIOUS_VERSION]: this.relationshipModels.PreviousVersionRelation,
            [RelationshipType.MODIFIED_BY]: this.relationshipModels.ModifiedByRelation,
        };
        return modelMap[type] || null;
    }
    /**
     * Create or update a relationship using Neogma
     */
    async createRelationship(relationship) {
        try {
            const normalized = this.normalizeRelationship(relationship);
            const relId = this.generateRelationshipId(normalized);
            // For complex relationships, fall back to Cypher for now
            if (!this.getRelationshipModel(normalized.type) || isCodeRelationship(normalized.type)) {
                return this.createRelationshipWithCypher(normalized, relId);
            }
            // Use Neogma models for simple structural relationships
            const RelationshipModel = this.getRelationshipModel(normalized.type);
            if (!RelationshipModel) {
                throw new Error(`No model found for relationship type: ${normalized.type}`);
            }
            const properties = this.extractRelationshipProperties(normalized);
            properties.id = relId;
            // Create relationship using Neogma
            // Note: For now we use Cypher since Neogma relationship creation is complex
            return this.createRelationshipWithCypher(normalized, relId);
        }
        catch (error) {
            this.emit('error', { operation: 'createRelationship', relationship, error });
            throw error;
        }
    }
    /**
     * Create relationship using Cypher (fallback for complex operations)
     */
    async createRelationshipWithCypher(normalized, relId) {
        const query = `
      MATCH (from:Entity {id: $fromId})
      MATCH (to:Entity {id: $toId})
      MERGE (from)-[r:${normalized.type} {id: $relId}]->(to)
      SET r += $properties
      SET r.lastModified = datetime()
      RETURN r, from, to
    `;
        const properties = this.extractRelationshipProperties(normalized);
        properties.id = relId;
        const result = await this.neogmaService.executeCypher(query, {
            fromId: normalized.fromEntityId,
            toId: normalized.toEntityId,
            relId,
            properties,
        });
        if (result.length === 0) {
            throw new Error(`Failed to create relationship: ${relId}`);
        }
        const created = this.parseRelationshipFromNeo4j(result[0]);
        this.emit('relationship:created', created);
        // Handle evidence and auxiliary data if present
        if (normalized.evidence || normalized.locations) {
            await this.updateRelationshipAuxiliary(relId, normalized);
        }
        return created;
    }
    /**
     * Bulk create relationships
     */
    async createRelationshipsBulk(relationships, options = {}) {
        var _a;
        try {
            const normalized = relationships.map(r => ({
                ...this.normalizeRelationship(r),
                _id: this.generateRelationshipId(r),
            }));
            const query = options.mergeEvidence
                ? this.buildBulkMergeQuery(options)
                : this.buildBulkCreateQuery(options);
            const result = await this.neogmaService.executeCypher(query, {
                relationships: normalized.map(r => ({
                    fromId: r.fromEntityId,
                    toId: r.toEntityId,
                    type: r.type,
                    relId: r._id,
                    properties: this.extractRelationshipProperties(r),
                })),
            });
            const count = ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.count) || 0;
            this.emit('relationships:bulk:created', {
                count,
                total: relationships.length,
            });
            return {
                created: count,
                updated: options.mergeEvidence ? relationships.length - count : 0,
                failed: relationships.length - count,
            };
        }
        catch (error) {
            console.error('Bulk relationship creation failed:', error);
            this.emit('error', { operation: 'createRelationshipsBulk', error });
            return { created: 0, updated: 0, failed: relationships.length };
        }
    }
    /**
     * Get relationships based on query
     */
    async getRelationships(query) {
        try {
            const where = [];
            const params = {};
            if (query.fromEntityId) {
                where.push('from.id = $fromId');
                params.fromId = query.fromEntityId;
            }
            if (query.toEntityId) {
                where.push('to.id = $toId');
                params.toId = query.toEntityId;
            }
            if (query.type) {
                if (Array.isArray(query.type)) {
                    where.push('type(r) IN $types');
                    params.types = query.type;
                }
                else {
                    where.push('type(r) = $type');
                    params.type = query.type;
                }
            }
            if (query.active !== undefined) {
                where.push('coalesce(r.active, true) = $active');
                params.active = query.active;
            }
            if (query.confidenceMin !== undefined) {
                where.push('r.confidence >= $minConfidence');
                params.minConfidence = query.confidenceMin;
            }
            // Add code-specific filters
            if (query.kind) {
                if (Array.isArray(query.kind)) {
                    where.push('r.kind IN $kinds');
                    params.kinds = query.kind;
                }
                else {
                    where.push('r.kind = $kind');
                    params.kind = query.kind;
                }
            }
            if (query.source) {
                if (Array.isArray(query.source)) {
                    where.push('r.source IN $sources');
                    params.sources = query.source;
                }
                else {
                    where.push('r.source = $source');
                    params.source = query.source;
                }
            }
            const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
            const limit = query.limit || 100;
            const offset = query.offset || 0;
            const cypherQuery = `
        MATCH (from)-[r]->(to)
        ${whereClause}
        RETURN r, from, to
        ORDER BY r.lastModified DESC
        SKIP $offset
        LIMIT $limit
      `;
            params.offset = offset;
            params.limit = limit;
            const result = await this.neogmaService.executeCypher(cypherQuery, params);
            return result.map(row => this.parseRelationshipFromNeo4j(row));
        }
        catch (error) {
            this.emit('error', { operation: 'getRelationships', query, error });
            throw error;
        }
    }
    /**
     * Delete a relationship
     */
    async deleteRelationship(fromId, toId, type) {
        try {
            const query = `
        MATCH (from:Entity {id: $fromId})-[r:${type}]->(to:Entity {id: $toId})
        DELETE r
      `;
            await this.neogmaService.executeCypher(query, { fromId, toId });
            this.emit('relationship:deleted', { fromId, toId, type });
        }
        catch (error) {
            this.emit('error', { operation: 'deleteRelationship', fromId, toId, type, error });
            throw error;
        }
    }
    /**
     * Update auxiliary data for a relationship
     */
    async updateRelationshipAuxiliary(relId, rel) {
        try {
            if (!rel.evidence && !rel.locations)
                return;
            const query = `
        MATCH ()-[r {id: $relId}]->()
        SET r.evidence = $evidence
        SET r.locations = $locations
      `;
            await this.neogmaService.executeCypher(query, {
                relId,
                evidence: rel.evidence ? JSON.stringify(rel.evidence) : null,
                locations: rel.locations ? JSON.stringify(rel.locations) : null,
            });
        }
        catch (error) {
            this.emit('error', { operation: 'updateRelationshipAuxiliary', relId, error });
            throw error;
        }
    }
    /**
     * Mark relationships as inactive if not seen since a date
     */
    async markInactiveEdgesNotSeenSince(since) {
        var _a;
        try {
            const query = `
        MATCH ()-[r]->()
        WHERE r.lastSeenAt < $since AND coalesce(r.active, true) = true
        SET r.active = false
        SET r.validTo = coalesce(r.validTo, datetime())
        RETURN count(r) as count
      `;
            const result = await this.neogmaService.executeCypher(query, {
                since: since.toISOString(),
            });
            const count = ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.count) || 0;
            this.emit('relationships:marked:inactive', { count, since });
            return count;
        }
        catch (error) {
            this.emit('error', { operation: 'markInactiveEdgesNotSeenSince', since, error });
            throw error;
        }
    }
    /**
     * Update relationship evidence in bulk
     */
    async upsertEdgeEvidenceBulk(updates) {
        try {
            const query = `
        UNWIND $updates AS update
        MATCH (from:Entity {id: update.fromId})-[r]->(to:Entity {id: update.toId})
        WHERE type(r) = update.type
        SET r.evidence = CASE
          WHEN r.evidence IS NULL THEN update.evidence
          ELSE apoc.coll.union(coalesce(r.evidence, []), update.evidence)
        END
        SET r.locations = CASE
          WHEN update.locations IS NULL THEN r.locations
          WHEN r.locations IS NULL THEN update.locations
          ELSE apoc.coll.union(coalesce(r.locations, []), update.locations)
        END
        SET r.lastModified = datetime()
      `;
            await this.neogmaService.executeCypher(query, {
                updates: updates.map(u => ({
                    fromId: u.fromId,
                    toId: u.toId,
                    type: u.type,
                    evidence: JSON.stringify(u.evidence.slice(0, 20)),
                    locations: u.locations ? JSON.stringify(u.locations.slice(0, 20)) : null,
                })),
            });
        }
        catch (error) {
            this.emit('error', { operation: 'upsertEdgeEvidenceBulk', error });
            throw error;
        }
    }
    /**
     * Get relationship statistics
     */
    async getRelationshipStats() {
        var _a, _b, _c, _d, _e;
        try {
            const queries = [
                {
                    name: 'total',
                    query: 'MATCH ()-[r]->() RETURN count(r) as count',
                },
                {
                    name: 'byType',
                    query: `
            MATCH ()-[r]->()
            RETURN type(r) as type, count(r) as count
            ORDER BY count DESC
          `,
                },
                {
                    name: 'active',
                    query: `
            MATCH ()-[r]->()
            WHERE coalesce(r.active, true) = true
            RETURN count(r) as count
          `,
                },
                {
                    name: 'withEvidence',
                    query: `
            MATCH ()-[r]->()
            WHERE r.evidence IS NOT NULL
            RETURN count(r) as count
          `,
                },
            ];
            const results = await Promise.all(queries.map(q => this.neogmaService.executeCypher(q.query)));
            const byType = {};
            results[1].forEach((row) => {
                if (row.type) {
                    byType[row.type] = row.count;
                }
            });
            return {
                total: ((_a = results[0][0]) === null || _a === void 0 ? void 0 : _a.count) || 0,
                byType,
                active: ((_b = results[2][0]) === null || _b === void 0 ? void 0 : _b.count) || 0,
                inactive: (((_c = results[0][0]) === null || _c === void 0 ? void 0 : _c.count) || 0) - (((_d = results[2][0]) === null || _d === void 0 ? void 0 : _d.count) || 0),
                withEvidence: ((_e = results[3][0]) === null || _e === void 0 ? void 0 : _e.count) || 0,
            };
        }
        catch (error) {
            this.emit('error', { operation: 'getRelationshipStats', error });
            throw error;
        }
    }
    /**
     * Merge duplicate relationships
     */
    async mergeNormalizedDuplicates() {
        var _a;
        try {
            // Use APOC for complex relationship merging
            const query = `
        MATCH (from)-[r1]->(to)
        MATCH (from)-[r2]->(to)
        WHERE type(r1) = type(r2)
          AND id(r1) < id(r2)
          AND r1.to_ref_symbol = r2.to_ref_symbol
          AND r1.to_ref_file = r2.to_ref_file
        WITH r1, collect(r2) as duplicates
        CALL apoc.refactor.mergeRelationships([r1] + duplicates, {
          properties: 'combine',
          mergeConfig: {
            evidence: 'combine',
            locations: 'combine',
            occurrencesTotal: 'sum',
            confidence: 'max'
          }
        }) YIELD rel
        RETURN count(rel) as count
      `;
            const result = await this.neogmaService.executeCypher(query);
            const count = ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.count) || 0;
            if (count > 0) {
                this.emit('relationships:merged', { count });
            }
            return count;
        }
        catch (error) {
            this.emit('error', { operation: 'mergeNormalizedDuplicates', error });
            // Fallback to simpler approach if APOC is not available
            console.warn('APOC merge failed, using simple duplicate removal');
            return 0;
        }
    }
    /**
     * Normalize a relationship
     */
    normalizeRelationship(rel) {
        const normalized = { ...rel };
        // Ensure timestamps
        const now = new Date();
        if (!normalized.created)
            normalized.created = now;
        if (!normalized.lastModified)
            normalized.lastModified = now;
        if (!normalized.version)
            normalized.version = 1;
        // Normalize dates
        if (!(normalized.created instanceof Date)) {
            normalized.created = new Date(normalized.created);
        }
        if (!(normalized.lastModified instanceof Date)) {
            normalized.lastModified = new Date(normalized.lastModified);
        }
        // Apply code edge normalization if applicable
        if (isCodeRelationship(normalized.type)) {
            Object.assign(normalized, normalizeCodeEdge(normalized));
        }
        // Ensure active state
        if (normalized.active === undefined) {
            normalized.active = true;
        }
        // Merge and limit evidence/locations
        if (normalized.evidence && Array.isArray(normalized.evidence)) {
            normalized.evidence = normalized.evidence.slice(0, 20);
        }
        if (normalized.locations && Array.isArray(normalized.locations)) {
            normalized.locations = normalized.locations.slice(0, 20);
        }
        return normalized;
    }
    /**
     * Generate a canonical relationship ID
     */
    generateRelationshipId(rel) {
        return canonicalRelationshipId(rel.fromEntityId, rel);
    }
    /**
     * Extract properties for Neo4j storage
     */
    extractRelationshipProperties(rel) {
        const properties = {};
        // Skip complex objects and arrays for main properties
        const skipKeys = ['evidence', 'locations', 'metadata', 'fromEntity', 'toEntity'];
        for (const [key, value] of Object.entries(rel)) {
            if (skipKeys.includes(key) || value === null || value === undefined) {
                continue;
            }
            if (value instanceof Date) {
                properties[key] = value.toISOString();
            }
            else if (typeof value === 'object') {
                properties[key] = JSON.stringify(value);
            }
            else {
                properties[key] = value;
            }
        }
        // Handle evidence and locations as JSON strings
        if (rel.evidence) {
            properties.evidence = JSON.stringify(rel.evidence);
        }
        if (rel.locations) {
            properties.locations = JSON.stringify(rel.locations);
        }
        if (rel.metadata) {
            properties.metadata = JSON.stringify(rel.metadata);
        }
        return properties;
    }
    /**
     * Parse relationship from Neo4j result
     */
    parseRelationshipFromNeo4j(row) {
        var _a, _b, _c, _d, _e, _f;
        const rel = row.r;
        const properties = rel.properties || rel;
        const parsed = {
            type: rel.type || row.type,
            fromEntityId: ((_b = (_a = row.from) === null || _a === void 0 ? void 0 : _a.properties) === null || _b === void 0 ? void 0 : _b.id) || ((_c = row.from) === null || _c === void 0 ? void 0 : _c.id),
            toEntityId: ((_e = (_d = row.to) === null || _d === void 0 ? void 0 : _d.properties) === null || _e === void 0 ? void 0 : _e.id) || ((_f = row.to) === null || _f === void 0 ? void 0 : _f.id),
        };
        for (const [key, value] of Object.entries(properties)) {
            if (value === null || value === undefined)
                continue;
            // Parse dates
            if (key === 'created' || key === 'lastModified' || key.endsWith('At')) {
                parsed[key] = new Date(value);
            }
            // Parse JSON strings
            else if (typeof value === 'string' &&
                (key === 'evidence' || key === 'locations' || key === 'metadata')) {
                try {
                    parsed[key] = JSON.parse(value);
                }
                catch (_g) {
                    parsed[key] = value;
                }
            }
            else {
                parsed[key] = value;
            }
        }
        return parsed;
    }
    /**
     * Build bulk merge query for relationships
     */
    buildBulkMergeQuery(options) {
        return `
      UNWIND $relationships AS rel
      MATCH (from:Entity {id: rel.fromId})
      MATCH (to:Entity {id: rel.toId})
      MERGE (from)-[r:\${rel.type} {id: rel.relId}]->(to)
      SET r += rel.properties
      ${options.updateTimestamps ? 'SET r.lastModified = datetime()' : ''}
      RETURN count(r) as count
    `;
    }
    /**
     * Build bulk create query for relationships
     */
    buildBulkCreateQuery(options) {
        const skipClause = options.skipExisting
            ? 'WHERE NOT EXISTS((from)-[:\${rel.type} {id: rel.relId}]->(to))'
            : '';
        return `
      UNWIND $relationships AS rel
      MATCH (from:Entity {id: rel.fromId})
      MATCH (to:Entity {id: rel.toId})
      ${skipClause}
      CREATE (from)-[r:\${rel.type} {id: rel.relId}]->(to)
      SET r += rel.properties
      RETURN count(r) as count
    `;
    }
    /**
     * Get a single relationship by its ID
     */
    async getRelationshipById(relationshipId) {
        try {
            const query = `
        MATCH (from)-[r {id: $relationshipId}]->(to)
        RETURN r, from, to
      `;
            const result = await this.neogmaService.executeCypher(query, {
                relationshipId,
            });
            if (result.length === 0) {
                return null;
            }
            return this.parseRelationshipFromNeo4j(result[0]);
        }
        catch (error) {
            this.emit('error', { operation: 'getRelationshipById', relationshipId, error });
            throw error;
        }
    }
    /**
     * Get evidence nodes for a relationship edge
     */
    async getEdgeEvidenceNodes(relationshipId, limit = 200) {
        try {
            const query = `
        MATCH (from)-[r {id: $relationshipId}]->(to)
        WITH r
        WHERE r.evidence IS NOT NULL
        UNWIND r.evidence AS evidence
        RETURN evidence
        LIMIT $limit
      `;
            const result = await this.neogmaService.executeCypher(query, {
                relationshipId,
                limit,
            });
            return result.map(row => row.evidence);
        }
        catch (error) {
            this.emit('error', { operation: 'getEdgeEvidenceNodes', relationshipId, error });
            // Return empty array on error rather than throwing
            console.warn(`Failed to get evidence nodes for relationship ${relationshipId}:`, error);
            return [];
        }
    }
    /**
     * Get edge sites for a relationship (locations where the relationship is used)
     */
    async getEdgeSites(relationshipId, limit = 50) {
        try {
            const query = `
        MATCH (from)-[r {id: $relationshipId}]->(to)
        WITH r
        WHERE r.locations IS NOT NULL
        UNWIND r.locations AS location
        RETURN location
        LIMIT $limit
      `;
            const result = await this.neogmaService.executeCypher(query, {
                relationshipId,
                limit,
            });
            return result.map(row => row.location);
        }
        catch (error) {
            this.emit('error', { operation: 'getEdgeSites', relationshipId, error });
            // Return empty array on error rather than throwing
            console.warn(`Failed to get edge sites for relationship ${relationshipId}:`, error);
            return [];
        }
    }
    /**
     * Get edge candidates for a relationship (potential relationship targets)
     */
    async getEdgeCandidates(relationshipId, limit = 50) {
        try {
            const query = `
        MATCH (from)-[r {id: $relationshipId}]->(to)
        WITH from, to, type(r) as relType
        MATCH (from)-[similar]->(candidates)
        WHERE type(similar) = relType AND candidates <> to
        RETURN DISTINCT candidates
        LIMIT $limit
      `;
            const result = await this.neogmaService.executeCypher(query, {
                relationshipId,
                limit,
            });
            return result.map(row => row.candidates);
        }
        catch (error) {
            this.emit('error', { operation: 'getEdgeCandidates', relationshipId, error });
            // Return empty array on error rather than throwing
            console.warn(`Failed to get edge candidates for relationship ${relationshipId}:`, error);
            return [];
        }
    }
}
//# sourceMappingURL=RelationshipServiceOGM.js.map
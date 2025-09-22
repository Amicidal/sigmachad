/**
 * Relationship Service
 * Handles relationship management, normalization, and evidence merging
 */
import { EventEmitter } from 'events';
import { normalizeCodeEdge, canonicalRelationshipId, isCodeRelationship, } from '../../utils/codeEdges.js';
export class RelationshipService extends EventEmitter {
    constructor(neo4j) {
        super();
        this.neo4j = neo4j;
    }
    /**
     * Create or update a relationship
     */
    async createRelationship(relationship) {
        const normalized = this.normalizeRelationship(relationship);
        const relId = this.generateRelationshipId(normalized);
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
        const result = await this.neo4j.executeCypher(query, {
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
        const normalized = relationships.map(r => ({
            ...this.normalizeRelationship(r),
            _id: this.generateRelationshipId(r),
        }));
        const query = options.mergeEvidence
            ? this.buildBulkMergeQuery(options)
            : this.buildBulkCreateQuery(options);
        try {
            const result = await this.neo4j.executeCypher(query, {
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
            return { created: 0, updated: 0, failed: relationships.length };
        }
    }
    /**
     * Get relationships based on query
     */
    async getRelationships(query) {
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
        if (query.types && query.types.length > 0) {
            where.push('type(r) IN $types');
            params.types = query.types;
        }
        if (query.active !== undefined) {
            where.push('coalesce(r.active, true) = $active');
            params.active = query.active;
        }
        if (query.minConfidence !== undefined) {
            where.push('r.confidence >= $minConfidence');
            params.minConfidence = query.minConfidence;
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
        const result = await this.neo4j.executeCypher(cypherQuery, params);
        return result.map(row => this.parseRelationshipFromNeo4j(row));
    }
    /**
     * Delete a relationship
     */
    async deleteRelationship(fromId, toId, type) {
        const query = `
      MATCH (from:Entity {id: $fromId})-[r:${type}]->(to:Entity {id: $toId})
      DELETE r
    `;
        await this.neo4j.executeCypher(query, { fromId, toId });
        this.emit('relationship:deleted', { fromId, toId, type });
    }
    /**
     * Mark relationships as inactive if not seen since a date
     */
    async markInactiveEdgesNotSeenSince(since) {
        var _a;
        const query = `
      MATCH ()-[r]->()
      WHERE r.lastSeenAt < $since AND coalesce(r.active, true) = true
      SET r.active = false
      SET r.validTo = coalesce(r.validTo, datetime())
      RETURN count(r) as count
    `;
        const result = await this.neo4j.executeCypher(query, {
            since: since.toISOString(),
        });
        const count = ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.count) || 0;
        this.emit('relationships:marked:inactive', { count, since });
        return count;
    }
    /**
     * Update relationship evidence in bulk
     */
    async upsertEdgeEvidenceBulk(updates) {
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
        await this.neo4j.executeCypher(query, {
            updates: updates.map(u => ({
                fromId: u.fromId,
                toId: u.toId,
                type: u.type,
                evidence: JSON.stringify(u.evidence.slice(0, 20)),
                locations: u.locations ? JSON.stringify(u.locations.slice(0, 20)) : null,
            })),
        });
    }
    /**
     * Get relationship statistics
     */
    async getRelationshipStats() {
        var _a, _b, _c, _d, _e;
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
        const results = await Promise.all(queries.map(q => this.neo4j.executeCypher(q.query)));
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
    /**
     * Merge duplicate relationships
     */
    async mergeNormalizedDuplicates() {
        var _a;
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
        const result = await this.neo4j.executeCypher(query);
        const count = ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.count) || 0;
        if (count > 0) {
            this.emit('relationships:merged', { count });
        }
        return count;
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
     * Update auxiliary data for a relationship
     */
    async updateRelationshipAuxiliary(relId, rel) {
        if (!rel.evidence && !rel.locations)
            return;
        const query = `
      MATCH ()-[r {id: $relId}]->()
      SET r.evidence = $evidence
      SET r.locations = $locations
    `;
        await this.neo4j.executeCypher(query, {
            relId,
            evidence: rel.evidence ? JSON.stringify(rel.evidence) : null,
            locations: rel.locations ? JSON.stringify(rel.locations) : null,
        });
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
}
//# sourceMappingURL=RelationshipService.js.map
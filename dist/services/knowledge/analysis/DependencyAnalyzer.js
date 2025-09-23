/**
 * Dependency Analysis Service
 * Handles entity dependency analysis, cycle detection, and tree building
 */
import { EventEmitter } from "events";
import { RelationshipType } from "../../../models/relationships.js";
import { buildDirectRelationshipQuery, buildPathExpansionQuery, buildBetweennessQuery, buildCycleDetectionQuery, } from "./queries.js";
export class DependencyAnalyzer extends EventEmitter {
    constructor(neo4j) {
        super();
        this.neo4j = neo4j;
    }
    /**
     * Analyze entity dependencies
     */
    async getEntityDependencies(entityId, options) {
        const depth = (options === null || options === void 0 ? void 0 : options.depth) || 3;
        const typeFilter = (options === null || options === void 0 ? void 0 : options.includeTypes) || [
            "DEPENDS_ON",
            "IMPORTS",
            "CALLS",
            "TYPE_USES",
        ];
        // Get direct dependencies
        const directDeps = await this.getDirectDependencies(entityId, typeFilter);
        // Get transitive dependencies
        const transitiveDeps = await this.getTransitiveDependencies(entityId, typeFilter, depth);
        // Calculate metrics
        const metrics = await this.calculateDependencyMetrics(entityId, depth);
        // Find dependency cycles
        const cycles = await this.detectCycles(entityId, depth);
        return {
            entityId,
            directDependencies: directDeps.map((dep) => ({
                entity: dep.entity,
                relationship: dep.relationshipType,
                confidence: 1.0,
            })),
            indirectDependencies: transitiveDeps.map((dep) => ({
                entity: dep.entity,
                path: [dep.entity], // simplified path for now
                relationship: RelationshipType.DEPENDS_ON,
                distance: dep.distance,
            })),
            reverseDependencies: [], // TODO: implement reverse dependency analysis
            circularDependencies: cycles.map((cycle) => ({
                cycle: Array.isArray(cycle) ? cycle : [],
                severity: "warning",
            })),
        };
    }
    /**
     * Get direct dependencies
     */
    async getDirectDependencies(entityId, relationshipTypes) {
        const query = buildDirectRelationshipQuery(entityId, relationshipTypes, "OUTGOING");
        const result = await this.neo4j.executeCypher(query, { entityId });
        return result.map((r) => ({
            entity: this.parseEntity(r.target),
            relationshipType: r.relationshipType,
        }));
    }
    /**
     * Get transitive dependencies
     */
    async getTransitiveDependencies(entityId, relationshipTypes, depth) {
        const query = buildPathExpansionQuery({
            startNodeId: entityId,
            relationshipTypes,
            maxDepth: depth,
            direction: "OUTGOING",
            uniqueness: "NODE_GLOBAL",
        });
        const result = await this.neo4j.executeCypher(query, {
            startNodeId: entityId,
            maxDepth: depth,
        });
        return result.map((r) => {
            var _a;
            return ({
                entity: this.parseEntity(r.endNode),
                distance: r.depth,
                types: r.path
                    ? [((_a = r.path.relationships[0]) === null || _a === void 0 ? void 0 : _a.type) || "DEPENDS_ON"]
                    : ["DEPENDS_ON"],
            });
        });
    }
    /**
     * Calculate dependency metrics
     */
    async calculateDependencyMetrics(entityId, depth) {
        var _a, _b;
        const queries = [
            {
                name: "fanIn",
                query: `MATCH (e:Entity {id: $entityId})<-[:DEPENDS_ON|CALLS|IMPORTS]-() RETURN count(*) AS count`,
            },
            {
                name: "fanOut",
                query: `MATCH (e:Entity {id: $entityId})-[:DEPENDS_ON|CALLS|IMPORTS]->() RETURN count(*) AS count`,
            },
        ];
        const results = await Promise.all(queries.map((q) => this.neo4j.executeCypher(q.query, { entityId })));
        // Try to calculate centrality with GDS
        let centrality = 0.5;
        try {
            const nodeQuery = "MATCH (n:Entity) RETURN id(n) AS id";
            const relationshipQuery = "MATCH (a)-[:DEPENDS_ON|CALLS]->(b) RETURN id(a) AS source, id(b) AS target";
            const centralityQuery = buildBetweennessQuery(nodeQuery, relationshipQuery);
            const centralityResult = await this.neo4j.executeCypher(centralityQuery, {
                entityId,
            });
            const entityCentrality = centralityResult.find((r) => r.id === entityId);
            centrality = (entityCentrality === null || entityCentrality === void 0 ? void 0 : entityCentrality.score) || 0.5;
        }
        catch (_c) {
            // GDS not available, use simple heuristic
            const total = results[0][0].count + results[1][0].count;
            centrality = Math.min(1, total / 20);
        }
        return {
            fanIn: ((_a = results[0][0]) === null || _a === void 0 ? void 0 : _a.count) || 0,
            fanOut: ((_b = results[1][0]) === null || _b === void 0 ? void 0 : _b.count) || 0,
            centrality,
        };
    }
    /**
     * Detect dependency cycles
     */
    async detectCycles(entityId, maxDepth) {
        const query = buildCycleDetectionQuery(maxDepth);
        const result = await this.neo4j.executeCypher(query, {
            entityId,
            maxDepth,
        });
        return result.map((r) => r.cycle);
    }
    /**
     * Build dependency tree
     */
    buildDependencyTree(entityId, dependencies) {
        const tree = {
            entity: { id: entityId }, // Simplified entity for root
            children: [],
        };
        const nodeMap = new Map();
        nodeMap.set(entityId, tree);
        dependencies.forEach((dep) => {
            const depId = dep.entity.id;
            if (!nodeMap.has(depId)) {
                nodeMap.set(depId, {
                    entity: dep.entity,
                    children: [],
                });
            }
        });
        // Build tree structure based on distance
        dependencies
            .filter((d) => d.distance === 1)
            .forEach((dep) => {
            const depId = dep.entity.id;
            tree.children.push(nodeMap.get(depId));
        });
        return tree;
    }
    /**
     * Find dependency chains (paths from entity to dependencies)
     */
    async findDependencyChains(entityId, targetEntityId, maxDepth = 5) {
        const query = `
      MATCH path = (start:Entity {id: $entityId})-[rels:DEPENDS_ON|CALLS|IMPORTS*1..$maxDepth]->(end:Entity {id: $targetEntityId})
      RETURN [n IN nodes(path) | n.id] AS path, length(path) AS length
      ORDER BY length
      LIMIT 10
    `;
        const result = await this.neo4j.executeCypher(query, {
            entityId,
            targetEntityId,
            maxDepth,
        });
        return result.map((r) => ({
            path: r.path,
            length: r.length,
        }));
    }
    /**
     * Analyze reverse dependencies (entities that depend on this one)
     */
    async getReverseDependencies(entityId, depth = 3) {
        const query = buildPathExpansionQuery({
            startNodeId: entityId,
            relationshipTypes: ["DEPENDS_ON", "CALLS", "IMPORTS"],
            maxDepth: depth,
            direction: "INCOMING",
            uniqueness: "NODE_GLOBAL",
        });
        const result = await this.neo4j.executeCypher(query, {
            startNodeId: entityId,
            maxDepth: depth,
        });
        return result.map((r) => {
            var _a, _b, _c;
            return ({
                entity: this.parseEntity(r.endNode),
                relationship: ((_c = (_b = (_a = r.path) === null || _a === void 0 ? void 0 : _a.relationships) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.type) || "DEPENDS_ON",
                distance: r.depth,
            });
        });
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
            if (key === "created" || key === "lastModified" || key.endsWith("At")) {
                entity[key] = new Date(value);
            }
            else if (typeof value === "string" &&
                (value.startsWith("[") || value.startsWith("{"))) {
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
//# sourceMappingURL=DependencyAnalyzer.js.map
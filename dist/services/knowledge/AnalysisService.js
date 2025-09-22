/**
 * Analysis Service
 * Handles impact analysis, dependencies, and graph algorithms
 */
import { EventEmitter } from 'events';
export class AnalysisService extends EventEmitter {
    constructor(neo4j) {
        super();
        this.neo4j = neo4j;
    }
    /**
     * Analyze impact of changes
     */
    async analyzeImpact(request) {
        const startTime = Date.now();
        const entityIds = request.entityIds;
        const maxDepth = request.depth || 3;
        // Get direct impact
        const directImpactQuery = `
      UNWIND $entityIds AS entityId
      MATCH (e:Entity {id: entityId})-[r:CALLS|REFERENCES|DEPENDS_ON|IMPLEMENTS|EXTENDS]->(impacted)
      RETURN DISTINCT impacted
    `;
        const directResult = await this.neo4j.executeCypher(directImpactQuery, {
            entityIds,
        });
        const directImpacted = directResult.map(r => this.parseEntity(r.impacted));
        // Get transitive impact using APOC
        const transitiveQuery = `
      UNWIND $entityIds AS entityId
      MATCH (e:Entity {id: entityId})
      CALL apoc.path.expand(
        e,
        'CALLS|REFERENCES|DEPENDS_ON|IMPLEMENTS|EXTENDS|OVERRIDES|TYPE_USES',
        null,
        1,
        $maxDepth,
        'RELATIONSHIP_GLOBAL'
      ) YIELD path
      WITH last(nodes(path)) AS impacted, length(path) AS depth
      RETURN DISTINCT impacted, min(depth) AS minDepth
    `;
        const transitiveResult = await this.neo4j.executeCypher(transitiveQuery, {
            entityIds,
            maxDepth,
        });
        const transitiveImpacted = transitiveResult.map(r => ({
            entity: this.parseEntity(r.impacted),
            depth: r.minDepth,
        }));
        // Get affected tests
        const testQuery = `
      UNWIND $entityIds AS entityId
      MATCH (e:Entity {id: entityId})<-[:TESTS|VALIDATES*1..$maxDepth]-(test:Test)
      RETURN DISTINCT test
    `;
        const testResult = await this.neo4j.executeCypher(testQuery, {
            entityIds,
            maxDepth,
        });
        const affectedTests = testResult.map(r => this.parseEntity(r.test));
        // Get affected specs
        const specQuery = `
      UNWIND $entityIds AS entityId
      MATCH (e:Entity {id: entityId})<-[:IMPLEMENTS_SPEC|REQUIRES*1..$maxDepth]-(spec:Specification)
      RETURN DISTINCT spec, spec.priority AS priority
    `;
        const specResult = await this.neo4j.executeCypher(specQuery, {
            entityIds,
            maxDepth,
        });
        const affectedSpecs = specResult.map(r => ({
            entity: this.parseEntity(r.spec),
            priority: r.priority || 'medium',
        }));
        // Get affected documentation
        const docQuery = `
      UNWIND $entityIds AS entityId
      MATCH (e:Entity {id: entityId})-[:DOCUMENTED_BY|DOCUMENTS_SECTION*1..$maxDepth]-(doc)
      WHERE doc.type = 'documentation'
      RETURN DISTINCT doc
    `;
        const docResult = await this.neo4j.executeCypher(docQuery, {
            entityIds,
            maxDepth,
        });
        const affectedDocs = docResult.map(r => this.parseEntity(r.doc));
        // Calculate metrics
        const metrics = await this.calculateImpactMetrics(entityIds, transitiveImpacted);
        // Build impact analysis result
        const analysis = {
            entityIds,
            impactedEntities: transitiveImpacted.map(t => t.entity),
            metrics: {
                directImpact: directImpacted.length,
                transitiveImpact: transitiveImpacted.length,
                cascadeDepth: Math.max(...transitiveImpacted.map(t => t.depth), 0),
                affectedTests: affectedTests.length,
                affectedSpecs: affectedSpecs.length,
                affectedDocs: affectedDocs.length,
                criticalPaths: metrics.criticalPaths,
                riskScore: metrics.riskScore,
            },
            affectedTests,
            affectedSpecs,
            affectedDocs,
            cascades: this.identifyCascades(transitiveImpacted),
            criticalPaths: await this.findCriticalPaths(entityIds, maxDepth),
            analysisTime: Date.now() - startTime,
        };
        this.emit('impact:analyzed', {
            entityIds,
            impactCount: transitiveImpacted.length,
            depth: maxDepth,
        });
        return analysis;
    }
    /**
     * Analyze entity dependencies
     */
    async getEntityDependencies(entityId, options) {
        var _a;
        const depth = (options === null || options === void 0 ? void 0 : options.depth) || 3;
        const typeFilter = ((_a = options === null || options === void 0 ? void 0 : options.includeTypes) === null || _a === void 0 ? void 0 : _a.join('|')) || null;
        // Get direct dependencies
        const directQuery = `
      MATCH (e:Entity {id: $entityId})-[r:DEPENDS_ON|IMPORTS|CALLS|TYPE_USES]->(dep)
      RETURN dep, type(r) AS relType
    `;
        const directResult = await this.neo4j.executeCypher(directQuery, { entityId });
        // Get transitive dependencies using APOC
        const transitiveQuery = `
      MATCH (e:Entity {id: $entityId})
      CALL apoc.path.expand(
        e,
        $typeFilter,
        null,
        1,
        $depth,
        'NODE_GLOBAL'
      ) YIELD path
      WITH path, last(nodes(path)) AS dep, length(path) AS distance
      RETURN dep, distance, [r IN relationships(path) | type(r)] AS types
      ORDER BY distance
    `;
        const transitiveResult = await this.neo4j.executeCypher(transitiveQuery, {
            entityId,
            typeFilter: typeFilter || 'DEPENDS_ON|IMPORTS|CALLS|TYPE_USES',
            depth,
        });
        // Calculate metrics
        const metrics = await this.calculateDependencyMetrics(entityId, depth);
        // Find dependency cycles
        const cycles = await this.detectCycles(entityId, depth);
        return {
            entityId,
            directDependencies: directResult.map(r => this.parseEntity(r.dep)),
            transitiveDependencies: transitiveResult.map(r => ({
                entity: this.parseEntity(r.dep),
                distance: r.distance,
                path: r.types,
            })),
            metrics: {
                directDependencies: directResult.length,
                transitiveDependencies: transitiveResult.length,
                depth: Math.max(...transitiveResult.map(r => r.distance), 0),
                fanIn: metrics.fanIn,
                fanOut: metrics.fanOut,
                centrality: metrics.centrality,
                cycles,
            },
            dependencyTree: this.buildDependencyTree(transitiveResult),
        };
    }
    /**
     * Find shortest paths between entities
     */
    async findPaths(query) {
        var _a, _b;
        const algorithmQuery = `
      MATCH (from:Entity {id: $fromId}), (to:Entity {id: $toId})
      CALL apoc.algo.dijkstra(
        from,
        to,
        $relationshipTypes,
        'weight',
        1
      ) YIELD path, weight
      RETURN path, weight
      ORDER BY weight
      LIMIT $limit
    `;
        const result = await this.neo4j.executeCypher(algorithmQuery, {
            fromId: query.fromEntityId,
            toId: query.toEntityId,
            relationshipTypes: ((_a = query.relationshipTypes) === null || _a === void 0 ? void 0 : _a.join('|')) || '',
            limit: query.maxPaths || 5,
        });
        const paths = result.map(r => ({
            nodes: r.path.nodes.map((n) => this.parseEntity(n)),
            relationships: r.path.relationships,
            length: r.path.length,
            weight: r.weight,
        }));
        return {
            paths,
            shortestLength: ((_b = paths[0]) === null || _b === void 0 ? void 0 : _b.length) || 0,
        };
    }
    /**
     * Compute and store edge statistics
     */
    async computeAndStoreEdgeStats(entityId) {
        const stats = await this.getEntityEdgeStats(entityId);
        const query = `
      MERGE (s:EdgeStats {id: $statsId})
      SET s.entityId = $entityId
      SET s.payload = $payload
      SET s.updatedAt = datetime()
    `;
        await this.neo4j.executeCypher(query, {
            statsId: `stats_${entityId}`,
            entityId,
            payload: JSON.stringify(stats),
        });
        this.emit('stats:computed', { entityId, stats });
    }
    /**
     * Get entity edge statistics
     */
    async getEntityEdgeStats(entityId) {
        var _a, _b;
        const queries = [
            {
                name: 'byType',
                query: `
          MATCH (e:Entity {id: $entityId})-[r]->()
          RETURN type(r) AS type, count(r) AS count
          ORDER BY count DESC
        `,
            },
            {
                name: 'topSymbols',
                query: `
          MATCH (e:Entity {id: $entityId})-[r]->()
          WHERE r.to_ref_symbol IS NOT NULL
          RETURN r.to_ref_symbol AS symbol, count(*) AS count
          ORDER BY count DESC
          LIMIT 10
        `,
            },
            {
                name: 'inbound',
                query: `
          MATCH (e:Entity {id: $entityId})<-[r]-()
          RETURN count(r) AS count
        `,
            },
            {
                name: 'outbound',
                query: `
          MATCH (e:Entity {id: $entityId})-[r]->()
          RETURN count(r) AS count
        `,
            },
        ];
        const results = await Promise.all(queries.map(q => this.neo4j.executeCypher(q.query, { entityId })));
        const byType = {};
        results[0].forEach((r) => {
            byType[r.type] = r.count;
        });
        const topSymbols = results[1].map((r) => ({
            symbol: r.symbol,
            count: r.count,
        }));
        return {
            byType,
            topSymbols,
            inbound: ((_a = results[2][0]) === null || _a === void 0 ? void 0 : _a.count) || 0,
            outbound: ((_b = results[3][0]) === null || _b === void 0 ? void 0 : _b.count) || 0,
        };
    }
    /**
     * Calculate impact metrics
     */
    async calculateImpactMetrics(entityIds, impacted) {
        // Find critical paths using PageRank
        const pageRankQuery = `
      CALL gds.graph.project.cypher(
        'impact_graph',
        'MATCH (n:Entity) WHERE n.id IN $allIds RETURN id(n) AS id',
        'MATCH (a)-[r:DEPENDS_ON|CALLS|IMPLEMENTS]->(b) WHERE a.id IN $allIds AND b.id IN $allIds RETURN id(a) AS source, id(b) AS target'
      ) YIELD graphName
      CALL gds.pageRank.stream('impact_graph')
      YIELD nodeId, score
      WITH gds.util.asNode(nodeId) AS node, score
      RETURN node.id AS id, score
      ORDER BY score DESC
      LIMIT 10
    `;
        const allIds = [...entityIds, ...impacted.map(i => i.entity.id)];
        let criticalPaths = 0;
        let avgCentrality = 0;
        try {
            const result = await this.neo4j.executeCypher(pageRankQuery, { allIds });
            criticalPaths = result.filter((r) => r.score > 0.1).length;
            avgCentrality = result.reduce((sum, r) => sum + r.score, 0) / result.length;
        }
        catch (_a) {
            // GDS might not be available
            criticalPaths = impacted.filter(i => i.depth === 1).length;
            avgCentrality = 0.5;
        }
        // Calculate risk score
        const riskScore = Math.min(1, (impacted.length / 100) * 0.3 +
            (criticalPaths / 10) * 0.3 +
            avgCentrality * 0.4);
        return {
            directImpact: impacted.filter(i => i.depth === 1).length,
            transitiveImpact: impacted.length,
            cascadeDepth: Math.max(...impacted.map(i => i.depth), 0),
            affectedTests: 0, // Calculated separately
            affectedSpecs: 0,
            affectedDocs: 0,
            criticalPaths,
            riskScore,
        };
    }
    /**
     * Calculate dependency metrics
     */
    async calculateDependencyMetrics(entityId, depth) {
        var _a, _b, _c;
        const queries = [
            {
                name: 'fanIn',
                query: `MATCH (e:Entity {id: $entityId})<-[:DEPENDS_ON|CALLS|IMPORTS]-() RETURN count(*) AS count`,
            },
            {
                name: 'fanOut',
                query: `MATCH (e:Entity {id: $entityId})-[:DEPENDS_ON|CALLS|IMPORTS]->() RETURN count(*) AS count`,
            },
        ];
        const results = await Promise.all(queries.map(q => this.neo4j.executeCypher(q.query, { entityId })));
        // Try to calculate centrality with GDS
        let centrality = 0.5;
        try {
            const centralityQuery = `
        CALL gds.betweenness.stream({
          nodeQuery: 'MATCH (n:Entity) RETURN id(n) AS id',
          relationshipQuery: 'MATCH (a)-[:DEPENDS_ON|CALLS]->(b) RETURN id(a) AS source, id(b) AS target'
        })
        YIELD nodeId, score
        WHERE gds.util.asNode(nodeId).id = $entityId
        RETURN score
      `;
            const centralityResult = await this.neo4j.executeCypher(centralityQuery, {
                entityId,
            });
            centrality = ((_a = centralityResult[0]) === null || _a === void 0 ? void 0 : _a.score) || 0.5;
        }
        catch (_d) {
            // GDS not available, use simple heuristic
            const total = results[0][0].count + results[1][0].count;
            centrality = Math.min(1, total / 20);
        }
        return {
            fanIn: ((_b = results[0][0]) === null || _b === void 0 ? void 0 : _b.count) || 0,
            fanOut: ((_c = results[1][0]) === null || _c === void 0 ? void 0 : _c.count) || 0,
            centrality,
        };
    }
    /**
     * Detect dependency cycles
     */
    async detectCycles(entityId, maxDepth) {
        const query = `
      MATCH (start:Entity {id: $entityId})
      MATCH path = (start)-[:DEPENDS_ON|IMPORTS*1..$maxDepth]->(start)
      RETURN [n IN nodes(path) | n.id] AS cycle
      LIMIT 5
    `;
        const result = await this.neo4j.executeCypher(query, {
            entityId,
            maxDepth,
        });
        return result.map(r => r.cycle);
    }
    /**
     * Identify cascades from impact analysis
     */
    identifyCascades(impacted) {
        const cascades = [];
        const byDepth = new Map();
        impacted.forEach(({ entity, depth }) => {
            if (!byDepth.has(depth)) {
                byDepth.set(depth, []);
            }
            byDepth.get(depth).push(entity);
        });
        for (const [depth, entities] of byDepth) {
            if (entities.length > 5) {
                cascades.push({
                    depth,
                    count: entities.length,
                    entities: entities.slice(0, 10),
                });
            }
        }
        return cascades;
    }
    /**
     * Find critical paths
     */
    async findCriticalPaths(entityIds, maxDepth) {
        // Find paths to critical entities (e.g., main functions, API endpoints)
        const query = `
      UNWIND $entityIds AS entityId
      MATCH (e:Entity {id: entityId})
      MATCH path = (e)-[:CALLS|DEPENDS_ON*1..$maxDepth]->(critical)
      WHERE critical.type IN ['api_endpoint', 'main_function', 'critical_service']
      WITH path, length(path) AS pathLength
      ORDER BY pathLength
      LIMIT 5
      RETURN [n IN nodes(path) | n.id] AS path, pathLength
    `;
        const result = await this.neo4j.executeCypher(query, {
            entityIds,
            maxDepth,
        });
        return result.map(r => ({
            path: r.path,
            length: r.pathLength,
        }));
    }
    /**
     * Build dependency tree
     */
    buildDependencyTree(dependencies) {
        const tree = { children: [] };
        const nodeMap = new Map();
        dependencies.forEach(dep => {
            var _a;
            const id = ((_a = dep.dep.properties) === null || _a === void 0 ? void 0 : _a.id) || dep.dep.id;
            if (!nodeMap.has(id)) {
                nodeMap.set(id, {
                    entity: this.parseEntity(dep.dep),
                    children: [],
                });
            }
        });
        // Simple tree structure based on distance
        dependencies
            .filter(d => d.distance === 1)
            .forEach(dep => {
            var _a;
            const id = ((_a = dep.dep.properties) === null || _a === void 0 ? void 0 : _a.id) || dep.dep.id;
            tree.children.push(nodeMap.get(id));
        });
        return tree;
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
//# sourceMappingURL=AnalysisService.js.map
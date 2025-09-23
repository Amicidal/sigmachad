/**
 * Impact Analysis Service
 * Handles impact analysis, cascade detection, and impact metrics
 */
import { EventEmitter } from "events";
import { RelationshipType } from "../../../models/relationships.js";
import { buildImpactQueries, buildGdsProjectionQuery, buildPageRankQuery, } from "./queries.js";
export class ImpactAnalyzer extends EventEmitter {
    constructor(neo4j) {
        super();
        this.neo4j = neo4j;
    }
    /**
     * Analyze impact of changes
     */
    async analyzeImpact(request) {
        const startTime = Date.now();
        const entityIds = request.changes.map((c) => c.entityId);
        const maxDepth = request.maxDepth || 3;
        // Get impact data in parallel
        const [directImpacted, transitiveImpacted, affectedTests, affectedSpecs, affectedDocs,] = await Promise.all([
            this.getDirectImpact(entityIds),
            this.getTransitiveImpact(entityIds, maxDepth),
            this.getAffectedTests(entityIds, maxDepth),
            this.getAffectedSpecs(entityIds, maxDepth),
            this.getAffectedDocs(entityIds, maxDepth),
        ]);
        // Calculate metrics
        const metrics = await this.calculateImpactMetrics(entityIds, transitiveImpacted);
        // Build impact analysis result
        const analysis = {
            directImpact: directImpacted.map((e) => ({
                entities: [e],
                severity: "medium",
                reason: "Direct dependency",
            })),
            cascadingImpact: transitiveImpacted.map((t) => ({
                level: t.depth,
                entities: [t.entity],
                relationship: RelationshipType.DEPENDS_ON,
                confidence: 0.8,
            })),
            testImpact: {
                affectedTests: affectedTests.filter((t) => t.type === "test"), // Cast to Test[]
                requiredUpdates: affectedTests.map((t) => t.id),
                coverageImpact: affectedTests.length > 0 ? 0.8 : 0,
            },
            documentationImpact: {
                staleDocs: affectedDocs,
                missingDocs: [],
                requiredUpdates: affectedDocs.map((d) => d.id || "unknown"),
                freshnessPenalty: affectedDocs.length * 0.1,
            },
            specImpact: {
                relatedSpecs: [],
                requiredUpdates: [],
                summary: {
                    byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
                    byImpactLevel: { critical: 0, high: 0, medium: 0, low: 0 },
                    statuses: {
                        draft: 0,
                        approved: 0,
                        implemented: 0,
                        deprecated: 0,
                        unknown: 0,
                    },
                    acceptanceCriteriaReferences: 0,
                    pendingSpecs: 0,
                },
            },
            deploymentGate: {
                blocked: false,
                level: "none",
                reasons: [],
                stats: {
                    missingDocs: 0,
                    staleDocs: affectedDocs.length,
                    freshnessPenalty: affectedDocs.length * 0.1,
                },
            },
            recommendations: [
                {
                    priority: "planned",
                    description: "Review impact analysis results",
                    effort: "medium",
                    impact: "functional",
                    type: "suggestion",
                    actions: [
                        "Review affected components",
                        "Update tests",
                        "Update documentation",
                    ],
                },
            ],
        };
        this.emit("impact:analyzed", {
            entityIds,
            impactCount: transitiveImpacted.length,
            depth: maxDepth,
            duration: Date.now() - startTime,
        });
        return analysis;
    }
    /**
     * Get direct impact entities
     */
    async getDirectImpact(entityIds) {
        const query = buildImpactQueries(entityIds, 3).directImpact;
        const result = await this.neo4j.executeCypher(query, { entityIds });
        return result.map((r) => this.parseEntity(r.impacted));
    }
    /**
     * Get transitive impact entities
     */
    async getTransitiveImpact(entityIds, maxDepth) {
        const query = buildImpactQueries(entityIds, maxDepth).transitiveImpact;
        const result = await this.neo4j.executeCypher(query, {
            entityIds,
            maxDepth,
        });
        return result.map((r) => ({
            entity: this.parseEntity(r.impacted),
            depth: r.minDepth,
        }));
    }
    /**
     * Get affected tests
     */
    async getAffectedTests(entityIds, maxDepth) {
        const query = buildImpactQueries(entityIds, maxDepth).affectedTests;
        const result = await this.neo4j.executeCypher(query, {
            entityIds,
            maxDepth,
        });
        return result.map((r) => this.parseEntity(r.test));
    }
    /**
     * Get affected specifications
     */
    async getAffectedSpecs(entityIds, maxDepth) {
        const query = buildImpactQueries(entityIds, maxDepth).affectedSpecs;
        const result = await this.neo4j.executeCypher(query, {
            entityIds,
            maxDepth,
        });
        return result.map((r) => ({
            entity: this.parseEntity(r.spec),
            priority: r.priority || "medium",
        }));
    }
    /**
     * Get affected documentation
     */
    async getAffectedDocs(entityIds, maxDepth) {
        const query = buildImpactQueries(entityIds, maxDepth).affectedDocs;
        const result = await this.neo4j.executeCypher(query, {
            entityIds,
            maxDepth,
        });
        return result.map((r) => this.parseEntity(r.doc));
    }
    /**
     * Calculate impact metrics
     */
    async calculateImpactMetrics(entityIds, impacted) {
        // Find critical paths using PageRank
        const allIds = [...entityIds, ...impacted.map((i) => i.entity.id)];
        let criticalPaths = 0;
        let avgCentrality = 0;
        try {
            const nodeQuery = "MATCH (n:Entity) WHERE n.id IN $allIds RETURN id(n) AS id";
            const relationshipQuery = "MATCH (a)-[r:DEPENDS_ON|CALLS|IMPLEMENTS]->(b) WHERE a.id IN $allIds AND b.id IN $allIds RETURN id(a) AS source, id(b) AS target";
            await this.neo4j.executeCypher(buildGdsProjectionQuery("impact_graph", nodeQuery, relationshipQuery), { allIds });
            const pageRankResult = await this.neo4j.executeCypher(buildPageRankQuery("impact_graph"), { allIds });
            criticalPaths = pageRankResult.filter((r) => r.score > 0.1).length;
            avgCentrality =
                pageRankResult.reduce((sum, r) => sum + r.score, 0) /
                    pageRankResult.length;
        }
        catch (_a) {
            // GDS might not be available
            criticalPaths = impacted.filter((i) => i.depth === 1).length;
            avgCentrality = 0.5;
        }
        // Calculate risk score
        const riskScore = Math.min(1, (impacted.length / 100) * 0.3 +
            (criticalPaths / 10) * 0.3 +
            avgCentrality * 0.4);
        return {
            directImpact: impacted.filter((i) => i.depth === 1).length,
            transitiveImpact: impacted.length,
            cascadeDepth: Math.max(...impacted.map((i) => i.depth), 0),
            affectedTests: 0, // Calculated separately
            affectedSpecs: 0,
            affectedDocs: 0,
            criticalPaths,
            riskScore,
        };
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
        return result.map((r) => ({
            path: r.path,
            length: r.pathLength,
        }));
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
//# sourceMappingURL=ImpactAnalyzer.js.map
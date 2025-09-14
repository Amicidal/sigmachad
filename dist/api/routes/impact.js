/**
 * Impact Analysis Routes
 * Handles cascading impact analysis for code changes
 */
import { RelationshipType } from "../../models/entities.js";
async function analyzeChangeImpact(kgService, changes, includeIndirect, maxDepth) {
    const directImpact = [];
    const cascadingImpact = [];
    const testImpact = {
        affectedTests: [],
        requiredUpdates: [],
        coverageImpact: 0,
    };
    const documentationImpact = {
        staleDocs: [],
        requiredUpdates: [],
    };
    const recommendations = [];
    for (const change of changes) {
        try {
            // Get the entity being changed
            const entity = await kgService.getEntity(change.entityId);
            if (!entity)
                continue;
            // Analyze direct impact - entities that directly depend on this entity
            const directRelationships = await kgService.getRelationships({
                toEntityId: change.entityId,
                limit: 100,
            });
            if (directRelationships.length > 0) {
                directImpact.push({
                    entities: directRelationships.map((rel) => ({
                        id: rel.fromEntityId,
                        name: rel.fromEntityId, // Could be enhanced to get entity name
                        type: "entity",
                    })),
                    severity: change.changeType === "delete"
                        ? "high"
                        : change.signatureChange
                            ? "medium"
                            : "low",
                    reason: `${change.changeType} of ${entity.name || entity.id} affects ${directRelationships.length} dependent entities`,
                });
            }
            // Analyze cascading impact if requested
            if (includeIndirect) {
                // Include inheritance relationships for interface changes
                const relationshipTypes = [
                    RelationshipType.CALLS,
                    RelationshipType.DEPENDS_ON,
                    RelationshipType.REFERENCES,
                    RelationshipType.IMPLEMENTS,
                    RelationshipType.EXTENDS
                ];
                // Check both directions for IMPLEMENTS and REFERENCES relationships
                // This catches classes that implement interfaces and functions that reference them
                const forwardRelationships = await kgService.getRelationships({
                    toEntityId: change.entityId,
                    type: [RelationshipType.IMPLEMENTS, RelationshipType.REFERENCES],
                    limit: 100,
                });
                // Add entities that implement or reference this entity
                if (forwardRelationships.length > 0) {
                    const implementers = forwardRelationships.filter(rel => rel.type === RelationshipType.IMPLEMENTS);
                    const references = forwardRelationships.filter(rel => rel.type === RelationshipType.REFERENCES);
                    if (implementers.length > 0) {
                        cascadingImpact.push({
                            level: 1,
                            entities: implementers.map((rel) => ({
                                id: rel.fromEntityId,
                                name: rel.fromEntityId,
                                type: "entity",
                            })),
                            relationship: "implements",
                            confidence: 0.95, // High confidence for direct implementation
                        });
                    }
                    if (references.length > 0) {
                        cascadingImpact.push({
                            level: 1,
                            entities: references.map((rel) => ({
                                id: rel.fromEntityId,
                                name: rel.fromEntityId,
                                type: "entity",
                            })),
                            relationship: "references",
                            confidence: 0.9, // High confidence for direct references
                        });
                    }
                }
                const paths = await kgService.findPaths({
                    startEntityId: change.entityId,
                    maxDepth: maxDepth,
                    relationshipTypes: relationshipTypes,
                });
                for (const path of paths) {
                    if (path.nodeIds && path.nodeIds.length > 2) {
                        // More than direct connection
                        const level = Math.ceil(path.nodeIds.length / 2); // Estimate level based on path length
                        cascadingImpact.push({
                            level: level,
                            entities: path.nodeIds.slice(1).map((nodeId) => ({
                                id: nodeId,
                                name: nodeId,
                                type: "entity",
                            })),
                            relationship: "indirect_dependency",
                            confidence: 0.8 - level * 0.1, // Decreasing confidence with distance
                        });
                    }
                }
            }
            // Analyze test impact
            const testRelationships = await kgService.getRelationships({
                toEntityId: change.entityId,
                type: RelationshipType.TESTS,
            });
            if (testRelationships.length > 0) {
                testImpact.affectedTests = testRelationships.map((rel) => ({
                    id: rel.fromEntityId,
                    name: rel.fromEntityId,
                    type: "unit",
                }));
                testImpact.requiredUpdates = testRelationships.map((rel) => `Update test ${rel.fromEntityId} to reflect changes to ${entity.name || entity.id}`);
                testImpact.coverageImpact = testRelationships.length * 15; // Estimate 15% coverage per test
            }
            // Add recommendations based on change type
            if (change.changeType === "delete") {
                // Add specific warnings for file deletion
                recommendations.push({
                    priority: "immediate",
                    description: `Consider migration path before deleting ${entity.name || entity.id}`,
                    effort: "high",
                    impact: "breaking",
                    type: "warning",
                });
                // Add warning type recommendation
                if (directRelationships.length > 0) {
                    recommendations.push({
                        priority: "immediate",
                        description: `${directRelationships.length} entities depend on this file/entity`,
                        effort: "high",
                        impact: "breaking",
                        type: "warning",
                    });
                }
                // Add requirement type recommendation for tests
                if (testImpact.affectedTests.length > 0) {
                    recommendations.push({
                        priority: "immediate",
                        description: `Update or remove ${testImpact.affectedTests.length} tests that depend on this entity`,
                        effort: "medium",
                        impact: "functional",
                        type: "requirement",
                    });
                }
            }
            else if (change.signatureChange) {
                recommendations.push({
                    priority: "immediate",
                    description: `Update dependent entities to match new signature of ${entity.name || entity.id}`,
                    effort: "medium",
                    impact: "breaking",
                    type: "requirement",
                });
            }
        }
        catch (error) {
            console.error(`Error analyzing impact for change ${change.entityId}:`, error);
            // Continue with other changes even if one fails
        }
    }
    return {
        directImpact,
        cascadingImpact,
        testImpact,
        documentationImpact,
        recommendations,
    };
}
export async function registerImpactRoutes(app, kgService, _dbService) {
    // POST /api/impact/analyze - Analyze change impact
    app.post("/impact/analyze", {
        schema: {
            body: {
                type: "object",
                properties: {
                    changes: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                entityId: { type: "string" },
                                changeType: {
                                    type: "string",
                                    enum: ["modify", "delete", "rename"],
                                },
                                newName: { type: "string" },
                                signatureChange: { type: "boolean" },
                            },
                            required: ["entityId", "changeType"],
                        },
                    },
                    includeIndirect: { type: "boolean", default: true },
                    maxDepth: { type: "number", default: 5 },
                },
                required: ["changes"],
            },
        },
    }, async (request, reply) => {
        try {
            const params = request.body;
            // Validate request parameters
            if (!params.changes || !Array.isArray(params.changes)) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: "INVALID_REQUEST",
                        message: "Changes array is required",
                    },
                });
            }
            // Validate each change entry
            for (const change of params.changes) {
                if (!change.entityId) {
                    return reply.status(400).send({
                        success: false,
                        error: {
                            code: "INVALID_REQUEST",
                            message: "Each change must have an entityId",
                        },
                    });
                }
                if (!change.changeType || !["modify", "delete", "rename"].includes(change.changeType)) {
                    return reply.status(400).send({
                        success: false,
                        error: {
                            code: "INVALID_REQUEST",
                            message: "Each change must have a valid changeType (modify, delete, or rename)",
                        },
                    });
                }
            }
            // Analyze impact of changes using the knowledge graph
            const analysis = await analyzeChangeImpact(kgService, params.changes, params.includeIndirect !== false, // Default to true
            params.maxDepth || 5);
            reply.send({
                success: true,
                data: analysis,
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: "IMPACT_ANALYSIS_FAILED",
                    message: "Failed to analyze change impact",
                },
            });
        }
    });
    // Basic changes listing for impact module
    app.get("/impact/changes", async (_request, reply) => {
        reply.send({ success: true, data: [] });
    });
    // GET /api/impact/entity/{entityId} - Get impact assessment for entity
    app.get("/impact/entity/:entityId", {
        schema: {
            params: {
                type: "object",
                properties: {
                    entityId: { type: "string" },
                },
                required: ["entityId"],
            },
            querystring: {
                type: "object",
                properties: {
                    changeType: {
                        type: "string",
                        enum: ["modify", "delete", "rename"],
                    },
                    includeReverse: { type: "boolean", default: false },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const { entityId } = request.params;
            const { changeType, includeReverse } = request.query;
            // TODO: Calculate impact for specific entity change
            const impact = {
                entityId,
                changeType: changeType || "modify",
                affectedEntities: [],
                riskLevel: "medium",
                mitigationStrategies: [],
            };
            reply.send({
                success: true,
                data: impact,
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: "ENTITY_IMPACT_FAILED",
                    message: "Failed to assess entity impact",
                },
            });
        }
    });
    // POST /api/impact/simulate - Simulate impact of different change scenarios
    app.post("/impact/simulate", {
        schema: {
            body: {
                type: "object",
                properties: {
                    scenarios: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                changes: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            entityId: { type: "string" },
                                            changeType: {
                                                type: "string",
                                                enum: ["modify", "delete", "rename"],
                                            },
                                        },
                                        required: ["entityId", "changeType"],
                                    },
                                },
                            },
                            required: ["name", "changes"],
                        },
                    },
                },
                required: ["scenarios"],
            },
        },
    }, async (request, reply) => {
        try {
            const { scenarios } = request.body;
            // TODO: Compare impact of different change scenarios
            const comparison = {
                scenarios: scenarios.map((scenario) => ({
                    name: scenario.name,
                    impact: {
                        entitiesAffected: 0,
                        riskLevel: "medium",
                        effort: "medium",
                    },
                })),
                recommendations: [],
            };
            reply.send({
                success: true,
                data: comparison,
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: "SIMULATION_FAILED",
                    message: "Failed to simulate change scenarios",
                },
            });
        }
    });
    // GET /api/impact/history/{entityId} - Get impact history for entity
    app.get("/history/:entityId", {
        schema: {
            params: {
                type: "object",
                properties: {
                    entityId: { type: "string" },
                },
                required: ["entityId"],
            },
            querystring: {
                type: "object",
                properties: {
                    since: { type: "string", format: "date-time" },
                    limit: { type: "number", default: 20 },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const { entityId } = request.params;
            const { since, limit } = request.query;
            // TODO: Retrieve impact history from database
            const history = {
                entityId,
                impacts: [],
                summary: {
                    totalChanges: 0,
                    averageImpact: "medium",
                    mostAffected: [],
                },
            };
            reply.send({
                success: true,
                data: history,
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: "IMPACT_HISTORY_FAILED",
                    message: "Failed to retrieve impact history",
                },
            });
        }
    });
}
//# sourceMappingURL=impact.js.map
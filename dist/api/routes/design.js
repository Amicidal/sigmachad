/**
 * Design & Specification Routes
 * Handles spec creation, validation, and management
 */
import { v4 as uuidv4 } from "uuid";
import { RelationshipType } from "../../models/relationships.js";
import { noiseConfig } from "../../config/noise.js";
export function registerDesignRoutes(app, kgService, dbService) {
    // Create specification
    app.post("/design/create-spec", {
        schema: {
            body: {
                type: "object",
                required: ["title", "description", "acceptanceCriteria"],
                properties: {
                    title: { type: "string", minLength: 1 },
                    description: { type: "string", minLength: 1 },
                    goals: { type: "array", items: { type: "string" } },
                    acceptanceCriteria: {
                        type: "array",
                        items: { type: "string" },
                        minItems: 1,
                    },
                    priority: {
                        type: "string",
                        enum: ["low", "medium", "high", "critical"],
                    },
                    assignee: { type: "string" },
                    tags: { type: "array", items: { type: "string" } },
                    dependencies: { type: "array", items: { type: "string" } },
                },
            },
            response: {
                200: {
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        data: {
                            type: "object",
                            properties: {
                                specId: { type: "string" },
                                spec: { type: "object" },
                                validationResults: { type: "object" },
                            },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const result = await createSpec(request.body, kgService, dbService);
            reply.send({
                success: true,
                data: result,
                metadata: {
                    requestId: request.id,
                    timestamp: new Date(),
                    executionTime: 0,
                },
            });
        }
        catch (error) {
            reply.status(400);
            reply.send({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: error instanceof Error ? error.message : "Unknown error",
                },
            });
        }
    });
    // Get specification
    app.get("/design/specs/:specId", async (request, reply) => {
        try {
            const { specId } = request.params;
            const result = await getSpec(specId, kgService, dbService);
            reply.send({
                success: true,
                data: result,
                metadata: {
                    requestId: request.id,
                    timestamp: new Date(),
                    executionTime: 0,
                },
            });
        }
        catch (error) {
            reply.status(404).send({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: error instanceof Error ? error.message : "Unknown error",
                },
            });
        }
    });
    // Update specification
    const registerUpdate = app.put && typeof app.put === "function"
        ? app.put.bind(app)
        : app.post.bind(app);
    registerUpdate("/design/specs/:specId", async (request, reply) => {
        try {
            const { specId } = request.params;
            const result = await updateSpec(specId, request.body, kgService, dbService);
            reply.send({
                success: true,
                data: result,
                metadata: {
                    requestId: request.id,
                    timestamp: new Date(),
                    executionTime: 0,
                },
            });
        }
        catch (error) {
            reply.status(400);
            reply.send({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: error instanceof Error ? error.message : "Unknown error",
                },
            });
        }
    });
    // List specifications
    app.get("/design/specs", async (request, reply) => {
        try {
            const params = request.query;
            const result = await listSpecs(params, kgService, dbService);
            reply.send({
                success: true,
                data: result.specs,
                pagination: result.pagination,
                metadata: {
                    requestId: request.id,
                    timestamp: new Date(),
                    executionTime: 0,
                },
            });
        }
        catch (error) {
            const requestParams = request.query;
            reply.status(400);
            reply.send({
                success: false,
                data: [],
                pagination: {
                    page: 1,
                    pageSize: request.query.limit || 20,
                    total: 0,
                    hasMore: false,
                },
                error: {
                    code: "VALIDATION_ERROR",
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                metadata: {
                    requestId: request.id,
                    timestamp: new Date(),
                    executionTime: 0,
                },
            });
        }
    });
    // POST /api/design/generate - Generate design/spec from inputs (stubbed)
    app.post("/design/generate", async (request, reply) => {
        try {
            reply.send({ success: true, data: { specId: uuidv4() } });
        }
        catch (error) {
            reply
                .status(500)
                .send({
                success: false,
                error: {
                    code: "GENERATE_FAILED",
                    message: "Failed to generate spec",
                },
            });
        }
    });
}
// Business logic functions
async function createSpec(params, kgService, dbService) {
    const specId = uuidv4();
    const spec = {
        id: specId,
        type: "spec",
        path: `specs/${specId}`,
        hash: "", // Will be calculated from content
        language: "text",
        lastModified: new Date(),
        created: new Date(),
        title: params.title,
        description: params.description,
        acceptanceCriteria: params.acceptanceCriteria,
        status: "draft",
        priority: params.priority || "medium",
        assignee: params.assignee,
        tags: params.tags || [],
        updated: new Date(),
    };
    // Validate acceptance criteria
    const validationResults = validateSpec(spec);
    // Store in database
    await dbService.postgresQuery(`INSERT INTO documents (id, type, content, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)`, [
        specId,
        "spec",
        JSON.stringify(spec),
        spec.created.toISOString(),
        spec.updated.toISOString(),
    ]);
    // Create entity in knowledge graph
    await kgService.createEntity(spec);
    // Heuristic REQUIRES/IMPACTS edges from acceptance criteria / description
    try {
        const namesFromAC = Array.from(new Set((spec.acceptanceCriteria || [])
            .flatMap((s) => String(s || '').match(/[A-Za-z_][A-Za-z0-9_]{2,}/g) || [])));
        const namesFromDesc = Array.from(new Set(String(spec.description || '')
            .match(/[A-Za-z_][A-Za-z0-9_]{2,}/g) || []));
        const pickTop = (arr, n) => arr.slice(0, n);
        for (const name of pickTop(namesFromAC, 25)) {
            try {
                const syms = (await kgService.findSymbolsByName(name, 3))
                    .filter((s) => ((s === null || s === void 0 ? void 0 : s.isExported) === true))
                    .filter((s) => ['function', 'class', 'interface', 'typeAlias'].includes(String((s === null || s === void 0 ? void 0 : s.kind) || '').toLowerCase()));
                const seen = new Set();
                for (const s of syms) {
                    if (!(s === null || s === void 0 ? void 0 : s.id) || seen.has(s.id))
                        continue;
                    seen.add(s.id);
                    const nm = String(s.name || '');
                    const conf = Math.min(1, (noiseConfig.DOC_LINK_BASE_CONF) + (Math.max(0, nm.length - noiseConfig.AST_MIN_NAME_LENGTH) * noiseConfig.DOC_LINK_STEP_CONF));
                    if (conf >= noiseConfig.MIN_INFERRED_CONFIDENCE) {
                        await kgService.createRelationship({
                            id: `rel_${spec.id}_${s.id}_REQUIRES`,
                            fromEntityId: spec.id,
                            toEntityId: s.id,
                            type: RelationshipType.REQUIRES,
                            created: new Date(),
                            lastModified: new Date(),
                            version: 1,
                            metadata: { inferred: true, confidence: conf, source: 'spec-acceptance' }
                        }, undefined, undefined, { validate: false });
                    }
                }
            }
            catch (_a) { }
        }
        for (const name of pickTop(namesFromDesc, 25)) {
            try {
                const syms = (await kgService.findSymbolsByName(name, 2))
                    .filter((s) => ((s === null || s === void 0 ? void 0 : s.isExported) === true))
                    .filter((s) => ['function', 'class', 'interface', 'typeAlias'].includes(String((s === null || s === void 0 ? void 0 : s.kind) || '').toLowerCase()));
                const seen = new Set();
                for (const s of syms) {
                    if (!(s === null || s === void 0 ? void 0 : s.id) || seen.has(s.id))
                        continue;
                    seen.add(s.id);
                    const nm = String(s.name || '');
                    const conf = Math.min(1, (noiseConfig.DOC_LINK_BASE_CONF) + (Math.max(0, nm.length - noiseConfig.AST_MIN_NAME_LENGTH) * noiseConfig.DOC_LINK_STEP_CONF));
                    if (conf >= noiseConfig.MIN_INFERRED_CONFIDENCE) {
                        await kgService.createRelationship({
                            id: `rel_${spec.id}_${s.id}_IMPACTS`,
                            fromEntityId: spec.id,
                            toEntityId: s.id,
                            type: RelationshipType.IMPACTS,
                            created: new Date(),
                            lastModified: new Date(),
                            version: 1,
                            metadata: { inferred: true, confidence: conf, source: 'spec-description' }
                        }, undefined, undefined, { validate: false });
                    }
                }
            }
            catch (_b) { }
        }
    }
    catch (_c) { }
    return {
        specId,
        spec,
        validationResults,
    };
}
async function getSpec(specId, kgService, dbService) {
    var _a;
    const result = await dbService.postgresQuery("SELECT content FROM documents WHERE id = $1 AND type = $2", [specId, "spec"]);
    const rows = (_a = result === null || result === void 0 ? void 0 : result.rows) !== null && _a !== void 0 ? _a : [];
    if (rows.length === 0) {
        throw new Error(`Specification ${specId} not found`);
    }
    const spec = JSON.parse(rows[0].content);
    // Get related specs and affected entities (placeholder for now)
    const relatedSpecs = [];
    const affectedEntities = [];
    const testCoverage = {
        entityId: spec.id,
        overallCoverage: { lines: 0, branches: 0, functions: 0, statements: 0 },
        testBreakdown: {
            unitTests: { lines: 0, branches: 0, functions: 0, statements: 0 },
            integrationTests: { lines: 0, branches: 0, functions: 0, statements: 0 },
            e2eTests: { lines: 0, branches: 0, functions: 0, statements: 0 },
        },
        uncoveredLines: [],
        uncoveredBranches: [],
        testCases: [],
    };
    return {
        spec,
        relatedSpecs,
        affectedEntities,
        testCoverage,
    };
}
async function updateSpec(specId, updates, kgService, dbService) {
    var _a;
    // Get existing spec
    const result = await dbService.postgresQuery("SELECT content FROM documents WHERE id = $1 AND type = $2", [specId, "spec"]);
    const rows2 = (_a = result === null || result === void 0 ? void 0 : result.rows) !== null && _a !== void 0 ? _a : [];
    if (rows2.length === 0) {
        throw new Error(`Specification ${specId} not found`);
    }
    const existingSpec = JSON.parse(rows2[0].content);
    // Apply updates
    const updatedSpec = {
        ...existingSpec,
        ...updates,
        updated: new Date(),
    };
    // Validate updated spec
    const validationResults = validateSpec(updatedSpec);
    if (!validationResults.isValid) {
        throw new Error(`Validation failed: ${validationResults.issues
            .map((i) => i.message)
            .join(", ")}`);
    }
    // Update in database
    await dbService.postgresQuery("UPDATE documents SET content = $1, updated_at = $2 WHERE id = $3", [JSON.stringify(updatedSpec), updatedSpec.updated.toISOString(), specId]);
    // Update in knowledge graph
    await kgService.updateEntity(specId, updatedSpec);
    // Refresh REQUIRES/IMPACTS edges using same heuristics
    try {
        const namesFromAC = Array.from(new Set((updatedSpec.acceptanceCriteria || [])
            .flatMap((s) => String(s || '').match(/[A-Za-z_][A-Za-z0-9_]{2,}/g) || [])));
        const namesFromDesc = Array.from(new Set(String(updatedSpec.description || '')
            .match(/[A-Za-z_][A-Za-z0-9_]{2,}/g) || []));
        const pickTop = (arr, n) => arr.slice(0, n);
        for (const name of pickTop(namesFromAC, 25)) {
            try {
                const syms = (await kgService.findSymbolsByName(name, 3))
                    .filter((s) => ((s === null || s === void 0 ? void 0 : s.isExported) === true))
                    .filter((s) => ['function', 'class', 'interface', 'typeAlias'].includes(String((s === null || s === void 0 ? void 0 : s.kind) || '').toLowerCase()));
                const seen = new Set();
                for (const s of syms) {
                    if (!(s === null || s === void 0 ? void 0 : s.id) || seen.has(s.id))
                        continue;
                    seen.add(s.id);
                    const nm = String(s.name || '');
                    const conf = Math.min(1, (noiseConfig.DOC_LINK_BASE_CONF) + (Math.max(0, nm.length - noiseConfig.AST_MIN_NAME_LENGTH) * noiseConfig.DOC_LINK_STEP_CONF));
                    if (conf >= noiseConfig.MIN_INFERRED_CONFIDENCE) {
                        await kgService.createRelationship({
                            id: `rel_${updatedSpec.id}_${s.id}_REQUIRES`,
                            fromEntityId: updatedSpec.id,
                            toEntityId: s.id,
                            type: RelationshipType.REQUIRES,
                            created: new Date(),
                            lastModified: new Date(),
                            version: 1,
                            metadata: { inferred: true, confidence: conf, source: 'spec-acceptance' }
                        }, undefined, undefined, { validate: false });
                    }
                }
            }
            catch (_b) { }
        }
        for (const name of pickTop(namesFromDesc, 25)) {
            try {
                const syms = (await kgService.findSymbolsByName(name, 2))
                    .filter((s) => ((s === null || s === void 0 ? void 0 : s.isExported) === true))
                    .filter((s) => ['function', 'class', 'interface', 'typeAlias'].includes(String((s === null || s === void 0 ? void 0 : s.kind) || '').toLowerCase()));
                const seen = new Set();
                for (const s of syms) {
                    if (!(s === null || s === void 0 ? void 0 : s.id) || seen.has(s.id))
                        continue;
                    seen.add(s.id);
                    const nm = String(s.name || '');
                    const conf = Math.min(1, (noiseConfig.DOC_LINK_BASE_CONF) + (Math.max(0, nm.length - noiseConfig.AST_MIN_NAME_LENGTH) * noiseConfig.DOC_LINK_STEP_CONF));
                    if (conf >= noiseConfig.MIN_INFERRED_CONFIDENCE) {
                        await kgService.createRelationship({
                            id: `rel_${updatedSpec.id}_${s.id}_IMPACTS`,
                            fromEntityId: updatedSpec.id,
                            toEntityId: s.id,
                            type: RelationshipType.IMPACTS,
                            created: new Date(),
                            lastModified: new Date(),
                            version: 1,
                            metadata: { inferred: true, confidence: conf, source: 'spec-description' }
                        }, undefined, undefined, { validate: false });
                    }
                }
            }
            catch (_c) { }
        }
    }
    catch (_d) { }
    return updatedSpec;
}
async function listSpecs(params, kgService, dbService) {
    var _a;
    let query = "SELECT content FROM documents WHERE type = $1";
    const queryParams = ["spec"];
    let paramIndex = 2;
    // Add filters
    if (params.status && params.status.length > 0) {
        query += ` AND content->>'status' = ANY($${paramIndex})`;
        queryParams.push(params.status);
        paramIndex++;
    }
    if (params.priority && params.priority.length > 0) {
        query += ` AND content->>'priority' = ANY($${paramIndex})`;
        queryParams.push(params.priority);
        paramIndex++;
    }
    if (params.assignee) {
        query += ` AND content->>'assignee' = $${paramIndex}`;
        queryParams.push(params.assignee);
        paramIndex++;
    }
    if (params.search) {
        query += ` AND (content->>'title' ILIKE $${paramIndex} OR content->>'description' ILIKE $${paramIndex})`;
        queryParams.push(`%${params.search}%`);
        paramIndex++;
    }
    // Add sorting
    const sortBy = params.sortBy || "created";
    const sortOrder = params.sortOrder || "desc";
    query += ` ORDER BY content->>'${sortBy}' ${sortOrder.toUpperCase()}`;
    // Add pagination
    const limit = params.limit || 20;
    const offset = params.offset || 0;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);
    const result = await dbService.postgresQuery(query, queryParams);
    const rows3 = (_a = result === null || result === void 0 ? void 0 : result.rows) !== null && _a !== void 0 ? _a : [];
    const specs = rows3.map((row) => JSON.parse(row.content));
    return {
        specs,
        pagination: {
            page: Math.floor(offset / limit) + 1,
            pageSize: limit,
            total: specs.length, // Simplified - would need a separate COUNT query
            hasMore: specs.length === limit,
        },
    };
}
function validateSpec(spec) {
    const issues = [];
    const suggestions = [];
    // Validate title
    if (!spec.title || spec.title.trim().length === 0) {
        issues.push({
            field: "title",
            message: "Title is required",
            severity: "error",
            file: spec.path,
            line: 0,
            column: 0,
            rule: "required-field",
        });
    }
    else if (spec.title.length < 5) {
        issues.push({
            field: "title",
            message: "Title should be more descriptive (at least 5 characters)",
            severity: "warning",
            file: spec.path,
            line: 0,
            column: 0,
            rule: "minimum-length",
            suggestion: "Consider making the title more descriptive",
        });
    }
    // Validate description
    if (!spec.description || spec.description.trim().length === 0) {
        issues.push({
            field: "description",
            message: "Description is required",
            severity: "error",
            file: spec.path,
            line: 0,
            column: 0,
            rule: "required-field",
        });
    }
    else if (spec.description.length < 20) {
        issues.push({
            field: "description",
            message: "Description should provide more context (at least 20 characters)",
            severity: "warning",
            file: spec.path,
            line: 0,
            column: 0,
            rule: "minimum-length",
            suggestion: "Consider adding more context to the description",
        });
    }
    // Validate acceptance criteria
    if (!spec.acceptanceCriteria || spec.acceptanceCriteria.length === 0) {
        issues.push({
            field: "acceptanceCriteria",
            message: "At least one acceptance criterion is required",
            severity: "error",
            file: spec.path,
            line: 0,
            column: 0,
            rule: "required-field",
        });
    }
    else {
        spec.acceptanceCriteria.forEach((criterion, index) => {
            if (criterion.trim().length < 10) {
                issues.push({
                    field: `acceptanceCriteria[${index}]`,
                    message: `Acceptance criterion ${index + 1} should be more specific (at least 10 characters)`,
                    severity: "warning",
                    file: spec.path,
                    line: 0,
                    column: 0,
                    rule: "minimum-length",
                    suggestion: "Consider making the acceptance criterion more specific",
                });
            }
        });
        if (spec.acceptanceCriteria.length < 3) {
            suggestions.push("Consider adding more acceptance criteria for better test coverage");
        }
    }
    return {
        isValid: issues.filter((issue) => issue.severity === "error").length === 0,
        issues,
        suggestions,
    };
}
//# sourceMappingURL=design.js.map
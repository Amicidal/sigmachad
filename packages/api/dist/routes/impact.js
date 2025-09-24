/**
 * Impact Analysis Routes
 * Provides cascading impact analysis for proposed changes.
 */
export async function registerImpactRoutes(app, kgService, dbService) {
    const sanitizeDepth = (value) => {
        if (typeof value !== "number" || !Number.isFinite(value)) {
            return undefined;
        }
        const clamped = Math.max(1, Math.min(8, Math.floor(value)));
        return clamped;
    };
    const deriveRiskLevel = (analysis) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
        const directImpactEntries = Array.isArray(analysis.directImpact)
            ? analysis.directImpact
            : [];
        const cascadingImpactEntries = Array.isArray(analysis.cascadingImpact)
            ? analysis.cascadingImpact
            : [];
        const specSummary = (_a = analysis.specImpact) === null || _a === void 0 ? void 0 : _a.summary;
        if ((_b = analysis.deploymentGate) === null || _b === void 0 ? void 0 : _b.blocked) {
            return "critical";
        }
        if (specSummary) {
            if (((_c = specSummary.byPriority) === null || _c === void 0 ? void 0 : _c.critical) > 0) {
                if (((_d = specSummary.pendingSpecs) !== null && _d !== void 0 ? _d : 0) > 0 ||
                    ((_e = specSummary.acceptanceCriteriaReferences) !== null && _e !== void 0 ? _e : 0) > 0) {
                    return "critical";
                }
                return "high";
            }
            if (((_g = (_f = specSummary.byPriority) === null || _f === void 0 ? void 0 : _f.high) !== null && _g !== void 0 ? _g : 0) > 0 ||
                ((_j = (_h = specSummary.byImpactLevel) === null || _h === void 0 ? void 0 : _h.critical) !== null && _j !== void 0 ? _j : 0) > 0) {
                return "high";
            }
        }
        const hasHighDirect = directImpactEntries.some((entry) => entry.severity === "high");
        if (hasHighDirect) {
            return "high";
        }
        const hasMediumSignals = directImpactEntries.some((entry) => entry.severity === "medium") ||
            cascadingImpactEntries.length > 0 ||
            ((_m = (_l = (_k = analysis.testImpact) === null || _k === void 0 ? void 0 : _k.affectedTests) === null || _l === void 0 ? void 0 : _l.length) !== null && _m !== void 0 ? _m : 0) > 0 ||
            ((_q = (_p = (_o = analysis.documentationImpact) === null || _o === void 0 ? void 0 : _o.staleDocs) === null || _p === void 0 ? void 0 : _p.length) !== null && _q !== void 0 ? _q : 0) > 0 ||
            ((_t = (_s = (_r = analysis.documentationImpact) === null || _r === void 0 ? void 0 : _r.missingDocs) === null || _s === void 0 ? void 0 : _s.length) !== null && _t !== void 0 ? _t : 0) > 0 ||
            ((_v = (_u = specSummary === null || specSummary === void 0 ? void 0 : specSummary.byPriority) === null || _u === void 0 ? void 0 : _u.medium) !== null && _v !== void 0 ? _v : 0) > 0 ||
            ((_x = (_w = specSummary === null || specSummary === void 0 ? void 0 : specSummary.byImpactLevel) === null || _w === void 0 ? void 0 : _w.high) !== null && _x !== void 0 ? _x : 0) > 0 ||
            ((_y = specSummary === null || specSummary === void 0 ? void 0 : specSummary.pendingSpecs) !== null && _y !== void 0 ? _y : 0) > 0 ||
            ((_z = specSummary === null || specSummary === void 0 ? void 0 : specSummary.acceptanceCriteriaReferences) !== null && _z !== void 0 ? _z : 0) > 0;
        return hasMediumSignals ? "medium" : "low";
    };
    const summarizeAnalysis = (analysis) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        const directImpactEntries = Array.isArray(analysis.directImpact)
            ? analysis.directImpact
            : [];
        const cascadingImpactEntries = Array.isArray(analysis.cascadingImpact)
            ? analysis.cascadingImpact
            : [];
        const directDependents = directImpactEntries.reduce((total, entry) => total + (Array.isArray(entry.entities) ? entry.entities.length : 0), 0);
        const cascadingDependents = cascadingImpactEntries.reduce((total, entry) => total + (Array.isArray(entry.entities) ? entry.entities.length : 0), 0);
        const highestCascadeLevel = cascadingImpactEntries.reduce((level, entry) => Math.max(level, entry.level || 0), 0);
        const impactedTests = (_c = (_b = (_a = analysis.testImpact) === null || _a === void 0 ? void 0 : _a.affectedTests) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0;
        const coverageImpact = (_e = (_d = analysis.testImpact) === null || _d === void 0 ? void 0 : _d.coverageImpact) !== null && _e !== void 0 ? _e : 0;
        const missingDocs = (_h = (_g = (_f = analysis.documentationImpact) === null || _f === void 0 ? void 0 : _f.missingDocs) === null || _g === void 0 ? void 0 : _g.length) !== null && _h !== void 0 ? _h : 0;
        const staleDocs = (_l = (_k = (_j = analysis.documentationImpact) === null || _j === void 0 ? void 0 : _j.staleDocs) === null || _k === void 0 ? void 0 : _k.length) !== null && _l !== void 0 ? _l : 0;
        const deploymentGate = (_m = analysis.deploymentGate) !== null && _m !== void 0 ? _m : {
            blocked: false,
            level: "none",
            reasons: [],
            stats: { missingDocs: 0, staleDocs: 0, freshnessPenalty: 0 },
        };
        const specSummary = (_p = (_o = analysis.specImpact) === null || _o === void 0 ? void 0 : _o.summary) !== null && _p !== void 0 ? _p : {
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
        };
        return {
            directDependents,
            cascadingDependents,
            highestCascadeLevel,
            impactedTests,
            coverageImpact,
            missingDocs,
            staleDocs,
            deploymentGate,
            specSummary,
        };
    };
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
            if (!Array.isArray(params.changes) || params.changes.length === 0) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: "INVALID_REQUEST",
                        message: "Changes array is required",
                    },
                });
            }
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
            const sanitizedDepth = sanitizeDepth(params.maxDepth);
            const analysis = await kgService.analyzeImpact({
                changes: params.changes,
                includeIndirect: params.includeIndirect !== false,
                maxDepth: sanitizedDepth,
            });
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
    app.get("/impact/changes", {
        schema: {
            querystring: {
                type: "object",
                properties: {
                    since: { type: "string", format: "date-time" },
                    limit: { type: "number", default: 10 },
                    includeIndirect: { type: "boolean", default: true },
                    maxDepth: { type: "number" },
                },
            },
        },
    }, async (request, reply) => {
        var _a, _b, _c;
        try {
            const { since, limit, includeIndirect, maxDepth } = request.query;
            const parsedSince = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);
            if (Number.isNaN(parsedSince.getTime())) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: "INVALID_REQUEST",
                        message: "Query parameter 'since' must be a valid date-time",
                    },
                });
            }
            const sanitizedLimit = Math.max(1, Math.min(limit !== null && limit !== void 0 ? limit : 10, 25));
            const sanitizedDepth = sanitizeDepth(maxDepth);
            const recentEntityIds = await kgService.findRecentEntityIds(sanitizedLimit);
            const records = [];
            for (const entityId of recentEntityIds) {
                const analysis = await kgService.analyzeImpact({
                    changes: [
                        {
                            entityId,
                            changeType: "modify",
                        },
                    ],
                    includeIndirect: includeIndirect !== false,
                    maxDepth: sanitizedDepth,
                });
                const entity = await kgService.getEntity(entityId).catch(() => null);
                const entitySummary = entity
                    ? {
                        id: entity.id,
                        type: (_a = entity === null || entity === void 0 ? void 0 : entity.type) !== null && _a !== void 0 ? _a : "unknown",
                        name: (_c = (_b = entity === null || entity === void 0 ? void 0 : entity.name) !== null && _b !== void 0 ? _b : entity === null || entity === void 0 ? void 0 : entity.title) !== null && _c !== void 0 ? _c : entity.id,
                        path: entity === null || entity === void 0 ? void 0 : entity.path,
                    }
                    : { id: entityId };
                const metrics = summarizeAnalysis(analysis);
                const riskLevel = deriveRiskLevel(analysis);
                records.push({
                    entity: entitySummary,
                    changeType: "modify",
                    analysis,
                    metrics,
                    riskLevel,
                    recommendations: analysis.recommendations,
                });
            }
            const riskSummary = records.reduce((acc, record) => {
                acc[record.riskLevel] += 1;
                return acc;
            }, { critical: 0, high: 0, medium: 0, low: 0 });
            const aggregateMetrics = records.reduce((acc, record) => {
                acc.directDependents += record.metrics.directDependents;
                acc.cascadingDependents += record.metrics.cascadingDependents;
                acc.impactedTests += record.metrics.impactedTests;
                acc.missingDocs += record.metrics.missingDocs;
                acc.staleDocs += record.metrics.staleDocs;
                acc.coverageImpact += record.metrics.coverageImpact;
                for (const key of ["critical", "high", "medium", "low"]) {
                    acc.specSummary.byPriority[key] +=
                        record.metrics.specSummary.byPriority[key];
                    acc.specSummary.byImpactLevel[key] +=
                        record.metrics.specSummary.byImpactLevel[key];
                }
                for (const key of [
                    "draft",
                    "approved",
                    "implemented",
                    "deprecated",
                    "unknown",
                ]) {
                    acc.specSummary.statuses[key] +=
                        record.metrics.specSummary.statuses[key];
                }
                acc.specSummary.acceptanceCriteriaReferences +=
                    record.metrics.specSummary.acceptanceCriteriaReferences;
                acc.specSummary.pendingSpecs +=
                    record.metrics.specSummary.pendingSpecs;
                return acc;
            }, {
                directDependents: 0,
                cascadingDependents: 0,
                impactedTests: 0,
                missingDocs: 0,
                staleDocs: 0,
                coverageImpact: 0,
                specSummary: {
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
            });
            reply.send({
                success: true,
                data: {
                    since: parsedSince.toISOString(),
                    limit: sanitizedLimit,
                    analyzedEntities: records.length,
                    riskSummary,
                    aggregateMetrics,
                    records,
                },
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: "IMPACT_CHANGES_FAILED",
                    message: "Failed to assemble recent impact changes",
                },
            });
        }
    });
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
                    includeIndirect: { type: "boolean", default: true },
                    maxDepth: { type: "number" },
                    signatureChange: { type: "boolean" },
                },
            },
        },
    }, async (request, reply) => {
        var _a, _b, _c;
        try {
            const { entityId } = request.params;
            const { changeType, includeIndirect, maxDepth, signatureChange } = request.query;
            const sanitizedDepth = sanitizeDepth(maxDepth);
            const analysis = await kgService.analyzeImpact({
                changes: [
                    {
                        entityId,
                        changeType: changeType || "modify",
                        signatureChange: signatureChange === true,
                    },
                ],
                includeIndirect: includeIndirect !== false,
                maxDepth: sanitizedDepth,
            });
            const entity = await kgService.getEntity(entityId).catch(() => null);
            const entitySummary = entity
                ? {
                    id: entity.id,
                    type: (_a = entity === null || entity === void 0 ? void 0 : entity.type) !== null && _a !== void 0 ? _a : "unknown",
                    name: (_c = (_b = entity === null || entity === void 0 ? void 0 : entity.name) !== null && _b !== void 0 ? _b : entity === null || entity === void 0 ? void 0 : entity.title) !== null && _c !== void 0 ? _c : entity.id,
                    path: entity === null || entity === void 0 ? void 0 : entity.path,
                }
                : { id: entityId };
            const metrics = summarizeAnalysis(analysis);
            const riskLevel = deriveRiskLevel(analysis);
            reply.send({
                success: true,
                data: {
                    entity: entitySummary,
                    change: {
                        changeType: changeType || "modify",
                        signatureChange: signatureChange === true,
                    },
                    analysis,
                    metrics,
                    riskLevel,
                    deploymentGate: analysis.deploymentGate,
                    recommendations: analysis.recommendations,
                },
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
                                            signatureChange: { type: "boolean" },
                                        },
                                        required: ["entityId", "changeType"],
                                    },
                                },
                                includeIndirect: { type: "boolean", default: true },
                                maxDepth: { type: "number" },
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
            if (!Array.isArray(scenarios) || scenarios.length === 0) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: "INVALID_REQUEST",
                        message: "At least one scenario must be provided",
                    },
                });
            }
            const scenarioResponses = [];
            for (const scenario of scenarios) {
                if (!Array.isArray(scenario.changes) || scenario.changes.length === 0) {
                    continue;
                }
                const sanitizedChanges = scenario.changes.map((change) => ({
                    entityId: change.entityId,
                    changeType: change.changeType,
                    signatureChange: change.signatureChange === true,
                }));
                const sanitizedDepth = sanitizeDepth(scenario.maxDepth);
                const analysis = await kgService.analyzeImpact({
                    changes: sanitizedChanges,
                    includeIndirect: scenario.includeIndirect !== false,
                    maxDepth: sanitizedDepth,
                });
                const metrics = summarizeAnalysis(analysis);
                const riskLevel = deriveRiskLevel(analysis);
                scenarioResponses.push({
                    name: scenario.name,
                    request: {
                        includeIndirect: scenario.includeIndirect !== false,
                        maxDepth: sanitizedDepth,
                    },
                    analysis,
                    metrics,
                    riskLevel,
                    recommendations: analysis.recommendations,
                });
            }
            if (scenarioResponses.length === 0) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: "INVALID_REQUEST",
                        message: "Scenarios must include at least one valid change",
                    },
                });
            }
            const riskOrder = {
                critical: 3,
                high: 2,
                medium: 1,
                low: 0,
            };
            const highestRisk = scenarioResponses.reduce((current, scenario) => {
                if (!current)
                    return scenario;
                return riskOrder[scenario.riskLevel] > riskOrder[current.riskLevel]
                    ? scenario
                    : current;
            }, scenarioResponses[0]);
            const riskDistribution = scenarioResponses.reduce((acc, scenario) => {
                acc[scenario.riskLevel] += 1;
                return acc;
            }, { critical: 0, high: 0, medium: 0, low: 0 });
            reply.send({
                success: true,
                data: {
                    scenarios: scenarioResponses,
                    summary: {
                        highestRiskScenario: {
                            name: highestRisk.name,
                            riskLevel: highestRisk.riskLevel,
                        },
                        riskDistribution,
                    },
                },
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
    app.get("/impact/history/:entityId", {
        schema: {
            params: {
                type: "object",
                properties: { entityId: { type: "string" } },
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
        var _a;
        try {
            const { entityId } = request.params;
            const { since, limit } = request.query;
            const parsedSince = since ? new Date(since) : undefined;
            if (parsedSince && Number.isNaN(parsedSince.getTime())) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: "INVALID_REQUEST",
                        message: "Query parameter 'since' must be a valid date-time",
                    },
                });
            }
            const sanitizedLimit = Math.max(1, Math.min(limit !== null && limit !== void 0 ? limit : 20, 100));
            const values = [entityId];
            let whereClause = "type = 'impact_analysis' AND metadata->>'entityId' = $1";
            if (parsedSince) {
                values.push(parsedSince.toISOString());
                whereClause += " AND COALESCE((metadata->>'timestamp')::timestamptz, created_at) >= $2";
            }
            const limitParam = values.length + 1;
            const rows = await dbService.postgresQuery(`SELECT id, content, metadata, created_at, updated_at
           FROM documents
           WHERE ${whereClause}
           ORDER BY COALESCE((metadata->>'timestamp')::timestamptz, created_at) DESC
           LIMIT $${limitParam}`, [...values, sanitizedLimit]);
            const records = ((_a = rows.rows) !== null && _a !== void 0 ? _a : []).map((row) => {
                var _a, _b;
                const rawContent = row.content;
                const rawMetadata = row.metadata;
                const analysis = typeof rawContent === "string" ? JSON.parse(rawContent) : rawContent;
                const metadata = typeof rawMetadata === "string" ? JSON.parse(rawMetadata) : rawMetadata;
                const metrics = summarizeAnalysis(analysis);
                const riskLevel = deriveRiskLevel(analysis);
                return {
                    id: row.id,
                    timestamp: (metadata === null || metadata === void 0 ? void 0 : metadata.timestamp) || (row.created_at ? new Date(row.created_at).toISOString() : undefined),
                    changeType: (metadata === null || metadata === void 0 ? void 0 : metadata.changeType) || "modify",
                    directImpactCount: (_a = metadata === null || metadata === void 0 ? void 0 : metadata.directImpactCount) !== null && _a !== void 0 ? _a : metrics.directDependents,
                    cascadingImpactCount: (_b = metadata === null || metadata === void 0 ? void 0 : metadata.cascadingImpactCount) !== null && _b !== void 0 ? _b : metrics.cascadingDependents,
                    analysis,
                    metrics,
                    riskLevel,
                    metadata,
                };
            });
            reply.send({
                success: true,
                data: {
                    entityId,
                    totalRecords: records.length,
                    records,
                },
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
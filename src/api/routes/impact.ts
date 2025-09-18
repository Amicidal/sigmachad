/**
 * Impact Analysis Routes
 * Provides cascading impact analysis for proposed changes.
 */

import { FastifyInstance } from "fastify";
import { KnowledgeGraphService } from "../../services/KnowledgeGraphService.js";
import { DatabaseService } from "../../services/DatabaseService.js";
import { ImpactAnalysis, ImpactAnalysisRequest } from "../../models/types.js";

type ChangeType = ImpactAnalysisRequest["changes"][number]["changeType"];
type ImpactChange = ImpactAnalysisRequest["changes"][number];

export async function registerImpactRoutes(
  app: FastifyInstance,
  kgService: KnowledgeGraphService,
  dbService: DatabaseService
): Promise<void> {
  const sanitizeDepth = (value: unknown): number | undefined => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return undefined;
    }
    const clamped = Math.max(1, Math.min(8, Math.floor(value)));
    return clamped;
  };

  const deriveRiskLevel = (
    analysis: ImpactAnalysis
  ): "critical" | "high" | "medium" | "low" => {
    const directImpactEntries = Array.isArray(analysis.directImpact)
      ? analysis.directImpact
      : [];
    const cascadingImpactEntries = Array.isArray(analysis.cascadingImpact)
      ? analysis.cascadingImpact
      : [];
    const specSummary = analysis.specImpact?.summary;

    if (analysis.deploymentGate?.blocked) {
      return "critical";
    }

    if (specSummary) {
      if (specSummary.byPriority?.critical > 0) {
        if (
          (specSummary.pendingSpecs ?? 0) > 0 ||
          (specSummary.acceptanceCriteriaReferences ?? 0) > 0
        ) {
          return "critical";
        }
        return "high";
      }

      if (
        (specSummary.byPriority?.high ?? 0) > 0 ||
        (specSummary.byImpactLevel?.critical ?? 0) > 0
      ) {
        return "high";
      }
    }

    const hasHighDirect = directImpactEntries.some(
      (entry) => entry.severity === "high"
    );
    if (hasHighDirect) {
      return "high";
    }

    const hasMediumSignals =
      directImpactEntries.some((entry) => entry.severity === "medium") ||
      cascadingImpactEntries.length > 0 ||
      (analysis.testImpact?.affectedTests?.length ?? 0) > 0 ||
      (analysis.documentationImpact?.staleDocs?.length ?? 0) > 0 ||
      (analysis.documentationImpact?.missingDocs?.length ?? 0) > 0 ||
      (specSummary?.byPriority?.medium ?? 0) > 0 ||
      (specSummary?.byImpactLevel?.high ?? 0) > 0 ||
      (specSummary?.pendingSpecs ?? 0) > 0 ||
      (specSummary?.acceptanceCriteriaReferences ?? 0) > 0;

    return hasMediumSignals ? "medium" : "low";
  };

  const summarizeAnalysis = (analysis: ImpactAnalysis) => {
    const directImpactEntries = Array.isArray(analysis.directImpact)
      ? analysis.directImpact
      : [];
    const cascadingImpactEntries = Array.isArray(analysis.cascadingImpact)
      ? analysis.cascadingImpact
      : [];

    const directDependents = directImpactEntries.reduce(
      (total, entry) => total + (Array.isArray(entry.entities) ? entry.entities.length : 0),
      0
    );
    const cascadingDependents = cascadingImpactEntries.reduce(
      (total, entry) => total + (Array.isArray(entry.entities) ? entry.entities.length : 0),
      0
    );
    const highestCascadeLevel = cascadingImpactEntries.reduce(
      (level, entry) => Math.max(level, entry.level || 0),
      0
    );

    const impactedTests = analysis.testImpact?.affectedTests?.length ?? 0;
    const coverageImpact = analysis.testImpact?.coverageImpact ?? 0;
    const missingDocs = analysis.documentationImpact?.missingDocs?.length ?? 0;
    const staleDocs = analysis.documentationImpact?.staleDocs?.length ?? 0;

    const deploymentGate =
      analysis.deploymentGate ?? {
        blocked: false,
        level: "none" as const,
        reasons: [],
        stats: { missingDocs: 0, staleDocs: 0, freshnessPenalty: 0 },
      };

    const specSummary = analysis.specImpact?.summary ?? {
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

  app.post(
    "/impact/analyze",
    {
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
    },
    async (request, reply) => {
      try {
        const params = request.body as ImpactAnalysisRequest;

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
                message:
                  "Each change must have a valid changeType (modify, delete, or rename)",
              },
            });
          }
        }

        const sanitizedDepth = sanitizeDepth(params.maxDepth);

        const analysis = await kgService.analyzeImpact(params.changes, {
          includeIndirect: params.includeIndirect !== false,
          maxDepth: sanitizedDepth,
        });

        reply.send({
          success: true,
          data: analysis,
        });
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: "IMPACT_ANALYSIS_FAILED",
            message: "Failed to analyze change impact",
          },
        });
      }
    }
  );

  app.get(
    "/impact/changes",
    {
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
    },
    async (request, reply) => {
      try {
        const { since, limit, includeIndirect, maxDepth } = request.query as {
          since?: string;
          limit?: number;
          includeIndirect?: boolean;
          maxDepth?: number;
        };

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

        const sanitizedLimit = Math.max(1, Math.min(limit ?? 10, 25));
        const sanitizedDepth = sanitizeDepth(maxDepth);

        const recentEntityIds = await kgService.findRecentEntityIds(
          parsedSince,
          sanitizedLimit
        );

        const records = [] as Array<{
          entity: Record<string, any>;
          changeType: ChangeType;
          analysis: ImpactAnalysis;
          metrics: ReturnType<typeof summarizeAnalysis>;
          riskLevel: "critical" | "high" | "medium" | "low";
          recommendations: ImpactAnalysis["recommendations"];
        }>;

        for (const entityId of recentEntityIds) {
          const analysis = await kgService.analyzeImpact(
            [
              {
                entityId,
                changeType: "modify",
              },
            ],
            {
              includeIndirect: includeIndirect !== false,
              maxDepth: sanitizedDepth,
            }
          );

          const entity = await kgService.getEntity(entityId).catch(() => null);
          const entitySummary = entity
            ? {
                id: entity.id,
                type: (entity as any)?.type ?? "unknown",
                name: (entity as any)?.name ?? (entity as any)?.title ?? entity.id,
                path: (entity as any)?.path,
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

        const riskSummary = records.reduce(
          (acc, record) => {
            acc[record.riskLevel] += 1;
            return acc;
          },
          { critical: 0, high: 0, medium: 0, low: 0 }
        );

        const aggregateMetrics = records.reduce(
          (acc, record) => {
            acc.directDependents += record.metrics.directDependents;
            acc.cascadingDependents += record.metrics.cascadingDependents;
            acc.impactedTests += record.metrics.impactedTests;
            acc.missingDocs += record.metrics.missingDocs;
            acc.staleDocs += record.metrics.staleDocs;
            acc.coverageImpact += record.metrics.coverageImpact;
            for (const key of ["critical", "high", "medium", "low"] as const) {
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
            ] as const) {
              acc.specSummary.statuses[key] +=
                record.metrics.specSummary.statuses[key];
            }
            acc.specSummary.acceptanceCriteriaReferences +=
              record.metrics.specSummary.acceptanceCriteriaReferences;
            acc.specSummary.pendingSpecs +=
              record.metrics.specSummary.pendingSpecs;
            return acc;
          },
          {
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
          }
        );

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
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: "IMPACT_CHANGES_FAILED",
            message: "Failed to assemble recent impact changes",
          },
        });
      }
    }
  );

  app.get(
    "/impact/entity/:entityId",
    {
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
    },
    async (request, reply) => {
      try {
        const { entityId } = request.params as { entityId: string };
        const { changeType, includeIndirect, maxDepth, signatureChange } =
          request.query as {
            changeType?: ChangeType;
            includeIndirect?: boolean;
            maxDepth?: number;
            signatureChange?: boolean;
          };

        const sanitizedDepth = sanitizeDepth(maxDepth);

        const analysis = await kgService.analyzeImpact(
          [
            {
              entityId,
              changeType: changeType || "modify",
              signatureChange: signatureChange === true,
            },
          ],
          {
            includeIndirect: includeIndirect !== false,
            maxDepth: sanitizedDepth,
          }
        );

        const entity = await kgService.getEntity(entityId).catch(() => null);
        const entitySummary = entity
          ? {
              id: entity.id,
              type: (entity as any)?.type ?? "unknown",
              name: (entity as any)?.name ?? (entity as any)?.title ?? entity.id,
              path: (entity as any)?.path,
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
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: "ENTITY_IMPACT_FAILED",
            message: "Failed to assess entity impact",
          },
        });
      }
    }
  );

  app.post(
    "/impact/simulate",
    {
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
    },
    async (request, reply) => {
      try {
        const { scenarios } = request.body as {
          scenarios: Array<
            {
              name: string;
              changes: ImpactChange[];
              includeIndirect?: boolean;
              maxDepth?: number;
            }
          >;
        };

        if (!Array.isArray(scenarios) || scenarios.length === 0) {
          return reply.status(400).send({
            success: false,
            error: {
              code: "INVALID_REQUEST",
              message: "At least one scenario must be provided",
            },
          });
        }

        const scenarioResponses = [] as Array<{
          name: string;
          request: {
            includeIndirect: boolean;
            maxDepth?: number;
          };
          analysis: ImpactAnalysis;
          metrics: ReturnType<typeof summarizeAnalysis>;
          riskLevel: "critical" | "high" | "medium" | "low";
          recommendations: ImpactAnalysis["recommendations"];
        }>;

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

          const analysis = await kgService.analyzeImpact(sanitizedChanges, {
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

        const riskOrder: Record<"critical" | "high" | "medium" | "low", number> = {
          critical: 3,
          high: 2,
          medium: 1,
          low: 0,
        };

        const highestRisk = scenarioResponses.reduce((current, scenario) => {
          if (!current) return scenario;
          return riskOrder[scenario.riskLevel] > riskOrder[current.riskLevel]
            ? scenario
            : current;
        }, scenarioResponses[0]);

        const riskDistribution = scenarioResponses.reduce(
          (acc, scenario) => {
            acc[scenario.riskLevel] += 1;
            return acc;
          },
          { critical: 0, high: 0, medium: 0, low: 0 }
        );

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
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: "SIMULATION_FAILED",
            message: "Failed to simulate change scenarios",
          },
        });
      }
    }
  );

  app.get(
    "/impact/history/:entityId",
    {
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
    },
    async (request, reply) => {
      try {
        const { entityId } = request.params as { entityId: string };
        const { since, limit } = request.query as {
          since?: string;
          limit?: number;
        };

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

        const sanitizedLimit = Math.max(1, Math.min(limit ?? 20, 100));

        const values: any[] = [entityId];
        let whereClause = "type = 'impact_analysis' AND metadata->>'entityId' = $1";

        if (parsedSince) {
          values.push(parsedSince.toISOString());
          whereClause += " AND COALESCE((metadata->>'timestamp')::timestamptz, created_at) >= $2";
        }

        const limitParam = values.length + 1;

        const rows = await dbService.postgresQuery(
          `SELECT id, content, metadata, created_at, updated_at
           FROM documents
           WHERE ${whereClause}
           ORDER BY COALESCE((metadata->>'timestamp')::timestamptz, created_at) DESC
           LIMIT $${limitParam}`,
          [...values, sanitizedLimit]
        );

        const records = (rows.rows ?? []).map((row: any) => {
          const rawContent = row.content;
          const rawMetadata = row.metadata;

          const analysis: ImpactAnalysis =
            typeof rawContent === "string" ? JSON.parse(rawContent) : rawContent;
          const metadata =
            typeof rawMetadata === "string" ? JSON.parse(rawMetadata) : rawMetadata;

          const metrics = summarizeAnalysis(analysis);
          const riskLevel = deriveRiskLevel(analysis);

          return {
            id: row.id,
            timestamp:
              metadata?.timestamp || (row.created_at ? new Date(row.created_at).toISOString() : undefined),
            changeType: metadata?.changeType || "modify",
            directImpactCount:
              metadata?.directImpactCount ?? metrics.directDependents,
            cascadingImpactCount:
              metadata?.cascadingImpactCount ?? metrics.cascadingDependents,
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
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: "IMPACT_HISTORY_FAILED",
            message: "Failed to retrieve impact history",
          },
        });
      }
    }
  );
}

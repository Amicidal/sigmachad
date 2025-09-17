/**
 * Impact Analysis Routes
 * Provides cascading impact analysis for proposed changes.
 */

import { FastifyInstance } from "fastify";
import { KnowledgeGraphService } from "../../services/KnowledgeGraphService.js";
import { DatabaseService } from "../../services/DatabaseService.js";
import { RelationshipType } from "../../models/relationships.js";

type ChangeType = "modify" | "delete" | "rename";

interface ImpactChange {
  entityId: string;
  changeType: ChangeType;
  newName?: string;
  signatureChange?: boolean;
}

interface ImpactEntityRef {
  id: string;
  name: string;
  type: string;
}

interface DirectImpactEntry {
  entities: ImpactEntityRef[];
  severity: "low" | "medium" | "high";
  reason: string;
}

interface CascadingImpactEntry {
  level: number;
  entities: ImpactEntityRef[];
  relationship: string;
  confidence: number;
}

interface TestImpactMetrics {
  affectedTests: ImpactEntityRef[];
  requiredUpdates: string[];
  coverageImpact: number;
}

interface DocumentationImpactMetrics {
  staleDocs: string[];
  requiredUpdates: string[];
}

interface ImpactRecommendation {
  priority: "immediate" | "high" | "medium" | "low";
  description: string;
  effort: "low" | "medium" | "high";
  impact: string;
  type: "warning" | "requirement" | "info" | string;
}

interface ImpactAnalysisResult {
  directImpact: DirectImpactEntry[];
  cascadingImpact: CascadingImpactEntry[];
  testImpact: TestImpactMetrics;
  documentationImpact: DocumentationImpactMetrics;
  recommendations: ImpactRecommendation[];
}

function toEntityRef(id: string, fallbackName?: string, type: string = "entity"): ImpactEntityRef {
  return {
    id,
    name: fallbackName || id,
    type,
  };
}

async function analyzeChangeImpact(
  kgService: KnowledgeGraphService,
  changes: ImpactChange[],
  includeIndirect: boolean,
  maxDepth: number
): Promise<ImpactAnalysisResult> {
  const directImpact: DirectImpactEntry[] = [];
  const cascadingImpact: CascadingImpactEntry[] = [];
  const testImpact: TestImpactMetrics = {
    affectedTests: [],
    requiredUpdates: [],
    coverageImpact: 0,
  };
  const documentationImpact: DocumentationImpactMetrics = {
    staleDocs: [],
    requiredUpdates: [],
  };
  const recommendations: ImpactRecommendation[] = [];

  for (const change of changes) {
    try {
      const entity = await kgService.getEntity(change.entityId);
      if (!entity) {
        continue;
      }

      const directRelationships = await kgService.getRelationships({
        toEntityId: change.entityId,
        limit: 100,
      });

      if (directRelationships.length > 0) {
        const entities = directRelationships.map((rel) =>
          toEntityRef(rel.fromEntityId)
        );

        const severity: DirectImpactEntry["severity"] = change.changeType === "delete"
          ? "high"
          : change.signatureChange
          ? "medium"
          : "low";

        directImpact.push({
          entities,
          severity,
          reason: `${change.changeType} of ${
            (entity as any).name || change.entityId
          } affects ${directRelationships.length} dependent entities`,
        });
      }

      if (includeIndirect) {
        const relationshipTypes: RelationshipType[] = [
          RelationshipType.CALLS,
          RelationshipType.DEPENDS_ON,
          RelationshipType.REFERENCES,
          RelationshipType.IMPLEMENTS,
          RelationshipType.EXTENDS,
        ];

        const forwardRelationships = await kgService.getRelationships({
          toEntityId: change.entityId,
          type: [RelationshipType.IMPLEMENTS, RelationshipType.REFERENCES],
          limit: 100,
        });

        if (forwardRelationships.length > 0) {
          const implementers = forwardRelationships.filter(
            (rel) => rel.type === RelationshipType.IMPLEMENTS
          );
          const references = forwardRelationships.filter(
            (rel) => rel.type === RelationshipType.REFERENCES
          );

          if (implementers.length > 0) {
            cascadingImpact.push({
              level: 1,
              entities: implementers.map((rel) => toEntityRef(rel.fromEntityId)),
              relationship: "implements",
              confidence: 0.95,
            });
          }

          if (references.length > 0) {
            cascadingImpact.push({
              level: 1,
              entities: references.map((rel) => toEntityRef(rel.fromEntityId)),
              relationship: "references",
              confidence: 0.9,
            });
          }
        }

        const paths = await kgService.findPaths({
          startEntityId: change.entityId,
          maxDepth,
          relationshipTypes,
        });

        for (const rawPath of paths) {
          const nodeIds = Array.isArray(rawPath)
            ? rawPath
            : Array.isArray((rawPath as any)?.nodeIds)
            ? (rawPath as any).nodeIds
            : [];

          if (nodeIds.length > 2) {
            const level = Math.max(1, Math.ceil(nodeIds.length / 2));
            const confidence = Math.max(0, 0.8 - level * 0.1);
            const entities = nodeIds.slice(1).map((id) => toEntityRef(id));

            cascadingImpact.push({
              level,
              entities,
              relationship: "indirect_dependency",
              confidence,
            });
          }
        }
      }

      const testRelationships = await kgService.getRelationships({
        toEntityId: change.entityId,
        type: RelationshipType.TESTS,
      });

      if (testRelationships.length > 0) {
        testImpact.affectedTests = testRelationships.map((rel) =>
          toEntityRef(rel.fromEntityId, undefined, "unit")
        );
        testImpact.requiredUpdates = testRelationships.map(
          (rel) =>
            `Update test ${rel.fromEntityId} to reflect changes to ${
              (entity as any).name || entity.id
            }`
        );
        testImpact.coverageImpact = testRelationships.length * 15;
      }

      const entityName = (entity as any).name || entity.id;

      if (change.changeType === "delete") {
        recommendations.push({
          priority: "immediate",
          description: `Consider migration path before deleting ${entityName}`,
          effort: "high",
          impact: "breaking",
          type: "warning",
        });

        if (directRelationships.length > 0) {
          recommendations.push({
            priority: "immediate",
            description: `${directRelationships.length} entities depend on this file/entity`,
            effort: "high",
            impact: "breaking",
            type: "warning",
          });
        }

        if (testImpact.affectedTests.length > 0) {
          recommendations.push({
            priority: "immediate",
            description: `Update or remove ${testImpact.affectedTests.length} tests that depend on this entity`,
            effort: "medium",
            impact: "functional",
            type: "requirement",
          });
        }
      } else if (change.signatureChange) {
        recommendations.push({
          priority: "immediate",
          description: `Update dependent entities to match new signature of ${entityName}`,
          effort: "medium",
          impact: "breaking",
          type: "requirement",
        });
      }
    } catch (error) {
      console.error(`Error analyzing impact for change ${change.entityId}:`, error);
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

export async function registerImpactRoutes(
  app: FastifyInstance,
  kgService: KnowledgeGraphService,
  _dbService: DatabaseService
): Promise<void> {
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
        const params = request.body as {
          changes: ImpactChange[];
          includeIndirect?: boolean;
          maxDepth?: number;
        };

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

        const analysis = await analyzeChangeImpact(
          kgService,
          params.changes,
          params.includeIndirect !== false,
          params.maxDepth && Number.isFinite(params.maxDepth)
            ? Math.max(1, Math.min(10, Math.floor(params.maxDepth)))
            : 5
        );

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

  app.get("/impact/changes", async (_request, reply) => {
    reply.send({ success: true, data: [] });
  });

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
            includeReverse: { type: "boolean", default: false },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { entityId } = request.params as { entityId: string };
        const { changeType } = request.query as { changeType?: ChangeType };

        const impact = {
          entityId,
          changeType: changeType || "modify",
          affectedEntities: [] as ImpactEntityRef[],
          riskLevel: "medium" as const,
          mitigationStrategies: [] as string[],
        };

        reply.send({ success: true, data: impact });
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
    },
    async (request, reply) => {
      try {
        const { scenarios } = request.body as {
          scenarios: Array<{ name: string; changes: ImpactChange[] }>;
        };

        const comparison = {
          scenarios: scenarios.map((scenario) => ({
            name: scenario.name,
            impact: {
              entitiesAffected: 0,
              riskLevel: "medium" as const,
              effort: "medium" as const,
            },
          })),
          recommendations: [] as ImpactRecommendation[],
        };

        reply.send({ success: true, data: comparison });
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
    "/history/:entityId",
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
        const history = {
          entityId,
          impacts: [] as any[],
          summary: {
            totalChanges: 0,
            averageImpact: "medium",
            mostAffected: [] as ImpactEntityRef[],
          },
        };

        reply.send({ success: true, data: history });
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

/**
 * Impact Analysis Service
 * Handles impact analysis, cascade detection, and impact metrics
 */

import { EventEmitter } from "events";
import { Neo4jService } from "../Neo4jService.js";
import { Entity } from "../../../models/entities.js";
import { ImpactAnalysis, ImpactAnalysisRequest } from "../../../models/types.js";
import { RelationshipType } from "../../../models/relationships.js";
import {
  buildImpactQueries,
  buildGdsProjectionQuery,
  buildPageRankQuery,
  buildCycleDetectionQuery,
} from "./queries.js";

export interface ImpactMetrics {
  directImpact: number;
  transitiveImpact: number;
  cascadeDepth: number;
  affectedTests: number;
  affectedSpecs: number;
  affectedDocs: number;
  criticalPaths: number;
  riskScore: number;
}

export interface CascadeInfo {
  depth: number;
  count: number;
  entities: Entity[];
}

export interface CriticalPath {
  path: string[];
  length: number;
}

export class ImpactAnalyzer extends EventEmitter {
  constructor(private neo4j: Neo4jService) {
    super();
  }

  /**
   * Analyze impact of changes
   */
  async analyzeImpact(request: ImpactAnalysisRequest): Promise<ImpactAnalysis> {
    const startTime = Date.now();
    const entityIds = request.changes.map((c) => c.entityId);
    const maxDepth = request.maxDepth || 3;

    // Get impact data in parallel
    const [
      directImpacted,
      transitiveImpacted,
      affectedTests,
      affectedSpecs,
      affectedDocs,
    ] = await Promise.all([
      this.getDirectImpact(entityIds),
      this.getTransitiveImpact(entityIds, maxDepth),
      this.getAffectedTests(entityIds, maxDepth),
      this.getAffectedSpecs(entityIds, maxDepth),
      this.getAffectedDocs(entityIds, maxDepth),
    ]);

    // Calculate metrics
    const metrics = await this.calculateImpactMetrics(
      entityIds,
      transitiveImpacted
    );

    // Build impact analysis result
    const analysis: ImpactAnalysis = {
      directImpact: directImpacted.map((e) => ({
        entities: [e],
        severity: "medium" as const,
        reason: "Direct dependency",
      })),
      cascadingImpact: transitiveImpacted.map((t) => ({
        level: t.depth,
        entities: [t.entity],
        relationship: RelationshipType.DEPENDS_ON,
        confidence: 0.8,
      })),
      testImpact: {
        affectedTests: affectedTests.filter((t) => t.type === "test") as any[], // Cast to Test[]
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
        level: "none" as const,
        reasons: [],
        stats: {
          missingDocs: 0,
          staleDocs: affectedDocs.length,
          freshnessPenalty: affectedDocs.length * 0.1,
        },
      },
      recommendations: [
        {
          priority: "planned" as const,
          description: "Review impact analysis results",
          effort: "medium" as const,
          impact: "functional" as const,
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
  private async getDirectImpact(entityIds: string[]): Promise<Entity[]> {
    const query = buildImpactQueries(entityIds, 3).directImpact;
    const result = await this.neo4j.executeCypher(query, { entityIds });
    return result.map((r) => this.parseEntity(r.impacted));
  }

  /**
   * Get transitive impact entities
   */
  private async getTransitiveImpact(
    entityIds: string[],
    maxDepth: number
  ): Promise<Array<{ entity: Entity; depth: number }>> {
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
  private async getAffectedTests(
    entityIds: string[],
    maxDepth: number
  ): Promise<Entity[]> {
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
  private async getAffectedSpecs(
    entityIds: string[],
    maxDepth: number
  ): Promise<Array<{ entity: Entity; priority: string }>> {
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
  private async getAffectedDocs(
    entityIds: string[],
    maxDepth: number
  ): Promise<Entity[]> {
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
  private async calculateImpactMetrics(
    entityIds: string[],
    impacted: Array<{ entity: Entity; depth: number }>
  ): Promise<ImpactMetrics> {
    // Find critical paths using PageRank
    const allIds = [...entityIds, ...impacted.map((i) => i.entity.id)];
    let criticalPaths = 0;
    let avgCentrality = 0;

    try {
      const nodeQuery =
        "MATCH (n:Entity) WHERE n.id IN $allIds RETURN id(n) AS id";
      const relationshipQuery =
        "MATCH (a)-[r:DEPENDS_ON|CALLS|IMPLEMENTS]->(b) WHERE a.id IN $allIds AND b.id IN $allIds RETURN id(a) AS source, id(b) AS target";

      await this.neo4j.executeCypher(
        buildGdsProjectionQuery("impact_graph", nodeQuery, relationshipQuery),
        { allIds }
      );
      const pageRankResult = await this.neo4j.executeCypher(
        buildPageRankQuery("impact_graph"),
        { allIds }
      );

      criticalPaths = pageRankResult.filter((r: any) => r.score > 0.1).length;
      avgCentrality =
        pageRankResult.reduce((sum: number, r: any) => sum + r.score, 0) /
        pageRankResult.length;
    } catch {
      // GDS might not be available
      criticalPaths = impacted.filter((i) => i.depth === 1).length;
      avgCentrality = 0.5;
    }

    // Calculate risk score
    const riskScore = Math.min(
      1,
      (impacted.length / 100) * 0.3 +
        (criticalPaths / 10) * 0.3 +
        avgCentrality * 0.4
    );

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
  identifyCascades(
    impacted: Array<{ entity: Entity; depth: number }>
  ): CascadeInfo[] {
    const cascades: CascadeInfo[] = [];
    const byDepth = new Map<number, Entity[]>();

    impacted.forEach(({ entity, depth }) => {
      if (!byDepth.has(depth)) {
        byDepth.set(depth, []);
      }
      byDepth.get(depth)!.push(entity);
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
  async findCriticalPaths(
    entityIds: string[],
    maxDepth: number
  ): Promise<CriticalPath[]> {
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
  private parseEntity(node: any): Entity {
    const properties = node.properties || node;
    const entity: any = {};

    for (const [key, value] of Object.entries(properties)) {
      if (value === null || value === undefined) continue;

      if (key === "created" || key === "lastModified" || key.endsWith("At")) {
        entity[key] = new Date(value as string);
      } else if (
        typeof value === "string" &&
        ((value as string).startsWith("[") || (value as string).startsWith("{"))
      ) {
        try {
          entity[key] = JSON.parse(value as string);
        } catch {
          entity[key] = value;
        }
      } else {
        entity[key] = value;
      }
    }

    return entity as Entity;
  }
}

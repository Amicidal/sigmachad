/**
 * Dependency Analysis Service
 * Handles entity dependency analysis, cycle detection, and tree building
 */

import { EventEmitter } from "events";
import { Neo4jService } from "../Neo4jService.js";
import { Entity } from '@memento/core';
import { DependencyAnalysis } from "../../../models/types.js";
import { RelationshipType } from '@memento/core';
import {
  buildDirectRelationshipQuery,
  buildPathExpansionQuery,
  buildBetweennessQuery,
  buildCycleDetectionQuery,
} from "./queries.js";

export interface DependencyMetrics {
  directDependencies: number;
  transitiveDependencies: number;
  depth: number;
  fanIn: number;
  fanOut: number;
  centrality: number;
  cycles: string[][];
}

export interface DependencyTree {
  entity: Entity;
  children: DependencyTree[];
}

export interface CircularDependency {
  cycle: string[];
  severity: "warning" | "error" | "info";
}

export class DependencyAnalyzer extends EventEmitter {
  constructor(private neo4j: Neo4jService) {
    super();
  }

  /**
   * Analyze entity dependencies
   */
  async getEntityDependencies(
    entityId: string,
    options?: { depth?: number; includeTypes?: string[] }
  ): Promise<DependencyAnalysis> {
    const depth = options?.depth || 3;
    const typeFilter = options?.includeTypes || [
      "DEPENDS_ON",
      "IMPORTS",
      "CALLS",
      "TYPE_USES",
    ];

    // Get direct dependencies
    const directDeps = await this.getDirectDependencies(entityId, typeFilter);

    // Get transitive dependencies
    const transitiveDeps = await this.getTransitiveDependencies(
      entityId,
      typeFilter,
      depth
    );

    // Calculate metrics
    const metrics = await this.calculateDependencyMetrics(entityId, depth);

    // Find dependency cycles
    const cycles = await this.detectCycles(entityId, depth);

    return {
      entityId,
      directDependencies: directDeps.map((dep) => ({
        entity: dep.entity,
        relationship: dep.relationshipType as any,
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
        severity: "warning" as const,
      })),
    };
  }

  /**
   * Get direct dependencies
   */
  private async getDirectDependencies(
    entityId: string,
    relationshipTypes: string[]
  ): Promise<Array<{ entity: Entity; relationshipType: string }>> {
    const query = buildDirectRelationshipQuery(
      entityId,
      relationshipTypes,
      "OUTGOING"
    );
    const result = await this.neo4j.executeCypher(query, { entityId });

    return result.map((r) => ({
      entity: this.parseEntity(r.target),
      relationshipType: r.relationshipType,
    }));
  }

  /**
   * Get transitive dependencies
   */
  private async getTransitiveDependencies(
    entityId: string,
    relationshipTypes: string[],
    depth: number
  ): Promise<Array<{ entity: Entity; distance: number; types: string[] }>> {
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

    return result.map((r) => ({
      entity: this.parseEntity(r.endNode),
      distance: r.depth,
      types: r.path
        ? [r.path.relationships[0]?.type || "DEPENDS_ON"]
        : ["DEPENDS_ON"],
    }));
  }

  /**
   * Calculate dependency metrics
   */
  private async calculateDependencyMetrics(
    entityId: string,
    depth: number
  ): Promise<{ fanIn: number; fanOut: number; centrality: number }> {
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

    const results = await Promise.all(
      queries.map((q) => this.neo4j.executeCypher(q.query, { entityId }))
    );

    // Try to calculate centrality with GDS
    let centrality = 0.5;
    try {
      const nodeQuery = "MATCH (n:Entity) RETURN id(n) AS id";
      const relationshipQuery =
        "MATCH (a)-[:DEPENDS_ON|CALLS]->(b) RETURN id(a) AS source, id(b) AS target";
      const centralityQuery = buildBetweennessQuery(
        nodeQuery,
        relationshipQuery
      );

      const centralityResult = await this.neo4j.executeCypher(centralityQuery, {
        entityId,
      });
      const entityCentrality = centralityResult.find(
        (r: any) => r.id === entityId
      );
      centrality = entityCentrality?.score || 0.5;
    } catch {
      // GDS not available, use simple heuristic
      const total = results[0][0].count + results[1][0].count;
      centrality = Math.min(1, total / 20);
    }

    return {
      fanIn: results[0][0]?.count || 0,
      fanOut: results[1][0]?.count || 0,
      centrality,
    };
  }

  /**
   * Detect dependency cycles
   */
  private async detectCycles(
    entityId: string,
    maxDepth: number
  ): Promise<string[][]> {
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
  buildDependencyTree(
    entityId: string,
    dependencies: Array<{ entity: Entity; distance: number }>
  ): DependencyTree {
    const tree: DependencyTree = {
      entity: { id: entityId } as Entity, // Simplified entity for root
      children: [],
    };

    const nodeMap = new Map<string, DependencyTree>();
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
        tree.children.push(nodeMap.get(depId)!);
      });

    return tree;
  }

  /**
   * Find dependency chains (paths from entity to dependencies)
   */
  async findDependencyChains(
    entityId: string,
    targetEntityId: string,
    maxDepth: number = 5
  ): Promise<Array<{ path: string[]; length: number }>> {
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
  async getReverseDependencies(
    entityId: string,
    depth: number = 3
  ): Promise<
    Array<{ entity: Entity; relationship: string; distance: number }>
  > {
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

    return result.map((r) => ({
      entity: this.parseEntity(r.endNode),
      relationship: r.path?.relationships?.[0]?.type || "DEPENDS_ON",
      distance: r.depth,
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

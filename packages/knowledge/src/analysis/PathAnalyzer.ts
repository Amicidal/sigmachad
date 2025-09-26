/**
 * Path Analysis Service
 * Handles path finding and graph traversal algorithms
 */

import { EventEmitter } from "events";
import { Neo4jService } from "../Neo4jService.js";
import { Entity } from '@memento/core';
import { PathQuery } from '@memento/core';
import { buildDijkstraQuery } from "./queries.js";

export interface PathResult {
  paths: Array<{
    nodes: Entity[];
    relationships: any[];
    length: number;
    weight: number;
  }>;
  shortestLength: number;
  totalPaths: number;
}

export interface CriticalPathResult {
  path: string[];
  criticality: number;
  bottleneckNodes: string[];
}

export class PathAnalyzer extends EventEmitter {
  constructor(private neo4j: Neo4jService) {
    super();
  }

  /**
   * Find shortest paths between entities
   */
  async findPaths(query: PathQuery): Promise<PathResult> {
    const algorithmQuery = buildDijkstraQuery(
      query.relationshipTypes || ["DEPENDS_ON", "CALLS", "REFERENCES"],
      "weight",
      1
    );

    const result = await this.neo4j.executeCypher(algorithmQuery, {
      fromId: query.startEntityId,
      toId: query.endEntityId,
      limit: query.maxPaths || 5,
    });

    const paths = result.map((r) => ({
      nodes: r.path.nodes.map((n: any) => this.parseEntity(n)),
      relationships: r.path.relationships,
      length: r.path.length,
      weight: r.weight,
    }));

    return {
      paths,
      shortestLength: paths[0]?.length || 0,
      totalPaths: paths.length,
    };
  }

  /**
   * Find all paths between entities (up to a limit)
   */
  async findAllPaths(
    startEntityId: string,
    endEntityId: string,
    options?: {
      maxDepth?: number;
      maxPaths?: number;
      relationshipTypes?: string[];
    }
  ): Promise<PathResult> {
    const maxDepth = options?.maxDepth || 5;
    const maxPaths = options?.maxPaths || 10;
    const relTypes = options?.relationshipTypes || [
      "DEPENDS_ON",
      "CALLS",
      "REFERENCES",
    ];
    const relFilter = relTypes.join("|");

    const query = `
      MATCH path = (start:Entity {id: $startId})-[rels:${relFilter}*1..${maxDepth}]->(end:Entity {id: $endId})
      RETURN path, length(path) AS length, size(rels) AS weight
      ORDER BY length
      LIMIT ${maxPaths}
    `;

    const result = await this.neo4j.executeCypher(query, {
      startId: startEntityId,
      endId: endEntityId,
    });

    const paths = result.map((r) => ({
      nodes: r.path.nodes.map((n: any) => this.parseEntity(n)),
      relationships: r.path.relationships,
      length: r.length,
      weight: r.weight,
    }));

    return {
      paths,
      shortestLength: paths[0]?.length || 0,
      totalPaths: paths.length,
    };
  }

  /**
   * Find critical paths in the dependency graph
   */
  async findCriticalPaths(
    startEntityIds: string[],
    targetTypes: string[] = [
      "api_endpoint",
      "main_function",
      "critical_service",
    ],
    maxDepth: number = 5
  ): Promise<CriticalPathResult[]> {
    const query = `
      UNWIND $startEntityIds AS entityId
      MATCH (e:Entity {id: entityId})
      MATCH path = (e)-[:CALLS|DEPENDS_ON*1..$maxDepth]->(critical)
      WHERE critical.type IN $targetTypes
      WITH path, length(path) AS pathLength, critical
      ORDER BY pathLength
      LIMIT 20
      RETURN [n IN nodes(path) | n.id] AS path, pathLength, critical.importance AS criticality
    `;

    const result = await this.neo4j.executeCypher(query, {
      startEntityIds,
      targetTypes,
      maxDepth,
    });

    return result.map((r) => ({
      path: r.path,
      criticality: r.criticality || 1,
      bottleneckNodes: [], // Could be calculated separately
    }));
  }

  /**
   * Analyze path characteristics
   */
  async analyzePathCharacteristics(
    startEntityId: string,
    endEntityId: string
  ): Promise<{
    averagePathLength: number;
    minPathLength: number;
    maxPathLength: number;
    totalPaths: number;
    pathDiversity: number;
  }> {
    const query = `
      MATCH paths = (start:Entity {id: $startId})-[*1..10]->(end:Entity {id: $endId})
      WITH paths, length(paths) AS pathLength
      RETURN
        avg(pathLength) AS averagePathLength,
        min(pathLength) AS minPathLength,
        max(pathLength) AS maxPathLength,
        count(paths) AS totalPaths
    `;

    const result = await this.neo4j.executeCypher(query, {
      startId: startEntityId,
      endId: endEntityId,
    });

    const stats = result[0] || {
      averagePathLength: 0,
      minPathLength: 0,
      maxPathLength: 0,
      totalPaths: 0,
    };

    // Calculate path diversity (unique nodes / total nodes across all paths)
    const diversityQuery = `
      MATCH paths = (start:Entity {id: $startId})-[*1..10]->(end:Entity {id: $endId})
      UNWIND nodes(paths) AS node
      WITH DISTINCT node.id AS uniqueNode
      MATCH paths2 = (start:Entity {id: $startId})-[*1..10]->(end:Entity {id: $endId})
      UNWIND nodes(paths2) AS node2
      RETURN toFloat(count(DISTINCT node.id)) / count(node2.id) AS pathDiversity
    `;

    let pathDiversity = 0;
    try {
      const diversityResult = await this.neo4j.executeCypher(diversityQuery, {
        startId: startEntityId,
        endId: endEntityId,
      });
      pathDiversity = diversityResult[0]?.pathDiversity || 0;
    } catch {
      // Diversity calculation failed
      pathDiversity = 0;
    }

    return {
      ...stats,
      pathDiversity,
    };
  }

  /**
   * Find bottleneck nodes in paths
   */
  async findBottleneckNodes(
    entityIds: string[],
    threshold: number = 10
  ): Promise<Array<{ nodeId: string; pathCount: number; centrality: number }>> {
    const query = `
      UNWIND $entityIds AS entityId
      MATCH (start:Entity {id: entityId})
      MATCH paths = (start)-[*1..5]->()
      UNWIND nodes(paths)[1..-1] AS intermediate
      WITH intermediate.id AS nodeId, count(*) AS pathCount
      WHERE pathCount >= $threshold
      RETURN nodeId, pathCount
      ORDER BY pathCount DESC
      LIMIT 20
    `;

    const result = await this.neo4j.executeCypher(query, {
      entityIds,
      threshold,
    });

    // Could enhance with centrality calculation
    return result.map((r) => ({
      nodeId: r.nodeId,
      pathCount: r.pathCount,
      centrality: 0, // Placeholder for centrality calculation
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

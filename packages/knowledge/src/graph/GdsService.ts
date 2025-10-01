// security: avoid dynamic object indexing; map discriminated unions via switch
/**
 * Graph Data Science Service
 * Handles GDS algorithms, path expansion, and graph analytics
 */

import { EventEmitter } from "events";
import { CypherExecutor } from "./CypherExecutor.js";

export interface GdsAlgorithmConfig {
  nodeProjection?: string;
  relationshipProjection?: string;
  writeProperty?: string;
  maxIterations?: number;
  dampingFactor?: number;
  similarityCutoff?: number;
  topK?: number;
  topN?: number;
  // Additional creation helpers used by graph.create
  nodeQuery?: string;
  relationshipQuery?: string;
}

export interface PathExpandConfig {
  startNode: string;
  relationshipFilter?: string;
  labelFilter?: string;
  minLevel?: number;
  maxLevel?: number;
  limit?: number;
}

export class GdsService extends EventEmitter {
  constructor(private executor: CypherExecutor) {
    super();
  }

  /**
   * Run a GDS algorithm
   */
  async runGdsAlgorithm(
    algorithm: string,
    config: GdsAlgorithmConfig,
    parameters: Record<string, any> = {}
  ): Promise<any> {
    const procedureName = `gds.${algorithm}`;

    try {
      const result = await this.executor.callApoc(procedureName, {
        ...config,
        ...parameters,
      });

      this.emit("algorithm:completed", {
        algorithm,
        config,
        resultCount: Array.isArray(result) ? result.length : 1,
      });

      return result;
    } catch (error) {
      this.emit("algorithm:error", { algorithm, config, error });
      throw error;
    }
  }

  /**
   * Run PageRank algorithm
   */
  async runPageRank(
    config: {
      maxIterations?: number;
      dampingFactor?: number;
      writeProperty?: string;
    } = {}
  ): Promise<any> {
    return this.runGdsAlgorithm("pageRank", {
      nodeProjection: "*",
      relationshipProjection: "*",
      writeProperty: "pageRank",
      maxIterations: 20,
      dampingFactor: 0.85,
      ...config,
    });
  }

  /**
   * Run community detection (Louvain)
   */
  async runCommunityDetection(
    config: {
      maxIterations?: number;
      writeProperty?: string;
    } = {}
  ): Promise<any> {
    return this.runGdsAlgorithm("louvain", {
      nodeProjection: "*",
      relationshipProjection: "*",
      writeProperty: "community",
      maxIterations: 10,
      ...config,
    });
  }

  /**
   * Run node similarity algorithm
   */
  async runNodeSimilarity(
    config: {
      similarityCutoff?: number;
      topK?: number;
      writeProperty?: string;
    } = {}
  ): Promise<any> {
    return this.runGdsAlgorithm("nodeSimilarity", {
      nodeProjection: "*",
      relationshipProjection: "*",
      writeProperty: "similarity",
      similarityCutoff: 0.1,
      topK: 10,
      ...config,
    });
  }

  /**
   * Expand paths from a starting node using APOC
   */
  async apocPathExpand(config: PathExpandConfig): Promise<any[]> {
    const {
      startNode,
      relationshipFilter = "RELATIONSHIP_GLOBAL",
      labelFilter = "",
      minLevel = 1,
      maxLevel = 3,
      limit = 100,
    } = config;

    try {
      const result = await this.executor.callApoc("apoc.path.expand", {
        startNode,
        relationshipFilter,
        labelFilter,
        minLevel,
        maxLevel,
        limit,
      });

      this.emit("pathExpansion:completed", {
        startNode,
        resultCount: result.length,
        maxLevel,
      });

      return result;
    } catch (error) {
      this.emit("pathExpansion:error", { config, error });
      throw error;
    }
  }

  /**
   * Find shortest paths between nodes
   */
  async findShortestPaths(
    startNodeId: string,
    endNodeId: string,
    config: {
      maxDepth?: number;
      relationshipTypes?: string[];
      algorithm?: "dijkstra" | "astar";
    } = {}
  ): Promise<any[]> {
    const {
      maxDepth = 10,
      relationshipTypes = [],
      algorithm = "dijkstra",
    } = config;

    const relationshipFilter =
      relationshipTypes.length > 0 ? relationshipTypes.join("|") : "*";

    const query = `
      MATCH (start:Entity {id: $startNodeId}), (end:Entity {id: $endNodeId})
      CALL apoc.algo.${algorithm}(start, end, $relationshipFilter, $maxDepth)
      YIELD path, weight
      RETURN path, weight
      ORDER BY weight ASC
      LIMIT 10
    `;

    try {
      const result = await this.executor.executeCypher(query, {
        startNodeId,
        endNodeId,
        relationshipFilter,
        maxDepth,
      });

      this.emit("shortestPath:found", {
        startNodeId,
        endNodeId,
        pathCount: result.length,
      });

      return result;
    } catch (error) {
      this.emit("shortestPath:error", {
        startNodeId,
        endNodeId,
        config,
        error,
      });
      throw error;
    }
  }

  /**
   * Calculate centrality measures
   */
  async calculateCentrality(
    algorithm: "degree" | "betweenness" | "closeness" = "degree"
  ): Promise<any> {
    const algo =
      algorithm === "degree"
        ? "degree"
        : algorithm === "betweenness"
        ? "betweenness"
        : "closeness";

    return this.runGdsAlgorithm(algo, {
      nodeProjection: "*",
      relationshipProjection: "*",
      writeProperty: `${algorithm}Centrality`,
    });
  }

  /**
   * Find strongly connected components
   */
  async findStronglyConnectedComponents(): Promise<any> {
    return this.runGdsAlgorithm("scc", {
      nodeProjection: "*",
      relationshipProjection: "*",
      writeProperty: "componentId",
    });
  }

  /**
   * Run triangle count algorithm
   */
  async runTriangleCount(): Promise<any> {
    return this.runGdsAlgorithm("triangleCount", {
      nodeProjection: "*",
      relationshipProjection: "*",
      writeProperty: "triangleCount",
    });
  }

  /**
   * Get graph statistics and metrics
   */
  async getGraphMetrics(): Promise<{
    nodeCount: number;
    relationshipCount: number;
    averageDegree: number;
    density: number;
    components: number;
    triangles: number;
  }> {
    const queries = [
      "MATCH (n) RETURN count(n) as nodeCount",
      "MATCH ()-[r]->() RETURN count(r) as relationshipCount",
      "MATCH (n) OPTIONAL MATCH (n)-[r]-() RETURN avg(size(collect(DISTINCT r))) as averageDegree",
      "MATCH (n) OPTIONAL MATCH (n)-[r]-() RETURN count(DISTINCT n) as nodesWithRelationships",
      "CALL gds.graph.list() YIELD graphName RETURN count(graphName) as namedGraphs",
    ];

    try {
      const results = await Promise.all(
        queries.map((query) =>
          this.executor.executeCypher(query).catch(() => [{}])
        )
      );

      const [nodeResult, relResult, degreeResult] = results;
      const nodeCount = nodeResult[0]?.nodeCount || 0;
      const relationshipCount = relResult[0]?.relationshipCount || 0;
      const averageDegree = degreeResult[0]?.averageDegree || 0;

      // Calculate density (relationships / (nodes * (nodes - 1)))
      const density =
        nodeCount > 1
          ? (relationshipCount * 2) / (nodeCount * (nodeCount - 1))
          : 0;

      return {
        nodeCount,
        relationshipCount,
        averageDegree,
        density,
        components: 0, // Would need additional query
        triangles: 0, // Would need triangle count to be run first
      };
    } catch (error) {
      console.warn("Failed to get graph metrics:", error);
      return {
        nodeCount: 0,
        relationshipCount: 0,
        averageDegree: 0,
        density: 0,
        components: 0,
        triangles: 0,
      };
    }
  }

  /**
   * Create a named graph for GDS operations
   */
  async createNamedGraph(
    graphName: string,
    nodeQuery = "MATCH (n) RETURN id(n) as id",
    relationshipQuery = "MATCH (n)-[r]->(m) RETURN id(n) as source, id(r) as id, id(m) as target"
  ): Promise<void> {
    await this.runGdsAlgorithm(
      "graph.create",
      {
        nodeQuery,
        relationshipQuery,
      },
      {
        graphName,
      }
    );

    this.emit("namedGraph:created", { graphName });
  }

  /**
   * Drop a named graph
   */
  async dropNamedGraph(graphName: string): Promise<void> {
    await this.runGdsAlgorithm("graph.drop", {}, { graphName });
    this.emit("namedGraph:dropped", { graphName });
  }

  /**
   * List available named graphs
   */
  async listNamedGraphs(): Promise<string[]> {
    try {
      const result = await this.runGdsAlgorithm("graph.list", {});
      return result.map((graph: any) => graph.graphName);
    } catch (error) {
      console.warn("Failed to list named graphs:", error);
      return [];
    }
  }
}

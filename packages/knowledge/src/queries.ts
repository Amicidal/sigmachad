/**
 * Shared Cypher query utilities for analysis operations
 */

import { RelationshipType } from "../../../models/relationships.js";

export interface TraversalOptions {
  startNodeId: string;
  relationshipTypes: string[];
  maxDepth: number;
  direction?: "OUTGOING" | "INCOMING" | "BOTH";
  nodeFilter?: string;
}

export interface PathExpansionOptions extends TraversalOptions {
  uniqueness?: "NODE_GLOBAL" | "RELATIONSHIP_GLOBAL";
}

/**
 * Build APOC path expansion query
 */
export function buildPathExpansionQuery(options: PathExpansionOptions): string {
  const {
    startNodeId,
    relationshipTypes,
    maxDepth,
    direction = "OUTGOING",
    nodeFilter,
    uniqueness = "NODE_GLOBAL",
  } = options;

  const relFilter =
    relationshipTypes.length > 0
      ? relationshipTypes.join("|")
      : "DEPENDS_ON|CALLS|REFERENCES|IMPLEMENTS|EXTENDS|TYPE_USES";

  let query = `
    MATCH (start:Entity {id: $startNodeId})
    CALL apoc.path.expand(
      start,
      "${relFilter}",
      ${nodeFilter ? `"${nodeFilter}"` : "null"},
      1,
      $maxDepth,
      "${uniqueness}"
    ) YIELD path
    RETURN path, last(nodes(path)) AS endNode, length(path) AS depth
  `;

  return query;
}

/**
 * Build direct relationship query
 */
export function buildDirectRelationshipQuery(
  entityId: string,
  relationshipTypes: string[],
  direction: "OUTGOING" | "INCOMING" = "OUTGOING"
): string {
  const relFilter = relationshipTypes.join("|");
  const arrow = direction === "OUTGOING" ? "->" : "<-";

  return `
    MATCH (e:Entity {id: $entityId})-[r:${relFilter}]${arrow}(target)
    RETURN target, type(r) AS relationshipType
  `;
}

/**
 * Build GDS graph projection query
 */
export function buildGdsProjectionQuery(
  graphName: string,
  nodeQuery: string,
  relationshipQuery: string
): string {
  return `
    CALL gds.graph.project.cypher(
      '${graphName}',
      '${nodeQuery}',
      '${relationshipQuery}'
    ) YIELD graphName
    RETURN graphName
  `;
}

/**
 * Build PageRank analysis query
 */
export function buildPageRankQuery(graphName: string, limit = 10): string {
  return `
    CALL gds.pageRank.stream('${graphName}')
    YIELD nodeId, score
    WITH gds.util.asNode(nodeId) AS node, score
    RETURN node.id AS id, score
    ORDER BY score DESC
    LIMIT ${limit}
  `;
}

/**
 * Build betweenness centrality query
 */
export function buildBetweennessQuery(
  nodeQuery: string,
  relationshipQuery: string
): string {
  return `
    CALL gds.betweenness.stream({
      nodeQuery: '${nodeQuery}',
      relationshipQuery: '${relationshipQuery}'
    })
    YIELD nodeId, score
    WITH gds.util.asNode(nodeId) AS node, score
    RETURN node.id AS id, score
  `;
}

/**
 * Build Dijkstra shortest path query
 */
export function buildDijkstraQuery(
  relationshipTypes: string[],
  weightProperty = "weight",
  defaultWeight = 1
): string {
  const relTypes = relationshipTypes.join("|");

  return `
    MATCH (from:Entity {id: $fromId}), (to:Entity {id: $toId})
    CALL apoc.algo.dijkstra(
      from,
      to,
      "${relTypes}",
      "${weightProperty}",
      ${defaultWeight}
    ) YIELD path, weight
    RETURN path, weight
    ORDER BY weight
    LIMIT $limit
  `;
}

/**
 * Build cycle detection query
 */
export function buildCycleDetectionQuery(maxDepth: number): string {
  return `
    MATCH (start:Entity {id: $entityId})
    MATCH path = (start)-[:DEPENDS_ON|IMPORTS*1..${maxDepth}]->(start)
    RETURN [n IN nodes(path) | n.id] AS cycle
    LIMIT 5
  `;
}

/**
 * Build entity statistics queries
 */
export function buildEntityStatsQueries(entityId: string) {
  return {
    byType: `
      MATCH (e:Entity {id: $entityId})-[r]->()
      RETURN type(r) AS type, count(r) AS count
      ORDER BY count DESC
    `,
    topSymbols: `
      MATCH (e:Entity {id: $entityId})-[r]->()
      WHERE r.to_ref_symbol IS NOT NULL
      RETURN r.to_ref_symbol AS symbol, count(*) AS count
      ORDER BY count DESC
      LIMIT 10
    `,
    inbound: `
      MATCH (e:Entity {id: $entityId})<-[r]-()
      RETURN count(r) AS count
    `,
    outbound: `
      MATCH (e:Entity {id: $entityId})-[r]->()
      RETURN count(r) AS count
    `,
  };
}

/**
 * Build impact analysis queries
 */
export function buildImpactQueries(entityIds: string[], maxDepth: number) {
  return {
    directImpact: `
      UNWIND $entityIds AS entityId
      MATCH (e:Entity {id: entityId})-[r:CALLS|REFERENCES|DEPENDS_ON|IMPLEMENTS|EXTENDS]->(impacted)
      RETURN DISTINCT impacted
    `,
    transitiveImpact: `
      UNWIND $entityIds AS entityId
      MATCH (e:Entity {id: entityId})
      CALL apoc.path.expand(
        e,
        'CALLS|REFERENCES|DEPENDS_ON|IMPLEMENTS|EXTENDS|OVERRIDES|TYPE_USES',
        null,
        1,
        $maxDepth,
        'RELATIONSHIP_GLOBAL'
      ) YIELD path
      WITH last(nodes(path)) AS impacted, length(path) AS depth
      RETURN DISTINCT impacted, min(depth) AS minDepth
    `,
    affectedTests: `
      UNWIND $entityIds AS entityId
      MATCH (e:Entity {id: entityId})<-[:TESTS|VALIDATES*1..$maxDepth]-(test:Test)
      RETURN DISTINCT test
    `,
    affectedSpecs: `
      UNWIND $entityIds AS entityId
      MATCH (e:Entity {id: entityId})<-[:IMPLEMENTS_SPEC|REQUIRES*1..$maxDepth]-(spec:Specification)
      RETURN DISTINCT spec, spec.priority AS priority
    `,
    affectedDocs: `
      UNWIND $entityIds AS entityId
      MATCH (e:Entity {id: entityId})-[:DOCUMENTED_BY|DOCUMENTS_SECTION*1..$maxDepth]-(doc)
      WHERE doc.type = 'documentation'
      RETURN DISTINCT doc
    `,
  };
}

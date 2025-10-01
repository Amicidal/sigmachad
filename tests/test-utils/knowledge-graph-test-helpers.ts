import { EventEmitter } from "events";
import { vi } from "vitest";

import { KnowledgeGraphService } from "@memento/knowledge/orchestration/KnowledgeGraphService";
import type { Neo4jConfig } from "@memento/knowledge/graph/Neo4jService";
import type { Entity, GraphRelationship, DependencyAnalysis, ImpactAnalysis } from "@memento/shared-types";

class Neo4jServiceStub extends EventEmitter {
  createCommonIndexes = vi.fn().mockResolvedValue(undefined);
  ensureGraphIndexes = vi.fn().mockResolvedValue(undefined);
  executeCypher = vi.fn();
  runBenchmarks = vi.fn();
  getStats = vi.fn();
  getIndexHealth = vi.fn();
  close = vi.fn().mockResolvedValue(undefined);
}

class NeogmaServiceStub {
  close = vi.fn().mockResolvedValue(undefined);
}

class EntityServiceStub extends EventEmitter {
  createEntity = vi.fn();
  updateEntity = vi.fn();
  getEntity = vi.fn();
  deleteEntity = vi.fn();
  listEntities = vi.fn().mockResolvedValue({ items: [], total: 0 });
  createEntitiesBulk = vi
    .fn()
    .mockResolvedValue({ created: 0, updated: 0, failed: 0 });
  getEntitiesByType = vi.fn().mockResolvedValue([]);
  getEntitiesByFile = vi.fn().mockResolvedValue([]);
  getEntityStats = vi.fn().mockResolvedValue({ total: 0 });
}

class RelationshipServiceStub extends EventEmitter {
  createRelationship = vi.fn();
  createRelationshipsBulk = vi.fn();
  getRelationships = vi.fn().mockResolvedValue([] as GraphRelationship[]);
  deleteRelationship = vi.fn().mockResolvedValue(undefined);
  upsertEdgeEvidenceBulk = vi.fn().mockResolvedValue(undefined);
  getRelationshipStats = vi.fn().mockResolvedValue({ total: 0 });
  mergeNormalizedDuplicates = vi.fn().mockResolvedValue(0);
  markInactiveEdgesNotSeenSince = vi.fn().mockResolvedValue(0);
  getRelationshipById = vi.fn().mockResolvedValue(null);
  getEdgeEvidenceNodes = vi.fn().mockResolvedValue([]);
  getEdgeSites = vi.fn().mockResolvedValue([]);
  getEdgeCandidates = vi.fn().mockResolvedValue([]);
}

class EmbeddingServiceStub extends EventEmitter {
  initializeVectorIndex = vi.fn().mockResolvedValue(undefined);
  generateAndStore = vi.fn().mockResolvedValue(undefined);
  batchEmbed = vi.fn().mockResolvedValue(undefined);
  updateEmbedding = vi.fn().mockResolvedValue(undefined);
  deleteEmbedding = vi.fn().mockResolvedValue(undefined);
  findSimilar = vi.fn().mockResolvedValue([]);
  getEmbeddingStats = vi.fn().mockResolvedValue({ total: 0 });
}

class SearchServiceStub extends EventEmitter {
  search = vi.fn().mockResolvedValue([] as Array<{ entity: Entity }>);
  semanticSearch = vi.fn().mockResolvedValue([]);
  structuralSearch = vi.fn().mockResolvedValue([]);
  findSymbolsByName = vi.fn().mockResolvedValue([]);
  getEntityExamples = vi.fn().mockResolvedValue([]);
  clearCache = vi.fn();
  invalidateCache = vi.fn();
}

class HistoryServiceStub extends EventEmitter {
  appendVersion = vi.fn().mockResolvedValue("");
  createCheckpoint = vi.fn().mockResolvedValue({ checkpointId: "chk_test" });
  pruneHistory = vi.fn().mockResolvedValue(undefined);
  listCheckpoints = vi.fn().mockResolvedValue([]);
  getHistoryMetrics = vi.fn().mockResolvedValue({ sessions: 0 });
  timeTravelTraversal = vi.fn().mockResolvedValue([]);
  exportCheckpoint = vi.fn().mockResolvedValue({});
  importCheckpoint = vi
    .fn()
    .mockResolvedValue({ checkpointId: "chk_imported" });
  getCheckpoint = vi.fn().mockResolvedValue(null);
  getCheckpointMembers = vi.fn().mockResolvedValue([]);
  getCheckpointSummary = vi.fn().mockResolvedValue({});
  deleteCheckpoint = vi.fn().mockResolvedValue(undefined);
  getEntityTimeline = vi.fn().mockResolvedValue([]);
  getRelationshipTimeline = vi.fn().mockResolvedValue([]);
  getSessionTimeline = vi.fn().mockResolvedValue([]);
  getSessionImpacts = vi.fn().mockResolvedValue([]);
  getSessionsAffectingEntity = vi.fn().mockResolvedValue([]);
  getChangesForSession = vi.fn().mockResolvedValue([]);
  openEdge = vi.fn().mockResolvedValue(undefined);
  closeEdge = vi.fn().mockResolvedValue(undefined);
}

class AnalysisServiceStub extends EventEmitter {
  analyzeImpact = vi.fn().mockResolvedValue({} as ImpactAnalysis);
  getEntityDependencies = vi.fn().mockResolvedValue({} as DependencyAnalysis);
  findPaths = vi.fn().mockResolvedValue([]);
  computeAndStoreEdgeStats = vi.fn().mockResolvedValue(undefined);
}

export function createStubDependencies() {
  const neo4j = new Neo4jServiceStub();
  const neogma = new NeogmaServiceStub();
  const entityService = new EntityServiceStub();
  const relationshipService = new RelationshipServiceStub();
  const embeddingService = new EmbeddingServiceStub();
  const searchService = new SearchServiceStub();
  const historyService = new HistoryServiceStub();
  const analysisService = new AnalysisServiceStub();

  return {
    neo4j,
    neogma,
    entityService,
    relationshipService,
    embeddingService,
    searchService,
    historyService,
    analysisService,
  };
}

export function createKnowledgeGraphTestHarness(config?: Partial<Neo4jConfig>) {
  const deps = createStubDependencies();
  const baseConfig: Neo4jConfig = {
    uri: config?.uri ?? "bolt://localhost:7687",
    username: config?.username ?? "neo4j",
    password: config?.password ?? "password",
    database: config?.database ?? "neo4j",
    maxConnectionPoolSize: config?.maxConnectionPoolSize,
  };

  const service = new KnowledgeGraphService(baseConfig, deps);

  return { service, deps };
}

export type KnowledgeGraphTestDependencies = ReturnType<
  typeof createStubDependencies
>;

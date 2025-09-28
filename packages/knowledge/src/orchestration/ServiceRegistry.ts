/**
 * Service Registry
 * Manages dependency injection and service wiring for the Knowledge Graph
 */

import { Neo4jService, Neo4jConfig } from '../graph/Neo4jService';
import { NeogmaService } from '../graph/NeogmaService';
import { EntityServiceOGM } from '../graph/EntityServiceOGM';
import { RelationshipServiceOGM } from '../graph/RelationshipServiceOGM';
import { SearchServiceOGM } from '../graph/SearchServiceOGM';
import { EmbeddingService } from '../embeddings/EmbeddingService';
import { HistoryService } from '../graph/HistoryService';
import { AnalysisService } from '../analysis/AnalysisService';

interface KnowledgeGraphDependencies {
  neo4j?: Neo4jService;
  neogma?: NeogmaService;
  entityService?: EntityServiceOGM;
  relationshipService?: RelationshipServiceOGM;
  searchService?: SearchServiceOGM;
  embeddingService?: EmbeddingService;
  historyService?: HistoryService;
  analysisService?: AnalysisService;
}

export class ServiceRegistry {
  private neo4j!: Neo4jService;
  private neogma!: NeogmaService;
  private entities!: EntityServiceOGM;
  private relationships!: RelationshipServiceOGM;
  private embeddings!: EmbeddingService;
  private searchServiceOGM!: SearchServiceOGM;
  private history!: HistoryService;
  private analysis!: AnalysisService;

  constructor(
    config?: Neo4jConfig,
    overrides: KnowledgeGraphDependencies = {}
  ) {
    this.initializeServices(config, overrides);
  }

  private initializeServices(
    config?: Neo4jConfig,
    overrides: KnowledgeGraphDependencies = {}
  ): void {
    const neo4jConfig: Neo4jConfig = {
      uri: config?.uri || process.env.NEO4J_URI || 'bolt://localhost:7687',
      username: config?.username || process.env.NEO4J_USERNAME || 'neo4j',
      password: config?.password || process.env.NEO4J_PASSWORD || 'password',
      database: config?.database || process.env.NEO4J_DATABASE || 'neo4j',
      maxConnectionPoolSize: config?.maxConnectionPoolSize,
    };

    // Initialize services with OGM implementations only
    this.neo4j = overrides.neo4j ?? new Neo4jService(neo4jConfig);
    this.neogma = overrides.neogma ?? new NeogmaService(neo4jConfig);
    this.entities =
      overrides.entityService ?? new EntityServiceOGM(this.neogma);
    this.relationships =
      overrides.relationshipService ?? new RelationshipServiceOGM(this.neogma);
    this.embeddings =
      overrides.embeddingService ?? new EmbeddingService(this.neo4j);
    this.searchServiceOGM =
      overrides.searchService ??
      new SearchServiceOGM(this.neogma, this.embeddings);
    this.history = overrides.historyService ?? new HistoryService(this.neo4j);
    this.analysis =
      overrides.analysisService ?? new AnalysisService(this.neo4j);

    console.log('[ServiceRegistry] Initialized with OGM services only');
  }

  // Getters for all services
  get neo4jService(): Neo4jService {
    return this.neo4j;
  }

  get neogmaService(): NeogmaService {
    return this.neogma;
  }

  get entityService(): EntityServiceOGM {
    return this.entities;
  }

  get relationshipService(): RelationshipServiceOGM {
    return this.relationships;
  }

  get embeddingService(): EmbeddingService {
    return this.embeddings;
  }

  get searchService(): SearchServiceOGM {
    return this.searchServiceOGM;
  }

  get historyService(): HistoryService {
    return this.history;
  }

  get analysisService(): AnalysisService {
    return this.analysis;
  }

  /**
   * Close all services
   */
  async close(): Promise<void> {
    await this.neo4j.close();
    if (typeof this.neogma.close === 'function') {
      await this.neogma.close();
    }
  }
}

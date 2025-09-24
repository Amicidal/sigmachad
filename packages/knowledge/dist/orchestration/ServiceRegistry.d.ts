/**
 * Service Registry
 * Manages dependency injection and service wiring for the Knowledge Graph
 */
import { Neo4jService, Neo4jConfig } from "../Neo4jService.js";
import { NeogmaService } from "../ogm/NeogmaService.js";
import { EntityServiceOGM } from "../ogm/EntityServiceOGM.js";
import { RelationshipServiceOGM } from "../ogm/RelationshipServiceOGM.js";
import { SearchServiceOGM } from "../ogm/SearchServiceOGM.js";
import { EmbeddingService } from "../EmbeddingService.js";
import { HistoryService } from "../HistoryService.js";
import { AnalysisService } from "../AnalysisService.js";
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
export declare class ServiceRegistry {
    private neo4j;
    private neogma;
    private entities;
    private relationships;
    private embeddings;
    private searchServiceOGM;
    private history;
    private analysis;
    constructor(config?: Neo4jConfig, overrides?: KnowledgeGraphDependencies);
    private initializeServices;
    get neo4jService(): Neo4jService;
    get neogmaService(): NeogmaService;
    get entityService(): EntityServiceOGM;
    get relationshipService(): RelationshipServiceOGM;
    get embeddingService(): EmbeddingService;
    get searchService(): SearchServiceOGM;
    get historyService(): HistoryService;
    get analysisService(): AnalysisService;
    /**
     * Close all services
     */
    close(): Promise<void>;
}
export {};
//# sourceMappingURL=ServiceRegistry.d.ts.map
/**
 * Service Registry
 * Manages dependency injection and service wiring for the Knowledge Graph
 */
import { Neo4jService } from "../Neo4jService.js";
import { NeogmaService } from "../ogm/NeogmaService.js";
import { EntityServiceOGM } from "../ogm/EntityServiceOGM.js";
import { RelationshipServiceOGM } from "../ogm/RelationshipServiceOGM.js";
import { SearchServiceOGM } from "../ogm/SearchServiceOGM.js";
import { EmbeddingService } from "../EmbeddingService.js";
import { HistoryService } from "../HistoryService.js";
import { AnalysisService } from "../AnalysisService.js";
export class ServiceRegistry {
    constructor(config, overrides = {}) {
        this.initializeServices(config, overrides);
    }
    initializeServices(config, overrides = {}) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const neo4jConfig = {
            uri: (config === null || config === void 0 ? void 0 : config.uri) || process.env.NEO4J_URI || "bolt://localhost:7687",
            username: (config === null || config === void 0 ? void 0 : config.username) || process.env.NEO4J_USERNAME || "neo4j",
            password: (config === null || config === void 0 ? void 0 : config.password) || process.env.NEO4J_PASSWORD || "password",
            database: (config === null || config === void 0 ? void 0 : config.database) || process.env.NEO4J_DATABASE || "neo4j",
            maxConnectionPoolSize: config === null || config === void 0 ? void 0 : config.maxConnectionPoolSize,
        };
        // Initialize services with OGM implementations only
        this.neo4j = (_a = overrides.neo4j) !== null && _a !== void 0 ? _a : new Neo4jService(neo4jConfig);
        this.neogma = (_b = overrides.neogma) !== null && _b !== void 0 ? _b : new NeogmaService(neo4jConfig);
        this.entities =
            (_c = overrides.entityService) !== null && _c !== void 0 ? _c : new EntityServiceOGM(this.neogma);
        this.relationships =
            (_d = overrides.relationshipService) !== null && _d !== void 0 ? _d : new RelationshipServiceOGM(this.neogma);
        this.embeddings =
            (_e = overrides.embeddingService) !== null && _e !== void 0 ? _e : new EmbeddingService(this.neo4j);
        this.searchServiceOGM =
            (_f = overrides.searchService) !== null && _f !== void 0 ? _f : new SearchServiceOGM(this.neogma, this.embeddings);
        this.history = (_g = overrides.historyService) !== null && _g !== void 0 ? _g : new HistoryService(this.neo4j);
        this.analysis =
            (_h = overrides.analysisService) !== null && _h !== void 0 ? _h : new AnalysisService(this.neo4j);
        console.log("[ServiceRegistry] Initialized with OGM services only");
    }
    // Getters for all services
    get neo4jService() {
        return this.neo4j;
    }
    get neogmaService() {
        return this.neogma;
    }
    get entityService() {
        return this.entities;
    }
    get relationshipService() {
        return this.relationships;
    }
    get embeddingService() {
        return this.embeddings;
    }
    get searchService() {
        return this.searchServiceOGM;
    }
    get historyService() {
        return this.history;
    }
    get analysisService() {
        return this.analysis;
    }
    /**
     * Close all services
     */
    async close() {
        await this.neo4j.close();
        if (typeof this.neogma.close === "function") {
            await this.neogma.close();
        }
    }
}
//# sourceMappingURL=ServiceRegistry.js.map
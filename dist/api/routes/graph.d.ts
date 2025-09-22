/**
 * Graph Operations Routes
 * Handles graph search, entity examples, and dependency analysis
 */
import { FastifyInstance } from "fastify";
import { KnowledgeGraphService } from "../../services/knowledge/KnowledgeGraphService.js";
import { DatabaseService } from "../../services/core/DatabaseService.js";
export declare function registerGraphRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService): Promise<void>;
//# sourceMappingURL=graph.d.ts.map
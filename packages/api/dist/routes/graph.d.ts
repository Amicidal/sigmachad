/**
 * Graph Operations Routes
 * Handles graph search, entity examples, and dependency analysis
 */
import { FastifyInstance } from "fastify";
import { KnowledgeGraphService } from "../../../dist/services/knowledge/index.js";
import { DatabaseService } from "../../../dist/services/core/index.js";
export declare function registerGraphRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService): Promise<void>;
//# sourceMappingURL=graph.d.ts.map
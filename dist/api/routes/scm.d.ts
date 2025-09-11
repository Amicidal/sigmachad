/**
 * Source Control Management Routes
 * Handles Git operations, commits, pull requests, and version control
 */
import { FastifyInstance } from "fastify";
import { KnowledgeGraphService } from "../../services/KnowledgeGraphService.js";
import { DatabaseService } from "../../services/DatabaseService.js";
export declare function registerSCMRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService): Promise<void>;
//# sourceMappingURL=scm.d.ts.map
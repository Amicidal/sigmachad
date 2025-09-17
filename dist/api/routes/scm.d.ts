/**
 * Source Control Management Routes
 * Handles Git operations, commits, pull requests, and version control
 */
import { FastifyInstance } from "fastify";
import { KnowledgeGraphService } from "../../services/KnowledgeGraphService.js";
import { DatabaseService } from "../../services/DatabaseService.js";
export declare function registerSCMRoutes(app: FastifyInstance, _kgService: KnowledgeGraphService, _dbService: DatabaseService): Promise<void>;
//# sourceMappingURL=scm.d.ts.map
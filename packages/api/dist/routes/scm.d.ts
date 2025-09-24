/**
 * Source Control Management Routes
 * Handles Git operations, commits, pull requests, and version control
 */
import { FastifyInstance } from "fastify";
import { KnowledgeGraphService } from "../../../dist/services/knowledge/index.js";
import { DatabaseService } from "../../../dist/services/core/index.js";
export declare function registerSCMRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService): Promise<void>;
//# sourceMappingURL=scm.d.ts.map
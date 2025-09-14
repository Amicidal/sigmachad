/**
 * Admin UI Route
 * Serves a self-contained HTML page for monitoring and controlling
 * admin features like sync status, pause/resume, and health.
 */
import { FastifyInstance } from "fastify";
import { KnowledgeGraphService } from "../../services/KnowledgeGraphService.js";
import { DatabaseService } from "../../services/DatabaseService.js";
export declare function registerAdminUIRoutes(app: FastifyInstance, _kgService: KnowledgeGraphService, _dbService: DatabaseService): Promise<void>;
//# sourceMappingURL=admin-ui.d.ts.map
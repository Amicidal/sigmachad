/**
 * History and Checkpoints Routes (stubs)
 * Provides endpoints for creating/listing/fetching/deleting checkpoints and time-scoped graph queries.
 * Implementation is intentionally minimal to establish API surface; handlers return placeholders.
 */
import { FastifyInstance } from "fastify";
import { KnowledgeGraphService } from "../../services/KnowledgeGraphService.js";
import { DatabaseService } from "../../services/DatabaseService.js";
export declare function registerHistoryRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, _dbService: DatabaseService): Promise<void>;
//# sourceMappingURL=history.d.ts.map
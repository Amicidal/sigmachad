/**
 * Impact Analysis Routes
 * Provides cascading impact analysis for proposed changes.
 */
import { FastifyInstance } from "fastify";
import { KnowledgeGraphService } from "../../services/KnowledgeGraphService.js";
import { DatabaseService } from "../../services/DatabaseService.js";
export declare function registerImpactRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, _dbService: DatabaseService): Promise<void>;
//# sourceMappingURL=impact.d.ts.map
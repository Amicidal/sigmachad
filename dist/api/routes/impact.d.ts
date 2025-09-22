/**
 * Impact Analysis Routes
 * Provides cascading impact analysis for proposed changes.
 */
import { FastifyInstance } from "fastify";
import { KnowledgeGraphService } from "../../services/knowledge/KnowledgeGraphService.js";
import { DatabaseService } from "../../services/core/DatabaseService.js";
export declare function registerImpactRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService): Promise<void>;
//# sourceMappingURL=impact.d.ts.map
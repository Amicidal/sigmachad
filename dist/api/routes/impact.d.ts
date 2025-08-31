/**
 * Impact Analysis Routes
 * Handles cascading impact analysis for code changes
 */
import { FastifyInstance } from 'fastify';
import { KnowledgeGraphService } from '../../services/KnowledgeGraphService.js';
import { DatabaseService } from '../../services/DatabaseService.js';
export declare function registerImpactRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService): Promise<void>;
//# sourceMappingURL=impact.d.ts.map
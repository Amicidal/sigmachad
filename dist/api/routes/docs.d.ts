/**
 * Documentation Operations Routes
 * Handles documentation synchronization, domain analysis, and content management
 */
import { FastifyInstance } from 'fastify';
import { KnowledgeGraphService } from '../../services/KnowledgeGraphService.js';
import { DatabaseService } from '../../services/DatabaseService.js';
export declare function registerDocsRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService): Promise<void>;
//# sourceMappingURL=docs.d.ts.map
/**
 * Vector Database Operations Routes
 * Handles semantic search and vector similarity operations
 */
import { FastifyInstance } from 'fastify';
import { KnowledgeGraphService } from '../../../dist/services/knowledge/index.js';
import { DatabaseService } from '../../../dist/services/core/index.js';
export declare function registerVDBRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService): Promise<void>;
//# sourceMappingURL=vdb.d.ts.map
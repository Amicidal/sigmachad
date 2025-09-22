/**
 * Subgraph & Neighbors endpoints for graph viewer
 */
import { FastifyInstance } from 'fastify';
import { KnowledgeGraphService } from '../../services/knowledge/KnowledgeGraphService.js';
import { DatabaseService } from '../../services/core/DatabaseService.js';
export declare function registerGraphViewerRoutes(app: FastifyInstance, kg: KnowledgeGraphService, _db: DatabaseService): Promise<void>;
//# sourceMappingURL=graph-subgraph.d.ts.map
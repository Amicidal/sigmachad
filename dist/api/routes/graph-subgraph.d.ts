/**
 * Subgraph & Neighbors endpoints for graph viewer
 */
import { FastifyInstance } from 'fastify';
import { KnowledgeGraphService } from '../../services/KnowledgeGraphService.js';
import { DatabaseService } from '../../services/DatabaseService.js';
export declare function registerGraphViewerRoutes(app: FastifyInstance, kg: KnowledgeGraphService, _db: DatabaseService): Promise<void>;
//# sourceMappingURL=graph-subgraph.d.ts.map
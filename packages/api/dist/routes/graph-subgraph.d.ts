/**
 * Subgraph & Neighbors endpoints for graph viewer
 */
import { FastifyInstance } from 'fastify';
import { KnowledgeGraphService } from '@memento/knowledge';
import { DatabaseService } from '@memento/core';
export declare function registerGraphViewerRoutes(app: FastifyInstance, kg: KnowledgeGraphService, _db: DatabaseService): Promise<void>;
//# sourceMappingURL=graph-subgraph.d.ts.map
/**
 * Administration Routes
 * Handles system administration, monitoring, and maintenance operations
 */
import { FastifyInstance } from 'fastify';
import { KnowledgeGraphService } from '../../services/KnowledgeGraphService.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { FileWatcher } from '../../services/FileWatcher.js';
export declare function registerAdminRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService, fileWatcher: FileWatcher): Promise<void>;
//# sourceMappingURL=admin.d.ts.map
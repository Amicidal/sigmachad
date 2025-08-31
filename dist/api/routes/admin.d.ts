/**
 * Administration Routes
 * Handles system administration, monitoring, and maintenance operations
 */
import { FastifyInstance } from 'fastify';
import { KnowledgeGraphService } from '../../services/KnowledgeGraphService.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { FileWatcher } from '../../services/FileWatcher.js';
import { SynchronizationCoordinator } from '../../services/SynchronizationCoordinator.js';
import { SynchronizationMonitoring } from '../../services/SynchronizationMonitoring.js';
import { ConflictResolution } from '../../services/ConflictResolution.js';
import { RollbackCapabilities } from '../../services/RollbackCapabilities.js';
export declare function registerAdminRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService, fileWatcher: FileWatcher, syncCoordinator?: SynchronizationCoordinator, syncMonitor?: SynchronizationMonitoring, conflictResolver?: ConflictResolution, rollbackCapabilities?: RollbackCapabilities): Promise<void>;
//# sourceMappingURL=admin.d.ts.map
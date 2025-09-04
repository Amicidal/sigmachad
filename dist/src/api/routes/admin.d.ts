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
import { BackupService } from '../../services/BackupService.js';
import { LoggingService } from '../../services/LoggingService.js';
import { MaintenanceService } from '../../services/MaintenanceService.js';
import { ConfigurationService } from '../../services/ConfigurationService.js';
export declare function registerAdminRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService, fileWatcher: FileWatcher, syncCoordinator?: SynchronizationCoordinator, syncMonitor?: SynchronizationMonitoring, conflictResolver?: ConflictResolution, rollbackCapabilities?: RollbackCapabilities, backupService?: BackupService, loggingService?: LoggingService, maintenanceService?: MaintenanceService, configurationService?: ConfigurationService): Promise<void>;
//# sourceMappingURL=admin.d.ts.map
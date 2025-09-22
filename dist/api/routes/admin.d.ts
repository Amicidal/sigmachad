import { FastifyInstance } from 'fastify';
import type { KnowledgeGraphService } from '../../services/knowledge/KnowledgeGraphService.js';
import type { DatabaseService } from '../../services/core/DatabaseService.js';
import type { FileWatcher } from '../../services/core/FileWatcher.js';
import type { SynchronizationCoordinator } from '../../services/synchronization/SynchronizationCoordinator.js';
import type { SynchronizationMonitoring } from '../../services/synchronization/SynchronizationMonitoring.js';
import type { ConflictResolution } from '../../services/scm/ConflictResolution.js';
import type { RollbackCapabilities } from '../../services/scm/RollbackCapabilities.js';
import { BackupService } from '../../services/backup/BackupService.js';
import type { LoggingService } from '../../services/core/LoggingService.js';
import type { MaintenanceService } from '../../services/core/MaintenanceService.js';
import type { ConfigurationService } from '../../services/core/ConfigurationService.js';
export declare function registerAdminRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService, fileWatcher: FileWatcher, syncCoordinator?: SynchronizationCoordinator, syncMonitor?: SynchronizationMonitoring, _conflictResolver?: ConflictResolution, _rollbackCapabilities?: RollbackCapabilities, backupService?: BackupService, loggingService?: LoggingService, maintenanceService?: MaintenanceService, configurationService?: ConfigurationService): Promise<void>;
//# sourceMappingURL=admin.d.ts.map
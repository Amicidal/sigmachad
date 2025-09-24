import { FastifyInstance } from 'fastify';
import type { KnowledgeGraphService } from '@memento/knowledge';
import type { DatabaseService, FileWatcher, LoggingService, MaintenanceService, ConfigurationService } from '@memento/core';
import type { SynchronizationCoordinator, SynchronizationMonitoring, ConflictResolution, RollbackCapabilities } from '@memento/sync';
import { BackupService } from '@memento/backup';
export declare function registerAdminRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService, fileWatcher: FileWatcher, syncCoordinator?: SynchronizationCoordinator, syncMonitor?: SynchronizationMonitoring, _conflictResolver?: ConflictResolution, _rollbackCapabilities?: RollbackCapabilities, backupService?: BackupService, loggingService?: LoggingService, maintenanceService?: MaintenanceService, configurationService?: ConfigurationService): Promise<void>;
//# sourceMappingURL=admin.d.ts.map
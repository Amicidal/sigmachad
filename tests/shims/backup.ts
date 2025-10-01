export class BackupService {
  constructor(..._args: any[]) {}
}

export class MaintenanceOperationError extends Error {
  code = 'MAINTENANCE_ERROR';
  statusCode = 500;
  constructor(message?: string) {
    super(message);
    this.name = 'MaintenanceOperationError';
  }
}

export class DefaultBackupStorageRegistry {
  constructor(..._args: any[]) {}
}


import { BackupStorageProvider, BackupStorageRegistry } from '@memento/shared-types';
// Re-export commonly used types for providers/tests that import via this module
export type {
  BackupFileStat,
  BackupStorageProvider,
  BackupStorageWriteOptions,
  BackupStorageReadOptions,
} from '@memento/shared-types';
// (no runtime imports needed)

export class DefaultBackupStorageRegistry implements BackupStorageRegistry {
  private providers = new Map<string, BackupStorageProvider>();
  private defaultId: string;

  constructor(defaultProvider: BackupStorageProvider) {
    this.defaultId = defaultProvider.id;
    this.register(defaultProvider.id, defaultProvider);
  }

  register(id: string, provider: BackupStorageProvider): void {
    this.providers.set(id, provider);
  }

  get(id: string): BackupStorageProvider | undefined {
    return this.providers.get(id);
  }

  getDefault(): BackupStorageProvider {
    const provider = this.providers.get(this.defaultId);
    if (!provider) {
      throw new Error(
        `Default backup storage provider "${this.defaultId}" not registered`
      );
    }
    return provider;
  }
}

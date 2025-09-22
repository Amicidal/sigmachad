export class DefaultBackupStorageRegistry {
    constructor(defaultProvider) {
        this.providers = new Map();
        this.defaultId = defaultProvider.id;
        this.register(defaultProvider.id, defaultProvider);
    }
    register(id, provider) {
        this.providers.set(id, provider);
    }
    get(id) {
        return this.providers.get(id);
    }
    getDefault() {
        const provider = this.providers.get(this.defaultId);
        if (!provider) {
            throw new Error(`Default backup storage provider "${this.defaultId}" not registered`);
        }
        return provider;
    }
}
//# sourceMappingURL=BackupStorageProvider.js.map
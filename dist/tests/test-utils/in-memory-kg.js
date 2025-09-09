/**
 * In-memory Knowledge Graph mock for tests
 * Provides deterministic, side-effect-free behavior for CRUD and listing.
 */
import { EventEmitter } from 'events';
export class InMemoryKnowledgeGraphMock extends EventEmitter {
    entities = new Map();
    relationships = new Map();
    constructor() {
        super();
        this.setMaxListeners(100);
    }
    async initialize() {
        // No-op for in-memory
    }
    clear() {
        this.entities.clear();
        this.relationships.clear();
    }
    async createEntity(entity) {
        this.entities.set(entity.id, structuredClone(entity));
        this.emit('entityCreated', { id: entity.id, type: entity.type, timestamp: new Date().toISOString() });
    }
    async getEntity(id) {
        const v = this.entities.get(id);
        return v ? structuredClone(v) : null;
    }
    async updateEntity(id, updates) {
        const existing = this.entities.get(id);
        if (!existing)
            return;
        const updated = { ...existing, ...updates };
        this.entities.set(id, updated);
        this.emit('entityUpdated', { id, updates, timestamp: new Date().toISOString() });
    }
    async deleteEntity(id) {
        // Delete attached relationships first
        for (const [relId, rel] of Array.from(this.relationships.entries())) {
            if (rel.fromEntityId === id || rel.toEntityId === id) {
                this.relationships.delete(relId);
                this.emit('relationshipDeleted', relId);
            }
        }
        this.entities.delete(id);
        this.emit('entityDeleted', id);
    }
    async listEntities(opts = {}) {
        let list = Array.from(this.entities.values());
        if (opts.type)
            list = list.filter(e => e.type === opts.type);
        if (opts.language)
            list = list.filter(e => e.language === opts.language);
        if (opts.path)
            list = list.filter(e => e.path?.includes(opts.path));
        if (opts.tags && opts.tags.length) {
            list = list.filter(e => {
                const tags = e.metadata?.tags || [];
                return opts.tags.some(t => tags.includes(t));
            });
        }
        const total = list.length;
        const offset = opts.offset ?? 0;
        const limit = opts.limit ?? 50;
        const slice = list.slice(offset, offset + limit).map(e => structuredClone(e));
        return { entities: slice, total };
    }
    async createRelationship(relationship) {
        // Ensure endpoints exist (for realism but non-strict)
        this.relationships.set(relationship.id, structuredClone(relationship));
        this.emit('relationshipCreated', {
            id: relationship.id,
            type: relationship.type,
            fromEntityId: relationship.fromEntityId,
            toEntityId: relationship.toEntityId,
            timestamp: new Date().toISOString(),
        });
    }
    async deleteRelationship(relationshipId) {
        this.relationships.delete(relationshipId);
        this.emit('relationshipDeleted', relationshipId);
    }
    async listRelationships(opts = {}) {
        let list = Array.from(this.relationships.values());
        if (opts.fromEntity)
            list = list.filter(r => r.fromEntityId === opts.fromEntity);
        if (opts.toEntity)
            list = list.filter(r => r.toEntityId === opts.toEntity);
        if (opts.type)
            list = list.filter(r => r.type === opts.type);
        const total = list.length;
        const offset = opts.offset ?? 0;
        const limit = opts.limit ?? 50;
        const slice = list.slice(offset, offset + limit).map(r => structuredClone(r));
        return { relationships: slice, total };
    }
}
//# sourceMappingURL=in-memory-kg.js.map
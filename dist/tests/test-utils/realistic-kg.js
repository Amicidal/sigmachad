/**
 * Realistic KnowledgeGraph mock for route tests
 * Implements subset of KnowledgeGraphService with deterministic, in-memory behavior
 */
import { EventEmitter } from 'events';
export class RealisticKnowledgeGraphMock extends EventEmitter {
    entities = new Map();
    relationships = new Map();
    constructor() {
        super();
        this.setMaxListeners(100);
    }
    clear() {
        this.entities.clear();
        this.relationships.clear();
    }
    // Basic CRUD used by tests to seed state
    async createEntity(entity) {
        this.entities.set(entity.id, structuredClone(entity));
        this.emit('entityCreated', { id: entity.id, type: entity.type, timestamp: new Date().toISOString() });
    }
    async getEntity(id) {
        const v = this.entities.get(id);
        return v ? structuredClone(v) : null;
    }
    async createRelationship(rel) {
        this.relationships.set(rel.id, structuredClone(rel));
        this.emit('relationshipCreated', { ...rel, timestamp: new Date().toISOString() });
    }
    // API used by graph routes
    async search(req) {
        // Naive but realistic: filter by type and simple query matching name/path/id
        let list = Array.from(this.entities.values());
        const logicalType = (e) => {
            if (e.type === 'symbol' && e.kind === 'function')
                return 'function';
            if (e.type === 'symbol' && e.kind === 'class')
                return 'class';
            return e.type;
        };
        if (req.entityTypes && req.entityTypes.length) {
            list = list.filter((e) => req.entityTypes.includes(logicalType(e)));
        }
        if (req.filters) {
            const { language, path, tags } = req.filters;
            if (language)
                list = list.filter((e) => e.language === language);
            if (path)
                list = list.filter((e) => (e.path || '').includes(path));
            if (tags && tags.length)
                list = list.filter((e) => {
                    const etags = e.metadata?.tags || [];
                    return tags.some((t) => etags.includes(t));
                });
        }
        const q = (req.query || '').toLowerCase();
        if (q) {
            list = list.filter((e) => {
                const name = e.name || '';
                const p = e.path || '';
                return (e.id.toLowerCase().includes(q) ||
                    name.toLowerCase().includes(q) ||
                    p.toLowerCase().includes(q));
            });
        }
        const limit = req.limit ?? list.length;
        return list.slice(0, limit).map((e) => structuredClone(e));
    }
    async getRelationships(query) {
        let list = Array.from(this.relationships.values());
        if (query.fromEntityId)
            list = list.filter((r) => r.fromEntityId === query.fromEntityId);
        if (query.toEntityId)
            list = list.filter((r) => r.toEntityId === query.toEntityId);
        if (query.type) {
            const types = Array.isArray(query.type) ? query.type : [query.type];
            list = list.filter((r) => types.includes(r.type));
        }
        const limit = query.limit ?? list.length;
        const offset = query.offset ?? 0;
        return list.slice(offset, offset + limit).map((r) => structuredClone(r));
    }
    async listEntities(opts) {
        let list = Array.from(this.entities.values());
        const logicalType = (e) => {
            if (e.type === 'symbol' && e.kind === 'function')
                return 'function';
            if (e.type === 'symbol' && e.kind === 'class')
                return 'class';
            return e.type;
        };
        if (opts.type)
            list = list.filter((e) => logicalType(e) === opts.type);
        if (opts.language)
            list = list.filter((e) => e.language === opts.language);
        if (opts.path)
            list = list.filter((e) => (e.path || '').includes(opts.path));
        if (opts.tags && opts.tags.length) {
            list = list.filter((e) => {
                const etags = e.metadata?.tags || [];
                return opts.tags.some((t) => etags.includes(t));
            });
        }
        const total = list.length;
        const offset = opts.offset ?? 0;
        const limit = opts.limit ?? total;
        return { entities: list.slice(offset, offset + limit), total };
    }
    async listRelationships(opts) {
        let list = Array.from(this.relationships.values());
        if (opts.fromEntity)
            list = list.filter((r) => r.fromEntityId === opts.fromEntity);
        if (opts.toEntity)
            list = list.filter((r) => r.toEntityId === opts.toEntity);
        if (opts.type)
            list = list.filter((r) => r.type === opts.type);
        const total = list.length;
        const offset = opts.offset ?? 0;
        const limit = opts.limit ?? total;
        return { relationships: list.slice(offset, offset + limit), total };
    }
    async getEntityExamples(entityId) {
        const entity = await this.getEntity(entityId);
        const signatureBase = (() => {
            if (!entity)
                return 'unknown';
            if (entity.kind === 'function') {
                return `function ${entity.name || entity.id}()`;
            }
            if (entity.kind === 'class') {
                return `class ${entity.name || entity.id}`;
            }
            return `${entity.type} ${entityId}`;
        })();
        // Build usage examples from incoming relationships
        const incoming = await this.getRelationships({ toEntityId: entityId, limit: 10 });
        const usageExamples = incoming.map((rel, i) => ({
            context: `${rel.type} from ${rel.fromEntityId}`,
            code: `// Usage #${i} for ${entityId}`,
            file: `${entity?.path || 'unknown.ts'}`,
            line: i + 1,
        }));
        return {
            entityId,
            signature: signatureBase,
            usageExamples,
            testExamples: [],
            relatedPatterns: [],
        };
    }
    async getEntityDependencies(entityId) {
        const direct = await this.getRelationships({ fromEntityId: entityId });
        const reverse = await this.getRelationships({ toEntityId: entityId });
        return {
            entityId,
            directDependencies: direct.map((r) => ({ entity: null, relationship: r.type, strength: 1 })),
            indirectDependencies: [],
            reverseDependencies: reverse.map((r) => ({ entity: null, relationship: r.type, impact: 'medium' })),
            circularDependencies: [],
        };
    }
}
//# sourceMappingURL=realistic-kg.js.map
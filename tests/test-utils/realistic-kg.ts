/**
 * Realistic KnowledgeGraph mock for route tests
 * Implements subset of KnowledgeGraphService with deterministic, in-memory behavior
 */

import { EventEmitter } from 'events';
import type {
  Entity,
  FunctionSymbol,
  ClassSymbol,
} from '../../src/models/entities';
import type {
  GraphRelationship,
  RelationshipQuery,
  RelationshipType,
} from '../../src/models/relationships';

type GraphSearchRequest = {
  query: string;
  entityTypes?: Array<'function' | 'class' | 'interface' | 'file' | 'module'>;
  searchType?: 'semantic' | 'structural' | 'usage' | 'dependency';
  filters?: {
    language?: string;
    path?: string;
    tags?: string[];
    lastModified?: {
      since?: Date;
      until?: Date;
    };
  };
  includeRelated?: boolean;
  limit?: number;
};

export class RealisticKnowledgeGraphMock extends EventEmitter {
  private entities = new Map<string, Entity>();
  private relationships = new Map<string, GraphRelationship>();

  constructor() {
    super();
    this.setMaxListeners(100);
  }

  clear(): void {
    this.entities.clear();
    this.relationships.clear();
  }

  // Basic CRUD used by tests to seed state
  async createEntity(entity: Entity): Promise<void> {
    this.entities.set(entity.id, structuredClone(entity));
    this.emit('entityCreated', { id: entity.id, type: entity.type, timestamp: new Date().toISOString() });
  }

  async getEntity(id: string): Promise<Entity | null> {
    const v = this.entities.get(id);
    return v ? structuredClone(v) : null;
  }

  async createRelationship(rel: GraphRelationship): Promise<void> {
    this.relationships.set(rel.id, structuredClone(rel));
    this.emit('relationshipCreated', { ...rel, timestamp: new Date().toISOString() });
  }

  // API used by graph routes
  async search(req: GraphSearchRequest): Promise<Entity[]> {
    // Naive but realistic: filter by type and simple query matching name/path/id
    let list = Array.from(this.entities.values());
    const logicalType = (e: any): string => {
      if (e.type === 'symbol' && e.kind === 'function') return 'function';
      if (e.type === 'symbol' && e.kind === 'class') return 'class';
      return e.type;
    };

    if (req.entityTypes && req.entityTypes.length) {
      list = list.filter((e) => req.entityTypes!.includes(logicalType(e) as any));
    }

    if (req.filters) {
      const { language, path, tags } = req.filters;
      if (language) list = list.filter((e: any) => e.language === language);
      if (path) list = list.filter((e: any) => (e.path || '').includes(path));
      if (tags && tags.length)
        list = list.filter((e: any) => {
          const etags: string[] = e.metadata?.tags || [];
          return tags.some((t) => etags.includes(t));
        });
    }

    const q = (req.query || '').toLowerCase();
    if (q) {
      list = list.filter((e: any) => {
        const name = (e as FunctionSymbol | ClassSymbol).name || '';
        const p = (e as any).path || '';
        return (
          e.id.toLowerCase().includes(q) ||
          name.toLowerCase().includes(q) ||
          p.toLowerCase().includes(q)
        );
      });
    }

    const limit = req.limit ?? list.length;
    return list.slice(0, limit).map((e) => structuredClone(e));
  }

  async getRelationships(query: RelationshipQuery): Promise<GraphRelationship[]> {
    let list = Array.from(this.relationships.values());
    if (query.fromEntityId) list = list.filter((r) => r.fromEntityId === query.fromEntityId);
    if (query.toEntityId) list = list.filter((r) => r.toEntityId === query.toEntityId);
    if (query.type) {
      const types = Array.isArray(query.type) ? query.type : [query.type];
      list = list.filter((r) => types.includes(r.type as RelationshipType));
    }
    const limit = query.limit ?? list.length;
    const offset = query.offset ?? 0;
    return list.slice(offset, offset + limit).map((r) => structuredClone(r));
  }

  async listEntities(opts: {
    type?: string;
    language?: string;
    path?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<{ entities: Entity[]; total: number }> {
    let list = Array.from(this.entities.values());
    const logicalType = (e: any): string => {
      if (e.type === 'symbol' && e.kind === 'function') return 'function';
      if (e.type === 'symbol' && e.kind === 'class') return 'class';
      return e.type;
    };
    if (opts.type) list = list.filter((e) => logicalType(e) === opts.type);
    if (opts.language) list = list.filter((e: any) => e.language === opts.language);
    if (opts.path) list = list.filter((e: any) => (e.path || '').includes(opts.path!));
    if (opts.tags && opts.tags.length) {
      list = list.filter((e: any) => {
        const etags: string[] = e.metadata?.tags || [];
        return opts.tags!.some((t) => etags.includes(t));
      });
    }
    const total = list.length;
    const offset = opts.offset ?? 0;
    const limit = opts.limit ?? total;
    return { entities: list.slice(offset, offset + limit), total };
  }

  async listRelationships(opts: {
    fromEntity?: string;
    toEntity?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ relationships: GraphRelationship[]; total: number }> {
    let list = Array.from(this.relationships.values());
    if (opts.fromEntity) list = list.filter((r) => r.fromEntityId === opts.fromEntity);
    if (opts.toEntity) list = list.filter((r) => r.toEntityId === opts.toEntity);
    if (opts.type) list = list.filter((r) => r.type === (opts.type as RelationshipType));
    const total = list.length;
    const offset = opts.offset ?? 0;
    const limit = opts.limit ?? total;
    return { relationships: list.slice(offset, offset + limit), total };
  }

  async getEntityExamples(entityId: string): Promise<{
    entityId: string;
    signature: string;
    usageExamples: Array<{ context: string; code: string; file: string; line: number }>;
    testExamples: Array<{ testId: string; testName: string; testCode: string; assertions: string[] }>;
    relatedPatterns: Array<{ pattern: string; frequency: number; confidence: number }>;
  }> {
    const entity = await this.getEntity(entityId);
    const signatureBase = (() => {
      if (!entity) return 'unknown';
      if ((entity as FunctionSymbol).kind === 'function') {
        return `function ${(entity as FunctionSymbol).name || entity.id}()`;
      }
      if ((entity as ClassSymbol).kind === 'class') {
        return `class ${(entity as ClassSymbol).name || entity.id}`;
      }
      return `${entity.type} ${entityId}`;
    })();

    // Build usage examples from incoming relationships
    const incoming = await this.getRelationships({ toEntityId: entityId, limit: 10 });
    const usageExamples = incoming.map((rel, i) => ({
      context: `${rel.type} from ${rel.fromEntityId}`,
      code: `// Usage #${i} for ${entityId}`,
      file: `${(entity as any)?.path || 'unknown.ts'}`,
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

  async getEntityDependencies(entityId: string): Promise<{
    entityId: string;
    directDependencies: Array<{ entity: any; relationship: string; strength: number }>;
    indirectDependencies: Array<{ entity: any; path: any[]; relationship: string; distance: number }>;
    reverseDependencies: Array<{ entity: any; relationship: string; impact: 'high' | 'medium' | 'low' }>;
    circularDependencies: Array<{ cycle: any[]; severity: 'critical' | 'warning' | 'info' }>;
  }> {
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

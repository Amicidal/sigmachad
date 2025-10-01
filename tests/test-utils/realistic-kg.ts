/**
 * Realistic KnowledgeGraph mock for route tests
 * Implements subset of KnowledgeGraphService with deterministic, in-memory behavior
 */

import { EventEmitter } from 'events';
import type { Entity, FunctionSymbol, ClassSymbol, GraphRelationship, RelationshipType, ModuleChildrenResult, ListImportsResult, DefinitionLookupResult, StructuralNavigationEntry } from '@memento/shared-types';
import type { RelationshipQuery } from '@memento/shared-types';

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

  async listModuleChildren(
    modulePath: string,
    options: {
      includeFiles?: boolean;
      includeSymbols?: boolean;
      limit?: number;
      language?: string | string[];
      symbolKind?: string | string[];
      modulePathPrefix?: string;
    } = {}
  ): Promise<ModuleChildrenResult> {
    const normalizedPath = modulePath.replace(/\\/g, '/');
    const parent = Array.from(this.entities.values()).find(
      (entity) => entity.path === normalizedPath || entity.id === normalizedPath
    );
    if (!parent) {
      return { modulePath: normalizedPath, children: [] };
    }

    const includeFiles = options.includeFiles !== false;
    const includeSymbols = options.includeSymbols !== false;

    const normalize = (value?: string | string[]): string[] => {
      if (!value) return [];
      const raw = Array.isArray(value) ? value : [value];
      return raw
        .flatMap((entry) =>
          typeof entry === 'string' ? entry.split(',') : []
        )
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    };

    const languages = normalize(options.language).map((v) => v.toLowerCase());
    const symbolKinds = normalize(options.symbolKind).map((v) => v.toLowerCase());
    const modulePrefix =
      typeof options.modulePathPrefix === 'string' && options.modulePathPrefix.trim().length > 0
        ? options.modulePathPrefix.trim()
        : undefined;

    const matchesLanguage = (rel: GraphRelationship, entity?: Entity | null) => {
      if (!languages.length) return true;
      const relLang = (rel as any).language || (rel.metadata as any)?.language;
      const entityLang = (entity as any)?.language;
      const relNormalized =
        typeof relLang === 'string' ? relLang.toLowerCase() : null;
      const entityNormalized =
        typeof entityLang === 'string' ? entityLang.toLowerCase() : null;
      return Boolean(
        (relNormalized && languages.includes(relNormalized)) ||
          (entityNormalized && languages.includes(entityNormalized))
      );
    };

    const matchesSymbolKind = (entity?: Entity | null) => {
      if (!symbolKinds.length) return true;
      if (!entity || entity.type !== 'symbol') return true;
      const kind = (entity as any)?.kind;
      const normalized = typeof kind === 'string' ? kind.toLowerCase() : '';
      return symbolKinds.includes(normalized);
    };

    const matchesModulePrefix = (
      rel: GraphRelationship,
      entity?: Entity | null
    ) => {
      if (!modulePrefix) return true;
      const relModulePath =
        (rel as any).modulePath || (rel.metadata as any)?.modulePath;
      const entityModulePath =
        (entity as any)?.modulePath || (entity as any)?.path;
      const candidate =
        typeof relModulePath === 'string'
          ? relModulePath
          : typeof entityModulePath === 'string'
          ? entityModulePath
          : '';
      return candidate.startsWith(modulePrefix);
    };

    const children: StructuralNavigationEntry[] = [];
    for (const rel of this.relationships.values()) {
      if (rel.type !== ('CONTAINS' as RelationshipType)) continue;
      if (rel.fromEntityId !== parent.id) continue;
      const entity = this.entities.get(rel.toEntityId || '');
      if (!entity) continue;
      if (!includeFiles && entity.type === 'file') continue;
      if (!includeSymbols && entity.type === 'symbol') continue;
      if (!matchesLanguage(rel, entity)) continue;
      if (!matchesSymbolKind(entity)) continue;
      if (!matchesModulePrefix(rel, entity)) continue;
      children.push({
        entity: structuredClone(entity),
        relationship: structuredClone(rel),
      });
    }

    const limit = Math.min(options.limit ?? children.length, children.length);
    return {
      modulePath: normalizedPath,
      parentId: parent.id,
      children: children.slice(0, limit),
    };
  }


  async listImports(
    entityId: string,
    options: {
      resolvedOnly?: boolean;
      language?: string | string[];
      symbolKind?: string | string[];
      importAlias?: string | string[];
      importType?: string | string[];
      isNamespace?: boolean;
      modulePath?: string | string[];
      modulePathPrefix?: string;
      limit?: number;
    } = {}
  ): Promise<ListImportsResult> {
    const resolvedId = entityId;

    const normalize = (value?: string | string[]): string[] => {
      if (!value) return [];
      const raw = Array.isArray(value) ? value : [value];
      return raw
        .flatMap((entry) =>
          typeof entry === 'string' ? entry.split(',') : []
        )
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    };

    const languages = normalize(options.language).map((v) => v.toLowerCase());
    const symbolKinds = normalize(options.symbolKind).map((v) => v.toLowerCase());
    const importAliases = normalize(options.importAlias);
    const importTypes = normalize(options.importType).map((v) => v.toLowerCase());
    const modulePaths = normalize(options.modulePath);
    const modulePathPrefix =
      typeof options.modulePathPrefix === 'string' && options.modulePathPrefix.trim().length > 0
        ? options.modulePathPrefix.trim()
        : undefined;
    const isNamespace =
      typeof options.isNamespace === 'boolean' ? options.isNamespace : undefined;
    const limit = options.limit ?? Number.MAX_SAFE_INTEGER;

    const entries = Array.from(this.relationships.values())
      .filter((rel) => rel.type === ('IMPORTS' as RelationshipType))
      .filter((rel) => rel.fromEntityId === resolvedId)
      .filter((rel) => {
        if (!options.resolvedOnly) return true;
        return (
          (rel as any).resolutionState === 'resolved' ||
          (rel as any).resolved === true
        );
      })
      .map((rel) => ({
        rel,
        target: rel.toEntityId ? this.entities.get(rel.toEntityId) : undefined,
      }))
      .filter(({ rel, target }) => {
        if (!languages.length) return true;
        const relLang = (rel as any).language || (rel.metadata as any)?.language;
        const targetLang = target?.language;
        const relNormalized =
          typeof relLang === 'string' ? relLang.toLowerCase() : null;
        const targetNormalized =
          typeof targetLang === 'string' ? targetLang.toLowerCase() : null;
        return Boolean(
          (relNormalized && languages.includes(relNormalized)) ||
            (targetNormalized && languages.includes(targetNormalized))
        );
      })
      .filter(({ target }) => {
        if (!symbolKinds.length) return true;
        if (!target || target.type !== 'symbol') return true;
        const kind = (target as any)?.kind;
        const normalized = typeof kind === 'string' ? kind.toLowerCase() : '';
        return symbolKinds.includes(normalized);
      })
      .filter(({ rel }) => {
        if (!importAliases.length) return true;
        const alias =
          (rel as any).importAlias || (rel.metadata as any)?.importAlias;
        if (typeof alias !== 'string') return false;
        return importAliases.includes(alias);
      })
      .filter(({ rel }) => {
        if (!importTypes.length) return true;
        const type =
          (rel as any).importType || (rel.metadata as any)?.importType;
        const normalized =
          typeof type === 'string' ? type.toLowerCase() : '';
        return importTypes.includes(normalized);
      })
      .filter(({ rel }) => {
        if (typeof isNamespace !== 'boolean') return true;
        const value = (rel as any).isNamespace;
        return Boolean(value) === isNamespace;
      })
      .filter(({ rel }) => {
        if (!modulePaths.length) return true;
        const modulePath =
          (rel as any).modulePath || (rel.metadata as any)?.modulePath;
        if (typeof modulePath !== 'string') return false;
        return modulePaths.includes(modulePath);
      })
      .filter(({ rel, target }) => {
        if (!modulePathPrefix) return true;
        const modulePath =
          (rel as any).modulePath || (rel.metadata as any)?.modulePath;
        if (typeof modulePath === 'string') {
          return modulePath.startsWith(modulePathPrefix);
        }
        const candidate = (target as any)?.modulePath || (target as any)?.path;
        return typeof candidate === 'string'
          ? candidate.startsWith(modulePathPrefix)
          : false;
      })
      .slice(0, limit)
      .map(({ rel, target }) => ({
        relationship: structuredClone(rel),
        target: target ? structuredClone(target) : undefined,
      }));

    return { entityId: resolvedId, imports: entries };
  }


  async findDefinition(symbolId: string): Promise<DefinitionLookupResult> {
    const relation = Array.from(this.relationships.values()).find(
      (rel) => rel.type === ('DEFINES' as RelationshipType) && rel.toEntityId === symbolId
    );

    const source = relation?.fromEntityId
      ? this.entities.get(relation.fromEntityId)
      : null;

    return {
      symbolId,
      relationship: relation ? structuredClone(relation) : null,
      source: source ? structuredClone(source) : null,
    };
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
    directDependencies: Array<{ entity: any; relationship: string; confidence: number }>;
    indirectDependencies: Array<{ entity: any; path: any[]; relationship: string; distance: number }>;
    reverseDependencies: Array<{ entity: any; relationship: string; impact: 'high' | 'medium' | 'low' }>;
    circularDependencies: Array<{ cycle: any[]; severity: 'critical' | 'warning' | 'info' }>;
  }> {
    const direct = await this.getRelationships({ fromEntityId: entityId });
    const reverse = await this.getRelationships({ toEntityId: entityId });
    return {
      entityId,
      directDependencies: direct.map((r) => ({ entity: null, relationship: r.type, confidence: 1 })),
      indirectDependencies: [],
      reverseDependencies: reverse.map((r) => ({ entity: null, relationship: r.type, impact: 'medium' })),
      circularDependencies: [],
    };
  }
}

/**
 * In-memory Knowledge Graph mock for tests
 * Provides deterministic, side-effect-free behavior for CRUD and listing.
 */

import { EventEmitter } from 'events';
import type { Entity, GraphRelationship, RelationshipType } from '@memento/shared-types';

type ListEntitiesOpts = {
  type?: string;
  language?: string;
  path?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
};

type ListRelationshipsOpts = {
  fromEntity?: string;
  toEntity?: string;
  type?: string;
  limit?: number;
  offset?: number;
};

export class InMemoryKnowledgeGraphMock extends EventEmitter {
  private entities = new Map<string, Entity>();
  private relationships = new Map<string, GraphRelationship>();

  constructor() {
    super();
    this.setMaxListeners(100);
  }

  async initialize(): Promise<void> {
    // No-op for in-memory
  }

  clear(): void {
    this.entities.clear();
    this.relationships.clear();
  }

  async createEntity(entity: Entity): Promise<void> {
    this.entities.set(entity.id, structuredClone(entity));
    this.emit('entityCreated', { id: entity.id, type: entity.type, timestamp: new Date().toISOString() });
  }

  async getEntity(id: string): Promise<Entity | null> {
    const v = this.entities.get(id);
    return v ? structuredClone(v) : null;
  }

  async updateEntity(id: string, updates: Partial<Entity>): Promise<void> {
    const existing = this.entities.get(id);
    if (!existing) return;
    const updated: Entity = { ...(existing as any), ...(updates as any) };
    this.entities.set(id, updated);
    this.emit('entityUpdated', { id, updates, timestamp: new Date().toISOString() });
  }

  async deleteEntity(id: string): Promise<void> {
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

  async listEntities(opts: ListEntitiesOpts = {}): Promise<{ entities: Entity[]; total: number }> {
    let list = Array.from(this.entities.values());

    if (opts.type) list = list.filter(e => e.type === opts.type);
    if (opts.language) list = list.filter(e => (e as any).language === opts.language);
    if (opts.path) list = list.filter(e => (e as any).path?.includes(opts.path!));
    if (opts.tags && opts.tags.length) {
      list = list.filter(e => {
        const tags = (e as any).metadata?.tags || [];
        return opts.tags!.some(t => tags.includes(t));
      });
    }

    const total = list.length;
    const offset = opts.offset ?? 0;
    const limit = opts.limit ?? 50;
    const slice = list.slice(offset, offset + limit).map(e => structuredClone(e));
    return { entities: slice, total };
  }

  async createRelationship(relationship: GraphRelationship): Promise<void> {
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

  async deleteRelationship(relationshipId: string): Promise<void> {
    this.relationships.delete(relationshipId);
    this.emit('relationshipDeleted', relationshipId);
  }

  async listRelationships(opts: ListRelationshipsOpts = {}): Promise<{ relationships: GraphRelationship[]; total: number }> {
    let list = Array.from(this.relationships.values());
    if (opts.fromEntity) list = list.filter(r => r.fromEntityId === opts.fromEntity);
    if (opts.toEntity) list = list.filter(r => r.toEntityId === opts.toEntity);
    if (opts.type) list = list.filter(r => r.type === (opts.type as RelationshipType));
    const total = list.length;
    const offset = opts.offset ?? 0;
    const limit = opts.limit ?? 50;
    const slice = list.slice(offset, offset + limit).map(r => structuredClone(r));
    return { relationships: slice, total };
  }
}

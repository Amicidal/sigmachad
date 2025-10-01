import { describe, it, expect, beforeEach, vi } from 'vitest';

import { KnowledgeGraphService } from '@memento/knowledge';
import { RelationshipType } from '@memento/shared-types';
import type { Entity } from '@memento/shared-types';
import type { GraphRelationship } from '@memento/shared-types';
import {
  createKnowledgeGraphTestHarness,
  type KnowledgeGraphTestDependencies,
} from '../../test-utils/knowledge-graph-test-helpers.js';

describe('KnowledgeGraphService (OGM facade)', () => {
  let service: KnowledgeGraphService;
  let deps: KnowledgeGraphTestDependencies;

  const sampleEntity: Entity = {
    id: 'entity-1',
    type: 'file',
    path: 'src/a.ts',
    hash: 'hash-a',
    language: 'typescript',
    created: new Date('2024-01-01T00:00:00Z'),
    lastModified: new Date('2024-01-02T00:00:00Z'),
  } as Entity;

  const sampleRelationship: GraphRelationship = {
    id: 'rel-1',
    fromEntityId: 'entity-1',
    toEntityId: 'entity-2',
    type: RelationshipType.CALLS,
    created: new Date('2024-01-01T00:00:00Z'),
    lastModified: new Date('2024-01-02T00:00:00Z'),
    version: 1,
    metadata: {},
  };

  beforeEach(() => {
    ({ service, deps } = createKnowledgeGraphTestHarness());
  });

  it('initializes database indices when requested', async () => {
    await service.initialize();

    expect(deps.neo4j.createCommonIndexes).toHaveBeenCalled();
    expect(deps.embeddingService.initializeVectorIndex).toHaveBeenCalled();
  });

  it('creates entities and schedules embeddings by default', async () => {
    deps.entityService.createEntity.mockResolvedValue(sampleEntity);

    const created = await service.createEntity(sampleEntity);

    expect(deps.entityService.createEntity).toHaveBeenCalledWith(sampleEntity);
    expect(deps.embeddingService.generateAndStore).toHaveBeenCalledWith(sampleEntity);
    expect(created).toBe(sampleEntity);
  });

  it('skips embedding generation when requested', async () => {
    deps.entityService.createEntity.mockResolvedValue(sampleEntity);

    await service.createEntity(sampleEntity, { skipEmbedding: true });

    expect(deps.embeddingService.generateAndStore).not.toHaveBeenCalled();
  });

  it('updates entities and refreshes embeddings when content changes', async () => {
    deps.entityService.updateEntity.mockResolvedValue(sampleEntity);

    await service.updateEntity(sampleEntity.id, { name: 'Renamed' });

    expect(deps.entityService.updateEntity).toHaveBeenCalledWith(sampleEntity.id, { name: 'Renamed' });
    expect(deps.embeddingService.updateEmbedding).toHaveBeenCalledWith(sampleEntity.id);
  });

  it('lists entities and preserves legacy shape', async () => {
    deps.entityService.listEntities.mockResolvedValue({ items: [sampleEntity], total: 1 });

    const result = await service.listEntities();

    expect(result.items).toEqual([sampleEntity]);
    expect(result.entities).toEqual([sampleEntity]);
    expect(result.total).toBe(1);
  });

  it('creates entities in bulk and batches embedding work', async () => {
    deps.entityService.createEntitiesBulk.mockResolvedValue({ created: 1, updated: 0, failed: 0 });

    const result = await service.createEntitiesBulk([sampleEntity]);

    expect(deps.entityService.createEntitiesBulk).toHaveBeenCalledWith([sampleEntity], undefined);
    expect(deps.embeddingService.batchEmbed).toHaveBeenCalledWith([sampleEntity]);
    expect(result.created).toBe(1);
  });

  it('delegates relationship creation to the relationship service', async () => {
    deps.relationshipService.createRelationship.mockResolvedValue(sampleRelationship);

    const created = await service.createRelationship(sampleRelationship);

    expect(deps.relationshipService.createRelationship).toHaveBeenCalledWith(sampleRelationship);
    expect(created).toBe(sampleRelationship);
  });

  it('delegates structural and semantic search', async () => {
    const resultItem = { entity: sampleEntity };
    deps.searchService.search.mockResolvedValue([resultItem]);

    const entities = await service.search({ query: 'foo' } as any);

    expect(deps.searchService.search).toHaveBeenCalledWith({ query: 'foo' });
    expect(entities).toEqual([sampleEntity]);

    await service.semanticSearch('foo');
    expect(deps.searchService.semanticSearch).toHaveBeenCalledWith('foo', undefined);

    await service.structuralSearch('foo', { limit: 5 });
    expect(deps.searchService.structuralSearch).toHaveBeenCalledWith('foo', { limit: 5 });
  });

  it('forwards search service events to consumers', async () => {
    const handler = vi.fn();
    service.on('search:completed', handler);

    deps.searchService.emit('search:completed', { query: 'foo' });

    expect(handler).toHaveBeenCalledWith({ query: 'foo' });
  });

  it('delegates history operations to the history service', async () => {
    deps.historyService.appendVersion.mockResolvedValue('version-1');

    const versionId = await service.appendVersion(sampleEntity);

    expect(deps.historyService.appendVersion).toHaveBeenCalledWith(sampleEntity, undefined);
    expect(versionId).toBe('version-1');

    await service.openEdge('a', 'b', RelationshipType.CALLS);
    expect(deps.historyService.openEdge).toHaveBeenCalledWith('a', 'b', RelationshipType.CALLS, undefined, undefined);

    await service.closeEdge('a', 'b', RelationshipType.CALLS);
    expect(deps.historyService.closeEdge).toHaveBeenCalledWith('a', 'b', RelationshipType.CALLS, undefined);
  });

  it('delegates analysis operations to the analysis service', async () => {
    const impact: any = { affectedEntities: ['entity-1'] };
    deps.analysisService.analyzeImpact.mockResolvedValue(impact);

    const result = await service.analyzeImpact({ entityId: 'entity-1' } as any);

    expect(deps.analysisService.analyzeImpact).toHaveBeenCalledWith({ entityId: 'entity-1' });
    expect(result).toBe(impact);
  });

  it('merges stats from component services', async () => {
    deps.neo4j.getStats.mockResolvedValue({ nodes: 10 });
    deps.entityService.getEntityStats.mockResolvedValue({ entities: 5 });
    deps.relationshipService.getRelationshipStats.mockResolvedValue({ relationships: 7 });
    deps.embeddingService.getEmbeddingStats.mockResolvedValue({ embeddings: 3 });

    const stats = await service.getStats();

    expect(stats.database).toEqual({ nodes: 10 });
    expect(stats.entities).toEqual({ entities: 5 });
    expect(stats.relationships).toEqual({ relationships: 7 });
    expect(stats.embeddings).toEqual({ embeddings: 3 });
  });

  it('cleans up resources on close', async () => {
    await service.close();

    expect(deps.neo4j.close).toHaveBeenCalled();
    expect(deps.neogma.close).toHaveBeenCalled();
  });

  it('supports cache utilities via the search service', async () => {
    await service.clearSearchCache();
    expect(deps.searchService.clearCache).toHaveBeenCalled();

    await service.invalidateSearchCache('entity');
    expect(deps.searchService.invalidateCache).toHaveBeenCalledWith('entity');
  });

  it('exposes embedding utilities', async () => {
    await service.createEmbedding(sampleEntity);
    expect(deps.embeddingService.generateAndStore).toHaveBeenCalledWith(sampleEntity);

    await service.deleteEmbedding(sampleEntity.id);
    expect(deps.embeddingService.deleteEmbedding).toHaveBeenCalledWith(sampleEntity.id);
  });
});

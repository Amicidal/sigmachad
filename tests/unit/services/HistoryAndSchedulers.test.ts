import { describe, it, expect, beforeEach } from 'vitest';

import type { Entity } from '../../../src/models/entities.js';
import { RelationshipType } from '../../../src/models/relationships.js';
import {
  createKnowledgeGraphTestHarness,
  type KnowledgeGraphTestDependencies,
} from '../../test-utils/knowledge-graph-test-helpers.js';

import { KnowledgeGraphService } from '../../../src/services/knowledge/KnowledgeGraphService.js';

describe('KnowledgeGraphService history delegation', () => {
  let service: KnowledgeGraphService;
  let deps: KnowledgeGraphTestDependencies;

  const entity: Entity = {
    id: 'entity-1',
    type: 'file',
    path: 'src/a.ts',
    hash: 'hash-a',
    language: 'typescript',
    created: new Date('2024-01-01T00:00:00Z'),
    lastModified: new Date('2024-01-02T00:00:00Z'),
  } as Entity;

  beforeEach(() => {
    ({ service, deps } = createKnowledgeGraphTestHarness());
  });

  it('appendVersion delegates to HistoryService', async () => {
    deps.historyService.appendVersion.mockResolvedValue('ver_entity-1_hash-a');

    const versionId = await service.appendVersion(entity);

    expect(deps.historyService.appendVersion).toHaveBeenCalledWith(entity, undefined);
    expect(versionId).toBe('ver_entity-1_hash-a');
  });

  it('openEdge and closeEdge are routed through HistoryService', async () => {
    await service.openEdge('a', 'b', RelationshipType.CALLS, new Date('2024-01-01T00:00:00Z'), 'cs-1');
    expect(deps.historyService.openEdge).toHaveBeenCalledWith(
      'a',
      'b',
      RelationshipType.CALLS,
      new Date('2024-01-01T00:00:00Z'),
      'cs-1'
    );

    await service.closeEdge('a', 'b', RelationshipType.CALLS, new Date('2024-01-02T00:00:00Z'));
    expect(deps.historyService.closeEdge).toHaveBeenCalledWith(
      'a',
      'b',
      RelationshipType.CALLS,
      new Date('2024-01-02T00:00:00Z')
    );
  });

  it('createCheckpoint forwards arguments and returns checkpoint metadata', async () => {
    deps.historyService.createCheckpoint.mockResolvedValue({ checkpointId: 'chk_daily' });

    const checkpoint = await service.createCheckpoint(['seed-1'], { cadence: 'daily' });

    expect(deps.historyService.createCheckpoint).toHaveBeenCalledWith(['seed-1'], { cadence: 'daily' });
    expect(checkpoint.checkpointId).toBe('chk_daily');
  });

  it('provides helpers for timelines and metrics', async () => {
    deps.historyService.getEntityTimeline.mockResolvedValue([{ id: 'ver-1' }]);
    deps.historyService.getHistoryMetrics.mockResolvedValue({ sessions: 42 });

    const timeline = await service.getEntityTimeline('entity-1');
    const metrics = await service.getHistoryMetrics();

    expect(deps.historyService.getEntityTimeline).toHaveBeenCalledWith('entity-1', undefined);
    expect(timeline).toEqual([{ id: 'ver-1' }]);
    expect(metrics.sessions).toBe(42);
  });
});

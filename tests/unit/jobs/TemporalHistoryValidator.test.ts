import { describe, it, expect, vi } from 'vitest';
import { TemporalHistoryValidator } from '../../../src/jobs/TemporalHistoryValidator.js';
import type { KnowledgeGraphService } from '../../../src/services/knowledge/KnowledgeGraphService.js';
import type { EntityTimelineResult } from '../../../src/models/types.js';

describe('TemporalHistoryValidator', () => {
  const buildTimeline = (
    versions: Array<{ id: string; ts: string; prev?: string | null }>
  ): EntityTimelineResult => ({
    entityId: 'entity1',
    versions: versions.map((version) => ({
      versionId: version.id,
      timestamp: new Date(version.ts),
      previousVersionId: version.prev ?? null,
      hash: undefined,
      path: undefined,
      language: undefined,
      changeSetId: undefined,
      changes: [],
      metadata: undefined,
    })),
  });

  it('reports missing links without repairing when autoRepair disabled', async () => {
    const listEntities = vi
      .fn()
      .mockResolvedValueOnce({ entities: [{ id: 'entity1' }], total: 1 })
      .mockResolvedValueOnce({ entities: [], total: 1 });
    const getEntityTimeline = vi
      .fn()
      .mockResolvedValue(buildTimeline([
        { id: 'ver1', ts: '2024-01-01T00:00:00Z', prev: null },
        { id: 'ver2', ts: '2024-01-02T00:00:00Z', prev: null },
      ]));
    const repairPreviousVersionLink = vi.fn();

    const kg = {
      listEntities,
      getEntityTimeline,
      repairPreviousVersionLink,
    } as unknown as KnowledgeGraphService;

    const validator = new TemporalHistoryValidator(kg);
    const report = await validator.validate({ autoRepair: false });

    expect(report.repairedLinks).toBe(0);
    expect(report.issues).toHaveLength(1);
    expect(report.issues[0]).toMatchObject({
      type: 'missing_previous',
      repaired: false,
    });
    expect(repairPreviousVersionLink).not.toHaveBeenCalled();
  });

  it('repairs missing links when autoRepair enabled', async () => {
    const listEntities = vi
      .fn()
      .mockResolvedValueOnce({ entities: [{ id: 'entity1' }], total: 1 })
      .mockResolvedValueOnce({ entities: [], total: 1 });
    const getEntityTimeline = vi
      .fn()
      .mockResolvedValue(buildTimeline([
        { id: 'ver1', ts: '2024-01-01T00:00:00Z', prev: null },
        { id: 'ver2', ts: '2024-01-02T00:00:00Z', prev: null },
      ]));
    const repairPreviousVersionLink = vi.fn().mockResolvedValue(true);

    const kg = {
      listEntities,
      getEntityTimeline,
      repairPreviousVersionLink,
    } as unknown as KnowledgeGraphService;

    const validator = new TemporalHistoryValidator(kg);
    const report = await validator.validate({ autoRepair: true });

    expect(report.repairedLinks).toBe(1);
    expect(report.issues).toHaveLength(1);
    expect(report.issues[0]).toMatchObject({
      type: 'missing_previous',
      repaired: true,
    });
    expect(repairPreviousVersionLink).toHaveBeenCalledWith(
      'entity1',
      'ver2',
      'ver1',
      expect.objectContaining({ timestamp: expect.any(Date) })
    );
  });

  it('skips unexpected head when timeline may be truncated', async () => {
    const listEntities = vi
      .fn()
      .mockResolvedValueOnce({ entities: [{ id: 'entity1' }], total: 1 })
      .mockResolvedValueOnce({ entities: [], total: 1 });
    const timelineLimit = 10;
    const versions = Array.from({ length: timelineLimit }, (_, index) => ({
      id: `ver${index}`,
      ts: `2024-02-${String(index + 1).padStart(2, '0')}T00:00:00Z`,
      prev: index === 0 ? 'trimmed-version' : `ver${index - 1}`,
    }));
    const getEntityTimeline = vi
      .fn()
      .mockResolvedValue(
        buildTimeline([...versions].reverse())
      );
    const repairPreviousVersionLink = vi.fn();

    const kg = {
      listEntities,
      getEntityTimeline,
      repairPreviousVersionLink,
    } as unknown as KnowledgeGraphService;

    const validator = new TemporalHistoryValidator(kg);
    const report = await validator.validate({ timelineLimit });

    expect(report.issues.find((issue) => issue.type === 'unexpected_head')).toBeUndefined();
  });

  it('flags unexpected head when full history retrieved', async () => {
    const listEntities = vi
      .fn()
      .mockResolvedValueOnce({ entities: [{ id: 'entity1' }], total: 1 })
      .mockResolvedValueOnce({ entities: [], total: 1 });
    const timelineLimit = 12;
    const versions = Array.from({ length: 5 }, (_, index) => ({
      id: `ver${index}`,
      ts: `2024-03-${String(index + 1).padStart(2, '0')}T00:00:00Z`,
      prev: index === 0 ? 'legacy-version' : `ver${index - 1}`,
    }));
    const getEntityTimeline = vi
      .fn()
      .mockResolvedValue(
        buildTimeline([...versions].reverse())
      );
    const repairPreviousVersionLink = vi.fn();

    const kg = {
      listEntities,
      getEntityTimeline,
      repairPreviousVersionLink,
    } as unknown as KnowledgeGraphService;

    const validator = new TemporalHistoryValidator(kg);
    const report = await validator.validate({ timelineLimit });

    const unexpectedHead = report.issues.find((issue) => issue.type === 'unexpected_head');
    expect(unexpectedHead).toBeDefined();
    expect(unexpectedHead).toMatchObject({ entityId: 'entity1' });
  });

});

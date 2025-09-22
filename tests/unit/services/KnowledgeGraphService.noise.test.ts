import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KnowledgeGraphService } from '../../../src/services/knowledge/KnowledgeGraphService';
import { RelationshipType } from '../../../src/models/relationships';

describe('KnowledgeGraphService inferred relationship gating', () => {
  let kg: KnowledgeGraphService;
  let db: any;

  beforeEach(() => {
    db = {
      falkordbQuery: vi.fn().mockResolvedValue([]),
    };
    kg = new KnowledgeGraphService(db as any);
  });

  it('skips persisting low-confidence inferred edges', async () => {
    await kg.createRelationship({
      id: 'rel_a_b_REFERENCES_low',
      fromEntityId: 'a',
      toEntityId: 'b',
      type: RelationshipType.REFERENCES,
      created: new Date(),
      lastModified: new Date(),
      version: 1,
      metadata: { inferred: true, confidence: 0.1 },
    } as any, undefined, undefined, { validate: false });

    // DB should not be called since below threshold
    expect(db.falkordbQuery).not.toHaveBeenCalled();
  });

  it('persists inferred edges at or above threshold', async () => {
    await kg.createRelationship({
      id: 'rel_a_b_REFERENCES_ok',
      fromEntityId: 'a',
      toEntityId: 'b',
      type: RelationshipType.REFERENCES,
      created: new Date(),
      lastModified: new Date(),
      version: 1,
      metadata: { inferred: true, confidence: 0.7 },
    } as any, undefined, undefined, { validate: false });

    expect(db.falkordbQuery).toHaveBeenCalled();
  });
});


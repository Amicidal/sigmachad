import { describe, it, expect, beforeEach } from 'vitest';

import { RelationshipType } from '@memento/shared-types';
import type { GraphRelationship } from '@memento/shared-types';
import {
  createKnowledgeGraphTestHarness,
  type KnowledgeGraphTestDependencies,
} from '../../test-utils/knowledge-graph-test-helpers.js';

import { KnowledgeGraphService } from '@memento/knowledge';

describe('KnowledgeGraphService relationship delegation', () => {
  let service: KnowledgeGraphService;
  let deps: KnowledgeGraphTestDependencies;

  const lowConfidenceEdge: GraphRelationship = {
    id: 'rel-low',
    fromEntityId: 'a',
    toEntityId: 'b',
    type: RelationshipType.REFERENCES,
    created: new Date('2024-01-01T00:00:00Z'),
    lastModified: new Date('2024-01-01T00:00:00Z'),
    version: 1,
    metadata: { inferred: true, confidence: 0.1 },
  };

  const highConfidenceEdge: GraphRelationship = {
    ...lowConfidenceEdge,
    id: 'rel-high',
    metadata: { inferred: true, confidence: 0.9 },
  };

  beforeEach(() => {
    ({ service, deps } = createKnowledgeGraphTestHarness());
  });

  it('hands relationship creation to the relationship service regardless of confidence', async () => {
    await service.createRelationship(lowConfidenceEdge);
    await service.createRelationship(highConfidenceEdge);

    expect(deps.relationshipService.createRelationship).toHaveBeenCalledTimes(2);
    expect(deps.relationshipService.createRelationship).toHaveBeenNthCalledWith(1, lowConfidenceEdge);
    expect(deps.relationshipService.createRelationship).toHaveBeenNthCalledWith(2, highConfidenceEdge);
  });

  it('supports bulk creation without additional filtering', async () => {
    await service.createRelationshipsBulk([lowConfidenceEdge, highConfidenceEdge], { mergeEvidence: true });

    expect(deps.relationshipService.createRelationshipsBulk).toHaveBeenCalledWith(
      [lowConfidenceEdge, highConfidenceEdge],
      { mergeEvidence: true }
    );
  });
});

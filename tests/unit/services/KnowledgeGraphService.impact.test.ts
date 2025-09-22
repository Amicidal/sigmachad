import { describe, it, expect, beforeEach } from 'vitest';

import type { ImpactAnalysisRequest } from '../../../src/models/types.js';
import {
  createKnowledgeGraphTestHarness,
  type KnowledgeGraphTestDependencies,
} from '../../test-utils/knowledge-graph-test-helpers.js';

import { KnowledgeGraphService } from '../../../src/services/knowledge/KnowledgeGraphService.js';

describe('KnowledgeGraphService impact analysis', () => {
  let service: KnowledgeGraphService;
  let deps: KnowledgeGraphTestDependencies;

  beforeEach(() => {
    ({ service, deps } = createKnowledgeGraphTestHarness());
  });

  it('delegates analyzeImpact to the AnalysisService', async () => {
    const request: ImpactAnalysisRequest = { entityId: 'entity-1' } as any;
    const analysisResult = { affectedEntities: ['entity-1'] } as any;
    deps.analysisService.analyzeImpact.mockResolvedValue(analysisResult);

    const result = await service.analyzeImpact(request);

    expect(deps.analysisService.analyzeImpact).toHaveBeenCalledWith(request);
    expect(result).toBe(analysisResult);
  });

  it('delegates dependency lookups to the AnalysisService', async () => {
    const dependencies = { direct: ['entity-2'], transitive: [] } as any;
    deps.analysisService.getEntityDependencies.mockResolvedValue(dependencies);

    const result = await service.getEntityDependencies('entity-1');

    expect(deps.analysisService.getEntityDependencies).toHaveBeenCalledWith('entity-1', undefined);
    expect(result).toBe(dependencies);
  });
});

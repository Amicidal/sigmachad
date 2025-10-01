/**
 * Tests for documentation spec linking heuristics in docs routes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerDocsRoutes } from '@memento/api/routes/docs';
import { RelationshipType } from '@memento/shared-types';
import { createMockRequest, createMockReply } from '../../test-utils.js';

describe('Docs linking heuristics', () => {
  let mockApp: any;
  let mockKgService: any;
  let mockDbService: any;
  let mockDocParser: any;
  let syncHandler: Function;

  const createMockApp = () => {
    const routes = new Map<string, Function>();
    return {
      post: vi.fn((path: string, _opts: any, handler?: Function) => {
        const h = (typeof _opts === 'function') ? _opts : handler!;
        routes.set(`post:${path}`, h);
      }),
      get: vi.fn(),
      getRegisteredRoutes: () => routes,
    };
  };

  beforeEach(async () => {
    mockApp = createMockApp();
    mockKgService = {
      findEntitiesByType: vi.fn(),
      createRelationship: vi.fn(),
      getRelationships: vi.fn(),
      deleteRelationship: vi.fn(),
    };
    mockDbService = {};
    mockDocParser = { syncDocumentation: vi.fn().mockResolvedValue({ processedFiles: 1, newDomains: 0, updatedClusters: 0, errors: [] }) };

    await registerDocsRoutes(mockApp, mockKgService, mockDbService, mockDocParser);
    const routes = mockApp.getRegisteredRoutes();
    syncHandler = routes.get('post:/docs/sync');
  });

  it('links only when match evidence is strong and symbol is exported', async () => {
    const doc = {
      id: 'doc-1',
      type: 'documentation',
      docType: 'api-docs',
      content: 'Use VeryLongFunctionName to perform X. Also call doIt once.'
    } as any;
    const symbols = [
      { id: 'sym-1', type: 'symbol', kind: 'function', name: 'doIt', isExported: true },
      { id: 'sym-2', type: 'symbol', kind: 'function', name: 'VeryLongFunctionName', isExported: true },
      { id: 'sym-3', type: 'symbol', kind: 'function', name: 'internalHelper', isExported: false },
    ];
    mockKgService.findEntitiesByType.mockImplementation(async (t: string) => t === 'documentation' ? [doc] : (t === 'symbol' ? symbols : []));

    // Pretend there is an existing IMPLEMENTS_SPEC from non-allowed symbol to be pruned
    mockKgService.getRelationships.mockResolvedValueOnce([
      { id: 'rel-old', fromEntityId: 'sym-3', toEntityId: 'doc-1', type: RelationshipType.IMPLEMENTS_SPEC },
    ]);

    const req = createMockRequest();
    const res = createMockReply();
    (req as any).body = { docsPath: '/tmp/docs' };

    await syncHandler(req, res);

    // Should create relationship for long name (one occurrence but long)
    expect(mockKgService.createRelationship).toHaveBeenCalledWith(expect.objectContaining({
      fromEntityId: 'sym-2', toEntityId: 'doc-1', type: RelationshipType.IMPLEMENTS_SPEC
    }));
    // Should NOT create relationship for short name with single occurrence
    expect(mockKgService.createRelationship).not.toHaveBeenCalledWith(expect.objectContaining({ fromEntityId: 'sym-1' }));
    // Should prune existing non-allowed relationship
    expect(mockKgService.deleteRelationship).toHaveBeenCalledWith('rel-old');
  });
});


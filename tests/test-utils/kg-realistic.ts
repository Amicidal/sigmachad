import { vi } from 'vitest';
import { RelationshipType } from '../../src/models/relationships';

export function makeRealisticKgService(overrides: Partial<any> = {}) {
  const now = new Date();
  const entities = [
    { id: 'file-1', type: 'file', path: '/src/index.ts', language: 'typescript', lastModified: now, created: now },
    { id: 'func-1', type: 'symbol', kind: 'function', name: 'handler', signature: 'function handler()', path: '/src/index.ts', language: 'typescript', lastModified: now, created: now },
  ];

  const relationships = [
    { id: 'rel-1', type: RelationshipType.CALLS, fromEntityId: 'func-1', toEntityId: 'file-1', created: now, lastModified: now, version: 1, metadata: {} },
  ];

  const base = {
    createEntity: vi.fn().mockResolvedValue(undefined),
    updateEntity: vi.fn().mockResolvedValue(undefined),
    deleteEntity: vi.fn().mockResolvedValue(undefined),
    createRelationship: vi.fn().mockResolvedValue(undefined),
    deleteRelationship: vi.fn().mockResolvedValue(undefined),
    getEntity: vi.fn().mockImplementation(async (id: string) => entities.find(e => e.id === id) || null),
    getRelationships: vi.fn().mockResolvedValue(relationships),
    search: vi.fn().mockResolvedValue(entities),
    getEntityExamples: vi.fn().mockResolvedValue({ usageExamples: [], testExamples: [] }),
    findSymbolsByName: vi.fn().mockResolvedValue(entities.filter(e => e.type === 'symbol')),
  };

  return { ...base, ...overrides } as any;
}

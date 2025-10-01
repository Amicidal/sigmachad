/**
 * Shared mock factories for API tests
 * Provides minimally-compliant implementations for class-typed dependencies
 * to avoid TS2740 structural typing errors under strict mode.
 */

import { vi } from 'vitest';

// Utility to create a vi.fn that resolves to the provided value
const resolved = <T>(value: T) => vi.fn().mockResolvedValue(value);

export const createMockKnowledgeGraphService = (
  overrides: Record<string, any> = {}
): any => {
  const base: Record<string, any> = {
    getHistoryMetrics: resolved({
      totals: { entities: 0, relationships: 0 },
      versions: 0,
      checkpoints: 0,
      checkpointMembers: 0,
      temporalEdges: 0,
      lastPrune: undefined,
    }),
    getIndexHealth: resolved({ status: 'healthy', indexes: [], performance: {} }),
    ensureGraphIndexes: resolved(undefined),
    runBenchmarks: resolved({ mode: 'quick', results: {} }),
    // EventEmitter compatibility (not exercised by current tests)
    on: vi.fn(),
    emit: vi.fn(),
  };

  return { ...(base as any), ...(overrides as any) } as unknown as any;
};

export const createMockDatabaseService = (
  overrides: Record<string, any> = {}
): any => {
  const base: Record<string, any> = {
    getConfig: vi.fn().mockReturnValue({ version: 'test' }),
  };
  return { ...(base as any), ...(overrides as any) } as unknown as any;
};

export const createMockASTParser = (
  overrides: Record<string, any> = {}
): any => {
  const base: Record<string, any> = {
    parseFile: resolved({ entities: [], relationships: [] }),
  };
  return { ...(base as any), ...(overrides as any) } as unknown as any;
};

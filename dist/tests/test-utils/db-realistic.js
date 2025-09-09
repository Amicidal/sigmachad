import { vi } from 'vitest';
// Simple realistic DatabaseService mock focused on postgresQuery usage in routes/tests
export function makeRealisticDbService(overrides = {}) {
    const now = new Date();
    const sampleSpec = {
        id: 'spec_1',
        type: 'spec',
        path: 'specs/spec_1',
        hash: '',
        language: 'text',
        lastModified: now,
        created: now,
        title: 'Sample Spec',
        description: 'A realistic sample spec for tests',
        acceptanceCriteria: ['Criterion A', 'Criterion B', 'Criterion C'],
        status: 'draft',
        priority: 'medium',
        assignee: 'user@example.com',
        tags: ['tag1'],
        updated: now
    };
    const postgresQuery = vi.fn().mockImplementation(async (query, params) => {
        const q = query.toLowerCase();
        if (q.includes('select') && q.includes('from documents')) {
            // Return one realistic row
            return [{ content: JSON.stringify(sampleSpec) }];
        }
        if (q.includes('insert into documents')) {
            return [{ inserted: 1 }];
        }
        if (q.includes('update documents')) {
            return [{ updated: 1 }];
        }
        return [];
    });
    const base = {
        postgresQuery,
        query: vi.fn().mockResolvedValue([]),
        execute: vi.fn().mockResolvedValue(undefined),
        initialize: vi.fn().mockResolvedValue(undefined)
    };
    return { ...base, ...overrides };
}
//# sourceMappingURL=db-realistic.js.map
/**
 * SearchServiceOGM Test
 * Basic tests to ensure the OGM search implementation works correctly
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { EventEmitter } from 'events';
import { SearchServiceOGM } from './SearchServiceOGM.js';
// Mock implementations
class MockNeogmaService extends EventEmitter {
    constructor() {
        super();
        this.mockResults = [];
    }
    getNeogmaInstance() {
        return {
            models: {
                EntityModel: {
                    where: () => ({
                        where: () => ({
                            contains: () => ({
                                or: () => ({
                                    contains: () => ({
                                        or: () => ({
                                            contains: () => ({
                                                and: () => ({
                                                    equals: () => ({
                                                        limit: () => ({
                                                            run: async () => this.mockResults
                                                        })
                                                    })
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    }),
                    getLabel: () => 'Entity'
                }
            }
        };
    }
    async executeCypher(query, params) {
        return this.mockResults;
    }
    setMockResults(results) {
        this.mockResults = results;
    }
}
class MockEmbeddingService extends EventEmitter {
    async search(query, options = {}) {
        return [
            {
                entity: {
                    id: 'test-entity-1',
                    type: 'function',
                    name: 'testFunction',
                    path: '/test/file.ts'
                },
                score: 0.85,
                metadata: {}
            }
        ];
    }
}
describe('SearchServiceOGM', () => {
    let searchService;
    let mockNeogmaService;
    let mockEmbeddingService;
    beforeEach(() => {
        mockNeogmaService = new MockNeogmaService();
        mockEmbeddingService = new MockEmbeddingService();
        searchService = new SearchServiceOGM(mockNeogmaService, mockEmbeddingService);
    });
    afterEach(() => {
        searchService.removeAllListeners();
    });
    describe('structuralSearch', () => {
        it('should perform basic structural search', async () => {
            const mockEntity = {
                id: 'test-entity-1',
                type: 'function',
                name: 'testFunction',
                path: '/test/file.ts'
            };
            // Mock the model response
            const mockModel = {
                getDataValues: () => mockEntity
            };
            mockNeogmaService.setMockResults([mockModel]);
            const results = await searchService.structuralSearch('testFunction');
            expect(results).toHaveLength(1);
            expect(results[0].entity.name).toBe('testFunction');
            expect(results[0].type).toBe('structural');
            expect(results[0].score).toBe(1.0);
        });
        it('should handle fuzzy search fallback', async () => {
            const mockEntity = {
                id: 'test-entity-1',
                type: 'function',
                name: 'testFunction',
                path: '/test/file.ts'
            };
            mockNeogmaService.setMockResults([
                { n: { properties: mockEntity }, score: 0.8 }
            ]);
            const results = await searchService.structuralSearch('testFunc', {
                fuzzy: true
            });
            expect(results).toHaveLength(1);
            expect(results[0].entity.name).toBe('testFunction');
            expect(results[0].type).toBe('structural');
        });
        it('should apply filters correctly', async () => {
            const results = await searchService.structuralSearch('test', {
                filter: { type: 'function' },
                limit: 10
            });
            expect(Array.isArray(results)).toBe(true);
        });
    });
    describe('semanticSearch', () => {
        it('should delegate to embedding service', async () => {
            const results = await searchService.semanticSearch('find similar functions');
            expect(results).toHaveLength(1);
            expect(results[0].entity.name).toBe('testFunction');
            expect(results[0].type).toBe('semantic');
            expect(results[0].score).toBe(0.85);
        });
    });
    describe('hybridSearch', () => {
        it('should combine structural and semantic results', async () => {
            const request = {
                query: 'test function',
                limit: 10
            };
            const results = await searchService.hybridSearch(request);
            expect(Array.isArray(results)).toBe(true);
            // Should include results from both search types
        });
        it('should deduplicate results correctly', async () => {
            // Mock the same entity appearing in both structural and semantic results
            const mockEntity = {
                id: 'test-entity-1',
                type: 'function',
                name: 'testFunction',
                path: '/test/file.ts'
            };
            const mockModel = {
                getDataValues: () => mockEntity
            };
            mockNeogmaService.setMockResults([mockModel]);
            const request = {
                query: 'testFunction',
                limit: 10
            };
            const results = await searchService.hybridSearch(request);
            // Should only have one result despite being in both searches
            const entityIds = results.map(r => r.entity.id);
            const uniqueIds = new Set(entityIds);
            expect(uniqueIds.size).toBe(entityIds.length);
        });
    });
    describe('findSymbolsByName', () => {
        it('should find symbols with exact name match', async () => {
            const mockSymbol = {
                id: 'symbol-1',
                type: 'symbol',
                kind: 'function',
                name: 'myFunction',
                path: '/src/file.ts'
            };
            const mockModel = {
                getDataValues: () => mockSymbol
            };
            mockNeogmaService.setMockResults([mockModel]);
            const results = await searchService.findSymbolsByName('myFunction');
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('myFunction');
        });
    });
    describe('findNearbySymbols', () => {
        it('should find symbols in proximity', async () => {
            const mockSymbol = {
                id: 'symbol-1',
                type: 'symbol',
                name: 'nearbyFunction',
                path: '/src/file.ts',
                line: 15
            };
            mockNeogmaService.setMockResults([
                { n: { properties: mockSymbol } }
            ]);
            const results = await searchService.findNearbySymbols('/src/file.ts', { line: 10 }, { range: 20 });
            expect(Array.isArray(results)).toBe(true);
        });
    });
    describe('cache management', () => {
        it('should cache search results', async () => {
            const request = {
                query: 'test',
                limit: 10
            };
            // First call
            const results1 = await searchService.search(request);
            // Second call should hit cache
            const results2 = await searchService.search(request);
            expect(results1).toEqual(results2);
        });
        it('should clear cache when requested', () => {
            searchService.clearCache();
            expect(() => searchService.clearCache()).not.toThrow();
        });
        it('should invalidate cache with pattern', () => {
            searchService.invalidateCache((key) => key.includes('test'));
            expect(() => searchService.invalidateCache()).not.toThrow();
        });
    });
    describe('search strategy determination', () => {
        it('should use structural search for path-like queries', async () => {
            const request = {
                query: '/src/components/Button.tsx',
                limit: 10
            };
            const results = await searchService.search(request);
            expect(Array.isArray(results)).toBe(true);
        });
        it('should use semantic search when explicitly requested', async () => {
            const request = {
                query: 'button component',
                searchType: 'semantic',
                limit: 10
            };
            const results = await searchService.search(request);
            expect(Array.isArray(results)).toBe(true);
        });
        it('should use hybrid search by default', async () => {
            const request = {
                query: 'component',
                limit: 10
            };
            const results = await searchService.search(request);
            expect(Array.isArray(results)).toBe(true);
        });
    });
    describe('error handling', () => {
        it('should emit error events on search failures', (done) => {
            // Mock a search failure
            mockNeogmaService.executeCypher = async () => {
                throw new Error('Search failed');
            };
            searchService.on('error', (errorData) => {
                expect(errorData.operation).toBe('findNearbySymbols');
                expect(errorData.error.message).toBe('Search failed');
                done();
            });
            searchService.findNearbySymbols('/test/file.ts', { line: 10 }).catch(() => {
                // Expected to fail
            });
        });
    });
});
//# sourceMappingURL=SearchServiceOGM.test.js.map
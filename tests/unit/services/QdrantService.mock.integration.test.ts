import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QdrantService } from '../../../src/services/database/QdrantService';

type Point = { id: string; vector: number[]; payload?: Record<string, unknown> };

vi.mock('@qdrant/js-client-rest', () => {
  type MockPoint = { id: string; vector: number[]; payload?: Record<string, unknown> };
  type CollectionRecord = Map<string, MockPoint>;

  class MockQdrantClient {
    private collections = new Map<string, CollectionRecord>();

    constructor(_config: { url: string; apiKey?: string }) {}

    async getCollections(): Promise<any> {
      return {
        collections: Array.from(this.collections.keys()).map((name) => ({ name })),
      };
    }

    async createCollection(name: string, _options: any): Promise<any> {
      if (!this.collections.has(name)) {
        this.collections.set(name, new Map());
      }
      return { result: 'created' };
    }

    async deleteCollection(name: string): Promise<any> {
      this.collections.delete(name);
      return { result: 'deleted' };
    }

    async delete(collectionName: string, options: { points?: string[] }): Promise<any> {
      const collection = this.collections.get(collectionName);
      if (!collection) {
        return { result: 'noop' };
      }
      for (const pointId of options.points ?? []) {
        collection.delete(pointId);
      }
      return { result: 'deleted' };
    }

    async upsert(collectionName: string, payload: { points: MockPoint[] }): Promise<any> {
      const collection = this.collections.get(collectionName);
      if (!collection) {
        throw new Error(`Collection ${collectionName} not found`);
      }
      for (const point of payload.points) {
        collection.set(point.id, point);
      }
      return { result: { points_count: payload.points.length } };
    }

    async scroll(collectionName: string, _options: any): Promise<any> {
      const collection = this.collections.get(collectionName) ?? new Map();
      return {
        points: Array.from(collection.values()),
      };
    }

    async search(collectionName: string, _options: any): Promise<any> {
      const collection = this.collections.get(collectionName) ?? new Map();
      return Array.from(collection.values()).map((point) => ({
        id: point.id,
        payload: point.payload,
        score: 0.5,
      }));
    }

    async getCollection(_name: string): Promise<any> {
      return {};
    }

    async deletePoints(collectionName: string, options: { points: string[] }): Promise<any> {
      return this.delete(collectionName, options);
    }

    async updateCollection(_name: string, _options: any): Promise<any> {
      return {};
    }
  }

  return { QdrantClient: MockQdrantClient };
});

describe('QdrantService with mocked client', () => {
  let service: QdrantService;

  beforeEach(() => {
    service = new QdrantService({ url: 'http://mock-qdrant.local' });
  });

  it('initializes and sets up default collections', async () => {
    await service.initialize();
    await service.setupCollections();

    const client = service.getClient();
    const collections = await client.getCollections();
    const names = collections.collections.map((c: any) => c.name);

    expect(names).toEqual(
      expect.arrayContaining([
        'code_embeddings',
        'documentation_embeddings',
        'integration_test',
      ])
    );
  });

  it('upserts and retrieves vector data', async () => {
    await service.initialize();
    await service.createCollection('integration_test', {
      vectors: { size: 3, distance: 'Cosine' },
    });

    const point: Point = {
      id: 'fixture-point',
      vector: [0.1, 0.2, 0.3],
      payload: { kind: 'fixture' },
    };

    await service.upsert('integration_test', { points: [point] });
    const scrollResult = await service.scroll('integration_test', { limit: 10 });

    expect(scrollResult.points).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'fixture-point',
          payload: expect.objectContaining({ kind: 'fixture' }),
        }),
      ])
    );
  });
});

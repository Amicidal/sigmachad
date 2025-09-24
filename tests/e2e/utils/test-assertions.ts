import { expect } from 'vitest';
import { ApiResponse } from './test-client';

export class TestAssertions {
  // HTTP Response Assertions
  assertSuccessResponse<T>(response: ApiResponse<T>, expectedStatus: number = 200): void {
    expect(response.statusCode).toBe(expectedStatus);
    expect(response.body).toBeDefined();
  }

  assertErrorResponse<T>(response: ApiResponse<T>, expectedStatus: number, expectedMessage?: string): void {
    expect(response.statusCode).toBe(expectedStatus);
    if (expectedMessage) {
      expect(response.body).toMatchObject({
        error: expect.stringContaining(expectedMessage),
      });
    }
  }

  assertValidationError<T>(response: ApiResponse<T>): void {
    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({
      error: expect.stringMatching(/validation|invalid|required/i),
    });
  }

  assertUnauthorized<T>(response: ApiResponse<T>): void {
    expect(response.statusCode).toBe(401);
    expect(response.body).toMatchObject({
      error: expect.stringMatching(/unauthorized|authentication/i),
    });
  }

  assertForbidden<T>(response: ApiResponse<T>): void {
    expect(response.statusCode).toBe(403);
    expect(response.body).toMatchObject({
      error: expect.stringMatching(/forbidden|permission/i),
    });
  }

  assertNotFound<T>(response: ApiResponse<T>): void {
    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchObject({
      error: expect.stringMatching(/not found/i),
    });
  }

  assertRateLimited<T>(response: ApiResponse<T>): void {
    expect(response.statusCode).toBe(429);
    expect(response.headers['retry-after']).toBeDefined();
    expect(response.body).toMatchObject({
      error: expect.stringMatching(/rate limit|too many requests/i),
    });
  }

  // Authentication Assertions
  assertValidAuthToken(token: string): void {
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
    // Basic JWT structure check
    expect(token.split('.')).toHaveLength(3);
  }

  assertValidApiKey(apiKey: string): void {
    expect(apiKey).toBeDefined();
    expect(typeof apiKey).toBe('string');
    expect(apiKey).toMatch(/^mk-[a-f0-9-]{36}$/); // Format: mk-{uuid}
  }

  // Knowledge Graph Assertions
  assertValidEntity(entity: any): void {
    expect(entity).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      type: expect.any(String),
    });
    expect(entity.id).toMatch(/^[a-f0-9-]{36}$/); // UUID format
  }

  assertValidRelationship(relationship: any): void {
    expect(relationship).toMatchObject({
      id: expect.any(String),
      fromId: expect.any(String),
      toId: expect.any(String),
      type: expect.any(String),
    });
  }

  assertEntityHasRelationships(entity: any, expectedTypes: string[]): void {
    expect(entity.relationships).toBeDefined();
    expect(Array.isArray(entity.relationships)).toBe(true);

    for (const type of expectedTypes) {
      expect(entity.relationships.some((rel: any) => rel.type === type)).toBe(true);
    }
  }

  // Search Assertions
  assertValidSearchResults(results: any, query?: string): void {
    expect(results).toMatchObject({
      items: expect.any(Array),
      total: expect.any(Number),
      page: expect.any(Number),
      pageSize: expect.any(Number),
    });

    if (query) {
      // Check that results are relevant to the query
      for (const item of results.items) {
        const relevantFields = [item.name, item.description, item.content].filter(Boolean);
        const hasRelevantContent = relevantFields.some(field =>
          field.toLowerCase().includes(query.toLowerCase())
        );
        expect(hasRelevantContent).toBe(true);
      }
    }
  }

  assertSemanticSearchResults(results: any): void {
    expect(results).toMatchObject({
      items: expect.any(Array),
      total: expect.any(Number),
    });

    // Each result should have a similarity score
    for (const item of results.items) {
      expect(item).toMatchObject({
        entity: expect.any(Object),
        score: expect.any(Number),
      });
      expect(item.score).toBeGreaterThanOrEqual(0);
      expect(item.score).toBeLessThanOrEqual(1);
    }

    // Results should be sorted by score (descending)
    for (let i = 1; i < results.items.length; i++) {
      expect(results.items[i].score).toBeLessThanOrEqual(results.items[i - 1].score);
    }
  }

  // WebSocket Assertions
  assertValidWebSocketMessage(message: any): void {
    expect(message).toMatchObject({
      id: expect.any(String),
      type: expect.any(String),
      timestamp: expect.any(String),
    });

    // Validate timestamp format
    expect(new Date(message.timestamp).toISOString()).toBe(message.timestamp);
  }

  assertWebSocketEvent(message: any, expectedType: string, expectedPayload?: any): void {
    this.assertValidWebSocketMessage(message);
    expect(message.type).toBe(expectedType);

    if (expectedPayload) {
      expect(message.payload).toMatchObject(expectedPayload);
    }
  }

  // Performance Assertions
  assertResponseTime(startTime: number, maxMs: number): void {
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(maxMs);
  }

  assertBatchProcessingPerformance(
    itemCount: number,
    processingTimeMs: number,
    minItemsPerSecond: number
  ): void {
    const itemsPerSecond = (itemCount / processingTimeMs) * 1000;
    expect(itemsPerSecond).toBeGreaterThanOrEqual(minItemsPerSecond);
  }

  // Data Integrity Assertions
  assertNoDuplicateIds(items: Array<{ id: string }>): void {
    const ids = items.map(item => item.id);
    const uniqueIds = [...new Set(ids)];
    expect(uniqueIds).toHaveLength(ids.length);
  }

  assertConsistentTimestamps(items: Array<{ createdAt?: string; updatedAt?: string }>): void {
    for (const item of items) {
      if (item.createdAt) {
        expect(new Date(item.createdAt).toISOString()).toBe(item.createdAt);
      }
      if (item.updatedAt) {
        expect(new Date(item.updatedAt).toISOString()).toBe(item.updatedAt);
      }
      if (item.createdAt && item.updatedAt) {
        expect(new Date(item.updatedAt).getTime()).toBeGreaterThanOrEqual(
          new Date(item.createdAt).getTime()
        );
      }
    }
  }

  // Custom Assertion Helpers
  async assertEventuallyTrue(
    condition: () => Promise<boolean> | boolean,
    timeoutMs: number = 5000,
    intervalMs: number = 100
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const result = await condition();
      if (result) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error(`Condition was not met within ${timeoutMs}ms`);
  }

  async assertEventuallyEquals<T>(
    getValue: () => Promise<T> | T,
    expectedValue: T,
    timeoutMs: number = 5000,
    intervalMs: number = 100
  ): Promise<void> {
    await this.assertEventuallyTrue(async () => {
      const value = await getValue();
      return value === expectedValue;
    }, timeoutMs, intervalMs);
  }
}
import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import neo4j from 'neo4j-driver';
import { Client as QdrantClient } from '@qdrant/js-client-rest';
import { Client as PostgresClient } from 'pg';
import { createClient as createRedisClient } from 'redis';
import { TestClient } from './test-client';
import { MockDataGenerator } from './mock-data-generator';
import { TestAssertions } from './test-assertions';

export interface TestServices {
  api: FastifyInstance;
  neo4j: neo4j.Driver;
  qdrant: QdrantClient;
  postgres: PostgresClient;
  redis: ReturnType<typeof createRedisClient>;
}

export class TestEnvironment {
  private services: Partial<TestServices> = {};
  private clients: TestClient[] = [];
  private webSockets: WebSocket[] = [];

  public readonly mockData: MockDataGenerator;
  public readonly assertions: TestAssertions;

  constructor() {
    this.mockData = new MockDataGenerator();
    this.assertions = new TestAssertions();
  }

  async waitForServices(): Promise<void> {
    const maxAttempts = 30;
    const retryDelay = 2000;

    // Wait for Neo4j
    for (let i = 0; i < maxAttempts; i++) {
      try {
        this.services.neo4j = neo4j.driver(
          process.env.NEO4J_URI || 'bolt://localhost:7687',
          neo4j.auth.basic(
            process.env.NEO4J_USER || 'neo4j',
            process.env.NEO4J_PASSWORD || 'password'
          )
        );
        await this.services.neo4j.verifyConnectivity();
        console.log('Neo4j connected');
        break;
      } catch (error) {
        if (i === maxAttempts - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    // Wait for Qdrant
    for (let i = 0; i < maxAttempts; i++) {
      try {
        this.services.qdrant = new QdrantClient({
          url: process.env.QDRANT_URL || 'http://localhost:6333',
        });
        await this.services.qdrant.getCollections();
        console.log('Qdrant connected');
        break;
      } catch (error) {
        if (i === maxAttempts - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    // Wait for PostgreSQL
    for (let i = 0; i < maxAttempts; i++) {
      try {
        this.services.postgres = new PostgresClient({
          host: process.env.POSTGRES_HOST || 'localhost',
          port: parseInt(process.env.POSTGRES_PORT || '5432'),
          database: process.env.POSTGRES_DB || 'memento_test',
          user: process.env.POSTGRES_USER || 'postgres',
          password: process.env.POSTGRES_PASSWORD || 'password',
        });
        await this.services.postgres.connect();
        console.log('PostgreSQL connected');
        break;
      } catch (error) {
        if (i === maxAttempts - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    // Wait for Redis
    for (let i = 0; i < maxAttempts; i++) {
      try {
        this.services.redis = createRedisClient({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
        });
        await this.services.redis.connect();
        console.log('Redis connected');
        break;
      } catch (error) {
        if (i === maxAttempts - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    // Start the API server
    await this.startApiServer();
  }

  private async startApiServer(): Promise<void> {
    // Import and start the main application
    const { default: createApp } = await import('@memento/main/index');

    this.services.api = await createApp({
      logger: { level: 'error' },
      disableRequestLogging: true,
    });

    await this.services.api.listen({
      port: 0, // Let OS assign available port
      host: '127.0.0.1',
    });

    console.log(`API server started on port ${this.services.api.server.address()?.port}`);
  }

  async resetDatabases(): Promise<void> {
    // Clear Neo4j
    if (this.services.neo4j) {
      const session = this.services.neo4j.session();
      try {
        await session.run('MATCH (n) DETACH DELETE n');
      } finally {
        await session.close();
      }
    }

    // Clear Qdrant collections
    if (this.services.qdrant) {
      try {
        const collections = await this.services.qdrant.getCollections();
        for (const collection of collections.collections) {
          await this.services.qdrant.deleteCollection(collection.name);
        }
      } catch (error) {
        // Collections might not exist yet
      }
    }

    // Clear PostgreSQL tables
    if (this.services.postgres) {
      await this.services.postgres.query('TRUNCATE TABLE sessions, test_runs, rollback_points CASCADE');
    }

    // Clear Redis
    if (this.services.redis) {
      await this.services.redis.flushAll();
    }
  }

  async cleanupTestArtifacts(): Promise<void> {
    // Close WebSocket connections
    for (const ws of this.webSockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }
    this.webSockets = [];

    // Clean up test clients
    for (const client of this.clients) {
      await client.cleanup();
    }
    this.clients = [];
  }

  async cleanup(): Promise<void> {
    await this.cleanupTestArtifacts();

    // Close service connections
    if (this.services.neo4j) {
      await this.services.neo4j.close();
    }

    if (this.services.postgres) {
      await this.services.postgres.end();
    }

    if (this.services.redis) {
      await this.services.redis.disconnect();
    }

    if (this.services.api) {
      await this.services.api.close();
    }
  }

  createTestClient(): TestClient {
    if (!this.services.api) {
      throw new Error('API server not started');
    }

    const address = this.services.api.server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Cannot determine API server address');
    }

    const client = new TestClient({
      baseUrl: `http://127.0.0.1:${address.port}`,
      timeout: 30000,
    });

    this.clients.push(client);
    return client;
  }

  createWebSocketConnection(path: string): WebSocket {
    if (!this.services.api) {
      throw new Error('API server not started');
    }

    const address = this.services.api.server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Cannot determine API server address');
    }

    const ws = new WebSocket(`ws://127.0.0.1:${address.port}${path}`);
    this.webSockets.push(ws);
    return ws;
  }

  getServices(): TestServices {
    if (!this.services.api || !this.services.neo4j || !this.services.qdrant ||
        !this.services.postgres || !this.services.redis) {
      throw new Error('Services not fully initialized');
    }

    return this.services as TestServices;
  }
}
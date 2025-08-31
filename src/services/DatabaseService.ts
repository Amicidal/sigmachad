/**
 * Database Service for Memento
 * Manages connections to FalkorDB, Qdrant, and PostgreSQL
 */

import { createClient as createRedisClient, RedisClientType } from 'redis';
import { QdrantClient } from '@qdrant/js-client-rest';
import { Pool } from 'pg';

export interface DatabaseConfig {
  falkordb: {
    url: string;
    database?: number;
  };
  qdrant: {
    url: string;
    apiKey?: string;
  };
  postgresql: {
    connectionString: string;
    max?: number;
    idleTimeoutMillis?: number;
  };
  redis?: {
    url: string;
  };
}

export class DatabaseService {
  private falkordbClient!: RedisClientType;
  private qdrantClient!: QdrantClient;
  private postgresPool!: Pool;
  private redisClient?: RedisClientType;
  private initialized = false;

  constructor(private config: DatabaseConfig) {}

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize FalkorDB (Redis-based)
      this.falkordbClient = createRedisClient({
        url: this.config.falkordb.url,
        database: this.config.falkordb.database || 0,
      });

      await this.falkordbClient.connect();

      // Initialize Qdrant
      this.qdrantClient = new QdrantClient({
        url: this.config.qdrant.url,
        apiKey: this.config.qdrant.apiKey,
      });

      // Test Qdrant connection
      await this.qdrantClient.getCollections();

      // Initialize PostgreSQL
      this.postgresPool = new Pool({
        connectionString: this.config.postgresql.connectionString,
        max: this.config.postgresql.max || 20,
        idleTimeoutMillis: this.config.postgresql.idleTimeoutMillis || 30000,
      });

      // Test PostgreSQL connection
      const client = await this.postgresPool.connect();
      await client.query('SELECT NOW()');
      client.release();

      // Initialize Redis (optional, for caching)
      if (this.config.redis) {
        this.redisClient = createRedisClient({
          url: this.config.redis.url,
        });
        await this.redisClient.connect();
      }

      this.initialized = true;
      console.log('✅ All database connections established');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.falkordbClient) {
      await this.falkordbClient.disconnect();
    }

    if (this.postgresPool) {
      await this.postgresPool.end();
    }

    if (this.redisClient) {
      await this.redisClient.disconnect();
    }

    this.initialized = false;
  }

  // FalkorDB operations
  async falkordbQuery(query: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      // FalkorDB doesn't support parameterized queries like traditional databases
      // We need to substitute parameters directly in the query string
      let processedQuery = query;
      
      // Replace $param placeholders with actual values
      for (const [key, value] of Object.entries(params)) {
        const placeholder = `$${key}`;
        let replacementValue: string;
        
        if (typeof value === 'string') {
          // Escape single quotes in strings and wrap in quotes
          replacementValue = `'${value.replace(/'/g, "\\'")}'`;
        } else if (typeof value === 'object' && value !== null) {
          // For objects, convert to property format for Cypher
          replacementValue = this.objectToCypherProperties(value);
        } else if (value === null || value === undefined) {
          replacementValue = 'null';
        } else {
          replacementValue = String(value);
        }
        
        processedQuery = processedQuery.replace(new RegExp(`\\${placeholder}`, 'g'), replacementValue);
      }

      const result = await this.falkordbClient.sendCommand(['GRAPH.QUERY', 'memento', processedQuery]);

      // FalkorDB returns results in a specific format:
      // [headers, data, statistics]
      if (result && Array.isArray(result)) {
        if (result.length === 3) {
          // Standard query result format
          const headers = result[0] as any;
          const data = result[1] as any;
          
          // If there's no data, return empty array
          if (!data || (Array.isArray(data) && data.length === 0)) {
            return [];
          }
          
          // Parse the data into objects using headers
          if (Array.isArray(headers) && Array.isArray(data)) {
            return data.map((row: any) => {
              const obj: Record<string, any> = {};
              if (Array.isArray(row)) {
                headers.forEach((header: any, index: number) => {
                  const headerName = String(header);
                  obj[headerName] = row[index];
                });
              }
              return obj;
            });
          }
          
          return data;
        } else if (result.length === 1) {
          // Write operation result (CREATE, SET, DELETE)
          return result[0];
        }
      }

      return result;
    } catch (error) {
      console.error('FalkorDB query error:', error);
      console.error('Query was:', query);
      console.error('Params were:', params);
      throw error;
    }
  }

  private objectToCypherProperties(obj: Record<string, any>): string {
    const props = Object.entries(obj)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}: '${value.replace(/'/g, "\\'")}'`;
        } else if (value === null || value === undefined) {
          return `${key}: null`;
        } else {
          return `${key}: ${value}`;
        }
      })
      .join(', ');
    return `{${props}}`;
  }

  async falkordbCommand(...args: any[]): Promise<any> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    return this.falkordbClient.sendCommand(args);
  }

  // Qdrant operations
  get qdrant(): QdrantClient {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }
    return this.qdrantClient;
  }

  // PostgreSQL operations
  async postgresQuery(query: string, params: any[] = []): Promise<any> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    const client = await this.postgresPool.connect();
    try {
      const result = await client.query(query, params);
      return result;
    } finally {
      client.release();
    }
  }

  async postgresTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    const client = await this.postgresPool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Redis operations (optional caching)
  async redisGet(key: string): Promise<string | null> {
    if (!this.redisClient) {
      throw new Error('Redis not configured');
    }
    return this.redisClient.get(key);
  }

  async redisSet(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.redisClient) {
      throw new Error('Redis not configured');
    }

    if (ttl) {
      await this.redisClient.setEx(key, ttl, value);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async redisDel(key: string): Promise<number> {
    if (!this.redisClient) {
      throw new Error('Redis not configured');
    }
    return this.redisClient.del(key);
  }

  // Health checks
  async healthCheck(): Promise<{
    falkordb: boolean;
    qdrant: boolean;
    postgresql: boolean;
    redis?: boolean;
  }> {
    const results = {
      falkordb: false,
      qdrant: false,
      postgresql: false,
      redis: undefined as boolean | undefined,
    };

    try {
      await this.falkordbClient.ping();
      results.falkordb = true;
    } catch (error) {
      console.error('FalkorDB health check failed:', error);
    }

    try {
      // Check if Qdrant is accessible by attempting to get collection info
      await this.qdrantClient.getCollections();
      results.qdrant = true;
    } catch (error) {
      console.error('Qdrant health check failed:', error);
    }

    try {
      const client = await this.postgresPool.connect();
      await client.query('SELECT 1');
      client.release();
      results.postgresql = true;
    } catch (error) {
      console.error('PostgreSQL health check failed:', error);
    }

    if (this.redisClient) {
      try {
        await this.redisClient.ping();
        results.redis = true;
      } catch (error) {
        console.error('Redis health check failed:', error);
        results.redis = false;
      }
    }

    return results;
  }

  // Database setup and migrations
  async setupDatabase(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    console.log('🔧 Setting up database schema...');

    // PostgreSQL schema setup
    const postgresSchema = `
      -- Create extensions
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pg_trgm";

      -- Documents table for storing various document types
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        type VARCHAR(50) NOT NULL,
        content JSONB,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Indexes for documents
      CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
      CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
      CREATE INDEX IF NOT EXISTS idx_documents_content_gin ON documents USING GIN(content);

      -- Sessions table for tracking AI agent sessions
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        agent_type VARCHAR(50) NOT NULL,
        user_id VARCHAR(255),
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) DEFAULT 'active',
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Changes table for tracking codebase changes
      CREATE TABLE IF NOT EXISTS changes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        change_type VARCHAR(20) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        author VARCHAR(255),
        commit_hash VARCHAR(255),
        diff TEXT,
        previous_state JSONB,
        new_state JSONB,
        session_id UUID REFERENCES sessions(id),
        spec_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Indexes for changes
      CREATE INDEX IF NOT EXISTS idx_changes_entity_id ON changes(entity_id);
      CREATE INDEX IF NOT EXISTS idx_changes_timestamp ON changes(timestamp);
      CREATE INDEX IF NOT EXISTS idx_changes_session_id ON changes(session_id);

      -- Test results table
      CREATE TABLE IF NOT EXISTS test_results (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        test_id VARCHAR(255) NOT NULL,
        test_suite VARCHAR(255),
        test_name VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL,
        duration INTEGER,
        error_message TEXT,
        stack_trace TEXT,
        coverage JSONB,
        performance JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Indexes for test results
      CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON test_results(test_id);
      CREATE INDEX IF NOT EXISTS idx_test_results_timestamp ON test_results(timestamp);
      CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);
    `;

    await this.postgresQuery(postgresSchema);

    // FalkorDB graph setup
    try {
      // Create graph if it doesn't exist
      await this.falkordbCommand('GRAPH.QUERY', 'memento', 'MATCH (n) RETURN count(n) LIMIT 1');
    } catch (error) {
      // Graph doesn't exist, it will be created on first write
      console.log('📊 FalkorDB graph will be created on first write operation');
    }

    // Qdrant setup
    try {
      // Create collections if they don't exist
      const collections = await this.qdrantClient.getCollections();

      const existingCollections = collections.collections.map(c => c.name);

      if (!existingCollections.includes('code_embeddings')) {
        await this.qdrantClient.createCollection('code_embeddings', {
          vectors: {
            size: 1536, // OpenAI Ada-002 dimensions
            distance: 'Cosine',
          },
        });
      }

      if (!existingCollections.includes('documentation_embeddings')) {
        await this.qdrantClient.createCollection('documentation_embeddings', {
          vectors: {
            size: 1536,
            distance: 'Cosine',
          },
        });
      }

      console.log('✅ Database schema setup complete');
    } catch (error) {
      console.error('❌ Database setup failed:', error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

// Singleton instance
let databaseService: DatabaseService | null = null;

export function getDatabaseService(config?: DatabaseConfig): DatabaseService {
  if (!databaseService) {
    if (!config) {
      throw new Error('Database config required for first initialization');
    }
    databaseService = new DatabaseService(config);
  }
  return databaseService;
}

export function createDatabaseConfig(): DatabaseConfig {
  return {
    falkordb: {
      url: process.env.FALKORDB_URL || 'redis://localhost:6379',
      database: 0,
    },
    qdrant: {
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
    },
    postgresql: {
      connectionString: process.env.DATABASE_URL || 'postgresql://memento:memento@localhost:5432/memento',
      max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    },
    redis: process.env.REDIS_URL ? {
      url: process.env.REDIS_URL,
    } : undefined,
  };
}

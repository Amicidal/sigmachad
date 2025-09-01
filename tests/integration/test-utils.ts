/**
 * Shared test utilities for consistent test setup and teardown
 */

import { DatabaseService, createTestDatabaseConfig } from '../src/services/DatabaseService.js';
import { KnowledgeGraphService } from '../src/services/KnowledgeGraphService.js';
import { ASTParser } from '../src/services/ASTParser.js';
import { FileWatcher } from '../src/services/FileWatcher.js';

export interface TestServices {
  dbService: DatabaseService;
  kgService: KnowledgeGraphService;
  astParser: ASTParser;
  fileWatcher: FileWatcher;
}

export class TestSetup {
  private services: TestServices | null = null;

  /**
   * Initialize all test services
   */
  async initialize(): Promise<TestServices> {
    if (this.services) {
      return this.services;
    }

    const dbConfig = createTestDatabaseConfig();
    const dbService = new DatabaseService(dbConfig);
    await dbService.initialize();

    const kgService = new KnowledgeGraphService(dbService);
    await kgService.initialize();

    const astParser = new ASTParser();
    const fileWatcher = new FileWatcher();

    this.services = {
      dbService,
      kgService,
      astParser,
      fileWatcher
    };

    return this.services;
  }

  /**
   * Clean up test data between tests
   */
  async cleanup(): Promise<void> {
    if (!this.services) return;

    const { dbService } = this.services;

    // Clean up test entities and relationships
    try {
      await dbService.falkordbQuery('MATCH (n) WHERE n.id STARTS WITH "test_" DELETE n');
      await dbService.falkordbQuery('MATCH ()-[r]-() WHERE r.id STARTS WITH "test_" DELETE r');
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Close all services
   */
  async close(): Promise<void> {
    if (!this.services) return;

    const { dbService } = this.services;
    await dbService.close();
    this.services = null;
  }

  /**
   * Get current services (must call initialize first)
   */
  getServices(): TestServices {
    if (!this.services) {
      throw new Error('Services not initialized. Call initialize() first.');
    }
    return this.services;
  }
}

/**
 * Create a test entity for use in tests
 */
export function createTestEntity(overrides: Partial<any> = {}) {
  return {
    id: `test_entity_${Date.now()}`,
    type: 'file',
    path: '/test/file.ts',
    hash: 'test_hash',
    language: 'typescript',
    size: 100,
    lines: 10,
    lastModified: new Date(),
    created: new Date(),
    extension: '.ts',
    isTest: false,
    isConfig: false,
    dependencies: [],
    ...overrides
  };
}

/**
 * Create a test relationship for use in tests
 */
export function createTestRelationship(fromId: string, toId: string, overrides: Partial<any> = {}) {
  return {
    id: `test_rel_${Date.now()}`,
    type: 'imports',
    fromEntityId: fromId,
    toEntityId: toId,
    created: new Date(),
    lastModified: new Date(),
    version: 1,
    metadata: {
      importType: 'named',
      importedNames: ['testFunction']
    },
    ...overrides
  };
}

/**
 * Global test setup instance for reuse across tests
 */
export const testSetup = new TestSetup();

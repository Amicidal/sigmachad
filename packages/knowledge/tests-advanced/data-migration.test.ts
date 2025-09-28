/**
 * Data Migration E2E Tests
 * Tests version upgrades, downgrades, schema migrations, and large dataset performance
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { setTimeout as sleep } from 'timers/promises';

// Migration test infrastructure
interface SchemaVersion {
  version: string;
  description: string;
  schema: any;
  migrationUp?: (data: any) => Promise<any>;
  migrationDown?: (data: any) => Promise<any>;
  dataTransform?: (entities: any[], relationships: any[]) => { entities: any[], relationships: any[] };
}

interface MigrationStep {
  id: string;
  fromVersion: string;
  toVersion: string;
  direction: 'up' | 'down';
  timestamp: number;
  success: boolean;
  duration: number;
  dataSize: number;
  errors?: string[];
}

class DataMigrationTestRunner {
  private currentVersion: string = '1.0.0';
  private migrationHistory: MigrationStep[] = [];
  private dataStore: Map<string, any> = new Map();
  private backups: Map<string, any> = new Map();
  private testDir: string;

  constructor(testDir: string) {
    this.testDir = testDir;
  }

  async initializeDataStore(entities: any[], relationships: any[]): Promise<void> {
    this.dataStore.set('entities', [...entities]);
    this.dataStore.set('relationships', [...relationships]);
    this.dataStore.set('metadata', {
      version: this.currentVersion,
      created: Date.now(),
      entityCount: entities.length,
      relationshipCount: relationships.length
    });
  }

  async createBackup(name: string): Promise<void> {
    const backup = {
      version: this.currentVersion,
      data: {
        entities: this.dataStore.get('entities') || [],
        relationships: this.dataStore.get('relationships') || [],
        metadata: { ...this.dataStore.get('metadata') }
      },
      timestamp: Date.now()
    };

    this.backups.set(name, backup);

    // Also save to file system
    const backupPath = path.join(this.testDir, `backup-${name}.json`);
    await fs.writeFile(backupPath, JSON.stringify(backup, null, 2));
  }

  async restoreBackup(name: string): Promise<void> {
    const backup = this.backups.get(name);
    if (!backup) {
      throw new Error(`Backup ${name} not found`);
    }

    this.dataStore.set('entities', [...backup.data.entities]);
    this.dataStore.set('relationships', [...backup.data.relationships]);
    this.dataStore.set('metadata', { ...backup.data.metadata });
    this.currentVersion = backup.version;
  }

  async migrateToVersion(targetVersion: string, schema: SchemaVersion): Promise<MigrationStep> {
    const startTime = Date.now();
    const stepId = `migrate-${this.currentVersion}-to-${targetVersion}`;

    try {
      // Create pre-migration backup
      await this.createBackup(`pre-${stepId}`);

      const entities = this.dataStore.get('entities') || [];
      const relationships = this.dataStore.get('relationships') || [];
      const initialDataSize = entities.length + relationships.length;

      // Apply data transformation if provided
      let transformedData = { entities, relationships };
      if (schema.dataTransform) {
        transformedData = schema.dataTransform(entities, relationships);
      }

      // Apply migration logic
      if (schema.migrationUp) {
        const migrationResult = await schema.migrationUp({
          entities: transformedData.entities,
          relationships: transformedData.relationships,
          metadata: this.dataStore.get('metadata')
        });

        this.dataStore.set('entities', migrationResult.entities || transformedData.entities);
        this.dataStore.set('relationships', migrationResult.relationships || transformedData.relationships);
      } else {
        this.dataStore.set('entities', transformedData.entities);
        this.dataStore.set('relationships', transformedData.relationships);
      }

      // Update metadata
      const metadata = this.dataStore.get('metadata');
      metadata.version = targetVersion;
      metadata.lastMigration = {
        from: this.currentVersion,
        to: targetVersion,
        timestamp: Date.now()
      };
      this.dataStore.set('metadata', metadata);

      this.currentVersion = targetVersion;

      const migrationStep: MigrationStep = {
        id: stepId,
        fromVersion: this.currentVersion,
        toVersion: targetVersion,
        direction: 'up',
        timestamp: startTime,
        success: true,
        duration: Date.now() - startTime,
        dataSize: initialDataSize
      };

      this.migrationHistory.push(migrationStep);
      return migrationStep;

    } catch (error) {
      const migrationStep: MigrationStep = {
        id: stepId,
        fromVersion: this.currentVersion,
        toVersion: targetVersion,
        direction: 'up',
        timestamp: startTime,
        success: false,
        duration: Date.now() - startTime,
        dataSize: 0,
        errors: [error.message]
      };

      this.migrationHistory.push(migrationStep);

      // Restore from backup on failure
      try {
        await this.restoreBackup(`pre-${stepId}`);
      } catch (restoreError) {
        migrationStep.errors?.push(`Restore failed: ${restoreError.message}`);
      }

      throw error;
    }
  }

  async rollbackToVersion(targetVersion: string, schema: SchemaVersion): Promise<MigrationStep> {
    const startTime = Date.now();
    const stepId = `rollback-${this.currentVersion}-to-${targetVersion}`;

    try {
      await this.createBackup(`pre-${stepId}`);

      const entities = this.dataStore.get('entities') || [];
      const relationships = this.dataStore.get('relationships') || [];

      // Apply rollback migration
      if (schema.migrationDown) {
        const rollbackResult = await schema.migrationDown({
          entities,
          relationships,
          metadata: this.dataStore.get('metadata')
        });

        this.dataStore.set('entities', rollbackResult.entities || entities);
        this.dataStore.set('relationships', rollbackResult.relationships || relationships);
      }

      // Update metadata
      const metadata = this.dataStore.get('metadata');
      metadata.version = targetVersion;
      metadata.lastRollback = {
        from: this.currentVersion,
        to: targetVersion,
        timestamp: Date.now()
      };
      this.dataStore.set('metadata', metadata);

      this.currentVersion = targetVersion;

      const migrationStep: MigrationStep = {
        id: stepId,
        fromVersion: this.currentVersion,
        toVersion: targetVersion,
        direction: 'down',
        timestamp: startTime,
        success: true,
        duration: Date.now() - startTime,
        dataSize: entities.length + relationships.length
      };

      this.migrationHistory.push(migrationStep);
      return migrationStep;

    } catch (error) {
      const migrationStep: MigrationStep = {
        id: stepId,
        fromVersion: this.currentVersion,
        toVersion: targetVersion,
        direction: 'down',
        timestamp: startTime,
        success: false,
        duration: Date.now() - startTime,
        dataSize: 0,
        errors: [error.message]
      };

      this.migrationHistory.push(migrationStep);
      throw error;
    }
  }

  getCurrentVersion(): string {
    return this.currentVersion;
  }

  getMigrationHistory(): MigrationStep[] {
    return [...this.migrationHistory];
  }

  getData(): { entities: any[], relationships: any[], metadata: any } {
    return {
      entities: this.dataStore.get('entities') || [],
      relationships: this.dataStore.get('relationships') || [],
      metadata: this.dataStore.get('metadata') || {}
    };
  }

  async validateDataIntegrity(): Promise<{ valid: boolean, issues: string[] }> {
    const entities = this.dataStore.get('entities') || [];
    const relationships = this.dataStore.get('relationships') || [];
    const issues: string[] = [];

    // Check entity uniqueness
    const entityIds = new Set();
    for (const entity of entities) {
      if (!entity.id) {
        issues.push('Entity missing ID');
      } else if (entityIds.has(entity.id)) {
        issues.push(`Duplicate entity ID: ${entity.id}`);
      } else {
        entityIds.add(entity.id);
      }
    }

    // Check relationship integrity
    for (const rel of relationships) {
      if (!rel.from || !rel.to) {
        issues.push('Relationship missing from/to references');
      } else if (!entityIds.has(rel.from) || !entityIds.has(rel.to)) {
        issues.push(`Relationship references non-existent entity: ${rel.from} -> ${rel.to}`);
      }
    }

    // Check metadata consistency
    const metadata = this.dataStore.get('metadata');
    if (!metadata) {
      issues.push('Missing metadata');
    } else {
      if (metadata.entityCount !== entities.length) {
        issues.push(`Entity count mismatch: expected ${metadata.entityCount}, got ${entities.length}`);
      }
      if (metadata.relationshipCount !== relationships.length) {
        issues.push(`Relationship count mismatch: expected ${metadata.relationshipCount}, got ${relationships.length}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

// Schema version definitions for testing
const schemaVersions: Record<string, SchemaVersion> = {
  '1.0.0': {
    version: '1.0.0',
    description: 'Initial schema with basic entity structure',
    schema: {
      entities: ['id', 'type', 'name', 'properties'],
      relationships: ['id', 'type', 'from', 'to', 'properties']
    }
  },

  '1.1.0': {
    version: '1.1.0',
    description: 'Added metadata and timestamps to entities',
    schema: {
      entities: ['id', 'type', 'name', 'properties', 'metadata', 'createdAt', 'updatedAt'],
      relationships: ['id', 'type', 'from', 'to', 'properties']
    },
    migrationUp: async (data) => {
      const now = Date.now();
      const entities = data.entities.map(entity => ({
        ...entity,
        metadata: entity.metadata || {},
        createdAt: entity.createdAt || now,
        updatedAt: entity.updatedAt || now
      }));

      return { ...data, entities };
    },
    migrationDown: async (data) => {
      const entities = data.entities.map(entity => {
        const { metadata, createdAt, updatedAt, ...coreEntity } = entity;
        return coreEntity;
      });

      return { ...data, entities };
    }
  },

  '1.2.0': {
    version: '1.2.0',
    description: 'Added versioning and audit trail to relationships',
    schema: {
      entities: ['id', 'type', 'name', 'properties', 'metadata', 'createdAt', 'updatedAt'],
      relationships: ['id', 'type', 'from', 'to', 'properties', 'version', 'auditTrail']
    },
    migrationUp: async (data) => {
      const relationships = data.relationships.map(rel => ({
        ...rel,
        version: rel.version || 1,
        auditTrail: rel.auditTrail || [{
          action: 'created',
          timestamp: Date.now(),
          user: 'migration'
        }]
      }));

      return { ...data, relationships };
    },
    migrationDown: async (data) => {
      const relationships = data.relationships.map(rel => {
        const { version, auditTrail, ...coreRel } = rel;
        return coreRel;
      });

      return { ...data, relationships };
    }
  },

  '2.0.0': {
    version: '2.0.0',
    description: 'Major schema change: normalized entity types and added constraints',
    schema: {
      entities: ['id', 'typeId', 'name', 'attributes', 'metadata', 'createdAt', 'updatedAt'],
      relationships: ['id', 'typeId', 'sourceId', 'targetId', 'attributes', 'version', 'auditTrail'],
      entityTypes: ['id', 'name', 'schema', 'constraints'],
      relationshipTypes: ['id', 'name', 'schema', 'constraints']
    },
    dataTransform: (entities, relationships) => {
      // Transform entity structure
      const transformedEntities = entities.map(entity => ({
        id: entity.id,
        typeId: entity.type || 'unknown',
        name: entity.name,
        attributes: entity.properties || {},
        metadata: entity.metadata || {},
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt
      }));

      // Transform relationship structure
      const transformedRelationships = relationships.map(rel => ({
        id: rel.id,
        typeId: rel.type || 'unknown',
        sourceId: rel.from,
        targetId: rel.to,
        attributes: rel.properties || {},
        version: rel.version || 1,
        auditTrail: rel.auditTrail || []
      }));

      return {
        entities: transformedEntities,
        relationships: transformedRelationships
      };
    }
  }
};

// Large dataset generators for performance testing
const generateLargeDataset = (entityCount: number, relationshipRatio: number = 0.3) => {
  const entities = Array.from({ length: entityCount }, (_, i) => ({
    id: `entity_${i}`,
    type: ['class', 'function', 'interface', 'variable'][i % 4],
    name: `TestEntity_${i}`,
    properties: {
      description: `Generated entity ${i}`,
      complexity: Math.floor(Math.random() * 10),
      tags: [`tag_${i % 5}`, `category_${i % 3}`]
    }
  }));

  const relationshipCount = Math.floor(entityCount * relationshipRatio);
  const relationships = Array.from({ length: relationshipCount }, (_, i) => {
    const fromIndex = Math.floor(Math.random() * entityCount);
    let toIndex = Math.floor(Math.random() * entityCount);
    // Ensure different entities
    while (toIndex === fromIndex) {
      toIndex = Math.floor(Math.random() * entityCount);
    }

    return {
      id: `rel_${i}`,
      type: ['implements', 'extends', 'uses', 'contains'][i % 4],
      from: entities[fromIndex].id,
      to: entities[toIndex].id,
      properties: {
        strength: Math.random(),
        confidence: 0.8 + Math.random() * 0.2
      }
    };
  });

  return { entities, relationships };
};

describe('Data Migration Tests', () => {
  let testDir: string;
  let migrationRunner: DataMigrationTestRunner;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'migration-test-'));
    migrationRunner = new DataMigrationTestRunner(testDir);
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up test directory:', error);
    }
  });

  test('Basic Version Upgrade Migration', async () => {
    // Initialize with v1.0.0 data
    const initialData = generateLargeDataset(100);
    await migrationRunner.initializeDataStore(initialData.entities, initialData.relationships);

    expect(migrationRunner.getCurrentVersion()).toBe('1.0.0');

    // Migrate to v1.1.0
    const migrationStep = await migrationRunner.migrateToVersion('1.1.0', schemaVersions['1.1.0']);

    expect(migrationStep.success).toBe(true);
    expect(migrationRunner.getCurrentVersion()).toBe('1.1.0');

    // Verify data transformation
    const { entities } = migrationRunner.getData();
    entities.forEach(entity => {
      expect(entity).toHaveProperty('metadata');
      expect(entity).toHaveProperty('createdAt');
      expect(entity).toHaveProperty('updatedAt');
    });

    // Verify data integrity
    const integrity = await migrationRunner.validateDataIntegrity();
    expect(integrity.valid).toBe(true);
  });

  test('Sequential Multi-Version Upgrades', async () => {
    // Initialize with v1.0.0
    const initialData = generateLargeDataset(50);
    await migrationRunner.initializeDataStore(initialData.entities, initialData.relationships);

    const versionSequence = ['1.1.0', '1.2.0', '2.0.0'];

    for (const version of versionSequence) {
      const migrationStep = await migrationRunner.migrateToVersion(version, schemaVersions[version]);

      expect(migrationStep.success).toBe(true);
      expect(migrationRunner.getCurrentVersion()).toBe(version);

      // Validate after each migration
      const integrity = await migrationRunner.validateDataIntegrity();
      expect(integrity.valid).toBe(true);
    }

    // Verify final state
    const finalData = migrationRunner.getData();
    expect(finalData.metadata.version).toBe('2.0.0');

    // Check v2.0.0 specific transformations
    finalData.entities.forEach(entity => {
      expect(entity).toHaveProperty('typeId');
      expect(entity).toHaveProperty('attributes');
      expect(entity).not.toHaveProperty('type'); // Should be transformed to typeId
      expect(entity).not.toHaveProperty('properties'); // Should be transformed to attributes
    });

    finalData.relationships.forEach(rel => {
      expect(rel).toHaveProperty('typeId');
      expect(rel).toHaveProperty('sourceId');
      expect(rel).toHaveProperty('targetId');
      expect(rel).not.toHaveProperty('from'); // Should be transformed to sourceId
      expect(rel).not.toHaveProperty('to'); // Should be transformed to targetId
    });
  });

  test('Version Rollback Migration', async () => {
    // Start with v2.0.0 data
    const initialData = generateLargeDataset(30);
    await migrationRunner.initializeDataStore(initialData.entities, initialData.relationships);

    // Migrate through versions to v2.0.0
    await migrationRunner.migrateToVersion('1.1.0', schemaVersions['1.1.0']);
    await migrationRunner.migrateToVersion('1.2.0', schemaVersions['1.2.0']);
    await migrationRunner.migrateToVersion('2.0.0', schemaVersions['2.0.0']);

    expect(migrationRunner.getCurrentVersion()).toBe('2.0.0');

    // Now rollback to v1.2.0
    const rollbackStep = await migrationRunner.rollbackToVersion('1.2.0', schemaVersions['1.2.0']);

    expect(rollbackStep.success).toBe(true);
    expect(rollbackStep.direction).toBe('down');
    expect(migrationRunner.getCurrentVersion()).toBe('1.2.0');

    // Verify rollback worked
    const { entities, relationships } = migrationRunner.getData();

    entities.forEach(entity => {
      expect(entity).toHaveProperty('type'); // Should be back from typeId
      expect(entity).toHaveProperty('properties'); // Should be back from attributes
    });

    relationships.forEach(rel => {
      expect(rel).toHaveProperty('from'); // Should be back from sourceId
      expect(rel).toHaveProperty('to'); // Should be back from targetId
    });

    // Verify data integrity after rollback
    const integrity = await migrationRunner.validateDataIntegrity();
    expect(integrity.valid).toBe(true);
  });

  test('Failed Migration Recovery', async () => {
    const initialData = generateLargeDataset(20);
    await migrationRunner.initializeDataStore(initialData.entities, initialData.relationships);

    // Create a schema version that will fail
    const failingSchema: SchemaVersion = {
      version: '1.5.0',
      description: 'Intentionally failing migration',
      schema: {},
      migrationUp: async () => {
        throw new Error('Simulated migration failure');
      }
    };

    // Attempt migration that should fail
    await expect(migrationRunner.migrateToVersion('1.5.0', failingSchema))
      .rejects.toThrow('Simulated migration failure');

    // Verify system remained in original state
    expect(migrationRunner.getCurrentVersion()).toBe('1.0.0');

    // Verify data wasn't corrupted
    const integrity = await migrationRunner.validateDataIntegrity();
    expect(integrity.valid).toBe(true);

    // Check migration history recorded the failure
    const history = migrationRunner.getMigrationHistory();
    const failedMigration = history.find(step => step.toVersion === '1.5.0');
    expect(failedMigration?.success).toBe(false);
    expect(failedMigration?.errors).toBeDefined();
  });

  test('Large Dataset Migration Performance', async () => {
    // Generate large dataset for performance testing
    const largeDataset = generateLargeDataset(10000, 0.4); // 10k entities, 4k relationships
    await migrationRunner.initializeDataStore(largeDataset.entities, largeDataset.relationships);

    const startTime = Date.now();

    // Perform migration on large dataset
    const migrationStep = await migrationRunner.migrateToVersion('1.1.0', schemaVersions['1.1.0']);

    const migrationTime = Date.now() - startTime;

    expect(migrationStep.success).toBe(true);
    expect(migrationStep.dataSize).toBe(14000); // 10k entities + 4k relationships

    // Performance expectations
    expect(migrationTime).toBeLessThan(30000); // Should complete within 30 seconds

    const entitiesPerSecond = 10000 / (migrationTime / 1000);
    expect(entitiesPerSecond).toBeGreaterThan(100); // At least 100 entities per second

    console.log(`Large dataset migration performance: ${entitiesPerSecond.toFixed(2)} entities/sec`);

    // Verify data integrity after large migration
    const integrity = await migrationRunner.validateDataIntegrity();
    expect(integrity.valid).toBe(true);
  });

  test('Concurrent Migration Safety', async () => {
    const initialData = generateLargeDataset(100);
    await migrationRunner.initializeDataStore(initialData.entities, initialData.relationships);

    // Simulate concurrent migration attempts (should be prevented)
    const migration1Promise = migrationRunner.migrateToVersion('1.1.0', schemaVersions['1.1.0']);

    // Attempt second migration while first is running
    await expect(
      migrationRunner.migrateToVersion('1.2.0', schemaVersions['1.2.0'])
    ).rejects.toThrow(); // Should prevent concurrent migrations

    // First migration should complete successfully
    const migration1 = await migration1Promise;
    expect(migration1.success).toBe(true);
  });

  test('Backup and Restore Functionality', async () => {
    const initialData = generateLargeDataset(50);
    await migrationRunner.initializeDataStore(initialData.entities, initialData.relationships);

    // Create initial backup
    await migrationRunner.createBackup('initial-state');

    // Perform some migrations
    await migrationRunner.migrateToVersion('1.1.0', schemaVersions['1.1.0']);
    await migrationRunner.migrateToVersion('1.2.0', schemaVersions['1.2.0']);

    expect(migrationRunner.getCurrentVersion()).toBe('1.2.0');

    // Restore from backup
    await migrationRunner.restoreBackup('initial-state');

    expect(migrationRunner.getCurrentVersion()).toBe('1.0.0');

    // Verify data was restored correctly
    const restoredData = migrationRunner.getData();
    expect(restoredData.entities.length).toBe(initialData.entities.length);
    expect(restoredData.relationships.length).toBe(initialData.relationships.length);

    // Verify v1.1.0 fields are not present (confirming rollback)
    restoredData.entities.forEach(entity => {
      expect(entity).not.toHaveProperty('metadata');
      expect(entity).not.toHaveProperty('createdAt');
    });
  });

  test('Schema Validation During Migration', async () => {
    const initialData = generateLargeDataset(25);
    await migrationRunner.initializeDataStore(initialData.entities, initialData.relationships);

    // Introduce data inconsistency
    const corruptedData = migrationRunner.getData();

    // Add entity without ID
    corruptedData.entities.push({ type: 'corrupt', name: 'No ID Entity' });

    // Add relationship to non-existent entity
    corruptedData.relationships.push({
      id: 'corrupt_rel',
      type: 'corrupt',
      from: 'entity_0',
      to: 'non_existent_entity'
    });

    await migrationRunner.initializeDataStore(corruptedData.entities, corruptedData.relationships);

    // Validation should detect issues
    const integrity = await migrationRunner.validateDataIntegrity();
    expect(integrity.valid).toBe(false);
    expect(integrity.issues.length).toBeGreaterThan(0);
    expect(integrity.issues.some(issue => issue.includes('missing ID'))).toBe(true);
    expect(integrity.issues.some(issue => issue.includes('non-existent entity'))).toBe(true);
  });

  test('Migration History Tracking', async () => {
    const initialData = generateLargeDataset(30);
    await migrationRunner.initializeDataStore(initialData.entities, initialData.relationships);

    // Perform multiple migrations
    await migrationRunner.migrateToVersion('1.1.0', schemaVersions['1.1.0']);
    await migrationRunner.migrateToVersion('1.2.0', schemaVersions['1.2.0']);
    await migrationRunner.rollbackToVersion('1.1.0', schemaVersions['1.1.0']);
    await migrationRunner.migrateToVersion('1.2.0', schemaVersions['1.2.0']);

    const history = migrationRunner.getMigrationHistory();

    expect(history.length).toBe(4);

    // Verify migration directions
    expect(history[0].direction).toBe('up');   // 1.0.0 -> 1.1.0
    expect(history[1].direction).toBe('up');   // 1.1.0 -> 1.2.0
    expect(history[2].direction).toBe('down'); // 1.2.0 -> 1.1.0
    expect(history[3].direction).toBe('up');   // 1.1.0 -> 1.2.0

    // All should be successful
    history.forEach(step => {
      expect(step.success).toBe(true);
      expect(step.duration).toBeGreaterThan(0);
    });
  });

  test('Data Consistency Across Migration Chain', async () => {
    const initialData = generateLargeDataset(40);
    await migrationRunner.initializeDataStore(initialData.entities, initialData.relationships);

    const originalEntityCount = initialData.entities.length;
    const originalRelationshipCount = initialData.relationships.length;

    // Migrate through full chain
    await migrationRunner.migrateToVersion('1.1.0', schemaVersions['1.1.0']);
    await migrationRunner.migrateToVersion('1.2.0', schemaVersions['1.2.0']);
    await migrationRunner.migrateToVersion('2.0.0', schemaVersions['2.0.0']);

    // Rollback full chain
    await migrationRunner.rollbackToVersion('1.2.0', schemaVersions['1.2.0']);
    await migrationRunner.rollbackToVersion('1.1.0', schemaVersions['1.1.0']);
    await migrationRunner.rollbackToVersion('1.0.0', schemaVersions['1.0.0']);

    // Verify we're back to original state
    expect(migrationRunner.getCurrentVersion()).toBe('1.0.0');

    const finalData = migrationRunner.getData();
    expect(finalData.entities.length).toBe(originalEntityCount);
    expect(finalData.relationships.length).toBe(originalRelationshipCount);

    // Verify structural consistency
    const integrity = await migrationRunner.validateDataIntegrity();
    expect(integrity.valid).toBe(true);

    // Verify no v1.1.0+ fields remain
    finalData.entities.forEach(entity => {
      expect(entity).not.toHaveProperty('metadata');
      expect(entity).not.toHaveProperty('createdAt');
      expect(entity).not.toHaveProperty('updatedAt');
    });

    finalData.relationships.forEach(rel => {
      expect(rel).not.toHaveProperty('version');
      expect(rel).not.toHaveProperty('auditTrail');
    });
  });
});
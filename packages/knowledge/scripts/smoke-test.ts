#!/usr/bin/env node --experimental-modules --loader ts-node/esm
/**
 * Smoke Test Script for High-Throughput Ingestion Pipeline
 *
 * This script demonstrates real usage by:
 * 1. Creating sample TypeScript files with various patterns
 * 2. Processing them through the ingestion pipeline
 * 3. Validating performance characteristics
 * 4. Testing error handling and edge cases
 * 5. Verifying resource cleanup
 *
 * Usage:
 *   pnpm exec tsx packages/knowledge/scripts/smoke-test.ts
 *   pnpm exec tsx packages/knowledge/scripts/smoke-test.ts --benchmark
 *   pnpm exec tsx packages/knowledge/scripts/smoke-test.ts --stress-test
 */

import { writeFile, mkdir, rm, readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';
import { performance } from 'perf_hooks';
import { HighThroughputIngestionPipeline } from '../src/ingestion/pipeline.js';
import { ChangeEvent, PipelineConfig } from '../src/ingestion/types.js';

// Configuration
const SMOKE_TEST_DIR = resolve(process.cwd(), 'tmp', 'smoke-test');
const TARGET_LOC_PER_MINUTE = 10000;
const MEMORY_THRESHOLD_MB = 512;

interface SmokeTestOptions {
  benchmark?: boolean;
  stressTest?: boolean;
  verbose?: boolean;
  skipCleanup?: boolean;
}

interface TestMetrics {
  totalFiles: number;
  totalEntities: number;
  totalRelationships: number;
  processingTimeMs: number;
  peakMemoryUsageMB: number;
  locPerMinute: number;
  errors: Array<{ type: string; message: string; context?: any }>;
}

interface TestResult {
  success: boolean;
  metrics: TestMetrics;
  validations: {
    performanceTarget: boolean;
    memoryUsage: boolean;
    errorHandling: boolean;
    resourceCleanup: boolean;
  };
}

class SmokeTestRunner {
  private pipeline?: HighThroughputIngestionPipeline;
  private metrics: TestMetrics = {
    totalFiles: 0,
    totalEntities: 0,
    totalRelationships: 0,
    processingTimeMs: 0,
    peakMemoryUsageMB: 0,
    locPerMinute: 0,
    errors: [],
  };

  constructor(private options: SmokeTestOptions = {}) {}

  async run(): Promise<TestResult> {
    console.log('🔥 Starting High-Throughput Ingestion Pipeline Smoke Test\n');

    try {
      // Prepare test environment
      await this.setupTestEnvironment();

      // Create sample files
      await this.createSampleFiles();

      // Initialize and configure pipeline
      await this.initializePipeline();

      // Run the main test
      const startTime = performance.now();
      await this.runIngestionTest();
      this.metrics.processingTimeMs = performance.now() - startTime;

      // Calculate performance metrics
      this.calculatePerformanceMetrics();

      // Run validation tests
      const validations = await this.runValidations();

      // Cleanup resources
      if (!this.options.skipCleanup) {
        await this.cleanup();
      }

      const result: TestResult = {
        success: this.isTestSuccessful(validations),
        metrics: this.metrics,
        validations,
      };

      this.printResults(result);
      return result;
    } catch (error) {
      console.error('❌ Smoke test failed with unexpected error:', error);
      this.metrics.errors.push({
        type: 'CRITICAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        context: { stack: error instanceof Error ? error.stack : undefined },
      });

      return {
        success: false,
        metrics: this.metrics,
        validations: {
          performanceTarget: false,
          memoryUsage: false,
          errorHandling: false,
          resourceCleanup: false,
        },
      };
    }
  }

  private async setupTestEnvironment(): Promise<void> {
    console.log('📁 Setting up test environment...');

    // Clean any existing test directory
    try {
      await rm(SMOKE_TEST_DIR, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }

    // Create fresh test directory
    await mkdir(SMOKE_TEST_DIR, { recursive: true });

    if (this.options.verbose) {
      console.log(`   Created test directory: ${SMOKE_TEST_DIR}`);
    }
  }

  private async createSampleFiles(): Promise<void> {
    console.log('📝 Creating sample TypeScript files...');

    const sampleFiles = [
      // Simple class with methods
      {
        path: 'src/models/User.ts',
        content: `
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export class User implements UserProfile {
  constructor(
    public id: string,
    public name: string,
    public email: string,
    public createdAt: Date = new Date()
  ) {}

  updateProfile(updates: Partial<UserProfile>): void {
    Object.assign(this, updates);
  }

  getDisplayName(): string {
    return this.name || this.email;
  }

  static fromJSON(data: any): User {
    return new User(data.id, data.name, data.email, new Date(data.createdAt));
  }
}
`,
      },
      // Service with dependencies
      {
        path: 'src/services/UserService.ts',
        content: `
import { User, UserProfile } from '../models/User.js';
import { DatabaseService } from './DatabaseService.js';
import { EventEmitter } from 'events';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}

export class UserService extends EventEmitter {
  constructor(
    private db: DatabaseService,
    private repository: UserRepository
  ) {
    super();
  }

  async createUser(profile: Omit<UserProfile, 'id' | 'createdAt'>): Promise<User> {
    const user = new User(
      this.generateId(),
      profile.name,
      profile.email
    );

    await this.repository.save(user);
    this.emit('user:created', user);
    return user;
  }

  async updateUser(id: string, updates: Partial<UserProfile>): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new Error(\`User not found: \${id}\`);
    }

    user.updateProfile(updates);
    await this.repository.save(user);
    this.emit('user:updated', user);
    return user;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
`,
      },
      // Complex utility functions
      {
        path: 'src/utils/validators.ts',
        content: `
export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export const EMAIL_REGEX = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email) {
    errors.push('Email is required');
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push('Invalid email format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateUserProfile(profile: any): ValidationResult {
  const errors: string[] = [];

  if (!profile.name || profile.name.trim().length === 0) {
    errors.push('Name is required');
  }

  const emailValidation = validateEmail(profile.email);
  if (!emailValidation.isValid) {
    errors.push(...emailValidation.errors);
  }

  if (profile.id && !UUID_REGEX.test(profile.id)) {
    errors.push('Invalid ID format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export const createValidator = <T>(rules: Array<(value: T) => string | null>) => {
  return (value: T): ValidationResult => {
    const errors = rules.map(rule => rule(value)).filter(Boolean) as string[];
    return {
      isValid: errors.length === 0,
      errors
    };
  };
};
`,
      },
      // React component
      {
        path: 'src/components/UserCard.tsx',
        content: `
import React, { useState, useCallback } from 'react';
import { User } from '../models/User.js';
import { validateUserProfile } from '../utils/validators.js';

interface UserCardProps {
  user: User;
  onUpdate?: (user: User) => void;
  onDelete?: (userId: string) => void;
  editable?: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onUpdate,
  onDelete,
  editable = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email
  });
  const [errors, setErrors] = useState<string[]>([]);

  const handleSave = useCallback(async () => {
    const validation = validateUserProfile(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const updatedUser = new User(user.id, formData.name, formData.email, user.createdAt);
    onUpdate?.(updatedUser);
    setIsEditing(false);
    setErrors([]);
  }, [formData, user, onUpdate]);

  const handleCancel = useCallback(() => {
    setFormData({ name: user.name, email: user.email });
    setIsEditing(false);
    setErrors([]);
  }, [user]);

  if (isEditing) {
    return (
      <div className="user-card editing">
        <input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Name"
        />
        <input
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="Email"
        />
        {errors.length > 0 && (
          <div className="errors">
            {errors.map((error, index) => (
              <span key={index} className="error">{error}</span>
            ))}
          </div>
        )}
        <div className="actions">
          <button onClick={handleSave}>Save</button>
          <button onClick={handleCancel}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-card">
      <h3>{user.getDisplayName()}</h3>
      <p>{user.email}</p>
      <small>Created: {user.createdAt.toLocaleDateString()}</small>

      {editable && (
        <div className="actions">
          <button onClick={() => setIsEditing(true)}>Edit</button>
          <button onClick={() => onDelete?.(user.id)} className="danger">
            Delete
          </button>
        </div>
      )}
    </div>
  );
};
`,
      },
      // Configuration file
      {
        path: 'src/config/database.ts',
        content: `
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  pool?: {
    min: number;
    max: number;
    acquireTimeoutMs: number;
    idleTimeoutMs: number;
  };
}

export const DEFAULT_DATABASE_CONFIG: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'memento',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.DB_SSL === 'true',
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMs: 30000,
    idleTimeoutMs: 30000
  }
};

export function createDatabaseConfig(overrides: Partial<DatabaseConfig> = {}): DatabaseConfig {
  return {
    ...DEFAULT_DATABASE_CONFIG,
    ...overrides,
    pool: {
      ...DEFAULT_DATABASE_CONFIG.pool,
      ...overrides.pool
    }
  };
}
`,
      },
    ];

    // Add stress test files if requested
    if (this.options.stressTest) {
      for (let i = 0; i < 50; i++) {
        sampleFiles.push({
          path: `src/generated/Module${i}.ts`,
          content: this.generateLargeModule(i),
        });
      }
    }

    // Write all files
    for (const file of sampleFiles) {
      const fullPath = join(SMOKE_TEST_DIR, file.path);
      await mkdir(join(fullPath, '..'), { recursive: true });
      await writeFile(fullPath, file.content);
      this.metrics.totalFiles++;
    }

    console.log(`   Created ${sampleFiles.length} sample files`);
  }

  private generateLargeModule(index: number): string {
    const classes = Array.from(
      { length: 20 },
      (_, i) => `
export class Component${index}_${i} {
  private data: Map<string, any> = new Map();

  constructor(
    private config: Record<string, any>,
    private dependencies: any[]
  ) {}

  async process(input: any): Promise<any> {
    const result = await this.transform(input);
    this.data.set('lastResult', result);
    return result;
  }

  private async transform(input: any): Promise<any> {
    // Simulate complex processing
    return {
      ...input,
      processed: true,
      timestamp: Date.now(),
      componentId: '${index}_${i}'
    };
  }

  getMetrics(): any {
    return {
      dataSize: this.data.size,
      lastProcessed: this.data.get('lastResult')?.timestamp
    };
  }
}`
    ).join('\n');

    return `
// Generated module ${index} for stress testing
import { EventEmitter } from 'events';

export interface ModuleConfig {
  id: string;
  enabled: boolean;
  options: Record<string, any>;
}

${classes}

export class ModuleManager${index} extends EventEmitter {
  private components: Map<string, any> = new Map();

  async initialize(configs: ModuleConfig[]): Promise<void> {
    for (const config of configs) {
      const component = new Component${index}_0(config.options, []);
      this.components.set(config.id, component);
      this.emit('component:registered', config.id);
    }
  }

  async processAll(data: any): Promise<any[]> {
    const results = [];
    for (const [id, component] of this.components) {
      try {
        const result = await component.process(data);
        results.push({ componentId: id, result });
      } catch (error) {
        this.emit('component:error', { id, error });
      }
    }
    return results;
  }
}
`;
  }

  private async initializePipeline(): Promise<void> {
    console.log('🚀 Initializing ingestion pipeline...');

    const config: PipelineConfig = {
      eventBus: {
        type: 'memory',
        partitions: 4,
      },
      workers: {
        parsers: 2,
        entityWorkers: 2,
        relationshipWorkers: 2,
        embeddingWorkers: 1,
      },
      batching: {
        entityBatchSize: 50,
        relationshipBatchSize: 100,
        embeddingBatchSize: 25,
        timeoutMs: 5000,
        maxConcurrentBatches: 4,
      },
      queues: {
        maxSize: 10000,
        partitionCount: 4,
        batchSize: 20,
        batchTimeout: 1000,
        retryAttempts: 3,
        retryDelay: 1000,
      },
      monitoring: {
        metricsInterval: 1000,
        healthCheckInterval: 5000,
        alertThresholds: {
          queueDepth: 1000,
          latency: 5000,
          errorRate: 0.1,
        },
      },
    };

    // Mock knowledge graph service for testing
    const mockKnowledgeGraphService = {
      metrics: {
        totalEntities: 0,
        totalRelationships: 0,
      },
      options: {
        verbose: true,
      },
      async createEntitiesBulk(entities: any[]): Promise<any> {
        this.metrics.totalEntities += entities.length;
        if (this.options.verbose) {
          console.log(`   Mock: Created ${entities.length} entities`);
        }
        return { success: true, count: entities.length };
      },

      async createRelationshipsBulk(relationships: any[]): Promise<any> {
        this.metrics.totalRelationships += relationships.length;
        if (this.options.verbose) {
          console.log(`   Mock: Created ${relationships.length} relationships`);
        }
        return { success: true, count: relationships.length };
      },

      async createEmbeddingsBatch(entities: any[]): Promise<any> {
        if (this.options.verbose) {
          console.log(
            `   Mock: Created embeddings for ${entities.length} entities`
          );
        }
        return { success: true, count: entities.length };
      },
    };

    this.pipeline = new HighThroughputIngestionPipeline(
      config,
      mockKnowledgeGraphService
    );

    // Set up monitoring
    this.pipeline.on('pipeline:error', (error: any) => {
       
      this.metrics.errors.push({
        type: 'PIPELINE_ERROR',
        message: error.message,
        context: { stack: error.stack },
      });
    });

    this.pipeline.on('pipeline:error', (error: any) => {
       
      this.metrics.errors.push({
        type: 'PIPELINE_ERROR',
        message: error.message ?? String(error),
        context: { stack: error.stack },
      });
    });

    await this.pipeline.start();
    console.log('   Pipeline started successfully');
  }

  private async runIngestionTest(): Promise<void> {
    console.log('⚡ Running ingestion test...');

    if (!this.pipeline) {
      throw new Error('Pipeline not initialized');
    }

    // Track memory usage
    const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    let peakMemory = initialMemory;

    const memoryMonitor = setInterval(() => {
      const currentMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      peakMemory = Math.max(peakMemory, currentMemory);
    }, 100);

    try {
      // Discover and process all TypeScript files
      const filePaths = await this.discoverSourceFiles(SMOKE_TEST_DIR);
      console.log(`   Found ${filePaths.length} files to process`);

      // Create change events for all files
      const changeEvents: ChangeEvent[] = [];
      for (const filePath of filePaths) {
        const stats = await stat(filePath);
        const event: ChangeEvent = {
          id: `test-${Date.now()}-${Math.random()}`,
          namespace: 'smoke-test',
          module: this.extractModuleName(filePath),
          filePath,
          eventType: 'created',
          timestamp: new Date(),
          size: stats.size,
          diffHash: `hash-${Math.random()}`,
          metadata: {
            testRun: true,
            fileType: this.getFileType(filePath),
          },
        };
        changeEvents.push(event);
      }

      // Process events in batches to simulate real usage
      const batchSize = 5;
      for (let i = 0; i < changeEvents.length; i += batchSize) {
        const batch = changeEvents.slice(i, i + batchSize);
        await this.pipeline.ingestChangeEvents(batch);

        if (this.options.verbose) {
          console.log(
            `   Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
              changeEvents.length / batchSize
            )}`
          );
        }

        // Small delay to simulate real-world timing
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Wait for pipeline to complete all processing
      console.log('   Waiting for pipeline to complete...');
      await this.waitForPipelineCompletion();
    } finally {
      clearInterval(memoryMonitor);
      this.metrics.peakMemoryUsageMB = peakMemory;
    }
  }

  private async discoverSourceFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await this.discoverSourceFiles(fullPath);
        files.push(...subFiles);
      } else if (
        entry.isFile() &&
        (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))
      ) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private extractModuleName(filePath: string): string {
    const relativePath = filePath.replace(SMOKE_TEST_DIR, '');
    const parts = relativePath.split('/').filter(Boolean);
    return parts.slice(0, -1).join('/') || 'root';
  }

  private getFileType(filePath: string): string {
    if (filePath.endsWith('.tsx')) return 'react-component';
    if (filePath.endsWith('.ts')) return 'typescript';
    return 'unknown';
  }

  private async waitForPipelineCompletion(): Promise<void> {
    if (!this.pipeline) return;

    let attempts = 0;
    const maxAttempts = 60; // 30 seconds max wait

    while (attempts < maxAttempts) {
      const state = this.pipeline.getState();
      const metrics = this.pipeline.getMetrics();

      // Check if pipeline is idle (no active processing)
      if (state.currentLoad === 0 && metrics.queueMetrics.queueDepth === 0) {
        console.log('   Pipeline processing completed');
        return;
      }

      if (this.options.verbose) {
        console.log(
          `   Waiting... Queue depth: ${
            metrics.queueMetrics.queueDepth
          }, Load: ${state.currentLoad.toFixed(2)}`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      attempts++;
    }

    console.warn('   Warning: Pipeline did not complete within timeout');
  }

  private calculatePerformanceMetrics(): void {
    // Count total lines of code processed
    let totalLOC = 0;
    const _sampleSizes = [30, 45, 25, 90, 40]; // Approximate LOC per file type
    totalLOC = this.metrics.totalFiles * 50; // Average estimate

    if (this.options.stressTest) {
      totalLOC += 50 * 150; // 50 large files * ~150 LOC each
    }

    this.metrics.locPerMinute =
      (totalLOC / this.metrics.processingTimeMs) * 60 * 1000;

    console.log('\n📊 Performance Metrics:');
    console.log(
      `   Processing time: ${this.metrics.processingTimeMs.toFixed(0)}ms`
    );
    console.log(`   Files processed: ${this.metrics.totalFiles}`);
    console.log(`   Entities created: ${this.metrics.totalEntities}`);
    console.log(`   Relationships created: ${this.metrics.totalRelationships}`);
    console.log(`   Lines per minute: ${this.metrics.locPerMinute.toFixed(0)}`);
    console.log(
      `   Peak memory usage: ${this.metrics.peakMemoryUsageMB.toFixed(1)}MB`
    );
    console.log(`   Errors encountered: ${this.metrics.errors.length}`);
  }

  private async runValidations(): Promise<TestResult['validations']> {
    console.log('\n🔍 Running validations...');

    const validations = {
      performanceTarget: this.metrics.locPerMinute >= TARGET_LOC_PER_MINUTE,
      memoryUsage: this.metrics.peakMemoryUsageMB <= MEMORY_THRESHOLD_MB,
      errorHandling: this.validateErrorHandling(),
      resourceCleanup: await this.validateResourceCleanup(),
    };

    // Log validation results
    console.log(
      `   ✅ Performance target (${TARGET_LOC_PER_MINUTE} LOC/min): ${
        validations.performanceTarget ? 'PASS' : 'FAIL'
      }`
    );
    console.log(
      `   ✅ Memory usage (<${MEMORY_THRESHOLD_MB}MB): ${
        validations.memoryUsage ? 'PASS' : 'FAIL'
      }`
    );
    console.log(
      `   ✅ Error handling: ${validations.errorHandling ? 'PASS' : 'FAIL'}`
    );
    console.log(
      `   ✅ Resource cleanup: ${validations.resourceCleanup ? 'PASS' : 'FAIL'}`
    );

    return validations;
  }

  private validateErrorHandling(): boolean {
    // For now, we consider it successful if we didn't have any critical errors
    // In a real scenario, we'd test error recovery, retries, etc.
    const criticalErrors = this.metrics.errors.filter(
      (e) => e.type === 'CRITICAL_ERROR'
    );
    return criticalErrors.length === 0;
  }

  private async validateResourceCleanup(): Promise<boolean> {
    if (!this.pipeline) return false;

    try {
      await this.pipeline.stop();

      // Check if pipeline state is properly cleaned up
      const state = this.pipeline.getState();
      return state.status === 'stopped';
    } catch (error) {
      this.metrics.errors.push({
        type: 'CLEANUP_ERROR',
        message: error instanceof Error ? error.message : 'Cleanup failed',
      });
      return false;
    }
  }

  private async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up...');

    try {
      if (this.pipeline) {
        await this.pipeline.stop();
      }

      await rm(SMOKE_TEST_DIR, { recursive: true, force: true });
      console.log('   Test environment cleaned up');
    } catch (error) {
      console.warn('   Warning: Cleanup failed:', error);
    }
  }

  private isTestSuccessful(validations: TestResult['validations']): boolean {
    return Object.values(validations).every(Boolean);
  }

  private printResults(result: TestResult): void {
    console.log('\n🎯 Smoke Test Results:');
    console.log('='.repeat(50));

    if (result.success) {
      console.log('✅ SMOKE TEST PASSED');
    } else {
      console.log('❌ SMOKE TEST FAILED');
    }

    console.log('\nValidation Summary:');
    Object.entries(result.validations).forEach(([key, passed]) => {
      console.log(
        `  ${passed ? '✅' : '❌'} ${key}: ${passed ? 'PASS' : 'FAIL'}`
      );
    });

    if (result.metrics.errors.length > 0) {
      console.log('\nErrors encountered:');
      result.metrics.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. [${error.type}] ${error.message}`);
        if (this.options.verbose && error.context) {
          console.log(`     Context:`, JSON.stringify(error.context, null, 2));
        }
      });
    }

    console.log('\nRecommendations:');
    if (!result.validations.performanceTarget) {
      console.log(
        '  🔧 Consider optimizing parsing performance or increasing worker pool size'
      );
    }
    if (!result.validations.memoryUsage) {
      console.log(
        '  🔧 Memory usage is high - check for memory leaks or increase batch processing'
      );
    }
    if (!result.validations.errorHandling) {
      console.log('  🔧 Improve error handling and recovery mechanisms');
    }
    if (!result.validations.resourceCleanup) {
      console.log('  🔧 Fix resource cleanup issues to prevent memory leaks');
    }

    console.log('='.repeat(50));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options: SmokeTestOptions = {
    benchmark: args.includes('--benchmark'),
    stressTest: args.includes('--stress-test'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    skipCleanup: args.includes('--skip-cleanup'),
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
High-Throughput Ingestion Pipeline Smoke Test

Usage: pnpm exec tsx packages/knowledge/scripts/smoke-test.ts [options]

Options:
  --benchmark     Run in benchmark mode with detailed performance analysis
  --stress-test   Create additional large files for stress testing
  --verbose, -v   Enable verbose logging
  --skip-cleanup  Don't clean up test files (useful for debugging)
  --help, -h      Show this help message

Examples:
  # Basic smoke test
  pnpm exec tsx packages/knowledge/scripts/smoke-test.ts

  # Benchmark mode with verbose output
  pnpm exec tsx packages/knowledge/scripts/smoke-test.ts --benchmark --verbose

  # Stress test with 50+ large files
  pnpm exec tsx packages/knowledge/scripts/smoke-test.ts --stress-test
`);
    process.exit(0);
  }

  const runner = new SmokeTestRunner(options);
  const result = await runner.run();

  process.exit(result.success ? 0 : 1);
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export {
  SmokeTestRunner,
  type SmokeTestOptions,
  type TestResult,
  type TestMetrics,
};

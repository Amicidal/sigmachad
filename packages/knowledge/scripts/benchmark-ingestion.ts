#!/usr/bin/env node

/**
 * Ingestion Pipeline Benchmark Script
 * Tests and validates the high-throughput ingestion pipeline performance
 * Target: 10k LOC/minute with P95 latency tracking
 */

import fs from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';

// Import the pipeline components
import {
  HighThroughputIngestionPipeline,
  type IngestionEvents,
} from '../src/ingestion/pipeline.js';
import type {
  BatchResult,
  BatchProcessingError,
} from '../src/ingestion/types.js';
import { createKnowledgeGraphAdapter } from '../src/ingestion/knowledge-graph-adapter.js';
import { PipelineConfig } from '../src/ingestion/types.js';

interface BenchmarkConfig {
  targetDirectory: string;
  outputPath?: string;
  fileFilters?: string[];
  maxFiles?: number;
  targetLOCPerMinute?: number;
  concurrencyLevels?: number[];
  batchSizes?: number[];
  runs?: number;
}

interface BenchmarkResult {
  config: BenchmarkConfig;
  runs: BenchmarkRun[];
  summary: BenchmarkSummary;
}

interface BenchmarkRun {
  runId: number;
  concurrency: number;
  batchSize: number;
  metrics: {
    totalTimeMs: number;
    filesProcessed: number;
    totalLOC: number;
    entitiesCreated: number;
    relationshipsCreated: number;
    embeddingsGenerated: number;
    errors: number;
    locPerMinute: number;
    filesPerSecond: number;
    entitiesPerSecond: number;
    memoryUsageMB: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
    avgLatencyMs: number;
  };
  errors: Array<{ file: string; error: string }>;
}

interface BenchmarkSummary {
  bestRun: BenchmarkRun;
  worstRun: BenchmarkRun;
  averageMetrics: BenchmarkRun['metrics'];
  targetAchieved: boolean;
  recommendations: string[];
}

class IngestionBenchmark {
  private config: BenchmarkConfig;
  private results: BenchmarkResult;
  private mockKnowledgeGraphService: any;

  constructor(config: BenchmarkConfig) {
    this.config = {
      targetLOCPerMinute: 10000,
      concurrencyLevels: [1, 2, 4, 8],
      batchSizes: [50, 100, 200, 500],
      runs: 3,
      ...config,
    };

    this.results = {
      config: this.config,
      runs: [],
      summary: {} as BenchmarkSummary,
    };

    this.setupMockServices();
  }

  /**
   * Setup mock services for benchmarking
   */
  private setupMockServices(): void {
    this.mockKnowledgeGraphService = {
      createEntitiesBulk: async (entities: any[], _options: any = {}) => {
        // Simulate processing time based on batch size
        const baseLatency = 10; // Base 10ms
        const perEntityLatency = 0.5; // 0.5ms per entity
        const latency = baseLatency + entities.length * perEntityLatency;

        await new Promise((resolve) => setTimeout(resolve, latency));

        return {
          success: true,
          processed: entities.length,
          failed: 0,
          results: entities.map((e) => ({ entity: e, success: true })),
        };
      },

      createRelationshipsBulk: async (
        relationships: any[],
        _options: any = {}
      ) => {
        const baseLatency = 5;
        const perRelLatency = 0.3;
        const latency = baseLatency + relationships.length * perRelLatency;

        await new Promise((resolve) => setTimeout(resolve, latency));

        return {
          success: true,
          processed: relationships.length,
          failed: 0,
          results: relationships.map((r) => ({
            relationship: r,
            success: true,
          })),
        };
      },

      createEmbeddingsBatch: async (entities: any[], _options: any = {}) => {
        // Embeddings are slower
        const baseLatency = 50;
        const perEmbeddingLatency = 2;
        const latency = baseLatency + entities.length * perEmbeddingLatency;

        await new Promise((resolve) => setTimeout(resolve, latency));

        return {
          success: true,
          processed: entities.length,
          failed: 0,
          results: entities.map((e) => ({
            entity: e,
            success: true,
            embedding: new Array(768).fill(0),
          })),
        };
      },
    };
  }

  /**
   * Run the complete benchmark suite
   */
  async runBenchmark(): Promise<BenchmarkResult> {
    console.log('🚀 Starting High-Throughput Ingestion Pipeline Benchmark');
    console.log(`📁 Target Directory: ${this.config.targetDirectory}`);
    console.log(`🎯 Target: ${this.config.targetLOCPerMinute} LOC/minute`);
    console.log('');

    // Discover files to process
    const files = await this.discoverFiles();
    console.log(`📊 Found ${files.length} files to process`);

    if (files.length === 0) {
      throw new Error('No files found to benchmark');
    }

    // Calculate total LOC
    const totalLOC = await this.calculateTotalLOC(files);
    console.log(`📝 Total Lines of Code: ${totalLOC.toLocaleString()}`);
    console.log('');

    // Run benchmarks for different configurations
    let runId = 0;

    for (const concurrency of this.config.concurrencyLevels!) {
      for (const batchSize of this.config.batchSizes!) {
        for (let run = 0; run < this.config.runs!; run++) {
          runId++;
          console.log(
            `🔄 Running benchmark ${runId}: concurrency=${concurrency}, batchSize=${batchSize}, run=${
              run + 1
            }/${this.config.runs}`
          );

          const benchmarkRun = await this.runSingleBenchmark(
            runId,
            files,
            totalLOC,
            concurrency,
            batchSize
          );

          this.results.runs.push(benchmarkRun);

          console.log(
            `   ✅ ${benchmarkRun.metrics.locPerMinute.toLocaleString()} LOC/min, ${benchmarkRun.metrics.filesPerSecond.toFixed(
              2
            )} files/sec`
          );
          console.log(
            `   ⏱️  P95: ${benchmarkRun.metrics.p95LatencyMs.toFixed(
              2
            )}ms, Avg: ${benchmarkRun.metrics.avgLatencyMs.toFixed(2)}ms`
          );

          // Cool down between runs
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    // Generate summary
    this.generateSummary();

    // Output results
    await this.outputResults();

    return this.results;
  }

  /**
   * Run a single benchmark configuration
   */
  private async runSingleBenchmark(
    runId: number,
    files: string[],
    totalLOC: number,
    concurrency: number,
    batchSize: number
  ): Promise<BenchmarkRun> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const latencies: number[] = [];
    const errors: Array<{ file: string; error: string }> = [];

    let filesProcessed = 0;
    let entitiesCreated = 0;
    let relationshipsCreated = 0;
    const embeddingsGenerated = 0;

    try {
      // Create pipeline configuration
      const pipelineConfig: PipelineConfig = {
        eventBus: {
          type: 'memory',
          partitions: Math.max(4, concurrency),
        },
        workers: {
          parsers: Math.max(1, Math.floor(concurrency / 2)),
          entityWorkers: concurrency,
          relationshipWorkers: concurrency,
          embeddingWorkers: Math.max(1, Math.floor(concurrency / 4)),
        },
        queues: {
          maxSize: 10000,
          partitionCount: Math.max(4, concurrency),
          partitions: Math.max(4, concurrency),
          batchSize: 100,
          batchTimeout: 1000,
          retryAttempts: 3,
          retryDelay: 1000,
          persistenceConfig: {
            enabled: false,
          },
        },
        batching: {
          entityBatchSize: batchSize,
          relationshipBatchSize: batchSize,
          embeddingBatchSize: Math.max(25, Math.floor(batchSize / 2)),
          timeoutMs: 30000,
          maxConcurrentBatches: concurrency,
          flushInterval: 1000,
          idempotencyTTL: 300000,
        },
        monitoring: {
          metricsInterval: 5000,
          healthCheckInterval: 10000,
          alertThresholds: {
            queueDepth: 1000,
            latency: 5000,
            errorRate: 0.1,
          },
        },
      };

      // Create adapter and pipeline
      const adapter = createKnowledgeGraphAdapter(
        this.mockKnowledgeGraphService
      );
      const pipeline = new HighThroughputIngestionPipeline(
        pipelineConfig,
        adapter
      );

      // Set up event handlers for metrics collection
      pipeline.on('batch:completed', (data: any) => {
        entitiesCreated += data.entitiesProcessed || 0;
        relationshipsCreated += data.relationshipsProcessed || 0;

        if (data.latency) {
          latencies.push(data.latency);
        }
      });

      // Note: embedding:completed event is not currently implemented

      pipeline.on('pipeline:error', (error: any) => {
        errors.push({
          file: error.context?.filePath || 'unknown',
          error: error.message || 'Unknown error',
        });
      });

      // Start pipeline
      await pipeline.start();

      try {
        // Process files
        const filesToProcess = this.config.maxFiles
          ? files.slice(0, this.config.maxFiles)
          : files;

        for (const file of filesToProcess) {
          const fileStartTime = performance.now();

          try {
            await pipeline.processFile(file);
            filesProcessed++;

            const fileLatency = performance.now() - fileStartTime;
            latencies.push(fileLatency);
          } catch (error) {
            errors.push({
              file,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        // Wait for pipeline to complete processing
        await pipeline.waitForCompletion();
      } finally {
        await pipeline.stop();
      }
    } catch (error) {
      errors.push({
        file: 'pipeline',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    const totalTimeMs = endTime - startTime;

    // Calculate metrics
    const locPerMinute = (totalLOC / totalTimeMs) * 60 * 1000;
    const filesPerSecond = (filesProcessed / totalTimeMs) * 1000;
    const entitiesPerSecond = (entitiesCreated / totalTimeMs) * 1000;

    // Calculate latency percentiles
    latencies.sort((a, b) => a - b);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p99Index = Math.floor(latencies.length * 0.99);
    // Use safe array access to avoid dynamic property indexing warnings
    // and to gracefully handle out-of-range indices.
    const p95LatencyMs = latencies.at(p95Index) ?? 0;
    const p99LatencyMs = latencies.at(p99Index) ?? 0;
    const avgLatencyMs =
      latencies.length > 0
        ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
        : 0;

    return {
      runId,
      concurrency,
      batchSize,
      metrics: {
        totalTimeMs,
        filesProcessed,
        totalLOC,
        entitiesCreated,
        relationshipsCreated,
        embeddingsGenerated,
        errors: errors.length,
        locPerMinute,
        filesPerSecond,
        entitiesPerSecond,
        memoryUsageMB: endMemory - startMemory,
        p95LatencyMs,
        p99LatencyMs,
        avgLatencyMs,
      },
      errors,
    };
  }

  /**
   * Discover files to process
   */
  private async discoverFiles(): Promise<string[]> {
    const files: string[] = [];

    async function scan(dirPath: string): Promise<void> {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);

          if (entry.isDirectory()) {
            // Skip common directories
            if (
              ['node_modules', '.git', 'dist', 'build'].includes(entry.name)
            ) {
              continue;
            }
            await scan(fullPath);
          } else if (entry.isFile()) {
            // Check file extensions
            const ext = path.extname(entry.name).toLowerCase();
            const validExts = [
              '.ts',
              '.js',
              '.tsx',
              '.jsx',
              '.py',
              '.java',
              '.cpp',
              '.c',
              '.h',
            ];

            if (validExts.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not scan directory ${dirPath}:`, error);
      }
    }

    await scan(this.config.targetDirectory);
    return files;
  }

  /**
   * Calculate total lines of code
   */
  private async calculateTotalLOC(files: string[]): Promise<number> {
    let totalLOC = 0;

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content
          .split('\n')
          .filter((line) => line.trim().length > 0);
        totalLOC += lines.length;
      } catch (error) {
        console.warn(`Warning: Could not read file ${file}:`, error);
      }
    }

    return totalLOC;
  }

  /**
   * Generate benchmark summary
   */
  private generateSummary(): void {
    if (this.results.runs.length === 0) {
      throw new Error('No benchmark runs to summarize');
    }

    // Find best and worst runs by LOC/minute
    const bestRun = this.results.runs.reduce((best, current) =>
      current.metrics.locPerMinute > best.metrics.locPerMinute ? current : best
    );

    const worstRun = this.results.runs.reduce((worst, current) =>
      current.metrics.locPerMinute < worst.metrics.locPerMinute
        ? current
        : worst
    );

    // Calculate averages
    const avgMetrics = this.calculateAverageMetrics();

    // Check if target was achieved
    const targetAchieved =
      bestRun.metrics.locPerMinute >= this.config.targetLOCPerMinute!;

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    this.results.summary = {
      bestRun,
      worstRun,
      averageMetrics: avgMetrics,
      targetAchieved,
      recommendations,
    };
  }

  /**
   * Calculate average metrics across all runs
   */
  private calculateAverageMetrics(): BenchmarkRun['metrics'] {
    const runs = this.results.runs;
    const count = runs.length;

    return {
      totalTimeMs:
        runs.reduce((sum, r) => sum + r.metrics.totalTimeMs, 0) / count,
      filesProcessed:
        runs.reduce((sum, r) => sum + r.metrics.filesProcessed, 0) / count,
      totalLOC: runs[0].metrics.totalLOC, // Same for all runs
      entitiesCreated:
        runs.reduce((sum, r) => sum + r.metrics.entitiesCreated, 0) / count,
      relationshipsCreated:
        runs.reduce((sum, r) => sum + r.metrics.relationshipsCreated, 0) /
        count,
      embeddingsGenerated:
        runs.reduce((sum, r) => sum + r.metrics.embeddingsGenerated, 0) / count,
      errors: runs.reduce((sum, r) => sum + r.metrics.errors, 0) / count,
      locPerMinute:
        runs.reduce((sum, r) => sum + r.metrics.locPerMinute, 0) / count,
      filesPerSecond:
        runs.reduce((sum, r) => sum + r.metrics.filesPerSecond, 0) / count,
      entitiesPerSecond:
        runs.reduce((sum, r) => sum + r.metrics.entitiesPerSecond, 0) / count,
      memoryUsageMB:
        runs.reduce((sum, r) => sum + r.metrics.memoryUsageMB, 0) / count,
      p95LatencyMs:
        runs.reduce((sum, r) => sum + r.metrics.p95LatencyMs, 0) / count,
      p99LatencyMs:
        runs.reduce((sum, r) => sum + r.metrics.p99LatencyMs, 0) / count,
      avgLatencyMs:
        runs.reduce((sum, r) => sum + r.metrics.avgLatencyMs, 0) / count,
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const bestRun = this.results.summary.bestRun;
    const avgMetrics = this.results.summary.averageMetrics;

    // Concurrency recommendations
    const concurrencyPerformance = new Map<number, number>();
    for (const run of this.results.runs) {
      const existing = concurrencyPerformance.get(run.concurrency) || 0;
      concurrencyPerformance.set(
        run.concurrency,
        Math.max(existing, run.metrics.locPerMinute)
      );
    }

    const bestConcurrency = Array.from(concurrencyPerformance.entries()).reduce(
      (best, current) => (current[1] > best[1] ? current : best)
    )[0];

    recommendations.push(`Optimal concurrency level: ${bestConcurrency}`);

    // Batch size recommendations
    const batchPerformance = new Map<number, number>();
    for (const run of this.results.runs) {
      const existing = batchPerformance.get(run.batchSize) || 0;
      batchPerformance.set(
        run.batchSize,
        Math.max(existing, run.metrics.locPerMinute)
      );
    }

    const bestBatchSize = Array.from(batchPerformance.entries()).reduce(
      (best, current) => (current[1] > best[1] ? current : best)
    )[0];

    recommendations.push(`Optimal batch size: ${bestBatchSize}`);

    // Performance recommendations
    if (avgMetrics.p95LatencyMs > 1000) {
      recommendations.push(
        'High P95 latency detected - consider reducing batch sizes'
      );
    }

    if (avgMetrics.memoryUsageMB > 500) {
      recommendations.push(
        'High memory usage - consider reducing concurrency or batch sizes'
      );
    }

    if (avgMetrics.errors > 0) {
      recommendations.push(
        'Errors detected - check error handling and retry logic'
      );
    }

    if (!this.results.summary.targetAchieved) {
      const shortfall =
        this.config.targetLOCPerMinute! - bestRun.metrics.locPerMinute;
      recommendations.push(
        `Target not achieved. Shortfall: ${shortfall.toFixed(0)} LOC/min`
      );
      recommendations.push(
        'Consider: increasing concurrency, optimizing AST parsing, or using faster storage'
      );
    }

    return recommendations;
  }

  /**
   * Output benchmark results
   */
  private async outputResults(): Promise<void> {
    const report = this.generateReport();

    console.log('\n' + '='.repeat(80));
    console.log('📊 BENCHMARK RESULTS');
    console.log('='.repeat(80));
    console.log(report);

    // Save to file if output path specified
    if (this.config.outputPath) {
      const jsonResults = JSON.stringify(this.results, null, 2);
      await fs.writeFile(this.config.outputPath, jsonResults, 'utf-8');
      console.log(`\n💾 Results saved to: ${this.config.outputPath}`);
    }
  }

  /**
   * Generate human-readable report
   */
  private generateReport(): string {
    const {
      bestRun,
      worstRun,
      averageMetrics,
      targetAchieved,
      recommendations,
    } = this.results.summary;

    return `
🎯 TARGET: ${this.config.targetLOCPerMinute!.toLocaleString()} LOC/minute
${targetAchieved ? '✅' : '❌'} Target ${
      targetAchieved ? 'ACHIEVED' : 'NOT ACHIEVED'
    }

📈 BEST PERFORMANCE:
   Configuration: ${bestRun.concurrency} workers, batch size ${
      bestRun.batchSize
    }
   Throughput: ${bestRun.metrics.locPerMinute.toLocaleString()} LOC/min
   Files/sec: ${bestRun.metrics.filesPerSecond.toFixed(2)}
   Entities/sec: ${bestRun.metrics.entitiesPerSecond.toFixed(0)}
   P95 Latency: ${bestRun.metrics.p95LatencyMs.toFixed(2)}ms
   Memory: ${bestRun.metrics.memoryUsageMB.toFixed(1)}MB

📉 WORST PERFORMANCE:
   Configuration: ${worstRun.concurrency} workers, batch size ${
      worstRun.batchSize
    }
   Throughput: ${worstRun.metrics.locPerMinute.toLocaleString()} LOC/min

📊 AVERAGE METRICS:
   Throughput: ${averageMetrics.locPerMinute.toLocaleString()} LOC/min
   Files processed: ${averageMetrics.filesProcessed.toFixed(0)}
   Entities created: ${averageMetrics.entitiesCreated.toFixed(0)}
   Relationships: ${averageMetrics.relationshipsCreated.toFixed(0)}
   Embeddings: ${averageMetrics.embeddingsGenerated.toFixed(0)}
   Errors: ${averageMetrics.errors.toFixed(1)}
   P95 Latency: ${averageMetrics.p95LatencyMs.toFixed(2)}ms
   Memory Usage: ${averageMetrics.memoryUsageMB.toFixed(1)}MB

💡 RECOMMENDATIONS:
${recommendations.map((r) => `   • ${r}`).join('\n')}

📋 RUNS COMPLETED: ${this.results.runs.length}
`;
  }
}

/**
 * Main function to run benchmark
 */
async function main(): Promise<void> {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const targetDirectory = args[0] || process.cwd();
  const outputPath = args[1];

  // Create benchmark configuration
  const config: BenchmarkConfig = {
    targetDirectory,
    outputPath,
    fileFilters: ['*.ts', '*.js', '*.tsx', '*.jsx'],
    maxFiles: parseInt(process.env.MAX_FILES || '0') || undefined,
    targetLOCPerMinute: parseInt(process.env.TARGET_LOC_PER_MINUTE || '10000'),
    concurrencyLevels: [1, 2, 4, 8, 16],
    batchSizes: [25, 50, 100, 200, 500],
    runs: parseInt(process.env.BENCHMARK_RUNS || '3'),
  };

  try {
    const benchmark = new IngestionBenchmark(config);
    await benchmark.runBenchmark();

    console.log('\n🎉 Benchmark completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Benchmark failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { IngestionBenchmark, BenchmarkConfig, BenchmarkResult };

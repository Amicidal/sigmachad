#!/usr/bin/env tsx

/**
 * Demo script for High-Throughput Ingestion Pipeline
 * Demonstrates the pipeline functionality with mock data
 */

import {
  HighThroughputIngestionPipeline,
  createDefaultPipelineConfig,
  createMockChangeEvent,
  createMockChangeFragment,
  createKnowledgeGraphAdapter
} from '../src/ingestion/index.js';

// Mock KnowledgeGraphService
const mockKnowledgeGraphService = {
  async createEntitiesBulk(entities: any[]) {
    console.log(`[MockKG] Created ${entities.length} entities in bulk`);
    return {
      success: true,
      processed: entities.length,
      failed: 0,
      results: entities.map(e => ({ entity: e, success: true }))
    };
  },

  async createRelationshipsBulk(relationships: any[]) {
    console.log(`[MockKG] Created ${relationships.length} relationships in bulk`);
    return {
      success: true,
      processed: relationships.length,
      failed: 0,
      results: relationships.map(r => ({ relationship: r, success: true }))
    };
  },

  async createEmbeddingsBatch(entities: any[]) {
    console.log(`[MockKG] Created embeddings for ${entities.length} entities`);
    return {
      success: true,
      processed: entities.length,
      failed: 0,
      results: entities.map(e => ({ entity: e, success: true }))
    };
  }
};

async function runDemo() {
  console.log('🚀 Starting High-Throughput Ingestion Pipeline Demo\n');

  // Create pipeline configuration
  const config = createDefaultPipelineConfig();

  // Scale down for demo
  config.workers.parsers = 2;
  config.workers.entityWorkers = 2;
  config.workers.relationshipWorkers = 2;
  config.workers.embeddingWorkers = 1;
  config.batching.entityBatchSize = 10;
  config.batching.relationshipBatchSize = 10;
  config.monitoring.metricsInterval = 2000;

  console.log('📋 Pipeline Configuration:');
  console.log(`  - Parsers: ${config.workers.parsers}`);
  console.log(`  - Entity Workers: ${config.workers.entityWorkers}`);
  console.log(`  - Relationship Workers: ${config.workers.relationshipWorkers}`);
  console.log(`  - Embedding Workers: ${config.workers.embeddingWorkers}`);
  console.log(`  - Entity Batch Size: ${config.batching.entityBatchSize}`);
  console.log();

  // Create knowledge graph adapter
  const kgAdapter = createKnowledgeGraphAdapter(mockKnowledgeGraphService);

  // Create pipeline
  const pipeline = new HighThroughputIngestionPipeline(config, kgAdapter);

  // Set up event listeners
  pipeline.on('pipeline:started', () => {
    console.log('✅ Pipeline started successfully');
  });

  pipeline.on('event:received', (event) => {
    console.log(`📥 Received event: ${event.id} (${event.filePath})`);
  });

  pipeline.on('metrics:updated', (metrics) => {
    console.log(`📊 Metrics: ${metrics.totalEvents} events, ${metrics.eventsPerSecond.toFixed(1)} events/sec, Queue: ${metrics.queueMetrics.queueDepth}`);
  });

  pipeline.on('pipeline:error', (error) => {
    console.error('❌ Pipeline error:', error.message);
  });

  try {
    // Start the pipeline
    console.log('🟢 Starting pipeline...');
    await pipeline.start();

    // Wait a moment for startup
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate and ingest mock change events
    console.log('\n📁 Generating mock change events...');
    const changeEvents = [];
    for (let i = 0; i < 20; i++) {
      changeEvents.push(createMockChangeEvent({
        id: `demo-event-${i}`,
        filePath: `/demo/file${i}.ts`,
        namespace: 'demo',
        module: `demo-module-${i % 5}`,
        size: 1000 + (i * 100),
        diffHash: `hash-${i}`
      }));
    }

    console.log(`📤 Ingesting ${changeEvents.length} change events...`);
    await pipeline.ingestChangeEvents(changeEvents);

    // Wait for processing
    console.log('⏳ Waiting for processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate and process change fragments
    console.log('\n🔄 Generating change fragments...');
    const changeFragments = [];
    for (let i = 0; i < 10; i++) {
      changeFragments.push(createMockChangeFragment({
        id: `demo-fragment-${i}`,
        eventId: `demo-event-${i}`,
        data: {
          id: `demo-entity-${i}`,
          type: 'function',
          name: `demoFunction${i}`,
          properties: { module: `demo-module-${i % 3}` },
          metadata: { createdAt: new Date() }
        }
      }));
    }

    console.log(`🔄 Processing ${changeFragments.length} change fragments...`);
    await pipeline.processChangeFragments(changeFragments);

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Schedule enrichment tasks
    console.log('\n🎯 Scheduling enrichment tasks...');
    for (let i = 0; i < 5; i++) {
      await pipeline.scheduleEnrichment({
        id: `enrichment-${i}`,
        type: 'embedding',
        entityId: `demo-entity-${i}`,
        priority: 5,
        data: { content: `content for entity ${i}` },
        dependencies: [],
        createdAt: new Date()
      });
    }

    // Wait for enrichment processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Display final metrics
    console.log('\n📈 Final Metrics:');
    const finalMetrics = pipeline.getMetrics();
    console.log(`  - Total Events Processed: ${finalMetrics.totalEvents}`);
    console.log(`  - Average Latency: ${finalMetrics.averageLatency.toFixed(2)}ms`);
    console.log(`  - P95 Latency: ${finalMetrics.p95Latency.toFixed(2)}ms`);
    console.log(`  - Queue Depth: ${finalMetrics.queueMetrics.queueDepth}`);
    console.log(`  - Completed Batches: ${finalMetrics.batchMetrics.completedBatches}`);
    console.log(`  - Failed Batches: ${finalMetrics.batchMetrics.failedBatches}`);
    console.log(`  - Active Workers: ${finalMetrics.workerMetrics.length}`);

    // Display pipeline state
    console.log('\n📋 Pipeline State:');
    const state = pipeline.getState();
    console.log(`  - Status: ${state.status}`);
    console.log(`  - Processed Events: ${state.processedEvents}`);
    console.log(`  - Error Count: ${state.errorCount}`);
    console.log(`  - Current Load: ${(state.currentLoad * 100).toFixed(1)}%`);

    // Display telemetry
    console.log('\n🔍 Telemetry Summary:');
    const telemetry = pipeline.getTelemetry();
    console.log(`  - Memory Usage: ${(telemetry.performance.memory / 1024 / 1024).toFixed(1)} MB`);
    console.log(`  - Total Workers: ${telemetry.workers.length}`);
    console.log(`  - Error Count: ${telemetry.errors.count}`);

    console.log('\n🛑 Stopping pipeline...');
    await pipeline.stop();

    console.log('✅ Demo completed successfully!');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    await pipeline.stop();
    process.exit(1);
  }
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch(console.error);
}

export { runDemo };
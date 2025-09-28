/**
 * Comprehensive examples demonstrating the enhanced rollback capabilities
 */

import {
  RollbackManager,
  PostgreSQLRollbackStore,
  PartialRollbackStrategy,
  TimebasedRollbackStrategy,
  DryRunRollbackStrategy,
  ConflictResolutionEngine,
  IntegratedRollbackManager,
  createDefaultRollbackConfig,
  createDefaultStoreOptions,
  RollbackOperationType,
  RollbackStrategy,
  ConflictStrategy
} from '../index.js';

// Example interfaces for demonstration
interface MockDatabaseService {
  isReady(): Promise<boolean>;
}

interface MockKnowledgeGraphService {
  getEntities(): Promise<any[]>;
  getRelationships(): Promise<any[]>;
  restoreEntities(entities: any[]): Promise<void>;
  restoreRelationships(relationships: any[]): Promise<void>;
}

interface MockSessionManager {
  getCurrentSessionId(): string | null;
  getSessionData(sessionId: string): Promise<any>;
  updateSessionData(sessionId: string, data: any): Promise<void>;
  createSessionCheckpoint(sessionId: string, metadata: any): Promise<string>;
  restoreSessionCheckpoint(sessionId: string, checkpointId: string): Promise<void>;
  on(event: string, listener: (...args: any[]) => void): void;
}

interface MockAuditLogger {
  logRollbackCreation(rollbackPoint: any, context: any): Promise<void>;
  logRollbackExecution(operation: any, result: any, context: any): Promise<void>;
  logConflictResolution(conflict: any, resolution: any, context: any): Promise<void>;
  logSystemEvent(event: any, context: any): Promise<void>;
  getAuditTrail(filters: any): Promise<any[]>;
}

/**
 * Example 1: Basic Enhanced Rollback Setup with PostgreSQL Persistence
 */
export async function basicEnhancedRollbackExample() {
  console.log('=== Basic Enhanced Rollback Example ===');

  // Create PostgreSQL-backed rollback store
  const pgStore = new PostgreSQLRollbackStore(
    createDefaultRollbackConfig(),
    createDefaultStoreOptions(),
    {
      connectionString: 'postgresql://user:pass@localhost:5432/memento',
      schema: 'rollback',
      tablePrefix: 'enhanced_'
    }
  );

  // Initialize the store
  await pgStore.initialize();

  // Create rollback manager with PostgreSQL persistence
  const rollbackManager = new RollbackManager(
    { ...createDefaultRollbackConfig(), enablePersistence: true },
    createDefaultStoreOptions()
  );

  // Set up mock services
  const mockDbService: MockDatabaseService = {
    isReady: async () => true
  };

  const mockKgService: MockKnowledgeGraphService = {
    getEntities: async () => [
      { id: '1', type: 'entity', name: 'Example Entity' }
    ],
    getRelationships: async () => [
      { id: '1', fromEntityId: '1', toEntityId: '2', type: 'DEPENDS_ON' }
    ],
    restoreEntities: async (entities) => {
      console.log(`Restoring ${entities.length} entities`);
    },
    restoreRelationships: async (relationships) => {
      console.log(`Restoring ${relationships.length} relationships`);
    }
  };

  rollbackManager.setServices({
    databaseService: mockDbService,
    knowledgeGraphService: mockKgService
  });

  // Create a rollback point
  const rollbackPoint = await rollbackManager.createRollbackPoint(
    'Enhanced Example Rollback',
    'Demonstration of enhanced rollback capabilities',
    { source: 'example', version: '1.0' }
  );

  console.log(`Created rollback point: ${rollbackPoint.id}`);

  // Simulate some changes and then rollback
  const operation = await rollbackManager.rollback(rollbackPoint.id, {
    type: RollbackOperationType.FULL,
    strategy: RollbackStrategy.SAFE
  });

  console.log(`Started rollback operation: ${operation.id}`);

  await rollbackManager.shutdown();
  await pgStore.shutdown();
}

/**
 * Example 2: Partial Rollback with Selection Criteria
 */
export async function partialRollbackExample() {
  console.log('\n=== Partial Rollback Example ===');

  const rollbackManager = new RollbackManager(
    createDefaultRollbackConfig(),
    createDefaultStoreOptions()
  );

  // Create partial rollback strategy
  const partialStrategy = new PartialRollbackStrategy();

  // Create a rollback point
  const rollbackPoint = await rollbackManager.createRollbackPoint(
    'Partial Rollback Demo',
    'Demonstrating selective rollback of specific components'
  );

  // Set up partial rollback context
  const partialContext = {
    operation: {
      id: 'partial-op-1',
      type: RollbackOperationType.PARTIAL,
      targetRollbackPointId: rollbackPoint.id,
      status: 'pending' as any,
      progress: 0,
      startedAt: new Date(),
      strategy: RollbackStrategy.SAFE,
      log: []
    },
    targetRollbackPoint: rollbackPoint,
    snapshots: [],
    diff: [
      {
        path: 'entity:user-service',
        operation: 'update' as any,
        oldValue: { version: '1.0', status: 'active' },
        newValue: { version: '1.1', status: 'active' }
      },
      {
        path: 'entity:auth-service',
        operation: 'update' as any,
        oldValue: { version: '2.0', status: 'active' },
        newValue: { version: '2.1', status: 'active' }
      },
      {
        path: 'relationship:user-auth-depends',
        operation: 'create' as any,
        oldValue: null,
        newValue: { fromEntityId: 'user-service', toEntityId: 'auth-service', type: 'DEPENDS_ON' }
      }
    ],
    conflictResolution: { strategy: ConflictStrategy.MERGE },
    partialSelections: [
      {
        type: 'entity' as any,
        identifiers: ['user-service'],
        priority: 10
      },
      {
        type: 'component' as any,
        identifiers: ['auth'],
        includePattern: /auth/,
        priority: 5
      }
    ]
  };

  // Generate preview first
  const preview = await partialStrategy.generatePreview(partialContext);
  console.log('Partial rollback preview:', {
    totalChanges: preview.totalChanges,
    affectedEntities: preview.affectedItems.entities.length,
    estimatedDuration: preview.estimatedDuration
  });

  // Execute partial rollback
  await partialStrategy.execute(partialContext);

  await rollbackManager.shutdown();
}

/**
 * Example 3: Time-based Rollback
 */
export async function timebasedRollbackExample() {
  console.log('\n=== Time-based Rollback Example ===');

  const rollbackManager = new RollbackManager(
    createDefaultRollbackConfig(),
    createDefaultStoreOptions()
  );

  const timebasedStrategy = new TimebasedRollbackStrategy();

  // Create a rollback point
  const rollbackPoint = await rollbackManager.createRollbackPoint(
    'Time-based Rollback Demo',
    'Demonstrating rollback to a specific time window'
  );

  // Set up time-based rollback context
  const timebasedContext = {
    operation: {
      id: 'timebased-op-1',
      type: RollbackOperationType.SELECTIVE,
      targetRollbackPointId: rollbackPoint.id,
      status: 'pending' as any,
      progress: 0,
      startedAt: new Date(),
      strategy: RollbackStrategy.IMMEDIATE,
      log: []
    },
    targetRollbackPoint: rollbackPoint,
    snapshots: [],
    diff: [
      {
        path: 'entity:recent-change',
        operation: 'update' as any,
        oldValue: { timestamp: new Date(Date.now() - 5 * 60 * 1000) }, // 5 min ago
        newValue: { timestamp: new Date() },
        metadata: { timestamp: new Date(Date.now() - 2 * 60 * 1000) } // 2 min ago
      },
      {
        path: 'entity:old-change',
        operation: 'update' as any,
        oldValue: { timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // 24 hours ago
        newValue: { timestamp: new Date() },
        metadata: { timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000) } // 23 hours ago
      }
    ],
    conflictResolution: { strategy: ConflictStrategy.SKIP },
    timebasedFilter: {
      rollbackToTimestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
      maxChangeAge: 30 * 60 * 1000 // 30 minutes
    }
  };

  // Execute time-based rollback
  await timebasedStrategy.execute(timebasedContext);

  await rollbackManager.shutdown();
}

/**
 * Example 4: Advanced Conflict Resolution with Visual Diffs
 */
export async function conflictResolutionExample() {
  console.log('\n=== Conflict Resolution Example ===');

  const conflictEngine = new ConflictResolutionEngine({
    preferNewer: true,
    preserveStructure: true,
    allowPartialMerge: true,
    semanticAnalysis: true
  });

  // Example conflict
  const conflict = {
    path: 'entity:config-service',
    type: 'VALUE_MISMATCH' as any,
    currentValue: {
      port: 8080,
      environment: 'production',
      features: ['auth', 'logging', 'metrics']
    },
    rollbackValue: {
      port: 3000,
      environment: 'development',
      features: ['auth', 'logging']
    },
    context: {
      entityType: 'service-config',
      lastModified: new Date()
    }
  };

  // Generate visual diff
  const visualDiff = await conflictEngine.generateVisualDiff(conflict);
  console.log('Visual diff generated:', {
    id: visualDiff.id,
    type: visualDiff.type,
    similarity: visualDiff.metadata.similarity,
    autoResolvable: visualDiff.summary.autoResolvable,
    recommendedStrategy: visualDiff.summary.recommendedStrategy
  });

  // Generate resolution options
  const conflictUI = await conflictEngine.generateConflictUI(conflict);
  console.log('Conflict resolution options:', {
    optionsCount: conflictUI.options.length,
    primaryRecommendation: conflictUI.recommendations.primary.name,
    alternativeCount: conflictUI.recommendations.alternatives.length
  });

  // Perform smart merge
  const mergeResult = await conflictEngine.smartMerge(conflict, {
    rollbackId: 'test-rollback',
    path: ['entity', 'config-service'],
    priority: 7
  });

  console.log('Smart merge result:', {
    success: mergeResult.success,
    strategy: mergeResult.strategy,
    confidence: mergeResult.confidence,
    warnings: mergeResult.warnings
  });

  if (mergeResult.success) {
    console.log('Merged value:', mergeResult.mergedValue);
  }
}

/**
 * Example 5: Dry Run Rollback Analysis
 */
export async function dryRunExample() {
  console.log('\n=== Dry Run Example ===');

  const dryRunStrategy = new DryRunRollbackStrategy();

  // Create sample diff for analysis
  const analysisContext = {
    operation: {
      id: 'dryrun-op-1',
      type: RollbackOperationType.DRY_RUN,
      targetRollbackPointId: 'test-rollback',
      status: 'pending' as any,
      progress: 0,
      startedAt: new Date(),
      strategy: RollbackStrategy.SAFE,
      log: []
    },
    targetRollbackPoint: {
      id: 'test-rollback',
      name: 'Test Rollback',
      timestamp: new Date(),
      metadata: {},
      sessionId: 'session-123'
    },
    snapshots: [],
    diff: [
      {
        path: 'entity:service-a',
        operation: 'update' as any,
        oldValue: { version: '1.0' },
        newValue: { version: '1.1' }
      },
      {
        path: 'entity:service-b',
        operation: 'delete' as any,
        oldValue: { id: 'service-b', status: 'active' },
        newValue: null
      },
      {
        path: 'relationship:service-dependency',
        operation: 'create' as any,
        oldValue: null,
        newValue: { from: 'service-a', to: 'service-b', type: 'DEPENDS_ON' }
      }
    ],
    conflictResolution: { strategy: ConflictStrategy.MERGE },
    dryRun: true
  };

  // Run dry-run analysis
  const preview = await dryRunStrategy.execute(analysisContext);
  console.log('Dry-run analysis results:', {
    totalChanges: preview.totalChanges,
    changesByType: Object.fromEntries(preview.changesByType),
    estimatedDuration: preview.estimatedDuration,
    potentialConflicts: preview.potentialConflicts.length,
    affectedEntities: preview.affectedItems.entities.length,
    dependencyWarnings: preview.dependencies.circular.length > 0 ? 'Circular dependencies detected' : 'No circular dependencies'
  });
}

/**
 * Example 6: Full Integration with SessionManager and Audit Logging
 */
export async function fullIntegrationExample() {
  console.log('\n=== Full Integration Example ===');

  // Create base rollback manager
  const rollbackManager = new RollbackManager(
    createDefaultRollbackConfig(),
    createDefaultStoreOptions()
  );

  // Mock session manager
  const mockSessionManager: MockSessionManager = {
    getCurrentSessionId: () => 'session-123',
    getSessionData: async (sessionId) => ({
      id: sessionId,
      userId: 'user-456',
      startTime: new Date(),
      lastActivity: new Date(),
      metadata: {},
      rollbackPoints: [],
      checkpoints: []
    }),
    updateSessionData: async (sessionId, data) => {
      console.log(`Updated session ${sessionId} with:`, data);
    },
    createSessionCheckpoint: async (sessionId, metadata) => {
      console.log(`Created checkpoint for session ${sessionId}:`, metadata);
      return `checkpoint-${Date.now()}`;
    },
    restoreSessionCheckpoint: async (sessionId, checkpointId) => {
      console.log(`Restored checkpoint ${checkpointId} for session ${sessionId}`);
    },
    on: (event, listener) => {
      // Mock event listener registration
    }
  };

  // Mock audit logger
  const mockAuditLogger: MockAuditLogger = {
    logRollbackCreation: async (rollbackPoint, context) => {
      console.log('Audit: Rollback point created', { id: rollbackPoint.id, context });
    },
    logRollbackExecution: async (operation, result, context) => {
      console.log('Audit: Rollback executed', { operationId: operation.id, success: result.success });
    },
    logConflictResolution: async (conflict, resolution, context) => {
      console.log('Audit: Conflict resolved', { path: conflict.path, strategy: resolution?.strategy });
    },
    logSystemEvent: async (event, context) => {
      console.log('Audit: System event', { type: event.type, severity: event.severity });
    },
    getAuditTrail: async (filters) => {
      return []; // Mock empty audit trail
    }
  };

  // Create integrated rollback manager
  const integratedManager = new IntegratedRollbackManager(rollbackManager, {
    sessionIntegration: {
      enabled: true,
      autoCreateCheckpoints: true,
      checkpointThreshold: 5,
      sessionRollbackLimit: 20
    },
    auditLogging: {
      enabled: true,
      logLevel: 'info',
      retentionDays: 30,
      sensitiveDataMask: true
    },
    metrics: {
      enabled: true,
      collectInterval: 60000,
      customMetrics: true
    },
    notifications: {
      enabled: true,
      rollbackCreated: true,
      rollbackFailed: true,
      criticalConflicts: true,
      channels: ['ui', 'webhook']
    }
  });

  // Set integrations
  integratedManager.setIntegrations({
    sessionManager: mockSessionManager,
    auditLogger: mockAuditLogger,
    metricsCollector: {
      recordRollbackCreation: (point, duration) => console.log(`Metrics: Rollback created in ${duration}ms`),
      recordRollbackExecution: (op, result, duration) => console.log(`Metrics: Rollback executed in ${duration}ms`),
      recordConflictResolution: (conflicts, resolved, duration) => console.log(`Metrics: ${resolved}/${conflicts} conflicts resolved`),
      recordSystemMetric: (name, value, tags) => console.log(`Metrics: ${name} = ${value}`, tags),
      incrementCounter: (name, tags) => console.log(`Metrics: Increment ${name}`, tags)
    },
    notificationService: {
      notifyRollbackCreated: async (point, context) => console.log('Notification: Rollback created', context.severity),
      notifyRollbackExecuted: async (op, result, context) => console.log('Notification: Rollback executed', context.severity),
      notifyRollbackFailed: async (op, error, context) => console.log('Notification: Rollback failed', context.severity),
      notifyCriticalConflict: async (conflicts, context) => console.log('Notification: Critical conflict', context.severity)
    }
  });

  // Create a rollback point with full integration
  const rollbackPoint = await integratedManager.createRollbackPoint(
    'Integrated Rollback Demo',
    'Demonstrating full integration capabilities',
    { feature: 'integration', priority: 'high' }
  );

  console.log(`Created integrated rollback point: ${rollbackPoint.id}`);

  // Get enhanced metrics
  const metrics = await integratedManager.getEnhancedMetrics();
  console.log('Enhanced metrics:', {
    totalRollbackPoints: metrics.totalRollbackPoints,
    sessionMetrics: metrics.sessionMetrics,
    auditMetrics: metrics.auditMetrics
  });

  // Shutdown
  await rollbackManager.shutdown();
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  try {
    await basicEnhancedRollbackExample();
    await partialRollbackExample();
    await timebasedRollbackExample();
    await conflictResolutionExample();
    await dryRunExample();
    await fullIntegrationExample();

    console.log('\n=== All examples completed successfully! ===');
  } catch (error) {
    console.error('Example execution failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
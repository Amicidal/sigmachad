# Temporal Tracking User Guide

## Overview

The Temporal Tracking system provides comprehensive monitoring and analysis of test evolution, relationships, and performance over time. This guide covers practical usage, common scenarios, and best practices for leveraging temporal insights in your development workflow.

## Getting Started

### Basic Setup

Initialize the temporal tracking system with sensible defaults:

```typescript
import { createDefaultTemporalSystem } from '@sigmachad/testing/temporal';

// Create default system with balanced configuration
const temporalSystem = await createDefaultTemporalSystem();

// Access individual services
const { tracker, evolution, metrics, visualization, ciIntegration } = temporalSystem;
```

### Configuration Options

Choose a configuration that matches your project needs:

```typescript
// Lightweight system for smaller projects
const lightweightSystem = await createLightweightTemporalSystem();

// High-performance system for large-scale projects
const performanceSystem = await createHighPerformanceTemporalSystem();

// Custom configuration
const customSystem = await createTemporalTrackingSystem({
  maxTrendDataPoints: 500,
  flakinessThreshold: 0.1,        // 10% failure rate threshold
  coverageChangeThreshold: 0.05,  // 5% coverage change threshold
  performanceRegressionThreshold: 1.5, // 50% slowdown threshold
  obsolescenceDetectionEnabled: true,
  trendAnalysisPeriod: 'weekly',
  batchSize: 100
});
```

## Core Features and Usage

### 1. Test Execution Tracking

Track individual test executions with rich metadata:

```typescript
// Track a test execution
await tracker.trackExecution({
  executionId: 'exec_123',
  testId: 'test_user_login',
  entityId: 'src/auth/login.ts',
  suiteId: 'auth_suite',
  runId: 'ci_run_456',
  timestamp: new Date(),
  status: 'pass',
  duration: 150, // milliseconds
  coverage: {
    overall: 0.85,
    lines: 0.88,
    branches: 0.82,
    functions: 0.90,
    statements: 0.87
  },
  metadata: {
    testType: 'integration',
    suiteId: 'auth_suite',
    confidence: 0.9,
    why: 'Tests user authentication flow'
  }
});
```

### 2. Relationship Management

Establish and track test-to-code relationships:

```typescript
// Create a new test relationship
await tracker.trackRelationshipChange(
  'test_user_login',
  'src/auth/login.ts',
  'TESTS',
  {
    testType: 'integration',
    suiteId: 'auth_suite',
    confidence: 0.95,
    why: 'Direct testing of login functionality'
  },
  'changeset_789'
);

// Query active relationships
const activeRelationships = await tracker.getActiveRelationships(
  'test_user_login' // testId
);

// Close a relationship when no longer valid
await tracker.closeRelationship('rel_test_user_login_src_auth_login_ts_TESTS_auth_suite');
```

### 3. Timeline Queries

Query historical test data with flexible filters:

```typescript
// Query test timeline for specific time range
const timelineQuery = {
  testId: 'test_user_login',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  eventTypes: ['flakiness_detected', 'performance_regression'],
  includeRelationships: true,
  limit: 50
};

const timeline = await tracker.queryTimeline(timelineQuery);

// Access different data types
const { events, relationships, snapshots, trends } = timeline;
```

## Common Use Cases

### 1. Flakiness Detection and Analysis

Monitor and analyze test stability:

```typescript
// Generate flakiness trend chart
const flakinessChart = await visualization.generateFlakinessChart(
  executions,
  {
    movingAverageWindow: 7,      // 7-day moving average
    flakinessThreshold: 0.1,     // 10% failure rate threshold
    showConfidenceIntervals: true
  }
);

// Check for flaky tests
const { dataPoints, annotations, threshold } = flakinessChart;

// Find tests exceeding flakiness threshold
const flakyTests = dataPoints.filter(point =>
  point.flakinessScore > threshold
);

console.log(`Found ${flakyTests.length} flaky test periods`);
```

### 2. Coverage Evolution Tracking

Monitor test coverage changes over time:

```typescript
// Generate coverage heatmap
const coverageHeatmap = await visualization.generateCoverageHeatmap(
  executions,
  {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  },
  {
    gridSize: 20,
    coverageThresholds: {
      low: 0.3,     // Red below 30%
      medium: 0.7,  // Yellow 30-70%
      high: 0.9     // Green above 90%
    }
  }
);

// Analyze coverage statistics
const { statistics } = coverageHeatmap;
console.log(`Average coverage: ${(statistics.avgCoverage * 100).toFixed(1)}%`);
console.log(`Coverage range: ${(statistics.minCoverage * 100).toFixed(1)}% - ${(statistics.maxCoverage * 100).toFixed(1)}%`);
```

### 3. Performance Regression Detection

Track test execution performance:

```typescript
// Generate performance graph
const performanceGraph = await visualization.generatePerformanceGraph(
  executions,
  ['duration', 'memory', 'cpu'],
  {
    showBaselines: true,
    yAxisScale: 'logarithmic'
  }
);

// Analyze performance trends
const { metrics, baselines, annotations } = performanceGraph;

// Check for regressions
const regressions = annotations.filter(ann => ann.type === 'regression');
console.log(`Found ${regressions.length} performance regressions`);

// Example: Check if current duration exceeds baseline
const durationMetrics = metrics.duration;
if (durationMetrics.length > 0) {
  const latest = durationMetrics[durationMetrics.length - 1];
  const baseline = baselines.duration;

  if (latest.value > baseline * 1.5) {
    console.log('⚠️ Performance regression detected!');
    console.log(`Current: ${latest.value}ms, Baseline: ${baseline}ms`);
  }
}
```

### 4. Impact Analysis

Assess the potential impact of code changes:

```typescript
// Analyze impact of changes to a specific entity
const impactAnalysis = await tracker.analyzeImpact(
  'test_user_login',
  'src/auth/login.ts'
);

const {
  impactScore,
  affectedEntities,
  affectedTests,
  riskAssessment,
  recommendations
} = impactAnalysis;

console.log(`Impact Score: ${(impactScore * 100).toFixed(1)}%`);
console.log(`Risk Level: ${riskAssessment}`);
console.log(`Affected Tests: ${affectedTests.length}`);
console.log('Recommendations:');
recommendations.forEach(rec => console.log(`  - ${rec}`));
```

### 5. Obsolescence Detection

Identify potentially obsolete tests:

```typescript
// Detect obsolete tests for an entity
const obsolescenceAnalyses = await tracker.detectObsolescence('src/legacy/old-feature.ts');

for (const analysis of obsolescenceAnalyses) {
  console.log(`Test: ${analysis.testId}`);
  console.log(`Obsolescence Score: ${(analysis.obsolescenceScore * 100).toFixed(1)}%`);
  console.log(`Recommendation: ${analysis.recommendation}`);
  console.log(`Reasons: ${analysis.reasons.join(', ')}`);

  if (analysis.lastMeaningfulExecution) {
    console.log(`Last meaningful execution: ${analysis.lastMeaningfulExecution.toDateString()}`);
  }
}
```

## Evolution Analysis Capabilities

### Test Evolution Events

The system automatically tracks various evolution events:

- **Test Lifecycle**: `test_added`, `test_removed`, `test_modified`
- **Coverage Changes**: `coverage_increased`, `coverage_decreased`
- **Performance**: `performance_regression`, `performance_improvement`
- **Reliability**: `flakiness_detected`, `flakiness_resolved`
- **Relationships**: `relationship_added`, `relationship_removed`

### Event Analysis

```typescript
// Get evolution events for a test
const evolutionEvents = await tracker.getEvolutionEvents(
  'test_user_login',
  'src/auth/login.ts'
);

// Filter by event type
const performanceEvents = evolutionEvents.filter(event =>
  event.type === 'performance_regression' || event.type === 'performance_improvement'
);

// Analyze event patterns
const eventCounts = evolutionEvents.reduce((counts, event) => {
  counts[event.type] = (counts[event.type] || 0) + 1;
  return counts;
}, {} as Record<string, number>);

console.log('Event distribution:', eventCounts);
```

## Metrics Interpretation Guide

### Flakiness Score
- **0.0 - 0.05**: Excellent stability
- **0.05 - 0.1**: Good stability (threshold)
- **0.1 - 0.2**: Moderate flakiness (investigate)
- **> 0.2**: High flakiness (fix immediately)

### Coverage Scores
- **> 90%**: Excellent coverage
- **70% - 90%**: Good coverage
- **50% - 70%**: Adequate coverage
- **< 50%**: Poor coverage (needs improvement)

### Impact Scores
- **0.0 - 0.3**: Low impact
- **0.3 - 0.6**: Medium impact
- **0.6 - 0.8**: High impact
- **> 0.8**: Critical impact

### Confidence Levels
- **> 0.8**: High confidence relationship
- **0.6 - 0.8**: Medium confidence relationship
- **0.3 - 0.6**: Low confidence relationship
- **< 0.3**: Very low confidence (review needed)

## Visualization and Dashboards

### Complete Dashboard

Generate a comprehensive dashboard:

```typescript
// Generate full dashboard for a specific test
const dashboard = await visualization.generateDashboard(
  'test_user_login',
  'src/auth/login.ts',
  {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  }
);

const {
  timeline,
  coverageHeatmap,
  flakinessChart,
  performanceGraph,
  summary
} = dashboard;

// Display summary metrics
console.log('Dashboard Summary:');
console.log(`Total Executions: ${summary.totalExecutions}`);
console.log(`Success Rate: ${(summary.successRate * 100).toFixed(1)}%`);
console.log(`Average Coverage: ${(summary.avgCoverage * 100).toFixed(1)}%`);
console.log(`Flakiness Score: ${(summary.flakinessScore * 100).toFixed(1)}%`);
console.log(`Performance Trend: ${summary.performanceTrend}`);
```

### Export Visualizations

```typescript
// Export data in various formats
const exportedJSON = await visualization.exportVisualization(
  dashboard,
  { format: 'json', includeMetadata: true }
);

const exportedCSV = await visualization.exportVisualization(
  flakinessChart.dataPoints,
  { format: 'csv' }
);

// Save to files (example)
require('fs').writeFileSync('dashboard.json', exportedJSON);
require('fs').writeFileSync('flakiness-data.csv', exportedCSV);
```

## CI/CD Integration

### GitHub Actions Integration

Set up automated temporal tracking in your CI/CD pipeline:

```typescript
// Configure GitHub Actions integration
const ciIntegration = new TestCIIntegration(
  temporalConfig,
  {
    owner: 'your-org',
    repo: 'your-repo',
    token: process.env.GITHUB_TOKEN,
    workflowFile: 'temporal-tracking.yml',
    enableBadgeUpdates: true,
    enableTrendReporting: true,
    enableAutomatedAlerts: true
  }
);

// Generate CI configuration
const ciConfig = await ciIntegration.generateCIConfiguration({
  platform: 'github-actions',
  triggers: ['push', 'pull_request', 'schedule'],
  testCommand: 'pnpm test',
  reportingEnabled: true
});

console.log('Generated CI Configuration:');
console.log(ciConfig.configuration);
```

### Automated Reporting

```typescript
// Generate and send trend reports
const trendReport = await ciIntegration.generateTrendReport(
  {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    end: new Date()
  },
  {
    frequency: 'weekly',
    format: 'markdown',
    includeVisualizations: true,
    recipients: ['team@company.com']
  }
);

await ciIntegration.sendTrendReport(trendReport, {
  frequency: 'weekly',
  format: 'markdown',
  includeVisualizations: true,
  recipients: ['team@company.com']
});
```

### Status Badges

Generate test status badges for your repository:

```typescript
// Generate various badge types
const statusBadge = await ciIntegration.generateTestBadge(
  undefined, // all tests
  undefined, // all entities
  'status'
);

const coverageBadge = await ciIntegration.generateTestBadge(
  undefined,
  undefined,
  'coverage'
);

const flakinessBadge = await ciIntegration.generateTestBadge(
  undefined,
  undefined,
  'flakiness'
);

// Update GitHub repository badges
await ciIntegration.updateGitHubBadges([
  statusBadge,
  coverageBadge,
  flakinessBadge
]);
```

## Best Practices

### 1. Configuration Tuning

**Flakiness Threshold**: Start with 0.1 (10%) and adjust based on your team's tolerance:
```typescript
// Conservative (strict)
flakinessThreshold: 0.05

// Balanced (recommended)
flakinessThreshold: 0.1

// Lenient (for legacy systems)
flakinessThreshold: 0.2
```

**Coverage Change Threshold**: Adjust based on test granularity:
```typescript
// Fine-grained tests
coverageChangeThreshold: 0.02

// Standard tests
coverageChangeThreshold: 0.05

// Coarse-grained tests
coverageChangeThreshold: 0.1
```

### 2. Data Management

**Retention Policies**: Configure appropriate data retention:
```typescript
const retentionConfig = {
  EXECUTIONS: 90,      // days
  SNAPSHOTS: 365,      // days
  EVENTS: 180,         // days
  RELATIONSHIPS: 730   // days
};
```

**Batch Processing**: Use appropriate batch sizes:
```typescript
// For high-frequency tests
batchSize: 50

// For standard usage
batchSize: 100

// For batch processing
batchSize: 500
```

### 3. Monitoring and Alerting

Configure meaningful alerts:

```typescript
const alertConfig = {
  channels: [
    {
      type: 'slack',
      endpoint: process.env.SLACK_WEBHOOK_URL
    },
    {
      type: 'email',
      endpoint: 'alerts@company.com'
    }
  ],
  thresholds: {
    failureRate: 0.2,              // 20% failure rate
    flakinessScore: 0.15,          // 15% flakiness
    performanceRegression: 2.0,     // 100% slowdown
    coverageDecrease: 0.1          // 10% coverage drop
  },
  rateLimits: {
    maxAlertsPerHour: 5,
    cooldownPeriod: 30             // minutes
  }
};

// Check and send alerts
const alerts = await ciIntegration.checkAlertConditions(alertConfig);
if (alerts.length > 0) {
  await ciIntegration.sendAlerts(alerts, alertConfig);
}
```

## API Reference

### Core Endpoints

The temporal tracking system provides RESTful API endpoints:

#### Timeline Queries
```http
GET /api/v1/history/entities/:id/timeline
  ?includeRelationships=true
  &limit=50
  &since=2024-01-01
  &until=2024-01-31
```

#### Checkpoint Management
```http
POST /api/v1/history/checkpoints
{
  "seedEntities": ["src/auth/login.ts"],
  "reason": "daily",
  "hops": 2
}

GET /api/v1/history/checkpoints/:id
DELETE /api/v1/history/checkpoints/:id
```

#### Session Analysis
```http
GET /api/v1/history/sessions/:id/timeline
GET /api/v1/history/sessions/:id/impacts
GET /api/v1/history/entities/:id/sessions
```

### Data Models

Key data structures used throughout the system:

```typescript
// Test execution record
interface TestExecutionRecord {
  executionId: string;
  testId: string;
  entityId: string;
  timestamp: Date;
  status: 'pass' | 'fail' | 'skip' | 'pending' | 'timeout' | 'error';
  duration?: number;
  coverage?: CoverageData;
  metadata: TestMetadata;
}

// Test relationship
interface TestRelationship {
  relationshipId: string;
  testId: string;
  entityId: string;
  type: 'TESTS' | 'VALIDATES' | 'COVERS' | 'EXERCISES' | 'VERIFIES';
  validFrom: Date;
  validTo?: Date | null;
  active: boolean;
  confidence: number;
  metadata: TestMetadata;
}

// Evolution event
interface TestEvolutionEvent {
  eventId: string;
  testId: string;
  entityId: string;
  timestamp: Date;
  type: TestEvolutionEventType;
  description: string;
  previousState?: any;
  newState?: any;
  metadata?: Record<string, any>;
}
```

## Troubleshooting

### Common Issues

**High Memory Usage**
- Reduce `maxTrendDataPoints` in configuration
- Implement data cleanup routines
- Use smaller batch sizes

**Slow Query Performance**
- Add appropriate database indexes
- Use time-based filtering
- Implement pagination for large datasets

**Inaccurate Flakiness Detection**
- Increase the moving window size
- Check for environmental factors
- Verify test isolation

**Missing Coverage Data**
- Ensure coverage instrumentation is enabled
- Check test runner integration
- Verify coverage report parsing

### Debug Logging

Enable debug logging for troubleshooting:

```typescript
// Set debug environment variable
process.env.DEBUG = 'temporal:*';

// Or configure specific modules
process.env.DEBUG = 'temporal:tracker,temporal:metrics';
```

### Performance Optimization

For large-scale deployments:

```typescript
// High-performance configuration
const optimizedConfig = {
  maxTrendDataPoints: 2000,
  batchSize: 500,
  obsolescenceDetectionEnabled: false, // Disable for performance
  trendAnalysisPeriod: 'daily'
};

// Use streaming for large datasets
const stream = tracker.getExecutionStream({
  testId: 'test_id',
  startDate: new Date('2024-01-01'),
  batchSize: 1000
});

stream.on('data', (batch) => {
  // Process batch
});
```

## Support and Resources

### Documentation
- [API Reference](./api-reference.md)
- [Blueprint Documents](Blueprints/)
- [Test Relationships Guide](Blueprints/knowledge-graph/tests-relationships.md)
- [Temporal Relationships Spec](Blueprints/knowledge-graph/temporal-relationships.md)

### Community
- GitHub Issues: Report bugs and feature requests
- Discussions: Ask questions and share experiences
- Discord: Real-time community support

### Contributing
- See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines
- Review [development setup](../README.md#development)
- Follow [coding standards](../CODING_STANDARDS.md)

---

**Note**: This is a living document that evolves with the temporal tracking system. Always refer to the latest version and API documentation for the most current information.

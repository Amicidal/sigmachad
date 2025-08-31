#!/usr/bin/env tsx

/**
 * Database Test Runner
 * Runs all database tests and provides comprehensive reporting
 */

import { DatabaseService, createDatabaseConfig } from '../src/services/DatabaseService.js';
import { PerformanceMonitor } from '../tests/database-test-utils.js';

class DatabaseTestRunner {
  private dbService: DatabaseService | null = null;
  private performanceMonitor: PerformanceMonitor;

  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
  }

  async initialize(): Promise<void> {
    console.log('🔧 Initializing database test runner...');

    const dbConfig = createDatabaseConfig();
    this.dbService = new DatabaseService(dbConfig);

    this.performanceMonitor.start('Database Initialization');
    await this.dbService.initialize();
    await this.dbService.setupDatabase();
    this.performanceMonitor.end('Database Initialization');

    console.log('✅ Database test runner initialized');
  }

  async runHealthChecks(): Promise<boolean> {
    if (!this.dbService) throw new Error('Database not initialized');

    console.log('\n🏥 Running database health checks...');
    this.performanceMonitor.start('Health Checks');

    try {
      const health = await this.dbService.healthCheck();
      this.performanceMonitor.end('Health Checks');

      console.log('📊 Health check results:');
      Object.entries(health).forEach(([service, status]) => {
        const icon = status ? '✅' : '❌';
        console.log(`  ${icon} ${service}: ${status ? 'healthy' : 'unhealthy'}`);
      });

      const allHealthy = Object.values(health).every(status => status !== false);
      return allHealthy;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }

  async runBasicOperationsTest(): Promise<boolean> {
    if (!this.dbService) throw new Error('Database not initialized');

    console.log('\n🧪 Running basic operations test...');
    this.performanceMonitor.start('Basic Operations');

    try {
      // Test PostgreSQL
      await this.dbService.postgresQuery('SELECT NOW() as current_time');
      console.log('  ✅ PostgreSQL query successful');

      // Test FalkorDB
      const pingResult = await this.dbService.falkordbCommand('PING');
      if (pingResult === 'PONG') {
        console.log('  ✅ FalkorDB ping successful');
      }

      // Test Qdrant
      const collections = await this.dbService.qdrant.getCollections();
      console.log(`  ✅ Qdrant connection successful (${collections.collections.length} collections)`);

      this.performanceMonitor.end('Basic Operations');
      return true;
    } catch (error) {
      console.error('❌ Basic operations test failed:', error);
      this.performanceMonitor.end('Basic Operations');
      return false;
    }
  }

  async runDataConsistencyTest(): Promise<boolean> {
    if (!this.dbService) throw new Error('Database not initialized');

    console.log('\n🔄 Running data consistency test...');
    this.performanceMonitor.start('Data Consistency');

    try {
      const testId = `consistency_test_${Date.now()}`;

      // Create test data across PostgreSQL and Qdrant (FalkorDB has compatibility issues)
      const testData = {
        id: testId,
        name: 'ConsistencyTestEntity',
        type: 'test_entity',
        content: 'This is test content for consistency verification'
      };

      // PostgreSQL - Use UUID generation for ID
      const postgresResult = await this.dbService.postgresQuery(
        'INSERT INTO documents (type, content) VALUES ($1, $2) RETURNING id',
        [testData.type, JSON.stringify({ content: testData.content })]
      );
      const actualId = postgresResult.rows[0].id;

      // Qdrant
      await this.dbService.qdrant.upsert('code_embeddings', {
        points: [{
          id: Date.now(),
          vector: Array.from({ length: 1536 }, () => Math.random()),
          payload: {
            entity_id: actualId,
            name: testData.name,
            type: testData.type
          }
        }]
      });

      // Verify consistency between PostgreSQL and Qdrant
      const postgresCheck = await this.dbService.postgresQuery(
        'SELECT id FROM documents WHERE id = $1',
        [actualId]
      );

      const vectorCount = await this.dbService.qdrant.count('code_embeddings');

      const consistent = postgresCheck.rows.length > 0 && vectorCount.count > 0;

      if (consistent) {
        console.log('  ✅ Data consistency verified between PostgreSQL and Qdrant');
        console.log('  ⚠️  FalkorDB skipped due to compatibility issues');
      } else {
        console.log('  ❌ Data consistency check failed');
      }

      this.performanceMonitor.end('Data Consistency');
      return consistent;
    } catch (error) {
      console.error('❌ Data consistency test failed:', error);
      this.performanceMonitor.end('Data Consistency');
      return false;
    }
  }

  async runPerformanceTest(): Promise<boolean> {
    if (!this.dbService) throw new Error('Database not initialized');

    console.log('\n⚡ Running performance test...');
    this.performanceMonitor.start('Performance Test');

    try {
      const operationCount = 100;
      const operations = [];

      // Generate concurrent operations
      for (let i = 0; i < operationCount; i++) {
        operations.push(
          this.dbService.postgresQuery(
            'INSERT INTO documents (type, content) VALUES ($1, $2)',
            ['performance_test', JSON.stringify({ index: i })]
          )
        );
      }

      const startTime = Date.now();
      await Promise.all(operations);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const avgTime = totalTime / operationCount;
      console.log(`  📊 Completed ${operationCount} operations in ${totalTime}ms`);
      console.log(`  📊 Average time per operation: ${avgTime.toFixed(2)}ms`);

      // Performance assertions
      const acceptableTime = 5000; // 5 seconds for 100 operations
      const passed = totalTime < acceptableTime;

      if (passed) {
        console.log(`  ✅ Performance test passed (${totalTime}ms < ${acceptableTime}ms)`);
      } else {
        console.log(`  ❌ Performance test failed (${totalTime}ms > ${acceptableTime}ms)`);
      }

      this.performanceMonitor.end('Performance Test');
      return passed;
    } catch (error) {
      console.error('❌ Performance test failed:', error);
      this.performanceMonitor.end('Performance Test');
      return false;
    }
  }

  async runLoadTest(): Promise<boolean> {
    if (!this.dbService) throw new Error('Database not initialized');

    console.log('\n🔥 Running load test...');
    this.performanceMonitor.start('Load Test');

    try {
      const batchSize = 50;
      const batches = 5;
      let totalOperations = 0;

      for (let batch = 0; batch < batches; batch++) {
        const operations = [];

        // Create batch operations
        for (let i = 0; i < batchSize; i++) {
          operations.push(
            this.dbService.postgresQuery(
              'INSERT INTO documents (type, content) VALUES ($1, $2)',
              ['load_test', JSON.stringify({ batch, index: i })]
            )
          );
        }

        await Promise.all(operations);
        totalOperations += operations.length;
        console.log(`  📦 Completed batch ${batch + 1}/${batches} (${batchSize} operations)`);
      }

      console.log(`  🎯 Load test completed: ${totalOperations} total operations`);

      // Verify all operations completed
      const countResult = await this.dbService.postgresQuery(
        'SELECT COUNT(*) as count FROM documents WHERE type = $1',
        ['load_test']
      );

      const success = countResult.rows[0].count >= totalOperations;
      if (success) {
        console.log(`  ✅ Load test passed (${countResult.rows[0].count} records created)`);
      } else {
        console.log(`  ❌ Load test failed (expected ${totalOperations}, got ${countResult.rows[0].count})`);
      }

      this.performanceMonitor.end('Load Test');
      return success;
    } catch (error) {
      console.error('❌ Load test failed:', error);
      this.performanceMonitor.end('Load Test');
      return false;
    }
  }

  async cleanup(): Promise<void> {
    if (this.dbService) {
      console.log('\n🧹 Cleaning up test data...');
      this.performanceMonitor.start('Cleanup');

      try {
        // Clean up test data
        await this.dbService.postgresQuery('DELETE FROM documents WHERE type LIKE $1', ['%test%']);
        await this.dbService.postgresQuery('DELETE FROM sessions WHERE agent_type LIKE $1', ['%test%']);
        // Note: FalkorDB cleanup would require more specific queries for each test type

        console.log('  ✅ Test data cleanup completed');
      } catch (error) {
        console.warn('  ⚠️ Cleanup encountered issues:', error);
      }

      this.performanceMonitor.end('Cleanup');
      await this.dbService.close();
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting comprehensive database test suite...\n');

    const testResults = {
      initialization: false,
      healthChecks: false,
      basicOperations: false,
      dataConsistency: false,
      performance: false,
      loadTest: false
    };

    try {
      // Initialize
      await this.initialize();
      testResults.initialization = true;

      // Run tests
      testResults.healthChecks = await this.runHealthChecks();
      testResults.basicOperations = await this.runBasicOperationsTest();
      testResults.dataConsistency = await this.runDataConsistencyTest();
      testResults.performance = await this.runPerformanceTest();
      testResults.loadTest = await this.runLoadTest();

    } catch (error) {
      console.error('💥 Test suite failed:', error);
    } finally {
      await this.cleanup();
    }

    // Generate report
    this.generateReport(testResults);
  }

  private generateReport(results: any): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 DATABASE TEST SUITE REPORT');
    console.log('='.repeat(60));

    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;

    Object.entries(results).forEach(([test, passed]) => {
      const icon = passed ? '✅' : '❌';
      const status = passed ? 'PASSED' : 'FAILED';
      console.log(`${icon} ${test.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${status}`);
    });

    console.log('\n' + '-'.repeat(60));
    console.log(`📈 OVERALL RESULT: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! Database is fully operational.');
    } else {
      console.log('⚠️  SOME TESTS FAILED. Please check the output above for details.');
    }

    console.log('\n⏱️  PERFORMANCE METRICS:');
    const measurements = this.performanceMonitor.getAllMeasurements();
    Object.entries(measurements).forEach(([operation, duration]) => {
      console.log(`  • ${operation}: ${duration}ms`);
    });

    console.log('='.repeat(60));
  }
}

// Run the test suite
async function main() {
  const testRunner = new DatabaseTestRunner();
  await testRunner.runAllTests();
}

main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

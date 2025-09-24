import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { TestEnvironment } from './utils/test-environment';

const execAsync = promisify(exec);

// Global test environment
let testEnv: TestEnvironment;

beforeAll(async () => {
  // Initialize test environment with real services
  testEnv = new TestEnvironment();

  // Start Docker services if not already running
  console.log('Starting test services...');
  try {
    await execAsync('docker compose -f docker-compose.test.yml up -d', {
      cwd: path.resolve(__dirname, '../..'),
    });

    // Wait for services to be ready
    await testEnv.waitForServices();

    console.log('Test services ready');
  } catch (error) {
    console.error('Failed to start test services:', error);
    throw error;
  }
}, 120000);

afterAll(async () => {
  // Clean up test environment
  if (testEnv) {
    await testEnv.cleanup();
  }

  // Stop Docker services
  console.log('Stopping test services...');
  try {
    await execAsync('docker compose -f docker-compose.test.yml down', {
      cwd: path.resolve(__dirname, '../..'),
    });
  } catch (error) {
    console.warn('Failed to stop test services:', error);
  }
}, 60000);

beforeEach(async () => {
  // Reset databases between tests
  if (testEnv) {
    await testEnv.resetDatabases();
  }
});

afterEach(async () => {
  // Clean up any test artifacts
  if (testEnv) {
    await testEnv.cleanupTestArtifacts();
  }
});

// Make test environment available globally
declare global {
  var testEnvironment: TestEnvironment;
}

globalThis.testEnvironment = testEnv;
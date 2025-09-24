#!/usr/bin/env node
/**
 * E2E Test Setup Validation Script
 * Validates that all E2E test infrastructure is properly configured
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { createConnection } from 'net';

interface ValidationResult {
  category: string;
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: string;
}

class E2ESetupValidator {
  private results: ValidationResult[] = [];
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
  }

  private addResult(result: ValidationResult): void {
    this.results.push(result);
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} [${result.category}] ${result.name}: ${result.message}`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
  }

  private checkFileExists(filePath: string, name: string, category: string): boolean {
    const fullPath = join(this.projectRoot, filePath);
    if (existsSync(fullPath)) {
      this.addResult({
        category,
        name,
        status: 'pass',
        message: 'File exists',
        details: filePath,
      });
      return true;
    } else {
      this.addResult({
        category,
        name,
        status: 'fail',
        message: 'File missing',
        details: filePath,
      });
      return false;
    }
  }

  private async checkPortOpen(port: number, host = 'localhost'): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = createConnection({ port, host }, () => {
        socket.end();
        resolve(true);
      });

      socket.on('error', () => {
        resolve(false);
      });

      socket.setTimeout(2000, () => {
        socket.destroy();
        resolve(false);
      });
    });
  }

  private runCommand(command: string): { success: boolean; output: string } {
    try {
      const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
      return { success: true, output };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }

  async validateFiles(): Promise<void> {
    console.log('\n🔍 Validating E2E Test Files...\n');

    // Core E2E configuration files
    this.checkFileExists('packages/knowledge/tests/e2e/advanced/README.md', 'Advanced E2E README', 'Documentation');
    this.checkFileExists('packages/knowledge/tests/e2e/vitest.config.advanced.ts', 'Advanced Vitest Config', 'Configuration');
    this.checkFileExists('packages/knowledge/tests/e2e/utils/test-reliability.ts', 'Test Reliability Utils', 'Infrastructure');
    this.checkFileExists('.github/workflows/advanced-e2e-tests.yml', 'GitHub Actions Workflow', 'CI/CD');
    this.checkFileExists('tests/e2e/docker-compose.test.yml', 'Docker Compose Test Config', 'Infrastructure');

    // Advanced test files
    const testFiles = [
      'packages/knowledge/tests/e2e/advanced/chaos-engineering.test.ts',
      'packages/knowledge/tests/e2e/advanced/data-migration.test.ts',
      'packages/knowledge/tests/e2e/advanced/api-versioning.test.ts',
      'packages/knowledge/tests/e2e/advanced/performance-edge-cases.test.ts',
      'packages/knowledge/tests/e2e/advanced/cross-platform-compatibility.test.ts',
      'packages/knowledge/tests/e2e/advanced/index.ts',
    ];

    for (const testFile of testFiles) {
      this.checkFileExists(testFile, `Test: ${testFile.split('/').pop()}`, 'Test Files');
    }
  }

  async validateDependencies(): Promise<void> {
    console.log('\n📦 Validating Dependencies...\n');

    // Check package.json
    const packageJsonPath = join(this.projectRoot, 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

      // Check for required dependencies
      const requiredDeps = ['vitest', 'docker', '@vitest/coverage-v8'];
      const requiredDevDeps = ['@types/node', 'typescript'];

      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      for (const dep of [...requiredDeps, ...requiredDevDeps]) {
        if (allDeps[dep]) {
          this.addResult({
            category: 'Dependencies',
            name: `Package: ${dep}`,
            status: 'pass',
            message: `Version ${allDeps[dep]}`,
          });
        } else {
          this.addResult({
            category: 'Dependencies',
            name: `Package: ${dep}`,
            status: 'warn',
            message: 'Not found in package.json',
            details: 'May be provided by workspace or not required',
          });
        }
      }

      // Check E2E test scripts
      const requiredScripts = [
        'test:e2e',
        'test:e2e:services:up',
        'test:e2e:services:down',
      ];

      for (const script of requiredScripts) {
        if (packageJson.scripts && packageJson.scripts[script]) {
          this.addResult({
            category: 'Scripts',
            name: `Script: ${script}`,
            status: 'pass',
            message: 'Defined',
            details: packageJson.scripts[script],
          });
        } else {
          this.addResult({
            category: 'Scripts',
            name: `Script: ${script}`,
            status: 'fail',
            message: 'Missing',
            details: 'Required for E2E test execution',
          });
        }
      }
    }
  }

  async validateEnvironment(): Promise<void> {
    console.log('\n🌍 Validating Environment...\n');

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));

    if (majorVersion >= 18) {
      this.addResult({
        category: 'Environment',
        name: 'Node.js Version',
        status: 'pass',
        message: `${nodeVersion} (>= 18.0.0)`,
      });
    } else {
      this.addResult({
        category: 'Environment',
        name: 'Node.js Version',
        status: 'fail',
        message: `${nodeVersion} (< 18.0.0)`,
        details: 'Node.js 18+ is required for E2E tests',
      });
    }

    // Check pnpm
    const pnpmCheck = this.runCommand('pnpm --version');
    if (pnpmCheck.success) {
      this.addResult({
        category: 'Environment',
        name: 'pnpm',
        status: 'pass',
        message: `Version ${pnpmCheck.output.trim()}`,
      });
    } else {
      this.addResult({
        category: 'Environment',
        name: 'pnpm',
        status: 'fail',
        message: 'Not installed',
        details: 'pnpm is required for dependency management',
      });
    }

    // Check Docker
    const dockerCheck = this.runCommand('docker --version');
    if (dockerCheck.success) {
      this.addResult({
        category: 'Environment',
        name: 'Docker',
        status: 'pass',
        message: dockerCheck.output.trim(),
      });
    } else {
      this.addResult({
        category: 'Environment',
        name: 'Docker',
        status: 'fail',
        message: 'Not installed or not running',
        details: 'Docker is required for test databases',
      });
    }

    // Check Docker Compose
    const composeCheck = this.runCommand('docker compose version');
    if (composeCheck.success) {
      this.addResult({
        category: 'Environment',
        name: 'Docker Compose',
        status: 'pass',
        message: composeCheck.output.trim(),
      });
    } else {
      this.addResult({
        category: 'Environment',
        name: 'Docker Compose',
        status: 'fail',
        message: 'Not available',
        details: 'Docker Compose is required for test services',
      });
    }
  }

  async validateServices(): Promise<void> {
    console.log('\n🗄️ Validating Database Services...\n');

    const services = [
      { name: 'PostgreSQL', port: 5432 },
      { name: 'Redis', port: 6379 },
      { name: 'Neo4j', port: 7687 },
      { name: 'Qdrant', port: 6333 },
    ];

    for (const service of services) {
      const isOpen = await this.checkPortOpen(service.port);

      if (isOpen) {
        this.addResult({
          category: 'Services',
          name: service.name,
          status: 'pass',
          message: `Running on port ${service.port}`,
        });
      } else {
        this.addResult({
          category: 'Services',
          name: service.name,
          status: 'warn',
          message: `Not running on port ${service.port}`,
          details: 'Service will be started by Docker Compose when tests run',
        });
      }
    }
  }

  async validateConfiguration(): Promise<void> {
    console.log('\n⚙️ Validating Configuration...\n');

    // Check logs directory
    const logsDir = join(this.projectRoot, 'logs');
    if (existsSync(logsDir)) {
      this.addResult({
        category: 'Configuration',
        name: 'Logs Directory',
        status: 'pass',
        message: 'Exists',
      });
    } else {
      this.addResult({
        category: 'Configuration',
        name: 'Logs Directory',
        status: 'warn',
        message: 'Does not exist',
        details: 'Will be created automatically when tests run',
      });
    }

    // Check vitest configuration
    const vitestConfigPath = join(this.projectRoot, 'packages/knowledge/tests/e2e/vitest.config.advanced.ts');
    if (existsSync(vitestConfigPath)) {
      const configContent = readFileSync(vitestConfigPath, 'utf8');

      const hasAdvancedConfig = configContent.includes('advanced-e2e');
      const hasParallelConfig = configContent.includes('poolOptions');
      const hasTimeoutConfig = configContent.includes('timeout');

      if (hasAdvancedConfig && hasParallelConfig && hasTimeoutConfig) {
        this.addResult({
          category: 'Configuration',
          name: 'Vitest Advanced Config',
          status: 'pass',
          message: 'Properly configured',
        });
      } else {
        this.addResult({
          category: 'Configuration',
          name: 'Vitest Advanced Config',
          status: 'warn',
          message: 'Missing some advanced features',
          details: 'Check parallelization and timeout settings',
        });
      }
    }
  }

  generateReport(): void {
    console.log('\n📊 Validation Summary\n');

    const categories = [...new Set(this.results.map(r => r.category))];

    for (const category of categories) {
      const categoryResults = this.results.filter(r => r.category === category);
      const passed = categoryResults.filter(r => r.status === 'pass').length;
      const failed = categoryResults.filter(r => r.status === 'fail').length;
      const warnings = categoryResults.filter(r => r.status === 'warn').length;

      console.log(`${category}: ${passed} passed, ${failed} failed, ${warnings} warnings`);
    }

    const totalPassed = this.results.filter(r => r.status === 'pass').length;
    const totalFailed = this.results.filter(r => r.status === 'fail').length;
    const totalWarnings = this.results.filter(r => r.status === 'warn').length;

    console.log(`\nOverall: ${totalPassed} passed, ${totalFailed} failed, ${totalWarnings} warnings`);

    if (totalFailed > 0) {
      console.log('\n❌ E2E setup has critical issues that need to be resolved');
      console.log('\nFailed checks:');
      this.results
        .filter(r => r.status === 'fail')
        .forEach(r => console.log(`  - [${r.category}] ${r.name}: ${r.message}`));

      process.exit(1);
    } else if (totalWarnings > 0) {
      console.log('\n⚠️ E2E setup is functional but has some warnings');
      console.log('\nWarning checks:');
      this.results
        .filter(r => r.status === 'warn')
        .forEach(r => console.log(`  - [${r.category}] ${r.name}: ${r.message}`));
    } else {
      console.log('\n✅ E2E setup is fully configured and ready!');
    }
  }

  async run(): Promise<void> {
    console.log('🚀 E2E Test Setup Validation');
    console.log('===========================');

    await this.validateFiles();
    await this.validateDependencies();
    await this.validateEnvironment();
    await this.validateServices();
    await this.validateConfiguration();

    this.generateReport();
  }
}

export default E2ESetupValidator;

// Run validation if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new E2ESetupValidator();
  validator.run().catch((error) => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}
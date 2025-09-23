#!/usr/bin/env tsx
/**
 * Service Structure Enforcement Script
 * Checks for prefix and depth violations in src/services
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function checkServiceStructure(baseDir: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };

  const servicesDir = path.join(baseDir, 'src/services');

  if (!fs.existsSync(servicesDir)) {
    result.errors.push(`Services directory not found: ${servicesDir}`);
    result.valid = false;
    return result;
  }

  // Check for prefixed top-level directories
  checkPrefixViolations(servicesDir, result);

  // Check for depth violations
  checkDepthViolations(servicesDir, result);

  // Check for file naming conventions
  checkFileNaming(servicesDir, result);

  return result;
}

function checkPrefixViolations(servicesDir: string, result: ValidationResult): void {
  const entries = fs.readdirSync(servicesDir, { withFileTypes: true });

  const prefixPattern = /^(knowledge|testing|database|core|scm|backup|synchronization|logging|relationships)-/;

  for (const entry of entries) {
    if (entry.isDirectory() && prefixPattern.test(entry.name)) {
      result.errors.push(
        `Prefix violation: Top-level directory '${entry.name}' uses deprecated prefix pattern. ` +
        `Should be nested under the domain directory instead.`
      );
      result.valid = false;
    }
  }
}

function checkDepthViolations(servicesDir: string, result: ValidationResult): void {
  function traverseDir(dir: string, basePath: string = ''): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);

      // Skip node_modules and dist directories
      if (entry.name === 'node_modules' || entry.name === 'dist') {
        continue;
      }

      if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
        // Count depth from src/ (should be max 3)
        const depth = relativePath.split(path.sep).length + 1; // +1 for 'src'

        if (depth > 3) {
          result.errors.push(
            `Depth violation: File '${path.join('src/services', relativePath)}' is at depth ${depth} ` +
            `(max allowed: 3 from src/)`
          );
          result.valid = false;
        }
      } else if (entry.isDirectory()) {
        // Check for too many files in directory
        const fileCount = entries.filter(e =>
          e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.js'))
        ).length;

        if (fileCount > 20) {
          result.warnings.push(
            `Directory '${path.join('src/services', relativePath)}' contains ${fileCount} files ` +
            `(recommended max: 20). Consider splitting into subdirectories.`
          );
        }

        // Recursively check subdirectories
        traverseDir(fullPath, relativePath);
      }
    }
  }

  traverseDir(servicesDir);
}

function checkFileNaming(servicesDir: string, result: ValidationResult): void {
  const expectedSuffixes = [
    'Service.ts',
    'Parser.ts',
    'Analyzer.ts',
    'Utils.ts',
    'Manager.ts',
    'Provider.ts',
    'Executor.ts',
    'Builder.ts',
    'Factory.ts',
    'Handler.ts',
    'Coordinator.ts',
    'Scanner.ts',
    '.test.ts',
    '.spec.ts',
    'index.ts',
    'interfaces.ts',
    'types.ts',
    'queries.ts'
  ];

  function traverseDir(dir: string, basePath: string = ''): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);

      if (entry.isFile() && entry.name.endsWith('.ts')) {
        // Skip test files and special files
        if (entry.name.includes('.test.') ||
            entry.name.includes('.spec.') ||
            entry.name === 'index.ts' ||
            entry.name === 'interfaces.ts' ||
            entry.name === 'types.ts' ||
            entry.name === 'queries.ts') {
          continue;
        }

        // Check if file follows naming convention
        const hasExpectedSuffix = expectedSuffixes.some(suffix =>
          entry.name.endsWith(suffix)
        );

        if (!hasExpectedSuffix && entry.name[0] === entry.name[0].toUpperCase()) {
          result.warnings.push(
            `File naming: '${path.join('src/services', relativePath)}' doesn't follow naming conventions. ` +
            `Consider using a suffix like Service, Parser, Manager, etc.`
          );
        }
      } else if (entry.isDirectory()) {
        traverseDir(fullPath, relativePath);
      }
    }
  }

  traverseDir(servicesDir);
}

// Main execution
function main(): void {
  const projectRoot = process.cwd();
  const result = checkServiceStructure(projectRoot);

  console.log('\n📋 Service Structure Check Results\n');
  console.log('=' . repeat(50));

  if (result.errors.length > 0) {
    console.log('\n❌ ERRORS (must fix):');
    result.errors.forEach(error => {
      console.log(`  - ${error}`);
    });
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (recommended fixes):');
    result.warnings.forEach(warning => {
      console.log(`  - ${warning}`);
    });
  }

  if (result.valid && result.warnings.length === 0) {
    console.log('\n✅ All checks passed! Service structure is compliant.');
  }

  console.log('\n' + '=' . repeat(50));
  console.log(`\nSummary: ${result.errors.length} errors, ${result.warnings.length} warnings\n`);

  // Exit with error code if validation failed
  if (!result.valid) {
    process.exit(1);
  }
}

// Run if executed directly
main();

export { checkServiceStructure, ValidationResult };
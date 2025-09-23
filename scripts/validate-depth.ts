#!/usr/bin/env tsx

/**
 * Validate directory depth across the codebase
 * Ensures no file exceeds the maximum allowed depth from project root
 */

import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

interface ValidationOptions {
  targetDepth: number;
  warnDepth: number;
  maxDepth: number;
  ignorePaths: string[];
  complexDomains: string[];
  verbose: boolean;
  fix: boolean;
}

interface DepthViolation {
  path: string;
  depth: number;
  severity: 'error' | 'warning';
  suggestion: string;
}

class DepthValidator {
  private options: ValidationOptions;
  private violations: DepthViolation[] = [];
  private warnings: DepthViolation[] = [];
  private projectRoot: string;

  constructor(options: Partial<ValidationOptions> = {}) {
    this.options = {
      targetDepth: 3,
      warnDepth: 4,
      maxDepth: 5,
      ignorePaths: ['node_modules', 'dist', 'coverage', '.git', '.husky'],
      complexDomains: [
        'services/knowledge',
        'services/testing',
        'api/trpc',
        'services/synchronization'
      ],
      verbose: false,
      fix: false,
      ...options
    };
    this.projectRoot = process.cwd();
  }

  public async validate(): Promise<boolean> {
    console.log(`🔍 Validating directory depth (target: ${this.options.targetDepth}, warn: ${this.options.warnDepth}, max: ${this.options.maxDepth})...`);

    const files = this.getAllSourceFiles();

    for (const file of files) {
      this.checkFileDepth(file);
    }

    if (this.violations.length === 0 && this.warnings.length === 0) {
      console.log('✅ All files are within the target depth limit!');
      return true;
    }

    this.reportViolations();

    if (this.options.fix) {
      await this.suggestRefactoring();
    }

    // Only fail if there are actual violations, not just warnings
    return this.violations.length === 0;
  }

  private getAllSourceFiles(): string[] {
    const patterns = [
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx'
    ];

    const ignorePatterns = this.options.ignorePaths.map(p => `${p}/**`);

    const files: string[] = [];
    for (const pattern of patterns) {
      const matches = globSync(pattern, {
        ignore: ignorePatterns,
        absolute: false
      });
      files.push(...matches);
    }

    return files;
  }

  private checkFileDepth(filePath: string): void {
    const segments = filePath.split(path.sep);
    const depth = segments.length - 1; // Subtract 1 for filename

    // Check if this is in a complex domain that allows deeper nesting
    const isComplexDomain = this.options.complexDomains.some(domain =>
      filePath.startsWith(domain)
    );

    if (depth > this.options.maxDepth) {
      // Absolute maximum exceeded - always an error
      const suggestion = this.generateSuggestion(filePath);
      this.violations.push({
        path: filePath,
        depth,
        severity: 'error',
        suggestion
      });
    } else if (depth > this.options.warnDepth && !isComplexDomain) {
      // Non-complex domain exceeding warning threshold
      const suggestion = this.generateSuggestion(filePath);
      this.violations.push({
        path: filePath,
        depth,
        severity: 'error',
        suggestion
      });
    } else if (depth > this.options.targetDepth) {
      // Exceeds target but within acceptable range for complex domains
      if (isComplexDomain && depth <= this.options.warnDepth) {
        const suggestion = this.generateSuggestion(filePath);
        this.warnings.push({
          path: filePath,
          depth,
          severity: 'warning',
          suggestion
        });
      } else if (!isComplexDomain) {
        const suggestion = this.generateSuggestion(filePath);
        this.violations.push({
          path: filePath,
          depth,
          severity: 'error',
          suggestion
        });
      }
    }
  }

  private generateSuggestion(filePath: string): string {
    const segments = filePath.split(path.sep);

    // Common refactoring patterns
    if (filePath.includes('services/knowledge/parser/builders/')) {
      return filePath.replace('services/knowledge/parser/builders/', 'builders/parser/');
    }

    if (filePath.includes('services/knowledge/ogm/models/')) {
      return filePath.replace('services/knowledge/ogm/models/', 'models/ogm/');
    }

    if (filePath.includes('services/knowledge/knowledge-graph/facades/')) {
      return filePath.replace('services/knowledge/knowledge-graph/facades/', 'facades/graph/');
    }

    // Generic suggestion: flatten middle directories
    if (segments.length > this.options.maxDepth + 1) {
      const newSegments = [
        ...segments.slice(0, 2),
        ...segments.slice(-2)
      ];
      return newSegments.join(path.sep);
    }

    return filePath;
  }

  private reportViolations(): void {
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Found ${this.warnings.length} files exceeding target depth (allowed for complex domains):`);
      this.reportItems(this.warnings, true);
    }

    if (this.violations.length > 0) {
      console.log(`\n❌ Found ${this.violations.length} files exceeding maximum depth:`);
      this.reportItems(this.violations, false);
    }
  }

  private reportItems(items: DepthViolation[], isWarning: boolean): void {

    // Group by depth
    const byDepth = items.reduce((acc, v) => {
      if (!acc[v.depth]) acc[v.depth] = [];
      acc[v.depth].push(v);
      return acc;
    }, {} as Record<number, DepthViolation[]>);

    for (const [depth, violations] of Object.entries(byDepth).sort((a, b) => Number(b[0]) - Number(a[0]))) {
      console.log(`\n  Depth ${depth} (${violations.length} files):`);

      if (this.options.verbose) {
        for (const violation of violations) {
          console.log(`    - ${violation.path}`);
          if (violation.suggestion !== violation.path) {
            console.log(`      → Suggested: ${violation.suggestion}`);
          }
        }
      } else {
        // Show only first 3 examples
        for (const violation of violations.slice(0, 3)) {
          console.log(`    - ${violation.path}`);
        }
        if (violations.length > 3) {
          console.log(`    ... and ${violations.length - 3} more`);
        }
      }
    }

    if (!isWarning) {
      console.log('\n📊 Summary:');
      console.log(`  - Target depth: ${this.options.targetDepth}`);
      console.log(`  - Warning depth: ${this.options.warnDepth} (complex domains only)`);
      console.log(`  - Maximum depth: ${this.options.maxDepth}`);
      console.log(`  - Files with errors: ${this.violations.length}`);
      console.log(`  - Files with warnings: ${this.warnings.length}`);
      if (items.length > 0) {
        console.log(`  - Deepest nesting: ${Math.max(...items.map(v => v.depth))}`);
      }
    }
  }

  private async suggestRefactoring(): Promise<void> {
    console.log('\n🔧 Suggested refactoring plan:\n');

    const refactoringPlan = new Map<string, string[]>();

    // Combine violations and warnings for suggestions
    const allIssues = [...this.violations, ...this.warnings];

    // Group moves by target directory
    for (const violation of allIssues) {
      if (violation.suggestion !== violation.path) {
        const targetDir = path.dirname(violation.suggestion);
        if (!refactoringPlan.has(targetDir)) {
          refactoringPlan.set(targetDir, []);
        }
        refactoringPlan.get(targetDir)!.push(violation.path);
      }
    }

    let stepNumber = 1;
    for (const [targetDir, files] of refactoringPlan) {
      console.log(`${stepNumber}. Create/ensure directory: ${targetDir}`);
      console.log(`   Move ${files.length} files:`);
      for (const file of files.slice(0, 3)) {
        console.log(`   - ${file}`);
      }
      if (files.length > 3) {
        console.log(`   ... and ${files.length - 3} more`);
      }
      stepNumber++;
    }

    console.log(`\n${stepNumber}. Update all import statements across the codebase`);
    console.log(`${stepNumber + 1}. Update barrel exports if any`);
    console.log(`${stepNumber + 2}. Run tests to ensure nothing is broken`);

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Note: ${this.warnings.length} files are in complex domains and exceed target depth but are within acceptable limits.`);
      console.log('Consider refactoring these when making major changes to those modules.');
    }
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);

  const options: Partial<ValidationOptions> = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    fix: args.includes('--fix') || args.includes('-f')
  };

  // Parse target depth if provided
  const targetIndex = args.findIndex(arg => arg === '--target-depth' || arg === '-t');
  if (targetIndex !== -1 && args[targetIndex + 1]) {
    options.targetDepth = parseInt(args[targetIndex + 1], 10);
  }

  // Parse warning depth if provided
  const warnIndex = args.findIndex(arg => arg === '--warn-depth' || arg === '-w');
  if (warnIndex !== -1 && args[warnIndex + 1]) {
    options.warnDepth = parseInt(args[warnIndex + 1], 10);
  }

  // Parse max depth if provided
  const depthIndex = args.findIndex(arg => arg === '--max-depth' || arg === '-d');
  if (depthIndex !== -1 && args[depthIndex + 1]) {
    options.maxDepth = parseInt(args[depthIndex + 1], 10);
  }

  const validator = new DepthValidator(options);
  const isValid = await validator.validate();

  if (!isValid) {
    console.log('\n💡 Run with --verbose to see all violations');
    console.log('💡 Run with --fix to see refactoring suggestions');
    process.exit(1);
  }
}

// Run if executed directly
main().catch(err => {
  console.error('Error validating depth:', err);
  process.exit(1);
});

export { DepthValidator, ValidationOptions, DepthViolation };
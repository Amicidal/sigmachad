#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

interface FrontMatter {
  title?: string;
  category?: string;
  created?: string;
  updated?: string;
  status?: string;
  authors?: string[];
  version?: string;
  rfc?: string;
}

interface ValidationError {
  file: string;
  line?: number;
  severity: 'error' | 'warning';
  message: string;
  rule: string;
}

interface LintResult {
  errors: ValidationError[];
  warnings: ValidationError[];
  passed: boolean;
}

class DocumentationLinter {
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];
  private docsDir: string;
  private fix: boolean;

  constructor(docsDir: string = 'Docs', fix: boolean = false) {
    this.docsDir = path.resolve(docsDir);
    this.fix = fix;
  }

  async lint(): Promise<LintResult> {
    console.log(`📝 Linting documentation in ${this.docsDir}...`);

    // Find all markdown files
    const files = await glob('**/*.md', {
      cwd: this.docsDir,
      ignore: [
        'scratch/**',  // Exempt from all rules
        'archive/**',  // Deprecated docs
        'summaries/**', // Auto-generated
        'node_modules/**'
      ]
    });

    for (const file of files) {
      const fullPath = path.join(this.docsDir, file);
      await this.lintFile(fullPath, file);
    }

    const passed = this.errors.length === 0;

    return {
      errors: this.errors,
      warnings: this.warnings,
      passed
    };
  }

  private async lintFile(fullPath: string, relativePath: string) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');

    // Check file naming
    this.checkFileNaming(relativePath);

    // Check frontmatter
    const frontmatter = this.extractFrontmatter(lines);
    this.checkFrontmatter(relativePath, frontmatter);

    // Check directory placement
    this.checkDirectoryPlacement(relativePath, frontmatter);

    // Check required sections
    this.checkRequiredSections(relativePath, frontmatter, lines);

    // Check markdown formatting
    this.checkMarkdownFormatting(relativePath, lines);

    // Check internal links
    this.checkInternalLinks(relativePath, content);

    // Check file size
    this.checkFileSize(relativePath, fullPath);

    // Apply fixes if requested
    if (this.fix) {
      await this.applyFixes(fullPath, relativePath, content, frontmatter);
    }
  }

  private checkFileNaming(file: string) {
    const basename = path.basename(file, '.md');

    // Check for kebab-case
    if (!/^[a-z0-9-]+$/.test(basename)) {
      this.addError(file, undefined, 'file-naming',
        `File name must be kebab-case (lowercase with hyphens): ${basename}`);
    }

    // Check for spaces
    if (basename.includes(' ')) {
      this.addError(file, undefined, 'file-naming',
        'File name must not contain spaces');
    }

    // Check for uppercase
    if (basename !== basename.toLowerCase()) {
      this.addError(file, undefined, 'file-naming',
        'File name must be lowercase');
    }
  }

  private extractFrontmatter(lines: string[]): FrontMatter | null {
    if (lines[0] !== '---') {
      return null;
    }

    const endIndex = lines.slice(1).findIndex(line => line === '---');
    if (endIndex === -1) {
      return null;
    }

    const yamlContent = lines.slice(1, endIndex + 1).join('\n');
    try {
      return yaml.parse(yamlContent) as FrontMatter;
    } catch (e) {
      return null;
    }
  }

  private checkFrontmatter(file: string, frontmatter: FrontMatter | null) {
    if (!frontmatter) {
      this.addError(file, 1, 'missing-frontmatter',
        'Document must have YAML frontmatter');
      return;
    }

    // Required fields
    const required = ['title', 'category', 'created', 'authors'];
    for (const field of required) {
      if (!frontmatter[field as keyof FrontMatter]) {
        this.addError(file, undefined, 'missing-frontmatter-field',
          `Frontmatter missing required field: ${field}`);
      }
    }

    // Valid categories
    const validCategories = ['blueprint', 'guide', 'reference', 'enhancement'];
    if (frontmatter.category && !validCategories.includes(frontmatter.category)) {
      this.addError(file, undefined, 'invalid-category',
        `Invalid category: ${frontmatter.category}. Must be one of: ${validCategories.join(', ')}`);
    }

    // Valid status values
    const validStatuses = ['draft', 'review', 'approved', 'deprecated', 'proposed', 'accepted', 'rejected', 'implemented'];
    if (frontmatter.status && !validStatuses.includes(frontmatter.status)) {
      this.addWarning(file, undefined, 'invalid-status',
        `Invalid status: ${frontmatter.status}. Should be one of: ${validStatuses.join(', ')}`);
    }

    // Date format
    if (frontmatter.created && !this.isValidDate(frontmatter.created)) {
      this.addError(file, undefined, 'invalid-date',
        `Invalid created date format. Use YYYY-MM-DD`);
    }

    if (frontmatter.updated && !this.isValidDate(frontmatter.updated)) {
      this.addError(file, undefined, 'invalid-date',
        `Invalid updated date format. Use YYYY-MM-DD`);
    }

    // Missing updated date warning
    if (!frontmatter.updated) {
      this.addWarning(file, undefined, 'missing-updated',
        'Missing updated date in frontmatter');
    }
  }

  private checkDirectoryPlacement(file: string, frontmatter: FrontMatter | null) {
    if (!frontmatter?.category) return;

    const dir = path.dirname(file);
    const expectedDirs: Record<string, string[]> = {
      'blueprint': ['blueprints', 'Blueprints'],
      'guide': ['guides', 'Guides'],
      'reference': ['references'],
      'enhancement': ['enhancements', 'Enhancements']
    };

    const expected = expectedDirs[frontmatter.category] || [];
    if (expected.length > 0 && !expected.some(d => dir.includes(d))) {
      this.addWarning(file, undefined, 'wrong-directory',
        `Document with category '${frontmatter.category}' should be in ${expected[0]}/ directory`);
    }
  }

  private checkRequiredSections(file: string, frontmatter: FrontMatter | null, lines: string[]) {
    if (!frontmatter?.category) return;

    const content = lines.join('\n');
    const requiredSections: Record<string, string[]> = {
      'blueprint': ['Overview', 'Current State', 'Proposed Solution', 'Implementation Details', 'Testing Strategy'],
      'guide': ['Prerequisites', 'Steps', 'Troubleshooting'],
      'reference': ['Overview', 'Quick Start', 'Reference'],
      'enhancement': ['Problem Statement', 'Proposed Solution', 'Alternatives Considered', 'Impact Analysis']
    };

    const required = requiredSections[frontmatter.category] || [];
    for (const section of required) {
      const regex = new RegExp(`^#+\\s+.*${section}`, 'mi');
      if (!regex.test(content)) {
        this.addWarning(file, undefined, 'missing-section',
          `Missing required section: ${section}`);
      }
    }
  }

  private checkMarkdownFormatting(file: string, lines: string[]) {
    lines.forEach((line, index) => {
      // Check line length
      if (line.length > 120 && !line.includes('http') && !line.startsWith('```')) {
        this.addWarning(file, index + 1, 'line-too-long',
          `Line exceeds 120 characters (${line.length})`);
      }

      // Check for TODO/FIXME
      if (/TODO|FIXME/i.test(line)) {
        this.addWarning(file, index + 1, 'todo-comment',
          'Contains TODO/FIXME comment');
      }

      // Check code blocks have language
      if (line.startsWith('```') && line.length === 3) {
        this.addWarning(file, index + 1, 'missing-code-language',
          'Code block missing language specification');
      }

      // Check list formatting
      if (/^\s*[*+]\s/.test(line)) {
        this.addWarning(file, index + 1, 'list-format',
          'Use - for unordered lists, not * or +');
      }
    });
  }

  private checkInternalLinks(file: string, content: string) {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const link = match[2];

      // Skip external links and anchors
      if (link.startsWith('http') || link.startsWith('#')) {
        continue;
      }

      // Check if internal link exists
      const resolvedPath = path.resolve(path.dirname(path.join(this.docsDir, file)), link);
      if (!fs.existsSync(resolvedPath)) {
        const line = content.substring(0, match.index).split('\n').length;
        this.addError(file, line, 'broken-link',
          `Broken internal link: ${link}`);
      }
    }
  }

  private checkFileSize(file: string, fullPath: string) {
    const stats = fs.statSync(fullPath);
    const sizeKB = stats.size / 1024;

    if (sizeKB > 100) {
      this.addWarning(file, undefined, 'file-too-large',
        `File size exceeds 100KB (${Math.round(sizeKB)}KB)`);
    }
  }

  private async applyFixes(fullPath: string, file: string, content: string, frontmatter: FrontMatter | null) {
    let fixed = content;
    let modified = false;

    // Fix file naming
    const basename = path.basename(file, '.md');
    const fixedBasename = basename.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (basename !== fixedBasename) {
      const newPath = path.join(path.dirname(fullPath), `${fixedBasename}.md`);
      console.log(`  🔧 Renaming ${basename}.md to ${fixedBasename}.md`);
      fs.renameSync(fullPath, newPath);
      return; // File moved, skip other fixes
    }

    // Update frontmatter updated date
    if (frontmatter && !frontmatter.updated) {
      const today = new Date().toISOString().split('T')[0];
      fixed = fixed.replace(/^---\n/m, `---\nupdated: ${today}\n`);
      modified = true;
      console.log(`  🔧 Added updated date to ${file}`);
    }

    // Fix list markers
    fixed = fixed.replace(/^\s*[*+]\s/gm, '- ');
    if (fixed !== content) {
      modified = true;
      console.log(`  🔧 Fixed list markers in ${file}`);
    }

    if (modified) {
      fs.writeFileSync(fullPath, fixed);
    }
  }

  private isValidDate(date: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
  }

  private addError(file: string, line: number | undefined, rule: string, message: string) {
    this.errors.push({
      file,
      line,
      severity: 'error',
      message,
      rule
    });
  }

  private addWarning(file: string, line: number | undefined, rule: string, message: string) {
    this.warnings.push({
      file,
      line,
      severity: 'warning',
      message,
      rule
    });
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');
  const docsDir = args.find(arg => !arg.startsWith('--')) || 'Docs';

  const linter = new DocumentationLinter(docsDir, fix);
  const result = await linter.lint();

  // Print results
  console.log('\n📊 Linting Results:\n');

  if (result.errors.length > 0) {
    console.log('❌ Errors (must fix):');
    result.errors.forEach(error => {
      const location = error.line ? `:${error.line}` : '';
      console.log(`  ${error.file}${location}`);
      console.log(`    [${error.rule}] ${error.message}`);
    });
    console.log();
  }

  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings (should fix):');
    result.warnings.forEach(warning => {
      const location = warning.line ? `:${warning.line}` : '';
      console.log(`  ${warning.file}${location}`);
      console.log(`    [${warning.rule}] ${warning.message}`);
    });
    console.log();
  }

  // Summary
  const errorCount = result.errors.length;
  const warningCount = result.warnings.length;

  if (result.passed) {
    console.log('✅ All documentation checks passed!');
  } else {
    console.log(`📝 Found ${errorCount} error(s) and ${warningCount} warning(s)`);
    if (fix) {
      console.log('\n🔧 Some issues were auto-fixed. Re-run to see remaining issues.');
    } else {
      console.log('\n💡 Run with --fix to auto-fix some issues');
    }
  }

  // Exit with error code if there are errors
  process.exit(result.passed ? 0 : 1);
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error('Error running documentation linter:', error);
    process.exit(1);
  });
}

export { DocumentationLinter, LintResult, ValidationError };
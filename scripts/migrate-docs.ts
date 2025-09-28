#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

interface MigrationReport {
  renamed: string[];
  moved: string[];
  updated: string[];
  errors: string[];
  skipped: string[];
}

class DocumentationMigrator {
  private docsDir: string;
  private report: MigrationReport = {
    renamed: [],
    moved: [],
    updated: [],
    errors: [],
    skipped: []
  };

  constructor(docsDir: string = 'Docs') {
    this.docsDir = path.resolve(docsDir);
  }

  async migrate() {
    console.log(`🚀 Starting documentation migration in ${this.docsDir}...`);

    // Create new directory structure
    await this.createDirectoryStructure();

    // Find all markdown files
    const files = await glob('**/*.md', {
      cwd: this.docsDir,
      ignore: [
        'scratch/**',  // Don't touch scratch
        'summaries/**', // Don't touch auto-generated
        'templates/**', // Don't migrate templates
        'node_modules/**',
        'STANDARDS.md' // Don't migrate the standards doc itself
      ]
    });

    for (const file of files) {
      const fullPath = path.join(this.docsDir, file);
      await this.migrateFile(fullPath, file);
    }

    // Print report
    this.printReport();
  }

  private async createDirectoryStructure() {
    const dirs = [
      'blueprints',
      'guides',
      'references',
      'enhancements',
      'scratch',
      'archive',
      'templates'
    ];

    for (const dir of dirs) {
      const dirPath = path.join(this.docsDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`  📁 Created directory: ${dir}/`);
      }
    }
  }

  private async migrateFile(fullPath: string, relativePath: string) {
    try {
      let content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');

      // Extract or create frontmatter
      let frontmatter = this.extractFrontmatter(lines);
      const hadFrontmatter = frontmatter !== null;

      if (!frontmatter) {
        frontmatter = this.inferFrontmatter(relativePath, content);
        content = this.addFrontmatter(content, frontmatter);
        this.report.updated.push(`Added frontmatter to ${relativePath}`);
      }

      // Update frontmatter if needed
      if (!frontmatter.updated) {
        const stats = fs.statSync(fullPath);
        frontmatter.updated = stats.mtime.toISOString().split('T')[0];
      }

      if (!frontmatter.created) {
        const stats = fs.statSync(fullPath);
        frontmatter.created = stats.birthtime.toISOString().split('T')[0];
      }

      // Fix file name
      const basename = path.basename(relativePath, '.md');
      const fixedBasename = this.fixFileName(basename);
      let newPath = fullPath;

      if (basename !== fixedBasename) {
        const dir = path.dirname(fullPath);
        newPath = path.join(dir, `${fixedBasename}.md`);
        this.report.renamed.push(`${basename}.md → ${fixedBasename}.md`);
      }

      // Determine correct directory
      const targetDir = this.determineTargetDirectory(relativePath, frontmatter);
      const currentDir = path.dirname(relativePath);

      if (targetDir && !currentDir.includes(targetDir)) {
        const targetPath = path.join(this.docsDir, targetDir, path.basename(newPath));
        if (fullPath !== targetPath) {
          // Update internal links before moving
          content = this.updateInternalLinks(content, relativePath, path.join(targetDir, path.basename(newPath)));

          // Move file
          if (fs.existsSync(targetPath)) {
            this.report.errors.push(`Cannot move ${relativePath} - target exists: ${targetPath}`);
          } else {
            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            fs.renameSync(fullPath, targetPath);
            this.report.moved.push(`${relativePath} → ${targetDir}/${path.basename(newPath)}`);
            newPath = targetPath;
          }
        }
      } else if (newPath !== fullPath) {
        // Just rename, don't move
        fs.renameSync(fullPath, newPath);
      }

      // Update content if modified
      if (!hadFrontmatter || content !== fs.readFileSync(fullPath, 'utf-8')) {
        fs.writeFileSync(newPath, content);
      }

    } catch (error) {
      this.report.errors.push(`Failed to migrate ${relativePath}: ${error}`);
    }
  }

  private extractFrontmatter(lines: string[]): any | null {
    if (lines[0] !== '---') {
      return null;
    }

    const endIndex = lines.slice(1).findIndex(line => line === '---');
    if (endIndex === -1) {
      return null;
    }

    const yamlContent = lines.slice(1, endIndex + 1).join('\n');
    try {
      return yaml.parse(yamlContent);
    } catch (e) {
      return null;
    }
  }

  private inferFrontmatter(file: string, content: string): any {
    const basename = path.basename(file, '.md');
    const dir = path.dirname(file);
    const stats = fs.statSync(path.join(this.docsDir, file));

    // Infer category from directory or content
    let category = 'guide'; // default
    if (dir.includes('Blueprint') || basename.includes('blueprint') || content.includes('## Architecture')) {
      category = 'blueprint';
    } else if (dir.includes('Enhancement') || basename.includes('enhancement') || content.includes('## Problem Statement')) {
      category = 'enhancement';
    } else if (basename.includes('reference') || basename.includes('api') || content.includes('## API')) {
      category = 'reference';
    } else if (dir.includes('Guide') || basename.includes('guide') || content.includes('## Steps')) {
      category = 'guide';
    }

    // Infer title from first heading or filename
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : this.humanizeFileName(basename);

    return {
      title,
      category,
      created: stats.birthtime.toISOString().split('T')[0],
      updated: stats.mtime.toISOString().split('T')[0],
      status: 'draft',
      authors: ['unknown']
    };
  }

  private addFrontmatter(content: string, frontmatter: any): string {
    const yamlContent = yaml.stringify(frontmatter);
    return `---\n${yamlContent}---\n\n${content}`;
  }

  private fixFileName(name: string): string {
    return name
      .replace(/([a-z])([A-Z])/g, '$1-$2') // CamelCase to kebab
      .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2') // CAPS to kebab
      .replace(/[_\s]+/g, '-') // Replace underscores and spaces
      .replace(/[^a-z0-9-]/g, '') // Remove invalid chars
      .toLowerCase()
      .replace(/-+/g, '-') // Collapse multiple hyphens
      .replace(/^-|-$/g, ''); // Trim hyphens
  }

  private humanizeFileName(name: string): string {
    return name
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  private determineTargetDirectory(file: string, frontmatter: any): string | null {
    const currentDir = path.dirname(file);

    // Don't move files already in correct locations
    if (currentDir.includes('archive')) return null;
    if (currentDir === '.') {
      // Root level files - check if they should move
      const basename = path.basename(file, '.md');
      if (basename.toLowerCase().includes('readme')) return null;
      if (basename === 'STANDARDS') return null;
    }

    // Map category to directory
    const categoryMap: Record<string, string> = {
      'blueprint': 'blueprints',
      'guide': 'guides',
      'reference': 'references',
      'enhancement': 'enhancements'
    };

    return categoryMap[frontmatter.category] || null;
  }

  private updateInternalLinks(content: string, oldPath: string, newPath: string): string {
    const oldDir = path.dirname(oldPath);
    const newDir = path.dirname(newPath);

    if (oldDir === newDir) return content;

    // Calculate relative path change
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    return content.replace(linkRegex, (match, text, link) => {
      // Skip external links
      if (link.startsWith('http') || link.startsWith('#')) {
        return match;
      }

      // Calculate new relative path
      const absolutePath = path.resolve(path.join(this.docsDir, oldDir), link);
      const newRelative = path.relative(path.join(this.docsDir, newDir), absolutePath);

      return `[${text}](${newRelative})`;
    });
  }

  private printReport() {
    console.log('\n📊 Migration Report:\n');

    if (this.report.renamed.length > 0) {
      console.log('📝 Renamed files:');
      this.report.renamed.forEach(item => console.log(`  • ${item}`));
      console.log();
    }

    if (this.report.moved.length > 0) {
      console.log('📦 Moved files:');
      this.report.moved.forEach(item => console.log(`  • ${item}`));
      console.log();
    }

    if (this.report.updated.length > 0) {
      console.log('✏️  Updated files:');
      this.report.updated.forEach(item => console.log(`  • ${item}`));
      console.log();
    }

    if (this.report.errors.length > 0) {
      console.log('❌ Errors:');
      this.report.errors.forEach(item => console.log(`  • ${item}`));
      console.log();
    }

    if (this.report.skipped.length > 0) {
      console.log('⏭️  Skipped files:');
      this.report.skipped.forEach(item => console.log(`  • ${item}`));
      console.log();
    }

    // Summary
    const total = this.report.renamed.length + this.report.moved.length +
                 this.report.updated.length + this.report.skipped.length;

    if (this.report.errors.length === 0) {
      console.log(`✅ Successfully migrated ${total} files!`);
    } else {
      console.log(`⚠️  Migrated ${total} files with ${this.report.errors.length} errors`);
    }

    // Next steps
    console.log('\n📋 Next steps:');
    console.log('  1. Review the changes with git diff');
    console.log('  2. Run "pnpm lint:docs" to check for remaining issues');
    console.log('  3. Manually review and fix any errors listed above');
    console.log('  4. Update any external references to moved files');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const docsDir = args.find(arg => !arg.startsWith('--')) || 'Docs';

  const migrator = new DocumentationMigrator(docsDir);
  await migrator.migrate();
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error('Error running documentation migration:', error);
    process.exit(1);
  });
}

export { DocumentationMigrator };
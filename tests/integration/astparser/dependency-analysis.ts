/**
 * Circular Dependency Analysis for ASTParser Modules
 *
 * This script analyzes the import dependencies between the refactored
 * ASTParser modules to detect any circular dependencies that could
 * cause issues at runtime.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface ModuleDependency {
  moduleName: string;
  filePath: string;
  imports: string[];
  exports: string[];
}

class DependencyAnalyzer {
  private parserDir = '/Users/Coding/Desktop/sigmachad/src/services/knowledge/parser';
  private modules: ModuleDependency[] = [];

  async analyze(): Promise<void> {
    console.log('🔍 Analyzing ASTParser Module Dependencies');
    console.log('=' + '='.repeat(50));

    await this.loadModules();
    await this.detectCircularDependencies();
    await this.generateDependencyGraph();
    await this.validateModuleIntegration();

    console.log('\n✅ Dependency analysis complete');
  }

  private async loadModules(): Promise<void> {
    console.log('📂 Loading module files...');

    const files = await fs.readdir(this.parserDir);
    const tsFiles = files.filter(f => f.endsWith('.ts') && !f.endsWith('.d.ts'));

    for (const file of tsFiles) {
      const filePath = path.join(this.parserDir, file);
      const content = await fs.readFile(filePath, 'utf-8');

      const moduleName = path.basename(file, '.ts');
      const imports = this.extractImports(content);
      const exports = this.extractExports(content);

      this.modules.push({
        moduleName,
        filePath,
        imports: imports.filter(imp => imp.startsWith('./') || imp.startsWith('../')), // Only relative imports
        exports
      });

      console.log(`   📄 ${moduleName}: ${imports.length} imports, ${exports.length} exports`);
    }
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];

    // Match import statements
    const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];

    // Match export statements
    const exportRegex = /export\s+(?:class|interface|function|const|let|var|type|enum)\s+(\w+)/g;
    let match;

    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    // Match default exports
    const defaultExportRegex = /export\s+default\s+(?:class|interface|function)?\s*(\w+)?/g;
    while ((match = defaultExportRegex.exec(content)) !== null) {
      if (match[1]) {
        exports.push(`default:${match[1]}`);
      }
    }

    return exports;
  }

  private async detectCircularDependencies(): Promise<void> {
    console.log('\n🔄 Checking for circular dependencies...');

    const dependencyGraph: Map<string, string[]> = new Map();

    // Build dependency graph
    for (const module of this.modules) {
      const dependencies = module.imports
        .map(imp => this.resolveImportToModuleName(imp))
        .filter(dep => dep !== null) as string[];

      dependencyGraph.set(module.moduleName, dependencies);
    }

    // Detect cycles using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {
        // Found a cycle
        const cycleStart = path.indexOf(node);
        const cycle = path.slice(cycleStart);
        cycle.push(node);
        cycles.push(cycle);
        return;
      }

      if (visited.has(node)) {
        return;
      }

      visited.add(node);
      recursionStack.add(node);

      const dependencies = dependencyGraph.get(node) || [];
      for (const dep of dependencies) {
        if (dependencyGraph.has(dep)) {
          dfs(dep, [...path, node]);
        }
      }

      recursionStack.delete(node);
    };

    for (const module of this.modules) {
      if (!visited.has(module.moduleName)) {
        dfs(module.moduleName, []);
      }
    }

    if (cycles.length === 0) {
      console.log('✅ No circular dependencies detected');
    } else {
      console.log(`❌ Found ${cycles.length} circular dependencies:`);
      cycles.forEach((cycle, index) => {
        console.log(`   ${index + 1}. ${cycle.join(' -> ')}`);
      });
    }

    // Print dependency relationships
    console.log('\n📋 Module Dependencies:');
    for (const [module, deps] of dependencyGraph.entries()) {
      if (deps.length > 0) {
        console.log(`   ${module} depends on: ${deps.join(', ')}`);
      } else {
        console.log(`   ${module} has no internal dependencies`);
      }
    }
  }

  private resolveImportToModuleName(importPath: string): string | null {
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      // Extract filename from relative path
      const fileName = path.basename(importPath);
      if (fileName.endsWith('.js')) {
        return fileName.slice(0, -3); // Remove .js extension
      }
      return fileName;
    }
    return null; // External dependency
  }

  private async generateDependencyGraph(): Promise<void> {
    console.log('\n📊 Dependency Graph (Mermaid format):');
    console.log('```mermaid');
    console.log('graph TD');

    for (const module of this.modules) {
      const cleanModuleName = module.moduleName.replace(/[^a-zA-Z0-9]/g, '');
      console.log(`    ${cleanModuleName}[${module.moduleName}]`);

      for (const imp of module.imports) {
        const depName = this.resolveImportToModuleName(imp);
        if (depName && depName !== module.moduleName) {
          const cleanDepName = depName.replace(/[^a-zA-Z0-9]/g, '');
          console.log(`    ${cleanModuleName} --> ${cleanDepName}`);
        }
      }
    }

    console.log('```');
  }

  private async validateModuleIntegration(): Promise<void> {
    console.log('\n🔧 Validating Module Integration Points:');

    // Check ASTParserCore imports all necessary modules
    const coreModule = this.modules.find(m => m.moduleName === 'ASTParserCore');
    if (coreModule) {
      const expectedImports = [
        'CacheManager',
        'DirectoryHandler',
        'TypeCheckerBudget',
        'SymbolExtractor',
        'ModuleResolver',
        'RelationshipBuilder'
      ];

      const actualImports = coreModule.imports
        .map(imp => this.resolveImportToModuleName(imp))
        .filter(imp => imp !== null);

      const missingImports = expectedImports.filter(expected =>
        !actualImports.includes(expected)
      );

      if (missingImports.length === 0) {
        console.log('✅ ASTParserCore imports all required modules');
      } else {
        console.log(`❌ ASTParserCore missing imports: ${missingImports.join(', ')}`);
      }
    }

    // Check for proper export structure
    console.log('\n📤 Module Exports:');
    for (const module of this.modules) {
      if (module.exports.length === 0) {
        console.log(`⚠️  ${module.moduleName} has no exports`);
      } else {
        console.log(`✅ ${module.moduleName}: ${module.exports.join(', ')}`);
      }
    }

    // Check for potential issues
    console.log('\n⚠️  Potential Integration Issues:');

    // Look for modules with too many dependencies
    const highDependencyModules = this.modules.filter(m => m.imports.length > 8);
    if (highDependencyModules.length > 0) {
      console.log('   📈 Modules with high dependency count:');
      highDependencyModules.forEach(m => {
        console.log(`      ${m.moduleName}: ${m.imports.length} dependencies`);
      });
    }

    // Look for unused modules (no imports from other modules)
    const allImports = this.modules.flatMap(m =>
      m.imports.map(imp => this.resolveImportToModuleName(imp)).filter(imp => imp !== null)
    );

    const unusedModules = this.modules.filter(m =>
      !allImports.includes(m.moduleName) && m.moduleName !== 'ASTParserCore' && m.moduleName !== 'index'
    );

    if (unusedModules.length > 0) {
      console.log('   🚫 Potentially unused modules:');
      unusedModules.forEach(m => {
        console.log(`      ${m.moduleName}`);
      });
    }

    if (highDependencyModules.length === 0 && unusedModules.length === 0) {
      console.log('   ✅ No obvious integration issues detected');
    }
  }
}

// Run the analysis
async function main() {
  const analyzer = new DependencyAnalyzer();
  await analyzer.analyze();
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { DependencyAnalyzer };
/**
 * Dependency Scanner (SCA - Software Composition Analysis)
 * Scans dependencies for known vulnerabilities and security issues
 */

import * as fs from "fs";
import * as path from "path";
import {
  SecurityScanOptions,
  Vulnerability,
  DependencyInfo,
  SecuritySeverity
} from "./types.js";
import { VulnerabilityDatabase } from "./vulnerability-db.js";
import { NODE_PACKAGE_ECOSYSTEM } from "./ecosystems.js";

export class DependencyScanner {
  private vulnerabilityDb: VulnerabilityDatabase;
  private packageCache: Map<string, DependencyInfo[]> = new Map();

  constructor() {
    this.vulnerabilityDb = new VulnerabilityDatabase();
  }

  async initialize(): Promise<void> {
    await this.vulnerabilityDb.initialize();
  }

  async scan(entities: any[], options: SecurityScanOptions): Promise<Vulnerability[]> {
    const vulnerabilities: Vulnerability[] = [];
    const dependencies = await this.collectDependencies(entities);

    // Batch vulnerability lookups for efficiency
    const uniqueDeps = this.deduplicateDependencies(dependencies);

    for (const dep of uniqueDeps) {
      try {
        const vulns = await this.vulnerabilityDb.checkVulnerabilities(
          dep.name,
          dep.version,
          dep.ecosystem
        );
        vulnerabilities.push(...vulns);
      } catch (error) {
        console.warn(`Failed to check vulnerabilities for ${dep.name}@${dep.version}:`, error);
      }
    }

    return this.filterVulnerabilities(vulnerabilities, options);
  }

  async scanPackageFile(filePath: string): Promise<DependencyInfo[]> {
    if (this.packageCache.has(filePath)) {
      return this.packageCache.get(filePath)!;
    }

    let dependencies: DependencyInfo[] = [];

    try {
      const fileName = path.basename(filePath);
      const content = fs.readFileSync(filePath, 'utf-8');

      switch (fileName) {
        case 'package.json':
          dependencies = this.parsePackageJson(content, filePath);
          break;
        case 'requirements.txt':
          dependencies = this.parseRequirementsTxt(content, filePath);
          break;
        case 'Pipfile':
          dependencies = this.parsePipfile(content, filePath);
          break;
        case 'Gemfile':
          dependencies = this.parseGemfile(content, filePath);
          break;
        case 'pom.xml':
          dependencies = this.parsePomXml(content, filePath);
          break;
        case 'build.gradle':
          dependencies = this.parseBuildGradle(content, filePath);
          break;
        case 'go.mod':
          dependencies = this.parseGoMod(content, filePath);
          break;
        case 'Cargo.toml':
          dependencies = this.parseCargoToml(content, filePath);
          break;
        case 'composer.json':
          dependencies = this.parseComposerJson(content, filePath);
          break;
        default:
          console.warn(`Unsupported package file: ${fileName}`);
      }

      this.packageCache.set(filePath, dependencies);
    } catch (error) {
      console.error(`Failed to parse package file ${filePath}:`, error);
    }

    return dependencies;
  }

  async getLicenseInfo(dependencies: DependencyInfo[]): Promise<Map<string, string[]>> {
    const licenseMap = new Map<string, string[]>();

    for (const dep of dependencies) {
      if (dep.licenses && dep.licenses.length > 0) {
        licenseMap.set(`${dep.name}@${dep.version}`, dep.licenses);
      }
    }

    return licenseMap;
  }

  private async collectDependencies(entities: any[]): Promise<DependencyInfo[]> {
    const allDependencies: DependencyInfo[] = [];

    for (const entity of entities) {
      if (!this.isFileEntity(entity)) continue;

      if (this.isPackageFile(entity.path)) {
        const deps = await this.scanPackageFile(entity.path);
        allDependencies.push(...deps);
      }
    }

    return allDependencies;
  }

  private deduplicateDependencies(dependencies: DependencyInfo[]): DependencyInfo[] {
    const seen = new Set<string>();
    const unique: DependencyInfo[] = [];

    for (const dep of dependencies) {
      const key = `${dep.ecosystem}:${dep.name}@${dep.version}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(dep);
      }
    }

    return unique;
  }

  private filterVulnerabilities(
    vulnerabilities: Vulnerability[],
    options: SecurityScanOptions
  ): Vulnerability[] {
    return vulnerabilities.filter(vuln => {
      // Apply severity threshold
      if (!this.meetsSeverityThreshold(vuln.severity, options.severityThreshold)) {
        return false;
      }

      return true;
    });
  }

  private meetsSeverityThreshold(
    severity: SecuritySeverity,
    threshold: SecuritySeverity
  ): boolean {
    const severityLevels: Record<SecuritySeverity, number> = {
      "info": 0,
      "low": 1,
      "medium": 2,
      "high": 3,
      "critical": 4
    };

    return severityLevels[severity] >= severityLevels[threshold];
  }

  private parsePackageJson(content: string, filePath: string): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];

    try {
      const pkg = JSON.parse(content);

      // Parse production dependencies
      if (pkg.dependencies) {
        for (const [name, version] of Object.entries(pkg.dependencies)) {
          dependencies.push({
            name,
            version: String(version),
            ecosystem: NODE_PACKAGE_ECOSYSTEM,
            scope: "runtime",
            path: filePath,
            direct: true
          });
        }
      }

      // Parse development dependencies
      if (pkg.devDependencies) {
        for (const [name, version] of Object.entries(pkg.devDependencies)) {
          dependencies.push({
            name,
            version: String(version),
            ecosystem: NODE_PACKAGE_ECOSYSTEM,
            scope: "development",
            path: filePath,
            direct: true
          });
        }
      }

      // Parse optional dependencies
      if (pkg.optionalDependencies) {
        for (const [name, version] of Object.entries(pkg.optionalDependencies)) {
          dependencies.push({
            name,
            version: String(version),
            ecosystem: NODE_PACKAGE_ECOSYSTEM,
            scope: "optional",
            path: filePath,
            direct: true
          });
        }
      }
    } catch (error) {
      console.error(`Failed to parse package.json at ${filePath}:`, error);
    }

    return dependencies;
  }

  private parseRequirementsTxt(content: string, filePath: string): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('-')) {
        continue;
      }

      // Parse different requirement formats
      const match = trimmed.match(/^([^>=<!~\s]+)([>=<!~][^#]*)?/);
      if (match) {
        const name = match[1];
        const version = match[2] ? match[2].trim() : "*";

        dependencies.push({
          name,
          version,
          ecosystem: "pypi",
          scope: "runtime",
          path: filePath,
          direct: true
        });
      }
    }

    return dependencies;
  }

  private parsePipfile(content: string, filePath: string): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];

    try {
      // Basic TOML parsing for Pipfile
      const lines = content.split('\n');
      let currentSection = '';

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          currentSection = trimmed.slice(1, -1);
          continue;
        }

        if ((currentSection === 'packages' || currentSection === 'dev-packages') &&
            trimmed.includes('=')) {
          const [name, version] = trimmed.split('=', 2);
          if (name && version) {
            dependencies.push({
              name: name.trim(),
              version: version.trim().replace(/"/g, ''),
              ecosystem: "pypi",
              scope: currentSection === 'dev-packages' ? 'development' : 'runtime',
              path: filePath,
              direct: true
            });
          }
        }
      }
    } catch (error) {
      console.error(`Failed to parse Pipfile at ${filePath}:`, error);
    }

    return dependencies;
  }

  private parseGemfile(content: string, filePath: string): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Match gem declarations: gem 'name', 'version'
      const match = trimmed.match(/gem\s+['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/);
      if (match) {
        const name = match[1];
        const version = match[2] || "*";

        dependencies.push({
          name,
          version,
          ecosystem: "rubygems",
          scope: "runtime",
          path: filePath,
          direct: true
        });
      }
    }

    return dependencies;
  }

  private parsePomXml(content: string, filePath: string): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];

    try {
      // Basic XML parsing for Maven pom.xml
      const dependencyMatches = content.matchAll(/<dependency>[\s\S]*?<\/dependency>/g);

      for (const match of dependencyMatches) {
        const depXml = match[0];
        const groupIdMatch = depXml.match(/<groupId>([^<]+)<\/groupId>/);
        const artifactIdMatch = depXml.match(/<artifactId>([^<]+)<\/artifactId>/);
        const versionMatch = depXml.match(/<version>([^<]+)<\/version>/);
        const scopeMatch = depXml.match(/<scope>([^<]+)<\/scope>/);

        if (groupIdMatch && artifactIdMatch) {
          const name = `${groupIdMatch[1]}:${artifactIdMatch[1]}`;
          const version = versionMatch ? versionMatch[1] : "*";
          const scope = scopeMatch ? scopeMatch[1] : "runtime";

          dependencies.push({
            name,
            version,
            ecosystem: "maven",
            scope: scope as any,
            path: filePath,
            direct: true
          });
        }
      }
    } catch (error) {
      console.error(`Failed to parse pom.xml at ${filePath}:`, error);
    }

    return dependencies;
  }

  private parseBuildGradle(content: string, filePath: string): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Match various Gradle dependency formats
      const patterns = [
        /(?:implementation|compile|testImplementation|api)\s+['"]([^:'"]+):([^:'"]+):([^'"]+)['"]/,
        /(?:implementation|compile|testImplementation|api)\s+group:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*version:\s*['"]([^'"]+)['"]/
      ];

      for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match) {
          const name = `${match[1]}:${match[2]}`;
          const version = match[3];

          dependencies.push({
            name,
            version,
            ecosystem: "maven",
            scope: trimmed.includes("test") ? "development" : "runtime",
            path: filePath,
            direct: true
          });
          break;
        }
      }
    }

    return dependencies;
  }

  private parseGoMod(content: string, filePath: string): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];
    const lines = content.split('\n');
    let inRequireBlock = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === 'require (') {
        inRequireBlock = true;
        continue;
      }

      if (inRequireBlock && trimmed === ')') {
        inRequireBlock = false;
        continue;
      }

      // Parse require statements
      if (trimmed.startsWith('require ') || inRequireBlock) {
        const match = trimmed.match(/([^\s]+)\s+v([^\s]+)/);
        if (match) {
          dependencies.push({
            name: match[1],
            version: `v${match[2]}`,
            ecosystem: "go",
            scope: "runtime",
            path: filePath,
            direct: true
          });
        }
      }
    }

    return dependencies;
  }

  private parseCargoToml(content: string, filePath: string): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];

    try {
      // Basic TOML parsing for Cargo.toml
      const lines = content.split('\n');
      let currentSection = '';

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          currentSection = trimmed.slice(1, -1);
          continue;
        }

        if ((currentSection === 'dependencies' || currentSection === 'dev-dependencies') &&
            trimmed.includes('=')) {
          const [name, version] = trimmed.split('=', 2);
          if (name && version) {
            dependencies.push({
              name: name.trim(),
              version: version.trim().replace(/"/g, ''),
              ecosystem: "cargo",
              scope: currentSection === 'dev-dependencies' ? 'development' : 'runtime',
              path: filePath,
              direct: true
            });
          }
        }
      }
    } catch (error) {
      console.error(`Failed to parse Cargo.toml at ${filePath}:`, error);
    }

    return dependencies;
  }

  private parseComposerJson(content: string, filePath: string): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];

    try {
      const composer = JSON.parse(content);

      // Parse production dependencies
      if (composer.require) {
        for (const [name, version] of Object.entries(composer.require)) {
          if (name === 'php') continue; // Skip PHP version requirement

          dependencies.push({
            name,
            version: String(version),
            ecosystem: "packagist",
            scope: "runtime",
            path: filePath,
            direct: true
          });
        }
      }

      // Parse development dependencies
      if (composer['require-dev']) {
        for (const [name, version] of Object.entries(composer['require-dev'])) {
          dependencies.push({
            name,
            version: String(version),
            ecosystem: "packagist",
            scope: "development",
            path: filePath,
            direct: true
          });
        }
      }
    } catch (error) {
      console.error(`Failed to parse composer.json at ${filePath}:`, error);
    }

    return dependencies;
  }

  private isFileEntity(entity: any): boolean {
    return entity && entity.type === "file" && entity.path;
  }

  private isPackageFile(filePath: string): boolean {
    const packageFiles = [
      'package.json',
      'requirements.txt',
      'Pipfile',
      'Gemfile',
      'pom.xml',
      'build.gradle',
      'go.mod',
      'Cargo.toml',
      'composer.json'
    ];

    const fileName = path.basename(filePath);
    return packageFiles.includes(fileName);
  }
}

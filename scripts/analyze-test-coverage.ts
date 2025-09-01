#!/usr/bin/env tsx

/**
 * Test Coverage Analysis Script
 * Analyzes test quality and provides insights for improvement
 */

import { promises as fs } from 'fs';
import * as path from 'path';

interface TestFileAnalysis {
  file: string;
  lines: number;
  testCount: number;
  mockLines: number;
  integrationTests: number;
  unitTests: number;
  quality: 'high' | 'medium' | 'low';
}

interface CoverageReport {
  totalTestFiles: number;
  totalLines: number;
  averageLinesPerFile: number;
  qualityDistribution: Record<string, number>;
  largestFiles: Array<{ file: string; lines: number }>;
  recommendations: string[];
}

class TestCoverageAnalyzer {
  private testFiles: string[] = [];
  private analyses: TestFileAnalysis[] = [];

  async analyze(): Promise<CoverageReport> {
    await this.findTestFiles();
    await this.analyzeFiles();

    const report = this.generateReport();
    this.printReport(report);

    return report;
  }

  private async findTestFiles(): Promise<void> {
    const testDir = path.join(process.cwd(), 'tests');
    console.log('Looking for test files in:', testDir);

    try {
      const files = await fs.readdir(testDir, { recursive: true });
      console.log('Found files:', files.length);
      this.testFiles = files
        .filter(file => typeof file === 'string' && file.endsWith('.test.ts'))
        .map(file => path.join(testDir, file));
      console.log('Test files found:', this.testFiles.length);
    } catch (error) {
      console.error('Error reading test directory:', error);
      this.testFiles = [];
    }
  }

  private async analyzeFiles(): Promise<void> {
    for (const file of this.testFiles) {
      const analysis = await this.analyzeTestFile(file);
      this.analyses.push(analysis);
    }
  }

  private async analyzeTestFile(filePath: string): Promise<TestFileAnalysis> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').length;

    // Count test cases
    const testCount = (content.match(/it\(/g) || []).length;

    // Count mock-related lines
    const mockLines = (content.match(/jest\.mock|jest\.fn\(\)|mockImplementation/g) || []).length;

    // Estimate integration vs unit tests
    const integrationIndicators = (content.match(/DatabaseService|KnowledgeGraphService|real.*service/gi) || []).length;
    const unitIndicators = (content.match(/jest\.mock|mock.*service/gi) || []).length;

    // Quality assessment
    let quality: 'high' | 'medium' | 'low' = 'medium';
    if (lines < 100 && mockLines < 5) {
      quality = 'high';
    } else if (lines > 500 || mockLines > 20) {
      quality = 'low';
    }

    return {
      file: path.relative(process.cwd(), filePath),
      lines,
      testCount,
      mockLines,
      integrationTests: integrationIndicators,
      unitTests: unitIndicators,
      quality
    };
  }

  private generateReport(): CoverageReport {
    const totalLines = this.analyses.reduce((sum, a) => sum + a.lines, 0);
    const averageLinesPerFile = Math.round(totalLines / this.analyses.length);

    const qualityDistribution = this.analyses.reduce((dist, a) => {
      dist[a.quality] = (dist[a.quality] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);

    const largestFiles = this.analyses
      .sort((a, b) => b.lines - a.lines)
      .slice(0, 5)
      .map(a => ({ file: a.file, lines: a.lines }));

    const recommendations = this.generateRecommendations();

    return {
      totalTestFiles: this.analyses.length,
      totalLines,
      averageLinesPerFile,
      qualityDistribution,
      largestFiles,
      recommendations
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    const totalLines = this.analyses.reduce((sum, a) => sum + a.lines, 0);
    const avgLines = totalLines / this.analyses.length;

    if (avgLines > 300) {
      recommendations.push('Average test file size is too high. Aim for 100-200 lines per test file.');
    }

    const lowQualityCount = this.analyses.filter(a => a.quality === 'low').length;
    if (lowQualityCount > 0) {
      recommendations.push(`${lowQualityCount} test files are low quality. Focus on reducing mocking and file size.`);
    }

    const mockHeavyFiles = this.analyses.filter(a => a.mockLines > 10).length;
    if (mockHeavyFiles > 0) {
      recommendations.push(`${mockHeavyFiles} test files have excessive mocking. Consider integration tests instead.`);
    }

    if (totalLines > 3000) {
      recommendations.push(`Total test lines (${totalLines}) exceed target of 3000. Consider further consolidation.`);
    }

    return recommendations;
  }

  private printReport(report: CoverageReport): void {
    console.log('='.repeat(60));
    console.log('TEST COVERAGE ANALYSIS REPORT');
    console.log('='.repeat(60));
    console.log();

    console.log('📊 SUMMARY:');
    console.log(`   Total test files: ${report.totalTestFiles}`);
    console.log(`   Total lines of test code: ${report.totalLines.toLocaleString()}`);
    console.log(`   Average lines per file: ${report.averageLinesPerFile}`);
    console.log();

    console.log('🎯 QUALITY DISTRIBUTION:');
    Object.entries(report.qualityDistribution).forEach(([quality, count]) => {
      const percentage = Math.round((count / report.totalTestFiles) * 100);
      const emoji = quality === 'high' ? '✅' : quality === 'medium' ? '⚠️' : '❌';
      console.log(`   ${emoji} ${quality}: ${count} files (${percentage}%)`);
    });
    console.log();

    console.log('📈 LARGEST TEST FILES:');
    report.largestFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.file}: ${file.lines} lines`);
    });
    console.log();

    if (report.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
      console.log();
    }

    console.log('='.repeat(60));
  }
}

// Run analysis if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new TestCoverageAnalyzer();
  analyzer.analyze().catch(console.error);
}

export { TestCoverageAnalyzer };

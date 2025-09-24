/**
 * Security Scanner Performance Benchmark
 * Tests performance, memory usage, and cache effectiveness
 */
export interface BenchmarkResult {
    testName: string;
    fileCount: number;
    totalSize: number;
    duration: number;
    memoryUsage: {
        initial: NodeJS.MemoryUsage;
        peak: NodeJS.MemoryUsage;
        final: NodeJS.MemoryUsage;
    };
    issuesFound: number;
    throughput: {
        filesPerSecond: number;
        bytesPerSecond: number;
    };
    cacheStats?: {
        hits: number;
        misses: number;
        hitRate: number;
    };
}
export interface PerformanceMetrics {
    scanTime: number;
    memoryPeak: number;
    cpuUsage: number;
    ioOperations: number;
    cacheEfficiency: number;
}
export declare class SecurityBenchmark {
    private scanner;
    private mockDb;
    private mockKgService;
    constructor();
    runAllBenchmarks(): Promise<BenchmarkResult[]>;
    private benchmarkSmallRepository;
    private benchmarkMediumRepository;
    private benchmarkLargeRepository;
    private benchmarkMemoryStress;
    private benchmarkCacheEffectiveness;
    private benchmarkIncrementalScanning;
    private benchmarkParallelScanning;
    private runBenchmark;
    private generateTestFiles;
    private generateRealisticCodeContent;
    private generateRandomComment;
    private calculateTotalSize;
    private printBenchmarkSummary;
    private assessPerformance;
    private formatBytes;
    private cleanupTempFiles;
    benchmarkSpecificScanner(scannerType: 'code' | 'secrets' | 'dependencies', fileCount?: number): Promise<BenchmarkResult>;
    runMemoryLeakTest(iterations?: number): Promise<void>;
}
//# sourceMappingURL=performance-benchmark.d.ts.map
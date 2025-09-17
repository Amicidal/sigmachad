/**
 * MCP Server Router for Memento
 * Provides MCP protocol support for AI assistants (Claude, etc.)
 */
import { FastifyInstance } from "fastify";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { KnowledgeGraphService } from "../services/KnowledgeGraphService.js";
import { DatabaseService } from "../services/DatabaseService.js";
import { ASTParser } from "../services/ASTParser.js";
import { TestEngine } from "../services/TestEngine.js";
import { SecurityScanner } from "../services/SecurityScanner.js";
interface ToolExecutionMetrics {
    toolName: string;
    executionCount: number;
    totalExecutionTime: number;
    averageExecutionTime: number;
    errorCount: number;
    successCount: number;
    lastExecutionTime?: Date;
    lastErrorTime?: Date;
    lastErrorMessage?: string;
}
export declare class MCPRouter {
    private kgService;
    private dbService;
    private astParser;
    private testEngine;
    private securityScanner;
    private server;
    private tools;
    private metrics;
    private executionHistory;
    private getSrcRoot;
    constructor(kgService: KnowledgeGraphService, dbService: DatabaseService, astParser: ASTParser, testEngine: TestEngine, securityScanner: SecurityScanner);
    private registerTools;
    private registerTool;
    private setupRequestHandlers;
    private handleCreateSpec;
    private handleGraphSearch;
    private handleGetExamples;
    private handleProposeDiff;
    private handleValidateCode;
    private handlePlanTests;
    private generateTestPlan;
    private estimateTestCoverage;
    private handleSecurityScan;
    private performStaticAnalysisScan;
    private performDependencyScan;
    private performSecretsScan;
    private performDependencyAnalysis;
    private updateSeverityCounts;
    private getCWEMapping;
    private getMockCVSSScore;
    private getDocFreshnessWindowMs;
    private shouldFlagDocumentationOutdated;
    private evaluateDeploymentGate;
    private handleImpactAnalysis;
    private analyzeDirectImpact;
    private analyzeCascadingImpact;
    private analyzeTestImpact;
    private analyzeDocumentationImpact;
    private generateImpactRecommendations;
    private calculateRiskLevel;
    private riskLevelToScore;
    private riskScoreToLabel;
    private estimateEffort;
    private handleSyncDocs;
    private extractBusinessDomains;
    private updateSemanticClusters;
    private syncDocumentationRelationships;
    registerRoutes(app: FastifyInstance): void;
    getServer(): Server;
    getToolCount(): number;
    private recordExecution;
    private handleAstGrepSearch;
    private runAstGrepOne;
    private searchWithTsMorph;
    getMetrics(): {
        tools: ToolExecutionMetrics[];
        summary: any;
    };
    getExecutionHistory(limit?: number): any[];
    getPerformanceReport(): any;
    private generatePerformanceRecommendations;
    private determineHealthStatus;
    private handleSimpleToolCall;
    /**
     * Validate parameter type against JSON schema
     */
    private validateParameterType;
    private processMCPRequest;
    validateServer(): Promise<{
        isValid: boolean;
        errors: string[];
    }>;
    startStdio(): Promise<void>;
    private handleAnalyzeTestResults;
    private handleGetCoverage;
    private handleGetPerformance;
    private handleParseTestResults;
    private analyzePerformanceTrends;
    private calculatePerformanceTrend;
    private generateTestRecommendations;
}
export {};
//# sourceMappingURL=mcp-router.d.ts.map
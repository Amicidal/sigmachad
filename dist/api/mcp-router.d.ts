/**
 * MCP Server Router for Memento
 * Provides MCP protocol support for AI assistants (Claude, etc.)
 */
import { FastifyInstance } from "fastify";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { KnowledgeGraphService } from "../services/knowledge/KnowledgeGraphService.js";
import { DatabaseService } from "../services/core/DatabaseService.js";
import { ASTParser } from "../services/knowledge/ASTParser.js";
import { TestEngine } from "../services/testing/TestEngine.js";
import { SecurityScanner } from "../services/testing/SecurityScanner.js";
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
    private testPlanningService;
    private specService;
    private getSrcRoot;
    constructor(kgService: KnowledgeGraphService, dbService: DatabaseService, astParser: ASTParser, testEngine: TestEngine, securityScanner: SecurityScanner);
    private registerTools;
    private registerTool;
    private setupRequestHandlers;
    private handleCreateSpec;
    private handleGraphSearch;
    private handleListModuleChildren;
    private handleListImports;
    private handleFindDefinition;
    private parseBooleanFlag;
    private parseStringArrayFlag;
    private parseNumericLimit;
    private handleGetExamples;
    private handleProposeDiff;
    private handleValidateCode;
    private handlePlanTests;
    private generateFallbackTestPlan;
    private humanizeSpecId;
    private extractQueryRows;
    private isValidUuid;
    private normalizeErrorMessage;
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
    private handleImpactAnalysis;
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
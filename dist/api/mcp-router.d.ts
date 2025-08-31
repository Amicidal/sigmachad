/**
 * MCP Server Router for Memento
 * Provides MCP protocol support for AI assistants (Claude, etc.)
 */
import { FastifyInstance } from 'fastify';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { KnowledgeGraphService } from '../services/KnowledgeGraphService.js';
import { DatabaseService } from '../services/DatabaseService.js';
import { ASTParser } from '../services/ASTParser.js';
export declare class MCPRouter {
    private kgService;
    private dbService;
    private astParser;
    private server;
    private tools;
    constructor(kgService: KnowledgeGraphService, dbService: DatabaseService, astParser: ASTParser);
    private registerTools;
    private registerTool;
    private setupRequestHandlers;
    private handleCreateSpec;
    private handleGraphSearch;
    private handleGetExamples;
    private handleProposeDiff;
    private handleValidateCode;
    private handlePlanTests;
    private handleSecurityScan;
    private handleImpactAnalysis;
    private handleSyncDocs;
    registerRoutes(app: FastifyInstance): void;
    getServer(): Server;
    getToolCount(): number;
    private processMCPRequest;
    validateServer(): Promise<{
        isValid: boolean;
        errors: string[];
    }>;
    startStdio(): Promise<void>;
}
//# sourceMappingURL=mcp-router.d.ts.map
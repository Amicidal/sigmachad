/**
 * API Gateway for Memento
 * Main entry point for all API interactions (REST, WebSocket, MCP)
 */
import { FastifyInstance } from "fastify";
import { KnowledgeGraphService, ASTParser, DocumentationParser } from "../../../dist/services/knowledge/index.js";
import { DatabaseService, FileWatcher } from "../../../dist/services/core/index.js";
import { SynchronizationCoordinator, SynchronizationMonitoring, ConflictResolution, RollbackCapabilities } from "../../../dist/services/synchronization/index.js";
import { SecurityScanner } from "../../../dist/services/testing/index.js";
import { ScopeRule } from "./middleware/scope-catalog.js";
export interface APIGatewayConfig {
    port: number;
    host: string;
    cors: {
        origin: string | string[];
        credentials: boolean;
    };
    rateLimit: {
        max: number;
        timeWindow: string;
    };
    auth?: {
        scopeRules?: ScopeRule[];
    };
}
export interface SynchronizationServices {
    syncCoordinator?: SynchronizationCoordinator;
    syncMonitor?: SynchronizationMonitoring;
    conflictResolver?: ConflictResolution;
    rollbackCapabilities?: RollbackCapabilities;
}
export declare class APIGateway {
    private kgService;
    private dbService;
    private app;
    private config;
    private mcpRouter;
    private wsRouter;
    private testEngine;
    private securityScanner;
    private astParser;
    private docParser;
    private fileWatcher?;
    private syncServices?;
    private backupService?;
    private loggingService?;
    private maintenanceService?;
    private configurationService?;
    private _historyIntervals;
    private healthCheckCache;
    private readonly HEALTH_CACHE_TTL;
    private scopeCatalog;
    private refreshSessionStore;
    constructor(kgService: KnowledgeGraphService, dbService: DatabaseService, fileWatcher?: FileWatcher, astParser?: ASTParser, docParser?: DocumentationParser, securityScanner?: SecurityScanner, config?: Partial<APIGatewayConfig>, syncServices?: SynchronizationServices);
    private setupMiddleware;
    private setupRoutes;
    private setupErrorHandling;
    registerScopeRule(rule: ScopeRule): void;
    registerScopeRules(rules: ScopeRule[]): void;
    private resolveScopeRequirement;
    private isAuthEnforced;
    private getErrorCode;
    private generateRequestId;
    private validateMCPServer;
    start(): Promise<void>;
    getServer(): FastifyInstance;
    stop(): Promise<void>;
    getApp(): FastifyInstance;
    private startHistorySchedulers;
    getConfig(): APIGatewayConfig;
    private isOriginAllowed;
}
//# sourceMappingURL=APIGateway.d.ts.map
/**
 * API Gateway for Memento
 * Main entry point for all API interactions (REST, WebSocket, MCP)
 */
import { FastifyInstance } from "fastify";
import { KnowledgeGraphService } from "../services/knowledge/KnowledgeGraphService.js";
import { DatabaseService } from "../services/core/DatabaseService.js";
import { FileWatcher } from "../services/core/FileWatcher.js";
import { ASTParser } from "../services/knowledge/ASTParser.js";
import { DocumentationParser } from "../services/knowledge/DocumentationParser.js";
import { SynchronizationCoordinator } from "../services/synchronization/SynchronizationCoordinator.js";
import { ConflictResolution } from "../services/scm/ConflictResolution.js";
import { SynchronizationMonitoring } from "../services/synchronization/SynchronizationMonitoring.js";
import { RollbackCapabilities } from "../services/scm/RollbackCapabilities.js";
import { SecurityScanner } from "../services/testing/SecurityScanner.js";
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
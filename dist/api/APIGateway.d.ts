/**
 * API Gateway for Memento
 * Main entry point for all API interactions (REST, WebSocket, GraphQL)
 */
import { FastifyInstance } from 'fastify';
import { KnowledgeGraphService } from '../services/KnowledgeGraphService.js';
import { DatabaseService } from '../services/DatabaseService.js';
import { FileWatcher } from '../services/FileWatcher.js';
import { ASTParser } from '../services/ASTParser.js';
import { SynchronizationCoordinator } from '../services/SynchronizationCoordinator.js';
import { ConflictResolution } from '../services/ConflictResolution.js';
import { SynchronizationMonitoring } from '../services/SynchronizationMonitoring.js';
import { RollbackCapabilities } from '../services/RollbackCapabilities.js';
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
    private fileWatcher;
    private astParser;
    private app;
    private config;
    private mcpRouter;
    private wsRouter;
    private syncServices?;
    constructor(kgService: KnowledgeGraphService, dbService: DatabaseService, fileWatcher: FileWatcher, astParser: ASTParser, config?: Partial<APIGatewayConfig>, syncServices?: SynchronizationServices);
    private setupMiddleware;
    private setupRoutes;
    private setupErrorHandling;
    private getErrorCode;
    private generateRequestId;
    private validateMCPServer;
    start(): Promise<void>;
    stop(): Promise<void>;
    getApp(): FastifyInstance;
    getConfig(): APIGatewayConfig;
}
//# sourceMappingURL=APIGateway.d.ts.map
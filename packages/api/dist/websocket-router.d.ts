/**
 * WebSocket Router for Memento
 * Handles real-time updates, subscriptions, and connection management
 */
import { FastifyInstance } from "fastify";
import { EventEmitter } from "events";
import { FileWatcher, DatabaseService } from "../../../dist/services/core/index.js";
import { KnowledgeGraphService } from "../../../dist/services/knowledge/index.js";
import { SynchronizationCoordinator } from "../../../dist/services/synchronization/index.js";
import { WebSocketConnection, WebSocketMessage } from "./websocket/types.js";
export type { WebSocketConnection, WebSocketFilter, WebSocketMessage, SubscriptionRequest, WebSocketEvent, ConnectionSubscription, NormalizedSubscriptionFilter, } from "./websocket/types.js";
export declare class WebSocketRouter extends EventEmitter {
    private kgService;
    private dbService;
    private fileWatcher?;
    private syncCoordinator?;
    private connections;
    private subscriptions;
    private heartbeatInterval?;
    private cleanupInterval?;
    private wss?;
    private httpServer?;
    private upgradeHandler?;
    private lastEvents;
    private backpressureThreshold;
    private backpressureRetryDelayMs;
    private maxBackpressureRetries;
    private backpressureManager;
    private metrics;
    private keepAliveGraceMs;
    private sessionEventHandler?;
    constructor(kgService: KnowledgeGraphService, dbService: DatabaseService, fileWatcher?: FileWatcher | undefined, syncCoordinator?: SynchronizationCoordinator);
    private isAuthRequired;
    private bindEventHandlers;
    private bindSessionEvents;
    registerRoutes(app: FastifyInstance): void;
    private handleConnection;
    private handleMessage;
    private handleSubscription;
    private handleSessionStreamEvent;
    private toEventMessage;
    private handleUnsubscription;
    private removeSubscription;
    private handleDisconnection;
    private broadcastEvent;
    private sendMessage;
    private dispatchWithBackpressure;
    private writeToSocket;
    private generateConnectionId;
    startConnectionManagement(): void;
    stopConnectionManagement(): void;
    getStats(): {
        totalConnections: number;
        activeSubscriptions: Record<string, number>;
        uptime: number;
        backpressureSkips: number;
        stalledConnections: number;
        backpressureDisconnects: number;
    };
    broadcastCustomEvent(eventType: string, data: any, source?: string): void;
    sendToConnection(connectionId: string, message: WebSocketMessage): void;
    getConnections(): WebSocketConnection[];
    shutdown(): Promise<void>;
}
//# sourceMappingURL=websocket-router.d.ts.map
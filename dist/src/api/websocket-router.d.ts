/**
 * WebSocket Router for Memento
 * Handles real-time updates, subscriptions, and connection management
 */
import { FastifyInstance } from 'fastify';
import { EventEmitter } from 'events';
import { FileWatcher } from '../services/FileWatcher.js';
import { KnowledgeGraphService } from '../services/KnowledgeGraphService.js';
import { DatabaseService } from '../services/DatabaseService.js';
export interface WebSocketConnection {
    id: string;
    socket: any;
    subscriptions: Set<string>;
    lastActivity: Date;
    userAgent?: string;
    ip?: string;
}
export interface WebSocketMessage {
    type: string;
    id?: string;
    data?: any;
    filter?: WebSocketFilter;
    timestamp?: string;
}
export interface WebSocketFilter {
    paths?: string[];
    eventTypes?: string[];
    entityTypes?: string[];
    relationshipTypes?: string[];
}
export interface SubscriptionRequest {
    event: string;
    filter?: WebSocketFilter;
}
export interface WebSocketEvent {
    type: 'file_change' | 'graph_update' | 'entity_created' | 'entity_updated' | 'entity_deleted' | 'relationship_created' | 'relationship_deleted' | 'sync_status';
    timestamp: string;
    data: any;
    source?: string;
}
export declare class WebSocketRouter extends EventEmitter {
    private kgService;
    private dbService;
    private fileWatcher?;
    private connections;
    private subscriptions;
    private heartbeatInterval?;
    private cleanupInterval?;
    constructor(kgService: KnowledgeGraphService, dbService: DatabaseService, fileWatcher?: FileWatcher | undefined);
    private bindEventHandlers;
    registerRoutes(app: FastifyInstance): void;
    private handleConnection;
    private handleMessage;
    private handleSubscription;
    private handleUnsubscription;
    private handleDisconnection;
    private broadcastEvent;
    private sendMessage;
    private generateConnectionId;
    startConnectionManagement(): void;
    stopConnectionManagement(): void;
    getStats(): {
        totalConnections: number;
        activeSubscriptions: Record<string, number>;
        uptime: number;
    };
    broadcastCustomEvent(eventType: string, data: any, source?: string): void;
    sendToConnection(connectionId: string, message: WebSocketMessage): void;
    getConnections(): WebSocketConnection[];
    shutdown(): Promise<void>;
}
//# sourceMappingURL=websocket-router.d.ts.map
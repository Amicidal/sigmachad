/**
 * WebSocket Router for Memento
 * Handles real-time updates, subscriptions, and connection management
 */
import { EventEmitter } from 'events';
export class WebSocketRouter extends EventEmitter {
    kgService;
    dbService;
    fileWatcher;
    connections = new Map();
    subscriptions = new Map(); // eventType -> connectionIds
    heartbeatInterval;
    cleanupInterval;
    constructor(kgService, dbService, fileWatcher) {
        super();
        this.kgService = kgService;
        this.dbService = dbService;
        this.fileWatcher = fileWatcher;
        // Set max listeners for event emitter
        this.setMaxListeners(100);
        // Bind event handlers
        this.bindEventHandlers();
    }
    bindEventHandlers() {
        // File watcher events (only if fileWatcher is available)
        if (this.fileWatcher) {
            this.fileWatcher.on('change', (change) => {
                this.broadcastEvent({
                    type: 'file_change',
                    timestamp: new Date().toISOString(),
                    data: change,
                    source: 'file_watcher'
                });
            });
        }
        // Graph service events (we'll add these to the service)
        this.kgService.on('entityCreated', (entity) => {
            this.broadcastEvent({
                type: 'entity_created',
                timestamp: new Date().toISOString(),
                data: entity,
                source: 'knowledge_graph'
            });
        });
        this.kgService.on('entityUpdated', (entity) => {
            this.broadcastEvent({
                type: 'entity_updated',
                timestamp: new Date().toISOString(),
                data: entity,
                source: 'knowledge_graph'
            });
        });
        this.kgService.on('entityDeleted', (entityId) => {
            this.broadcastEvent({
                type: 'entity_deleted',
                timestamp: new Date().toISOString(),
                data: { id: entityId },
                source: 'knowledge_graph'
            });
        });
        this.kgService.on('relationshipCreated', (relationship) => {
            this.broadcastEvent({
                type: 'relationship_created',
                timestamp: new Date().toISOString(),
                data: relationship,
                source: 'knowledge_graph'
            });
        });
        this.kgService.on('relationshipDeleted', (relationshipId) => {
            this.broadcastEvent({
                type: 'relationship_deleted',
                timestamp: new Date().toISOString(),
                data: { id: relationshipId },
                source: 'knowledge_graph'
            });
        });
        // Synchronization events (if available)
        this.kgService.on('syncStatus', (status) => {
            this.broadcastEvent({
                type: 'sync_status',
                timestamp: new Date().toISOString(),
                data: status,
                source: 'synchronization'
            });
        });
    }
    registerRoutes(app) {
        app.get('/ws', { websocket: true }, (connection, request) => {
            this.handleConnection(connection, request);
        });
        // Health check for WebSocket connections
        app.get('/ws/health', async (request, reply) => {
            reply.send({
                status: 'healthy',
                connections: this.connections.size,
                subscriptions: Array.from(this.subscriptions.keys()),
                timestamp: new Date().toISOString()
            });
        });
    }
    handleConnection(connection, request) {
        const connectionId = this.generateConnectionId();
        const wsConnection = {
            id: connectionId,
            socket: connection.socket,
            subscriptions: new Set(),
            lastActivity: new Date(),
            userAgent: request.headers['user-agent'],
            ip: request.ip
        };
        // Add to connections
        this.connections.set(connectionId, wsConnection);
        console.log(`🔌 WebSocket connection established: ${connectionId} (${request.ip})`);
        // Send welcome message
        this.sendMessage(wsConnection, {
            type: 'connected',
            id: connectionId,
            timestamp: new Date().toISOString(),
            data: {
                message: 'Connected to Memento WebSocket',
                supportedEvents: [
                    'file_change',
                    'graph_update',
                    'entity_created',
                    'entity_updated',
                    'entity_deleted',
                    'relationship_created',
                    'relationship_deleted',
                    'sync_status'
                ]
            }
        });
        // Handle incoming messages
        connection.socket.on('message', (message) => {
            try {
                const parsedMessage = JSON.parse(message.toString());
                this.handleMessage(wsConnection, parsedMessage);
            }
            catch (error) {
                this.sendMessage(wsConnection, {
                    type: 'error',
                    data: {
                        message: 'Invalid message format',
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
            }
        });
        // Handle ping/pong for connection health
        connection.socket.on('ping', () => {
            wsConnection.lastActivity = new Date();
            connection.socket.pong();
        });
        // Handle disconnection
        connection.socket.on('close', () => {
            this.handleDisconnection(connectionId);
        });
        // Handle errors
        connection.socket.on('error', (error) => {
            console.error(`WebSocket error for ${connectionId}:`, error);
            this.handleDisconnection(connectionId);
        });
    }
    handleMessage(connection, message) {
        connection.lastActivity = new Date();
        switch (message.type) {
            case 'subscribe':
                this.handleSubscription(connection, message);
                break;
            case 'unsubscribe':
                this.handleUnsubscription(connection, message);
                break;
            case 'ping':
                this.sendMessage(connection, {
                    type: 'pong',
                    id: message.id,
                    timestamp: new Date().toISOString()
                });
                break;
            case 'list_subscriptions':
                this.sendMessage(connection, {
                    type: 'subscriptions',
                    id: message.id,
                    data: Array.from(connection.subscriptions)
                });
                break;
            default:
                this.sendMessage(connection, {
                    type: 'error',
                    id: message.id,
                    data: {
                        message: `Unknown message type: ${message.type}`,
                        supportedTypes: ['subscribe', 'unsubscribe', 'ping', 'list_subscriptions']
                    }
                });
        }
    }
    handleSubscription(connection, message) {
        const subscription = message.data;
        if (!subscription || !subscription.event) {
            this.sendMessage(connection, {
                type: 'error',
                id: message.id,
                data: { message: 'Missing subscription event' }
            });
            return;
        }
        // Add to connection's subscriptions
        connection.subscriptions.add(subscription.event);
        // Add to global subscriptions
        if (!this.subscriptions.has(subscription.event)) {
            this.subscriptions.set(subscription.event, new Set());
        }
        this.subscriptions.get(subscription.event).add(connection.id);
        console.log(`📡 Connection ${connection.id} subscribed to: ${subscription.event}`);
        this.sendMessage(connection, {
            type: 'subscribed',
            id: message.id,
            data: {
                event: subscription.event,
                filter: subscription.filter,
                totalSubscriptions: connection.subscriptions.size
            }
        });
    }
    handleUnsubscription(connection, message) {
        const event = message.data?.event;
        if (!event) {
            this.sendMessage(connection, {
                type: 'error',
                id: message.id,
                data: { message: 'Missing event to unsubscribe from' }
            });
            return;
        }
        // Remove from connection's subscriptions
        connection.subscriptions.delete(event);
        // Remove from global subscriptions
        const eventSubscriptions = this.subscriptions.get(event);
        if (eventSubscriptions) {
            eventSubscriptions.delete(connection.id);
            if (eventSubscriptions.size === 0) {
                this.subscriptions.delete(event);
            }
        }
        console.log(`📡 Connection ${connection.id} unsubscribed from: ${event}`);
        this.sendMessage(connection, {
            type: 'unsubscribed',
            id: message.id,
            data: {
                event,
                totalSubscriptions: connection.subscriptions.size
            }
        });
    }
    handleDisconnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (!connection)
            return;
        console.log(`🔌 WebSocket connection closed: ${connectionId}`);
        // Clean up subscriptions
        for (const event of connection.subscriptions) {
            const eventSubscriptions = this.subscriptions.get(event);
            if (eventSubscriptions) {
                eventSubscriptions.delete(connectionId);
                if (eventSubscriptions.size === 0) {
                    this.subscriptions.delete(event);
                }
            }
        }
        // Remove from connections
        this.connections.delete(connectionId);
    }
    broadcastEvent(event) {
        const eventSubscriptions = this.subscriptions.get(event.type);
        if (!eventSubscriptions || eventSubscriptions.size === 0) {
            return; // No subscribers for this event
        }
        const eventMessage = {
            type: 'event',
            data: event
        };
        let broadcastCount = 0;
        for (const connectionId of eventSubscriptions) {
            const connection = this.connections.get(connectionId);
            if (connection) {
                this.sendMessage(connection, eventMessage);
                broadcastCount++;
            }
        }
        if (broadcastCount > 0) {
            console.log(`📡 Broadcasted ${event.type} event to ${broadcastCount} connections`);
        }
    }
    sendMessage(connection, message) {
        try {
            if (connection.socket.readyState === 1) { // OPEN
                connection.socket.send(JSON.stringify({
                    ...message,
                    timestamp: message.timestamp || new Date().toISOString()
                }));
            }
        }
        catch (error) {
            console.error(`Failed to send message to connection ${connection.id}:`, error);
            this.handleDisconnection(connection.id);
        }
    }
    generateConnectionId() {
        return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Connection management methods
    startConnectionManagement() {
        // Heartbeat to detect dead connections
        this.heartbeatInterval = setInterval(() => {
            const now = Date.now();
            const timeout = 30000; // 30 seconds
            for (const [connectionId, connection] of this.connections) {
                if (now - connection.lastActivity.getTime() > timeout) {
                    console.log(`💔 Connection ${connectionId} timed out`);
                    this.handleDisconnection(connectionId);
                }
            }
        }, 10000); // Check every 10 seconds
        // Cleanup inactive connections
        this.cleanupInterval = setInterval(() => {
            const inactiveConnections = Array.from(this.connections.entries())
                .filter(([, conn]) => Date.now() - conn.lastActivity.getTime() > 60000) // 1 minute
                .map(([id]) => id);
            for (const connectionId of inactiveConnections) {
                console.log(`🧹 Cleaning up inactive connection: ${connectionId}`);
                this.handleDisconnection(connectionId);
            }
        }, 30000); // Clean every 30 seconds
        console.log('✅ WebSocket connection management started');
    }
    stopConnectionManagement() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = undefined;
        }
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = undefined;
        }
        console.log('🛑 WebSocket connection management stopped');
    }
    // Statistics and monitoring
    getStats() {
        const activeSubscriptions = {};
        for (const [event, connections] of this.subscriptions) {
            activeSubscriptions[event] = connections.size;
        }
        return {
            totalConnections: this.connections.size,
            activeSubscriptions,
            uptime: process.uptime()
        };
    }
    // Broadcast custom events
    broadcastCustomEvent(eventType, data, source) {
        this.broadcastEvent({
            type: eventType,
            timestamp: new Date().toISOString(),
            data,
            source
        });
    }
    // Send message to specific connection
    sendToConnection(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (connection) {
            this.sendMessage(connection, message);
        }
    }
    // Get all connections
    getConnections() {
        return Array.from(this.connections.values());
    }
    // Graceful shutdown
    async shutdown() {
        console.log('🔄 Shutting down WebSocket router...');
        // Stop connection management
        this.stopConnectionManagement();
        // Close all connections
        const closePromises = [];
        for (const connection of this.connections.values()) {
            closePromises.push(new Promise((resolve) => {
                if (connection.socket.readyState === 1) { // OPEN
                    this.sendMessage(connection, {
                        type: 'shutdown',
                        data: { message: 'Server is shutting down' }
                    });
                    connection.socket.close(1001, 'Server shutdown'); // Going away
                }
                resolve();
            }));
        }
        await Promise.all(closePromises);
        this.connections.clear();
        this.subscriptions.clear();
        console.log('✅ WebSocket router shutdown complete');
    }
}
//# sourceMappingURL=websocket-router.js.map
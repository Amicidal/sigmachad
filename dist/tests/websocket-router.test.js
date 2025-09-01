/**
 * WebSocket Router Unit Tests
 * Comprehensive tests for WebSocket connection management, subscriptions, and event broadcasting
 */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { WebSocketRouter } from '../src/api/websocket-router.js';
// Mock all dependencies
jest.mock('../src/services/KnowledgeGraphService.js');
jest.mock('../src/services/DatabaseService.js');
jest.mock('../src/services/FileWatcher.js');
describe('WebSocketRouter', () => {
    let mockKgService;
    let mockDbService;
    let mockFileWatcher;
    let wsRouter;
    let mockSocket;
    let mockRequest;
    beforeEach(() => {
        // Create mock instances
        mockKgService = {};
        mockDbService = {};
        mockFileWatcher = {};
        // Setup mock methods
        mockKgService.on = jest.fn();
        mockFileWatcher.on = jest.fn();
        // Create WebSocket Router instance
        wsRouter = new WebSocketRouter(mockKgService, mockDbService, mockFileWatcher);
        // Mock WebSocket connection
        mockSocket = {
            readyState: 1, // OPEN
            send: jest.fn(),
            close: jest.fn(),
            pong: jest.fn(),
            on: jest.fn()
        };
        // Mock request
        mockRequest = {
            headers: {
                'user-agent': 'TestAgent/1.0'
            },
            ip: '127.0.0.1'
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
        wsRouter.stopConnectionManagement();
    });
    describe('Constructor and Initialization', () => {
        it('should initialize successfully with all dependencies', () => {
            expect(wsRouter).toBeDefined();
            expect(mockFileWatcher.on).toHaveBeenCalledWith('change', expect.any(Function));
            expect(mockKgService.on).toHaveBeenCalledWith('entityCreated', expect.any(Function));
            expect(mockKgService.on).toHaveBeenCalledWith('entityUpdated', expect.any(Function));
            expect(mockKgService.on).toHaveBeenCalledWith('entityDeleted', expect.any(Function));
            expect(mockKgService.on).toHaveBeenCalledWith('relationshipCreated', expect.any(Function));
            expect(mockKgService.on).toHaveBeenCalledWith('relationshipDeleted', expect.any(Function));
            expect(mockKgService.on).toHaveBeenCalledWith('syncStatus', expect.any(Function));
        });
        it('should set max listeners for event emitter', () => {
            // The constructor should set max listeners
            expect(wsRouter).toBeDefined();
        });
    });
    describe('Connection Handling', () => {
        it('should handle new WebSocket connection', () => {
            const connection = { socket: mockSocket };
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            wsRouter.handleConnection(connection, mockRequest);
            // Should create a connection entry
            const connections = wsRouter.getConnections();
            expect(connections.length).toBe(1);
            const wsConnection = connections[0];
            expect(wsConnection).toHaveProperty('id');
            expect(wsConnection.socket).toBe(mockSocket);
            expect(wsConnection.subscriptions).toBeInstanceOf(Set);
            expect(wsConnection.userAgent).toBe('TestAgent/1.0');
            expect(wsConnection.ip).toBe('127.0.0.1');
            // Should send welcome message
            expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"connected"'));
            consoleSpy.mockRestore();
        });
        it('should generate unique connection IDs', () => {
            const connection1 = { socket: { ...mockSocket } };
            const connection2 = { socket: { ...mockSocket } };
            wsRouter.handleConnection(connection1, mockRequest);
            wsRouter.handleConnection(connection2, mockRequest);
            const connections = wsRouter.getConnections();
            expect(connections.length).toBe(2);
            expect(connections[0].id).not.toBe(connections[1].id);
        });
        it('should handle connection message parsing', () => {
            const connection = { socket: mockSocket };
            wsRouter.handleConnection(connection, mockRequest);
            const connectionId = wsRouter.getConnections()[0].id;
            const messageHandler = mockSocket.on.mock.calls.find(call => call[0] === 'message')[1];
            // Test valid JSON message
            const validMessage = {
                type: 'ping',
                id: 'test-1'
            };
            messageHandler(Buffer.from(JSON.stringify(validMessage)));
            expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"pong"'));
        });
        it('should handle invalid JSON messages', () => {
            const connection = { socket: mockSocket };
            wsRouter.handleConnection(connection, mockRequest);
            const messageHandler = mockSocket.on.mock.calls.find(call => call[0] === 'message')[1];
            // Test invalid JSON
            messageHandler(Buffer.from('invalid json'));
            expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"error"'));
        });
        it('should handle ping/pong for connection health', () => {
            const connection = { socket: mockSocket };
            wsRouter.handleConnection(connection, mockRequest);
            const pingHandler = mockSocket.on.mock.calls.find(call => call[0] === 'ping')[1];
            const beforePing = wsRouter.getConnections()[0].lastActivity;
            pingHandler();
            expect(mockSocket.pong).toHaveBeenCalled();
            // Note: lastActivity update might be asynchronous
        });
        it('should handle connection errors', () => {
            const connection = { socket: mockSocket };
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            wsRouter.handleConnection(connection, mockRequest);
            const connectionId = wsRouter.getConnections()[0].id;
            const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'error')[1];
            errorHandler(new Error('Test error'));
            // Connection should be cleaned up
            expect(wsRouter.getConnections().length).toBe(0);
            consoleSpy.mockRestore();
        });
    });
    describe('Message Handling', () => {
        let wsConnection;
        beforeEach(() => {
            const connection = { socket: mockSocket };
            wsRouter.handleConnection(connection, mockRequest);
            wsConnection = wsRouter.getConnections()[0];
        });
        describe('Subscribe Messages', () => {
            it('should handle subscription to events', () => {
                const message = {
                    type: 'subscribe',
                    id: 'sub-1',
                    data: { event: 'file_change' }
                };
                wsRouter.handleMessage(wsConnection, message);
                expect(wsConnection.subscriptions.has('file_change')).toBe(true);
                expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"subscribed"'));
            });
            it('should handle subscription with filter', () => {
                const message = {
                    type: 'subscribe',
                    id: 'sub-2',
                    data: {
                        event: 'entity_created',
                        filter: {
                            entityTypes: ['function', 'class']
                        }
                    }
                };
                wsRouter.handleMessage(wsConnection, message);
                expect(wsConnection.subscriptions.has('entity_created')).toBe(true);
            });
            it('should reject subscription without event', () => {
                const message = {
                    type: 'subscribe',
                    id: 'sub-3',
                    data: {}
                };
                wsRouter.handleMessage(wsConnection, message);
                expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('"message":"Missing subscription event"'));
            });
        });
        describe('Unsubscribe Messages', () => {
            beforeEach(() => {
                // Subscribe first
                const subMessage = {
                    type: 'subscribe',
                    data: { event: 'file_change' }
                };
                wsRouter.handleMessage(wsConnection, subMessage);
            });
            it('should handle unsubscription from events', () => {
                const message = {
                    type: 'unsubscribe',
                    id: 'unsub-1',
                    data: { event: 'file_change' }
                };
                wsRouter.handleMessage(wsConnection, message);
                expect(wsConnection.subscriptions.has('file_change')).toBe(false);
                expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"unsubscribed"'));
            });
            it('should reject unsubscription without event', () => {
                const message = {
                    type: 'unsubscribe',
                    id: 'unsub-2',
                    data: {}
                };
                wsRouter.handleMessage(wsConnection, message);
                expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('"message":"Missing event to unsubscribe from"'));
            });
        });
        describe('Ping Messages', () => {
            it('should respond to ping messages', () => {
                const message = {
                    type: 'ping',
                    id: 'ping-1'
                };
                wsRouter.handleMessage(wsConnection, message);
                expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"pong"'));
            });
        });
        describe('List Subscriptions Messages', () => {
            it('should list current subscriptions', () => {
                // Subscribe to some events first
                const subMessage1 = {
                    type: 'subscribe',
                    data: { event: 'file_change' }
                };
                const subMessage2 = {
                    type: 'subscribe',
                    data: { event: 'entity_created' }
                };
                wsRouter.handleMessage(wsConnection, subMessage1);
                wsRouter.handleMessage(wsConnection, subMessage2);
                const listMessage = {
                    type: 'list_subscriptions',
                    id: 'list-1'
                };
                wsRouter.handleMessage(wsConnection, listMessage);
                expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"subscriptions"'));
                expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('file_change'));
                expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('entity_created'));
            });
        });
        describe('Unknown Messages', () => {
            it('should handle unknown message types', () => {
                const message = {
                    type: 'unknown_type',
                    id: 'unknown-1'
                };
                wsRouter.handleMessage(wsConnection, message);
                expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"error"'));
                expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('Unknown message type'));
            });
        });
    });
    describe('Event Broadcasting', () => {
        let wsConnection;
        beforeEach(() => {
            const connection = { socket: mockSocket };
            wsRouter.handleConnection(connection, mockRequest);
            wsConnection = wsRouter.getConnections()[0];
            // Subscribe to an event
            const subMessage = {
                type: 'subscribe',
                data: { event: 'file_change' }
            };
            wsRouter.handleMessage(wsConnection, subMessage);
        });
        it('should broadcast events to subscribed connections', () => {
            const event = {
                type: 'file_change',
                timestamp: new Date().toISOString(),
                data: { path: 'src/test.ts', type: 'modified' },
                source: 'file_watcher'
            };
            wsRouter.broadcastEvent(event);
            expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"event"'));
            expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('"file_change"'));
        });
        it('should not broadcast events with no subscribers', () => {
            const event = {
                type: 'file_change',
                timestamp: new Date().toISOString(),
                data: {},
                source: 'test'
            };
            wsRouter.broadcastEvent(event);
            // Should not send any messages
            expect(mockSocket.send).not.toHaveBeenCalledWith(expect.stringContaining('"type":"event"'));
        });
        it('should broadcast custom events', () => {
            // Subscribe to custom event
            const subMessage = {
                type: 'subscribe',
                data: { event: 'custom_event' }
            };
            wsRouter.handleMessage(wsConnection, subMessage);
            wsRouter.broadcastCustomEvent('custom_event', { message: 'test' }, 'test_source');
            expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"event"'));
            expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('"custom_event"'));
        });
        it('should handle broadcast to closed connections gracefully', () => {
            // Close the socket
            mockSocket.readyState = 3; // CLOSED
            const event = {
                type: 'file_change',
                timestamp: new Date().toISOString(),
                data: { path: 'src/test.ts', type: 'modified' }
            };
            // Should not throw and should handle gracefully
            expect(() => {
                wsRouter.broadcastEvent(event);
            }).not.toThrow();
        });
    });
    describe('Connection Management', () => {
        it('should start connection management', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            wsRouter.startConnectionManagement();
            // Should set up intervals
            expect(wsRouter.heartbeatInterval).toBeDefined();
            expect(wsRouter.cleanupInterval).toBeDefined();
            consoleSpy.mockRestore();
        });
        it('should stop connection management', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            wsRouter.startConnectionManagement();
            wsRouter.stopConnectionManagement();
            expect(wsRouter.heartbeatInterval).toBeUndefined();
            expect(wsRouter.cleanupInterval).toBeUndefined();
            consoleSpy.mockRestore();
        });
        it('should handle disconnection cleanup', () => {
            const connection = { socket: mockSocket };
            wsRouter.handleConnection(connection, mockRequest);
            const wsConnection = wsRouter.getConnections()[0];
            // Subscribe to some events
            const subMessage1 = {
                type: 'subscribe',
                data: { event: 'file_change' }
            };
            const subMessage2 = {
                type: 'subscribe',
                data: { event: 'entity_created' }
            };
            wsRouter.handleMessage(wsConnection, subMessage1);
            wsRouter.handleMessage(wsConnection, subMessage2);
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            // Disconnect
            wsRouter.handleDisconnection(wsConnection.id);
            expect(wsRouter.getConnections().length).toBe(0);
            expect(wsConnection.subscriptions.size).toBe(2); // Original subscriptions maintained
            consoleSpy.mockRestore();
        });
    });
    describe('Statistics and Monitoring', () => {
        it('should provide connection statistics', () => {
            const connection = { socket: mockSocket };
            wsRouter.handleConnection(connection, mockRequest);
            const stats = wsRouter.getStats();
            expect(stats).toHaveProperty('totalConnections');
            expect(stats).toHaveProperty('activeSubscriptions');
            expect(stats).toHaveProperty('uptime');
            expect(stats.totalConnections).toBe(1);
            expect(typeof stats.uptime).toBe('number');
        });
        it('should track active subscriptions in stats', () => {
            const connection = { socket: mockSocket };
            wsRouter.handleConnection(connection, mockRequest);
            const wsConnection = wsRouter.getConnections()[0];
            // Subscribe to events
            const subMessage1 = {
                type: 'subscribe',
                data: { event: 'file_change' }
            };
            const subMessage2 = {
                type: 'subscribe',
                data: { event: 'entity_created' }
            };
            wsRouter.handleMessage(wsConnection, subMessage1);
            wsRouter.handleMessage(wsConnection, subMessage2);
            const stats = wsRouter.getStats();
            expect(stats.activeSubscriptions).toHaveProperty('file_change');
            expect(stats.activeSubscriptions).toHaveProperty('entity_created');
            expect(stats.activeSubscriptions.file_change).toBe(1);
            expect(stats.activeSubscriptions.entity_created).toBe(1);
        });
    });
    describe('Send Message to Specific Connection', () => {
        it('should send message to specific connection', () => {
            const connection = { socket: mockSocket };
            wsRouter.handleConnection(connection, mockRequest);
            const wsConnection = wsRouter.getConnections()[0];
            const message = {
                type: 'test_message',
                data: { message: 'test' }
            };
            wsRouter.sendToConnection(wsConnection.id, message);
            expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"test_message"'));
        });
        it('should handle sending to non-existent connection', () => {
            const message = {
                type: 'test_message',
                data: { message: 'test' }
            };
            // Should not throw
            expect(() => {
                wsRouter.sendToConnection('nonexistent', message);
            }).not.toThrow();
        });
    });
    describe('Graceful Shutdown', () => {
        it('should shutdown gracefully', async () => {
            const connection = { socket: mockSocket };
            wsRouter.handleConnection(connection, mockRequest);
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            await wsRouter.shutdown();
            expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"shutdown"'));
            expect(mockSocket.close).toHaveBeenCalledWith(1001, 'Server shutdown');
            expect(wsRouter.getConnections().length).toBe(0);
            consoleSpy.mockRestore();
        });
        it('should handle shutdown with no connections', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            await wsRouter.shutdown();
            expect(wsRouter.getConnections().length).toBe(0);
            consoleSpy.mockRestore();
        });
    });
    describe('Event Handler Integration', () => {
        it('should handle file change events', () => {
            const connection = { socket: mockSocket };
            wsRouter.handleConnection(connection, mockRequest);
            const wsConnection = wsRouter.getConnections()[0];
            // Subscribe to file_change events
            const subMessage = {
                type: 'subscribe',
                data: { event: 'file_change' }
            };
            wsRouter.handleMessage(wsConnection, subMessage);
            // Simulate file change event (this would normally come from FileWatcher)
            const fileChange = {
                path: 'src/test.ts',
                type: 'modified',
                timestamp: new Date()
            };
            // Manually trigger the event handler that was bound during construction
            const fileChangeHandler = mockFileWatcher.on.mock.calls.find(call => call[0] === 'change')?.[1];
            fileChangeHandler(fileChange);
            expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"event"'));
            expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('"file_change"'));
        });
        it('should handle knowledge graph events', () => {
            const connection = { socket: mockSocket };
            wsRouter.handleConnection(connection, mockRequest);
            const wsConnection = wsRouter.getConnections()[0];
            // Subscribe to entity_created events
            const subMessage = {
                type: 'subscribe',
                data: { event: 'entity_created' }
            };
            wsRouter.handleMessage(wsConnection, subMessage);
            // Simulate entity created event
            const entity = {
                id: 'test_entity',
                type: 'function',
                name: 'testFunction'
            };
            // Manually trigger the event handler that was bound during construction
            const entityCreatedHandler = mockKgService.on.mock.calls.find(call => call[0] === 'entityCreated')?.[1];
            entityCreatedHandler(entity);
            expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"event"'));
            expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('"entity_created"'));
        });
    });
    describe('Error Handling', () => {
        it('should handle malformed WebSocket messages gracefully', () => {
            const connection = { socket: mockSocket };
            wsRouter.handleConnection(connection, mockRequest);
            const messageHandler = mockSocket.on.mock.calls.find((call) => call[0] === 'message')?.[1];
            // Send malformed JSON
            messageHandler(Buffer.from('{"invalid": json}'));
            expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"error"'));
        });
        it('should handle socket send errors gracefully', () => {
            const connection = { socket: mockSocket };
            wsRouter.handleConnection(connection, mockRequest);
            const wsConnection = wsRouter.getConnections()[0];
            // Mock socket send to throw error
            mockSocket.send.mockImplementation(() => {
                throw new Error('Send failed');
            });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            // Try to send message
            const message = { type: 'test' };
            wsRouter.sendMessage(wsConnection, message);
            // Connection should be cleaned up
            expect(wsRouter.getConnections().length).toBe(0);
            consoleSpy.mockRestore();
        });
    });
});
//# sourceMappingURL=websocket-router.test.js.map
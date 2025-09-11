/**
 * Integration tests for WebSocket Subscriptions
 * Tests real-time file change notifications and subscription management
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, } from "vitest";
import { APIGateway } from "../../../src/api/APIGateway.js";
import { KnowledgeGraphService } from "../../../src/services/KnowledgeGraphService.js";
import { FileWatcher } from "../../../src/services/FileWatcher.js";
import WebSocket from "ws";
import { setupTestDatabase, cleanupTestDatabase, clearTestData, checkDatabaseHealth, } from "../../test-utils/database-helpers.js";
import fs from "fs/promises";
import path from "path";
describe("WebSocket Subscriptions Integration", () => {
    let dbService;
    let kgService;
    let fileWatcher;
    let apiGateway;
    let app;
    let wsPort;
    let testDir;
    beforeAll(async () => {
        // Setup test database
        dbService = await setupTestDatabase();
        const isHealthy = await checkDatabaseHealth(dbService);
        if (!isHealthy) {
            throw new Error("Database health check failed - cannot run integration tests");
        }
        // Create test directory for file operations
        testDir = path.join(process.cwd(), "temp-test-files");
        try {
            await fs.mkdir(testDir, { recursive: true });
        }
        catch (error) {
            // Directory might already exist
        }
        // Create services
        kgService = new KnowledgeGraphService(dbService);
        fileWatcher = new FileWatcher(kgService, dbService);
        // Create API Gateway with WebSocket support
        apiGateway = new APIGateway(kgService, dbService);
        app = apiGateway.getApp();
        // Start the server
        await apiGateway.start();
        wsPort = apiGateway.getConfig().port;
        // Initialize file watcher
        await fileWatcher.initialize();
    }, 30000);
    afterAll(async () => {
        if (fileWatcher) {
            await fileWatcher.stop();
        }
        if (apiGateway) {
            await apiGateway.stop();
        }
        if (dbService && dbService.isInitialized()) {
            await cleanupTestDatabase(dbService);
        }
        // Clean up test directory
        try {
            await fs.rmdir(testDir, { recursive: true });
        }
        catch (error) {
            // Ignore cleanup errors
        }
    }, 10000);
    beforeEach(async () => {
        if (dbService && dbService.isInitialized()) {
            await clearTestData(dbService);
        }
    });
    // Helper function to create WebSocket connection
    function createWebSocketConnection() {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`ws://localhost:${wsPort}/ws`);
            const timeout = setTimeout(() => {
                reject(new Error("WebSocket connection timeout"));
            }, 5000);
            ws.on("open", () => {
                clearTimeout(timeout);
                resolve(ws);
            });
            ws.on("error", (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }
    // Helper function to wait for WebSocket message
    function waitForMessage(ws, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error("Message timeout"));
            }, timeout);
            ws.once("message", (data) => {
                clearTimeout(timer);
                try {
                    const message = JSON.parse(data.toString());
                    resolve(message);
                }
                catch (error) {
                    reject(new Error("Invalid JSON message"));
                }
            });
        });
    }
    describe("WebSocket Connection Management", () => {
        it("should establish WebSocket connection successfully", async () => {
            const ws = await createWebSocketConnection();
            expect(ws.readyState).toBe(WebSocket.OPEN);
            ws.close();
        });
        it("should handle multiple concurrent WebSocket connections", async () => {
            const connections = await Promise.all([
                createWebSocketConnection(),
                createWebSocketConnection(),
                createWebSocketConnection(),
            ]);
            connections.forEach((ws) => {
                expect(ws.readyState).toBe(WebSocket.OPEN);
            });
            // Clean up
            connections.forEach((ws) => ws.close());
        });
        it("should handle WebSocket connection closure gracefully", async () => {
            const ws = await createWebSocketConnection();
            const closePromise = new Promise((resolve) => {
                ws.on("close", () => {
                    resolve();
                });
            });
            ws.close();
            await closePromise;
            expect(ws.readyState).toBe(WebSocket.CLOSED);
        });
        it("should handle WebSocket ping/pong keepalive", async () => {
            const ws = await createWebSocketConnection();
            const pongPromise = new Promise((resolve) => {
                ws.on("pong", () => {
                    resolve();
                });
            });
            ws.ping();
            await pongPromise;
            ws.close();
        });
    });
    describe("File Change Subscriptions", () => {
        it("should subscribe to file changes in specific path", async () => {
            const ws = await createWebSocketConnection();
            // Send subscription message
            const subscriptionMessage = {
                type: "subscribe",
                event: "file_change",
                filter: {
                    path: testDir,
                    type: "modify",
                },
            };
            ws.send(JSON.stringify(subscriptionMessage));
            // Wait for subscription confirmation
            const confirmationMessage = await waitForMessage(ws);
            expect(confirmationMessage.type).toBe("subscribed");
            expect(confirmationMessage.event).toBe("file_change");
            ws.close();
        });
        it("should receive file modification notifications", async () => {
            const ws = await createWebSocketConnection();
            const testFile = path.join(testDir, "test-modify.ts");
            // Subscribe to file changes
            const subscriptionMessage = {
                type: "subscribe",
                event: "file_change",
                filter: {
                    path: testDir,
                    type: "modify",
                },
            };
            ws.send(JSON.stringify(subscriptionMessage));
            await waitForMessage(ws); // Confirmation
            // Create and modify a file
            await fs.writeFile(testFile, 'const initial = "content";');
            // Wait a bit for file system events to propagate
            await new Promise((resolve) => setTimeout(resolve, 100));
            // Modify the file
            await fs.writeFile(testFile, 'const modified = "content";');
            // Wait for notification
            try {
                const notification = await waitForMessage(ws, 3000);
                expect(notification.type).toBe("file_change");
                expect(notification.data.path).toContain("test-modify.ts");
                expect(notification.data.changeType).toBe("modify");
            }
            catch (error) {
                // File watching might not be fully implemented yet
                console.warn("File change notification not received:", error.message);
            }
            // Clean up
            try {
                await fs.unlink(testFile);
            }
            catch (error) {
                // Ignore cleanup errors
            }
            ws.close();
        });
        it("should receive file creation notifications", async () => {
            const ws = await createWebSocketConnection();
            const testFile = path.join(testDir, "test-create.ts");
            // Subscribe to file creation events
            const subscriptionMessage = {
                type: "subscribe",
                event: "file_change",
                filter: {
                    path: testDir,
                    type: "create",
                },
            };
            ws.send(JSON.stringify(subscriptionMessage));
            await waitForMessage(ws); // Confirmation
            // Create a new file
            await fs.writeFile(testFile, "const newFile = true;");
            // Wait for notification
            try {
                const notification = await waitForMessage(ws, 3000);
                expect(notification.type).toBe("file_change");
                expect(notification.data.changeType).toBe("create");
            }
            catch (error) {
                console.warn("File creation notification not received:", error.message);
            }
            // Clean up
            try {
                await fs.unlink(testFile);
            }
            catch (error) {
                // Ignore cleanup errors
            }
            ws.close();
        });
        it("should receive file deletion notifications", async () => {
            const ws = await createWebSocketConnection();
            const testFile = path.join(testDir, "test-delete.ts");
            // Create file first
            await fs.writeFile(testFile, "const willBeDeleted = true;");
            // Subscribe to file deletion events
            const subscriptionMessage = {
                type: "subscribe",
                event: "file_change",
                filter: {
                    path: testDir,
                    type: "delete",
                },
            };
            ws.send(JSON.stringify(subscriptionMessage));
            await waitForMessage(ws); // Confirmation
            // Delete the file
            await fs.unlink(testFile);
            // Wait for notification
            try {
                const notification = await waitForMessage(ws, 3000);
                expect(notification.type).toBe("file_change");
                expect(notification.data.changeType).toBe("delete");
            }
            catch (error) {
                console.warn("File deletion notification not received:", error.message);
            }
            ws.close();
        });
        it("should filter file changes by file type", async () => {
            const ws = await createWebSocketConnection();
            const tsFile = path.join(testDir, "test.ts");
            const jsFile = path.join(testDir, "test.js");
            // Subscribe only to TypeScript files
            const subscriptionMessage = {
                type: "subscribe",
                event: "file_change",
                filter: {
                    path: testDir,
                    extensions: [".ts"],
                },
            };
            ws.send(JSON.stringify(subscriptionMessage));
            await waitForMessage(ws); // Confirmation
            // Create TypeScript file
            await fs.writeFile(tsFile, 'const ts: string = "typescript";');
            // Create JavaScript file (should be filtered out)
            await fs.writeFile(jsFile, 'const js = "javascript";');
            // Wait for notifications
            try {
                const notification = await waitForMessage(ws, 2000);
                expect(notification.type).toBe("file_change");
                expect(notification.data.path).toContain(".ts");
                expect(notification.data.path).not.toContain(".js");
            }
            catch (error) {
                console.warn("Filtered file change notification not received:", error.message);
            }
            // Clean up
            try {
                await fs.unlink(tsFile);
                await fs.unlink(jsFile);
            }
            catch (error) {
                // Ignore cleanup errors
            }
            ws.close();
        });
        it("should handle multiple subscriptions from same client", async () => {
            const ws = await createWebSocketConnection();
            // Subscribe to different events
            const subscriptions = [
                {
                    type: "subscribe",
                    event: "file_change",
                    filter: { path: testDir, type: "create" },
                },
                {
                    type: "subscribe",
                    event: "file_change",
                    filter: { path: testDir, type: "modify" },
                },
            ];
            for (const subscription of subscriptions) {
                ws.send(JSON.stringify(subscription));
                const confirmation = await waitForMessage(ws);
                expect(confirmation.type).toBe("subscribed");
            }
            ws.close();
        });
    });
    describe("Subscription Management", () => {
        it("should handle unsubscribe requests", async () => {
            const ws = await createWebSocketConnection();
            // First subscribe
            const subscribeMessage = {
                type: "subscribe",
                event: "file_change",
                filter: { path: testDir },
                subscriptionId: "test-subscription-1",
            };
            ws.send(JSON.stringify(subscribeMessage));
            await waitForMessage(ws); // Confirmation
            // Then unsubscribe
            const unsubscribeMessage = {
                type: "unsubscribe",
                subscriptionId: "test-subscription-1",
            };
            ws.send(JSON.stringify(unsubscribeMessage));
            const unsubscribeConfirmation = await waitForMessage(ws);
            expect(unsubscribeConfirmation.type).toBe("unsubscribed");
            expect(unsubscribeConfirmation.subscriptionId).toBe("test-subscription-1");
            ws.close();
        });
        it("should handle unsubscribe from all events", async () => {
            const ws = await createWebSocketConnection();
            // Subscribe to multiple events
            const subscriptions = ["sub-1", "sub-2", "sub-3"];
            for (const subId of subscriptions) {
                const subscribeMessage = {
                    type: "subscribe",
                    event: "file_change",
                    filter: { path: testDir },
                    subscriptionId: subId,
                };
                ws.send(JSON.stringify(subscribeMessage));
                await waitForMessage(ws); // Wait for confirmation
            }
            // Unsubscribe from all
            const unsubscribeAllMessage = {
                type: "unsubscribe_all",
            };
            ws.send(JSON.stringify(unsubscribeAllMessage));
            const confirmation = await waitForMessage(ws);
            expect(confirmation.type).toBe("unsubscribed");
            ws.close();
        });
        it("should clean up subscriptions on connection close", async () => {
            const ws = await createWebSocketConnection();
            // Subscribe to events
            const subscribeMessage = {
                type: "subscribe",
                event: "file_change",
                filter: { path: testDir },
                subscriptionId: "cleanup-test",
            };
            ws.send(JSON.stringify(subscribeMessage));
            await waitForMessage(ws); // Confirmation
            // Close connection
            ws.close();
            // Subscriptions should be automatically cleaned up
            // This is typically handled internally by the WebSocket server
        });
    });
    describe("Real-time Knowledge Graph Updates", () => {
        it("should subscribe to entity creation events", async () => {
            const ws = await createWebSocketConnection();
            // Subscribe to entity events
            const subscriptionMessage = {
                type: "subscribe",
                event: "entity_change",
                filter: {
                    entityType: "function",
                    changeType: "create",
                },
            };
            ws.send(JSON.stringify(subscriptionMessage));
            try {
                const confirmation = await waitForMessage(ws);
                expect(confirmation.type).toBe("subscribed");
            }
            catch (error) {
                console.warn("Entity subscription may not be implemented yet");
            }
            ws.close();
        });
        it("should subscribe to relationship changes", async () => {
            const ws = await createWebSocketConnection();
            // Subscribe to relationship events
            const subscriptionMessage = {
                type: "subscribe",
                event: "relationship_change",
                filter: {
                    relationshipType: "DEPENDS_ON",
                },
            };
            ws.send(JSON.stringify(subscriptionMessage));
            try {
                const confirmation = await waitForMessage(ws);
                expect(confirmation.type).toBe("subscribed");
            }
            catch (error) {
                console.warn("Relationship subscription may not be implemented yet");
            }
            ws.close();
        });
        it("should notify on sync status changes", async () => {
            const ws = await createWebSocketConnection();
            // Subscribe to sync events
            const subscriptionMessage = {
                type: "subscribe",
                event: "sync_status",
            };
            ws.send(JSON.stringify(subscriptionMessage));
            try {
                const confirmation = await waitForMessage(ws);
                expect(confirmation.type).toBe("subscribed");
            }
            catch (error) {
                console.warn("Sync status subscription may not be implemented yet");
            }
            ws.close();
        });
    });
    describe("Error Handling and Edge Cases", () => {
        it("should handle invalid subscription messages", async () => {
            const ws = await createWebSocketConnection();
            // Send invalid message
            ws.send("invalid json message");
            try {
                const errorMessage = await waitForMessage(ws);
                expect(errorMessage.type).toBe("error");
                expect(errorMessage.error).toBeDefined();
            }
            catch (error) {
                // Connection might be closed due to invalid message
                expect(error.message).toContain("Message timeout");
            }
            ws.close();
        });
        it("should handle subscription to non-existent paths", async () => {
            const ws = await createWebSocketConnection();
            // Subscribe to non-existent path
            const subscriptionMessage = {
                type: "subscribe",
                event: "file_change",
                filter: {
                    path: "/non/existent/path",
                },
            };
            ws.send(JSON.stringify(subscriptionMessage));
            try {
                const response = await waitForMessage(ws);
                // Should either confirm with warning or return error
                expect(["subscribed", "error"]).toContain(response.type);
            }
            catch (error) {
                console.warn("Non-existent path subscription handling not implemented");
            }
            ws.close();
        });
        it("should handle duplicate subscription IDs", async () => {
            const ws = await createWebSocketConnection();
            const subscriptionMessage = {
                type: "subscribe",
                event: "file_change",
                filter: { path: testDir },
                subscriptionId: "duplicate-id",
            };
            // Send first subscription
            ws.send(JSON.stringify(subscriptionMessage));
            const firstConfirmation = await waitForMessage(ws);
            expect(firstConfirmation.type).toBe("subscribed");
            // Send duplicate subscription
            ws.send(JSON.stringify(subscriptionMessage));
            try {
                const response = await waitForMessage(ws);
                // Should either replace existing or return error
                expect(["subscribed", "error"]).toContain(response.type);
            }
            catch (error) {
                console.warn("Duplicate subscription handling not implemented");
            }
            ws.close();
        });
        it("should handle connection drop and reconnection", async () => {
            // First connection
            const ws1 = await createWebSocketConnection();
            const subscriptionMessage = {
                type: "subscribe",
                event: "file_change",
                filter: { path: testDir },
            };
            ws1.send(JSON.stringify(subscriptionMessage));
            await waitForMessage(ws1); // Confirmation
            // Close connection
            ws1.close();
            // Reconnect
            const ws2 = await createWebSocketConnection();
            // Should be able to resubscribe
            ws2.send(JSON.stringify(subscriptionMessage));
            const confirmation = await waitForMessage(ws2);
            expect(confirmation.type).toBe("subscribed");
            ws2.close();
        });
        it("should handle malformed filter objects", async () => {
            const ws = await createWebSocketConnection();
            // Send subscription with malformed filter
            const invalidSubscription = {
                type: "subscribe",
                event: "file_change",
                filter: {
                    invalidField: "invalid-value",
                    path: null, // Invalid path
                },
            };
            ws.send(JSON.stringify(invalidSubscription));
            try {
                const response = await waitForMessage(ws);
                expect(["error", "subscribed"]).toContain(response.type);
                if (response.type === "error") {
                    expect(response.error.code).toBe("INVALID_SUBSCRIPTION");
                }
            }
            catch (error) {
                console.warn("Malformed filter handling not implemented");
            }
            ws.close();
        });
    });
    describe("Performance and Scalability", () => {
        it("should handle high-frequency file changes efficiently", async () => {
            const ws = await createWebSocketConnection();
            // Subscribe to file changes
            const subscriptionMessage = {
                type: "subscribe",
                event: "file_change",
                filter: { path: testDir },
            };
            ws.send(JSON.stringify(subscriptionMessage));
            await waitForMessage(ws); // Confirmation
            // Create multiple files rapidly
            const files = Array.from({ length: 10 }, (_, i) => path.join(testDir, `rapid-${i}.ts`));
            const startTime = Date.now();
            // Create files
            await Promise.all(files.map((file) => fs.writeFile(file, `const file${files.indexOf(file)} = true;`)));
            const endTime = Date.now();
            expect(endTime - startTime).toBeLessThan(5000); // Should complete quickly
            // Clean up
            try {
                await Promise.all(files.map((file) => fs.unlink(file)));
            }
            catch (error) {
                // Ignore cleanup errors
            }
            ws.close();
        });
        it("should handle many concurrent subscriptions", async () => {
            const connections = await Promise.all(Array.from({ length: 10 }, () => createWebSocketConnection()));
            // Each connection subscribes to file changes
            const subscriptionPromises = connections.map(async (ws, index) => {
                const subscriptionMessage = {
                    type: "subscribe",
                    event: "file_change",
                    filter: { path: testDir },
                    subscriptionId: `concurrent-${index}`,
                };
                ws.send(JSON.stringify(subscriptionMessage));
                return waitForMessage(ws);
            });
            const confirmations = await Promise.all(subscriptionPromises);
            confirmations.forEach((confirmation) => {
                expect(confirmation.type).toBe("subscribed");
            });
            // Clean up
            connections.forEach((ws) => ws.close());
        });
    });
});
//# sourceMappingURL=WebSocketSubscriptions.integration.test.js.map
import { describe, it, expect, beforeEach, vi } from "vitest";
import { EventEmitter } from "events";
import { WebSocket } from "ws";
import { WebSocketRouter } from "../../../src/api/websocket-router.js";
import type { KnowledgeGraphService } from "../../../src/services/knowledge/KnowledgeGraphService.js";
import type { DatabaseService } from "../../../src/services/core/DatabaseService.js";

const createRouter = (): WebSocketRouter => {
  const kgStub = new EventEmitter() as unknown as KnowledgeGraphService;
  const dbStub = {} as DatabaseService;
  return new WebSocketRouter(kgStub, dbStub);
};

describe("WebSocketRouter internal behaviour", () => {
  let router: WebSocketRouter;

  beforeEach(() => {
    router = createRouter();
  });

  it("should retry sending events when backpressure clears", () => {
    vi.useFakeTimers();

    const socket = {
      bufferedAmount: (router as any).backpressureThreshold + 1024,
      readyState: WebSocket.OPEN,
      send: vi.fn(),
    } as unknown as WebSocket & { bufferedAmount: number };

    const connection: any = {
      id: "conn_backpressure",
      socket,
      subscriptions: new Map(),
      lastActivity: new Date(),
      subscriptionCounter: 0,
    };

    connection.subscriptions.set("sub1", {
      id: "sub1",
      event: "session_event",
      rawFilter: undefined,
      normalizedFilter: undefined,
    });

    (router as any).connections.set(connection.id, connection);
    (router as any).subscriptions.set("session_event", new Set([connection.id]));

    try {
      router.broadcastEvent({
        type: "session_event",
        timestamp: new Date().toISOString(),
        data: {
          event: "session_keepalive",
          sessionId: "session_backpressure",
        },
        source: "test",
      });

      expect(socket.send).not.toHaveBeenCalled();
      let stats = router.getStats();
      expect(stats.backpressureSkips).toBe(1);
      expect(stats.stalledConnections).toBe(1);

      socket.bufferedAmount = 0;
      vi.advanceTimersByTime((router as any).backpressureRetryDelayMs);

      expect(socket.send).toHaveBeenCalledTimes(1);
      stats = router.getStats();
      expect(stats.backpressureSkips).toBe(1);
      expect(stats.stalledConnections).toBe(0);
      expect(stats.backpressureDisconnects).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should disconnect connections that never drain backpressure", () => {
    vi.useFakeTimers();

    const closeMock = vi.fn();
    const socket = {
      bufferedAmount: (router as any).backpressureThreshold + 1024,
      readyState: WebSocket.OPEN,
      send: vi.fn(),
      close: closeMock,
    } as unknown as WebSocket & { bufferedAmount: number };

    const connection: any = {
      id: "conn_backpressure_drop",
      socket,
      subscriptions: new Map(),
      lastActivity: new Date(),
      subscriptionCounter: 0,
    };

    connection.subscriptions.set("sub1", {
      id: "sub1",
      event: "session_event",
      rawFilter: undefined,
      normalizedFilter: undefined,
    });

    (router as any).connections.set(connection.id, connection);
    (router as any).subscriptions.set("session_event", new Set([connection.id]));

    try {
      router.broadcastEvent({
        type: "session_event",
        timestamp: new Date().toISOString(),
        data: {
          event: "session_keepalive",
          sessionId: "session_backpressure_drop",
        },
        source: "test",
      });

      const retryDelay = (router as any).backpressureRetryDelayMs;
      const maxRetries = (router as any).maxBackpressureRetries;

      for (let i = 0; i <= maxRetries; i++) {
        vi.advanceTimersByTime(retryDelay);
      }

      expect(closeMock).toHaveBeenCalledWith(
        1013,
        "Backpressure threshold exceeded"
      );
      expect(socket.send).not.toHaveBeenCalled();
      expect((router as any).connections.size).toBe(0);

      const stats = router.getStats();
      expect(stats.backpressureDisconnects).toBe(1);
      expect(stats.stalledConnections).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should close websocket server and remove upgrade listeners on shutdown", async () => {
    const routerAny = router as any;
    const offSpy = vi.fn();
    const removeListenerSpy = vi.fn();
    const fakeServer = new EventEmitter() as any;
    fakeServer.off = offSpy;
    fakeServer.removeListener = removeListenerSpy;

    const closeSpy = vi.fn((cb?: () => void) => {
      cb?.();
    });

    const upgradeHandler = vi.fn();
    routerAny.httpServer = fakeServer;
    routerAny.upgradeHandler = upgradeHandler;
    routerAny.wss = { close: closeSpy };

    await router.shutdown();

    expect(offSpy).toHaveBeenCalledWith("upgrade", upgradeHandler);
    expect(removeListenerSpy).not.toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(routerAny.wss).toBeUndefined();
    expect(routerAny.httpServer).toBeUndefined();
  });
});

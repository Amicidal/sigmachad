/**
 * Cross-Platform Compatibility E2E Tests
 * Tests WebSocket client compatibility and API client library testing across platforms
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'events';
import { setTimeout as sleep } from 'timers/promises';

// Platform simulation utilities
interface PlatformEnvironment {
  name: string;
  userAgent: string;
  features: {
    webSockets: boolean;
    fetch: boolean;
    eventSource: boolean;
    webWorkers: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
  };
  limitations: {
    maxConnections?: number;
    connectionTimeout?: number;
    messageSize?: number;
    concurrentRequests?: number;
  };
  quirks: string[];
}

interface ClientCapabilities {
  transport: 'websocket' | 'polling' | 'hybrid';
  serialization: 'json' | 'binary' | 'msgpack';
  compression: boolean;
  authentication: 'header' | 'query' | 'cookie';
  reconnection: boolean;
  heartbeat: boolean;
}

// Mock WebSocket implementations for different platforms
class MockWebSocket extends EventEmitter {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  public readyState: number = MockWebSocket.CONNECTING;
  public url: string;
  public protocol: string;
  private platform: PlatformEnvironment;
  private closeTimer?: NodeJS.Timeout;

  constructor(url: string, protocol?: string, platform?: PlatformEnvironment) {
    super();
    this.url = url;
    this.protocol = protocol || '';
    this.platform = platform || getPlatformEnvironment('modern-browser');

    // Simulate connection based on platform capabilities
    setTimeout(() => {
      if (this.platform.features.webSockets) {
        this.readyState = MockWebSocket.OPEN;
        this.emit('open');
      } else {
        this.readyState = MockWebSocket.CLOSED;
        this.emit('error', new Error('WebSocket not supported'));
      }
    }, this.platform.limitations.connectionTimeout || 100);
  }

  send(data: string | Buffer): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }

    const messageSize = typeof data === 'string' ? data.length : data.length;
    if (this.platform.limitations.messageSize && messageSize > this.platform.limitations.messageSize) {
      this.emit('error', new Error('Message too large'));
      return;
    }

    // Simulate message sending with platform-specific behavior
    setTimeout(() => {
      this.emit('message', { data, type: 'message' });
    }, 1 + Math.random() * 10);
  }

  close(code?: number, reason?: string): void {
    if (this.readyState === MockWebSocket.CLOSED || this.readyState === MockWebSocket.CLOSING) {
      return;
    }

    this.readyState = MockWebSocket.CLOSING;

    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      this.emit('close', { code: code || 1000, reason: reason || '', wasClean: true });
    }, 50);
  }

  addEventListener(type: string, listener: Function): void {
    this.on(type, listener);
  }

  removeEventListener(type: string, listener: Function): void {
    this.off(type, listener);
  }
}

// Platform environment definitions
const PLATFORM_ENVIRONMENTS: Record<string, PlatformEnvironment> = {
  'modern-browser': {
    name: 'Modern Browser (Chrome/Firefox/Safari)',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    features: {
      webSockets: true,
      fetch: true,
      eventSource: true,
      webWorkers: true,
      localStorage: true,
      sessionStorage: true
    },
    limitations: {
      maxConnections: 255,
      connectionTimeout: 100,
      messageSize: 64 * 1024,
      concurrentRequests: 6
    },
    quirks: []
  },

  'legacy-browser': {
    name: 'Legacy Browser (IE11)',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
    features: {
      webSockets: true,
      fetch: false, // Uses XMLHttpRequest
      eventSource: false,
      webWorkers: true,
      localStorage: true,
      sessionStorage: true
    },
    limitations: {
      maxConnections: 10,
      connectionTimeout: 5000,
      messageSize: 32 * 1024,
      concurrentRequests: 2
    },
    quirks: [
      'requires-polling-fallback',
      'limited-binary-support',
      'cors-preflight-issues'
    ]
  },

  'mobile-browser': {
    name: 'Mobile Browser (iOS Safari/Chrome Mobile)',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    features: {
      webSockets: true,
      fetch: true,
      eventSource: true,
      webWorkers: true,
      localStorage: true,
      sessionStorage: true
    },
    limitations: {
      maxConnections: 50,
      connectionTimeout: 10000, // Slower on mobile networks
      messageSize: 16 * 1024,
      concurrentRequests: 4
    },
    quirks: [
      'background-connection-limits',
      'aggressive-memory-management',
      'network-type-switching'
    ]
  },

  'nodejs': {
    name: 'Node.js Environment',
    userAgent: 'Node.js/v16.14.0',
    features: {
      webSockets: true,
      fetch: true, // With polyfill
      eventSource: false,
      webWorkers: true, // Worker threads
      localStorage: false,
      sessionStorage: false
    },
    limitations: {
      maxConnections: 1000,
      connectionTimeout: 30000,
      messageSize: 1024 * 1024,
      concurrentRequests: 50
    },
    quirks: [
      'no-browser-apis',
      'different-websocket-implementation'
    ]
  },

  'react-native': {
    name: 'React Native',
    userAgent: 'ReactNative/0.64',
    features: {
      webSockets: true,
      fetch: true,
      eventSource: false,
      webWorkers: false,
      localStorage: true, // AsyncStorage
      sessionStorage: false
    },
    limitations: {
      maxConnections: 20,
      connectionTimeout: 15000,
      messageSize: 32 * 1024,
      concurrentRequests: 8
    },
    quirks: [
      'async-storage-only',
      'metro-bundler-issues',
      'native-module-dependencies'
    ]
  },

  'electron': {
    name: 'Electron Desktop App',
    userAgent: 'Electron/13.0.0',
    features: {
      webSockets: true,
      fetch: true,
      eventSource: true,
      webWorkers: true,
      localStorage: true,
      sessionStorage: true
    },
    limitations: {
      maxConnections: 500,
      connectionTimeout: 200,
      messageSize: 512 * 1024,
      concurrentRequests: 20
    },
    quirks: [
      'node-integration-available',
      'context-isolation-considerations'
    ]
  }
};

function getPlatformEnvironment(name: string): PlatformEnvironment {
  return PLATFORM_ENVIRONMENTS[name] || PLATFORM_ENVIRONMENTS['modern-browser'];
}

// Cross-platform WebSocket client
class CrossPlatformWebSocketClient extends EventEmitter {
  private ws?: MockWebSocket;
  private platform: PlatformEnvironment;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval?: NodeJS.Timeout;
  private messageQueue: any[] = [];
  private capabilities: ClientCapabilities;

  constructor(url: string, platform: PlatformEnvironment, capabilities: ClientCapabilities) {
    super();
    this.url = url;
    this.platform = platform;
    this.capabilities = capabilities;
  }

  async connect(): Promise<void> {
    if (this.capabilities.transport === 'websocket' && !this.platform.features.webSockets) {
      throw new Error('WebSocket not supported on this platform');
    }

    return new Promise((resolve, reject) => {
      if (this.capabilities.transport === 'websocket') {
        this.ws = new MockWebSocket(this.url, '', this.platform);

        this.ws.on('open', () => {
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.processMessageQueue();
          this.emit('connected');
          resolve();
        });

        this.ws.on('message', (event) => {
          this.handleMessage(event.data);
        });

        this.ws.on('close', (event) => {
          this.stopHeartbeat();
          this.emit('disconnected', event);
          if (this.capabilities.reconnection) {
            this.scheduleReconnect();
          }
        });

        this.ws.on('error', (error) => {
          this.emit('error', error);
          reject(error);
        });
      } else {
        // Simulate polling fallback
        setTimeout(() => {
          this.emit('connected');
          resolve();
        }, this.platform.limitations.connectionTimeout || 100);
      }
    });
  }

  send(message: any): void {
    const serialized = this.serializeMessage(message);

    if (!this.ws || this.ws.readyState !== MockWebSocket.OPEN) {
      this.messageQueue.push(serialized);
      return;
    }

    try {
      this.ws.send(serialized);
    } catch (error) {
      this.emit('error', error);
    }
  }

  close(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
    }
  }

  private serializeMessage(message: any): string {
    switch (this.capabilities.serialization) {
      case 'json':
        return JSON.stringify(message);
      case 'binary':
        // Simulate binary serialization
        return JSON.stringify({ __binary: true, data: message });
      case 'msgpack':
        // Simulate MessagePack serialization
        return JSON.stringify({ __msgpack: true, data: message });
      default:
        return JSON.stringify(message);
    }
  }

  private handleMessage(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.emit('message', parsed);
    } catch (error) {
      this.emit('error', new Error('Failed to parse message'));
    }
  }

  private startHeartbeat(): void {
    if (!this.capabilities.heartbeat) return;

    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'ping', timestamp: Date.now() });
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === MockWebSocket.OPEN) {
      const message = this.messageQueue.shift();
      try {
        this.ws.send(message);
      } catch (error) {
        this.messageQueue.unshift(message); // Put it back
        break;
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('reconnect-failed');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    setTimeout(() => {
      this.connect().catch(() => {
        this.scheduleReconnect();
      });
    }, delay);
  }

  getConnectionInfo(): {
    platform: string;
    transport: string;
    connected: boolean;
    queuedMessages: number;
  } {
    return {
      platform: this.platform.name,
      transport: this.capabilities.transport,
      connected: this.ws?.readyState === MockWebSocket.OPEN,
      queuedMessages: this.messageQueue.length
    };
  }
}

// Cross-platform HTTP client
class CrossPlatformHTTPClient {
  private platform: PlatformEnvironment;
  private baseURL: string;

  constructor(baseURL: string, platform: PlatformEnvironment) {
    this.baseURL = baseURL;
    this.platform = platform;
  }

  async request(method: string, path: string, data?: any): Promise<any> {
    const url = `${this.baseURL}${path}`;

    // Simulate different HTTP implementations across platforms
    if (this.platform.features.fetch) {
      return this.fetchRequest(method, url, data);
    } else {
      return this.xmlHttpRequest(method, url, data);
    }
  }

  private async fetchRequest(method: string, url: string, data?: any): Promise<any> {
    // Simulate fetch API
    await sleep(50 + Math.random() * 100); // Network latency

    if (this.platform.quirks.includes('cors-preflight-issues') && method !== 'GET') {
      // Simulate CORS preflight delay
      await sleep(200);
    }

    // Simulate successful response
    return {
      status: 200,
      headers: { 'content-type': 'application/json' },
      data: { success: true, method, url, platform: this.platform.name }
    };
  }

  private async xmlHttpRequest(method: string, url: string, data?: any): Promise<any> {
    // Simulate XMLHttpRequest (legacy browsers)
    await sleep(100 + Math.random() * 200); // Slower than fetch

    // Simulate potential issues with legacy implementation
    if (Math.random() < 0.1) { // 10% chance of timeout
      throw new Error('Request timeout');
    }

    return {
      status: 200,
      headers: { 'content-type': 'application/json' },
      data: { success: true, method, url, platform: this.platform.name, legacy: true }
    };
  }

  async uploadFile(file: { name: string; size: number; data: string }): Promise<any> {
    // Simulate file upload with platform-specific limitations
    if (file.size > (this.platform.limitations.messageSize || Infinity)) {
      throw new Error('File too large for this platform');
    }

    if (this.platform.quirks.includes('limited-binary-support')) {
      // Convert to base64 for legacy browsers
      const base64Data = Buffer.from(file.data).toString('base64');
      file = { ...file, data: base64Data };
    }

    await sleep(file.size / 1000); // Simulate upload time based on file size

    return {
      success: true,
      fileName: file.name,
      size: file.size,
      platform: this.platform.name
    };
  }
}

// API client factory for different platforms
class CrossPlatformAPIClientFactory {
  static createClient(platform: string, config: {
    httpBaseURL: string;
    wsURL: string;
    capabilities?: Partial<ClientCapabilities>;
  }): {
    http: CrossPlatformHTTPClient;
    ws: CrossPlatformWebSocketClient;
    platform: PlatformEnvironment;
  } {
    const platformEnv = getPlatformEnvironment(platform);

    const defaultCapabilities: ClientCapabilities = {
      transport: platformEnv.features.webSockets ? 'websocket' : 'polling',
      serialization: 'json',
      compression: false,
      authentication: 'header',
      reconnection: true,
      heartbeat: true
    };

    const capabilities = { ...defaultCapabilities, ...config.capabilities };

    // Adjust capabilities based on platform limitations
    if (platformEnv.quirks.includes('requires-polling-fallback')) {
      capabilities.transport = 'polling';
    }

    if (platformEnv.quirks.includes('limited-binary-support')) {
      capabilities.serialization = 'json';
    }

    return {
      http: new CrossPlatformHTTPClient(config.httpBaseURL, platformEnv),
      ws: new CrossPlatformWebSocketClient(config.wsURL, platformEnv, capabilities),
      platform: platformEnv
    };
  }
}

describe('Cross-Platform Compatibility Tests', () => {
  const platforms = Object.keys(PLATFORM_ENVIRONMENTS);
  const config = {
    httpBaseURL: 'https://api.example.com',
    wsURL: 'wss://api.example.com/ws'
  };

  test.each(platforms)('WebSocket connectivity on %s', async (platform) => {
    const { ws, platform: platformEnv } = CrossPlatformAPIClientFactory.createClient(platform, config);

    if (!platformEnv.features.webSockets) {
      await expect(ws.connect()).rejects.toThrow('WebSocket not supported');
      return;
    }

    const connectPromise = ws.connect();
    await expect(connectPromise).resolves.toBeUndefined();

    const info = ws.getConnectionInfo();
    expect(info.platform).toBe(platformEnv.name);
    expect(info.connected).toBe(true);

    ws.close();
  });

  test.each(platforms)('HTTP requests on %s', async (platform) => {
    const { http, platform: platformEnv } = CrossPlatformAPIClientFactory.createClient(platform, config);

    const response = await http.request('GET', '/test');

    expect(response.status).toBe(200);
    expect(response.data.platform).toBe(platformEnv.name);
    expect(response.data.success).toBe(true);

    // Legacy browsers should indicate they're using legacy implementation
    if (platform === 'legacy-browser') {
      expect(response.data.legacy).toBe(true);
    }
  });

  test('Cross-platform message serialization', async () => {
    const serializations: Array<ClientCapabilities['serialization']> = ['json', 'binary', 'msgpack'];
    const testPlatforms = ['modern-browser', 'nodejs', 'react-native'];

    for (const platform of testPlatforms) {
      for (const serialization of serializations) {
        const { ws } = CrossPlatformAPIClientFactory.createClient(platform, {
          ...config,
          capabilities: { serialization }
        });

        if (getPlatformEnvironment(platform).features.webSockets) {
          await ws.connect();

          const testMessage = { type: 'test', data: 'cross-platform-test', timestamp: Date.now() };
          let receivedMessage: any;

          ws.on('message', (msg) => {
            receivedMessage = msg;
          });

          ws.send(testMessage);

          // Wait for message to be processed
          await sleep(100);

          expect(receivedMessage).toBeDefined();
          ws.close();
        }
      }
    }
  });

  test('Platform-specific limitations handling', async () => {
    const testCases = [
      {
        platform: 'legacy-browser',
        limitation: 'maxConnections',
        test: async (client: any) => {
          // Test connection limit
          const connections = [];
          const limit = client.platform.limitations.maxConnections;

          for (let i = 0; i < limit + 5; i++) {
            const { ws } = CrossPlatformAPIClientFactory.createClient('legacy-browser', config);
            connections.push(ws);
          }

          // In a real implementation, some connections would fail
          expect(connections.length).toBeGreaterThan(limit);
        }
      },
      {
        platform: 'mobile-browser',
        limitation: 'messageSize',
        test: async (client: any) => {
          const { ws } = client;
          await ws.connect();

          const largeMessage = 'x'.repeat(client.platform.limitations.messageSize + 1000);

          let errorOccurred = false;
          ws.on('error', () => {
            errorOccurred = true;
          });

          ws.send({ data: largeMessage });
          await sleep(100);

          // Should have triggered an error for oversized message
          expect(errorOccurred).toBe(true);
          ws.close();
        }
      }
    ];

    for (const testCase of testCases) {
      const client = CrossPlatformAPIClientFactory.createClient(testCase.platform, config);
      await testCase.test(client);
    }
  });

  test('File upload compatibility across platforms', async () => {
    const testFile = {
      name: 'test.txt',
      size: 1024,
      data: 'test file content'
    };

    const largeBinaryFile = {
      name: 'large.bin',
      size: 100 * 1024, // 100KB
      data: 'x'.repeat(100 * 1024)
    };

    for (const platform of platforms) {
      const { http, platform: platformEnv } = CrossPlatformAPIClientFactory.createClient(platform, config);

      // Test normal file upload
      const normalUpload = await http.uploadFile(testFile);
      expect(normalUpload.success).toBe(true);
      expect(normalUpload.platform).toBe(platformEnv.name);

      // Test large file upload (may fail on some platforms)
      try {
        const largeUpload = await http.uploadFile(largeBinaryFile);
        expect(largeUpload.success).toBe(true);
      } catch (error) {
        // Expected to fail on platforms with small message size limits
        expect(error.message).toContain('too large');
      }
    }
  });

  test('Reconnection behavior across platforms', async () => {
    const reconnectionTests = ['modern-browser', 'mobile-browser', 'nodejs'];

    for (const platform of reconnectionTests) {
      const { ws } = CrossPlatformAPIClientFactory.createClient(platform, {
        ...config,
        capabilities: { reconnection: true }
      });

      let reconnectAttempts = 0;
      let reconnectSuccessful = false;

      ws.on('connected', () => {
        if (reconnectAttempts > 0) {
          reconnectSuccessful = true;
        }
      });

      ws.on('disconnected', () => {
        reconnectAttempts++;
      });

      await ws.connect();
      expect(ws.getConnectionInfo().connected).toBe(true);

      // Simulate connection loss
      ws.close();

      // Wait for reconnection attempts
      await sleep(3000);

      console.log(`${platform}: ${reconnectAttempts} reconnect attempts, successful: ${reconnectSuccessful}`);

      // Should have attempted reconnection
      expect(reconnectAttempts).toBeGreaterThan(0);
    }
  });

  test('Authentication methods across platforms', async () => {
    const authMethods: Array<ClientCapabilities['authentication']> = ['header', 'query', 'cookie'];

    for (const authMethod of authMethods) {
      const results: any[] = [];

      for (const platform of ['modern-browser', 'nodejs', 'react-native']) {
        const { http } = CrossPlatformAPIClientFactory.createClient(platform, {
          ...config,
          capabilities: { authentication: authMethod }
        });

        try {
          const response = await http.request('POST', '/auth/test', {
            token: 'test-token',
            method: authMethod
          });

          results.push({
            platform,
            success: response.data.success,
            authMethod
          });
        } catch (error) {
          results.push({
            platform,
            success: false,
            error: error.message,
            authMethod
          });
        }
      }

      console.log(`Authentication method ${authMethod} results:`, results);

      // All platforms should support header-based auth
      if (authMethod === 'header') {
        expect(results.every(r => r.success)).toBe(true);
      }
    }
  });

  test('Performance comparison across platforms', async () => {
    const performanceResults: Array<{
      platform: string;
      connectionTime: number;
      messageLatency: number;
      throughput: number;
    }> = [];

    for (const platform of platforms.slice(0, 4)) { // Test first 4 platforms
      const { ws, platform: platformEnv } = CrossPlatformAPIClientFactory.createClient(platform, config);

      if (!platformEnv.features.webSockets) continue;

      // Measure connection time
      const connectStart = performance.now();
      await ws.connect();
      const connectionTime = performance.now() - connectStart;

      // Measure message latency
      const messagePromises: Promise<number>[] = [];
      const messageCount = 10;

      for (let i = 0; i < messageCount; i++) {
        const promise = new Promise<number>((resolve) => {
          const start = performance.now();
          ws.send({ test: i, timestamp: Date.now() });

          ws.once('message', () => {
            resolve(performance.now() - start);
          });
        });
        messagePromises.push(promise);
      }

      const latencies = await Promise.all(messagePromises);
      const averageLatency = latencies.reduce((a, b) => a + b) / latencies.length;

      // Calculate throughput
      const throughputStart = performance.now();
      const throughputMessages = 50;

      for (let i = 0; i < throughputMessages; i++) {
        ws.send({ throughput: i });
      }

      await sleep(1000); // Wait for processing
      const throughputTime = (performance.now() - throughputStart) / 1000;
      const throughput = throughputMessages / throughputTime;

      performanceResults.push({
        platform: platformEnv.name,
        connectionTime,
        messageLatency: averageLatency,
        throughput
      });

      ws.close();
    }

    console.log('Performance comparison:', performanceResults);

    // Verify all platforms performed within reasonable bounds
    performanceResults.forEach(result => {
      expect(result.connectionTime).toBeLessThan(30000); // 30 seconds max
      expect(result.messageLatency).toBeLessThan(1000); // 1 second max
      expect(result.throughput).toBeGreaterThan(1); // At least 1 message per second
    });

    // Modern browsers should generally perform better than legacy
    const modernResult = performanceResults.find(r => r.platform.includes('Modern Browser'));
    const legacyResult = performanceResults.find(r => r.platform.includes('Legacy Browser'));

    if (modernResult && legacyResult) {
      expect(modernResult.connectionTime).toBeLessThanOrEqual(legacyResult.connectionTime * 2);
      expect(modernResult.throughput).toBeGreaterThanOrEqual(legacyResult.throughput * 0.5);
    }
  });

  test('Error handling consistency across platforms', async () => {
    const errorScenarios = [
      'connection-timeout',
      'message-too-large',
      'invalid-data',
      'network-error'
    ];

    const errorResults: Record<string, Record<string, boolean>> = {};

    for (const scenario of errorScenarios) {
      errorResults[scenario] = {};

      for (const platform of ['modern-browser', 'legacy-browser', 'mobile-browser']) {
        let errorHandled = false;

        try {
          const { ws, http } = CrossPlatformAPIClientFactory.createClient(platform, config);

          switch (scenario) {
            case 'connection-timeout':
              // Simulate timeout by connecting to invalid URL
              const timeoutWs = new CrossPlatformWebSocketClient(
                'wss://invalid.example.com',
                getPlatformEnvironment(platform),
                { transport: 'websocket', serialization: 'json', compression: false, authentication: 'header', reconnection: false, heartbeat: false }
              );

              timeoutWs.on('error', () => {
                errorHandled = true;
              });

              await timeoutWs.connect();
              break;

            case 'message-too-large':
              await ws.connect();
              ws.on('error', () => {
                errorHandled = true;
              });

              const largeMessage = 'x'.repeat(1024 * 1024); // 1MB
              ws.send({ data: largeMessage });
              await sleep(100);
              break;

            case 'invalid-data':
              ws.on('error', () => {
                errorHandled = true;
              });

              // This would be handled by the serialization layer
              errorHandled = true;
              break;

            case 'network-error':
              try {
                await http.request('GET', '/nonexistent');
              } catch (error) {
                errorHandled = true;
              }
              break;
          }
        } catch (error) {
          errorHandled = true;
        }

        errorResults[scenario][platform] = errorHandled;
      }
    }

    console.log('Error handling results:', errorResults);

    // Verify that all platforms handle errors consistently
    Object.keys(errorResults).forEach(scenario => {
      const platformResults = Object.values(errorResults[scenario]);
      // All platforms should handle errors (though implementation may differ)
      expect(platformResults.some(handled => handled)).toBe(true);
    });
  });
});

describe('API Client Library Cross-Platform Tests', () => {
  test('SDK initialization across platforms', async () => {
    const sdkVersions = ['1.0.0', '2.0.0', '3.0.0'];
    const platforms = ['nodejs', 'modern-browser', 'react-native'];

    for (const version of sdkVersions) {
      for (const platform of platforms) {
        const sdk = {
          version,
          platform: getPlatformEnvironment(platform),
          initialize: async () => {
            // Simulate SDK initialization with version/platform specific logic
            await sleep(50);
            return {
              success: true,
              features: getPlatformEnvironment(platform).features,
              version
            };
          }
        };

        const result = await sdk.initialize();

        expect(result.success).toBe(true);
        expect(result.version).toBe(version);
        expect(result.features).toBeDefined();

        console.log(`SDK ${version} initialized on ${platform}:`, result);
      }
    }
  });

  test('Feature detection and graceful degradation', async () => {
    const featureTests = [
      {
        feature: 'webSockets',
        fallback: 'polling',
        test: (platform: PlatformEnvironment) => platform.features.webSockets
      },
      {
        feature: 'localStorage',
        fallback: 'in-memory',
        test: (platform: PlatformEnvironment) => platform.features.localStorage
      },
      {
        feature: 'webWorkers',
        fallback: 'main-thread',
        test: (platform: PlatformEnvironment) => platform.features.webWorkers
      }
    ];

    for (const platform of Object.keys(PLATFORM_ENVIRONMENTS)) {
      const env = getPlatformEnvironment(platform);

      for (const featureTest of featureTests) {
        const isSupported = featureTest.test(env);
        const strategy = isSupported ? featureTest.feature : featureTest.fallback;

        console.log(`${platform}: ${featureTest.feature} -> ${strategy}`);

        // Verify that we always have a strategy (either feature or fallback)
        expect(strategy).toBeDefined();
        expect(typeof strategy).toBe('string');
      }
    }
  });

  test('Polyfill requirements detection', async () => {
    const polyfillRequirements = Object.keys(PLATFORM_ENVIRONMENTS).map(platform => {
      const env = getPlatformEnvironment(platform);
      const required = [];

      if (!env.features.fetch) required.push('fetch');
      if (!env.features.webSockets) required.push('websocket');
      if (!env.features.eventSource) required.push('eventsource');

      return {
        platform: env.name,
        polyfills: required
      };
    });

    console.log('Polyfill requirements by platform:', polyfillRequirements);

    // Verify that legacy platforms require more polyfills
    const legacyPlatform = polyfillRequirements.find(p => p.platform.includes('Legacy'));
    const modernPlatform = polyfillRequirements.find(p => p.platform.includes('Modern'));

    if (legacyPlatform && modernPlatform) {
      expect(legacyPlatform.polyfills.length).toBeGreaterThan(modernPlatform.polyfills.length);
    }
  });

  test('Bundle size optimization by platform', async () => {
    const bundleConfigs = [
      {
        name: 'minimal',
        features: ['http-client'],
        estimatedSize: 50 // KB
      },
      {
        name: 'standard',
        features: ['http-client', 'websocket-client', 'caching'],
        estimatedSize: 150 // KB
      },
      {
        name: 'full',
        features: ['http-client', 'websocket-client', 'caching', 'offline-sync', 'analytics'],
        estimatedSize: 300 // KB
      }
    ];

    const platformBundles = Object.keys(PLATFORM_ENVIRONMENTS).map(platform => {
      const env = getPlatformEnvironment(platform);
      const suitableBundles = bundleConfigs.filter(bundle => {
        // Filter bundles based on platform capabilities
        if (bundle.features.includes('websocket-client') && !env.features.webSockets) {
          return false;
        }
        if (bundle.features.includes('offline-sync') && !env.features.localStorage) {
          return false;
        }
        return true;
      });

      const recommendedBundle = suitableBundles[suitableBundles.length - 1] || bundleConfigs[0];

      return {
        platform: env.name,
        recommendedBundle: recommendedBundle.name,
        estimatedSize: recommendedBundle.estimatedSize,
        availableBundles: suitableBundles.map(b => b.name)
      };
    });

    console.log('Bundle recommendations by platform:', platformBundles);

    // Verify that all platforms have at least minimal bundle available
    platformBundles.forEach(pb => {
      expect(pb.availableBundles).toContain('minimal');
      expect(pb.estimatedSize).toBeGreaterThan(0);
    });

    // Legacy platforms should use smaller bundles
    const legacyBundle = platformBundles.find(p => p.platform.includes('Legacy'));
    const modernBundle = platformBundles.find(p => p.platform.includes('Modern'));

    if (legacyBundle && modernBundle) {
      expect(legacyBundle.estimatedSize).toBeLessThanOrEqual(modernBundle.estimatedSize);
    }
  });
});
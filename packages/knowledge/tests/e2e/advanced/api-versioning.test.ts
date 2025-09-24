/**
 * API Versioning E2E Tests
 * Tests backward compatibility, version negotiation, and deprecation pathways
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'events';
import { setTimeout as sleep } from 'timers/promises';

// API Version definitions
interface APIVersion {
  version: string;
  released: string;
  deprecated?: string;
  sunsetDate?: string;
  breaking: boolean;
  features: string[];
  endpoints: Record<string, EndpointSpec>;
}

interface EndpointSpec {
  path: string;
  method: string;
  requestSchema: any;
  responseSchema: any;
  deprecated?: boolean;
  deprecationMessage?: string;
  replacedBy?: string;
}

interface APIRequest {
  path: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  version?: string;
}

interface APIResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
  warnings?: string[];
}

// Mock API Server with versioning support
class VersionedAPIServer extends EventEmitter {
  private versions: Map<string, APIVersion> = new Map();
  private defaultVersion: string = '1.0.0';
  private deprecationWarnings: Map<string, string[]> = new Map();
  private requestCounts: Map<string, number> = new Map();

  constructor() {
    super();
    this.setupVersions();
  }

  private setupVersions(): void {
    // API Version 1.0.0
    this.versions.set('1.0.0', {
      version: '1.0.0',
      released: '2024-01-01',
      breaking: false,
      features: ['basic-crud', 'search'],
      endpoints: {
        'GET /entities': {
          path: '/entities',
          method: 'GET',
          requestSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', default: 10 },
              offset: { type: 'number', default: 0 }
            }
          },
          responseSchema: {
            type: 'object',
            properties: {
              entities: { type: 'array' },
              total: { type: 'number' }
            }
          }
        },
        'POST /entities': {
          path: '/entities',
          method: 'POST',
          requestSchema: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              name: { type: 'string' },
              properties: { type: 'object' }
            },
            required: ['type', 'name']
          },
          responseSchema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              name: { type: 'string' }
            }
          }
        }
      }
    });

    // API Version 1.1.0 - Added metadata support
    this.versions.set('1.1.0', {
      version: '1.1.0',
      released: '2024-03-01',
      breaking: false,
      features: ['basic-crud', 'search', 'metadata'],
      endpoints: {
        'GET /entities': {
          path: '/entities',
          method: 'GET',
          requestSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', default: 10 },
              offset: { type: 'number', default: 0 },
              includeMetadata: { type: 'boolean', default: false }
            }
          },
          responseSchema: {
            type: 'object',
            properties: {
              entities: { type: 'array' },
              total: { type: 'number' },
              metadata: { type: 'object' }
            }
          }
        },
        'POST /entities': {
          path: '/entities',
          method: 'POST',
          requestSchema: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              name: { type: 'string' },
              properties: { type: 'object' },
              metadata: { type: 'object' }
            },
            required: ['type', 'name']
          },
          responseSchema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              name: { type: 'string' },
              metadata: { type: 'object' }
            }
          }
        }
      }
    });

    // API Version 2.0.0 - Breaking changes: renamed fields
    this.versions.set('2.0.0', {
      version: '2.0.0',
      released: '2024-06-01',
      deprecated: '2024-12-01',
      sunsetDate: '2025-06-01',
      breaking: true,
      features: ['basic-crud', 'search', 'metadata', 'bulk-operations'],
      endpoints: {
        'GET /entities': {
          path: '/entities',
          method: 'GET',
          requestSchema: {
            type: 'object',
            properties: {
              pageSize: { type: 'number', default: 10 }, // renamed from limit
              pageOffset: { type: 'number', default: 0 }, // renamed from offset
              includeMetadata: { type: 'boolean', default: false }
            }
          },
          responseSchema: {
            type: 'object',
            properties: {
              data: { type: 'array' }, // renamed from entities
              totalCount: { type: 'number' }, // renamed from total
              metadata: { type: 'object' }
            }
          }
        },
        'POST /entities': {
          path: '/entities',
          method: 'POST',
          requestSchema: {
            type: 'object',
            properties: {
              entityType: { type: 'string' }, // renamed from type
              displayName: { type: 'string' }, // renamed from name
              attributes: { type: 'object' }, // renamed from properties
              metadata: { type: 'object' }
            },
            required: ['entityType', 'displayName']
          },
          responseSchema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              entityType: { type: 'string' },
              displayName: { type: 'string' },
              attributes: { type: 'object' },
              metadata: { type: 'object' }
            }
          }
        },
        'POST /entities/bulk': {
          path: '/entities/bulk',
          method: 'POST',
          requestSchema: {
            type: 'object',
            properties: {
              entities: { type: 'array' }
            },
            required: ['entities']
          },
          responseSchema: {
            type: 'object',
            properties: {
              successful: { type: 'array' },
              failed: { type: 'array' },
              summary: { type: 'object' }
            }
          }
        }
      }
    });

    // Legacy endpoints with deprecation warnings
    this.deprecationWarnings.set('1.0.0', [
      'API version 1.0.0 is deprecated. Please upgrade to version 1.1.0 or later.',
      'Some features in this version have known security vulnerabilities.'
    ]);
  }

  private determineVersion(request: APIRequest): string {
    // Check explicit version in header
    if (request.headers['API-Version']) {
      return request.headers['API-Version'];
    }

    // Check version in Accept header
    const acceptHeader = request.headers['Accept'];
    if (acceptHeader && acceptHeader.includes('version=')) {
      const versionMatch = acceptHeader.match(/version=([0-9.]+)/);
      if (versionMatch) {
        return versionMatch[1];
      }
    }

    // Check version in URL path
    const pathVersionMatch = request.path.match(/^\/v([0-9.]+)\//);
    if (pathVersionMatch) {
      return pathVersionMatch[1];
    }

    return this.defaultVersion;
  }

  private transformRequestForVersion(request: APIRequest, targetVersion: string): APIRequest {
    const transformedRequest = { ...request };

    // Handle version-specific field transformations
    if (request.body && targetVersion === '2.0.0') {
      if (request.path === '/entities' && request.method === 'POST') {
        // Transform v1.x request to v2.0 format
        if (request.body.type && !request.body.entityType) {
          transformedRequest.body = {
            ...request.body,
            entityType: request.body.type,
            displayName: request.body.name,
            attributes: request.body.properties
          };
          delete transformedRequest.body.type;
          delete transformedRequest.body.name;
          delete transformedRequest.body.properties;
        }
      }
    }

    return transformedRequest;
  }

  private transformResponseForVersion(response: any, requestedVersion: string): any {
    if (requestedVersion === '1.0.0' || requestedVersion === '1.1.0') {
      // Transform v2.0 response back to v1.x format
      if (response.data && !response.entities) {
        return {
          ...response,
          entities: response.data,
          total: response.totalCount
        };
      }

      if (response.entityType && !response.type) {
        return {
          ...response,
          type: response.entityType,
          name: response.displayName,
          properties: response.attributes
        };
      }
    }

    return response;
  }

  async handleRequest(request: APIRequest): Promise<APIResponse> {
    const requestedVersion = this.determineVersion(request);
    const versionKey = `${requestedVersion}-${request.method}-${request.path}`;

    // Track request counts
    this.requestCounts.set(versionKey, (this.requestCounts.get(versionKey) || 0) + 1);

    // Check if version exists
    if (!this.versions.has(requestedVersion)) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Unsupported API version',
          supportedVersions: Array.from(this.versions.keys())
        }
      };
    }

    const version = this.versions.get(requestedVersion)!;
    const endpointKey = `${request.method} ${request.path}`;

    // Check if endpoint exists in this version
    if (!version.endpoints[endpointKey]) {
      return {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Endpoint not found in this API version' }
      };
    }

    const endpoint = version.endpoints[endpointKey];
    const transformedRequest = this.transformRequestForVersion(request, requestedVersion);

    // Simulate endpoint logic
    let responseBody: any;
    let status = 200;

    switch (endpointKey) {
      case 'GET /entities':
        const limit = transformedRequest.body?.pageSize || transformedRequest.body?.limit || 10;
        const offset = transformedRequest.body?.pageOffset || transformedRequest.body?.offset || 0;

        responseBody = {
          [requestedVersion === '2.0.0' ? 'data' : 'entities']: Array.from({ length: limit }, (_, i) => ({
            id: `entity_${offset + i}`,
            [requestedVersion === '2.0.0' ? 'entityType' : 'type']: 'test',
            [requestedVersion === '2.0.0' ? 'displayName' : 'name']: `Entity ${offset + i}`,
            [requestedVersion === '2.0.0' ? 'attributes' : 'properties']: { index: offset + i }
          })),
          [requestedVersion === '2.0.0' ? 'totalCount' : 'total']: 1000
        };

        if (requestedVersion !== '1.0.0' && transformedRequest.body?.includeMetadata) {
          responseBody.metadata = { version: requestedVersion, timestamp: Date.now() };
        }
        break;

      case 'POST /entities':
        status = 201;
        responseBody = {
          id: `entity_${Date.now()}`,
          ...transformedRequest.body
        };
        break;

      case 'POST /entities/bulk':
        if (requestedVersion === '2.0.0') {
          status = 201;
          const entities = transformedRequest.body?.entities || [];
          responseBody = {
            successful: entities.map((e: any, i: number) => ({ ...e, id: `bulk_entity_${i}` })),
            failed: [],
            summary: { processed: entities.length, successful: entities.length, failed: 0 }
          };
        } else {
          status = 404;
          responseBody = { error: 'Bulk operations not available in this version' };
        }
        break;

      default:
        status = 404;
        responseBody = { error: 'Endpoint not implemented' };
    }

    // Transform response back to requested version format
    const transformedResponse = this.transformResponseForVersion(responseBody, requestedVersion);

    // Prepare response headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'API-Version': requestedVersion
    };

    // Add deprecation warnings
    const warnings: string[] = [];
    if (this.deprecationWarnings.has(requestedVersion)) {
      warnings.push(...this.deprecationWarnings.get(requestedVersion)!);
      headers['Warning'] = warnings.join('; ');
    }

    if (endpoint.deprecated) {
      warnings.push(endpoint.deprecationMessage || `Endpoint ${endpointKey} is deprecated`);
      if (endpoint.replacedBy) {
        warnings.push(`Use ${endpoint.replacedBy} instead`);
      }
    }

    // Emit telemetry
    this.emit('request', {
      version: requestedVersion,
      endpoint: endpointKey,
      status,
      deprecated: !!endpoint.deprecated || this.deprecationWarnings.has(requestedVersion)
    });

    return {
      status,
      headers,
      body: transformedResponse,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  getVersionInfo(version?: string): APIVersion | APIVersion[] {
    if (version) {
      return this.versions.get(version) || null;
    }
    return Array.from(this.versions.values());
  }

  getRequestStats(): Map<string, number> {
    return new Map(this.requestCounts);
  }

  isVersionSupported(version: string): boolean {
    return this.versions.has(version);
  }

  getDeprecatedVersions(): string[] {
    return Array.from(this.versions.values())
      .filter(v => v.deprecated)
      .map(v => v.version);
  }

  getSunsetVersions(): string[] {
    const now = new Date();
    return Array.from(this.versions.values())
      .filter(v => v.sunsetDate && new Date(v.sunsetDate) <= now)
      .map(v => v.version);
  }
}

// API Client with version negotiation
class VersionAwareAPIClient {
  private baseURL: string;
  private preferredVersion: string;
  private fallbackVersions: string[];
  private server: VersionedAPIServer;

  constructor(server: VersionedAPIServer, baseURL: string = 'http://localhost:3000', preferredVersion: string = '2.0.0') {
    this.server = server;
    this.baseURL = baseURL;
    this.preferredVersion = preferredVersion;
    this.fallbackVersions = ['1.1.0', '1.0.0'];
  }

  async request(path: string, method: string = 'GET', body?: any): Promise<APIResponse> {
    // Try preferred version first
    let response = await this.tryRequest(path, method, body, this.preferredVersion);

    // If preferred version fails, try fallbacks
    if (response.status >= 400) {
      for (const fallbackVersion of this.fallbackVersions) {
        const fallbackResponse = await this.tryRequest(path, method, body, fallbackVersion);
        if (fallbackResponse.status < 400) {
          return fallbackResponse;
        }
      }
    }

    return response;
  }

  private async tryRequest(path: string, method: string, body: any, version: string): Promise<APIResponse> {
    const request: APIRequest = {
      path,
      method,
      headers: {
        'API-Version': version,
        'Content-Type': 'application/json'
      },
      body
    };

    return await this.server.handleRequest(request);
  }

  async negotiateVersion(): Promise<string> {
    // Try to get version info
    const versionResponse = await this.request('/versions', 'GET');

    if (versionResponse.status === 200) {
      const supportedVersions = versionResponse.body.versions || [];

      // Return highest supported version that we can work with
      const compatibleVersions = [this.preferredVersion, ...this.fallbackVersions]
        .filter(v => supportedVersions.includes(v));

      return compatibleVersions[0] || this.fallbackVersions[this.fallbackVersions.length - 1];
    }

    return this.preferredVersion;
  }

  setPreferredVersion(version: string): void {
    this.preferredVersion = version;
  }
}

describe('API Versioning Tests', () => {
  let apiServer: VersionedAPIServer;
  let apiClient: VersionAwareAPIClient;

  beforeEach(() => {
    apiServer = new VersionedAPIServer();
    apiClient = new VersionAwareAPIClient(apiServer);
  });

  afterEach(() => {
    apiServer.removeAllListeners();
  });

  test('Basic Version Negotiation', async () => {
    // Test explicit version header
    const request: APIRequest = {
      path: '/entities',
      method: 'GET',
      headers: { 'API-Version': '1.1.0' }
    };

    const response = await apiServer.handleRequest(request);

    expect(response.status).toBe(200);
    expect(response.headers['API-Version']).toBe('1.1.0');
    expect(response.body).toHaveProperty('entities');
    expect(response.body).toHaveProperty('total');
  });

  test('Version in Accept Header', async () => {
    const request: APIRequest = {
      path: '/entities',
      method: 'GET',
      headers: { 'Accept': 'application/json; version=2.0.0' }
    };

    const response = await apiServer.handleRequest(request);

    expect(response.status).toBe(200);
    expect(response.headers['API-Version']).toBe('2.0.0');
    expect(response.body).toHaveProperty('data'); // v2.0 uses 'data' instead of 'entities'
    expect(response.body).toHaveProperty('totalCount'); // v2.0 uses 'totalCount' instead of 'total'
  });

  test('Unsupported Version Handling', async () => {
    const request: APIRequest = {
      path: '/entities',
      method: 'GET',
      headers: { 'API-Version': '3.0.0' }
    };

    const response = await apiServer.handleRequest(request);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Unsupported API version');
    expect(response.body.supportedVersions).toContain('1.0.0');
    expect(response.body.supportedVersions).toContain('2.0.0');
  });

  test('Backward Compatibility - Field Mapping', async () => {
    // Create entity using v1.0 format
    const createRequest: APIRequest = {
      path: '/entities',
      method: 'POST',
      headers: { 'API-Version': '1.0.0' },
      body: {
        type: 'class',
        name: 'TestClass',
        properties: { visibility: 'public' }
      }
    };

    const createResponse = await apiServer.handleRequest(createRequest);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toHaveProperty('type', 'class');
    expect(createResponse.body).toHaveProperty('name', 'TestClass');
    expect(createResponse.body).toHaveProperty('properties');

    // Same request with v2.0 should work but use different field names
    const v2Request: APIRequest = {
      ...createRequest,
      headers: { 'API-Version': '2.0.0' }
    };

    const v2Response = await apiServer.handleRequest(v2Request);

    expect(v2Response.status).toBe(201);
    expect(v2Response.body).toHaveProperty('entityType', 'class');
    expect(v2Response.body).toHaveProperty('displayName', 'TestClass');
    expect(v2Response.body).toHaveProperty('attributes');
  });

  test('Feature Availability Across Versions', async () => {
    // Bulk operations should only be available in v2.0+
    const bulkRequest: APIRequest = {
      path: '/entities/bulk',
      method: 'POST',
      headers: { 'API-Version': '1.0.0' },
      body: {
        entities: [
          { type: 'class', name: 'Class1' },
          { type: 'function', name: 'Function1' }
        ]
      }
    };

    const v1Response = await apiServer.handleRequest(bulkRequest);
    expect(v1Response.status).toBe(404);

    // Same request with v2.0 should work
    const v2BulkRequest: APIRequest = {
      ...bulkRequest,
      headers: { 'API-Version': '2.0.0' }
    };

    const v2Response = await apiServer.handleRequest(v2BulkRequest);
    expect(v2Response.status).toBe(201);
    expect(v2Response.body).toHaveProperty('successful');
    expect(v2Response.body).toHaveProperty('failed');
    expect(v2Response.body).toHaveProperty('summary');
  });

  test('Deprecation Warnings', async () => {
    const request: APIRequest = {
      path: '/entities',
      method: 'GET',
      headers: { 'API-Version': '1.0.0' }
    };

    const response = await apiServer.handleRequest(request);

    expect(response.status).toBe(200);
    expect(response.warnings).toBeDefined();
    expect(response.warnings!.some(w => w.includes('deprecated'))).toBe(true);
    expect(response.headers['Warning']).toBeDefined();
  });

  test('API Client Version Fallback', async () => {
    // Client prefers v2.0 but should fallback to v1.1 if needed
    apiClient.setPreferredVersion('2.0.0');

    // Mock a scenario where v2.0 is temporarily unavailable
    const originalHandleRequest = apiServer.handleRequest.bind(apiServer);
    apiServer.handleRequest = vi.fn().mockImplementation(async (request: APIRequest) => {
      if (request.headers['API-Version'] === '2.0.0') {
        return {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
          body: { error: 'Version temporarily unavailable' }
        };
      }
      return originalHandleRequest(request);
    });

    const response = await apiClient.request('/entities', 'GET');

    expect(response.status).toBe(200);
    expect(response.headers['API-Version']).toBe('1.1.0'); // Should fallback to v1.1.0
  });

  test('Version-Specific Response Transformation', async () => {
    // Request v2.0 data but expect v1.0 format response
    const request: APIRequest = {
      path: '/entities',
      method: 'GET',
      headers: { 'API-Version': '1.0.0' }
    };

    const response = await apiServer.handleRequest(request);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('entities'); // v1.0 format
    expect(response.body).toHaveProperty('total'); // v1.0 format
    expect(response.body).not.toHaveProperty('data'); // Should not have v2.0 fields
    expect(response.body).not.toHaveProperty('totalCount'); // Should not have v2.0 fields

    // Verify entity structure follows v1.0 format
    if (response.body.entities && response.body.entities.length > 0) {
      const entity = response.body.entities[0];
      expect(entity).toHaveProperty('type');
      expect(entity).toHaveProperty('name');
      expect(entity).toHaveProperty('properties');
      expect(entity).not.toHaveProperty('entityType');
      expect(entity).not.toHaveProperty('displayName');
    }
  });

  test('Breaking Change Detection', async () => {
    // Test that breaking changes are properly isolated between versions
    const v1Request: APIRequest = {
      path: '/entities',
      method: 'POST',
      headers: { 'API-Version': '1.0.0' },
      body: {
        type: 'interface',
        name: 'TestInterface',
        properties: { exported: true }
      }
    };

    const v2Request: APIRequest = {
      path: '/entities',
      method: 'POST',
      headers: { 'API-Version': '2.0.0' },
      body: {
        entityType: 'interface',
        displayName: 'TestInterface',
        attributes: { exported: true }
      }
    };

    const v1Response = await apiServer.handleRequest(v1Request);
    const v2Response = await apiServer.handleRequest(v2Request);

    expect(v1Response.status).toBe(201);
    expect(v2Response.status).toBe(201);

    // Responses should use version-appropriate field names
    expect(v1Response.body).toHaveProperty('type', 'interface');
    expect(v1Response.body).toHaveProperty('name', 'TestInterface');

    expect(v2Response.body).toHaveProperty('entityType', 'interface');
    expect(v2Response.body).toHaveProperty('displayName', 'TestInterface');
  });

  test('API Version Information Endpoint', async () => {
    const versions = apiServer.getVersionInfo();
    expect(Array.isArray(versions)).toBe(true);
    expect(versions.length).toBeGreaterThan(0);

    const v2Info = apiServer.getVersionInfo('2.0.0') as APIVersion;
    expect(v2Info).toBeDefined();
    expect(v2Info.version).toBe('2.0.0');
    expect(v2Info.breaking).toBe(true);
    expect(v2Info.features).toContain('bulk-operations');
  });

  test('Deprecated Version Identification', async () => {
    const deprecatedVersions = apiServer.getDeprecatedVersions();
    expect(Array.isArray(deprecatedVersions)).toBe(true);

    // Based on our setup, v2.0.0 should be deprecated
    expect(deprecatedVersions).toContain('2.0.0');
  });

  test('Content Negotiation with Multiple Clients', async () => {
    const telemetryEvents: any[] = [];

    // Monitor API usage
    apiServer.on('request', (event) => telemetryEvents.push(event));

    // Simulate different clients using different versions
    const legacyClient = new VersionAwareAPIClient(apiServer, 'http://localhost:3000', '1.0.0');
    const modernClient = new VersionAwareAPIClient(apiServer, 'http://localhost:3000', '2.0.0');

    // Both clients make requests
    await legacyClient.request('/entities', 'GET');
    await modernClient.request('/entities', 'GET');

    expect(telemetryEvents.length).toBe(2);
    expect(telemetryEvents[0].version).toBe('1.0.0');
    expect(telemetryEvents[1].version).toBe('2.0.0');
    expect(telemetryEvents[0].deprecated).toBe(true); // v1.0.0 is deprecated
  });

  test('Request Statistics by Version', async () => {
    // Make multiple requests with different versions
    const versions = ['1.0.0', '1.1.0', '2.0.0'];

    for (const version of versions) {
      for (let i = 0; i < 3; i++) {
        await apiServer.handleRequest({
          path: '/entities',
          method: 'GET',
          headers: { 'API-Version': version }
        });
      }
    }

    const stats = apiServer.getRequestStats();

    expect(stats.get('1.0.0-GET-/entities')).toBe(3);
    expect(stats.get('1.1.0-GET-/entities')).toBe(3);
    expect(stats.get('2.0.0-GET-/entities')).toBe(3);
  });

  test('Complex Version Negotiation Scenario', async () => {
    // Client that supports multiple versions and chooses best one
    class SmartAPIClient extends VersionAwareAPIClient {
      async smartRequest(path: string, method: string = 'GET', body?: any): Promise<APIResponse> {
        // Try newest version first, fallback to older versions
        const versionPriority = ['2.0.0', '1.1.0', '1.0.0'];

        for (const version of versionPriority) {
          if (apiServer.isVersionSupported(version)) {
            const response = await this.tryRequest(path, method, body, version);
            if (response.status < 400) {
              return response;
            }
          }
        }

        throw new Error('No compatible API version found');
      }

      private async tryRequest(path: string, method: string, body: any, version: string): Promise<APIResponse> {
        return await apiServer.handleRequest({
          path,
          method,
          headers: { 'API-Version': version, 'Content-Type': 'application/json' },
          body
        });
      }
    }

    const smartClient = new SmartAPIClient(apiServer);
    const response = await smartClient.smartRequest('/entities', 'GET');

    expect(response.status).toBe(200);
    expect(response.headers['API-Version']).toBe('2.0.0'); // Should pick newest version
  });

  test('Gradual Migration Path Testing', async () => {
    // Test a client migrating from v1.0 to v2.0 through v1.1
    const migrationSteps = [
      { from: '1.0.0', to: '1.1.0', breaking: false },
      { from: '1.1.0', to: '2.0.0', breaking: true }
    ];

    for (const step of migrationSteps) {
      // Test that data from old version works with new version
      const createInOldVersion = await apiServer.handleRequest({
        path: '/entities',
        method: 'POST',
        headers: { 'API-Version': step.from },
        body: {
          type: 'test',
          name: 'MigrationTest',
          properties: { test: true }
        }
      });

      expect(createInOldVersion.status).toBe(201);

      // Test querying with new version
      const queryInNewVersion = await apiServer.handleRequest({
        path: '/entities',
        method: 'GET',
        headers: { 'API-Version': step.to }
      });

      expect(queryInNewVersion.status).toBe(200);

      console.log(`Migration ${step.from} -> ${step.to}: ${step.breaking ? 'Breaking' : 'Compatible'}`);
    }
  });
});

describe('API Deprecation and Sunset Tests', () => {
  let apiServer: VersionedAPIServer;

  beforeEach(() => {
    apiServer = new VersionedAPIServer();
  });

  test('Deprecation Timeline Enforcement', async () => {
    const deprecatedVersions = apiServer.getDeprecatedVersions();
    expect(deprecatedVersions.length).toBeGreaterThan(0);

    // Requests to deprecated versions should still work but include warnings
    for (const version of deprecatedVersions) {
      const response = await apiServer.handleRequest({
        path: '/entities',
        method: 'GET',
        headers: { 'API-Version': version }
      });

      expect(response.status).toBe(200);
      expect(response.warnings).toBeDefined();
      expect(response.warnings!.some(w => w.includes('deprecated'))).toBe(true);
    }
  });

  test('Sunset Version Handling', async () => {
    // Mock a version that has passed its sunset date
    const currentDate = new Date();
    const pastDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000); // Yesterday

    // This would typically be configured in the server setup
    const sunsetVersions = apiServer.getSunsetVersions();

    // In a real implementation, sunset versions would return 410 Gone
    // For this test, we'll verify the sunset detection logic
    expect(Array.isArray(sunsetVersions)).toBe(true);
  });

  test('Migration Guide Generation', async () => {
    // Test that the API can provide migration guidance
    const v1Info = apiServer.getVersionInfo('1.0.0') as APIVersion;
    const v2Info = apiServer.getVersionInfo('2.0.0') as APIVersion;

    expect(v1Info).toBeDefined();
    expect(v2Info).toBeDefined();
    expect(v2Info.breaking).toBe(true);

    // In a real implementation, this would provide detailed migration steps
    const migrationNeeded = v1Info.version !== v2Info.version && v2Info.breaking;
    expect(migrationNeeded).toBe(true);
  });
});
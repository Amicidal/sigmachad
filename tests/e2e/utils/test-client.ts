import fetch, { Response } from 'node-fetch';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@memento/api/trpc/router';
import superjson from 'superjson';

export interface TestClientOptions {
  baseUrl: string;
  timeout?: number;
  apiKey?: string;
  authToken?: string;
}

export interface ApiResponse<T = any> {
  statusCode: number;
  headers: Record<string, string>;
  body: T;
  raw: Response;
}

export class TestClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private apiKey?: string;
  private authToken?: string;

  // tRPC client for type-safe API calls
  public readonly trpc: ReturnType<typeof createTRPCProxyClient<AppRouter>>;

  constructor(options: TestClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.timeout = options.timeout || 30000;
    this.apiKey = options.apiKey;
    this.authToken = options.authToken;

    // Initialize tRPC client
    this.trpc = createTRPCProxyClient<AppRouter>({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: `${this.baseUrl}/api/trpc`,
          headers: () => this.getHeaders(),
          fetch: fetch as any,
        }),
      ],
    });
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  clearAuth(): void {
    this.apiKey = undefined;
    this.authToken = undefined;
  }

  async get<T = any>(path: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
      timeout: this.timeout,
    });

    return this.parseResponse<T>(response);
  }

  async post<T = any>(path: string, body?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
      timeout: this.timeout,
    });

    return this.parseResponse<T>(response);
  }

  async put<T = any>(path: string, body?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
      timeout: this.timeout,
    });

    return this.parseResponse<T>(response);
  }

  async delete<T = any>(path: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      timeout: this.timeout,
    });

    return this.parseResponse<T>(response);
  }

  async patch<T = any>(path: string, body?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
      timeout: this.timeout,
    });

    return this.parseResponse<T>(response);
  }

  private async parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    let body: T;
    try {
      const text = await response.text();
      body = text ? JSON.parse(text) : undefined;
    } catch (error) {
      // If JSON parsing fails, return the raw text
      body = (await response.text()) as any;
    }

    return {
      statusCode: response.status,
      headers,
      body,
      raw: response,
    };
  }

  async waitForHealthy(maxAttempts: number = 30, delayMs: number = 1000): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await this.get('/health');
        if (response.statusCode === 200) {
          return;
        }
      } catch (error) {
        // Service not ready yet
      }

      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    throw new Error(`Service did not become healthy after ${maxAttempts} attempts`);
  }

  async cleanup(): Promise<void> {
    // Clean up any resources if needed
    this.clearAuth();
  }
}
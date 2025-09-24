import { randomUUID } from 'crypto';
import path from 'path';

export interface MockUser {
  id: string;
  email: string;
  name: string;
  apiKey: string;
}

export interface MockCodeFile {
  path: string;
  content: string;
  language: string;
}

export interface MockEntity {
  id: string;
  name: string;
  type: string;
  metadata: Record<string, any>;
}

export interface MockTestResult {
  suite: string;
  test: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

export class MockDataGenerator {
  generateUser(overrides: Partial<MockUser> = {}): MockUser {
    return {
      id: randomUUID(),
      email: `test-${randomUUID().slice(0, 8)}@example.com`,
      name: `Test User ${randomUUID().slice(0, 8)}`,
      apiKey: `mk-${randomUUID()}`,
      ...overrides,
    };
  }

  generateApiKey(prefix = 'mk'): string {
    return `${prefix}-${randomUUID()}`;
  }

  generateCodeFile(overrides: Partial<MockCodeFile> = {}): MockCodeFile {
    const defaultFiles = [
      {
        path: 'src/utils/helper.ts',
        content: `export function helper(value: string): string {
  return value.toUpperCase();
}

export class HelperClass {
  process(input: any): any {
    return input;
  }
}`,
        language: 'typescript',
      },
      {
        path: 'src/services/UserService.ts',
        content: `import { helper } from '../utils/helper';

export class UserService {
  async getUser(id: string) {
    return { id, name: helper(id) };
  }

  async createUser(data: any) {
    return { id: generateId(), ...data };
  }
}

function generateId(): string {
  return Math.random().toString(36);
}`,
        language: 'typescript',
      },
      {
        path: 'src/components/Button.tsx',
        content: `import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, onClick, disabled }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};`,
        language: 'typescript',
      },
    ];

    const randomFile = defaultFiles[Math.floor(Math.random() * defaultFiles.length)];
    return {
      ...randomFile,
      ...overrides,
    };
  }

  generateMultipleCodeFiles(count: number): MockCodeFile[] {
    const files: MockCodeFile[] = [];
    const directories = ['src/utils', 'src/services', 'src/components', 'src/types'];
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];

    for (let i = 0; i < count; i++) {
      const dir = directories[Math.floor(Math.random() * directories.length)];
      const ext = extensions[Math.floor(Math.random() * extensions.length)];
      const fileName = `file-${i}${ext}`;

      files.push({
        path: path.join(dir, fileName),
        content: this.generateRandomTypeScriptContent(),
        language: ext.includes('ts') ? 'typescript' : 'javascript',
      });
    }

    return files;
  }

  private generateRandomTypeScriptContent(): string {
    const templates = [
      `export interface Entity {
  id: string;
  name: string;
  createdAt: Date;
}

export class EntityService {
  async findById(id: string): Promise<Entity | null> {
    return null;
  }
}`,
      `export function processData(input: any[]): any[] {
  return input.filter(item => item != null);
}

export const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
};`,
      `import { Entity } from './types';

export class Repository<T extends Entity> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  findAll(): T[] {
    return [...this.items];
  }
}`,
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  generateEntity(overrides: Partial<MockEntity> = {}): MockEntity {
    const types = ['function', 'class', 'interface', 'variable', 'module'];
    const names = ['Helper', 'Service', 'Component', 'Util', 'Manager'];

    return {
      id: randomUUID(),
      name: names[Math.floor(Math.random() * names.length)],
      type: types[Math.floor(Math.random() * types.length)],
      metadata: {
        filePath: `/src/${randomUUID().slice(0, 8)}.ts`,
        startLine: Math.floor(Math.random() * 100) + 1,
        endLine: Math.floor(Math.random() * 50) + 50,
        complexity: Math.floor(Math.random() * 10) + 1,
      },
      ...overrides,
    };
  }

  generateTestResult(overrides: Partial<MockTestResult> = {}): MockTestResult {
    const suites = ['UserService', 'ApiClient', 'Helper', 'Component'];
    const tests = ['should work correctly', 'should handle errors', 'should validate input'];
    const statuses: MockTestResult['status'][] = ['passed', 'failed', 'skipped'];

    return {
      suite: suites[Math.floor(Math.random() * suites.length)],
      test: tests[Math.floor(Math.random() * tests.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      duration: Math.floor(Math.random() * 1000) + 10,
      error: overrides.status === 'failed' ? 'Test assertion failed' : undefined,
      ...overrides,
    };
  }

  generateSearchQuery(): string {
    const queries = [
      'function authentication',
      'class UserService',
      'import react',
      'export interface',
      'async function',
      'error handling',
      'database connection',
      'authentication middleware',
    ];

    return queries[Math.floor(Math.random() * queries.length)];
  }

  generateEmbedding(dimensions: number = 1536): number[] {
    const embedding: number[] = [];
    for (let i = 0; i < dimensions; i++) {
      embedding.push((Math.random() - 0.5) * 2); // Random values between -1 and 1
    }

    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  generateWebSocketMessage(type: string, payload: any = {}): string {
    return JSON.stringify({
      id: randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      payload,
    });
  }

  async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  randomChoice<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }
}
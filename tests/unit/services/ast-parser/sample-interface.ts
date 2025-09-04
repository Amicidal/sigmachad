/**
 * Sample TypeScript interface and type definitions for ASTParser testing
 */

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  connectionTimeout?: number;
}

export interface CacheConfig {
  ttl: number;
  maxSize: number;
  strategy: 'LRU' | 'LFU' | 'FIFO';
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500
}

export type ApiResponse<T> = {
  success: true;
  data: T;
  message?: string;
} | {
  success: false;
  error: string;
  code: HttpStatus;
};

export interface Logger {
  log(level: LogLevel, message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
}

export abstract class BaseRepository<T extends { id: string }> {
  protected items: Map<string, T> = new Map();

  abstract validate(item: Partial<T>): boolean;

  async findById(id: string): Promise<T | null> {
    return this.items.get(id) || null;
  }

  async findAll(): Promise<T[]> {
    return Array.from(this.items.values());
  }

  async create(item: Omit<T, 'id'>): Promise<T> {
    const newItem = { ...item, id: this.generateId() } as T;
    if (!this.validate(newItem)) {
      throw new Error('Invalid item data');
    }
    this.items.set(newItem.id, newItem);
    return newItem;
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    const existing = this.items.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates };
    if (!this.validate(updated)) {
      throw new Error('Invalid update data');
    }

    this.items.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  protected generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

export class UserRepository extends BaseRepository<{
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
}> {
  validate(item: any): boolean {
    return !!(item.name && item.email && item.role);
  }

  async findByEmail(email: string): Promise<any | null> {
    for (const user of this.items.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NonNullable<T> = T extends null | undefined ? never : T;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function createLogger(config: { level: LogLevel; format?: 'json' | 'text' }): Logger {
  return {
    log: (level, message, meta) => {
      if (shouldLog(level, config.level)) {
        const entry = {
          timestamp: new Date().toISOString(),
          level,
          message,
          ...meta
        };

        if (config.format === 'json') {
          console.log(JSON.stringify(entry));
        } else {
          console.log(`[${entry.timestamp}] ${level.toUpperCase()}: ${message}`);
        }
      }
    },

    debug: (message, meta) => this.log('debug', message, meta),
    info: (message, meta) => this.log('info', message, meta),
    warn: (message, meta) => this.log('warn', message, meta),
    error: (message, meta) => this.log('error', message, meta),
  };
}

function shouldLog(messageLevel: LogLevel, configLevel: LogLevel): boolean {
  const levels = ['debug', 'info', 'warn', 'error'];
  return levels.indexOf(messageLevel) >= levels.indexOf(configLevel);
}

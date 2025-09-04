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
export declare enum HttpStatus {
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
export declare abstract class BaseRepository<T extends {
    id: string;
}> {
    protected items: Map<string, T>;
    abstract validate(item: Partial<T>): boolean;
    findById(id: string): Promise<T | null>;
    findAll(): Promise<T[]>;
    create(item: Omit<T, 'id'>): Promise<T>;
    update(id: string, updates: Partial<T>): Promise<T | null>;
    delete(id: string): Promise<boolean>;
    protected generateId(): string;
}
export declare class UserRepository extends BaseRepository<{
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
    createdAt: Date;
}> {
    validate(item: any): boolean;
    findByEmail(email: string): Promise<any | null>;
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
export declare function createLogger(config: {
    level: LogLevel;
    format?: 'json' | 'text';
}): Logger;
//# sourceMappingURL=sample-interface.d.ts.map
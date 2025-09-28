import type { AuthContext } from './auth';
export interface TRPCAuthContext extends AuthContext {
}
export interface TRPCBaseContext {
    authToken?: string;
    authContext?: AuthContext;
}
export interface TRPCContext extends TRPCBaseContext {
    kgService: any;
    dbService: any;
    astParser: any;
    fileWatcher: any;
}
export type TRPCPublicProcedure<TInput = any, TOutput = any> = {
    _def: {
        _input_in: TInput;
        _output_out: TOutput;
    };
};
export type TRPCAdminProcedure<TInput = any, TOutput = any> = {
    _def: {
        _input_in: TInput;
        _output_out: TOutput;
    };
};
export interface TRPCHealthResponse {
    status: 'ok';
    timestamp: string;
    services: {
        neo4j?: {
            status: string;
        };
        postgresql?: {
            status: string;
        };
        redis?: {
            status: string;
        };
    };
}
export interface TRPCError {
    code: string;
    message: string;
    cause?: any;
}
export interface PaginationOptions {
    limit?: number;
    offset?: number;
    cursor?: string;
}
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
}
export interface EntityQuery {
    id?: string;
    type?: string;
    path?: string;
    limit?: number;
    offset?: number;
    includeRelationships?: boolean;
}
export interface EntityQueryResponse {
    entities: any[];
    relationships?: any[];
    total: number;
}
export interface CodeAnalysisRequest {
    file: string;
    lineStart?: number;
    lineEnd?: number;
    types?: string[];
}
export interface CodeAnalysisResponse {
    file: string;
    entities: any[];
    relationships: any[];
    symbols: any[];
    suggestions: string[];
    metrics: {
        complexity: number;
        dependencies: number;
        exports: number;
    };
}
export interface GraphQuery {
    entityId?: string;
    entityType?: string;
    relationshipTypes?: string[];
    direction?: 'incoming' | 'outgoing' | 'both';
    limit?: number;
    depth?: number;
}
export interface GraphQueryResponse {
    entities: any[];
    relationships: any[];
    paths?: any[];
}
export interface HistoryQuery {
    entityId: string;
    limit?: number;
    before?: Date;
    after?: Date;
    types?: string[];
}
export interface HistoryResponse {
    changes: any[];
    total: number;
    hasMore: boolean;
}
export interface AdminOperation {
    type: 'maintenance' | 'backup' | 'restore' | 'clear' | 'sync';
    parameters?: Record<string, any>;
}
export interface AdminOperationResponse {
    success: boolean;
    message: string;
    data?: any;
    duration?: number;
}
export interface DesignAnalysisRequest {
    files?: string[];
    directories?: string[];
    patterns?: string[];
}
export interface DesignAnalysisResponse {
    patterns: any[];
    violations: any[];
    suggestions: string[];
    metrics: {
        filesAnalyzed: number;
        patternsFound: number;
        violationsFound: number;
    };
}

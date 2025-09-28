export interface FalkorDBQueryResult {
    headers?: string[];
    data?: unknown[][];
    statistics?: Record<string, unknown>;
}
export interface IDatabaseService {
    falkordbQuery(query: string, params?: Record<string, unknown>): Promise<FalkorDBQueryResult>;
    postgresQuery(query: string, params?: unknown[]): Promise<unknown>;
    getQdrantClient(): unknown;
    isInitialized(): boolean;
    falkordbCommand(command: string, ...args: unknown[]): Promise<FalkorDBQueryResult>;
    getFalkorDBService(): unknown;
}

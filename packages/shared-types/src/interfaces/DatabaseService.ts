export interface FalkorDBQueryResult {
  headers?: any[];
  data?: any[];
  statistics?: any;
}

export interface IDatabaseService {
  // Core methods used in configuration and maintenance
  falkordbQuery(
    query: string,
    params?: Record<string, any>
  ): Promise<FalkorDBQueryResult>;
  postgresQuery(query: string, params?: any[]): Promise<any>;
  getQdrantClient(): any; // Replace with specific Qdrant client type if defined
  isInitialized(): boolean;

  // Health and status methods
  falkordbCommand(command: string, ...args: any[]): Promise<FalkorDBQueryResult>;

  // For optimization and cleanup
  getFalkorDBService(): any; // FalkorDB driver instance
}

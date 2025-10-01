export interface IKnowledgeGraphService {
  // Basic entity operations
  deleteEntity(entityId: string): Promise<void>;
  getEntity(id: string): Promise<unknown | null>;

  /**
   * List entities with pagination. Implementations may support either cursor or offset pagination.
   * Return shape may contain `entities` or `items`; `total` is optional but present in most concrete services.
   */
  listEntities(params: {
    limit?: number;
    cursor?: string;
    /** Optional offset for offset-based pagination (legacy callers). */
    offset?: number;
  }): Promise<{
    entities?: unknown[];
    items?: unknown[];
    total?: number;
    nextCursor?: string;
  }>;

  listRelationships(params: {
    limit?: number;
    cursor?: string;
    offset?: number;
  }): Promise<{ relationships: unknown[]; total?: number; nextCursor?: string }>;

  // History access used by maintenance/validation jobs
  getEntityTimeline?(entityId: string, options?: unknown): Promise<unknown>;
  getRelationshipTimeline?(relationshipId: string, options?: unknown): Promise<unknown>;

  // Repair hooks (optional; implementations may no-op)
  repairPreviousVersionLink?(versionId: string): Promise<void>;
}

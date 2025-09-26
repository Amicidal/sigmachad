export interface IKnowledgeGraphService {
  deleteEntity(entityId: string): Promise<void>;
  getEntity(id: string): Promise<any | null>;
  listEntities(params: { limit?: number; cursor?: string }): Promise<{ entities?: any[]; items?: any[]; nextCursor?: string }>;
  listRelationships(params: { limit?: number; cursor?: string }): Promise<{ relationships: any[]; nextCursor?: string }>;
}


export interface IKnowledgeGraphService {
    deleteEntity(entityId: string): Promise<void>;
    getEntity(id: string): Promise<unknown | null>;
    listEntities(params: {
        limit?: number;
        cursor?: string;
    }): Promise<{
        entities?: unknown[];
        items?: unknown[];
        nextCursor?: string;
    }>;
    listRelationships(params: {
        limit?: number;
        cursor?: string;
    }): Promise<{
        relationships: unknown[];
        nextCursor?: string;
    }>;
}

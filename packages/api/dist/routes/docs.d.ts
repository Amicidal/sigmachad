/**
 * Documentation Operations Routes
 * Handles documentation synchronization, domain analysis, and content management
 */
import { FastifyInstance } from 'fastify';
import { KnowledgeGraphService, DocumentationParser } from '@memento/knowledge';
import { DatabaseService } from '@memento/core';
export declare function registerDocsRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService, docParser: DocumentationParser): Promise<void>;
//# sourceMappingURL=docs.d.ts.map
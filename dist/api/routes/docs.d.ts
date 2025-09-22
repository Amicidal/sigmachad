/**
 * Documentation Operations Routes
 * Handles documentation synchronization, domain analysis, and content management
 */
import { FastifyInstance } from 'fastify';
import { KnowledgeGraphService } from '../../services/knowledge/KnowledgeGraphService.js';
import { DatabaseService } from '../../services/core/DatabaseService.js';
import { DocumentationParser } from '../../services/knowledge/DocumentationParser.js';
export declare function registerDocsRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService, docParser: DocumentationParser): Promise<void>;
//# sourceMappingURL=docs.d.ts.map
/**
 * Security Operations Routes
 * Handles security scanning, vulnerability assessment, and security monitoring
 */
import { FastifyInstance } from 'fastify';
import { KnowledgeGraphService } from '../../services/KnowledgeGraphService.js';
import { DatabaseService } from '../../services/DatabaseService.js';
export declare function registerSecurityRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService): Promise<void>;
//# sourceMappingURL=security.d.ts.map
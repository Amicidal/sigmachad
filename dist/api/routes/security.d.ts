/**
 * Security Operations Routes
 * Handles security scanning, vulnerability assessment, and security monitoring
 */
import { FastifyInstance } from 'fastify';
import { KnowledgeGraphService } from '../../services/knowledge/KnowledgeGraphService.js';
import { DatabaseService } from '../../services/core/DatabaseService.js';
import { SecurityScanner } from '../../services/testing/SecurityScanner.js';
export declare function registerSecurityRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService, securityScanner: SecurityScanner): Promise<void>;
//# sourceMappingURL=security.d.ts.map
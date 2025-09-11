/**
 * Security Operations Routes
 * Handles security scanning, vulnerability assessment, and security monitoring
 */
import { FastifyInstance } from 'fastify';
import { KnowledgeGraphService } from '../../services/KnowledgeGraphService.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { SecurityScanner } from '../../services/SecurityScanner.js';
export declare function registerSecurityRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService, securityScanner: SecurityScanner): Promise<void>;
//# sourceMappingURL=security.d.ts.map
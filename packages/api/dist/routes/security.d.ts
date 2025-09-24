/**
 * Security Operations Routes
 * Handles security scanning, vulnerability assessment, and security monitoring
 */
import { FastifyInstance } from 'fastify';
import { KnowledgeGraphService } from '@memento/knowledge';
import { DatabaseService } from '@memento/core';
import { SecurityScanner } from '@memento/testing';
export declare function registerSecurityRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService, securityScanner: SecurityScanner): Promise<void>;
//# sourceMappingURL=security.d.ts.map
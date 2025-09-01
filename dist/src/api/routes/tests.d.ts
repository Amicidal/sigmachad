/**
 * Test Management Routes
 * Handles test planning, generation, execution recording, and coverage analysis
 */
import { FastifyInstance } from 'fastify';
import { KnowledgeGraphService } from '../../services/KnowledgeGraphService.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { TestEngine } from '../../services/TestEngine.js';
export declare function registerTestRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService, testEngine: TestEngine): Promise<void>;
//# sourceMappingURL=tests.d.ts.map
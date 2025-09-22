/**
 * Test Management Routes
 * Handles test planning, generation, execution recording, and coverage analysis
 */
import { FastifyInstance } from "fastify";
import { KnowledgeGraphService } from "../../services/knowledge/KnowledgeGraphService.js";
import { DatabaseService } from "../../services/core/DatabaseService.js";
import { TestEngine } from "../../services/testing/TestEngine.js";
import type { TestPerformanceMetrics } from "../../models/entities.js";
export declare const aggregatePerformanceMetrics: (metrics: TestPerformanceMetrics[]) => TestPerformanceMetrics;
export declare function registerTestRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService, testEngine: TestEngine): Promise<void>;
//# sourceMappingURL=tests.d.ts.map
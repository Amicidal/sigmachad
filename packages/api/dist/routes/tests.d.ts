/**
 * Test Management Routes
 * Handles test planning, generation, execution recording, and coverage analysis
 */
import { FastifyInstance } from "fastify";
import { KnowledgeGraphService } from "../../../dist/services/knowledge/index.js";
import { DatabaseService } from "../../../dist/services/core/index.js";
import { TestEngine } from "../../../dist/services/testing/index.js";
import type { TestPerformanceMetrics } from "../../../dist/services/core/index.js";
export declare const aggregatePerformanceMetrics: (metrics: TestPerformanceMetrics[]) => TestPerformanceMetrics;
export declare function registerTestRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService, testEngine: TestEngine): Promise<void>;
//# sourceMappingURL=tests.d.ts.map
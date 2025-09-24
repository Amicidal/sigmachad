/**
 * Code Operations Routes
 * Handles code change proposals, validation, and analysis
 */
import { FastifyInstance } from "fastify";
import { KnowledgeGraphService, ASTParser } from "../../../dist/services/knowledge/index.js";
import { DatabaseService } from "../../../dist/services/core/index.js";
export declare function registerCodeRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService, astParser: ASTParser): Promise<void>;
//# sourceMappingURL=code.d.ts.map
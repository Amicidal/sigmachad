/**
 * Code Operations Routes
 * Handles code change proposals, validation, and analysis
 */
import { FastifyInstance } from "fastify";
import { KnowledgeGraphService } from "../../services/knowledge/KnowledgeGraphService.js";
import { DatabaseService } from "../../services/core/DatabaseService.js";
import { ASTParser } from "../../services/knowledge/ASTParser.js";
export declare function registerCodeRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService, astParser: ASTParser): Promise<void>;
//# sourceMappingURL=code.d.ts.map
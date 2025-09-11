/**
 * Code Operations Routes
 * Handles code change proposals, validation, and analysis
 */
import { FastifyInstance } from "fastify";
import { KnowledgeGraphService } from "../../services/KnowledgeGraphService.js";
import { DatabaseService } from "../../services/DatabaseService.js";
import { ASTParser } from "../../services/ASTParser.js";
export declare function registerCodeRoutes(app: FastifyInstance, kgService: KnowledgeGraphService, dbService: DatabaseService, astParser: ASTParser): Promise<void>;
//# sourceMappingURL=code.d.ts.map
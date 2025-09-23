// Original services
export { ASTParser } from './ASTParser.js';
export { DocumentationParser } from './DocumentationParser.js';
export { ModuleIndexer } from './ModuleIndexer.js';
// Core database service
export { DatabaseService } from '../core/DatabaseService.js';
// New modular services
// export { Neo4jService, type Neo4jConfig } from './Neo4jService.js'; // Commented out to avoid duplicate export with database/index.js
export { EmbeddingService } from './EmbeddingService.js';
export { HistoryService } from './HistoryService.js';
export { AnalysisService } from './AnalysisService.js';
// OGM Services (Primary Implementation)
export { NeogmaService, EntityServiceOGM, RelationshipServiceOGM, SearchServiceOGM } from '../knowledge-ogm/index.js';
// Main facade service
export { KnowledgeGraphService } from './KnowledgeGraphService.js';
export { KnowledgeGraphService as default } from './KnowledgeGraphService.js';
//# sourceMappingURL=index.js.map
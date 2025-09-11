/**
 * Knowledge Graph Entity Types for Memento
 * Based on the comprehensive knowledge graph design
 */
// Type guards for entity discrimination
export const isFile = (entity) => entity != null && entity.type === "file";
export const isDirectory = (entity) => entity != null && entity.type === "directory";
export const isSymbol = (entity) => entity != null && entity.type === "symbol";
export const isFunction = (entity) => isSymbol(entity) && entity.kind === "function";
export const isClass = (entity) => isSymbol(entity) && entity.kind === "class";
export const isInterface = (entity) => isSymbol(entity) && entity.kind === "interface";
export const isTest = (entity) => entity != null && entity.type === "test";
export const isSpec = (entity) => entity != null && entity.type === "spec";
// Re-export RelationshipType from relationships module
export { RelationshipType } from "./relationships.js";
//# sourceMappingURL=entities.js.map
/**
 * Knowledge Graph Entity Types for Memento
 * Based on the comprehensive knowledge graph design
 */
// Type guards for entity discrimination
export const isFile = (entity) => entity.type === 'file';
export const isDirectory = (entity) => entity.type === 'directory';
export const isSymbol = (entity) => entity.type === 'symbol';
export const isFunction = (entity) => isSymbol(entity) && entity.kind === 'function';
export const isClass = (entity) => isSymbol(entity) && entity.kind === 'class';
export const isInterface = (entity) => isSymbol(entity) && entity.kind === 'interface';
export const isTest = (entity) => entity.type === 'test';
export const isSpec = (entity) => entity.type === 'spec';
//# sourceMappingURL=entities.js.map
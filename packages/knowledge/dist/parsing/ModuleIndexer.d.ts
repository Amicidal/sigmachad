/**
 * ModuleIndexer
 * Creates Module entities from package manifests (package.json) to close the model gap.
 */
import { KnowledgeGraphService } from './KnowledgeGraphService.js';
import { Module } from '../../models/entities.js';
export declare class ModuleIndexer {
    private kg;
    constructor(kg: KnowledgeGraphService);
    /** Index root package.json as a Module entity if present. */
    indexRootPackage(dir?: string): Promise<Module | null>;
}
//# sourceMappingURL=ModuleIndexer.d.ts.map
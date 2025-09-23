/**
 * Entity Model Definitions for Neogma OGM
 * Maps domain entities to Neo4j node models
 */
import { Neogma } from 'neogma';
/**
 * Create all entity models for the knowledge graph
 */
export declare function createEntityModels(neogma: Neogma): {
    FileModel: import("neogma").NeogmaModel<import("neogma").Neo4jSupportedProperties, Object, Object, Object>;
    DirectoryModel: import("neogma").NeogmaModel<import("neogma").Neo4jSupportedProperties, Object, Object, Object>;
    ModuleModel: import("neogma").NeogmaModel<import("neogma").Neo4jSupportedProperties, Object, Object, Object>;
    SymbolModel: import("neogma").NeogmaModel<import("neogma").Neo4jSupportedProperties, Object, Object, Object>;
    FunctionSymbolModel: import("neogma").NeogmaModel<import("neogma").Neo4jSupportedProperties, Object, Object, Object>;
    ClassSymbolModel: import("neogma").NeogmaModel<import("neogma").Neo4jSupportedProperties, Object, Object, Object>;
    InterfaceSymbolModel: import("neogma").NeogmaModel<import("neogma").Neo4jSupportedProperties, Object, Object, Object>;
    TestModel: import("neogma").NeogmaModel<import("neogma").Neo4jSupportedProperties, Object, Object, Object>;
    SpecificationModel: import("neogma").NeogmaModel<import("neogma").Neo4jSupportedProperties, Object, Object, Object>;
    DocumentationModel: import("neogma").NeogmaModel<import("neogma").Neo4jSupportedProperties, Object, Object, Object>;
    EntityModel: import("neogma").NeogmaModel<import("neogma").Neo4jSupportedProperties, Object, Object, Object>;
};
//# sourceMappingURL=EntityModels.d.ts.map
/**
 * Entity Model Definitions for Neogma OGM
 * Maps domain entities to Neo4j node models
 */
import { createEntityModel } from './BaseModels.js';
/**
 * Create all entity models for the knowledge graph
 */
export function createEntityModels(neogma) {
    // File Entity Model
    const FileModel = createEntityModel(neogma, {
        label: 'File',
        schema: {
            type: {
                type: 'string',
                required: true,
                enum: ['file'],
            },
            extension: {
                type: 'string',
                required: false,
            },
            size: {
                type: 'number',
                required: false,
                minimum: 0,
            },
            lines: {
                type: 'number',
                required: false,
                minimum: 0,
            },
            isTest: {
                type: 'boolean',
                required: false,
            },
            isConfig: {
                type: 'boolean',
                required: false,
            },
            dependencies: {
                type: 'string[]',
                required: false,
            },
        },
        additionalIndices: [
            { properties: ['extension'], type: 'RANGE' },
            { properties: ['isTest'], type: 'RANGE' },
        ],
    });
    // Directory Entity Model
    const DirectoryModel = createEntityModel(neogma, {
        label: 'Directory',
        schema: {
            type: {
                type: 'string',
                required: true,
                enum: ['directory'],
            },
            children: {
                type: 'string[]',
                required: false,
            },
            depth: {
                type: 'number',
                required: false,
                minimum: 0,
            },
        },
        additionalIndices: [{ properties: ['depth'], type: 'RANGE' }],
    });
    // Module Entity Model
    const ModuleModel = createEntityModel(neogma, {
        label: 'Module',
        schema: {
            type: {
                type: 'string',
                required: true,
                enum: ['module'],
            },
            name: {
                type: 'string',
                required: true,
            },
            version: {
                type: 'string',
                required: false,
            },
            packageJson: {
                type: 'object',
                required: false,
            },
            entryPoint: {
                type: 'string',
                required: false,
            },
        },
        additionalIndices: [
            { properties: ['name'], type: 'RANGE' },
            { properties: ['version'], type: 'RANGE' },
        ],
    });
    // Base Symbol Model (for common symbol properties)
    const SymbolModel = createEntityModel(neogma, {
        label: 'Symbol',
        schema: {
            type: {
                type: 'string',
                required: true,
                enum: ['symbol'],
            },
            name: {
                type: 'string',
                required: true,
            },
            kind: {
                type: 'string',
                required: true,
                enum: [
                    'function',
                    'class',
                    'interface',
                    'typeAlias',
                    'variable',
                    'property',
                    'method',
                    'unknown',
                ],
            },
            signature: {
                type: 'string',
                required: false,
            },
            docstring: {
                type: 'string',
                required: false,
            },
            visibility: {
                type: 'string',
                required: false,
                enum: ['public', 'private', 'protected'],
            },
            isExported: {
                type: 'boolean',
                required: false,
            },
            isDeprecated: {
                type: 'boolean',
                required: false,
            },
            location: {
                type: 'object',
                required: false,
            },
        },
        additionalIndices: [
            { properties: ['name'], type: 'RANGE' },
            { properties: ['kind'], type: 'RANGE' },
            { properties: ['isExported'], type: 'RANGE' },
        ],
    });
    // Function Symbol Model
    const FunctionSymbolModel = createEntityModel(neogma, {
        label: 'FunctionSymbol',
        schema: {
            type: {
                type: 'string',
                required: true,
                enum: ['symbol'],
            },
            kind: {
                type: 'string',
                required: true,
                enum: ['function'],
            },
            name: {
                type: 'string',
                required: true,
            },
            signature: {
                type: 'string',
                required: false,
            },
            docstring: {
                type: 'string',
                required: false,
            },
            visibility: {
                type: 'string',
                required: false,
                enum: ['public', 'private', 'protected'],
            },
            isExported: {
                type: 'boolean',
                required: false,
            },
            isDeprecated: {
                type: 'boolean',
                required: false,
            },
            location: {
                type: 'object',
                required: false,
            },
            parameters: {
                type: 'object[]',
                required: false,
            },
            returnType: {
                type: 'string',
                required: false,
            },
            isAsync: {
                type: 'boolean',
                required: false,
            },
            isGenerator: {
                type: 'boolean',
                required: false,
            },
            complexity: {
                type: 'number',
                required: false,
                minimum: 0,
            },
            calls: {
                type: 'string[]',
                required: false,
            },
        },
        additionalIndices: [
            { properties: ['name'], type: 'RANGE' },
            { properties: ['isAsync'], type: 'RANGE' },
            { properties: ['complexity'], type: 'RANGE' },
        ],
    });
    // Class Symbol Model
    const ClassSymbolModel = createEntityModel(neogma, {
        label: 'ClassSymbol',
        schema: {
            type: {
                type: 'string',
                required: true,
                enum: ['symbol'],
            },
            kind: {
                type: 'string',
                required: true,
                enum: ['class'],
            },
            name: {
                type: 'string',
                required: true,
            },
            signature: {
                type: 'string',
                required: false,
            },
            docstring: {
                type: 'string',
                required: false,
            },
            visibility: {
                type: 'string',
                required: false,
                enum: ['public', 'private', 'protected'],
            },
            isExported: {
                type: 'boolean',
                required: false,
            },
            isDeprecated: {
                type: 'boolean',
                required: false,
            },
            location: {
                type: 'object',
                required: false,
            },
            extends: {
                type: 'string[]',
                required: false,
            },
            implements: {
                type: 'string[]',
                required: false,
            },
            methods: {
                type: 'string[]',
                required: false,
            },
            properties: {
                type: 'string[]',
                required: false,
            },
            isAbstract: {
                type: 'boolean',
                required: false,
            },
        },
        additionalIndices: [
            { properties: ['name'], type: 'RANGE' },
            { properties: ['isAbstract'], type: 'RANGE' },
        ],
    });
    // Interface Symbol Model
    const InterfaceSymbolModel = createEntityModel(neogma, {
        label: 'InterfaceSymbol',
        schema: {
            type: {
                type: 'string',
                required: true,
                enum: ['symbol'],
            },
            kind: {
                type: 'string',
                required: true,
                enum: ['interface'],
            },
            name: {
                type: 'string',
                required: true,
            },
            signature: {
                type: 'string',
                required: false,
            },
            docstring: {
                type: 'string',
                required: false,
            },
            visibility: {
                type: 'string',
                required: false,
                enum: ['public', 'private', 'protected'],
            },
            isExported: {
                type: 'boolean',
                required: false,
            },
            isDeprecated: {
                type: 'boolean',
                required: false,
            },
            location: {
                type: 'object',
                required: false,
            },
            extends: {
                type: 'string[]',
                required: false,
            },
            properties: {
                type: 'string[]',
                required: false,
            },
            methods: {
                type: 'string[]',
                required: false,
            },
        },
        additionalIndices: [{ properties: ['name'], type: 'RANGE' }],
    });
    // Test Entity Model
    const TestModel = createEntityModel(neogma, {
        label: 'Test',
        schema: {
            type: {
                type: 'string',
                required: true,
                enum: ['test'],
            },
            name: {
                type: 'string',
                required: true,
            },
            testType: {
                type: 'string',
                required: false,
                enum: ['unit', 'integration', 'e2e', 'performance'],
            },
            status: {
                type: 'string',
                required: false,
                enum: ['passing', 'failing', 'skipped', 'pending'],
            },
            coverage: {
                type: 'number',
                required: false,
                minimum: 0,
                maximum: 100,
            },
        },
        additionalIndices: [
            { properties: ['name'], type: 'RANGE' },
            { properties: ['testType'], type: 'RANGE' },
            { properties: ['status'], type: 'RANGE' },
        ],
    });
    // Specification Entity Model
    const SpecificationModel = createEntityModel(neogma, {
        label: 'Specification',
        schema: {
            type: {
                type: 'string',
                required: true,
                enum: ['specification'],
            },
            name: {
                type: 'string',
                required: true,
            },
            priority: {
                type: 'string',
                required: false,
                enum: ['low', 'medium', 'high', 'critical'],
            },
            status: {
                type: 'string',
                required: false,
                enum: ['draft', 'approved', 'implemented', 'deprecated'],
            },
            version: {
                type: 'string',
                required: false,
            },
        },
        additionalIndices: [
            { properties: ['name'], type: 'RANGE' },
            { properties: ['priority'], type: 'RANGE' },
            { properties: ['status'], type: 'RANGE' },
        ],
    });
    // Documentation Entity Model
    const DocumentationModel = createEntityModel(neogma, {
        label: 'Documentation',
        schema: {
            type: {
                type: 'string',
                required: true,
                enum: ['documentation'],
            },
            title: {
                type: 'string',
                required: true,
            },
            content: {
                type: 'string',
                required: false,
            },
            format: {
                type: 'string',
                required: false,
                enum: ['markdown', 'jsdoc', 'tsdoc', 'plain'],
            },
            tags: {
                type: 'string[]',
                required: false,
            },
        },
        additionalIndices: [
            { properties: ['title'], type: 'RANGE' },
            { properties: ['format'], type: 'RANGE' },
        ],
    });
    // Generic Entity Model (fallback for unknown types)
    const EntityModel = createEntityModel(neogma, {
        label: 'Entity',
        schema: {
            type: {
                type: 'string',
                required: false,
            },
            name: {
                type: 'string',
                required: false,
            },
            // Allow flexible additional properties
            properties: {
                type: 'object',
                required: false,
            },
        },
        additionalIndices: [{ properties: ['type'], type: 'RANGE' }],
    });
    return {
        FileModel,
        DirectoryModel,
        ModuleModel,
        SymbolModel,
        FunctionSymbolModel,
        ClassSymbolModel,
        InterfaceSymbolModel,
        TestModel,
        SpecificationModel,
        DocumentationModel,
        EntityModel,
    };
}
//# sourceMappingURL=EntityModels.js.map
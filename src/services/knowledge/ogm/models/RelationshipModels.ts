/**
 * Relationship Model Definitions for Neogma OGM
 * Maps domain relationships to Neo4j edge models
 */

import { Neogma } from 'neogma';
import { createRelationshipModel, BaseRelationshipSchema } from './BaseModels.js';
import { createEntityModels } from './EntityModels.js';
import { RelationshipType } from '../../../../models/relationships.js';

/**
 * Create all relationship models for the knowledge graph
 */
export function createRelationshipModels(neogma: Neogma) {
  const entityModels = createEntityModels(neogma);

  // Structural Relationships
  const ContainsRelation = createRelationshipModel(neogma, {
    label: RelationshipType.CONTAINS,
    sourceModel: entityModels.DirectoryModel,
    targetModel: entityModels.EntityModel,
  });

  const DefinesRelation = createRelationshipModel(neogma, {
    label: RelationshipType.DEFINES,
    sourceModel: entityModels.FileModel,
    targetModel: entityModels.SymbolModel,
  });

  const ExportsRelation = createRelationshipModel(neogma, {
    label: RelationshipType.EXPORTS,
    schema: {
      exportType: {
        type: 'string',
        required: false,
        enum: ['default', 'named', 'namespace'],
      },
      exportName: {
        type: 'string',
        required: false,
      },
    },
    sourceModel: entityModels.FileModel,
    targetModel: entityModels.SymbolModel,
  });

  const ImportsRelation = createRelationshipModel(neogma, {
    label: RelationshipType.IMPORTS,
    schema: {
      importType: {
        type: 'string',
        required: false,
        enum: ['default', 'named', 'namespace', 'side-effect', 'dynamic'],
      },
      specifiers: {
        type: 'string[]',
        required: false,
      },
      source: {
        type: 'string',
        required: false,
      },
    },
    sourceModel: entityModels.FileModel,
    targetModel: entityModels.EntityModel,
  });

  // Code Relationships
  const CallsRelation = createRelationshipModel(neogma, {
    label: RelationshipType.CALLS,
    schema: {
      callCount: {
        type: 'number',
        required: false,
        minimum: 0,
      },
      isAsync: {
        type: 'boolean',
        required: false,
      },
      callLocations: {
        type: 'object[]',
        required: false,
      },
    },
    sourceModel: entityModels.FunctionSymbolModel,
    targetModel: entityModels.FunctionSymbolModel,
  });

  const ReferencesRelation = createRelationshipModel(neogma, {
    label: RelationshipType.REFERENCES,
    schema: {
      referenceCount: {
        type: 'number',
        required: false,
        minimum: 0,
      },
      referenceType: {
        type: 'string',
        required: false,
        enum: ['read', 'write', 'call', 'type', 'import'],
      },
    },
    sourceModel: entityModels.SymbolModel,
    targetModel: entityModels.SymbolModel,
  });

  const ImplementsRelation = createRelationshipModel(neogma, {
    label: RelationshipType.IMPLEMENTS,
    sourceModel: entityModels.ClassSymbolModel,
    targetModel: entityModels.InterfaceSymbolModel,
  });

  const ExtendsRelation = createRelationshipModel(neogma, {
    label: RelationshipType.EXTENDS,
    sourceModel: entityModels.ClassSymbolModel,
    targetModel: entityModels.ClassSymbolModel,
  });

  const DependsOnRelation = createRelationshipModel(neogma, {
    label: RelationshipType.DEPENDS_ON,
    schema: {
      dependencyType: {
        type: 'string',
        required: false,
        enum: ['runtime', 'dev', 'peer', 'optional'],
      },
      version: {
        type: 'string',
        required: false,
      },
    },
    sourceModel: entityModels.EntityModel,
    targetModel: entityModels.EntityModel,
  });

  // Type Usage Relationships
  const TypeUsesRelation = createRelationshipModel(neogma, {
    label: RelationshipType.TYPE_USES,
    schema: {
      usageContext: {
        type: 'string',
        required: false,
        enum: ['parameter', 'return', 'property', 'extends', 'implements', 'generic'],
      },
    },
    sourceModel: entityModels.SymbolModel,
    targetModel: entityModels.SymbolModel,
  });

  const ReturnsTypeRelation = createRelationshipModel(neogma, {
    label: RelationshipType.RETURNS_TYPE,
    sourceModel: entityModels.FunctionSymbolModel,
    targetModel: entityModels.SymbolModel,
  });

  const ParamTypeRelation = createRelationshipModel(neogma, {
    label: RelationshipType.PARAM_TYPE,
    schema: {
      parameterName: {
        type: 'string',
        required: false,
      },
      parameterIndex: {
        type: 'number',
        required: false,
        minimum: 0,
      },
    },
    sourceModel: entityModels.FunctionSymbolModel,
    targetModel: entityModels.SymbolModel,
  });

  // Test Relationships
  const TestsRelation = createRelationshipModel(neogma, {
    label: RelationshipType.TESTS,
    schema: {
      testCount: {
        type: 'number',
        required: false,
        minimum: 0,
      },
      coverage: {
        type: 'number',
        required: false,
        minimum: 0,
        maximum: 100,
      },
    },
    sourceModel: entityModels.TestModel,
    targetModel: entityModels.EntityModel,
  });

  const ValidatesRelation = createRelationshipModel(neogma, {
    label: RelationshipType.VALIDATES,
    sourceModel: entityModels.TestModel,
    targetModel: entityModels.SpecificationModel,
  });

  // Spec Relationships
  const RequiresRelation = createRelationshipModel(neogma, {
    label: RelationshipType.REQUIRES,
    schema: {
      requirementType: {
        type: 'string',
        required: false,
        enum: ['functional', 'performance', 'security', 'compatibility'],
      },
      priority: {
        type: 'string',
        required: false,
        enum: ['low', 'medium', 'high', 'critical'],
      },
    },
    sourceModel: entityModels.SpecificationModel,
    targetModel: entityModels.EntityModel,
  });

  const ImpactsRelation = createRelationshipModel(neogma, {
    label: RelationshipType.IMPACTS,
    schema: {
      impactLevel: {
        type: 'string',
        required: false,
        enum: ['low', 'medium', 'high', 'critical'],
      },
      impactType: {
        type: 'string',
        required: false,
        enum: ['breaking', 'non-breaking', 'enhancement', 'bugfix'],
      },
    },
    sourceModel: entityModels.EntityModel,
    targetModel: entityModels.EntityModel,
  });

  const ImplementsSpecRelation = createRelationshipModel(neogma, {
    label: RelationshipType.IMPLEMENTS_SPEC,
    sourceModel: entityModels.EntityModel,
    targetModel: entityModels.SpecificationModel,
  });

  // Documentation Relationships
  const DocumentedByRelation = createRelationshipModel(neogma, {
    label: RelationshipType.DOCUMENTED_BY,
    sourceModel: entityModels.EntityModel,
    targetModel: entityModels.DocumentationModel,
  });

  const DocumentsSectionRelation = createRelationshipModel(neogma, {
    label: RelationshipType.DOCUMENTS_SECTION,
    schema: {
      sectionName: {
        type: 'string',
        required: false,
      },
      sectionOrder: {
        type: 'number',
        required: false,
        minimum: 0,
      },
    },
    sourceModel: entityModels.DocumentationModel,
    targetModel: entityModels.EntityModel,
  });

  // Temporal/History Relationships
  const PreviousVersionRelation = createRelationshipModel(neogma, {
    label: RelationshipType.PREVIOUS_VERSION,
    schema: {
      versionNumber: {
        type: 'string',
        required: false,
      },
      changeType: {
        type: 'string',
        required: false,
        enum: ['major', 'minor', 'patch', 'refactor'],
      },
    },
    sourceModel: entityModels.EntityModel,
    targetModel: entityModels.EntityModel,
  });

  const ModifiedByRelation = createRelationshipModel(neogma, {
    label: RelationshipType.MODIFIED_BY,
    schema: {
      modificationTime: {
        type: 'datetime',
        required: false,
      },
      changeDescription: {
        type: 'string',
        required: false,
      },
    },
    sourceModel: entityModels.EntityModel,
    targetModel: entityModels.EntityModel,
  });

  return {
    // Structural
    ContainsRelation,
    DefinesRelation,
    ExportsRelation,
    ImportsRelation,
    // Code
    CallsRelation,
    ReferencesRelation,
    ImplementsRelation,
    ExtendsRelation,
    DependsOnRelation,
    // Type Usage
    TypeUsesRelation,
    ReturnsTypeRelation,
    ParamTypeRelation,
    // Test
    TestsRelation,
    ValidatesRelation,
    // Spec
    RequiresRelation,
    ImpactsRelation,
    ImplementsSpecRelation,
    // Documentation
    DocumentedByRelation,
    DocumentsSectionRelation,
    // Temporal
    PreviousVersionRelation,
    ModifiedByRelation,
  };
}
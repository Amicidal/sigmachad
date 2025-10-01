/**
 * Unit tests for models/relationships.ts
 * Tests relationship types, interfaces, and validation logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Base interfaces and enums
  Relationship,
  RelationshipType,

  // Specific relationship interfaces
  StructuralRelationship,
  CodeRelationship,
  TestRelationship,
  SpecRelationship,
  TemporalRelationship,
  DocumentationRelationship,
  SecurityRelationship,
  PerformanceRelationship,

  // Union type
  GraphRelationship,

  // Query interfaces
  RelationshipQuery,
  RelationshipFilter,

  // Path finding interfaces
  PathQuery,
  PathResult,

  // Traversal interfaces
  TraversalQuery,
  TraversalResult,

  // Impact analysis interfaces
  ImpactQuery,
  ImpactResult,
} from '@memento/shared-types';

describe('Relationship Types and Enums', () => {
  describe('RelationshipType Enum', () => {
    it('should contain all structural relationship types', () => {
      expect(RelationshipType.CONTAINS).toBe('CONTAINS');
      expect(RelationshipType.DEFINES).toBe('DEFINES');
      expect(RelationshipType.EXPORTS).toBe('EXPORTS');
      expect(RelationshipType.IMPORTS).toBe('IMPORTS');
    });

    it('should contain all code relationship types', () => {
      expect(RelationshipType.CALLS).toBe('CALLS');
      expect(RelationshipType.REFERENCES).toBe('REFERENCES');
      expect(RelationshipType.IMPLEMENTS).toBe('IMPLEMENTS');
      expect(RelationshipType.EXTENDS).toBe('EXTENDS');
      expect(RelationshipType.DEPENDS_ON).toBe('DEPENDS_ON');
      expect(RelationshipType.TYPE_USES).toBe('TYPE_USES');
    });

    it('should contain all test relationship types', () => {
      expect(RelationshipType.TESTS).toBe('TESTS');
      expect(RelationshipType.VALIDATES).toBe('VALIDATES');
    });

    it('should contain all spec relationship types', () => {
      expect(RelationshipType.REQUIRES).toBe('REQUIRES');
      expect(RelationshipType.IMPACTS).toBe('IMPACTS');
      expect(RelationshipType.IMPLEMENTS_SPEC).toBe('IMPLEMENTS_SPEC');
    });

    it('should contain all temporal relationship types', () => {
      expect(RelationshipType.PREVIOUS_VERSION).toBe('PREVIOUS_VERSION');
      expect(RelationshipType.MODIFIED_BY).toBe('MODIFIED_BY');
      expect(RelationshipType.CREATED_IN).toBe('CREATED_IN');
      expect(RelationshipType.MODIFIED_IN).toBe('MODIFIED_IN');
      expect(RelationshipType.REMOVED_IN).toBe('REMOVED_IN');
      expect(RelationshipType.OF).toBe('OF');
    });

    it('should contain all documentation relationship types', () => {
      expect(RelationshipType.DESCRIBES_DOMAIN).toBe('DESCRIBES_DOMAIN');
      expect(RelationshipType.BELONGS_TO_DOMAIN).toBe('BELONGS_TO_DOMAIN');
      expect(RelationshipType.DOCUMENTED_BY).toBe('DOCUMENTED_BY');
      expect(RelationshipType.CLUSTER_MEMBER).toBe('CLUSTER_MEMBER');
      expect(RelationshipType.DOMAIN_RELATED).toBe('DOMAIN_RELATED');
    });

    it('should contain all security relationship types', () => {
      expect(RelationshipType.HAS_SECURITY_ISSUE).toBe('HAS_SECURITY_ISSUE');
      expect(RelationshipType.DEPENDS_ON_VULNERABLE).toBe('DEPENDS_ON_VULNERABLE');
      expect(RelationshipType.SECURITY_IMPACTS).toBe('SECURITY_IMPACTS');
    });

    it('should contain all performance relationship types', () => {
      expect(RelationshipType.PERFORMANCE_IMPACT).toBe('PERFORMANCE_IMPACT');
      expect(RelationshipType.PERFORMANCE_REGRESSION).toBe('PERFORMANCE_REGRESSION');
    });

    it('should have correct enum structure', () => {
      const allTypes = Object.values(RelationshipType);
      expect(allTypes.length).toBeGreaterThanOrEqual(40);

      // Ensure all values are strings
      allTypes.forEach(type => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('Base Relationship Interface', () => {
  let testDate: Date;
  let baseRelationship: Relationship;

  beforeEach(() => {
    testDate = new Date('2024-01-01T00:00:00Z');
    baseRelationship = {
      id: 'rel-123',
      fromEntityId: 'entity-a',
      toEntityId: 'entity-b',
      type: RelationshipType.DEPENDS_ON,
      created: testDate,
      lastModified: testDate,
      version: 1,
    };
  });

  it('should create a valid base Relationship', () => {
    expect(baseRelationship.id).toBe('rel-123');
    expect(baseRelationship.fromEntityId).toBe('entity-a');
    expect(baseRelationship.toEntityId).toBe('entity-b');
    expect(baseRelationship.type).toBe(RelationshipType.DEPENDS_ON);
    expect(baseRelationship.created).toEqual(testDate);
    expect(baseRelationship.lastModified).toEqual(testDate);
    expect(baseRelationship.version).toBe(1);
  });

  it('should handle optional metadata', () => {
    const relationshipWithMetadata: Relationship = {
      ...baseRelationship,
      metadata: {
        confidence: 0.85,
        source: 'static-analysis',
        context: 'import-statement',
      },
    };

    expect(relationshipWithMetadata.metadata).toEqual({
      confidence: 0.85,
      source: 'static-analysis',
      context: 'import-statement',
    });
  });

  it('should handle version increments', () => {
    const updatedRelationship: Relationship = {
      ...baseRelationship,
      version: 2,
      lastModified: new Date(testDate.getTime() + 1000),
    };

    expect(updatedRelationship.version).toBe(2);
    expect(updatedRelationship.lastModified.getTime()).toBeGreaterThan(testDate.getTime());
  });

  it('should handle different relationship types', () => {
    const relationshipTypes = [
      RelationshipType.BELONGS_TO,
      RelationshipType.CALLS,
      RelationshipType.TESTS,
      RelationshipType.REQUIRES,
      RelationshipType.PREVIOUS_VERSION,
      RelationshipType.DESCRIBES_DOMAIN,
      RelationshipType.HAS_SECURITY_ISSUE,
      RelationshipType.PERFORMANCE_IMPACT,
    ];

    relationshipTypes.forEach(type => {
      const relationship: Relationship = {
        ...baseRelationship,
        type,
        id: `rel-${type}`,
      };

      expect(relationship.type).toBe(type);
    });
  });
});

describe('Structural Relationship Interface', () => {
  let testDate: Date;
  let structuralRelationship: StructuralRelationship;

  beforeEach(() => {
    testDate = new Date('2024-01-01T00:00:00Z');
    structuralRelationship = {
      id: 'struct-rel-123',
      fromEntityId: 'file-a.ts',
      toEntityId: 'module-x',
      type: RelationshipType.BELONGS_TO,
      created: testDate,
      lastModified: testDate,
      version: 1,
    };
  });

  it('should create a valid StructuralRelationship', () => {
    expect(structuralRelationship.type).toBe(RelationshipType.BELONGS_TO);
    expect(structuralRelationship.id).toBe('struct-rel-123');
    expect(structuralRelationship.fromEntityId).toBe('file-a.ts');
    expect(structuralRelationship.toEntityId).toBe('module-x');
  });

  it('should accept all structural relationship types', () => {
    const structuralTypes: Array<RelationshipType.BELONGS_TO | RelationshipType.CONTAINS | RelationshipType.DEFINES | RelationshipType.EXPORTS | RelationshipType.IMPORTS> = [
      RelationshipType.BELONGS_TO,
      RelationshipType.CONTAINS,
      RelationshipType.DEFINES,
      RelationshipType.EXPORTS,
      RelationshipType.IMPORTS,
    ];

    structuralTypes.forEach(type => {
      const relationship: StructuralRelationship = {
        ...structuralRelationship,
        type,
        id: `struct-${type}`,
      };

      expect(relationship.type).toBe(type);
    });
  });

  it('should handle file-to-module relationships', () => {
    const fileToModule: StructuralRelationship = {
      ...structuralRelationship,
      type: RelationshipType.BELONGS_TO,
      fromEntityId: 'src/utils/helpers.ts',
      toEntityId: 'utils-module',
    };

    expect(fileToModule.fromEntityId).toBe('src/utils/helpers.ts');
    expect(fileToModule.toEntityId).toBe('utils-module');
  });

  it('should handle directory containment relationships', () => {
    const directoryContains: StructuralRelationship = {
      ...structuralRelationship,
      type: RelationshipType.CONTAINS,
      fromEntityId: 'src/components',
      toEntityId: 'Button.tsx',
    };

    expect(directoryContains.type).toBe(RelationshipType.CONTAINS);
    expect(directoryContains.fromEntityId).toBe('src/components');
    expect(directoryContains.toEntityId).toBe('Button.tsx');
  });
});

describe('Code Relationship Interface', () => {
  let testDate: Date;
  let codeRelationship: CodeRelationship;

  beforeEach(() => {
    testDate = new Date('2024-01-01T00:00:00Z');
    codeRelationship = {
      id: 'code-rel-123',
      fromEntityId: 'function-a',
      toEntityId: 'function-b',
      type: RelationshipType.CALLS,
      created: testDate,
      lastModified: testDate,
      version: 1,
      confidence: 0.8,
      context: 'direct function call',
    };
  });

  it('should create a valid CodeRelationship', () => {
    expect(codeRelationship.type).toBe(RelationshipType.CALLS);
    expect(codeRelationship.confidence).toBe(0.8);
    expect(codeRelationship.context).toBe('direct function call');
  });

  it('should accept all code relationship types', () => {
    const codeTypes: Array<RelationshipType.CALLS | RelationshipType.REFERENCES | RelationshipType.IMPLEMENTS | RelationshipType.EXTENDS | RelationshipType.DEPENDS_ON | RelationshipType.TYPE_USES> = [
      RelationshipType.CALLS,
      RelationshipType.REFERENCES,
      RelationshipType.IMPLEMENTS,
      RelationshipType.EXTENDS,
      RelationshipType.DEPENDS_ON,
      RelationshipType.TYPE_USES,
    ];

    codeTypes.forEach(type => {
      const relationship: CodeRelationship = {
        ...codeRelationship,
        type,
        id: `code-${type}`,
      };

      expect(relationship.type).toBe(type);
    });
  });

  it('should handle function call relationships', () => {
    const functionCall: CodeRelationship = {
      ...codeRelationship,
      type: RelationshipType.CALLS,
      fromEntityId: 'UserService.createUser',
      toEntityId: 'Database.save',
      confidence: 1.0,
      context: 'synchronous call',
    };

    expect(functionCall.confidence).toBe(1.0);
    expect(functionCall.context).toBe('synchronous call');
  });

  it('should handle inheritance relationships', () => {
    const extendsRelationship: CodeRelationship = {
      ...codeRelationship,
      type: RelationshipType.EXTENDS,
      fromEntityId: 'UserController',
      toEntityId: 'BaseController',
      confidence: 1.0,
      context: 'class inheritance',
    };

    expect(extendsRelationship.type).toBe(RelationshipType.EXTENDS);
    expect(extendsRelationship.confidence).toBe(1.0);
  });

  it('should handle confidence values correctly', () => {
    const weakRelationship: CodeRelationship = {
      ...codeRelationship,
      confidence: 0.2,
    };

    const strongRelationship: CodeRelationship = {
      ...codeRelationship,
      confidence: 0.95,
    };

    expect(weakRelationship.confidence).toBe(0.2);
    expect(strongRelationship.confidence).toBe(0.95);
  });

  it('should handle optional confidence and context', () => {
    const minimalRelationship: CodeRelationship = {
      ...codeRelationship,
      confidence: undefined,
      context: undefined,
    };

    expect(minimalRelationship.confidence).toBeUndefined();
    expect(minimalRelationship.context).toBeUndefined();
  });
});

describe('Test Relationship Interface', () => {
  let testDate: Date;
  let testRelationship: TestRelationship;

  beforeEach(() => {
    testDate = new Date('2024-01-01T00:00:00Z');
    testRelationship = {
      id: 'test-rel-123',
      fromEntityId: 'UserService.test.ts',
      toEntityId: 'UserService.createUser',
      type: RelationshipType.TESTS,
      created: testDate,
      lastModified: testDate,
      version: 1,
      testType: 'unit',
      coverage: 85,
    };
  });

  it('should create a valid TestRelationship', () => {
    expect(testRelationship.type).toBe(RelationshipType.TESTS);
    expect(testRelationship.testType).toBe('unit');
    expect(testRelationship.coverage).toBe(85);
  });

  it('should accept all test relationship types', () => {
    const testTypes: Array<RelationshipType.TESTS | RelationshipType.VALIDATES | RelationshipType.LOCATED_IN> = [
      RelationshipType.TESTS,
      RelationshipType.VALIDATES,
      RelationshipType.LOCATED_IN,
    ];

    testTypes.forEach(type => {
      const relationship: TestRelationship = {
        ...testRelationship,
        type,
        id: `test-${type}`,
      };

      expect(relationship.type).toBe(type);
    });
  });

  it('should handle different test types', () => {
    const testTypes: Array<'unit' | 'integration' | 'e2e'> = ['unit', 'integration', 'e2e'];

    testTypes.forEach(testType => {
      const relationship: TestRelationship = {
        ...testRelationship,
        testType,
        id: `test-${testType}`,
      };

      expect(relationship.testType).toBe(testType);
    });
  });

  it('should handle coverage percentages', () => {
    const fullCoverage: TestRelationship = {
      ...testRelationship,
      coverage: 100,
    };

    const partialCoverage: TestRelationship = {
      ...testRelationship,
      coverage: 67.5,
    };

    expect(fullCoverage.coverage).toBe(100);
    expect(partialCoverage.coverage).toBe(67.5);
  });

  it('should handle optional testType and coverage', () => {
    const minimalTestRelationship: TestRelationship = {
      ...testRelationship,
      testType: undefined,
      coverage: undefined,
    };

    expect(minimalTestRelationship.testType).toBeUndefined();
    expect(minimalTestRelationship.coverage).toBeUndefined();
  });
});

describe('Spec Relationship Interface', () => {
  let testDate: Date;
  let specRelationship: SpecRelationship;

  beforeEach(() => {
    testDate = new Date('2024-01-01T00:00:00Z');
    specRelationship = {
      id: 'spec-rel-123',
      fromEntityId: 'user-registration-spec',
      toEntityId: 'UserService',
      type: RelationshipType.REQUIRES,
      created: testDate,
      lastModified: testDate,
      version: 1,
      impactLevel: 'high',
      priority: 'critical',
    };
  });

  it('should create a valid SpecRelationship', () => {
    expect(specRelationship.type).toBe(RelationshipType.REQUIRES);
    expect(specRelationship.impactLevel).toBe('high');
    expect(specRelationship.priority).toBe('critical');
  });

  it('should accept all spec relationship types', () => {
    const specTypes: Array<RelationshipType.REQUIRES | RelationshipType.IMPACTS | RelationshipType.LINKED_TO> = [
      RelationshipType.REQUIRES,
      RelationshipType.IMPACTS,
      RelationshipType.LINKED_TO,
    ];

    specTypes.forEach(type => {
      const relationship: SpecRelationship = {
        ...specRelationship,
        type,
        id: `spec-${type}`,
      };

      expect(relationship.type).toBe(type);
    });
  });

  it('should handle different impact levels', () => {
    const impactLevels: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];

    impactLevels.forEach(level => {
      const relationship: SpecRelationship = {
        ...specRelationship,
        impactLevel: level,
        id: `spec-impact-${level}`,
      };

      expect(relationship.impactLevel).toBe(level);
    });
  });

  it('should handle different priorities', () => {
    const priorities: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];

    priorities.forEach(priority => {
      const relationship: SpecRelationship = {
        ...specRelationship,
        priority,
        id: `spec-priority-${priority}`,
      };

      expect(relationship.priority).toBe(priority);
    });
  });

  it('should handle optional impactLevel and priority', () => {
    const minimalSpecRelationship: SpecRelationship = {
      ...specRelationship,
      impactLevel: undefined,
      priority: undefined,
    };

    expect(minimalSpecRelationship.impactLevel).toBeUndefined();
    expect(minimalSpecRelationship.priority).toBeUndefined();
  });
});

describe('Temporal Relationship Interface', () => {
  let testDate: Date;
  let temporalRelationship: TemporalRelationship;

  beforeEach(() => {
    testDate = new Date('2024-01-01T00:00:00Z');
    temporalRelationship = {
      id: 'temporal-rel-123',
      fromEntityId: 'UserService.v2',
      toEntityId: 'UserService.v1',
      type: RelationshipType.PREVIOUS_VERSION,
      created: testDate,
      lastModified: testDate,
      version: 1,
      changeType: 'update',
      author: 'john.doe@example.com',
      commitHash: 'abc123def456',
    };
  });

  it('should create a valid TemporalRelationship', () => {
    expect(temporalRelationship.type).toBe(RelationshipType.PREVIOUS_VERSION);
    expect(temporalRelationship.changeType).toBe('update');
    expect(temporalRelationship.author).toBe('john.doe@example.com');
    expect(temporalRelationship.commitHash).toBe('abc123def456');
  });

  it('should accept all temporal relationship types', () => {
    const temporalTypes: Array<RelationshipType.PREVIOUS_VERSION | RelationshipType.CHANGED_AT | RelationshipType.MODIFIED_BY | RelationshipType.CREATED_IN | RelationshipType.INTRODUCED_IN | RelationshipType.MODIFIED_IN | RelationshipType.REMOVED_IN> = [
      RelationshipType.PREVIOUS_VERSION,
      RelationshipType.CHANGED_AT,
      RelationshipType.MODIFIED_BY,
      RelationshipType.CREATED_IN,
      RelationshipType.INTRODUCED_IN,
      RelationshipType.MODIFIED_IN,
      RelationshipType.REMOVED_IN,
    ];

    temporalTypes.forEach(type => {
      const relationship: TemporalRelationship = {
        ...temporalRelationship,
        type,
        id: `temporal-${type}`,
      };

      expect(relationship.type).toBe(type);
    });
  });

  it('should handle different change types', () => {
    const changeTypes: Array<'create' | 'update' | 'delete' | 'rename' | 'move'> = ['create', 'update', 'delete', 'rename', 'move'];

    changeTypes.forEach(changeType => {
      const relationship: TemporalRelationship = {
        ...temporalRelationship,
        changeType,
        id: `temporal-change-${changeType}`,
      };

      expect(relationship.changeType).toBe(changeType);
    });
  });

  it('should handle version tracking', () => {
    const versionRelationship: TemporalRelationship = {
      ...temporalRelationship,
      type: RelationshipType.PREVIOUS_VERSION,
      fromEntityId: 'UserService.v3',
      toEntityId: 'UserService.v2',
      changeType: 'update',
      commitHash: 'def789ghi012',
    };

    expect(versionRelationship.fromEntityId).toBe('UserService.v3');
    expect(versionRelationship.toEntityId).toBe('UserService.v2');
    expect(versionRelationship.changeType).toBe('update');
  });

  it('should handle optional author and commitHash', () => {
    const anonymousRelationship: TemporalRelationship = {
      ...temporalRelationship,
      author: undefined,
      commitHash: undefined,
    };

    expect(anonymousRelationship.author).toBeUndefined();
    expect(anonymousRelationship.commitHash).toBeUndefined();
  });
});

describe('Documentation Relationship Interface', () => {
  let testDate: Date;
  let docRelationship: DocumentationRelationship;

  beforeEach(() => {
    testDate = new Date('2024-01-01T00:00:00Z');
    docRelationship = {
      id: 'doc-rel-123',
      fromEntityId: 'API-Documentation.md',
      toEntityId: 'user-management-domain',
      type: RelationshipType.DESCRIBES_DOMAIN,
      created: testDate,
      lastModified: testDate,
      version: 1,
      confidence: 0.9,
      inferred: false,
      source: 'README.md:15',
    };
  });

  it('should create a valid DocumentationRelationship', () => {
    expect(docRelationship.type).toBe(RelationshipType.DESCRIBES_DOMAIN);
    expect(docRelationship.confidence).toBe(0.9);
    expect(docRelationship.inferred).toBe(false);
    expect(docRelationship.source).toBe('README.md:15');
  });

  it('should accept all documentation relationship types', () => {
    const docTypes: Array<RelationshipType.DESCRIBES_DOMAIN | RelationshipType.BELONGS_TO_DOMAIN | RelationshipType.DOCUMENTED_BY | RelationshipType.CLUSTER_MEMBER | RelationshipType.DOMAIN_RELATED> = [
      RelationshipType.DESCRIBES_DOMAIN,
      RelationshipType.BELONGS_TO_DOMAIN,
      RelationshipType.DOCUMENTED_BY,
      RelationshipType.CLUSTER_MEMBER,
      RelationshipType.DOMAIN_RELATED,
    ];

    docTypes.forEach(type => {
      const relationship: DocumentationRelationship = {
        ...docRelationship,
        type,
        id: `doc-${type}`,
      };

      expect(relationship.type).toBe(type);
    });
  });

  it('should handle confidence scores', () => {
    const highConfidence: DocumentationRelationship = {
      ...docRelationship,
      confidence: 0.95,
    };

    const lowConfidence: DocumentationRelationship = {
      ...docRelationship,
      confidence: 0.3,
    };

    expect(highConfidence.confidence).toBe(0.95);
    expect(lowConfidence.confidence).toBe(0.3);
  });

  it('should handle inferred vs explicit relationships', () => {
    const explicitRelationship: DocumentationRelationship = {
      ...docRelationship,
      inferred: false,
      source: 'explicit-reference',
    };

    const inferredRelationship: DocumentationRelationship = {
      ...docRelationship,
      inferred: true,
      source: 'ai-inference',
    };

    expect(explicitRelationship.inferred).toBe(false);
    expect(inferredRelationship.inferred).toBe(true);
  });

  it('should handle optional confidence, inferred, and source', () => {
    const minimalDocRelationship: DocumentationRelationship = {
      ...docRelationship,
      confidence: undefined,
      inferred: undefined,
      source: undefined,
    };

    expect(minimalDocRelationship.confidence).toBeUndefined();
    expect(minimalDocRelationship.inferred).toBeUndefined();
    expect(minimalDocRelationship.source).toBeUndefined();
  });
});

describe('Security Relationship Interface', () => {
  let testDate: Date;
  let securityRelationship: SecurityRelationship;

  beforeEach(() => {
    testDate = new Date('2024-01-01T00:00:00Z');
    securityRelationship = {
      id: 'sec-rel-123',
      fromEntityId: 'UserService',
      toEntityId: 'security-issue-456',
      type: RelationshipType.HAS_SECURITY_ISSUE,
      created: testDate,
      lastModified: testDate,
      version: 1,
      severity: 'high',
      status: 'open',
      cvssScore: 7.5,
    };
  });

  it('should create a valid SecurityRelationship', () => {
    expect(securityRelationship.type).toBe(RelationshipType.HAS_SECURITY_ISSUE);
    expect(securityRelationship.severity).toBe('high');
    expect(securityRelationship.status).toBe('open');
    expect(securityRelationship.cvssScore).toBe(7.5);
  });

  it('should accept all security relationship types', () => {
    const securityTypes: Array<RelationshipType.HAS_SECURITY_ISSUE | RelationshipType.DEPENDS_ON_VULNERABLE | RelationshipType.SECURITY_IMPACTS> = [
      RelationshipType.HAS_SECURITY_ISSUE,
      RelationshipType.DEPENDS_ON_VULNERABLE,
      RelationshipType.SECURITY_IMPACTS,
    ];

    securityTypes.forEach(type => {
      const relationship: SecurityRelationship = {
        ...securityRelationship,
        type,
        id: `sec-${type}`,
      };

      expect(relationship.type).toBe(type);
    });
  });

  it('should handle different severity levels', () => {
    const severities: Array<'critical' | 'high' | 'medium' | 'low' | 'info'> = ['critical', 'high', 'medium', 'low', 'info'];

    severities.forEach(severity => {
      const relationship: SecurityRelationship = {
        ...securityRelationship,
        severity,
        id: `sec-severity-${severity}`,
      };

      expect(relationship.severity).toBe(severity);
    });
  });

  it('should handle different security statuses', () => {
    const statuses: Array<'open' | 'fixed' | 'accepted' | 'false-positive'> = ['open', 'fixed', 'accepted', 'false-positive'];

    statuses.forEach(status => {
      const relationship: SecurityRelationship = {
        ...securityRelationship,
        status,
        id: `sec-status-${status}`,
      };

      expect(relationship.status).toBe(status);
    });
  });

  it('should handle CVSS scores', () => {
    const criticalVuln: SecurityRelationship = {
      ...securityRelationship,
      severity: 'critical',
      cvssScore: 9.8,
    };

    const lowRisk: SecurityRelationship = {
      ...securityRelationship,
      severity: 'low',
      cvssScore: 2.1,
    };

    expect(criticalVuln.cvssScore).toBe(9.8);
    expect(lowRisk.cvssScore).toBe(2.1);
  });

  it('should handle optional severity, status, and cvssScore', () => {
    const minimalSecurityRelationship: SecurityRelationship = {
      ...securityRelationship,
      severity: undefined,
      status: undefined,
      cvssScore: undefined,
    };

    expect(minimalSecurityRelationship.severity).toBeUndefined();
    expect(minimalSecurityRelationship.status).toBeUndefined();
    expect(minimalSecurityRelationship.cvssScore).toBeUndefined();
  });
});

describe('Performance Relationship Interface', () => {
  let testDate: Date;
  let performanceRelationship: PerformanceRelationship;

  beforeEach(() => {
    testDate = new Date('2024-01-01T00:00:00Z');
    performanceRelationship = {
      id: 'perf-rel-123',
      fromEntityId: 'UserService.createUser',
      toEntityId: 'performance-metric-456',
      type: RelationshipType.PERFORMANCE_IMPACT,
      created: testDate,
      lastModified: testDate,
      version: 1,
      metricId: 'test/user-service/latency/p95',
      scenario: 'test-suite',
      environment: 'test',
      baselineValue: 120,
      currentValue: 180,
      delta: 60,
      percentChange: 50,
      unit: 'ms',
      sampleSize: 8,
      confidenceInterval: { lower: 110, upper: 190 },
      trend: 'degrading',
      severity: 'high',
      riskScore: 1.5,
      runId: 'run-123',
      detectedAt: testDate,
      metricsHistory: [
        {
          value: 120,
          timestamp: testDate,
          environment: 'test',
          unit: 'ms',
        },
        {
          value: 180,
          timestamp: new Date('2024-01-02T00:00:00Z'),
          environment: 'test',
          unit: 'ms',
        },
      ],
      evidence: [
        {
          source: 'heuristic',
          note: 'Latency regression detected',
        },
      ],
      metadata: {
        reason: 'Latency regression detected',
        metrics: [
          { id: 'averageExecutionTime', value: 120, unit: 'ms' },
          { id: 'p95ExecutionTime', value: 180, unit: 'ms' },
        ],
      },
    };
  });

  it('should create a valid PerformanceRelationship', () => {
    expect(performanceRelationship.type).toBe(RelationshipType.PERFORMANCE_IMPACT);
    expect(performanceRelationship.metricId).toBe('test/user-service/latency/p95');
    expect(performanceRelationship.currentValue).toBe(180);
    expect(performanceRelationship.trend).toBe('regression');
    expect(performanceRelationship.severity).toBe('high');
  });

  it('should accept all performance relationship types', () => {
    const performanceTypes: Array<RelationshipType.PERFORMANCE_IMPACT | RelationshipType.PERFORMANCE_REGRESSION> = [
      RelationshipType.PERFORMANCE_IMPACT,
      RelationshipType.PERFORMANCE_REGRESSION,
    ];

    performanceTypes.forEach(type => {
      const relationship: PerformanceRelationship = {
        ...performanceRelationship,
        type,
        id: `perf-${type}`,
      };

      expect(relationship.type).toBe(type);
    });
  });

  it('should handle optional performance metrics', () => {
    const minimalPerformanceRelationship: PerformanceRelationship = {
      ...performanceRelationship,
      baselineValue: undefined,
      currentValue: undefined,
      delta: undefined,
      percentChange: undefined,
      metricsHistory: undefined,
    };

    expect(minimalPerformanceRelationship.baselineValue).toBeUndefined();
    expect(minimalPerformanceRelationship.currentValue).toBeUndefined();
    expect(minimalPerformanceRelationship.delta).toBeUndefined();
    expect(minimalPerformanceRelationship.metricsHistory).toBeUndefined();
  });
});

describe('Query and Filter Interfaces', () => {
  describe('RelationshipQuery', () => {
    it('should create a valid RelationshipQuery', () => {
      const query: RelationshipQuery = {
        fromEntityId: 'entity-a',
        toEntityId: 'entity-b',
        type: RelationshipType.DEPENDS_ON,
        entityTypes: ['file', 'module'],
        since: new Date('2024-01-01'),
        until: new Date('2024-12-31'),
        limit: 100,
        offset: 0,
      };

      expect(query.fromEntityId).toBe('entity-a');
      expect(query.toEntityId).toBe('entity-b');
      expect(query.type).toBe(RelationshipType.DEPENDS_ON);
      expect(query.entityTypes).toEqual(['file', 'module']);
      expect(query.limit).toBe(100);
      expect(query.offset).toBe(0);
    });

    it('should handle array of relationship types', () => {
      const query: RelationshipQuery = {
        type: [RelationshipType.DEPENDS_ON, RelationshipType.TYPE_USES],
      };

      expect(query.type).toEqual([RelationshipType.DEPENDS_ON, RelationshipType.TYPE_USES]);
    });

    it('should handle optional fields', () => {
      const minimalQuery: RelationshipQuery = {
        fromEntityId: 'entity-a',
      };

      expect(minimalQuery.fromEntityId).toBe('entity-a');
      expect(minimalQuery.toEntityId).toBeUndefined();
      expect(minimalQuery.type).toBeUndefined();
      expect(minimalQuery.limit).toBeUndefined();
      expect(minimalQuery.offset).toBeUndefined();
    });
  });

  describe('RelationshipFilter', () => {
    it('should create a valid RelationshipFilter', () => {
      const filter: RelationshipFilter = {
        types: [RelationshipType.DEPENDS_ON, RelationshipType.TYPE_USES],
        directions: ['outgoing', 'incoming'],
        depths: [1, 2, 3],
        weights: {
          min: 0.5,
          max: 0.9,
        },
      };

      expect(filter.types).toEqual([RelationshipType.DEPENDS_ON, RelationshipType.TYPE_USES]);
      expect(filter.directions).toEqual(['outgoing', 'incoming']);
      expect(filter.depths).toEqual([1, 2, 3]);
      expect(filter.weights?.min).toBe(0.5);
      expect(filter.weights?.max).toBe(0.9);
    });

    it('should handle partial weight filters', () => {
      const minOnlyFilter: RelationshipFilter = {
        weights: { min: 0.3 },
      };

      const maxOnlyFilter: RelationshipFilter = {
        weights: { max: 0.8 },
      };

      expect(minOnlyFilter.weights?.min).toBe(0.3);
      expect(minOnlyFilter.weights?.max).toBeUndefined();
      expect(maxOnlyFilter.weights?.max).toBe(0.8);
      expect(maxOnlyFilter.weights?.min).toBeUndefined();
    });

    it('should handle empty arrays', () => {
      const emptyFilter: RelationshipFilter = {
        types: [],
        directions: [],
        depths: [],
      };

      expect(emptyFilter.types).toEqual([]);
      expect(emptyFilter.directions).toEqual([]);
      expect(emptyFilter.depths).toEqual([]);
    });
  });
});

describe('Path Finding and Traversal Interfaces', () => {
  describe('PathQuery', () => {
    it('should create a valid PathQuery', () => {
      const pathQuery: PathQuery = {
        startEntityId: 'entity-a',
        endEntityId: 'entity-z',
        relationshipTypes: [RelationshipType.DEPENDS_ON, RelationshipType.TYPE_USES],
        maxDepth: 5,
        direction: 'outgoing',
      };

      expect(pathQuery.startEntityId).toBe('entity-a');
      expect(pathQuery.endEntityId).toBe('entity-z');
      expect(pathQuery.relationshipTypes).toEqual([RelationshipType.DEPENDS_ON, RelationshipType.TYPE_USES]);
      expect(pathQuery.maxDepth).toBe(5);
      expect(pathQuery.direction).toBe('outgoing');
    });

    it('should handle optional endEntityId', () => {
      const openEndedQuery: PathQuery = {
        startEntityId: 'entity-a',
        maxDepth: 3,
        direction: 'both',
      };

      expect(openEndedQuery.endEntityId).toBeUndefined();
      expect(openEndedQuery.maxDepth).toBe(3);
      expect(openEndedQuery.direction).toBe('both');
    });

    it('should handle different directions', () => {
      const directions: Array<'outgoing' | 'incoming' | 'both'> = ['outgoing', 'incoming', 'both'];

      directions.forEach(direction => {
        const query: PathQuery = {
          startEntityId: 'entity-a',
          direction,
        };

        expect(query.direction).toBe(direction);
      });
    });
  });

  describe('PathResult', () => {
    it('should create a valid PathResult', () => {
      const pathResult: PathResult = {
        path: [
          {
            id: 'rel-1',
            fromEntityId: 'a',
            toEntityId: 'b',
            type: RelationshipType.DEPENDS_ON,
            created: new Date(),
            lastModified: new Date(),
            version: 1,
          },
          {
            id: 'rel-2',
            fromEntityId: 'b',
            toEntityId: 'c',
            type: RelationshipType.TYPE_USES,
            created: new Date(),
            lastModified: new Date(),
            version: 1,
          },
        ],
        totalLength: 2,
        relationshipTypes: [RelationshipType.DEPENDS_ON, RelationshipType.TYPE_USES],
        entities: ['a', 'b', 'c'],
      };

      expect(pathResult.path).toHaveLength(2);
      expect(pathResult.totalLength).toBe(2);
      expect(pathResult.relationshipTypes).toEqual([RelationshipType.DEPENDS_ON, RelationshipType.TYPE_USES]);
      expect(pathResult.entities).toEqual(['a', 'b', 'c']);
    });

    it('should handle empty paths', () => {
      const emptyPathResult: PathResult = {
        path: [],
        totalLength: 0,
        relationshipTypes: [],
        entities: ['a'],
      };

      expect(emptyPathResult.path).toEqual([]);
      expect(emptyPathResult.totalLength).toBe(0);
      expect(emptyPathResult.relationshipTypes).toEqual([]);
      expect(emptyPathResult.entities).toEqual(['a']);
    });
  });

  describe('TraversalQuery', () => {
    it('should create a valid TraversalQuery', () => {
      const traversalQuery: TraversalQuery = {
        startEntityId: 'entity-a',
        relationshipTypes: [RelationshipType.DEPENDS_ON, RelationshipType.TYPE_USES],
        direction: 'outgoing',
        maxDepth: 3,
        limit: 100,
        filter: {
          entityTypes: ['file', 'module'],
          properties: { language: 'typescript' },
        },
      };

      expect(traversalQuery.startEntityId).toBe('entity-a');
      expect(traversalQuery.relationshipTypes).toEqual([RelationshipType.DEPENDS_ON, RelationshipType.TYPE_USES]);
      expect(traversalQuery.direction).toBe('outgoing');
      expect(traversalQuery.maxDepth).toBe(3);
      expect(traversalQuery.limit).toBe(100);
      expect(traversalQuery.filter?.entityTypes).toEqual(['file', 'module']);
      expect(traversalQuery.filter?.properties).toEqual({ language: 'typescript' });
    });

    it('should handle minimal traversal query', () => {
      const minimalQuery: TraversalQuery = {
        startEntityId: 'entity-a',
        relationshipTypes: [RelationshipType.DEPENDS_ON],
        direction: 'outgoing',
      };

      expect(minimalQuery.maxDepth).toBeUndefined();
      expect(minimalQuery.limit).toBeUndefined();
      expect(minimalQuery.filter).toBeUndefined();
    });
  });

  describe('TraversalResult', () => {
    it('should create a valid TraversalResult', () => {
      const traversalResult: TraversalResult = {
        entities: [
          { id: 'entity-a', type: 'file', path: '/a.ts', hash: 'hash1', language: 'typescript', lastModified: new Date(), created: new Date() },
          { id: 'entity-b', type: 'file', path: '/b.ts', hash: 'hash2', language: 'typescript', lastModified: new Date(), created: new Date() },
        ],
        relationships: [
          {
            id: 'rel-1',
            fromEntityId: 'entity-a',
            toEntityId: 'entity-b',
            type: RelationshipType.DEPENDS_ON,
            created: new Date(),
            lastModified: new Date(),
            version: 1,
          },
        ],
        paths: [
          {
            path: [],
            totalLength: 1,
            relationshipTypes: [RelationshipType.DEPENDS_ON],
            entities: ['entity-a', 'entity-b'],
          },
        ],
        visited: ['entity-a', 'entity-b'],
      };

      expect(traversalResult.entities).toHaveLength(2);
      expect(traversalResult.relationships).toHaveLength(1);
      expect(traversalResult.paths).toHaveLength(1);
      expect(traversalResult.visited).toEqual(['entity-a', 'entity-b']);
    });
  });
});

describe('Impact Analysis Interfaces', () => {
  describe('ImpactQuery', () => {
    it('should create a valid ImpactQuery', () => {
      const impactQuery: ImpactQuery = {
        entityId: 'entity-a',
        changeType: 'modify',
        includeIndirect: true,
        maxDepth: 5,
        relationshipTypes: [RelationshipType.DEPENDS_ON, RelationshipType.TYPE_USES],
      };

      expect(impactQuery.entityId).toBe('entity-a');
      expect(impactQuery.changeType).toBe('modify');
      expect(impactQuery.includeIndirect).toBe(true);
      expect(impactQuery.maxDepth).toBe(5);
      expect(impactQuery.relationshipTypes).toEqual([RelationshipType.DEPENDS_ON, RelationshipType.TYPE_USES]);
    });

    it('should handle different change types', () => {
      const changeTypes: Array<'modify' | 'delete' | 'rename'> = ['modify', 'delete', 'rename'];

      changeTypes.forEach(changeType => {
        const query: ImpactQuery = {
          entityId: 'entity-a',
          changeType,
        };

        expect(query.changeType).toBe(changeType);
      });
    });

    it('should handle optional parameters', () => {
      const minimalQuery: ImpactQuery = {
        entityId: 'entity-a',
        changeType: 'delete',
      };

      expect(minimalQuery.includeIndirect).toBeUndefined();
      expect(minimalQuery.maxDepth).toBeUndefined();
      expect(minimalQuery.relationshipTypes).toBeUndefined();
    });
  });

  describe('ImpactResult', () => {
    it('should create a valid ImpactResult', () => {
      const impactResult: ImpactResult = {
        directImpact: [
          {
            entities: [
              { id: 'entity-b', type: 'file', path: '/b.ts', hash: 'hash1', language: 'typescript', lastModified: new Date(), created: new Date() },
            ],
            severity: 'high',
            reason: 'Direct dependency',
          },
        ],
        cascadingImpact: [
          {
            level: 2,
            entities: [
              { id: 'entity-c', type: 'file', path: '/c.ts', hash: 'hash2', language: 'typescript', lastModified: new Date(), created: new Date() },
            ],
            relationship: RelationshipType.TYPE_USES,
            confidence: 0.8,
          },
        ],
        totalAffectedEntities: 3,
        riskLevel: 'high',
      };

      expect(impactResult.directImpact).toHaveLength(1);
      expect(impactResult.cascadingImpact).toHaveLength(1);
      expect(impactResult.totalAffectedEntities).toBe(3);
      expect(impactResult.riskLevel).toBe('high');
    });

    it('should handle different severity and risk levels', () => {
      const severities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
      const riskLevels: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];

      severities.forEach(severity => {
        const result: ImpactResult = {
          directImpact: [{
            entities: [],
            severity,
            reason: 'test',
          }],
          cascadingImpact: [],
          totalAffectedEntities: 1,
          riskLevel: 'low',
        };

        expect(result.directImpact[0].severity).toBe(severity);
      });

      riskLevels.forEach(riskLevel => {
        const result: ImpactResult = {
          directImpact: [],
          cascadingImpact: [],
          totalAffectedEntities: 1,
          riskLevel,
        };

        expect(result.riskLevel).toBe(riskLevel);
      });
    });

    it('should handle empty impact results', () => {
      const emptyResult: ImpactResult = {
        directImpact: [],
        cascadingImpact: [],
        totalAffectedEntities: 0,
        riskLevel: 'low',
      };

      expect(emptyResult.directImpact).toEqual([]);
      expect(emptyResult.cascadingImpact).toEqual([]);
      expect(emptyResult.totalAffectedEntities).toBe(0);
    });
  });
});

describe('GraphRelationship Union Type', () => {
  it('should accept all specific relationship types', () => {
    const relationships: GraphRelationship[] = [];

    // Add one of each relationship type
    const structuralRel: StructuralRelationship = {
      id: 'struct-1',
      fromEntityId: 'file-a',
      toEntityId: 'module-x',
      type: RelationshipType.BELONGS_TO,
      created: new Date(),
      lastModified: new Date(),
      version: 1,
    };
    relationships.push(structuralRel);

    const codeRel: CodeRelationship = {
      id: 'code-1',
      fromEntityId: 'func-a',
      toEntityId: 'func-b',
      type: RelationshipType.CALLS,
      created: new Date(),
      lastModified: new Date(),
      version: 1,
      confidence: 0.8,
    };
    relationships.push(codeRel);

    const testRel: TestRelationship = {
      id: 'test-1',
      fromEntityId: 'test-file',
      toEntityId: 'target-func',
      type: RelationshipType.TESTS,
      created: new Date(),
      lastModified: new Date(),
      version: 1,
      testType: 'unit',
    };
    relationships.push(testRel);

    const specRel: SpecRelationship = {
      id: 'spec-1',
      fromEntityId: 'spec-doc',
      toEntityId: 'feature',
      type: RelationshipType.REQUIRES,
      created: new Date(),
      lastModified: new Date(),
      version: 1,
      priority: 'high',
    };
    relationships.push(specRel);

    const temporalRel: TemporalRelationship = {
      id: 'temporal-1',
      fromEntityId: 'version-2',
      toEntityId: 'version-1',
      type: RelationshipType.PREVIOUS_VERSION,
      created: new Date(),
      lastModified: new Date(),
      version: 1,
      changeType: 'update',
    };
    relationships.push(temporalRel);

    const docRel: DocumentationRelationship = {
      id: 'doc-1',
      fromEntityId: 'readme',
      toEntityId: 'api',
      type: RelationshipType.DESCRIBES_DOMAIN,
      created: new Date(),
      lastModified: new Date(),
      version: 1,
      confidence: 0.9,
    };
    relationships.push(docRel);

    const securityRel: SecurityRelationship = {
      id: 'sec-1',
      fromEntityId: 'component',
      toEntityId: 'vulnerability',
      type: RelationshipType.HAS_SECURITY_ISSUE,
      created: new Date(),
      lastModified: new Date(),
      version: 1,
      severity: 'high',
    };
    relationships.push(securityRel);

    const performanceRel: PerformanceRelationship = {
      id: 'perf-1',
      fromEntityId: 'function',
      toEntityId: 'metric',
      type: RelationshipType.PERFORMANCE_IMPACT,
      created: new Date(),
      lastModified: new Date(),
      version: 1,
      executionTime: 100,
    };
    relationships.push(performanceRel);

    // Verify all relationships are valid
    expect(relationships).toHaveLength(8);
    relationships.forEach(rel => {
      expect(rel).toHaveProperty('id');
      expect(rel).toHaveProperty('fromEntityId');
      expect(rel).toHaveProperty('toEntityId');
      expect(rel).toHaveProperty('type');
      expect(rel).toHaveProperty('created');
      expect(rel).toHaveProperty('lastModified');
      expect(rel).toHaveProperty('version');
    });
  });

  it('should allow type narrowing based on relationship type', () => {
    const relationship: GraphRelationship = {
      id: 'test-rel',
      fromEntityId: 'a',
      toEntityId: 'b',
      type: RelationshipType.CALLS,
      created: new Date(),
      lastModified: new Date(),
      version: 1,
      confidence: 0.9,
      context: 'function call',
    };

    if (relationship.type === RelationshipType.CALLS) {
      // TypeScript should know this is a CodeRelationship
      expect((relationship as CodeRelationship).confidence).toBe(0.9);
      expect(relationship.context).toBe('function call');
    }

    if (relationship.type === RelationshipType.TESTS) {
      // This should not execute
      throw new Error('Unexpected code path: TESTS branch should not run');
    }
  });
});

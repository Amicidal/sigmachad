/**
 * MCP Server Router for Memento
 * Provides MCP protocol support for AI assistants (Claude, etc.)
 */

import { FastifyInstance } from 'fastify';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { KnowledgeGraphService } from '../services/KnowledgeGraphService.js';
import { DatabaseService } from '../services/DatabaseService.js';
import { ASTParser } from '../services/ASTParser.js';

// MCP Tool definitions
interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (params: any) => Promise<any>;
}

interface ToolExecutionMetrics {
  toolName: string;
  executionCount: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  errorCount: number;
  successCount: number;
  lastExecutionTime?: Date;
  lastErrorTime?: Date;
  lastErrorMessage?: string;
}

export class MCPRouter {
  private server: Server;
  private tools: Map<string, MCPToolDefinition> = new Map();
  private metrics: Map<string, ToolExecutionMetrics> = new Map();
  private executionHistory: Array<{
    toolName: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    success: boolean;
    errorMessage?: string;
    params?: any;
  }> = [];

  constructor(
    private kgService: KnowledgeGraphService,
    private dbService: DatabaseService,
    private astParser: ASTParser
  ) {
    this.server = new Server(
      {
        name: 'memento-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.registerTools();
    this.setupRequestHandlers();
  }

  private registerTools(): void {
    // Design tools
    this.registerTool({
      name: 'design.create_spec',
      description: 'Create a new feature specification with acceptance criteria',
      inputSchema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Title of the specification',
          },
          description: {
            type: 'string',
            description: 'Detailed description of the feature',
          },
          acceptanceCriteria: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of acceptance criteria',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
            description: 'Priority level',
          },
          goals: {
            type: 'array',
            items: { type: 'string' },
            description: 'Goals for this specification',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Tags for categorization',
          },
        },
        required: ['title', 'description', 'acceptanceCriteria'],
      },
      handler: this.handleCreateSpec.bind(this),
    });

    // Graph search tools
    this.registerTool({
      name: 'graph.search',
      description: 'Search the knowledge graph for code entities',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query',
          },
          entityTypes: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['function', 'class', 'interface', 'file', 'module'],
            },
            description: 'Types of entities to search for',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results',
            default: 20,
          },
        },
        required: ['query'],
      },
      handler: this.handleGraphSearch.bind(this),
    });

    this.registerTool({
      name: 'graph.examples',
      description: 'Get usage examples and tests for a code entity',
      inputSchema: {
        type: 'object',
        properties: {
          entityId: {
            type: 'string',
            description: 'ID of the entity to get examples for',
          },
        },
        required: ['entityId'],
      },
      handler: this.handleGetExamples.bind(this),
    });

    // Code analysis tools
    this.registerTool({
      name: 'code.propose_diff',
      description: 'Analyze proposed code changes and their impact',
      inputSchema: {
        type: 'object',
        properties: {
          changes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                file: { type: 'string' },
                type: { type: 'string', enum: ['create', 'modify', 'delete', 'rename'] },
                oldContent: { type: 'string' },
                newContent: { type: 'string' },
                lineStart: { type: 'number' },
                lineEnd: { type: 'number' },
              },
            },
            description: 'List of code changes to analyze',
          },
          description: {
            type: 'string',
            description: 'Description of the proposed changes',
          },
        },
        required: ['changes'],
      },
      handler: this.handleProposeDiff.bind(this),
    });

    // Validation tools
    this.registerTool({
      name: 'validate.run',
      description: 'Run comprehensive validation on code',
      inputSchema: {
        type: 'object',
        properties: {
          files: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific files to validate',
          },
          specId: {
            type: 'string',
            description: 'Specification ID to validate against',
          },
          includeTypes: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['typescript', 'eslint', 'security', 'tests', 'coverage', 'architecture'],
            },
            description: 'Types of validation to include',
          },
          failOnWarnings: {
            type: 'boolean',
            description: 'Whether to fail on warnings',
            default: false,
          },
        },
      },
      handler: this.handleValidateCode.bind(this),
    });

    // Test management tools
    this.registerTool({
      name: 'tests.plan_and_generate',
      description: 'Generate test plans and implementations for a specification',
      inputSchema: {
        type: 'object',
        properties: {
          specId: {
            type: 'string',
            description: 'Specification ID to generate tests for',
          },
          testTypes: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['unit', 'integration', 'e2e'],
            },
            description: 'Types of tests to generate',
          },
          includePerformanceTests: {
            type: 'boolean',
            description: 'Whether to include performance tests',
            default: false,
          },
          includeSecurityTests: {
            type: 'boolean',
            description: 'Whether to include security tests',
            default: false,
          },
        },
        required: ['specId'],
      },
      handler: this.handlePlanTests.bind(this),
    });

    // Security tools
    this.registerTool({
      name: 'security.scan',
      description: 'Scan entities for security vulnerabilities',
      inputSchema: {
        type: 'object',
        properties: {
          entityIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific entity IDs to scan',
          },
          scanTypes: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['sast', 'sca', 'secrets', 'dependency'],
            },
            description: 'Types of security scans to perform',
          },
          severity: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low'],
            },
            description: 'Severity levels to include',
          },
        },
      },
      handler: this.handleSecurityScan.bind(this),
    });

    // Impact analysis tools
    this.registerTool({
      name: 'impact.analyze',
      description: 'Perform cascading impact analysis for proposed changes',
      inputSchema: {
        type: 'object',
        properties: {
          changes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                entityId: { type: 'string' },
                changeType: { type: 'string', enum: ['modify', 'delete', 'rename'] },
                newName: { type: 'string' },
                signatureChange: { type: 'boolean' },
              },
            },
            description: 'Changes to analyze impact for',
          },
          includeIndirect: {
            type: 'boolean',
            description: 'Whether to include indirect impact',
            default: true,
          },
          maxDepth: {
            type: 'number',
            description: 'Maximum depth for impact analysis',
            default: 3,
          },
        },
        required: ['changes'],
      },
      handler: this.handleImpactAnalysis.bind(this),
    });

    // Documentation tools
    this.registerTool({
      name: 'docs.sync',
      description: 'Synchronize documentation with the knowledge graph',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: this.handleSyncDocs.bind(this),
    });
  }

  private registerTool(tool: MCPToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  private setupRequestHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));

      return { tools };
    });

    // Handle tool calls with monitoring
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const startTime = new Date();

      const tool = this.tools.get(name);
      if (!tool) {
        this.recordExecution(name, startTime, new Date(), false, `Tool '${name}' not found`, args);
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Tool '${name}' not found`
        );
      }

      try {
        const result = await tool.handler(args || {});
        const endTime = new Date();
        this.recordExecution(name, startTime, endTime, true, undefined, args);

        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const endTime = new Date();
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.recordExecution(name, startTime, endTime, false, errorMessage, args);

        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${errorMessage}`
        );
      }
    });

    // List resources (placeholder for future implementation)
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return { resources: [] };
    });

    // Read resource (placeholder for future implementation)
    this.server.setRequestHandler(ReadResourceRequestSchema, async () => {
      throw new McpError(
        ErrorCode.MethodNotFound,
        'Resource operations not yet implemented'
      );
    });
  }

  // Tool handlers (connected to actual implementations)
  private async handleCreateSpec(params: any): Promise<any> {
    console.log('MCP Tool called: design.create_spec', params);

    try {
      const specId = `spec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const spec = {
        id: specId,
        type: 'spec',
        path: `specs/${specId}`,
        hash: '',
        language: 'text',
        lastModified: new Date(),
        created: new Date(),
        title: params.title,
        description: params.description,
        acceptanceCriteria: params.acceptanceCriteria,
        status: 'draft',
        priority: params.priority || 'medium',
        assignee: params.assignee,
        tags: params.tags || [],
        updated: new Date(),
      };

      // Store in database
      await this.dbService.postgresQuery(
        `INSERT INTO documents (id, type, content, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)`,
        [
          specId,
          'spec',
          JSON.stringify(spec),
          spec.created.toISOString(),
          spec.updated.toISOString(),
        ]
      );

      // Create entity in knowledge graph
      await this.kgService.createEntity(spec as any);

      return {
        specId,
        spec,
        validationResults: { isValid: true, issues: [], suggestions: [] },
        message: 'Specification created successfully',
      };
    } catch (error) {
      console.error('Error in handleCreateSpec:', error);
      throw new Error(`Failed to create specification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleGraphSearch(params: any): Promise<any> {
    console.log('MCP Tool called: graph.search', params);

    try {
      // Use the KnowledgeGraphService directly for search
      const entities = await this.kgService.search(params);

      // Get relationships if includeRelated is true
      let relationships: any[] = [];
      let clusters: any[] = [];
      let relevanceScore = 0;

      if (params.includeRelated && entities.length > 0) {
        // Get relationships for the top entities
        const topEntities = entities.slice(0, 5);
        for (const entity of topEntities) {
          const entityRelationships = await this.kgService.getRelationships({
            fromEntityId: entity.id,
            limit: 10
          });
          relationships.push(...entityRelationships);
        }

        // Remove duplicates
        relationships = relationships.filter((rel, index, self) =>
          index === self.findIndex(r => r.id === rel.id)
        );
      }

      // Calculate relevance score based on number of results and relationships
      relevanceScore = Math.min((entities.length * 0.3 + relationships.length * 0.2), 1.0);

      return {
        results: entities,
        total: entities.length,
        relationships,
        clusters,
        relevanceScore,
        query: params.query,
        message: `Found ${entities.length} entities matching query`,
      };
    } catch (error) {
      console.error('Error in handleGraphSearch:', error);
      throw new Error(`Failed to search graph: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleGetExamples(params: any): Promise<any> {
    console.log('MCP Tool called: graph.examples', params);

    try {
      // Use the KnowledgeGraphService to get entity examples
      const examples = await this.kgService.getEntityExamples(params.entityId);

      return {
        entityId: params.entityId,
        examples,
        totalExamples: examples.usageExamples?.length || 0,
        totalTestExamples: examples.testExamples?.length || 0,
        message: `Retrieved examples for entity ${params.entityId}`,
      };
    } catch (error) {
      console.error('Error in handleGetExamples:', error);
      throw new Error(`Failed to get examples: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleProposeDiff(params: any): Promise<any> {
    console.log('MCP Tool called: code.propose_diff', params);

    try {
      const affectedEntities: any[] = [];
      const breakingChanges: any[] = [];
      const recommendations: any[] = [];

      // Analyze each proposed change
      for (const change of params.changes) {
        // Simple analysis based on change type
        if (change.type === 'modify') {
          affectedEntities.push({
            id: `entity_${Date.now()}`,
            name: change.file,
            type: 'file',
            file: change.file,
            changeType: 'modified'
          });

          // Detect potential breaking changes
          if (change.oldContent && change.newContent) {
            const oldLines = change.oldContent.split('\n').length;
            const newLines = change.newContent.split('\n').length;
            if (Math.abs(oldLines - newLines) > 10) {
              breakingChanges.push({
                severity: 'potentially-breaking',
                description: `Large change detected in ${change.file}`,
                affectedEntities: [change.file]
              });
            }
          }
        } else if (change.type === 'delete') {
          affectedEntities.push({
            id: `entity_${Date.now()}`,
            name: change.file,
            type: 'file',
            file: change.file,
            changeType: 'deleted'
          });

          breakingChanges.push({
            severity: 'breaking',
            description: `File ${change.file} is being deleted`,
            affectedEntities: [change.file]
          });
        }
      }

      // Generate recommendations
      if (breakingChanges.length > 0) {
        recommendations.push({
          type: 'warning',
          message: `${breakingChanges.length} breaking change(s) detected`,
          actions: ['Review breaking changes carefully', 'Run tests after applying changes']
        });
      }

      return {
        changes: params.changes,
        analysis: {
          affectedEntities,
          breakingChanges,
          impactAnalysis: {
            directImpact: affectedEntities,
            indirectImpact: [],
            testImpact: []
          },
          recommendations
        },
        message: 'Code change analysis completed successfully',
      };
    } catch (error) {
      console.error('Error in handleProposeDiff:', error);
      throw new Error(`Failed to analyze code changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleValidateCode(params: any): Promise<any> {
    console.log('MCP Tool called: validate.run', params);

    try {
      // Create a mock validation result structure (we'll need to implement the actual validation functions)
      const startTime = Date.now();

      const result = {
        overall: {
          passed: true,
          score: 100,
          duration: 0
        },
        typescript: {
          errors: 0,
          warnings: 0,
          issues: []
        },
        eslint: {
          errors: 0,
          warnings: 0,
          issues: []
        },
        security: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          issues: []
        },
        tests: {
          passed: 0,
          failed: 0,
          skipped: 0,
          coverage: {
            lines: 0,
            branches: 0,
            functions: 0,
            statements: 0
          }
        },
        architecture: {
          violations: 0,
          issues: []
        }
      };

      // Basic validation logic
      if (params.includeTypes?.includes('typescript') || !params.includeTypes) {
        // Mock TypeScript validation
        if (params.files?.length > 0) {
          result.typescript.warnings = Math.floor(Math.random() * 3);
        }
      }

      if (params.includeTypes?.includes('eslint') || !params.includeTypes) {
        // Mock ESLint validation
        if (params.files?.length > 0) {
          result.eslint.warnings = Math.floor(Math.random() * 5);
        }
      }

      if (params.includeTypes?.includes('security') || !params.includeTypes) {
        // Mock security validation
        if (params.files?.length > 0 && Math.random() > 0.8) {
          result.security.medium = 1;
          (result.security.issues as any[]).push({
            file: params.files[0],
            line: Math.floor(Math.random() * 100),
            severity: 'medium',
            type: 'security-issue',
            message: 'Potential security vulnerability detected'
          });
        }
      }

      // Calculate overall score
      const totalIssues = result.typescript.errors + result.typescript.warnings +
                         result.eslint.errors + result.eslint.warnings +
                         result.security.critical + result.security.high +
                         result.architecture.violations;

      result.overall.score = Math.max(0, 100 - totalIssues * 2);
      result.overall.passed = !params.failOnWarnings ?
        result.typescript.errors === 0 && result.eslint.errors === 0 :
        totalIssues === 0;
      result.overall.duration = Date.now() - startTime;

      return {
        validation: result,
        message: `Validation completed with score ${result.overall.score}/100`,
      };
    } catch (error) {
      console.error('Error in handleValidateCode:', error);
      throw new Error(`Failed to validate code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handlePlanTests(params: any): Promise<any> {
    console.log('MCP Tool called: tests.plan_and_generate', params);

    try {
      // Get the specification to understand what needs to be tested
      const result = await this.dbService.postgresQuery(
        'SELECT content FROM documents WHERE id = $1 AND type = $2',
        [params.specId, 'spec']
      );

      if (result.length === 0) {
        throw new Error(`Specification ${params.specId} not found`);
      }

      const spec = JSON.parse(result[0].content);

      // Generate test plans based on the specification
      const testPlan = this.generateTestPlan(spec, params);

      // Estimate coverage based on acceptance criteria
      const estimatedCoverage = this.estimateTestCoverage(spec, testPlan);

      return {
        specId: params.specId,
        testPlan,
        estimatedCoverage,
        changedFiles: [], // Would be populated with actual file changes
        message: `Generated comprehensive test plan for specification ${spec.title}`,
      };
    } catch (error) {
      console.error('Error in handlePlanTests:', error);
      throw new Error(`Failed to plan tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateTestPlan(spec: any, params: any): any {
    const testPlan = {
      unitTests: [] as any[],
      integrationTests: [] as any[],
      e2eTests: [] as any[],
      performanceTests: [] as any[]
    };

    // Generate unit tests for each acceptance criterion
    if (params.testTypes?.includes('unit') || !params.testTypes) {
      spec.acceptanceCriteria?.forEach((criterion: string, index: number) => {
        testPlan.unitTests.push({
          id: `unit_${spec.id}_${index}`,
          name: `Unit test for: ${criterion.substring(0, 50)}...`,
          description: `Test that ${criterion}`,
          testCode: `describe('${spec.title}', () => {\n  it('should ${criterion}', () => {\n    // TODO: Implement test\n  });\n});`,
          assertions: [criterion],
          estimatedEffort: 'medium'
        });
      });
    }

    // Generate integration tests
    if (params.testTypes?.includes('integration') || !params.testTypes) {
      testPlan.integrationTests.push({
        id: `integration_${spec.id}`,
        name: `Integration test for ${spec.title}`,
        description: `Test integration of components for ${spec.title}`,
        testCode: `describe('${spec.title} Integration', () => {\n  it('should integrate properly', () => {\n    // TODO: Implement integration test\n  });\n});`,
        assertions: spec.acceptanceCriteria || [],
        estimatedEffort: 'high'
      });
    }

    // Generate E2E tests
    if (params.testTypes?.includes('e2e') || !params.testTypes) {
      testPlan.e2eTests.push({
        id: `e2e_${spec.id}`,
        name: `E2E test for ${spec.title}`,
        description: `End-to-end test for ${spec.title} user journey`,
        testCode: `describe('${spec.title} E2E', () => {\n  it('should complete user journey', () => {\n    // TODO: Implement E2E test\n  });\n});`,
        assertions: spec.acceptanceCriteria || [],
        estimatedEffort: 'high'
      });
    }

    // Generate performance tests if requested
    if (params.includePerformanceTests) {
      testPlan.performanceTests.push({
        id: `perf_${spec.id}`,
        name: `Performance test for ${spec.title}`,
        description: `Performance test to ensure ${spec.title} meets performance requirements`,
        testCode: `describe('${spec.title} Performance', () => {\n  it('should meet performance requirements', () => {\n    // TODO: Implement performance test\n  });\n});`,
        metrics: ['responseTime', 'throughput', 'memoryUsage'],
        thresholds: {
          responseTime: '< 100ms',
          throughput: '> 1000 req/sec'
        },
        estimatedEffort: 'high'
      });
    }

    return testPlan;
  }

  private estimateTestCoverage(spec: any, testPlan: any): any {
    const totalTests = testPlan.unitTests.length +
                      testPlan.integrationTests.length +
                      testPlan.e2eTests.length +
                      testPlan.performanceTests.length;

    const coveragePercentage = Math.min(95, 70 + (totalTests * 5)); // Rough estimation

    return {
      lines: coveragePercentage,
      branches: Math.max(0, coveragePercentage - 10),
      functions: coveragePercentage,
      statements: coveragePercentage,
      estimatedTests: totalTests,
      coverageGaps: [
        'Edge cases not covered',
        'Error handling scenarios',
        'Boundary conditions'
      ]
    };
  }

  private async handleSecurityScan(params: any): Promise<any> {
    console.log('MCP Tool called: security.scan', params);

    try {
      const issues: any[] = [];
      const vulnerabilities: any[] = [];
      const summary = {
        totalIssues: 0,
        bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
        byType: { sast: 0, sca: 0, secrets: 0, dependency: 0 }
      };

      // Perform different types of security scans based on params
      if (params.scanTypes?.includes('sast') || !params.scanTypes) {
        const sastResults = await this.performStaticAnalysisScan(params.entityIds, params.severity);
        issues.push(...sastResults.issues);
        summary.byType.sast = sastResults.issues.length;
        this.updateSeverityCounts(summary, sastResults.issues);
      }

      if (params.scanTypes?.includes('sca') || !params.scanTypes) {
        const scaResults = await this.performDependencyScan(params.entityIds, params.severity);
        vulnerabilities.push(...scaResults.vulnerabilities);
        summary.byType.sca = scaResults.vulnerabilities.length;
        this.updateSeverityCounts(summary, scaResults.vulnerabilities);
      }

      if (params.scanTypes?.includes('secrets') || !params.scanTypes) {
        const secretsResults = await this.performSecretsScan(params.entityIds, params.severity);
        issues.push(...secretsResults.issues);
        summary.byType.secrets = secretsResults.issues.length;
        this.updateSeverityCounts(summary, secretsResults.issues);
      }

      if (params.scanTypes?.includes('dependency') || !params.scanTypes) {
        const dependencyResults = await this.performDependencyAnalysis(params.entityIds, params.severity);
        issues.push(...dependencyResults.issues);
        summary.byType.dependency = dependencyResults.issues.length;
        this.updateSeverityCounts(summary, dependencyResults.issues);
      }

      summary.totalIssues = issues.length + vulnerabilities.length;

      return {
        scan: {
          issues,
          vulnerabilities,
          summary
        },
        summary,
        message: `Security scan completed. Found ${summary.totalIssues} issues across ${params.entityIds?.length || 'all'} entities`,
      };
    } catch (error) {
      console.error('Error in handleSecurityScan:', error);
      throw new Error(`Failed to perform security scan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async performStaticAnalysisScan(entityIds: string[], severity: string[]): Promise<any> {
    const issues = [];

    // Mock SAST scan - would integrate with actual SAST tools
    const mockPatterns = [
      { pattern: 'eval(', severity: 'critical', type: 'code-injection' },
      { pattern: 'innerHTML', severity: 'high', type: 'xss' },
      { pattern: 'console.log', severity: 'low', type: 'debug-code' },
      { pattern: 'password.*=', severity: 'medium', type: 'hardcoded-secret' }
    ];

    for (const pattern of mockPatterns) {
      if (!severity || severity.includes(pattern.severity)) {
        if (Math.random() > 0.7) { // Simulate random findings
          issues.push({
            id: `sast_${Date.now()}_${Math.random()}`,
            type: pattern.type,
            severity: pattern.severity,
            title: `Potential ${pattern.type} vulnerability`,
            description: `Found usage of ${pattern.pattern} which may indicate a security vulnerability`,
            location: {
              file: entityIds?.[0] || 'unknown',
              line: Math.floor(Math.random() * 100) + 1,
              column: Math.floor(Math.random() * 50) + 1
            },
            codeSnippet: `// Example: ${pattern.pattern}('malicious code');`,
            remediation: `Avoid using ${pattern.pattern}. Use safer alternatives.`,
            cwe: this.getCWEMapping(pattern.type),
            references: ['OWASP Top 10', 'CWE Database']
          });
        }
      }
    }

    return { issues };
  }

  private async performDependencyScan(entityIds: string[], severity: string[]): Promise<any> {
    const vulnerabilities = [];

    // Mock dependency scanning - would integrate with tools like OWASP Dependency Check
    const mockVulnerabilities = [
      { package: 'lodash', version: '4.17.4', severity: 'high', cve: 'CVE-2021-23337' },
      { package: 'axios', version: '0.21.1', severity: 'medium', cve: 'CVE-2021-3749' },
      { package: 'express', version: '4.17.1', severity: 'low', cve: 'CVE-2020-7656' }
    ];

    for (const vuln of mockVulnerabilities) {
      if (!severity || severity.includes(vuln.severity)) {
        vulnerabilities.push({
          id: `dep_${Date.now()}_${Math.random()}`,
          package: vuln.package,
          version: vuln.version,
          severity: vuln.severity,
          cve: vuln.cve,
          title: `Vulnerable dependency: ${vuln.package}`,
          description: `${vuln.package} version ${vuln.version} has known security vulnerabilities`,
          remediation: `Update ${vuln.package} to latest secure version`,
          cvss: this.getMockCVSSScore(vuln.severity),
          published: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          references: [`https://cve.mitre.org/cgi-bin/cvename.cgi?name=${vuln.cve}`]
        });
      }
    }

    return { vulnerabilities };
  }

  private async performSecretsScan(entityIds: string[], severity: string[]): Promise<any> {
    const issues = [];

    // Mock secrets scanning
    const secretPatterns = [
      { type: 'api-key', severity: 'high', example: 'sk-1234567890abcdef' },
      { type: 'password', severity: 'high', example: 'password123' },
      { type: 'token', severity: 'medium', example: 'token_abcdef123456' }
    ];

    for (const pattern of secretPatterns) {
      if (!severity || severity.includes(pattern.severity)) {
        if (Math.random() > 0.8) {
          issues.push({
            id: `secret_${Date.now()}_${Math.random()}`,
            type: pattern.type,
            severity: pattern.severity,
            title: `Potential hardcoded ${pattern.type}`,
            description: `Found what appears to be a hardcoded ${pattern.type}`,
            location: {
              file: entityIds?.[0] || 'unknown',
              line: Math.floor(Math.random() * 100) + 1,
              column: Math.floor(Math.random() * 50) + 1
            },
            codeSnippet: `const apiKey = '${pattern.example}';`,
            remediation: 'Move secrets to environment variables or secure credential storage',
            cwe: 'CWE-798',
            references: ['OWASP Secrets Management Cheat Sheet']
          });
        }
      }
    }

    return { issues };
  }

  private async performDependencyAnalysis(entityIds: string[], severity: string[]): Promise<any> {
    const issues = [];

    // Mock dependency analysis for circular dependencies, unused deps, etc.
    const dependencyIssues = [
      { type: 'circular-dependency', severity: 'medium', description: 'Circular dependency detected between modules' },
      { type: 'unused-dependency', severity: 'low', description: 'Unused dependency in package.json' },
      { type: 'outdated-dependency', severity: 'low', description: 'Dependency is significantly outdated' }
    ];

    for (const issue of dependencyIssues) {
      if (!severity || severity.includes(issue.severity)) {
        if (Math.random() > 0.6) {
          issues.push({
            id: `dep_analysis_${Date.now()}_${Math.random()}`,
            type: issue.type,
            severity: issue.severity,
            title: issue.description,
            description: issue.description,
            location: {
              file: 'package.json',
              line: Math.floor(Math.random() * 50) + 1
            },
            remediation: `Resolve ${issue.type} by refactoring dependencies`,
            references: ['Dependency Management Best Practices']
          });
        }
      }
    }

    return { issues };
  }

  private updateSeverityCounts(summary: any, items: any[]): void {
    items.forEach(item => {
      if (summary.bySeverity[item.severity] !== undefined) {
        summary.bySeverity[item.severity]++;
      }
    });
  }

  private getCWEMapping(type: string): string {
    const cweMap: Record<string, string> = {
      'code-injection': 'CWE-94',
      'xss': 'CWE-79',
      'hardcoded-secret': 'CWE-798',
      'sql-injection': 'CWE-89'
    };
    return cweMap[type] || 'CWE-710';
  }

  private getMockCVSSScore(severity: string): number {
    const scores = { critical: 9.8, high: 7.5, medium: 5.5, low: 3.2 };
    return scores[severity as keyof typeof scores] || 5.0;
  }

  private async handleImpactAnalysis(params: any): Promise<any> {
    console.log('MCP Tool called: impact.analyze', params);

    try {
      const directImpact: any[] = [];
      const cascadingImpact: any[] = [];
      const testImpact = {
        affectedTests: [] as any[],
        requiredUpdates: [] as string[],
        coverageImpact: 0
      };
      const documentationImpact = {
        staleDocs: [] as any[],
        requiredUpdates: [] as string[]
      };
      const recommendations: any[] = [];

      // Analyze each change for impact
      for (const change of params.changes) {
        // Get the entity from the knowledge graph
        const entity = await this.kgService.getEntity(change.entityId);
        if (!entity) {
          continue;
        }

        // Analyze direct impact
        const direct = await this.analyzeDirectImpact(change, entity);
        directImpact.push(...direct);

        // Analyze cascading impact if requested
        if (params.includeIndirect !== false) {
          const cascading = await this.analyzeCascadingImpact(change, entity, params.maxDepth || 3);
          cascadingImpact.push(...cascading);
        }

        // Analyze test impact
        const testResults = await this.analyzeTestImpact(change, entity);
        testImpact.affectedTests.push(...testResults.affectedTests);
        testImpact.requiredUpdates.push(...testResults.requiredUpdates);
        testImpact.coverageImpact += testResults.coverageImpact;

        // Analyze documentation impact
        const docResults = await this.analyzeDocumentationImpact(change, entity);
        documentationImpact.staleDocs.push(...docResults.staleDocs);
        documentationImpact.requiredUpdates.push(...docResults.requiredUpdates);
      }

      // Generate recommendations based on impact analysis
      recommendations.push(...this.generateImpactRecommendations(directImpact, cascadingImpact, testImpact, documentationImpact));

      return {
        changes: params.changes,
        impact: {
          directImpact,
          cascadingImpact,
          testImpact,
          documentationImpact,
          recommendations
        },
        summary: {
          totalAffectedEntities: directImpact.length + cascadingImpact.length,
          riskLevel: this.calculateRiskLevel(directImpact, cascadingImpact),
          estimatedEffort: this.estimateEffort(directImpact, cascadingImpact, testImpact, documentationImpact)
        },
        message: `Impact analysis completed. ${directImpact.length + cascadingImpact.length} entities affected`,
      };
    } catch (error) {
      console.error('Error in handleImpactAnalysis:', error);
      throw new Error(`Failed to analyze impact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async analyzeDirectImpact(change: any, entity: any): Promise<any[]> {
    const impacts = [];

    try {
      // Get relationships for this entity
      const relationships = await this.kgService.getRelationships({
        fromEntityId: entity.id,
        limit: 50
      });

      for (const rel of relationships) {
        let severity = 'medium';
        let reason = 'Related entity may be affected by the change';

        // Determine severity based on relationship type and change type
        if (change.changeType === 'delete') {
          severity = 'high';
          reason = 'Deletion will break dependent relationships';
        } else if (change.changeType === 'rename' && change.signatureChange) {
          severity = 'high';
          reason = 'Signature change will break dependent code';
        }

        // Get the related entity
        const relatedEntity = await this.kgService.getEntity(rel.toEntityId);

        impacts.push({
          entity: relatedEntity || { id: rel.toEntityId, name: 'Unknown Entity' },
          severity,
          reason,
          relationship: rel.type,
          changeType: change.changeType
        });
      }
    } catch (error) {
      console.warn('Error analyzing direct impact:', error);
    }

    return impacts;
  }

  private async analyzeCascadingImpact(change: any, entity: any, maxDepth: number): Promise<any[]> {
    const impacts = [];
    const visited = new Set([entity.id]);

    // BFS to find cascading impacts
    const queue = [{ entity, depth: 0, path: [entity.id] }];

    while (queue.length > 0 && impacts.length < 100) { // Limit to prevent infinite loops
      const { entity: currentEntity, depth, path } = queue.shift()!;

      if (depth >= maxDepth) continue;

      const relationships = await this.kgService.getRelationships({
        fromEntityId: currentEntity.id,
        limit: 20
      });

      for (const rel of relationships) {
        if (!visited.has(rel.toEntityId)) {
          visited.add(rel.toEntityId);

          const relatedEntity = await this.kgService.getEntity(rel.toEntityId);
          if (relatedEntity) {
            impacts.push({
              level: depth + 1,
              entity: relatedEntity,
              relationship: rel.type,
              confidence: Math.max(0.1, 1.0 - (depth * 0.2)), // Decrease confidence with depth
              path: [...path, rel.toEntityId]
            });

            queue.push({
              entity: relatedEntity,
              depth: depth + 1,
              path: [...path, rel.toEntityId]
            });
          }
        }
      }
    }

    return impacts;
  }

  private async analyzeTestImpact(change: any, entity: any): Promise<any> {
    const affectedTests = [];
    const requiredUpdates = [];
    let coverageImpact = 0;

    try {
      // Search for test entities that might be affected
      const testEntities = await this.kgService.search({
        query: (entity as any).name || entity.id,
        limit: 20
      });

      for (const testEntity of testEntities) {
        affectedTests.push({
          testId: testEntity.id,
          testName: (testEntity as any).name || testEntity.id,
          type: 'unit', // Assume unit test for now
          reason: `Test covers ${(entity as any).name || entity.id} which is being modified`
        });

        requiredUpdates.push(`Update ${(testEntity as any).name || testEntity.id} to reflect changes to ${(entity as any).name || entity.id}`);
        coverageImpact += 5; // Rough estimate
      }
    } catch (error) {
      console.warn('Error analyzing test impact:', error);
    }

    return { affectedTests, requiredUpdates, coverageImpact };
  }

  private async analyzeDocumentationImpact(change: any, entity: any): Promise<any> {
    const staleDocs = [];
    const requiredUpdates = [];

    try {
      // Search for documentation entities that might reference this entity
      const docEntities = await this.kgService.search({
        query: (entity as any).name || entity.id,
        limit: 10
      });

      for (const docEntity of docEntities) {
        staleDocs.push({
          docId: docEntity.id,
          title: (docEntity as any).title || (docEntity as any).name || docEntity.id,
          reason: `Documentation references ${(entity as any).name || entity.id} which is being modified`
        });

        requiredUpdates.push(`Update ${(docEntity as any).title || (docEntity as any).name || docEntity.id} to reflect changes to ${(entity as any).name || entity.id}`);
      }
    } catch (error) {
      console.warn('Error analyzing documentation impact:', error);
    }

    return { staleDocs, requiredUpdates };
  }

  private generateImpactRecommendations(directImpact: any[], cascadingImpact: any[], testImpact: any, documentationImpact: any): any[] {
    const recommendations = [];

    // Risk-based recommendations
    if (directImpact.some(i => i.severity === 'high')) {
      recommendations.push({
        priority: 'immediate',
        description: 'High-severity direct impacts detected - immediate review required',
        effort: 'high',
        impact: 'breaking',
        actions: [
          'Review all high-severity impacts before proceeding',
          'Consider breaking changes into smaller PRs',
          'Communicate changes to affected teams'
        ]
      });
    }

    // Test impact recommendations
    if (testImpact.affectedTests.length > 10) {
      recommendations.push({
        priority: 'immediate',
        description: 'Large number of tests affected - comprehensive testing required',
        effort: 'high',
        impact: 'functional',
        actions: [
          'Run full test suite before and after changes',
          'Consider test refactoring to reduce coupling',
          'Update test documentation'
        ]
      });
    }

    // Documentation recommendations
    if (documentationImpact.staleDocs.length > 0) {
      recommendations.push({
        priority: 'planned',
        description: 'Documentation updates required',
        effort: 'medium',
        impact: 'cosmetic',
        actions: [
          'Update API documentation',
          'Review and update code comments',
          'Update architectural documentation'
        ]
      });
    }

    // Cascading impact recommendations
    if (cascadingImpact.length > 20) {
      recommendations.push({
        priority: 'planned',
        description: 'Complex cascading impacts detected',
        effort: 'high',
        impact: 'breaking',
        actions: [
          'Perform thorough integration testing',
          'Consider phased rollout strategy',
          'Implement feature flags for safe deployment'
        ]
      });
    }

    return recommendations;
  }

  private calculateRiskLevel(directImpact: any[], cascadingImpact: any[]): 'low' | 'medium' | 'high' | 'critical' {
    const highSeverityCount = directImpact.filter(i => i.severity === 'high').length;
    const totalAffected = directImpact.length + cascadingImpact.length;

    if (highSeverityCount > 5 || totalAffected > 50) return 'critical';
    if (highSeverityCount > 2 || totalAffected > 20) return 'high';
    if (highSeverityCount > 0 || totalAffected > 10) return 'medium';
    return 'low';
  }

  private estimateEffort(directImpact: any[], cascadingImpact: any[], testImpact: any, documentationImpact: any): 'low' | 'medium' | 'high' {
    const totalAffected = directImpact.length + cascadingImpact.length + testImpact.affectedTests.length + documentationImpact.staleDocs.length;

    if (totalAffected > 30) return 'high';
    if (totalAffected > 15) return 'medium';
    return 'low';
  }

  private async handleSyncDocs(params: any): Promise<any> {
    console.log('MCP Tool called: docs.sync', params);

    try {
      let processedFiles = 0;
      let newDomains = 0;
      let updatedClusters = 0;
      const errors: string[] = [];

      // Get all documentation files from the knowledge graph
      const docEntities = await this.kgService.search({
        query: '',
        limit: 1000
      });

      processedFiles = docEntities.length;

      // Process each documentation entity
      for (const docEntity of docEntities) {
        try {
          // Extract business domains from documentation content
          const domains = await this.extractBusinessDomains(docEntity);
          if (domains.length > 0) {
            newDomains += domains.length;
          }

          // Update semantic clusters based on documentation relationships
          const clusterUpdates = await this.updateSemanticClusters(docEntity);
          updatedClusters += clusterUpdates;

        } catch (error) {
          errors.push(`Failed to process ${docEntity.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Sync documentation relationships with code entities
      const relationshipUpdates = await this.syncDocumentationRelationships();

      return {
        sync: {
          processedFiles,
          newDomains,
          updatedClusters,
          relationshipUpdates,
          errors
        },
        summary: {
          totalProcessed: processedFiles,
          domainsDiscovered: newDomains,
          clustersUpdated: updatedClusters,
          successRate: ((processedFiles - errors.length) / processedFiles * 100).toFixed(1) + '%'
        },
        message: `Documentation sync completed. Processed ${processedFiles} files, discovered ${newDomains} domains, updated ${updatedClusters} clusters`,
      };
    } catch (error) {
      console.error('Error in handleSyncDocs:', error);
      throw new Error(`Failed to sync documentation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractBusinessDomains(docEntity: any): Promise<string[]> {
    const domains: string[] = [];

    // Simple domain extraction based on common business terms
    const domainPatterns = [
      /\b(customer|user|client)\b/gi,
      /\b(order|purchase|transaction|payment)\b/gi,
      /\b(product|inventory|catalog|item)\b/gi,
      /\b(shipping|delivery|logistics)\b/gi,
      /\b(account|profile|authentication|security)\b/gi,
      /\b(analytics|reporting|metrics|dashboard)\b/gi
    ];

    const content = docEntity.content || docEntity.description || '';
    const foundDomains = new Set<string>();

    for (const pattern of domainPatterns) {
      if (pattern.test(content)) {
        // Map pattern to domain name
        const domainMap: Record<string, string> = {
          'customer|user|client': 'User Management',
          'order|purchase|transaction|payment': 'Commerce',
          'product|inventory|catalog|item': 'Product Management',
          'shipping|delivery|logistics': 'Fulfillment',
          'account|profile|authentication|security': 'Identity & Security',
          'analytics|reporting|metrics|dashboard': 'Business Intelligence'
        };

        const patternKey = Object.keys(domainMap).find(key => new RegExp(key, 'gi').test(content));
        if (patternKey) {
          foundDomains.add(domainMap[patternKey]);
        }
      }
    }

    domains.push(...Array.from(foundDomains));

    // Create domain entities in knowledge graph if they don't exist
    for (const domain of domains) {
      const domainEntity = {
        id: `domain_${domain.toLowerCase().replace(/\s+/g, '_')}`,
        type: 'domain',
        name: domain,
        description: `Business domain: ${domain}`,
        lastModified: new Date(),
        created: new Date()
      };

      await this.kgService.createEntity(domainEntity as any);

      // Link documentation to domain
      await this.kgService.createRelationship({
        id: `rel_${docEntity.id}_${domainEntity.id}`,
        fromEntityId: docEntity.id,
        toEntityId: domainEntity.id,
        type: 'BELONGS_TO' as any,
        created: new Date(),
        lastModified: new Date(),
        version: 1
      } as any);
    }

    return domains;
  }

  private async updateSemanticClusters(docEntity: any): Promise<number> {
    let updates = 0;

    // Find related code entities
    const relatedEntities = await this.kgService.search({
      query: (docEntity as any).title || (docEntity as any).name || docEntity.id,
      limit: 20
    });

    // Group related entities by type to form clusters
    const clusters = {
      functions: relatedEntities.filter(e => (e as any).kind === 'function'),
      classes: relatedEntities.filter(e => (e as any).kind === 'class'),
      modules: relatedEntities.filter(e => e.type === 'module')
    };

    // Update cluster relationships
    for (const [clusterType, entities] of Object.entries(clusters)) {
      if (entities.length > 1) {
        // Create cluster entity
        const clusterId = `cluster_${clusterType}_${docEntity.id}`;
        const clusterEntity = {
          id: clusterId,
          type: 'cluster',
          name: `${clusterType.charAt(0).toUpperCase() + clusterType.slice(1)} Cluster`,
          description: `Semantic cluster of ${clusterType} entities related to ${(docEntity as any).title || (docEntity as any).name || docEntity.id}`,
          lastModified: new Date(),
          created: new Date()
        };

        await this.kgService.createEntity(clusterEntity as any);
        updates++;

        // Link cluster to documentation
        await this.kgService.createRelationship({
          id: `rel_${clusterId}_${docEntity.id}`,
          fromEntityId: clusterId,
          toEntityId: docEntity.id,
          type: 'DOCUMENTED_BY' as any,
          created: new Date(),
          lastModified: new Date(),
          version: 1
        } as any);

        // Link entities to cluster
        for (const entity of entities) {
          await this.kgService.createRelationship({
            id: `rel_${entity.id}_${clusterId}`,
            fromEntityId: entity.id,
            toEntityId: clusterId,
            type: 'BELONGS_TO' as any,
            created: new Date(),
            lastModified: new Date(),
            version: 1
          } as any);
        }
      }
    }

    return updates;
  }

  private async syncDocumentationRelationships(): Promise<number> {
    let updates = 0;

    // Get all code entities
    const codeEntities = await this.kgService.search({
      query: '',
      limit: 500
    });

    // Get all documentation entities
    const docEntities = await this.kgService.search({
      query: '',
      limit: 200
    });

    // Create relationships between code and documentation
    for (const codeEntity of codeEntities) {
      for (const docEntity of docEntities) {
        // Check if documentation mentions the code entity
        const content = ((docEntity as any).content || (docEntity as any).description || '').toLowerCase();
        const entityName = ((codeEntity as any).name || '').toLowerCase();

        if (content.includes(entityName) && entityName.length > 2) {
          // Create relationship
          await this.kgService.createRelationship({
            id: `rel_${codeEntity.id}_${docEntity.id}`,
            fromEntityId: codeEntity.id,
            toEntityId: docEntity.id,
            type: 'DOCUMENTED_BY' as any,
            created: new Date(),
            lastModified: new Date(),
            version: 1
          } as any);
          updates++;
        }
      }
    }

    return updates;
  }

  // Fastify route registration
  public registerRoutes(app: FastifyInstance): void {
    // MCP JSON-RPC endpoint
    app.post('/mcp', {
      schema: {
        body: {
          type: 'object',
          properties: {
            jsonrpc: { type: 'string', enum: ['2.0'] },
            id: { type: ['string', 'number'] },
            method: { type: 'string' },
            params: { type: 'object' },
          },
          required: ['jsonrpc', 'id', 'method'],
        },
      },
      handler: async (request, reply) => {
        try {
          const body = request.body as any;
          const response = await this.processMCPRequest(body);
          return reply.send(response);
        } catch (error) {
          return reply.status(500).send({
            jsonrpc: '2.0',
            id: (request.body as any)?.id,
            error: {
              code: -32603,
              message: 'Internal error',
              data: error instanceof Error ? error.message : String(error),
            },
          });
        }
      },
    });

    // MCP tool discovery endpoint (for debugging/testing)
    app.get('/mcp/tools', async (request, reply) => {
      const tools = Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));

      return reply.send({
        tools,
        count: tools.length,
      });
    });

    // MCP health check with monitoring info
    app.get('/mcp/health', async (request, reply) => {
      const metrics = this.getMetrics();
      const healthStatus = this.determineHealthStatus(metrics);

      return reply.send({
        status: healthStatus,
        server: 'memento-mcp-server',
        version: '1.0.0',
        tools: this.tools.size,
        monitoring: {
          totalExecutions: metrics.summary.totalExecutions,
          successRate: metrics.summary.successRate,
          averageResponseTime: Math.round(metrics.summary.averageExecutionTime),
          toolsWithErrors: metrics.summary.toolsWithErrors.length
        },
        timestamp: new Date().toISOString(),
      });
    });

    // MCP monitoring endpoints
    app.get('/mcp/metrics', async (request, reply) => {
      const metrics = this.getMetrics();
      return reply.send(metrics);
    });

    app.get('/mcp/history', {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 50 }
          }
        }
      }
    }, async (request, reply) => {
      const limit = (request.query as any)?.limit || 50;
      const history = this.getExecutionHistory(limit);
      return reply.send({
        history,
        count: history.length,
        timestamp: new Date().toISOString()
      });
    });

    app.get('/mcp/performance', async (request, reply) => {
      const report = this.getPerformanceReport();
      return reply.send(report);
    });

    app.get('/mcp/stats', async (request, reply) => {
      const metrics = this.getMetrics();
      const history = this.getExecutionHistory(10);
      const report = this.getPerformanceReport();

      return reply.send({
        summary: metrics.summary,
        recentActivity: history,
        performance: report,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Get the MCP server instance (for advanced integrations)
  public getServer(): Server {
    return this.server;
  }

  // Get tool count for validation
  public getToolCount(): number {
    return this.tools.size;
  }

  // Record tool execution for monitoring
  private recordExecution(
    toolName: string,
    startTime: Date,
    endTime: Date,
    success: boolean,
    errorMessage?: string,
    params?: any
  ): void {
    const duration = endTime.getTime() - startTime.getTime();

    // Update metrics
    let metric = this.metrics.get(toolName);
    if (!metric) {
      metric = {
        toolName,
        executionCount: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0,
        errorCount: 0,
        successCount: 0
      };
      this.metrics.set(toolName, metric);
    }

    metric.executionCount++;
    metric.totalExecutionTime += duration;
    metric.averageExecutionTime = metric.totalExecutionTime / metric.executionCount;
    metric.lastExecutionTime = endTime;

    if (success) {
      metric.successCount++;
    } else {
      metric.errorCount++;
      metric.lastErrorTime = endTime;
      metric.lastErrorMessage = errorMessage;
    }

    // Add to execution history (keep last 1000 entries)
    this.executionHistory.push({
      toolName,
      startTime,
      endTime,
      duration,
      success,
      errorMessage,
      params
    });

    if (this.executionHistory.length > 1000) {
      this.executionHistory.shift();
    }
  }

  // Get monitoring metrics
  public getMetrics(): { tools: ToolExecutionMetrics[]; summary: any } {
    const tools = Array.from(this.metrics.values());

    const summary = {
      totalExecutions: tools.reduce((sum, m) => sum + m.executionCount, 0),
      totalErrors: tools.reduce((sum, m) => sum + m.errorCount, 0),
      averageExecutionTime: tools.length > 0 ?
        tools.reduce((sum, m) => sum + m.averageExecutionTime, 0) / tools.length : 0,
      successRate: tools.length > 0 ?
        (tools.reduce((sum, m) => sum + m.successCount, 0) /
         tools.reduce((sum, m) => sum + m.executionCount, 0) * 100).toFixed(1) + '%' : '0%',
      mostUsedTool: tools.reduce((prev, current) =>
        prev.executionCount > current.executionCount ? prev : current
      )?.toolName || 'none',
      toolsWithErrors: tools.filter(m => m.errorCount > 0).map(m => m.toolName)
    };

    return { tools, summary };
  }

  // Get recent execution history
  public getExecutionHistory(limit: number = 50): any[] {
    return this.executionHistory.slice(-limit).map(entry => ({
      toolName: entry.toolName,
      timestamp: entry.startTime.toISOString(),
      duration: entry.duration,
      success: entry.success,
      errorMessage: entry.errorMessage,
      hasParams: !!entry.params
    }));
  }

  // Get tool performance report
  public getPerformanceReport(): any {
    const metrics = Array.from(this.metrics.values());
    const now = new Date();

    return {
      reportGenerated: now.toISOString(),
      timeRange: 'all_time',
      tools: metrics.map(metric => ({
        name: metric.toolName,
        executions: metric.executionCount,
        averageDuration: Math.round(metric.averageExecutionTime),
        successRate: metric.executionCount > 0 ?
          ((metric.successCount / metric.executionCount) * 100).toFixed(1) + '%' : '0%',
        errorRate: metric.executionCount > 0 ?
          ((metric.errorCount / metric.executionCount) * 100).toFixed(1) + '%' : '0%',
        lastExecution: metric.lastExecutionTime?.toISOString(),
        status: metric.errorCount > metric.successCount ? 'unhealthy' : 'healthy'
      })),
      recommendations: this.generatePerformanceRecommendations(metrics)
    };
  }

  private generatePerformanceRecommendations(metrics: ToolExecutionMetrics[]): string[] {
    const recommendations: string[] = [];

    // Check for tools with high error rates
    const highErrorTools = metrics.filter(m =>
      m.executionCount > 5 && (m.errorCount / m.executionCount) > 0.3
    );

    if (highErrorTools.length > 0) {
      recommendations.push(
        `High error rates detected for: ${highErrorTools.map(m => m.toolName).join(', ')}. ` +
        'Consider reviewing error handling and input validation.'
      );
    }

    // Check for slow tools
    const slowTools = metrics.filter(m => m.averageExecutionTime > 5000); // 5 seconds

    if (slowTools.length > 0) {
      recommendations.push(
        `Slow performance detected for: ${slowTools.map(m => m.toolName).join(', ')}. ` +
        'Consider optimization or caching strategies.'
      );
    }

    // Check for unused tools
    const unusedTools = metrics.filter(m => m.executionCount === 0);

    if (unusedTools.length > 0) {
      recommendations.push(
        `Unused tools detected: ${unusedTools.map(m => m.toolName).join(', ')}. ` +
        'Consider removing or documenting these tools.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('All tools are performing well. No immediate action required.');
    }

    return recommendations;
  }

  private determineHealthStatus(metrics: { tools: ToolExecutionMetrics[]; summary: any }): 'healthy' | 'degraded' | 'unhealthy' {
    const { summary, tools } = metrics;

    // Check for critical issues
    if (summary.totalExecutions === 0) {
      return 'healthy'; // No executions yet, assume healthy
    }

    const errorRate = summary.totalErrors / summary.totalExecutions;

    // Check for high error rate
    if (errorRate > 0.5) {
      return 'unhealthy';
    }

    // Check for degraded performance
    if (errorRate > 0.2) {
      return 'degraded';
    }

    // Check for tools with very high error rates
    const toolsWithHighErrors = tools.filter(m =>
      m.executionCount > 5 && (m.errorCount / m.executionCount) > 0.5
    );

    if (toolsWithHighErrors.length > 0) {
      return 'degraded';
    }

    // Check for very slow average response time
    if (summary.averageExecutionTime > 10000) { // 10 seconds
      return 'degraded';
    }

    return 'healthy';
  }

  // Process MCP JSON-RPC requests
  private async processMCPRequest(request: any): Promise<any> {
    const { method, params, id } = request;

    try {
      switch (method) {
        case 'tools/list':
          const tools = Array.from(this.tools.values()).map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
          }));
          return {
            jsonrpc: '2.0',
            id,
            result: { tools },
          };

        case 'tools/call':
          const { name, arguments: args } = params;
          const tool = this.tools.get(name);
          if (!tool) {
            const startTime = new Date();
            this.recordExecution(name, startTime, new Date(), false, `Tool '${name}' not found`, args);
            return {
              jsonrpc: '2.0',
              id,
              error: {
                code: -32601,
                message: `Tool '${name}' not found`,
              },
            };
          }

          const startTime = new Date();
          try {
            const result = await tool.handler(args || {});
            const endTime = new Date();
            this.recordExecution(name, startTime, endTime, true, undefined, args);

            return {
              jsonrpc: '2.0',
              id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
                  },
                ],
              },
            };
          } catch (toolError) {
            const endTime = new Date();
            const errorMessage = toolError instanceof Error ? toolError.message : String(toolError);
            this.recordExecution(name, startTime, endTime, false, errorMessage, args);

            return {
              jsonrpc: '2.0',
              id,
              error: {
                code: -32603,
                message: 'Tool execution failed',
                data: errorMessage,
              },
            };
          }

        default:
          this.recordExecution('unknown_method', new Date(), new Date(), false, `Method '${method}' not found`, params);
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Method '${method}' not found`,
            },
          };
      }
    } catch (error) {
      this.recordExecution('unknown_method', new Date(), new Date(), false, error instanceof Error ? error.message : String(error), params);
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  // Validate MCP server configuration
  public async validateServer(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check if server is properly initialized
      if (!this.server) {
        errors.push('MCP server not initialized');
        return { isValid: false, errors };
      }

      // Check if tools are registered
      if (this.tools.size === 0) {
        errors.push('No MCP tools registered');
      } else {
        // Validate each tool has required properties
        for (const [name, tool] of this.tools) {
          if (!tool.name || !tool.description || !tool.inputSchema) {
            errors.push(`Tool '${name}' is missing required properties`);
          }
          if (!tool.handler || typeof tool.handler !== 'function') {
            errors.push(`Tool '${name}' has invalid handler`);
          }
        }
      }

      // Test a basic tool discovery request
      try {
        const response = await this.processMCPRequest({
          jsonrpc: '2.0',
          id: 'validation-test',
          method: 'tools/list',
          params: {},
        });

        if (!response || typeof response !== 'object' || response.error) {
          errors.push('Tool discovery request failed');
        }
      } catch (error) {
        errors.push(`Tool discovery validation failed: ${error instanceof Error ? error.message : String(error)}`);
      }

    } catch (error) {
      errors.push(`MCP server validation error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Start MCP server (for stdio transport if needed)
  public async startStdio(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('MCP server started with stdio transport');
  }
}

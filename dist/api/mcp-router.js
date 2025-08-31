/**
 * MCP Server Router for Memento
 * Provides MCP protocol support for AI assistants (Claude, etc.)
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListResourcesRequestSchema, ListToolsRequestSchema, McpError, ReadResourceRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
export class MCPRouter {
    kgService;
    dbService;
    astParser;
    server;
    tools = new Map();
    constructor(kgService, dbService, astParser) {
        this.kgService = kgService;
        this.dbService = dbService;
        this.astParser = astParser;
        this.server = new Server({
            name: 'memento-mcp-server',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
                resources: {},
            },
        });
        this.registerTools();
        this.setupRequestHandlers();
    }
    registerTools() {
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
    registerTool(tool) {
        this.tools.set(tool.name, tool);
    }
    setupRequestHandlers() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            const tools = Array.from(this.tools.values()).map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema,
            }));
            return { tools };
        });
        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            const tool = this.tools.get(name);
            if (!tool) {
                throw new McpError(ErrorCode.MethodNotFound, `Tool '${name}' not found`);
            }
            try {
                const result = await tool.handler(args || {});
                return {
                    content: [
                        {
                            type: 'text',
                            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
        // List resources (placeholder for future implementation)
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
            return { resources: [] };
        });
        // Read resource (placeholder for future implementation)
        this.server.setRequestHandler(ReadResourceRequestSchema, async () => {
            throw new McpError(ErrorCode.MethodNotFound, 'Resource operations not yet implemented');
        });
    }
    // Tool handlers (with placeholder implementations for Phase 1.3)
    async handleCreateSpec(params) {
        // Placeholder implementation - will be replaced in Phase 2.1
        console.log('MCP Tool called: design.create_spec', params);
        return {
            specId: `spec_${Date.now()}`,
            spec: {
                id: `spec_${Date.now()}`,
                title: params.title,
                description: params.description,
                status: 'draft',
                created: new Date().toISOString(),
            },
            message: 'Specification creation placeholder - implementation pending Phase 2.1',
            note: 'This is a placeholder implementation. Full functionality will be available after Phase 2.1 (Graph Schema Implementation)',
        };
    }
    async handleGraphSearch(params) {
        // Placeholder implementation - will be replaced in Phase 2.1
        console.log('MCP Tool called: graph.search', params);
        return {
            results: [],
            total: 0,
            query: params.query,
            message: 'Graph search placeholder - implementation pending Phase 2.1',
            note: 'This is a placeholder implementation. Full functionality will be available after Phase 2.1 (Graph Schema Implementation)',
        };
    }
    async handleGetExamples(params) {
        // Placeholder implementation - will be replaced in Phase 2.3
        console.log('MCP Tool called: graph.examples', params);
        return {
            entityId: params.entityId,
            examples: [],
            message: 'Examples retrieval placeholder - implementation pending Phase 2.3',
            note: 'This is a placeholder implementation. Full functionality will be available after Phase 2.3 (Code Parser Implementation)',
        };
    }
    async handleProposeDiff(params) {
        // Placeholder implementation - will be replaced in Phase 3.1
        console.log('MCP Tool called: code.propose_diff', params);
        return {
            changes: params.changes,
            analysis: {
                breakingChanges: [],
                impactAnalysis: {
                    directImpact: [],
                    indirectImpact: [],
                    testImpact: [],
                },
                recommendations: [],
            },
            message: 'Code analysis placeholder - implementation pending Phase 3.1',
            note: 'This is a placeholder implementation. Full functionality will be available after Phase 3.1 (Knowledge Graph Service)',
        };
    }
    async handleValidateCode(params) {
        // Placeholder implementation - will be replaced in Phase 4.1
        console.log('MCP Tool called: validate.run', params);
        return {
            validation: {
                overall: {
                    passed: true,
                    score: 85,
                    duration: 100,
                },
                typescript: { errors: 0, warnings: 0, issues: [] },
                eslint: { errors: 0, warnings: 0, issues: [] },
                security: { critical: 0, high: 0, medium: 0, low: 0, issues: [] },
                tests: { passed: 0, failed: 0, skipped: 0, coverage: {} },
                architecture: { violations: 0, issues: [] },
            },
            message: 'Validation placeholder - implementation pending Phase 4.1',
            note: 'This is a placeholder implementation. Full functionality will be available after Phase 4.1 (REST API Implementation)',
        };
    }
    async handlePlanTests(params) {
        // Placeholder implementation - will be replaced in Phase 5.2
        console.log('MCP Tool called: tests.plan_and_generate', params);
        return {
            specId: params.specId,
            testPlan: {
                unitTests: [],
                integrationTests: [],
                e2eTests: [],
                performanceTests: [],
            },
            estimatedCoverage: {},
            message: 'Test planning placeholder - implementation pending Phase 5.2',
            note: 'This is a placeholder implementation. Full functionality will be available after Phase 5.2 (Test Integration)',
        };
    }
    async handleSecurityScan(params) {
        // Placeholder implementation - will be replaced in Phase 5.3
        console.log('MCP Tool called: security.scan', params);
        return {
            scan: {
                issues: [],
                vulnerabilities: [],
                summary: {
                    totalIssues: 0,
                    bySeverity: {},
                    byType: {},
                },
            },
            summary: {
                totalIssues: 0,
                bySeverity: {},
                byType: {},
            },
            message: 'Security scan placeholder - implementation pending Phase 5.3',
            note: 'This is a placeholder implementation. Full functionality will be available after Phase 5.3 (Security Scanner)',
        };
    }
    async handleImpactAnalysis(params) {
        // Placeholder implementation - will be replaced in Phase 3.1
        console.log('MCP Tool called: impact.analyze', params);
        return {
            changes: params.changes,
            impact: {
                directImpact: [],
                cascadingImpact: [],
                testImpact: {
                    affectedTests: [],
                    requiredUpdates: [],
                    coverageImpact: 0,
                },
                documentationImpact: {
                    staleDocs: [],
                    requiredUpdates: [],
                },
                recommendations: [],
            },
            message: 'Impact analysis placeholder - implementation pending Phase 3.1',
            note: 'This is a placeholder implementation. Full functionality will be available after Phase 3.1 (Knowledge Graph Service)',
        };
    }
    async handleSyncDocs(params) {
        // Placeholder implementation - will be replaced in Phase 5.1
        console.log('MCP Tool called: docs.sync', params);
        return {
            sync: {
                processedFiles: 0,
                newDomains: 0,
                updatedClusters: 0,
                errors: [],
            },
            message: 'Documentation sync placeholder - implementation pending Phase 5.1',
            note: 'This is a placeholder implementation. Full functionality will be available after Phase 5.1 (Documentation Parser)',
        };
    }
    // Fastify route registration
    registerRoutes(app) {
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
                    const body = request.body;
                    const response = await this.processMCPRequest(body);
                    return reply.send(response);
                }
                catch (error) {
                    return reply.status(500).send({
                        jsonrpc: '2.0',
                        id: request.body?.id,
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
        // MCP health check
        app.get('/mcp/health', async (request, reply) => {
            return reply.send({
                status: 'healthy',
                server: 'memento-mcp-server',
                version: '1.0.0',
                tools: this.tools.size,
                timestamp: new Date().toISOString(),
            });
        });
    }
    // Get the MCP server instance (for advanced integrations)
    getServer() {
        return this.server;
    }
    // Get tool count for validation
    getToolCount() {
        return this.tools.size;
    }
    // Process MCP JSON-RPC requests
    async processMCPRequest(request) {
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
                        return {
                            jsonrpc: '2.0',
                            id,
                            error: {
                                code: -32601,
                                message: `Tool '${name}' not found`,
                            },
                        };
                    }
                    const result = await tool.handler(args || {});
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
                default:
                    return {
                        jsonrpc: '2.0',
                        id,
                        error: {
                            code: -32601,
                            message: `Method '${method}' not found`,
                        },
                    };
            }
        }
        catch (error) {
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
    async validateServer() {
        const errors = [];
        try {
            // Check if server is properly initialized
            if (!this.server) {
                errors.push('MCP server not initialized');
                return { isValid: false, errors };
            }
            // Check if tools are registered
            if (this.tools.size === 0) {
                errors.push('No MCP tools registered');
            }
            else {
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
            }
            catch (error) {
                errors.push(`Tool discovery validation failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        catch (error) {
            errors.push(`MCP server validation error: ${error instanceof Error ? error.message : String(error)}`);
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    // Start MCP server (for stdio transport if needed)
    async startStdio() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.log('MCP server started with stdio transport');
    }
}
//# sourceMappingURL=mcp-router.js.map
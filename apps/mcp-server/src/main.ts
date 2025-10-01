#!/usr/bin/env node

/**
 * MCP Server - Model Context Protocol server for Memento
 * Provides AI agents with structured access to codebase knowledge
 */

import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { DatabaseService, createDatabaseConfig } from '@memento/database';
import { KnowledgeGraphService, ASTParser, DocumentationParser } from '@memento/knowledge';
import type { GraphSearchRequest } from '@memento/shared-types';
import { FileWatcher } from '@memento/core';
import { SecurityScanner } from '@memento/testing';
import { SynchronizationCoordinator } from '@memento/sync/synchronization';
import { ConflictResolution, RollbackCapabilities } from '@memento/sync/scm';
import * as fs from 'fs/promises';
import * as path from 'path';

// Initialize services
let dbService: DatabaseService;
let kgService: KnowledgeGraphService;
let astParser: ASTParser;
let docParser: DocumentationParser;
let securityScanner: SecurityScanner;
let syncCoordinator: SynchronizationCoordinator;
let fileWatcher: FileWatcher;

async function initializeServices() {
  // Initialize database service
  const dbConfig = createDatabaseConfig();
  dbService = new DatabaseService(dbConfig);
  await dbService.initialize();
  await dbService.setupDatabase();

  // Initialize knowledge graph service
  const neo4jConfig = {
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    username: process.env.NEO4J_USERNAME || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'password',
    database: process.env.NEO4J_DATABASE || 'neo4j',
  };
  kgService = new KnowledgeGraphService(neo4jConfig);
  await kgService.initialize();

  // Initialize AST parser
  astParser = new ASTParser();
  if ('initialize' in astParser && typeof (astParser as any).initialize === 'function') {
    await (astParser as any).initialize();
  }

  // Initialize documentation parser
  docParser = new DocumentationParser(kgService, dbService);

  // Initialize security scanner
  securityScanner = new SecurityScanner(dbService, kgService);
  await securityScanner.initialize();

  // Initialize synchronization services
  const conflictResolver = new ConflictResolution(kgService);
  const rollbackCapabilities = new RollbackCapabilities(kgService, dbService);
  syncCoordinator = new SynchronizationCoordinator(
    kgService,
    astParser,
    dbService,
    conflictResolver,
    rollbackCapabilities
  );

  // Initialize file watcher
  fileWatcher = new FileWatcher({
    watchPaths: ['src', 'lib', 'packages', 'tests'],
    debounceMs: 500,
    maxConcurrent: 10,
  });
  await fileWatcher.start();
}

async function main() {
  console.log('🚀 Starting MCP Server for Memento...');

  try {
    // Initialize all services
    await initializeServices();

    // Create MCP server
    const server = new Server(
      {
        name: 'memento-mcp',
        version: '0.1.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
          prompts: {},
        },
      }
    );

    // Register tools
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'analyze_code',
          description: 'Analyze code structure and relationships',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'File or directory path to analyze',
              },
              includeRelationships: {
                type: 'boolean',
                description: 'Include relationship analysis',
                default: true,
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'search_codebase',
          description: 'Search for code entities, patterns, or dependencies',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query (function names, classes, patterns)',
              },
              type: {
                type: 'string',
                enum: ['function', 'class', 'interface', 'type', 'variable', 'import', 'all'],
                description: 'Type of entity to search for',
                default: 'all',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'get_dependencies',
          description: 'Get dependencies and dependents of a file or module',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'File or module path',
              },
              depth: {
                type: 'number',
                description: 'Depth of dependency tree',
                default: 2,
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'security_scan',
          description: 'Run security analysis on code',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to scan',
              },
              scanType: {
                type: 'string',
                enum: ['vulnerabilities', 'dependencies', 'secrets', 'all'],
                default: 'all',
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'get_documentation',
          description: 'Extract and analyze documentation',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'File or directory path',
              },
              format: {
                type: 'string',
                enum: ['markdown', 'jsdoc', 'inline', 'all'],
                default: 'all',
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'sync_knowledge_graph',
          description: 'Synchronize codebase with knowledge graph',
          inputSchema: {
            type: 'object',
            properties: {
              fullSync: {
                type: 'boolean',
                description: 'Perform full synchronization',
                default: false,
              },
              includeEmbeddings: {
                type: 'boolean',
                description: 'Generate embeddings for semantic search',
                default: false,
              },
            },
          },
        },
      ],
    }));

    // Handle tool calls
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: rawArgs } = request.params;
      const args = (rawArgs ?? {}) as Record<string, any>;

      try {
        switch (name) {
          case 'analyze_code': {
            const analysis = await astParser.parseFile(args.path as string);
            if (args.includeRelationships) {
              const relationships = await kgService.getRelationships({
                fromEntityId: args.path as string,
                limit: 100,
              } as any);
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(
                      {
                        analysis,
                        relationships,
                      },
                      null,
                      2
                    ),
                  },
                ],
              };
            }
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(analysis, null, 2),
                },
              ],
            };
          }

          case 'search_codebase': {
            const allowedEntityTypes = [
              'function',
              'class',
              'interface',
              'file',
              'module',
              'spec',
              'test',
              'change',
              'session',
              'directory',
            ] as const;
            type EntityType = NonNullable<GraphSearchRequest['entityTypes']>[number];

            const toEntityType = (value: unknown): EntityType | undefined =>
              typeof value === 'string' && (allowedEntityTypes as readonly string[]).includes(value)
                ? (value as EntityType)
                : undefined;

            const normalizedEntityTypes =
              args.type && args.type !== 'all' ? toEntityType(args.type) : undefined;

            const results = await kgService.searchEntities({
              query: String(args.query ?? ''),
              entityTypes: normalizedEntityTypes ? [normalizedEntityTypes] : undefined,
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(results, null, 2),
                },
              ],
            };
          }

          case 'get_dependencies': {
            const dependencies = await kgService.getEntityDependencies(
              args.path as string,
              { maxDepth: (args.depth as number) ?? 2 }
            );
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(dependencies, null, 2),
                },
              ],
            };
          }

          case 'security_scan': {
            const entityIds: string[] | undefined = Array.isArray(args.entityIds)
              ? args.entityIds.map(String)
              : typeof args.path === 'string'
              ? [args.path]
              : undefined;
            const scanTypes = Array.isArray(args.scanTypes)
              ? (args.scanTypes as any)
              : undefined;
            const results = await securityScanner.performScan({
              entityIds,
              scanTypes,
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(results, null, 2),
                },
              ],
            };
          }

          case 'get_documentation': {
            const docs = await docParser.syncDocumentation(
              args.path as string
            );
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(docs, null, 2),
                },
              ],
            };
          }

          case 'sync_knowledge_graph': {
            let operationId: string;
            if (args.fullSync) {
              operationId = await syncCoordinator.startFullSynchronization({
                includeEmbeddings: args.includeEmbeddings as boolean,
              });
            } else {
              const changes = await fileWatcher.getPendingChanges();
              operationId = await syncCoordinator.synchronizeFileChanges(changes);
            }

            // Wait for completion
            const result = await waitForSync(operationId);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });

    // Register resources (codebase files)
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = await getCodebaseResources();
      return { resources };
    });

    // Handle resource reading
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      const filePath = uri.replace('file://', '');
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: content,
          },
        ],
      };
    });

    // Register prompts
    server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: [
        {
          name: 'analyze_project',
          description: 'Analyze entire project structure and provide insights',
        },
        {
          name: 'find_issues',
          description: 'Find potential issues and code smells',
        },
        {
          name: 'suggest_refactoring',
          description: 'Suggest refactoring opportunities',
        },
      ],
    }));

    // Handle prompt requests
    server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name } = request.params;

      switch (name) {
        case 'analyze_project':
          return {
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: 'Please analyze the project structure and provide insights about architecture, patterns, and potential improvements.',
                },
              },
            ],
          };
        case 'find_issues':
          return {
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: 'Find potential issues, code smells, and security vulnerabilities in the codebase.',
                },
              },
            ],
          };
        case 'suggest_refactoring':
          return {
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: 'Suggest refactoring opportunities to improve code quality, maintainability, and performance.',
                },
              },
            ],
          };
        default:
          throw new Error(`Unknown prompt: ${name}`);
      }
    });

    // Start the server
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.log('🎉 MCP Server is running!');
    console.log('📡 Listening for MCP protocol connections via stdio');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down MCP server...');
      await cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down MCP server...');
      await cleanup();
      process.exit(0);
    });

  } catch (error) {
    console.error('💥 Failed to start MCP Server:', error);
    process.exit(1);
  }
}

async function waitForSync(operationId: string): Promise<any> {
  const maxWait = 60000; // 1 minute
  const pollInterval = 1000; // 1 second
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    const status = syncCoordinator.getOperationStatus(operationId);
    if (status && ['completed', 'failed', 'rolled_back'].includes(status.status)) {
      return status;
    }
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Sync operation timed out');
}

async function getCodebaseResources(): Promise<Array<{uri: string, name: string, description: string, mimeType: string}>> {
  const resources: Array<{uri: string, name: string, description: string, mimeType: string}> = [];
  const watchPaths = fileWatcher.getWatchedPaths();

  for (const watchPath of watchPaths) {
    const files = await getFilesRecursively(watchPath);
    for (const file of files) {
      resources.push({
        uri: `file://${path.resolve(file)}`,
        name: path.basename(file),
        description: `Source file: ${file}`,
        mimeType: 'text/plain',
      });
    }
  }

  return resources;
}

async function getFilesRecursively(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...await getFilesRecursively(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist or not accessible
  }

  return files;
}

async function cleanup() {
  try {
    if (fileWatcher) await fileWatcher.stop();
    if (dbService) await dbService.close();
    if (kgService) await kgService.close();
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Start the server
main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

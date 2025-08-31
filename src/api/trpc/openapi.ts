/**
 * OpenAPI Integration for tRPC
 * Generates OpenAPI documentation from tRPC routes
 */

import { generateOpenApiDocument } from 'trpc-openapi';
import { appRouter } from './router.js';

// @ts-ignore - tRPC OpenAPI type compatibility issue
export const openApiDocument: ReturnType<typeof generateOpenApiDocument> = generateOpenApiDocument(appRouter, {
  title: 'Memento API',
  description: 'AI coding assistant with comprehensive codebase awareness through knowledge graphs. Provides REST and WebSocket APIs for code analysis, knowledge graph operations, and system management.',
  version: '0.1.0',
  baseUrl: 'http://localhost:3000/api/trpc',
  docsUrl: 'http://localhost:3000/docs',
  tags: [
    {
      name: 'Graph Operations',
      description: 'Knowledge graph search, entity management, and relationship queries',
    },
    {
      name: 'Code Analysis',
      description: 'Code validation, analysis, refactoring suggestions, and complexity assessment',
    },
    {
      name: 'Administration',
      description: 'System health monitoring, analytics, synchronization management, and configuration',
    },
    {
      name: 'Design System',
      description: 'Design system and specification management',
    },
  ],
  info: {
    contact: {
      name: 'Memento Team',
      url: 'https://github.com/your-org/memento',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://api.memento.dev',
      description: 'Production server',
    },
  ],
});

// Export for use in documentation routes
export { openApiDocument as openApiSpec };

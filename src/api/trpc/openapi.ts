/**
 * OpenAPI Integration for tRPC
 * Generates OpenAPI documentation from tRPC routes
 */

import { generateOpenApiDocument } from 'trpc-openapi';
import { appRouter } from './router.js';

// @ts-ignore - tRPC OpenAPI type compatibility issue
export const openApiDocument: ReturnType<typeof generateOpenApiDocument> = generateOpenApiDocument(appRouter, {
  title: 'Memento API',
  description: 'AI coding assistant with comprehensive codebase awareness through knowledge graphs',
  version: '0.1.0',
  baseUrl: 'http://localhost:3000/api/trpc',
  docsUrl: 'http://localhost:3000/docs',
  tags: [
    {
      name: 'Code Analysis',
      description: 'Code analysis and refactoring operations',
    },
    {
      name: 'Design System',
      description: 'Design system and specification management',
    },
    {
      name: 'Knowledge Graph',
      description: 'Knowledge graph operations and queries',
    },
    {
      name: 'Admin',
      description: 'Administrative operations and system management',
    },
  ],
});

// Export for use in documentation routes
export { openApiDocument as openApiSpec };

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
    'Graph Operations',
    'Code Analysis',
    'Administration',
    'Design System'
  ]
});

// Export for use in documentation routes
export { openApiDocument as openApiSpec };

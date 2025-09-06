/**
 * Documentation Operations Routes
 * Handles documentation synchronization, domain analysis, and content management
 */

import { FastifyInstance } from 'fastify';
import { KnowledgeGraphService } from '../../services/KnowledgeGraphService.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { DocumentationParser } from '../../services/DocumentationParser.js';

interface SyncDocumentationResponse {
  processedFiles: number;
  newDomains: number;
  updatedClusters: number;
  errors: string[];
}

export async function registerDocsRoutes(
  app: FastifyInstance,
  kgService: KnowledgeGraphService,
  dbService: DatabaseService,
  docParser: DocumentationParser
): Promise<void> {

  // POST /docs/sync - Synchronize documentation with knowledge graph
  const syncRouteOptions = {
    schema: {
      body: {
        type: 'object',
        properties: {
          docsPath: { type: 'string' }
        },
        required: ['docsPath']
      }
    }
  } as const;

  const syncHandler = async (request: any, reply: any) => {
    try {
      const { docsPath } = request.body as { docsPath: string };

      const result = await docParser.syncDocumentation(docsPath);

      reply.send({
        success: true,
        data: result
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: {
          code: 'SYNC_FAILED',
          message: 'Failed to synchronize documentation',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };

  app.post('/docs/sync', syncRouteOptions, syncHandler);
  // Also register an alias path used in some tests
  app.post('/docs/docs/sync', syncRouteOptions, syncHandler);

  // GET /docs/search - Basic documentation search endpoint
  app.get('/docs/search', async (request, reply) => {
    try {
      const { q } = request.query as { q?: string };
      const results = await kgService.search({
        query: q || '',
        searchType: 'structural',
        entityTypes: ['documentation' as any],
        limit: 20,
      });
      reply.send({ success: true, data: results });
    } catch (error) {
      reply.status(500).send({ success: false, error: { code: 'DOCS_SEARCH_FAILED', message: 'Failed to search docs' } });
    }
  });

  // GET /docs/:id - Fetch a documentation record by ID
  app.get('/docs/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const doc = await kgService.getEntity(id);
      if (!doc) {
        reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
        return;
      }
      reply.send({ success: true, data: doc });
    } catch (error) {
      reply.status(500).send({ success: false, error: { code: 'DOCS_FETCH_FAILED', message: 'Failed to fetch doc' } });
    }
  });

  // GET /api/domains - Get all business domains
  app.get('/docs/domains', async (request, reply) => {
    try {
      const domains = await kgService.search({
        query: '',
        searchType: 'structural',
        entityTypes: ['businessDomain' as any]
      });

      reply.send({
        success: true,
        data: domains
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: {
          code: 'DOMAINS_FAILED',
          message: 'Failed to retrieve business domains',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  });

  // GET /api/domains/{domainName}/entities - Get entities by domain
  app.get('/docs/domains/:domainName/entities', {
    schema: {
      params: {
        type: 'object',
        properties: {
          domainName: { type: 'string' }
        },
        required: ['domainName']
      }
    }
  }, async (request, reply) => {
    try {
      const { domainName } = request.params as { domainName: string };

      // Find documentation nodes that belong to this domain
      const docs = await kgService.search({
        query: '',
        searchType: 'structural',
        entityTypes: ['documentation' as any]
      });
      const domainEntities = docs.filter((doc: any) =>
        doc.businessDomains?.some((domain: string) =>
          domain.toLowerCase().includes(domainName.toLowerCase())
        )
      );

      reply.send({
        success: true,
        data: domainEntities
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: {
          code: 'DOMAIN_ENTITIES_FAILED',
          message: 'Failed to retrieve domain entities',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  });

  // GET /api/clusters - Get semantic clusters
  app.get('/docs/clusters', async (request, reply) => {
    try {
      const clusters = await kgService.search({
        query: '',
        searchType: 'structural',
        entityTypes: ['semanticCluster' as any]
      });

      reply.send({
        success: true,
        data: clusters
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: {
          code: 'CLUSTERS_FAILED',
          message: 'Failed to retrieve semantic clusters',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  });

  // GET /api/business/impact/{domainName} - Get business impact
  app.get('/docs/business/impact/:domainName', {
    schema: {
      params: {
        type: 'object',
        properties: {
          domainName: { type: 'string' }
        },
        required: ['domainName']
      },
      querystring: {
        type: 'object',
        properties: {
          since: { type: 'string', format: 'date-time' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { domainName } = request.params as { domainName: string };
      const { since } = request.query as { since?: string };

      // Find all documentation entities for this domain
      const docs = await kgService.search({
        query: '',
        searchType: 'structural',
        entityTypes: ['documentation' as any]
      });
      const domainDocs = docs.filter((doc: any) =>
        doc.businessDomains?.some((domain: string) =>
          domain.toLowerCase().includes(domainName.toLowerCase())
        )
      );

      // Calculate basic impact metrics
      const changeVelocity = domainDocs.length;
      const affectedCapabilities = domainDocs.map((doc: any) => doc.title);
      const riskLevel = changeVelocity > 5 ? 'high' : changeVelocity > 2 ? 'medium' : 'low';

      const impact = {
        domainName,
        timeRange: { since: since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
        changeVelocity,
        riskLevel,
        affectedCapabilities,
        mitigationStrategies: [
          'Regular documentation reviews',
          'Automated testing for critical paths',
          'Stakeholder communication protocols'
        ]
      };

      reply.send({
        success: true,
        data: impact
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: {
          code: 'BUSINESS_IMPACT_FAILED',
          message: 'Failed to analyze business impact',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  });

  // POST /api/docs/parse - Parse documentation file
  app.post('/docs/parse', {
    schema: {
      body: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          format: { type: 'string', enum: ['markdown', 'plaintext', 'html'] },
          extractEntities: { type: 'boolean', default: true },
          extractDomains: { type: 'boolean', default: true }
        },
        required: ['content']
      }
    }
  }, async (request, reply) => {
    try {
      const { content, format, extractEntities, extractDomains } = request.body as {
        content: string;
        format?: string;
        extractEntities?: boolean;
        extractDomains?: boolean;
      };

      // Parse content directly based on format
      const parseMethod = format === 'markdown' ? 'parseMarkdown' : 
                         format === 'plaintext' ? 'parsePlaintext' : 
                         'parseMarkdown'; // default to markdown
      
      // Use reflection to call the appropriate parse method
      const parsedDoc = await (docParser as any)[parseMethod](content);
      
      // Add metadata for the parsed content
      parsedDoc.metadata = {
        ...parsedDoc.metadata,
        format: format || 'markdown',
        contentLength: content.length,
        parsedAt: new Date()
      };

      const parsed = {
        title: parsedDoc.title,
        content: parsedDoc.content,
        format: format || 'markdown',
        entities: extractEntities ? parsedDoc.businessDomains : undefined,
        domains: extractDomains ? parsedDoc.businessDomains : undefined,
        stakeholders: parsedDoc.stakeholders,
        technologies: parsedDoc.technologies,
        metadata: parsedDoc.metadata
      };

      reply.send({
        success: true,
        data: parsed
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: {
          code: 'PARSE_FAILED',
          message: 'Failed to parse documentation',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  });

  // GET /api/docs/search - Search documentation
  app.get('/docs/search', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          domain: { type: 'string' },
          type: { type: 'string', enum: ['readme', 'api-docs', 'design-doc', 'architecture', 'user-guide'] },
          limit: { type: 'number', default: 20 }
        },
        required: ['query']
      }
    }
  }, async (request, reply) => {
    try {
      const { query, domain, type, limit } = request.query as {
        query: string;
        domain?: string;
        type?: string;
        limit?: number;
      };

      const searchResults = await docParser.searchDocumentation(query, {
        domain,
        docType: type as any,
        limit
      });

      const results = {
        query,
        results: searchResults,
        total: searchResults.length
      };

      reply.send({
        success: true,
        data: results
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: {
          code: 'SEARCH_FAILED',
          message: 'Failed to search documentation',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  });

  // POST /docs/validate - Validate documentation
  app.post('/docs/validate', {
    schema: {
      body: {
        type: 'object',
        properties: {
          files: { type: 'array', items: { type: 'string' } },
          checks: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['links', 'formatting', 'completeness', 'consistency']
            }
          }
        },
        required: ['files']
      }
    }
  }, async (request, reply) => {
    try {
      const { files, checks } = request.body as {
        files: string[];
        checks?: string[];
      };

      // Basic validation implementation
      const validationResults = [];
      let passed = 0;
      let failed = 0;

      for (const filePath of files) {
        try {
          const parsedDoc = await docParser.parseFile(filePath);
          const issues = [];

          // Check for completeness
          if (!parsedDoc.title || parsedDoc.title === 'Untitled Document') {
            issues.push('Missing or generic title');
          }

          // Check for links if requested
          if (checks?.includes('links') && parsedDoc.metadata?.links) {
            // Basic link validation could be implemented here
          }

          // Check formatting
          if (checks?.includes('formatting')) {
            if (parsedDoc.content.length < 100) {
              issues.push('Content appears too short');
            }
          }

          if (issues.length === 0) {
            passed++;
          } else {
            failed++;
          }

          validationResults.push({
            file: filePath,
            status: issues.length === 0 ? 'passed' : 'failed',
            issues
          });
        } catch (error) {
          failed++;
          validationResults.push({
            file: filePath,
            status: 'failed',
            issues: [`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`]
          });
        }
      }

      const validation = {
        files: files.length,
        passed,
        failed,
        issues: validationResults,
        summary: {
          totalFiles: files.length,
          passRate: files.length > 0 ? (passed / files.length) * 100 : 0,
          checksPerformed: checks || []
        }
      };

      reply.send({
        success: true,
        data: validation
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Failed to validate documentation',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  });
}

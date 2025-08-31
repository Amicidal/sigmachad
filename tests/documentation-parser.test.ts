/**
 * Documentation Parser Test Suite
 * Tests for Phase 5.1 - Documentation Parser Implementation
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { DocumentationParser } from '../src/services/DocumentationParser';
import { KnowledgeGraphService } from '../src/services/KnowledgeGraphService';
import { DatabaseService } from '../src/services/DatabaseService';
import { join } from 'path';
import { promises as fs } from 'fs';

// Mock the services
const mockKgService = {
  findEntitiesByType: jest.fn(),
  createEntity: jest.fn(),
  getEntity: jest.fn(),
  createOrUpdateEntity: jest.fn(),
  getRelationships: jest.fn()
} as any;

const mockDbService = {
  postgresQuery: jest.fn(),
  falkordbQuery: jest.fn(),
  qdrant: {
    upsert: jest.fn(),
    search: jest.fn()
  }
} as any;

jest.mock('../src/services/KnowledgeGraphService', () => ({
  KnowledgeGraphService: jest.fn().mockImplementation(() => mockKgService)
}));

jest.mock('../src/services/DatabaseService', () => ({
  DatabaseService: jest.fn().mockImplementation(() => mockDbService)
}));

describe('DocumentationParser', () => {
  let docParser: DocumentationParser;

  beforeAll(() => {
    // Mock the required methods with proper return values
    mockKgService.findEntitiesByType.mockResolvedValue([]);
    mockKgService.createEntity.mockResolvedValue(undefined);
    mockKgService.getEntity.mockResolvedValue(null);
    mockKgService.createOrUpdateEntity.mockResolvedValue(undefined);
    mockKgService.getRelationships.mockResolvedValue([]);

    mockDbService.postgresQuery.mockResolvedValue({ rows: [] });
    mockDbService.falkordbQuery.mockResolvedValue([]);
    mockDbService.qdrant.upsert.mockResolvedValue(undefined);
    mockDbService.qdrant.search.mockResolvedValue({ points: [] });

    // Initialize DocumentationParser with mocked services
    docParser = new DocumentationParser(mockKgService, mockDbService);
  });

  describe('Markdown Parsing', () => {
    it('should parse markdown content correctly', async () => {
      const markdownContent = `# Test Document

## Overview
This is a test document for the authentication system.

### Technologies
- TypeScript
- Node.js
- Docker

### Business Domain
This document covers user authentication and security compliance.

### Stakeholders
- Product Owner
- Development Team
- Security Analyst
`;

      const parsed = await docParser.parseMarkdown(markdownContent);

      expect(parsed.title).toBe('Test Document');
      expect(parsed.content).toBe(markdownContent);
      expect(parsed.docType).toBeDefined();
      expect(parsed.businessDomains).toContain('authentication');
      expect(parsed.businessDomains).toContain('security compliance');
      expect(parsed.technologies).toContain('typescript');
      expect(parsed.technologies).toContain('node.js');
      expect(parsed.technologies).toContain('docker');
      expect(parsed.stakeholders).toContain('product owner');
      expect(parsed.stakeholders).toContain('development team');
      expect(parsed.stakeholders).toContain('security analyst');
    });

    it('should extract headings from markdown', async () => {
      const markdownContent = `# Main Title
## Section 1
### Subsection 1.1
## Section 2`;

      const parsed = await docParser.parseMarkdown(markdownContent);
      
      expect(parsed.metadata.headings).toBeDefined();
      expect(parsed.metadata.headings).toHaveLength(4);
      expect(parsed.metadata.headings[0]).toEqual({ level: 1, text: 'Main Title' });
      expect(parsed.metadata.headings[1]).toEqual({ level: 2, text: 'Section 1' });
    });

    it('should extract code blocks from markdown', async () => {
      const markdownContent = `# Code Examples

\`\`\`typescript
const example = 'test';
\`\`\`

\`\`\`javascript
function test() { return true; }
\`\`\``;

      const parsed = await docParser.parseMarkdown(markdownContent);
      
      expect(parsed.metadata.codeBlocks).toBeDefined();
      expect(parsed.metadata.codeBlocks).toHaveLength(2);
      expect(parsed.metadata.codeBlocks[0].lang).toBe('typescript');
      expect(parsed.metadata.codeBlocks[1].lang).toBe('javascript');
    });
  });

  describe('Business Domain Extraction', () => {
    it('should extract business domains from content', () => {
      const content = `
        This system handles user management and authentication.
        It includes payment processing and billing features.
        The reporting dashboard provides analytics for business metrics.
        Security compliance and audit trails are maintained.
      `;

      // Access the private method through reflection for testing
      const domains = (docParser as any).extractBusinessDomains(content);

      expect(domains).toContain('user management');
      expect(domains).toContain('authentication');
      expect(domains).toContain('payment');
      expect(domains).toContain('billing');
      expect(domains).toContain('reporting');
      expect(domains).toContain('analytics');
      expect(domains).toContain('security compliance');
      expect(domains).toContain('audit');
    });

    it('should infer domain criticality correctly', () => {
      // Access the private method through reflection for testing
      const inferCriticality = (domain: string) => 
        (docParser as any).inferDomainCriticality(domain);

      expect(inferCriticality('authentication')).toBe('core');
      expect(inferCriticality('security')).toBe('core');
      expect(inferCriticality('payment processing')).toBe('core');
      expect(inferCriticality('user management')).toBe('supporting');
      expect(inferCriticality('reporting')).toBe('supporting');
      expect(inferCriticality('logging')).toBe('utility');
    });
  });

  describe('Technology Extraction', () => {
    it('should extract technologies from content', () => {
      const content = `
        Built with TypeScript and React for the frontend.
        Backend uses Node.js with Express and PostgreSQL.
        Deployed on Docker and Kubernetes in AWS.
        API uses GraphQL for querying.
      `;

      // Access the private method through reflection for testing
      const technologies = (docParser as any).extractTechnologies(content);

      expect(technologies).toContain('typescript');
      expect(technologies).toContain('react');
      expect(technologies).toContain('node.js');
      expect(technologies).toContain('express');
      expect(technologies).toContain('postgresql');
      expect(technologies).toContain('docker');
      expect(technologies).toContain('kubernetes');
      expect(technologies).toContain('aws');
      expect(technologies).toContain('graphql');
    });
  });

  describe('Stakeholder Extraction', () => {
    it('should extract stakeholders from content', () => {
      const content = `
        The product owner defines requirements.
        The development team implements features.
        The tech lead reviews architecture.
        Business analysts gather requirements.
        End users provide feedback.
      `;

      // Access the private method through reflection for testing
      const stakeholders = (docParser as any).extractStakeholders(content);

      expect(stakeholders).toContain('product owner');
      expect(stakeholders).toContain('development team');
      expect(stakeholders).toContain('tech lead');
      expect(stakeholders).toContain('business analyst');
      expect(stakeholders).toContain('end user');
    });
  });

  describe('Document Type Inference', () => {
    it('should infer document type from content and title', () => {
      // Access the private method through reflection for testing
      const inferType = (content: string, title: string) => 
        (docParser as any).inferDocType(content, title);

      expect(inferType('', 'README')).toBe('readme');
      expect(inferType('', 'Getting Started Guide')).toBe('readme');
      expect(inferType('endpoint descriptions', 'API Documentation')).toBe('api-docs');
      expect(inferType('swagger definitions', 'REST API')).toBe('api-docs');
      expect(inferType('system design overview', 'Design Document')).toBe('design-doc');
      expect(inferType('high level architecture', 'System Architecture')).toBe('architecture');
      expect(inferType('how to use this feature', 'User Guide')).toBe('user-guide');
      expect(inferType('tutorial for beginners', 'Tutorial')).toBe('user-guide');
    });
  });

  describe('Plaintext Parsing', () => {
    it('should parse plaintext content', () => {
      const plainContent = `Documentation Title
      
This is plain text content.
It contains information about user authentication.
Technologies used: JavaScript, Python.`;

      const parsed = docParser.parsePlaintext(plainContent);

      expect(parsed.title).toBe('Documentation Title');
      expect(parsed.content).toBe(plainContent);
      expect(parsed.businessDomains).toContain('authentication');
      expect(parsed.technologies).toContain('javascript');
      expect(parsed.technologies).toContain('python');
      expect(parsed.metadata.lineCount).toBe(5);
    });
  });

  describe('File Parsing', () => {
    it('should parse a file and extract all information', async () => {
      // Create a temporary test file
      const testFilePath = '/tmp/test-doc.md';
      const testContent = `# Test Architecture

## Overview
This document describes the system architecture.

### Technologies
- TypeScript
- Docker
- PostgreSQL

### Business Domains
- User Management
- Authentication
`;

      await fs.writeFile(testFilePath, testContent);

      const parsed = await docParser.parseFile(testFilePath);

      expect(parsed.title).toBe('Test Architecture');
      expect(parsed.docType).toBe('architecture');
      expect(parsed.businessDomains).toContain('user management');
      expect(parsed.businessDomains).toContain('authentication');
      expect(parsed.technologies).toContain('typescript');
      expect(parsed.technologies).toContain('docker');
      expect(parsed.technologies).toContain('postgresql');
      expect(parsed.metadata.filePath).toBe(testFilePath);
      expect(parsed.metadata.fileSize).toBe(testContent.length);
      expect(parsed.metadata.checksum).toBeDefined();

      // Clean up
      await fs.unlink(testFilePath);
    });

    it('should handle file parsing errors gracefully', async () => {
      const nonExistentFile = '/tmp/non-existent-file.md';

      await expect(docParser.parseFile(nonExistentFile)).rejects.toThrow();
    });
  });

  describe('Documentation Search', () => {
    it('should calculate relevance scores correctly', async () => {
      // Mock the knowledge graph service response
      mockKgService.findEntitiesByType.mockResolvedValue([
        {
          id: 'doc1',
          type: 'documentation',
          title: 'Authentication Guide',
          content: 'This guide covers authentication and security.',
          businessDomains: ['authentication', 'security'],
          technologies: ['oauth', 'jwt'],
          docType: 'user-guide'
        },
        {
          id: 'doc2',
          type: 'documentation',
          title: 'API Documentation',
          content: 'REST API endpoints for user management.',
          businessDomains: ['user management'],
          technologies: ['rest', 'json'],
          docType: 'api-docs'
        }
      ]);

      const results = await docParser.searchDocumentation('authentication', {
        limit: 10
      });

      expect(results).toHaveLength(1);
      expect(results[0].document.id).toBe('doc1');
      expect(results[0].relevanceScore).toBeGreaterThan(0);
      expect(results[0].matchedSections).toBeDefined();
    });

    it('should filter search results by domain', async () => {
      // Mock the knowledge graph service response
      mockKgService.findEntitiesByType.mockResolvedValue([
        {
          id: 'doc1',
          type: 'documentation',
          title: 'Security Guide',
          content: 'Security best practices.',
          businessDomains: ['security', 'compliance'],
          technologies: [],
          docType: 'user-guide'
        },
        {
          id: 'doc2',
          type: 'documentation',
          title: 'Payment Guide',
          content: 'Payment processing documentation.',
          businessDomains: ['payment', 'billing'],
          technologies: [],
          docType: 'user-guide'
        }
      ]);

      const results = await docParser.searchDocumentation('guide', {
        domain: 'security'
      });

      expect(results).toHaveLength(1);
      expect(results[0].document.id).toBe('doc1');
    });

    it('should filter search results by document type', async () => {
      // Mock the knowledge graph service response
      mockKgService.findEntitiesByType.mockResolvedValue([
        {
          id: 'doc1',
          type: 'documentation',
          title: 'API Reference',
          content: 'API documentation.',
          businessDomains: [],
          technologies: [],
          docType: 'api-docs'
        },
        {
          id: 'doc2',
          type: 'documentation',
          title: 'User Manual',
          content: 'User guide.',
          businessDomains: [],
          technologies: [],
          docType: 'user-guide'
        }
      ]);

      const results = await docParser.searchDocumentation('', {
        docType: 'api-docs'
      });

      expect(results).toHaveLength(1);
      expect(results[0].document.docType).toBe('api-docs');
    });
  });

  describe('Documentation Synchronization', () => {
    it('should sync documentation files with knowledge graph', async () => {
      // Mock file system operations
      const testDocsPath = '/tmp/test-docs';
      
      // Mock the knowledge graph service methods
      mockKgService.createEntity.mockResolvedValue(true);
      mockKgService.getEntity.mockResolvedValue(null);

      // Create test directory and files
      await fs.mkdir(testDocsPath, { recursive: true });
      await fs.writeFile(join(testDocsPath, 'test1.md'), '# Test 1\nAuthentication system');
      await fs.writeFile(join(testDocsPath, 'test2.md'), '# Test 2\nPayment processing');

      const result = await docParser.syncDocumentation(testDocsPath);

      expect(result.processedFiles).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(mockKgService.createEntity).toHaveBeenCalled();

      // Clean up
      await fs.rm(testDocsPath, { recursive: true });
    });

    it('should handle sync errors gracefully', async () => {
      const invalidPath = '/invalid/path/that/does/not/exist';

      const result = await docParser.syncDocumentation(invalidPath);

      expect(result.processedFiles).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Checksum Calculation', () => {
    it('should generate consistent checksums for same content', () => {
      const content = 'Test content for checksum';
      
      // Access the private method through reflection for testing
      const checksum1 = (docParser as any).calculateChecksum(content);
      const checksum2 = (docParser as any).calculateChecksum(content);

      expect(checksum1).toBe(checksum2);
    });

    it('should generate different checksums for different content', () => {
      const content1 = 'Test content 1';
      const content2 = 'Test content 2';
      
      // Access the private method through reflection for testing
      const checksum1 = (docParser as any).calculateChecksum(content1);
      const checksum2 = (docParser as any).calculateChecksum(content2);

      expect(checksum1).not.toBe(checksum2);
    });
  });
});
/**
 * Integration tests for DocumentationParser service
 * Tests parsing various documentation formats and sync functionality with real database operations
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DocumentationParser, ParsedDocument, SearchResult } from '../../../src/services/DocumentationParser';
import { KnowledgeGraphService } from '../../../src/services/KnowledgeGraphService';
import { DatabaseService, createTestDatabaseConfig } from '../../../src/services/DatabaseService';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  checkDatabaseHealth,
} from '../../test-utils/database-helpers';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('DocumentationParser Integration', () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let docParser: DocumentationParser;
  let testDocsDir: string;
  let testDir: string;

  beforeAll(async () => {
    // Create test directories
    testDir = path.join(os.tmpdir(), 'doc-parser-integration-tests');
    testDocsDir = path.join(testDir, 'docs');
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(testDocsDir, { recursive: true });

    // Initialize services
    dbService = await setupTestDatabase();
    kgService = new KnowledgeGraphService(dbService);
    docParser = new DocumentationParser(kgService, dbService);

    // Ensure database is healthy
    const isHealthy = await checkDatabaseHealth(dbService);
    if (!isHealthy) {
      throw new Error('Database health check failed - cannot run integration tests');
    }
  }, 30000);

  afterAll(async () => {
    // Clean up test directories
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up test directories:', error);
    }

    if (dbService && dbService.isInitialized()) {
      await cleanupTestDatabase(dbService);
    }
  }, 10000);

  beforeEach(async () => {
    if (dbService && dbService.isInitialized()) {
      await clearTestData(dbService);
    }

    // Clean up test docs directory
    try {
      const files = await fs.readdir(testDocsDir);
      await Promise.all(files.map(file =>
        fs.unlink(path.join(testDocsDir, file))
      ));
    } catch (error) {
      // Directory might be empty, that's okay
    }
  });

  describe('Markdown Parsing Integration', () => {
    it('should parse markdown file with headers and metadata', async () => {
      const markdownContent = `# Getting Started

This is a comprehensive guide for getting started with our system.

## Installation

\`\`\`bash
npm install our-package
\`\`\`

## Usage

Here's how to use the API:

\`\`\`typescript
import { API } from 'our-package';

const api = new API();
await api.connect();
\`\`\`

## Architecture

Our system uses a microservices architecture with the following components:
- User Service
- Payment Service
- Notification Service

## Technologies

- Node.js
- TypeScript
- PostgreSQL
- Redis
`;

      const filePath = path.join(testDocsDir, 'getting-started.md');
      await fs.writeFile(filePath, markdownContent);

      const parsedDoc = await docParser.parseFile(filePath);

      expect(parsedDoc.title).toBe('Getting Started');
      expect(parsedDoc.content).toContain('comprehensive guide');
      expect(parsedDoc.docType).toBe('user-guide');
      expect(parsedDoc.businessDomains).toContain('user service');
      expect(parsedDoc.stakeholders).toContain('user');
      expect(parsedDoc.technologies).toContain('typescript');
      expect(parsedDoc.metadata.headings).toHaveLength(4);
      expect(parsedDoc.metadata.codeBlocks).toHaveLength(2);
      expect(parsedDoc.metadata.links).toHaveLength(0);
    });

    it('should parse complex markdown with links and advanced features', async () => {
      const complexMarkdown = `# API Documentation

Welcome to our API documentation. This document covers all available endpoints.

## Authentication

To authenticate, use the following header:
\`Authorization: Bearer <token>\`

## Endpoints

### GET /users

Retrieves a list of users.

**Parameters:**
- \`limit\` (optional): Maximum number of users to return
- \`offset\` (optional): Number of users to skip

**Response:**
\`\`\`json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  ],
  "total": 100
}
\`\`\`

### POST /users

Creates a new user.

**Request Body:**
\`\`\`json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "secure123"
}
\`\`\`

## Error Handling

All errors follow this format:
\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data"
  }
}
\`\`\`

## Links

- [Swagger Documentation](https://api.example.com/docs)
- [Postman Collection](https://api.example.com/postman)
- [GitHub Repository](https://github.com/example/api)

## Business Domains

This API serves the following business domains:
- User Management
- Authentication & Security
- Payment Processing
- Communication Services

## Technologies Used

- REST API
- JSON Web Tokens
- PostgreSQL Database
- Redis Caching
- Docker Containers
`;

      const filePath = path.join(testDocsDir, 'api-docs.md');
      await fs.writeFile(filePath, complexMarkdown);

      const parsedDoc = await docParser.parseFile(filePath);

      expect(parsedDoc.title).toBe('API Documentation');
      expect(parsedDoc.docType).toBe('api-docs');
      expect(parsedDoc.businessDomains).toContain('user management');
      expect(parsedDoc.businessDomains).toContain('authentication');
      expect(parsedDoc.stakeholders).toContain('user');
      expect(parsedDoc.technologies).toContain('postgresql');
      expect(parsedDoc.technologies).toContain('redis');
      expect(parsedDoc.metadata.links).toHaveLength(3);
      expect(parsedDoc.metadata.codeBlocks).toHaveLength(3);
      expect(parsedDoc.metadata.headings).toHaveLength(6);
    });
  });

  describe('Plain Text Parsing Integration', () => {
    it('should parse plain text documentation', async () => {
      const textContent = `README

This is the main README file for our project.

OVERVIEW

Our project is a comprehensive solution for managing user data and processing payments.

FEATURES

- User registration and authentication
- Payment processing with multiple providers
- Real-time notifications
- Comprehensive reporting and analytics

ARCHITECTURE

The system is built using:
- Node.js backend
- React frontend
- PostgreSQL database
- Redis for caching
- Docker for containerization

GETTING STARTED

1. Clone the repository
2. Install dependencies: npm install
3. Set up the database
4. Run the application: npm start

For more information, contact the development team.
`;

      const filePath = path.join(testDocsDir, 'README.txt');
      await fs.writeFile(filePath, textContent);

      const parsedDoc = await docParser.parseFile(filePath);

      expect(parsedDoc.title).toBe('README');
      expect(parsedDoc.docType).toBe('readme');
      expect(parsedDoc.businessDomains).toContain('user registration');
      expect(parsedDoc.businessDomains).toContain('payment processing');
      expect(parsedDoc.technologies).toContain('postgresql');
      expect(parsedDoc.technologies).toContain('redis');
      expect(parsedDoc.metadata.lineCount).toBeGreaterThan(20);
      expect(parsedDoc.metadata.wordCount).toBeGreaterThan(100);
    });

    it('should handle various plain text formats and extract meaningful information', async () => {
      const technicalDoc = `SYSTEM ARCHITECTURE DOCUMENT

Version 2.1
Last Updated: 2024-01-15

1. INTRODUCTION

This document describes the architecture of our enterprise system.

2. SYSTEM OVERVIEW

The system provides comprehensive business solutions including:
- Customer relationship management
- Inventory management
- Financial reporting
- Human resources management

3. TECHNICAL ARCHITECTURE

Frontend Layer:
- React.js with TypeScript
- Material-UI component library
- Redux for state management

Backend Layer:
- Node.js with Express framework
- GraphQL API
- JWT authentication
- Rate limiting and security middleware

Database Layer:
- PostgreSQL for relational data
- MongoDB for document storage
- Redis for caching and sessions

Infrastructure:
- Docker containers
- Kubernetes orchestration
- AWS cloud services
- CI/CD pipelines with Jenkins

4. BUSINESS DOMAINS

The system serves these core business domains:
- Customer Service Management
- Supply Chain & Logistics
- Financial Services
- Human Capital Management
- Risk & Compliance

5. STAKEHOLDERS

- Product Managers
- Development Teams
- System Administrators
- End Users
- Business Analysts
- Quality Assurance Teams

6. SECURITY CONSIDERATIONS

- Multi-factor authentication
- Role-based access control
- Data encryption at rest and in transit
- Regular security audits
- Compliance with GDPR and SOX
`;

      const filePath = path.join(testDocsDir, 'architecture.txt');
      await fs.writeFile(filePath, technicalDoc);

      const parsedDoc = await docParser.parseFile(filePath);

      expect(parsedDoc.title).toBe('SYSTEM ARCHITECTURE DOCUMENT');
      expect(parsedDoc.docType).toBe('architecture');
      expect(parsedDoc.businessDomains).toContain('customer service management');
      expect(parsedDoc.businessDomains).toContain('financial services');
      expect(parsedDoc.stakeholders).toContain('product manager');
      expect(parsedDoc.stakeholders).toContain('development team');
      expect(parsedDoc.technologies).toContain('postgresql');
      expect(parsedDoc.technologies).toContain('mongodb');
      expect(parsedDoc.technologies).toContain('kubernetes');
    });
  });

  describe('RST Parsing Integration', () => {
    it('should parse reStructuredText files', async () => {
      const rstContent = `Getting Started Guide
===================

This guide will help you get started with our platform.

Installation
------------

First, install the required dependencies:

.. code-block:: bash

   pip install our-package
   npm install

Configuration
-------------

Create a configuration file:

.. code-block:: json

   {
     "database": {
       "host": "localhost",
       "port": 5432
     },
     "redis": {
       "host": "localhost",
       "port": 6379
     }
   }

Features
--------

Our platform includes:

* User authentication
* Data processing
* Real-time analytics
* API integration

Architecture
------------

The system uses a microservices architecture with:

* API Gateway
* User Service
* Analytics Service
* Database Service

Technologies
------------

* Python (Backend)
* JavaScript/Node.js (Frontend)
* PostgreSQL (Database)
* Redis (Caching)
* Docker (Containerization)
`;

      const filePath = path.join(testDocsDir, 'guide.rst');
      await fs.writeFile(filePath, rstContent);

      const parsedDoc = await docParser.parseFile(filePath);

      expect(parsedDoc.title).toBe('Getting Started Guide');
      expect(parsedDoc.docType).toBe('user-guide');
      expect(parsedDoc.businessDomains).toContain('user authentication');
      expect(parsedDoc.businessDomains).toContain('data processing');
      expect(parsedDoc.technologies).toContain('postgresql');
      expect(parsedDoc.technologies).toContain('redis');
      expect(parsedDoc.technologies).toContain('docker');
      expect(parsedDoc.metadata.sections).toHaveLength(4);
    });
  });

  describe('AsciiDoc Parsing Integration', () => {
    it('should parse AsciiDoc files', async () => {
      const adocContent = `= User Manual
John Doe <john.doe@example.com>
v1.0, 2024-01-15

== Introduction

This is the user manual for our application.

== Installation

=== System Requirements

* Node.js 16+
* PostgreSQL 12+
* Redis 6+

=== Installation Steps

. Download the application
. Extract the archive
. Run the installer
. Configure the database connection

=== Configuration

[source,json]
----
{
  "app": {
    "port": 3000,
    "env": "production"
  },
  "database": {
    "type": "postgresql",
    "host": "localhost"
  }
}
----

== Features

* User management
* Document processing
* Report generation
* API access

== Business Domains

The application serves:

* Customer relationship management
* Document management
* Business intelligence
* Compliance reporting

== Technologies Used

* Backend: Node.js, Express
* Frontend: React, TypeScript
* Database: PostgreSQL, Redis
* Deployment: Docker, Kubernetes
`;

      const filePath = path.join(testDocsDir, 'manual.adoc');
      await fs.writeFile(filePath, adocContent);

      const parsedDoc = await docParser.parseFile(filePath);

      expect(parsedDoc.title).toBe('User Manual');
      expect(parsedDoc.docType).toBe('user-guide');
      expect(parsedDoc.businessDomains).toContain('customer relationship management');
      expect(parsedDoc.businessDomains).toContain('document management');
      expect(parsedDoc.technologies).toContain('postgresql');
      expect(parsedDoc.technologies).toContain('kubernetes');
    });
  });

  describe('Documentation Sync Integration', () => {
    it('should sync documentation files with knowledge graph', async () => {
      // Create multiple documentation files
      const docs = [
        {
          filename: 'api-guide.md',
          content: `# API Guide

This is our API documentation.

## Authentication

Use JWT tokens for authentication.

## Endpoints

- GET /users - Get users
- POST /users - Create user

## Technologies

- Node.js
- Express
- PostgreSQL
- Redis

## Business Domains

- User Management
- Authentication
- API Services`
        },
        {
          filename: 'architecture.md',
          content: `# System Architecture

## Overview

Our system uses microservices architecture.

## Components

- API Gateway
- User Service
- Payment Service
- Notification Service

## Technologies

- Docker
- Kubernetes
- PostgreSQL
- Redis
- RabbitMQ

## Business Domains

- Payment Processing
- User Management
- Communication
- Infrastructure Management`
        },
        {
          filename: 'deployment.txt',
          content: `DEPLOYMENT GUIDE

This guide covers deployment procedures.

ARCHITECTURE OVERVIEW

The system is deployed using:
- Docker containers
- Kubernetes orchestration
- AWS cloud infrastructure
- CI/CD pipelines

TECHNOLOGIES USED

- Docker
- Kubernetes
- AWS (EC2, RDS, S3)
- Jenkins
- PostgreSQL
- Redis

BUSINESS DOMAINS

- Infrastructure Management
- DevOps
- Cloud Services
- Deployment Automation`
        }
      ];

      // Write files to test directory
      for (const doc of docs) {
        await fs.writeFile(path.join(testDocsDir, doc.filename), doc.content);
      }

      // Sync documentation
      const syncResult = await docParser.syncDocumentation(testDocsDir);

      expect(syncResult.processedFiles).toBe(3);
      expect(syncResult.errors).toHaveLength(0);
      expect(syncResult.newDomains).toBeGreaterThanOrEqual(0);
      expect(syncResult.updatedClusters).toBeGreaterThanOrEqual(0);

      // Verify documentation nodes were created
      const docNodes = await kgService.findEntitiesByType('documentation');
      expect(docNodes.length).toBe(3);

      // Verify business domains were extracted
      const allEntities = await kgService.findEntitiesByType('businessDomain');
      expect(allEntities.length).toBeGreaterThan(0);
    });

    it('should handle sync errors gracefully', async () => {
      // Create a mix of valid and invalid files
      const validDoc = `# Valid Document

This is a valid markdown document.

## Technologies

- Node.js
- PostgreSQL

## Business Domains

- User Management`;

      const invalidDoc = `# Invalid Document

This document has invalid syntax that might cause parsing issues.

## Technologies
- Invalid Technology Name That Should Be Handled
- Another Invalid Technology

## Business Domains
- Invalid Business Domain`;

      await fs.writeFile(path.join(testDocsDir, 'valid.md'), validDoc);
      await fs.writeFile(path.join(testDocsDir, 'invalid.md'), invalidDoc);

      const syncResult = await docParser.syncDocumentation(testDocsDir);

      // Should process files even if some have issues
      expect(syncResult.processedFiles).toBe(2);
      // May have some errors but should not fail completely
      expect(syncResult.errors.length).toBeLessThanOrEqual(2);

      // Should still create valid documentation nodes
      const docNodes = await kgService.findEntitiesByType('documentation');
      expect(docNodes.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle large documentation sets efficiently', async () => {
      const largeDocSet = 20;
      const docs = [];

      // Create multiple documentation files
      for (let i = 0; i < largeDocSet; i++) {
        const content = `# Document ${i}

This is document number ${i}.

## Features

- Feature ${i}.1
- Feature ${i}.2
- Feature ${i}.3

## Technologies

- Node.js
- PostgreSQL
- Redis

## Business Domains

- User Management
- Data Processing
- API Services`;

        docs.push({
          filename: `doc-${i}.md`,
          content
        });
      }

      // Write all files
      for (const doc of docs) {
        await fs.writeFile(path.join(testDocsDir, doc.filename), doc.content);
      }

      const startTime = Date.now();
      const syncResult = await docParser.syncDocumentation(testDocsDir);
      const endTime = Date.now();

      expect(syncResult.processedFiles).toBe(largeDocSet);
      expect(syncResult.errors).toHaveLength(0);

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max

      // Verify all documents were processed
      const docNodes = await kgService.findEntitiesByType('documentation');
      expect(docNodes.length).toBe(largeDocSet);
    });
  });

  describe('Search Functionality Integration', () => {
    beforeEach(async () => {
      // Set up test documentation for search
      const searchDocs = [
        {
          filename: 'authentication.md',
          content: `# Authentication Guide

This guide covers user authentication and authorization.

## JWT Tokens

JSON Web Tokens are used for authentication.

## OAuth 2.0

We support OAuth 2.0 flows.

## Business Domains

- Security
- User Management
- Authentication Services

## Technologies

- Node.js
- JWT
- PostgreSQL`
        },
        {
          filename: 'payment-api.md',
          content: `# Payment API

Documentation for payment processing API.

## Stripe Integration

We integrate with Stripe for payments.

## PayPal Support

PayPal payments are also supported.

## Business Domains

- Payment Processing
- Financial Services
- E-commerce

## Technologies

- Node.js
- Stripe API
- PayPal API
- PostgreSQL`
        },
        {
          filename: 'database-design.md',
          content: `# Database Design

This document covers our database architecture.

## PostgreSQL Schema

Our main database uses PostgreSQL.

## Redis Caching

Redis is used for caching and sessions.

## Business Domains

- Data Management
- Performance Optimization
- Infrastructure

## Technologies

- PostgreSQL
- Redis
- Database Indexing
- Connection Pooling`
        }
      ];

      // Write and sync documents
      for (const doc of searchDocs) {
        await fs.writeFile(path.join(testDocsDir, doc.filename), doc.content);
      }

      await docParser.syncDocumentation(testDocsDir);
    });

    it('should search documentation by content keywords', async () => {
      const results = await docParser.searchDocumentation('authentication');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].document.title).toBe('Authentication Guide');
      expect(results[0].relevanceScore).toBeGreaterThan(0);
      expect(results[0].matchedSections.length).toBeGreaterThan(0);
    });

    it('should search by business domain', async () => {
      const results = await docParser.searchDocumentation('payment', {
        domain: 'payment processing'
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].document.businessDomains).toContain('payment processing');
    });

    it('should search by technology', async () => {
      const results = await docParser.searchDocumentation('postgresql');

      expect(results.length).toBeGreaterThan(0);

      // All results should mention PostgreSQL
      for (const result of results) {
        expect(result.document.technologies).toContain('postgresql');
      }
    });

    it('should handle search with no results', async () => {
      const results = await docParser.searchDocumentation('nonexistentkeyword12345');

      expect(results).toEqual([]);
    });

    it('should respect search limits', async () => {
      const results = await docParser.searchDocumentation('node', {
        limit: 2
      });

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should search by document type', async () => {
      const results = await docParser.searchDocumentation('api', {
        docType: 'api-docs'
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].document.docType).toBe('api-docs');
    });
  });

  describe('Domain Extraction Integration', () => {
    it('should extract and create business domains from documentation', async () => {
      const comprehensiveDoc = `# Enterprise System Documentation

## Overview

This comprehensive documentation covers our enterprise system.

## Business Domains

### Customer Relationship Management
Our CRM system handles customer interactions, sales processes, and support tickets.

### Payment Processing
We process payments through multiple providers including Stripe and PayPal.

### Inventory Management
Real-time inventory tracking and management across multiple warehouses.

### Human Resources
Employee management, payroll processing, and benefits administration.

### Financial Reporting
Comprehensive financial reports, budgeting, and forecasting tools.

## Technologies Used

- Node.js and TypeScript
- PostgreSQL database
- Redis caching
- React frontend
- Docker containers
- Kubernetes orchestration
- AWS cloud services

## Stakeholders

- Product Managers
- Development Teams
- System Administrators
- End Users
- Business Analysts
- Quality Assurance Teams
- DevOps Engineers
- Security Team
`;

      const filePath = path.join(testDocsDir, 'comprehensive.md');
      await fs.writeFile(filePath, comprehensiveDoc);

      await docParser.syncDocumentation(testDocsDir);

      // Verify business domains were created
      const domains = await kgService.findEntitiesByType('businessDomain');
      expect(domains.length).toBeGreaterThan(0);

      // Check specific domains
      const domainNames = domains.map(d => (d as any).name?.toLowerCase());
      expect(domainNames).toContain('customer relationship management');
      expect(domainNames).toContain('payment processing');
      expect(domainNames).toContain('inventory management');
    });

    it('should handle domain criticality inference', async () => {
      const securityDoc = `# Security Documentation

## Authentication & Authorization

Our system implements comprehensive security measures.

## Features

- Multi-factor authentication
- Role-based access control
- Data encryption
- Security auditing
- Compliance reporting

## Business Domains

- Authentication & Security
- Compliance & Auditing
- Risk Management

## Technologies

- JWT tokens
- Encryption libraries
- Security middleware
- Audit logging
`;

      const filePath = path.join(testDocsDir, 'security.md');
      await fs.writeFile(filePath, securityDoc);

      await docParser.syncDocumentation(testDocsDir);

      const domains = await kgService.findEntitiesByType('businessDomain');
      const securityDomain = domains.find(d => (d as any).name?.toLowerCase().includes('security'));

      expect(securityDomain).toBeDefined();
      expect((securityDomain as any).criticality).toBe('core');
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle parsing large documentation files efficiently', async () => {
      // Create a large markdown file
      let largeContent = '# Large Documentation File\n\n';

      // Add many sections
      for (let i = 0; i < 100; i++) {
        largeContent += `## Section ${i}\n\n`;
        largeContent += `This is section ${i} with some content.\n\n`;
        largeContent += `### Subsection ${i}.1\n\n`;
        largeContent += `More content for subsection ${i}.1.\n\n`;
        largeContent += `### Subsection ${i}.2\n\n`;
        largeContent += `Additional content for subsection ${i}.2.\n\n`;
      }

      // Add technologies and business domains
      largeContent += '## Technologies\n\n';
      largeContent += '- Node.js\n- PostgreSQL\n- Redis\n- Docker\n- Kubernetes\n\n';
      largeContent += '## Business Domains\n\n';
      largeContent += '- User Management\n- Data Processing\n- API Services\n- Infrastructure\n';

      const filePath = path.join(testDocsDir, 'large-doc.md');
      await fs.writeFile(filePath, largeContent);

      const startTime = Date.now();
      const parsedDoc = await docParser.parseFile(filePath);
      const endTime = Date.now();

      expect(parsedDoc.title).toBe('Large Documentation File');
      expect(parsedDoc.metadata.headings.length).toBeGreaterThan(200); // Many headings
      expect(parsedDoc.technologies).toContain('postgresql');
      expect(parsedDoc.businessDomains).toContain('user management');

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000); // 1 second max
    });

    it('should maintain consistent parsing performance', async () => {
      const iterations = 5;
      const performanceResults: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const content = `# Performance Test Document ${i}

This is a test document for performance measurement.

## Features

- Feature 1
- Feature 2
- Feature 3

## Technologies

- Node.js
- PostgreSQL
- Redis

## Business Domains

- User Management
- Data Processing`;

        const filePath = path.join(testDocsDir, `perf-test-${i}.md`);
        await fs.writeFile(filePath, content);

        const startTime = Date.now();
        await docParser.parseFile(filePath);
        const endTime = Date.now();

        performanceResults.push(endTime - startTime);
      }

      const avgDuration = performanceResults.reduce((sum, d) => sum + d, 0) / performanceResults.length;
      const maxDuration = Math.max(...performanceResults);
      const minDuration = Math.min(...performanceResults);

      expect(avgDuration).toBeLessThan(100); // Average < 100ms
      expect(maxDuration - minDuration).toBeLessThan(50); // Low variance
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed files gracefully', async () => {
      const malformedContent = `# Incomplete Header

This file has malformed content.

## Valid Section

This section is valid.

## Technologies
- Node.js
- PostgreSQL

## Business Domains
- User Management`;

      const filePath = path.join(testDocsDir, 'malformed.md');
      await fs.writeFile(filePath, malformedContent);

      // Should not throw
      await expect(docParser.parseFile(filePath)).resolves.toBeDefined();

      const parsedDoc = await docParser.parseFile(filePath);
      expect(parsedDoc.title).toBe('Incomplete Header');
      expect(parsedDoc.businessDomains).toContain('user management');
    });

    it('should handle files with no content', async () => {
      const emptyContent = '';
      const filePath = path.join(testDocsDir, 'empty.md');
      await fs.writeFile(filePath, emptyContent);

      const parsedDoc = await docParser.parseFile(filePath);
      expect(parsedDoc.title).toBe('Untitled Document');
      expect(parsedDoc.content).toBe('');
    });

    it('should handle files with special characters', async () => {
      const specialCharsContent = `# Document with Special Characters: ñáéíóú

This document contains special characters: àâäçéèêëïîôùûüÿ

## Technologies

- CaféScript
- naïve.js
- PostgreSQL
- naïveDB

## Business Domains

- naïve User Management
- naïve Data Processing`;

      const filePath = path.join(testDocsDir, 'special-chars.md');
      await fs.writeFile(filePath, specialCharsContent);

      const parsedDoc = await docParser.parseFile(filePath);
      expect(parsedDoc.title).toBe('Document with Special Characters: ñáéíóú');
      expect(parsedDoc.technologies).toContain('postgresql');
      expect(parsedDoc.businessDomains).toContain('naïve user management');
    });

    it('should handle concurrent parsing operations', async () => {
      const docs = [];
      for (let i = 0; i < 10; i++) {
        docs.push({
          filename: `concurrent-${i}.md`,
          content: `# Concurrent Document ${i}

## Technologies
- Node.js
- PostgreSQL

## Business Domains
- User Management`
        });
      }

      // Write files
      for (const doc of docs) {
        await fs.writeFile(path.join(testDocsDir, doc.filename), doc.content);
      }

      // Parse concurrently
      const parsePromises = docs.map(doc =>
        docParser.parseFile(path.join(testDocsDir, doc.filename))
      );

      const startTime = Date.now();
      const results = await Promise.all(parsePromises);
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result.title).toBe(`Concurrent Document ${index}`);
        expect(result.technologies).toContain('postgresql');
      });

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(2000); // 2 seconds max for concurrent parsing
    });

    it('should handle non-existent file paths', async () => {
      const nonExistentPath = path.join(testDocsDir, 'non-existent.md');

      await expect(docParser.parseFile(nonExistentPath)).rejects.toThrow();
    });

    it('should handle unsupported file extensions', async () => {
      const unsupportedContent = 'This is a file with unsupported extension.';
      const filePath = path.join(testDocsDir, 'unsupported.xyz');
      await fs.writeFile(filePath, unsupportedContent);

      const parsedDoc = await docParser.parseFile(filePath);
      expect(parsedDoc.title).toBe('This is a file with unsupported extension.');
      expect(parsedDoc.docType).toBe('readme'); // Default fallback
    });
  });
});

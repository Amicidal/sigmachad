/**
 * Documentation Parser Service
 * Handles parsing, indexing, and synchronization of documentation files
 */

import { marked } from 'marked';
import type { Tokens, TokensList } from 'marked';
import { readFileSync } from 'fs';
import { join, extname, basename } from 'path';
import { KnowledgeGraphService } from './KnowledgeGraphService.js';
import { DatabaseService } from './DatabaseService.js';
import {
  DocumentationNode,
  BusinessDomain,
  SemanticCluster,
  Entity
} from '../models/entities.js';
import {
  RelationshipType,
  DocumentationRelationship
} from '../models/relationships.js';

export interface ParsedDocument {
  title: string;
  content: string;
  businessDomains: string[];
  stakeholders: string[];
  technologies: string[];
  docType: DocumentationNode['docType'];
  metadata: Record<string, any>;
}

export interface DomainExtraction {
  name: string;
  description: string;
  criticality: BusinessDomain['criticality'];
  stakeholders: string[];
  keyProcesses: string[];
  confidence: number;
}

export interface SyncResult {
  processedFiles: number;
  newDomains: number;
  updatedClusters: number;
  errors: string[];
}

export interface SearchResult {
  document: DocumentationNode;
  relevanceScore: number;
  matchedSections: string[];
}

export class DocumentationParser {
  private kgService: KnowledgeGraphService;
  private dbService: DatabaseService;
  private supportedExtensions = ['.md', '.txt', '.rst', '.adoc'];

  constructor(kgService: KnowledgeGraphService, dbService: DatabaseService) {
    this.kgService = kgService;
    this.dbService = dbService;
  }

  /**
   * Parse a documentation file and extract structured information
   */
  async parseFile(filePath: string): Promise<ParsedDocument> {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const extension = extname(filePath).toLowerCase();

      let parsedContent: ParsedDocument;

      switch (extension) {
        case '.md':
          parsedContent = await this.parseMarkdown(content);
          break;
        case '.txt':
          parsedContent = this.parsePlaintext(content);
          break;
        case '.rst':
          parsedContent = this.parseRestructuredText(content);
          break;
        case '.adoc':
          parsedContent = this.parseAsciiDoc(content);
          break;
        default:
          parsedContent = this.parsePlaintext(content);
      }

      // Extract additional metadata
      parsedContent.metadata = {
        ...parsedContent.metadata,
        filePath,
        fileSize: content.length,
        lastModified: new Date(),
        checksum: this.calculateChecksum(content)
      };

      return parsedContent;
    } catch (error) {
      throw new Error(`Failed to parse file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse markdown content using marked library
   */
  async parseMarkdown(content: string): Promise<ParsedDocument> {
    const tokens = marked.lexer(content);
    const title = this.extractTitle(tokens);
    const businessDomains = this.extractBusinessDomains(content);
    const stakeholders = this.extractStakeholders(content);
    const technologies = this.extractTechnologies(content);
    const docType = this.inferDocType(content, title);

    return {
      title,
      content,
      businessDomains,
      stakeholders,
      technologies,
      docType,
      metadata: {
        headings: this.extractHeadings(tokens),
        links: this.extractLinks(tokens),
        codeBlocks: this.extractCodeBlocks(tokens)
      }
    };
  }

  /**
   * Parse plaintext content
   */
  parsePlaintext(content: string): ParsedDocument {
    const lines = content.split('\n');
    const title = lines[0]?.trim() || 'Untitled Document';
    const businessDomains = this.extractBusinessDomains(content);
    const stakeholders = this.extractStakeholders(content);
    const technologies = this.extractTechnologies(content);
    const docType = this.inferDocType(content, title);

    return {
      title,
      content,
      businessDomains,
      stakeholders,
      technologies,
      docType,
      metadata: {
        lineCount: lines.length,
        wordCount: content.split(/\s+/).length
      }
    };
  }

  /**
   * Parse reStructuredText content (basic implementation)
   */
  private parseRestructuredText(content: string): ParsedDocument {
    // Basic RST parsing - could be enhanced with a dedicated library
    const lines = content.split('\n');
    const title = this.extractRstTitle(lines);
    const businessDomains = this.extractBusinessDomains(content);
    const stakeholders = this.extractStakeholders(content);
    const technologies = this.extractTechnologies(content);
    const docType = this.inferDocType(content, title);

    return {
      title,
      content,
      businessDomains,
      stakeholders,
      technologies,
      docType,
      metadata: {
        sections: this.extractRstSections(lines)
      }
    };
  }

  /**
   * Parse AsciiDoc content (basic implementation)
   */
  private parseAsciiDoc(content: string): ParsedDocument {
    // Basic AsciiDoc parsing - could be enhanced with a dedicated library
    const lines = content.split('\n');
    const title = this.extractAsciiDocTitle(lines);
    const businessDomains = this.extractBusinessDomains(content);
    const stakeholders = this.extractStakeholders(content);
    const technologies = this.extractTechnologies(content);
    const docType = this.inferDocType(content, title);

    return {
      title,
      content,
      businessDomains,
      stakeholders,
      technologies,
      docType,
      metadata: {}
    };
  }

  /**
   * Extract title from markdown tokens
   */
  private extractTitle(tokens: TokensList): string {
    for (const token of tokens) {
      if (token.type === 'heading' && token.depth === 1) {
        return token.text;
      }
    }
    return 'Untitled Document';
  }

  /**
   * Extract business domains from content using pattern matching
   */
  private extractBusinessDomains(content: string): string[] {
    const domainPatterns = [
      // Common business domain keywords
      /\b(?:user|customer|client|patient|student|employee|admin|manager)\s+(?:management|service|portal|dashboard|system)\b/gi,
      /\b(?:authentication|authorization|security|compliance|audit)\b/gi,
      /\b(?:payment|billing|subscription|pricing|financial)\b/gi,
      /\b(?:inventory|warehouse|supply chain|logistics)\b/gi,
      /\b(?:reporting|analytics|dashboard|metrics)\b/gi,
      /\b(?:communication|messaging|notification|email)\b/gi,
      /\b(?:content|media|file|document)\s+(?:management|storage)\b/gi
    ];

    const domains = new Set<string>();
    const lowerContent = content.toLowerCase();

    for (const pattern of domainPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          domains.add(match.toLowerCase().trim());
        });
      }
    }

    // Also look for explicit domain mentions
    const explicitDomains = content.match(/domain[s]?:?\s*([^.\n]+)/gi);
    if (explicitDomains) {
      explicitDomains.forEach(match => {
        const domain = match.replace(/domain[s]?:?\s*/i, '').trim();
        if (domain.length > 2) {
          domains.add(domain.toLowerCase());
        }
      });
    }

    return Array.from(domains);
  }

  /**
   * Extract stakeholders from content
   */
  private extractStakeholders(content: string): string[] {
    const stakeholderPatterns = [
      /\b(?:product|project|tech|engineering|development|qa|testing)\s+(?:team|manager|lead|director)\b/gi,
      /\b(?:business|product|system|technical)\s+(?:analyst|architect|owner)\b/gi,
      /\b(?:end\s+user|customer|client|stakeholder|partner|vendor)\b/gi,
      /\b(?:admin|administrator|operator|maintainer|developer)\b/gi
    ];

    const stakeholders = new Set<string>();

    for (const pattern of stakeholderPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          stakeholders.add(match.toLowerCase().trim());
        });
      }
    }

    return Array.from(stakeholders);
  }

  /**
   * Extract technologies from content
   */
  private extractTechnologies(content: string): string[] {
    const techPatterns = [
      /\b(?:javascript|typescript|python|java|go|rust|cpp|c\+\+|c#)\b/gi,
      /\b(?:react|vue|angular|svelte|next\.js|nuxt)\b/gi,
      /\b(?:node\.js|express|fastify|django|flask|spring)\b/gi,
      /\b(?:postgresql|mysql|mongodb|redis|elasticsearch)\b/gi,
      /\b(?:docker|kubernetes|aws|gcp|azure)\b/gi,
      /\b(?:rest|grpc|websocket)\b/gi
    ];

    const technologies = new Set<string>();

    for (const pattern of techPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          technologies.add(match.toLowerCase().trim());
        });
      }
    }

    return Array.from(technologies);
  }

  /**
   * Infer document type based on content and title
   */
  private inferDocType(content: string, title: string): DocumentationNode['docType'] {
    const lowerContent = content.toLowerCase();
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('readme') || lowerTitle.includes('getting started')) {
      return 'readme';
    }
    if (lowerTitle.includes('api') || lowerContent.includes('endpoint') || lowerContent.includes('swagger')) {
      return 'api-docs';
    }
    if (lowerTitle.includes('design') || lowerContent.includes('architecture') || lowerContent.includes('system design')) {
      return 'design-doc';
    }
    if (lowerTitle.includes('architecture') || lowerContent.includes('high level') || lowerContent.includes('overview')) {
      return 'architecture';
    }
    if (lowerTitle.includes('user guide') || lowerContent.includes('how to') || lowerContent.includes('tutorial')) {
      return 'user-guide';
    }

    return 'readme'; // Default fallback
  }

  /**
   * Extract headings from markdown tokens
   */
  private extractHeadings(tokens: TokensList): Array<{ level: number; text: string }> {
    return tokens
      .filter((token): token is Tokens.Heading => token.type === 'heading')
      .map(heading => ({
        level: heading.depth,
        text: heading.text
      }));
  }

  /**
   * Extract links from markdown tokens
   */
  private extractLinks(tokens: TokensList): string[] {
    const links: string[] = [];

    const extractFromToken = (token: any) => {
      if (token.type === 'link') {
        links.push(token.href);
      }
      if ('tokens' in token && token.tokens) {
        token.tokens.forEach(extractFromToken);
      }
    };

    tokens.forEach(extractFromToken);
    return links;
  }

  /**
   * Extract code blocks from markdown tokens
   */
  private extractCodeBlocks(tokens: TokensList): Array<{ lang?: string; code: string }> {
    return tokens
      .filter((token): token is any => token.type === 'code')
      .map((codeBlock: any) => ({
        lang: codeBlock.lang,
        code: codeBlock.text
      }));
  }

  /**
   * Extract title from RST content
   */
  private extractRstTitle(lines: string[]): string {
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      const nextLine = lines[i + 1]?.trim();

      if (line && nextLine && /^[=]+$/.test(nextLine) && nextLine.length >= line.length) {
        return line;
      }
    }
    return lines[0]?.trim() || 'Untitled Document';
  }

  /**
   * Extract sections from RST content
   */
  private extractRstSections(lines: string[]): Array<{ title: string; level: number }> {
    const sections: Array<{ title: string; level: number }> = [];

    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      const nextLine = lines[i + 1]?.trim();

      if (line && nextLine) {
        if (/^[=]+$/.test(nextLine)) {
          sections.push({ title: line, level: 1 });
        } else if (/^[-]+$/.test(nextLine)) {
          sections.push({ title: line, level: 2 });
        } else if (/^[~]+$/.test(nextLine)) {
          sections.push({ title: line, level: 3 });
        }
      }
    }

    return sections;
  }

  /**
   * Extract title from AsciiDoc content
   */
  private extractAsciiDocTitle(lines: string[]): string {
    for (const line of lines) {
      if (line.startsWith('= ')) {
        return line.substring(2).trim();
      }
    }
    return lines[0]?.trim() || 'Untitled Document';
  }

  /**
   * Calculate simple checksum for content
   */
  private calculateChecksum(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Sync documentation files with the knowledge graph
   */
  async syncDocumentation(docsPath: string): Promise<SyncResult> {
    const result: SyncResult = {
      processedFiles: 0,
      newDomains: 0,
      updatedClusters: 0,
      errors: []
    };

    try {
      // Find all documentation files
      const docFiles = await this.findDocumentationFiles(docsPath);

      for (const filePath of docFiles) {
        try {
          // Parse the file
          const parsedDoc = await this.parseFile(filePath);

          // Create or update documentation node
          await this.createOrUpdateDocumentationNode(filePath, parsedDoc);

          // Extract and create business domains
          const newDomains = await this.extractAndCreateDomains(parsedDoc);
          result.newDomains += newDomains;

          // Update semantic clusters
          await this.updateSemanticClusters(parsedDoc);

          result.processedFiles++;
        } catch (error) {
          result.errors.push(`${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      result.updatedClusters = await this.refreshClusters();

    } catch (error) {
      result.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Find all documentation files in a directory
   */
  private async findDocumentationFiles(docsPath: string): Promise<string[]> {
    const { promises: fs } = await import('fs');
    const files: string[] = [];

    const processDirectory = async (dirPath: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            // Skip node_modules and hidden directories
            if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist') {
              await processDirectory(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = extname(entry.name).toLowerCase();
            if (this.supportedExtensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${dirPath}:`, error);
      }
    };

    await processDirectory(docsPath);
    return files;
  }

  /**
   * Create or update documentation node in knowledge graph
   */
  private async createOrUpdateDocumentationNode(filePath: string, parsedDoc: ParsedDocument): Promise<void> {
    const docId = `doc_${basename(filePath, extname(filePath))}_${this.calculateChecksum(parsedDoc.content).substring(0, 8)}`;

    const docNode: DocumentationNode = {
      id: docId,
      path: filePath,
      hash: this.calculateChecksum(parsedDoc.content),
      language: 'markdown', // or detect from extension
      lastModified: new Date(),
      created: new Date(),
      type: 'documentation',
      title: parsedDoc.title,
      content: parsedDoc.content,
      docType: parsedDoc.docType,
      businessDomains: parsedDoc.businessDomains,
      stakeholders: parsedDoc.stakeholders,
      technologies: parsedDoc.technologies,
      status: 'active'
    };

    await this.kgService.createEntity(docNode);
  }

  /**
   * Extract and create business domains
   */
  private async extractAndCreateDomains(parsedDoc: ParsedDocument): Promise<number> {
    let newDomainsCount = 0;

    for (const domainName of parsedDoc.businessDomains) {
      const domainId = `domain_${domainName.replace(/\s+/g, '_').toLowerCase()}`;

      // Check if domain already exists
      const existingDomain = await this.kgService.getEntity(domainId);
      if (!existingDomain) {
        const domain: BusinessDomain = {
          id: domainId,
          type: 'businessDomain',
          name: domainName,
          description: `Business domain extracted from documentation: ${parsedDoc.title}`,
          criticality: this.inferDomainCriticality(domainName),
          stakeholders: parsedDoc.stakeholders,
          keyProcesses: [], // Could be extracted from content
          extractedFrom: [parsedDoc.title]
        };

        await this.kgService.createEntity(domain);
        newDomainsCount++;
      }
    }

    return newDomainsCount;
  }

  /**
   * Infer domain criticality based on name patterns
   */
  private inferDomainCriticality(domainName: string): BusinessDomain['criticality'] {
    const lowerName = domainName.toLowerCase();

    if (lowerName.includes('authentication') || lowerName.includes('security') || lowerName.includes('payment')) {
      return 'core';
    }
    if (lowerName.includes('user management') || lowerName.includes('reporting') || lowerName.includes('communication')) {
      return 'supporting';
    }

    return 'utility';
  }

  /**
   * Update semantic clusters based on parsed documentation
   */
  private async updateSemanticClusters(parsedDoc: ParsedDocument): Promise<void> {
    // This is a simplified implementation
    // In a real scenario, this would analyze the content and group related entities
    for (const domain of parsedDoc.businessDomains) {
      const clusterId = `cluster_${domain.replace(/\s+/g, '_').toLowerCase()}`;

      const cluster: SemanticCluster = {
        id: clusterId,
        type: 'semanticCluster',
        name: `${domain} Cluster`,
        description: `Semantic cluster for ${domain} domain`,
        businessDomainId: `domain_${domain.replace(/\s+/g, '_').toLowerCase()}`,
        clusterType: 'capability',
        cohesionScore: 0.8,
        lastAnalyzed: new Date(),
        memberEntities: []
      };

      await this.kgService.createEntity(cluster);
    }
  }

  /**
   * Refresh and update all clusters
   */
  private async refreshClusters(): Promise<number> {
    // Simplified implementation - would analyze all entities and rebuild clusters
    return 0;
  }

  /**
   * Search documentation content
   */
  async searchDocumentation(query: string, options: {
    domain?: string;
    docType?: DocumentationNode['docType'];
    limit?: number;
  } = {}): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // This is a simplified search implementation
    // In a real scenario, this would use vector search or full-text search

    // Get all documentation nodes
    const docs = await this.kgService.findEntitiesByType('documentation');

    for (const doc of docs) {
      const documentationNode = doc as DocumentationNode;

      // Filter by options
      if (options.domain && (!documentationNode.businessDomains || 
          !documentationNode.businessDomains.some(d =>
            d.toLowerCase().includes(options.domain!.toLowerCase())))) {
        continue;
      }

      if (options.docType && documentationNode.docType !== options.docType) {
        continue;
      }

      // Simple text matching (could be enhanced with NLP)
      const relevanceScore = this.calculateRelevanceScore(query, documentationNode);
      if (relevanceScore > 0) {
        results.push({
          document: documentationNode,
          relevanceScore,
          matchedSections: this.findMatchedSections(query, documentationNode.content)
        });
      }
    }

    // Sort by relevance and limit results
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return results.slice(0, options.limit || 20);
  }

  /**
   * Calculate relevance score for search query
   */
  private calculateRelevanceScore(query: string, doc: DocumentationNode): number {
    const lowerQuery = query.toLowerCase();
    const lowerContent = doc.content.toLowerCase();
    const lowerTitle = doc.title.toLowerCase();

    let score = 0;

    // Title matches are most important
    if (lowerTitle.includes(lowerQuery)) {
      score += 10;
    }

    // Content matches
    const contentMatches = (lowerContent.match(new RegExp(lowerQuery, 'g')) || []).length;
    score += contentMatches * 2;

    // Business domain matches
    if (doc.businessDomains && doc.businessDomains.length > 0) {
      const domainMatches = doc.businessDomains.filter(d =>
        d.toLowerCase().includes(lowerQuery)).length;
      score += domainMatches * 5;
    }

    // Technology matches
    if (doc.technologies && doc.technologies.length > 0) {
      const techMatches = doc.technologies.filter(t =>
        t.toLowerCase().includes(lowerQuery)).length;
      score += techMatches * 3;
    }

    return score;
  }

  /**
   * Find matched sections in content
   */
  private findMatchedSections(query: string, content: string): string[] {
    const sections: string[] = [];
    const lines = content.split('\n');
    const lowerQuery = query.toLowerCase();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.toLowerCase().includes(lowerQuery)) {
        // Include context around the match
        const start = Math.max(0, i - 2);
        const end = Math.min(lines.length, i + 3);
        const context = lines.slice(start, end).join('\n');
        sections.push(context);
      }
    }

    return sections.slice(0, 5); // Limit to top 5 matches
  }
}

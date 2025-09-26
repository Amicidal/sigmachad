/**
 * Documentation Parser Service
 * Facade that orchestrates parsing, indexing, and synchronization of documentation files
 * Refactored into modular components for better maintainability
 */

import { KnowledgeGraphService } from "./KnowledgeGraphService.js";
import { DatabaseService } from "../core/DatabaseService.js";
import {
  DocumentationIntelligenceProvider,
  HeuristicDocumentationIntelligenceProvider,
} from "./DocumentationIntelligenceProvider.js";
import {
  DocTokenizer,
  IntentExtractor,
  SyncOrchestrator,
  ParsedDocument,
  DomainExtraction,
  SyncResult,
  SearchResult,
} from "./docs-parser/index.js";
import {
  DocumentationNode,
  BusinessDomain,
  SemanticCluster,
} from '@memento/core';
import {
  RelationshipType,
  DocumentationRelationship,
} from '@memento/core';
import { join, extname, basename } from "path";
import { marked, TokensList } from "marked";

export { ParsedDocument, DomainExtraction, SyncResult, SearchResult };

export class DocumentationParser {
  private tokenizer: DocTokenizer;
  private intentExtractor: IntentExtractor;
  private syncOrchestrator: SyncOrchestrator;
  private intelligenceProvider: DocumentationIntelligenceProvider;
  private kgService: KnowledgeGraphService;
  private supportedExtensions = [".md", ".txt", ".rst", ".adoc"];

  constructor(
    kgService: KnowledgeGraphService,
    dbService: DatabaseService,
    intelligenceProvider?: DocumentationIntelligenceProvider
  ) {
    this.intelligenceProvider =
      intelligenceProvider ?? new HeuristicDocumentationIntelligenceProvider();
    this.kgService = kgService;
    this.intentExtractor = new IntentExtractor(this.intelligenceProvider);
    this.syncOrchestrator = new SyncOrchestrator(
      kgService,
      dbService,
      this.intentExtractor
    );
    this.tokenizer = new DocTokenizer();
  }

  private inferDocIntent(
    filePath: string,
    docType: DocumentationNode["docType"]
  ): DocumentationNode["docIntent"] {
    const normalizedPath = filePath.toLowerCase();

    if (
      normalizedPath.includes("/adr") ||
      normalizedPath.includes("adr-") ||
      normalizedPath.includes("/architecture") ||
      normalizedPath.includes("/decisions") ||
      docType === "architecture"
    ) {
      return "governance";
    }

    if (docType === "design-doc" || docType === "user-guide") {
      return "mixed";
    }

    return "ai-context";
  }

  private inferDocLocale(
    filePath: string,
    metadata: Record<string, any>
  ): string | undefined {
    const localeMatch = filePath
      .toLowerCase()
      .match(/\.([a-z]{2}(?:-[a-z0-9]+)?)\.(md|txt|rst|adoc)$/);
    if (localeMatch) {
      return localeMatch[1];
    }

    if (
      typeof metadata?.language === "string" &&
      metadata.language.length > 0
    ) {
      return metadata.language;
    }

    return "en";
  }

  private normalizeDomainPath(domainName: string): string {
    const cleaned = domainName
      .trim()
      .toLowerCase()
      .replace(/>+/g, "/")
      .replace(/\s+/g, "/")
      .replace(/[^a-z0-9/_-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/\/+/, "/")
      .replace(/\/+/, "/");
    return cleaned.replace(/^\/+|\/+$/g, "");
  }

  /**
   * Parse a documentation file and extract structured information
   */
  async parseFile(filePath: string): Promise<ParsedDocument> {
    // Parse with tokenizer
    const parsedDoc = await this.tokenizer.parseFile(filePath);

    // Read content for intent extraction
    const content = parsedDoc.content;

    // Enhance with intent extraction
    return this.intentExtractor.enhanceDocument(parsedDoc, content);
  }

  /**
   * Parse markdown content using marked library
   */
  async parseMarkdown(
    content: string,
    filePath?: string
  ): Promise<ParsedDocument> {
    const tokens = marked.lexer(content);
    const title = this.extractTitle(tokens);
    const docType = this.inferDocType(content, title);

    // Compute headings and conditionally remove the first H1 used as title
    const allHeadings = this.extractHeadings(tokens);
    let headings = allHeadings;
    const h1Count = allHeadings.filter((h) => h.level === 1).length;
    const idxFirstH1 = allHeadings.findIndex(
      (h) => h.level === 1 && h.text === title
    );
    if (
      idxFirstH1 !== -1 &&
      h1Count === 1 &&
      allHeadings.length > 1 &&
      allHeadings.length <= 5
    ) {
      headings = allHeadings
        .slice(0, idxFirstH1)
        .concat(allHeadings.slice(idxFirstH1 + 1));
    }

    const markdownMetadata = {
      format: "markdown",
      headings,
      links: this.extractLinksFromContent(content, tokens),
      codeBlocks: this.extractCodeBlocks(tokens),
      tokens,
      wordCount: content.split(/\s+/).filter(Boolean).length,
      lineCount: content.split(/\n/).length,
    };

    const signals = await this.intelligenceProvider.extractSignals({
      content,
      format: "markdown",
      filePath,
      docTypeHint: docType,
      metadata: markdownMetadata,
    });

    return {
      title,
      content,
      businessDomains: signals.businessDomains ?? [],
      stakeholders: signals.stakeholders ?? [],
      technologies: signals.technologies ?? [],
      docType,
      docIntent: signals.docIntent ?? "ai-context",
      docVersion: "",
      docHash: "",
      docSource: signals.docSource ?? "parser",
      docLocale: signals.docLocale,
      lastIndexed: new Date(),
      metadata: markdownMetadata,
    };
  }

  /**
   * Parse plaintext content
   */
  private async parsePlaintext(
    content: string,
    filePath?: string
  ): Promise<ParsedDocument> {
    const lines = content.split("\n");
    const title = lines[0]?.trim() || "Untitled Document";
    const docType = this.inferDocType(content, title);

    const baseMetadata = {
      lineCount: lines.length,
      wordCount: content.split(/\s+/).filter(Boolean).length,
      format: "plaintext",
    };

    const signals = await this.intelligenceProvider.extractSignals({
      content,
      format: "plaintext",
      filePath,
      docTypeHint: docType,
      metadata: baseMetadata,
    });

    return {
      title,
      content,
      businessDomains: signals.businessDomains ?? [],
      stakeholders: signals.stakeholders ?? [],
      technologies: signals.technologies ?? [],
      docType,
      docIntent: signals.docIntent ?? "ai-context",
      docVersion: "",
      docHash: "",
      docSource: signals.docSource ?? "parser",
      docLocale: signals.docLocale,
      lastIndexed: new Date(),
      metadata: baseMetadata,
    };
  }

  /**
   * Parse reStructuredText content (basic implementation)
   */
  private async parseRestructuredText(
    content: string,
    filePath?: string
  ): Promise<ParsedDocument> {
    const lines = content.split("\n");
    const title = this.extractRstTitle(lines);
    const docType = this.inferDocType(content, title);

    const rstMetadata = {
      sections: this.extractRstSections(lines),
      format: "rst",
      lineCount: lines.length,
      wordCount: content.split(/\s+/).filter(Boolean).length,
    };

    const signals = await this.intelligenceProvider.extractSignals({
      content,
      format: "rst",
      filePath,
      docTypeHint: docType,
      metadata: rstMetadata,
    });

    return {
      title,
      content,
      businessDomains: signals.businessDomains ?? [],
      stakeholders: signals.stakeholders ?? [],
      technologies: signals.technologies ?? [],
      docType,
      docIntent: signals.docIntent ?? "ai-context",
      docVersion: "",
      docHash: "",
      docSource: signals.docSource ?? "parser",
      docLocale: signals.docLocale,
      lastIndexed: new Date(),
      metadata: rstMetadata,
    };
  }

  /**
   * Parse AsciiDoc content (basic implementation)
   */
  private async parseAsciiDoc(
    content: string,
    filePath?: string
  ): Promise<ParsedDocument> {
    const lines = content.split("\n");
    const title = this.extractAsciiDocTitle(lines);
    const docType = this.inferDocType(content, title);

    const adocMetadata = {
      format: "asciidoc",
      lineCount: lines.length,
      wordCount: content.split(/\s+/).filter(Boolean).length,
    };

    const signals = await this.intelligenceProvider.extractSignals({
      content,
      format: "asciidoc",
      filePath,
      docTypeHint: docType,
      metadata: adocMetadata,
    });

    return {
      title,
      content,
      businessDomains: signals.businessDomains ?? [],
      stakeholders: signals.stakeholders ?? [],
      technologies: signals.technologies ?? [],
      docType,
      docIntent: signals.docIntent ?? "ai-context",
      docVersion: "",
      docHash: "",
      docSource: signals.docSource ?? "parser",
      docLocale: signals.docLocale,
      lastIndexed: new Date(),
      metadata: adocMetadata,
    };
  }

  /**
   * Extract title from markdown tokens
   */
  private extractTitle(tokens: TokensList): string {
    for (const token of tokens) {
      if (token.type === "heading" && token.depth === 1) {
        return token.text;
      }
    }
    return "Untitled Document";
  }

  /**
   * Infer document type based on content and title
   */
  private inferDocType(
    content: string,
    title: string
  ): DocumentationNode["docType"] {
    const lowerContent = content.toLowerCase();
    const lowerTitle = title.toLowerCase();

    // Prioritize architecture detection when title indicates it
    if (
      lowerTitle.includes("architecture") ||
      lowerContent.includes("system architecture") ||
      lowerContent.includes("technical architecture")
    ) {
      return "architecture";
    }

    // Check for API documentation
    if (
      lowerTitle.includes("api") ||
      lowerContent.includes("endpoint") ||
      lowerContent.includes("swagger") ||
      lowerContent.includes("rest")
    ) {
      return "api-docs";
    }

    // Check for design documents
    if (
      lowerTitle.includes("design") ||
      lowerContent.includes("system design") ||
      lowerContent.includes("design document")
    ) {
      return "design-doc";
    }

    // Check for user guides and manuals - broader detection
    if (
      lowerTitle.includes("guide") ||
      lowerTitle.includes("manual") ||
      lowerTitle.includes("getting started") ||
      lowerTitle.includes("tutorial") ||
      lowerTitle.includes("user") ||
      lowerContent.includes("how to") ||
      lowerContent.includes("step by step") ||
      lowerContent.includes("instructions") ||
      lowerContent.includes("getting started") ||
      lowerContent.includes("introduction")
    ) {
      return "user-guide";
    }

    // Check for README files
    if (lowerTitle.includes("readme") || lowerTitle.includes("read me")) {
      return "readme";
    }

    // Check for high-level overview content
    if (
      lowerContent.includes("high level") ||
      lowerContent.includes("overview")
    ) {
      return "architecture";
    }

    return "readme"; // Default fallback
  }

  /**
   * Extract headings from markdown tokens
   */
  private extractHeadings(
    tokens: TokensList
  ): Array<{ level: number; text: string }> {
    return tokens
      .filter((token): token is Tokens.Heading => token.type === "heading")
      .map((heading) => ({
        level: heading.depth,
        text: heading.text,
      }));
  }

  /**
   * Extract links from markdown tokens
   */
  private extractLinks(tokens: TokensList): string[] {
    // Kept for backward compatibility; now superseded by extractLinksFromContent
    const links: string[] = [];
    const extractFromToken = (token: any) => {
      if (token.type === "link") {
        links.push(token.href);
      }
      if ("tokens" in token && token.tokens) {
        token.tokens.forEach(extractFromToken);
      }
    };
    tokens.forEach(extractFromToken);
    return links;
  }

  private extractLinksFromContent(
    content: string,
    tokens?: TokensList
  ): string[] {
    const found = new Set<string>();

    // 1) Standard markdown links: [text](url)
    const mdLinkRe = /\[[^\]]+\]\(([^)\s]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = mdLinkRe.exec(content)) !== null) {
      found.add(match[1]);
    }

    // 2) Reference-style definitions: [ref]: https://example.com
    const refDefRe = /^\s*\[[^\]]+\]:\s*(\S+)/gim;
    while ((match = refDefRe.exec(content)) !== null) {
      found.add(match[1]);
    }

    // 3) Autolinks: https://example.com
    const autoRe = /https?:\/\/[^\s)\]]+/g;
    while ((match = autoRe.exec(content)) !== null) {
      found.add(match[0]);
    }

    // 4) Also parse via tokens to catch any structured links
    if (tokens) {
      this.extractLinks(tokens).forEach((l) => found.add(l));
    }

    return Array.from(found);
  }

  /**
   * Extract code blocks from markdown tokens
   */
  private extractCodeBlocks(
    tokens: TokensList
  ): Array<{ lang?: string; code: string }> {
    return tokens
      .filter((token): token is any => token.type === "code")
      .map((codeBlock: any) => ({
        lang: (codeBlock.lang ?? "") as string,
        code: codeBlock.text,
      }));
  }

  /**
   * Extract title from RST content
   */
  private extractRstTitle(lines: string[]): string {
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      const nextLine = lines[i + 1]?.trim();

      if (
        line &&
        nextLine &&
        /^[=]+$/.test(nextLine) &&
        nextLine.length >= line.length
      ) {
        return line;
      }
    }
    return lines[0]?.trim() || "Untitled Document";
  }

  /**
   * Extract sections from RST content
   */
  private extractRstSections(
    lines: string[]
  ): Array<{ title: string; level: number }> {
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
      if (line.startsWith("= ")) {
        return line.substring(2).trim();
      }
    }
    return lines[0]?.trim() || "Untitled Document";
  }

  /**
   * Calculate simple checksum for content
   */
  private calculateChecksum(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Sync documentation files with the knowledge graph
   */
  async syncDocumentation(docsPath: string): Promise<SyncResult> {
    return this.syncOrchestrator.syncDocumentation(docsPath);
  }

  /**
   * Find all documentation files in a directory
   */
  private async findDocumentationFiles(docsPath: string): Promise<string[]> {
    const fs = await import("fs/promises");
    const files: string[] = [];

    const processDirectory = async (dirPath: string): Promise<void> => {
      try {
        const names = await fs.readdir(dirPath);

        for (const name of names) {
          const fullPath = join(dirPath, name);
          let stat: any;
          try {
            stat = await (fs as any).stat(fullPath);
          } catch (e) {
            continue;
          }

          if (
            stat &&
            typeof stat.isDirectory === "function" &&
            stat.isDirectory()
          ) {
            // Skip node_modules and hidden directories
            if (
              !name.startsWith(".") &&
              name !== "node_modules" &&
              name !== "dist"
            ) {
              await processDirectory(fullPath);
            }
          } else if (
            stat &&
            typeof stat.isFile === "function" &&
            stat.isFile()
          ) {
            const ext = extname(name).toLowerCase();
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
  private async createOrUpdateDocumentationNode(
    filePath: string,
    parsedDoc: ParsedDocument
  ): Promise<string> {
    const docId = `doc_${basename(
      filePath,
      extname(filePath)
    )}_${this.calculateChecksum(parsedDoc.content).substring(0, 8)}`;

    const docNode: DocumentationNode = {
      id: docId,
      path: filePath,
      hash: this.calculateChecksum(parsedDoc.content),
      language: "markdown", // or detect from extension
      lastModified: new Date(),
      created: new Date(),
      type: "documentation",
      title: parsedDoc.title,
      content: parsedDoc.content,
      docType: parsedDoc.docType,
      businessDomains: parsedDoc.businessDomains,
      stakeholders: parsedDoc.stakeholders,
      technologies: parsedDoc.technologies,
      status: "active",
      docVersion: parsedDoc.docVersion,
      docHash: parsedDoc.docHash,
      docIntent: parsedDoc.docIntent,
      docSource: parsedDoc.docSource,
      docLocale: parsedDoc.docLocale,
      lastIndexed: parsedDoc.lastIndexed,
    };

    await this.kgService.createEntity(docNode);
    return docId;
  }

  /**
   * Extract and create business domains
   */
  private async extractAndCreateDomains(
    parsedDoc: ParsedDocument,
    docId: string
  ): Promise<number> {
    let newDomainsCount = 0;

    for (const domainName of parsedDoc.businessDomains) {
      const domainId = `domain_${domainName
        .replace(/\s+/g, "_")
        .toLowerCase()}`;

      // Check if domain already exists
      const existingDomain = await this.kgService.getEntity(domainId);
      const domain: BusinessDomain = {
        id: domainId,
        type: "businessDomain",
        name: domainName,
        description: `Business domain extracted from documentation: ${parsedDoc.title}`,
        criticality: this.inferDomainCriticality(domainName),
        stakeholders: parsedDoc.stakeholders,
        keyProcesses: [], // Could be extracted from content
        extractedFrom: [parsedDoc.title],
      };

      await this.kgService.createEntity(domain);
      if (!existingDomain) {
        newDomainsCount++;
      }

      const domainPath = this.normalizeDomainPath(domainName);
      const taxonomyVersion =
        typeof parsedDoc.metadata?.taxonomyVersion === "string"
          ? parsedDoc.metadata.taxonomyVersion
          : "v1";
      const updatedFromDocAt =
        parsedDoc.metadata?.lastModified instanceof Date
          ? parsedDoc.metadata.lastModified
          : parsedDoc.lastIndexed;
      const sectionAnchor = "_root";

      // Create/ensure relationship from documentation -> domain
      try {
        await this.kgService.createRelationship({
          id: `rel_${docId}_${domainId}_DESCRIBES_DOMAIN`,
          fromEntityId: docId,
          toEntityId: domainId,
          type: RelationshipType.DESCRIBES_DOMAIN,
          created: new Date(),
          lastModified: new Date(),
          version: 1,
          confidence: 0.6,
          source: "parser",
          docIntent: parsedDoc.docIntent,
          domainPath,
          taxonomyVersion,
          sectionAnchor,
          lastValidated: parsedDoc.lastIndexed,
          updatedFromDocAt,
          metadata: {
            inferred: true,
            confidence: 0.6,
            source: "doc-domain-extract",
            domainName,
            domainPath,
            taxonomyVersion,
            sectionAnchor,
            docIntent: parsedDoc.docIntent,
            updatedFromDocAt,
          },
        } as DocumentationRelationship as any);
      } catch {
        // Non-fatal
      }
    }

    return newDomainsCount;
  }

  /**
   * Infer domain criticality based on name patterns
   */
  private inferDomainCriticality(
    domainName: string
  ): BusinessDomain["criticality"] {
    const lowerName = domainName.toLowerCase();

    if (
      lowerName.includes("authentication") ||
      lowerName.includes("security") ||
      lowerName.includes("payment")
    ) {
      return "core";
    }
    if (
      lowerName.includes("user management") ||
      lowerName.includes("reporting") ||
      lowerName.includes("communication")
    ) {
      return "supporting";
    }

    return "utility";
  }

  /**
   * Update semantic clusters based on parsed documentation
   */
  private async updateSemanticClusters(
    parsedDoc: ParsedDocument,
    docId: string
  ): Promise<void> {
    // This is a simplified implementation
    // In a real scenario, this would analyze the content and group related entities
    for (const domain of parsedDoc.businessDomains) {
      const clusterId = `cluster_${domain.replace(/\s+/g, "_").toLowerCase()}`;

      const cluster: SemanticCluster = {
        id: clusterId,
        type: "semanticCluster",
        name: `${domain} Cluster`,
        description: `Semantic cluster for ${domain} domain`,
        businessDomainId: `domain_${domain.replace(/\s+/g, "_").toLowerCase()}`,
        clusterType: "capability",
        cohesionScore: 0.8,
        lastAnalyzed: new Date(),
        memberEntities: [],
      };

      await this.kgService.createEntity(cluster);

      // Link cluster to documentation
      try {
        await this.kgService.createRelationship({
          id: `rel_${clusterId}_${docId}_DOCUMENTED_BY`,
          fromEntityId: clusterId,
          toEntityId: docId,
          type: RelationshipType.DOCUMENTED_BY,
          created: new Date(),
          lastModified: new Date(),
          version: 1,
          confidence: 0.6,
          source: "parser",
          docIntent: parsedDoc.docIntent,
          sectionAnchor: "_root",
          documentationQuality: "partial",
          coverageScope: "behavior",
          docVersion: parsedDoc.docVersion,
          docHash: parsedDoc.docHash,
          lastValidated: parsedDoc.lastIndexed,
          metadata: {
            inferred: true,
            confidence: 0.6,
            source: "doc-cluster-link",
            sectionAnchor: "_root",
            documentationQuality: "partial",
            coverageScope: "behavior",
            docVersion: parsedDoc.docVersion,
            docHash: parsedDoc.docHash,
            docIntent: parsedDoc.docIntent,
          },
        } as DocumentationRelationship as any);
      } catch {}

      // Link cluster to domain explicitly
      try {
        const domainId = `domain_${domain.replace(/\s+/g, "_").toLowerCase()}`;
        await this.kgService.createRelationship({
          id: `rel_${clusterId}_${domainId}_BELONGS_TO_DOMAIN`,
          fromEntityId: clusterId,
          toEntityId: domainId,
          type: RelationshipType.BELONGS_TO_DOMAIN,
          created: new Date(),
          lastModified: new Date(),
          version: 1,
          confidence: 0.6,
          strength: 0.5,
          source: "parser",
          docIntent: parsedDoc.docIntent,
          domainPath: this.normalizeDomainPath(domain),
          lastValidated: parsedDoc.lastIndexed,
          metadata: {
            inferred: true,
            confidence: 0.6,
            strength: 0.5,
            source: "cluster-domain",
            domainPath: this.normalizeDomainPath(domain),
            docIntent: parsedDoc.docIntent,
          },
        } as DocumentationRelationship as any);
      } catch {}
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
  async searchDocumentation(
    query: string,
    options?: {
      limit?: number;
      minScore?: number;
      domain?: string;
    }
  ): Promise<SearchResult[]> {
    return this.syncOrchestrator.searchDocumentation(query, options);
  }
}

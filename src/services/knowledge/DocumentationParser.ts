/**
 * Documentation Parser Service
 * Handles parsing, indexing, and synchronization of documentation files
 */

import { marked } from "marked";
import type { Tokens, TokensList } from "marked";
import { readFileSync } from "fs";
import { join, extname, basename } from "path";
import { KnowledgeGraphService } from "./knowledge/KnowledgeGraphService.js";
import { DatabaseService } from "./core/DatabaseService.js";
import {
  DocumentationNode,
  BusinessDomain,
  SemanticCluster,
  Entity,
} from "../models/entities.js";
import {
  RelationshipType,
  DocumentationRelationship,
} from "../models/relationships.js";
import {
  DocumentationIntelligenceProvider,
  HeuristicDocumentationIntelligenceProvider,
} from "./DocumentationIntelligenceProvider.js";

export interface ParsedDocument {
  title: string;
  content: string;
  businessDomains: string[];
  stakeholders: string[];
  technologies: string[];
  docType: DocumentationNode["docType"];
  docIntent: DocumentationNode["docIntent"];
  docVersion: string;
  docHash: string;
  docSource: DocumentationNode["docSource"];
  docLocale?: string;
  lastIndexed: Date;
  metadata: Record<string, any>;
}

export interface DomainExtraction {
  name: string;
  description: string;
  criticality: BusinessDomain["criticality"];
  stakeholders: string[];
  keyProcesses: string[];
  confidence: number;
}

export interface SyncResult {
  processedFiles: number;
  newDomains: number;
  updatedClusters: number;
  errors: string[];
  refreshedRelationships?: number;
  staleRelationships?: number;
  sectionsLinked?: number;
}

export interface SearchResult {
  document: DocumentationNode;
  relevanceScore: number;
  matchedSections: string[];
}

export class DocumentationParser {
  private kgService: KnowledgeGraphService;
  private dbService: DatabaseService;
  private supportedExtensions = [".md", ".txt", ".rst", ".adoc"];
  private intelligenceProvider: DocumentationIntelligenceProvider;

  constructor(
    kgService: KnowledgeGraphService,
    dbService: DatabaseService,
    intelligenceProvider?: DocumentationIntelligenceProvider
  ) {
    this.kgService = kgService;
    this.dbService = dbService;
    this.intelligenceProvider =
      intelligenceProvider ?? new HeuristicDocumentationIntelligenceProvider();
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

    if (typeof metadata?.language === "string" && metadata.language.length > 0) {
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
    try {
      const content = readFileSync(filePath, "utf-8");
      const extension = extname(filePath).toLowerCase();

      let parsedContent: ParsedDocument;

      switch (extension) {
        case ".md":
          parsedContent = await this.parseMarkdown(content, filePath);
          break;
        case ".txt":
          parsedContent = await this.parsePlaintext(content, filePath);
          break;
        case ".rst":
          parsedContent = await this.parseRestructuredText(content, filePath);
          break;
        case ".adoc":
          parsedContent = await this.parseAsciiDoc(content, filePath);
          break;
        default:
          parsedContent = await this.parsePlaintext(content, filePath);
      }

      const checksum = this.calculateChecksum(content);
      const providerIntent = parsedContent.docIntent;
      const inferredIntent =
        providerIntent ?? this.inferDocIntent(filePath, parsedContent.docType);
      const locale = this.inferDocLocale(filePath, parsedContent.metadata);
      const now = new Date();

      parsedContent.docIntent = inferredIntent;
      parsedContent.docVersion = checksum;
      parsedContent.docHash = checksum;
      parsedContent.docSource = parsedContent.docSource || "parser";
      parsedContent.docLocale = locale;
      parsedContent.lastIndexed = now;

      // Extract additional metadata
      parsedContent.metadata = {
        ...parsedContent.metadata,
        filePath,
        fileSize: content.length,
        lastModified: now,
        checksum,
        docIntent: inferredIntent,
        docVersion: checksum,
        docLocale: locale,
      };

      return parsedContent;
    } catch (error) {
      throw new Error(
        `Failed to parse file ${filePath}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
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
    const result: SyncResult = {
      processedFiles: 0,
      newDomains: 0,
      updatedClusters: 0,
      errors: [],
      sectionsLinked: 0,
    };

    const processedDocs: Array<{ id: string; lastIndexed: Date }> = [];
    let linkedSectionsTotal = 0;

    try {
      // Find all documentation files
      const docFiles = await this.findDocumentationFiles(docsPath);

      for (const filePath of docFiles) {
        try {
          // Parse the file
          const parsedDoc = await this.parseFile(filePath);

          // Create or update documentation node
          const docId = await this.createOrUpdateDocumentationNode(filePath, parsedDoc);

          // Extract and create business domains
          const newDomains = await this.extractAndCreateDomains(parsedDoc, docId);
          result.newDomains += newDomains;

          // Update semantic clusters
          await this.updateSemanticClusters(parsedDoc, docId);

          linkedSectionsTotal += await this.linkDocumentSections(
            docId,
            parsedDoc
          );

          processedDocs.push({ id: docId, lastIndexed: parsedDoc.lastIndexed });

          result.processedFiles++;
        } catch (error) {
          result.errors.push(
            `${filePath}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      try {
        const freshness = await this.applyFreshnessUpdates(processedDocs);
        result.refreshedRelationships = freshness.refreshed;
        result.staleRelationships = freshness.stale;
      } catch (freshnessError) {
        result.errors.push(
          `Freshness update failed: ${
            freshnessError instanceof Error
              ? freshnessError.message
              : "Unknown error"
          }`
        );
      }

      result.updatedClusters = await this.refreshClusters();
      result.sectionsLinked = linkedSectionsTotal;
    } catch (error) {
      result.errors.push(
        `Sync failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    return result;
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
    options: {
      domain?: string;
      docType?: DocumentationNode["docType"];
      limit?: number;
    } = {}
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // This is a simplified search implementation
    // In a real scenario, this would use vector search or full-text search

    // Get all documentation nodes
    const docs = await this.kgService.findEntitiesByType("documentation");

    for (const doc of docs) {
      const documentationNode = doc as DocumentationNode;

      // Filter by options
      if (
        options.domain &&
        (!documentationNode.businessDomains ||
          !documentationNode.businessDomains.some((d) =>
            d.toLowerCase().includes(options.domain!.toLowerCase())
          ))
      ) {
        continue;
      }

      if (options.docType && documentationNode.docType !== options.docType) {
        continue;
      }

      // Simple text matching (could be enhanced with NLP)
      const relevanceScore = this.calculateRelevanceScore(
        query,
        documentationNode
      );
      if (relevanceScore > 0) {
        results.push({
          document: documentationNode,
          relevanceScore,
          matchedSections: this.findMatchedSections(
            query,
            documentationNode.content
          ),
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
  private calculateRelevanceScore(
    query: string,
    doc: DocumentationNode
  ): number {
    const lowerQuery = query.toLowerCase();
    const lowerContent = doc.content.toLowerCase();
    const lowerTitle = doc.title.toLowerCase();

    let score = 0;

    // Title matches are most important
    if (lowerTitle.includes(lowerQuery)) {
      score += 10;
    }

    // Content matches
    const contentMatches = (
      lowerContent.match(new RegExp(lowerQuery, "g")) || []
    ).length;
    score += contentMatches * 2;

    // Business domain matches
    if (doc.businessDomains && doc.businessDomains.length > 0) {
      const domainMatches = doc.businessDomains.filter((d) =>
        d.toLowerCase().includes(lowerQuery)
      ).length;
      score += domainMatches * 5;
    }

    // Technology matches
    if (doc.technologies && doc.technologies.length > 0) {
      const techMatches = doc.technologies.filter((t) =>
        t.toLowerCase().includes(lowerQuery)
      ).length;
      score += techMatches * 3;
    }

    return score;
  }

  /**
   * Find matched sections in content
   */
  private findMatchedSections(query: string, content: string): string[] {
    const sections: string[] = [];
    const lines = content.split("\n");
    const lowerQuery = query.toLowerCase();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.toLowerCase().includes(lowerQuery)) {
        // Include context around the match
        const start = Math.max(0, i - 2);
        const end = Math.min(lines.length, i + 3);
        const context = lines.slice(start, end).join("\n");
        sections.push(context);
      }
    }

    return sections.slice(0, 5); // Limit to top 5 matches
  }

  private getFreshnessWindowDays(): number {
    const raw = process.env.DOC_FRESHNESS_MAX_AGE_DAYS;
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
    return 14;
  }

  private async linkDocumentSections(
    docId: string,
    parsedDoc: ParsedDocument
  ): Promise<number> {
    const sections = this.extractSectionDescriptors(parsedDoc);
    if (sections.length === 0) return 0;

    let linked = 0;
    for (const section of sections.slice(0, 30)) {
      try {
        await this.kgService.createRelationship(
          {
            id: `rel_${docId}_${section.anchor}_DOCUMENTS_SECTION`,
            fromEntityId: docId,
            toEntityId: docId,
            type: RelationshipType.DOCUMENTS_SECTION,
            created: new Date(),
            lastModified: new Date(),
            version: 1,
            source: "parser",
            docIntent: parsedDoc.docIntent,
            docVersion: parsedDoc.docVersion,
            docHash: parsedDoc.docHash,
            docLocale: parsedDoc.docLocale,
            lastValidated: parsedDoc.lastIndexed,
            sectionAnchor: section.anchor,
            sectionTitle: section.title,
            summary: section.summary,
            metadata: {
              level: section.level,
              inferred: true,
              source: "doc-section-extract",
              sectionAnchor: section.anchor,
              sectionTitle: section.title,
              summary: section.summary,
              levelOrdinal: section.level,
            },
          } as DocumentationRelationship as any,
        );
        linked++;
      } catch (error) {
        console.warn(
          `Failed to link documentation section ${section.anchor} for ${docId}:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    return linked;
  }

  private extractSectionDescriptors(
    parsedDoc: ParsedDocument
  ): Array<{ title: string; anchor: string; level: number; summary?: string }> {
    const sections: Array<{ title: string; level: number }> = [];
    const metadata = parsedDoc.metadata || {};
    const mdHeadings = Array.isArray(metadata.headings)
      ? (metadata.headings as Array<{ text: string; level: number }>)
      : [];
    if (mdHeadings.length > 0) {
      for (const heading of mdHeadings) {
        const text = typeof heading.text === "string" ? heading.text.trim() : "";
        const level = Number.isFinite(heading.level) ? heading.level : 2;
        if (text.length === 0) continue;
        if (text === parsedDoc.title) continue;
        sections.push({ title: text, level });
      }
    }

    const rstSections = Array.isArray(metadata.sections)
      ? (metadata.sections as Array<{ title: string; level: number }>)
      : [];
    if (rstSections.length > 0 && sections.length === 0) {
      for (const section of rstSections) {
        const text = typeof section.title === "string" ? section.title.trim() : "";
        if (text.length === 0) continue;
        sections.push({ title: text, level: section.level || 2 });
      }
    }

    const descriptors: Array<{ title: string; anchor: string; level: number; summary?: string }> = [];
    if (sections.length === 0) {
      return descriptors;
    }

    const content = parsedDoc.content || "";
    const lines = content.split(/\r?\n/);

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const anchor = this.slugifySectionTitle(section.title) || `_section_${i + 1}`;
      const summary = this.extractSectionSummary(section.title, section.level, lines);
      descriptors.push({
        title: section.title,
        anchor,
        level: section.level || 2,
        summary,
      });
    }

    return descriptors;
  }

  private slugifySectionTitle(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\-_/\s]+/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-/g, "")
      .replace(/-$/g, "")
      .slice(0, 128);
  }

  private extractSectionSummary(
    title: string,
    level: number,
    lines: string[]
  ): string | undefined {
    const escapeRegExp = (value: string) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const headingPatterns = [
      new RegExp(`^#{1,${Math.max(level, 1)}}\\s*${escapeRegExp(title)}\\s*$`, "i"),
      new RegExp(`^${escapeRegExp(title)}\s*$`, "i"),
    ];

    let startIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (headingPatterns.some((pattern) => pattern.test(line.trim()))) {
        startIndex = i + 1;
        break;
      }
    }

    if (startIndex === -1 || startIndex >= lines.length) {
      return undefined;
    }

    const snippet: string[] = [];
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      if (/^#{1,6}\s+/.test(line)) break; // next markdown heading
      if (/^\s*$/.test(line)) {
        if (snippet.length > 0) break;
        continue;
      }
      snippet.push(line.trim());
      if (snippet.join(" ").length > 220) break;
    }

    const summary = snippet.join(" ");
    if (!summary) return undefined;
    return summary.length > 240 ? `${summary.slice(0, 237)}...` : summary;
  }

  private async applyFreshnessUpdates(
    processedDocs: Array<{ id: string; lastIndexed: Date }>
  ): Promise<{ refreshed: number; stale: number }> {
    let refreshed = 0;
    const docIds: string[] = [];
    for (const doc of processedDocs) {
      docIds.push(doc.id);
      try {
        refreshed += await this.kgService.updateDocumentationFreshness(doc.id, {
          lastValidated: doc.lastIndexed,
          documentationQuality: "complete",
          updatedFromDocAt: doc.lastIndexed,
        });
      } catch (error) {
        console.warn(
          `Failed to refresh documentation freshness for ${doc.id}:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    const cutoffMs = this.getFreshnessWindowDays() * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - cutoffMs);
    let stale = 0;
    try {
      stale = await this.kgService.markDocumentationAsStale(cutoffDate, docIds);
    } catch (error) {
      console.warn(
        "Failed to mark stale documentation relationships:",
        error instanceof Error ? error.message : error
      );
    }

    return { refreshed, stale };
  }
}

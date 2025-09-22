/**
 * Documentation Parser Service
 * Handles parsing, indexing, and synchronization of documentation files
 */
import { KnowledgeGraphService } from "./knowledge/KnowledgeGraphService.js";
import { DatabaseService } from "./core/DatabaseService.js";
import { DocumentationNode, BusinessDomain } from "../../models/entities.js";
import { DocumentationIntelligenceProvider } from "./DocumentationIntelligenceProvider.js";
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
export declare class DocumentationParser {
    private kgService;
    private dbService;
    private supportedExtensions;
    private intelligenceProvider;
    constructor(kgService: KnowledgeGraphService, dbService: DatabaseService, intelligenceProvider?: DocumentationIntelligenceProvider);
    private inferDocIntent;
    private inferDocLocale;
    private normalizeDomainPath;
    /**
     * Parse a documentation file and extract structured information
     */
    parseFile(filePath: string): Promise<ParsedDocument>;
    /**
     * Parse markdown content using marked library
     */
    parseMarkdown(content: string, filePath?: string): Promise<ParsedDocument>;
    /**
     * Parse plaintext content
     */
    private parsePlaintext;
    /**
     * Parse reStructuredText content (basic implementation)
     */
    private parseRestructuredText;
    /**
     * Parse AsciiDoc content (basic implementation)
     */
    private parseAsciiDoc;
    /**
     * Extract title from markdown tokens
     */
    private extractTitle;
    /**
     * Infer document type based on content and title
     */
    private inferDocType;
    /**
     * Extract headings from markdown tokens
     */
    private extractHeadings;
    /**
     * Extract links from markdown tokens
     */
    private extractLinks;
    private extractLinksFromContent;
    /**
     * Extract code blocks from markdown tokens
     */
    private extractCodeBlocks;
    /**
     * Extract title from RST content
     */
    private extractRstTitle;
    /**
     * Extract sections from RST content
     */
    private extractRstSections;
    /**
     * Extract title from AsciiDoc content
     */
    private extractAsciiDocTitle;
    /**
     * Calculate simple checksum for content
     */
    private calculateChecksum;
    /**
     * Sync documentation files with the knowledge graph
     */
    syncDocumentation(docsPath: string): Promise<SyncResult>;
    /**
     * Find all documentation files in a directory
     */
    private findDocumentationFiles;
    /**
     * Create or update documentation node in knowledge graph
     */
    private createOrUpdateDocumentationNode;
    /**
     * Extract and create business domains
     */
    private extractAndCreateDomains;
    /**
     * Infer domain criticality based on name patterns
     */
    private inferDomainCriticality;
    /**
     * Update semantic clusters based on parsed documentation
     */
    private updateSemanticClusters;
    /**
     * Refresh and update all clusters
     */
    private refreshClusters;
    /**
     * Search documentation content
     */
    searchDocumentation(query: string, options?: {
        domain?: string;
        docType?: DocumentationNode["docType"];
        limit?: number;
    }): Promise<SearchResult[]>;
    /**
     * Calculate relevance score for search query
     */
    private calculateRelevanceScore;
    /**
     * Find matched sections in content
     */
    private findMatchedSections;
    private getFreshnessWindowDays;
    private linkDocumentSections;
    private extractSectionDescriptors;
    private slugifySectionTitle;
    private extractSectionSummary;
    private applyFreshnessUpdates;
}
//# sourceMappingURL=DocumentationParser.d.ts.map
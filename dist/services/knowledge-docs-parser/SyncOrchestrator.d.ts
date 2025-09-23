/**
 * Sync Orchestrator
 * Handles synchronization of documentation files with the knowledge graph
 */
import { KnowledgeGraphService } from "../KnowledgeGraphService.js";
import { DatabaseService } from "../../core/DatabaseService.js";
import { IntentExtractor } from "./IntentExtractor.js";
import { DocumentationNode } from "../../../models/entities.js";
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
export declare class SyncOrchestrator {
    private kgService;
    private dbService;
    private tokenizer;
    private intentExtractor;
    private supportedExtensions;
    constructor(kgService: KnowledgeGraphService, dbService: DatabaseService, intentExtractor: IntentExtractor);
    /**
     * Sync documentation directory with knowledge graph
     */
    syncDocumentation(docsPath: string): Promise<SyncResult>;
    /**
     * Process a single documentation file
     */
    private processFile;
    /**
     * Create or update documentation entity in graph
     */
    private createOrUpdateDocumentationEntity;
    /**
     * Create or update business domain entity
     */
    private createOrUpdateDomainEntity;
    /**
     * Create semantic clusters for the document
     */
    private createSemanticClusters;
    /**
     * Search documentation with relevance scoring
     */
    searchDocumentation(query: string, options?: {
        limit?: number;
        minScore?: number;
        domain?: string;
    }): Promise<SearchResult[]>;
    /**
     * Discover all documentation files in a directory
     */
    private discoverFiles;
    /**
     * Update freshness tracking for documents
     */
    private updateFreshnessTracking;
    /**
     * Clean up stale relationships
     */
    private cleanupStaleRelationships;
    /**
     * Extract semantic clusters from document
     */
    private extractSemanticClusters;
    /**
     * Calculate relevance score for search results
     */
    private calculateRelevanceScore;
    /**
     * Find sections in content that match the query
     */
    private findMatchedSections;
    /**
     * Get freshness window in days
     */
    private getFreshnessWindowDays;
    /**
     * Normalize domain path
     */
    private normalizeDomainPath;
}
//# sourceMappingURL=SyncOrchestrator.d.ts.map
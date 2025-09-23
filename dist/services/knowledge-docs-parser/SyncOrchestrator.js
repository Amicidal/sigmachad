/**
 * Sync Orchestrator
 * Handles synchronization of documentation files with the knowledge graph
 */
import { readdirSync, statSync } from "fs";
import { join, extname } from "path";
import { DocTokenizer } from "./DocTokenizer.js";
import { RelationshipType, } from "../../../models/relationships.js";
export class SyncOrchestrator {
    constructor(kgService, dbService, intentExtractor) {
        this.kgService = kgService;
        this.dbService = dbService;
        this.supportedExtensions = [".md", ".txt", ".rst", ".adoc"];
        this.tokenizer = new DocTokenizer();
        this.intentExtractor = intentExtractor;
    }
    /**
     * Sync documentation directory with knowledge graph
     */
    async syncDocumentation(docsPath) {
        const result = {
            processedFiles: 0,
            newDomains: 0,
            updatedClusters: 0,
            errors: [],
        };
        try {
            const files = this.discoverFiles(docsPath);
            result.processedFiles = files.length;
            for (const filePath of files) {
                try {
                    await this.processFile(filePath);
                }
                catch (error) {
                    const errorMsg = `Failed to process ${filePath}: ${error instanceof Error ? error.message : "Unknown error"}`;
                    result.errors.push(errorMsg);
                    console.error(errorMsg);
                }
            }
            // Update freshness tracking
            await this.updateFreshnessTracking(docsPath);
            // Clean up stale relationships
            const cleanupResult = await this.cleanupStaleRelationships();
            result.staleRelationships = cleanupResult.removed;
            console.log(`Documentation sync completed: ${result.processedFiles} files processed`);
        }
        catch (error) {
            const errorMsg = `Documentation sync failed: ${error instanceof Error ? error.message : "Unknown error"}`;
            result.errors.push(errorMsg);
            console.error(errorMsg);
        }
        return result;
    }
    /**
     * Process a single documentation file
     */
    async processFile(filePath) {
        // Parse the file
        const parsedDoc = await this.tokenizer.parseFile(filePath);
        // Read content for intent extraction
        const content = parsedDoc.content;
        // Enhance with intent extraction
        const enhancedDoc = await this.intentExtractor.enhanceDocument(parsedDoc, content);
        // Create or update documentation entity
        await this.createOrUpdateDocumentationEntity(enhancedDoc);
        // Create business domain entities
        for (const domainName of enhancedDoc.businessDomains) {
            await this.createOrUpdateDomainEntity(domainName, enhancedDoc, content);
        }
        // Create semantic clusters
        await this.createSemanticClusters(enhancedDoc);
    }
    /**
     * Create or update documentation entity in graph
     */
    async createOrUpdateDocumentationEntity(document) {
        var _a;
        const docEntity = {
            id: `doc_${document.docHash}`,
            name: document.title,
            type: "documentation",
            path: ((_a = document.metadata) === null || _a === void 0 ? void 0 : _a.filePath) || "",
            content: document.content,
            docType: document.docType,
            docIntent: document.docIntent,
            docVersion: document.docVersion,
            docHash: document.docHash,
            docSource: document.docSource,
            docLocale: document.docLocale,
            lastModified: document.lastIndexed,
            created: document.lastIndexed,
            metadata: {
                ...document.metadata,
                businessDomains: document.businessDomains,
                stakeholders: document.stakeholders,
                technologies: document.technologies,
            },
        };
        await this.kgService.createOrUpdateEntity(docEntity);
    }
    /**
     * Create or update business domain entity
     */
    async createOrUpdateDomainEntity(domainName, document, content) {
        var _a;
        const domainPath = this.normalizeDomainPath(domainName);
        const domainEntity = {
            id: `domain_${domainPath}`,
            name: domainName,
            type: "business-domain",
            path: domainPath,
            description: `Business domain: ${domainName}`,
            criticality: this.intentExtractor.inferDomainCriticality(domainName, content),
            stakeholders: document.stakeholders,
            keyProcesses: [], // Would be extracted from content
            lastModified: new Date(),
            created: new Date(),
            metadata: {
                sourceDocument: (_a = document.metadata) === null || _a === void 0 ? void 0 : _a.filePath,
                extractedFrom: document.docHash,
            },
        };
        await this.kgService.createOrUpdateEntity(domainEntity);
        // Create relationship between document and domain
        const docEntityId = `doc_${document.docHash}`;
        await this.kgService.createRelationship({
            id: `rel_doc_domain_${document.docHash}_${domainPath}`,
            fromEntityId: docEntityId,
            toEntityId: domainEntity.id,
            type: RelationshipType.DOCUMENTS,
            properties: {
                confidence: 0.8,
                source: "parser",
                lastSeen: new Date(),
            },
        });
    }
    /**
     * Create semantic clusters for the document
     */
    async createSemanticClusters(document) {
        var _a;
        // Group related concepts into clusters
        const clusters = this.extractSemanticClusters(document);
        for (const cluster of clusters) {
            const clusterEntity = {
                id: `cluster_${document.docHash}_${cluster.name
                    .toLowerCase()
                    .replace(/\s+/g, "_")}`,
                name: cluster.name,
                type: "semantic-cluster",
                description: cluster.description,
                concepts: cluster.concepts,
                confidence: cluster.confidence,
                lastModified: new Date(),
                created: new Date(),
                metadata: {
                    sourceDocument: (_a = document.metadata) === null || _a === void 0 ? void 0 : _a.filePath,
                    documentHash: document.docHash,
                },
            };
            await this.kgService.createOrUpdateEntity(clusterEntity);
            // Link cluster to document
            await this.kgService.createRelationship({
                id: `rel_doc_cluster_${document.docHash}_${clusterEntity.id}`,
                fromEntityId: `doc_${document.docHash}`,
                toEntityId: clusterEntity.id,
                type: RelationshipType.CONTAINS,
                properties: {
                    confidence: cluster.confidence,
                    source: "parser",
                    lastSeen: new Date(),
                },
            });
        }
    }
    /**
     * Search documentation with relevance scoring
     */
    async searchDocumentation(query, options) {
        const limit = (options === null || options === void 0 ? void 0 : options.limit) || 10;
        const minScore = (options === null || options === void 0 ? void 0 : options.minScore) || 0.1;
        // First, find documents matching the query
        const documents = await this.kgService.searchEntities({
            query,
            types: ["documentation"],
            limit: limit * 2, // Get more candidates for scoring
        });
        const results = [];
        for (const result of documents) {
            const document = result.entity;
            const relevanceScore = this.calculateRelevanceScore(query, document);
            const matchedSections = this.findMatchedSections(query, document.content);
            if (relevanceScore >= minScore) {
                results.push({
                    document,
                    relevanceScore,
                    matchedSections,
                });
            }
        }
        // Sort by relevance and limit
        return results
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, limit);
    }
    /**
     * Discover all documentation files in a directory
     */
    discoverFiles(docsPath) {
        const files = [];
        const walkDirectory = (dirPath) => {
            try {
                const entries = readdirSync(dirPath);
                for (const entry of entries) {
                    const fullPath = join(dirPath, entry);
                    const stat = statSync(fullPath);
                    if (stat.isDirectory()) {
                        // Skip common non-doc directories
                        if (!["node_modules", ".git", "dist", "build"].includes(entry)) {
                            walkDirectory(fullPath);
                        }
                    }
                    else if (stat.isFile()) {
                        const ext = extname(entry).toLowerCase();
                        if (this.supportedExtensions.includes(ext)) {
                            files.push(fullPath);
                        }
                    }
                }
            }
            catch (error) {
                console.warn(`Failed to read directory ${dirPath}:`, error);
            }
        };
        walkDirectory(docsPath);
        return files;
    }
    /**
     * Update freshness tracking for documents
     */
    async updateFreshnessTracking(docsPath) {
        const freshnessWindow = this.getFreshnessWindowDays();
        // Mark relationships as potentially stale if not seen recently
        await this.kgService.markInactiveEdgesNotSeenSince(new Date(Date.now() - freshnessWindow * 24 * 60 * 60 * 1000));
    }
    /**
     * Clean up stale relationships
     */
    async cleanupStaleRelationships() {
        // Implementation would remove relationships that haven't been seen
        // in the freshness window. For now, return a placeholder.
        return { removed: 0 };
    }
    /**
     * Extract semantic clusters from document
     */
    extractSemanticClusters(document) {
        var _a;
        // Simplified implementation - would use NLP/ML in production
        const clusters = [];
        // Extract concepts from headings and content
        const headings = ((_a = document.metadata) === null || _a === void 0 ? void 0 : _a.headings) || [];
        const concepts = headings.map((h) => h.text).slice(0, 5); // Top 5 headings as concepts
        if (concepts.length > 0) {
            clusters.push({
                name: `${document.title} Concepts`,
                description: `Key concepts extracted from ${document.title}`,
                concepts,
                confidence: 0.7,
            });
        }
        return clusters;
    }
    /**
     * Calculate relevance score for search results
     */
    calculateRelevanceScore(query, document) {
        const queryLower = query.toLowerCase();
        const titleLower = document.name.toLowerCase();
        const contentLower = document.content.toLowerCase();
        let score = 0;
        // Title matches are highly relevant
        if (titleLower.includes(queryLower)) {
            score += 0.4;
        }
        // Content matches
        const contentMatches = (contentLower.match(new RegExp(queryLower, "g")) || []).length;
        score += Math.min(contentMatches * 0.1, 0.4);
        // Exact phrase matches
        if (contentLower.includes(` ${queryLower} `) ||
            contentLower.startsWith(queryLower)) {
            score += 0.2;
        }
        return Math.min(score, 1.0);
    }
    /**
     * Find sections in content that match the query
     */
    findMatchedSections(query, content) {
        const lines = content.split("\n");
        const matchedSections = [];
        const queryLower = query.toLowerCase();
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.toLowerCase().includes(queryLower)) {
                // Find the section header for this line
                let sectionHeader = "";
                for (let j = i; j >= 0 && j > i - 10; j--) {
                    if (lines[j].match(/^#{1,6}\s/) || lines[j].match(/^=+\s*$/)) {
                        sectionHeader = lines[j]
                            .replace(/^#{1,6}\s*/, "")
                            .replace(/^=+\s*$/, "");
                        break;
                    }
                }
                if (sectionHeader && !matchedSections.includes(sectionHeader)) {
                    matchedSections.push(sectionHeader);
                }
            }
        }
        return matchedSections.slice(0, 5); // Limit to top 5 sections
    }
    /**
     * Get freshness window in days
     */
    getFreshnessWindowDays() {
        return parseInt(process.env.DOC_FRESHNESS_WINDOW_DAYS || "30");
    }
    /**
     * Normalize domain path
     */
    normalizeDomainPath(domainName) {
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
}
//# sourceMappingURL=SyncOrchestrator.js.map
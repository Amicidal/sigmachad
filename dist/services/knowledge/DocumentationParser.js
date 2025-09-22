/**
 * Documentation Parser Service
 * Handles parsing, indexing, and synchronization of documentation files
 */
import { marked } from "marked";
import { readFileSync } from "fs";
import { join, extname, basename } from "path";
import { RelationshipType, } from "../models/relationships.js";
import { HeuristicDocumentationIntelligenceProvider, } from "./DocumentationIntelligenceProvider.js";
export class DocumentationParser {
    constructor(kgService, dbService, intelligenceProvider) {
        this.supportedExtensions = [".md", ".txt", ".rst", ".adoc"];
        this.kgService = kgService;
        this.dbService = dbService;
        this.intelligenceProvider =
            intelligenceProvider !== null && intelligenceProvider !== void 0 ? intelligenceProvider : new HeuristicDocumentationIntelligenceProvider();
    }
    inferDocIntent(filePath, docType) {
        const normalizedPath = filePath.toLowerCase();
        if (normalizedPath.includes("/adr") ||
            normalizedPath.includes("adr-") ||
            normalizedPath.includes("/architecture") ||
            normalizedPath.includes("/decisions") ||
            docType === "architecture") {
            return "governance";
        }
        if (docType === "design-doc" || docType === "user-guide") {
            return "mixed";
        }
        return "ai-context";
    }
    inferDocLocale(filePath, metadata) {
        const localeMatch = filePath
            .toLowerCase()
            .match(/\.([a-z]{2}(?:-[a-z0-9]+)?)\.(md|txt|rst|adoc)$/);
        if (localeMatch) {
            return localeMatch[1];
        }
        if (typeof (metadata === null || metadata === void 0 ? void 0 : metadata.language) === "string" && metadata.language.length > 0) {
            return metadata.language;
        }
        return "en";
    }
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
    /**
     * Parse a documentation file and extract structured information
     */
    async parseFile(filePath) {
        try {
            const content = readFileSync(filePath, "utf-8");
            const extension = extname(filePath).toLowerCase();
            let parsedContent;
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
            const inferredIntent = providerIntent !== null && providerIntent !== void 0 ? providerIntent : this.inferDocIntent(filePath, parsedContent.docType);
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
        }
        catch (error) {
            throw new Error(`Failed to parse file ${filePath}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Parse markdown content using marked library
     */
    async parseMarkdown(content, filePath) {
        var _a, _b, _c, _d, _e;
        const tokens = marked.lexer(content);
        const title = this.extractTitle(tokens);
        const docType = this.inferDocType(content, title);
        // Compute headings and conditionally remove the first H1 used as title
        const allHeadings = this.extractHeadings(tokens);
        let headings = allHeadings;
        const h1Count = allHeadings.filter((h) => h.level === 1).length;
        const idxFirstH1 = allHeadings.findIndex((h) => h.level === 1 && h.text === title);
        if (idxFirstH1 !== -1 &&
            h1Count === 1 &&
            allHeadings.length > 1 &&
            allHeadings.length <= 5) {
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
            businessDomains: (_a = signals.businessDomains) !== null && _a !== void 0 ? _a : [],
            stakeholders: (_b = signals.stakeholders) !== null && _b !== void 0 ? _b : [],
            technologies: (_c = signals.technologies) !== null && _c !== void 0 ? _c : [],
            docType,
            docIntent: (_d = signals.docIntent) !== null && _d !== void 0 ? _d : "ai-context",
            docVersion: "",
            docHash: "",
            docSource: (_e = signals.docSource) !== null && _e !== void 0 ? _e : "parser",
            docLocale: signals.docLocale,
            lastIndexed: new Date(),
            metadata: markdownMetadata,
        };
    }
    /**
     * Parse plaintext content
     */
    async parsePlaintext(content, filePath) {
        var _a, _b, _c, _d, _e, _f;
        const lines = content.split("\n");
        const title = ((_a = lines[0]) === null || _a === void 0 ? void 0 : _a.trim()) || "Untitled Document";
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
            businessDomains: (_b = signals.businessDomains) !== null && _b !== void 0 ? _b : [],
            stakeholders: (_c = signals.stakeholders) !== null && _c !== void 0 ? _c : [],
            technologies: (_d = signals.technologies) !== null && _d !== void 0 ? _d : [],
            docType,
            docIntent: (_e = signals.docIntent) !== null && _e !== void 0 ? _e : "ai-context",
            docVersion: "",
            docHash: "",
            docSource: (_f = signals.docSource) !== null && _f !== void 0 ? _f : "parser",
            docLocale: signals.docLocale,
            lastIndexed: new Date(),
            metadata: baseMetadata,
        };
    }
    /**
     * Parse reStructuredText content (basic implementation)
     */
    async parseRestructuredText(content, filePath) {
        var _a, _b, _c, _d, _e;
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
            businessDomains: (_a = signals.businessDomains) !== null && _a !== void 0 ? _a : [],
            stakeholders: (_b = signals.stakeholders) !== null && _b !== void 0 ? _b : [],
            technologies: (_c = signals.technologies) !== null && _c !== void 0 ? _c : [],
            docType,
            docIntent: (_d = signals.docIntent) !== null && _d !== void 0 ? _d : "ai-context",
            docVersion: "",
            docHash: "",
            docSource: (_e = signals.docSource) !== null && _e !== void 0 ? _e : "parser",
            docLocale: signals.docLocale,
            lastIndexed: new Date(),
            metadata: rstMetadata,
        };
    }
    /**
     * Parse AsciiDoc content (basic implementation)
     */
    async parseAsciiDoc(content, filePath) {
        var _a, _b, _c, _d, _e;
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
            businessDomains: (_a = signals.businessDomains) !== null && _a !== void 0 ? _a : [],
            stakeholders: (_b = signals.stakeholders) !== null && _b !== void 0 ? _b : [],
            technologies: (_c = signals.technologies) !== null && _c !== void 0 ? _c : [],
            docType,
            docIntent: (_d = signals.docIntent) !== null && _d !== void 0 ? _d : "ai-context",
            docVersion: "",
            docHash: "",
            docSource: (_e = signals.docSource) !== null && _e !== void 0 ? _e : "parser",
            docLocale: signals.docLocale,
            lastIndexed: new Date(),
            metadata: adocMetadata,
        };
    }
    /**
     * Extract title from markdown tokens
     */
    extractTitle(tokens) {
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
    inferDocType(content, title) {
        const lowerContent = content.toLowerCase();
        const lowerTitle = title.toLowerCase();
        // Prioritize architecture detection when title indicates it
        if (lowerTitle.includes("architecture") ||
            lowerContent.includes("system architecture") ||
            lowerContent.includes("technical architecture")) {
            return "architecture";
        }
        // Check for API documentation
        if (lowerTitle.includes("api") ||
            lowerContent.includes("endpoint") ||
            lowerContent.includes("swagger") ||
            lowerContent.includes("rest")) {
            return "api-docs";
        }
        // Check for design documents
        if (lowerTitle.includes("design") ||
            lowerContent.includes("system design") ||
            lowerContent.includes("design document")) {
            return "design-doc";
        }
        // Check for user guides and manuals - broader detection
        if (lowerTitle.includes("guide") ||
            lowerTitle.includes("manual") ||
            lowerTitle.includes("getting started") ||
            lowerTitle.includes("tutorial") ||
            lowerTitle.includes("user") ||
            lowerContent.includes("how to") ||
            lowerContent.includes("step by step") ||
            lowerContent.includes("instructions") ||
            lowerContent.includes("getting started") ||
            lowerContent.includes("introduction")) {
            return "user-guide";
        }
        // Check for README files
        if (lowerTitle.includes("readme") || lowerTitle.includes("read me")) {
            return "readme";
        }
        // Check for high-level overview content
        if (lowerContent.includes("high level") ||
            lowerContent.includes("overview")) {
            return "architecture";
        }
        return "readme"; // Default fallback
    }
    /**
     * Extract headings from markdown tokens
     */
    extractHeadings(tokens) {
        return tokens
            .filter((token) => token.type === "heading")
            .map((heading) => ({
            level: heading.depth,
            text: heading.text,
        }));
    }
    /**
     * Extract links from markdown tokens
     */
    extractLinks(tokens) {
        // Kept for backward compatibility; now superseded by extractLinksFromContent
        const links = [];
        const extractFromToken = (token) => {
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
    extractLinksFromContent(content, tokens) {
        const found = new Set();
        // 1) Standard markdown links: [text](url)
        const mdLinkRe = /\[[^\]]+\]\(([^)\s]+)\)/g;
        let match;
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
    extractCodeBlocks(tokens) {
        return tokens
            .filter((token) => token.type === "code")
            .map((codeBlock) => {
            var _a;
            return ({
                lang: ((_a = codeBlock.lang) !== null && _a !== void 0 ? _a : ""),
                code: codeBlock.text,
            });
        });
    }
    /**
     * Extract title from RST content
     */
    extractRstTitle(lines) {
        var _a, _b;
        for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            const nextLine = (_a = lines[i + 1]) === null || _a === void 0 ? void 0 : _a.trim();
            if (line &&
                nextLine &&
                /^[=]+$/.test(nextLine) &&
                nextLine.length >= line.length) {
                return line;
            }
        }
        return ((_b = lines[0]) === null || _b === void 0 ? void 0 : _b.trim()) || "Untitled Document";
    }
    /**
     * Extract sections from RST content
     */
    extractRstSections(lines) {
        var _a;
        const sections = [];
        for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            const nextLine = (_a = lines[i + 1]) === null || _a === void 0 ? void 0 : _a.trim();
            if (line && nextLine) {
                if (/^[=]+$/.test(nextLine)) {
                    sections.push({ title: line, level: 1 });
                }
                else if (/^[-]+$/.test(nextLine)) {
                    sections.push({ title: line, level: 2 });
                }
                else if (/^[~]+$/.test(nextLine)) {
                    sections.push({ title: line, level: 3 });
                }
            }
        }
        return sections;
    }
    /**
     * Extract title from AsciiDoc content
     */
    extractAsciiDocTitle(lines) {
        var _a;
        for (const line of lines) {
            if (line.startsWith("= ")) {
                return line.substring(2).trim();
            }
        }
        return ((_a = lines[0]) === null || _a === void 0 ? void 0 : _a.trim()) || "Untitled Document";
    }
    /**
     * Calculate simple checksum for content
     */
    calculateChecksum(content) {
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
    async syncDocumentation(docsPath) {
        const result = {
            processedFiles: 0,
            newDomains: 0,
            updatedClusters: 0,
            errors: [],
            sectionsLinked: 0,
        };
        const processedDocs = [];
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
                    linkedSectionsTotal += await this.linkDocumentSections(docId, parsedDoc);
                    processedDocs.push({ id: docId, lastIndexed: parsedDoc.lastIndexed });
                    result.processedFiles++;
                }
                catch (error) {
                    result.errors.push(`${filePath}: ${error instanceof Error ? error.message : "Unknown error"}`);
                }
            }
            try {
                const freshness = await this.applyFreshnessUpdates(processedDocs);
                result.refreshedRelationships = freshness.refreshed;
                result.staleRelationships = freshness.stale;
            }
            catch (freshnessError) {
                result.errors.push(`Freshness update failed: ${freshnessError instanceof Error
                    ? freshnessError.message
                    : "Unknown error"}`);
            }
            result.updatedClusters = await this.refreshClusters();
            result.sectionsLinked = linkedSectionsTotal;
        }
        catch (error) {
            result.errors.push(`Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
        return result;
    }
    /**
     * Find all documentation files in a directory
     */
    async findDocumentationFiles(docsPath) {
        const fs = await import("fs/promises");
        const files = [];
        const processDirectory = async (dirPath) => {
            try {
                const names = await fs.readdir(dirPath);
                for (const name of names) {
                    const fullPath = join(dirPath, name);
                    let stat;
                    try {
                        stat = await fs.stat(fullPath);
                    }
                    catch (e) {
                        continue;
                    }
                    if (stat &&
                        typeof stat.isDirectory === "function" &&
                        stat.isDirectory()) {
                        // Skip node_modules and hidden directories
                        if (!name.startsWith(".") &&
                            name !== "node_modules" &&
                            name !== "dist") {
                            await processDirectory(fullPath);
                        }
                    }
                    else if (stat &&
                        typeof stat.isFile === "function" &&
                        stat.isFile()) {
                        const ext = extname(name).toLowerCase();
                        if (this.supportedExtensions.includes(ext)) {
                            files.push(fullPath);
                        }
                    }
                }
            }
            catch (error) {
                console.error(`Error reading directory ${dirPath}:`, error);
            }
        };
        await processDirectory(docsPath);
        return files;
    }
    /**
     * Create or update documentation node in knowledge graph
     */
    async createOrUpdateDocumentationNode(filePath, parsedDoc) {
        const docId = `doc_${basename(filePath, extname(filePath))}_${this.calculateChecksum(parsedDoc.content).substring(0, 8)}`;
        const docNode = {
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
    async extractAndCreateDomains(parsedDoc, docId) {
        var _a, _b;
        let newDomainsCount = 0;
        for (const domainName of parsedDoc.businessDomains) {
            const domainId = `domain_${domainName
                .replace(/\s+/g, "_")
                .toLowerCase()}`;
            // Check if domain already exists
            const existingDomain = await this.kgService.getEntity(domainId);
            const domain = {
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
            const taxonomyVersion = typeof ((_a = parsedDoc.metadata) === null || _a === void 0 ? void 0 : _a.taxonomyVersion) === "string"
                ? parsedDoc.metadata.taxonomyVersion
                : "v1";
            const updatedFromDocAt = ((_b = parsedDoc.metadata) === null || _b === void 0 ? void 0 : _b.lastModified) instanceof Date
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
                });
            }
            catch (_c) {
                // Non-fatal
            }
        }
        return newDomainsCount;
    }
    /**
     * Infer domain criticality based on name patterns
     */
    inferDomainCriticality(domainName) {
        const lowerName = domainName.toLowerCase();
        if (lowerName.includes("authentication") ||
            lowerName.includes("security") ||
            lowerName.includes("payment")) {
            return "core";
        }
        if (lowerName.includes("user management") ||
            lowerName.includes("reporting") ||
            lowerName.includes("communication")) {
            return "supporting";
        }
        return "utility";
    }
    /**
     * Update semantic clusters based on parsed documentation
     */
    async updateSemanticClusters(parsedDoc, docId) {
        // This is a simplified implementation
        // In a real scenario, this would analyze the content and group related entities
        for (const domain of parsedDoc.businessDomains) {
            const clusterId = `cluster_${domain.replace(/\s+/g, "_").toLowerCase()}`;
            const cluster = {
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
                });
            }
            catch (_a) { }
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
                });
            }
            catch (_b) { }
        }
    }
    /**
     * Refresh and update all clusters
     */
    async refreshClusters() {
        // Simplified implementation - would analyze all entities and rebuild clusters
        return 0;
    }
    /**
     * Search documentation content
     */
    async searchDocumentation(query, options = {}) {
        const results = [];
        // This is a simplified search implementation
        // In a real scenario, this would use vector search or full-text search
        // Get all documentation nodes
        const docs = await this.kgService.findEntitiesByType("documentation");
        for (const doc of docs) {
            const documentationNode = doc;
            // Filter by options
            if (options.domain &&
                (!documentationNode.businessDomains ||
                    !documentationNode.businessDomains.some((d) => d.toLowerCase().includes(options.domain.toLowerCase())))) {
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
                    matchedSections: this.findMatchedSections(query, documentationNode.content),
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
    calculateRelevanceScore(query, doc) {
        const lowerQuery = query.toLowerCase();
        const lowerContent = doc.content.toLowerCase();
        const lowerTitle = doc.title.toLowerCase();
        let score = 0;
        // Title matches are most important
        if (lowerTitle.includes(lowerQuery)) {
            score += 10;
        }
        // Content matches
        const contentMatches = (lowerContent.match(new RegExp(lowerQuery, "g")) || []).length;
        score += contentMatches * 2;
        // Business domain matches
        if (doc.businessDomains && doc.businessDomains.length > 0) {
            const domainMatches = doc.businessDomains.filter((d) => d.toLowerCase().includes(lowerQuery)).length;
            score += domainMatches * 5;
        }
        // Technology matches
        if (doc.technologies && doc.technologies.length > 0) {
            const techMatches = doc.technologies.filter((t) => t.toLowerCase().includes(lowerQuery)).length;
            score += techMatches * 3;
        }
        return score;
    }
    /**
     * Find matched sections in content
     */
    findMatchedSections(query, content) {
        const sections = [];
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
    getFreshnessWindowDays() {
        const raw = process.env.DOC_FRESHNESS_MAX_AGE_DAYS;
        const parsed = raw ? Number.parseInt(raw, 10) : NaN;
        if (Number.isFinite(parsed) && parsed > 0) {
            return parsed;
        }
        return 14;
    }
    async linkDocumentSections(docId, parsedDoc) {
        const sections = this.extractSectionDescriptors(parsedDoc);
        if (sections.length === 0)
            return 0;
        let linked = 0;
        for (const section of sections.slice(0, 30)) {
            try {
                await this.kgService.createRelationship({
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
                });
                linked++;
            }
            catch (error) {
                console.warn(`Failed to link documentation section ${section.anchor} for ${docId}:`, error instanceof Error ? error.message : error);
            }
        }
        return linked;
    }
    extractSectionDescriptors(parsedDoc) {
        const sections = [];
        const metadata = parsedDoc.metadata || {};
        const mdHeadings = Array.isArray(metadata.headings)
            ? metadata.headings
            : [];
        if (mdHeadings.length > 0) {
            for (const heading of mdHeadings) {
                const text = typeof heading.text === "string" ? heading.text.trim() : "";
                const level = Number.isFinite(heading.level) ? heading.level : 2;
                if (text.length === 0)
                    continue;
                if (text === parsedDoc.title)
                    continue;
                sections.push({ title: text, level });
            }
        }
        const rstSections = Array.isArray(metadata.sections)
            ? metadata.sections
            : [];
        if (rstSections.length > 0 && sections.length === 0) {
            for (const section of rstSections) {
                const text = typeof section.title === "string" ? section.title.trim() : "";
                if (text.length === 0)
                    continue;
                sections.push({ title: text, level: section.level || 2 });
            }
        }
        const descriptors = [];
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
    slugifySectionTitle(title) {
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
    extractSectionSummary(title, level, lines) {
        const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
        const snippet = [];
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            if (/^#{1,6}\s+/.test(line))
                break; // next markdown heading
            if (/^\s*$/.test(line)) {
                if (snippet.length > 0)
                    break;
                continue;
            }
            snippet.push(line.trim());
            if (snippet.join(" ").length > 220)
                break;
        }
        const summary = snippet.join(" ");
        if (!summary)
            return undefined;
        return summary.length > 240 ? `${summary.slice(0, 237)}...` : summary;
    }
    async applyFreshnessUpdates(processedDocs) {
        let refreshed = 0;
        const docIds = [];
        for (const doc of processedDocs) {
            docIds.push(doc.id);
            try {
                refreshed += await this.kgService.updateDocumentationFreshness(doc.id, {
                    lastValidated: doc.lastIndexed,
                    documentationQuality: "complete",
                    updatedFromDocAt: doc.lastIndexed,
                });
            }
            catch (error) {
                console.warn(`Failed to refresh documentation freshness for ${doc.id}:`, error instanceof Error ? error.message : error);
            }
        }
        const cutoffMs = this.getFreshnessWindowDays() * 24 * 60 * 60 * 1000;
        const cutoffDate = new Date(Date.now() - cutoffMs);
        let stale = 0;
        try {
            stale = await this.kgService.markDocumentationAsStale(cutoffDate, docIds);
        }
        catch (error) {
            console.warn("Failed to mark stale documentation relationships:", error instanceof Error ? error.message : error);
        }
        return { refreshed, stale };
    }
}
//# sourceMappingURL=DocumentationParser.js.map
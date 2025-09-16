/**
 * Documentation Parser Service
 * Handles parsing, indexing, and synchronization of documentation files
 */
import { marked } from "marked";
import { readFileSync } from "fs";
import { join, extname, basename } from "path";
import { RelationshipType, } from "../models/relationships.js";
export class DocumentationParser {
    constructor(kgService, dbService) {
        this.supportedExtensions = [".md", ".txt", ".rst", ".adoc"];
        this.kgService = kgService;
        this.dbService = dbService;
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
                    parsedContent = await this.parseMarkdown(content);
                    break;
                case ".txt":
                    parsedContent = this.parsePlaintext(content);
                    break;
                case ".rst":
                    parsedContent = this.parseRestructuredText(content);
                    break;
                case ".adoc":
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
                checksum: this.calculateChecksum(content),
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
    async parseMarkdown(content) {
        const tokens = marked.lexer(content);
        const title = this.extractTitle(tokens);
        const businessDomains = this.extractBusinessDomains(content);
        const stakeholders = this.extractStakeholders(content);
        const technologies = this.extractTechnologies(content);
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
            // In simple docs (title + a few sections), exclude title from headings
            headings = allHeadings
                .slice(0, idxFirstH1)
                .concat(allHeadings.slice(idxFirstH1 + 1));
        }
        return {
            title,
            content,
            businessDomains,
            stakeholders,
            technologies,
            docType,
            metadata: {
                headings,
                links: this.extractLinksFromContent(content, tokens),
                codeBlocks: this.extractCodeBlocks(tokens),
            },
        };
    }
    /**
     * Parse plaintext content
     */
    parsePlaintext(content) {
        var _a;
        const lines = content.split("\n");
        const title = ((_a = lines[0]) === null || _a === void 0 ? void 0 : _a.trim()) || "Untitled Document";
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
                wordCount: content.split(/\s+/).length,
            },
        };
    }
    /**
     * Parse reStructuredText content (basic implementation)
     */
    parseRestructuredText(content) {
        // Basic RST parsing - could be enhanced with a dedicated library
        const lines = content.split("\n");
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
                sections: this.extractRstSections(lines),
            },
        };
    }
    /**
     * Parse AsciiDoc content (basic implementation)
     */
    parseAsciiDoc(content) {
        // Basic AsciiDoc parsing - could be enhanced with a dedicated library
        const lines = content.split("\n");
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
            metadata: {},
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
     * Extract business domains from content using pattern matching
     */
    extractBusinessDomains(content) {
        const domainPatterns = [
            // User and customer management domains
            /\b(?:user|customer|client)\s+(?:registration|authentication|authorization|management|service|support)\b/gi,
            /\b(?:user|customer|client)\s+(?:account|profile|portal|dashboard)\s+(?:management|service)?\b/gi,
            /\b(?:customer|client)\s+(?:relationship|service|support)\s+(?:management|system)?\b/gi,
            // Authentication and security domains
            /\b(?:authentication|authorization|security|compliance|audit)\s*(?:system|service|module|management)?\b/gi,
            /\b(?:multi.?factor|two.?factor)\s+(?:authentication|auth)\b/gi,
            // Payment and financial domains
            /\b(?:payment|billing|subscription|pricing|financial)\s*(?:processing|system|service|module|management)?\b/gi,
            /\b(?:credit\s+card|bank|paypal|stripe)\s+(?:payment|processing|integration)\b/gi,
            // Inventory and supply chain domains
            /\b(?:inventory|warehouse|supply\s+chain|logistics|shipping)\s*(?:management|system|tracking)?\b/gi,
            // Reporting and analytics domains
            /\b(?:reporting|analytics|dashboard|metrics|business\s+intelligence)\s*(?:system|service|platform)?\b/gi,
            // Communication and messaging domains
            /\b(?:communication|messaging|notification|email|sms)\s*(?:system|service|platform)?\b/gi,
            // Content and document management domains
            /\b(?:content|media|file|document)\s+(?:management|storage|processing|system)\b/gi,
            // Human resources and employee domains
            /\b(?:human\s+resources|employee|hr|payroll|benefits)\s*(?:management|system|service)?\b/gi,
            // Sales and marketing domains
            /\b(?:sales|marketing|campaign|ecommerce)\s*(?:management|system|platform)?\b/gi,
            // Infrastructure and operations domains
            /\b(?:infrastructure|deployment|monitoring|maintenance)\s*(?:management|system)?\b/gi,
            // Data management domains
            /\b(?:data|database|backup|recovery)\s*(?:management|processing|storage|system)?\b/gi,
            // API and integration domains
            /\b(?:api|integration|webhook|middleware)\s*(?:management|service|platform)?\b/gi,
            // Generic management domains
            /\b(?:user|customer|client|patient|student|employee|admin|manager)\s+(?:management|service|portal|dashboard|system)\b/gi,
            // Single word domains (keep these for backwards compatibility)
            /\b(?:authentication|authorization|security|compliance|audit|inventory|warehouse|reporting|analytics|communication|messaging)\b/gi,
        ];
        const domains = new Set();
        for (const pattern of domainPatterns) {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach((match) => {
                    const norm = match.toLowerCase().trim();
                    domains.add(norm);
                    // Extract base terms from compound phrases for better matching
                    const baseMatch = norm.match(/^(payment|billing|subscription|pricing|financial|customer|user|client|authentication|authorization|security)\b/);
                    if (baseMatch) {
                        domains.add(baseMatch[1]);
                    }
                    // Handle specific multi-word combinations that should be preserved
                    if (norm.includes("customer relationship")) {
                        domains.add("customer relationship management");
                    }
                    if (norm.includes("customer service")) {
                        domains.add("customer service management");
                    }
                    if (norm.includes("user registration")) {
                        domains.add("user registration");
                    }
                    if (norm.includes("user management")) {
                        domains.add("user management");
                    }
                    if (norm.includes("payment processing")) {
                        domains.add("payment processing");
                    }
                    if (norm.includes("data processing")) {
                        domains.add("data processing");
                    }
                    if (norm.includes("document management")) {
                        domains.add("document management");
                    }
                });
            }
        }
        // Also look for explicit domain mentions in structured format
        const explicitDomains = content.match(/domain[s]?:?\s*([^.\n]+)/gi);
        if (explicitDomains) {
            explicitDomains.forEach((match) => {
                const domainPart = match.replace(/domain[s]?:?\s*/i, "").trim();
                // Split comma-separated or 'and' separated lists
                const parts = domainPart
                    .split(/,|\band\b/gi)
                    .map((p) => p.trim())
                    .filter((p) => p.length > 0);
                parts.forEach((p) => {
                    const normalized = p.toLowerCase();
                    domains.add(normalized);
                    // Also add variations without "management" suffix for better matching
                    if (normalized.endsWith(" management")) {
                        domains.add(normalized.replace(" management", ""));
                    }
                });
            });
        }
        // Handle Unicode/special characters in domain extraction
        // Look for patterns with accented characters
        const unicodePatterns = [
            /\b(?:naïve|naive)\s+(?:user|customer|client)\s+(?:management|service|system)\b/gi,
            /\b[\wàâäçéèêëïîôùûüÿñáéíóúü]+\s+(?:management|service|system|processing)\b/gi,
        ];
        for (const pattern of unicodePatterns) {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach((match) => {
                    const norm = match.toLowerCase().trim();
                    domains.add(norm);
                    // Also extract base terms for Unicode words
                    const baseMatch = norm.match(/^([\wàâäçéèêëïîôùûüÿñáéíóúü]+)\s+/);
                    if (baseMatch) {
                        domains.add(baseMatch[1]);
                    }
                });
            }
        }
        return Array.from(domains);
    }
    /**
     * Extract stakeholders from content
     */
    extractStakeholders(content) {
        const stakeholderPatterns = [
            // Team roles and positions
            /\b(?:product|project|tech|engineering|development|qa|testing|devops|security)\s+(?:team|manager|lead|director|specialist|engineer|coordinator)\b/gi,
            /\b(?:business|product|system|technical|solution|data)\s+(?:analyst|architect|owner|consultant)\b/gi,
            // User types and roles
            /\b(?:end\s+)?(?:user|customer|client|consumer|subscriber|member|participant|visitor)s?\b/gi,
            /\b(?:admin|administrator|operator|maintainer|supervisor|moderator)s?\b/gi,
            // Organization roles
            /\b(?:partner|vendor|supplier|contractor)s?\b/gi,
            /\b(?:stakeholder|shareholder|investor)s?\b/gi,
            // Individual roles
            /\b(?:developer|programmer|coder|architect|designer)s?\b/gi,
            // Department roles
            /\b(?:sales|marketing|support|customer service|help desk|it|hr)\s+(?:team|manager|representative|specialist|agent)\b/gi,
            // Generic user mentions (more specific patterns first)
            /\busers?\b/gi,
            /\bpeople\b/gi,
            /\bpersonnel\b/gi,
        ];
        const stakeholders = new Set();
        for (const pattern of stakeholderPatterns) {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach((match) => {
                    let s = match.toLowerCase().trim();
                    // Normalize common plurals and variations to singular for consistency
                    s = s
                        .replace(/\bdevelopers\b/g, "developer")
                        .replace(/\busers\b/g, "user")
                        .replace(/\bcustomers\b/g, "customer")
                        .replace(/\bclients\b/g, "client")
                        .replace(/\bpartners\b/g, "partner")
                        .replace(/\bvendors\b/g, "vendor")
                        .replace(/\bstakeholders\b/g, "stakeholder")
                        .replace(/\badministrators\b/g, "administrator")
                        .replace(/\bmanagers\b/g, "manager")
                        .replace(/\bteams\b/g, "team")
                        .replace(/\bengineers\b/g, "engineer")
                        .replace(/\banalysts\b/g, "analyst")
                        .replace(/\barchitects\b/g, "architect")
                        .replace(/\bspecialists\b/g, "specialist")
                        .replace(/\bsupervisors\b/g, "supervisor")
                        .replace(/\bmoderators\b/g, "moderator")
                        .replace(/\boperators\b/g, "operator")
                        .replace(/\bmaintainers\b/g, "maintainer")
                        .replace(/\bcoordinators\b/g, "coordinator")
                        .replace(/\bconsultants\b/g, "consultant")
                        .replace(/\bdesigners\b/g, "designer")
                        .replace(/\bprogrammers\b/g, "programmer")
                        .replace(/\bcoders\b/g, "coder")
                        .replace(/\brepresentatives\b/g, "representative")
                        .replace(/\bagents\b/g, "agent")
                        .replace(/\bowners\b/g, "owner")
                        .replace(/\bleads\b/g, "lead")
                        .replace(/\bdirectors\b/g, "director")
                        .replace(/\bvisitors\b/g, "visitor")
                        .replace(/\bmembers\b/g, "member")
                        .replace(/\bparticipants\b/g, "participant")
                        .replace(/\bsubscribers\b/g, "subscriber")
                        .replace(/\bconsumers\b/g, "consumer")
                        .replace(/\bshareholders\b/g, "shareholder")
                        .replace(/\binvestors\b/g, "investor")
                        .replace(/\bcontractors\b/g, "contractor")
                        .replace(/\bsuppliers\b/g, "supplier")
                        .replace(/\bpeople\b/g, "person")
                        .replace(/\bpersonnel\b/g, "person")
                        .replace(/\bend users\b/g, "end user")
                        .replace(/\bsales teams\b/g, "sales team")
                        .replace(/\bmarketing teams\b/g, "marketing team")
                        .replace(/\bsupport teams\b/g, "support team")
                        .replace(/\bcustomer service teams\b/g, "customer service team")
                        .replace(/\bhelp desk teams\b/g, "help desk team")
                        .replace(/\bit teams\b/g, "it team")
                        .replace(/\bhr teams\b/g, "hr team");
                    // Skip very generic terms that aren't meaningful stakeholders
                    if (s !== "person" &&
                        s !== "people" &&
                        s !== "personnel" &&
                        s.length > 2) {
                        stakeholders.add(s);
                    }
                });
            }
        }
        return Array.from(stakeholders);
    }
    /**
     * Extract technologies from content
     */
    extractTechnologies(content) {
        const techPatterns = [
            /\b(?:javascript|typescript|python|java|go|rust|cpp|c\+\+|c#)\b/gi,
            /\b(?:react|vue|angular|svelte|next\.js|nuxt)\b/gi,
            /\b(?:node\.js|express|fastify|django|flask|spring)\b/gi,
            /\b(?:postgresql|mysql|mongodb|redis|elasticsearch)\b/gi,
            /\b(?:docker|kubernetes|aws|gcp|azure)\b/gi,
            /\b(?:rest|grpc|websocket)\b/gi,
        ];
        const technologies = new Set();
        // Normalize content for certain aliases before matching
        const normalizedContent = content.replace(/\bC\+\+\b/g, "cpp");
        if (/c\+\+/i.test(content)) {
            technologies.add("cpp");
        }
        for (const pattern of techPatterns) {
            const matches = normalizedContent.match(pattern);
            if (matches) {
                matches.forEach((match) => {
                    let m = match.toLowerCase().trim();
                    if (m === "c++")
                        m = "cpp";
                    technologies.add(m);
                });
            }
        }
        return Array.from(technologies);
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
        };
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
                    result.processedFiles++;
                }
                catch (error) {
                    result.errors.push(`${filePath}: ${error instanceof Error ? error.message : "Unknown error"}`);
                }
            }
            result.updatedClusters = await this.refreshClusters();
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
        };
        await this.kgService.createEntity(docNode);
        return docId;
    }
    /**
     * Extract and create business domains
     */
    async extractAndCreateDomains(parsedDoc, docId) {
        let newDomainsCount = 0;
        for (const domainName of parsedDoc.businessDomains) {
            const domainId = `domain_${domainName
                .replace(/\s+/g, "_")
                .toLowerCase()}`;
            // Check if domain already exists
            const existingDomain = await this.kgService.getEntity(domainId);
            if (!existingDomain) {
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
                newDomainsCount++;
            }
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
                    metadata: { inferred: true, confidence: 0.6, source: 'doc-domain-extract' }
                });
            }
            catch (_a) {
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
                    metadata: { inferred: true, confidence: 0.6, source: 'doc-cluster-link' }
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
                    metadata: { inferred: true, confidence: 0.6, source: 'cluster-domain' }
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
}
//# sourceMappingURL=DocumentationParser.js.map
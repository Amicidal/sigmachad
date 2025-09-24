/**
 * Document Tokenizer
 * Handles parsing and tokenization of documentation files
 */
import { marked } from "marked";
import { readFileSync } from "fs";
import { extname } from "path";
import { createHash } from "crypto";
export class DocTokenizer {
    constructor() {
        this.supportedExtensions = [".md", ".txt", ".rst", ".adoc"];
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
            const now = new Date();
            parsedContent.docVersion = checksum;
            parsedContent.docHash = checksum;
            parsedContent.docSource = parsedContent.docSource || "parser";
            parsedContent.lastIndexed = now;
            // Extract additional metadata
            parsedContent.metadata = {
                ...parsedContent.metadata,
                filePath,
                fileSize: content.length,
                lastModified: now,
                checksum,
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
        return {
            title,
            content,
            businessDomains: [],
            stakeholders: [],
            technologies: [],
            docType,
            docIntent: "ai-context", // Will be inferred by IntentExtractor
            docVersion: "",
            docHash: "",
            docSource: "parser",
            lastIndexed: new Date(),
            metadata: markdownMetadata,
        };
    }
    /**
     * Parse plaintext content
     */
    async parsePlaintext(content, filePath) {
        const lines = content.split(/\n/);
        const title = this.extractPlaintextTitle(lines);
        return {
            title,
            content,
            businessDomains: [],
            stakeholders: [],
            technologies: [],
            docType: "other",
            docIntent: "ai-context",
            docVersion: "",
            docHash: "",
            docSource: "parser",
            lastIndexed: new Date(),
            metadata: {
                format: "plaintext",
                wordCount: content.split(/\s+/).filter(Boolean).length,
                lineCount: lines.length,
            },
        };
    }
    /**
     * Parse reStructuredText content
     */
    async parseRestructuredText(content, filePath) {
        const lines = content.split(/\n/);
        const title = this.extractRstTitle(lines);
        const sections = this.extractRstSections(lines);
        return {
            title,
            content,
            businessDomains: [],
            stakeholders: [],
            technologies: [],
            docType: "other",
            docIntent: "ai-context",
            docVersion: "",
            docHash: "",
            docSource: "parser",
            lastIndexed: new Date(),
            metadata: {
                format: "rst",
                sections,
                wordCount: content.split(/\s+/).filter(Boolean).length,
                lineCount: lines.length,
            },
        };
    }
    /**
     * Parse AsciiDoc content
     */
    async parseAsciiDoc(content, filePath) {
        const lines = content.split(/\n/);
        const title = this.extractAsciiDocTitle(lines);
        return {
            title,
            content,
            businessDomains: [],
            stakeholders: [],
            technologies: [],
            docType: "other",
            docIntent: "ai-context",
            docVersion: "",
            docHash: "",
            docSource: "parser",
            lastIndexed: new Date(),
            metadata: {
                format: "asciidoc",
                wordCount: content.split(/\s+/).filter(Boolean).length,
                lineCount: lines.length,
            },
        };
    }
    /**
     * Extract title from markdown tokens
     */
    extractTitle(tokens) {
        const firstH1 = tokens.find((token) => token.type === "heading" && token.depth === 1);
        return (firstH1 === null || firstH1 === void 0 ? void 0 : firstH1.text) || "Untitled Document";
    }
    /**
     * Infer document type from content and title
     */
    inferDocType(content, title) {
        const normalizedContent = content.toLowerCase();
        const normalizedTitle = title.toLowerCase();
        if (normalizedTitle.includes("readme") ||
            normalizedContent.includes("# readme")) {
            return "readme";
        }
        if (normalizedTitle.includes("api") ||
            normalizedContent.includes("endpoint") ||
            normalizedContent.includes("http method")) {
            return "api-doc";
        }
        if (normalizedTitle.includes("architecture") ||
            normalizedContent.includes("system design") ||
            normalizedContent.includes("component diagram")) {
            return "architecture";
        }
        if (normalizedTitle.includes("user guide") ||
            normalizedTitle.includes("tutorial") ||
            normalizedContent.includes("step by step")) {
            return "user-guide";
        }
        if (normalizedTitle.includes("design") ||
            normalizedContent.includes("design decision")) {
            return "design-doc";
        }
        if (normalizedTitle.includes("changelog") ||
            normalizedTitle.includes("release notes") ||
            (normalizedContent.includes("version") &&
                normalizedContent.includes("change"))) {
            return "changelog";
        }
        return "other";
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
            slug: this.slugifyHeading(heading.text),
        }));
    }
    /**
     * Extract links from markdown tokens
     */
    extractLinks(tokens) {
        const links = [];
        const extractFromToken = (token) => {
            if (token.type === "link") {
                links.push(token.href);
            }
            if ("tokens" in token && Array.isArray(token.tokens)) {
                token.tokens.forEach(extractFromToken);
            }
        };
        tokens.forEach(extractFromToken);
        return [...new Set(links)];
    }
    /**
     * Extract links from content and tokens
     */
    extractLinksFromContent(content, tokens) {
        const tokenLinks = this.extractLinks(tokens);
        const regexLinks = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
        const extractedUrls = regexLinks
            .map((link) => {
            const match = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
            return match ? match[2] : "";
        })
            .filter(Boolean);
        return [...new Set([...tokenLinks, ...extractedUrls])];
    }
    /**
     * Extract code blocks from markdown tokens
     */
    extractCodeBlocks(tokens) {
        return tokens
            .filter((token) => token.type === "code")
            .map((codeBlock) => ({
            language: codeBlock.lang || "",
            code: codeBlock.text,
        }));
    }
    /**
     * Extract title from plaintext
     */
    extractPlaintextTitle(lines) {
        const firstNonEmptyLine = lines.find((line) => line.trim().length > 0);
        return (firstNonEmptyLine === null || firstNonEmptyLine === void 0 ? void 0 : firstNonEmptyLine.trim()) || "Untitled Document";
    }
    /**
     * Extract title from RST
     */
    extractRstTitle(lines) {
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].match(/^=+$/) && lines[i - 1].trim()) {
                return lines[i - 1].trim();
            }
        }
        return "Untitled Document";
    }
    /**
     * Extract sections from RST
     */
    extractRstSections(lines) {
        const sections = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].match(/^[-=~]+$/)) {
                sections.push(lines[i - 1].trim());
            }
        }
        return sections;
    }
    /**
     * Extract title from AsciiDoc
     */
    extractAsciiDocTitle(lines) {
        const titleLine = lines.find((line) => line.startsWith("= "));
        return titleLine ? titleLine.substring(2).trim() : "Untitled Document";
    }
    /**
     * Calculate checksum for content
     */
    calculateChecksum(content) {
        return createHash("sha256").update(content).digest("hex").substring(0, 16);
    }
    /**
     * Slugify heading text
     */
    slugifyHeading(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();
    }
}
//# sourceMappingURL=DocTokenizer.js.map
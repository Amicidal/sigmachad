/**
 * Document Tokenizer
 * Handles parsing and tokenization of documentation files
 */
export interface ParsedDocument {
    title: string;
    content: string;
    businessDomains: string[];
    stakeholders: string[];
    technologies: string[];
    docType: "readme" | "api-doc" | "architecture" | "user-guide" | "design-doc" | "changelog" | "other";
    docIntent: "governance" | "reference" | "tutorial" | "mixed" | "ai-context";
    docVersion: string;
    docHash: string;
    docSource: "parser" | "manual";
    docLocale?: string;
    lastIndexed: Date;
    metadata: Record<string, any>;
}
export interface Heading {
    level: number;
    text: string;
    slug?: string;
}
export interface CodeBlock {
    language: string;
    code: string;
}
export declare class DocTokenizer {
    private supportedExtensions;
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
    parsePlaintext(content: string, filePath?: string): Promise<ParsedDocument>;
    /**
     * Parse reStructuredText content
     */
    parseRestructuredText(content: string, filePath?: string): Promise<ParsedDocument>;
    /**
     * Parse AsciiDoc content
     */
    parseAsciiDoc(content: string, filePath?: string): Promise<ParsedDocument>;
    /**
     * Extract title from markdown tokens
     */
    private extractTitle;
    /**
     * Infer document type from content and title
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
    /**
     * Extract links from content and tokens
     */
    private extractLinksFromContent;
    /**
     * Extract code blocks from markdown tokens
     */
    private extractCodeBlocks;
    /**
     * Extract title from plaintext
     */
    private extractPlaintextTitle;
    /**
     * Extract title from RST
     */
    private extractRstTitle;
    /**
     * Extract sections from RST
     */
    private extractRstSections;
    /**
     * Extract title from AsciiDoc
     */
    private extractAsciiDocTitle;
    /**
     * Calculate checksum for content
     */
    private calculateChecksum;
    /**
     * Slugify heading text
     */
    private slugifyHeading;
}
//# sourceMappingURL=DocTokenizer.d.ts.map
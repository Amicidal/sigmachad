/**
 * Intent Extractor
 * Handles inference of document intent, domains, stakeholders, and technologies
 */
import { DocumentationIntelligenceProvider } from "../DocumentationIntelligenceProvider.js";
import type { ParsedDocument } from "./DocTokenizer.js";
export interface DomainExtraction {
    name: string;
    description: string;
    criticality: "low" | "medium" | "high" | "critical";
    stakeholders: string[];
    keyProcesses: string[];
    confidence: number;
}
export declare class IntentExtractor {
    private intelligenceProvider;
    constructor(intelligenceProvider: DocumentationIntelligenceProvider);
    /**
     * Infer document intent based on file path and type
     */
    inferDocIntent(filePath: string, docType: ParsedDocument["docType"]): ParsedDocument["docIntent"];
    /**
     * Infer document locale from file path and metadata
     */
    inferDocLocale(filePath: string, metadata: Record<string, any>): string | undefined;
    /**
     * Extract business domains from document signals
     */
    extractDomains(document: ParsedDocument, content: string): Promise<DomainExtraction[]>;
    /**
     * Extract stakeholders from document
     */
    extractStakeholders(document: ParsedDocument, content: string): Promise<string[]>;
    /**
     * Extract technologies from document
     */
    extractTechnologies(document: ParsedDocument, content: string): Promise<string[]>;
    /**
     * Infer domain criticality based on domain name and content
     */
    private inferDomainCriticality;
    /**
     * Enhance parsed document with extracted intent information
     */
    enhanceDocument(document: ParsedDocument, content: string): Promise<ParsedDocument>;
}
//# sourceMappingURL=IntentExtractor.d.ts.map